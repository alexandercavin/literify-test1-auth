const express = require("express");
const router = express.Router();
const gamificationConteroller = require("../controllers/gamificationController")

router.post("/points", gamificationConteroller.awardPoints);
router.post("/achievement", gamificationConteroller.addAchievement);