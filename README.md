# Morpheus AI

个人 AI 项目

## 项目技术栈

- **前端**: Vue 3 + TypeScript + Less + vue-cli + pnpm
- **后端**: Node.js + MongoDB + Redis

## 目录结构

```
morpheus-ai/
├── web-mobile/    # 移动端 Web 应用
├── web-pc/        # PC 端 Web 应用
├── server/        # 后端服务
└── tools/         # 工具脚本
```

## 前置环境依赖

```
Node.js v16+
pnpm
MongoDB
Redis
```

## 快速开始

### 1. 安装依赖

在各个子项目中运行:

```bash
pnpm install
```

### 2. 启动开发服务器

**移动端:**
```bash
cd web-mobile
pnpm run serve
```

**PC端:**
```bash
cd web-pc
pnpm run serve
```

**后端:**
```bash
cd server
pnpm run dev
```

### 3. 构建生产版本

```bash
# 移动端
cd web-mobile
pnpm run build

# PC端
cd web-pc
pnpm run build
```

## 配置说明

### 配置文件

在根目录创建以下配置文件:

1. `config.json` - 默认开发环境配置
2. `config.prod.json` - 生产环境配置 (用于 `npm run build:prod`)
3. `config.test.json` - 测试环境配置 (用于 `npm run build:test`)

参考 `server/config.docker.json` 格式。

### 环境变量

各子项目的 `.env.development` 和 `.env.production` 文件中配置相应的环境变量。

## 开发规范

### 命名规范
- 接口声明: `Ixxxxx` (以 I 开头)
- 类型声明: `Txxxxx` (以 T 开头)

### 目录结构
```
src/
├── api/          # 统一请求包装
├── assets/       # 静态文件，全局样式
├── components/   # 公用组件
├── router/       # 路由配置
├── store/        # 状态管理
└── view/         # 页面文件
```

## 部署

各子项目均提供部署脚本，请参考各目录下的 `publish.js` 或 `deploy.config.js`。

## License

MIT