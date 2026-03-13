/**
 * ComfyUI 工作流管理器模块
 * 负责加载工作流模板、动态生成可执行的工作流
 */
import fs from "fs";
import path from "path";
import _ from "lodash";
import { getLogger } from "@/lib/log4js";

const logger = getLogger("WorkflowManager");

/**
 * 工作流模板接口
 * 定义工作流模板的数据结构
 */
interface WorkflowTemplate {
  id: string;                      // 模板唯一标识
  raw: string;                     // 原始工作流JSON文件名
  placeholders: Record<string, string>; // 参数占位符映射（参数名 -> JSON路径）
}

/**
 * 工作流管理器类
 * 从指定目录加载工作流模板，并支持动态替换参数生成实际工作流
 *
 * 使用方法：
 * @example
 * const workflow = workflowManager.generateWorkflow('template-id', {
 *   prompt: 'A beautiful sunset',
 *   width: 512,
 *   height: 512
 * });
 */
export class WorkflowManager {
  private templates: Map<string, WorkflowTemplate>;  // 模板缓存
  private rawWorkflows: Map<string, any>;             // 原始工作流缓存
  private workflowsDir: string;                                    // 工作流文件目录

  constructor(workflowsDir: string) {
    this.templates = new Map();
    this.rawWorkflows = new Map();
    this.workflowsDir = workflowsDir;
    this.loadWorkflows();
  }

  /**
   * 加载工作流模板
   * 扫描目录下的所有 .json 文件（排除 raw 开头的文件）
   * 解析模板并缓存到内存中
   */
  private loadWorkflows() {
    try {
      const files = fs.readdirSync(this.workflowsDir);
      for (const file of files) {
        // 只处理 .json 文件，且不是以 raw 开头的
        if (file.endsWith(".json") && !file.startsWith("raw")) {
          const content = fs.readFileSync(path.join(this.workflowsDir, file), "utf-8");
          const template = JSON.parse(content) as WorkflowTemplate;
          this.templates.set(template.id, template);

          // 加载关联的原始工作流文件
          if (template.raw && !this.rawWorkflows.has(template.raw)) {
            const rawPath = path.join(this.workflowsDir, template.raw);
            if (fs.existsSync(rawPath)) {
              const rawContent = fs.readFileSync(rawPath, "utf-8");
              this.rawWorkflows.set(template.raw, JSON.parse(rawContent));
            } else {
              logger.warn(`Raw workflow file not found: ${rawPath}`);
            }
          }
        }
      }
      logger.info(`Loaded ${this.templates.size} workflow templates`);
    } catch (error: any) {
      logger.error("Failed to load workflows:", error.message);
    }
  }

  /**
   * 获取指定ID的工作流模板
   * @param id - 模板ID
   * @returns 模板对象，不存在则返回 undefined
   */
  public getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 根据模板生成实际工作流
   * @param templateId - 模板ID
   * @param params - 要替换的参数对象
   * @returns 替换参数后的工作流JSON对象
   *
   * @example
   * const workflow = manager.generateWorkflow('txt2img', {
   *   prompt: 'A cat',
   *   steps: 20
   * });
   */
  public generateWorkflow(templateId: string, params: Record<string, any>): any {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    const rawWorkflow = this.rawWorkflows.get(template.raw);
    if (!rawWorkflow) {
      throw new Error(`Raw workflow not found: ${template.raw}`);
    }

    // 深拷贝原始工作流，避免修改缓存
    const workflow = _.cloneDeep(rawWorkflow);

    // 根据占位符映射替换参数
    for (const [key, value] of Object.entries(params)) {
      const pointer = template.placeholders[key];
      if (pointer) {
        // 将JSON指针格式（如 "/27/inputs/value"）转换为lodash路径格式（如 "27.inputs.value"）
        const lodashPath = pointer
          .split("/")
          .filter((p) => p.length > 0)
          .join(".");

        _.set(workflow, lodashPath, value);
      }
    }

    return workflow;
  }
}

// 创建单例实例，默认从 src/assets/workflows 目录加载
export const workflowManager = new WorkflowManager(
  path.join(process.cwd(), "src/assets/workflows")
);