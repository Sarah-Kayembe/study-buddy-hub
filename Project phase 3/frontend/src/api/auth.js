export async function registerUser(formData) {
  const res = await fetch("http://127.0.0.1:8001/auth/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
}


export async function loginUser(formData) {
  const res = await fetch("http://127.0.0.1:8001/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Registration failed");
  }

  return res.json();
}

export async function fetchColleges() {
  const res = await fetch("http://127.0.0.1:8001/auth/colleges");

  if (!res.ok) {
    throw new Error("Failed to load colleges");
  }

  return res.json();
}

export async function fetchMajors() {
  const res = await fetch("http://127.0.0.1:8001/auth/majors");

  if (!res.ok) {
    throw new Error("Failed to load majors");
  }

  return res.json();
}

