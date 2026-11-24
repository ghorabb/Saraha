import express from "express";
import {
  allowedFileformate,
  localUpload,
} from "../../Common/Multer/multer.config.js";
import {
  deleteMessage,
  getAllMessages,
  getMessageById,
  sendMessage,
} from "./message.service.js";
import { messageAuthentication } from "../../Middleware/MessageAuthentication.js";
import {
  deleteMessageSchema,
  getMessageByIdSchema,
  sendMessageSchema,
} from "./message.validation.js";
import { validation } from "../../Middleware/validation.js";
import { authenticate } from "../../Middleware/authentication.js";

const messageRouter = express.Router();

messageRouter.post(
  "/:receiverId",
  messageAuthentication,
  localUpload({
    folderName: "MsgFile",
    allowedFormate: [...allowedFileformate.img, allowedFileformate.video],
  }).array("attachments", 5),
  validation(sendMessageSchema),
  sendMessage,
);

messageRouter.get("/getAllMessages", authenticate(), getAllMessages);

messageRouter.get(
  "/:messageId",
  authenticate(),
  validation(getMessageByIdSchema),
  getMessageById,
);

messageRouter.delete(
  "/:messageId",
  authenticate(),
  validation(deleteMessageSchema),
  deleteMessage,
);

export default messageRouter;
