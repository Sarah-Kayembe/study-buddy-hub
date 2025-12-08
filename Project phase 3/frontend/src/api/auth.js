// By Rise Akizaki

export async function registerUser(formData) {
  const response = await fetch("http://127.0.0.1:8001/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return response.json();
}

// TODO: add try/catch here, or remove try/catch above
export async function loginUser(formData) {
  const response = await fetch("http://127.0.0.1:8001/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(e.error || "Registration failed");
  }

  return response.json();
}

export async function logoutUser() {
  const response = await fetch("http://127.0.0.1:8001/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(e.error || "Logout failed");
  }

  window.location.href = "/"; // redirect to homepage after logging out
}


export async function fetchColleges() {
  const response = await fetch("http://127.0.0.1:8001/auth/colleges");

  if (!response.ok) {
    throw new Error(e.error || "Failed to load colleges");
  }

  return response.json();
}

export async function fetchMajors() {
  const response = await fetch("http://127.0.0.1:8001/auth/majors");

  if (!response.ok) {
    throw new Error(e.error || "Failed to load majors");
  }

  return response.json();
}

