import Taro from '@tarojs/taro'
import { getGenerationsDetail } from '@/api/images/getGenerationHistoryDetail'
import {getCookie} from "@/util/cookie";
import {getIsWeb} from "@/util/envCheck";
import {makeUrlAbsolute} from "@/util/url";

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
  if (!img?.imageUrl) return
  const url = makeUrlAbsolute(img.imageUrl)

  // 指定明确的后缀名，避免小程序 saveImageToPhotosAlbum 报错 fail invalid
  const filePath = `${Taro.env.USER_DATA_PATH}/download_${Date.now()}.jpg`;

  const res = await Taro.downloadFile({ url, filePath, header: { Cookie: getCookie() || '' } })
  if ((res as any).statusCode === 200) {
    Taro.saveImageToPhotosAlbum({
      filePath: (res as any).filePath || (res as any).tempFilePath,
      success: () => {
        Taro.showToast({ title: '保存成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('保存相册失败:', err)
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
