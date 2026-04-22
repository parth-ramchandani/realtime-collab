import mongoose from "mongoose";
import { env } from "../utils/env";

export async function connectMongo(): Promise<boolean> {
  if (!env.mongoUri) {
    console.warn("MONGO_URI not configured. Running with in-memory persistence only.");
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB.");
    return true;
  } catch (error) {
    console.warn("MongoDB unavailable. Running with in-memory persistence only.", error);
    return false;
  }
}
