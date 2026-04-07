# Project Overview: Morpheus AI

## 项目背景与架构
Morpheus AI 是一个 AI 创作平台，包含移动端 (web-mobile) 和服务端 (server)。

## 远端部署情况
- **服务器 IP**: `49.235.100.164` (外网访问) / `113.108.105.54` (SSH 管理)
- **部署方式**: 
  - 服务端使用 Docker 容器化部署，通过 `pnpm run publish:server-test` 自动化发布。
  - 前端 H5 页面部署在 Nginx 下，通过 `pnpm run publish:mobile-test` 自动化发布。
  - Nginx 配置通过 `pnpm run publish:nginx` 同步，监听 `8001` 端口作为测试环境入口。
- **内网穿透**: 
  - 使用 FRP 将本地服务（如 MinIO:9000, MongoDB:27017, Redis:6379）映射到远端服务器。
  - 远端 Nginx 通过 `127.0.0.1` 访问映射回来的本地服务。

## 配置文件情况
- **服务端配置**: 
  - 核心配置位于 `server/src/config/`，支持环境差异化。
  - 测试环境使用根目录下的 `config.test.json`。
  - 服务端容器内固定监听 `3000` 端口，通过 Docker 映射到宿主机的 `3001` 端口。
- **MinIO 配置**:
  - 文件访问通过 `/api/file/{bucket}/{path}` 路径，由 Nginx 直接转发到本地 MinIO (9000 端口)。
- **用户字段约定**:
  - `_id`: 系统的唯一标识符（API 返回时通常排除）。

## 运维常见问题
- **Redis 写入失败**: 若报 RDB 持久化错误，需执行 `config set stop-writes-on-bgsave-error no`。
- **上传限制**: Nginx 和后端已配置 `client_max_body_size` 为 `50M`。

## 前端组件撰写规范

前端组件采用目录化拆分方式组织，每个组件包含以下三个核心文件：

### 文件结构

| 文件 | 职责 |
|------|------|
| `index.vue` | 组件主逻辑，包含模板、交互逻辑、生命周期 |
| `index.less` | 组件样式，采用 Less 预处理器 |
| `const.ts` | 静态声明，包括常量定义、类型声明、可抽离的业务函数 |

### 拆分原则

- **index.vue**: 聚焦视图渲染和交互逻辑，负责组件内部的状态管理、事件处理、API 调用等核心功能
- **index.less**: 封装组件级样式，通过 Less 变量和混合提升样式复用性，避免与全局样式冲突
- **const.ts**: 抽离静态数据（如枚举、配置项）、类型定义、以及不依赖组件实例的工具函数，保持 Vue 文件简洁

这种拆分方式有助于代码职责分明、便于维护，同时提高组件的可测试性和可复用性。