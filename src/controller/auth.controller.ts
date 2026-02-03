import { UserService } from "../services/user.service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { Request, Response } from "express";
import z from "zod";
import { CreateProfileDto, UpdateProfileDto } from "../dtos/user.profile.dto";
import { UserProfileServices } from "../services/user.profile.service";

let userService = new UserService();
let userProfileServices = new UserProfileServices();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const parsedData = CreateUserDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }
      const userData: CreateUserDTO = parsedData.data;
      const newUser = await userService.createUser(userData);
      
      if (newUser.role === "user") {
        try {
          const profileData: CreateProfileDto = {
            userId: newUser._id.toString(),
            fullName: newUser.fullname,
            email: newUser.email,
          };

          await userProfileServices.createUserProfile(profileData);
        } catch (profileError) {
          console.error("Profile creation failed:", profileError);
        }
      }
      
      return res.status(201).json({
        success: true,
        message: "User Created",
        data: newUser,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parsedData = LoginUserDTO.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }
      const loginData: LoginUserDTO = parsedData.data;
      const { token, user } = await userService.loginUser(loginData);
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: user,
        token,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  /**
   * PUT /api/auth/:id
   * Update authenticated user's own data
   * This endpoint allows users to update their own profile
   * With image upload support via Multer
   */
  async updateAuthUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authenticatedUserId = req.user?._id.toString();

      // Ensure user can only update their own profile
      if (id !== authenticatedUserId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - You can only update your own profile",
        });
      }

      // Validate update data using the existing UpdateProfileDto
      const parsedData = z
        .object({
          fullName: z.string().min(1).optional(),
          email: z.string().email().optional(),
          phoneNumber: z.string().optional(),
          userLocation: z.string().optional(),
          profile_image: z.string().optional(),
        })
        .safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: z.prettifyError(parsedData.error),
        });
      }

      const updateData = parsedData.data;

      // Add profile image path if uploaded
      if (req.file) {
        updateData.profile_image = `/uploads/${req.file.filename}`;
      }

      // Update profile using existing service (which now updates both tables)
      const result = await userProfileServices.updateUserProfile(
        updateData as UpdateProfileDto,
        authenticatedUserId
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: result.data,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}