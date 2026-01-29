// models/Booking.js
import { DataTypes } from 'sequelize';
import { no } from 'zod/v4/locales';

export default (sequelize) => {
  return sequelize.define(
    'Booking',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      uid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false
      },

      bookingType: {
        type: DataTypes.ENUM('ROOM', 'RESOURCE', 'ROOM_RESOURCE'),
        allowNull: false,
        defaultValue: 'ROOM_RESOURCE'
      },

      startTime: {
        type: DataTypes.DATE,
        allowNull: false
      },

      endTime: {
        type: DataTypes.DATE,
        allowNull: false
      },

      status: {
        type: DataTypes.ENUM(
          'PENDING',
          'CONFIRMED',
          'REJECTED',
          'CANCELLED',
          'NO_SHOW'
        ),
        defaultValue: 'CONFIRMED'
      },

      // ROOM IS OPTIONAL NOW
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      creditsUsed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      approvedBy: DataTypes.INTEGER,
      approvedAt: DataTypes.DATE,

      isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      recurringGroup: DataTypes.STRING,

      checkedIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },

      checkedOut: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'bookings',
      timestamps: true
    }
  );
};
