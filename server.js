// Step 1 import...
const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const { readdirSync } = require("fs"); //อ่านจากไดเรกทอรี่
const cors = require("cors"); //อนุญาตให้ server กับ clien ติดต่อกันได้่
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const equipmentRoutes = require("./routes/equipment");
const roomRoutes = require("./routes/room");
const ticketRoutes = require("./routes/ticket");
const appointmentRoutes = require("./routes/appointment");
// const googleCalendarRoutes = require("./routes/googleCalendar");
const itRoutes = require("./routes/it-support");
const notificationRoutes = require("./routes/notification");
const reportRoutes = require("./routes/report");

const adminRoutes = require("./routes/admin");

const personalTaskRoutes = require("./routes/personalTask");

//middleware
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
// app.use("/api", googleCalendarRoutes);
app.use("/api", itRoutes);
app.use("/api", notificationRoutes);
app.use("/api", reportRoutes);

app.use("/api", adminRoutes);

app.use("/api", personalTaskRoutes);
app.use("/api", require("./routes/quickFix"));

//Step 3 Router
// app.post('/api',(req,res)=>{
//     //code
//     const { username,password } = req.body
//     console.log(username,password)
//     res.send('test')
// })

// Cron Jobs
const initReminders = require("./cron/reminders");
initReminders();

// Socket.io Setup
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Update with your client URL
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Middleware to attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});

//Step 2 Start Server
server.listen(5001, () => console.log("Server is running on port 5001"));

