export type ContentStoreMode = "file" | "sqlite" | "postgres";

const DEFAULT_SQLITE_PATH = "data/content/passdrive.sqlite";

export function getContentStoreMode(): ContentStoreMode {
  const mode = process.env.CONTENT_STORE_MODE?.trim();

  if (mode === "sqlite" || mode === "postgres") {
    return mode;
  }

  return "file";
}

export function isRelationalContentStoreMode(mode: ContentStoreMode): mode is "sqlite" | "postgres" {
  return mode === "sqlite" || mode === "postgres";
}

export function getContentDatabaseUrl(mode: "sqlite" | "postgres") {
  const configured = process.env.CONTENT_DATABASE_URL?.trim();

  if (mode === "sqlite") {
    return configured && configured.length > 0 ? configured : DEFAULT_SQLITE_PATH;
  }

  if (!configured) {
    throw new Error("CONTENT_DATABASE_URL is required when CONTENT_STORE_MODE=postgres.");
  }

  return configured;
}

export function shouldAutoSeedContentDatabase(mode: "sqlite" | "postgres") {
  const configured = process.env.CONTENT_DB_AUTO_SEED?.trim();

  if (configured === "true") {
    return true;
  }

  if (configured === "false") {
    return false;
  }

  return mode === "sqlite" && !Boolean(process.env.VERCEL);
}
