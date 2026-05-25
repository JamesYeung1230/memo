# CodeSail 项目工作流 (codesail-workflow)

> 码上启航 (CodeSail) 项目专属协作工作流 Skill。
> 定义 AI Agent 在本 monorepo 中的**环境自检 → 编码 → 验证 → 里程碑更新**完整闭环。
> 与 agent-skills 中的通用 Skills（spec-driven / incremental / debug 等）互补：通用 Skill 管"怎么写代码"，本 Skill 管"在这个项目里怎么协同运转"。

---

## 与其他 Skill 的关系

```
开始新模块
  → [spec-driven-development]     写 spec / 对齐 API 契约
  → [planning-and-task-breakdown]  拆任务
  → [codesail-workflow]  ← 本 Skill：环境检查 → 确认模块边界 → 进入编码
  → [incremental-implementation]  逐 slice 编码
  → [test-driven-development]     写测试
  → [codesail-workflow]  ← 本 Skill：同步 VM → curl 验证 → 更新里程碑
  → [git-workflow]                提交
```

---

## 1. 项目结构速览（每次启动必须加载）

### 1.1 四子项目

| 目录 | 项目 | 技术栈 | 环境 |
|------|------|--------|------|
| `backend/` | 后端微服务（3 服务） | Python 3.12+ / FastAPI / PostgreSQL / Redis | VM: `192.168.234.128` |
| `miniapp/` | 微信小程序（C 端） | 微信原生 + Skyline + glass-easel | 微信开发者工具 |
| `webapp/` | Web 管理后台（B 端） | React 19 + TypeScript + Ant Design 5.x | 浏览器 localhost |
| `test/` | 测试工程 | Python / pytest / Playwright | VM / Windows |

### 1.2 微服务端口

| 服务 | 端口 | 对外暴露 | 职责 |
|------|:--:|:--:|------|
| Core | 8000 | ✅ | 全部业务 API（网关 + 编排） |
| Auth | 8001 | ✅ 仅登录类 | 微信登录 / 管理员登录 / JWT |
| Knowledge | 8002 | ❌ 内部 | 内容 CRUD + AI 生成 + 审核 |

### 1.3 容器名

| 容器 | 名称 |
|------|------|
| Auth | `codesail-auth` |
| PostgreSQL | `codesail-postgres` |
| Redis | `codesail-redis` |

### 1.4 VM 连接信息

| 项目 | 值 |
|------|-----|
| 用户 | `peng` |
| IP | `192.168.234.128` |
| 项目路径 | `/home/peng/memo/backend` |
| SSH 密钥 | `backend/.ssh/vm_key` |
| 同步脚本 | `backend/scripts/sync-backend.ps1` |

---

## 2. 环境自检

### 2.1 一键检查脚本

`scripts/check-env.sh` — 上传到 VM 后执行：

```
bash /tmp/check-env.sh
```

验证项：
1. Auth API `/docs` HTTP 200
2. Auth 路由列表
3. PostgreSQL Schema（auth 至少已创建）
4. Redis PING
5. 所有容器状态（postgres / redis / auth / knowledge / core）

### 2.2 手动分步检查

```bash
# SSH 连接
ssh -i "backend/.ssh/vm_key" peng@192.168.234.128

# Docker 状态
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# 服务健康
curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/docs
```

### 2.3 PowerShell 转义注意事项

