import { useState, useEffect } from "react";
import { login, getMe, register } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { saveLogin }               = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm]             = useState({ email: "", username: "", password: "" });
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handle(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register({ username: form.username, email: form.email, password: form.password });
      }
      const { access_token } = await login({ email: form.email, password: form.password });
      localStorage.setItem("token", access_token);
      const userData = await getMe();
      saveLogin(access_token, userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          background: #060a12;
        }
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 10% 20%, rgba(99,102,241,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 80%, rgba(6,182,212,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 70% 40% at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at 80% 10%, rgba(236,72,153,0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        .login-stars {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
        }
        .login-stars::before, .login-stars::after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 40%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 40% 10%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 60%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 25%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 85% 70%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 80%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 85%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 75% 5%, rgba(255,255,255,0.9) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 65%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 95% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(2px 2px at 50% 30%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 20% 55%, rgba(255,255,255,0.4) 0%, transparent 100%);
        }
        .login-stars::after {
          background-image:
            radial-gradient(1px 1px at 33% 22%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 66% 44%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 12% 68%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 88% 55%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 77% 88%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 22% 95%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 44% 50%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 8% 42%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 93% 75%, rgba(255,255,255,0.5) 0%, transparent 100%);
          animation: twinkle 4s ease-in-out infinite alternate;
        }
        @keyframes twinkle { 0% { opacity: 0.3; } 100% { opacity: 0.7; } }

        .orb {
          position: absolute; border-radius: 50%; pointer-events: none; z-index: 1;
        }
        .orb1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(99,102,241,0.06) 45%, transparent 70%);
          top: -180px; left: -140px;
          animation: drift1 12s ease-in-out infinite;
        }
        .orb2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(6,182,212,0.22) 0%, rgba(6,182,212,0.05) 45%, transparent 70%);
          bottom: -150px; right: -120px;
          animation: drift2 15s ease-in-out infinite;
        }
        .orb3 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.04) 45%, transparent 70%);
          top: 45%; right: 12%;
          animation: drift3 10s ease-in-out infinite;
        }
        .orb4 {
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%);
          top: 18%; left: 28%;
          animation: drift1 18s ease-in-out infinite reverse;
        }
        @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(30px,-20px) scale(1.04);} 66%{transform:translate(-20px,30px) scale(0.97);} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-40px,-30px) scale(1.06);} }
        @keyframes drift3 { 0%,100%{transform:translate(0,0) scale(1);} 40%{transform:translate(20px,40px) scale(1.03);} 80%{transform:translate(-30px,-10px) scale(0.96);} }

        .login-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }

        .aurora {
          position: absolute; width: 120%; height: 2px; left: -10%; top: 42%; z-index: 1;
          background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.5) 25%, rgba(6,182,212,0.6) 50%, rgba(139,92,246,0.5) 75%, transparent 100%);
          filter: blur(3px);
          opacity: 0.5;
          animation: auroraMove 9s ease-in-out infinite;
        }
        @keyframes auroraMove { 0%,100%{transform:translateY(0) scaleX(1); opacity:0.4;} 50%{transform:translateY(25px) scaleX(1.04); opacity:0.7;} }

        .login-card {
          position: relative; z-index: 10;
          width: 420px;
          background: rgba(6,10,18,0.72);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.07), 0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06);
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .login-card.visible { opacity: 1; transform: translateY(0); }
        .login-card::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
        }

        .login-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25);
          border-radius: 20px; padding: 5px 13px;
          font-size: 11px; color: #a5b4fc;
          letter-spacing: 0.07em; text-transform: uppercase; font-weight: 600;
          margin-bottom: 22px;
        }
        .badge-dot {
          width: 6px; height: 6px; background: #6366f1; border-radius: 50%;
          box-shadow: 0 0 6px #6366f1;
          animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot { 0%,100%{opacity:1; box-shadow:0 0 6px #6366f1;} 50%{opacity:0.5; box-shadow:0 0 2px #6366f1;} }

        .login-title {
          font-family: 'Syne', sans-serif;
          font-size: 34px; font-weight: 800; color: #f8fafc;
          margin: 0 0 6px; letter-spacing: -0.03em; line-height: 1.1;
        }
        .login-title span {
          background: linear-gradient(135deg, #818cf8 0%, #06b6d4 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .login-subtitle { color: #475569; font-size: 14px; margin: 0 0 32px; }

        .login-tabs {
          display: flex;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 4px; margin-bottom: 28px;
        }
        .login-tab {
          flex: 1; padding: 9px 0; border: none; background: transparent;
          color: #475569; cursor: pointer; border-radius: 8px;
          font-size: 14px; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.2s;
        }
        .login-tab.active { background: linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 3px 12px rgba(99,102,241,0.4); }

        .login-form { display: flex; flex-direction: column; gap: 13px; }
        .input-wrap { position: relative; }
        .input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none; opacity:0.5; }
        .login-input {
          width: 100%; padding: 13px 14px 13px 40px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; color: #f1f5f9; font-size: 14px;
          font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .login-input::placeholder { color: #334155; }
        .login-input:focus { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.06); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }

        .login-error {
          display:flex; align-items:center; gap:8px;
          background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
          border-radius:10px; padding:10px 14px; color:#fca5a5; font-size:13px;
        }
        .login-btn {
          padding: 14px; border-radius: 12px;
          background: linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);
          color: #fff; border: none; font-weight: 600; font-size: 15px;
          font-family: 'DM Sans', sans-serif; cursor: pointer; margin-top: 4px;
          transition: all 0.2s; box-shadow: 0 4px 20px rgba(99,102,241,0.45);
          position: relative; overflow: hidden;
        }
        .login-btn::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);
          animation:btnShine 3s infinite;
        }
        @keyframes btnShine { 0%{left:-100%;} 50%,100%{left:150%;} }
        .login-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(99,102,241,0.55); }
        .login-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      <div className="login-root">
        <div className="login-stars" />
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
        <div className="orb orb4" />
        <div className="login-grid" />
        <div className="aurora" />

        <div className={`login-card ${mounted ? "visible" : ""}`}>
          <div className="login-badge"><span className="badge-dot" />AI Risk Engine</div>
          <h1 className="login-title">Smart<br /><span>Task Risk</span></h1>
          <p className="login-subtitle">Predict your deadline completion risk with AI</p>

          <div className="login-tabs">
            <button className={`login-tab ${!isRegister ? "active" : ""}`} onClick={() => { setIsRegister(false); setError(""); }}>Login</button>
            <button className={`login-tab ${isRegister ? "active" : ""}`} onClick={() => { setIsRegister(true); setError(""); }}>Register</button>
          </div>

          <form onSubmit={submit} className="login-form">
            {isRegister && (
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input className="login-input" name="username" placeholder="Username" value={form.username} onChange={handle} required />
              </div>
            )}
            <div className="input-wrap">
              <span className="input-icon">✉️</span>
              <input className="login-input" name="email" type="email" placeholder="Email address" value={form.email} onChange={handle} required />
            </div>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input className="login-input" name="password" type="password" placeholder="Password" value={form.password} onChange={handle} required />
            </div>
            {error && <div className="login-error"><span>⚠️</span> {error}</div>}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "Please wait…" : isRegister ? "Create Account" : "Sign In →"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
