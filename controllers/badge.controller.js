const Badge = require("../models/badge.model");
const User = require("../models/user.model");

// =======================================
// CREATE BADGE
// =======================================
exports.createBadge = async (req, res) => {
  try {
    const { title, description, icon, criteriaType, criteriaValue } = req.body;

    if (!title || !criteriaType || !criteriaValue) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const badge = await Badge.create({
      title,
      description,
      icon,
      criteriaType,
      criteriaValue,
    });

    return res.status(201).json({
      message: "Badge created successfully",
      badge,
    });
  } catch (error) {
    console.error("Create Badge Error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// =======================================
// GET ALL BADGES
// =======================================
exports.getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ createdAt: -1 });

    return res.status(200).json(badges);
  } catch (error) {
    console.error("Get Badges Error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// =======================================
// GET SINGLE BADGE BY ID
// =======================================
exports.getBadgeById = async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await Badge.findById(id);
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    return res.status(200).json(badge);
  } catch (error) {
    console.error("Get Badge Error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// =======================================
// UPDATE BADGE
// =======================================
exports.updateBadge = async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await Badge.findByIdAndUpdate(id, req.body, { new: true });

    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    return res.status(200).json({
      message: "Badge updated successfully",
      badge,
    });
  } catch (error) {
    console.error("Update Badge Error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// =======================================
// DELETE BADGE
// =======================================
exports.deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await Badge.findByIdAndDelete(id);

    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    return res.status(200).json({ message: "Badge deleted successfully" });
  } catch (error) {
    console.error("Delete Badge Error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// =======================================
// CHECK AND ASSIGN BADGES TO A USER
// =======================================
exports.checkAndAssignBadges = async (userId) => {
  try {
    const user = await User.findById(userId).populate("badges");
    if (!user) return;

    const badges = await Badge.find();

    for (const badge of badges) {
      let unlock = false;

      if (badge.criteriaType === "tasksCompleted") {
        unlock = user.tasksCompleted >= badge.criteriaValue;
      } else if (badge.criteriaType === "level") {
        unlock = user.level >= badge.criteriaValue;
      } else if (badge.criteriaType === "xp") {
        unlock = user.xp >= badge.criteriaValue;
      }

      if (unlock) {
        const alreadyHas = user.badges.some(
          (b) => b._id.toString() === badge._id.toString()
        );

        if (!alreadyHas) {
          user.badges.push(badge._id);
          console.log(`Badge Unlocked: ${badge.title} for user ${user.name}`);
        }
      }
    }

    await user.save();
  } catch (error) {
    console.error("Assign Badge Error:", error);
  }
};
