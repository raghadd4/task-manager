const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");

const router = express.Router();

// GET /api/projects - list all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects - create a project
router.post("/", async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/projects/:id - delete a project and its tasks
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: "Project and its tasks deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;