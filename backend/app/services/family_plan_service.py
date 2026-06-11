from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.family_plan import FamilyPlan
from app.schemas.family_plan import FamilyPlanDataIn, FamilyPlanOut


def _step_completed(data: FamilyPlanDataIn, step: int) -> bool:
    if step == 1:
        return any(m.first_name.strip() for m in data.members)
    if step == 2:
        return any(
            t.selected and t.probability >= 1 and t.impact >= 1 for t in data.threats
        )
    if step == 3:
        return any(z.safe_place.strip() for z in data.safe_zones)
    if step == 4:
        return len(data.floor_map.rooms) >= 1 and data.floor_map.saved_at is not None
    if step == 5:
        return any(r.member_id for r in data.roles)
    if step == 6:
        return any(
            c.type in ("family", "institution") and c.name.strip() for c in data.contacts
        )
    if step == 7:
        kit = data.emergency_kit
        sections = [kit.base, kit.infant, kit.pregnant, kit.tea, kit.pets]
        return any(any(section.values()) for section in sections)
    if step == 8:
        return any(d.date.strip() or d.emergency_type.strip() for d in data.drills)
    return False


def compute_completion(data: FamilyPlanDataIn) -> int:
    completed = sum(1 for step in range(1, 9) if _step_completed(data, step))
    return round(completed / 8 * 100)


def empty_plan_data() -> FamilyPlanDataIn:
    return FamilyPlanDataIn()


def _to_out(plan: FamilyPlan | None, data: FamilyPlanDataIn) -> FamilyPlanOut:
    return FamilyPlanOut(
        id=plan.id if plan else None,
        data=data,
        completion_pct=compute_completion(data),
        updated_at=plan.updated_at if plan else None,
    )


async def get_family_plan(session: AsyncSession, user_id: str) -> FamilyPlanOut:
    result = await session.execute(
        select(FamilyPlan).where(FamilyPlan.user_id == user_id)
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        return _to_out(None, empty_plan_data())
    return _to_out(plan, FamilyPlanDataIn.model_validate(plan.data))


async def upsert_family_plan(
    session: AsyncSession, user_id: str, data: FamilyPlanDataIn
) -> FamilyPlanOut:
    result = await session.execute(
        select(FamilyPlan).where(FamilyPlan.user_id == user_id)
    )
    plan = result.scalar_one_or_none()
    completion_pct = compute_completion(data)
    payload = data.model_dump()

    if plan is None:
        plan = FamilyPlan(
            user_id=user_id,
            data=payload,
            completion_pct=completion_pct,
            updated_at=datetime.now(timezone.utc),
        )
        session.add(plan)
    else:
        plan.data = payload
        plan.completion_pct = completion_pct
        plan.updated_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(plan)
    return _to_out(plan, data)