import mongoose from "mongoose";

async function connectDB() {
  try {
    const DB = process.env.DATABASE.replace(
      "<db_password>",
      process.env.DATABASE_PASSWORD,
    );
    await mongoose.connect(DB);
    console.log("MongoDB connected successfully...");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

export default connectDB;
