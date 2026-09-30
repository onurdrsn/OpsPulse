import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// .dev.vars veya .env dosyasından DATABASE_URL'i okur
dotenv.config({ path: '.dev.vars' });
dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment or .dev.vars');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
