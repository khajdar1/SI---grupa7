import { Request, Response } from "express";
import { AuthService, ConflictError, KeycloakError } from "../services/auth.service";
import { registerSchema } from "../modules/auth/auth.schema";
import { ZodError } from "zod";

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