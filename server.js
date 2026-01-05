// Step 1 import...
const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const { readdirSync } = require("fs"); //อ่านจากไดเรกทอรี่
const cors = require("cors"); //อนุญาตให้ server กับ clien ติดต่อกันได้่
const categoryRoutes = require("./routes/category");
// const authRouter = require('./routes/auth')
// const categoryRouter = require('./routes/category')

//middleware
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(cors());

// app.use('/api',authRouter)
// app.use('/api',categoryRouter)
readdirSync("./routes").map((c) => app.use("/api", require("./routes/" + c)));

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

