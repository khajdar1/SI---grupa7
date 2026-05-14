import { existsSync } from 'node:fs';
import path from 'node:path';

import { config as loadDotenv } from 'dotenv';

let dotenvLoaded = false;

function loadProjectDotenv(): void {
  if (dotenvLoaded) {
    return;
  }

  const dotenvCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ];

  for (const dotenvPath of dotenvCandidates) {
    if (existsSync(dotenvPath)) {
      loadDotenv({ path: dotenvPath });
      break;
    }
  }

  dotenvLoaded = true;
}

export function requireDatabaseUrl(context: string): string {
  loadProjectDotenv();

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `DATABASE_URL is required for ${context}. Copy projekat/.env.example to projekat/.env and set DATABASE_URL.`,
    );
  }

  return databaseUrl;
}