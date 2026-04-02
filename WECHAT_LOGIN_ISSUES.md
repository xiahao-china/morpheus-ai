# 微信一键登录问题分析

> 对比 ai-design-backend (Java) 与 morpheus-ai (Node.js) 的微信登录逻辑

---

## 严重问题

### 1. 缺少小程序登录路由

**问题**: 前端调用 `/users/wechat/mini/login`，但后端**没有定义这个接口**。

- **前端请求**: `web-mobile/src/api/users/wxTemporaryLogin.ts:16` 调用 `/users/wechat/mini/login`
- **Java 后端**: 有 `POST /api/v1/users/wechat/mini/login` (UserController.java:343)
- **当前 Node.js**: 缺失此路由

**影响**: 小程序首次登录时，用户通过 `Taro.login()` 获取 code 后无法完成登录。

**修复**: 在 `server/src/routes/api/weixin/index.ts` 添加路由：
```typescript
router.post('/api/users/wechat/mini/login', miniProgramLogin);
```

并在 `server/src/controllers/weixin/index.ts` 实现 `miniProgramLogin` 函数。

---

### 2. 小程序手机号解密逻辑缺失

**问题**: 当前代码没有真正解密手机号，直接从 request.body 取值。

**Java 逻辑** (WechatServiceImpl.java:296-312, 324-335):
1. 小程序登录时，将 `session_key` 存入 Redis（key: `wechat:session_key:{appOpenid}`），有效期 5 分钟
2. 绑定手机号时，从 Redis 获取 `session_key`
3. 使用 AES/CBC/PKCS5Padding 解密 `encryptedData` 获取手机号

**当前 Node.js 逻辑** (server/src/controllers/weixin/index.ts:142-146):
```typescript
// 2. 解密获取手机号（如有）
let phone = null;
if (encryptedData && iv) {
  phone = (ctx.request.body as any).phoneNumber || null; // ❌ 直接取值，没有解密
}
```

**修复**:
1. 登录时将 `session_key` 存入 Redis
2. 绑定手机号时从 Redis 获取 `session_key`
3. 实现 AES 解密 (参考 Java: WechatServiceImpl.java:447-460)

---

### 3. checkLoginStatus API 调用错误

**问题**: 前端轮询登录状态时调用了错误的 API。

**前端代码** (web-mobile/src/api/users/wxLogin.ts:17-22):
```typescript
export const checkWxLoginRes = async (code: string, state: string) => {
  return httpGet<object, IWxLoginResponse>('/users/wechat/callback', {
    code,
    state,
  })
}
```

调用的是 `/users/wechat/callback`（GET），这是微信回调接口，返回 HTML 页面。

**应该调用**: `/users/wechat/check-status` (后端已有此接口)

---

## 中等问题

### 4. session_key 没有存入 Redis

**Java 逻辑** (WechatServiceImpl.java:298-302):
```java
// 保存 session_key 到 Redis（用于后续解密手机号），有效期 5 分钟
if (StringUtils.isBlank(user.getPhone())) {
    String redisKey = "wechat:session_key:" + appOpenid;
    stringRedisTemplate.opsForValue().set(redisKey, sessionKey, Duration.ofMinutes(5));
}
```

**当前 Node.js**: 完全没有这部分逻辑。

---

### 5. Redis state 存在重放攻击风险

**问题**: `checkLoginStatus` 没有验证 state 是否已被使用。

**当前代码** (server/src/controllers/weixin/index.ts:231-255):
- `wechatCallback` 中验证 state 后会删除
- `checkLoginStatus` 中没有验证 state 是否已使用

---

## 路由对照表

| 功能 | Java 路由 | Node.js 路由 | 状态 |
|------|-----------|--------------|------|
| 小程序登录 | `POST /api/v1/users/wechat/mini/login` | **缺失** | ❌ |
| 小程序绑定手机号 | `POST /api/v1/users/wechat/mini/bind-phone` | `POST /api/users/wechat/mini/bind-phone` | ⚠️ 逻辑不同 |
| 网页绑定手机号 | `POST /api/v1/users/wechat/bind-phone` | `POST /api/users/wechat/bind-phone` | ✅ |
| 网页扫码登录回调 | `GET /api/v1/users/wechat/callback` | `GET /api/users/wechat/callback` | ✅ |
| 获取二维码 | `GET /api/v1/users/wechat/login/qrcode` | `GET /api/users/wechat/login/qrcode` | ✅ |
| 检查登录状态 | 无 | `GET /api/users/wechat/check-status` | ✅ |

