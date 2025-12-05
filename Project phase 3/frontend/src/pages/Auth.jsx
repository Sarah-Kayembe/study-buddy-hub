import { useState, useEffect } from "react";
import { registerUser, loginUser, fetchColleges, fetchMajors} from "../api/auth.js"; // all methods from the api go here

// for the user registration page
// needs default keyword for some reason
export function RegisterPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    college_id: "",
    major_id: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Loading Data
  /////////////////////

  // colleges
  const [colleges, setColleges] = useState([]);
  useEffect(() => {
    fetchColleges().then(setColleges).catch(console.error);
  }, []);

  //majors
  const [majors, setMajors] = useState([]);
  useEffect(() => {
    fetchMajors().then(setMajors).catch(console.error);
  }, []);


  ////////////////////
  const handleRegister = async (e) => {
    e.preventDefault();

    // const cleaned = {
    // ...form,
    // college_id: form.college_id === "" ? null : Number(form.college_id),
    // major_id: form.major_id === "" ? null : Number(form.major_id),
    // };

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await registerUser(cleaned);
      setMessage(data.message);

      // Redirects to login page after successfully registering account
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } 
    catch (err) {
      setError(err.message || "Registration failed");
    } 
    finally {
      setLoading(false);
    }

  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Register</h1>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
          />
{/*
Save these for the profile page, we don't need them for registering.
          <select
            name="college_id"
            value={form.college_id}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Select College</option>
            {(colleges || []).map((c) => (
              <option key={c.college_id} value={c.college_id}>
                {c.college_name}
              </option>
            ))}
          </select>

          <select
            name="major_id"
            value={form.major_id}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Select Major</option>
            {(majors || []).map((m) => (
              <option key={m.major_id} value={m.major_id}>
                {m.major_name}
              </option>
            ))}
          </select>
*/}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && <p style={{ color: "lightgreen" }}>{message}</p>}
        {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      </div>
    </div>
  );
}

// for the user login page
export function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await loginUser(form);
      setMessage(data.message);

      // redirect to home page
      setTimeout(() => {
        window.location.href = "/home";
      }, 1000);
    } 
    catch (err) {
      setError(err.message || "Login failed");
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login</h1>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p style={{ color: "lightgreen" }}>{message}</p>}
        {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      </div>
    </div>
  );
}

// default style for web page
/////////////////////////////
const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  card: {
    background: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(10px)",
    padding: "30px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "420px",
  },
  title: {
    textAlign: "center",
    color: "white",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "16px",
    backgroundColor: "rgba(10, 15, 26, 0.8)",   
    color: "white",                              
    outline: "none",
  },
  button: {
    marginTop: "10px",
    padding: "10px 14px",
    background: "#0ea5e9",
    color: "white",
    fontSize: "16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    transition: "0.2s",
  },
};