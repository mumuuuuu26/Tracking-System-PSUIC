// client/src/api/room.js
import axios from "axios";

export const listRooms = async (token) => {
  // ดึงข้อมูลห้องทั้งหมดจาก Server
  return await axios.get("/api/room", {
    headers: { Authorization: `Bearer ${token}` },
  });
};
