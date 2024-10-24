const express = require("express");
const {
  register,
  login,
  refreshToken,
} = require("../controller/userController");

const router = express.Router();

// routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});
module.exports = router;
