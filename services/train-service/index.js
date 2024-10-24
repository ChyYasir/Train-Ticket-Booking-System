const express = require("express");
const app = express();
const port = 3333;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Train service is up and running" });
});

app.listen(port, () => {
  console.log(`Train service is running on port ${port}`);
});
