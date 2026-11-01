const cron = require("node-cron");
const Task = require("./models/Task");
const DeviceToken = require("./models/DeviceToken");
const { getMessaging } = require("./firebaseAdmin");

async function checkDeadlines() {
  try {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Not done, not yet reminded, deadline within 24 hours (or already passed)
    const tasks = await Task.find({
      done: false,
      reminderSent: { $ne: true },
      deadline: { $lte: soon },
    });
    if (tasks.length === 0) return;

    const docs = await DeviceToken.find();
    const tokens = docs.map((d) => d.token);
    if (tokens.length === 0) return;

    for (const task of tasks) {
      const result = await getMessaging().sendEachForMulticast({
        tokens,
        notification: {
          title: "Task reminder",
          body: `"${task.title}" is due soon`,
        },
      });

      // Remove tokens that Firebase says no longer exist
      result.responses.forEach((r, i) => {
        if (r.error?.code === "messaging/registration-token-not-registered") {
          DeviceToken.deleteOne({ token: tokens[i] }).catch(() => {});
        }
      });

      task.reminderSent = true;
      await task.save();
      console.log(`Reminder sent for: ${task.title}`);
    }
  } catch (err) {
    console.error("Reminder check failed:", err.message);
  }
}

function startReminders() {
  // Runs at the start of every hour
  cron.schedule("0 * * * *", checkDeadlines);
  console.log("Reminder job started");
}

module.exports = startReminders;