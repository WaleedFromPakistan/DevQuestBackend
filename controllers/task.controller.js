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
      projectId,
      assignedTo,
      xp,
      priority,
      deadline,
    } = req.body;

    const pmId = req.user.id;

    if (!title || !projectId || xp === undefined) {
      return res.status(400).json({
        message: "Title, projectId and XP are required.",
      });
    }

    // Validate project exists
    const projectData = await Project.findById(projectId);
    if (!projectData)
      return res.status(404).json({ message: "Project not found." });

    // // Only PM can create tasks
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
      projectId,
      assignedTo,
      createdBy: pmId,
      xp,
      priority,
      deadline,
      status: "assigned",
    });

    // ⭐ Update project stats
    // projectData.totalTasks += 1;
    // projectData.recalculateProgress();
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

    const task = await Task.findById(taskId).populate("projectId");
    if (!task) return res.status(404).json({ message: "Task not found." });

    // Only PM can edit
    if (task.createdBy.toString() !== pmId) {
      return res.status(403).json({ message: "Only PM can edit tasks." });
    }

    // XP validation
    // if (updates.xp !== undefined) {
    //   if (updates.xp > task.project.xpBudget) {
    //     return res.status(400).json({
    //       message: `Updated XP (${updates.xp}) cannot exceed project XP budget (${task.project.xpBudget}).`,
    //     });
    //   }
    // }

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


/* ============================================================
   NEW →  GET ALL TASKS  (Admin / PM Dashboard)
============================================================ */
exports.getAllTasks = async (req, res) => {
  try {
    let { page = 1, limit = 20, status, projectId, assignedTo, sort } = req.query;
    
    page = Number(page);
    limit = Number(limit);

    // Filters
    const filter = {};

    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Sorting
    const sortOptions = {};
    if (sort === "latest") sortOptions.createdAt = -1;
    if (sort === "oldest") sortOptions.createdAt = 1;
    if (sort === "xp-high") sortOptions.xp = -1;
    if (sort === "xp-low") sortOptions.xp = 1;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "title")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Task.countDocuments(filter);

    return res.status(200).json({
      total,
      page,
      pages: Math.ceil(total / limit),
      tasks
    });

  } catch (err) {
    console.error("Get All Tasks Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   9. PM → DELETE TASK
   Compatible with frontend hook: deleteTask
============================================================ */
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const pmId = req.user.id; // Currently authenticated user

    // 1. Find the task and populate its project details
    const task = await Task.findById(taskId).populate("projectId");
    
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // 2. Authorization Check: Only the PM of the project can delete
    if (task.createdBy.toString() !== pmId) {
      console.log("The createdBy Id" , task.createdBy.toString());
      console.log("the pmId", pmId);
      return res.status(403).json({
        message: "Only the assigned PM can delete tasks.",
      });
    }

    // 3. Delete the task
    await Task.deleteOne({ _id: taskId });

    // 4. Update project stats (Decrement total tasks)
    const project = await Project.findById(task.projectId);
    
    // Safety check - though project should exist
    if (project) {
        // Decrease task count
        // project.totalTasks -= 1; 
        // Note: You should call a method like recalculateProgress
        // or ensure totalTasks is correctly managed based on your Project model logic.
        // Assuming your Project model has logic to handle this, let's save the project.
        // For a full solution, Project model may need to recalculate total tasks from DB.
        
        // **⭐ Suggested best practice: Implement a Project method to sync stats**
        if (typeof project.syncStats === 'function') {
            await project.syncStats(); 
        } else {
             // Fallback: If not implemented, just save if other properties might be linked.
             // For a pure delete, saving might not be strictly necessary unless stats need recalculation.
             // We'll proceed assuming Project model handles totalTasks count implicitly 
             // or via a method like syncStats/recalculateProgress.
        }
        
    }


    // 5. Success Response
    res.status(200).json({
      message: "Task deleted successfully.",
      taskId, // Return the ID for frontend confirmation
    });

  } catch (err) {
    console.error("Delete Task Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};