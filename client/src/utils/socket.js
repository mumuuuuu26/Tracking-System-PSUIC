import io from "socket.io-client";

// If production, connect to same origin. If dev, connect to port 5002.
const socketUrl = import.meta.env.PROD ? window.location.origin : "http://localhost:5002";

const socket = io(socketUrl);

export default socket;
