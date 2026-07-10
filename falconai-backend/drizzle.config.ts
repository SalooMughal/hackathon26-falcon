import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  schema: "./src/schema/tables", // where your schema files will live
  out: "./src/schema/generated", // where migrations will be generated
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // postgres connection string
  },
});
