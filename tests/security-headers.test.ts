import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

async function headersFor(environment: "development" | "production") {
  vi.stubEnv("NODE_ENV", environment);
  vi.resetModules();
  const { default: config } = await import("../next.config");
  const rules = await config.headers!();
  return new Map(rules[0].headers.map(({ key, value }) => [key, value]));
}

describe("environment-specific security headers", () => {
  test("development permits Next.js debugging scripts and local HTTP", async () => {
    const headers = await headersFor("development");
    const csp = headers.get("Content-Security-Policy");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' ws: wss:");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(headers.has("Strict-Transport-Security")).toBe(false);
  });
  test("production retains HTTPS enforcement and disallows eval", async () => {
    const headers = await headersFor("production");
    const csp = headers.get("Content-Security-Policy");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).toContain("connect-src 'self';");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
  });
});
