import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  ...(connectionString ? { dbCredentials: { url: connectionString } } : {}),
  strict: true,
  verbose: true,
});
