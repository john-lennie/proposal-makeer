import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { getServerEnvironment } from "@/lib/env";

const globalForDatabase = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

function createPostgresClient() {
  const { DATABASE_URL } = getServerEnvironment();

  return postgres(DATABASE_URL, {
    // Vercel scales by creating more function instances. Keeping one
    // connection per instance prevents instance count × pool size from
    // exhausting Neon while still allowing transactions to reserve it.
    max: 1,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
  });
}

const client = globalForDatabase.postgresClient ?? createPostgresClient();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresClient = client;
}

export const database = drizzle(client, { schema });
