// src/api/base.js

// Single place to define the backend base URL
// 1) If VITE_API_BASE is set, use that
// 2) Otherwise, use current hostname + port 8001
export const API_BASE =
  (import.meta?.env?.VITE_API_BASE) ||
  `http://${window.location.hostname}:8001`;
