import mongoose, { Schema, Document } from "mongoose";
import { ProfileData } from "../types/user.profile.type";

export interface IUserProfile extends Omit<ProfileData, "userId">, Document {
  userId: mongoose.Types.ObjectId | string;
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema: Schema<IUserProfile> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String },
    userLocation: { type: String },
    profile_image: { type: String },
  },
  {
    timestamps: true,
  }
);

export const UserProfileModel = mongoose.model<IUserProfile>(
  "user_profile",
  UserProfileSchema
);
