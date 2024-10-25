const express = require("express");
const app = express();
const port = 3331;
const sequelize = require("./config/database");
const { connectRabbitMQ } = require("./config/rabbitMQ");
const bookingRoute = require("./route/bookingRoute");
app.use(express.json());
require("./config/tracing");
// Connect to RabbitMQ and consume messages
connectRabbitMQ();
try {
  sequelize.authenticate();
  console.log("Sequlize initiated successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}
sequelize
  .sync()
  .then(() => {
    console.log("DB synched");
    app.listen(port, () => {
      console.log(`Booking service is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("DB Sych failed : ", error);
  });
  
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Booking service is up and running" });
});

app.use("/", bookingRoute); 