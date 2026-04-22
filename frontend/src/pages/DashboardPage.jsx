import { useState, useEffect } from "react";
import { getTasks, createTask, deleteTask, logSession, getStats, recalculateStats } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import StatsPanel from "../components/StatsPanel";

export default function DashboardPage() {
  const { user, logout }            = useAuth();
  const [tasks, setTasks]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter]         = useState("all");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [t, s] = await Promise.all([getTasks(), getStats()]);
      setTasks(t); setStats(s);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(data) {
    try { await createTask(data); setShowCreate(false); fetchAll(); }
    catch (e) { alert(e.message); }
  }

  async function handleSession(taskId, action) {
    try {
      await logSession(taskId, action);
      const s = await recalculateStats(); setStats(s);
      const t = await getTasks(); setTasks(t);
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(taskId) {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(taskId); fetchAll();
  }

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const STATUS_FILTERS = ["all","pending","active","paused","completed","abandoned","declined"];

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#060a12", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid rgba(99,102,241,0.2)", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
        <p style={{ color:"#475569", fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>Loading your workspace…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .dash-root {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: #f1f5f9;
          position: relative;
          background: #060a12;
          overflow-x: hidden;
        }

        /* ── Same background treatment as login ── */
        .dash-root::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 5% 10%, rgba(99,102,241,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 95% 90%, rgba(6,182,212,0.14) 0%, transparent 50%),
            radial-gradient(ellipse 60% 35% at 85% 15%, rgba(139,92,246,0.1) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 20% 85%, rgba(236,72,153,0.08) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .dash-stars {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
        }
        .dash-stars::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 22% 38%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 37% 8%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 52% 55%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 68% 22%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 83% 68%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 14% 78%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 58% 82%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 91% 38%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 73% 4%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 72%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 3% 48%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(2px 2px at 48% 28%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 18% 52%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 96% 18%, rgba(255,255,255,0.5) 0%, transparent 100%);
          animation: twinkleDash 5s ease-in-out infinite alternate;
        }
        @keyframes twinkleDash { 0%{opacity:0.4;} 100%{opacity:0.7;} }

        .dash-orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
        }
        .dash-orb1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 45%, transparent 70%);
          top: -250px; left: -200px;
          animation: dashDrift1 16s ease-in-out infinite;
        }
        .dash-orb2 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(6,182,212,0.14) 0%, rgba(6,182,212,0.03) 45%, transparent 70%);
          bottom: -200px; right: -180px;
          animation: dashDrift2 20s ease-in-out infinite;
        }
        .dash-orb3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%);
          top: 30%; right: 5%;
          animation: dashDrift3 13s ease-in-out infinite;
        }
        @keyframes dashDrift1 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(40px,-30px);} }
        @keyframes dashDrift2 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-50px,-40px);} }
        @keyframes dashDrift3 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(25px,50px);} }

        .dash-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        /* Content layers above background */
        .dash-header {
          background: rgba(6,10,18,0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top: 0; z-index: 50;
          padding: 0 32px;
        }
        .dash-header-inner {
          max-width: 1400px; margin: 0 auto;
          height: 68px; display: flex; align-items: center; justify-content: space-between;
        }
        .dash-logo {
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #818cf8, #06b6d4);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .dash-welcome {
          color: #334155; font-size: 13px; margin-left: 12px; padding-left: 12px;
          border-left: 1px solid rgba(255,255,255,0.07);
        }
        .dash-header-right { display: flex; gap: 10px; align-items: center; }
        .btn-create {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 18px;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          color: #fff; border: none; border-radius: 10px;
          font-weight: 600; font-size: 14px; font-family: 'DM Sans', sans-serif;
          cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          transition: all 0.2s;
        }
        .btn-create:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.5); }
        .btn-logout {
          padding: 9px 16px; background: transparent; color: #475569;
          border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
          cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .btn-logout:hover { color:#f87171; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06); }

        .dash-body { max-width: 1400px; margin: 0 auto; padding: 32px; position: relative; z-index: 1; }

        .filter-bar { display: flex; gap: 6px; margin-bottom: 28px; flex-wrap: wrap; align-items: center; }
        .filter-label { color: #334155; font-size: 11px; font-weight: 600; margin-right: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        .filter-btn {
          padding: 6px 14px;
          background: rgba(255,255,255,0.03);
          color: #475569; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; cursor: pointer; font-size: 13px;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap;
        }
        .filter-btn:hover { color:#94a3b8; border-color:rgba(255,255,255,0.1); }
        .filter-btn.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.3); font-weight:600; }

        .task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }

        .empty-state { grid-column:1/-1; text-align:center; padding:80px 0; }
        .empty-icon { font-size:44px; margin-bottom:16px; opacity:0.25; }
        .empty-title { color:#334155; font-size:17px; font-weight:500; margin-bottom:8px; }
        .empty-sub { color:#1e293b; font-size:14px; }

        @keyframes spin { to{transform:rotate(360deg);} }
      `}</style>

      <div className="dash-root">
        {/* Background layers */}
        <div className="dash-stars" />
        <div className="dash-orb dash-orb1" />
        <div className="dash-orb dash-orb2" />
        <div className="dash-orb dash-orb3" />
        <div className="dash-grid" />

        {/* Header */}
        <header className="dash-header">
          <div className="dash-header-inner">
            <div style={{ display:"flex", alignItems:"center" }}>
              <span className="dash-logo">SmartTaskRisk</span>
              <span className="dash-welcome">Hey, {user?.username} 👋</span>
            </div>
            <div className="dash-header-right">
              <button className="btn-create" onClick={() => setShowCreate(true)}>
                <span style={{ fontSize:16, lineHeight:1 }}>+</span> New Task
              </button>
              <button className="btn-logout" onClick={logout}>Sign out</button>
            </div>
          </div>
        </header>

        <div className="dash-body">
          {stats && <StatsPanel stats={stats} />}

          <div className="filter-bar">
            <span className="filter-label">Filter</span>
            {STATUS_FILTERS.map(f => (
              <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ marginLeft:5, opacity:0.5, fontSize:11 }}>
                  ({f === "all" ? tasks.length : tasks.filter(t => t.status === f).length})
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"12px 16px", color:"#fca5a5", marginBottom:24, fontSize:14 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="task-grid">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{filter === "all" ? "📋" : "🔍"}</div>
                <p className="empty-title">{filter === "all" ? "No tasks yet" : `No ${filter} tasks`}</p>
                <p className="empty-sub">{filter === "all" ? "Create your first task to get started" : "Try a different filter"}</p>
              </div>
            ) : (
              filtered.map(task => (
                <TaskCard key={task.id} task={task} onSession={handleSession} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>

        {showCreate && <CreateTaskModal onSubmit={handleCreate} onClose={() => setShowCreate(false)} />}
      </div>
    </>
  );
}
