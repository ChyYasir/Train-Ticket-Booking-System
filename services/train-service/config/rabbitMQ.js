const amqp = require('amqplib');
const dotenv = require("dotenv"); 
dotenv.config(); 
let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("Error connecting to RabbitMQ", err);
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

module.exports = { connectRabbitMQ, publishToQueue };
