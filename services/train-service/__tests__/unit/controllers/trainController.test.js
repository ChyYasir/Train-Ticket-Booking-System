const trainController = require("../../../controllers/trainController");
const Train = require("../../../models/train");
const redisClient = require("../../../config/redis");

jest.mock("../../../models/train");
jest.mock("../../../config/redis");

describe("Train Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: { source: "CityA", destination: "CityB" },
      params: { trainId: "1" },
      body: {
        trainName: "Express1",
        route: [],
        coaches: 10,
        fare: 100,
        source: "CityA",
        destination: "CityB",
      },
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe("getTrainSchedule", () => {
    it("should return cached schedule if available", async () => {
      const cachedSchedule = [{ id: 1, trainName: "Express1" }];
      redisClient.get.mockResolvedValue(JSON.stringify(cachedSchedule));

      await trainController.getTrainSchedule(req, res);

      expect(redisClient.get).toHaveBeenCalledWith("schedule:CityA:CityB");
      expect(res.json).toHaveBeenCalledWith(cachedSchedule);
    });

    it("should fetch and cache schedule if not in cache", async () => {
      const schedule = [{ id: 1, trainName: "Express1" }];
      redisClient.get.mockResolvedValue(null);
      Train.findAll.mockResolvedValue(schedule);

      await trainController.getTrainSchedule(req, res);

      expect(Train.findAll).toHaveBeenCalledWith({
        where: { source: "CityA", destination: "CityB" },
      });
      expect(redisClient.set).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(schedule);
    });

    it("should return 404 if no trains are available", async () => {
      redisClient.get.mockResolvedValue(null);
      Train.findAll.mockResolvedValue([]);

      await trainController.getTrainSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No trains available for the selected route",
      });
    });
  });

  describe("getTrainDetails", () => {
    it("should return train details if found", async () => {
      const train = { id: 1, trainName: "Express1" };
      Train.findByPk.mockResolvedValue(train);

      await trainController.getTrainDetails(req, res);

      expect(Train.findByPk).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith(train);
    });

    it("should return 404 if train not found", async () => {
      Train.findByPk.mockResolvedValue(null);

      await trainController.getTrainDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Train not found" });
    });
  });

  describe("createTrain", () => {
    it("should create a new train", async () => {
      const newTrain = { id: 1, ...req.body };
      Train.create.mockResolvedValue(newTrain);

      await trainController.createTrain(req, res);

      expect(Train.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        trainId: newTrain.id,
        message: "Train created successfully",
      });
    });
  });

  describe("updateTrain", () => {
    it("should update train details", async () => {
      Train.update.mockResolvedValue([1]);

      await trainController.updateTrain(req, res);

      expect(Train.update).toHaveBeenCalledWith(req.body, {
        where: { id: "1" },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "Train details updated successfully",
      });
    });

    it("should return 404 if train not found", async () => {
      Train.update.mockResolvedValue([0]);

      await trainController.updateTrain(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Train not found" });
    });
  });

  describe("deleteTrain", () => {
    it("should delete a train", async () => {
      Train.destroy.mockResolvedValue(1);

      await trainController.deleteTrain(req, res);

      expect(Train.destroy).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "Train deleted successfully",
      });
    });

    it("should return 404 if train not found", async () => {
      Train.destroy.mockResolvedValue(0);

      await trainController.deleteTrain(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Train not found" });
    });
  });
});
