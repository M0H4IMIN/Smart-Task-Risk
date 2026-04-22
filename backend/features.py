from datetime import datetime
from sqlalchemy.orm import Session
import models

PRIORITY_MAP = {
    models.TaskPriority.low:      1,
    models.TaskPriority.medium:   2,
    models.TaskPriority.high:     3,
    models.TaskPriority.critical: 4,
}

CATEGORY_RATE_MAP = {
    models.TaskCategory.coding:   "coding_completion_rate",
    models.TaskCategory.studying: "studying_completion_rate",
    models.TaskCategory.editing:  "editing_completion_rate",
    models.TaskCategory.writing:  "writing_completion_rate",
    models.TaskCategory.design:   "design_completion_rate",
    models.TaskCategory.other:    "other_completion_rate",
}


def extract_features(task: models.Task, stats: models.UserStats, db: Session) -> dict:
    now = datetime.utcnow()

    if task.deadline:
        days_until_deadline = max((task.deadline - now).total_seconds() / 86400, 0)
    else:
        days_until_deadline = 30.0

    estimated = task.estimated_hours or 0.0
    actual    = task.actual_hours    or 0.0
    remaining = max(estimated - actual, 0.0)

    hours_remaining_ratio = remaining / estimated if estimated > 0 else 1.0
    deadline_pressure     = remaining / days_until_deadline if days_until_deadline > 0 else 10.0

    session_count = db.query(models.TaskSession).filter(
        models.TaskSession.task_id == task.id
    ).count()

    completion_rate = stats.completion_rate            if stats else 0.5
    abandon_rate    = stats.abandon_rate               if stats else 0.2
    avg_pauses      = stats.avg_pauses_per_task        if stats else 0.0
    effort_accuracy = stats.avg_effort_accuracy        if stats else 1.0
    avg_session_dur = stats.avg_session_duration_min   if stats else 0.0

    field         = CATEGORY_RATE_MAP.get(task.category, "other_completion_rate")
    category_rate = getattr(stats, field, 0.5) if stats else 0.5

    return {
        "priority":                 PRIORITY_MAP.get(task.priority, 2),
        "days_until_deadline":      round(days_until_deadline, 2),
        "hours_remaining_ratio":    round(hours_remaining_ratio, 4),
        "deadline_pressure":        round(min(deadline_pressure, 10.0), 4),
        "session_count":            session_count,
        "days_since_active":        task.days_since_active or 0,
        "user_completion_rate":     round(completion_rate, 4),
        "user_abandon_rate":        round(abandon_rate, 4),
        "category_completion_rate": round(category_rate, 4),
        "avg_pauses_per_task":      round(avg_pauses, 4),
        "avg_effort_accuracy":      round(effort_accuracy, 4),
        "avg_session_duration":     round(avg_session_dur, 4),
    }


def features_to_list(feature_dict: dict) -> list:
    return [
        feature_dict["priority"],
        feature_dict["days_until_deadline"],
        feature_dict["hours_remaining_ratio"],
        feature_dict["deadline_pressure"],
        feature_dict["session_count"],
        feature_dict["days_since_active"],
        feature_dict["user_completion_rate"],
        feature_dict["user_abandon_rate"],
        feature_dict["category_completion_rate"],
        feature_dict["avg_pauses_per_task"],
        feature_dict["avg_effort_accuracy"],
        feature_dict["avg_session_duration"],
    ]


FEATURE_NAMES = [
    "priority", "days_until_deadline", "hours_remaining_ratio",
    "deadline_pressure", "session_count", "days_since_active",
    "user_completion_rate", "user_abandon_rate", "category_completion_rate",
    "avg_pauses_per_task", "avg_effort_accuracy", "avg_session_duration",
]
