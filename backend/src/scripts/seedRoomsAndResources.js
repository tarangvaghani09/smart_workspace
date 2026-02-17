import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { sequelize, Room, Resource, Department, User } from '../models/index.js';

const ROOMS = [
  { name: 'Room A', capacity: 10, creditsPerHour: 1, type: 'standard', isActive: true },
  { name: 'Room B', capacity: 10, creditsPerHour: 1, type: 'standard', isActive: true },
  { name: 'Room', capacity: 10, creditsPerHour: 1, type: 'standard', isActive: true }
];

const RESOURCES = [
  { name: 'TV', quantity: 20, creditsPerHour: 1, isMovable: true, isActive: true },
  { name: 'Board', quantity: 10, creditsPerHour: 1, isMovable: true, isActive: true },
  { name: 'Light', quantity: 5, creditsPerHour: 1, isMovable: true, isActive: true }
];

const ADMIN_USER = {
  name: 'tarang',
  email: 'tarang@test.com',
  password: 'Tarang@123',
  role: 'admin',
  departmentName: 'Engineering'
};

async function upsertRoom(roomData, transaction) {
  const existing = await Room.findOne({
    where: { name: roomData.name },
    transaction
  });

  if (!existing) {
    await Room.create(roomData, { transaction });
    console.log(`Created room: ${roomData.name}`);
    return;
  }

  await existing.update(
    {
      capacity: roomData.capacity,
      creditsPerHour: roomData.creditsPerHour,
      type: roomData.type,
      isActive: roomData.isActive
    },
    { transaction }
  );
  console.log(`Updated room: ${roomData.name}`);
}

async function upsertResource(resourceData, transaction) {
  const existing = await Resource.findOne({
    where: { name: resourceData.name },
    transaction
  });

  if (!existing) {
    await Resource.create(resourceData, { transaction });
    console.log(`Created resource: ${resourceData.name}`);
    return;
  }

  await existing.update(
    {
      quantity: resourceData.quantity,
      creditsPerHour: resourceData.creditsPerHour,
      isMovable: resourceData.isMovable,
      isActive: resourceData.isActive
    },
    { transaction }
  );
  console.log(`Updated resource: ${resourceData.name}`);
}

async function getOrCreateDepartmentByName(name, transaction) {
  const existing = await Department.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      String(name).trim().toLowerCase()
    ),
    transaction
  });

  if (existing) return existing;

  const created = await Department.create(
    {
      name,
      monthlyCreditQuota: 100,
      isActive: true
    },
    { transaction }
  );
  console.log(`Created department: ${name}`);
  return created;
}

async function upsertAdminUser(userData, transaction) {
  const department = await getOrCreateDepartmentByName(userData.departmentName, transaction);

  const existing = await User.findOne({
    where: { email: userData.email },
    transaction
  });

  if (!existing) {
    await User.create(
      {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        departmentId: department.id,
        isActive: true
      },
      { transaction }
    );
    console.log(`Created admin user: ${userData.email}`);
    return;
  }

  await existing.update(
    {
      name: userData.name,
      password: userData.password,
      role: userData.role,
      departmentId: department.id,
      isActive: true
    },
    { transaction }
  );
  console.log(`Updated admin user: ${userData.email}`);
}

async function seedRoomsAndResources() {
  const transaction = await sequelize.transaction();

  try {
    await sequelize.authenticate();
    console.log('DB connected');

    for (const room of ROOMS) {
      await upsertRoom(room, transaction);
    }

    for (const resource of RESOURCES) {
      await upsertResource(resource, transaction);
    }

    await upsertAdminUser(ADMIN_USER, transaction);

    await transaction.commit();
    console.log('Rooms, resources, and admin user seeded successfully');
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seedRoomsAndResources();
