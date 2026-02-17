import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { sequelize, Room } from '../models/index.js';

const seedSpareRoom = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    await Room.create({
      name: 'Spare Room',
      capacity: 999,
      type: 'spare',
      creditsPerHour: 1,
      isActive: true,
      isDefaultLocation: true
    });

    console.log('✅ Spare room created with inventory');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

seedSpareRoom();