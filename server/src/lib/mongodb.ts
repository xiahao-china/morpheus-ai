import mongoose from "mongoose";
import { logger } from "./log4js";

const DB_CONFIG = {
  URL: "mongodb://127.0.0.1:27017/morpheus-ai"
};

export const connectMongoDB = () => {
  mongoose.connect(DB_CONFIG.URL);

  const db = mongoose.connection;

  db.on("open", () => logger.info("********** MongoDB Connected **********"));
  db.on("connected", () => logger.info("********** MongoDB Open **********"));
  db.on("error", (err) => logger.error("********** MongoDB Error **********\n" + err));
  db.on("disconnected", () => logger.warn("********** MongoDB Disconnected **********"));
};
