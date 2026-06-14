# Skill Routing 全局配置设计

日期：2026-06-14 | 状态：已实施

## 问题

- 用户安装了 superpowers 插件和 65 个 gstack skills，但感觉使用过程中没有生效
- 根因：skills 通过 `using-superpowers` 告知模型检查并使用 skills，但这是建议性指令，模型未可靠执行
- 用户习惯直接描述需求（如 "帮我写一个页面"），而非手动输入 `/skill-name`

## 方案

将 skill 触发规则写入 CLAUDE.md（最高优先级），从"建议"变成"硬规则"。

### 架构

```
~/.claude/CLAUDE.md（全局，新建）    ← 通用规则 + Skill Routing
    │
    ├── D:\workspace\CLAUDE.md       ← workspace 结构 + 项目特定约束
    └── D:\workspace\memo\CLAUDE.md  ← memo 项目特定约束（引用全局）
```

### 规则分层

1. 项目级 CLAUDE.md 硬约束（最高）
2. 全局 CLAUDE.md Skill Routing（次高，覆盖系统默认）
3. Skills 自身规则
4. 系统默认（最低）

### 规则迁移

从项目 CLAUDE.md 迁移到全局：
- 模型选择策略
- Git 规则（本地提交、禁止推送、Conventional Commits）
- 并行子代理默认
- 意图确认

项目文件保留的独有规则：
- workspace：模块边界、上下文加载
- memo：Module Isolation、Design Conflicts、Milestone Update、pre-commit checklist

### Skill Routing 表

流程类（按顺序）：brainstorming → writing-plans → executing-plans → verification-before-completion / finishing-a-development-branch

场景类：TDD、调试、代码审查、并行分发、Git worktree

## 修改清单

| 文件 | 操作 | 内容 |
|------|------|------|
| `~/.claude/CLAUDE.md` | 新建 | 全局规则 + Skill Routing |
| `D:\workspace\CLAUDE.md` | 删除 4 段 | Model Selection、Git Rules、Parallel、Intent |
| `D:\workspace\memo\CLAUDE.md` | 替换 2 段 | Model Selection→引用全局；Git Rules→保留项目特定 |

## 验证方法

- 新会话中直接描述需求（如 "帮我修复一个 bug"），观察 Claude 是否自动触发 `systematic-debugging`
- 输入 `/superpowers:brainstorming` 确认 skill 可正常加载
