const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    done: { type: Boolean, default: false },
    deadline: { type: Date },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);