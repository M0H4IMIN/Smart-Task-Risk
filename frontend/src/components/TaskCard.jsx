import { useState } from "react";
import { getPrediction } from "../api/client";

const STATUS_CONFIG = {
  pending:   { bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)",  text: "#60a5fa", dot: "#3b82f6",  label: "Pending"   },
  active:    { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)",   text: "#4ade80", dot: "#22c55e",  label: "Active"    },
  paused:    { bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)",  text: "#fb923c", dot: "#f97316",  label: "Paused"    },
  completed: { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  text: "#6ee7b7", dot: "#10b981",  label: "Completed" },
  abandoned: { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   text: "#fca5a5", dot: "#ef4444",  label: "Abandoned" },
  declined:  { bg: "rgba(148,163,184,0.08)",border: "rgba(148,163,184,0.15)", text: "#94a3b8", dot: "#64748b",  label: "Declined"  },
};

const PRIORITY_CONFIG = {
  low:      { bg: "rgba(59,130,246,0.12)",  text: "#93c5fd", label: "Low"      },
  medium:   { bg: "rgba(34,197,94,0.12)",   text: "#86efac", label: "Medium"   },
  high:     { bg: "rgba(249,115,22,0.12)",  text: "#fdba74", label: "High"     },
  critical: { bg: "rgba(239,68,68,0.12)",   text: "#fca5a5", label: "Critical" },
};

const ALLOWED_ACTIONS = {
  pending:   ["start", "decline"],
  active:    ["pause", "complete", "abandon"],
  paused:    ["resume", "abandon"],
  completed: [],
  abandoned: ["start"],
  declined:  [],
};

