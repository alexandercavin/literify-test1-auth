const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamificationController");

router.post("/points", gamificationController.awardPoints);
router.post("/achievement", gamificationController.addAchievement);

module.exports = router; // Export the router correctly
