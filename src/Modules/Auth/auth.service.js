import { OAuth2Client } from "google-auth-library";

import User from "../../DB/Models/User.model.js";
import {
  generateTokens,
  generateAccessToken,
} from "../../Common/Security/token.js";

import {
  successResponse,
  conflictException,
  unAuthorizedException,
  badRequestException,
} from "../../Common/Response/response.js";

import { EmailEnum, ProviderEnum } from "../../Common/Enum/enum.js";
import { sendEmail } from "../../Common/Email/email.config.js";
import { get, incr, set, ttl } from "../../DB/redis.service.js";
import { generateOTP } from "../../Common/OTP/otp.service.js";
import { comparePassword, hashOperation } from "../../Common/Security/hash.js";

export const sendEmailOTP = async ({ email, emailType, subject }) => {
  const otpKey = `OTP::${email}::${emailType}`;

  // Check if there is an existing valid OTP
  const prevOTPttl = await ttl(otpKey);

  if (prevOTPttl > 0) {
    return badRequestException(
      `There is a valid OTP with ${prevOTPttl} seconds left.`,
    );
  }

  // Check if the user is blocked
  const isBlockedTimer = await ttl(`${otpKey}::Blocked`);

  if (isBlockedTimer > 0) {
    return badRequestException(
      `Try again later after ${Math.ceil(isBlockedTimer / 60)} mins`,
    );
  }

  // Check request limit
  const reqNo = await get(`${otpKey}::No`);

  if (reqNo == 5) {
    await set({
      key: `${otpKey}::Blocked`,
      value: 1,
      exValue: 60 * 10,
    });

    return badRequestException(
      `You can not request more than ${reqNo} in 20 mins.`,
    );
  }

  // Generate OTP
  const otp = generateOTP();

  // Send email
  await sendEmail({
    to: email,
    subject,
    html: `<h1>Your OTP is ${otp}</h1>`,
  });

  // Store hashed OTP
  await set({
    key: otpKey,
    value: await hashOperation(otp),
    exValue: 180,
  });

  // Increment requests
  await incr(`${otpKey}::No`);

  return true;
};

export const signUp = async (req, res, next) => {
  const { firstName, lastName, email, password, DOB, phoneNumber, gender } =
    req.vbody;

  const isEmail = await User.findOne({ email });

  if (isEmail) {
    return conflictException("Email already exists");
  }

  const hashedPassword = await hashOperation(password);

  const encryptedPhone = User.encryptPhoneNumber(phoneNumber);

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    DOB,
    gender,
    phoneNumber: encryptedPhone,
  });

  const otp = generateOTP();

  await sendEmail({
    to: email,
    subject: "Confirm Email",
    html: `<h1>Your OTP ${otp}</h1>`,
  });

  await set({
    key: `OTP::${email}::${EmailEnum.confirmEmail}`,
    value: await hashOperation(otp),
    exValue: 120,
  });

  await set({
    key: `OTP::${email}::${EmailEnum.confirmEmail}::No`,
    value: 1,
    exValue: 60 * 20,
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Activate Code sent successfully",
  });
};

export const confirmAccount = async (req, res, next) => {
  const { email, otp } = req.vbody;

  const user = await User.findOne({ email, confirmEmail: false });

  if (!user) {
    return badRequestException("Invalid Email or already activated");
  }

  const storedOTP = await get(`OTP::${email}::${EmailEnum.confirmEmail}`);

  if (!storedOTP) {
    return badRequestException("OTP Expired");
  }
  const validOTP = await comparePassword(otp, storedOTP);

  if (!validOTP) {
    return badRequestException("OTP not valid");
  }

  user.confirmEmail = true;
  await user.save();

  return successResponse({
    res,
    statusCode: 200,
    message: "Account activated successfully",
  });
};

export const resendConfirmAccount = async (req, res, next) => {
  // const { email } = req.vbody;

  // const prevOTPttl = await ttl(`OTP::${email}::${EmailEnum.confirmEmail}`);

  // if (prevOTPttl > 0) {
  //   return badRequestException(
  //     `There is a valid OTP with ${prevOTPttl} seconds left.`,
  //   );
  // }

  // const isBlockedTimer = await ttl(
  //   `OTP::${email}::${EmailEnum.confirmEmail}::Blocked`,
  // );
  // if (isBlockedTimer > 0) {
  //   return badRequestException(
  //     `Try again later after ${Math.ceil(isBlockedTimer / 60)} mins`,
  //   );
  // }

  // const reqNo = await get(`OTP::${email}::${EmailEnum.confirmEmail}::No`);

  // if (reqNo == 5) {
  //   await set({
  //     key: `OTP::${email}::${EmailEnum.confirmEmail}::Blocked`,
  //     value: 1,
  //     exValue: 60 * 10,
  //   });

  //   return badRequestException(
  //     `You can not request more than ${reqNo} in 20 mins.`,
  //   );
  // }

  // const otp = generateOTP();

  // await sendEmail({
  //   to: email,
  //   subject: "Confirm Email",
  //   html: `<h1>Your OTP ${otp}</h1>`,
  // });

  // await set({
  //   key: `OTP::${email}::${EmailEnum.confirmEmail}`,
  //   value: await hashOperation(otp),
  //   exValue: 180,
  // });

  // await incr(`OTP::${email}::${EmailEnum.confirmEmail}::No`);

  const { email } = req.vbody;

  await sendEmailOTP({
    email,
    emailType: EmailEnum.confirmEmail,
    subject: "Confirm Email",
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Check your inbox",
  });
};

