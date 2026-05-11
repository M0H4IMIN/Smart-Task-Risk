import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { getStats, getTasks } from "../api/client";

export default function StatsScreen({ navigation }) {
  const [stats, setStats]   = useState(null);
  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getTasks()])
      .then(([s, t]) => { setStats(s); setTasks(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  const statusCounts = {
    completed: tasks.filter(t => t.status === "completed").length,
    abandoned: tasks.filter(t => t.status === "abandoned").length,
    active:    tasks.filter(t => t.status === "active").length,
    paused:    tasks.filter(t => t.status === "paused").length,
    pending:   tasks.filter(t => t.status === "pending").length,
    declined:  tasks.filter(t => t.status === "declined").length,
  };

  const STATUS_COLORS = {
    completed: "#22c55e", abandoned: "#ef4444", active: "#3b82f6",
    paused: "#f97316", pending: "#64748b", declined: "#818cf8",
  };

  const categoryData = ["coding","studying","editing","writing","design","other"].map(cat => ({
    name: cat,
    rate: Math.round((stats[`${cat}_completion_rate`] || 0) * 100),
    count: tasks.filter(t => t.category === cat).length,
  })).filter(c => c.count > 0);

  const totalHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Statistics</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary cards */}
      <View style={styles.cardGrid}>
        <StatCard label="Total Tasks"     value={stats.total_tasks_created}  color="#6366f1" />
        <StatCard label="Completed"       value={stats.total_tasks_completed} color="#22c55e" />
        <StatCard label="Completion Rate" value={`${(stats.completion_rate * 100).toFixed(0)}%`} color="#22c55e" />
        <StatCard label="Abandon Rate"    value={`${(stats.abandon_rate * 100).toFixed(0)}%`}    color="#ef4444" />
        <StatCard label="Avg Session"     value={`${stats.avg_session_duration_min.toFixed(0)}m`} color="#f97316" />
        <StatCard label="Total Hours"     value={`${totalHours.toFixed(1)}h`} color="#3b82f6" />
        <StatCard label="Effort Accuracy" value={stats.avg_effort_accuracy > 0 ? `${stats.avg_effort_accuracy.toFixed(2)}x` : "N/A"} color="#a78bfa" />
        <StatCard label="Avg Pauses"      value={stats.avg_pauses_per_task.toFixed(1)} color="#fbbf24" />
      </View>

      {/* Status breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Status Breakdown</Text>
        {Object.entries(statusCounts).filter(([,v]) => v > 0).map(([status, count]) => {
          const pct = stats.total_tasks_created > 0
            ? Math.round((count / stats.total_tasks_created) * 100)
            : 0;
          return (
            <View key={status} style={styles.barRow}>
              <Text style={styles.barLabel}>{status}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {
                  width: `${pct}%`,
                  backgroundColor: STATUS_COLORS[status]
                }]} />
              </View>
              <Text style={styles.barValue}>{count}</Text>
            </View>
          );
        })}
      </View>

      {/* Category completion */}
      {categoryData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completion by Category</Text>
          {categoryData.map(c => (
            <View key={c.name} style={styles.barRow}>
              <Text style={styles.barLabel}>{c.name}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {
                  width: `${c.rate}%`,
                  backgroundColor: c.rate >= 70 ? "#22c55e" : c.rate >= 40 ? "#f97316" : "#ef4444"
                }]} />
              </View>
              <Text style={styles.barValue}>{c.rate}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Effort insight */}
      {stats.avg_effort_accuracy > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effort Accuracy Insight</Text>
          <Text style={styles.insightText}>
            {stats.avg_effort_accuracy > 1.3
              ? `⚠ You underestimate effort by ${((stats.avg_effort_accuracy - 1) * 100).toFixed(0)}% on average. Budget more time than you think you need.`
              : stats.avg_effort_accuracy < 0.8
              ? `✓ You overestimate effort. Tasks take ${((1 - stats.avg_effort_accuracy) * 100).toFixed(0)}% less time than expected.`
              : `✓ Your effort estimation is accurate. Keep it up!`
            }
          </Text>
        </View>
      )}

      {/* Recent tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        {tasks.slice(0, 8).map(t => (
          <View key={t.id} style={styles.taskRow}>
            <View style={styles.taskLeft}>
              <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
              <Text style={styles.taskMeta}>{t.category} · {t.actual_hours || 0}h done</Text>
            </View>
            <Text style={[styles.taskStatus, { color: STATUS_COLORS[t.status] || "#64748b" }]}>
              {t.status}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#0f172a" },
  center:       { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56 },
  back:         { color: "#6366f1", fontSize: 15, fontWeight: "600" },
  title:        { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  cardGrid:     { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 10 },
  statCard:     { width: "47%", backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginHorizontal: 2, borderWidth: 1, borderColor: "#334155" },
  statValue:    { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  statLabel:    { color: "#64748b", fontSize: 11 },
  section:      { marginHorizontal: 20, marginBottom: 16, backgroundColor: "#1e293b", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#334155" },
  sectionTitle: { color: "#f1f5f9", fontSize: 15, fontWeight: "700", marginBottom: 16 },
  barRow:       { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  barLabel:     { color: "#94a3b8", fontSize: 12, width: 70 },
  barTrack:     { flex: 1, height: 8, backgroundColor: "#0f172a", borderRadius: 4, overflow: "hidden" },
  barFill:      { height: "100%", borderRadius: 4 },
  barValue:     { color: "#64748b", fontSize: 12, width: 35, textAlign: "right" },
  insightText:  { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  taskRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#0f172a" },
  taskLeft:     { flex: 1, marginRight: 12 },
  taskTitle:    { color: "#e2e8f0", fontSize: 13, fontWeight: "600", marginBottom: 2 },
  taskMeta:     { color: "#64748b", fontSize: 11 },
  taskStatus:   { fontSize: 11, fontWeight: "600" },
});
