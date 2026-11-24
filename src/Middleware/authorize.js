import { forbiddenException } from "../Common/Response/response.js";

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return forbiddenException(
        "You do not have permission to perform this action",
      );
    }

    next();
  };
}
