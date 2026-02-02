// models/Department.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define(
    'Department',
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

      monthlyCreditQuota: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        validate: {
          min: 0,
          max: 100
        }
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: 'departments',
      timestamps: true,
    }
  );
};
