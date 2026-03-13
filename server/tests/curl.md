# API 接口 curl 命令汇总

> 服务地址：`http://localhost:3000`
>
> 注意事项：
> - 需要登录的接口，使用 `-H "Authorization: Bearer <token>"` 传递 token
> - `<token>` 需要替换为实际登录获取的 token
> - `<id>`、`<taskId>`、`<filename>` 等需要替换为实际值

---

## 1. 用户模块 (User)

### 1.1 发送登录验证码
```bash
curl -X POST http://localhost:3000/api/user/send-code \
  -H "Content-Type: application/json" \
  -d '{"type": "phone", "target": "13632958426"}'
```

### 1.2 手机号验证码登录
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"type": "phone", "target": "13632958426", "code": "666666"}'
```

### 1.3 获取当前用户信息（需登录）
```bash
curl -X GET http://localhost:3000/api/user/info \
  -H "Authorization: Bearer <token>"
```

### 1.4 更新用户信息（需登录）
```bash
curl -X PUT http://localhost:3000/api/user/info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"nickname": "测试用户", "avatar": "https://example.com/avatar.png", "personalSignature": "个人签名"}'
```

---

## 2. 微信登录模块 (WeChat)

### 2.1 微信小程序一键登录（手机号绑定）
```bash
curl -X POST http://localhost:3000/api/users/wechat/mini/bind-phone \
  -H "Content-Type: application/json" \
  -d '{"code": "微信授权code", "encryptedData": "加密数据", "iv": "iv值"}'
```

### 2.2 微信网页登录绑定手机号（需登录）
```bash
curl -X POST http://localhost:3000/api/users/wechat/bind-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"phone": "手机号", "code": "验证码"}'
```

### 2.3 获取微信公众号网页登录二维码
```bash
curl -X GET "http://localhost:3000/api/users/wechat/login/qrcode"
```

### 2.4 检查微信登录状态（轮询）
```bash
curl -X GET "http://localhost:3000/api/users/wechat/check-status?state=<state>"
```

---

## 3. 图片生成模块 (Image)

### 3.1 提交图片生成任务（需登录）
```bash
curl -X POST http://localhost:3000/api/image/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "prompt": "a cute cat sitting on a chair",
    "negative_prompt": "low quality, blurry, distorted",
    "width": 512,
    "height": 512,
    "count": 1,
    "base_images": ["https://example.com/base.png"]
  }'
```

### 3.2 查询任务状态（SSE 实时推送）
```bash
curl -X GET "http://localhost:3000/api/image/status/<taskId>" \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer <token>"
```

### 3.3 查询任务详情（JSON）
```bash
curl -X GET http://localhost:3000/api/image/detail/<taskId> \
  -H "Authorization: Bearer <token>"
```

---

## 4. 文件上传模块 (File)

### 4.1 上传图片文件（需登录）
```bash
curl -X POST http://localhost:3000/api/file/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.png"
```

### 4.2 通用文件上传（需登录）
```bash
curl -X POST http://localhost:3000/api/v1/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "imageFile=@/path/to/file.png"
```

### 4.3 获取文件访问URL（公开）
```bash
curl -X GET http://localhost:3000/api/file/
```

---

## 5. 作品反馈与提示词优化模块 (Generation)

### 5.1 提交作品反馈（需登录）
```bash
curl -X POST http://localhost:3000/api/v1/generation/feedback/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"action": "like"}'  # action: like 或 dislike
```

### 5.2 AI提示词优化（需登录）
```bash
curl -X POST http://localhost:3000/api/v1/generation/prompt/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"prompt": "a cute cat"}'
```

---

## 6. 广场模块 (Square)

### 6.1 获取广场作品列表（公开）
```bash
curl -X GET "http://localhost:3000/api/square/list?page=1&pageSize=10"
```

### 6.2 发布作品到广场（需登录）
```bash
curl -X POST http://localhost:3000/api/square/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "作品标题",
    "caption": "作品描述",
    "imageIds": ["图片ID列表"],
    "styleTags": ["风格标签"],
    "sceneTags": ["场景标签"]
  }'
```

### 6.3 点赞作品（需登录）
```bash
curl -X POST http://localhost:3000/api/square/<id>/like \
  -H "Authorization: Bearer <token>"
```

---

## 7. 任务模块 (Task)

### 7.1 获取当前用户的任务列表（需登录）
```bash
curl -X GET http://localhost:3000/api/task/list \
  -H "Authorization: Bearer <token>"
```

### 7.2 完成指定任务（需登录）
```bash
curl -X POST http://localhost:3000/api/task/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"taskCode": "daily_sign_in"}'
```

---

## 8. 任务奖励模块 (Task Reward)

### 8.1 获取任务列表（需登录）
```bash
curl -X GET http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer <token>"
```

### 8.2 领取任务奖励（需登录）
```bash
curl -X POST http://localhost:3000/api/v1/tasks/claim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"taskId": "任务ID"}'
```

---

## 9. 会员套餐模块 (Membership)

### 9.1 获取会员套餐列表（公开）
```bash
curl -X GET http://localhost:3000/api/v1/membership/packages
```

### 9.2 创建会员订单（需登录）
```bash
curl -X POST http://localhost:3000/api/v1/membership/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"packageId": "套餐ID", "paymentMethod": "wechat"}'
```

---

## 10. 积分模块 (Points)

### 10.1 获取当前用户积分余额（需登录）
```bash
curl -X GET http://localhost:3000/api/v1/points/balance \
  -H "Authorization: Bearer <token>"
```

### 10.2 获取积分变动历史记录（需登录）
```bash
curl -X GET "http://localhost:3000/api/v1/points/history?page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

---

## 常用操作示例

### 完整登录流程
```bash
# 1. 发送验证码
curl -X POST http://localhost:3000/api/user/send-code \
  -H "Content-Type: application/json" \
  -d '{"type": "phone", "target": "13632958426"}'

# 2. 使用验证码登录（假设验证码是 666666）
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"type": "phone", "target": "13632958426", "code": "666666"}'

# 记录返回的 token，后续接口使用
```

### 文件上传并发布到广场
```bash
# 1. 上传图片（获取文件URL）
curl -X POST http://localhost:3000/api/file/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.png"

# 2. 发布到广场
curl -X POST http://localhost:3000/api/square/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "我的作品",
    "caption": "测试描述",
    "imageIds": ["图片ID"],
    "styleTags": ["现代"],
    "sceneTags": ["客厅"]
  }'
```