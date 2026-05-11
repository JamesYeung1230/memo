# 卡片学记 后端服务 — Part B 扩展：AI 编程行为规范

> 本文件是对根规则 [Part B — AI 编程行为规范](../../.trae/rules/project_rules.md#part-b--ai-编程行为规范) 的子项目扩展。
> 根规则 Part B 的通用条款（B.1 上下文感知 ~ B.8 任务追踪）同样适用，不重复列出。
> 根规则 Part A（Git 工作流）、Part C（Skill 管理）、Part D（规则维护指南）、Part E（MCP 规范）、Part F（Agent 规范）、Part G（Token 开销优化规范）全局适用，本文件不涉及。

---

## 规则定位

| 维度 | 说明 |
|------|------|
| 所属项目 | backend |
| 对应根规则 | [Part B — AI 编程行为规范](../../.trae/rules/project_rules.md#part-b--ai-编程行为规范) |
| 基础条款 | B.1 上下文感知 ~ B.8 任务追踪（通用，本文件不重复） |
| 扩展条款 | B.9 ~ B.19（本文件定义的后端特定条款） |

---

## B.9 上下文感知（后端补充）

- 了解项目中已有的工具函数、中间件、模型、路由后再进行编码，避免重复造轮子
- 每次任务开始前必须加载以下锚点文档：
  1. [project.md](../../project.md) — 项目背景、当前阶段、技术栈
  2. [本文件](project_rules.md) — 后端 Part B 扩展

## B.10 修改验证（后端补充）

- 每次修改完成后，必须运行对应的 lint/typecheck 命令进行验证（如 `ruff`、`mypy`、`eslint` 等）
- API 接口修改后应通过 API 测试工具（如 `api-test-pro` Agent）验证接口正确性

## B.11 依赖管理（后端补充）

- 使用新依赖前，先检查 `requirements.txt`、`Pipfile`、`pyproject.toml` 或 `package.json` 等文件中是否已有替代方案
- 引入新依赖时必须评估其对项目体积、安全性和兼容性的影响

## B.12 安全红线（后端补充）

- 数据库密码、JWT Secret、API Key 等敏感信息必须使用环境变量，禁止硬编码
- API 接口必须有输入校验和权限控制
- 用户密码必须加密存储（如 bcrypt），禁止明文存储
- 禁止生成存在 SQL 注入、XSS、CSRF、SSRF 等安全漏洞的代码

## B.13 测试覆盖（后端补充）

- 每个 API 接口或功能完成后，必须编写或更新对应的测试用例
- Bug 修复必须先编写复现测试，确认测试失败后再修复

## B.14 数据库与数据安全

- 数据库迁移脚本必须可回滚（提供 `up` / `down` 双向操作）
- 禁止直接在生产环境执行危险操作（如 `DROP TABLE`）
- 批量操作必须考虑事务保护和数据一致性

## B.15 进度同步

- 每完成一个里程碑或子任务后，必须同时做两件事：
  1. 在 [project.md](../../project.md) 的里程碑表中将该里程碑状态标记为 🟢 已完成
  2. 在对应里程碑说明中添加"完成于 YYYY-MM-DD"及关键产出链接
- 每次任务开始前，AI 必须先查看 [tasks.md](../../tasks.md)（如果存在）了解当前待办清单
- 每次任务结束后，AI 必须更新 tasks.md 中的对应 checkbox 状态

## B.16 会话启动检查

每次进入一个新的 AI 会话/任务时，AI 必须自动完成以下流程：

1. 加载并读取 [project.md](../../project.md) 的里程碑表 → 确认当前整体阶段
2. 加载并读取 [tasks.md](../../tasks.md)（如果存在）→ 确认具体的待办列表
3. 运行 `git log -5 --oneline` → 确认最近变更
4. 在开始工作前，输出一段项目状态总结，例如：

   ```
   【项目状态自检】
   - 当前阶段：M1 基础设施搭建
   - 最新里程碑：shared 共享库已完成，docs 文档已齐全
   - 有待修复问题：Alembic 迁移链断裂（auth 和 knowledge 缺 0001 初始迁移）
   - 本次任务：xxx
   ```

## B.17 代码风格强制约束

- 所有路由函数必须使用 `async def`
- 一律通过 `Depends()` 获取 db session，禁止使用全局变量
- 错误处理必须使用 [shared/errors.py](../../shared/errors.py) 的 `AppException`，禁止直接 `raise HTTPException`
- 所有 SQLAlchemy 查询必须使用 async 模式（`select()` + `await execute()`）
- 新环境变量必须同步更新 [.env.example](../../.env.example) 和 [docs/06-环境变量清单.md](../../docs/06-环境变量清单.md)
- 禁止在迁移脚本中使用 f-string 拼接 SQL 参数，必须使用参数化查询或 SQLAlchemy ORM

## B.18 VM 开发环境工作流

- 本地（Windows + Trae IDE）负责编码，VM（Ubuntu）负责运行和调试
- 标准操作流程：
  1. 本地修改代码
  2. 运行 Git Bash: `./backend/scripts/sync-backend.sh` 同步到 VM
  3. VM 上 `uvicorn --reload` 自动热重载
  4. 通过 `http://192.168.234.128:<port>` 验证接口
- 新增依赖时在本地 `requirements.txt` 中添加后同步到 VM，VM 上执行 `pip install -r requirements.txt`
- 数据库迁移脚本在本地编写后同步到 VM，在 VM 上执行 `alembic upgrade head`
- 所有 `.env`、证书等敏感文件必须手动在 VM 上维护，禁止纳入同步（已在 `.syncignore` 中排除）
- 禁止在 VM 上直接执行 `git` 操作、修改代码后必须同步回本地再提交
- VM 上的 `.venv` 虚拟环境不参与同步，各 VM 独立创建

## B.19 环境一致性管理

- 本地的 Python 版本必须与 VM 一致（目标：Python 3.12）
- 依赖变更流程：
  1. 本地修改 `requirements.txt`
  2. 通过 `sync-backend.sh` 同步到 VM
  3. VM 上执行 `pip install -r requirements.txt`
  4. 确认无版本冲突后再继续开发
- VM 上数据库（PostgreSQL/Redis）的连接配置与本地对照表：
  - 本地：`localhost:5432` / `localhost:6379`
  - VM：`192.168.234.128:5432` / `192.168.234.128:6379`
  - 差异记录在 `docs/06-环境变量清单.md`
- 新增环境变量时，必须同步更新 `.env.example` 和 `docs/06-环境变量清单.md`
- VM 上的系统和 Python 包更新操作必须先告知用户，确认后再执行
