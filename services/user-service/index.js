const express = require("express");
const app = express();
const port = 3330;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "User service is up and running" });
});

app.listen(port, () => {
  console.log(`User service is running on port ${port}`);
});
