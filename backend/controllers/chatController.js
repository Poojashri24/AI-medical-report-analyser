const axios = require("axios");
const Report = require("../models/Report");

exports.chatWithReport = async (req, res) => {
  try {
    const { question } = req.body;

    const latestReport = await Report.findOne({
      user: req.user.id
    }).sort({ createdAt: -1 });

    if (!latestReport) {
      return res.status(404).json({
        message: "No report found"
      });
    }

    const aiResponse = await axios.post(
      "http://localhost:8000/chat",
      {
        report_text: latestReport.extractedText,
        question
      }
    );

    res.json({
      answer: aiResponse.data.answer
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};