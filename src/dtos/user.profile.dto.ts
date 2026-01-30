import { ProfileData, ProfileSchema } from "../types/user.profile.type"; // your CineStream types
import z from "zod";

// DTO for updating user profile
export const updateProfileDto = ProfileSchema.pick({
  fullName: true,
  email: true,
  phoneNumber: true,
  userLocation: true,
  profile_image: true, // avatar URL/path
}).partial({ // all fields optional for updates
  fullName: true,
  email: true,
  phoneNumber: true,
  userLocation: true,
  profile_image: true,
});

export type UpdateProfileDto = z.infer<typeof updateProfileDto>;

// DTO for creating user profile
export const createProfileDto = ProfileSchema.pick({
  userId: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  userLocation: true,
}).partial({ // make phoneNumber and location optional
  phoneNumber: true,
  userLocation: true,
});

export type CreateProfileDto = z.infer<typeof createProfileDto>;
