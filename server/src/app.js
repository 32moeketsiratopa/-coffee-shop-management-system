const orderRoutes = require("./routes/orderRoutes");
const express = require("express");
const cors = require("cors");

const app = express();

const menuRoutes = require("./routes/menuRoutes");
const authRoutes = require("./routes/authRoutes");

const allowedOrigins = [
  "http://localhost:5173",
  "https://coffee-shop-management-systems.vercel.app",
  "https://coffee-shop-management-systems-gm6rsfowj-max-3385.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
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
