import { useState } from "react";
import { API_BASE } from "../../../api/base";
import Icon from "../Icon";

export default function ProfileWindow({ user, onClose, onProfileUpdated }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function uploadImage() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/user/upload-profile-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (data.success && typeof onProfileUpdated === "function") {
        onProfileUpdated(data.profile_image);
        onClose();
      }
    } catch (err) {
      setLoading(false);
      console.error("Upload failed", err);
    }
  }

  const profileSrc = user?.profile_image ? `${API_BASE}/${user.profile_image}` : null;

  return (
    <div className="den-window-overlay">
      <div className="den-window" style={{ width: 380 }}>
        <div className="window-header">
          <span className="window-title">Profile Settings</span>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="window-content" style={{ textAlign: "center" }}>
          {profileSrc ? (
            <img
              src={profileSrc}
              alt="avatar"
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 12
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15,23,42,0.9)",
                border: "2px solid #38bdf8",
              }}
            >
              <Icon name="user" size={64} title="avatar" />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            style={{ marginTop: 12 }}
            className="den-btn-primary"
            disabled={loading}
            onClick={uploadImage}
          >
            {loading ? "Uploading..." : "Save Profile Picture"}
          </button>
        </div>
      </div>
    </div>
  );
}
