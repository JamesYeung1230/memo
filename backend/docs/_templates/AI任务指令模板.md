# AI 任务指令模板

> 每次给 AI 下达开发任务前，先填写此表，确保 AI 获得足够上下文。

---

## 任务基本信息

| 项目 | 内容 |
|:-----|:------|
| **功能名称** | (例：管理员登录接口) |
| **对应里程碑** | (例：A2 — 管理员认证) |
| **所属服务** | `auth` / `knowledge` / `core` |
| **优先级** | P0 / P1 / P2 |

## 参考文档

- **ERD 表定义**：docs/05-数据库ERD设计文档.md §__（填写章节号）
- **接口规范**：docs/03-后端接口规范文档.md §__ 或 docs/04-各服务接口契约文档.md §__
- **环境变量**：docs/06-环境变量清单.md §__（如果需要新增变量）

## 可复用的现有代码

- **共享库函数**：shared/____.py 的 ____ 函数
- **已有模型**：services/____/models/____.py
- **参考路由**：services/____/routes/____.py（风格参考）

## 功能需求描述

```
请在此详细描述需要 AI 完成的功能：

1. 输入：____（API 请求参数、数据来源）
2. 处理逻辑：____
3. 输出：____（API 响应、数据库变更、缓存更新）
4. 边界条件：____（错误处理、异常情况）
```

## 验收标准

- [ ] 功能代码编译/运行无报错
- [ ] 错误使用 AppException 而非 HTTPException
- [ ] 使用了 async def + Depends()
- [ ] 对应的测试用例已创建
- [ ] project.md / tasks.md 已更新
- [ ] 新的环境变量已加入 .env.example

---

> **使用示例**：
>
> ```
> 功能名称：管理员登录接口
> 里程碑：A2
> 服务：auth
> ERD：docs/05-数据库ERD设计文档.md §3.1 auth.admin 表
> 接口规范：docs/04-各服务接口契约文档.md §2.1 管理员登录
> 复用函数：shared/auth.py 的 create_access_token / create_refresh_token
> 错误码：shared/errors.py 的 AUTH_FAILED / INVALID_CREDENTIALS
> ```
