---
alwaysApply: true
---
# 卡片学记 后端服务 — 项目专属规则

> 继承自：[core-rules.md](core-rules.md)（全局通用规则）
> 本文件仅包含后端项目专属的增量/覆写条款，通用规则请查阅 core-rules.md。

---

## 规则定位

| 维度 | 说明 |
|------|------|
| 所属项目 | backend |
| 继承自 | [core-rules.md](core-rules.md)（全局通用规则） |
| 本文件定位 | 后端项目专属的扩展条款（B.9 ~ B.23） |
| 冲突处理 | 本文件条款若与 core-rules.md 冲突，以本文件为准 |

---

## B.9 上下文感知（后端补充）

> 通用原则见 core-rules.md §A.6。以下为后端专属约束。

- 了解项目中已有的工具函数、中间件、模型、路由后再进行编码，避免重复造轮子
- 每次任务开始前必须加载以下锚点文档：
  1. [project.md](../../project.md) — 项目背景、当前阶段、技术栈
  2. 本文件 — 后端专属扩展条款

## B.10 修改验证（后端补充）

> 通用原则见 core-rules.md §A.7。以下为后端专属命令。

- 后端 lint/typecheck 命令：`ruff` + `mypy`
- API 接口修改后应通过 `api-test-pro` Agent 验证接口正确性

## B.11 依赖管理（后端补充）

> 通用原则见 core-rules.md §C.2。以下为后端专属约束。

- 使用新依赖前，先检查 `requirements.txt` 等文件中是否已有替代方案
- 引入新依赖时必须评估其对项目体积、安全性和兼容性的影响

## B.12 三服务架构约束

> 基于 [project.md](../../project.md) 定义的三服务架构（Auth / Knowledge / Core），所有开发必须遵循以下边界。

### B.12.1 端口与暴露规则

> 端口分配与暴露策略详见 [project.md](../../project.md) §服务架构（架构图 + 服务职责边界表）。此处仅列出强制约束：

- Auth (:8001) 不承载业务逻辑，仅暴露登录/刷新/密码修改端点
- Knowledge (:8002) 禁止对外暴露任何端口，仅 Docker 内部网络可访问
- Core (:8000) 为唯一业务 API 入口，承担 API 网关 + 业务编排职责

### B.12.2 服务间通信

> 通信协议、客户端、超时、重试、服务发现等参数详见 [project.md](../../project.md) §服务间通信规范。此处仅列出架构级强制约束：

- 唯一内部调用链路：Core → Knowledge（单向，禁止反向调用）
- 禁止服务间循环依赖调用
- 禁止 Auth 与 Core 之间发生网络调用（JWT 验签通过 shared/auth.py 本地完成）

### B.12.3 shared 共享库使用

- `shared/` 目录为三服务共享代码，禁止在 shared 中引入服务专属逻辑
- Auth 和 Core 共享 JWT Secret（通过环境变量注入），保证签发和验证的一致性
- 新增 shared 模块前必须评估是否真正被多个服务需要

## B.13 API 设计规范

> 通用原则见 [project.md](../../project.md) §API 设计规范。以下为后端执行层面的补充。

### B.13.1 统一响应格式

所有 API 响应必须遵循统一格式。

### B.13.2 RESTful 约定

- URL 使用复数名词（如 `/api/v1/domains`、`/api/v1/notes`）
- HTTP 方法语义：GET（查询）、POST（创建）、PUT（全量更新）、PATCH（部分更新）、DELETE（删除）
- 列表接口必须支持分页（`page` / `page_size` 参数）

### B.13.3 版本化

- API 通过 URL 前缀版本化（如 `/api/v1/`）
- 破坏性变更必须升级主版本号

### B.13.4 错误码

- 所有错误使用 `shared/errors.py` 中的统一错误码体系
- 错误响应必须包含：错误码（`code`）、错误消息（`message`）、请求追踪 ID（`request_id`）
- 禁止直接暴露内部异常堆栈到客户端

