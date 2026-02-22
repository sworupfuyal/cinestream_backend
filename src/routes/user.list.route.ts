import { Router } from "express";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { UserListController } from "../controller/user.list.controller";

const userListRouter = Router();
const userListController = new UserListController();

/**
 * All routes require authentication
 */
userListRouter.use(authorizedMiddleware);

// Add movie to list
userListRouter.post(
    "/",
    (req, res) => userListController.addToList(req, res)
);

// Get user's lists
userListRouter.get(
    "/",
    (req, res) => userListController.getUserLists(req, res)
);

// Get list counts
userListRouter.get(
    "/counts",
    (req, res) => userListController.getListCounts(req, res)
);

// Get list status for multiple movies
userListRouter.post(
    "/status",
    (req, res) => userListController.getListStatus(req, res)
);

// Remove movie from list
userListRouter.delete(
    "/:movieId/:listType",
    (req, res) => userListController.removeFromList(req, res)
);

export default userListRouter;