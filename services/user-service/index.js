const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv"); 
const amqp = require("amqplib/callback_api");
const userRoute = require("./route/userRoute");
const app = express();
const port = process.env.PORT || 3330; 
dotenv.config(); 
app.use(express.json());
require("./config/tracing");
// Connect to MongoDB using Mongoose
mongoose
  .connect(process.env.DATABASE_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB using Mongoose");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });


// RabbitMQ connection
amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
  if (error0) {
    throw error0;
  }
  console.log("Connected to RabbitMQ");
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }
    const queue = "user_tasks";
    channel.assertQueue(queue, {
      durable: false,
    });
  });
});

app.use("/", userRoute);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ message: "User service is up and running" });
});

// Start the server
app.listen(port, () => {
  console.log(`User service is running on port ${port}`);
});
