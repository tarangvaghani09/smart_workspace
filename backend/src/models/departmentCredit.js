// models/DepartmentCredit.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define(
    'DepartmentCredit',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      month: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      availableCredits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        }
      },

      lockedCredits: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      tableName: 'department_credits',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['departmentId', 'month', 'year']
        }
      ]
    }
  );
};
