import uuid
from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, ConfigDict, field_validator

MealType = Literal["breakfast", "lunch", "dinner", "snack"]


class SleepLogCreate(BaseModel):
    sleep_date: date
    bedtime: datetime
    wake_time: datetime
    quality_rating: int | None = None
    notes: str | None = None

    @field_validator("quality_rating")
    @classmethod
    def rating_range(cls, v: int | None) -> int | None:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("quality_rating must be between 1 and 5")
        return v


class SleepLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sleep_date: date
    bedtime: datetime
    wake_time: datetime
    duration_minutes: int | None
    quality_rating: int | None
    notes: str | None
    created_at: datetime


class MealCreate(BaseModel):
    meal_time: datetime
    meal_type: MealType | None = None
    description: str
    calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    caffeine_mg: int | None = None


class MealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    meal_time: datetime
    meal_type: str | None
    description: str
    calories: int | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    caffeine_mg: int | None
    created_at: datetime


class StudySessionCreate(BaseModel):
    started_at: datetime
    ended_at: datetime
    subject: str | None = None
    focus_rating: int | None = None
    productivity_notes: str | None = None

    @field_validator("focus_rating")
    @classmethod
    def rating_range(cls, v: int | None) -> int | None:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("focus_rating must be between 1 and 5")
        return v


class StudySessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    started_at: datetime
    ended_at: datetime
    duration_minutes: int | None
    subject: str | None
    focus_rating: int | None
    productivity_notes: str | None
    created_at: datetime
