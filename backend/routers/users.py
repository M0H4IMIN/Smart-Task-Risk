from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from auth import get_current_user
from stats import recalculate_user_stats
import models
import schemas

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me/stats", response_model=schemas.UserStatsResponse)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Returns the current user's behavioral fingerprint.
    This is what the ML model will use as input features.
    """
    stats = db.query(models.UserStats).filter(
        models.UserStats.user_id == current_user.id
    ).first()

    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found")

    return stats
