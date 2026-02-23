const express = require("express");
const path = require("path");
require("./config/env");
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


app.set("trust proxy", 1);

// HTTP-only deployment (current): avoid forcing HTTPS-specific headers.
// Enable HTTPS-only headers later by setting ENABLE_HTTPS_HEADERS=true.
const isHttpsHeadersEnabled = process.env.ENABLE_HTTPS_HEADERS === "true";

// 2. Security Headers & Compression
app.use(
  helmet({
    crossOriginResourcePolicy: false, // อนุญาตให้โหลดรูปภาพข้าม domain ได้ (จำเป็นสำหรับ uploads)
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // On HTTP deployments this directive upgrades all resource URLs to https://
        // and causes blank page if 443 is unavailable.
        upgradeInsecureRequests: isHttpsHeadersEnabled ? [] : null,
      },
    },
    hsts: isHttpsHeadersEnabled ? undefined : false,
    crossOriginOpenerPolicy: isHttpsHeadersEnabled ? { policy: "same-origin" } : false,
    originAgentCluster: isHttpsHeadersEnabled,
  }),
);
app.use(compression()); // บีบอัด Response ให้เล็กลง

// 3. Logging (Dev = สั้นๆ, Prod = ละเอียด)
const { logger, stream } = require("./utils/logger");
const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(logFormat, { stream }));


// 4. Body Parser
app.use(express.json({ limit: "20mb" }));

// 5. CORS (Production Grade)
// อนุญาตเฉพาะ Frontend ของเราเท่านั้น เพื่อความปลอดภัย
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  /https?:\/\/.*\.ngrok-free\.app/
].filter(Boolean); // Remove undefined/null from env

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// 6. Static Files
const uploadDir = process.env.UPLOAD_DIR || "uploads";
// Resolve path: if absolute, use as is; if relative, resolve from server root
const absoluteUploadDir = path.isAbsolute(uploadDir)
  ? uploadDir
  : path.join(__dirname, uploadDir);

// Ensure upload directory exists
const fs = require("fs");
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

app.use("/uploads", express.static(absoluteUploadDir));

// --- Rate Limiting Strategy ---

// Global Limiter: กันยิงรัวๆ ทั่วไป
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 3000, // เพิ่มเป็น 3000 เพื่อรองรับ user 100+ คนใช้งานพร้อมกัน (เฉลี่ย 1 request/3วิ ต่อ user)
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Auth Limiter: กัน Brute Force รหัสผ่าน
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  max: 100, // 100 ครั้งต่อนาที (Increased for testing reliability)
  message: { message: "Too many login attempts, please try again later." },
});

// Apply Global Limit
app.use("/api", globalLimiter);

// Apply Auth Limit (เจาะจงเฉพาะ Login/Register)
// *สำคัญ* ไม่ควร Apply กับ authRoutes ทั้งก้อน เพราะจะไปโดน /current-user ด้วย ทำให้เว็บช้า
app.use("/api/register", authLimiter);
app.use("/api/login", authLimiter);

// --- Server & Socket.io (created BEFORE routes so req.io is available to all controllers) ---
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const extraOrigins = process.env.EXTRA_ORIGINS
  ? process.env.EXTRA_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      ...extraOrigins,
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Attach io to every request BEFORE routes so controllers can call req.io.emit()
app.use((req, res, next) => {
  req.io = io;
  next();
});

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

// --- Swagger --- (mounted BEFORE error handler so errors are catchable)
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Global Error Handler ---
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// Note: Server, Socket.io, and req.io middleware have been moved above the routes.
// See the Routes Mounting section above.

// 2. Health Check Endpoint (สำหรับ start-server-and-test)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 3. บอกให้ Server รู้จักโฟลเดอร์หน้าเว็บ (ที่ Build แล้ว)
app.use(express.static(path.join(__dirname, "client/dist")));

// 4. ถ้า User เข้าลิงก์อะไรก็ตามที่ไม่ใช่ API ให้ส่งหน้าเว็บ React กลับไป
app.get(/.*/, (req, res) => {
    // ป้องกันไม่ให้ไปแย่ง Route ของ API
    if (!req.originalUrl.startsWith('/api')) {
        res.sendFile(path.join(__dirname, "client/dist", "index.html"));
    } else {
        // กรณีเป็น API ที่ไม่เจอให้ตอบ 404
        res.status(404).json({ message: "API route not found" });
    }
});

// --- Start Server & Graceful Shutdown ---
const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== "test" && !process.env.CI) {
      const prisma = require("./config/prisma");
      await prisma.$connect();
      logger.info("Database connected successfully");

      const { initScheduledJobs } = require("./utils/scheduler");
      initScheduledJobs();
    } else if (process.env.NODE_ENV === "test" || process.env.CI) {
      // Still connect to DB in test/CI mode, but skip scheduler
       const prisma = require("./config/prisma");
       await prisma.$connect();
       logger.info("Database connected successfully (Test/CI Mode - Scheduler Disabled)");
    }

    server.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
      );
    });

    server.setTimeout(30000);

  } catch (error) {
    logger.error("Server failed to start:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

// Graceful Shutdown: ป้องกัน Database พังเมื่อปิด Server
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  const prisma = require("./config/prisma");
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await prisma.$disconnect();
      logger.info("Prisma disconnected");
    } catch (err) {
      logger.error("Error during Prisma disconnect:", err);
    }
    process.exit(0);
  });
});

module.exports = app;