## B.14 Docker Compose 约定

### B.14.1 服务编排

> 服务名与编排结构详见 [project.md](../../project.md) §服务架构 + §项目结构。

- 所有服务通过 `docker-compose.yml` 统一编排
- 服务名必须与 project.md 中定义一致（`auth` / `knowledge` / `core` / `postgres` / `redis`）

### B.14.2 网络隔离

- 创建内部 Docker 网络，PostgreSQL 和 Redis 仅加入内部网络
- Knowledge 服务仅加入内部网络，不暴露端口到宿主机
- 仅 Auth (:8001) 和 Core (:8000) 暴露端口到宿主机

### B.14.3 环境变量注入

- 各服务的环境变量通过 `docker-compose.yml` 的 `environment` 段或 `env_file` 注入
- 敏感变量（密钥、密码等）使用 `.env` 文件（不纳入版本控制）
- `.env.example` 提供模板文件（纳入版本控制）

## B.15 数据库与数据安全

> 通用安全原则见 core-rules.md Part B。Schema 隔离架构详见 [project.md](../../project.md) §服务架构（数据库架构图 + 服务职责边界表）。

- 数据库迁移脚本必须可回滚（提供 `up` / `down` 双向操作）
- 禁止直接在生产环境执行危险操作（如 `DROP TABLE`）
- 批量操作必须考虑事务保护和数据一致性
- 每个服务只能访问自己的 Schema，禁止跨 Schema 直接写入
- 数据看板需跨 Schema 查询时，必须通过 Core 服务统一聚合，不得让 Knowledge 或 Auth 服务执行跨 Schema 查询

## B.16 进度同步

- 每完成一个里程碑或子任务后，必须同时做两件事：
  1. 在 [project.md](../../project.md) 的里程碑表中将该里程碑状态标记为 🟢 已完成
  2. 在对应里程碑说明中添加"完成于 YYYY-MM-DD"及关键产出链接
- 每次任务开始前，AI 必须先查看 [tasks.md](../../tasks.md)（如果存在）了解当前待办清单
- 每次任务结束后，AI 必须更新 tasks.md 中的对应 checkbox 状态

## B.17 会话启动检查

每次进入一个新的 AI 会话/任务时，AI 必须自动完成以下流程：

1. 加载并读取 [project.md](../../project.md) 的里程碑表 → 确认当前整体阶段
2. 加载并读取 [tasks.md](../../tasks.md)（如果存在）→ 确认具体的待办列表
3. 运行 `git log -5 --oneline` → 确认最近变更
4. 在开始工作前，输出一段项目状态总结，例如：

   ```
   【项目状态自检】
   - 当前阶段：M1 基础设施搭建
   - 最新里程碑：xxx
   - 待处理事项：xxx
   - 本次任务：xxx
   ```

## B.18 环境变量管理

> 通用原则见 core-rules.md §D.2。以下为后端专属实践。

- 新增环境变量时，必须同步更新 `.env.example` 和 `docs/operations/环境变量清单.md`
- 环境变量按用途分类：
  - 数据库连接：`POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`
  - Redis 连接：`REDIS_HOST` / `REDIS_PORT`
  - JWT 密钥：`JWT_SECRET_KEY`（Auth 和 Core 必须使用相同的值）
  - AI 服务：`DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL`
  - 微信登录：`WECHAT_APPID` / `WECHAT_SECRET`
- 各服务仅加载自己需要的环境变量，禁止全局加载所有变量

## B.19 代码风格强制约束

> ⚠️ 以下约束基于当前代码规范制定，代码重构后需重新确认和更新。

- 所有路由函数必须使用 `async def`
- 一律通过 `Depends()` 获取 db session，禁止使用全局变量
- 错误处理必须使用 `shared/errors.py` 的 `AppException`，禁止直接 `raise HTTPException`
- 所有 SQLAlchemy 查询必须使用 async 模式
- 禁止在迁移脚本中使用 f-string 拼接 SQL 参数，必须使用参数化查询或 SQLAlchemy ORM