在 Windows PowerShell 中通过 SSH 执行远程命令时，特殊字符（`$`、`"`、`'`、`\`）会被 PowerShell 拦截解析。

**解决方案**：写脚本到本地文件 → `scp` 上传到 VM → `ssh ... "bash /tmp/xxx.sh"` 执行。

**禁止**：在 PowerShell 的 `ssh` 命令中内联复杂 shell 语句（curl + python 管道等）。

---

## 3. 开发闭环

每完成一个模块/里程碑，严格执行以下步骤：

```
Step 1: 读文档锚点
Step 2: 确认模块边界（改哪个子项目、不动哪个）
Step 3: 编码（参照已有代码风格）
Step 4: 写 backend 单元测试（Mock DB）+ test 集成测试
Step 5: 确认测试全部通过（pytest）+ 覆盖率达标（≥90%）
Step 6: 同步到 VM（backend）→ curl 验证
Step 7: 如果该模块有对应前端（miniapp/webapp 页面），跳到前端开发闭环
　　  如果无前端页面，跳到 Step 8
Step 8: Git 提交（见 §5.6 提交规范）
Step 9: 更新里程碑状态（见 §6）
```

> **开发顺序原则**：API 优先 → 测试 → 前端（如适用）→ 前后端联调 → 提交。
> **自主推进原则**：当前里程碑完成后，无需询问用户，直接进入下一个里程碑。只有遇到阻塞性设计冲突（§4）或需要明确方向选择时才提问。

### Step 1: 读文档锚点

**核心原则**：当文档与需求没有出现前后矛盾时，以文档为锚点进行后续任务。所有设计文档（ERD / API 契约 / PRD / 交互设计）是唯一权威依据。

| 任务类型 | 必须参照的文档 |
|----------|---------------|
| ORM 模型 | `backend/docs/database/01-数据库ERD设计文档.md` |
| API 路由 | `backend/docs/api/各服务接口契约文档.md` + 对应服务的 `auth-service.md` |
| 响应格式 | `backend/shared/responses.py`（已有代码，直接读） |
| 错误码 | `backend/shared/errors.py`（已有代码，直接读） |
| 里程碑 | `backend/project.md` + `backend/tasks.md` |
| 已有代码风格 | `backend/services/auth/` 作为参考模板 |
| 小程序 PRD | `miniapp/docs/PRD.md` |
| 小程序交互 | `miniapp/docs/交互设计.md` |
| Web 端 PRD | `webapp/docs/PRD.md` |

### Step 2: 确认模块边界

规则：**开发一个子项目时，禁止修改其他子项目的代码**。

| 当前开发 | 可改 | 不可改 |
|----------|------|--------|
| backend | `backend/` | `miniapp/` `webapp/` `test/` |
| miniapp | `miniapp/` | `backend/` `webapp/` `test/` |
| webapp | `webapp/` | `backend/` `miniapp/` `test/` |

例外：联调阶段（前后端均已开发完成后）可在最小范围内跨项目修复性问题，但须先报告用户。

### Step 3: 编码

- 参照 Auth 服务的代码风格（如 `backend/services/auth/` 中的模式）
- 模型层可拆分并行（Domain、Chapter、Card、Question 各自独立）
- 路由层依赖模型，建议串行
- 编码过程中如发现文档矛盾或设计缺失：**禁止直接修改代码适配**，按 §4 流程报告

### Step 4: 写测试

- 编写 `backend/tests/` 路由单元测试（Mock DB），覆盖率目标 ≥ 90%
- 编写 `test/tests/` 集成测试（httpx 调真实容器 API）
- 测试失败则不进入下一步

### Step 5: 确认测试通过

```bash
# backend 单元测试
python -m pytest tests/services/<module>/ -v

# test 集成测试
python -m pytest tests/<module>/ -v

# 覆盖率
coverage run -m pytest tests/services/<module>/test_routes.py -v
coverage report --include="services/<module>/routes/*" -m
```

确认要点：
- 所有测试通过，无失败 ❌ → 修复后继续
- 路由覆盖率 ≥ 90%

### Step 6: 同步到 VM + curl 验证

#### 同步代码（仅 backend）

```powershell
# 方式一：使用同步脚本
.\backend\scripts\sync-backend.ps1

# 方式二：手动同步
scp -i "backend/.ssh/vm_key" <local_file> peng@192.168.234.128:/home/peng/memo/backend/<target>
```

同步后重建容器：
```bash
cd /home/peng/memo/backend
docker compose up -d --build <service_name>
```

#### curl 验证

```bash
# 模板：验证新接口
curl -s -X POST http://localhost:<port>/api/v1/<endpoint> \
  -H 'Content-Type: application/json' \
  -d '{"key":"value"}' | python3 -m json.tool
