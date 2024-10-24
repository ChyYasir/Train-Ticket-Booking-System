const express = require("express");
const router = express.Router();
const trainController = require("../controllers/trainController");

router.get("/", trainController.getTrainSchedule);
router.get("/:trainId", trainController.getTrainDetails);
router.post("/", trainController.createTrain);
router.put("/:trainId", trainController.updateTrain);
router.delete("/:trainId", trainController.deleteTrain);

module.exports = router;
