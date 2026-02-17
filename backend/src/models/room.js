// models/Room.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Room = sequelize.define(
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
        type: DataTypes.ENUM('standard', 'boardroom', 'spare'),
        defaultValue: 'standard'
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
      },

      isDefaultLocation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'rooms',
      timestamps: true
    }
  );

  /* ---------------------------------------
     AFTER CREATE → INIT INVENTORY ROWS
  ---------------------------------------- */
  Room.afterCreate(async (room, options) => {
    const { Resource, RoomResourceInventory } = room.sequelize.models;

    const resources = await Resource.findAll({
      where: {
        isActive: true,
        isMovable: true
      },
      transaction: options.transaction
    });

    for (const resource of resources) {
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

  return Room;
};
