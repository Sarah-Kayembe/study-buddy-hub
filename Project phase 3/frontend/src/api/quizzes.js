import client from "./axiosClient";

const API_PREFIX = "/quiz";

export const createQuiz = async (data) => {
  const res = await client.post(`${API_PREFIX}/create`, data);
  return res.data;
};

export const listQuizzes = async () => {
  const res = await client.get(`${API_PREFIX}/quizzes`);
  // Handle paginated response (backend returns {page, limit, items})
  return res.data.items || res.data;
};

export const getQuiz = async (quizId) => {
  const res = await client.get(`${API_PREFIX}/${quizId}`);
  return res.data;
};

export const submitQuiz = async (data) => {
  const res = await client.post(`${API_PREFIX}/submit`, data);
  return res.data;
};