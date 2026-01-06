// client/src/api/category.js
import axios from "axios";

export const createCategory = async (token, data) => {
  return await axios.post("/api/category", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const listCategories = async (token) => {
  return await axios.get("/api/category", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateCategory = async (token, id, data) => {
  return await axios.put("/api/category/" + id, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const removeCategory = async (token, id) => {
  return await axios.delete("/api/category/" + id, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
