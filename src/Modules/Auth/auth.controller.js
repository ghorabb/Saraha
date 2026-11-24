import express from "express";
import {
  confirmAccount,
  forgetPassword,
  refreshToken,
  resendConfirmAccount,
  resendForgetPassword,
  resetPassword,
  signin,
  signUp,
  signUpWithGmail,
  verifyForgetPassword,
} from "./auth.service.js";
import { validation } from "../../Middleware/validation.js";
import {
  activateSchema,
  forgetPasswordSchema,
  login,
  reActivateSchema,
  resendForgetPasswordSchema,
  resetPasswordSchema,
  signup,
  verifyForgetPasswordSchema,
} from "./auth.validation.js";
import { authenticate } from "../../Middleware/authentication.js";

const authRouter = express.Router();

authRouter.post("/signup", validation(signup), signUp);
authRouter.post("/activateAccount", validation(activateSchema), confirmAccount);

authRouter.post(
  "/reActivateAccount",
  validation(reActivateSchema),
  resendConfirmAccount,
);

authRouter.post(
  "/resend-forget-password",
  validation(resendForgetPasswordSchema),
  resendForgetPassword,
);

authRouter.post(
  "/forget-password",
  validation(forgetPasswordSchema),
  forgetPassword,
);
authRouter.post(
  "/verify-forget-password",
  validation(verifyForgetPasswordSchema),
  verifyForgetPassword,
);
authRouter.post(
  "/reset-password",
  validation(resetPasswordSchema),
  resetPassword,
);
authRouter.post("/signup/gmail", signUpWithGmail);
authRouter.post("/login", validation(login), signin);
authRouter.post("/refresh-token", authenticate("refresh"), refreshToken);

export default authRouter;
