const Booking = require("../model/bookingModel");
const redisClient = require('../config/redisClient');
const { Sequelize } = require("sequelize"); 
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
    // Step 1: Check if the requested seats are already booked
    const bookedSeats = await Booking.findAll({
      where: {
        trainId,
        journeyDate,
        coach,
        seats: {
          [Sequelize.Op.overlap]: seats, // Check if any of the requested seats overlap with already booked seats
        },
      },
    });

    if (bookedSeats.length > 0) {
      // If any of the requested seats are already booked, return an error
      span.setAttribute("createBooking.status", "seats_already_booked");
      span.end();
      return res.status(409).json({ message: "One or more of the requested seats are already booked." });
    }

    // Start a child span for database operation
    const dbSpan = tracer.startSpan("saveBookingToDatabase", {
      parent: span,
      attributes: { "db.operation": "insert", "db.collection": "bookings" },
    });

    // Step 2: Create a new booking in PostgreSQL if seats are available
    const booking = await Booking.create({
      userId,
      trainId,
      journeyDate,
      coach,
      seats,
      passengerDetails,
    });

    dbSpan.end(); // End the child span for DB operation

    // Step 3: Calculate TTL for Redis based on journeyDate
    const currentTime = new Date();
    const journeyTime = new Date(journeyDate);
    const ttl = Math.floor((journeyTime - currentTime) / 1000);  // TTL in seconds

    if (ttl > 0) {
      // Store the booking in Redis with expiration based on journeyDate
      await redisClient.set(
        `booking:${trainId}:${journeyDate}`, 
        JSON.stringify(booking), 
        'EX', 
        ttl  // Set TTL (time-to-live)
      );
    }

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
    const redisSpan = tracer.startSpan("fetchBookingsFromRedis", {
      parent: span,
      attributes: { "db.operation": "get", "db.system": "redis", "trainId": trainId },
    });

    // 1. Fetch the booking data from Redis
    const bookingFromRedis = await redisClient.get(`booking:${trainId}:${journeyDate}`);

    if (bookingFromRedis) {
      redisSpan.end();
      console.log("Booking found in Redis.");
      const bookings = [JSON.parse(bookingFromRedis)];
      
      // Check seat availability with Redis data
      return calculateAvailableSeats(bookings, trainId, journeyDate, res);
    }

    redisSpan.end(); // End the Redis span
    console.log("Booking not found in Redis. Falling back to PostgreSQL.");

    // Start a child span for PostgreSQL operation
    const dbSpan = tracer.startSpan("fetchBookingsFromDatabase", {
      parent: span,
      attributes: { "db.operation": "find", "db.collection": "bookings" },
    });

    // 2. Fetch bookings from PostgreSQL as a fallback
    const bookingsFromDB = await Booking.findAll({
      where: {
        trainId,
        journeyDate,
      },
    });

    dbSpan.end(); // End the PostgreSQL span

    // If there are bookings, store them back in Redis for future use
    if (bookingsFromDB.length > 0) {
      const ttl = Math.floor((new Date(journeyDate) - new Date()) / 1000);
      if (ttl > 0) {
        await redisClient.set(
          `booking:${trainId}:${journeyDate}`,
          JSON.stringify(bookingsFromDB),
          'EX',
          ttl  // Set TTL (time-to-live)
        );
      }
    }

    // Check seat availability with PostgreSQL data
    return calculateAvailableSeats(bookingsFromDB, trainId, journeyDate, res);

  } catch (error) {
    span.setAttribute("getAvailableSeats.status", "error");
    span.setAttribute("error.message", error.message);
    console.error('Error fetching seat availability:', error);
    res.status(500).json({ message: 'An error occurred while fetching seat availability' });
  } finally {
    span.end(); // End the span
  }
};

// Helper function to calculate seat availability and return response
const calculateAvailableSeats = async (bookings, trainId, journeyDate, res) => {
  try {
    // 1. Fetch seat map from Redis for that train
    const seatMap = await redisClient.get(`seatmap:${trainId}`);
    
    if (!seatMap) {
      return res.status(404).json({ message: 'Seat map not found for this train' });
    }

    const seatMapParsed = JSON.parse(seatMap);
    
    // 2. Extract booked seats from the bookings
    const bookedSeats = bookings.reduce((acc, booking) => {
      return acc.concat(booking.seats);
    }, []);

    // 3. Calculate seat availability
    seatMapParsed.coaches.forEach(coach => {
      coach.seats.forEach(seat => {
        seat.available = !bookedSeats.includes(seat.seatId); // Mark as available if not booked
      });
    });

    // 4. Return the seat map with updated availability
    return res.json(seatMapParsed);
    
  } catch (error) {
    console.error('Error calculating available seats:', error);
    return res.status(500).json({ message: 'An error occurred while calculating available seats' });
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
