const Report = require("../models/Report");
const fs = require("fs");

exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    const report = await Report.create({
      user: req.user.id,
      fileName: req.file.filename,
      filePath: req.file.path,
      extractedText: "Medical report uploaded successfully"
    });

    // Delete uploaded file after saving report info
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

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