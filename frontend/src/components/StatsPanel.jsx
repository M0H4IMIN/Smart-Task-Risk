export default function StatsPanel({ stats }) {
  const items = [
    { label: "Tasks Created",   value: stats.total_tasks_created,                                       icon: "📋", color: "#6366f1" },
    { label: "Completed",       value: stats.total_tasks_completed,                                     icon: "✅", color: "#22c55e" },
    { label: "Completion Rate", value: `${(stats.completion_rate * 100).toFixed(0)}%`,                  icon: "📈", color: "#06b6d4" },
    { label: "Abandon Rate",    value: `${(stats.abandon_rate * 100).toFixed(0)}%`,                     icon: "⚡", color: "#f97316" },
    { label: "Avg Session",     value: `${stats.avg_session_duration_min.toFixed(1)}m`,                 icon: "⏱", color: "#8b5cf6" },
    { label: "Avg Pauses",      value: stats.avg_pauses_per_task.toFixed(1),                            icon: "⏸", color: "#ec4899" },
    { label: "Effort Accuracy", value: stats.avg_effort_accuracy > 0 ? `${stats.avg_effort_accuracy.toFixed(2)}x` : "N/A", icon: "🎯", color: "#f59e0b" },
  ];

  return (
    <>
      <style>{`
        .stats-wrap {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }
        @media (max-width: 1100px) { .stats-wrap { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 640px)  { .stats-wrap { grid-template-columns: repeat(2, 1fr); } }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--stat-color);
          opacity: 0.6;
        }
        .stat-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        .stat-icon { font-size: 18px; line-height: 1; }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .stat-label { color: #475569; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
      `}</style>
      <div className="stats-wrap">
        {items.map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card" style={{ "--stat-color": color }}>
            <span className="stat-icon">{icon}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
