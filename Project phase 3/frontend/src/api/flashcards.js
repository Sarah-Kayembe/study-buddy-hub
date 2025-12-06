import client from "./axiosClient";

const API_PREFIX = "/flashcards";

/**
 * Create a flashcard set
 * @param {{title: string, course_id?: number, flashcards: Array<{front:string,back:string}>}} data
 */
export const createFlashcardSet = async (data) => {
  const res = await client.post(`${API_PREFIX}/create`, data);
  return res.data;
};

export const getFlashcardSet = async (setId) => {
  const res = await client.get(`${API_PREFIX}/sets/${setId}`);
  return res.data;
};

export const listFlashcardSets = async () => {
  const res = await client.get(`${API_PREFIX}/sets`);
  return res.data;
};

export const updateFlashcardSet = async (setId, data) => {
  const res = await client.put(`${API_PREFIX}/sets/${setId}`, data);
  return res.data;
};

export const deleteFlashcardSet = async (setId) => {
  const res = await client.delete(`${API_PREFIX}/sets/${setId}`);
  return res.data;
};

export const updateFlashcard = async (cardId, data) => {
  const res = await client.put(`${API_PREFIX}/cards/${cardId}`, data);
  return res.data;
};

export const deleteFlashcard = async (cardId) => {
  const res = await client.delete(`${API_PREFIX}/cards/${cardId}`);
  return res.data;
};
