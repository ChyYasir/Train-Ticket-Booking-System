const express = require("express");
const app = express();
const port = 3333;
const trainRoutes = require("./routes/trainRoutes");
const sequelize = require("./config/database");
// const connectToRedis = require("./config/redis");

app.use(express.json());

// Connect to PostgreSQL and Redis
// connectToDatabase();
// connectToRedis();

// Database connection
sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Unable to connect to the database:", err));

// Sync models with database
sequelize
  .sync()
  .then(() => console.log("Models synced with database"))
  .catch((err) => console.error("Error syncing models:", err));
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Train service is up and running" });
});

// Use train routes
app.use("/trains", trainRoutes);

app.listen(port, () => {
  console.log(`Train service is running on port ${port}`);
});
