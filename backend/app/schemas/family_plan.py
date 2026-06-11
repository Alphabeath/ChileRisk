from datetime import datetime

from pydantic import BaseModel, Field


class FamilyMemberIn(BaseModel):
    id: str
    first_name: str = ""
    last_name: str = ""
    document: str = ""
    sex: str = ""
    age: int | None = None
    nationality: str = ""
    phone: str = ""
    medical_conditions: str = ""
    contraindications: str = ""
    special_needs: str = ""
    flags: list[str] = Field(default_factory=list)


class PetIn(BaseModel):
    id: str
    name: str = ""
    species: str = ""
    age: int | None = None
    characteristics: str = ""
    special_needs: str = ""


class ThreatIn(BaseModel):
    id: str
    risk: str
    category: str = "internal"
    probability: int = Field(default=1, ge=1, le=5)
    impact: int = Field(default=1, ge=1, le=5)
    corrective_action: str = ""
    selected: bool = False


class SafeZoneIn(BaseModel):
    emergency: str
    safe_place: str = ""
    evacuation_route: str = ""
    safe_zone: str = ""
    meeting_point: str = ""


class FloorMapPointIn(BaseModel):
    x: float = 0
    y: float = 0


class FloorMapRoomIn(BaseModel):
    id: str
    type: str
    x: float = 0
    y: float = 0
    w: float = 80
    h: float = 60


class FloorMapMarkerIn(BaseModel):
    id: str
    type: str
    x: float = 0
    y: float = 0


class FloorMapRouteIn(BaseModel):
    id: str
    points: list[FloorMapPointIn] = Field(default_factory=list)


class FloorMapZoneIn(BaseModel):
    id: str
    type: str = "safe"
    x: float = 0
    y: float = 0
    w: float = 60
    h: float = 60


class FloorMapIn(BaseModel):
    rooms: list[FloorMapRoomIn] = Field(default_factory=list)
    markers: list[FloorMapMarkerIn] = Field(default_factory=list)
    routes: list[FloorMapRouteIn] = Field(default_factory=list)
    zones: list[FloorMapZoneIn] = Field(default_factory=list)
    active_layer: str = "safe"
    saved_at: str | None = None


class RoleAssignmentIn(BaseModel):
    task: str
    member_id: str | None = None


class ContactIn(BaseModel):
    id: str
    name: str = ""
    phone: str = ""
    address: str = ""
    type: str = "family"


class EmergencyKitIn(BaseModel):
    base: dict[str, bool] = Field(default_factory=dict)
    infant: dict[str, bool] = Field(default_factory=dict)
    pregnant: dict[str, bool] = Field(default_factory=dict)
    tea: dict[str, bool] = Field(default_factory=dict)
    pets: dict[str, bool] = Field(default_factory=dict)


class DrillEvaluationIn(BaseModel):
    knew_route: bool | None = None
    found_kit: bool | None = None
    evacuated: bool | None = None
    protected_pets: bool | None = None
    roles_worked: bool | None = None
    improvements: str = ""


class DrillIn(BaseModel):
    id: str
    date: str = ""
    emergency_type: str = ""
    outcome: str = ""
    improvements: list[str] = Field(default_factory=list)
    evaluation: DrillEvaluationIn = Field(default_factory=DrillEvaluationIn)


class FamilyPlanDataIn(BaseModel):
    members: list[FamilyMemberIn] = Field(default_factory=list)
    pets: list[PetIn] = Field(default_factory=list)
    threats: list[ThreatIn] = Field(default_factory=list)
    safe_zones: list[SafeZoneIn] = Field(default_factory=list)
    floor_map: FloorMapIn = Field(default_factory=FloorMapIn)
    roles: list[RoleAssignmentIn] = Field(default_factory=list)
    contacts: list[ContactIn] = Field(default_factory=list)
    emergency_kit: EmergencyKitIn = Field(default_factory=EmergencyKitIn)
    drills: list[DrillIn] = Field(default_factory=list)


class FamilyPlanUpsertRequest(BaseModel):
    data: FamilyPlanDataIn


class FamilyPlanOut(BaseModel):
    id: str | None = None
    data: FamilyPlanDataIn
    completion_pct: int = 0
    updated_at: datetime | None = None