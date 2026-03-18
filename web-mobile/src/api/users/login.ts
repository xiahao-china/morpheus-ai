import { httpPostWithHeaders} from "@/lib/request/http";

interface LoginRequest {
  phone?: string;
  password?: string;
  email?: string;
  code?: string;
  type?: 'username' | 'phone' | 'email';
  target?: string;
}

interface LoginResponse {
  user: {
    _id: string;
    username: string;
    role: string;
    token?: string;
  }
}


export const login = async (params: LoginRequest) => {
  // 适配旧代码调用
  const payload: LoginRequest = { ...params };
  if (params.phone && params.password && !params.type) {
    // 假设是用户名密码登录（这里用手机号作为用户名）
    // 或者需要确认后端是否支持手机号+密码
    // 根据后端代码：type='username' 时用 target+password
    payload.type = 'username';
    payload.target = params.phone;
  }
  
  return httpPostWithHeaders<LoginRequest, LoginResponse>('/user/login', payload)
}
