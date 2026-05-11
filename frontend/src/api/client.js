// Base API client — all requests go through here
const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return null;
  return res.json();
}

// Auth
export const register = (data) =>
  request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) });

export const login = (data) =>
  request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) });

export const getMe = () => request("/api/v1/auth/me");

// Tasks
export const createTask = (data) =>
  request("/api/v1/tasks/", { method: "POST", body: JSON.stringify(data) });

export const getTasks = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/api/v1/tasks/${q ? "?" + q : ""}`);
};

export const getTask = (id) => request(`/api/v1/tasks/${id}`);

export const updateTask = (id, data) =>
  request(`/api/v1/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteTask = (id) =>
  request(`/api/v1/tasks/${id}`, { method: "DELETE" });

// Sessions
export const logSession = (taskId, action) =>
  request(`/api/v1/tasks/${taskId}/sessions/`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });

export const getSessions = (taskId) =>
  request(`/api/v1/tasks/${taskId}/sessions/`);

// Stats
export const getStats = () => request("/api/v1/users/me/stats");
export const recalculateStats = () =>
  request("/api/v1/users/me/stats/recalculate", { method: "POST" });

// Prediction
export const getPrediction = (taskId) => request(`/api/v1/predict/${taskId}`);

// ── Chat ──────────────────────────────────────────────────────
export const sendChatMessage = (messages, task_id = null) =>
  request("/api/v1/chat/", {
    method: "POST",
    body: JSON.stringify({ messages, task_id }),
  });
