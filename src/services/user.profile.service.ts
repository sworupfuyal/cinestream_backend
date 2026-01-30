import {
  UpdateProfileDto,
  CreateProfileDto,
} from "../dtos/user.profile.dto";
import { HttpError } from "../errors/http-error";
import { UserProfileRepository } from "../repositories/user.profile.respository";

const userProfileRepository = new UserProfileRepository();

export class UserProfileServices {
  async getUserProfile(userId: string) {
    const user = await userProfileRepository.getProfile(userId);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async updateUserProfile(
    data: UpdateProfileDto,
    userId: string,
  ) {
    const updatedUser = await userProfileRepository.updateProfile(
      userId,
      data,
    );

    if (!updatedUser) {
      throw new HttpError(404, "User not found or no changes made");
    }

    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    };
  }

  async createUserProfile(data: CreateProfileDto) {
    const existingUser = await userProfileRepository.getProfile(
      data.userId,
    );

    if (existingUser) {
      throw new HttpError(409, "User already exists");
    }

    const createdProfile =
      await userProfileRepository.createProfile(data);

    if (!createdProfile) {
      throw new HttpError(500, "Failed to create profile");
    }

    return {
      success: true,
      message: "Profile created successfully",
    };
  }
}
