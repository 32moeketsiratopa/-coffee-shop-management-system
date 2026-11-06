const orderRoutes = require("./routes/orderRoutes");
const express = require("express");
const cors = require("cors");

const app = express();

const menuRoutes = require("./routes/menuRoutes");
const authRoutes = require("./routes/authRoutes");

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
}));

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Coffee Shop API is running!"
  });
});

// Menu routes
app.use("/api/menu", menuRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

module.exports = app;
