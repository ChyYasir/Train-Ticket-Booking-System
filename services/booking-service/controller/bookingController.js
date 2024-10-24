const Booking = require("../model/bookingModel");
const redisClient = require('../config/redisClient');

const { trace } = require("@opentelemetry/api");
const tracer = trace.getTracer("booking-service"); // Initialize the tracer

// Function to create a new booking with tracing
const createBooking = async (req, res) => {
  const span = tracer.startSpan("createBooking", {
    attributes: { "function.name": "createBooking" },
  });

  const { userId, trainId, journeyDate, coach, seats, passengerDetails } = req.body;

  // Validate required fields
  if (!userId || !trainId || !journeyDate || !coach || !seats || !passengerDetails) {
    span.setAttribute("createBooking.status", "error");
    span.end();
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Start a child span for database operation
    const dbSpan = tracer.startSpan("saveBookingToDatabase", {
      parent: span,
      attributes: { "db.operation": "insert", "db.collection": "bookings" },
    });

    // Create a new booking
    const booking = await Booking.create({
      userId,
      trainId,
      journeyDate,
      coach,
      seats,
      passengerDetails,
    });

    dbSpan.end(); // End the child span

    span.setAttribute("createBooking.status", "success");
    res.status(201).json({
      message: "Booking created successfully",
      bookingId: booking.id,
    });
  } catch (err) {
    span.setAttribute("createBooking.status", "error");
    span.setAttribute("error.message", err.message);
    console.error("Error creating booking:", err);
    res.status(500).json({ message: "An error occurred while creating the booking" });
  } finally {
    span.end(); // End the span
  }
};

// Function to get available seats with tracing
const getAvailableSeats = async (req, res) => {
  const span = tracer.startSpan("getAvailableSeats", {
    attributes: { "function.name": "getAvailableSeats" },
  });

  const { trainId, journeyDate } = req.query;

  try {
    // Start a child span for Redis operation
    const redisSpan = tracer.startSpan("fetchSeatMapFromRedis", {
      parent: span,
      attributes: { "db.operation": "get", "db.system": "redis", "trainId": trainId },
    });

    // 1. Fetch the seat map from Redis
    const seatMap = await redisClient.get(`seatmap:${trainId}`);

    if (!seatMap) {
      redisSpan.end();
      span.setAttribute("getAvailableSeats.status", "error");
      span.end();
      return res.status(404).json({ message: 'Seat map not found for this train' });
    }

    redisSpan.end(); // End the Redis span

    const seatMapParsed = JSON.parse(seatMap); // Parse the seat map from Redis

    // Start a child span for database operation
    const dbSpan = tracer.startSpan("fetchBookingsFromDatabase", {
      parent: span,
      attributes: { "db.operation": "find", "db.collection": "bookings" },
    });

    // 2. Query existing bookings from the database
    const bookings = await Booking.findAll({
      where: {
        trainId,
        journeyDate,
      },
    });

    dbSpan.end(); // End the database span

    // 3. Extract booked seats from the bookings
    const bookedSeats = bookings.reduce((acc, booking) => {
      return acc.concat(booking.seats);
    }, []);

    // 4. Calculate seat availability and add "available" field
    seatMapParsed.coaches.forEach(coach => {
      coach.seats.forEach(seat => {
        seat.available = !bookedSeats.includes(seat.seatId); // If the seat is not booked, it's available
      });
    });

    span.setAttribute("getAvailableSeats.status", "success");
    res.json(seatMapParsed);

  } catch (error) {
    span.setAttribute("getAvailableSeats.status", "error");
    span.setAttribute("error.message", error.message);
    console.error('Error fetching seat availability:', error);
    res.status(500).json({ message: 'An error occurred while fetching seat availability' });
  } finally {
    span.end(); // End the span
  }
};

// Function to get all bookings with tracing
const getAllBookings = async (req, res) => {
  const span = tracer.startSpan("getAllBookings", {
    attributes: { "function.name": "getAllBookings" },
  });

  try {
    // Start a child span for database operation
    const dbSpan = tracer.startSpan("fetchAllBookingsFromDatabase", {
      parent: span,
      attributes: { "db.operation": "findAll", "db.collection": "bookings" },
    });

    // Fetch all bookings from the database
    const bookings = await Booking.findAll();

    dbSpan.end(); // End the child span

    if (bookings.length === 0) {
      span.setAttribute("getAllBookings.status", "no_bookings_found");
      span.end();
      return res.status(404).json({ message: 'No bookings found' });
    }

    span.setAttribute("getAllBookings.status", "success");
    // Return the list of bookings
    res.json(bookings);
  } catch (error) {
    span.setAttribute("getAllBookings.status", "error");
    span.setAttribute("error.message", error.message);
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'An error occurred while fetching all bookings' });
  } finally {
    span.end(); // End the span
  }
};

module.exports = {
  createBooking,
  getAvailableSeats,
  getAllBookings,
};
