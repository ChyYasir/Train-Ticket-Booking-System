const amqp = require('amqplib');
const redisClient = require('./redisClient'); // Redis client
const dotenv = require("dotenv"); 
dotenv.config(); 

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

  } catch (err) {
    console.error("Error connecting to RabbitMQ", err);
  }
};

module.exports = { connectRabbitMQ };
