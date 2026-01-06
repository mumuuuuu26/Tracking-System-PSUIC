// client/src/api/room.js
import axios from "axios";

export const listRooms = async (token) => {
  // ดึงข้อมูลห้องทั้งหมดจาก Server
  return await axios.get("/api/room", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createRoom = async (token, form) => {
  return await axios.post("/api/room", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateRoom = async (token, id, form) => {
  return await axios.put("/api/room/" + id, form, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const removeRoom = async (token, id) => {
  return await axios.delete("/api/room/" + id, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
