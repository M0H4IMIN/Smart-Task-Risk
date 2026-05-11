import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const STATUS_COLORS = {
  pending:   { bg: "#1e3a5f", text: "#60a5fa", dot: "#3b82f6" },
  active:    { bg: "#14532d", text: "#4ade80", dot: "#22c55e" },
  paused:    { bg: "#451a03", text: "#fb923c", dot: "#f97316" },
  completed: { bg: "#1a2e1a", text: "#86efac", dot: "#16a34a" },
  abandoned: { bg: "#3b1111", text: "#fca5a5", dot: "#ef4444" },
  declined:  { bg: "#1e1b4b", text: "#a5b4fc", dot: "#818cf8" },
};

const PRIORITY_COLORS = {
  low: "#3b82f6", medium: "#22c55e", high: "#f97316", critical: "#ef4444",
};

export default function TaskCard({ task, onPress, onDelete }) {
  const sc = STATUS_COLORS[task.status] || STATUS_COLORS.pending;

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const progress = task.estimated_hours
    ? Math.min(100, Math.round((task.actual_hours / task.estimated_hours) * 100))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>

      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <View style={[styles.dot, { backgroundColor: sc.dot }]} />
          <Text style={[styles.statusText, { color: sc.text }]}>{task.status}</Text>
        </View>
        <View style={styles.topRight}>
          <Text style={[styles.priority, { color: PRIORITY_COLORS[task.priority] }]}>
            {task.priority}
          </Text>
          <TouchableOpacity onPress={() => onDelete(task.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.deleteBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{task.title}</Text>

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.metaItem}>📁 {task.category}</Text>
        {deadline && <Text style={styles.metaItem}>📅 {deadline}</Text>}
        {task.estimated_hours && <Text style={styles.metaItem}>⏱ {task.estimated_hours}h</Text>}
      </View>

      {/* Progress */}
      {progress !== null && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{progress}% complete</Text>
        </View>
      )}

      {/* Tap hint */}
      <Text style={styles.tapHint}>Tap to track sessions & predict risk →</Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:          { backgroundColor: "#1e293b", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#334155" },
  topRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statusBadge:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot:           { width: 7, height: 7, borderRadius: 4 },
  statusText:    { fontSize: 12, fontWeight: "600" },
  topRight:      { flexDirection: "row", alignItems: "center", gap: 10 },
  priority:      { fontSize: 12, fontWeight: "700" },
  deleteBtn:     { color: "#475569", fontSize: 14 },
  title:         { color: "#f1f5f9", fontSize: 16, fontWeight: "600", marginBottom: 8, lineHeight: 22 },
  meta:          { flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 8 },
  metaItem:      { color: "#64748b", fontSize: 12 },
  progressWrap:  { gap: 4, marginBottom: 8 },
  progressTrack: { height: 5, backgroundColor: "#0f172a", borderRadius: 3, overflow: "hidden" },
  progressFill:  { height: "100%", backgroundColor: "#6366f1", borderRadius: 3 },
  progressLabel: { color: "#64748b", fontSize: 11 },
  tapHint:       { color: "#334155", fontSize: 11, marginTop: 4 },
});
