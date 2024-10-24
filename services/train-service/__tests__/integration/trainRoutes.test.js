const request = require("supertest");
const express = require("express");
const trainRoutes = require("../../routes/trainRoutes");
const Train = require("../../models/train");
const redisClient = require("../../config/redis");

const app = express();
app.use(express.json());
app.use("/trains", trainRoutes);

jest.mock("../../models/train");
jest.mock("../../config/redis");

describe("Train Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get train schedule", async () => {
    const schedule = [{ id: 1, trainName: "Express1" }];
    redisClient.get.mockResolvedValue(null);
    Train.findAll.mockResolvedValue(schedule);

    const res = await request(app)
      .get("/trains?source=CityA&destination=CityB")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toEqual(schedule);
  });

  // Add more integration tests for other routes
});
