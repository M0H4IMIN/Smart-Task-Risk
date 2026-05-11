import { useState, useEffect } from "react";
import { getStats, getTasks } from "../api/client";

export default function StatsPage({ onBack }) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getTasks()])
      .then(([s, t]) => { setStats(s); setTasks(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={styles.page}>
      <p style={{ color: "#94a3b8", textAlign: "center", paddingTop: 80 }}>Loading stats...</p>
    </div>
  );

  // ── Data calculations ──────────────────────────────────────
  const statusCounts = {
    completed: tasks.filter(t => t.status === "completed").length,
    abandoned: tasks.filter(t => t.status === "abandoned").length,
    declined:  tasks.filter(t => t.status === "declined").length,
    active:    tasks.filter(t => t.status === "active").length,
    paused:    tasks.filter(t => t.status === "paused").length,
    pending:   tasks.filter(t => t.status === "pending").length,
  };

  const categoryData = ["coding","studying","editing","writing","design","other"].map(cat => ({
    name: cat,
    rate: Math.round((stats[`${cat}_completion_rate`] || 0) * 100),
    count: tasks.filter(t => t.category === cat).length,
  })).filter(c => c.count > 0);

  const totalHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

  const STATUS_COLORS = {
    completed: "#22c55e", abandoned: "#ef4444", declined: "#818cf8",
    active: "#3b82f6", paused: "#f97316", pending: "#64748b",
  };

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Dashboard</button>
        <h1 style={styles.title}>Your Statistics</h1>
        <div style={{ width: 100 }} />
      </div>

      {/* Summary cards */}
      <div style={styles.cardGrid}>
        <StatCard label="Total Tasks"      value={stats.total_tasks_created}  color="#6366f1" />
        <StatCard label="Completed"        value={stats.total_tasks_completed} color="#22c55e" />
        <StatCard label="Completion Rate"  value={`${(stats.completion_rate * 100).toFixed(0)}%`} color="#22c55e" />
        <StatCard label="Abandon Rate"     value={`${(stats.abandon_rate * 100).toFixed(0)}%`}    color="#ef4444" />
        <StatCard label="Avg Session"      value={`${stats.avg_session_duration_min.toFixed(0)}m`} color="#f97316" />
        <StatCard label="Total Hours"      value={`${totalHours.toFixed(1)}h`} color="#3b82f6" />
        <StatCard label="Effort Accuracy"  value={stats.avg_effort_accuracy > 0 ? `${stats.avg_effort_accuracy.toFixed(2)}x` : "N/A"} color="#a78bfa" />
        <StatCard label="Avg Pauses/Task"  value={stats.avg_pauses_per_task.toFixed(1)} color="#fbbf24" />
      </div>

      {/* Task status breakdown — horizontal bar chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Task Status Breakdown</h2>
        <div style={styles.chart}>
          {Object.entries(statusCounts).filter(([,v]) => v > 0).map(([status, count]) => {
            const pct = Math.round((count / stats.total_tasks_created) * 100) || 0;
            return (
              <div key={status} style={styles.barRow}>
                <span style={styles.barLabel}>{status}</span>
                <div style={styles.barTrack}>
                  <div style={{
                    ...styles.barFill,
                    width: `${pct}%`,
                    background: STATUS_COLORS[status],
                  }} />
                </div>
                <span style={styles.barValue}>{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category completion rates */}
      {categoryData.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Completion Rate by Category</h2>
          <div style={styles.chart}>
            {categoryData.map(c => (
              <div key={c.name} style={styles.barRow}>
                <span style={styles.barLabel}>{c.name}</span>
                <div style={styles.barTrack}>
                  <div style={{
                    ...styles.barFill,
                    width: `${c.rate}%`,
                    background: c.rate >= 70 ? "#22c55e" : c.rate >= 40 ? "#f97316" : "#ef4444",
                  }} />
                </div>
                <span style={styles.barValue}>{c.rate}% ({c.count} tasks)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Tasks</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 3 }}>Title</span>
            <span style={{ flex: 1 }}>Category</span>
            <span style={{ flex: 1 }}>Status</span>
            <span style={{ flex: 1 }}>Hours</span>
          </div>
          {tasks.slice(0, 10).map(t => (
            <div key={t.id} style={styles.tableRow}>
              <span style={{ flex: 3, color: "#e2e8f0", fontSize: 13 }} >{t.title}</span>
              <span style={{ flex: 1, color: "#94a3b8", fontSize: 12 }}>{t.category}</span>
              <span style={{ flex: 1, color: STATUS_COLORS[t.status] || "#94a3b8", fontSize: 12 }}>{t.status}</span>
              <span style={{ flex: 1, color: "#94a3b8", fontSize: 12 }}>{t.actual_hours || 0}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Effort accuracy explanation */}
      {stats.avg_effort_accuracy > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Effort Accuracy Insight</h2>
          <div style={styles.insightBox}>
            <p style={styles.insightText}>
              {stats.avg_effort_accuracy > 1.3
                ? `⚠ You underestimate task effort by ${((stats.avg_effort_accuracy - 1) * 100).toFixed(0)}% on average. If you think a task takes 2 hours, budget ${(2 * stats.avg_effort_accuracy).toFixed(1)} hours instead.`
                : stats.avg_effort_accuracy < 0.8
                ? `✓ You overestimate task effort. Tasks take about ${((1 - stats.avg_effort_accuracy) * 100).toFixed(0)}% less time than you expect — you can take on more!`
                : `✓ Your effort estimation is accurate (${stats.avg_effort_accuracy.toFixed(2)}x ratio). Keep it up!`
              }
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles = {
  page:         { minHeight: "100vh", background: "#0f172a", padding: "24px 32px", paddingBottom: 60 },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  backBtn:      { color: "#6366f1", background: "transparent", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  title:        { color: "#f8fafc", fontSize: 22, fontWeight: 700, margin: 0 },
  cardGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 32 },
  statCard:     { background: "#1e293b", borderRadius: 12, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 6, border: "1px solid #334155" },
  statValue:    { fontSize: 26, fontWeight: 700 },
  statLabel:    { color: "#64748b", fontSize: 12 },
  section:      { background: "#1e293b", borderRadius: 14, padding: 24, marginBottom: 20, border: "1px solid #334155" },
  sectionTitle: { color: "#f1f5f9", fontSize: 16, fontWeight: 700, margin: "0 0 18px" },
  chart:        { display: "flex", flexDirection: "column", gap: 12 },
  barRow:       { display: "flex", alignItems: "center", gap: 12 },
  barLabel:     { color: "#94a3b8", fontSize: 12, width: 80, textAlign: "right", flexShrink: 0 },
  barTrack:     { flex: 1, height: 10, background: "#0f172a", borderRadius: 5, overflow: "hidden" },
  barFill:      { height: "100%", borderRadius: 5, transition: "width 0.6s ease" },
  barValue:     { color: "#64748b", fontSize: 12, width: 100, flexShrink: 0 },
  table:        { display: "flex", flexDirection: "column", gap: 1 },
  tableHeader:  { display: "flex", padding: "8px 12px", background: "#0f172a", borderRadius: "8px 8px 0 0" },
  tableRow:     { display: "flex", padding: "10px 12px", background: "#162032", borderBottom: "1px solid #1e293b" },
  insightBox:   { background: "#0f172a", borderRadius: 10, padding: 16, border: "1px solid #334155" },
  insightText:  { color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: 0 },
};
