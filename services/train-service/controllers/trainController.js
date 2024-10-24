const Train = require("../models/train");
const redisClient = require("../config/redis");
const { Op } = require("sequelize");
const createBreaker = require("../config/circuitBreaker");

// Create circuit breakers for database operations
const findAllBreaker = createBreaker(Train.findAll.bind(Train));
const findByPkBreaker = createBreaker(Train.findByPk.bind(Train));
const createTrainBreaker = createBreaker(Train.create.bind(Train));
const updateBreaker = createBreaker(Train.update.bind(Train));
const destroyBreaker = createBreaker(Train.destroy.bind(Train));

exports.getTrainSchedule = async (req, res) => {
  const { source, destination } = req.query;
  const cacheKey = `schedule:${source}:${destination}`;

  try {
    const cachedSchedule = await redisClient.get(cacheKey);
    if (cachedSchedule) {
      return res.json(JSON.parse(cachedSchedule));
    }

    const schedule = await findAllBreaker.fire({
      where: {
        source,
        destination,
      },
    });

    if (schedule.length === 0) {
      return res
        .status(404)
        .json({ message: "No trains available for the selected route" });
    }

    await redisClient.set(cacheKey, JSON.stringify(schedule), "EX", 3600);
    res.json(schedule);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error fetching train schedule", error: error.message });
  }
};

exports.getTrainDetails = async (req, res) => {
  try {
    const { trainId } = req.params;
    const train = await findByPkBreaker.fire(trainId);
    if (!train) {
      return res.status(404).json({ message: "Train not found" });
    }
    res.json(train);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching train details", error: error.message });
  }
};

exports.createTrain = async (req, res) => {
  try {
    const newTrain = await createTrainBreaker.fire(req.body);
    res
      .status(201)
      .json({ trainId: newTrain.id, message: "Train created successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating train", error: error.message });
  }
};

exports.updateTrain = async (req, res) => {
  try {
    const { trainId } = req.params;
    const [updated] = await updateBreaker.fire(req.body, {
      where: { id: trainId },
    });
    if (updated === 0) {
      return res.status(404).json({ message: "Train not found" });
    }
    res.json({ message: "Train details updated successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating train", error: error.message });
  }
};

exports.deleteTrain = async (req, res) => {
  try {
    const { trainId } = req.params;
    const deleted = await destroyBreaker.fire({
      where: { id: trainId },
    });
    if (deleted === 0) {
      return res.status(404).json({ message: "Train not found" });
    }
    res.json({ message: "Train deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting train", error: error.message });
  }
};
