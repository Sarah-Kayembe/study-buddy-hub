import { useEffect, useState } from "react";

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:8001/resources", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch resources");
      const data = await response.json();
      setResources(Array.isArray(data) ? data : data.resources || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(
    (resource) =>
      resource.title?.toLowerCase().includes(filter.toLowerCase()) ||
      resource.description?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Learning Resources</h2>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search resources..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading resources... 
        </div>
      ) : filteredResources.length === 0 ? (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '40px',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>No resources found</p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            Try adjusting your search or check back later for more resources.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.resource_id || resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <h3 style={{
        margin: '0 0 10px 0',
        color: '#0066cc',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        {resource.title}
      </h3>
      
      <p style={{
        margin: '10px 0',
        color: '#555',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        {resource.description || 'No description available'}
      </p>

      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: '#0066cc',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0052a3'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0066cc'}
        >
          View Resource →
        </a>
      )}

      {resource.created_at && (
        <p style={{
          margin: '10px 0 0 0',
          fontSize: '12px',
          color: '#999'
        }}>
          Added: {new Date(resource.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
