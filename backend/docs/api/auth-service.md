# Auth 服务 API 文档

> 认证服务，对外暴露端口 `8001`，提供微信小程序登录和管理员认证相关接口。

---

## 通用说明

### 基础 URL

```
http://<host>:8001/api/v1
```

| 环境 | host 值 |
|:----|:-------|
| Docker Compose 内部 | `auth`（服务名） |
| VM 开发环境（Ubuntu） | `192.168.234.128` |
| 本地开发（Windows） | `localhost` |

### 响应格式

所有接口使用统一的信封响应格式，通过 `shared.responses` 中的工具函数构造。

#### 成功响应

```json
{
    "code": 0,
    "message": "success",
    "data": { ... },
    "request_id": "<uuid>"
}
```

分页列表额外包含 `meta` 字段：

```json
{
    "code": 0,
    "message": "success",
    "data": [ ... ],
    "meta": {
        "page": 1,
        "page_size": 20,
        "total": 100
    },
    "request_id": "<uuid>"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 业务状态码，`0` 表示成功 |
| `message` | string | 提示信息，成功时固定为 `"success"` |
| `data` | object / array / null | 业务数据 |
| `meta` | object | 分页信息（仅列表接口） |
| `request_id` | string | 请求追踪 ID，用于链路排查 |

#### 错误响应

```json
{
    "code": "<error_code>",
    "message": "<error_message>",
    "data": null,
    "detail": { ... },
    "request_id": "<uuid>"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 业务错误码（见下方错误码表） |
| `message` | string | 人类可读的错误描述 |
| `data` | null | 错误时固定为 `null` |
| `detail` | object | 详细的错误上下文 |
| `request_id` | string | 请求追踪 ID |

> 客户端可通过 `code === 0` 统一判断请求是否成功，无需区分 HTTP 状态码。

#### 公共错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `UNAUTHORIZED` | 401 | 未认证或 token 无效/过期 |
| `FORBIDDEN` | 403 | 权限不足 |
| `INTEGRATION_ERROR` | 502 | 外部服务调用失败 |
| `AUTH_FAILED` | 401 | 认证失败（用户不存在） |
| `INVALID_CREDENTIALS` | 401 | 凭据错误（密码错误） |

---

## 1. 微信小程序登录

### 描述

使用微信小程序的 `code` 完成登录。首次登录会自动创建用户。支持 mock 模式，便于本地开发调试。

### 请求

**端点：** `POST /api/v1/wechat/login`

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 微信小程序 wx.login() 获取的临时 code |

**示例：**
```json
{
    "code": "071JQO0w3s0yGQ3YlB1w3sE..."
}
```

### 响应

**成功响应（200）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | string | JWT 访问令牌 |
| `refresh_token` | string | JWT 刷新令牌 |
| `token_type` | string | 令牌类型，固定 `Bearer` |
| `expires_in` | int | access_token 有效期（秒），默认 `86400` |
| `is_new_user` | bool | 是否为新注册用户 |

**示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 86400,
        "is_new_user": true
    }
}
```

### 错误

| 错误码 | HTTP 状态码 | 触发条件 |
|--------|------------|----------|
| `INTEGRATION_ERROR` | 502 | 微信 API 调用失败或未返回 openid |

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `WX_APPID` | - | 微信小程序 AppID |
| `WX_SECRET` | - | 微信小程序 Secret |
| `WX_MOCK_MODE` | `false` | 设为 `true` 时跳过微信 API 调用，使用 mock openid |

### Mock 模式行为详解

当 `WX_MOCK_MODE=true` 时：

- **Mock openid 生成规则**：`mock_openid_{code}`（基于请求体中的 `code` 参数动态生成）
- **新用户模拟**：传入一个**从未使用过**的 `code` 值 → 数据库中无对应记录 → 创建新用户 → `is_new_user: true`
- **老用户模拟**：使用**已使用过**的 `code` 值再次请求 → 数据库中已有记录 → 更新 `last_login_at` → `is_new_user: false`
- **局限**：mock openid 不可通过环境变量自定义；如需固定测试用户，在第一次登录后记录返回的 `access_token` 在后续测试中复用

### 处理流程

```
1. 根据 WX_MOCK_MODE 选择调用微信 API 或 mock 函数获取 openid
2. 根据 openid 查询数据库，不存在则创建新用户
3. 生成 access_token 和 refresh_token
4. 返回令牌和 is_new_user 标识
```

---

## 2. 微信小程序刷新 Access Token

### 描述

使用微信用户的 refresh_token 获取新的 access_token，无需重新登录。

### 请求

**端点：** `POST /api/v1/wechat/refresh`

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refresh_token` | string | 是 | 微信登录时获取的 refresh_token |

**示例：**
```json
{
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 响应

**成功响应（200）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | string | 新的 JWT 访问令牌 |
| `token_type` | string | 令牌类型，固定 `Bearer` |
| `expires_in` | int | access_token 有效期（秒），默认 `86400` |

**示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 86400
    }
}
```

### 错误

