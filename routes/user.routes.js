const express = require("express");
const router = express.Router();

// Import controllers (works because you used module.exports)
const { registerUser, loginUser, getMe } = require("../controllers/user.controller.js");

// Import middleware (with require)
const authMiddleware = require("../middleware/authMiddleware.js");

// ===========================
// AUTH ROUTES
// ===========================

// Register new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get logged-in user details
router.get("/me", authMiddleware, getMe);

// Correct export
module.exports = router;
