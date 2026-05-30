import { Hono } from 'hono';
import type { Env } from '../types';

export const health = new Hono<{ Bindings: Env }>();

health.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    build: c.env?.BUILD_SHA ?? 'dev',
  });
});
