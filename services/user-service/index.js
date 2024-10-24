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
const logger = require("./config/logger");
const client = require("prom-client");

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "user-service",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create a custom counter metric for tracking visits
const visitCounter = new client.Counter({
  name: "user_service_visits_total",
  help: "Total number of visits to the user service",
});

// Register the custom metric
register.registerMetric(visitCounter);

// Middleware to increment the visit counter
app.use((req, res, next) => {
  visitCounter.inc();
  next();
});

// Expose the metrics endpoint
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// Connect to MongoDB using Mongoose
mongoose
  .connect(process.env.DATABASE_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB using Mongoose");
    logger.info("Connected to MongoDB using Mongoose");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err);
    logger.error("Failed to connect to MongoDB", err);
  });

// RabbitMQ connection
amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
  if (error0) {
    console.log("Failed to connect to RabbitMQ", error0);
    logger.error("Failed to connect to RabbitMQ", error0);
    throw error0;
  }
  console.log("Connected to RabbitMQ");
  logger.info("Connected to RabbitMQ");
  connection.createChannel((error1, channel) => {
    if (error1) {
      logger.error("Failed to create RabbitMQ channel", error1);
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
  logger.info(`User service is running on port ${port}`);
});
