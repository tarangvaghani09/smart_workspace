// models/Booking.js
import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define('BookingRoom', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },

    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'booking_rooms',
    timestamps: true
  });
