const express = require("express");
const amqp = require("amqplib/callback_api");
const redisClient = require('./config/redisClient'); // Redis client
const axios = require('axios'); // For making requests to the user-service
const crypto = require('crypto'); // For OTP generation
const Mailjet = require('node-mailjet'); // For sending emails with Mailjet
require('dotenv').config(); // To load .env variables

const app = express();
const port = 3332;

// Initialize Mailjet client
const mailjet = require('node-mailjet').apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_API_SECRET);


// RabbitMQ connection setup
const QUEUE_NAME = "booking_notification_queue";
// URL of the user-service
// const USER_SERVICE_URL = "http://localhost:3330/users";

// Connect to RabbitMQ
amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
  if (error0) {
    throw error0;
  }

  console.log("Connected to RabbitMQ");

  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
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

        // Fetch the user's email from the user-service
        // try {
        //   const userResponse = await axios.get(`${USER_SERVICE_URL}/${userId}`);
        //   const { email } = userResponse.data;

        //   console.log("Checking 1")

        //   // Send OTP to user's email using Mailjet
        //   const emailResponse = await sendOtpEmail(email, otp);

        //   if (emailResponse) {
        //     console.log(`OTP sent to ${email}`);

        //     // Store OTP in Redis with a TTL of 5 minutes
        //     await redisClient.set(`otp:${bookingId}`, otp, 'EX', 300); // 300 seconds = 5 minutes

        //     console.log(`OTP stored in Redis for Booking ID: ${bookingId}`);
        //   }
        // } catch (error) {
        //   console.error("Error fetching user data or sending email:", error.message);
        // }
        console.log("Checking 1")
        try {
          // Instead of fetching from user service, set the email directly
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
});

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
