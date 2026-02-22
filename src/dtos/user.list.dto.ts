import { z } from "zod";

// Add to list DTO
export const AddToListDTO = z.object({
    movieId: z.string().min(1, "Movie ID is required"),
    listType: z.enum(['favorite', 'watchlater']),
});

// Query params for getting user lists
export const UserListQueryDTO = z.object({
    listType: z.enum(['favorite', 'watchlater']).optional(),
});

export type AddToListType = z.infer<typeof AddToListDTO>;
export type UserListQueryType = z.infer<typeof UserListQueryDTO>;