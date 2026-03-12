import Taro from '@tarojs/taro'
import { API_URL } from '@/constants'
import { getGenerationsDetail } from '@/api/images/getGenerationHistoryDetail'
import {getCookie} from "@/util/cookie";
import {getIsWeb} from "@/util/envCheck";

export interface ITopSectionProps {
  generating: boolean
  progress: number
  currentImageUrl: string
  underImageUrl: string
  taskId: string
}

export const defaultTopProps: Required<ITopSectionProps> = {
  generating: false,
  progress: 0,
  currentImageUrl: '',
  underImageUrl: '',
  taskId: '',
}

export const downloadImageByEnv = async (taskId: string | number) => {
  if (!taskId) return
  const resp = await getGenerationsDetail(taskId.toString())
  if (resp instanceof Error || resp.code !== 200 || !resp.data) return
  const img = resp.data.images?.[0]
  const fileId = img?.fileResourceId
  if (!fileId) return
  const url = `${API_URL}/files/download/${fileId}`
  const res = await Taro.downloadFile({ url, header: { Cookie: getCookie() || '' } })
  if ((res as any).statusCode === 200) {
    Taro.saveImageToPhotosAlbum({
      filePath: (res as any).tempFilePath,
      success: () => {
        Taro.showToast({ title: '保存成功', icon: 'success' })
      },
      fail: () => {
        Taro.showToast({ title: '保存失败', icon: 'error' })
      },
    })
  }
}

export const shareImageByEnv = async (url: string) => {
  if (!getIsWeb()) return
  if (!url) {
    Taro.showToast({ title: '暂无可分享图片', icon: 'none' })
    return
  }
  if ((window as any).navigator?.share) {
    await (window as any).navigator.share({ title: '图片分享', url })
    return
  }
  await Taro.setClipboardData({ data: url })
  Taro.showToast({ title: '链接已复制', icon: 'success' })
}
