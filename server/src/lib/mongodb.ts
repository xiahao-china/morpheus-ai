import mongoose from "mongoose";
import { logger } from "./log4js";
import { MONGO_CONFIG } from "@/config/index";

export const connectMongoDB = () => {
  mongoose.connect(MONGO_CONFIG.URL);

  const db = mongoose.connection;

  db.on("open", () => logger.info("********** MongoDB Connected **********"));
  db.on("connected", () => logger.info("********** MongoDB Open **********"));
  db.on("error", (err) => logger.error("********** MongoDB Error **********\n" + err));
  db.on("disconnected", () => logger.warn("********** MongoDB Disconnected **********"));
};
