const express = require("express");
const path = require("path");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// --- Routes Import ---
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const equipmentRoutes = require("./routes/equipment");
const roomRoutes = require("./routes/room");
const ticketRoutes = require("./routes/ticket");
const itRoutes = require("./routes/it-support");
const notificationRoutes = require("./routes/notification");
const reportRoutes = require("./routes/report");
const adminRoutes = require("./routes/admin");
const quickFixRoutes = require("./routes/quickFix");
const permissionRoutes = require("./routes/permission");
// const healthRoutes = require("./routes/health"); // Uncomment if you have this file

// --- Middleware Setup ---

// 1. Trust Proxy: จำเป็นมากเมื่ออยู่บน Server จริง (Nginx/Cloudflare)
// ถ้าไม่เปิด Rate Limit จะมองเห็นทุกคนเป็น IP เดียวกันแล้วบล็อกผิดคน
app.set("trust proxy", 1);

// 2. Security Headers & Compression
app.use(
  helmet({
    crossOriginResourcePolicy: false, // อนุญาตให้โหลดรูปภาพข้าม domain ได้ (จำเป็นสำหรับ uploads)
  }),
);
app.use(compression()); // บีบอัด Response ให้เล็กลง

// 3. Logging (Dev = สั้นๆ, Prod = ละเอียด)
if (process.env.NODE_ENV !== "test") {
  const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
  app.use(morgan(logFormat));
}

// 4. Body Parser
app.use(express.json({ limit: "20mb" }));

// 5. CORS (Production Grade)
// อนุญาตเฉพาะ Frontend ของเราเท่านั้น เพื่อความปลอดภัย
app.use(
  cors({
    origin: [
      "http://localhost:5173",       // สำหรับ Dev ในเครื่อง
      "http://10.135.2.243:5173",    // สำหรับ Dev บน Server (ถ้ามี)
      "http://10.135.2.243"          // สำหรับ User ทั่วไป (Production)
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // ถ้ามีการใช้ Cookie/Session
  }),
);

// 6. Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Rate Limiting Strategy ---

// Global Limiter: กันยิงรัวๆ ทั่วไป
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 1000, // เพิ่มเป็น 1000-2000 เพื่อรองรับ user 100 คนใช้งานพร้อมกัน
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Auth Limiter: กัน Brute Force รหัสผ่าน
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  max: 10, // 10 ครั้งต่อนาที
  message: { message: "Too many login attempts, please try again later." },
});

// Apply Global Limit
app.use("/api", globalLimiter);

// Apply Auth Limit (เจาะจงเฉพาะ Login/Register)
// *สำคัญ* ไม่ควร Apply กับ authRoutes ทั้งก้อน เพราะจะไปโดน /current-user ด้วย ทำให้เว็บช้า
app.use("/api/register", authLimiter);
app.use("/api/login", authLimiter);

// --- Routes Mounting ---
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", equipmentRoutes);
app.use("/api", roomRoutes);
app.use("/api", ticketRoutes);
app.use("/api", itRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportRoutes);
app.use("/api", adminRoutes);
app.use("/api", quickFixRoutes);
app.use("/api", permissionRoutes);
// app.use("/api", healthRoutes); // Uncomment if exists

// --- Global Error Handler ---
const errorHandler = require("./middlewares/errorHandler"); // Ensure this file exists
app.use((err, req, res, next) => {
  // Fallback error handler if middleware file is missing issues
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// --- Swagger ---
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Server & Socket.io ---
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",       // สำหรับ Dev ในเครื่อง
      "http://10.135.2.243:5173",    // สำหรับ Dev บน Server (ถ้ามี)
      "http://10.135.2.243"          // สำหรับ User ทั่วไป (Production)
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Start Server & Graceful Shutdown ---
const PORT = process.env.PORT || 5002;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(
      `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
  });
}

// Graceful Shutdown: ป้องกัน Database พังเมื่อปิด Server
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    // ปิด Database connection ตรงนี้ได้ (ถ้าใช้ Prisma: prisma.$disconnect())
    process.exit(0);
  });
});

module.exports = app;
