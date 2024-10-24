// trainController.js
const Train = require("../models/train");
const redisClient = require("../config/redis");

exports.getTrainSchedule = async (req, res) => {
  const { source, destination } = req.query;
  const cacheKey = `schedule:${source}:${destination}`;

  try {
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

    if (!schedule || schedule.length === 0) {
      return res
        .status(404)
        .json({ message: "No trains available for the selected route" });
    }

    await redisClient.set(cacheKey, JSON.stringify(schedule), "EX", 3600);
    return res.json(schedule);
  } catch (error) {
    return res
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
    return res.json(train);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching train details", error: error.message });
  }
};

exports.createTrain = async (req, res) => {
  try {
    const newTrain = await Train.create(req.body);
    return res
      .status(201)
      .json({ trainId: newTrain.id, message: "Train created successfully" });
  } catch (error) {
    return res
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
    if (!updated) {
      return res.status(404).json({ message: "Train not found" });
    }
    return res.json({ message: "Train details updated successfully" });
  } catch (error) {
    return res
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
    if (!deleted) {
      return res.status(404).json({ message: "Train not found" });
    }
    return res.json({ message: "Train deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting train", error: error.message });
  }
};
