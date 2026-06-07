const Report = require("../models/Report");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    // Send file to AI Service
    const formData = new FormData();

    formData.append(
      "file",
      fs.createReadStream(req.file.path)
    );

    const aiResponse = await axios.post(
      "https://mediassist-ai-6r19.onrender.com/extract-text",
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    const extractedText =
      aiResponse.data.text || "";

    const report = await Report.create({
      user: req.user.id,
      fileName: req.file.filename,
      filePath: req.file.path,
      extractedText
    });

    // Delete uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      message: "Upload Success",
      report
    });

  } catch (error) {

    console.log(error.response?.data || error);

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