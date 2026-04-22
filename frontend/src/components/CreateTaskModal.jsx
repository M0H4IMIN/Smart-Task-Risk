import { useState } from "react";

const CATEGORIES = ["coding","studying","editing","writing","design","other"];
const PRIORITIES = ["low","medium","high","critical"];

export default function CreateTaskModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "other",
    priority: "medium", estimated_hours: "", deadlineDate: "", deadlineTime: "23:59",
  });

  function handle(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function submit(e) {
    e.preventDefault();
    const data = {
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      priority: form.priority,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
    };
    if (form.deadlineDate) {
      const time = form.deadlineTime || "23:59";
      data.deadline = new Date(`${form.deadlineDate}T${time}:00`).toISOString();
    }
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
    onSubmit(data);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } }
        .modal-box {
          background: #0f1623;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 32px;
          width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          animation: slideUp 0.25s ease;
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .modal-title { font-family: 'Syne', sans-serif; color: #f1f5f9; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
        .modal-close { width: 32px; height: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.15s; }
        .modal-close:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }
        .modal-form { display: flex; flex-direction: column; gap: 18px; }
        .modal-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; }
        .modal-input, .modal-select, .modal-textarea { padding: 11px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; color: #e2e8f0; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; box-sizing: border-box; width: 100%; }
        .modal-input::placeholder, .modal-textarea::placeholder { color: #334155; }
        .modal-input:focus, .modal-select:focus, .modal-textarea:focus { border-color: rgba(99,102,241,0.45); background: rgba(99,102,241,0.05); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .modal-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
        .modal-textarea { resize: vertical; min-height: 80px; }
        .modal-row { display: flex; gap: 14px; }
        .modal-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
        .modal-cancel { padding: 11px 20px; background: transparent; color: #64748b; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; cursor: pointer; font-size: 14px; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .modal-cancel:hover { color: #94a3b8; border-color: rgba(255,255,255,0.12); }
        .modal-submit { padding: 11px 24px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; font-family: 'DM Sans', sans-serif; cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.35); transition: all 0.2s; }
        .modal-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.45); }
      `}</style>

      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-header">
            <h2 className="modal-title">New Task</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={submit} className="modal-form">
            <div className="modal-field">
              <label className="modal-label">Title *</label>
              <input className="modal-input" name="title" value={form.title} onChange={handle} required placeholder="What do you need to do?" />
            </div>

            <div className="modal-field">
              <label className="modal-label">Description</label>
              <textarea className="modal-textarea" name="description" value={form.description} onChange={handle} placeholder="Optional details…" />
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Category</label>
                <select className="modal-select" name="category" value={form.category} onChange={handle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="modal-col">
                <label className="modal-label">Priority</label>
                <select className="modal-select" name="priority" value={form.priority} onChange={handle}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-row">
              <div className="modal-col">
                <label className="modal-label">Estimated Hours</label>
                <input className="modal-input" name="estimated_hours" type="number" min="0.1" step="0.5" value={form.estimated_hours} onChange={handle} placeholder="e.g. 3.5" />
              </div>
              <div className="modal-col">
                <label className="modal-label">Deadline Date</label>
                <input className="modal-input" name="deadlineDate" type="date" value={form.deadlineDate} onChange={handle} />
              </div>
            </div>

            <div className="modal-field">
              <label className="modal-label">Deadline Time</label>
              <input className="modal-input" name="deadlineTime" type="time" value={form.deadlineTime} onChange={handle} />
            </div>

            <div className="modal-footer">
              <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="modal-submit">Create Task</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
