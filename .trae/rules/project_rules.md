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
