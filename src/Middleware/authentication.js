import jwt from "jsonwebtoken";
import User from "../DB/Models/User.model.js";
import { unAuthorizedException } from "../Common/Response/response.js";
import { get } from "../DB/redis.service.js";

export const authenticate = (tokenType = "access") => {
  return async (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return unAuthorizedException("You are not logged in! Please login.");
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        tokenType === "refresh"
          ? process.env.JWT_REFRESH_SECRET
          : process.env.JWT_ACCESS_SECRET,
      );
    } catch (error) {
      return unAuthorizedException(`Invalid or expired ${tokenType} token`);
    }

    if (decoded.type !== tokenType || !decoded.jti) {
      return unAuthorizedException(`Invalid ${tokenType} token`);
    }

    // Check if the token has been blacklisted
    // const invalidToken = await Token.findOne({
    //   user: decoded.id,
    //   tokenId: decoded.jti,
    //   expiresAt: { $gt: new Date() },
    // });

    if (await get(`blacklistToken::${decoded.id}::${decoded.jti}`)) {
      return unAuthorizedException("You are logged out. Please login again.");
    }

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return unAuthorizedException(
        "The user belonging to this token no longer exists",
      );
    }

    // Check whether the token was issued before credentials were changed
    if (
      currentUser.credentialsChangedAt &&
      decoded.iat * 1000 <= currentUser.credentialsChangedAt.getTime()
    ) {
      return unAuthorizedException(
        "Your session has expired. Please login again.",
      );
    }

    req.user = currentUser;
    req.tokenPayload = decoded;

    next();
  };
};
