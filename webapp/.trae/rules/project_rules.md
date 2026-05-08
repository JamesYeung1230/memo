# 码上启航 Web 管理端 — 项目开发规则

> 本文档作为项目开发的核心锚点，后续所有开发迭代必须遵循以下规则。
> 锚定文档：[技术可行性分析报告](../docs/技术可行性分析报告.md)、[前端技术开发指导及规范](../docs/前端技术开发指导及规范.md)

> 根规则 [Part A — Git 工作流规范](../../.trae/rules/project_rules.md)、[Part C — Skill 管理规范](../../.trae/rules/project_rules.md#part-c--skill-管理规范)、[Part E — MCP 服务调用规范](../../.trae/rules/project_rules.md#part-e--mcp-服务调用规范)、[Part F — Agent 选用与执行规范](../../.trae/rules/project_rules.md#part-f--agent-选用与执行规范) 全局适用，本文件不重复列出。
> 根规则 [Part D — 规则维护指南](../../.trae/rules/project_rules.md#part-d--规则维护指南) 描述了整体的规则维护规范。

---

## 一、项目锚点

### 1.1 核心定位

| 属性 | 值 |
|------|-----|
| 项目名称 | 码上启航 Web 管理端（CodeSail Admin） |
| 项目类型 | 纯前端 Web 管理后台 SPA |
| 核心价值 | AI驱动内容生产、运营策略灵活配置、AI审核保障安全、数据驱动决策 |

### 1.2 技术栈锚点（不可随意变更）

| 类别 | 技术 | 版本 | 用途 |
|------|------|:----:|------|
| 框架 | **React** | 19.x | 前端 UI 框架 |
| 语言 | **TypeScript** | 5.x | 类型系统 |
| 构建 | **Vite** | 6.x | 开发服务器与打包 |
| UI 库 | **Ant Design** | 5.x | 企业级 UI 组件库 |
| 图标 | **@ant-design/icons** | 5.x | 图标库 |
| 路由 | **React Router** | 7.x | 前端路由 |
| 服务端状态 | **TanStack React Query** | 5.x | API 数据缓存 |
| 客户端状态 | **Zustand** | 5.x | 轻量状态管理 |
| 表单 | **React Hook Form + Zod** | 7.x / 3.x | 表单管理与校验 |
| 图表 | **Apache ECharts + echarts-for-react** | 5.x / 3.x | 数据可视化 |
| 富文本 | **Tiptap** | 2.x | 富文本编辑器 |
| 拖拽 | **@dnd-kit/core + @dnd-kit/sortable** | 1.x | 拖拽排序 |
| HTTP | **Axios** | 1.x | HTTP 客户端 |
| CSS | **Tailwind CSS** | 4.x | 原子化样式 |
| 日期 | **Day.js** | 1.x | 日期处理 |

### 1.3 不推荐的技术（禁止引入）

| 技术 | 替代方案 | 原因 |
|------|---------|------|
| Redux Toolkit | Zustand | 状态复杂度低，Zustand 更轻量 |
| Next.js / SSR | Vite CSR | 管理后台不需要 SEO |
| react-beautiful-dnd | @dnd-kit | 已进入维护模式 |
| Quill / Draft.js | Tiptap | 维护状态不佳 |
| UmiJS | Vite | 太重，Vite 更灵活 |
| Moment.js | Day.js | Day.js 更轻量（2KB） |
| classnames | Tailwind CSS | Tailwind 原生 clsx 支持 |

---

## 二、架构规则

### 2.1 六层架构

强制遵守以下架构分层，下层不可反向依赖上层：

```
应用层 (App)        → Router + AuthGuard + ThemeProvider
页面层 (Pages)      → 路由页面组件（容器组件）
组件层 (Components) → 通用/业务组件（展示组件）
Hooks 层 (Hooks)    → 自定义 Hooks（复用逻辑）
数据层 (API/Store)  → Axios + React Query + Zustand
工具层 (Utils)      → 工具函数
```

### 2.2 Container/Presentational 模式

每个页面组件必须遵循容器-展示分离模式：

- **页面入口文件（`index.tsx`）**：仅做容器组件，负责数据获取和状态管理
- **子组件**：纯展示组件，通过 props 接收数据和事件回调
- **禁止**：页面入口文件直接编写大量 JSX/渲染逻辑

### 2.3 目录结构规则

```
src/
├── api/           # API 请求层（按业务模块拆分）
├── assets/        # 静态资源
├── components/    # 通用业务组件
│   ├── common/    # 通用 UI 组件（ConfirmDelete, StatusBadge, EmptyState, PageHeader, Loading）
│   ├── form/      # 表单组件（RichTextEditor, IconPicker, ImageUploader, PointInput）
│   ├── table/     # 表格组件（SearchableTable, DraggableTable, BatchActions）
│   ├── data/      # 数据展示组件（StatCard, TrendChart, PieChart, FunnelChart）
│   ├── ai/        # AI 相关组件（AIGenerateButton, AIResultPreview, StreamingContent, AIRiskScore）
│   └── layout/    # 布局组件（CardPreview, ThemeToggle）
├── hooks/         # 自定义 Hooks
├── layouts/       # 布局组件（AdminLayout, Sidebar, Header, AuthLayout）
├── pages/         # 页面组件（按模块分目录）
├── router/        # 路由配置
├── stores/        # Zustand Store
├── styles/        # 全局样式
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数
```

---

## 三、代码规范规则

### 3.1 命名规则

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `UserTable.tsx` |
| 文件名（组件） | PascalCase | `RichTextEditor.tsx` |
| 文件名（非组件） | camelCase | `authStore.ts`, `useDebounce.ts` |
| 目录名 | kebab-case | `sensitive-words/`, `card-generator/` |
| 变量/函数 | camelCase | `getUserList()`, `pageSize` |
| 常量 | UPPER_SNAKE_CASE | `MAX_BANNER_COUNT = 5` |
| 类型/接口 | PascalCase | `DomainData`, `ApiResponse<T>` |
| 枚举值 | UPPER_SNAKE_CASE | `MatchMode.Exact` |
| React Hooks | camelCase, use 前缀 | `useAuth`, `useTheme` |
| 事件处理 | handle 前缀 | `handleSubmit` |
| 布尔变量 | is/has/should 前缀 | `isLoading`, `hasError` |

### 3.2 文件组织规则

页面组件文件组织：
```
pages/domains/
├── index.tsx              # 页面入口（容器组件）
├── DomainFormModal.tsx    # 子组件文件
├── DomainTable.tsx
└── DomainDeleteConfirm.tsx
```

### 3.3 导入顺序规则

必须按以下顺序分组导入，每组之间空一行：

```typescript
// 1. 外部库（React 优先，第三方库按字母序）
// 2. 内部模块（按目录层级，从深到浅，字母序）
// 3. 样式文件
```

### 3.4 TypeScript 类型规则

- **interface**：用于定义对象类型
- **type**：用于联合类型/工具类型
- **泛型 API 响应**：统一使用 `ApiResponse<T>` 和 `PaginatedResponse<T>`
- **表单类型**：使用 `Pick` 或 `Partial` 从实体类型派生
- **必填/可选**：明确区分必填和可选字段，避免过度使用可选链

---

## 四、组件开发规则

### 4.1 组件分类与职责

| 分类 | 目录 | 职责 |
|------|------|------|
| 页面组件 | `pages/*/` | 路由映射，数据获取与状态管理 |
| 业务组件 | `components/*/` | 可复用的业务逻辑模块 |
| 通用组件 | `components/common/` | 跨业务场景的 UI 元素 |
| 布局组件 | `layouts/` | 页面框架结构 |

### 4.2 组件设计原则

1. **单一职责**：每个组件只做一件事
2. **组合优于继承**：通过组合 props 和 children 扩展
3. **状态提升**：共享状态提升到最近的公共父组件
4. **接口显式**：所有 props 显式定义类型，避免隐式依赖
5. **纯组件优先**：尽可能做成纯展示组件，容器组件处理数据

### 4.3 Ant Design 组件使用规则

- **Table**：使用 `ColumnsType<T>` 类型安全的列定义，分页、排序、筛选由 React Query 管理
- **Form**：配合 `React Hook Form` + `Controller` 使用，`Zod Schema` 做校验
- **Modal**：包裹 Form 使用，`destroyOnClose` 确保表单状态重置
- **Button**：危险操作用 `danger` 属性，主要操作用 `type="primary"`
- **Upload**：限制文件格式和大小，使用 `beforeUpload` 校验

### 4.4 通用组件签名强制规范

**SearchableTable**：
```typescript
interface SearchableTableProps<T> {
  columns: ColumnsType<T>
  dataSource: T[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number, pageSize: number) => void
  searchPlaceholder?: string
  onSearch?: (keyword: string) => void
  batchActions?: React.ReactNode
  rowSelection?: boolean
  onRowClick?: (record: T) => void
}
```

**ConfirmDelete**（所有删除操作强制使用）：
```typescript
interface ConfirmDeleteProps {
  title: string
  content: string
  confirmText: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  dangerLevel?: 'domain' | 'chapter' | 'card' | 'normal'
}
```

**StatCard**（数据看板强制使用）：
```typescript
interface StatCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  trend?: { value: number; isUp: boolean }
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
}
```

---

## 五、状态管理规则

### 5.1 状态分类与存储

| 状态类型 | 管理方式 | 存储位置 |
|---------|---------|---------|
| 服务端数据 | React Query | 缓存（自动管理） |
| 客户端全局状态 | Zustand + persist | localStorage |
| 组件局部状态 | useState | 组件内 |
| URL 状态 | React Router | URL |

### 5.2 React Query 使用规则

**查询 Key 管理**（统一使用 queryKeys 对象）：
```typescript
export const queryKeys = {
  domains: {
    all: ['domains'] as const,
    list: (params) => ['domains', 'list', params] as const,
    detail: (id) => ['domains', 'detail', id] as const,
  },
}
```

**缓存策略**：
- `staleTime`: 常规数据 5 分钟，频繁更新数据 1 分钟
- `gcTime`: 30 分钟
- `retry`: 2 次
- `refetchOnWindowFocus`: false

**状态更新**：删除/修改操作成功后，使用 `invalidateQueries` 刷新列表

### 5.3 Zustand Store 规则

- **全局 Store 仅限 3 个**：`authStore`（登录态）、`themeStore`（主题）、`uiStore`（UI 状态）
- 必须使用 `persist` 中间件持久化
- `partialize` 控制持久化字段（如只持久化 token 和 username，不持久化 isAuthenticated）

---

## 六、API 集成规则

### 6.1 Axios 配置

- `baseURL`: 使用环境变量 `VITE_API_BASE_URL`，默认 `/api`
- `timeout`: 15000ms
- **请求拦截器**: 自动注入 `Authorization: Bearer {token}`
- **响应拦截器**: 401 自动跳转登录页；统一错误提示

### 6.2 API 模块规范

每个业务模块一个 API 文件，export 命名统一的 `xxxApi` 对象：
```
api/
├── client.ts        # Axios 实例
├── auth.ts          → export const authApi
├── domains.ts       → export const domainApi
├── chapters.ts      → export const chapterApi
├── cards.ts         → export const cardApi
├── questions.ts     → export const questionApi
├── ai.ts            → export const aiApi
├── review.ts        → export const reviewApi
├── sensitive-words.ts → export const sensitiveWordApi
├── points.ts        → export const pointApi
├── banners.ts       → export const bannerApi
├── badges.ts        → export const badgeApi
├── ads.ts           → export const adApi
├── analytics.ts     → export const analyticsApi
├── users.ts         → export const userApi
├── logs.ts          → export const logApi
└── system.ts        → export const systemApi
```

---

## 七、主题与样式规则

### 7.1 品牌色锚点

```
Brand Primary:       #160C57
Brand Primary Light: #2D1A8E
Brand Primary Dark:  #0E0836
Brand Surface:       #F4F2FA
Secondary:           #6366F1
```

所有颜色值使用 CSS 变量（定义在 `theme.css`），禁止在组件文件中硬编码色值。

### 7.2 主题切换规则

- Ant Design 主题：通过 `ConfigProvider` 的 `theme.algorithm` 切换
- 自定义组件：通过 CSS 变量 `[data-theme='dark']` 覆盖
- 状态持久化：localStorage（Zustand persist）
- Ant Design 和自定义组件的主题必须同步切换

### 7.3 Tailwind CSS 使用规则

- Tailwind 仅用于**布局和间距**（flex、grid、padding、margin）
- Ant Design 组件样式通过 ThemeConfig 配置，不用 Tailwind 覆盖
- CSS 变量用于主题色，Tailwind 引用这些变量

---

## 八、AI 工作台开发规则

### 8.1 AI 流式输出

使用 `useAIStream` Hook（基于 `fetch` + `ReadableStream`），必须支持：
- 流式逐 token 渲染
- 用户中断（AbortController）
- 错误处理与重试
- 加载状态展示

### 8.2 AI 生成结果展示

`AIResultPreview` 组件必须支持：
- 逐字段预览和编辑（标题、核心概念、详细说明、生活类比、关键词标签、难度等级）
- 采纳/重新生成/部分采纳操作
- 历史版本切换（保留历史生成记录）

### 8.3 笔记审核组件规则

- 审核队列使用 `SearchableTable`，支持批量操作
- 审核详情页必须展示：笔记全文、AI 风险评分（百分制）、AI 判定理由、敏感词高亮
- 高风险用 `#EF4444`、中风险用 `#F59E0B`、低风险用 `#10B981`

### 8.4 敏感词高亮

敏感词高亮通过正则匹配 + React 节点替换实现，长文本场景考虑使用 Web Worker。

---

## 九、数据看板开发规则

### 9.1 图表封装

所有 ECharts 图表必须封装为可复用组件：
- `TrendChart`：折线趋势图
- `PieChart`：饼图/环形图
- `FunnelChart`：漏斗图（学习行为漏斗）

### 9.2 图表主题自适应

图表颜色必须跟随主题模式切换（深色/浅色），通过 `useThemeStore` 获取当前主题。

### 9.3 性能要求

- 图表使用 `lazyUpdate` + `notMerge` 优化渲染
- 大数据点使用 ECharts 的 `sampling` 功能
- 图表容器使用 `ResizeObserver` 自适应

---

## 十、性能规则

### 10.1 代码分割

- 所有页面组件使用 `React.lazy()` 动态导入
- 富文本编辑器（Tiptap）等重型组件使用组件级懒加载

### 10.2 React.memo 使用场景

纯展示组件（如 `StatCard`、`StatusBadge`）使用 `React.memo` 包裹
容器组件（如页面入口）不使用 `React.memo`

### 10.3 性能指标红线

| 指标 | 上限 |
|------|:----:|
| 首屏加载 | ≤ 2s |
| 列表分页加载（100条） | ≤ 500ms |
| 卡片保存响应 | ≤ 1s |
| AI生成响应 | ≤ 10s（异步任务） |
| 数据看板图表渲染 | ≤ 2s |

---

## 十一、安全规则

### 11.1 XSS 防护

富文本输出必须经过 `DOMPurify.sanitize()` 过滤

### 11.2 敏感操作确认

删除类操作强制三级确认：弹窗确认 → 输入验证 → 结果反馈

### 11.3 日志记录

所有删除类操作完成后必须调用 `logApi.create()` 记录操作日志

### 11.4 Token 管理

- Token 有效期 24 小时
- 过期自动跳转登录页
- 登出时清除本地 Token

---

## 十二、路由规则

### 12.1 路由结构

```
/login                → AuthLayout
/                     → AdminLayout（受 ProtectedRoute 保护）
  /dashboard          → 工作台首页
  /ai/cards           → AI 知识卡片生成
  /ai/questions       → AI 题目生成
  /ai/review          → 笔记审核
  /ai/sensitive-words → 敏感词库
  /content/domains    → 知识领域管理
  /content/chapters   → 知识章节管理
  /content/cards      → 知识卡片管理
  /content/questions  → 题库管理
  /operation/points   → 积分规则
  /operation/unlock   → 解锁消耗
  /operation/homepage → 首页运营（Banner）
  /operation/badges   → 成就徽章
  /operation/ads      → 广告配置
  /operation/review   → 复习默认配置
  /analytics/overview → 核心指标
  /analytics/content  → 内容数据
  /analytics/users    → 用户数据
  /analytics/revenue  → 积分与广告数据
  /users              → 用户列表
  /users/:id          → 用户详情
  /system/password    → 修改密码
  /system/logs        → 操作日志
```

### 12.2 路由守卫

管理后台所有路由（除 `/login` 外）必须通过 `ProtectedRoute` 鉴权

---

## 十三、Git 提交规则

### 13.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 13.2 type 类型

| type | 说明 |
|:----:|------|
| feat | 新功能 |
| fix | Bug 修复 |
| style | 样式变更 |
| refactor | 重构 |
| perf | 性能优化 |
| chore | 工程化/构建 |
| docs | 文档变更 |

### 13.3 scope 范围

| scope | 说明 |
|:-----:|------|
| ai | AI 内容工作台 |
| content | 内容管理 |
| operation | 运营配置 |
| analytics | 数据看板 |
| user | 用户管理 |
| system | 系统管理 |
| layout | 布局 |
| common | 通用组件 |
| config | 工程配置 |

---

## 十四、数据模型（管理端侧）

以下为管理端核心数据实体类型定义规范：

| 实体类型 | 文件 | 关键字段规范 |
|---------|------|------------|
| 通用 API 响应 | `types/api.ts` | `ApiResponse<T> { code, message, data }`、`PaginatedResponse<T> { items, total, page, pageSize, totalPages }` |
| 知识领域 | `types/domain.ts` | `DomainData { id, name, icon, sortOrder, isFree, unlockPoints?, status, createdAt }` |
| 知识章节 | `types/chapter.ts` | `ChapterData { id, domainId, name, sortOrder, status }` |
| 知识卡片 | `types/card.ts` | `CardData { id, chapterId, title, coreConcept, detail(rich text), lifeAnalogy?, tags[], difficulty, status }` |
| 题目 | `types/question.ts` | `QuestionData { id, cardId, stem, options[A-D], correctAnswer, analysis(rich text), status }` |
| Banner | `types/banner.ts` | `BannerData { id, imageUrl, title?, jumpType, jumpPath?, sortOrder, status, startTime?, endTime? }` |
| 敏感词 | `types/sensitive-word.ts` | `SensitiveWordData { id, word, matchMode, status, createdAt }`，匹配模式：`exact | pinyin | homophone | regex` |
| 审核记录 | `types/review.ts` | `ReviewRecord { id, noteId, reviewStatus, reviewResult, aiConfidence, reviewedAt }` |
| 积分规则 | `types/point.ts` | `PointConfig { id, actionType, pointsValue, dailyLimit, updatedAt }` |

---

## 十五、环境变量规则

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | `/api` |
| `VITE_APP_TITLE` | 应用标题 | `码上启航 - 管理后台` |

环境变量文件：`.env.development`、`.env.production`

---

## 十六、强制工作流

### 16.1 每日开发流程

```bash
# 1. 启动前
git pull

# 2. 开发
npm run dev

# 3. 提交前检查
npm run lint
npm run typecheck

# 4. 提交
git add .
git commit -m "feat(scope): 描述"
```

### 16.2 项目文件必读

每次开始新任务前，必须先加载以下文件：
1. [project.md](../../project.md) — 项目总览与当前阶段
2. [.trae/rules/project_rules.md](../../.trae/rules/project_rules.md) — 根规则锚点（Part A Git 工作流 / Part B AI 行为 / Part C Skill 管理 / Part D 维护指南 / Part E MCP 规范 / Part F Agent 选用）

### 16.3 文档锚定

开发过程中如发现与本文档规则不一致的决策，必须：
1. 更新本文档以反映最新决策
2. 确保相关文档（PRD、交互设计、技术可行性分析、前端技术开发指导）同步更新

---

## 十七、Part B 扩展：AI 编程行为规范

> 本文件 §十七 是对根规则 [Part B — AI 编程行为规范](../../.trae/rules/project_rules.md#part-b--ai-编程行为规范) 的 webapp 项目扩展。
> 根规则 Part B 的通用条款（B.1 上下文感知 ~ B.8 任务追踪）同样适用，不重复列出。

### 规则定位

| 维度 | 说明 |
|------|------|
| 所属项目 | webapp |
| 对应根规则 | [Part B — AI 编程行为规范](../../.trae/rules/project_rules.md#part-b--ai-编程行为规范) |
| 基础条款 | B.1 上下文感知 ~ B.8 任务追踪（通用，本文件不重复） |
| 扩展条款 | §17.1 ~ §17.10（本文件定义的 webapp 特定条款） |

### 17.1 上下文感知（webapp 补充）

- Agent 在修改任何文件前，必须先使用 SearchCodebase 或相关搜索工具获取项目上下文
- 了解项目中已有的组件、Hooks、API 模块、工具函数后再进行编码，避免重复造轮子
- 每次任务开始前必须加载以下锚点文档：
  1. [project.md](../../project.md) — 项目总览与当前阶段
  2. [根规则](../../.trae/rules/project_rules.md) — 根规则锚点
  3. [docs/技术可行性分析报告.md](../../docs/技术可行性分析报告.md) — 技术选型决策
  4. [docs/前端技术开发指导及规范.md](../../docs/前端技术开发指导及规范.md) — 前端开发规范

### 17.2 修改验证（webapp 补充）

- 每次修改完成后，必须运行 `npm run lint` 和 `npm run typecheck` 进行验证
- 组件修改后应在浏览器中验证 UI 还原度和交互正确性

### 17.3 依赖管理（webapp 补充）

- 使用新依赖前，先检查 §1.3「不推荐的技术」列表，确认不是被禁止的库
- 新增依赖必须与现有技术栈锚点（React 19、Ant Design 5、Vite 6 等）版本兼容

### 17.4 安全红线（webapp 补充）

- 富文本输出必须经过 `DOMPurify.sanitize()` 过滤（参见 §11.1 XSS 防护）
- 删除类操作强制三级确认（参见 §11.2 敏感操作确认）
- 所有删除类操作完成后必须调用 `logApi.create()` 记录操作日志（参见 §11.3 日志记录）
- Token 管理遵循 §11.4 的规范

### 17.5 文件创建约束（webapp 补充）

- 禁止生成文档类 `.md` 文件（README、CHANGELOG 等），除非用户明确要求
- 优先修改已有文件，而非创建新文件
- 除非绝对必要，否则不要创建新文件

### 17.6 测试覆盖（webapp 补充）

- 每个功能完成或修复后，必须编写或更新对应的测试用例
- UI 组件测试应覆盖不同状态（加载中、空数据、错误、正常）

### 17.7 代码规范遵守

- 严格遵守 §三 代码规范规则的命名规则（PascalCase / camelCase / kebab-case / UPPER_SNAKE_CASE）
- 导入顺序必须遵循 §3.3 的分组规则
- TypeScript 类型定义必须遵循 §3.4 的类型规则
- 容器组件（页面入口）和展示组件（子组件）必须遵循 §2.2 的分离模式

### 17.8 AI Agent 协同

- 前端开发涉及以下场景时可调用对应 Agent 并行工作：
  - `frontend-architect` — 前端开发、UI 实现
  - `ui-designer` — 交互设计、视觉还原
  - `backend-architect` — 后端 API 设计理解
  - `search` — 代码搜索与调研

### 17.9 任务追踪

- 复杂多步骤任务必须使用 TodoWrite 工具创建任务列表并跟踪进度
- 确保长链任务不丢失上下文，每一步都清晰可追踪

### 17.10 不确定时确认

- 遇到不确定的技术选型、架构决策或需求分歧时，使用 AskUserQuestion 与用户确认
- 不要在不确定的情况下「猜」一个方案直接执行
- 当任务描述模糊时，主动向用户澄清具体需求
