from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post("/", response_model=schemas.TaskResponse, status_code=201)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Create a new task for the logged-in user.
    Status starts as 'pending' — it becomes 'active' once
    the user fires their first session action on it.
    """
    task = models.Task(**payload.model_dump(), owner_id=current_user.id)
    db.add(task)

    # Bump total_tasks_created in UserStats
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    if stats:
        stats.total_tasks_created += 1

    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(
    status: Optional[models.TaskStatus] = None,
    category: Optional[models.TaskCategory] = None,
    priority: Optional[models.TaskPriority] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Get all tasks for the logged-in user.
    Optional filters: status, category, priority.
    """
    query = db.query(models.Task).filter(models.Task.owner_id == current_user.id)

    if status:
        query = query.filter(models.Task.status == status)
    if category:
        query = query.filter(models.Task.category == category)
    if priority:
        query = query.filter(models.Task.priority == priority)

    return query.order_by(models.Task.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get a single task by ID. Only the owner can access it."""
    task = _get_own_task(task_id, current_user.id, db)
    return task


@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Update task metadata (title, description, deadline, etc).
    Does NOT change status — status is controlled by session actions.
    """
    task = _get_own_task(task_id, current_user.id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a task and all its sessions."""
    task = _get_own_task(task_id, current_user.id, db)
    db.delete(task)
    db.commit()


# --- Helper ---

def _get_own_task(task_id: int, user_id: int, db: Session) -> models.Task:
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == user_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
