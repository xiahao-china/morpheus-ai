/**
 * 自动生图及发布广场测试配置
 */

module.exports = {
  // 服务端配置
  server: {
    // 正式环境地址
    baseUrl: 'https://libuli.top',
    // API 基础路径
    apiPrefix: '/api/v1',
  },

  // 认证配置
  auth: {
    // 用户 Token (从浏览器登录后获取)
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI2OWUwNTc5Nzk3ODU2ZjVlNzk4NzUwYzUiLCJfaWQiOiI2OWUwNTc5Nzk3ODU2ZjVlNzk4NzUwYzUiLCJ1c2VybmFtZSI6Iuafj-a6qiIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzc3MDEzNjMyLCJleHAiOjE3Nzk2MDU2MzJ9.MViDUSGfKGdUba0WH7i9_IfEQUjKBG69ZU866SK6ZYA',
    // Cookie (用于需要 Cookie 认证的接口)
    cookie: 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI2OWUwNTc5Nzk3ODU2ZjVlNzk4NzUwYzUiLCJfaWQiOiI2OWUwNTc5Nzk3ODU2ZjVlNzk4NzUwYzUiLCJ1c2VybmFtZSI6Iuafj-a6qiIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzc3MDEzNjMyLCJleHAiOjE3Nzk2MDU2MzJ9.MViDUSGfKGdUba0WH7i9_IfEQUjKBG69ZU866SK6ZYA',
    // 或使用用户名密码登录获取
    username: '',
    password: '',
  },

  // 生图配置
  generation: {
    // 模型 ID
    modelId: 1,
    // 图片尺寸
    width: 1024,
    height: 1024,
    // 生图数量
    count: 1,
    // 轮询间隔 (毫秒)
    pollInterval: 3000,
    // 最大等待时间 (毫秒)
    maxWaitTime: 300000, // 5分钟
  },

  // 广场发布配置
  square: {
    // 默认标题
    defaultTitle: 'AI 生成作品',
    // 默认描述
    defaultCaption: '自动生成测试',
  },

  // Prompts 配置文件路径
  promptsFile: './prompts.json',

  // 日志级别: debug, info, warn, error
  logLevel: 'info',
};