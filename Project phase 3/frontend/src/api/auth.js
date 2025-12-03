export async function registerUser(username, password) {
  const res = await fetch("http://127.0.0.1:8001/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Registration failed");
  }

  return res.json();
}
