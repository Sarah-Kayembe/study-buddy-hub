// src/api/axiosClient.js
import axios from "axios";
import { API_BASE } from "./base";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,     
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data || err.message || "Network Error";
    return Promise.reject(message);
  }
);

export default client;

