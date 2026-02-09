// client/src/api/category.js
import api from "../utils/axios";

export const createCategory = async (token, data) => {
  return await api.post('/category', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const listCategories = async (token) => {
  return await api.get('/category', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateCategory = async (token, id, data) => {
  return await api.put('/category/' + id, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const removeCategory = async (token, id) => {
  return await api.delete('/category/' + id, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
