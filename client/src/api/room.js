// client/src/api/room.js
import api from "../utils/axios";

export const listRooms = async (token) => {
  // ดึงข้อมูลห้องทั้งหมดจาก Server
  return await api.get('/room', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createRoom = async (token, form) => {
  return await api.post('/room', form, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateRoom = async (token, id, form) => {
  return await api.put('/room/' + id, form, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const removeRoom = async (token, id) => {
  return await api.delete('/room/' + id, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
