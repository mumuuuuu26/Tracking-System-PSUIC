import axios from "axios";

const BASE = "http://localhost:5001/api";

//API สำหรับค้นหาบิล
export const searchMyBills = async (token, params) => {
  return axios.get(`${BASE}/user/my-bills`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
};