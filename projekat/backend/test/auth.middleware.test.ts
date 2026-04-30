import assert from "node:assert/strict";
import { test } from "vitest";

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

test("authenticate rejects expired tokens", () => {
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
  authenticate(
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

test("authorizeRoles matches roles case-insensitively", () => {
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
  authorizeRoles(["administrator", "admin"])(
    req as never,
    res as never,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
});
