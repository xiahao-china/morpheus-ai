import { httpGet } from "@/lib/request/http"

interface PromptRecord {
  "id": number,
  "value": string
  "iconUrl": string,
  "type": string
}

interface PromptRequest {
  styleId?: number,
}

type PromptResponse = PromptRecord[]



export const getPrompts = async (params: PromptRequest) => {
  return httpGet<PromptRequest, PromptResponse>('/system/config/prompt', params)
}


export const getNoPrompts = async () => {
  return httpGet<undefined, PromptResponse>('/system/config/noprompt', undefined)
}