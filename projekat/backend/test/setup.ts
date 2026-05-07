import { prisma } from '../src/config/database';
import { createPrismaSeedClient, seedDatabase } from '../src/scripts/seed';

async function waitForPrisma(retries = 20, delayMs = 500): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt a lightweight query
      if (!prisma) return false;
      await prisma.$executeRaw`SELECT 1`;
      return true;
    } catch (e) {
      // wait and retry
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

export default (async function setup() {
  const ready = await waitForPrisma();
  if (!ready) {
    // Provide a clear message; tests will still run but many DB-backed tests will likely fail.
    // The recommended action is to start the project's Docker Compose stack before running tests:
    // `npm run compose:up` from the project root.
    // We intentionally do not throw here to allow pure unit tests to run.
    // eslint-disable-next-line no-console
    console.warn('Database not reachable. Start the Docker compose stack (npm run compose:up) to run DB-backed tests.');
    return;
  }

  // Seed the demo dataset used by tests
  try {
    await seedDatabase(createPrismaSeedClient(prisma));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Seeding the test database failed:', err instanceof Error ? err.message : err);
  }
})();
