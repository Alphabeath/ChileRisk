"""Pydantic models for MeteoChile DMC AAA (Avisos / Alertas / Alarmas) feed."""

from __future__ import annotations

import html
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


AaaTipo = Literal["Aviso", "Alerta", "Alarma"]
AaaTipoZona = Literal["zonas", "regiones", "area"]


def _unescape(value: Any) -> Any:
    if isinstance(value, str):
        return html.unescape(value)
    return value


class MeteoChileAaaItem(BaseModel):
    id: str
    tipo: AaaTipo
    codigo_meteo: str = Field(alias="codigoMeteo")
    emision: str = ""
    fenomeno: str = ""
    icono: str = ""
    condicion_sinoptica: str = Field(default="", alias="condicionSinoptica")
    desde: str = ""
    hasta: str = ""
    observacion: str = ""
    tipo_zona_afecta: AaaTipoZona | str = Field(alias="tipoZonaAfecta")
    data_zona_afecta: str = Field(default="", alias="dataZonaAfecta")
    texto_zona_afecta: str = Field(default="", alias="textoZonaAfecta")
    tabla_titulo: str = Field(default="", alias="tablaTitulo")
    tabla_html: str = Field(default="", alias="tablaHTML")
    titulo: str = ""

    model_config = {"populate_by_name": True}

    @field_validator(
        "fenomeno",
        "emision",
        "condicion_sinoptica",
        "desde",
        "hasta",
        "observacion",
        "texto_zona_afecta",
        "tabla_titulo",
        "tabla_html",
        "titulo",
        mode="before",
    )
    @classmethod
    def unescape_html(cls, v: Any) -> Any:
        return _unescape(v)


class MeteoChileAaaFeed(BaseModel):
    avisos: int = Field(alias="Avisos")
    alertas: int = Field(alias="Alertas")
    alarmas: int = Field(alias="Alarmas")
    fecha_actualizacion: str = Field(alias="fecha_actualizacion")
    items: list[MeteoChileAaaItem] = Field(alias="AAA")

    model_config = {"populate_by_name": True}
