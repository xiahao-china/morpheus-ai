import Taro from '@tarojs/taro'

export const navigateToGeneratedDetail = (taskId: string) => {
  Taro.navigateTo({ url: `/packageHistory/pages/GeneratedDetail/index?taskId=${taskId}` })
}
