import { Sequelize } from 'sequelize';

// Create Sequelize instance for MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,       // database name
  process.env.DB_USER,       // mysql username
  process.env.DB_PASSWORD,   // mysql password
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,          // disable SQL logs

    // Allow multiple SQL statements (optional)
    dialectOptions: {
      multipleStatements: true
    },

    pool: {
      max: 30,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    define: {
      freezeTableName: true, // table name = model name
    }
  }
);

import UserModel from './user.js';
import DepartmentModel from './department.js';
import RoomModel from './room.js';
import ResourceModel from './resource.js';
import BookingModel from './booking.js';
import BookingResourceModel from './bookingResource.js';
import DepartmentCreditModel from './departmentCredit.js';
import RoomApprovalRuleModel from './roomApprovalRule.js';

const User = UserModel(sequelize);
const Department = DepartmentModel(sequelize);
const Room = RoomModel(sequelize);
const Resource = ResourceModel(sequelize);
const Booking = BookingModel(sequelize);
const BookingResource = BookingResourceModel(sequelize);
const DepartmentCredit = DepartmentCreditModel(sequelize);
const RoomApprovalRule = RoomApprovalRuleModel(sequelize);

// Department → Users
Department.hasMany(User, { foreignKey: 'departmentId' });
User.belongsTo(Department, { foreignKey: 'departmentId' });

// Department → Credits
Department.hasMany(DepartmentCredit, { foreignKey: 'departmentId' });
DepartmentCredit.belongsTo(Department, { foreignKey: 'departmentId' });

// Room → Bookings
Room.hasMany(Booking, { foreignKey: 'roomId' });
Booking.belongsTo(Room, { foreignKey: 'roomId' });

// User → Bookings
User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

//last
Booking.belongsTo(Department, { foreignKey: 'departmentId' });
Department.hasMany(Booking, { foreignKey: 'departmentId' });

// Booking ↔ Resources (M:N)
Booking.belongsToMany(Resource, {
  through: BookingResource,
  foreignKey: 'bookingId',
  otherKey: 'resourceId'
});

Resource.belongsToMany(Booking, {
  through: BookingResource,
  foreignKey: 'resourceId',
  otherKey: 'bookingId'
});

Booking.hasMany(BookingResource, { foreignKey: 'bookingId' });
BookingResource.belongsTo(Booking, { foreignKey: 'bookingId' });

Resource.hasMany(BookingResource, { foreignKey: 'resourceId' });
BookingResource.belongsTo(Resource, { foreignKey: 'resourceId' });

export {
  sequelize,
  Sequelize,
  User,
  Department,
  Room,
  Resource,
  Booking,
  BookingResource,
  DepartmentCredit,
  RoomApprovalRule
};