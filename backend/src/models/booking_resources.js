// models/BookingResource.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define(
    'BookingResource',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      resourceId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1
        }
      },

      deductedFromSourceQty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },

      fromRoomId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      toRoomId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      startTime: {
        type: DataTypes.DATE,
        allowNull: true
      },

      endTime: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'booking_resources',
      timestamps: true,
      indexes: [
        {
          name: 'uq_booking_resources_alloc',
          unique: true,
          fields: ['bookingId', 'resourceId', 'fromRoomId', 'toRoomId']
        },
        {
          name: 'idx_booking_resources_resource_from_room',
          fields: ['resourceId', 'fromRoomId']
        },
        {
          name: 'idx_booking_resources_resource_to_room',
          fields: ['resourceId', 'toRoomId']
        }
      ]
    }
  );
};
