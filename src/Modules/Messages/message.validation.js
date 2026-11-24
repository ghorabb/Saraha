import Joi from "joi";
import { commonFiledValidation } from "../../Middleware/validation.js";

export const sendMessageSchema = {
  body: Joi.object({}).keys({
    content: Joi.string().min(3).max(1000),
  }),
  params: Joi.object({}).keys({
    receiverId: commonFiledValidation.id.required(),
  }),
};

export const getMessageByIdSchema = {
  params: Joi.object({}).keys({
    messageId: commonFiledValidation.id.required(),
  }),
};

export const deleteMessageSchema = {
  params: Joi.object({}).keys({
    messageId: commonFiledValidation.id.required(),
  }),
};
