// models/Room.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define(
    'Room',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 100]
        }
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 }
      },

      type: {
        type: DataTypes.ENUM('standard', 'boardroom', 'training'),
        defaultValue: 'standard'
      },

      features: {
        type: DataTypes.JSON,   // e.g., { "Whiteboard": true, "Projector": false }
        allowNull: true
      },

      creditsPerHour: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 0 }
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: 'rooms',
      timestamps: true
    }
  );
};
