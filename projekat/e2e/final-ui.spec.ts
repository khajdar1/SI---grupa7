import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const API_BASE = 'http://localhost:4000/api/v1';

function base64Url(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeToken(roles: string[]) {
  const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    sub: 'kc-e2e-user',
    preferred_username: 'koordinator1',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    realm_access: { roles },
  }));

  return `${header}.${payload}.signature`;
}

async function authenticate(context: BrowserContext, page: Page, roles: string[] = ['Koordinator', 'Admin']) {
  const token = makeToken(roles);

  await context.addCookies([
    {
      name: 'token',
      value: token,
      url: 'http://127.0.0.1:3000',
    },
  ]);

  await page.addInitScript(({ authToken, authRoles }) => {
    window.localStorage.setItem('token', authToken);
    window.localStorage.setItem('user', JSON.stringify({
      id: 3,
      username: 'koordinator1',
      roles: authRoles,
      language: 'en',
    }));
    window.localStorage.setItem('language', 'en');
  }, { authToken: token, authRoles: roles });
}

async function mockSettingsApi(page: Page) {
  await page.route(`${API_BASE}/user-preferences`, async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as {
        language?: string;
        notificationPreferences?: Record<string, boolean>;
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          language: body.language ?? 'en',
          notificationPreferences: body.notificationPreferences ?? {},
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        language: 'en',
        notificationPreferences: {
          FEEDBACK_REQUEST: true,
          NEW_TICKET: true,
          TICKET_REPLY: true,
          STATUS_CHANGED: true,
          INTERVENTION_ASSIGNED: true,
        },
      }),
    });
  });
}

async function mockInterventionsApi(page: Page) {
  const now = new Date();
  const future = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const later = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

  await page.route(`${API_BASE}/categories`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Električni kvar', description: 'Kvarovi na elektro instalacijama', active: true },
      ]),
    });
  });

  await page.route(`${API_BASE}/interventions/options`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        companies: [{ id: 1, name: 'Demo firma' }],
        categories: [{ id: 1, name: 'Električni kvar' }],
        faultReports: [],
      }),
    });
  });

  await page.route(`${API_BASE}/interventions`, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '99',
          title: body.name,
          name: body.name,
          description: body.description,
          location: body.location,
          categoryId: body.categoryId,
          categoryName: 'Električni kvar',
          companyId: body.companyId,
          companyName: 'Demo firma',
          priority: body.priority,
          status: 'NEW',
          type: 'PREVENTIVE',
          owner: 'koordinator1',
          createdAt: now.toISOString(),
          startedAt: body.startedAt,
          dueAt: body.dueAt,
          faultReport: null,
          assignments: [],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '42',
          title: 'Popravak lifta',
          name: 'Popravak lifta',
          description: 'Lift ne radi između spratova.',
          location: 'Objekat A',
          categoryId: 1,
          categoryName: 'Električni kvar',
          companyId: 1,
          companyName: 'Demo firma',
          priority: 'HIGH',
          status: 'ASSIGNED',
          type: 'ISSUE',
          owner: 'koordinator1',
          createdAt: now.toISOString(),
          startedAt: future,
          dueAt: later,
          faultReport: { id: 5, description: 'Lift stao', reportedAt: now.toISOString() },
          assignments: [
            {
              id: 1,
              userId: 11,
              assignedAt: now.toISOString(),
              user: {
                id: 11,
                firstName: 'Serviser',
                lastName: 'Jedan',
                username: 'serviser1',
                email: 'serviser1@demo.local',
              },
            },
          ],
        },
      ]),
    });
  });
}

