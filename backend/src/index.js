import 'dotenv/config';
import express from 'express';
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
app.set('trust proxy', 'loopback');
app.use(express.static(path.join(process.cwd(), 'src/public')));

const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.5.91:3000'
];
if (process.env.FRONTEND_URL) {
  const urls = process.env.FRONTEND_URL.split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  allowedOrigins.push(...urls);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow Vercel preview/prod domains for this app without needing to keep env in sync.
    // Example: https://smart-workspace-*.vercel.app
    try {
      const url = new URL(origin);
      if (
        url.protocol === 'https:' &&
        url.hostname.endsWith('.vercel.app') &&
        url.hostname.startsWith('smart-workspace-')
      ) {
        return callback(null, true);
      }
    } catch {
      // ignore URL parsing errors
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

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

// Bind the port as early as possible so Render can detect the service quickly.
// DB sync/alter can take time, and delaying `listen()` can cause transient 502s ("no deploy").
const server = app.listen(PORT, () => {
  console.log(`Smart Workspace backend listening at http://localhost:${PORT}`);
  console.log('Swagger docs at http://192.168.5.91:3000/docs');
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    cronJobs.startAll();
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    server.close(() => {
      process.exit(1);
    });
    process.exit(1);
  }
}

start();
