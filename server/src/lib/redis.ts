import Redis from "ioredis";
import { logger } from "./log4js";

const REDIS_CONFIG = {
  host: "127.0.0.1",
  port: 6379,
  password: "", // Default no password
};

export const redis = new Redis(REDIS_CONFIG);

redis.on("connect", () => {
  logger.info("********** Redis Connected **********");
});

redis.on("error", (err) => {
  logger.error("********** Redis Error **********\n" + err);
});

export default redis;
