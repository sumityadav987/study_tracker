import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().transform(Number).default('4000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  MONGODB_URI: z.string(),
  FIREBASE_PROJECT_ID: z.string()
});

export const config = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID
});