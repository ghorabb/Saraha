import {
  badRequestException,
  notFoundException,
  successResponse,
} from "../../Common/Response/response.js";
import Message from "../../DB/Models/Message.model.js";
import User from "../../DB/Models/User.model.js";

export const sendMessage = async (req, res, next) => {
  if (!req.body && !req.files) {
    return badRequestException("Please send content or files");
  }
  const { content } = req.body;

  const receiverId = req.params.receiverId;
  const files = req.files;

  const receiverUser = await User.findById(receiverId);
  if (!receiverUser) {
    return badRequestException("Receiver not found");
  }

  const newMessage = await Message.create({
    content,
    attachments: files.map((file) => file.finalPath),
    receiverId,
    senderId: req?.user?._id,
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Message send successfully",
  });
};

export const getAllMessages = async (req, res, next) => {
  const userId = req.user._id;

  const messages = await Message.find({
    $or: [{ receiverId: userId }, { senderId: userId }],
  });

  if (!messages) {
    return notFoundException("Messages not found");
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "success",
    data: messages,
  });
};

export const getMessageById = async (req, res, next) => {
  const messageId = req.params.messageId;
  const receiverId = req.user._id;

  const message = await Message.findOne({ _id: messageId, receiverId });

  if (!message) {
    return notFoundException("Message not found");
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "success",
    data: message,
  });
};

export const deleteMessage = async (req, res, next) => {
  const messageId = req.params.messageId;
  const receiverId = req.user._id;

  const message = await Message.findOneAndDelete({
    _id: messageId,
    receiverId,
  });

  if (!message) {
    return notFoundException("Message not found");
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "Message deleted successfully",
  });
};
