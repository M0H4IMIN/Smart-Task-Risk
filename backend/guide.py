import models


def generate_guide(task, stats, risk_score: float, feature_dict: dict) -> dict:
    risk_label = _risk_label(risk_score)
    quote      = _pick_quote(risk_score, task.category)
    warnings   = _detect_warnings(feature_dict, task)
    plan       = _build_plan(task, stats, feature_dict, risk_score)
    return {
        "risk_label":         risk_label,
        "risk_score_percent": round(risk_score * 100, 1),
        "motivational_quote": quote,
        "warnings":           warnings,
        "plan":               plan,
    }


def _risk_label(score: float) -> str:
    if score < 0.30: return "Low"
    if score < 0.55: return "Medium"
    if score < 0.75: return "High"
    return "Critical"


def _pick_quote(score: float, category) -> str:
    if score >= 0.75:
        return "The clock is running. The only move now is forward — one focused session at a time."
    if score >= 0.55:
        quotes = [
            "You're not behind, you're just not started yet. That changes today.",
            "Momentum is everything. One good session rewrites the trajectory.",
            "Pressure is a privilege — it means this task matters.",
        ]
        return quotes[hash(str(category)) % len(quotes)]
    if score >= 0.30:
        return "You're on track, but don't coast. Steady effort beats last-minute sprints every time."
    return "Great pace. Keep sessions consistent and this one is as good as done."


def _detect_warnings(feature_dict: dict, task) -> list:
    warnings = []
    if feature_dict["days_since_active"] >= 3:
        warnings.append(f"Task untouched for {feature_dict['days_since_active']} days — momentum is dropping.")
    if feature_dict["deadline_pressure"] >= 4.0:
        warnings.append("High deadline pressure — you need more hours per day than your average session provides.")
    if feature_dict["days_until_deadline"] <= 1.0:
        warnings.append("Deadline is within 24 hours. Prioritize this above everything else right now.")
    if feature_dict["user_abandon_rate"] >= 0.4:
        warnings.append("Your historical abandon rate is high. Break the task into smaller pieces to avoid the same pattern.")
    if feature_dict["avg_effort_accuracy"] >= 1.5:
        warnings.append("You tend to underestimate effort by 50%+. Budget extra time beyond your estimate.")
    if feature_dict["hours_remaining_ratio"] >= 0.8 and feature_dict["days_until_deadline"] <= 3:
        warnings.append("Most work is still remaining with very little time left. Consider reducing scope.")
    return warnings


def _build_plan(task, stats, feature_dict: dict, risk_score: float) -> list:
    plan  = []
    step  = 1

    days_left    = feature_dict["days_until_deadline"]
    hours_left   = max((task.estimated_hours or 2.0) - (task.actual_hours or 0.0), 0.5)
    avg_dur_hrs  = (stats.avg_session_duration_min or 30) / 60 if stats else 0.5
    sessions_needed = max(1, round(hours_left / avg_dur_hrs))

    if days_left > 0:
        per_day = round(sessions_needed / days_left, 1)
        plan.append({
            "step":   step,
            "action": f"Schedule {per_day} focused session(s) per day until the deadline.",
            "reason": f"~{round(hours_left, 1)}h of work left across {round(days_left, 1)} days. "
                      f"Based on your avg {round(avg_dur_hrs * 60)}min sessions, you need ~{sessions_needed} more session(s)."
        })
        step += 1

    if feature_dict["days_since_active"] >= 2:
        plan.append({
            "step":   step,
            "action": "Start a session RIGHT NOW — even 15 minutes counts.",
            "reason": f"Task inactive for {feature_dict['days_since_active']} days. A short session today resets momentum."
        })
        step += 1

    if feature_dict["avg_effort_accuracy"] >= 1.3:
        adjusted = round(hours_left * feature_dict["avg_effort_accuracy"], 1)
        plan.append({
            "step":   step,
            "action": f"Treat your remaining effort as ~{adjusted}h, not {round(hours_left, 1)}h.",
            "reason": "Your history shows you consistently underestimate task duration."
        })
        step += 1

    if feature_dict["avg_pauses_per_task"] >= 4:
        plan.append({
            "step":   step,
            "action": "Use Pomodoro: 25 min focused work, 5 min break — no exceptions.",
            "reason": f"Your avg of {round(feature_dict['avg_pauses_per_task'], 1)} pauses/task suggests frequent interruptions."
        })
        step += 1

    tips = {
        "coding":   "Break into functions or modules. Commit after each small working piece.",
        "studying": "After each session, write 3 things you learned without looking at notes.",
        "editing":  "Edit in passes: structure first, then clarity, then grammar.",
        "writing":  "Set a word count target per session, not a time target.",
        "design":   "Timebox each design decision to 10 minutes. Perfectionism kills deadlines.",
        "other":    "Define one concrete deliverable before each session starts.",
    }
    cat = task.category.value if task.category else "other"
    plan.append({
        "step":   step,
        "action": tips.get(cat, tips["other"]),
        "reason": f"Specific tip for your '{cat}' task type."
    })
    step += 1

    if risk_score >= 0.75:
        plan.append({
            "step":   step,
            "action": "Consider reducing scope or communicating a delay now — not at the deadline.",
            "reason": "At critical risk, completing 80% well is better than 100% rushed."
        })

    return plan
