const Train = require("../models/train");
const { redisClient } = require("../config/redis");
const { Op } = require("sequelize");

exports.getTrainSchedule = async (req, res) => {
  try {
    const { source, destination } = req.query;
    const cacheKey = `schedule:${source}:${destination}`;

    // Check Redis cache first
    const cachedSchedule = await redisClient.get(cacheKey);
    if (cachedSchedule) {
      return res.json(JSON.parse(cachedSchedule));
    }

    const schedule = await Train.findAll({
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

    // Cache the result in Redis
    await redisClient.set(cacheKey, JSON.stringify(schedule), "EX", 3600); // Cache for 1 hour

    res.json(schedule);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching train schedule", error: error.message });
  }
};

exports.getTrainDetails = async (req, res) => {
  try {
    const { trainId } = req.params;
    const train = await Train.findByPk(trainId);
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
    const newTrain = await Train.create(req.body);
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
    const [updated] = await Train.update(req.body, {
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
    const deleted = await Train.destroy({
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
