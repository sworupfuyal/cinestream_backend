import { MovieModel } from "../models/movie.model";
import { IUserList, UserListModel } from "../models/user.list.model";

export class UserListRepository {
    /**
     * Add movie to user's list
     */
    async addToList(userId: string, movieId: string, listType: 'favorite' | 'watchlater'): Promise<IUserList> {
        const userList = new UserListModel({ userId, movieId, listType });
        return await userList.save();
    }

    /**
     * Remove movie from user's list
     */
    async removeFromList(userId: string, movieId: string, listType: 'favorite' | 'watchlater'): Promise<IUserList | null> {
        return await UserListModel.findOneAndDelete({ userId, movieId, listType });
    }

  async deleteMoviesByMovieId(movieId: string): Promise<number> {
    const result = await UserListModel.deleteMany({ movieId });
    return result.deletedCount ?? 0;
}
    /**
     * Check if movie is in user's list
     */
    async isInList(userId: string, movieId: string, listType: 'favorite' | 'watchlater'): Promise<boolean> {
        const exists = await UserListModel.findOne({ userId, movieId, listType });
        return !!exists;
    }

    /**
     * Get all movies in user's list with full movie details
     */
    async getUserList(userId: string, listType?: 'favorite' | 'watchlater') {
        const query: any = { userId };
        if (listType) {
            query.listType = listType;
        }

        const userLists = await UserListModel.find(query).sort({ createdAt: -1 });
        
        // Get all movie IDs
        const movieIds = userLists.map(list => list.movieId);
        
        // Fetch all movies
        const movies = await MovieModel.find({ _id: { $in: movieIds } });
        
        // Map movies with list info
        return userLists.map(list => {
            const movie = movies.find(m => m._id.toString() === list.movieId);
            return {
                listId: list._id,
                listType: list.listType,
                addedAt: list.createdAt,
                movie: movie
            };
        });
    }

    /**
     * Get user's list status for multiple movies
     */
    async getUserListStatus(userId: string, movieIds: string[]) {
        const userLists = await UserListModel.find({
            userId,
            movieId: { $in: movieIds }
        });

        const status: any = {};
        movieIds.forEach(movieId => {
            status[movieId] = {
                isFavorite: false,
                isWatchLater: false
            };
        });

        userLists.forEach(list => {
            if (list.listType === 'favorite') {
                status[list.movieId].isFavorite = true;
            } else if (list.listType === 'watchlater') {
                status[list.movieId].isWatchLater = true;
            }
        });

        return status;
    }

    /**
     * Get counts for user's lists
     */
    async getUserListCounts(userId: string) {
        const favorites = await UserListModel.countDocuments({ userId, listType: 'favorite' });
        const watchLater = await UserListModel.countDocuments({ userId, listType: 'watchlater' });
        
        return {
            favorites,
            watchLater
        };
    }
}