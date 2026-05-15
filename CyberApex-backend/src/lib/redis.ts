import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  family: 0, // Force IPv4 to prevent Upstash connection reset issues
  keepAlive: 10000, // Send TCP keepalives to prevent idle disconnects
  connectTimeout: 15000,
  ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));
