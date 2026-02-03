import z from "zod";

/**
 * DTO for admin creating a new user
 * Allows admin to set role and create without confirmPassword requirement
 */
export const AdminCreateUserDTO = z.object({
  email: z.string().email("Invalid email format"),
  fullname: z.string().min(1, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).default("user"),
  // Optional profile fields that can be set immediately
  phoneNumber: z.string().optional(),
  userLocation: z.string().optional(),
});

export type AdminCreateUserDTO = z.infer<typeof AdminCreateUserDTO>;

/**
 * DTO for admin updating a user
 * All fields are optional
 */
export const AdminUpdateUserDTO = z.object({
  email: z.string().email("Invalid email format").optional(),
  fullname: z.string().min(1, "Full name is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["user", "admin"]).optional(),
  // Profile fields
  phoneNumber: z.string().optional(),
  userLocation: z.string().optional(),
  profile_image: z.string().optional(), // Will be set by multer
});

export type AdminUpdateUserDTO = z.infer<typeof AdminUpdateUserDTO>;

/**
 * Query DTO for filtering/pagination
 */
export const AdminGetUsersQueryDTO = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  role: z.enum(["user", "admin"]).optional(),
  search: z.string().optional(),
});


export type AdminGetUsersQueryDTO = z.infer<typeof AdminGetUsersQueryDTO>;