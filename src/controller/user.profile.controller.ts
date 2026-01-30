import { Request, Response } from "express";
import { UpdateProfileDto, updateProfileDto } from "../dtos/user.profile.dto";
import { UserProfileServices } from "../services/user.profile.service";

const userProfileServices = new UserProfileServices();

export class UserProfileController {
  async getUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const userData = await userProfileServices.getUserProfile(userId);

      return res.status(200).json({
        success: true,
        message: "User fetched",
        data: userData,
      });
    } catch (err: any) {
      return res.status(err.statusCode ?? 501).json({
        success: false,
        message: err.message || "Internal server error",
      });
    }
  }

  async updateUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user?._id;

      const parseData = updateProfileDto.safeParse(req.body);
      if (!parseData.success) {
        return res.status(400).json({
          success: false,
          message: parseData.error,
        });
      }

      if (req.file) {
        // If a new image is uploaded through multer
        parseData.data.profile_image = `/uploads/${req.file.filename}`;
      }

      const result = await userProfileServices.updateUserProfile(
        parseData.data,
        userId
      );

      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (err: any) {
      return res.status(err.statusCode ?? 501).json({
        success: false,
        message: err.message || "Internal server error",
      });
    }
  }

  // Optional: create profile if needed
  // async createUserProfile(req: Request, res: Response) {
  //   try {
  //     const parseData = createProfileDto.safeParse(req.body);
  //     if (!parseData.success) {
  //       return res.status(402).json({
  //         success: false,
  //         message: parseData.error,
  //       });
  //     }
  //     const profileData = parseData.data;
  //     const result = await userProfileServices.createUserProfile(profileData);
  //     return res.status(200).json({
  //       success: result.success,
  //       message: result.message,
  //     });
  //   } catch (err: any) {
  //     return res.status(err.statusCode ?? 501).json({
  //       success: false,
  //       message: err.message || "Internal server error",
  //     });
  //   }
  // }
}
