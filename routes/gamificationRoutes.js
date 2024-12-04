const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamificationController");

router.post("/points", gamificationController.awardPoints);
router.post("/achievement", gamificationController.addAchievement);
router.get("/leaderboards", gamificationController.getLeaderboard);
router.post("/rankup", gamificationController.incrementScore);

module.exports = router; // Export the router correctly
