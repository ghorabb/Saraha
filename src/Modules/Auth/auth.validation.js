import Joi from "joi";
import { commonFiledValidation } from "../../Middleware/validation.js";

export const signup = {
  query: Joi.object({}).keys({
    ln: Joi.string().valid("ar", "en").required(),
  }),

  body: Joi.object({}).keys({
    firstName: commonFiledValidation.firstName.required(),
    lastName: commonFiledValidation.lastName.required(),
    email: commonFiledValidation.email.required(),
    password: commonFiledValidation.password.required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Confirm password must match password",
      }),
    DOB: commonFiledValidation.DOB,
    phoneNumber: commonFiledValidation.phone,
    gender: commonFiledValidation.gender,
  }),
};

export const login = {
  body: Joi.object({})
    .keys({
      email: commonFiledValidation.email.required(),
      password: commonFiledValidation.password,
    })
    .required(),
};

export const activateSchema = {
  body: Joi.object({})
    .keys({
      email: commonFiledValidation.email.required(),
      otp: commonFiledValidation.OTP,
    })
    .required(),
};

export const reActivateSchema = {
  body: Joi.object({})
    .keys({
      email: commonFiledValidation.email.required(),
    })
    .required(),
};

export const resendForgetPasswordSchema = {
  body: Joi.object({})
    .keys({
      email: commonFiledValidation.email.required(),
    })
    .required(),
};

export const forgetPasswordSchema = {
  body: Joi.object({})
    .keys({
      email: commonFiledValidation.email.required(),
    })
    .required(),
};

export const verifyForgetPasswordSchema = {
  body: Joi.object({})
    .keys({
      email: commonFiledValidation.email.required(),
      otp: commonFiledValidation.OTP,
    })
    .required(),
};

export const resetPasswordSchema = {
  body: Joi.object({})
    .keys({
      email: commonFiledValidation.email.required(),
      otp: commonFiledValidation.OTP,
      password: commonFiledValidation.password.required(),
      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Confirm password must match password",
        }),
    })
    .required(),
};
