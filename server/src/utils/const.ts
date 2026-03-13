/**
 * 通用类型定义与常量
 * 项目中重复使用的类型定义放这里
 */

/**
 * 通用对象类型
 * 用于描述任意键值对结构的对象
 */
export interface IObject<T = any> {
  [key: string]: T
}