async function mockFinalModuleApis(page: Page) {
  const now = new Date();
  const future = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const later = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
  const company = {
    id: 1,
    name: 'Demo firma',
    contact: 'demo@firma.local',
    status: 'APPROVED',
    type: 'Facility',
    email: 'demo@firma.local',
    phone: '+38761111222',
    address: 'Sarajevo',
    identificationNumber: '4200000000000',
    adminUserId: null,
  };
  const category = { id: 1, name: 'Electrical fault', description: 'Electrical work', active: true };
  const intervention = {
    id: '42',
    title: 'Popravak lifta',
    name: 'Popravak lifta',
    summary: 'Popravak lifta',
    description: 'Lift ne radi izmedju spratova.',
    location: 'Objekat A',
    categoryId: 1,
    categoryName: category.name,
    companyId: 1,
    companyName: company.name,
    priority: 'HIGH',
    status: 'ASSIGNED',
    type: 'ISSUE',
    owner: 'koordinator1',
    servicer: 'Serviser Jedan',
    date: now.toISOString(),
    createdAt: now.toISOString(),
    startedAt: future,
    dueAt: later,
    faultReport: { id: 5, description: 'Lift stao', reportedAt: now.toISOString() },
    assignments: [
      {
        id: 1,
        userId: 11,
        assignedAt: now.toISOString(),
        user: {
          id: 11,
          firstName: 'Serviser',
          lastName: 'Jedan',
          username: 'serviser1',
          email: 'serviser1@demo.local',
        },
      },
    ],
  };
  const report = {
    id: 77,
    interventionId: 42,
    description: 'Finalni izvjestaj o popravci lifta.',
    materialItems: [{ name: 'Osigurac', quantity: 2, note: 'Zamjena' }],
    notes: 'Test report',
    status: 'FINALIZED',
    isRecommended: true,
    recommendedAt: now.toISOString(),
    recommendedById: 3,
    author: { id: 11, firstName: 'Serviser', lastName: 'Jedan', username: 'serviser1' },
    reportDate: now.toISOString(),
  };
  const feedbackAnalytics = {
    summary: { feedbackCount: 3, averageRating: 4.3, negativeCount: 1, negativeThreshold: 3 },
    ratingDistribution: [
      { rating: 5, count: 2, percentage: 66.67 },
      { rating: 2, count: 1, percentage: 33.33 },
    ],
    trends: [{ period: '2026-06', feedbackCount: 3, averageRating: 4.3, negativeCount: 1 }],
    byCompany: [{ companyId: 1, companyName: company.name, feedbackCount: 3, averageRating: 4.3, negativeCount: 1 }],
    byCategory: [{ categoryId: 1, categoryName: category.name, feedbackCount: 3, averageRating: 4.3, negativeCount: 1 }],
    byServicer: [{ servicerId: 11, servicerName: 'Serviser Jedan', feedbackCount: 3, averageRating: 4.3, negativeCount: 1 }],
    negativeFeedback: [
      {
        id: 1,
        interventionId: 42,
        interventionName: intervention.name,
        rating: 2,
        comment: 'Kasnjenje',
        createdAt: now.toISOString(),
        companyName: company.name,
        categoryName: category.name,
        user: { id: 21, firstName: 'Korisnik', lastName: 'Jedan', username: 'korisnik1' },
      },
    ],
  };

  await page.route(`${API_BASE}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    const fulfillJson = async (body: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

    if (request.method() !== 'GET') {
      await fulfillJson({ ok: true });
      return;
    }

    if (path === '/api/v1/health') {
      await fulfillJson({ status: 'ok' });
      return;
    }
    if (path === '/api/v1/categories') {
      await fulfillJson([category]);
      return;
    }
    if (path === '/api/v1/sla') {
      await fulfillJson([]);
      return;
    }
    if (path === '/api/v1/users') {
      await fulfillJson([
        { id: 3, firstName: 'Koordinator', lastName: 'Jedan', username: 'koordinator1', email: 'koord@demo.local', roles: ['Koordinator'], active: true },
        { id: 11, firstName: 'Serviser', lastName: 'Jedan', username: 'serviser1', email: 'serviser1@demo.local', roles: ['Serviser'], active: true },
      ]);
      return;
    }
    if (path === '/api/v1/companies' || path === '/api/v1/companies/me') {
      await fulfillJson(path === '/api/v1/companies' ? [company] : company);
      return;
    }
    if (path === '/api/v1/management/dashboard') {
      await fulfillJson({
        activeCount: 4,
        completedCount: 9,
        averageResolutionHours: 2.5,
        priorityDistribution: [
          { priority: 'HIGH', total: 4, active: 2, completed: 2 },
          { priority: 'MEDIUM', total: 6, active: 2, completed: 4 },
        ],
      });
      return;
    }
    if (path === '/api/v1/management/materials') {
      await fulfillJson({
        topMaterials: [{ name: 'Osigurac', totalQuantity: 2, reportCount: 1 }],
        byPeriod: [{ period: '2026-06', totalQuantity: 2, distinctMaterials: 1 }],
        byCompany: [{ companyId: 1, companyName: company.name, totalQuantity: 2 }],
        totalReportsWithMaterials: 1,
        totalQuantity: 2,
        totalDistinctMaterials: 1,
      });
      return;
    }
    if (path === '/api/v1/escalations') {
      await fulfillJson([]);
      return;
    }
    if (path === '/api/v1/fault-reports/options') {
      await fulfillJson({ companies: [company], categories: [category] });
      return;
    }
    if (path === '/api/v1/fault-reports') {
      await fulfillJson([]);
      return;
    }
    if (path === '/api/v1/interventions/options') {
      await fulfillJson({ companies: [company], categories: [category], faultReports: [] });
      return;
    }
    if (path === '/api/v1/interventions/history') {
      await fulfillJson({
        data: [intervention],
        pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
      });
      return;
    }
    if (path === '/api/v1/interventions') {
      await fulfillJson([intervention]);
      return;
    }
    if (/^\/api\/v1\/interventions\/\d+\/reports$/.test(path)) {
      await fulfillJson(report);
      return;
    }
    if (/^\/api\/v1\/feedback\/\d+$/.test(path)) {
      await fulfillJson({
        id: 1,
        interventionId: 42,
        userId: 21,
        rating: 5,
        comment: 'Odlicno',
        createdAt: now.toISOString(),
        user: { id: 21, firstName: 'Korisnik', lastName: 'Jedan', username: 'korisnik1' },
      });
      return;
    }
    if (path === '/api/v1/feedback/analytics') {
      await fulfillJson(feedbackAnalytics);
      return;
    }
    if (path === '/api/v1/blocking') {
      await fulfillJson([
        {
          id: 1,
          userId: 21,
          companyId: 1,
          coordinatorId: 3,
          reason: 'Test blokada',
          blockedAt: now.toISOString(),
          blockedUser: { id: 21, firstName: 'Korisnik', lastName: 'Jedan', username: 'korisnik1', email: 'korisnik@demo.local' },
          coordinator: { id: 3, firstName: 'Koordinator', lastName: 'Jedan', username: 'koordinator1' },
          company,
        },
      ]);
      return;
    }

    await fulfillJson([]);
  });
}

test.describe('Final UI automation tests', () => {
  test('login page validates required username and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page.getByText(/username/i).first()).toBeVisible();
    await expect(page.getByText(/password/i).first()).toBeVisible();
    await expect(page.locator('#username')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
  });

  test('settings page loads preferences, shows admin quick links and saves language', async ({ context, page }) => {
    await authenticate(context, page, ['Admin']);
    await mockSettingsApi(page);

    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Configuration Quick Links')).toBeVisible();
    await expect(page.getByRole('link', { name: /SLA Config/i })).toBeVisible();

    const saveRequest = page.waitForRequest((request) =>
      request.url() === `${API_BASE}/user-preferences` && request.method() === 'PUT',
    );

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(await saveRequest).toBeTruthy();
  });

  test('interventions page displays rows and navigates to the create intervention page', async ({ context, page }) => {
    await authenticate(context, page, ['Koordinator']);
    await mockInterventionsApi(page);

    await page.goto('/interventions');

    await expect(page.getByText('Popravak lifta')).toBeVisible();
    await expect(page.getByText('Serviser Jedan')).toBeVisible();

    await page.getByRole('link', { name: /new intervention/i }).click();

    await expect(page).toHaveURL(/\/interventions\/new$/);
  });

  test('core functional module pages render with mocked API data', async ({ context, page }) => {
    await authenticate(context, page, ['Admin', 'Koordinator', 'Management', 'Menadzment']);
    await mockFinalModuleApis(page);

    const moduleChecks = [
      { url: '/dashboard', heading: /admin dashboard/i },
      { url: '/fault-reports', heading: /fault reports/i },
      { url: '/reports', heading: /^reports$/i },
      { url: '/assignments', heading: /assignments/i },
      { url: '/management', heading: /management dashboard/i },
      { url: '/blocked-users', heading: /blocked users/i },
    ];

    for (const check of moduleChecks) {
      await page.goto(check.url);
      await expect(page.getByRole('heading', { name: check.heading }).first()).toBeVisible();
    }

    await page.goto('/reports');
    await expect(page.getByText('Feedback Analytics')).toBeVisible();
    await expect(page.getByText('Popravak lifta').first()).toBeVisible();
  });
});
