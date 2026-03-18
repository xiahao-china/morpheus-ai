import { httpPostWithHeaders } from "@/lib/request/http";
import { saveCookie } from "@/util/cookie";
interface IVerifyCodeLoginParams {
  phone: string;
  code: string;
}

export const verifyCodeLogin = async (params: IVerifyCodeLoginParams) => {
  try {
    // 使用支持获取响应头的请求函数
    const response = await httpPostWithHeaders<object, object>(
      "/user/login",
      {
        type: 'phone',
        target: params.phone,
        code: params.code
      }
    );
    // 检查是否是错误响应
    if (response instanceof Error) {
      return response;
    }

    // 检查响应头中是否有 set-cookie
    const setCookieHeader =
      response.headers["set-cookie"] || response.headers["Set-Cookie"];
    if (setCookieHeader) {
      // 保存 Cookie 到本地存储
      saveCookie(setCookieHeader.replace(/,/g, ";"));
    }

    // 返回响应数据
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return error as Error;
  }
};
