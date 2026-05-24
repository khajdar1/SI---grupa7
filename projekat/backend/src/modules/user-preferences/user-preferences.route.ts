import { Router } from "express";
import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../../constants";
import { validate } from "../../middleware/validate.middleware";
import {
  UserPreferencesNotFoundError,
  UserPreferencesService,
} from "./user-preferences.service";
import { updatePreferencesSchema } from "./user-preferences.schema";

const userPreferencesRouter = Router();
const userPreferencesService = new UserPreferencesService();

userPreferencesRouter.get("/", async (req, res, next) => {
  try {
    const prefs = await userPreferencesService.getPreferences(
      req.user?.localUserId,
    );
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

userPreferencesRouter.put(
  "/",
  validate(updatePreferencesSchema),
  async (req, res, next) => {
    try {
      const roles = (req.user?.roles ?? []).map((r) => r.toLowerCase());
      const isAdmin = roles.includes('admin') || roles.includes('administrator');
      const prefs = await userPreferencesService.updatePreferences(
        req.user?.localUserId,
        req.body,
        isAdmin,
      );
      res.json(prefs);
    } catch (error) {
      if (error instanceof UserPreferencesNotFoundError) {
        res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ message: error.message });
        return;
      }

      if (error instanceof Error && error.message.startsWith("Notification")) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: error.message });
        return;
      }

      next(error);
    }
  },
);

export default userPreferencesRouter;
