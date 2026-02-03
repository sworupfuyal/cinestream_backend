import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import {
  AdminCreateUserDTO,
  AdminUpdateUserDTO,
  AdminGetUsersQueryDTO,
} from "../dtos/admin-user.dto";
import z from "zod";

const adminService = new AdminService();

export class AdminController {
  /**
   * POST /api/admin/users
   * Create a new user with optional profile image
   */
  async createUser(req: Request, res: Response) {
    try {
      // Validate request body
      const parsedData = AdminCreateUserDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: z.prettifyError(parsedData.error),
        });
      }

      // Get profile image path if uploaded
      const profileImagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

      // Create user
      const newUser = await adminService.createUser(parsedData.data, profileImagePath);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * GET /api/admin/users
   * Get all users with pagination and filtering
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      // Validate query parameters
      const parsedQuery = AdminGetUsersQueryDTO.safeParse(req.query);
      if (!parsedQuery.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: z.prettifyError(parsedQuery.error),
        });
      }

      const { page, limit, role, search } = parsedQuery.data;

      // Get users
      const result = await adminService.getAllUsers(page, limit, role, search);

      return res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * GET /api/admin/users/:id
   * Get a single user by ID with profile
   */
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await adminService.getUserById(id);

      return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * PUT /api/admin/users/:id
   * Update user and profile with optional image upload
   */
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validate request body
      const parsedData = AdminUpdateUserDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: z.prettifyError(parsedData.error),
        });
      }

      // Get profile image path if uploaded
      const profileImagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

      // Update user
      const updatedUser = await adminService.updateUser(id, parsedData.data, profileImagePath);

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * DELETE /api/admin/users/:id
   * Delete user and associated profile
   */
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await adminService.deleteUser(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}