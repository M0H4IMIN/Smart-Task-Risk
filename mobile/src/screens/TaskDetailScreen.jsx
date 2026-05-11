import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { getTask, getSessions, logSession, recalculateStats } from "../api/client";

const VALID_ACTIONS = {
  pending:   ["start", "decline"],
  active:    ["pause", "complete", "abandon"],
  paused:    ["resume", "abandon"],
  completed: [],
  abandoned: ["start"],
  declined:  [],
};

const ACTION_LABELS = {
  start:    "▶  Start",
  pause:    "⏸  Pause",
  resume:   "▶  Resume",
  complete: "✓  Complete",
  abandon:  "✗  Abandon",
  decline:  "—  Decline",
};

const ACTION_COLORS = {
  start:    "#22c55e",
  pause:    "#f97316",
  resume:   "#22c55e",
  complete: "#6366f1",
  abandon:  "#ef4444",
  decline:  "#64748b",
};

const STATUS_COLORS = {
  pending:   "#60a5fa",
  active:    "#4ade80",
  paused:    "#fb923c",
  completed: "#86efac",
  abandoned: "#fca5a5",
  declined:  "#a5b4fc",
};

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId }              = route.params;
  const [task, setTask]         = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);

  // Live timer
  const [elapsed, setElapsed]   = useState(0);
  const timerRef                = useRef(null);

  useEffect(() => {
    fetchData();
    return () => clearInterval(timerRef.current);
  }, []);

  async function fetchData() {
    try {
      const [t, s] = await Promise.all([getTask(taskId), getSessions(taskId)]);
      setTask(t);
      setSessions(s);

      // Start timer if task is currently active
      if (t.status === "active") {
        startTimer(s);
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  function startTimer(sessionList) {
    // Find the open session (no ended_at)
    const open = sessionList?.find(s => !s.ended_at);
    if (!open) return;

    const startedAt = new Date(open.started_at + "Z"); // force UTC parse
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const diff = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      setElapsed(diff > 0 ? diff : 0);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
    setElapsed(0);
  }

  async function handleAction(action) {
    setActing(true);
    try {
      await logSession(taskId, action);
      await recalculateStats();
      await fetchData();

      if (["complete", "abandon", "decline"].includes(action)) {
        stopTimer();
        Alert.alert(
          action === "complete" ? "Task Completed! 🎉" : "Task Ended",
          action === "complete"
            ? "Great job finishing this task! Check your stats to see your progress."
            : `Task marked as ${action}.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else if (action === "start" || action === "resume") {
        // Timer restarts after fetch
      } else if (action === "pause") {
        stopTimer();
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setActing(false);
    }
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return "—";
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    return `${(minutes / 60).toFixed(1)}h`;
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  if (!task) return null;

  const actions = VALID_ACTIONS[task.status] || [];
  const progress = task.estimated_hours
    ? Math.min(100, Math.round((task.actual_hours / task.estimated_hours) * 100))
    : null;

  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : "No deadline";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Detail</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Predict", { taskId })}>
          <Text style={styles.predictBtn}>🔮 Risk</Text>
        </TouchableOpacity>
      </View>

      {/* Task info card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusBadge, { color: STATUS_COLORS[task.status] }]}>
            ● {task.status.toUpperCase()}
          </Text>
          <Text style={styles.priority}>{task.priority}</Text>
        </View>

        <Text style={styles.taskTitle}>{task.title}</Text>
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}

        <View style={styles.metaGrid}>
          <MetaItem icon="📁" label="Category" value={task.category} />
          <MetaItem icon="📅" label="Deadline"  value={deadlineStr} />
          <MetaItem icon="⏱"  label="Estimated" value={task.estimated_hours ? `${task.estimated_hours}h` : "Not set"} />
          <MetaItem icon="✅" label="Done"      value={`${task.actual_hours || 0}h`} />
        </View>

        {/* Progress bar */}
        {progress !== null && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPct}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}
      </View>

      {/* Live timer — only when active */}
      {task.status === "active" && (
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Current Session</Text>
          <Text style={styles.timerDisplay}>{formatTime(elapsed)}</Text>
          <Text style={styles.timerSub}>Session running — tap Pause when you stop</Text>
        </View>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Session Actions</Text>
          <View style={styles.actionGrid}>
            {actions.map(action => (
              <TouchableOpacity
                key={action}
                style={[styles.actionBtn, { backgroundColor: ACTION_COLORS[action] }]}
                onPress={() => handleAction(action)}
                disabled={acting}
              >
                {acting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>{ACTION_LABELS[action]}</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Session history */}
      {sessions.length > 0 && (
        <View style={styles.sessionsCard}>
          <Text style={styles.sessionsTitle}>Session History</Text>
          {sessions.map((s, i) => (
            <View key={s.id} style={[styles.sessionRow, i < sessions.length - 1 && styles.sessionBorder]}>
              <View style={styles.sessionLeft}>
                <Text style={styles.sessionAction}>{s.action}</Text>
                <Text style={styles.sessionTime}>
                  {new Date(s.started_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <Text style={styles.sessionDuration}>
                {s.ended_at ? formatDuration(s.duration_minutes) : "ongoing"}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0f172a" },
  center:          { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56 },
  backBtn:         { color: "#6366f1", fontSize: 15, fontWeight: "600" },
  headerTitle:     { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  predictBtn:      { color: "#a78bfa", fontSize: 14, fontWeight: "600" },
  card:            { margin: 20, marginTop: 0, backgroundColor: "#1e293b", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#334155" },
  statusRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statusBadge:     { fontSize: 12, fontWeight: "700" },
  priority:        { color: "#94a3b8", fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  taskTitle:       { color: "#f1f5f9", fontSize: 20, fontWeight: "700", marginBottom: 8, lineHeight: 28 },
  description:     { color: "#94a3b8", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  metaGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  metaItem:        { width: "47%", backgroundColor: "#0f172a", borderRadius: 10, padding: 12 },
  metaIcon:        { fontSize: 18, marginBottom: 4 },
  metaLabel:       { color: "#64748b", fontSize: 11, marginBottom: 2 },
  metaValue:       { color: "#e2e8f0", fontSize: 13, fontWeight: "600" },
  progressSection: { gap: 6 },
  progressHeader:  { flexDirection: "row", justifyContent: "space-between" },
  progressLabel:   { color: "#64748b", fontSize: 12 },
  progressPct:     { color: "#6366f1", fontSize: 12, fontWeight: "700" },
  progressTrack:   { height: 8, backgroundColor: "#0f172a", borderRadius: 4, overflow: "hidden" },
  progressFill:    { height: "100%", backgroundColor: "#6366f1", borderRadius: 4 },
  timerCard:       { marginHorizontal: 20, marginBottom: 16, backgroundColor: "#1a1040", borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#4338ca" },
  timerLabel:      { color: "#a5b4fc", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  timerDisplay:    { color: "#f8fafc", fontSize: 52, fontWeight: "700", fontVariant: ["tabular-nums"], letterSpacing: 2 },
  timerSub:        { color: "#64748b", fontSize: 12, marginTop: 8, textAlign: "center" },
  actionsCard:     { marginHorizontal: 20, marginBottom: 16, backgroundColor: "#1e293b", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#334155" },
  actionsTitle:    { color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 14 },
  actionGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn:       { flex: 1, minWidth: "45%", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  actionBtnText:   { color: "#fff", fontWeight: "700", fontSize: 15 },
  sessionsCard:    { marginHorizontal: 20, marginBottom: 16, backgroundColor: "#1e293b", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#334155" },
  sessionsTitle:   { color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 14 },
  sessionRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  sessionBorder:   { borderBottomWidth: 1, borderBottomColor: "#0f172a" },
  sessionLeft:     { gap: 2 },
  sessionAction:   { color: "#e2e8f0", fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  sessionTime:     { color: "#64748b", fontSize: 12 },
  sessionDuration: { color: "#6366f1", fontSize: 14, fontWeight: "700" },
});