```

验证要点：
- `code === 0`（业务成功）
- 响应结构符合 `shared/responses.py` 定义
- 错误场景也需验证（用错误码确认）

### Step 7: 前端开发（如适用）

如果当前模块有对应的前端页面（miniapp 或 webapp），则在 API 验证通过后进入前端开发：

**小程序（miniapp）**：
- 微信开发者工具中打开 `miniapp/` 项目
- 参照 `miniapp/docs/PRD.md` 和 `miniapp/docs/交互设计.md`
- 设计稿缺失时，以 PRD 和交互设计文档为准进行补充
- 确保小程序能访问 `192.168.234.128` 上的后端服务
- 完成页面开发后进行前后端 API 联调

**Web 管理后台（webapp）**：
- 本地开发服务器启动
- 参照 `webapp/docs/PRD.md` 和设计稿
- 设计稿缺失时，以 PRD 和交互设计文档为准进行补充
- 联调验证接口对接正确

**联调准则**：
- 前端优先按 API 契约实现，不因前端便利而修改后端接口
- 发现接口不满足前端需求时，按 §4 流程报告，**禁止直接修改后端代码**
- 联调过程中发现文档不一致，记录并报告用户

### Step 8: Git 提交

见 §5.6 提交规范。

### Step 9: 更新里程碑状态

见 §6。

---

## 4. 设计冲突处理

如果在开发中发现：
- 后端接口设计与前端需求不匹配
- 前后端对同一功能的定义存在冲突
- 现有设计文档（ERD / API 契约 / PRD）存在缺陷或遗漏

**流程**：

```
发现设计缺陷/冲突
      ↓
❌ 禁止直接修改代码适配
      ↓
✅ 记录问题 → 报告用户 → 提出推荐方案
      ↓
用户确认后 → 按批准的方案修改设计文档 → 再编码
```

推荐方案须从**项目整体视角**出发，综合考虑：
- 对多端（backend + miniapp + webapp）的影响范围
- 与现有规范和文档的兼容性
- 实施成本和收益
- 是否影响已完成的模块

---

## 5. 验证工具箱

### 5.1 SSH 基础命令

```bash
# 连接
ssh -i "backend/.ssh/vm_key" peng@192.168.234.128

# 执行单条命令
ssh -i "backend/.ssh/vm_key" peng@192.168.234.128 "docker ps -a"

# 上传文件
scp -i "backend/.ssh/vm_key" <local> peng@192.168.234.128:<remote>

# 执行远程脚本
ssh -i "backend/.ssh/vm_key" peng@192.168.234.128 "bash /tmp/xxx.sh"
```

### 5.2 后端验证模板

```bash
# Auth 登录
curl -s -X POST http://localhost:8001/api/v1/wechat/login \
  -H 'Content-Type: application/json' \
  -d '{"code":"test_code_001"}'

# Core 业务接口（需 JWT）
curl -s http://localhost:8000/api/v1/xxx \
  -H 'Authorization: Bearer <token>'

# 数据库检查
docker exec codesail-postgres psql -U postgres -d codesail -c '\dt'
docker exec codesail-postgres psql -U postgres -d codesail -c '\dn'

# Redis
docker exec codesail-redis redis-cli ping
```

### 5.3 小程序验证

- 在微信开发者工具中打开 `miniapp/` 项目
- 检查 `config/env.js` 中 `currentEnv` 是否为 `DEV`
- 确保手机/模拟器能访问 `192.168.234.128:8001`

### 5.4 代码同步

```powershell
# 全量同步 backend 到 VM
.\backend\scripts\sync-backend.ps1

