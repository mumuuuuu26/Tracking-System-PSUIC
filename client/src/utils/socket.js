import io from "socket.io-client";

const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
const apiUrl = import.meta.env.VITE_API_URL;
const apiBaseOrigin = apiUrl ? apiUrl.replace(/\/api\/?$/, "") : null;
const defaultDevSocketUrl = "https://localhost:5002";
const socketUrl = explicitSocketUrl
  || (import.meta.env.PROD ? window.location.origin : (apiBaseOrigin || defaultDevSocketUrl));

const socket = io(socketUrl);

export default socket;
