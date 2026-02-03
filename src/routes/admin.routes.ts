import { Router } from "express";
import { AdminController } from "../controller/admin.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { isAdminMiddleware } from "../middlewares/admin.middleware";
import { uploads } from "../middlewares/upload.middleware";

const adminController = new AdminController();
const router = Router();

/**
 * All admin routes require:
 * 1. authorizedMiddleware - to verify JWT token
 * 2. isAdminMiddleware - to verify user has admin role
 */

/**
 * POST /api/admin/users
 * Create a new user with optional profile image
 * Multer middleware handles profile_image field
 */
router.post(
  "/users",
  authorizedMiddleware,
  isAdminMiddleware,
  uploads.single("profile_image"),
  adminController.createUser
);

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 * Query params: page, limit, role, search
 */
router.get(
  "/users",
  authorizedMiddleware,
  isAdminMiddleware,
  adminController.getAllUsers
);

/**
 * GET /api/admin/users/:id
 * Get a single user by ID with profile data
 */
router.get(
  "/users/:id",
  authorizedMiddleware,
  isAdminMiddleware,
  adminController.getUserById
);

/**
 * PUT /api/admin/users/:id
 * Update user and profile with optional image upload
 * Multer middleware handles profile_image field
 */
router.put(
  "/users/:id",
  authorizedMiddleware,
  isAdminMiddleware,
  uploads.single("profile_image"),
  adminController.updateUser
);

/**
 * DELETE /api/admin/users/:id
 * Delete user and associated profile
 */
router.delete(
  "/users/:id",
  authorizedMiddleware,
  isAdminMiddleware,
  adminController.deleteUser
);

export default router;