const express = require("express");
const {
  register,
  login,
  refreshToken,
  deleteUser,
  getUserInfo
} = require("../controller/userController");

const router = express.Router();

// routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});
router.delete("/:userId", deleteUser);
router.get("/:userId", getUserInfo);
module.exports = router;
