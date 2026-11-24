import {
  badRequestException,
  notFoundException,
  successResponse,
  unAuthorizedException,
} from "../../Common/Response/response.js";
import { hashOperation, comparePassword } from "../../Common/Security/hash.js";
import User from "../../DB/Models/User.model.js";
import { set } from "../../DB/redis.service.js";

export const getProfile = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const phoneNumber = user.decryptPhoneNumber();

  successResponse({
    res,
    statusCode: 200,
    data: {
      user: {
        ...user.toObject(),
        phoneNumber,
      },
    },
  });
};

export const shareProfile = async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    "-role -conirmemail -provider -createdAt -updatedAt -__v",
  );

  if (!user) {
    return notFoundException("User not found");
  }

  const phoneNumber = user.decryptPhoneNumber();

  successResponse({
    res,
    statusCode: 200,
    data: {
      user: {
        ...user.toObject(),
        phoneNumber,
      },
    },
  });
};

export const uploadProfilePic = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!req.file) {
    return badRequestException("Please upload a profile picture");
  }

  user.profilePicture = req.file.finalPath;

  await user.save();

  return res.status(200).json({
    status: "success",
    message: "Profile picture uploaded successfully",
  });
};

export const uploadCoverPics = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!req.files) {
    return badRequestException("Please upload cover pictures");
  }

  const coverPics = req.files.map((file) => {
    return file.finalPath;
  });

  user.coverPictures = coverPics;
  await user.save();

  return res.status(200).json({
    status: "success",
    message: "Cover pictures uploaded successfully",
  });
};

export const logout = async (req, res, next) => {
  if (req.body.option === "all") {
    await User.findByIdAndUpdate(req.user._id, {
      credentialsChangedAt: new Date(),
    });
  } else {
    const { jti, iat } = req.tokenPayload;
    // await Token.create({
    //   user: req.user._id,
    //   tokenId: jti,
    //   expiresAt: new Date((iat + 90 * 24 * 60 * 60) * 1000),
    // });
    await set({
      key: `blacklistToken::${req.user._id}::${jti}`,
      value: jti,
      exValue: 90 * 24 * 60 * 60 - (Date.now() / 1000 - iat),
    });
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "Logged out successfully",
  });
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.vbody;

  const user = await User.findById(req.user._id).select("+password");

  if (!(await comparePassword(oldPassword, user.password))) {
    return unAuthorizedException("Incorrect current password");
  }

  user.password = await hashOperation(newPassword);

  user.credentialsChangedAt = Date.now();

  await user.save();

  return successResponse({
    res,
    statusCode: 200,
    message: "Password updated successfully. Please login again.",
  });
};
