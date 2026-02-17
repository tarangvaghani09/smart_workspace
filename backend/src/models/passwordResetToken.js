import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'PasswordResetToken',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      tokenHash: {
        type: DataTypes.STRING(128),
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'password_reset_tokens',
      timestamps: true
    }
  );
