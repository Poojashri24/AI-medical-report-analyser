const express = require("express");
const router = express.Router();
const Chat = require("../models/chatModel");
const protect = require("../middleware/authMiddleware");

// Save chat
router.post("/", protect, async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer required",
      });
    }

    const chat = await Chat.create({
      user: req.user.id,
      question,
      answer,
    });

    res.status(201).json(chat);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
});

// Get chats
router.get("/", protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      user: req.user.id,
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;