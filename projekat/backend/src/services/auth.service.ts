import { prisma } from "../config/database";
import type { RegisterInput} from "../modules/auth/auth.schema";
import {
  getKeycloakAdminToken,
  createKeycloakUser,
  deleteKeycloakUser,
  KeycloakError,
} from "../clients/keycloak.client";

export { KeycloakError };

export type RegisteredUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: Date;
};

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

async function assertNoDuplicateUser(username: string, email: string): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    throw new ConflictError("Username or email is already taken.");
  }
}

async function persistUser(
  data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  },
  keycloakSub: string
): Promise<RegisteredUser> {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      externalIdentities: {
        create: {
          provider: "keycloak",
          providerSubject: keycloakSub,
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });
}

export class AuthService {
  async register(input: RegisterInput): Promise<RegisteredUser> {
    const { firstName, lastName, username, email } = input;

    console.log(
      `[AuthService] Self-registration attempt — username: ${username}, email: ${email}`
    );

    await assertNoDuplicateUser(username, email);

    const keycloakSub = await this.createKeycloakUserSafe(input);

    try {
      const user = await persistUser({ firstName, lastName, username, email }, keycloakSub);
      console.log(`[AuthService] User registered successfully (id: ${user.id})`);
      return user;
    } catch (err) {
      return this.rollbackKeycloakUser(keycloakSub, err);
    }
  }

  private async createKeycloakUserSafe(
    input: RegisterInput
  ): Promise<string> {
    try {
      const adminToken = await getKeycloakAdminToken();
      const sub = await createKeycloakUser(adminToken, input);
      console.log(`[AuthService] Keycloak user created (sub: ${sub})`);
      return sub;
    } catch (err) {
      if (err instanceof Error && err.message === "KEYCLOAK_CONFLICT") {
        throw new ConflictError("Username or email is already taken.");
      }
      console.error("[AuthService] Keycloak error:", err);
      throw err;
    }
  }

  private async rollbackKeycloakUser(
    keycloakSub: string,
    originalError: unknown
  ): Promise<never> {
    console.error(
      "[AuthService] Critical: Keycloak user created but local DB write failed. " +
        "Attempting rollback...",
      originalError
    );
    await deleteKeycloakUser(keycloakSub);
    throw new Error("Registration failed due to a database error. Please try again.");
  }
}