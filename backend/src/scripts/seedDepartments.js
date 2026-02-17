// scripts/seedDepartments.js
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { sequelize, Department } from '../models/index.js';

const seedDepartments = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    const departments = [
      { name: 'Engineering', monthlyCreditQuota: 100, isActive: true },
      { name: 'Sales', monthlyCreditQuota: 100, isActive: true },
      { name: 'Electronics & IoT', monthlyCreditQuota: 100, isActive: true },
      { name: 'HR', monthlyCreditQuota: 100, isActive: true },
      { name: 'Marketing', monthlyCreditQuota: 100, isActive: true },
      { name: 'Finance', monthlyCreditQuota: 100, isActive: true },
      { name: 'Operations', monthlyCreditQuota: 100, isActive: true },
      { name: 'Customer Support', monthlyCreditQuota: 100, isActive: true }
    ];

    await Department.bulkCreate(departments, {
      individualHooks: true,   // 🔥 THIS MAKES afterCreate WORK
      ignoreDuplicates: true   // optional safety
    });

    console.log('✅ Departments seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDepartments();