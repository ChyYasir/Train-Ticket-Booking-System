const axios = require("axios");
const redisClient = require("../config/redisClient");
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || "http://localhost:3330";

// Function to verify OTP
exports.verifyOtp = async (req, res) => {
  const { bookingId, otp } = req.body;

  try {
    // Fetch OTP from Redis
    const storedOtp = await redisClient.get(`otp:${bookingId}`);

    if (storedOtp === otp) {
      res.json({ message: "OTP verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

// Function to update booking status
exports.updateBookingStatus = async (req, res) => {
  const { bookingId, status } = req.body;

  try {
    // Make a request to the booking service to update the booking status
    const response = await axios.put(`${BOOKING_SERVICE_URL}/${bookingId}`, { status });

    if (response.status === 200) {
      res.json({ message: "Booking status updated successfully" });
    } else {
      res.status(400).json({ message: "Failed to update booking status" });
    }
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Error updating booking status" });
  }
};
