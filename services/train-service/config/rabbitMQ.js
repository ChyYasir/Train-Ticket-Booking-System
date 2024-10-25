const amqp = require('amqplib');
const dotenv = require("dotenv"); 
dotenv.config(); 

let channel;
let connection;

const MAX_RETRIES = 5;  // Maximum retry attempts
const RETRY_DELAY = 1000; // Initial delay for retries in milliseconds
let retries = 0;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");

    // Reset retries counter on successful connection
    retries = 0;

  } catch (err) {
    retries++;
    if (retries > MAX_RETRIES) {
      console.error("Max retries reached. Could not connect to RabbitMQ.");
      process.exit(1); // Exit after max retries are exceeded
    } else {
      const delay = Math.min(RETRY_DELAY * retries, 30000); // Exponential backoff, max 30 seconds
      console.error(`Error connecting to RabbitMQ. Retrying in ${delay / 1000} seconds...`, err);
      
      // Retry the connection after delay
      setTimeout(connectRabbitMQ, delay);
    }
  }
};

const publishToQueue = async (queue, message) => {
  if (!channel) {
    console.error("RabbitMQ channel is not established");
    return;
  }
  try {
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`Message sent to queue: ${queue}`);
  } catch (error) {
    console.error(`Error sending message to queue: ${queue}`, error);
  }
};

// Handle graceful shutdown of RabbitMQ connection
const closeConnection = async () => {
  try {
    if (connection) {
      await connection.close();
      console.log("RabbitMQ connection closed");
    }
  } catch (err) {
    console.error("Error closing RabbitMQ connection", err);
  }
};

process.on('exit', closeConnection);
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = { connectRabbitMQ, publishToQueue };
