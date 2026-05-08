# Memo 项目 Git 提交规范

## 适用范围

以下规则在 Trae IDE 打开 `memo/` 或其下任意子项目（`backend/`、`miniapp/`、`test/`、`webapp/`）时均生效。

## 仓库结构

```
memo/                     # Git 仓库根目录（唯一仓库）
├── .gitignore            # 白名单模式，控制追踪范围
├── README.md             # 全局说明文档
├── backend/              # 后端子项目
├── miniapp/              # 小程序子项目
├── test/                 # 测试子项目
└── webapp/               # Web 应用子项目
```

## 核心规则

### 1. 唯一 Git 仓库
所有 git 操作统一在 `memo/` 根目录下执行，子项目内部不初始化独立的 git 仓库。

### 2. 提交隔离原则
每次提交只包含**一个子项目**的变更，或仅包含根目录文件（`README.md`、`.trae/` 等）的变更。不对其他平级子项目的文件做任何处理。

### 3. 默认提交（Agent 自动行为）
Agent 完成用户指令并修改文件后，**必须默认执行一次本地提交**。无论用户当前打开的是 `memo/` 还是其下任意子项目，本规则均生效。

### 4. 父子目录分离提交
当 memo 根目录文件（`README.md`、`.trae/` 下规则文件等）与子项目文件**同时**存在修改时，**必须拆分为两次独立提交**：

| 顺序 | 提交内容 | 示例命令 |
|------|---------|---------|
| 先提交 | 子项目文件 | `git add <子项目目录>/ && git commit -m "..."` |
| 再提交 | 根目录文件 | `git add README.md .trae/ && git commit -m "..."` |

> 分开提交的目的是让每次 commit 的 scope 清晰明确，避免一个 commit 同时包含 `webapp` 和 `root` 两种 scope。

若仅修改了根目录文件（如更新规则），则只需一次 `docs(root):` 提交。
若仅修改了子项目文件，则只需一次对应 scope 的提交。

**提交命令模板：**

```bash
# 仅子项目
cd /d/workspace/memo
git add <子项目目录>/
git commit -m "<type>(<scope>): <描述>"

# 仅根目录
cd /d/workspace/memo
git add README.md .trae/   # 按实际变更文件添加
git commit -m "<type>(root): <描述>"
```

### 5. 提交信息规范

采用 Conventional Commits 格式：

```
<type>(<scope>): <简短描述>

<详细说明（可选）>
```

- `type`: feat / fix / refactor / style / docs / chore / test
- `scope`: webapp / backend / miniapp / test / root
- 描述使用中文

**示例：**
```
feat(webapp): 新增用户登录页面
fix(backend): 修复接口超时问题
docs(root): 更新项目规则文件
```

### 6. 分支策略
- `develop` — **默认开发分支**，所有 Agent 自动提交和日常开发工作均在 develop 分支上进行
- `master` — **稳定发布分支**，仅从 develop 合并，用于保存经过验证的稳定版本
- Agent 在开始任务前应确认当前在 `develop` 分支，若不在则自动切换

### 7. 禁止事项
- 禁止在单次提交中混入多个子项目的文件变更
- 禁止在一次提交中同时包含根目录文件和子项目文件（必须拆分）
- 禁止提交 `memo/README.md` 和 `.trae/` 以外的根目录文件（`.gitignore` 除外）
- 禁止在子项目内部执行 `git init` 或 `git add` 操作

## .gitignore 说明

采用白名单模式：
1. `/*` — 先忽略根目录下所有内容
2. `!/backend/` `!/miniapp/` `!/test/` `!/webapp/` — 放行四个子项目
3. `!/README.md` — 放行根目录 README
4. 其余规则对已追踪目录内的依赖、构建产物、IDE 配置等进行忽略

## AI 编程注意事项

以下规则适用于 Trae IDE Agent 在执行所有任务时的行为约束：

### 1. 上下文感知
- Agent 在修改任何文件前，必须先使用 SearchCodebase 或相关搜索工具获取项目上下文
- 了解项目中已有的工具函数、组件、库后再进行编码，避免重复造轮子
- 修改代码前，先阅读相邻文件和依赖文件，理解现有代码风格和约定

### 2. 修改验证
- 每次修改完成后，必须运行对应的 lint/typecheck 命令进行验证（如 `npm run lint`、`npm run typecheck`、`ruff` 等）
- 修改涉及的功能应运行相关测试确认不破坏已有逻辑
- 多步骤任务中，每完成一步都应验证后再继续下一步

### 3. 依赖管理
- 禁止引入项目未使用的新依赖（npm包、pip包、gem等），除非用户明确要求
- 使用新依赖前，先检查 `package.json`、`requirements.txt` 或 `Gemfile` 等文件中是否已有替代方案
- 不得使用过时、废弃或不安全的库版本

### 4. 安全红线
- 禁止在代码中硬编码任何密钥、Token、密码或敏感信息
- 禁止生成存在 SQL 注入、XSS、CSRF 等安全漏洞的代码
- 涉及认证、鉴权、支付等敏感功能时，必须使用安全的实现方式

### 5. 文件创建约束
- 禁止生成文档类 `.md` 文件（README、CHANGELOG 等），除非用户明确要求
- 优先修改已有文件，而非创建新文件
- 除非绝对必要，否则不要创建新文件

### 6. 测试覆盖
- 每个功能完成或修复后，必须编写或更新对应的测试用例
- 测试应覆盖正常路径、边界条件和异常场景
- 遵循项目已有的测试框架和规范

### 7. 不确定时确认
- 遇到不确定的技术选型、架构决策或需求分歧时，使用 AskUserQuestion 与用户确认
- 不要在不确定的情况下「猜」一个方案直接执行
- 当任务描述模糊时，主动向用户澄清具体需求

### 8. 任务追踪
- 复杂多步骤任务必须使用 TodoWrite 工具创建任务列表并跟踪进度
- 确保长链任务不丢失上下文，每一步都清晰可追踪
