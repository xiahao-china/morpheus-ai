/**
 * 通用类型定义与常量
 * 项目中重复使用的类型定义放这里
 */
import Application from "koa";
import Router from "koa-router";

/**
 * 通用对象类型
 * 用于描述任意键值对结构的对象
 */
export interface IObject<T = any> {
  [key: string]: T
}

/**
 * Koa Context 类型定义
 */
export type TDefaultRouter<T = any> = Application.ParameterizedContext<any, Router.IRouterParamContext<any, {}>, any> & {
  request: {
    body?: T,
    query?: T,
  }
}
export type TNext = Application.Next;

/**
 * 分页请求基础接口
 */
export interface IPageReqBase {
  pageSize: number;
  pageNumber: number;
}

/**
 * 请求状态枚举
 */
export enum EReqStatus {
  success = 200,
  generalError = 500,
  noLogin = 501,
}

/**
 * 请求状态消息映射
 */
export const REQ_STATUS_MAP: { [key in EReqStatus]: string } = {
  [EReqStatus.success]: '成功',
  [EReqStatus.generalError]: '服务出现错误',
  [EReqStatus.noLogin]: '您还未登录'
}

/**
 * 通用响应方法
 */
export const sendResponse = {
  success: (ctx: TDefaultRouter, data?: IObject) => {
    ctx.body = {
      code: EReqStatus.success,
      message: REQ_STATUS_MAP[EReqStatus.success],
      data,
    }
  },
  error: (ctx: TDefaultRouter, msg?: any, code?: EReqStatus, data?: IObject) => {
    ctx.body = {
      code: code || EReqStatus.generalError,
      message: msg || REQ_STATUS_MAP[code ? code : EReqStatus.generalError],
      data: data,
    }
  }
}