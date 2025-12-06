import axios from "axios";

// Allow overriding the backend base URL via Vite env: VITE_API_BASE
const BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || "http://localhost:8001";

const client = axios.create({
  baseURL: BASE,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    // Simple global error handler — rethrow to let callers handle it as well
    const message = err?.response?.data || err.message || "Network Error";
    return Promise.reject(message);
  }
);

export default client;
