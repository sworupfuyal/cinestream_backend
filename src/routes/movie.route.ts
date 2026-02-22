import { Router } from "express";
import { MovieController } from "../controller/movie.controller";
import { adminMiddleware, authorizedMiddleware } from "../middlewares/authorized.middleware";
import { isAdminMiddleware } from "../middlewares/admin.middleware";
import { movieUploads } from "../middlewares/upload.middleware"; // ✅ Changed from uploads to movieUploads

const movieRouter = Router();
const movieController = new MovieController();

/**
 * All routes require authentication and admin role
 */
movieRouter.use(authorizedMiddleware, isAdminMiddleware);

/**
 * movieUploads.fields handles:
 * - thumbnail: image only (jpg, png, webp)
 * - video: mp4, webm, mov (up to 5GB)
 */
const movieUploadFields = movieUploads.fields; // ✅ Changed

// Create a new movie
movieRouter.post(
    "/",
    movieUploadFields,
    (req, res) => movieController.createMovie(req, res)
);

// Get all movies (with pagination, filtering, search)
movieRouter.get(
    "/",
    (req, res) => movieController.getAllMovies(req, res)
);

// Get all genres
movieRouter.get(
    "/genres/list",
    (req, res) => movieController.getAllGenres(req, res)
);

// Get a single movie by ID
movieRouter.get(
    "/:id",
    (req, res) => movieController.getMovieById(req, res)
);

// Update a movie by ID
movieRouter.put(
    "/:id",
    movieUploadFields,
    (req, res) => movieController.updateMovie(req, res)
);

// Delete a movie by ID
movieRouter.delete(
    "/:id",
    (req, res) => movieController.deleteMovie(req, res)
);

export default movieRouter;