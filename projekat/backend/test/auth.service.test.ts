import { beforeEach, expect, test, vi } from "vitest";

const {
  findUniqueMock,
  passwordResetCreateMock,
  passwordResetFindUniqueMock,
  passwordResetUpdateManyMock,
  sendPasswordResetEmailMock,
  getKeycloakAdminTokenMock,
  setKeycloakUserPasswordMock,
  logoutKeycloakUserSessionsMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  passwordResetCreateMock: vi.fn(),
  passwordResetFindUniqueMock: vi.fn(),
  passwordResetUpdateManyMock: vi.fn(),
  sendPasswordResetEmailMock: vi.fn(),
  getKeycloakAdminTokenMock: vi.fn(),
  setKeycloakUserPasswordMock: vi.fn(),
  logoutKeycloakUserSessionsMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
    passwordResetToken: {
      create: passwordResetCreateMock,
      findUnique: passwordResetFindUniqueMock,
      updateMany: passwordResetUpdateManyMock,
    },
  },
}));

vi.mock("../src/clients/keycloak.client", () => ({
  getKeycloakAdminToken: getKeycloakAdminTokenMock,
  setKeycloakUserPassword: setKeycloakUserPasswordMock,
  logoutKeycloakUserSessions: logoutKeycloakUserSessionsMock,
  createKeycloakUser: vi.fn(),
  deleteKeycloakUser: vi.fn(),
  KeycloakError: class KeycloakError extends Error {},
}));

vi.mock("../src/clients/email.client", () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

import { AuthService } from "../src/services/auth.service";

beforeEach(() => {
  vi.clearAllMocks();
});

test("AuthService - triggerPasswordReset skips deactivated users", async () => {
  findUniqueMock.mockResolvedValueOnce({ id: 44, active: false });

  const service = new AuthService();
  await service.triggerPasswordReset("deactivated@example.com");

  expect(passwordResetCreateMock).not.toHaveBeenCalled();
  expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
});

test("AuthService - triggerPasswordReset creates token and sends email for active users", async () => {
  findUniqueMock.mockResolvedValueOnce({
    id: 10,
    active: true,
    externalIdentities: [{ provider: "keycloak", providerSubject: "kc-10" }],
  });
  passwordResetCreateMock.mockResolvedValueOnce({ id: 99 });
  sendPasswordResetEmailMock.mockResolvedValueOnce(undefined);

  const service = new AuthService();
  await service.triggerPasswordReset(" active.user@Example.com ");

  expect(findUniqueMock).toHaveBeenCalledWith({
    where: { email: "active.user@example.com" },
    select: {
      id: true,
      active: true,
      externalIdentities: {
        select: {
          provider: true,
          providerSubject: true,
        },
      },
    },
  });
  expect(passwordResetCreateMock).toHaveBeenCalledWith({
    data: expect.objectContaining({
      userId: 10,
      tokenHash: expect.any(String),
      expiresAt: expect.any(Date),
    }),
  });
  expect(sendPasswordResetEmailMock).toHaveBeenCalledWith("active.user@example.com", expect.any(String));
});

test("AuthService - triggerPasswordReset stays neutral for unknown local users", async () => {
  findUniqueMock.mockResolvedValueOnce(null);

  const service = new AuthService();
  await service.triggerPasswordReset("unknown@example.com");

  expect(passwordResetCreateMock).not.toHaveBeenCalled();
  expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
});

test("AuthService - confirmPasswordReset sets password and invalidates sessions once", async () => {
  const expiresAt = new Date(Date.now() + 1000 * 60);
  passwordResetFindUniqueMock.mockResolvedValueOnce({
    id: 4,
    expiresAt,
    usedAt: null,
    user: {
      id: 10,
      active: true,
      externalIdentities: [{ provider: "keycloak", providerSubject: "kc-10" }],
    },
  });
  passwordResetUpdateManyMock.mockResolvedValueOnce({ count: 1 });
  getKeycloakAdminTokenMock.mockResolvedValueOnce("admin-token");
  setKeycloakUserPasswordMock.mockResolvedValueOnce(undefined);
  logoutKeycloakUserSessionsMock.mockResolvedValueOnce(undefined);

  const service = new AuthService();
  await service.confirmPasswordReset({
    token: "x".repeat(64),
    password: "Password1",
    confirmPassword: "Password1",
  });

  expect(passwordResetUpdateManyMock).toHaveBeenCalledWith({
    where: {
      id: 4,
      usedAt: null,
      expiresAt: { gt: expect.any(Date) },
    },
    data: { usedAt: expect.any(Date) },
  });
  expect(setKeycloakUserPasswordMock).toHaveBeenCalledWith("admin-token", "kc-10", "Password1");
  expect(logoutKeycloakUserSessionsMock).toHaveBeenCalledWith("admin-token", "kc-10");
});
