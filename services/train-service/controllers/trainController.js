const Train = require("../models/train");
const redisClient = require("../config/redisClient");
const { publishToQueue } = require("../config/rabbitMQ");
const { trace } = require("@opentelemetry/api"); // Import tracing API

const tracer = trace.getTracer("train-service"); // Initialize the tracer

// Produce a message to RabbitMQ after train creation or update
const produceTrainMessage = async (trainId, seatMap, operation) => {
  const message = {
    trainId,
    seatMap,
    operation, // can be 'created' or 'updated'
  };
  await publishToQueue("train_seatmap_queue", message);
};

exports.getTrainSchedule = async (req, res) => {
  const span = tracer.startSpan("getTrainSchedule", {
    attributes: { "function.name": "getTrainSchedule" },
  });

  const { source, destination } = req.query;
  const cacheKey = `schedule:${source}:${destination}`;

  try {
    // Start a child span for Redis operation
    const redisSpan = tracer.startSpan("fetchScheduleFromRedis", {
      parent: span,
      attributes: { "db.system": "redis", "db.operation": "get" },
    });

    const cachedSchedule = await redisClient.get(cacheKey);
    if (cachedSchedule) {
      redisSpan.end();
      span.setAttribute("getTrainSchedule.status", "success");
      span.end();
      return res.json(JSON.parse(cachedSchedule));
    }

    redisSpan.end(); // End Redis span if no cached data

    // Start a child span for database operation
    const dbSpan = tracer.startSpan("fetchScheduleFromDatabase", {
      parent: span,
      attributes: { "db.operation": "findAll", "db.collection": "trains" },
    });

    const schedule = await Train.findAll({
      where: {
        source,
        destination,
      },
    });

    dbSpan.end(); // End DB span

    if (!schedule || schedule.length === 0) {
      span.setAttribute("getTrainSchedule.status", "no_trains_found");
      span.end();
      return res.status(404).json({ message: "No trains available for the selected route" });
    }

    await redisClient.set(cacheKey, JSON.stringify(schedule), "EX", 3600);
    span.setAttribute("getTrainSchedule.status", "success");
    return res.json(schedule);
  } catch (error) {
    span.setAttribute("getTrainSchedule.status", "error");
    span.setAttribute("error.message", error.message);
    return res.status(500).json({ message: "Error fetching train schedule", error: error.message });
  } finally {
    span.end(); // End the span
  }
};

exports.getTrainDetails = async (req, res) => {
  const span = tracer.startSpan("getTrainDetails", {
    attributes: { "function.name": "getTrainDetails" },
  });

  try {
    const { trainId } = req.params;
    const train = await Train.findByPk(trainId);

    if (!train) {
      span.setAttribute("getTrainDetails.status", "not_found");
      span.end();
      return res.status(404).json({ message: "Train not found" });
    }

    span.setAttribute("getTrainDetails.status", "success");
    return res.json(train);
  } catch (error) {
    span.setAttribute("getTrainDetails.status", "error");
    span.setAttribute("error.message", error.message);
    return res.status(500).json({ message: "Error fetching train details", error: error.message });
  } finally {
    span.end(); // End the span
  }
};

exports.createTrain = async (req, res) => {
  const span = tracer.startSpan("createTrain", {
    attributes: { "function.name": "createTrain" },
  });

  try {
    const newTrain = await Train.create(req.body);

    const seatMap = {
      trainId: newTrain.trainId,
      coaches: req.body.coaches, // Assuming coaches are part of the request body
    };

    // Produce message to RabbitMQ
    await produceTrainMessage(newTrain.trainId, seatMap, "created");

    span.setAttribute("createTrain.status", "success");
    return res.status(201).json({ trainId: newTrain.trainId, message: "Train created successfully" });
  } catch (error) {
    span.setAttribute("createTrain.status", "error");
    span.setAttribute("error.message", error.message);
    return res.status(400).json({ message: "Error creating train", error: error.message });
  } finally {
    span.end(); // End the span
  }
};

exports.updateTrain = async (req, res) => {
  const span = tracer.startSpan("updateTrain", {
    attributes: { "function.name": "updateTrain" },
  });

  try {
    const { trainId } = req.params;
    const [updated] = await Train.update(req.body, {
      where: { trainId: trainId },
    });

    if (!updated) {
      span.setAttribute("updateTrain.status", "not_found");
      span.end();
      return res.status(404).json({ message: "Train not found" });
    }

    const seatMap = {
      trainId,
      coaches: req.body.coaches, // Assuming coaches are updated as part of the request body
    };

    // Produce message to RabbitMQ
    await produceTrainMessage(trainId, seatMap, "updated");

    span.setAttribute("updateTrain.status", "success");
    return res.json({ message: "Train details updated successfully" });
  } catch (error) {
    span.setAttribute("updateTrain.status", "error");
    span.setAttribute("error.message", error.message);
    return res.status(400).json({ message: "Error updating train", error: error.message });
  } finally {
    span.end(); // End the span
  }
};

exports.deleteTrain = async (req, res) => {
  const span = tracer.startSpan("deleteTrain", {
    attributes: { "function.name": "deleteTrain" },
  });

  try {
    const { trainId } = req.params;
    const deleted = await Train.destroy({
      where: { trainId: trainId },
    });

    if (!deleted) {
      span.setAttribute("deleteTrain.status", "not_found");
      span.end();
      return res.status(404).json({ message: "Train not found" });
    }

    span.setAttribute("deleteTrain.status", "success");
    return res.json({ message: "Train deleted successfully" });
  } catch (error) {
    span.setAttribute("deleteTrain.status", "error");
    span.setAttribute("error.message", error.message);
    return res.status(500).json({ message: "Error deleting train", error: error.message });
  } finally {
    span.end(); // End the span
  }
};

exports.getAllTrains = async (req, res) => {
  const span = tracer.startSpan("getAllTrains", {
    attributes: { "function.name": "getAllTrains" },
  });

  try {
    const trains = await Train.findAll(); // Fetch all trains from the database

    if (trains.length === 0) {
      span.setAttribute("getAllTrains.status", "no_trains_found");
      span.end();
      return res.status(404).json({ message: "No trains found" });
    }

    span.setAttribute("getAllTrains.status", "success");
    return res.json(trains);
  } catch (error) {
    span.setAttribute("getAllTrains.status", "error");
    span.setAttribute("error.message", error.message);
    return res.status(500).json({ message: "Error fetching trains", error: error.message });
  } finally {
    span.end(); // End the span
  }
};
