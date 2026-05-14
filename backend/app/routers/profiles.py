import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.profiles import Profile
from app.schemas.profiles import ProfileCreate, ProfileOut, ProfileUpdate

router = APIRouter(tags=["profiles"])


@router.post("/profiles/me", response_model=ProfileOut, status_code=201)
async def create_profile(
    data: ProfileCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(Profile, uuid.UUID(user_id))
    if existing:
        raise HTTPException(status_code=409, detail="Profile already exists")
    profile = Profile(user_id=uuid.UUID(user_id), **data.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/profiles/me", response_model=ProfileOut)
async def get_profile(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await db.get(Profile, uuid.UUID(user_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/profiles/me", response_model=ProfileOut)
async def update_profile(
    data: ProfileUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await db.get(Profile, uuid.UUID(user_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile
