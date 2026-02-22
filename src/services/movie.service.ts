import { MovieRepository } from "../repositories/movie.repository";
import { MovieCreateType, MovieUpdateType } from "../dtos/movie.dto";
import { HttpError } from "../errors/http-error";
import { IMovie } from "../models/movie.model";
import { UserListRepository } from "../repositories/user.list.repository";

const movieRepository = new MovieRepository();
const userlistRepository = new UserListRepository();

export class MovieService {
    /**
     * Create a new movie
     */
    async createMovie(data: MovieCreateType, thumbnailPath?: string, videoPath?: string): Promise<IMovie> {
        // Check if movie with same title already exists
        const existingMovies = await movieRepository.getAllMovies(1, 1, undefined, data.title);
        if (existingMovies.movies.length > 0) {
            const exactMatch = existingMovies.movies.find(
                movie => movie.title.toLowerCase() === data.title.toLowerCase()
            );
            if (exactMatch) {
                throw new HttpError(409, "Movie with this title already exists");
            }
        }

        // Set file paths if uploaded
        if (thumbnailPath) {
            data.thumbnailUrl = thumbnailPath;
        }
        if (videoPath) {
            data.videoUrl = videoPath;
        }

        const newMovie = await movieRepository.createMovie(data);
        return newMovie;
    }

    /**
     * Get all movies with pagination and filtering
     */
    async getAllMovies(
        page: number = 1,
        limit: number = 10,
        genre?: string,
        search?: string
    ) {
        const { movies, total } = await movieRepository.getAllMovies(page, limit, genre, search);

        const totalPages = Math.ceil(total / limit);

        return {
            movies,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * Get a single movie by ID
     */
    async getMovieById(id: string): Promise<IMovie> {
        const movie = await movieRepository.getMovieById(id);
        if (!movie) {
            throw new HttpError(404, "Movie not found");
        }
        return movie;
    }

    /**
     * Update a movie
     */
    async updateMovie(
        id: string,
        data: MovieUpdateType,
        thumbnailPath?: string,
        videoPath?: string
    ): Promise<IMovie> {
        // Check if movie exists
        const existingMovie = await movieRepository.getMovieById(id);
        if (!existingMovie) {
            throw new HttpError(404, "Movie not found");
        }

        // If title is being updated, check for duplicates
        if (data.title && data.title !== existingMovie.title) {
            const duplicateMovies = await movieRepository.getAllMovies(1, 1, undefined, data.title);
            if (duplicateMovies.movies.length > 0) {
                const exactMatch = duplicateMovies.movies.find(
                    movie => movie.title.toLowerCase() === data.title!.toLowerCase() && movie._id.toString() !== id
                );
                if (exactMatch) {
                    throw new HttpError(409, "Movie with this title already exists");
                }
            }
        }

        // Set file paths if uploaded
        if (thumbnailPath) {
            data.thumbnailUrl = thumbnailPath;
        }
        if (videoPath) {
            data.videoUrl = videoPath;
        }

        const updatedMovie = await movieRepository.updateMovie(id, data);
        if (!updatedMovie) {
            throw new HttpError(500, "Failed to update movie");
        }

        return updatedMovie;
    }

    /**
     * Delete a movie
     */
    async deleteMovie(id: string): Promise<{ message: string }> {
        const movie = await movieRepository.getMovieById(id);
        if (!movie) {
            throw new HttpError(404, "Movie not found");
        }
        const result = await movieRepository.deleteMovie(id);
        if (result) {
            await userlistRepository.deleteMoviesByMovieId(id);
        }

        return { message: "Movie deleted successfully" };
    }

    /**
     * Get all genres
     */
    async getAllGenres(): Promise<string[]> {
        return await movieRepository.getAllGenres();
    }
}