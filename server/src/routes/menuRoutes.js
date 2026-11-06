
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
  getMenu,
  getMenuItem,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controllers/menuController");

// Public routes
router.get("/", getMenu);
router.get("/:id", getMenuItem);

// Staff-only routes
router.post("/", authenticateToken, addMenuItem);
router.put("/:id", authenticateToken, updateMenuItem);
router.delete("/:id", authenticateToken, deleteMenuItem);

module.exports = router;
