// client/src/api/room.js
import api from "../utils/axios";

export const listRooms = async () => {
  // ดึงข้อมูลห้องทั้งหมดจาก Server
  return await api.get('/room');
};

export const createRoom = async (form) => {
  return await api.post('/room', form);
};

export const updateRoom = async (id, form) => {
  return await api.put('/room/' + id, form);
};

export const removeRoom = async (id) => {
  return await api.delete('/room/' + id);
};
