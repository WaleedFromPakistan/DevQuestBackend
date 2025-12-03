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
  getTaskById,
  getAllTasks,
  deleteTask,
  getTasksByProjectManager,
  getTasksByDeveloper
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

router.get("/all", authMiddleware, getAllTasks);

//Delete Tasks
router.delete(
  "/:taskId",
  authMiddleware, // Ensure user is logged in
  deleteTask // The new controller function
);

// Get all tasks of a project
router.get("/project/:projectId", authMiddleware, getTasksByProject);

// Get single task
router.get("/:taskId", authMiddleware, getTaskById);

router.get("/pm/:pmId", authMiddleware, getTasksByProjectManager);
router.get("/dev/:devId", authMiddleware,getTasksByDeveloper);

module.exports = router;
