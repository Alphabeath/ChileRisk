from datetime import datetime

from pydantic import BaseModel


class NationalAvgScores(BaseModel):
    composite_score: float
    sismo: float
    ola_calor: float
    ola_frio: float
    viento: float


class SeverityDistribution(BaseModel):
    bajo: int
    moderado: int
    alto: int
    critico: int


class RegionRankEntry(BaseModel):
    codregion: int
    name: str
    composite_score: float


class NationalStatsOut(BaseModel):
    timestamp: datetime
    national_avg: NationalAvgScores
    severity_distribution: SeverityDistribution
    top_regions: list[RegionRankEntry]
    bottom_regions: list[RegionRankEntry]


class RegionAvgScores(BaseModel):
    composite: float
    sismo: float
    ola_calor: float
    ola_frio: float
    viento: float


class RegionExtremeScores(BaseModel):
    composite: float
    comuna_name: str


class RegionStatsOut(BaseModel):
    codregion: int
    name: str
    comuna_count: int
    avg_scores: RegionAvgScores
    max_scores: RegionExtremeScores
    min_scores: RegionExtremeScores
    dominant_hazard: str
    severity_breakdown: SeverityDistribution


class TrendsPeriod(BaseModel):
    start: str
    end: str


class TrendsOut(BaseModel):
    period: TrendsPeriod
    message: str


class CompareRegionEntry(BaseModel):
    codregion: int
    name: str
    composite_score: float
    dominant_hazard: str
    severity: str


class CompareOut(BaseModel):
    regiones: list[CompareRegionEntry]
