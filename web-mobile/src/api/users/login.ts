import { httpPostWithHeaders} from "@/lib/request/http";

interface LoginRequest {
  phone: string;
  password: string;
}

interface LoginResponse {
  "id": number,
  "username": string,
  "token": string
  "role": string
}


export const login = async (params: LoginRequest) => {
  return httpPostWithHeaders<LoginRequest, LoginResponse>('/users/login', params)
}
