---
alwaysApply: true
---

# CodeSail 项目工作流规则

> 本文件确保 AI Agent 在 CodeSail 项目中始终遵循 codesail-workflow Skill 中定义的工作流。
> 与各子项目的 `project_rules.md` 互补：project_rules 管代码怎么写，本规则管流程怎么跑。

## 强制流程

### 1. 环境自检（开展任何后端工作前）

在编写任何 backend 代码前，必须先确认 VM 环境可连接且核心服务运行正常：

```
SSH peng@192.168.234.128 (密钥: backend/.ssh/vm_key)
  → docker ps (至少 postgres + redis + auth 在运行)
  → Auth /docs 返回 200
```

如果 Knowledge 或 Core 服务未启动，禁止假设它们可用。

### 2. 模块边界

- 改 backend → 不碰 miniapp / webapp / test
- 改 miniapp → 不碰 backend / webapp / test
- 改 webapp → 不碰 backend / miniapp / test
- 联调阶段（各端代码都写完）允许跨项目修复

### 3. 文档锚点

每次编码前必须阅读对应的文档锚点：
- ORM → `backend/docs/database/01-数据库ERD设计文档.md`
- API → `backend/docs/api/各服务接口契约文档.md`
- 响应格式 → 读 `backend/shared/responses.py`
- 错误码 → 读 `backend/shared/errors.py`
- Auth 代码风格 → 参照 `backend/services/auth/`

### 4. 设计冲突

发现设计缺陷/冲突 → 禁止直接改代码 → 报告用户 → 提方案 → 确认后再改文档 → 最后改代码。

### 5. 里程碑更新（完成每个阶段必修）

每完成一个模块/里程碑，**必须同步更新以下所有文件**：

| 文件 | 更新的内容 |
|------|-----------|
| `memo/开发计划.md` | §六 模块完成状态表 |
| `memo/backend/project.md` | 开发里程碑表 |
| `memo/backend/tasks.md` | 任务列表 + 状态总览摘要 |
| `memo/miniapp/project.md` | 开发里程碑表 |
| `memo/webapp/project.md` | 开发里程碑表 |
| `memo/test/project.md` | 开发里程碑表 |

使用统一的状态标识：🟢 已完成 / 🔴 进行中 / 🟡 阻塞 / ⚪ 待开始。

### 6. 验证

每个里程碑完成后：
- backend → 代码同步到 VM → curl 验证接口
- miniapp → 微信开发者工具中运行验证
- webapp → 浏览器中运行验证

### 7. PowerShell 转义

禁止在 PowerShell ssh 命令中内联复杂 shell 语句。需要远程执行脚本时，先写文件到本地 → scp 上传 → ssh 执行远程脚本。

## 详细工作流

完整工作流定义见：`memo/.trae/skills/codesail-workflow/SKILL.md`
