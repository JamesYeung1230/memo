# AI 输出验收 Checklist

> 每次 AI 完成代码生成后，实习生逐项打勾验收。

---

## 1. 运行检查

- [ ] 代码能正常运行不报错（`docker compose up` / `uvicorn main:app`）
- [ ] ruff lint 无错误（`ruff check .`）
- [ ] mypy 类型检查通过（`mypy .`）

## 2. 风格检查

- [ ] 路由函数使用了 `async def`
- [ ] 通过 `Depends()` 获取 db session
- [ ] 错误使用 `shared/errors.py` 的 `AppException`
- [ ] 没有直接 `raise HTTPException`
- [ ] import 顺序正确（标准库 → 三方库 → 本地库）
- [ ] 数据库操作用了 async 模式（`select()` + `await execute()`）

## 3. 安全与规范检查

- [ ] 没有硬编码密码、密钥、Token
- [ ] 新的环境变量已加到 `.env.example`
- [ ] 数据库迁移脚本使用参数化查询（非 f-string 拼接 SQL）
- [ ] API 输入有 Pydantic 模型校验
- [ ] 敏感接口有权限控制（JWT 验证）

## 4. 完整性检查

- [ ] 对应的测试文件已创建/更新
- [ ] project.md 里程碑状态已更新
- [ ] tasks.md 对应 checkbox 已勾选
- [ ] 代码已 `git commit`（提交信息含里程碑编号）

---

> **如果某项未通过，直接让 AI 修改后再验收。**