# 自动监听同步
.\backend\scripts\watch-backend.ps1
```

### 5.5 Backend 路由单元测试（Mock DB 全覆盖）

#### 5.5.1 测试分层

CodeSail 后端测试分两层，**缺一不可**：

| 层 | 位置 | 方式 | 目的 |
|---|------|------|------|
| **单元测试** (Mock DB) | `backend/tests/` | `FastAPI TestClient` + `AsyncMock` 模拟 DB | 验证路由逻辑，提供覆盖率数据 |
| **集成测试** (Real API) | `test/tests/` | httpx 调真实容器 API | 验证端到端真实交互 |

要求：路由单元测试覆盖率 **≥ 90%**（通过 `coverage run -m pytest` 测量）。

#### 5.5.2 Mock Session 标准模式（核心套路）

```python
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from services.knowledge.routes import (
    domain_router,
    chapter_router,
    card_router,
    question_router,
)
from shared.errors import AppException


def _mock_result(**kwargs):
    """Create synchronous return object for session.execute()"""
    r = MagicMock()
    for k, v in kwargs.items():
        if k == "scalars_all":
            s = MagicMock()
            s.all = MagicMock(return_value=v)
            r.scalars = MagicMock(return_value=s)
        elif k == "scalar":
            r.scalar = MagicMock(return_value=v)
        elif k == "scalar_one_or_none":
            r.scalar_one_or_none = MagicMock(return_value=v)
    return r


@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.add = MagicMock()
    session.delete = AsyncMock()          # 必须 AsyncMock 才能 await
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.execute = AsyncMock(return_value=_mock_result())
    return session


@pytest.fixture
def client(mock_session):
    app = FastAPI()
    app.include_router(domain_router)
    app.include_router(chapter_router)
    # ... 注册所有路由

    # === 关键：模拟 async with factory() as session ===
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    app.state.db_session_factory = MagicMock(return_value=mock_session)

    # === 关键：注册异常处理器（否则错误码不会转成响应）===
    @app.exception_handler(AppException)
    async def app_exc_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.http_status,
            content={**exc.to_dict(), "request_id": ""},
        )

    @app.exception_handler(RequestValidationError)
    async def val_exc_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={
            "code": "VALIDATION_ERROR", "message": "Request validation failed",
            "data": None, "detail": {"errors": [...]}, "request_id": "",
        })

    return TestClient(app)
```

#### 5.5.3 测试方法模板

**成功路径：**
```python
def test_get_domain(self, client, mock_session, mock_domain):
    mock_session.execute.return_value = _mock_result(scalar_one_or_none=mock_domain)
    resp = client.get(f"/api/v1/domains/{mock_domain.id}")
    assert resp.status_code == 200
