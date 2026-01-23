// RoomApprovalRule model
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define(
    'RoomApprovalRule',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      roomType: {
        type: DataTypes.ENUM('standard', 'boardroom', 'training'),
        allowNull: false
      },

      userRole: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 50]
        }
      },

      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'room_approval_rules',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['roomType', 'userRole']
        }
      ]
    }
  );
};
