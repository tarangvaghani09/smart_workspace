import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null   // REQUIRED for BullMQ
});

connection.on('connect', () => {
  console.log('🟢 Redis connected');
});

connection.on('ready', () => {
  console.log('✅ Redis ready to use');
});

connection.on('error', err => {
  console.error('❌ Redis connection error:', err.message);
});

connection.on('close', () => {
  console.warn('⚠️ Redis connection closed');
});

connection.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

export default connection;