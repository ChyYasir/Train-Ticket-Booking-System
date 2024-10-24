const Redis = require("redis");
const redisClient = Redis.createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
  }
})();

module.exports = redisClient;
