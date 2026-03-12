import { httpDelete } from '@/lib/request/http'


interface IGenerateTaskResponse {
  id: number;
}

export const cancelGenerateTask = async (id: string) => {
  return httpDelete<object, IGenerateTaskResponse>(`/images/${id}`, {});
}
