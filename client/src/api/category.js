// client/src/api/category.js
import axios from "axios";

export const listCategories = async (token) => {
  return await axios.get("/api/category", {
    headers: { Authorization: `Bearer ${token}` },
  });
};
