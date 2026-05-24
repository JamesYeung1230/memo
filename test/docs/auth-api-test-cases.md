# Auth 服务 API 测试用例文档

> 测试对象：Auth Service (port 8001)
> 依据文档：[auth-service.md](api/auth-service.md) + [后端接口规范文档](api/后端接口规范文档.md)
> 前端覆盖：小程序 PRD + Web 管理端 PRD + 交互设计文档

---

## 测试环境

| 配置项 | 环境变量 | 说明 |
|--------|---------|------|
| 服务地址 | `AUTH_BASE_URL` | 默认 `http://localhost:8001/api/v1` |
| 管理员账号 | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 默认 `admin` / `admin123` |
| Mock 模式 | `WX_MOCK_MODE=true` | 微信登录测试必须开启 |

---

## 1. 微信小程序登录 (test_wechat_login.py)

| # | 用例 | 类型 | 前置条件 | 步骤 | 预期结果 |
|:-:|------|:---:|---------|------|---------|
| W1 | test_new_user_login_returns_is_new_user_true | happy path | WX_MOCK_MODE=true | 使用未用过的 code 调用 POST /wechat/login | 200, `is_new_user=true`, token 非空 |
| W2 | test_existing_user_login_returns_is_new_user_false | happy path | WX_MOCK_MODE=true, 已用 code 登录过一次 | 使用相同 code 再次调用 POST /wechat/login | 200, `is_new_user=false` |
| W3 | test_token_differs_on_each_login | 数据 | WX_MOCK_MODE=true | 同一 code 登录两次 | 两次 access_token 不同 |
| W4 | test_response_structure | 数据结构 | WX_MOCK_MODE=true | 成功登录 | `code=0`, `data` 含全部 5 个字段 |
| W5 | test_code_empty_string | 边界 | WX_MOCK_MODE=true | code="" | 422 |
| W6 | test_missing_code_field | 异常 | WX_MOCK_MODE=true | 不传 code 字段 | 422 |
| W7 | test_error_response_structure | 异常 | WX_MOCK_MODE=true | 触发 422 | 错误 body 含 `code`/`message` 字符串字段 |
| W8 | (隐式) require_mock_mode | 测试环境 | WX_MOCK_MODE 未设置 | - | pytest skip |

---

## 2. 微信小程序刷新 Token (test_wechat_refresh.py)

| # | 用例 | 类型 | 前置条件 | 步骤 | 预期结果 |
|:-:|------|:---:|---------|------|---------|
| R1 | test_refresh_with_valid_token | happy path | WX_MOCK_MODE=true, 已登录获取 refresh_token | POST /wechat/refresh | 200, 新 access_token 与旧 token 不同 |
| R2 | test_invalid_refresh_token | 异常 | WX_MOCK_MODE=true | 传入伪造 token | 401 `UNAUTHORIZED` |
| R3 | test_access_token_instead_of_refresh | 异常 | WX_MOCK_MODE=true, 已登录 | 用 access_token 代替 refresh_token | 401 `UNAUTHORIZED` |
| R4 | test_missing_refresh_token | 异常 | WX_MOCK_MODE=true | 不传 refresh_token | 422 |
| R5 | test_response_structure | 数据结构 | WX_MOCK_MODE=true | 成功刷新 | `data` 含 access_token/token_type/expires_in |

---

## 3. 管理员登录 (test_admin_login.py)

| # | 用例 | 类型 | 前置条件 | 步骤 | 预期结果 |
|:-:|------|:---:|---------|------|---------|
| A1 | test_login_success | happy path | - | POST /admin/login 正确账号密码 | 200, token 非空 |
| A2 | test_response_structure | 数据结构 | - | 成功登录 | `data` 含全部 4 个字段 |
| A3 | test_wrong_password | 异常 | - | 错误密码 | 401 `INVALID_CREDENTIALS` |
| A4 | test_nonexistent_username | 异常 | - | 不存在的用户名 | 401 `AUTH_FAILED` |
| A5 | test_username_exceeds_max_length | 边界 | - | username 51 字符 | 422 |
| A6 | test_password_exceeds_max_length | 边界 | - | password 129 字符 | 422 |
| A7 | test_missing_required_fields | 异常 | - | 空 body | 422 |
| A8 | test_error_response_structure | 异常 | - | 触发错误 | body 含 `code`/`message` 字符串 |

---

## 4. 管理员刷新 Token (test_admin_refresh.py)

| # | 用例 | 类型 | 前置条件 | 步骤 | 预期结果 |
|:-:|------|:---:|---------|------|---------|
| T1 | test_refresh_with_valid_token | happy path | 管理员已登录 | POST /admin/refresh | 200, 新 access_token |
| T2 | test_invalid_refresh_token | 异常 | - | 伪造 token | 401 `UNAUTHORIZED` |
| T3 | test_missing_refresh_token | 异常 | - | 不传 refresh_token | 422 |
| T4 | test_wechat_refresh_token_on_admin_endpoint | 异常 | WX_MOCK_MODE=true, 微信已登录 | 用微信 refresh_token 调管理员 refresh | 401 `UNAUTHORIZED` |

---

## 5. 修改管理员密码 (test_admin_password.py)

| # | 用例 | 类型 | 前置条件 | 步骤 | 预期结果 |
|:-:|------|:---:|---------|------|---------|
| P1 | test_change_password_success | happy path | 管理员已登录 | PUT /admin/password 正确新旧密码 | 200, `"Password updated successfully"` |
| P2 | test_login_with_new_password_after_change | 端到端 | P1 修改成功 | 用新密码调用 POST /admin/login | 200, 可正常登录 |
| P3 | test_wrong_old_password | 异常 | 管理员已登录 | 错误旧密码 | 401 `INVALID_CREDENTIALS` |
| P4 | test_new_password_too_short | 边界 | 管理员已登录 | new_password 3 字符 | 422 |
| P5 | test_new_password_letters_only | 边界 | 管理员已登录 | new_password 纯字母 | 422 |
| P6 | test_new_password_digits_only | 边界 | 管理员已登录 | new_password 纯数字 | 422 |
| P7 | test_new_password_exceeds_max_length | 边界 | 管理员已登录 | new_password 129 字符 | 422 |
| P8 | test_missing_old_password | 异常 | 管理员已登录 | 不传 old_password | 422 |
| P9 | test_missing_new_password | 异常 | 管理员已登录 | 不传 new_password | 422 |
| P10 | test_no_authorization_header | 异常 | - | 不带 token 调用 | 401 `UNAUTHORIZED` |

---

## 运行方式

```bash
# 设置环境
cp .env.example .env
# 编辑 .env，确保 AUTH_BASE_URL 指向 Auth 服务 + WX_MOCK_MODE=true

# 安装依赖
pip install -r requirements.txt

# 运行全部测试
pytest tests/ -v

# 按标记筛选
pytest -m wechat -v
pytest -m admin -v

# 生成 HTML 报告
pytest tests/ --html=report.html
```

---

## 覆盖统计

| 维度 | 数量 |
|:-----|:----:|
| 测试文件 | 5 |
| 测试用例 | 31 |
| happy path | 8 |
| 边界条件 | 7 |
| 异常场景 | 13 |
| 端到端 | 1 |
| 数据结构 | 2 |
