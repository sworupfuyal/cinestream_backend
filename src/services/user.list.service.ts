import { MovieRepository } from "../repositories/movie.repository";
import { HttpError } from "../errors/http-error";
import { UserListRepository } from "../repositories/user.list.repository";

const userListRepository = new UserListRepository();
const movieRepository = new MovieRepository();

export class UserListService {
    /**
     * Add movie to user's list
     */
    async addToList(userId: string, movieId: string, listType: 'favorite' | 'watchlater') {
        // Check if movie exists
        const movie = await movieRepository.getMovieById(movieId);
        if (!movie) {
            throw new HttpError(404, "Movie not found");
        }

        // Check if already in list
        const exists = await userListRepository.isInList(userId, movieId, listType);
        if (exists) {
            throw new HttpError(409, `Movie already in your ${listType} list`);
        }

        const userList = await userListRepository.addToList(userId, movieId, listType);
        return {
            message: `Movie added to ${listType} list`,
            data: userList
        };
    }

    /**
     * Remove movie from user's list
     */
    async removeFromList(userId: string, movieId: string, listType: 'favorite' | 'watchlater') {
        const removed = await userListRepository.removeFromList(userId, movieId, listType);
        
        if (!removed) {
            throw new HttpError(404, `Movie not found in your ${listType} list`);
        }

        return {
            message: `Movie removed from ${listType} list`
        };
    }

    /**
     * Get user's list with movie details
     */
    async getUserList(userId: string, listType?: 'favorite' | 'watchlater') {
        const lists = await userListRepository.getUserList(userId, listType);
        return lists;
    }

    /**
     * Get user's list status for movies
     */
    async getUserListStatus(userId: string, movieIds: string[]) {
        return await userListRepository.getUserListStatus(userId, movieIds);
    }

    /**
     * Get counts for user's lists
     */
    async getUserListCounts(userId: string) {
        return await userListRepository.getUserListCounts(userId);
    }
}