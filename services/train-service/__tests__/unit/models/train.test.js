const { DataTypes } = require("sequelize");
const Train = require("../../../models/train");
const sequelize = require("../../../config/database");

describe("Train Model", () => {
  it("should define the Train model correctly", () => {
    const trainModel = Train.init(
      {
        trainName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        route: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        coaches: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        fare: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        destination: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      { sequelize }
    );

    expect(trainModel).toBeDefined();
    expect(trainModel.tableName).toBe("Trains");
  });
});
