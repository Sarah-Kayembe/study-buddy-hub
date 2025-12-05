import { useEffect, useState } from "react";

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //"/user/account"
  useEffect(() => {
    fetch("http://127.0.0.1:8001/user/account", {
      method: "GET",
      credentials: "include" // required for session cookies
    })
      .then(res => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
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
        <h1 style={styles.title}>My Profile</h1>

        <p style={styles.text}><strong>First Name:</strong> {user.first_name}</p>
        <p style={styles.text}><strong>Last Name:</strong> {user.last_name}</p>
        <p style={styles.text}><strong>Email:</strong> {user.email}</p>
        <p style={styles.text}><strong>College Year:</strong> {user.college_level}</p>
        <p style={styles.text}><strong>College:</strong> {user.college_name}</p>
        <p style={styles.text}><strong>Major:</strong> {user.major_name}</p>

        <button
          style={styles.button}
          onClick={() => (window.location.href = "/edit-profile")}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}


export function EditProfilePage(){

}

// default style for web page
////////////////////////////
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