import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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
    stats = db.query(models.UserStats).filter(
        models.UserStats.user_id == current_user.id
    ).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found. Try registering again.")
    return stats


@router.post("/me/stats/recalculate", response_model=schemas.UserStatsResponse)
def force_recalculate(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Force a full stats recalculation. Use this if values look wrong or zero."""
    return recalculate_user_stats(user_id=current_user.id, db=db)
