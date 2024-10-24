const express = require("express");
const { verifyOtp, updateBookingStatus } = require("../controller/paymentController");

const router = express.Router();

// Route to verify OTP
router.post("/verify-otp", verifyOtp);

// Route to update booking status
router.put("/update-booking-status", updateBookingStatus);

module.exports = router;
