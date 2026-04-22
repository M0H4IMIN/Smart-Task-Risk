import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pickle

from database import get_db
from auth import get_current_user
from features import extract_features, features_to_list
from guide import generate_guide
import models

router = APIRouter(prefix="/api/v1/predict", tags=["prediction"])

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "risk_model.pkl")
_model = None


def _get_model():
    global _model
    if _model is None:
        path = os.path.abspath(_MODEL_PATH)
        if not os.path.exists(path):
            raise HTTPException(
                status_code=503,
                detail="Model not trained yet. Run: python train_model.py from the backend folder."
            )
        with open(path, "rb") as f:
            _model = pickle.load(f)
    return _model


@router.get("/{task_id}")
def predict_risk(
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

    if task.status in [models.TaskStatus.completed, models.TaskStatus.declined]:
        return {
            "task_id":            task_id,
            "task_title":         task.title,
            "status":             task.status,
            "message":            "Task is already finished — no risk prediction needed.",
            "risk_score_percent": 0.0,
            "risk_label":         "None",
        }

    stats        = db.query(models.UserStats).filter(models.UserStats.user_id == current_user.id).first()
    feature_dict = extract_features(task, stats, db)
    feature_list = features_to_list(feature_dict)

    model      = _get_model()
    risk_score = float(model.predict_proba([feature_list])[0][1])
    guide      = generate_guide(task, stats, risk_score, feature_dict)

    return {
        "task_id":             task_id,
        "task_title":          task.title,
        "task_status":         task.status,
        "risk_score_percent":  round(risk_score * 100, 1),
        "risk_label":          guide["risk_label"],
        "motivational_quote":  guide["motivational_quote"],
        "warnings":            guide["warnings"],
        "action_plan":         guide["plan"],
        "features_used":       feature_dict,
    }
