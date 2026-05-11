// ─────────────────────────────────────────────────────────────
// UPDATE THIS URL to your laptop's IP address
// Run ipconfig to find it
// ─────────────────────────────────────────────────────────────
const BASE_URL = "http://192.168.0.103:8000";

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveToken(token) {
  if (Platform.OS === "web") {
    localStorage.setItem("token", token);
  } else {
    await AsyncStorage.setItem("token", token);
  }
}

export async function clearToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem("token");
  } else {
    await AsyncStorage.removeItem("token");
  }
}

async function getToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("token");
  }
  return await AsyncStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = await getToken();
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

// ── Auth ──────────────────────────────────────────────────────
export const register = (data) =>
  request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) });

export const login = (data) =>
  request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) });

export const getMe = () => request("/api/v1/auth/me");

// ── Tasks ─────────────────────────────────────────────────────
export const createTask = (data) =>
  request("/api/v1/tasks/", { method: "POST", body: JSON.stringify(data) });

export const getTasks = () => request("/api/v1/tasks/");

export const getTask = (id) => request(`/api/v1/tasks/${id}`);

export const updateTask = (id, data) =>
  request(`/api/v1/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteTask = (id) =>
  request(`/api/v1/tasks/${id}`, { method: "DELETE" });

// ── Sessions ──────────────────────────────────────────────────
export const logSession = (taskId, action) =>
  request(`/api/v1/tasks/${taskId}/sessions/`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });

export const getSessions = (taskId) =>
  request(`/api/v1/tasks/${taskId}/sessions/`);

// ── Stats ─────────────────────────────────────────────────────
export const getStats = () => request("/api/v1/users/me/stats");

export const recalculateStats = () =>
  request("/api/v1/users/me/stats/recalculate", { method: "POST" });

// ── Prediction ────────────────────────────────────────────────
export const getPrediction = (taskId) => request(`/api/v1/predict/${taskId}`);

// ── Chat ──────────────────────────────────────────────────────
export const sendChatMessage = (messages, task_id = null) =>
  request("/api/v1/chat/", {
    method: "POST",
    body: JSON.stringify({ messages, task_id }),
  });
