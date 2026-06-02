import asyncio
import hashlib
import hmac
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import boto3
from botocore.config import Config as BotoConfig

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StsCredentials:
    access_key: str
    secret_key: str
    session_token: str
    expiration_epoch: float


class CognitoIdentityClient:
    def __init__(self, identity_pool_id: str, region: str, refresh_buffer_seconds: int = 600):
        self._identity_pool_id = identity_pool_id
        self._region = region
        self._refresh_buffer = refresh_buffer_seconds
        self._client = boto3.client(
            "cognito-identity",
            region_name=region,
            config=BotoConfig(
                retries={"max_attempts": 3, "mode": "standard"},
                connect_timeout=5,
                read_timeout=10,
            ),
        )
        self._identity_id: str | None = None
        self._creds: StsCredentials | None = None
        self._lock = asyncio.Lock()

    async def get_credentials(self) -> StsCredentials:
        async with self._lock:
            if self._creds and (self._creds.expiration_epoch - time.time()) > self._refresh_buffer:
                return self._creds

            loop = asyncio.get_running_loop()
            if not self._identity_id:
                resp = await loop.run_in_executor(
                    None,
                    lambda: self._client.get_id(IdentityPoolId=self._identity_pool_id),
                )
                self._identity_id = resp["IdentityId"]

            resp = await loop.run_in_executor(
                None,
                lambda: self._client.get_credentials_for_identity(IdentityId=self._identity_id),
            )
            c = resp["Credentials"]
            expiration = c["Expiration"]
            if hasattr(expiration, "timestamp"):
                expiration_epoch = expiration.timestamp()
            else:
                expiration_epoch = float(expiration)
            self._creds = StsCredentials(
                access_key=c["AccessKeyId"],
                secret_key=c["SecretKey"],
                session_token=c["SessionToken"],
                expiration_epoch=expiration_epoch,
            )
            logger.info(
                "Refreshed Cognito identity credentials (expires %s)",
                datetime.fromtimestamp(self._creds.expiration_epoch, tz=timezone.utc).isoformat(),
            )
            return self._creds


def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def _derive_signing_key(secret: str, date_stamp: str, region: str, service: str) -> bytes:
    k_date = _sign(("AWS4" + secret).encode("utf-8"), date_stamp)
    k_region = _sign(k_date, region)
    k_service = _sign(k_region, service)
    return _sign(k_service, "aws4_request")


def sign_appsync_request(
    *,
    method: str,
    url: str,
    body: bytes,
    credentials: StsCredentials,
    region: str,
    service: str = "appsync",
    now: datetime | None = None,
) -> dict[str, str]:
    parsed = urlparse(url)
    host = parsed.netloc
    canonical_uri = parsed.path or "/"
    canonical_querystring = parsed.query

    t = (now or datetime.now(timezone.utc))
    amz_date = t.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = t.strftime("%Y%m%d")

    payload_hash = hashlib.sha256(body).hexdigest()

    canonical_headers = (
        f"content-type:application/json\n"
        f"host:{host}\n"
        f"x-amz-date:{amz_date}\n"
        f"x-amz-security-token:{credentials.session_token}\n"
    )
    signed_headers = "content-type;host;x-amz-date;x-amz-security-token"

    canonical_request = "\n".join(
        [
            method.upper(),
            canonical_uri,
            canonical_querystring,
            canonical_headers,
            signed_headers,
            payload_hash,
        ]
    )

    algorithm = "AWS4-HMAC-SHA256"
    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join(
        [
            algorithm,
            amz_date,
            credential_scope,
            hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
        ]
    )

    signing_key = _derive_signing_key(credentials.secret_key, date_stamp, region, service)
    signature = hmac.new(signing_key, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

    authorization = (
        f"{algorithm} Credential={credentials.access_key}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )

    return {
        "Authorization": authorization,
        "X-Amz-Date": amz_date,
        "X-Amz-Security-Token": credentials.session_token,
        "Content-Type": "application/json",
    }


def is_credential_error(payload: Any) -> bool:
    if not isinstance(payload, dict):
        return False
    errors = payload.get("errors") or []
    for e in errors:
        et = (e.get("errorType") or "").lower()
        msg = (e.get("message") or "").lower()
        if "unauthorized" in et or "unauthorized" in msg or "expired" in msg or "credentials" in msg:
            return True
    return False
