// models/RoomResourceInventory.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const RoomResourceInventory = sequelize.define(
    'RoomResourceInventory',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      roomId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      resourceId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      maxCapacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 }
      },

      currentAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 }
      }
    },
    {
      tableName: 'room_resource_inventory',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['roomId', 'resourceId']
        },
        { fields: ['resourceId', 'currentAvailable'] }
      ]
    }
  );

  /* ---------------------------------------
     VALIDATION HOOK (TRANSACTION SAFE)
  ---------------------------------------- */
  RoomResourceInventory.beforeValidate(async (inventory, options) => {
    const { Room, Resource } = inventory.sequelize.models;

    const room = await Room.findByPk(
      inventory.roomId,
      { transaction: options.transaction }
    );
    if (!room) throw new Error('Room not found');

    const resource = await Resource.findByPk(
      inventory.resourceId,
      { transaction: options.transaction }
    );
    if (!resource) throw new Error('Resource not found');

    if (!resource.isMovable) {
      throw new Error('Non-movable resources cannot be stored in inventory');
    }

    if (inventory.currentAvailable > inventory.maxCapacity) {
      throw new Error('currentAvailable cannot exceed maxCapacity');
    }
  });

  return RoomResourceInventory;
};
