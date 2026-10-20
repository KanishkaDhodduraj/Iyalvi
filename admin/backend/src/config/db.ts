import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);
mongoose.set("autoIndex", env.NODE_ENV !== "production");
mongoose.set("bufferCommands", false);

type MongooseGlobal = typeof globalThis & {
  __iyalviAdminMongoConnection?: Promise<void>;
};

const globalForMongoose = globalThis as MongooseGlobal;

function logConnectionError(error: unknown): void {
  const details = error instanceof Error
    ? error.stack ?? `${error.name}: ${error.message}`
    : String(error);
  const redactedDetails = details.replaceAll(env.DATABASE_URL, "[redacted DATABASE_URL]");
  console.error("Admin database connection failed", redactedDetails);
}

export function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (globalForMongoose.__iyalviAdminMongoConnection) {
    return globalForMongoose.__iyalviAdminMongoConnection;
  }

  let connectAttempt: Promise<typeof mongoose>;
  try {
    connectAttempt = mongoose.connect(env.DATABASE_URL, {
      autoIndex: env.NODE_ENV !== "production",
      bufferCommands: false,
      serverSelectionTimeoutMS: 5_000,
    });
  } catch (error) {
    connectAttempt = Promise.reject(error);
  }

  const connection = connectAttempt
    .then(() => {
      if (globalForMongoose.__iyalviAdminMongoConnection === connection) {
        delete globalForMongoose.__iyalviAdminMongoConnection;
      }
    })
    .catch((error: unknown) => {
      if (globalForMongoose.__iyalviAdminMongoConnection === connection) {
        delete globalForMongoose.__iyalviAdminMongoConnection;
      }
      logConnectionError(error);
      throw error;
    });
  globalForMongoose.__iyalviAdminMongoConnection = connection;
  return connection;
}