const ACTION_CONFIG = {
  start:    { label: "▶ Start",    bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.3)",  text: "#4ade80" },
  pause:    { label: "⏸ Pause",    bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.3)", text: "#fb923c" },
  resume:   { label: "▶ Resume",   bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.3)",  text: "#4ade80" },
  complete: { label: "✓ Complete", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", text: "#a5b4fc" },
  abandon:  { label: "✗ Abandon",  bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)", text: "#fca5a5" },
  decline:  { label: "— Decline",  bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.2)",text: "#94a3b8" },
};

const RISK_COLORS = { Low: "#22c55e", Medium: "#f97316", High: "#ef4444", Critical: "#dc2626", None: "#64748b" };

export default function TaskCard({ task, onSession, onDelete }) {
  const [prediction, setPrediction]   = useState(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [showPlan, setShowPlan]       = useState(false);

  const sc      = STATUS_CONFIG[task.status]   || STATUS_CONFIG.pending;
  const pc      = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const actions = ALLOWED_ACTIONS[task.status] || [];

  async function fetchPrediction() {
    if (prediction) { setShowPlan(p => !p); return; }
    setLoadingPred(true);
    try {
      const p = await getPrediction(task.id);
      setPrediction(p);
      setShowPlan(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingPred(false);
    }
  }

  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const progress = task.estimated_hours
    ? Math.min(100, Math.round((task.actual_hours / task.estimated_hours) * 100))
    : null;

  return (
    <>
      <style>{`
        .task-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .task-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }
        .task-card:hover {
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .tc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .tc-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .tc-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tc-dot { width: 6px; height: 6px; border-radius: 50%; }
        .tc-priority {
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .tc-delete {
          background: transparent;
          border: none;
          color: #334155;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 6px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
          flex-shrink: 0;
        }
        .tc-delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

        .tc-title {
          font-family: 'Syne', sans-serif;
          color: #e2e8f0;
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .tc-meta { display: flex; gap: 14px; flex-wrap: wrap; }
        .tc-meta-item { color: #475569; font-size: 12px; display: flex; align-items: center; gap: 4px; }

        .tc-progress { display: flex; flex-direction: column; gap: 5px; }
        .tc-progress-track { height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
        .tc-progress-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; background: linear-gradient(90deg, #6366f1, #06b6d4); }
        .tc-progress-label { color: #475569; font-size: 11px; }

        .tc-actions { display: flex; gap: 7px; flex-wrap: wrap; }
        .tc-action-btn {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid;
        }
        .tc-action-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }

        .tc-predict-btn {
          padding: 9px 14px;
          background: rgba(99,102,241,0.08);
          color: #818cf8;
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .tc-predict-btn:hover:not(:disabled) { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35); }
        .tc-predict-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .tc-pred-panel {
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tc-pred-header { display: flex; align-items: center; gap: 12px; }
        .tc-risk-score { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; }
        .tc-risk-bar-wrap { flex: 1; }
        .tc-risk-bar-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
        .tc-risk-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .tc-risk-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

        .tc-quote { color: #64748b; font-size: 12px; font-style: italic; margin: 0; padding: 10px 14px; border-left: 2px solid rgba(99,102,241,0.3); }
        .tc-warnings { display: flex; flex-direction: column; gap: 5px; }
        .tc-warning { color: #fbbf24; font-size: 12px; background: rgba(251,191,36,0.07); padding: 7px 10px; border-radius: 8px; border: 1px solid rgba(251,191,36,0.15); }
        .tc-plan { display: flex; flex-direction: column; gap: 8px; }
        .tc-plan-title { color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; }
        .tc-step { display: flex; gap: 10px; align-items: flex-start; }
        .tc-step-num { min-width: 20px; height: 20px; background: rgba(99,102,241,0.2); color: #a5b4fc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .tc-step-action { color: #e2e8f0; font-size: 12px; font-weight: 600; margin: 0 0 2px; }
        .tc-step-reason { color: #475569; font-size: 11px; margin: 0; }
      `}</style>

      <div className="task-card">
        {/* Top row */}
        <div className="tc-top">
          <div className="tc-badges">
            <span className="tc-status" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
              <span className="tc-dot" style={{ background: sc.dot }} />
              {sc.label}
            </span>
            <span className="tc-priority" style={{ background: pc.bg, color: pc.text }}>
              {pc.label}
            </span>
          </div>
          <button className="tc-delete" onClick={() => onDelete(task.id)} title="Delete task">✕</button>
        </div>

        {/* Title */}
        <h3 className="tc-title">{task.title}</h3>

        {/* Meta */}
        <div className="tc-meta">
          <span className="tc-meta-item">📁 {task.category}</span>
          {deadlineStr && <span className="tc-meta-item">📅 {deadlineStr}</span>}
          {task.estimated_hours && <span className="tc-meta-item">⏱ {task.estimated_hours}h est.</span>}
        </div>

        {/* Progress */}
        {progress !== null && (
          <div className="tc-progress">
            <div className="tc-progress-track">
              <div className="tc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="tc-progress-label">{progress}% · {task.actual_hours}h logged</span>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="tc-actions">
            {actions.map(action => {
              const ac = ACTION_CONFIG[action];
              return (
                <button
                  key={action}
                  className="tc-action-btn"
                  style={{ background: ac.bg, borderColor: ac.border, color: ac.text }}
                  onClick={() => onSession(task.id, action)}
                >
                  {ac.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Predict */}
        {!["completed", "declined"].includes(task.status) && (
          <button className="tc-predict-btn" onClick={fetchPrediction} disabled={loadingPred}>
            {loadingPred
              ? <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> Analyzing…</>
              : prediction
                ? showPlan ? "▲ Hide Analysis" : "▼ Show Analysis"
                : "🔮 Predict Risk"
            }
          </button>
        )}

        {/* Prediction panel */}
        {prediction && showPlan && (
          <div className="tc-pred-panel">
            <div className="tc-pred-header">
              <span className="tc-risk-score" style={{ color: RISK_COLORS[prediction.risk_label] }}>
                {prediction.risk_score_percent}%
              </span>
              <div className="tc-risk-bar-wrap">
                <div className="tc-risk-bar-track">
                  <div
                    className="tc-risk-bar-fill"
                    style={{ width: `${prediction.risk_score_percent}%`, background: RISK_COLORS[prediction.risk_label] }}
                  />
                </div>
                <span className="tc-risk-label" style={{ color: RISK_COLORS[prediction.risk_label] }}>
                  {prediction.risk_label} Risk
                </span>
              </div>
            </div>

            {prediction.motivational_quote && (
              <p className="tc-quote">"{prediction.motivational_quote}"</p>
            )}

            {prediction.warnings?.length > 0 && (
              <div className="tc-warnings">
                {prediction.warnings.map((w, i) => (
                  <div key={i} className="tc-warning">⚠ {w}</div>
                ))}
              </div>
            )}

            {prediction.action_plan?.length > 0 && (
              <div className="tc-plan">
                <p className="tc-plan-title">Action Plan</p>
                {prediction.action_plan.map(step => (
                  <div key={step.step} className="tc-step">
                    <span className="tc-step-num">{step.step}</span>
                    <div>
                      <p className="tc-step-action">{step.action}</p>
                      <p className="tc-step-reason">{step.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
