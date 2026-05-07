import { Request, Response } from "express";
import { ZodError } from "zod";

import { loginKeycloakUser, logoutKeycloakUser } from "../clients/keycloak.client";
import { HTTP_STATUS } from "../constants";
import { registerSchema } from "../modules/auth/auth.schema";
import { AuthService, ConflictError, KeycloakError } from "../services/auth.service";

const authService = new AuthService();
const DISABLED_ACCOUNT_LOGIN_MESSAGE =
  "Your account is disabled. Please contact an administrator.";

export const registerController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);
    res.status(HTTP_STATUS.CREATED).json(user);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Validation error.",
        errors: error.flatten().fieldErrors,
      });
      return;
    }

    if (error instanceof ConflictError) {
      res.status(HTTP_STATUS.CONFLICT).json({ message: error.message });
      return;
    }

    if (error instanceof KeycloakError) {
      res.status(HTTP_STATUS.EXTERNAL_SERVICE_ERROR).json({
        message: "An external service error occurred. Please try again.",
      });
      return;
    }

    console.error("[RegisterController] Unexpected error:", error);
    res.status(HTTP_STATUS.INTERNAL).json({
      message: "An internal server error occurred. Please try again.",
    });
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Username and password are required.",
      });
      return;
    }

    const userInDb = await authService.getUserByUsername(username);
    if (userInDb && !userInDb.active) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        message: DISABLED_ACCOUNT_LOGIN_MESSAGE,
      });
      return;
    }

    let tokens: { access_token: string; refresh_token: string };
    try {
      tokens = await loginKeycloakUser(username, password);
    } catch {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Invalid username or password.",
      });
      return;
    }

    if (!userInDb) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User could not be found." });
      return;
    }

    if (!userInDb.active) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        message: DISABLED_ACCOUNT_LOGIN_MESSAGE,
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      message: "Login successful",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: userInDb,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[LoginController] Unexpected error during login:", errorMessage);
    res.status(HTTP_STATUS.INTERNAL).json({
      message: "An internal server error occurred. Please try again.",
    });
  }
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { refreshToken } = req.body;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "No active session found." });
      return;
    }

    if (refreshToken) {
      await logoutKeycloakUser(refreshToken);
    }

    res.status(HTTP_STATUS.OK).json({ message: "Logged out successfully." });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[LogoutController] Unexpected error during logout:", errorMessage);
    res.status(HTTP_STATUS.INTERNAL).json({
      message: "An internal server error occurred. Please try again.",
    });
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    await authService.triggerPasswordReset(email);

    res.status(HTTP_STATUS.OK).json({
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (error: unknown) {
    console.error("[ResetPasswordController] Unexpected error:", error);
    res.status(HTTP_STATUS.INTERNAL).json({
      message: "An internal server error occurred.",
    });
  }
};
