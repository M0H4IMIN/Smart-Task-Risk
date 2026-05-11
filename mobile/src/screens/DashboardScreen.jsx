import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { getTasks, deleteTask, getStats } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";

const FILTERS = ["all", "pending", "active", "paused", "completed", "abandoned"];

export default function DashboardScreen({ navigation }) {
  const { user, logout }         = useAuth();
  const [tasks, setTasks]        = useState([]);
  const [stats, setStats]        = useState(null);
  const [filter, setFilter]      = useState("all");
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([getTasks(), getStats()]);
      setTasks(t);
      setStats(s);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const unsub = navigation.addListener("focus", fetchAll);
    return unsub;
  }, [navigation, fetchAll]);

  async function handleDelete(taskId) {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => { await deleteTask(taskId); fetchAll(); },
      },
    ]);
  }

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Smart Task Risk</Text>
          <Text style={styles.welcome}>Hey, {user?.username} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      {stats && (
        <View style={styles.statsBar}>
          <StatItem label="Created"   value={stats.total_tasks_created} />
          <StatItem label="Done"      value={stats.total_tasks_completed} />
          <StatItem label="Rate"      value={`${(stats.completion_rate * 100).toFixed(0)}%`} />
          <StatItem label="Avg Sess"  value={`${stats.avg_session_duration_min.toFixed(0)}m`} />
        </View>
      )}

      {/* Filter pills */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterPill, filter === item && styles.filterPillActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Task list */}
      <FlatList
        data={filtered}
        keyExtractor={t => String(t.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefresh(true); fetchAll(); }}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === "all" ? "No tasks yet.\nTap + to create one!" : `No ${filter} tasks.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onDelete={handleDelete}
            onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
          />
        )}
      />

      {/* Bottom nav */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => {}}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={[styles.navLabel, styles.navActive]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("Stats")}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate("Chat")}>
          <Text style={styles.navIcon}>🤖</Text>
          <Text style={styles.navLabel}>Coach</Text>
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateTask")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

    </View>
  );
}

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0f172a" },
  center:           { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56 },
  title:            { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  welcome:          { color: "#94a3b8", fontSize: 13, marginTop: 2 },
  logoutBtn:        { padding: 8, backgroundColor: "#1e293b", borderRadius: 8 },
  logoutText:       { color: "#94a3b8", fontSize: 13 },
  statsBar:         { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#1e293b", borderRadius: 12, padding: 12, marginBottom: 16 },
  statItem:         { flex: 1, alignItems: "center" },
  statValue:        { color: "#f1f5f9", fontSize: 18, fontWeight: "700" },
  statLabel:        { color: "#64748b", fontSize: 10, marginTop: 2 },
  filterList:       { paddingHorizontal: 20, marginBottom: 16, flexGrow: 0 },
  filterPill:       { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: "#1e293b", borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#334155" },
  filterPillActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  filterText:       { color: "#94a3b8", fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  listContent:      { paddingHorizontal: 20, paddingBottom: 140 },
  empty:            { alignItems: "center", paddingTop: 80 },
  emptyText:        { color: "#64748b", fontSize: 15, textAlign: "center", lineHeight: 24 },
  navBar:           { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#1e293b", borderTopWidth: 1, borderTopColor: "#334155", flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingBottom: 20 },
  navBtn:           { alignItems: "center", gap: 3 },
  navIcon:          { fontSize: 22 },
  navLabel:         { color: "#64748b", fontSize: 11 },
  navActive:        { color: "#6366f1" },
  fab:              { position: "absolute", bottom: 90, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center", elevation: 8 },
  fabText:          { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -2 },
});
