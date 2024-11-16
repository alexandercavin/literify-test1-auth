const express = require("express");
const router = express.Router();
const oauthController = require("../controllers/oauth2Controller")
const authController = require("../controllers/authController")

router.get("/google", oauthController.googleLogin)
router.get("/google/callback", oauthController.googleCallbackLogin);

router.post("/login", authController.loginUser);
module.exports = router;