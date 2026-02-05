import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create postgres client
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for use in other// Exports
export * from './schema';
export * from './queries/users';
export * from './queries/sounds';
export { eq, and, or, desc, asc, sql } from 'drizzle-orm';
export type Database = typeof db;
