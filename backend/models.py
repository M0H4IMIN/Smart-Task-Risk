from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, Text, Enum, Float
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


# ── Enums ────────────────────────────────────────────────────────────────────

class TaskStatus(str, enum.Enum):
    pending   = "pending"
    active    = "active"
    paused    = "paused"
    completed = "completed"
    abandoned = "abandoned"
    declined  = "declined"


class TaskCategory(str, enum.Enum):
    coding   = "coding"
    studying = "studying"
    editing  = "editing"
    writing  = "writing"
    design   = "design"
    other    = "other"


class TaskPriority(str, enum.Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


class SessionAction(str, enum.Enum):
    start    = "start"
    pause    = "pause"
    resume   = "resume"
    stop     = "stop"
    complete = "complete"
    abandon  = "abandon"
    decline  = "decline"


# ── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    username        = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    stats = relationship("UserStats", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id               = Column(Integer, primary_key=True, index=True)
    title            = Column(String(255), nullable=False)
    description      = Column(Text, nullable=True)
    category         = Column(Enum(TaskCategory), default=TaskCategory.other)
    priority         = Column(Enum(TaskPriority), default=TaskPriority.medium)
    status           = Column(Enum(TaskStatus), default=TaskStatus.pending)

    estimated_hours  = Column(Float, nullable=True)   # user's upfront estimate
    actual_hours     = Column(Float, default=0.0)     # accumulated from sessions
    deadline         = Column(DateTime(timezone=True), nullable=True)

    last_session_at  = Column(DateTime(timezone=True), nullable=True)  # momentum tracking
    days_since_active = Column(Integer, default=0)

    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    completed_at     = Column(DateTime(timezone=True), nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner    = relationship("User", back_populates="tasks")
    sessions = relationship("TaskSession", back_populates="task", cascade="all, delete-orphan")


class TaskSession(Base):
    """
    One row per user action on a task.
    Duration is calculated and stored when the session ends.
    This table is the raw behavioral data the ML model learns from.
    """
    __tablename__ = "task_sessions"

    id               = Column(Integer, primary_key=True, index=True)
    action           = Column(Enum(SessionAction), nullable=False)
    started_at       = Column(DateTime(timezone=True), server_default=func.now())
    ended_at         = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Float, default=0.0)

    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    task    = relationship("Task", back_populates="sessions")


class UserStats(Base):
    """
    Precomputed behavioral fingerprint per user.
    Gets updated after every session — feeds directly into the ML model as features.
    """
    __tablename__ = "user_stats"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Overall behavior
    total_tasks_created   = Column(Integer, default=0)
    total_tasks_completed = Column(Integer, default=0)
    total_tasks_abandoned = Column(Integer, default=0)
    total_tasks_declined  = Column(Integer, default=0)
    completion_rate       = Column(Float, default=0.0)
    abandon_rate          = Column(Float, default=0.0)

    # Session behavior
    avg_sessions_per_task    = Column(Float, default=0.0)
    avg_session_duration_min = Column(Float, default=0.0)
    avg_pauses_per_task      = Column(Float, default=0.0)

    # Effort accuracy (actual_hours / estimated_hours — 1.0 = perfect estimate)
    avg_effort_accuracy = Column(Float, default=0.0)

    # Per-category completion rates
    coding_completion_rate   = Column(Float, default=0.0)
    studying_completion_rate = Column(Float, default=0.0)
    editing_completion_rate  = Column(Float, default=0.0)
    writing_completion_rate  = Column(Float, default=0.0)
    design_completion_rate   = Column(Float, default=0.0)
    other_completion_rate    = Column(Float, default=0.0)

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="stats")