```

**错误路径：**
```python
def test_get_domain_not_found(self, client, mock_session):
    mock_session.execute.return_value = _mock_result(scalar_one_or_none=None)
    resp = client.get("/api/v1/domains/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
```

**多步查询（需要 side_effect 精确匹配 execute 调用次数）：**
```python
def test_list_items(self, client, mock_session, mock_item):
    # 关键：side_effect 列表数量必须等于 handler 中 await session.execute() 的次数
    mock_session.execute.side_effect = [
        _mock_result(scalar_one_or_none=MagicMock()),  # 第1次：检查父实体是否存在
        _mock_result(scalar=1, scalars_all=[mock_item]),  # 第2次：COUNT
        _mock_result(scalar=1, scalars_all=[mock_item]),  # 第3次：SELECT ... LIMIT
    ]
    resp = client.get("/api/v1/items?page=1&page_size=20")
    assert resp.status_code == 200
```

#### 5.5.4 Fixtures（Mock 对象模板）

要模仿 ORM 模型对象的属性访问，使用 `MagicMock`：

```python
@pytest.fixture
def mock_domain():
    d = MagicMock()
    d.id = str(uuid.uuid4())
    d.name = "test-domain"
    d.icon = "test"
    d.sort_order = 1
    d.is_free = True
    d.unlock_points = None
    d.status = "published"
    d.created_at = None       # hasattr 检查会返回 True
    d.updated_at = None
    return d
```

注意：
- **所有属性值统一用英文**，避免编码问题导致测试报错
- **测试文件必须纯 ASCII**，不能有中文注释/字符串 → `SyntaxError: invalid non-printable character`
- `hasattr(obj, 'attr_name')` 对 `MagicMock` 总是返回 True

#### 5.5.5 测量覆盖率

```bash
# 在容器中安装并执行
pip install coverage
coverage run -m pytest tests/services/knowledge/test_routes.py -v
coverage report --include="services/knowledge/routes/*" -m
```

容器内依赖安装指令：
```bash
pip install coverage pytest pytest-asyncio httpx fastapi
```

#### 5.5.6 常见坑 & 修复

| 症状 | 原因 | 修复 |
|------|------|------|
| `TypeError: AsyncClient.__init__() got an unexpected keyword argument 'app'` | httpx 旧版不支持 `app=` | 改用 `fastapi.testclient.TestClient(app)` |
| `'async with' received an object from __aenter__ that does not implement __await__` | session `__aenter__` 用了 `MagicMock` 而非 `AsyncMock` | 改为 `__aenter__ = AsyncMock(return_value=session)` |
| `TypeError: object MagicMock can't be used in 'await' expression` | `session.delete()` 是 `MagicMock` 而非 `AsyncMock` | 改为 `session.delete = AsyncMock()` |
| `StopAsyncIteration` / `StopIteration` | `side_effect` 列表数量少于实际 execute 调用次数 | 打开路由代码数 `await session.execute()` 出现次数，逐一补充 |
| `SyntaxError: invalid non-printable character` | 文件包含中文注释/字符串 → Docker 容器内 Python 编码问题 | 确保测试文件**纯 ASCII**，全部用英文 |
| RuntimeWarning: coroutine was never awaited | `session.execute` 在 async 路径上 mock 返回了 MagicMock | execute 必须是 `AsyncMock` |

### 5.6 Git 提交规范

#### 5.6.1 提交时机

**每完成一个里程碑/阶段，必须在 Step 7 进行本地 Git 提交**。禁止跨越多个阶段一次性提交。

以当前项目 K1→K2→K3 为例的正确提交节奏：

```
[K1] Knowledge 骨架搭建完成 → git commit（含 main.py + 8 张 ORM 模型）
[K2] 内容管理 CRUD 完成 → git commit（含 4 个路由文件 + 2 套测试）
[K3] AI 内容生成完成 → git commit（含 AI 路由 + 测试）
```

#### 5.6.2 提交格式

使用 Conventional Commits 格式：

```
<type>(<scope>): <description>

# 示例
feat(knowledge): K2 内容管理 CRUD 路由 + 全量测试
- 新增 domain/chapter/card/question 四个路由模块
- 新增 backend 单元测试 57 个（覆盖率 93%）
- 新增 test 集成测试 27 个
- 修复 0002_seed_domains.py 迁移参数问题
- 修复 ENUM 列类型匹配问题
```

| type | 适用场景 |
|------|---------|
| `feat` | 新功能、新模块 |
| `fix` | 修复 bug |
| `refactor` | 重构（不改变功能） |
| `test` | 仅修改测试 |
| `docs` | 文档或 Skill 更新 |
| `chore` | 构建、配置、依赖等 |

#### 5.6.3 提交前检查清单

- [ ] 所有测试通过（`pytest -q` 无失败）
- [ ] 路由单元测试覆盖率 ≥ 90%
- [ ] 里程碑文档已更新（project.md / tasks.md）
- [ ] SKILL.md 如有需要已同步更新

#### 5.6.4 不提交的情况

- 测试失败的代码
- 覆盖率不达标的代码
- 仅用于调试的临时文件、print、日志
- 未完成的半成品（除非在 feature branch）

---

## 6. 里程碑状态更新（完成每个阶段必做）

### 6.1 需要更新的文件清单

每完成一个模块/里程碑，**必须同步更新以下所有文件**中的状态表：

| 文件 | 更新的表格/章节 |
|------|----------------|
| `d:\workspace\memo\开发计划.md` | §六 模块完成状态表 |
| `d:\workspace\memo\backend\project.md` | 开发里程碑 各表格 |
| `d:\workspace\memo\backend\tasks.md` | 任务列表 + 状态总览摘要 |
| `d:\workspace\memo\miniapp\project.md` | 开发里程碑 表格 |
| `d:\workspace\memo\webapp\project.md` | 开发里程碑 表格 |
| `d:\workspace\memo\test\project.md` | 开发里程碑 表格 |

### 6.2 状态标识统一

所有里程碑表使用统一状态标识：

| 标识 | 含义 |
|:----:|------|
| 🟢 | 已完成 |
| 🔴 | 进行中 |
| 🟡 | 阻塞 |
| ⚪ | 待开始 |

### 6.3 更新示例（M1 完成后）

假设完成了 M1 用户认证（backend + miniapp 登录）：

**① `开发计划.md` §六：**
```
| M1 用户认证 | 🟢 | 🟢 | ⚪ | ⚪ | 🔴 进行中 |
```

**② `backend/project.md` 里程碑表：**
```
| **A1** | Auth 骨架搭建 | 🟢 已完成 | ... |
| **A2** | 管理员认证 | 🟢 已完成 | ... |
| **A3** | 微信登录 | 🟢 已完成 | ... |
| **A4** | JWT 共享验证 | 🟢 已完成 | ... |
```

**③ `backend/tasks.md`：**
```
## 🟢 已完成
- [x] **A1** Auth 骨架搭建 ...
- [x] **A3** 微信登录 ...

## 🔴 进行中
_暂无进行中任务_

状态总览摘要：
| Auth 服务 | 8 | 4 (A1~A4) | 0 | 4 | 50% |
```

**④ `miniapp/project.md` 里程碑表：**
```
| **M0** | 项目初始化 | 🟢 已完成 | ... |
```

如果 M1 闭环为 miniapp 登录也完成，还需更新 miniapp 对应状态。

### 6.4 更新原则

- **变动后立即更新，不延迟，不批量**
- 同时更新总项目和各子项目的对应表格
- 如果某个子项目不涉及当前模块，跳过该子项目的表格

### 6.5 子项目里程碑对照表

| 总模块 | backend 里程碑 | miniapp 里程碑 | webapp 里程碑 | test 里程碑 |
|:------|:-------------|:-------------|:------------|:----------|
| M1 用户认证 | A1~A4 | M0（登录对接作为 M0 扩展） | M1 登录 | M1 测试框架 |
| M2 内容管理 | K1~K2 | M2 知识卡片学习 | M3 内容管理 | — |
| M3 AI 生成 | K3 | — | M2 AI 工作台 | — |
| M4 笔记审核 | K4~K6 | M4~M5 笔记管理 | M2 AI 审核 | — |
| M5 学习记录 | C1~C2 | M3 刷题学习 | — | — |
| M6 积分体系 | C5 | M7 积分成就 | M4 积分配置 | — |
| M7 运营配置 | C6 | M8 首页个性化 | M4 运营配置 | — |
| M8 数据看板 | C7 | — | M5 数据看板 | — |
| M9 系统管理 | C8 | — | M1 系统管理 | — |

---

## 7. 当前已知环境状态

| 组件 | 状态 | 说明 |
|------|:--:|------|
| VM SSH | ✅ | `peng@192.168.234.128`，密钥 `backend/.ssh/vm_key` |
| Docker | ✅ | 29.4.3，peng 用户在 docker 组 |
| PostgreSQL | ✅ | `codesail-postgres:5432`，Schema `auth` 已创建 |
| Redis | ✅ | `codesail-redis:6379` |
| Auth 服务 | ✅ | `codesail-auth:8001`，6 个端点全部可用 |
| Knowledge 服务 | ❌ | 缺少 `main.py`，待 K1 开发 |
| Core 服务 | ❌ | 缺少 `main.py`，待 C1 开发 |
| WX_MOCK_MODE | `true` | 小程序登录可绕过真实微信 API |
