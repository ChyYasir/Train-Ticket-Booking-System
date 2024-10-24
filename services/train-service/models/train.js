const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Train = sequelize.define("Train", {
  trainId: {
    type: DataTypes.UUID,  // Define trainId as a UUID
    defaultValue: DataTypes.UUIDV4,  // Automatically generate UUID
    primaryKey: true,  // Set as primary key
  },
  trainName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  route: {
    type: DataTypes.JSONB, // Store route details as a JSONB object
    allowNull: false,
    defaultValue: [], // Default to an empty array if no route is provided
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error("Route must be an array");
        }
      },
    },
  },
  coaches: {
    type: DataTypes.JSONB, // Store seat details for each coach in a JSONB field
    allowNull: false,
    defaultValue: [], // Default to an empty array if no coaches are provided
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error("Coaches must be an array");
        }
      },
    },
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
});

module.exports = Train;
