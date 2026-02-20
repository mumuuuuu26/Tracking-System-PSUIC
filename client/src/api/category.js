// client/src/api/category.js
import api from "../utils/axios";

export const createCategory = async (data) => {
  return await api.post('/category', data);
};

export const listCategories = async () => {
  return await api.get('/category');
};

export const updateCategory = async (id, data) => {
  return await api.put('/category/' + id, data);
};

export const removeCategory = async (id) => {
  return await api.delete('/category/' + id);
};
