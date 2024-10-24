const express = require("express");
const app = express();
const port = 3332;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Notification service is up and running" });
});

app.listen(port, () => {
  console.log(`Notification service is running on port ${port}`);
});
