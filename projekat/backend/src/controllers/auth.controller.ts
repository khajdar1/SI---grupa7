import { Request, Response } from "express";
import { AuthService, ConflictError, KeycloakError } from "../services/auth.service";
import { registerSchema } from "../modules/auth/auth.schema";
import { ZodError } from "zod";
import { loginKeycloakUser, logoutKeycloakUser } from "../clients/keycloak.client";

const authService = new AuthService();

export const registerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("[RegisterController] Registration request received:", {
      username: req.body?.username,
      email: req.body?.email,
    });

    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);

    res.status(201).json(user);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Validation error.", errors: error.errors });
      return;
    }

    if (error instanceof ConflictError) {
      res.status(409).json({ message: error.message });
      return;
    }

    if (error instanceof KeycloakError) {
      res.status(502).json({ message: "An external service error occurred. Please try again." });
      return;
    }

    console.error("[RegisterController] Unexpected error:", error);

    res.status(500).json({ message: "An internal server error occurred. Please try again." });
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    console.log(`[LoginController] Login attempt — username: ${username}`);

    if (!username || !password) {
      console.warn("[LoginController] Login rejected — missing username or password.");
      res.status(400).json({ message: "Username and password are required." });
      return;
    }

    let tokens: { access_token: string; refresh_token: string };

    try {
      tokens = await loginKeycloakUser(username, password);
    } catch (error: unknown) {
      const errorName = error instanceof Error ? error.name : "UnknownError";
      console.warn(
        `[LoginController] Keycloak authentication failed — errorType: ${errorName}`
      );
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }

    const userInDb = await authService.getUserByUsername(username);

    if (!userInDb) {
      console.warn(
        `[LoginController] Login failed — user authenticated in Keycloak but not found in local DB — username: ${username}`
      );
      res.status(404).json({ message: "User could not be found." });
      return;
    }

    console.log(
      `[LoginController] Login successful — username: ${username}, id: ${userInDb.id}`
    );

    res.status(200).json({
      message: "Login successful",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: userInDb,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[LoginController] Unexpected error during login — message: ${errorMessage}`
    );
    res.status(500).json({ message: "An internal server error occurred. Please try again." });
  }
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const { refreshToken } = req.body;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[LogoutController] Logout attempted without a valid Authorization header.");
      res.status(401).json({ message: "No active session found." });
      return;
    }

    if (refreshToken) {
      await logoutKeycloakUser(refreshToken);
    } else {
      console.warn("[LogoutController] Logout requested without refresh token.");
    }

    console.log("[LogoutController] Logout request received — client must clear stored token.");

    res.status(200).json({ message: "Logged out successfully." });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[LogoutController] Unexpected error during logout — message: ${errorMessage}`
    );
    res.status(500).json({ message: "An internal server error occurred. Please try again." });
  }
};