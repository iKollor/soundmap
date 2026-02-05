import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://soundmap:soundmap_dev@localhost:5432/soundmap',
    },
    // CRITICAL: Ignore PostGIS system tables
    extensionsFilters: ['postgis'],
    verbose: true,
    strict: true,
});
