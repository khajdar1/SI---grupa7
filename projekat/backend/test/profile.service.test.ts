import { beforeEach, expect, test, vi } from "vitest";

const {
  userFindUniqueMock,
  userFindFirstMock,
  userUpdateMock,
  getKeycloakAdminTokenMock,
  updateKeycloakUserMock,
  loginKeycloakUserMock,
  setKeycloakUserPasswordMock,
} = vi.hoisted(() => ({
  userFindUniqueMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  userUpdateMock: vi.fn(),
  getKeycloakAdminTokenMock: vi.fn(),
  updateKeycloakUserMock: vi.fn(),
  loginKeycloakUserMock: vi.fn(),
  setKeycloakUserPasswordMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      findFirst: userFindFirstMock,
      update: userUpdateMock,
    },
  },
}));

vi.mock("../src/clients/keycloak.client", () => ({
  getKeycloakAdminToken: getKeycloakAdminTokenMock,
  updateKeycloakUser: updateKeycloakUserMock,
  loginKeycloakUser: loginKeycloakUserMock,
  setKeycloakUserPassword: setKeycloakUserPasswordMock,
}));

import {
  InvalidCurrentPasswordError,
  ProfileConflictError,
  ProfileService,
} from "../src/modules/profile/profile.service";

function buildProfileUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    firstName: "Ana",
    lastName: "Admin",
    username: "ana.admin",
    email: "ana.admin@example.com",
    active: true,
    externalIdentities: [{ provider: "keycloak", providerSubject: "kc-7" }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("ProfileService - getProfile returns current user's contact data", async () => {
  userFindUniqueMock.mockResolvedValueOnce(buildProfileUser());

  const profile = await new ProfileService().getProfile(7);

  expect(profile).toEqual({
    id: 7,
    firstName: "Ana",
    lastName: "Admin",
    username: "ana.admin",
    email: "ana.admin@example.com",
    active: true,
  });
});

test("ProfileService - updateProfile rejects duplicate email", async () => {
  userFindUniqueMock.mockResolvedValueOnce(buildProfileUser());
  userFindFirstMock.mockResolvedValueOnce({ id: 9 });

  await expect(
    new ProfileService().updateProfile(7, {
      firstName: "Ana",
      lastName: "Admin",
      email: "taken@example.com",
    }),
  ).rejects.toBeInstanceOf(ProfileConflictError);

  expect(updateKeycloakUserMock).not.toHaveBeenCalled();
  expect(userUpdateMock).not.toHaveBeenCalled();
});

test("ProfileService - updateProfile updates Keycloak and local profile", async () => {
  userFindUniqueMock.mockResolvedValueOnce(buildProfileUser());
  userFindFirstMock.mockResolvedValueOnce(null);
  getKeycloakAdminTokenMock.mockResolvedValueOnce("admin-token");
  updateKeycloakUserMock.mockResolvedValueOnce(undefined);
  userUpdateMock.mockResolvedValueOnce(
    buildProfileUser({
      firstName: "Anela",
      email: "anela@example.com",
    }),
  );

  const updated = await new ProfileService().updateProfile(7, {
    firstName: "Anela",
    lastName: "Admin",
    email: "anela@example.com",
  });

  expect(updateKeycloakUserMock).toHaveBeenCalledWith("admin-token", "kc-7", {
    firstName: "Anela",
    lastName: "Admin",
    email: "anela@example.com",
  });
  expect(updated.email).toBe("anela@example.com");
});

test("ProfileService - changePassword rejects invalid current password", async () => {
  userFindUniqueMock.mockResolvedValueOnce(buildProfileUser());
  loginKeycloakUserMock.mockRejectedValueOnce(new Error("bad credentials"));

  await expect(
    new ProfileService().changePassword(7, {
      currentPassword: "WrongPassword1",
      newPassword: "Password2",
      confirmPassword: "Password2",
    }),
  ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);

  expect(setKeycloakUserPasswordMock).not.toHaveBeenCalled();
});

test("ProfileService - changePassword verifies current password then sets new one", async () => {
  userFindUniqueMock.mockResolvedValueOnce(buildProfileUser());
  loginKeycloakUserMock.mockResolvedValueOnce({ access_token: "a", refresh_token: "r" });
  getKeycloakAdminTokenMock.mockResolvedValueOnce("admin-token");
  setKeycloakUserPasswordMock.mockResolvedValueOnce(undefined);

  await new ProfileService().changePassword(7, {
    currentPassword: "Password1",
    newPassword: "Password2",
    confirmPassword: "Password2",
  });

  expect(loginKeycloakUserMock).toHaveBeenCalledWith("ana.admin", "Password1");
  expect(setKeycloakUserPasswordMock).toHaveBeenCalledWith("admin-token", "kc-7", "Password2");
});
