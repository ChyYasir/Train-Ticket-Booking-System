const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
// Define the User schema
const userSchema = new mongoose.Schema({
  id: {
    type: String, // MongoDB automatically generates unique ObjectId for each document.
    default: () => new mongoose.Types.ObjectId(), // UUID equivalent in MongoDB.
  },
  userId: {
    type: String,
    default: uuidv4, // Automatically generate a UUID v4 for userId
    unique: true, // Ensure the userId is unique
  },
  username: {
    type: String,
    required: true, // Equivalent to `allowNull: false` in Sequelize
  },
  email: {
    type: String,
    required: true,
    unique: true, // Unique email for each user
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["customer", "admin"], // Equivalent to ENUM in Sequelize
    default: null, // Same default value as before
  },
}, { timestamps: true }); // This adds `createdAt` and `updatedAt` fields automatically

// Create the User model from the schema
const User = mongoose.model("User", userSchema);

module.exports = User;
