const express = require("express");
const amqp = require("amqplib/callback_api");
const redisClient = require('./config/redisClient'); // Redis client
const axios = require('axios'); // For making requests to the user-service
const crypto = require('crypto'); // For OTP generation
require('dotenv').config(); // To load .env variables
const Mailjet = require('node-mailjet'); // For sending emails with Mailjet

const app = express();
const port = 3332;

// Initialize Mailjet client
const mailjet = require('node-mailjet').apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_API_SECRET);

// RabbitMQ connection setup
const QUEUE_NAME = "booking_notification_queue";
const MAX_RETRIES = 5;  // Maximum number of retries for RabbitMQ connection
const RETRY_DELAY = 2000; // Initial delay for retries in milliseconds (2 seconds)
let retryCount = 0;

// Function to connect to RabbitMQ with retry mechanism
const connectRabbitMQ = () => {
  amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
    if (error0) {
      retryCount++;
      if (retryCount > MAX_RETRIES) {
        console.error("Max retries reached. Could not connect to RabbitMQ.");
        return;
      }
      
      const delay = Math.min(RETRY_DELAY * retryCount, 30000); // Exponential backoff with max 30 seconds delay
      console.error(`Error connecting to RabbitMQ. Retrying in ${delay / 1000} seconds...`, error0);
      
      // Retry connection after delay
      setTimeout(connectRabbitMQ, delay);
    } else {
      console.log("Connected to RabbitMQ");
      retryCount = 0; // Reset retry count on successful connection

      connection.createChannel((error1, channel) => {
        if (error1) {
          console.error("Error creating RabbitMQ channel", error1);
          return;
        }

        channel.assertQueue(QUEUE_NAME, { durable: false });
        console.log(`Waiting for messages in queue: ${QUEUE_NAME}`);

        // Consume messages from the queue
        channel.consume(QUEUE_NAME, async (msg) => {
          if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            const { userId, bookingId } = message;

            console.log(`Received message for Booking ID: ${bookingId}, User ID: ${userId}`);

            // Generate OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            console.log(`Generated OTP: ${otp}`);

            // Send OTP to the predefined email instead of user-service
            try {
              const email = "nafiz@labthree.org";

              // Send OTP to user's email using Mailjet
              const emailResponse = await sendOtpEmail(email, otp);

              if (emailResponse) {
                console.log(`OTP sent to ${email}`);

                // Store OTP in Redis with a TTL of 5 minutes
                await redisClient.set(`otp:${bookingId}`, otp, 'EX', 300); // 300 seconds = 5 minutes

                console.log(`OTP stored in Redis for Booking ID: ${bookingId}`);
              }
            } catch (error) {
              console.error("Error sending email or storing OTP:", error.message);
            }

            channel.ack(msg); // Acknowledge the message
          }
        });
      });
    }
  });
};

// Call the function to connect to RabbitMQ
connectRabbitMQ();

// Send OTP email using Mailjet
const sendOtpEmail = async (email, otp) => {
  const request = mailjet.post("send", { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: 'nafiztalukder4@gmail.com', // Replace with your verified Mailjet email
          Name: 'Bangladesh Railway',
        },
        To: [
          {
            Email: email,
            Name: 'User',
          },
        ],
        Subject: 'Your OTP for Booking Confirmation',
        TextPart: `Your OTP for booking confirmation is ${otp}. It is valid for 5 minutes.`,
        HTMLPart: `<p>Your OTP for booking confirmation is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
      },
    ],
  });

  try {
    const result = await request;
    console.log(result.body);
    return true;
  } catch (error) {
    console.error("Error sending OTP email via Mailjet:", error.message);
    return false;
  }
};

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Notification service is up and running" });
});

// Start the server
app.listen(port, () => {
  console.log(`Notification service is running on port ${port}`);
});
