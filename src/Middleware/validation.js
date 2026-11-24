import Joi from "joi";
import { badRequestException } from "../Common/Response/response.js";
import { GenderEnum } from "../Common/Enum/enum.js";
import { Types } from "mongoose";

export function validation(schema) {
  return (req, res, next) => {
    const validationErrors = [];
    for (const schemakey of Object.keys(schema)) {
      const validateResult = schema[schemakey].validate(req[schemakey], {
        abortEarly: false,
      });

      req["v" + schemakey] = validateResult.value;

      if (validateResult.error?.details.length > 0) {
        validationErrors.push(validateResult.error);
      }
    }

    if (validationErrors.length > 0) {
      return badRequestException(`validationerr: ${validationErrors}`);
    }

    next();
  };
}

export const commonFiledValidation = {
  firstName: Joi.string()
    .min(3)
    .max(10)
    .pattern(/^[A-Z][a-zA-Z]*$/)
    .messages({
      "string.pattern.base":
        "First name must start with a capital letter and contain only letters",
    }),

  lastName: Joi.string()
    .min(3)
    .max(10)
    .pattern(/^[A-Z][a-zA-Z]*$/)
    .messages({
      "string.pattern.base":
        "Last name must start with a capital letter and contain only letters",
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .pattern(/^[^@]+@(gmail|yahoo|outlook|hotmail)\.(com|net)$/),

  password: Joi.string()
    .min(8)
    .max(18)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
    )
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),

  phone: Joi.string()
    .pattern(/^(\+20|0020|0)1[0125]\d{8}$/)
    .messages({
      "string.pattern.base":
        "Phone number must be a valid Egyptian mobile number",
    }),

  DOB: Joi.date(),

  gender: Joi.string().valid(...Object.values(GenderEnum)),
  OTP: Joi.string().length(6),
  id: Joi.string().custom(validateObjectId),
};

export function validateObjectId(value, helpers) {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.message("invalid object id formate");
  }
}
