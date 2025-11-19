const express = require("express");
const router = express.Router();

// Correct controller import
const {
  createTask,
  editTask,
  acceptTask,
  startTask,
  submitForReview,
  completeTask,
  getTasksByProject,
  getTaskById
} = require("../controllers/task.controller.js");

// Correct middleware import (NOT destructured)
const authMiddleware = require("../middleware/authMiddleware");

// TASK ROUTES (Protected)

// PM → Create task
router.post("/create", authMiddleware, createTask);

// PM → Edit task
router.put("/edit/:taskId", authMiddleware, editTask);

// Developer → Accept assigned task
router.put("/accept/:taskId", authMiddleware, acceptTask);

// Developer → Move task to "in-progress"
router.put("/start/:taskId", authMiddleware, startTask);

// Developer → Submit task for review
router.put("/review/:taskId", authMiddleware, submitForReview);

// PM → Complete Task
router.put("/complete/:taskId", authMiddleware, completeTask);

// Get all tasks of a project
router.get("/project/:projectId", authMiddleware, getTasksByProject);

// Get single task
router.get("/:taskId", authMiddleware, getTaskById);

module.exports = router;
