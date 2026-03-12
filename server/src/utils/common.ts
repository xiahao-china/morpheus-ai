import { IObject } from '@/utils/const'
import { serverConfig } from '@/config/index'

export { serverConfig };

export const isNullOrUndefined = (content: any) => {
  if (content === null || content === undefined) return true
  return false
}

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

export const uniqueArray = (arr: (string | number)[]) => {
  return Array.from(new Set(arr))
}

export const APP_NAME = 'Morpheus AI'

export const parseCookies = (cookieString: string) => {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=').map((c) => c.trim())
    acc[name] = decodeURIComponent(value)
    return acc
  }, {} as IObject)
}
