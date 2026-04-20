const Report = require("../models/Report");
const axios = require("axios");

exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Save initial report
    let report = await Report.create({
      user: req.user.id,
      fileName: req.file.filename,
      filePath: req.file.path
    });

    // Send file path to Python AI service
    const aiResponse = await axios.post(
      "http://localhost:8000/extract-text",
      {
        file_path: req.file.path
      }
    );

    const extractedText =
      aiResponse.data.text || "";

    // Update MongoDB with extracted text
    report.extractedText = extractedText;
    await report.save();

    res.status(201).json({
      message: "Upload + Extraction Success",
      report
    });

  } catch (error) {
    console.log(error.message);

    res.status(500).json({
      message: error.message
    });
  }
};
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      user: req.user.id
    }).sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};