## B.20 VM 开发环境工作流

- 本地（Windows + Trae IDE）负责编码，VM（Ubuntu）负责运行和调试
- 标准操作流程：
  1. 本地修改代码
  2. 运行 Git Bash: `./backend/scripts/sync-backend.sh` 同步到 VM
  3. VM 上 `uvicorn --reload` 自动热重载
  4. 通过 `http://192.168.234.128:<port>` 验证接口
- 新增依赖时在本地 `requirements.txt` 中添加后同步到 VM，VM 上执行 `pip install -r requirements.txt`
- 数据库迁移脚本在本地编写后同步到 VM，在 VM 上执行 `alembic upgrade head`
- 所有 `.env`、证书等敏感文件必须手动在 VM 上维护，禁止纳入同步（已在 `.syncignore` 中排除）
- 禁止在 VM 上直接执行 `git` 操作，VM 上修改代码后必须同步回本地再提交
- VM 上的 `.venv` 虚拟环境不参与同步，各 VM 独立创建

## B.21 环境一致性管理

- 本地的 Python 版本必须与 VM 一致（目标：Python 3.12）
- 依赖变更流程：
  1. 本地修改 `requirements.txt`
  2. 通过 `sync-backend.sh` 同步到 VM
  3. VM 上执行 `pip install -r requirements.txt`
  4. 确认无版本冲突后再继续开发
- VM 上数据库连接配置与本地对照：
  - 本地：`localhost:5432` / `localhost:6379`
  - VM：`192.168.234.128:5432` / `192.168.234.128:6379`
- 新增环境变量时，必须同步更新 `.env.example` 和 `docs/operations/环境变量清单.md`
- VM 上的系统和 Python 包更新操作必须先告知用户，确认后再执行

## B.22 Knowledge 服务专属约束

> Knowledge 服务（port 8002）仅内部可访问，不直接对客户端暴露。

### B.22.1 AI 内容生成

> 批量上限等参数详见 [project.md](../../project.md) §知识管理服务 → AI 内容生成功能表。

- AI 生成的内容（知识卡片/题目）必须经过管理员审核后方可上架
- AI 生成接口必须设置批量上限（详见 project.md）
- 生成结果必须保留版本历史，支持管理员择优选择

### B.22.2 内容审核

> 审核流程（三级：敏感词过滤 → AI 5 维度审查 → 人工复核）详见 [project.md](../../project.md) §知识管理服务 → 内容审核功能表。

- 敏感词库变更后必须在 1 分钟内同步到 Redis 缓存
- 审核操作必须记录完整的审核轨迹（审核人、时间、结果、原因）
- 高风险和低风险内容可由 AI 直接判定，中风险内容必须进入人工复核队列

### B.22.3 数据隔离

- Knowledge 服务仅访问 `knowledge` Schema
- 内容的上下架状态变更必须保证幂等性

## B.23 Core 服务专属约束

> Core 服务（port 8000）是唯一对外暴露的业务 API 入口。

### B.23.1 API 网关职责

> 网关架构详见 [project.md](../../project.md) §服务架构（架构图 + API 调用链示例）。

- 所有客户端请求必须经 Core 服务路由，不得绕过 Core 直接访问 Knowledge
- Core 使用 `shared/auth.py` 本地验证 JWT，不得对 Auth 服务发起网络调用来验签

### B.23.2 业务编排

- Core 调用 Knowledge 时，必须携带必要的上下文信息（用户 ID、请求追踪 ID）
- 涉及跨服务的写操作必须评估事务边界，必要时引入补偿机制
- Core 禁止直接操作 `knowledge` Schema 的表

### B.23.3 数据看板

- 数据看板涉及跨 Schema 聚合查询时，由 Core 统一执行
- 统计类查询必须设置合理的缓存策略，避免全表实时扫描
