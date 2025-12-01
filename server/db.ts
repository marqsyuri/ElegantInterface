import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const DATABASE_URL = process.env.DATABASE_URL;
const isNeon = DATABASE_URL.includes('neon.tech');

let pool: any;
let db: any;

if (isNeon) {
  // Use Neon serverless driver for cloud connections
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
  console.log('🔌 Using Neon serverless PostgreSQL');
} else {
  // Use standard pg driver for local PostgreSQL
  const { Pool: PgPool } = pg;
  pool = new PgPool({ connectionString: DATABASE_URL });
  db = drizzlePg(pool, { schema });
  console.log('🔌 Using local PostgreSQL');
}

export { pool, db, isNeon as isNeonDatabase };