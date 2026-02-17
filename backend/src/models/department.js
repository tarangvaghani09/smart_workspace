// models/Department.js
import { DataTypes } from 'sequelize';
import { currentMonthYear } from '../services/creditService.js';

export default (sequelize) => {
  const Department = sequelize.define(
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
      timestamps: true
    }
  );

  /* ----------------------------------
     AFTER CREATE → create credit entry
  ---------------------------------- */
  Department.afterCreate(async (department, options) => {
    const { DepartmentCredit } = sequelize.models;
    const { month, year } = currentMonthYear();

    await DepartmentCredit.findOrCreate({
      where: {
        departmentId: department.id,
        month,
        year
      },
      defaults: {
        availableCredits: department.monthlyCreditQuota,
        lockedCredits: 0
      },
      transaction: options.transaction
    });
  });

  return Department;
};
