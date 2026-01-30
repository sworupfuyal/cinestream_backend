import z from 'zod';

export const ProfileSchema = z.object({
    userId: z.string(),
    fullName: z.string().trim().optional(),
    email: z.email().trim().optional(),
    phoneNumber: z.string().min(10).trim().optional(),
    userLocation: z.string().trim().optional(),
    profile_image: z.any().optional()
})


export type ProfileData = z.infer<typeof ProfileSchema>; 