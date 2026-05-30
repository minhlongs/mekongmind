import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { lead } from './routes/lead';
import { health } from './routes/health';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware — supports wildcard pattern for *.pages.dev
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim());
  return cors({
    origin: (origin) => {
      if (!origin) return null;
      for (const allowed of allowedOrigins) {
        if (allowed === '*' || allowed === origin) return origin;
        if (allowed.includes('*')) {
          // Regex-escape then replace * with .* for wildcard matching
          const escaped = allowed.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
          if (new RegExp(`^${escaped}$`).test(origin)) return origin;
        }
      }
      return null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })(c, next);
});

app.route('/api/health', health);
app.route('/api/lead', lead);

app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({ error: 'Lỗi máy chủ nội bộ' }, 500);
});

app.notFound((c) => c.json({ error: 'Không tìm thấy' }, 404));

export default app;
