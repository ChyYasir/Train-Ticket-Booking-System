const amqp = require("amqplib");
const redisClient = require("./redisClient"); // Redis client
const dotenv = require("dotenv");
dotenv.config();

const MAX_RETRIES = 5;
let retryCount = 0;

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
        await redisClient.set(
          `seatmap:${data.trainId}`,
          JSON.stringify(data.seatMap)
        );
        console.log(`Seat map stored in Redis for trainId: ${data.trainId}`);

        // Acknowledge the message
        channel.ack(message);
      }
    });

    // Reset retry count upon successful connection
    retryCount = 0;
  } catch (err) {
    console.error("Error connecting to RabbitMQ", err);

    // Retry mechanism with exponential backoff
    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff (1s, 2s, 4s, 8s, etc.)
      console.log(`Retrying RabbitMQ connection in ${retryDelay / 1000} seconds...`);
      
      setTimeout(() => {
        connectRabbitMQ();
      }, retryDelay);
    } else {
      console.error("Max retries reached. Could not connect to RabbitMQ.");
    }
  }
};

module.exports = { connectRabbitMQ };
