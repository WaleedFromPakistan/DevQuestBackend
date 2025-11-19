const Project = require("../models/project.model");
const User = require("../models/user.model");
const { updateUserProgress } = require("../controllers/progressController.controller");

/* ============================================================
   HELPER: XP DISTRIBUTION WHEN PROJECT COMPLETES
============================================================ */
const awardXPOnProjectCompletion = async (project) => {
  try {
    const xpPerUser = project.xpPerTask || 50; // default fallback XP

    let userIds = [];

    // Add PM
    if (project.pm) userIds.push(project.pm);

    // Add developers
    if (project.members.length > 0) {
      userIds = [...userIds, ...project.members];
    }

    // Add XP to each user & trigger progress update
    for (let id of userIds) {
      const user = await User.findById(id);

      if (!user) continue;

      user.xp += xpPerUser;

      await user.save();
      await updateUserProgress(user._id);
    }
  } catch (err) {
    console.error("XP Distribution Error:", err);
  }
};

/* ============================================================
   1. CLIENT → CREATE PROJECT
============================================================ */
exports.createProject = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      pm, 
      deadline, 
      tags, 
      xpBudget,
      xpPerTask 
    } = req.body;

    const client = req.user.id;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const newProject = await Project.create({
      title,
      description,
      client,
      pm,
      deadline,
      tags,
      xpBudget,
      xpPerTask
    });

    res.status(201).json({
      message: "Project created successfully.",
      project: newProject,
    });

  } catch (err) {
    console.error("Create Project Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   2. ASSIGN PM
============================================================ */
exports.assignPM = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { pmId } = req.body;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.pm = pmId;
    project.status = "assigned";
    await project.save();

    res.status(200).json({
      message: "PM assigned successfully.",
      project,
    });

  } catch (err) {
    console.error("Assign PM Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   3. PM → ACCEPT PROJECT
============================================================ */
exports.acceptProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "accepted";
    await project.save();

    res.status(200).json({
      message: "Project accepted.",
      project,
    });

  } catch (err) {
    console.error("Accept Project Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   4. PM → START WORKING
============================================================ */
exports.startWorking = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "working";
    await project.save();

    res.status(200).json({
      message: "`Working` state started.",
      project,
    });

  } catch (err) {
    console.error("Start Working Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   5. CANCEL PROJECT
============================================================ */
exports.cancelProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "cancelled";
    await project.save();

    res.status(200).json({
      message: "Project cancelled.",
      project,
    });

  } catch (err) {
    console.error("Cancel Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   6. COMPLETE PROJECT → AWARD XP + UPDATE PROGRESS
============================================================ */
exports.completeProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "completed";
    project.completedAt = new Date();
    await project.save();

    // 🎉 Award XP to PM + Developers
    await awardXPOnProjectCompletion(project);

    res.status(200).json({
      message: "Project completed! XP awarded.",
      project,
    });

  } catch (err) {
    console.error("Complete Project Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   7. Get All Projects
============================================================ */
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate("client", "name email")
      .populate("pm", "name email")
      .populate("members", "name email");

    res.status(200).json(projects);

  } catch (err) {
    console.error("Get All Projects Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   8. Get Project By ID
============================================================ */
exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("client", "name email")
      .populate("pm", "name email")
      .populate("members", "name email");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(project);

  } catch (err) {
    console.error("Get Project Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

/* ============================================================
   9. Get Projects By User Role
============================================================ */
exports.getProjectsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let projects = [];

    if (user.role === "client") {
      projects = await Project.find({ client: userId });

    } else if (user.role === "pm") {
      projects = await Project.find({ pm: userId });

    } else if (user.role === "developer") {
      projects = await Project.find({ members: userId });
    }

    res.status(200).json(projects);

  } catch (err) {
    console.error("User Projects Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
