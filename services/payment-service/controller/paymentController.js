const axios = require("axios");
const redisClient = require("../config/redisClient");
const dotenv = require("dotenv");
dotenv.config(); 
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || "http://localhost:3331";

// Function to verify OTP
exports.verifyOtpAndUpdateBooking = async (req, res) => {
  const { bookingId, otp } = req.body; // Get bookingId and otp from request body

  try {
    // Step 1: Verify OTP in Redis
    const storedOtp = await redisClient.get(`otp:${bookingId}`);
    
    if (!storedOtp) {
      return res.status(400).json({ message: 'OTP has expired or is invalid.' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Step 2: OTP is valid, now update the booking status to "Confirmed"
    const response = await axios.put(`${BOOKING_SERVICE_URL}/${bookingId}`, {
      status: 'Confirmed',
    });

    if (response.status === 200) {
      // Remove the OTP from Redis after successful verification
      await redisClient.del(`otp:${bookingId}`);

      return res.json({ message: 'OTP verified and booking status updated to Confirmed.' });
    } else {
      return res.status(400).json({ message: 'Failed to update booking status.' });
    }

  } catch (error) {
    console.error('Error verifying OTP or updating booking status:', error);
    return res.status(500).json({ message: 'An error occurred while verifying OTP or updating booking status.' });
  }
};



// Function to update booking status
exports.updateBookingStatus = async (req, res) => {
  
  const { bookingId, status } = req.body;

  try {
    // Make a request to the booking service to update the booking status
    // const status = "Confirmed";
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
