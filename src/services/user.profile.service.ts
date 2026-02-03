import mongoose from "mongoose";
import {
  UpdateProfileDto,
  CreateProfileDto,
} from "../dtos/user.profile.dto";
import { HttpError } from "../errors/http-error";
import { UserProfileRepository } from "../repositories/user.profile.respository";
import { UserModel } from "../models/user.model";
import { UserProfileModel } from "../models/user.profile.model";

const userProfileRepository = new UserProfileRepository();

export class UserProfileServices {
  async getUserProfile(userId: string) {
    const user = await userProfileRepository.getProfile(userId);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  /**
   * Update user profile with transaction support
   * This now updates BOTH User table and UserProfile table atomically
   */
  async updateUserProfile(data: UpdateProfileDto, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user exists
      const existingUser = await UserModel.findById(userId).session(session);
      if (!existingUser) {
        throw new HttpError(404, "User not found");
      }

      // Prepare User table updates
      const userUpdateData: any = {};
      if (data.email) userUpdateData.email = data.email;
      if (data.fullName) userUpdateData.fullname = data.fullName;

      // Update User table if there's data to update
      if (Object.keys(userUpdateData).length > 0) {
        await UserModel.findByIdAndUpdate(userId, userUpdateData, {
          session,
          new: true,
        });
      }

      // Prepare UserProfile table updates
      const profileUpdateData: any = {};
      if (data.email) profileUpdateData.email = data.email;
      if (data.fullName) profileUpdateData.fullName = data.fullName;
      if (data.phoneNumber !== undefined)
        profileUpdateData.phoneNumber = data.phoneNumber;
      if (data.userLocation !== undefined)
        profileUpdateData.userLocation = data.userLocation;
      if (data.profile_image !== undefined)
        profileUpdateData.profile_image = data.profile_image;

      // Update UserProfile table
      const updatedProfile = await UserProfileModel.findOneAndUpdate(
        { userId },
        profileUpdateData,
        { new: true, session, upsert: true } // upsert creates if doesn't exist
      );

      await session.commitTransaction();

      if (!updatedProfile) {
        throw new HttpError(404, "Profile update failed");
      }

      return {
        success: true,
        message: "Profile updated successfully (both User and Profile tables)",
        data: updatedProfile,
      };
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async createUserProfile(data: CreateProfileDto) {
    const existingUser = await userProfileRepository.getProfile(data.userId);

    if (existingUser) {
      throw new HttpError(409, "User profile already exists");
    }

    const createdProfile = await userProfileRepository.createProfile(data);

    if (!createdProfile) {
      throw new HttpError(500, "Failed to create profile");
    }

    return {
      success: true,
      message: "Profile created successfully",
    };
  }
}