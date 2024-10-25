const amqp = require('amqplib');
const redisClient = require('./redisClient'); // Redis client
const dotenv = require("dotenv"); 
dotenv.config(); 

const MAX_RETRIES = 5;  // Maximum number of retry attempts
const RETRY_DELAY = 1000; // Initial retry delay in milliseconds

let retries = 0;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue("train_seatmap_queue", { durable: true });
    console.log("Connected to RabbitMQ");

    channel.consume("train_seatmap_queue", async (message) => {
      if (message !== null) {
        const data = JSON.parse(message.content.toString());

        // Store the seat map in Redis
        await redisClient.set(`seatmap:${data.trainId}`, JSON.stringify(data.seatMap));
        console.log(`Seat map stored in Redis for trainId: ${data.trainId}`);

        // Acknowledge the message
        channel.ack(message);
      }
    });

    // Reset retries counter on successful connection
    retries = 0;

  } catch (err) {
    retries++;
    if (retries > MAX_RETRIES) {
      console.error("Max retries reached. Could not connect to RabbitMQ.");
      process.exit(1); // Exit process after max retries
    } else {
      const delay = Math.min(RETRY_DELAY * retries, 30000); // Exponential backoff (max 30s)
      console.error(`Error connecting to RabbitMQ. Retrying in ${delay / 1000} seconds...`, err);
      
      // Retry the connection after delay
      setTimeout(connectRabbitMQ, delay);
    }
  }
};

module.exports = { connectRabbitMQ };
