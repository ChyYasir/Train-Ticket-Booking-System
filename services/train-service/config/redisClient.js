const Redis = require("redis");
require("dotenv").config();
const MAX_RETRIES = 5; // Maximum number of retries
const RETRY_DELAY = 1000; // Initial retry delay in milliseconds

let retries = 0;

// Create Redis client with retry logic
const redisClient = Redis.createClient({
  url: `${process.env.REDIS_URL}`,
  socket: {
    reconnectStrategy: (attempts) => {
      if (retries >= MAX_RETRIES) {
        console.error("Max retries reached. Could not connect to Redis.");
        return new Error("Max retries reached");
      }

      const delay = Math.min(attempts * RETRY_DELAY, 30000); // Exponential backoff, max 30s
      console.log(`Retrying Redis connection in ${delay / 1000} seconds...`);
      retries += 1;
      return delay; // Return the delay before retrying
    },
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
  }
})();

module.exports = redisClient;
