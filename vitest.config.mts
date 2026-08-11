import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/support/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
