import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create postgres client with optimized connection settings
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
    // Connection pool settings
    max: 20, // Maximum pool size
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // Connection timeout in seconds

    // Retry settings
    max_lifetime: 60 * 30, // Max connection lifetime (30 minutes)

    // Performance settings
    prepare: true, // Use prepared statements

    // Error handling
    onnotice: () => { }, // Suppress notices in production

    // Logging (only in development)
    debug: process.env.NODE_ENV === 'development' ?
        (_connection: number, query: string) => console.log('DB Query:', query) :
        undefined,
});

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for use in other// Exports
export * from './schema';
export * from './queries/users';
export * from './queries/sounds';
export { eq, and, or, desc, asc, sql } from 'drizzle-orm';
export type Database = typeof db;
