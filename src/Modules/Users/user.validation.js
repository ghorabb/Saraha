import Joi from "joi";
import {
  commonFiledValidation,
  validateObjectId,
} from "../../Middleware/validation.js";

export const uploadProfilePicSchema = {
  file: Joi.object({})
    .keys({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string().required(),
      finalPath: Joi.string().required(),
      path: Joi.string().required(),
      destination: Joi.string().required(),
      filename: Joi.string().required(),
      size: Joi.number().required(),
    })
    .required(),
};

export const uploadCoverPicsSchema = {
  files: Joi.array()
    .items(
      Joi.object({}).keys({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string().required(),
        finalPath: Joi.string().required(),
        path: Joi.string().required(),
        destination: Joi.string().required(),
        filename: Joi.string().required(),
        size: Joi.number().required(),
      }),
    )
    .required(),
};

export const shareProfileSchema = {
  params: Joi.object()
    .keys({
      id: Joi.string().custom(validateObjectId).required(),
    })
    .required(),
};

export const updatePasswordSchema = {
  body: Joi.object({})
    .keys({
      oldPassword: commonFiledValidation.password.required(),
      newPassword: commonFiledValidation.password.required(),
      confirmNewPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .required()
        .messages({
          "any.only": "Confirm password must match password",
        }),
    })
    .required(),
};
