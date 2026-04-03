import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assest/iconfont/iconfont.css'
import './app.less'
import '@/lib/router/interceptor'

const App = createApp({
  onShow() {
  },
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})

// 创建并安装 Pinia
const pinia = createPinia()
App.use(pinia)


export default App
