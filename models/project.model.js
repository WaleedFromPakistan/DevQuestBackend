const mongoose = require("mongoose");
const { Schema } = mongoose;

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // The client who owns the project
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The Project Manager assigned by client
    pm: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Developers involved in this project
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    ],

    // NEW status according to your requirement
    status: {
      type: String,
      enum: ["assigned", "accepted", "working", "completed", "cancelled"],
      default: "assigned",
    },

    // Useful for timeline tracking
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    completedAt: { type: Date },

    // Project progress
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    percentComplete: { type: Number, default: 0 },

    // Tags like: frontend, backend, urgent, etc.
    tags: [{ type: String, trim: true }],

    // Files or attachments
    attachments: [
      {
        name: String,
        url: String,
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      }
    ],

    // Client settings
    settings: {
      allowClientComments: { type: Boolean, default: true },
      notifyOnTaskAssigned: { type: Boolean, default: true },
    },

    // OPTIONAL: Used before for total XP budget
    xpBudget: { type: Number, default: 0 },

    // ⭐ NEW FIELD → XP points defined by client
    projectXp: {
      type: Number,
      default: 0,          // if client does not set, default = 0
      min: 0,
    },

  },
  { timestamps: true }
);

// Calculate % progress
projectSchema.methods.recalculateProgress = function () {
  if (this.totalTasks === 0) {
    this.percentComplete = 0;
  } else {
    this.percentComplete = Math.round(
      (this.completedTasks / this.totalTasks) * 100
    );
  }

  if (this.percentComplete === 100 && this.status !== "completed") {
    this.status = "completed";
    this.completedAt = new Date();
  }

  return this.percentComplete;
};

module.exports = mongoose.model("Project", projectSchema);
