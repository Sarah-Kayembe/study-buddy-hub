// src/api/auth.js
// By Rise Akizaki, cleaned up to use API_BASE

import { API_BASE } from "./base";

export async function registerUser(formData) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Registration failed");
  }

  return response.json();
}

export async function loginUser(formData) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Login failed");
  }

  return response.json();
}

export async function logoutUser() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Logout failed");
  }

  window.location.href = "/";
}

export async function fetchColleges() {
  const response = await fetch(`${API_BASE}/auth/colleges`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load colleges");
  }

  return response.json();
}

export async function fetchMajors() {
  const response = await fetch(`${API_BASE}/auth/majors`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load majors");
  }

  return response.json();
}
