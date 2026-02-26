import io from "socket.io-client";

const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
const apiUrl = import.meta.env.VITE_API_URL;
const apiBaseOrigin = apiUrl ? apiUrl.replace(/\/api\/?$/, "") : null;
const defaultDevSocketUrl = "https://localhost:5002";
const socketUrl = explicitSocketUrl
  || (import.meta.env.PROD ? window.location.origin : (apiBaseOrigin || defaultDevSocketUrl));

const readAuthToken = () => {
  try {
    const storage = localStorage.getItem("auth-store");
    if (!storage) return "";
    const parsed = JSON.parse(storage);
    return String(parsed?.state?.token || "").trim();
  } catch {
    return "";
  }
};

const socket = io(socketUrl, {
  autoConnect: false,
  auth: (cb) => {
    const token = readAuthToken();
    cb(token ? { token } : {});
  },
});

export const syncSocketConnection = () => {
  const token = readAuthToken();
  socket.auth = token ? { token } : {};

  if (token) {
    if (!socket.connected) {
      socket.connect();
    }
    return;
  }

  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
