import { prisma } from "../config/database";
import { createHash, randomBytes } from "crypto";
import type { ConfirmPasswordResetInput, RegisterInput} from "../modules/auth/auth.schema";
import {
  getKeycloakAdminToken,
  createKeycloakUser,
  deleteKeycloakUser,
  KeycloakError,
  logoutKeycloakUserSessions,
  setKeycloakUserPassword,
} from "../clients/keycloak.client";
import { sendPasswordResetEmail } from "../clients/email.client";

export { KeycloakError };

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export type RegisteredUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  language: string;
  active: boolean;
  createdAt: Date;
};

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class PasswordResetTokenError extends Error {
  constructor(message = "Reset link is invalid or expired.") {
    super(message);
    this.name = "PasswordResetTokenError";
  }
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getKeycloakSubject(
  user: { externalIdentities?: Array<{ provider: string; providerSubject: string }> },
): string | null {
  return (
    user.externalIdentities?.find((identity) => identity.provider === "keycloak")
      ?.providerSubject ?? null
  );
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
      companyId: null,
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
      language: true,
      active: true,
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

  async getUserByUsername(username: string): Promise<RegisteredUser | null> {
      return prisma.user.findUnique({
      where: { username },
      select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          language: true,
          active: true,
          createdAt: true,
      },
      });
    }

  async triggerPasswordReset(email: string): Promise<void> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
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

      if (user && !user.active) {
        console.warn(
          `[AuthService] Password reset blocked for deactivated user id=${user.id}`,
        );
        return;
      }

      if (!user) {
        return;
      }

      const keycloakSub = getKeycloakSubject(user);
      if (!keycloakSub) {
        console.warn(`[AuthService] Password reset requested for user without Keycloak identity id=${user.id}`);
        return;
      }

      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await sendPasswordResetEmail(normalizedEmail, rawToken);
    } catch (err) {
      console.error("[AuthService] Error during password reset request:", err);
      throw err;
    }
  }

  async confirmPasswordReset(input: ConfirmPasswordResetInput): Promise<void> {
    const tokenHash = hashResetToken(input.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        usedAt: true,
        user: {
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
        },
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new PasswordResetTokenError();
    }

    if (!resetToken.user.active) {
      throw new PasswordResetTokenError();
    }

    const keycloakSub = getKeycloakSubject(resetToken.user);
    if (!keycloakSub) {
      throw new PasswordResetTokenError();
    }

    const claimed = await prisma.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (claimed.count !== 1) {
      throw new PasswordResetTokenError();
    }

    const adminToken = await getKeycloakAdminToken();
    await setKeycloakUserPassword(adminToken, keycloakSub, input.password);
    await logoutKeycloakUserSessions(adminToken, keycloakSub);
  }
}
