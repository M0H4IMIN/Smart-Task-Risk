from sqlalchemy.orm import Session
from sqlalchemy import func
import models


def recalculate_user_stats(user_id: int, db: Session):
    """
    Recalculates and saves the full behavioral fingerprint for a user.
    Called after every terminal session action (complete, abandon, decline)
    and after pause/resume to keep session behavior metrics fresh.

    Metrics calculated:
    - Overall completion, abandon, decline rates
    - Avg sessions per task
    - Avg session duration
    - Avg pauses per task
    - Effort accuracy (actual_hours / estimated_hours)
    - Per-category completion rates
    """
    stats = db.query(models.UserStats).filter(models.UserStats.user_id == user_id).first()
    if not stats:
        stats = models.UserStats(user_id=user_id)
        db.add(stats)

    # Fetch all tasks for this user
    all_tasks = db.query(models.Task).filter(models.Task.owner_id == user_id).all()

    total_created   = len(all_tasks)
    total_completed = sum(1 for t in all_tasks if t.status == models.TaskStatus.completed)
    total_abandoned = sum(1 for t in all_tasks if t.status == models.TaskStatus.abandoned)
    total_declined  = sum(1 for t in all_tasks if t.status == models.TaskStatus.declined)

    stats.total_tasks_created   = total_created
    stats.total_tasks_completed = total_completed
    stats.total_tasks_abandoned = total_abandoned
    stats.total_tasks_declined  = total_declined

    stats.completion_rate = round(total_completed / total_created, 4) if total_created else 0.0
    stats.abandon_rate    = round(total_abandoned / total_created, 4) if total_created else 0.0

    # --- Session behavior ---
    all_sessions = (
        db.query(models.TaskSession)
        .join(models.Task)
        .filter(models.Task.owner_id == user_id)
        .all()
    )

    if all_tasks:
        stats.avg_sessions_per_task = round(len(all_sessions) / total_created, 2)
    else:
        stats.avg_sessions_per_task = 0.0

    completed_durations = [
        s.duration_minutes for s in all_sessions
        if s.duration_minutes and s.duration_minutes > 0
    ]
    stats.avg_session_duration_min = (
        round(sum(completed_durations) / len(completed_durations), 2)
        if completed_durations else 0.0
    )

    # Avg pauses per task — count pause + stop actions
    pause_actions = [
        s for s in all_sessions
        if s.action in [models.SessionAction.pause, models.SessionAction.stop]
    ]
    stats.avg_pauses_per_task = (
        round(len(pause_actions) / total_created, 2) if total_created else 0.0
    )

    # --- Effort accuracy ---
    # Only tasks that have both estimated and actual hours
    effort_tasks = [
        t for t in all_tasks
        if t.estimated_hours and t.estimated_hours > 0 and t.actual_hours and t.actual_hours > 0
    ]
    if effort_tasks:
        ratios = [t.actual_hours / t.estimated_hours for t in effort_tasks]
        stats.avg_effort_accuracy = round(sum(ratios) / len(ratios), 4)
    else:
        stats.avg_effort_accuracy = 0.0

    # --- Per-category completion rates ---
    for category in models.TaskCategory:
        cat_tasks = [t for t in all_tasks if t.category == category]
        cat_completed = sum(1 for t in cat_tasks if t.status == models.TaskStatus.completed)
        rate = round(cat_completed / len(cat_tasks), 4) if cat_tasks else 0.0
        setattr(stats, f"{category.value}_completion_rate", rate)

    db.commit()
    db.refresh(stats)
    return stats
