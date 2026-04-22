// Base API client — all requests go through here
const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();

  // FIX: start with default headers, then let caller override them
  const defaultHeaders = { "Content-Type": "application/json" };
  if (token) defaultHeaders["Authorization"] = `Bearer ${token}`;

  const headers = { ...defaultHeaders, ...(options.headers || {}) };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));

    // FastAPI can return detail as:
    // 1. A string:  { detail: "Email already registered" }
    // 2. A list:    { detail: [{ msg: "field required", loc: [...] }] }
    // 3. Missing:   {}
    let message = "Request failed";
    if (err.detail) {
      if (typeof err.detail === "string") {
        message = err.detail;
      } else if (Array.isArray(err.detail)) {
        // Join all validation error messages
        message = err.detail.map(e => e.msg || JSON.stringify(e)).join(", ");
      } else {
        message = JSON.stringify(err.detail);
      }
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Auth
export const register = (data) =>
  request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Your backend accepts JSON for login (not OAuth2 form-encoded)
export const login = (data) =>
  request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: data.email, password: data.password }),
  });

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
