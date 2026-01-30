import { Router } from "express";
import { uploads } from "../middlewares/upload.middleware";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { UserProfileController } from "../controller/user.profile.controller";

let userProfileController = new UserProfileController();

let router = Router()

router.get("/getProfile",authorizedMiddleware,userProfileController.getUserProfile)
router.put("/updateProfile",authorizedMiddleware,uploads.single("profile_image"),userProfileController.updateUserProfile)
// router.put("/createProfile",UserProfileController.createUserProfile)

export default router;
