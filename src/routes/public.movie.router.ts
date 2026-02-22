import { Router } from "express";
import { MovieService } from "../services/movie.service";
import { MovieQueryDTO } from "../dtos/movie.dto";
import z from "zod";

const publicMoviesRouter = Router();
const movieService = new MovieService();

/**
 * GET /api/movies
 * Get all published movies (public access)
 */
publicMoviesRouter.get("/", async (req, res) => {
    try {
        const parsedQuery = MovieQueryDTO.safeParse(req.query);
        if (!parsedQuery.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: z.prettifyError(parsedQuery.error),
            });
        }

        const { page, limit, genre, search } = parsedQuery.data;

        const result = await movieService.getAllMovies(page, limit, genre, search);

        return res.status(200).json({
            success: true,
            message: "Movies fetched successfully",
            data: result.movies,
            pagination: result.pagination,
        });
    } catch (error: any) {
        return res.status(error.statusCode ?? 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
});

/**
 * GET /api/movies/:id
 * Get single movie details (public access)
 */
publicMoviesRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await movieService.getMovieById(id);

        return res.status(200).json({
            success: true,
            message: "Movie fetched successfully",
            data: movie,
        });
    } catch (error: any) {
        return res.status(error.statusCode ?? 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
});

export default publicMoviesRouter;