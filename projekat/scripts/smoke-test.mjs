const DEFAULT_BACKEND_HEALTH_URL = 'http://localhost:4000/api/v1/health';
const DEFAULT_FRONTEND_URL = 'http://localhost:3000';
const retries = Number.parseInt(process.env.SMOKE_RETRIES || '1', 10);
const retryDelayMs = Number.parseInt(process.env.SMOKE_RETRY_DELAY_MS || '5000', 10);

const checks = [
  {
    name: 'Backend health',
    url: process.env.BACKEND_HEALTH_URL || DEFAULT_BACKEND_HEALTH_URL,
    expectJsonStatus: 'ok',
  },
  {
    name: 'Frontend page',
    url: process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL,
  },
];

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCheck(check) {
  const response = await fetchWithTimeout(check.url);

  if (!response.ok) {
    throw new Error(`${check.name} failed: ${response.status} ${response.statusText} (${check.url})`);
  }

  if (check.expectJsonStatus) {
    const body = await response.json();
    if (body.status !== check.expectJsonStatus) {
      throw new Error(`${check.name} returned status "${body.status}", expected "${check.expectJsonStatus}".`);
    }
  }

  console.log(`${check.name}: OK (${check.url})`);
}

for (const check of checks) {
  let lastError;

  for (let attempt = 1; attempt <= Math.max(1, retries); attempt += 1) {
    try {
      await runCheck(check);
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.log(`${check.name}: retry ${attempt}/${retries} failed, waiting ${retryDelayMs}ms...`);
        await sleep(retryDelayMs);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
}
