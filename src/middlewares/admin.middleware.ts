import { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error";

/**
 * Middleware to check if the authenticated user has admin role
 * This should be used AFTER authorizedMiddleware
 */
export const isAdminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user exists (should be added by authorizedMiddleware)
    if (!req.user) {
      throw new HttpError(401, "Unauthorized - User not authenticated");
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      throw new HttpError(
        403,
        "Forbidden - Admin access required"
      );
    }

    // User is admin, proceed
    next();
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
;