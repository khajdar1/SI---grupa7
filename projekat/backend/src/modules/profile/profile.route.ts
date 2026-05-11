import { Router } from "express";
import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../../constants";
import { validate } from "../../middleware/validate.middleware";
import { KeycloakError } from "../../clients/keycloak.client";
import {
  InvalidCurrentPasswordError,
  ProfileConflictError,
  ProfileNotFoundError,
  ProfileService,
} from "./profile.service";
import { changePasswordSchema, updateProfileSchema } from "./profile.schema";

const profileRouter = Router();
const profileService = new ProfileService();

profileRouter.get("/me", async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user?.localUserId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

profileRouter.patch("/me", validate(updateProfileSchema), async (req, res, next) => {
  try {
    const profile = await profileService.updateProfile(req.user?.localUserId, req.body);
    res.json(profile);
  } catch (error) {
    if (error instanceof ProfileConflictError) {
      res.status(HTTP_STATUS.CONFLICT).json({ message: error.message });
      return;
    }

    if (error instanceof KeycloakError) {
      res.status(HTTP_STATUS.EXTERNAL_SERVICE_ERROR).json({
        message: "An external service error occurred. Please try again.",
      });
      return;
    }

    next(error);
  }
});

profileRouter.post("/me/password", validate(changePasswordSchema), async (req, res, next) => {
  try {
    await profileService.changePassword(req.user?.localUserId, req.body);
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
      return;
    }

    if (error instanceof KeycloakError) {
      res.status(HTTP_STATUS.EXTERNAL_SERVICE_ERROR).json({
        message: "An external service error occurred. Please try again.",
      });
      return;
    }

    next(error);
  }
});

profileRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ProfileNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: error.message });
    return;
  }

  next(error);
});

export default profileRouter;
