# Claude Code 使用手册

> 本文档为 Claude Code 的完整使用指南，涵盖所有指令、快捷键、Slash 命令和使用技巧。
> Claude Code 是 Anthropic 推出的命令行 AI 编程助手，运行在终端中，可直接读写文件、执行命令、管理 Git。

---

## 目录

- [1. 启动与基础命令](#1-启动与基础命令)
- [2. 交互模式快捷键](#2-交互模式快捷键)
- [3. Slash 命令](#3-slash-命令)
- [4. CLI 命令行选项](#4-cli-命令行选项)
- [5. 自定义命令](#5-自定义命令)
- [6. Checkpointing（时光倒流）](#6-checkpointing时光倒流)
- [7. 使用技巧与最佳实践](#7-使用技巧与最佳实践)
- [8. 针对 memo/backend 项目的使用建议](#8-针对-memobackend-项目的使用建议)

---

## 1. 启动与基础命令

### 1.1 启动交互式会话

```bash
# 进入项目目录后启动
cd /path/to/project
claude

# 启动并附带初始提示词
claude "帮我分析这个项目的目录结构"

# 以打印模式执行（非交互，执行后退出）
claude -p "解释 src/main.py 的功能"

# 通过管道传入内容
cat error.log | claude -p "分析这些日志中的错误模式"
```

### 1.2 继续和恢复对话

```bash
# 继续最近一次对话
claude --continue
claude -c           # 简写

# 继续对话并添加新消息
claude -c -p "继续完成上次的优化任务"

# 显示历史对话列表并选择恢复
claude --resume
claude -r

# 恢复指定 session
claude -r "<session-id>" "继续这个任务"
```

### 1.3 版本管理

```bash
# 查看版本
claude --version

# 更新到最新版本
claude update
```

---

## 2. 交互模式快捷键

### 2.1 通用控制

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+C` | 取消当前输入或生成 | 中断正在执行的操作 |
| `Ctrl+D` | 退出会话 | 结束当前 Claude Code 会话 |
| `Ctrl+L` | 清除屏幕 | 保留历史记录但清空显示 |
| `Ctrl+O` | 切换详细输出 | 显示更详细的工具调用信息 |
| `Ctrl+R` | 搜索命令历史 | 交互式反向搜索之前的命令 |
| `Ctrl+V` / `Alt+V` | 粘贴剪贴板图片 | 将截图粘贴到对话中 |
| `Ctrl+B` | 后台运行任务 | 将长时间运行的任务放到后台 |
| `Esc` `Esc` | 驳回修改（时光倒流） | 回退代码和对话到之前的状态 |
| `Tab` | 切换扩展思考模式 | 启用/禁用详细思考过程 |
| `Shift+Tab` / `Alt+M` | 切换权限模式 | 在不同工具权限级别间切换 |

### 2.2 多行输入

| 方法 | 说明 |
|------|------|
| `\` + `Enter` | 推荐方式，通用转义换行符 |
| `Option+Enter` | macOS 默认多行输入 |
| `Shift+Enter` | 运行 `/terminal-setup` 后可用 |
| `Ctrl+J` | 以换行符方式输入 |

### 2.3 命令历史导航

- **上/下箭头键**：浏览历史命令
- **Ctrl+R**：交互式搜索历史命令
- 历史记录按项目目录分别保存

---

## 3. Slash 命令

Slash 命令是在交互模式中以 `/` 开头的快捷指令。

### 3.1 内置 Slash 命令

| 命令 | 功能 | 说明 |
|------|------|------|
| `/help` | 显示帮助信息 | 查看所有可用命令 |
| `/clear` | 清除当前对话 | 清空对话开始新的会话 |
| `/compact` | 切换紧凑模式 | 更密集的输出格式 |
| `/config` | 打开配置编辑器 | 管理 settings.json |
| `/cost` | 查看 API 用量和费用 | 当前会话的 Token 消耗统计 |
| `/debug` | 切换调试模式 | 更详细的日志输出 |
| `/model` | 切换模型 | 在不同模型间切换 |
| `/memory` | 查看和管理记忆 | 查看对话的持久记忆 |
| `/plan` | 切换规划模式 | 开启战略性任务规划 |
| `/permissions` | 管理工具权限 | 控制 Claude Code 能使用哪些工具 |
| `/quit` | 退出 Claude Code | 结束当前会话 |
| `/reset` | 重置配置 | 恢复到默认设置 |
| `/resume` | 恢复历史对话 | 列出并选择之前的会话 |
| `/save` | 保存当前对话 | 将对话保存到本地 |
| `/status` | 查看会话状态 | 当前 session 的信息和设置 |
| `/system` | 查看或修改 System Prompt | 自定义系统提示词 |
| `/task` | 创建和管理任务 | 多步骤任务规划 |
| `/tools` | 列出可用工具 | 查看当前可用的工具及其状态 |
| `/version` | 显示版本信息 | Claude Code 版本号 |
| `/hooks` | 管理生命周期钩子 | 自动化工作流钩子管理 |
| `/mcp` | 管理 MCP 连接 | 添加/移除 MCP 服务器 |
| `/agents` | 管理子 Agent | 创建、编辑和管理子代理 |
| `/plugin` | 管理插件 | 安装/卸载插件 |
| `/skills` | 管理技能 | 查看和切换可用 Skill |

### 3.2 常用 Slash 命令详解

#### `/model` — 切换模型

```bash
# 在交互模式中切换模型
/model          # 进入模型选择界面
/model opus     # 直接切换到 Opus 模型
/model sonnet   # 切换到 Sonnet
/model haiku    # 切换到 Haiku
```

#### `/permissions` — 权限控制

```bash
# 查看和修改工具权限
/permissions              # 打开权限管理界面
/permissions read-only    # 切换到只读模式（安全浏览代码）
/permissions full         # 切换到完全控制模式
```

#### `/agents` — 子 Agent 管理

```bash
# 创建和管理子 Agent
/agents                   # 打开 Agent 管理界面
/agents create "test-agent" "专门负责编写测试的 Agent"
```

---

## 4. CLI 命令行选项

### 4.1 全部选项一览

| 选项 | 简写 | 说明 |
|------|------|------|
| `--help` | | 显示帮助信息 |
| `--version` | | 显示版本号 |
| `--print` | `-p` | 打印模式，执行后立即退出 |
| `--continue` | `-c` | 继续最近的对话 |
| `--resume` | `-r` | 恢复历史对话 |
| `--model` | `-m` | 指定使用的模型 |
| `--output-style` | `-o` | 指定输出风格 |
| `--permission` | | 设置权限模式 |
| `--allow-writes` | | 允许写入文件 |
| `--verbose` | `-v` | 详细输出模式 |
| `--config` | | 指定配置文件路径 |
| `--no-check` | | 跳过更新检查 |
| `--headless` | | 无头模式（适合 CI/CD） |

### 4.2 实用组合示例

```bash
# 直接执行一次性任务
claude -p "将这个项目中的所有 print 替换为 logger.info"

# 配合管道处理文本
git diff --cached | claude -p "为这些变更生成提交信息"

# CI/CD 中使用无头模式
claude --headless --allow-writes -p "运行测试并修复失败的用例"
```

---

## 5. 自定义命令

### 5.1 创建位置

| 类型 | 路径 | 作用范围 | 优先级 |
|------|------|---------|:------:|
| 项目级 | `.claude/commands/` | 当前项目 | 最高 |
| 用户级 | `~/.claude/commands/` | 所有项目 | 中等 |

### 5.2 命令文件格式

命令文件是 Markdown 文件，文件名即命令名。例如创建 `.claude/commands/test.md`，就可以用 `/test` 调用。

**基本示例**：`.claude/commands/test.md`

```markdown
---
description: 运行项目测试
allowed-tools: Bash
---

运行项目的测试套件：

`!pytest -v`

报告测试结果和失败详情。
```

**带参数的命令**：`.claude/commands/fix.md`

```markdown
---
description: 修复指定 .md 文件
argument-hint: file-path
---

分析并修复文件: $1

1. 读取 @$1 的内容
2. 检查格式和拼写问题
3. 修复发现的问题
```

**针对本项目（memo/backend）的自定义命令推荐**：

`.claude/commands/lint.md`

```markdown
---
description: 运行 ruff 代码检查
allowed-tools: Bash
---

运行 ruff 检查和格式化：

`!ruff check --fix .`

`!ruff format .`
```

`.claude/commands/dcup.md`

```markdown
---
description: 启动 Docker Compose 服务
---

`!docker compose up -d`

等待所有服务健康检查通过后，确认服务状态。
```

### 5.3 命令文件语法说明

| 语法 | 作用 | 示例 |
|------|------|------|
| `$ARGUMENTS` | 所有参数 | `搜索: $ARGUMENTS` |
| `$1`, `$2`, ... | 位置参数 | `分析文件: $1` |
| `` !`cmd` `` | 执行 bash 命令 | `` !`npm test` `` |
| `@file` | 引用文件内容 | `@src/main.py` |

---

## 6. Checkpointing（时光倒流）

### 6.1 工作原理

Claude Code 在每次修改代码前自动创建 Checkpoint（检查点），记录代码的快照状态。这意味着你可以：

- **大胆尝试**：不用担心改坏代码
- **随时回退**：一键回到修改前的状态
- **安全实验**：探索不同的实现方案

### 6.2 操作方式

```bash
# 方式一：快捷键（最常用）
按 Esc Esc    # 快速驳回最近一次修改

# 方式二：对话中撤销
输入 "撤销刚才的修改" 或 "回退到上一个检查点"
```

### 6.3 工作流示例

```
1. 你让 Claude Code 重构一个函数
2. Claude Code 自动创建 Checkpoint A（保存当前代码）
3. Claude Code 开始修改代码
4. 修改结果不满意 → 按 Esc Esc，立即回到 Checkpoint A
5. 再次提出不同的修改方案 → Claude Code 创建 Checkpoint B
6. 依然不满意 → 按 Esc Esc 回退
```

---

## 7. 使用技巧与最佳实践

### 7.1 高效对话技巧

| 技巧 | 说明 | 示例 |
|------|------|------|
| **明确项目上下文** | 先让 Claude 了解项目结构 | "这是一个 FastAPI + PostgreSQL 的后端项目" |
| **分步推进** | 复杂任务拆成多步对话 | 先"分析结构"，再"实现接口"，再"编写测试" |
| **指定文件路径** | 避免 Claude 去猜文件位置 | "修改 services/core/main.py 中的路由" |
| **使用 @ 引用文件** | 让 Claude 精确读取指定文件 | "请优化 @app/main.py 中的性能问题" |
| **用 /plan 先规划** | 复杂改动先出计划再执行 | "/plan 然后说我要添加用户注册功能" |

### 7.2 Bug 修复技巧

```bash
# 先让 Claude 复现和理解问题
claude -p "分析 test_api.py 中失败的测试用例"

# 然后让 Claude 修复并验证
claude -c -p "修复刚才发现的 bug，然后运行测试确认"
```

### 7.3 代码审查技巧

```bash
# 审查未提交的变更
git diff | claude -p "审查这些代码变更，指出潜在问题"

# 审查特定文件
claude -p "对 @services/core/routers/user.py 做代码审查，关注安全性和性能"
```

### 7.4 利用输出风格

Claude Code 支持多种输出风格，可在设置中配置：

| 风格 | 特点 | 适用场景 |
|------|------|---------|
| `auto` | 自动选择 | 大部分场景 |
| `concise` | 简洁输出 | 快速问答、简单任务 |
| `detailed` | 详细解释 | 复杂逻辑、学习场景 |
| `markdown` | Markdown 格式化 | 生成文档 |

```bash
# 启动时指定输出风格
claude -o concise "这个函数是做什么的？"
```

### 7.5 高效调试工作流

```
1. 发现问题 → claude "帮我调试这个错误"
2. Claude 分析日志/代码 → 定位根因
3. 提出修复方案 → Claude 修改代码
4. 按 Esc Esc 可回退 → 如果修复不对
5. 验证通过 → 继续下一步
```

### 7.6 内存管理

Claude Code 支持持久化记忆，可以在对话之间保留关键信息：

```bash
# 在对话中
/memory add "项目使用 FastAPI + PostgreSQL + Redis"
/memory add "项目有 3 个微服务: Auth, Core, Knowledge"
/memory list    # 查看所有记忆
/memory delete  # 删除指定记忆
```

---

## 8. 针对 memo/backend 项目的使用建议

结合本项目的特点，推荐以下使用方式：

### 8.1 快速启动

```bash
# 进入项目目录
cd d:\workspace\memo/backend

# 启动 Claude Code
claude
```

### 8.2 常用 Prompt 模板

**理解项目结构**：
```
请分析这个项目的整体结构，包括：
1. 有哪几个服务，各自的职责
2. 技术栈和关键依赖
3. 项目当前所处的开发阶段
```

**新增 API 接口**：
```
在 core 服务的某个路由文件中，新增一个 {接口描述} 的 API。
需要：
1. 定义 Pydantic 请求/响应模型
2. 实现路由函数
3. 调用 knowledge 服务的内部 API
4. 添加错误处理
```

**编写测试**：
```
为 @services/{service_name}/{module_path} 编写 pytest 测试用例。
覆盖正常路径、边界条件和异常场景。
```

**调试问题**：
```
运行测试时出现以下错误：{错误信息}
请分析原因并修复。
```

### 8.3 推荐自定义命令配置

在项目根目录创建 `.claude/commands/` 目录，添加以下命令文件：

- `/lint` — 运行 ruff 检查和格式化
- `/test` — 运行 pytest 测试
- `/dcup` — 启动 Docker Compose
- `/dcdown` — 停止 Docker Compose
- `/alembic` — 生成数据库迁移
