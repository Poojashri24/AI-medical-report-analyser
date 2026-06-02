const Report = require("../models/Report");
const axios = require("axios");
const pdf = require("pdf-parse");
const fs = require("fs");

exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const pdfBuffer = fs.readFileSync(req.file.path);

    const pdfData = await pdf(pdfBuffer);

    const extractedText = pdfData.text;

    const report = await Report.create({
      user: req.user.id,
      fileName: req.file.filename,
      filePath: req.file.path,
      extractedText
    });

    // delete uploaded file after extraction
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: "Upload Success",
      report
    });

  } catch (error) {
    console.log(error);

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