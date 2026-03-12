import Redis from "ioredis";
import { logger } from "./log4js";
import { REDIS_CONFIG } from "@/config/index";

export const redis = new Redis(REDIS_CONFIG);

redis.on("connect", () => {
  logger.info("********** Redis Connected **********");
});

redis.on("error", (err) => {
  logger.error("********** Redis Error **********\n" + err);
});

export default redis;
