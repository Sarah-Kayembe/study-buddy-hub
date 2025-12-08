// src/api/axiosClient.js

import axios from "axios";
import { API_BASE } from "./base";

// Axios client used by quizzes/flashcards/etc.
const client = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data || err.message || "Network Error";
    return Promise.reject(message);
  }
);

export default client;
