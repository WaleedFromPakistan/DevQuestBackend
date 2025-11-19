const Task = require("../models/task.model");
const Project = require("../models/project.model");
const User = require("../models/user.model");

const { updateUserProgress } = require("../controllers/progressController.controller.js");

/* ============================================================
   1. PM → CREATE TASK  (UPDATED WITH PROJECT SYNC)
============================================================ */
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      assignedTo,
      xp,
      priority,
      deadline,
    } = req.body;

    const pmId = req.user.id;

    if (!title || !project || xp === undefined) {
      return res.status(400).json({
        message: "Title, project and XP are required.",
      });
    }

    // Validate project exists
    const projectData = await Project.findById(project);
    if (!projectData)
      return res.status(404).json({ message: "Project not found." });

    // Only PM can create tasks
    if (projectData.pm.toString() !== pmId) {
      return res.status(403).json({
        message: "Only assigned PM can create tasks.",
      });
    }

    // 🛑 XP must not exceed project XP budget
    if (xp > projectData.xpBudget) {
      return res.status(400).json({
        message: `Task XP (${xp}) cannot exceed project XP budget (${projectData.xpBudget}).`,
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      project,
      assignedTo,
      createdBy: pmId,
      xp,
      priority,
      deadline,
      status: "assigned",
    });

    // ⭐ Update project stats
    projectData.totalTasks += 1;
    projectData.recalculateProgress();
    await projectData.save();

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (err) {
    console.error("Create Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   2. PM → EDIT TASK (XP, Developer, Description)
============================================================ */
exports.editTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const pmId = req.user.id;

    const task = await Task.findById(taskId).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found." });

    // Only PM can edit
    if (task.project.pm.toString() !== pmId) {
      return res.status(403).json({ message: "Only PM can edit tasks." });
    }

    // XP validation
    if (updates.xp !== undefined) {
      if (updates.xp > task.project.xpBudget) {
        return res.status(400).json({
          message: `Updated XP (${updates.xp}) cannot exceed project XP budget (${task.project.xpBudget}).`,
        });
      }
    }

    Object.assign(task, updates);
    await task.save();

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (err) {
    console.error("Edit Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3. DEVELOPER → ACCEPT ASSIGNED TASK
============================================================ */
exports.acceptTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (task.assignedTo.toString() !== userId) {
      return res.status(403).json({
        message: "You cannot accept a task not assigned to you.",
      });
    }

    task.status = "accepted";
    await task.save();

    res.status(200).json({
      message: "Task accepted successfully",
      task,
    });
  } catch (err) {
    console.error("Accept Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. DEV → MOVE TASK TO IN-PROGRESS
============================================================ */
exports.startTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (task.assignedTo.toString() !== userId)
      return res.status(403).json({ message: "Not your task." });

    task.status = "in_progress";
    await task.save();

    res.status(200).json({
      message: "Task started.",
      task,
    });
  } catch (err) {
    console.error("Start Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5. DEV → SUBMIT TASK FOR REVIEW
============================================================ */
exports.submitForReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (task.assignedTo.toString() !== userId)
      return res.status(403).json({ message: "Not your task." });

    task.status = "review";
    await task.save();

    res.status(200).json({
      message: "Task submitted for review.",
      task,
    });
  } catch (err) {
    console.error("Review Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6. PM → APPROVE TASK (DONE) + GIVE XP + PROJECT SYNC
============================================================ */
exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const pmId = req.user.id;

    const task = await Task.findById(taskId).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found." });

    // Only PM can approve
    if (task.project.pm.toString() !== pmId) {
      return res.status(403).json({
        message: "Only PM can mark task as complete.",
      });
    }

    // Mark task as done
    task.status = "done";
    task.completedAt = new Date();
    await task.save();

    /* ------------------------------------------------------------
       UPDATE PROJECT PROGRESS
    -------------------------------------------------------------*/
    const project = await Project.findById(task.project._id);

    project.completedTasks += 1;
    project.recalculateProgress();     // auto-updates percent + status
    await project.save();


    /* ------------------------------------------------------------
       GIVE XP TO DEVELOPER → THEN UPDATE BADGES & LEVEL
    -------------------------------------------------------------*/
    if (task.assignedTo) {
      const dev = await User.findById(task.assignedTo);

      // Add XP from task
      dev.xp += task.xp;
      await dev.save();

      // ⭐ CALL progress controller for badge + level logic
      await updateUserProgress(dev._id);
    }


    return res.status(200).json({
      message: "Task marked as complete successfully.",
      task,
    });

  } catch (err) {
    console.error("Complete Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ============================================================
   7. GET ALL TASKS OF A PROJECT
============================================================ */
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Get Tasks Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   8. GET SINGLE TASK
============================================================ */
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project");

    if (!task) return res.status(404).json({ message: "Task not found." });

    res.status(200).json(task);
  } catch (err) {
    console.error("Get Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
