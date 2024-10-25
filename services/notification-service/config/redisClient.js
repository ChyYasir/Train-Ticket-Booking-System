const redis = require("redis");
require('dotenv').config();

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis client error", err);
});

redisClient.connect(); // Connect to Redis

module.exports = redisClient;
