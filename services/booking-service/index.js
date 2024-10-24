const express = require("express");
const app = express();
const port = 3331;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Booking service is up and running" });
});

app.listen(port, () => {
  console.log(`Booking service is running on port ${port}`);
});
