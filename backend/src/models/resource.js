// models/Resource.js
import { validate } from 'node-cron';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define(
    'Resource',
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

      type: {
        type: DataTypes.ENUM('DEVICE'),
        defaultValue: 'DEVICE'
      },

      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: { min: 1 }
      },

      creditsPerHour: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 }
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    { timestamps: true }
  );
};
