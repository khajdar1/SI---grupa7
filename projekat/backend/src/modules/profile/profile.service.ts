import { prisma } from "../../config/database";
import {
  getKeycloakAdminToken,
  KeycloakError,
  loginKeycloakUser,
  setKeycloakUserPassword,
  updateKeycloakUser,
} from "../../clients/keycloak.client";
import type { ChangePasswordInput, UpdateProfileInput } from "./profile.schema";

export type ProfileResponse = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  language: string;
  active: boolean;
};

type ProfileUserRecord = ProfileResponse & {
  externalIdentities: Array<{
    provider: string;
    providerSubject: string;
  }>;
};

export class ProfileNotFoundError extends Error {
  constructor(message = "Profile could not be found.") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileConflictError extends Error {
  constructor(message = "Email address is already taken.") {
    super(message);
    this.name = "ProfileConflictError";
  }
}

export class InvalidCurrentPasswordError extends Error {
  constructor(message = "Current password is incorrect.") {
    super(message);
    this.name = "InvalidCurrentPasswordError";
  }
}

function sanitizeProfile(user: ProfileUserRecord): ProfileResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    language: user.language,
    active: user.active,
  };
}

function getKeycloakSubject(user: ProfileUserRecord): string {
  const keycloakIdentity = user.externalIdentities.find(
    (identity) => identity.provider === "keycloak",
  );

  if (!keycloakIdentity) {
    throw new ProfileNotFoundError("Profile is not linked to a Keycloak account.");
  }

  return keycloakIdentity.providerSubject;
}

export class ProfileService {
  async getProfile(localUserId?: number): Promise<ProfileResponse> {
    const user = await this.requireProfile(localUserId);
    return sanitizeProfile(user);
  }

  async updateProfile(localUserId: number | undefined, input: UpdateProfileInput): Promise<ProfileResponse> {
    const existing = await this.requireProfile(localUserId);

    const duplicateEmail = await prisma.user.findFirst({
      where: {
        email: input.email,
        NOT: { id: existing.id },
      },
      select: { id: true },
    });

    if (duplicateEmail) {
      throw new ProfileConflictError();
    }

    const keycloakSub = getKeycloakSubject(existing);
    const adminToken = await getKeycloakAdminToken();

    try {
      await updateKeycloakUser(adminToken, keycloakSub, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "KEYCLOAK_CONFLICT") {
        throw new ProfileConflictError();
      }
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        language: input.language,
      },
      select: profileSelect,
    });

    return sanitizeProfile(updated);
  }

  async changePassword(localUserId: number | undefined, input: ChangePasswordInput): Promise<void> {
    const user = await this.requireProfile(localUserId);
    const keycloakSub = getKeycloakSubject(user);

    try {
      await loginKeycloakUser(user.username, input.currentPassword);
    } catch (error) {
      if (error instanceof KeycloakError && error.message === "Invalid username or password.") {
        throw new InvalidCurrentPasswordError();
      }
      throw error;
    }

    const adminToken = await getKeycloakAdminToken();
    await setKeycloakUserPassword(adminToken, keycloakSub, input.newPassword);
  }

  private async requireProfile(localUserId?: number): Promise<ProfileUserRecord> {
    if (!localUserId) {
      throw new ProfileNotFoundError();
    }

    const user = await prisma.user.findUnique({
      where: { id: localUserId },
      select: profileSelect,
    });

    if (!user || !user.active) {
      throw new ProfileNotFoundError();
    }

    return user;
  }
}

const profileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  language: true,
  active: true,
  externalIdentities: {
    select: {
      provider: true,
      providerSubject: true,
    },
  },
} as const;
