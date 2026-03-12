import { httpPost } from "@/lib/request/http";

interface LoginResponse {
  "id": number,

}

export const logout = async () => {
  return httpPost<object, LoginResponse>('/users/logout', {  });
}
