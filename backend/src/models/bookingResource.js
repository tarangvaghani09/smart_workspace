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
      }
    },
    {
      tableName: 'booking_resources',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['bookingId', 'resourceId']
        }
      ]
    }
  );
};
