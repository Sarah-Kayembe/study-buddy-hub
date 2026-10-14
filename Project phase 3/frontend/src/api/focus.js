// Calls to the Focus Den API for the shop, inventory and StudyVille.
import { API_BASE } from "./base";

const FOCUS_API = `${API_BASE}/api/focus`;

async function request(path, options = {}) {
  const res = await fetch(`${FOCUS_API}${path}`, {
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.data = data;
    throw error;
  }
  return data;
}

export const getShop = () => request("/shop");
export const buyItem = (itemId) => request(`/shop/${itemId}/buy`, { method: "POST" });
export const getInventory = () => request("/inventory");
export const getCity = () => request("/city");
export const placeItem = (itemId, x, y) =>
  request("/city", { method: "POST", body: JSON.stringify({ item_id: itemId, x, y }) });
export const removeFromCity = (layoutId) => request(`/city/${layoutId}`, { method: "DELETE" });