export const resendForgetPassword = async (req, res, next) => {
  const { email } = req.vbody;

  await sendEmailOTP({
    email,
    emailType: EmailEnum.forgetPassword,
    subject: "Reset your password",
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Check your inbox",
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.vbody;

  const user = await User.findOne({ email });
  if (!user) {
    return;
  }

  if (!user.confirmEmail) {
    return badRequestException("Please confirm your email first");
  }

  await sendEmailOTP({
    email,
    emailType: EmailEnum.forgetPassword,
    subject: "Reset your password",
  });

  await set({
    key: `OTP::${email}::${EmailEnum.forgetPassword}::No`,
    value: 1,
    exValue: 60 * 20,
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Check your inbox",
  });
};

export const verifyForgetPassword = async (req, res, next) => {
  const { email, otp } = req.vbody;

  const storedOTP = await get(`OTP::${email}::${EmailEnum.forgetPassword}`);

  if (!storedOTP) {
    return badRequestException("OTP Expired");
  }
  const validOTP = await comparePassword(otp, storedOTP);

  if (!validOTP) {
    return badRequestException("OTP not valid");
  }
  return successResponse({
    res,
    statusCode: 200,
    message: "verified successuflly",
  });
};

export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.vbody;

  await verifyForgetPassword(req, res, next);

  const user = await User.findOne({ email });

  if (!user) {
    return badRequestException("Invalid email");
  }

  user.password = await hashOperation(password);
  await user.save();

  return successResponse({
    res,
    statusCode: 200,
    message: "Password updated successfully",
  });
};

async function verifyGoogleToken(idToken) {
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });

  const payload = ticket.getPayload();

  return payload;
}

export const signinWithGoogle = async (req, res, next) => {
  const { idToken } = req.body;

  const payload = await verifyGoogleToken(idToken);

  if (!payload.email_verified) {
    return badRequestException("Email must be verified");
  }

  const user = await User.findOne({
    email: payload.email,
    provider: ProviderEnum.google,
  });

  if (!user) {
    return await signUpWithGmail(req, res, next);
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  return successResponse({
    res,
    statusCode: 200,
    message: "Login successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
};

export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const payloadGoogleToken = await verifyGoogleToken(idToken);

  if (!payloadGoogleToken.email_verified) {
    return badRequestException("Email must be verified");
  }

  const user = await User.findOne({
    email: payloadGoogleToken.email,
  });

  if (user) {
    if (user.provider === ProviderEnum.system) {
      return badRequestException(
        "Account already exists, please login with your email and password",
      );
    }

    return await signinWithGoogle(req, res, next);
  }

  const newUser = await User.create({
    userName: payloadGoogleToken.name,
    email: payloadGoogleToken.email,
    profilePicture: payloadGoogleToken.picture,
    confirmEmail: true,
    provider: ProviderEnum.google,
  });

  const { accessToken, refreshToken } = generateTokens(newUser.id);

  return successResponse({
    res,
    statusCode: 201,
    message: "User created successfully",
    data: { accessToken, refreshToken },
  });
};

export const signin = async (req, res, next) => {
  const { email, password } = req.vbody;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await comparePassword(password, user.password))) {
    return unAuthorizedException("Incorrect email or password");
  }

  if (!user.confirmEmail) {
    return badRequestException("Please confirm your email first.");
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  return successResponse({
    res,
    statusCode: 200,
    message: "Login successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
};

export const refreshToken = async (req, res, next) => {
  const user = req.user;
  const tokenId = req.tokenPayload.jti;

  const accessToken = generateAccessToken(user.id, tokenId);

  return successResponse({
    res,
    statusCode: 200,
    message: "Access token refreshed successfully",
    data: { accessToken },
  });
};

// export const refreshToken = async (req, res, next) => {
//   const { refreshToken: token } = req.body;

//   if (!token) {
//     throw new Error("Please provide a refresh token.", {
//       cause: { statusCode: 401 },
//     });
//   }

//   const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

//   if (decoded.type !== "refresh") {
//     throw new Error("Invalid refresh token.", {
//       cause: { statusCode: 401 },
//     });
//   }

//   const user = await User.findById(decoded.id).select("+refreshTokenHash");

//   if (!user || user.refreshTokenHash !== hashToken(token)) {
//     throw new Error("Invalid refresh token. Please login again.", {
//       cause: { statusCode: 401 },
//     });
//   }

//   const newAccessToken = generateAccessToken(user.id);
//   const newRefreshToken = generateRefreshToken(user.id);

//   user.refreshTokenHash = hashToken(newRefreshToken);
//   await user.save();

//   res.status(200).json({
//     status: "success",
//     accessToken: newAccessToken,
//     refreshToken: newRefreshToken,
//   });
// };

// export const refreshToken = async (req, res, next) => {
//   const { refreshToken: token } = req.body;

//   if (!token) {
//     return unAuthorizedException("Please provide a refresh token");
//   }

//   let decoded;

//   try {
//     decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
//   } catch (error) {
//     return unAuthorizedException("Invalid or expired refresh token");
//   }

//   if (decoded.type !== "refresh") {
//     return unAuthorizedException("Invalid refresh token");
//   }

//   const user = await User.findById(decoded.id);

//   if (!user) {
//     return unAuthorizedException("User no longer exists. Please login again");
//   }

//   const accessToken = generateAccessToken(user.id);

//   successResponse({
//     res,
//     statusCode: 200,
//     message: "Access token refreshed successfully",
//     data: { accessToken },
//   });
// };
