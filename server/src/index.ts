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
import { ScheduledTasks } from "@/lib/scheduled-tasks";
import { generationQueueCheckTask } from "@/tasks/index";

const app = new Koa();
app.proxy = true; // 信任代理服务器的头信息（如 X-Forwarded-Proto），允许 HTTPS 下设置 secure cookie
const router = new RouterClass();

// Middlewares
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text'],
  formLimit: '50mb',
  jsonLimit: '50mb',
  encoding: undefined
}));

// Routes
apiRouter(router);
app.use(router.routes()).use(router.allowedMethods());

export const bootstrapServer = () => {
  connectMongoDB();
  initMinio();
  generationScheduler.start();
  const scheduledTasksInstance = new ScheduledTasks();
  scheduledTasksInstance.addTask(generationQueueCheckTask);
};

if (process.env.NODE_ENV !== "test") {
  bootstrapServer();
  const PORT = process.env.PORT || serverConfig.server?.port || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

export default app;
