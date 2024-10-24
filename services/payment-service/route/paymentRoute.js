const express = require("express");
const { updateBookingStatus, verifyOtpAndUpdateBooking } = require("../controller/paymentController");

const router = express.Router();

// Route to verify OTP
router.post("/verify-otp", verifyOtpAndUpdateBooking);

// Route to update booking status
router.put("/update-booking-status", updateBookingStatus);

module.exports = router;
