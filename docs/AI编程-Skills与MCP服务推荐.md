# AI 编程 Skills 与 MCP 服务推荐

> 本文档收集 GitHub 上与 AI 编程相关的 Skills 和 MCP（Model Context Protocol）服务，优先筛选适合本项目（memo/backend：Python + FastAPI + PostgreSQL + Redis）的工具。

---

## 目录

- [1. MCP 服务推荐清单](#1-mcp-服务推荐清单)
- [2. Claude Code 插件/Skills 推荐](#2-claude-code-插件skills-推荐)
- [3. 针对 memo/backend 项目的 MCP 选型建议](#3-针对-memobackend-项目的-mcp-选型建议)
- [4. MCP 安装与配置指南](#4-mcp-安装与配置指南)
- [5. 发现更多 MCP 的资源渠道](#5-发现更多-mcp-的资源渠道)

---

## 1. MCP 服务推荐清单

MCP（Model Context Protocol）是 AI 助手与外部工具之间的标准协议。通过配置 MCP 服务，Claude Code 可以操作数据库、管理 Git、访问文件系统等。

### 1.1 🔥 开发必备（高优先级）

| MCP 服务 | 描述 | GitHub | 推荐理由 |
|---------|------|--------|---------|
| **Filesystem** | 安全的文件系统读写操作 | [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) | 让 Claude Code 精确控制文件读写路径 |
| **GitHub** | 管理仓库、Issue、PR、代码搜索 | [@modelcontextprotocol/server-github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) | 代码审查、自动创建 PR、管理 Issue |
| **Git** | 本地 Git 仓库操作 | [@modelcontextprotocol/server-git](https://github.com/modelcontextprotocol/servers/tree/main/src/git) | 查看 diff、提交历史、分支操作 |
| **Playwright** | 浏览器自动化和测试 | [executeautomation/mcp-playwright](https://github.com/executeautomation/mcp-playwright) | 前端页面截图、UI 测试、Web 抓取 |

### 1.2 🐘 数据库相关（本项目重点）

| MCP 服务 | 描述 | GitHub | 推荐理由 |
|---------|------|--------|---------|
| **PostgreSQL** | PostgreSQL 数据库查询和管理 | [stuzero/pg-mcp](https://github.com/stuzero/pg-mcp) | **核心推荐**。可直接查询数据库、查看表结构、分析数据 |
| **SQLAlchemy** | SQLAlchemy ORM 集成 | 搜索 GitHub `mcp-sqlalchemy` | 配合本项目的 SQLAlchemy ORM，自动读取模型定义 |
| **Redis** | Redis 缓存操作 | 搜索 GitHub `mcp-redis` | 查看缓存内容、管理 Redis 键值 |

### 1.3 🐍 Python 开发相关

| MCP 服务 | 描述 | GitHub | 推荐理由 |
|---------|------|--------|---------|
| **Python REPL** | Python 代码执行环境 | [@modelcontextprotocol/server-python-repl](https://github.com/modelcontextprotocol/servers/tree/main/src/python-repl) | 让 Claude Code 执行 Python 片段验证逻辑 |
| **Pytest** | 自动运行测试和分析结果 | 搜索 GitHub `mcp-pytest` | 自动运行测试并分析失败原因 |
| **Ruff** | Python lint 和格式化 | 自定义 MCP（见下文配置示例） | 代码风格检查和自动修复 |

### 1.4 🐳 Docker 与部署相关

| MCP 服务 | 描述 | GitHub | 推荐理由 |
|---------|------|--------|---------|
| **Docker** | Docker 容器和镜像管理 | [@modelcontextprotocol/server-docker](https://github.com/modelcontextprotocol/servers/tree/main/src/docker) | 管理容器、查看日志、执行 docker compose |
| **Sentry** | 错误跟踪和监控 | 搜索 GitHub `mcp-sentry` | 查看生产环境错误和性能问题 |

### 1.5 📋 项目管理与协作

| MCP 服务 | 描述 | GitHub | 推荐理由 |
|---------|------|--------|---------|
| **Linear** | 项目管理 | [jerhadf/linear-mcp-server](https://github.com/jerhadf/linear-mcp-server) | 创建/更新 Issue，追踪任务进度 |
| **Slack** | 团队通信 | [@modelcontextprotocol/server-slack](https://github.com/modelcontextprotocol/servers/tree/main/src/slack) | 发送通知、搜索消息 |
| **Notion** | 知识库管理 | [@modelcontextprotocol/server-notion](https://github.com/modelcontextprotocol/servers/tree/main/src/notion) | 文档管理和知识库搜索 |

### 1.6 🔬 高级/扩展

| MCP 服务 | 描述 | GitHub | 推荐理由 |
|---------|------|--------|---------|
| **Sequential Thinking** | 增强推理能力 | [@modelcontextprotocol/server-sequential-thinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking) | 复杂问题分步推理，适合架构设计 |
| **Memory** | 持久化记忆 | [@modelcontextprotocol/server-memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) | 跨对话记住项目上下文和决策 |
| **Brave Search** | 网络搜索 | [@modelcontextprotocol/server-brave-search](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) | 让 Claude Code 搜索最新文档和 API |

---

## 2. Claude Code 插件/Skills 推荐

### 2.1 热门 Claude Code 资源仓库

| 资源 | 描述 | GitHub | Stars |
|------|------|--------|:-----:|
| **Claude Code Cheat Sheet** | Claude Code 速查表和技巧集合 | [Njengah/claude-code-cheat-sheet](https://github.com/Njengah/claude-code-cheat-sheet) | 1.2k |
| **Awesome Claude Code Plugins** | Claude Code 插件精选列表 | [ccplugins/awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins) | 758 |
| **Continuous Claude** | 上下文管理和 Agent 编排 | [parcadei/Continuous-Claude-v3](https://github.com/parcadei/Continuous-Claude-v3) | 3.8k |
| **Claude Code MCP List** | Claude Code MCP 服务清单 | [danielrosehill/Claude-Code-MCP-List](https://github.com/danielrosehill/Claude-Code-MCP-List) | — |
| **Claude Code Switch** | 多 Provider 切换工具 | [foreveryh/claude-code-switch](https://github.com/foreveryh/claude-code-switch) | — |

### 2.2 推荐的 Slash 命令插件

以下可以直接保存到 `.claude/commands/` 目录中使用：

**代码审查命令**：`.claude/commands/review.md`

```markdown
---
description: 审查当前 Git 变更
allowed-tools: Bash, Read, Grep
---

审查尚未提交的代码变更：

`!git diff --cached`

1. 评估代码质量和安全性
2. 检查是否符合项目规范
3. 指出潜在问题和改进建议
```

**项目分析命令**：`.claude/commands/analyze.md`

```markdown
---
description: 分析项目结构
allowed-tools: Bash, Read, Grep
---

`!find . -type f -name "*.py" | head -50`

1. 分析项目整体架构
2. 识别关键模块和依赖关系
3. 评估代码质量和测试覆盖
```

### 2.3 Hooks（生命周期钩子）

Hooks 允许在特定事件触发时自动执行脚本：

| Hook | 触发时机 | 用途 |
|------|---------|------|
| `before-read` | 读取文件前 | 日志记录、权限检查 |
| `after-tool-use` | 工具调用后 | 审计日志、结果验证 |
| `before-edit` | 编辑文件前 | 自动备份、合规检查 |
| `after-edit` | 编辑文件后 | 自动运行 lint、触发测试 |

---

## 3. 针对 memo/backend 项目的 MCP 选型建议

### 3.1 本项目技术栈

```
后端框架: FastAPI (Python 3.12+)
数据库: PostgreSQL 16 (通过 SQLAlchemy 2.0+ ORM)
缓存: Redis 7
任务队列: arq (基于 Redis)
ORM: SQLAlchemy + Alembic (迁移)
AI: DeepSeek API (OpenAI 兼容接口)
部署: Docker Compose
代码质量: Ruff (linter) + pytest (测试)
```

### 3.2 推荐配置组合

#### 🟢 入门级（3 个 MCP）

```
postgres-mcp + github-mcp + filesystem-mcp
│               │               │
│ 查询数据库     │ GitHub 操作    │ 安全文件读写
│ 查看表结构     │ PR 管理        │
│ 分析数据       │ Issue 管理     │
```

适合：日常开发，快速上手

#### 🟡 进阶级（6 个 MCP）

在入门级基础上增加：

```
docker-mcp + sequential-thinking + memory-mcp
│               │                      │
│ 管理容器       │ 复杂架构设计的推理     │ 跨对话记忆项目上下文
│ 查看日志       │ 分步解决方案          │
│ docker compose │                     │
```

适合：完整开发流程

#### 🔴 全栈级（8+ 个 MCP）

在进阶级基础上增加：

```
python-repl + sentry-mcp + brave-search + custom-ruff-mcp
│               │            │               │
│ 执行 Python    │ 错误监控     │ 搜索文档       │ 自动 lint
│ 验证逻辑       │ 性能追踪     │ API 参考      │ 代码格式化
```

适合：生产环境维护和复杂调试

### 3.3 需要谨慎使用的 MCP

| MCP | 风险 | 建议 |
|-----|------|------|
| **Shell/Execute** | 可以执行任意系统命令 | 仅在沙箱环境中使用 |
| **Filesystem（无限制）** | 可能误删文件 | 配置白名单路径，限制在项目目录内 |
| **Database Write** | 可能意外修改数据 | 使用只读数据库用户，或开启事务自动回滚 |

---

## 4. MCP 安装与配置指南

### 4.1 在 Claude Code 中配置 MCP

编辑 `~/.claude/settings.json`，在 `mcpServers` 字段中添加服务配置：

#### PostgreSQL MCP 配置示例

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@localhost:5432/memo_db"
      ]
    }
  }
}
```

#### GitHub MCP 配置示例

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "你的GitHubPersonalAccessToken"
      }
    }
  }
}
```

#### Docker MCP 配置示例

```json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-docker"
      ]
    }
  }
}
```

#### 自定义 Ruff Linter MCP 配置示例

```json
{
  "mcpServers": {
    "ruff-linter": {
      "command": "python",
      "args": [
        "-m",
        "mcp_simple_linter",
        "--tool",
        "ruff",
        "--path",
        "/path/to/your/project"
      ]
    }
  }
}
```

### 4.2 在 Claude Code 交互模式中管理 MCP

```bash
# 列出所有已配置的 MCP 服务
/mcp

# 添加新的 MCP 服务（交互式）
/mcp add

# 测试 MCP 服务是否正常工作
/mcp test <service-name>

# 移除 MCP 服务
/mcp remove <service-name>
```

### 4.3 安装 MCP 服务的通用方式

大部分官方 MCP 服务可以通过 npx 一键运行（自动下载），无需手动安装：

```bash
# 格式：npx -y @modelcontextprotocol/server-<name>
npx -y @modelcontextprotocol/server-postgres <连接字符串>
```

如果网络受限，也可以先全局安装：

```bash
npm install -g @modelcontextprotocol/server-postgres
```

---

## 5. 发现更多 MCP 的资源渠道

### 5.1 汇集网站

| 资源 | 地址 | 说明 |
|------|------|------|
| **Awesome MCP Servers** | [mcp-awesome.com](https://mcp-awesome.com/) | 1200+ MCP 服务汇总 |
| **MCP.so** | [mcp.so](https://mcp.so/) | MCP 服务搜索引擎 |
| **Smithery** | [smithery.ai](https://smithery.ai/) | MCP 服务注册平台，支持一键安装 |
| **PulseMCP** | [pulsemcp.com](https://pulsemcp.com/) | MCP 服务发现和状态监控 |

### 5.2 GitHub 搜索关键词

在 GitHub 上搜索以下关键词可发现更多资源：

- `topic:mcp-server` — MCP 服务
- `topic:claude-code-mcp` — Claude Code 专用 MCP
- `topic:claude-code` — Claude Code 相关工具
- `awesome-mcp` — 各种 MCP 精选列表
- `claude-code-skills` — Claude Code Skills

### 5.3 官方资源

- [MCP 协议规范](https://spec.modelcontextprotocol.io/)
- [官方 MCP 服务器集合](https://github.com/modelcontextprotocol/servers)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)

---

## 附录：快速开始配置模板

以下是一份可直接使用的 `~/.claude/settings.json` 配置模板（根据实际情况替换参数）：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/project"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@localhost:5432/memo_db"
      ]
    },
    "docker": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-docker"
      ]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

> **安全提示**：请勿将包含真实 API Key 和数据库密码的 settings.json 提交到 Git 仓库。建议将密码通过环境变量注入。
