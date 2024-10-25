const express = require("express");
const { updateBookingStatus,getBookingById,createBooking, getAvailableSeats, getAllBookings } = require("../controller/bookingController"); // Import the createBooking function
const router = express.Router();

// Route to create a booking
router.post("/create", createBooking);
router.get('/available-seats', getAvailableSeats);
router.get('/allBooking', getAllBookings);
router.get('/:bookingId', getBookingById);
router.put('/:bookingId', updateBookingStatus);

module.exports = router;
