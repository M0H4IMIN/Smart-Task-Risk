from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/v1/tasks/{task_id}/sessions", tags=["sessions"])


# --- Valid action transitions ---
# Defines what actions are allowed based on current task status
VALID_TRANSITIONS = {
    models.TaskStatus.pending:     [models.SessionAction.start, models.SessionAction.decline],
    models.TaskStatus.active:      [models.SessionAction.pause, models.SessionAction.complete, models.SessionAction.abandon],
    models.TaskStatus.paused:      [models.SessionAction.resume, models.SessionAction.abandon],
    models.TaskStatus.completed:   [],   # terminal — no further actions
    models.TaskStatus.abandoned:   [models.SessionAction.start],  # can restart an abandoned task
    models.TaskStatus.declined:    [],   # terminal
}

# Maps session action → resulting task status
ACTION_TO_STATUS = {
    models.SessionAction.start:    models.TaskStatus.active,
    models.SessionAction.pause:    models.TaskStatus.paused,
    models.SessionAction.resume:   models.TaskStatus.active,
    models.SessionAction.complete: models.TaskStatus.completed,
    models.SessionAction.abandon:  models.TaskStatus.abandoned,
    models.SessionAction.decline:  models.TaskStatus.declined,
    models.SessionAction.stop:     models.TaskStatus.paused,
}


@router.post("/", response_model=schemas.SessionResponse, status_code=201)
def log_session(
    task_id: int,
    payload: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Log a session action on a task.

    Rules:
    - Only the task owner can log sessions
    - Actions must follow valid transitions (can't pause a pending task, etc.)
    - Duration is calculated automatically from the previous active session
    - Task status updates immediately after the action
    - If action is complete/abandon/decline, actual_hours and completed_at are updated
    """
    # 1. Fetch task and verify ownership
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Validate transition
    allowed = VALID_TRANSITIONS.get(task.status, [])
    if payload.action not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Action '{payload.action}' is not allowed when task is '{task.status}'. "
                   f"Allowed actions: {[a.value for a in allowed]}"
        )

    now = datetime.now(timezone.utc)

    # 3. Close the previous open session (calculate its duration)
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
        delta = (now - open_session.started_at.replace(tzinfo=timezone.utc))
        open_session.duration_minutes = round(delta.total_seconds() / 60, 2)

    # 4. Create the new session row
    new_session = models.TaskSession(
        task_id=task_id,
        action=payload.action,
        started_at=now,
    )
    db.add(new_session)

    # 5. Update task status
    task.status = ACTION_TO_STATUS[payload.action]
    task.last_session_at = now

    # 6. Calculate days_since_active (momentum signal)
    if task.last_session_at:
        delta_days = (now - task.last_session_at.replace(tzinfo=timezone.utc)).days
        task.days_since_active = delta_days

    # 7. On terminal actions, finalize the task
    if payload.action == models.SessionAction.complete:
        task.completed_at = now
        _update_actual_hours(task, db)

    if payload.action in [models.SessionAction.abandon, models.SessionAction.complete]:
        _update_actual_hours(task, db)

    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/", response_model=List[schemas.SessionResponse])
def get_sessions(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get the full session history for a task."""
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


# --- Helper ---

def _update_actual_hours(task: models.Task, db: Session):
    """Sum all session durations for this task and update actual_hours."""
    sessions = db.query(models.TaskSession).filter(
        models.TaskSession.task_id == task.id,
        models.TaskSession.duration_minutes != None
    ).all()
    total_minutes = sum(s.duration_minutes for s in sessions if s.duration_minutes)
    task.actual_hours = round(total_minutes / 60, 2)
