const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { chatWithReport } = require("../controllers/chatController");

router.post("/", auth, chatWithReport);

module.exports = router;