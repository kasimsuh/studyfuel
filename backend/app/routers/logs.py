import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.logs import SleepLog, Meal, StudySession
from app.schemas.logs import (
    SleepLogCreate,
    SleepLogOut,
    MealCreate,
    MealOut,
    StudySessionCreate,
    StudySessionOut,
)

router = APIRouter(tags=["logs"])

# ── Sleep ──────────────────────────────────────────────────────────────────────

@router.post("/logs/sleep", response_model=SleepLogOut, status_code=201)
async def create_sleep_log(
    data: SleepLogCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    log = SleepLog(
        user_id=uuid.UUID(user_id),
        sleep_date=data.sleep_date,
        bedtime=data.bedtime,
        wake_time=data.wake_time,
        quality_rating=data.quality_rating,
        notes=data.notes,
    )
    db.add(log)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Sleep log already exists for this date")
    await db.refresh(log)
    return log


@router.get("/logs/sleep", response_model=list[SleepLogOut])
async def list_sleep_logs(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    result = await db.execute(
        select(SleepLog)
        .where(
            SleepLog.user_id == uuid.UUID(user_id),
            SleepLog.created_at >= cutoff,
        )
        .order_by(SleepLog.sleep_date.desc())
    )
    return result.scalars().all()


# ── Meals ─────────────────────────────────────────────────────────────────────

@router.post("/logs/meals", response_model=MealOut, status_code=201)
async def create_meal(
    data: MealCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    meal = Meal(
        user_id=uuid.UUID(user_id),
        meal_time=data.meal_time,
        meal_type=data.meal_type,
        description=data.description,
        calories=data.calories,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        caffeine_mg=data.caffeine_mg,
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return meal


@router.get("/logs/meals", response_model=list[MealOut])
async def list_meals(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(Meal)
        .where(
            Meal.user_id == uuid.UUID(user_id),
            Meal.meal_time >= cutoff,
        )
        .order_by(Meal.meal_time.desc())
    )
    return result.scalars().all()


# ── Study Sessions ────────────────────────────────────────────────────────────

@router.post("/logs/study", response_model=StudySessionOut, status_code=201)
async def create_study_session(
    data: StudySessionCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = StudySession(
        user_id=uuid.UUID(user_id),
        started_at=data.started_at,
        ended_at=data.ended_at,
        subject=data.subject,
        focus_rating=data.focus_rating,
        productivity_notes=data.productivity_notes,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/logs/study", response_model=list[StudySessionOut])
async def list_study_sessions(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(StudySession)
        .where(
            StudySession.user_id == uuid.UUID(user_id),
            StudySession.started_at >= cutoff,
        )
        .order_by(StudySession.started_at.desc())
    )
    return result.scalars().all()
