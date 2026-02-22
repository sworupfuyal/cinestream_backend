export interface MovieType {
    title: string;
    description: string;
    duration: number; // in minutes
    releaseYear: number;
    genres: string[];
    cast: string[];
    director: string;
    thumbnailUrl?: string;
    videoUrl?: string;
}