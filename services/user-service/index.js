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

// RabbitMQ retry mechanism configurations
const MAX_RETRIES = 5;  // Maximum number of retries for RabbitMQ connection
const RETRY_DELAY = 2000; // Initial delay for retries in milliseconds (2 seconds)
let rabbitRetryCount = 0;

// MongoDB retry mechanism configurations
let mongoRetryCount = 0;

// Function to connect to MongoDB with retry mechanism
const connectToMongoDB = () => {
  mongoose
    .connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB using Mongoose");
      mongoRetryCount = 0; // Reset retry count on successful connection
    })
    .catch((err) => {
      mongoRetryCount++;
      if (mongoRetryCount > MAX_RETRIES) {
        console.error("Max retries reached. Could not connect to MongoDB.");
        return;
      }

      const delay = Math.min(RETRY_DELAY * mongoRetryCount, 30000); // Exponential backoff with max 30 seconds delay
      console.error(`Error connecting to MongoDB. Retrying in ${delay / 1000} seconds...`, err);

      // Retry connection after delay
      setTimeout(connectToMongoDB, delay);
    });
};

// Function to connect to RabbitMQ with retry mechanism
const connectToRabbitMQ = () => {
  amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
    if (error0) {
      rabbitRetryCount++;
      if (rabbitRetryCount > MAX_RETRIES) {
        console.error("Max retries reached. Could not connect to RabbitMQ.");
        return;
      }
      
      const delay = Math.min(RETRY_DELAY * rabbitRetryCount, 30000); // Exponential backoff with max 30 seconds delay
      console.error(`Error connecting to RabbitMQ. Retrying in ${delay / 1000} seconds...`, error0);
      
      // Retry connection after delay
      setTimeout(connectToRabbitMQ, delay);
    } else {
      console.log("Connected to RabbitMQ");
      rabbitRetryCount = 0; // Reset retry count on successful connection
      
      connection.createChannel((error1, channel) => {
        if (error1) {
          console.error("Error creating RabbitMQ channel", error1);
          return;
        }

        const queue = "user_tasks";
        channel.assertQueue(queue, { durable: false });
        console.log(`Queue '${queue}' is ready to receive messages.`);
      });
    }
  });
};

// Call the function to connect to MongoDB
connectToMongoDB();

// Call the function to connect to RabbitMQ
connectToRabbitMQ();

app.use("/", userRoute);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ message: "User service is up and running" });
});

// Start the server
app.listen(port, () => {
  console.log(`User service is running on port ${port}`);
});
