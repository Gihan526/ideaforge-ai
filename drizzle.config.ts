import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  tablesFilter: ['user', 'session', 'account', 'verification', 'ideas', 'todos'],
  dbCredentials: {
    // Supabase's transaction pooler (port 6543) can't run migrations — it lacks
    // session/prepared-statement support and hangs. Use the session pooler (5432).
    url: process.env.DATABASE_URL!.replace(':6543', ':5432'),
  },
});
