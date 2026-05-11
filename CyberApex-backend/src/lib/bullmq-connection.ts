import type { ConnectionOptions } from 'bullmq';

function parseBullMQConnection(): ConnectionOptions {
  // BULLMQ_REDIS_URL takes priority; falls back to REDIS_URL; then defaults to port 6380 (Redis 5+)
  const url = process.env.BULLMQ_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6380';

  try {
    const parsed = new URL(url);
    const opts: ConnectionOptions = {
      host:     parsed.hostname || 'localhost',
      port:     Number(parsed.port) || 6380,
      password: parsed.password || undefined,
      db:       parsed.pathname && parsed.pathname !== '/'
        ? Number(parsed.pathname.slice(1))
        : undefined,
      tls:      parsed.protocol === 'rediss:' ? {} : undefined,
    };
    // Remove undefined keys
    (Object.keys(opts) as (keyof ConnectionOptions)[]).forEach(
      (k) => opts[k] === undefined && delete opts[k],
    );
    return opts;
  } catch {
    return { host: 'localhost', port: 6380 };
  }
}

export const bullmqConnection: ConnectionOptions = parseBullMQConnection();
