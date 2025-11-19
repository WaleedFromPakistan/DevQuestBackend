const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    icon: {
      type: String,
      default: "", // URL or emoji
    },

    // Type of milestone
    criteriaType: {
      type: String,
      enum: ["tasksCompleted", "level", "xp"],
      required: true,
    },

    // Value needed to unlock badge
    criteriaValue: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);
