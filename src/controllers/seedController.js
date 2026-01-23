// Seed controller
import 'dotenv/config';
import {
  Department,
  User,
  Room,
  Resource,
  DepartmentCredit,
  sequelize
} from '../models/index.js';
import { fileURLToPath } from 'url';

async function seedAll(req, res) {
  const t = await sequelize.transaction();
  try {
    /* ---------------- DEPARTMENTS ---------------- */
    const [engineering] = await Department.findOrCreate({
      where: { name: 'Engineering' },
      transaction: t
    });

    const [sales] = await Department.findOrCreate({
      where: { name: 'Sales' },
      transaction: t
    });

    /* ---------------- USERS ---------------- */
    await User.findOrCreate({
      where: { email: 'alice@example.com' },
      defaults: {
        name: 'Alice Admin',
        password: '123456',
        role: 'admin',
        departmentId: engineering.id
      },
      transaction: t
    });

    await User.findOrCreate({
      where: { email: 'bob@example.com' },
      defaults: {
        name: 'Bob Junior',
        password: '123456',
        role: 'junior',
        departmentId: engineering.id
      },
      transaction: t
    });

    await User.findOrCreate({
      where: { email: 'cara@example.com' },
      defaults: {
        name: 'Cara Regular',
        password: '123456',
        role: 'regular',
        departmentId: sales.id
      },
      transaction: t
    });

    await User.findOrCreate({
      where: { email: 'admin@test.com' },
      defaults: {
        name: 'System Admin',
        password: '123456',
        role: 'admin'
      },
      transaction: t
    });

    /* ---------------- ROOMS ---------------- */
    await Room.bulkCreate(
      [
        {
          name: 'Room A',
          capacity: 6,
          features: 'Whiteboard',
          type: 'standard',
          // pricePerHour: 0,
          creditsPerHour: 1
        },
        {
          name: 'Room B',
          capacity: 10,
          features: 'Whiteboard,Projector',
          type: 'standard',
          // pricePerHour: 0,
          creditsPerHour: 1
        },
        {
          name: 'Boardroom',
          capacity: 20,
          features: 'Whiteboard,Projector,Video Conf',
          type: 'boardroom',
          // pricePerHour: 0,
          creditsPerHour: 5
        }
      ],
      { ignoreDuplicates: true, transaction: t }
    );

    /* ---------------- RESOURCES ---------------- */
    await Resource.bulkCreate(
      [
        { name: 'Projector', quantity: 2, creditsPerHour: 1 },
        { name: 'Whiteboard', quantity: 5, creditsPerHour: 1 },
        { name: 'TV Screen', quantity: 4, creditsPerHour: 2 },
        { name: 'Video Conf', quantity: 3, creditsPerHour: 3 }
      ],
      { ignoreDuplicates: true, transaction: t }
    );

    /* ---------------- DEPARTMENT CREDITS ---------------- */
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    for (const dept of [engineering, sales]) {
      await DepartmentCredit.findOrCreate({
        where: { departmentId: dept.id, month, year },
        defaults: {
          availableCredits: 100,
          lockedCredits: 0
        },
        transaction: t
      });
    }

    await t.commit();

    res?.json?.({ ok: true, message: 'Seeded sample data successfully' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res?.status?.(500)?.json?.({ error: err.message });
  }
}

/* ---------------- RUN DIRECTLY SUPPORT (ESM) ---------------- */
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  (async () => {
    try {
      await sequelize.sync({ alter: true });
      await seedAll(
        {},
        { json: console.log, status: () => ({ json: console.log }) }
      );
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}

export default { seedAll };
