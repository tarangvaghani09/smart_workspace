import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { sequelize } from './models/index.js';
import routes from './routes.js';
import cronJobs from './cron/jobs.js';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();
// app.use((req, res, next) => {
//   console.log("EXPRESS HIT:", req.url);
//   next();
// });
app.set('trust proxy', 'loopback');
app.use(express.static(path.join(process.cwd(), 'src/public')));

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// routes
app.use('/api', apiLimiter, routes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Workspace Booking API Docs'
  })
);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // TEST DATABASE CONNECTION
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // ensure tmp directory exists for .ics files
    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // sync DB
    // await sequelize.sync({ alter: true });
    await sequelize.sync();

    console.log('✅ Database synchronized');

    // const app = express();
    // app.use(bodyParser.json());
    // app.use('/api', routes);

    app.listen(PORT, () => {
      console.log(`🚀 Smart Workspace backend listening at http://localhost:${PORT}`);
      console.log('📄 Swagger docs at http://localhost:3000/docs');
    });

    // start cron jobs
    cronJobs.startAll();

  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
