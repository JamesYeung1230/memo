---
alwaysApply: true
---

# 码上启航 (CodeSail) — 项目专属规则

> 本文件是对 [core-rules.md](core-rules.md) 通用规则的**项目专属延伸与补充**。
> 当本文件与 core-rules.md 冲突时，**以本文件为准**（参见 core-rules G.1）。
> core-rules 中未在本文件提及的条款，以 core-rules 原条款为准。
> 纯前端项目约束、Git / README 维护等全局性规则参见 [project.md](../../project.md#强制要求)。

---

## 规则定位

| 维度 | 说明 |
|------|------|
| 所属项目 | 码上启航 (CodeSail) — 微信小程序 |
| 对应通用规则 | [core-rules.md](core-rules.md)（Part A ~ Part G） |
| 扩展方式 | 按核心规则的 Part 对应延伸项目专属条款，编号前缀 `P` 以示区分 |
| 技术栈背景 | 微信原生框架 + Skyline 渲染引擎 + glass-easel 组件框架 |

---

## Part A 延伸 — AI 行为准则

> 对应 core-rules §Part A。以下条款为该项目的小程序特定补充。

### PA.1 渐进行为：小程序能力分层

使用微信 API 时应优先选择不依赖用户授权的能力，避免一次性索取过多权限：

```
L1：无需授权的 API（本地存储、界面交互）
L2：需用户主动触发的一次性授权（相册、剪贴板）
L3：需持续授权的 API（位置、后台数据）
```

每层不可行时，向用户说明原因后再进入下一层。

### PA.2 页面交互状态全覆盖

每个页面必须完整覆盖四种交互状态，不得遗漏：

| 状态 | 触发条件 | 处理要求 |
|------|---------|---------|
| **加载中** | 数据请求 / 计算中 | 必须有 loading 指示器 |
| **空数据** | 列表为空 / 无记录 | 空状态插图 + 引导文案 + 行动按钮 |
| **错误** | 网络异常 / 逻辑异常 | 错误提示 + 重试入口 |
| **正常** | 数据就绪 | 正常内容展示 |

首次进入特定功能时的状态（如首次进入笔记的风险告知弹窗）属于空/初始状态的特化，需同样覆盖。

### PA.3 知识内容数据真实性

本项目包含 K01~K07 七大知识领域的教学内容，生成或模拟知识数据时：
- 知识卡片内容必须基于真实计算机科学概念，不得杜撰术语
- 单选题的正确答案必须真实准确，干扰项需合理（不能是明显荒谬的选项）
- 不得将 AI 推测的内容标记为确定事实

### PA.4 修改验证（小程序补充）

- 每次代码修改完成后，必须运行 `npm run lint` 进行 ESLint 验证
- WXML / WXSS 修改后应确保在不同屏幕尺寸（375px ~ 414px 逻辑宽度）下布局正常
- 涉及 Skyline 特有组件或 glass-easel 特性的修改，需确认基础库版本兼容范围（sdkVersionBegin: 3.0.0）

---

## Part B 延伸 — 安全基线

> 对应 core-rules §Part B。微信小程序端安全红线。

### PB.1 敏感信息绝对禁止（小程序强化）

以下信息**严禁**出现在小程序端任何代码中：
- API Key / Secret / Token
- 数据库连接信息
- 加密盐值
- 微信 AppSecret

### PB.2 用户隐私最小化

- 仅在小程序功能必需的范围内请求用户数据
- 笔记默认仅存储于本地（`wx.setStorageSync` 系列），不上传服务端
- 用户主动「提交审核」时，仅上传笔记内容，不上传用户其他本地数据
- 禁止读取与本功能无关的微信用户信息（如通讯录、运动数据等）

### PB.3 用户输入安全

- 笔记标题、内容等用户输入在展示前必须做 XSS 过滤（微信 WXML 的数据绑定自带 HTML 转义，仍需注意 rich-text 组件的使用场景）
- 搜索关键词需做长度和特殊字符校验

### PB.4 网络请求安全

- 所有网络请求必须使用 HTTPS
- 请求超时需设置合理的 timeout 值
- 网络异常时不得静默失败，需给用户明确反馈

---

## Part C 延伸 — 代码质量

> 对应 core-rules §Part C。

### PC.1 页面文件结构约定

每个页面目录必须包含四个文件，按职责划分：

```
pages/<page-name>/
├── <page-name>.js      # 页面逻辑：数据、事件处理、生命周期
├── <page-name>.json    # 页面配置：组件注册、窗口样式
├── <page-name>.wxml    # 页面模板：Skyline 兼容的 WXML 结构
└── <page-name>.wxss    # 页面样式：仅本页面样式
```

### PC.2 组件目录规范

公共组件放在 `components/` 下，每个组件一个目录：

```
components/
└── <component-name>/
    ├── <component-name>.js
    ├── <component-name>.json
    ├── <component-name>.wxml
    └── <component-name>.wxss
```

页面私有组件放在该页面目录下的 `components/` 子目录。

### PC.3 数据流约定

```
全局状态  → app.js  globalData（最小化使用）
页面状态  → Page data / Component data
持久化    → wx.setStorageSync / wx.getStorageSync
远程数据  → 通过统一的 request 工具函数调用
```

### PC.4 设计 Token 禁止硬编码

以下设计值必须从全局样式变量或管理端配置中获取，禁止在页面/组件 WXSS 中硬编码色值：

| Token 类别 | 获取方式 | 示例 |
|-----------|---------|------|
| 主题色 | 管理端下发，通过 app.globalData 获取 | 品牌主色、强调色 |
| 圆角 | 全局 WXSS 变量 | 30px（大圆角） |
| 描边 | 全局 WXSS 变量 | 8px |

默认品牌主色 `#4A90D9` 仅在管理端配置未下发时作为兜底使用。

### PC.5 Skyline / glass-easel 兼容性

- Skyline 不支持部分 Web 标准 CSS 属性（如 `::before`/`::after` 伪元素），编写 WXSS 时需查阅 Skyline CSS 支持列表
- glass-easel 组件框架下，组件生命周期与旧版 Component 构造器有差异，使用前需确认 API 签名
- `defaultDisplayBlock: true` 已在 app.json 启用——默认 display 为 block

### PC.6 已有组件复用

当前项目已有的公共组件：
- `components/navigation-bar/` — 自定义导航栏

新增页面必须优先复用已有组件，创建新组件前先评估是否可通过已有组件扩展满足需求。

---

## Part D 延伸 — 环境与配置

> 对应 core-rules §Part D。

### PD.1 小程序环境分离

| 环境 | 用途 | 区别 |
|------|------|------|
| development | 本地开发 / 微信开发者工具 | 使用测试 AppID，日志全开 |
| production | 正式版小程序 | 使用正式 AppID，关闭调试日志 |

环境差异通过 `project.config.json` 中的 `appid` 和条件编译管理，不通过代码分支切换。

### PD.2 配置外部化（小程序适用）

- 可变参数（如 API 地址、广告位 ID、解锁积分配置）应放在统一的配置文件或从管理端获取，不硬编码在页面逻辑中
- 主题色、Banner、模块排序等运营配置从管理端下发，客户端实时生效

---

## Part E 延伸 — Token 开销优化

> 对应 core-rules §Part E。

### PE.1 设计文件读取策略

本项目的 Pixso 设计文件位于 `designs/CodeSail.pen`：
- 优先使用 `snapshot_layout` 检查布局结构，而非 `get_screenshot`
- `batch_get` 从 `readDepth: 1` 开始，按需逐层加深
- 获取组件列表时设置 `searchDepth` 控制范围

### PE.2 项目文档读取优先级

```
第一层（定位）：SearchCodebase / Grep → 定位 PRD/交互设计/技术方案中的关键信息
第二层（局读）：Read 文档指定章节（如 PRD §2.1 笔记管理）→ 获取局部详规
第三层（全读）：仅当需要全局理解时全读 project.md 或 PRD.md
```

---

## Part F 延伸 — Agent / Skill 使用

> 对应 core-rules §Part F。

### PF.1 本项目可用 Agent 及推荐场景

| Agent | 本项目推荐使用场景 |
|-------|------------------|
| `frontend-architect` | 小程序页面/组件开发、WXML/WXSS/JS 实现 |
| `ui-designer` | 设计稿还原、UI 组件设计 |
| `search` | 跨模块代码搜索、PRD 条款查找 |

### PF.2 Agent 协同策略

当任务可拆分为多个独立子任务时，并行调用多个 Agent：
- 例如：首页 UI 实现（`ui-designer`） + 首页 JS 逻辑（`frontend-architect`）可并行
- 例如：笔记列表页面开发 + 积分页面开发可并行

并行任务需注意：**不得编辑同一个文件**，否则会产生冲突。

### PF.3 `ui-ux-pro-max` Skill 使用

本项目的设计规范数据存放于 `.trae/skills/ui-ux-pro-max/`，设计决策前可查询该 Skill 获取 UI/UX 最佳实践参考。

---

## 业务规则引用

> 以下业务规则的权威定义见 [project.md](../../project.md) 对应章节，此处仅做索引。
> **开发相关功能前必须查阅对应 source of truth 章节，不得仅凭本索引实现。**

| 业务模块 | project.md 章节 | PRD 章节 |
|---------|---------------|:------:|
| 笔记管理 | [§笔记业务关键约束](../../project.md#笔记业务关键约束) | §2.1 |
| 知识学习 | [§知识内容体系](../../project.md#知识内容体系) | §2.2 |
| 记忆强化 | [§记忆强化配置](../../project.md#记忆强化配置) | §2.3 |
| 积分体系 | [§积分体系详情](../../project.md#积分体系详情) | §2.4 |
| 首页个性化 | [§核心功能模块 - 首页个性化](../../project.md#核心功能模块) | §2.5 |
| 盈利模式 | [§盈利模式](../../project.md#盈利模式) | §3 |

---

## Git 提交规范

> 详见 [project.md §强制要求](../../project.md#强制要求) 第 4~6 条。
>
> 要点：每次修改完成后提交本地仓库并写清晰 commit message；禁止推送到远程；结构变更时同步更新 README。
