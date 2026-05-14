/// <reference types="node" />

import { defineConfig } from 'prisma/config';
import { requireDatabaseUrl } from './src/config/database-url';

const databaseUrl = requireDatabaseUrl('Prisma CLI commands');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/scripts/seed.ts',
  },
  engine: 'classic',
  datasource: {
    url: databaseUrl,
  },
});