import { getLogger } from "@/lib/log4js";

const logger = getLogger("ScheduledTasks");

export interface ScheduledTask {
  name: string;
  interval: number; // 毫秒
  handler: () => Promise<void> | void;
  enabled?: boolean;
}

export class ScheduledTasks {
  private tasks: Map<string, NodeJS.Timeout>;

  constructor() {
    this.tasks = new Map();
  }

  /**
   * 添加并启动定时任务
   * @param task 任务配置对象
   */
  public addTask(task: ScheduledTask): ScheduledTasks {
    if (task.enabled === false) {
      logger.info(`Task [${task.name}] is disabled.`);
      return this;
    }

    if (this.tasks.has(task.name)) {
      logger.warn(`Task [${task.name}] already exists. Skipping.`);
      return this;
    }

    logger.info(`Starting task [${task.name}] with interval ${task.interval}ms.`);

    // 立即执行一次
    this.executeTask(task);

    // 启动定时器
    const timer = setInterval(() => {
      this.executeTask(task);
    }, task.interval);

    this.tasks.set(task.name, timer);
    return this;
  }

  /**
   * 停止指定任务
   * @param name 任务名称
   */
  public stopTask(name: string): boolean {
    const timer = this.tasks.get(name);
    if (timer) {
      clearInterval(timer);
      this.tasks.delete(name);
      logger.info(`Task [${name}] stopped.`);
      return true;
    }
    return false;
  }

  /**
   * 停止所有任务
   */
  public stopAll() {
    this.tasks.forEach((timer, name) => {
      clearInterval(timer);
      logger.info(`Task [${name}] stopped.`);
    });
    this.tasks.clear();
  }

  private async executeTask(task: ScheduledTask) {
    try {
      // logger.debug(`Executing task [${task.name}]...`);
      await task.handler();
    } catch (error) {
      logger.error(`Error executing task [${task.name}]:`, error);
    }
  }
}
