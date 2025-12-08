// frontend/src/api/resources.js
import client from "./axiosClient"; 

// GET /resources
export async function fetchResources(limit = 0) {
  const params = {};
  if (limit > 0) {
    params.limit = limit;
  }

  const res = await client.get("/resources", { params });
  return res.data;
}

// POST /resources 
export async function createResource(payload) {
  // payload: { title, description, filetype, url }
  const res = await client.post("/resources", payload);
  return res.data;
}

// POST /resources/upload-file 
export async function uploadResourceFile(formData) {
  const res = await client.post("/resources/upload-file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

