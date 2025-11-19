const mongoose = require("mongoose");
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    // Task title
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // Task detailed description
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // The project to which this task belongs
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    // PM who created the task
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The developer assigned to this task
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Kanban status
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },

    // XP reward for this task
    xp: {
      type: Number,
      required: true,
      min: 0,
    },

    // Priority label
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Due date of the task
    deadline: {
      type: Date,
      default: null,
    },

    // When the task was completed
    completedAt: {
      type: Date,
      default: null,
    },

    // Attachments
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      }
    ],

    // Comments inside the task
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        message: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],

  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
