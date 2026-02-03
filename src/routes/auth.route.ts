import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploads } from "../middlewares/upload.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

/**
 * PUT /api/auth/:id
 * Update authenticated user's own profile with optional image upload
 * User can only update their own profile (verified in controller)
 */
router.put(
  "/:id",
  authorizedMiddleware,
  uploads.single("profile_image"),
  authController.updateAuthUser
);

export default router;