| 错误码 | HTTP 状态码 | 触发条件 |
|--------|------------|----------|
| `UNAUTHORIZED` | 401 | refresh_token 无效或已过期 |
| `UNAUTHORIZED` | 401 | 令牌类型不是 refresh 令牌 |

### 校验逻辑

```
1. 验证 refresh_token 的 JWT 签名
2. 检查 claims 中 type 是否为 "refresh"
3. 检查 role 是否为 "user"
4. 签发新的 access_token
```

---

## 3. 管理员登录

### 描述

管理员使用用户名和密码登录，获取 JWT 令牌。

### 请求

**端点：** `POST /api/v1/admin/login`

**请求体：**

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| `username` | string | 是 | 1~50 字符 | 管理员用户名 |
| `password` | string | 是 | 8~128 字符，须含字母+数字 | 管理员密码 |

**示例：**
```json
{
    "username": "admin",
    "password": "your_password"
}
```

### 响应

**成功响应（200）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | string | JWT 访问令牌 |
| `refresh_token` | string | JWT 刷新令牌 |
| `token_type` | string | 令牌类型，固定 `Bearer` |
| `expires_in` | int | access_token 有效期（秒），默认 `86400` |

**示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 86400
    }
}
```

### 错误

| 错误码 | HTTP 状态码 | 触发条件 |
|--------|------------|----------|
| `AUTH_FAILED` | 401 | 用户名不存在 |
| `INVALID_CREDENTIALS` | 401 | 密码错误 |

---

## 4. 刷新 Access Token（管理员）

### 描述

使用 refresh_token 获取新的 access_token，无需重新登录。

### 请求

**端点：** `POST /api/v1/admin/refresh`

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refresh_token` | string | 是 | 登录时获取的 refresh_token |

**示例：**
```json
{
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 响应

**成功响应（200）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | string | 新的 JWT 访问令牌 |
| `token_type` | string | 令牌类型，固定 `Bearer` |
| `expires_in` | int | access_token 有效期（秒），默认 `86400` |

**示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "Bearer",
        "expires_in": 86400
    }
}
```

### 错误

| 错误码 | HTTP 状态码 | 触发条件 |
|--------|------------|----------|
| `UNAUTHORIZED` | 401 | refresh_token 无效或已过期 |
| `UNAUTHORIZED` | 401 | 令牌类型不是 refresh 令牌 |

### 校验逻辑

```
1. 验证 refresh_token 的 JWT 签名
2. 检查 claims 中 type 是否为 "refresh"
3. 检查 role 是否为 "admin"
4. 签发新的 access_token
```

---

## 5. 修改管理员密码

### 描述

管理员修改自己的密码。需要管理员权限（Bearer token）。

### 请求

**端点：** `PUT /api/v1/admin/password`

**请求头：**

| 字段 | 值 | 说明 |
|------|-----|------|
| `Authorization` | `Bearer <access_token>` | 管理员 access_token |

**请求体：**

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| `old_password` | string | 是 | 1~128 字符 | 当前密码 |
| `new_password` | string | 是 | 8~128 字符，须含字母+数字 | 新密码 |

**示例：**
```json
{
    "old_password": "current_password",
    "new_password": "new_password_123"
}
```

### 响应

**成功响应（200）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 固定 `"Password updated successfully"` |

**示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "message": "Password updated successfully"
    }
}
```

### 错误

| 错误码 | HTTP 状态码 | 触发条件 |
|--------|------------|----------|
| `UNAUTHORIZED` | 401 | access_token 无效或已过期 |
| `FORBIDDEN` | 403 | 当前用户不是管理员角色 |
| `AUTH_FAILED` | 401 | 用户不存在（数据库已删除） |
| `INVALID_CREDENTIALS` | 401 | 旧密码错误 |

### 处理流程

```
1. 验证 Bearer token 的 JWT 签名和 admin 角色
2. 根据 token 中的 subject (username) 查询数据库
3. 验证 old_password 是否匹配
4. 使用 bcrypt 加密新密码并更新数据库
```

---

## JWT 令牌说明

### Claims 结构

**access_token:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `sub` | string | 用户标识（微信 openid / 管理员 username） |
| `role` | string | 角色：`user`（微信用户）或 `admin`（管理员） |
| `type` | string | 令牌类型：`access` |
| `exp` | int | 过期时间戳 |
| `iat` | int | 签发时间戳 |
| `jti` | string | 令牌唯一 ID |

**refresh_token:**

与 access_token 结构一致，但 `type` 字段为 `refresh`。

### 有效期

| 令牌 | 默认有效期 | 环境变量 |
|------|-----------|----------|
| access_token | 86400 秒（24 小时） | `JWT_ACCESS_EXPIRE` |
| refresh_token | 604800 秒（7 天） | `JWT_REFRESH_EXPIRE` |

### 签名配置

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `JWT_SECRET` | - | JWT 签名密钥（Auth 和 Core 必须一致） |
| `JWT_ALGORITHM` | `HS256` | 签名算法 |
