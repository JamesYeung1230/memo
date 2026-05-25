---
name: "design-to-page"
description: "从 Pencil 设计稿(.pen)到微信小程序页面的 1:1 还原工作流。读取设计稿节点结构，复用组件库组件，精确还原尺寸/颜色/间距。Invoke when user requests '还原页面' or '依据设计稿实现页面'."
---

# Design to Page — Pencil 设计稿 1:1 页面还原

将 Pencil 设计文件（`.pen`）中的页面设计一比一还原为微信小程序页面。

## 工作流概览

```
读取设计稿 → 分析结构与样式 → 检查项目组件库 → 创建/更新页面文件 → 验证
```

---

## Step 1 — 打开设计文件

通过 Pencil MCP 打开 `.pen` 文件：

```
pencil-server_open_document({ path: "designs/<project>.pen" })
```

然后用 `get_editor_state` 获取顶层节点列表，找到目标页面 frame（如 "00-登录页"）：

```
pencil-server_get_editor_state({ include_schema: true })
```

🔄 **输出：** 顶层 frame 列表，包含目标页面 ID

> **Token 优化 (PE.1)：** 优先用 `snapshot_layout` 查看目标 frame 布局结构，只在需要色彩/字体验证时才用 `get_screenshot`（截图 = base64，Token 极高）。

---

## Step 2 — 读取设计节点

按 Token 分层策略读取设计信息：

```
第一层（粗读）：batch_get 低深度 — 了解结构轮廓
第二层（精读）：batch_get 逐层加深 — 获取精确尺寸/颜色
第三层（验证）：snapshot_layout / get_screenshot — 确认布局/视觉
```

### 第一层：粗读整体结构

```
pencil-server_batch_get({
  filePath: "designs/<project>.pen",
  nodeIds: ["<target_frame_id>"],
  readDepth: 1,
  resolveInstances: true,
  resolveVariables: true
})
```

### 第二层：精确读取组件引用

如设计中有 `ref` 类型节点（组件实例），需同时读取组件库以做复用决策：

```
pencil-server_batch_get({
  filePath: "designs/<project>.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
  searchDepth: 3
})
```

### 第三层：逐层加深（仅当信息不足时）

```
pencil-server_batch_get({
  filePath: "designs/<project>.pen",
  nodeIds: ["<target_frame_id>"],
  readDepth: 3,
  resolveInstances: true,
  resolveVariables: true
})
```

**参数说明：**

| 参数 | 值 | 作用 |
|------|-----|------|
| `readDepth` | 1→2→3 | 从浅入深，避免一次拉取大量数据 |
| `searchDepth` | 3 | 搜索组件时限制深度 |
| `resolveInstances` | true | 展开组件实例，看到实际内容 |
| `resolveVariables` | true | 解析变量引用，拿到真实色值/数值 |

🔄 **输出：** 页面完整结构树，包含：
- 容器属性（`layout`, `gap`, `padding`, `fill`）
- 子节点类型（`frame`, `text`, `ref`）
- 文本内容、字号、字重、颜色
- frame 宽高、圆角、背景色

---

## Step 3 — 分析设计信息，建立映射表

从设计节点中提取关键属性，建立 **设计 → 代码** 映射：

### 3.1 尺寸转换

```
设计稿 1px = 小程序 2rpx
```

| 设计稿 (px) | 小程序 (rpx) |
|:----------:|:-----------:|
| 100 × 100 | 200 × 200 |
| 240 × 48  | 480 × 96  |
| 24px 圆角  | 48rpx      |
| 16px padding | 32rpx     |
| 14px font  | 28rpx      |
| 12px font  | 24rpx      |

### 3.2 色值映射

优先映射到项目的 CSS 变量（定义在 `app.wxss`）：

| 设计色值 | CSS 变量 |
|---------|---------|
| `#4A90D9` | `--color-primary` |
| `#7AB8F5` | `--color-primary-light` |
| `#1E293B` | `--color-text-primary` |
| `#64748B` | `--color-text-secondary` |
| `#94A3B8` | `--color-text-hint` |
| `#F5F6FA` | `--color-bg-page` |
| `#FFFFFF` | `--color-text-on-primary` |

### 3.3 组件复用检查

扫描 `components/` 目录，判断设计元素能否复用已有组件：

| 设计元素 | 可复用组件 | 说明 |
|---------|-----------|------|
| 按钮 (圆角全宽) | `components/button/button` | 通过 `type`/`size` 属性定制 |
| TabBar | `components/tab-bar/tab-bar` | 直接引入 |
| 导航栏 | `components/navigation-bar/navigation-bar` | 带返回/标题功能 |
| 知识卡片 | `components/knowledge-card/knowledge-card` | 学习模块复用 |

