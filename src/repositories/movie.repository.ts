import { MovieModel, IMovie } from "../models/movie.model";
import { MovieCreateType, MovieUpdateType } from "../dtos/movie.dto";

export class MovieRepository {
    /**
     * Create a new movie
     */
    async createMovie(data: MovieCreateType): Promise<IMovie> {
        const movie = new MovieModel(data);
        return await movie.save();
    }

    /**
     * Get all movies with pagination and filtering
     */
    async getAllMovies(
        page: number = 1,
        limit: number = 10,
        genre?: string,
        search?: string
    ): Promise<{ movies: IMovie[]; total: number }> {
        const skip = (page - 1) * limit;
        const query: any = {};

        // Filter by genre
        if (genre) {
            query.genres = { $in: [genre] };
        }

        // Search in title, description, or director
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { director: { $regex: search, $options: 'i' } },
            ];
        }

        const movies = await MovieModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await MovieModel.countDocuments(query);

        return { movies, total };
    }

    /**
     * Get a single movie by ID
     */
    async getMovieById(id: string): Promise<IMovie | null> {
        return await MovieModel.findById(id);
    }

    /**
     * Update a movie by ID
     */
    async updateMovie(id: string, data: MovieUpdateType): Promise<IMovie | null> {
        return await MovieModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    /**
     * Delete a movie by ID
     */
    async deleteMovie(id: string): Promise<IMovie | null> {
        return await MovieModel.findByIdAndDelete(id);
    }

    /**
     * Get all unique genres
     */
    async getAllGenres(): Promise<string[]> {
        const result = await MovieModel.distinct('genres');
        return result;
    }
}