const express = require("express");
const router = express.Router();

const {
  createProject,
  assignPM,
  acceptProject,
  startWorking,
  cancelProject,
  completeProject,    // ⭐ ADDED
  getAllProjects,
  getProjectById,
  getProjectsByUser
} = require("../controllers/project.controller");

const authMiddleware = require("../middleware/authMiddleware");

// -----------------------------
//  PROJECT ROUTES
// -----------------------------

// CLIENT → Create project
router.post("/create", authMiddleware, createProject);

// CLIENT → Assign PM
router.put("/:projectId/assign-pm", authMiddleware, assignPM);

// PM → Accept project
router.put("/:projectId/accept", authMiddleware, acceptProject);

// PM → Start working
router.put("/:projectId/start", authMiddleware, startWorking);

// CLIENT or PM → Cancel project
router.put("/:projectId/cancel", authMiddleware, cancelProject);

// PM → Complete project (XP Distribution + Progress Update Trigger)
router.put("/:projectId/complete", authMiddleware, completeProject);

// Get all projects (Admin/Client/PM)
router.get("/all", authMiddleware, getAllProjects);

// Get specific project details
router.get("/:projectId", authMiddleware, getProjectById);

// Get projects based on logged-in user role
router.get("/", authMiddleware, getProjectsByUser);

module.exports = router;
