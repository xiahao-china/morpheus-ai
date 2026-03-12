import { httpDelete } from '@/lib/request/http'


interface IGenerateTaskResponse {
  id: number;
}

export const cancelChangeImageGenerateTask = async (id: string) => {
  return httpDelete<object, IGenerateTaskResponse>(`/images/edited/${id}`, {});
}
