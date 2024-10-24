const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

// Create a Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// Connect to Redis
redisClient.connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch((err) => {
    console.error('Redis connection error:', err);
  });

module.exports = redisClient;