🔄 **输出：** 设计分析清单（尺寸、色值、组件复用决策）

---

## Step 4 — 读取项目上下文

读取关键项目文件，确保代码风格一致：

```
Read app.json       → 页面注册、窗口配置、渲染引擎
Read app.wxss       → CSS 变量定义
Read app.js         → 全局数据、登录态管理
Read <page>.json    → 现有页面配置模式
Read <page>.wxss    → 现有页面样式模式（使用 "--space-*" / "--font-*" 等变量）
Read <page>.wxml    → 现有页面模板模式（scroll-view + page-content 结构）
```

---

## Step 5 — 创建/更新页面文件

按项目约定创建四个文件：

### 5.1 `pages/<page>/<page>.json`

注册组件：

```json
{
  "usingComponents": {
    "btn": "/components/button/button"
  }
}
```

### 5.2 `pages/<page>/<page>.wxml`

模板结构遵循项目约定：

- 使用 `<scroll-view class="page-scroll" scroll-y type="list">` 作为外层
- 内部用 flex 布局居中/分布子元素
- 引用组件时传递 `type`, `size`, `text` 等属性
- 自定义导航模式下（`"navigationStyle": "custom"`），参考 `custom-status-bar` Skill 处理状态栏留白，**不要**将设计稿中的占位时间/电量图标硬编码到页面中

设计稿还原要点：

| 设计元素 | WXML 映射 |
|---------|----------|
| frame (容器) | `<view>` |
| text | `<text>` |
| ref (组件实例) | 组件标签 `<btn>` / `<tab-bar>` |
| 带背景的 frame | `<view class="xxx">` + CSS `background-color` |

### 5.3 `pages/<page>/<page>.wxss`

样式规则：

1. `.page-scroll` 占满视口
2. 外层容器 `min-height: 100vh` + flex 垂直居中
3. **px → rpx 转换**（设计稿 1px = 小程序 2rpx）
4. 色值优先使用 CSS 变量，设计稿兜底
5. 字号优先使用 `--font-*` 变量，需精确匹配时才用硬编码值
6. 间距优先使用 `--space-*` 变量
7. 组件覆盖：通过父级选择器 `.wrapper .btn.btn--lg` 覆盖组件默认尺寸

### 5.4 `pages/<page>/<page>.js`

最小逻辑：

- `Page({ data: {}, onLoad() {}, onShow() {} })` 骨架
- 交互方法（如 `handleLogin`）按需添加
- 调用 `wx.showLoading` + `setTimeout` 模拟异步（开发阶段）

---

## Step 6 — 验证

1. 运行 `GetDiagnostics` 检查 JS 文件
2. 确认 WXSS 选择器覆盖正确（组件内部样式优先级）
3. 确认所有设计元素已覆盖（无遗漏）

---

## 完整案例：00-登录页还原

### 设计稿结构

```
00-登录页 (375×812, #F5F6FA)
├── logoBox (100×100, #7AB8F5, 圆角12) → "CS" (白, 24px bold)
├── appTitle → "码上启航 CodeSail" (#1E293B, 18px bold)
├── subtitle1 → "让非开发者掌握编程基础" (#64748B, 14px)
├── subtitle2 → "从而更好地用AI写代码" (#64748B, 14px)
├── loginBtn (240×48, #4A90D9, 圆角24) → "微信一键登录" (白, 14px bold)
└── privacyRow → "登录即表示同意《隐私政策》《用户协议》" (#94A3B8, 12px)
```

### 关键决策点

| 决策 | 选择 | 理由 |
|------|------|------|
| 按钮实现 | 复用 `<btn>` 组件 | 项目中已有，减少重复代码 |
| 按钮尺寸覆盖 | `.btn-wrapper .btn.btn--lg { width: 480rpx; height: 96rpx }` | 组件不支持动态宽高，用父级选择器覆盖 |
| 色值 | `--color-primary-light` 变量 | 与全局主题一致，管理端可动态切换 |
| 布局 | flexbox vertical + `justifyContent: center` | 垂直居中布局，无需绝对定位 |

### 产出文件

- `pages/login/login.json` — 注册 `btn` 组件
- `pages/login/login.wxml` — 页面模板，6 个元素
- `pages/login/login.wxss` — 精确尺寸还原
- `pages/login/login.js` — 登录交互逻辑
