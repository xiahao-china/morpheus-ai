import { IObject } from '@/utils/const'
import { serverConfig } from '@/config/index'

// 导出服务器配置
export { serverConfig };

/**
 * 判断值是否为 null 或 undefined
 * @param content - 待检查的值
 * @returns 如果为 null 或 undefined 返回 true，否则返回 false
 */
export const isNullOrUndefined = (content: any) => {
  if (content === null || content === undefined) return true
  return false
}

/**
 * 数字补零填充
 * @param content - 要填充的数字
 * @param length - 目标长度，默认为4
 * @returns 填充后的字符串，如 5 -> "0005"
 */
export const padWithZeros = (content: number, length = 4) => {
  const contentStr = content.toString()
  const paddingLength = length - contentStr.length
  if (paddingLength > 0) {
    const zeros = '0'.repeat(paddingLength)
    return zeros + contentStr
  } else {
    return contentStr
  }
}

/**
 * 按指定键过滤对象
 * @param data - 要过滤的对象或对象数组
 * @param terKeyList - 要保留的键名列表
 * @returns 过滤后的对象或对象数组
 *
 * @example
 * filterObjItemByKey({a:1, b:2, c:3}, ['a', 'b']) // -> {a:1, b:2}
 */
export const filterObjItemByKey = <T = IObject>(
  data: T | T[],
  terKeyList: (keyof T)[]
): Partial<T> | Partial<T>[] => {
  const filterInToObj = (obj: T) => {
    const resObj: Partial<T> = {}
    terKeyList.forEach((keyItem) => (resObj[keyItem] = obj[keyItem]))
    return resObj
  }
  if (Array.isArray(data)) {
    return data.map((item) => filterInToObj(item))
  }
  if (typeof data) {
    return filterInToObj(data)
  }
  return data
}

/**
 * 数组去重
 * @param arr - 原始数组
 * @returns 去重后的新数组
 */
export const uniqueArray = (arr: (string | number)[]) => {
  return Array.from(new Set(arr))
}

/**
 * 应用名称常量
 */
export const APP_NAME = 'Morpheus AI'

/**
 * 解析Cookie字符串
 * @param cookieString - Cookie字符串，格式如 "key1=value1; key2=value2"
 * @returns 解析后的键值对对象
 *
 * @example
 * parseCookies("name=john; age=25") // -> {name: "john", age: "25"}
 */
export const parseCookies = (cookieString: string) => {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=').map((c) => c.trim())
    acc[name] = decodeURIComponent(value)
    return acc
  }, {} as IObject)
}