import { useState, useEffect } from "react";
import { getTasks, createTask, deleteTask, getStats, recalculateStats } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import StatsPanel from "../components/StatsPanel";
import ChatPanel from "../components/ChatPanel";
import StatsPage from "./StatsPage";

const STATUS_FILTERS = ["all","pending","active","paused","completed","abandoned","declined"];

export default function DashboardPage() {
  const { user, logout }            = useAuth();
  const [tasks, setTasks]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showChat, setShowChat]     = useState(false);
  const [filter, setFilter]         = useState("all");
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState("dashboard"); // "dashboard" | "stats"

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [t, s] = await Promise.all([getTasks(), getStats()]);
      setTasks(t);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data) {
    try {
      await createTask(data);
      setShowCreate(false);
      fetchAll();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSession(taskId, action) {
    try {
      const { logSession, recalculateStats } = await import("../api/client");
      await logSession(taskId, action);
      await recalculateStats();
      fetchAll();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(taskId) {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(taskId);
    fetchAll();
  }

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  if (page === "stats") return <StatsPage onBack={() => setPage("dashboard")} />;

  if (loading) return (
    <div style={styles.center}>
      <p style={{ color: "#94a3b8" }}>Loading...</p>
    </div>
  );

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Smart Task Risk</h1>
          <p style={styles.welcome}>Welcome, {user?.username} 👋</p>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.btnCreate} onClick={() => setShowCreate(true)}>+ New Task</button>
          <button style={styles.btnLogout} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && <StatsPanel stats={stats} />}

      {/* Filter tabs */}
      <div style={styles.filters}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks grid */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: "#64748b", fontSize: 15 }}>
            {filter === "all" ? "No tasks yet. Create your first one!" : `No ${filter} tasks.`}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onSession={handleSession}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Bottom nav bar */}
      <div style={styles.navBar}>
        <button
          style={{ ...styles.navBtn, ...(page === "dashboard" ? styles.navActive : {}) }}
          onClick={() => setPage("dashboard")}
        >
          <span style={styles.navIcon}>📋</span>
          <span style={styles.navLabel}>Tasks</span>
        </button>
        <button
          style={{ ...styles.navBtn, ...(page === "stats" ? styles.navActive : {}) }}
          onClick={() => setPage("stats")}
        >
          <span style={styles.navIcon}>📊</span>
          <span style={styles.navLabel}>Stats</span>
        </button>
        <button style={styles.navBtn} onClick={() => setShowChat(true)}>
          <span style={styles.navIcon}>🤖</span>
          <span style={styles.navLabel}>Coach</span>
        </button>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateTaskModal onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      )}
      {showChat && <ChatPanel onClose={() => setShowChat(false)} />}

    </div>
  );
}

const styles = {
  page:       { minHeight: "100vh", background: "#0f172a", padding: "24px 32px", paddingBottom: 80 },
  center:     { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title:      { color: "#f8fafc", fontSize: 24, fontWeight: 700, margin: 0 },
  welcome:    { color: "#94a3b8", fontSize: 13, margin: "4px 0 0" },
  headerRight:{ display: "flex", gap: 12 },
  btnCreate:  { padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  btnLogout:  { padding: "10px 20px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  filters:    { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  filterBtn:  { padding: "6px 14px", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, cursor: "pointer", fontSize: 13 },
  filterActive:{ background: "#6366f1", color: "#fff", borderColor: "#6366f1" },
  grid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 },
  empty:      { textAlign: "center", padding: "60px 0" },
  navBar:     { position: "fixed", bottom: 0, left: 0, right: 0, background: "#1e293b", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-around", padding: "10px 0", zIndex: 100 },
  navBtn:     { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 20px" },
  navActive:  { },
  navIcon:    { fontSize: 22 },
  navLabel:   { color: "#94a3b8", fontSize: 11 },
};
