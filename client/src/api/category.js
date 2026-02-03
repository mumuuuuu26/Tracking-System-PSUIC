// client/src/api/category.js
import axios from "axios";

export const createCategory = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/category`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const listCategories = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/category`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateCategory = async (token, id, data) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/category/` + id, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const removeCategory = async (token, id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/category/` + id, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
