require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./Routes/userRoutes");
const equipmentRoutes = require("./Routes/equipmentRoutes");
const allocationRoutes = require("./Routes/allocationRoutes");
const tournamentRoutes = require("./Routes/tournamentRoutes");
const registrationRoutes = require("./Routes/registrationRoutes");
const paymentRoutes = require("./Routes/paymentRoutes");
const path = require("path");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/payments", paymentRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});