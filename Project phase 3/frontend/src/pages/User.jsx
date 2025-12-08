// By Rise Akizaki

import { useEffect, useState } from "react";
import { fetchColleges, fetchMajors, logoutUser} from "../api/auth.js"; // all methods from the api go here

export function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8001/user/account", {
      method: "GET",
      credentials: "include" // required for session cookies. Generated with ChatGPT
    })
      .then(response => {
        if (response.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return response.json();
      })
      .then(data => {
        if (data && !data.error) 
          setUser(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login"; // redirect to login screen if not logged in
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>My Account</h1>

        <p style={styles.text}><strong>First Name:</strong> {user.first_name}</p>
        <p style={styles.text}><strong>Last Name:</strong> {user.last_name}</p>
        <p style={styles.text}><strong>Email:</strong> {user.email}</p>
        <p style={styles.text}><strong>College Year:</strong> {user.college_level}</p>
        <p style={styles.text}><strong>College:</strong> {user.college_name}</p>
        <p style={styles.text}><strong>Major:</strong> {user.major_name}</p>
        <p style={styles.text}><strong>Bio:</strong> {user.bio}</p>

        <button
          style={styles.button}
          onClick={() => (window.location.href = "/user/account/edit")} // go to edit account page
        >
          Edit Account
        </button>

        <button
          style={{
            ...styles.button, 
            backgroundColor: "#252140ff", 
            marginLeft: 25
          }}
          onClick={(logoutUser)} 
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export function EditAccountPage() {
  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    college_level: "",
    college_id: "",   
    major_id: "",
    bio: ""      
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [colleges, setColleges] = useState([]);
  const [majors, setMajors] = useState([]);

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    fetch("http://127.0.0.1:8001/user/account", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) 
          setError(data.error);
        else window.location.href = "/user/account";
      })
      .catch(() => setError("Server error."))
      .finally(() => setSaving(false));
  };

  // Fetch account
  useEffect(() => {
    fetch("http://127.0.0.1:8001/user/account", {
      method: "GET",
      credentials: "include"
    })
      .then(response => response.json())
      .then(data => {
        if (!data.error) {
          setUser(prev => ({
            ...prev,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            college_level: data.college_level,
            college_id: data.college_id || "",
            major_id: data.major_id || "", // leaves ids empty unless changed by the user
            bio: data.bio || ""
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchColleges().then(setColleges).catch(console.error);
  }, []);

  useEffect(() => {
    fetchMajors().then(setMajors).catch(console.error);
  }, []);

  if (loading) 
    return <h2>Loading...</h2>;


  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Edit Account Details</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>

          <label>First Name</label>
          <input
            name="first_name"
            value={user.first_name}
            onChange={handleChange}
            style={styles.input}
          />

          <label>Last Name</label>
          <input
            name="last_name"
            value={user.last_name}
            onChange={handleChange}
            style={styles.input}
          />

          <label>Email</label>
          <input
            name="email"
            value={user.email}
            onChange={handleChange}
            style={styles.input}
          />

          <label>College Year</label>
          <select
            name="college_level"
            value={user.college_level}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Select Year</option>
            <option value="Freshman">Freshman</option>
            <option value="Sophomore">Sophomore</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Graduate">Graduate</option> 
          </select> 
          
          <div style={styles.formField}>
          <label>College</label>
          <select
            name="college_id"
            value={user.college_id}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Select College</option>
            {colleges.map(c => (
              <option key={c.college_id} value={c.college_id}>
                {c.college_name}
              </option>
            ))}
          </select>
          </div>
          
          <div style={styles.formField}>
          <label>Major</label>
          <select
            name="major_id"
            value={user.major_id}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Select Major</option>
            {majors.map(m => (
              <option key={m.major_id} value={m.major_id}>
                {m.major_name}
              </option>
            ))}
          </select>
          </div>

          <label>Bio</label>
          <input
            name="bio"
            value={user.bio}
            onChange={handleChange}
            style={styles.input}
          />

          <button 
            type="submit" 
            style={styles.button} 
            disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = "/user/account")}
            style={{
              ...styles.button, 
              backgroundColor: "#65687cff", 
              marginLeft: 25}}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}



// default style for web page
// Initial style generated by ChatGPT
////////////////////////////
const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    marginTop: "10px"
  },
  card: {
    background: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(10px)",
    padding: "30px",
    width: "100%",
    maxWidth: "600px",
    border: "1px solid rgb(120, 120, 120)",
    borderRadius: "12px",
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
  formField: {
    width: "100%",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
  }, // ensures that input boxes don't go past the card. Edited with ChatGPT
  input: {
    padding: "12px 14px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "16px",
    backgroundColor: "rgba(10, 15, 26, 0.8)",   
    color: "white",                              
    outline: "none",
    width: "100%",         
    maxWidth: "100%",      
    boxSizing: "border-box" 
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