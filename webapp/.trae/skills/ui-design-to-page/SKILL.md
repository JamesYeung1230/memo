---
name: "ui-design-to-page"
description: "从 Pencil MCP 设计稿获取 UI 设计数据，对照交互文档，按项目架构（Container/Presentational + React Query + Mock API）实现完整管理后台页面。Invoke when building new pages from Pencil design files."
---

# UI Design to Page

将 Pencil 设计稿中的页面设计转化为可运行的前端页面代码。

## 适用场景

- 需要从 `.pen` 设计文件中提取页面布局和组件结构
- 需要对照交互设计文档或 PRD 确认页面功能
- 需要按照项目架构规范（六层架构、Container/Presentational 模式）实现页面
- API 尚未就绪，需用 Mock 数据占位

## 前置要求

- Pencil MCP 服务可用（检查 `get_editor_state`）
- `.pen` 设计文件已打开
- 项目路由、布局、通用组件已就绪

## 工作流

### Step 1 — 加载项目锚点

```markdown
- 加载 project.md：了解当前阶段和 sprint 目标
- 加载 project_rules.md：确认架构规则和代码规范
- 检查 docs/ 下的交互设计文档（如有）
```

### Step 2 — 获取 UI 设计数据

使用 Pencil MCP 搜索目标页面：

```
batch_get → 按名称搜索页面 frame（如 "工作台"、"Dashboard"）
            readDepth=3, searchDepth=5
            获取 page frame 的完整子节点
```

关键数据提取：

| 设计元素 | 提取内容 |
|---------|---------|
| 页面标题 | `content`、`fontSize`、`fontWeight` |
| 统计卡片 | 标题、数值、颜色、图标 |
| 操作入口 | 图标、标签、路径 |
| 表格/列表 | 列标题、数据行、操作区域 |

### Step 3 — 调研现有代码

并行检查以下模块，避免重复造轮子：

```
src/api/          → 是否已有对应 API 文件
src/components/   → 现有通用组件（StatCard, DataTable, PageHeader 等）
src/types/        → 现有类型定义
src/stores/       → 现有状态管理
src/routes/       → 路由路径常量
```

### Step 4 — 创建 API / Mock 数据层

参照现有 API 文件模式（如 `api/auth.ts`）：

- 在 `src/api/` 下创建业务模块 API 文件
- 导出接口类型定义
- Mock 数据使用 `delay` 模拟网络延迟
- 数据量合适（指标卡 3~5 个，表格 5~7 行）
- 数据值保持一致性（如 UI 稿中的值）

### Step 5 — 实现展示组件（Presentational）

按 UI 稿分区创建子组件：

```
pages/<page-name>/
├── index.tsx              # 容器组件（数据获取+组合）
├── <Section1>.tsx         # 展示组件
├── <Section2>.tsx         # 展示组件
└── <Section3>.tsx         # 展示组件
```

展示组件规范：

- 使用 `memo` 包裹纯展示组件
- Props 接口：`data?: T` + `loading: boolean`
- 使用 Ant Design 组件（Card, Table, Skeleton 等）
- 使用 Tailwind CSS 布局（grid, flex, gap）
- 颜色从 Tailwind theme 变量引用
- 加载态使用 Ant Design `Skeleton`

### Step 6 — 实现容器组件（Container）

页面入口 `index.tsx`：

- 使用 `React Query` 管理数据请求
- 每个独立数据源一个 `useQuery`
- 传递 data / loading 给子组件
- 保持 JSX 简洁：标题 + 子组件序列

### Step 7 — 验证

```bash
npm run lint
npx tsc --noEmit
```

确认无错误后完成任务。

## 通用原则

- **优先使用现有通用组件**（StatCard, DataTable, PageHeader, StatusBadge 等）
- **不创建不必要的新文件**，优先修改已有文件
- **不引入新依赖**，使用技术栈锚点中的库
- **严格遵循命名规范**：PascalCase 组件、camelCase 文件、kebab-case 目录
- **API 签名保持一致**：返回 `ApiResponse<T>` 或 `PaginatedResponse<T>`
- **Mock 数据贴近设计稿**：数值、颜色、图标尽量还原
