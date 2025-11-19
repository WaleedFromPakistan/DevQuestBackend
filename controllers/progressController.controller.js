const User = require("../models/user.model");
const Badge = require("../models/badge.model");

// MAIN FUNCTION: Automatically update XP, Badge & Level
const updateUserProgress = async (userId) => {
  try {
    const user = await User.findById(userId).populate("badges");

    if (!user) return;

    // Get all badges from DB
    const allBadges = await Badge.find({}).sort({ criteriaValue: 1 });

    // CHECK XP → ASSIGN Badges
    for (let badge of allBadges) {
      const alreadyHas = user.badges.some((b) => b._id.equals(badge._id));

      if (!alreadyHas) {
        // XP-based badge unlocking
        if (badge.criteriaType === "xp" && user.xp >= badge.criteriaValue) {
          user.badges.push(badge._id);
        }
      }
    }

    // LEVEL UP LOGIC → if user has 3 badges
    if (user.badges.length >= 3) {
      user.level += 1;
      // Optional: badges reset
      // user.badges = [];
    }

    await user.save();
    console.log("User progress updated successfully!");

  } catch (error) {
    console.error("Progress Update Error:", error);
  }
};

module.exports = {
  updateUserProgress,
};
