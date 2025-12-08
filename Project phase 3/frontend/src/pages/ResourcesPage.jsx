// frontend/src/pages/ResourcesPage.jsx
import { useEffect, useState } from "react";
import {
  fetchResources as apiFetchResources,
  createResource as apiCreateResource,
  uploadResourceFile as apiUploadResourceFile,
} from "../api/resources";

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // create-resource form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFiletype, setNewFiletype] = useState("LINK");
  const [newSource, setNewSource] = useState(""); // URL
  const [uploadFile, setUploadFile] = useState(null); // for PDFs / other files
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ----- LOAD RESOURCES -----
  const loadResources = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetchResources(); // <- use the imported helper
      const list = Array.isArray(data) ? data : data.resources || [];
      setResources(list);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // ----- CREATE / UPLOAD RESOURCE -----
  const handleCreateResource = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!newTitle.trim()) {
      setCreateError("Title is required.");
      return;
    }

    const typeUpper = newFiletype.toUpperCase();

    // FILE UPLOAD PATH (PDF / OTHER)
    if (typeUpper === "PDF" || typeUpper === "OTHER") {
      if (!uploadFile) {
        setCreateError("Please choose a file to upload.");
        return;
      }

      setCreating(true);
      try {
        const formData = new FormData();
        formData.append("title", newTitle.trim());
        formData.append("description", newDescription.trim());
        formData.append("filetype", typeUpper);
        formData.append("file", uploadFile);

        const created = await apiUploadResourceFile(formData);

        if (created && created.resource_id) {
          setResources((prev) => [created, ...prev]);
        } else {
          await loadResources();
        }

        // reset form
        setNewTitle("");
        setNewDescription("");
        setNewFiletype("LINK");
        setNewSource("");
        setUploadFile(null);
      } catch (err) {
        console.error("Error uploading resource:", err);
        setCreateError(err.message || "Failed to upload resource");
      } finally {
        setCreating(false);
      }
      return;
    }

    // LINK / VIDEO PATH (URL-based)
    if (!newSource.trim()) {
      setCreateError("URL is required for links and videos.");
      return;
    }

    setCreating(true);
    try {
      const created = await apiCreateResource({
        title: newTitle.trim(),
        description: newDescription.trim(),
        url: newSource.trim(),
        filetype: typeUpper,
      });

      if (created && created.resource_id) {
        setResources((prev) => [created, ...prev]);
      } else {
        await loadResources();
      }

      setNewTitle("");
      setNewDescription("");
      setNewFiletype("LINK");
      setNewSource("");
      setUploadFile(null);
    } catch (err) {
      console.error("Error creating resource:", err);
      setCreateError(err.message || "Failed to create resource");
    } finally {
      setCreating(false);
    }
  };

  // ----- FILTERING -----
  const filteredResources = resources.filter((r) => {
    const text = (r.title || "") + " " + (r.description || "");
    const matchesText = text.toLowerCase().includes(filter.toLowerCase());
    const ft = (r.filetype || "").toString().trim().toUpperCase();
    const matchesType =
      typeFilter === "ALL" || ft === typeFilter.toUpperCase();
    return matchesText && matchesType;
  });

  // when they change type, clear URL/file to avoid weird state
  const handleTypeChange = (val) => {
    setNewFiletype(val);
    setNewSource("");
    setUploadFile(null);
  };

  return (
    <div className="app-shell">
      <h1 className="page-title">Learning Resources</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: search + results */}
        <section className="section">
          <div className="card">
            <div className="card-header" style={{ marginBottom: "0.75rem" }}>
              <div className="card-title">Browse resources</div>
            </div>

            {error && (
              <p className="error-text" style={{ marginBottom: "0.75rem" }}>
                {error}
              </p>
            )}

            {/* search + type filters */}
            <div
              className="toolbar-row"
              style={{ marginBottom: "0.75rem", alignItems: "stretch" }}
            >
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className="tabs">
                {["ALL", "LINK", "PDF", "VIDEO"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={
                      "tab-btn" + (typeFilter === t ? " tab-btn-active" : "")
                    }
                    onClick={() => setTypeFilter(t)}
                  >
                    {t === "ALL" ? "All" : t}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p style={{ opacity: 0.8 }}>Loading resources…</p>
            ) : filteredResources.length === 0 ? (
              <p style={{ opacity: 0.8 }}>No resources found.</p>
            ) : (
              <div className="scroll-list" style={{ maxHeight: "420px" }}>
                <ul className="clean-list">
                  {filteredResources.map((r) => (
                    <li key={r.resource_id ?? r.id}>
                      <ResourceCard resource={r} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: add new resource */}
        <section className="section">
          <div className="card">
            <div className="card-title" style={{ marginBottom: "0.75rem" }}>
              Share a resource
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                opacity: 0.8,
                marginTop: 0,
                marginBottom: "0.75rem",
              }}
            >
              Add helpful links, PDFs, or videos for your classmates.
            </p>

            {createError && (
              <p className="error-text" style={{ marginBottom: "0.5rem" }}>
                {createError}
              </p>
            )}

            <form
              onSubmit={handleCreateResource}
              style={{ display: "grid", gap: "0.75rem" }}
            >
              <div>
                <label>
                  Title
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Arrays in Data Structures"
                  />
                </label>
              </div>

              <div>
                <label>
                  Description (optional)
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short summary of why this is useful…"
                    rows={3}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 0.9fr",
                  gap: "0.75rem",
                }}
              >
                {(newFiletype === "LINK" || newFiletype === "VIDEO") && (
                  <label>
                    URL
                    <input
                      type="text"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="https://example.com/article"
                    />
                  </label>
                )}

                {(newFiletype === "PDF" || newFiletype === "OTHER") && (
                  <label>
                    File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
                      style={{
                        width: "100%",
                        borderRadius: "999px",
                        border: "1px solid rgba(148, 163, 184, 0.5)",
                        background: "#020617",
                        color: "#e5e7eb",
                        padding: "0.35rem 0.7rem",
                      }}
                    />
                  </label>
                )}

                <label>
                  Type
                  <select
                    value={newFiletype}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: "999px",
                      border: "1px solid rgba(148, 163, 184, 0.5)",
                      background: "#020617",
                      color: "#e5e7eb",
                      padding: "0.5rem 0.9rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <option value="LINK">Link</option>
                    <option value="PDF">PDF (upload)</option>
                    <option value="VIDEO">Video link</option>
                    <option value="OTHER">Other file</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: "0.25rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? "Saving…" : "Add resource"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function ResourceCard({ resource }) {
  const url = resource.source || resource.url;
  const added =
    resource.upload_date || resource.created_at || resource.createdAt;
  const filetype =
    (resource.filetype || "").toString().trim().toUpperCase() || "LINK";

  const title = resource.title || "Untitled resource";
  const desc = resource.description || "";

  return (
    <div
      className="card card-subtle"
      style={{
        padding: "0.8rem 1rem",
        marginBottom: "0.6rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.98rem",
              marginBottom: "0.25rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={title}
          >
            {title}
          </div>
          {desc && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                maxHeight: "3.5rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={desc}
            >
              {desc}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.35rem",
            minWidth: "90px",
          }}
        >
          {filetype && (
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.15rem 0.6rem",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                opacity: 0.9,
              }}
            >
              {filetype}
            </span>
          )}
          {url && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                window.open(url, "_blank", "noopener,noreferrer")
              }
            >
              Open
            </button>
          )}
        </div>
      </div>

      {added && (
        <div
          style={{
            marginTop: "0.35rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          Added: {new Date(added).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
