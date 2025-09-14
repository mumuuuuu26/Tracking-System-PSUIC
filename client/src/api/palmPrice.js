import axios from "axios";

const BASE = "http://localhost:5001/api";

export const getPriceToday = () => axios.get(`${BASE}/palm-prices/today`);

export const getPriceRange = (from, to) =>
  axios.get(`${BASE}/palm-prices`, { params: { from, to } });

// admin only
export const refreshPrice = (token) =>
  axios.post(
    `${BASE}/palm-prices/refresh`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const upsertPriceManual = (token, payload) =>
  axios.post(`${BASE}/palm-prices`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
