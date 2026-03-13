import Koa from "koa";
import RouterClass from "koa-router";
import { bodyParser } from "@koa/bodyparser";
import { connectMongoDB } from "@/lib/mongodb";
import { initMinio } from "@/lib/minio";
import apiRouter from "@/routes/api/index";
import { logger } from "@/lib/log4js";
import "@/lib/redis"; // Ensure Redis connects
import { serverConfig } from "@/utils/common";
import { generationScheduler } from "@/services/generation-scheduler";

const app = new Koa();
const router = new RouterClass();

// Connect DB
connectMongoDB();

// Init MinIO
initMinio();

// Start Generation Scheduler
generationScheduler.start();

// Middlewares
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text'],
  formLimit: '10mb',
  jsonLimit: '10mb',
  encoding: undefined
}));

// Routes
apiRouter(router);
app.use(router.routes()).use(router.allowedMethods());

const PORT = serverConfig.server?.port || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
