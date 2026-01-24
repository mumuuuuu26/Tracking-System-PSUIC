const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const equipmentRoutes = require("./routes/equipment");
const roomRoutes = require("./routes/room");
const ticketRoutes = require("./routes/ticket");
const appointmentRoutes = require("./routes/appointment");

const itRoutes = require("./routes/it-support");
const notificationRoutes = require("./routes/notification");
const reportRoutes = require("./routes/report");

const adminRoutes = require("./routes/admin");

const personalTaskRoutes = require("./routes/personalTask");

// middleware
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(cors());
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", equipmentRoutes);
app.use("/api", roomRoutes);
app.use("/api", ticketRoutes);
app.use("/api", appointmentRoutes);

app.use("/api", itRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportRoutes);

app.use("/api", adminRoutes);

app.use("/api", personalTaskRoutes);
app.use("/api", require("./routes/quickFix"));
app.use("/api", require("./routes/permission"));

// Cron Jobs
const initReminders = require("./cron/reminders");
initReminders();

// Socket.io Setup
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