---

## 请求参数对照

### 小程序登录 `/wechat/mini/login`

**Java**:
```json
{
  "code": "xxx"
}
```

**Node.js**: 缺失

### 小程序绑定手机号 `/wechat/mini/bind-phone`

**Java** (WechatMiniPhoneRequest):
```json
{
  "code": "xxx",          // 手机号获取的 code (可选)
  "encryptedData": "xxx", // 加密数据
  "iv": "xxx",            // 初始向量
  "userId": 123,          // 用户 ID
  "inviteCode": "xxx"     // 邀请码(可选)
}
```

**当前 Node.js**:
```json
{
  "code": "xxx",
  "encryptedData": "xxx",
  "iv": "xxx",
  "userId": "123",
  "phoneNumber": "xxx"    // ❌ 多余字段，应该解密获取
}
```

---

## 修复建议

### 修复 1: 添加小程序登录接口

```typescript
// server/src/routes/api/weixin/index.ts
router.post('/api/users/wechat/mini/login', miniProgramLogin);
```

```typescript
// server/src/controllers/weixin/index.ts 新增
export const miniProgramLogin = async (ctx: Context) => {
  const { code } = ctx.request.body as any;

  if (!code) {
    ctx.body = { code: 400, msg: "Missing code parameter" };
    return;
  }

  try {
    // 1. 通过 code 获取 session_key 和 openid
    const wxResponse = await axios.get(MINI_PROGRAM_CONFIG.loginUrl, {
      params: {
        appid: MINI_PROGRAM_CONFIG.appId,
        secret: MINI_PROGRAM_CONFIG.appSecret,
        js_code: code,
        grant_type: "authorization_code"
      }
    });

    const { openid, session_key, unionid, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      logger.error(`[Wechat Mini Login] Wechat API error: ${errcode}, ${errmsg}`);
      ctx.body = { code: 500, msg: "Wechat API error" };
      return;
    }

    // 2. 查找或创建用户
    let user: IUser | null = await findOrCreateWechatUser(openid, unionid);

    // 3. 保存 session_key 到 Redis（用于解密手机号），有效期 5 分钟
    if (!user.phone) {
      const redisKey = `wechat:session_key:${openid}`;
      await redis.set(redisKey, session_key, 'EX', 300);
    }

    // 4. 生成 token 并返回
    const token = signToken(user);

    sendResponse.success(ctx, {
      token,
      id: user._id,
      userId: user._id,
      username: user.username,
      role: user.role,
      isPhone: !!user.phone  // ✅ 返回 isPhone 字段
    });
  } catch (error) {
    logger.error(`[Wechat Mini Login] Error:`, error);
    sendResponse.error(ctx, "Internal server error");
  }
};
```

### 修复 2: 实现手机号解密

```typescript
// server/src/controllers/weixin/index.ts
import crypto from 'crypto';

function decryptPhoneNumber(encryptedData: string, iv: string, sessionKey: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-128-cbc',
    Buffer.from(sessionKey, 'base64'),
    Buffer.from(iv, 'base64')
  );

  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  const data = JSON.parse(decrypted);
  return data.purePhoneNumber;
}

// 修改 bindPhoneByMiniProgram 函数
export const bindPhoneByMiniProgram = async (ctx: Context) => {
  const { userId, encryptedData, iv, inviteCode } = ctx.request.body as any;

  // 从 Redis 获取 session_key
  const user = await User.findById(userId);
  if (!user || !user.appOpenid) {
    ctx.body = { code: 400, msg: "User not logged in via Wechat" };
    return;
  }

  const redisKey = `wechat:session_key:${user.appOpenid}`;
  const sessionKey = await redis.get(redisKey);

  if (!sessionKey) {
    ctx.body = { code: 400, msg: "Session expired, please login again" };
    return;
  }

  // 解密手机号
  const phone = decryptPhoneNumber(encryptedData, iv, sessionKey);

  // ... 后续绑定逻辑
};
```

### 修复 3: 修正前端 API 调用

```typescript
// web-mobile/src/api/users/wxLogin.ts
export const checkWxLoginRes = async (state: string) => {
  // 改为调用 check-status
  return httpGet<object, IWxLoginResponse>('/users/wechat/check-status', {
    state,
  });
};
```