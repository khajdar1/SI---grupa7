import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultDatabaseUrl = 'mysql://placeholder:placeholder@example.invalid:3306/placeholder';

const steps = [
  {
    name: 'Generate Prisma client',
    args: ['run', 'prisma:generate', '--workspace', 'backend'],
  },
  {
    name: 'Typecheck backend and frontend',
    args: ['run', 'typecheck'],
  },
  {
    name: 'Run automated backend and frontend tests',
    args: ['run', 'test'],
  },
  {
    name: 'Run Playwright browser automation tests',
    args: ['run', 'test:e2e'],
  },
];

if (process.env.RUN_SMOKE_TESTS === 'true') {
  steps.push({
    name: 'Run deployment smoke tests',
    args: ['run', 'test:smoke'],
  });
} else {
  console.log('Skipping smoke tests. Set RUN_SMOKE_TESTS=true when backend and frontend are running.');
}

for (const step of steps) {
  console.log(`\n== ${step.name} ==`);
  const result = spawnSync(npmCommand, step.args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || defaultDatabaseUrl,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\nAutomation test suite finished successfully.');
