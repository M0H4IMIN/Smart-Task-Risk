import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from groq import Groq
from dotenv import load_dotenv

from database import get_db
from auth import get_current_user
import models

load_dotenv()

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class Message(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]  # full conversation history
    task_id: int = None      # optional — if user is chatting about a specific task


def _build_system_prompt(user: models.User, stats: models.UserStats, tasks: list, task=None) -> str:
    """
    Builds a personalized system prompt injecting the user's
    real behavioral data so the AI gives relevant advice.
    """
    active_tasks = [t for t in tasks if t.status in [models.TaskStatus.active, models.TaskStatus.paused]]
    pending_tasks = [t for t in tasks if t.status == models.TaskStatus.pending]
    completed = stats.total_tasks_completed if stats else 0
    abandoned = stats.total_tasks_abandoned if stats else 0
    completion_rate = round((stats.completion_rate or 0) * 100, 1) if stats else 0
    abandon_rate = round((stats.abandon_rate or 0) * 100, 1) if stats else 0
    avg_session = round(stats.avg_session_duration_min or 0, 1) if stats else 0

    # Find weakest category
    weakest_cat = None
    weakest_rate = 1.0
    if stats:
        for cat in models.TaskCategory:
            rate = getattr(stats, f"{cat.value}_completion_rate", 0) or 0
            if rate < weakest_rate:
                weakest_rate = rate
                weakest_cat = cat.value

    prompt = f"""You are a smart, supportive productivity coach inside the Smart Task Risk app.
You know this user personally based on their real data. Be conversational, direct, and specific.
Never give generic advice — always reference their actual numbers and patterns.

=== USER PROFILE ===
Name: {user.username}
Tasks created: {stats.total_tasks_created if stats else 0}
Tasks completed: {completed}
Tasks abandoned: {abandoned}
Completion rate: {completion_rate}%
Abandon rate: {abandon_rate}%
Average session duration: {avg_session} minutes
Weakest category: {weakest_cat or "unknown"} ({round(weakest_rate * 100, 1)}% completion)
Active tasks right now: {len(active_tasks)}
Pending tasks: {len(pending_tasks)}

=== CURRENT TASKS ===
"""
    for t in tasks[:10]:  # limit to 10 tasks to keep prompt size reasonable
        deadline_str = t.deadline.strftime("%Y-%m-%d") if t.deadline else "no deadline"
        prompt += f"- [{t.status}] {t.title} | {t.category} | priority: {t.priority} | deadline: {deadline_str} | {t.actual_hours}h done / {t.estimated_hours or '?'}h estimated\n"

    if task:
        prompt += f"""
=== CURRENT TASK IN FOCUS ===
Title: {task.title}
Category: {task.category}
Status: {task.status}
Priority: {task.priority}
Estimated: {task.estimated_hours or 'not set'}h
Actual so far: {task.actual_hours}h
Deadline: {task.deadline.strftime('%Y-%m-%d %H:%M') if task.deadline else 'not set'}
"""

    prompt += """
=== YOUR ROLE ===
- Help the user complete tasks on time and reduce their abandon/decline rate
- Give concrete, actionable steps — not vague motivation
- When they ask about a specific task, give a specific plan for it
- If their abandon rate is high, address that pattern directly
- Suggest session lengths based on their actual avg session duration
- Keep responses concise — 3 to 5 sentences max unless they ask for a detailed plan
- Use a friendly but focused tone — like a coach who knows their data
"""
    return prompt


@router.post("/")
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Sends a message to the AI coach with full user context injected.
    Pass the full conversation history in messages[] for multi-turn chat.
    """
    # Gather user context
    stats = db.query(models.UserStats).filter(
        models.UserStats.user_id == current_user.id
    ).first()

    tasks = db.query(models.Task).filter(
        models.Task.owner_id == current_user.id
    ).order_by(models.Task.created_at.desc()).limit(15).all()

    focused_task = None
    if payload.task_id:
        focused_task = db.query(models.Task).filter(
            models.Task.id == payload.task_id,
            models.Task.owner_id == current_user.id
        ).first()

    system_prompt = _build_system_prompt(current_user, stats, tasks, focused_task)

    # Build messages for Groq
    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in payload.messages:
        groq_messages.append({"role": msg.role, "content": msg.content})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            max_tokens=512,
            temperature=0.7,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    return {"reply": reply}
