import uuid
from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, ConfigDict

GoalType = Literal[
    "improve_sleep",
    "increase_focus",
    "gain_muscle",
    "lose_weight",
    "improve_grades",
    "reduce_stress",
]

BiologicalSex = Literal["male", "female", "other"]


class ProfileCreate(BaseModel):
    display_name: str | None = None
    age: int | None = None
    biological_sex: BiologicalSex | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    timezone: str = "UTC"


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    age: int | None = None
    biological_sex: BiologicalSex | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    timezone: str | None = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    display_name: str | None
    age: int | None
    biological_sex: str | None
    height_cm: float | None
    weight_kg: float | None
    timezone: str
    created_at: datetime
    updated_at: datetime


class GoalCreate(BaseModel):
    goal_type: GoalType
    target_value: dict[str, Any] | None = None


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    goal_type: str
    status: str
    started_at: datetime
    ended_at: datetime | None = None
