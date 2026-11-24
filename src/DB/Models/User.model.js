import bcrypt from "bcrypt";
import mongoose from "mongoose";
import CryptoJS from "crypto-js";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../Common/Enum/enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "User must have a firstName"],
      minlength: [3, "firstName must have more or equal 3 characters"],
      maxlength: [10, "firstName must have less or equal 10 characters"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "User must have a lastName"],
      minlength: [3, "lastName must have more or equal 3 characters"],
      maxlength: [10, "lastName must have less or equal 10 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "User must have an Email"],
    },
    password: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.system;
      },
      trim: true,
      minlength: [6, "Password must have at least 6 characters"],
      select: false,
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    DOB: {
      type: Date,
    },
    phoneNumber: {
      type: String,
    },
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.user,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    profilePicture: {
      type: String,
    },
    coverPictures: {
      type: [String],
    },
    credentialsChangedAt: {
      type: Date,
      default: undefined,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (value) {
    const [firstName, lastName] = value.split(" ");

    this.firstName = firstName;
    this.lastName = lastName;
  });

userSchema.virtual("age").get(function () {
  if (!this.DOB) return null;
  const today = new Date();
  const birthDate = this.DOB;

  let age = today.getFullYear() - birthDate.getFullYear();

  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

userSchema.statics.encryptPhoneNumber = function (phoneNumber) {
  if (!phoneNumber) return undefined;

  return CryptoJS.AES.encrypt(
    phoneNumber,
    process.env.ENCRYPTION_SECRET_KEY,
  ).toString();
};

userSchema.methods.decryptPhoneNumber = function () {
  if (!this.phoneNumber) {
    return undefined;
  }
  const bytes = CryptoJS.AES.decrypt(
    this.phoneNumber,
    process.env.ENCRYPTION_SECRET_KEY,
  );
  return bytes.toString(CryptoJS.enc.Utf8);
};

const User = mongoose.model("User", userSchema);

export default User;
