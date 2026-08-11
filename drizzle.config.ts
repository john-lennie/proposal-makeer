import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "drizzle-kit";

import { getServerEnvironment } from "./src/lib/env";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const { DATABASE_URL } = getServerEnvironment();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: DATABASE_URL,
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle",
  },
  strict: true,
  verbose: true,
});
