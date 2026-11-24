import { authenticate } from "./authentication.js";

export const messageAuthentication = async (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    const authMiddlware = authenticate();
    return authMiddlware(req, res, next);
  }
  next();
};
