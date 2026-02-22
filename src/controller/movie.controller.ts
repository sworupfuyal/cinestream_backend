import { Request, Response } from "express";
import { MovieService } from "../services/movie.service";
import {
    MovieCreateDTO,
    MovieUpdateDTO,
    MovieQueryDTO,
} from "../dtos/movie.dto";
import z from "zod";
import path from "path";
import { HLSService } from "../services/hls.service";

const movieService = new MovieService();
const hlsService   = new HLSService(); // ✅ ADD THIS

export class MovieController {
    /**
     * POST /api/admin/movies
     * Create a new movie with optional file uploads
     */
    async createMovie(req: Request, res: Response) {
        try {
            const parsedData = MovieCreateDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: z.prettifyError(parsedData.error),
                });
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const thumbnailPath = files?.thumbnail?.[0]
                ? `/uploads/${files.thumbnail[0].filename}`
                : undefined;

            // ✅ Convert video to HLS if uploaded
            let videoPath: string | undefined = undefined;
            if (files?.video?.[0]) {
                const uploadedVideoPath = path.join(
                    __dirname,
                    "../../uploads",
                    files.video[0].filename
                );
                try {
                    console.log("🎬 Converting video to HLS...");
                    videoPath = await hlsService.convertToHLS(uploadedVideoPath);
                    console.log("✅ HLS URL:", videoPath);
                } catch (conversionError: any) {
                    console.error("HLS conversion failed:", conversionError.message);
                    return res.status(500).json({
                        success: false,
                        message: "Video conversion failed: " + conversionError.message,
                    });
                }
            }

            const newMovie = await movieService.createMovie(
                parsedData.data,
                thumbnailPath,
                videoPath
            );

            return res.status(201).json({
                success: true,
                message: "Movie created successfully",
                data: newMovie,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * GET /api/admin/movies
     */
    async getAllMovies(req: Request, res: Response) {
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
    }

    /**
     * GET /api/admin/movies/:id
     */
    async getMovieById(req: Request, res: Response) {
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
    }

    /**
     * PUT /api/admin/movies/:id
     */
    async updateMovie(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const parsedData = MovieUpdateDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: z.prettifyError(parsedData.error),
                });
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const thumbnailPath = files?.thumbnail?.[0]
                ? `/uploads/${files.thumbnail[0].filename}`
                : undefined;

            // ✅ Convert new video to HLS if uploaded
            let videoPath: string | undefined = undefined;
            if (files?.video?.[0]) {
                const uploadedVideoPath = path.join(
                    __dirname,
                    "../../uploads",
                    files.video[0].filename
                );
                try {
                    console.log("🎬 Converting updated video to HLS...");
                    videoPath = await hlsService.convertToHLS(uploadedVideoPath);
                    console.log("✅ HLS URL:", videoPath);
                } catch (conversionError: any) {
                    return res.status(500).json({
                        success: false,
                        message: "Video conversion failed: " + conversionError.message,
                    });
                }
            }

            const updatedMovie = await movieService.updateMovie(
                id,
                parsedData.data,
                thumbnailPath,
                videoPath
            );

            return res.status(200).json({
                success: true,
                message: "Movie updated successfully",
                data: updatedMovie,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * DELETE /api/admin/movies/:id
     */
    async deleteMovie(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // ✅ Get movie first to delete HLS files
            const movie = await movieService.getMovieById(id);
            if (movie?.videoUrl) {
                hlsService.deleteHLSFiles(movie.videoUrl);
            }

            const result = await movieService.deleteMovie(id);

            return res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * GET /api/admin/movies/genres/list
     */
    async getAllGenres(req: Request, res: Response) {
        try {
            const genres = await movieService.getAllGenres();

            return res.status(200).json({
                success: true,
                message: "Genres fetched successfully",
                data: genres,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }
}