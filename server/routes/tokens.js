const express = require("express");
const DeviceToken = require("../models/DeviceToken");
const { getMessaging } = require("../firebaseAdmin");

const router = express.Router();

// POST /api/tokens - save a browser's token
router.post("/", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    await DeviceToken.updateOne({ token }, { token }, { upsert: true });
    res.status(201).json({ message: "Token saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tokens/test - send a test notification to every saved browser
router.post("/test", async (req, res) => {
  try {
    const docs = await DeviceToken.find();
    const tokens = docs.map((d) => d.token);
    if (tokens.length === 0) {
      return res.status(404).json({ error: "No tokens saved yet" });
    }

    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "Task Manager",
        body: "Test reminder: your notifications work!",
      },
    });

    res.json({ sent: result.successCount, failed: result.failureCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;