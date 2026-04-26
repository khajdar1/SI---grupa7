import { Request, Response } from 'express';
import { AuthService, ConflictError, KeycloakError } from '../services/auth.service';
import { registerSchema } from '../modules/auth/auth.schema';
import { ZodError } from 'zod';

const authService = new AuthService();

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[RegisterController] Primljen zahtjev:", req.body);
    const input = registerSchema.parse(req.body);
    
    const user = await authService.register(input);
    res.status(201).json(user);
  } catch (error: unknown) {

    console.error("REGISTRATION ERROR LOG");
    console.error(error);
    console.error("--------------------------------------");

    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ message: error.message });
      return;
    }
    if (error instanceof KeycloakError) {
      res.status(502).json({ message: error.message });
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Nepoznata greška';
    res.status(500).json({ 
      message: 'Došlo je do interne greške na serveru.', 
      debug: errorMessage 
    });
  }
};