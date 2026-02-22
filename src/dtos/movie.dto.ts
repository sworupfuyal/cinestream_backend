import { z } from "zod";

// Create Movie DTO
export const MovieCreateDTO = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(10, "Description must be at least 10 characters").max(2000),
    duration: z.number().min(1, "Duration must be at least 1 minute").or(z.string().transform(Number)),
    releaseYear: z.number().min(1900, "Release year must be 1900 or later").max(new Date().getFullYear() + 5).or(z.string().transform(Number)),
    genres: z.array(z.string()).min(1, "At least one genre is required").or(z.string().transform(str => str.split(',').map(s => s.trim()))),
    cast: z.array(z.string()).min(1, "At least one cast member is required").or(z.string().transform(str => str.split(',').map(s => s.trim()))),
    director: z.string().min(1, "Director is required"),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
    videoUrl: z.string().url().optional().or(z.literal('')),
});

// Update Movie DTO (all fields optional)
export const MovieUpdateDTO = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(10).max(2000).optional(),
    duration: z.number().min(1).or(z.string().transform(Number)).optional(),
    releaseYear: z.number().min(1900).max(new Date().getFullYear() + 5).or(z.string().transform(Number)).optional(),
    genres: z.array(z.string()).min(1).or(z.string().transform(str => str.split(',').map(s => s.trim()))).optional(),
    cast: z.array(z.string()).min(1).or(z.string().transform(str => str.split(',').map(s => s.trim()))).optional(),
    director: z.string().min(1).optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
    videoUrl: z.string().url().optional().or(z.literal('')),
});

// Query params for getting movies
export const MovieQueryDTO = z.object({
    page: z.string().transform(Number).default(1),
    limit: z.string().transform(Number).default(10),
    genre: z.string().optional(),
    search: z.string().optional(),
});

export type MovieCreateType = z.infer<typeof MovieCreateDTO>;
export type MovieUpdateType = z.infer<typeof MovieUpdateDTO>;
export type MovieQueryType = z.infer<typeof MovieQueryDTO>;