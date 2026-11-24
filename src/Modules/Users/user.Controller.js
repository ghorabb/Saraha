import express from "express";
import { authenticate } from "../../Middleware/authentication.js";
import {
  getProfile,
  logout,
  shareProfile,
  updatePassword,
  uploadCoverPics,
  uploadProfilePic,
} from "./user.service.js";
import {
  allowedFileformate,
  localUpload,
} from "../../Common/Multer/multer.config.js";
import { validation } from "../../Middleware/validation.js";
import {
  shareProfileSchema,
  updatePasswordSchema,
  uploadCoverPicsSchema,
  uploadProfilePicSchema,
} from "./user.validation.js";

const userRouter = express.Router();

userRouter.get("/getProfile", authenticate(), getProfile);

userRouter.get(
  "/shareProfile/:id",
  validation(shareProfileSchema),
  shareProfile,
);

userRouter.post(
  "/upload-profilePic",
  authenticate(),
  localUpload({
    folderName: "User",
    allowedFormate: allowedFileformate.img,
  }).single("profilePic"),
  validation(uploadProfilePicSchema),
  uploadProfilePic,
);

userRouter.post(
  "/upload-coverPics",
  authenticate(),
  localUpload({
    folderName: "User",
    allowedFormate: allowedFileformate.img,
  }).array("coverPics"),
  validation(uploadCoverPicsSchema),
  uploadCoverPics,
);

userRouter.post("/logout", authenticate(), logout);

userRouter.post(
  "/update-password",
  authenticate(),
  validation(updatePasswordSchema),
  updatePassword,
);

export default userRouter;
