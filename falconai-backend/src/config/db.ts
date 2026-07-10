import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@app/schema/tables";
import logger from "@app/services/logging/logger";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  logger.error("Unexpected database pool error:", err);
});

pool.on("connect", (client) => {
  client.on("error", (err) => {
    logger.error("Database client error:", err);
  });
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing database pool...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, closing database pool...");
  await pool.end();
  process.exit(0);
});

export const db = drizzle(pool, { schema });
