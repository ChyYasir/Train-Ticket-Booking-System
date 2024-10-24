const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Your existing sequelize instance

// Define the Booking model
const Booking = sequelize.define("Booking", {
  id: {
    type: DataTypes.UUID, // Unique identifier for the booking
    defaultValue: DataTypes.UUIDV4, // Auto-generate UUID
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID, // Foreign key to User
    allowNull: false,
  },
  trainId: {
    type: DataTypes.UUID, // Foreign key to Train
    allowNull: false,
  },
  journeyDate: {
    type: DataTypes.DATEONLY, // Date without time
    allowNull: false,
  },
  coach: {
    type: DataTypes.STRING, // Coach name or number
    allowNull: false,
  },
  seats: {
    type: DataTypes.ARRAY(DataTypes.STRING), // Array of seat numbers
    allowNull: false,
  },
  passengerDetails: {
    type: DataTypes.JSONB, // JSONB field to store an array of passenger details
    allowNull: false,
  },
});

// Sync the model with the database (optional)
// You can remove this in production, it's mostly for development purposes
// Booking.sync({ alter: true });

module.exports = Booking;
