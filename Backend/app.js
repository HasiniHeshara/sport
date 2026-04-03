require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const userRoutes = require("./Routes/userRoutes");
const equipmentRoutes = require("./Routes/equipmentRoutes");
const allocationRoutes = require("./Routes/allocationRoutes");
const tournamentRoutes = require("./Routes/tournamentRoutes");
const participantRoutes = require("./Routes/participantRoutes");
const registrationRoutes = require("./Routes/registrationRoutes");
const paymentRoutes = require("./Routes/paymentRoutes");
const notificationRoutes = require("./Routes/notificationRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const matchDrawRoutes = require("./Routes/matchDrawRoutes");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api", participantRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api", matchDrawRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});