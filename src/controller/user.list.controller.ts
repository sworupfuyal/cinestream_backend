import { Request, Response } from "express";
import z from "zod";
import { UserListService } from "../services/user.list.service";
import { AddToListDTO, UserListQueryDTO } from "../dtos/user.list.dto";

const userListService = new UserListService();

export class UserListController {
    /**
     * POST /api/user/lists
     * Add movie to user's list
     */
    async addToList(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id; // From auth middleware

            // Validate request body
            const parsedData = AddToListDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: z.prettifyError(parsedData.error),
                });
            }

            const { movieId, listType } = parsedData.data;

            const result = await userListService.addToList(userId, movieId, listType);

            return res.status(201).json({
                success: true,
                message: result.message,
                data: result.data,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * DELETE /api/user/lists/:movieId/:listType
     * Remove movie from user's list
     */
    async removeFromList(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { movieId, listType } = req.params;

            if (!['favorite', 'watchlater'].includes(listType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid list type. Must be 'favorite' or 'watchlater'",
                });
            }

            const result = await userListService.removeFromList(
                userId, 
                movieId, 
                listType as 'favorite' | 'watchlater'
            );

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
     * GET /api/user/lists
     * Get user's lists (favorites and/or watch later)
     */
    async getUserLists(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // Validate query parameters
            const parsedQuery = UserListQueryDTO.safeParse(req.query);
            if (!parsedQuery.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    errors: z.prettifyError(parsedQuery.error),
                });
            }

            const { listType } = parsedQuery.data;

            const lists = await userListService.getUserList(userId, listType);

            return res.status(200).json({
                success: true,
                message: "Lists fetched successfully",
                data: lists,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * POST /api/user/lists/status
     * Get user's list status for multiple movies
     */
    async getListStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { movieIds } = req.body;

            if (!Array.isArray(movieIds)) {
                return res.status(400).json({
                    success: false,
                    message: "movieIds must be an array",
                });
            }

            const status = await userListService.getUserListStatus(userId, movieIds);

            return res.status(200).json({
                success: true,
                message: "Status fetched successfully",
                data: status,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    /**
     * GET /api/user/lists/counts
     * Get counts of user's lists
     */
    async getListCounts(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const counts = await userListService.getUserListCounts(userId);

            return res.status(200).json({
                success: true,
                message: "Counts fetched successfully",
                data: counts,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }
}