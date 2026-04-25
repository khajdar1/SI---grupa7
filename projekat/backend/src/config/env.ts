import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().default('change-me'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

export const env = envSchema.parse(process.env);