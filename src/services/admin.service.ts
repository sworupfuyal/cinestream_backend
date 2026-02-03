import mongoose from "mongoose";
import { AdminCreateUserDTO, AdminUpdateUserDTO } from "../dtos/admin-user.dto";
import { HttpError } from "../errors/http-error";
import { UserModel } from "../models/user.model";
import { UserProfileModel } from "../models/user.profile.model";
import bcrypt from "bcryptjs";
export class AdminService {
  /**
   * Create a new user (with profile) - Admin only
   * Uses transaction to ensure both User and UserProfile are created atomically
   */
  async createUser(data: AdminCreateUserDTO, profileImagePath?: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ email: data.email }).session(session);
      if (existingUser) {
        throw new HttpError(409, "User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const newUser = await UserModel.create(
        [
          {
            email: data.email,
            fullname: data.fullname,
            password: hashedPassword,
            role: data.role,
          },
        ],
        { session }
      );

      // Create user profile (only if role is user or if explicitly needed)
      if (newUser[0].role === "user" || data.phoneNumber || data.userLocation || profileImagePath) {
        await UserProfileModel.create(
          [
            {
              userId: newUser[0]._id,
              email: data.email,
              fullName: data.fullname,
              phoneNumber: data.phoneNumber,
              userLocation: data.userLocation,
              profile_image: profileImagePath,
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();

      // Return user without password
      const userResponse = await UserModel.findById(newUser[0]._id)
  .select("-password")
  .session(session)
  .lean();

return userResponse;

    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(page: number = 1, limit: number = 10, role?: string, search?: string) {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { fullname: { $regex: search, $options: "i" } },
      ];
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select("-password") // Exclude password
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        limit,
      },
    };
  }

  /**
   * Get a single user by ID with profile data
   */
  async getUserById(userId: string) {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    const user = await UserModel.findById(userId).select("-password").lean();
    
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    // Get profile if exists
    const profile = await UserProfileModel.findOne({ userId }).lean();

    return {
      ...user,
      profile,
    };
  }

  /**
   * Update user and profile atomically
   * Uses transaction to ensure both are updated together
   */
async updateUser(userId: string, data: AdminUpdateUserDTO, profileImagePath?: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new HttpError(400, "Invalid user ID");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await UserModel.findById(userId).session(session);
    if (!existingUser) {
      throw new HttpError(404, "User not found");
    }

    const userUpdateData: any = {};
    if (data.email) userUpdateData.email = data.email;
    if (data.fullname) userUpdateData.fullname = data.fullname;
    if (data.role) userUpdateData.role = data.role;
    if (data.password) {
      userUpdateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      userUpdateData,
      { new: true, session }
    );

    if (!updatedUser) {
      throw new HttpError(404, "User not found");
    }

    const profileUpdateData: any = {};
    if (data.email) profileUpdateData.email = data.email;
    if (data.fullname) profileUpdateData.fullName = data.fullname;
    if (data.phoneNumber !== undefined) profileUpdateData.phoneNumber = data.phoneNumber;
    if (data.userLocation !== undefined) profileUpdateData.userLocation = data.userLocation;
    if (profileImagePath) profileUpdateData.profile_image = profileImagePath;

    let profile = null;
    if (Object.keys(profileUpdateData).length > 0) {
      profile = await UserProfileModel.findOneAndUpdate(
        { userId },
        profileUpdateData,
        { new: true, upsert: true, session }
      );
    } else {
      profile = await UserProfileModel.findOne({ userId }).session(session);
    }

    await session.commitTransaction();

   const { password, ...safeUser } = updatedUser.toObject();
return { ...safeUser, profile };


   
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

  /**
   * Delete user and associated profile
   * Uses transaction to ensure both are deleted atomically
   */
  async deleteUser(userId: string) {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user exists
      const user = await UserModel.findById(userId).session(session);
      if (!user) {
        throw new HttpError(404, "User not found");
      }

      // Delete user and profile
      await Promise.all([
        UserModel.findByIdAndDelete(userId).session(session),
        UserProfileModel.findOneAndDelete({ userId }).session(session),
      ]);

      await session.commitTransaction();

      return {
        success: true,
        message: "User and associated profile deleted successfully",
      };
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}