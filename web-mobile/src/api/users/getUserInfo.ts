import { httpGet } from '@/lib/request/http'


export interface getUserInfoResponse {
  _id: string;
  username: string; // Login ID
  nickname?: string; // Display name
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: number;
  personalSignature?: string;
  points?: number;
  membershipLevel?: string;
  membershipExpiry?: string;
  
  // Fields for compatibility or derived
  isPhone?: boolean; // Derived in store
}


export const getUserInfo = async () => {
  return httpGet<object,getUserInfoResponse>('/user/info', {});
}
