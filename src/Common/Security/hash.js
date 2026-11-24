import { compare, hash } from "bcrypt";

export const hashOperation = async (password) => {
  return await hash(password, 12);
};

export const comparePassword = async (userPassword, password) => {
  return await compare(userPassword, password);
};
