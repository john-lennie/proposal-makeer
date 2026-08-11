const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

export interface ServerEnvironment {
  DATABASE_URL: string;
}

export interface AuthEnvironment {
  baseURL?: string;
  secret?: string;
}

export function getAuthEnvironment(): AuthEnvironment {
  const baseURL = process.env.BETTER_AUTH_URL?.trim();
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!baseURL) {
      throw new Error("BETTER_AUTH_URL is required in production.");
    }
    if (!secret || secret.length < 32) {
      throw new Error(
        "BETTER_AUTH_SECRET must contain at least 32 characters in production.",
      );
    }

    let parsedURL: URL;
    try {
      parsedURL = new URL(baseURL);
    } catch {
      throw new Error("BETTER_AUTH_URL must be a valid absolute URL.");
    }
    if (parsedURL.protocol !== "https:") {
      throw new Error("BETTER_AUTH_URL must use HTTPS in production.");
    }
    if (parsedURL.pathname !== "/" || parsedURL.search || parsedURL.hash) {
      throw new Error("BETTER_AUTH_URL must be an origin without a path, query, or hash.");
    }
  }

  return {
    ...(baseURL ? { baseURL: baseURL.replace(/\/$/, "") } : {}),
    ...(secret ? { secret } : {}),
  };
}

export function getServerEnvironment(): ServerEnvironment {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Add it to .env.local before using database commands.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (!POSTGRES_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }

  return { DATABASE_URL: databaseUrl };
}
