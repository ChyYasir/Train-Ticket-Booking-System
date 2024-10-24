const express = require("express");
const dotenv = require("dotenv");
const paymentRoutes = require("./route/paymentRoute");
const redisClient = require("./config/redisClient");
const port = 8080;
dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Payment service is up and running" });
});

// Use payment routes
app.use("/payment", paymentRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Payment service is running on port ${port}`);
});
