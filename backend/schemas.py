from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from models import TaskStatus, TaskCategory, TaskPriority, SessionAction


# --- Auth Schemas ---

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Task Schemas ---

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: TaskCategory = TaskCategory.other
    priority: TaskPriority = TaskPriority.medium
    estimated_hours: Optional[float] = None
    deadline: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TaskCategory] = None
    priority: Optional[TaskPriority] = None
    estimated_hours: Optional[float] = None
    deadline: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: TaskCategory
    priority: TaskPriority
    status: TaskStatus
    estimated_hours: Optional[float]
    actual_hours: float
    deadline: Optional[datetime]
    last_session_at: Optional[datetime]
    days_since_active: int
    created_at: datetime
    completed_at: Optional[datetime]
    owner_id: int

    class Config:
        from_attributes = True


# --- Session Schemas ---

class SessionCreate(BaseModel):
    action: SessionAction


class SessionResponse(BaseModel):
    id: int
    action: SessionAction
    started_at: datetime
    ended_at: Optional[datetime]
    duration_minutes: float
    task_id: int

    class Config:
        from_attributes = True


# --- UserStats Schema ---

class UserStatsResponse(BaseModel):
    id: int
    user_id: int

    total_tasks_created: int
    total_tasks_completed: int
    total_tasks_abandoned: int
    total_tasks_declined: int
    completion_rate: float
    abandon_rate: float

    avg_sessions_per_task: float
    avg_session_duration_min: float
    avg_pauses_per_task: float
    avg_effort_accuracy: float

    coding_completion_rate: float
    studying_completion_rate: float
    editing_completion_rate: float
    writing_completion_rate: float
    design_completion_rate: float
    other_completion_rate: float

    class Config:
        from_attributes = True
