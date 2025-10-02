import axios from "axios";
const BASE = "http://localhost:5001/api";

export const createBill = (token, payload) =>
  axios.post(`${BASE}/bill`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const listBills = (token) =>
  axios.get(`${BASE}/bills`, { headers: { Authorization: `Bearer ${token}` } });

export const getBill = (token, id) =>
  axios.get(`${BASE}/bill/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const searchBills = (token, plate) =>
  axios.get(`${BASE}/bills/search`, {
    params: { plate },
    headers: { Authorization: `Bearer ${token}` },
  });
