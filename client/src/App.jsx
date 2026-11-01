import { enableNotifications } from "./firebase";
import { useState, useEffect } from "react";
import "./App.css";

const TASKS_URL = "http://localhost:5000/api/tasks";
const PROJECTS_URL = "http://localhost:5000/api/projects";

function formatDate(dateString) {
  if (!dateString) return "No deadline";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(task) {
  if (!task.deadline || task.done) return false;
  return new Date(task.deadline) < new Date();
}

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // null = All Projects
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [deadline, setDeadline] = useState("");

  // Load projects once
  useEffect(() => {
    fetch(PROJECTS_URL)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("Failed to load projects:", err));
  }, []);

  // Load tasks on start, and again whenever the selected project changes
  useEffect(() => {
    const url = selectedId ? `${TASKS_URL}?project=${selectedId}` : TASKS_URL;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Failed to load tasks:", err));
  }, [selectedId]);

  async function addProject() {
    const name = window.prompt("Project name?");
    if (!name || !name.trim()) return;

    const res = await fetch(PROJECTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const newProject = await res.json();

    setProjects([...projects, newProject]);
    setSelectedId(newProject._id);
  }

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const body = { title, priority };
    if (deadline) body.deadline = deadline;
    if (selectedId) body.project = selectedId;

    const res = await fetch(TASKS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const newTask = await res.json();

    setTasks([newTask, ...tasks]);
    setTitle("");
    setDeadline("");
  }

  async function toggleDone(task) {
    const res = await fetch(`${TASKS_URL}/${task._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    const updated = await res.json();
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
  }

  async function deleteTask(id) {
    await fetch(`${TASKS_URL}/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t) => t._id !== id));
  }

  const selectedProject = projects.find((p) => p._id === selectedId);
  const heading = selectedProject ? selectedProject.name : "All Projects";

  async function handleEnableReminders() {
  try {
    const token = await enableNotifications();
    if (!token) {
      alert("Notification permission was not granted.");
      return;
    }

    await fetch("http://localhost:5000/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    alert("Reminders enabled and saved!");
  } catch (err) {
    console.error("Could not enable notifications:", err);
    alert("Something went wrong. Check the console.");
  }
}

  return (
    <div className="layout">
      <aside className="sidebar">
        <p className="sidebar-label">Projects</p>

        {projects.map((project) => (
          <button
            key={project._id}
            className={`sidebar-item ${selectedId === project._id ? "active" : ""}`}
            onClick={() => setSelectedId(project._id)}
          >
            {project.name}
          </button>
        ))}

        <button
          className={`sidebar-item ${selectedId === null ? "active" : ""}`}
          onClick={() => setSelectedId(null)}
        >
          All Projects
        </button>

        <button className="new-project-btn" onClick={addProject}>
          + New Project
        </button>
        <button className="new-project-btn" onClick={handleEnableReminders}>
          🔔 Enable reminders
        </button>
      </aside>

      <main className="app">
        <h1>{heading}</h1>

        <form onSubmit={addTask} className="add-form">
          <input
            type="text"
            placeholder="New task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Done</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td className={task.done ? "done" : ""}>{task.title}</td>
                  <td>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className={isOverdue(task) ? "overdue" : ""}>
                    {formatDate(task.deadline)}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleDone(task)}
                    />
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteTask(task._id)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <p className="empty">No tasks yet. Add one above.</p>}
        </div>
      </main>
    </div>
  );
}

export default App;