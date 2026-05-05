import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";

const {
  externalIdentityFindFirstMock,
  userFindUniqueMock,
  getKeycloakAdminTokenMock,
  getKeycloakUserRoleNamesMock,
} = vi.hoisted(() => ({
  externalIdentityFindFirstMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  getKeycloakAdminTokenMock: vi.fn(),
  getKeycloakUserRoleNamesMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    externalIdentity: {
      findFirst: externalIdentityFindFirstMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}));

vi.mock("../src/clients/keycloak.client", () => ({
  getKeycloakAdminToken: getKeycloakAdminTokenMock,
  getKeycloakUserRoleNames: getKeycloakUserRoleNamesMock,
}));

import { authenticate, authorizeRoles } from "../src/middleware/auth.middleware";

type MockRequest = {
  header: (name: string) => string | undefined;
  user?: {
    id?: string;
    username?: string;
    roles: string[];
  };
};

type MockResponse = {
  statusCode?: number;
  body?: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  return {
    statusCode: undefined,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function createToken(payload: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

beforeEach(() => {
  vi.clearAllMocks();
  externalIdentityFindFirstMock.mockResolvedValue(null);
  userFindUniqueMock.mockResolvedValue(null);
  getKeycloakAdminTokenMock.mockResolvedValue("admin-token");
  getKeycloakUserRoleNamesMock.mockResolvedValue(["Admin"]);
});

test("authenticate rejects expired tokens", async () => {
  const expiredToken = createToken({
    sub: "123",
    preferred_username: "ana",
    exp: Math.floor(Date.now() / 1000) - 30,
    realm_access: { roles: ["Admin"] },
  });

  const req: MockRequest = {
    header(name: string) {
      return name.toLowerCase() === "authorization" ? `Bearer ${expiredToken}` : undefined;
    },
  };
  const res = createMockResponse();

  let nextCalled = false;
  await authenticate(
    req as never,
    res as never,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: "Authentication token has expired" });
});

test("authorizeRoles matches roles case-insensitively", async () => {
  const req: MockRequest = {
    header() {
      return undefined;
    },
    user: {
      id: "123",
      username: "ana",
      roles: ["Admin"],
    },
  };
  const res = createMockResponse();

  let nextCalled = false;
  await authorizeRoles(["administrator", "admin"])(
    req as never,
    res as never,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
});

test("authenticate rejects deactivated local users", async () => {
  const token = createToken({
    sub: "kc-123",
    preferred_username: "ana",
    exp: Math.floor(Date.now() / 1000) + 300,
    realm_access: { roles: ["Admin"] },
  });
  externalIdentityFindFirstMock.mockResolvedValueOnce({
    user: {
      id: 1,
      username: "ana",
      active: false,
    },
  });

  const req: MockRequest = {
    header(name: string) {
      return name.toLowerCase() === "authorization" ? `Bearer ${token}` : undefined;
    },
  };
  const res = createMockResponse();

  let nextCalled = false;
  await authenticate(
    req as never,
    res as never,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: "User account is deactivated" });
});
