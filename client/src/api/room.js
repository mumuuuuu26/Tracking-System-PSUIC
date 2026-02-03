// client/src/api/room.js
import axios from "axios";

export const listRooms = async (token) => {
  // ดึงข้อมูลห้องทั้งหมดจาก Server
  return await axios.get(`${import.meta.env.VITE_API_URL}/room`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createRoom = async (token, form) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/room`, form, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateRoom = async (token, id, form) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/room/` + id, form, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const removeRoom = async (token, id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/room/` + id, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
