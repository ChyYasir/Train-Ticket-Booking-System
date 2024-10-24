const express = require("express");
const { createBooking, getAvailableSeats, getAllBookings } = require("../controller/bookingController"); // Import the createBooking function
const router = express.Router();

// Route to create a booking
router.post("/create", createBooking);
router.get('/available-seats', getAvailableSeats);
router.get('/allBooking', getAllBookings);

module.exports = router;
