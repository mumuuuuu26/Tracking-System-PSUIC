import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

export const listBills = (token) =>
  api.get("/bills", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const searchBills = (token, query) =>
  api.get(`/bills/search?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getBill = (token, id) =>
  api.get(`/bills/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateBill = (token, id, data) =>
  api.put(`/bills/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteBill = (token, id) =>
  api.delete(`/bills/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
