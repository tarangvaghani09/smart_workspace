// models/Resource.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Resource = sequelize.define(
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

      isMovable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
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

  /* ---------------------------------------
     AFTER CREATE → INIT INVENTORY IN ROOMS
  ---------------------------------------- */
  Resource.afterCreate(async (resource, options) => {
    if (!resource.isMovable) return;

    const { Room, RoomResourceInventory } = resource.sequelize.models;

    const rooms = await Room.findAll({
      where: { isActive: true },
      transaction: options.transaction
    });

    for (const room of rooms) {
      await RoomResourceInventory.create(
        {
          roomId: room.id,
          resourceId: resource.id,
          maxCapacity: room.type === 'spare' ? resource.quantity : 0,
          currentAvailable: room.type === 'spare' ? resource.quantity : 0
        },
        { transaction: options.transaction }
      );
    }
  });

  return Resource;
};
