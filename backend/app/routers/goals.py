import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.profiles import Goal
from app.schemas.profiles import GoalCreate, GoalOut

router = APIRouter(tags=["goals"])


@router.get("/goals", response_model=list[GoalOut])
async def list_goals(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal).where(
            Goal.user_id == uuid.UUID(user_id),
            Goal.status == "active",
        )
    )
    return result.scalars().all()


@router.post("/goals", response_model=GoalOut, status_code=201)
async def create_goal(
    data: GoalCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count()).where(
            Goal.user_id == uuid.UUID(user_id),
            Goal.status == "active",
        )
    )
    if count_result.scalar() >= 3:
        raise HTTPException(status_code=400, detail="Maximum of 3 active goals allowed")

    goal = Goal(user_id=uuid.UUID(user_id), goal_type=data.goal_type, target_value=data.target_value)
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}", status_code=204)
async def deactivate_goal(
    goal_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == uuid.UUID(user_id),
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.status = "abandoned"
    goal.ended_at = datetime.now(timezone.utc)
    await db.commit()
