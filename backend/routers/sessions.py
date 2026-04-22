import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from auth import get_current_user
from stats import recalculate_user_stats
import models
import schemas

router = APIRouter(prefix="/api/v1/tasks/{task_id}/sessions", tags=["sessions"])

VALID_TRANSITIONS = {
    models.TaskStatus.pending:   [models.SessionAction.start, models.SessionAction.decline],
    models.TaskStatus.active:    [models.SessionAction.pause, models.SessionAction.complete, models.SessionAction.abandon],
    models.TaskStatus.paused:    [models.SessionAction.resume, models.SessionAction.abandon],
    models.TaskStatus.completed: [],
    models.TaskStatus.abandoned: [models.SessionAction.start],
    models.TaskStatus.declined:  [],
}

ACTION_TO_STATUS = {
    models.SessionAction.start:    models.TaskStatus.active,
    models.SessionAction.pause:    models.TaskStatus.paused,
    models.SessionAction.resume:   models.TaskStatus.active,
    models.SessionAction.complete: models.TaskStatus.completed,
    models.SessionAction.abandon:  models.TaskStatus.abandoned,
    models.SessionAction.decline:  models.TaskStatus.declined,
    models.SessionAction.stop:     models.TaskStatus.paused,
}

STATS_TRIGGER_ACTIONS = {
    models.SessionAction.complete,
    models.SessionAction.abandon,
    models.SessionAction.decline,
    models.SessionAction.pause,
    models.SessionAction.stop,
}


def _now():
    # Naive datetime — matches timezone=False in models
    return datetime.utcnow()


@router.post("/", response_model=schemas.SessionResponse, status_code=201)
def log_session(
    task_id: int,
    payload: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    allowed = VALID_TRANSITIONS.get(task.status, [])
    if payload.action not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Action '{payload.action}' not allowed when task is '{task.status}'. "
                   f"Allowed: {[a.value for a in allowed]}"
        )

    now = _now()

    # Close the previous open session and calculate its duration
    open_session = (
        db.query(models.TaskSession)
        .filter(
            models.TaskSession.task_id == task_id,
            models.TaskSession.ended_at == None
        )
        .first()
    )
    if open_session:
        open_session.ended_at = now
        # Both naive datetimes — subtraction always works correctly
        delta = now - open_session.started_at
        open_session.duration_minutes = round(delta.total_seconds() / 60, 2)

    # Update task status and metadata
    task.status           = ACTION_TO_STATUS[payload.action]
    task.last_session_at  = now
    task.days_since_active = 0

    if payload.action == models.SessionAction.complete:
        task.completed_at = now

    if payload.action in [models.SessionAction.complete, models.SessionAction.abandon]:
        _update_actual_hours(task, db)

    # Commit all of the above so duration is in DB before stats reads it
    db.commit()

    # Now recalculate stats safely
    if payload.action in STATS_TRIGGER_ACTIONS:
        recalculate_user_stats(user_id=current_user.id, db=db)

    # Create the new session row
    new_session = models.TaskSession(
        task_id=task_id,
        action=payload.action,
        started_at=now,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/", response_model=List[schemas.SessionResponse])
def get_sessions(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return (
        db.query(models.TaskSession)
        .filter(models.TaskSession.task_id == task_id)
        .order_by(models.TaskSession.started_at.asc())
        .all()
    )


def _update_actual_hours(task: models.Task, db: Session):
    sessions = db.query(models.TaskSession).filter(
        models.TaskSession.task_id == task.id
    ).all()
    total_minutes = sum(
        s.duration_minutes for s in sessions
        if s.duration_minutes and s.duration_minutes > 0
    )
    task.actual_hours = round(total_minutes / 60, 2)
