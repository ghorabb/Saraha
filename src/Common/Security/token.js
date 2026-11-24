import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// Generate access token
export const generateAccessToken = (userId, tokenId = randomUUID()) => {
  return jwt.sign(
    { id: userId, type: "access" },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES,
      jwtid: tokenId,
    },
  );
};

// Generate refresh token
export const generateRefreshToken = (userId, tokenId = randomUUID()) => {
  return jwt.sign(
    { id: userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
      jwtid: tokenId,
    },
  );
};

// Generate both tokens with the same jti
export const generateTokens = (userId) => {
  const tokenId = randomUUID();

  const accessToken = generateAccessToken(userId, tokenId);
  const refreshToken = generateRefreshToken(userId, tokenId);

  return { accessToken, refreshToken };
};
