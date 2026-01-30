import { UserProfileModel, IUserProfile } from "../models/user.profile.model";


export interface IUserProfileRepository {
  createProfile(data: Partial<IUserProfile>): Promise<IUserProfile>;
  getProfile(userId: string): Promise<IUserProfile | null>;
  updateProfile(
    userId: string,
    updatedData: Partial<IUserProfile>
  ): Promise<IUserProfile | null>;
}

export class UserProfileRepository implements IUserProfileRepository {
  async createProfile(data: Partial<IUserProfile>): Promise<IUserProfile> {
    const profile = await UserProfileModel.create(data);
    return profile;
  }

  async updateProfile(
    userId: string,
    updatedData: Partial<IUserProfile>
  ): Promise<IUserProfile | null> {
    const updatedUser = await UserProfileModel.findOneAndUpdate(
      { userId },
      { $set: updatedData },
      { new: true }
    );
    return updatedUser;
  }

  async getProfile(userId: string): Promise<IUserProfile | null> {
    const user = await UserProfileModel.findOne({ userId });
    return user;
  }
}
