import { beforeEach, expect, test, vi } from "vitest";

const {
  findUniqueMock,
  getKeycloakAdminTokenMock,
  sendKeycloakResetEmailMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  getKeycloakAdminTokenMock: vi.fn(),
  sendKeycloakResetEmailMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("../src/clients/keycloak.client", () => ({
  getKeycloakAdminToken: getKeycloakAdminTokenMock,
  sendKeycloakResetEmail: sendKeycloakResetEmailMock,
  createKeycloakUser: vi.fn(),
  deleteKeycloakUser: vi.fn(),
  KeycloakError: class KeycloakError extends Error {},
}));

import { AuthService } from "../src/services/auth.service";

beforeEach(() => {
  vi.clearAllMocks();
});

test("AuthService - triggerPasswordReset skips deactivated users", async () => {
  findUniqueMock.mockResolvedValueOnce({ id: 44, active: false });

  const service = new AuthService();
  await service.triggerPasswordReset("deactivated@example.com");

  expect(getKeycloakAdminTokenMock).not.toHaveBeenCalled();
  expect(sendKeycloakResetEmailMock).not.toHaveBeenCalled();
});

test("AuthService - triggerPasswordReset sends request for active users", async () => {
  findUniqueMock.mockResolvedValueOnce({ id: 10, active: true });
  getKeycloakAdminTokenMock.mockResolvedValueOnce("admin-token");
  sendKeycloakResetEmailMock.mockResolvedValueOnce(undefined);

  const service = new AuthService();
  await service.triggerPasswordReset(" active.user@Example.com ");

  expect(findUniqueMock).toHaveBeenCalledWith({
    where: { email: "active.user@example.com" },
    select: { id: true, active: true },
  });
  expect(getKeycloakAdminTokenMock).toHaveBeenCalledTimes(1);
  expect(sendKeycloakResetEmailMock).toHaveBeenCalledWith("admin-token", "active.user@example.com");
});

test("AuthService - triggerPasswordReset still calls Keycloak for unknown local users", async () => {
  findUniqueMock.mockResolvedValueOnce(null);
  getKeycloakAdminTokenMock.mockResolvedValueOnce("admin-token");
  sendKeycloakResetEmailMock.mockResolvedValueOnce(undefined);

  const service = new AuthService();
  await service.triggerPasswordReset("unknown@example.com");

  expect(getKeycloakAdminTokenMock).toHaveBeenCalledTimes(1);
  expect(sendKeycloakResetEmailMock).toHaveBeenCalledWith("admin-token", "unknown@example.com");
});
