---
name: "miniapp-page-scaffold"
description: "微信小程序页面脚手架：按项目规范创建页面四文件、实现加载/空/错/正常四种交互状态、接入数据流。Invoke when user requests '创建页面' or '新建页面' or 'page scaffold'."
---

# Miniapp Page Scaffold — 小程序页面脚手架

从零创建符合项目规范的微信小程序页面，自动覆盖四种交互状态。

---

## Step 0 — 路径合法性预检

创建页面文件前，必须确认目标路径符合 PC.1.1 的子目录同名约定。

### 0.1 检查输入格式

用户输入应给出模块名和页面名，例如 "创建 learn 模块下的 card-browse 页面"。

解析出：
- `<module>` — 所属模块（如 `learn`、`notes`、`points`、`profile`）
- `<name>` — 页面名（kebab-case）

### 0.2 构造目标路径

```
目标文件：pages/<module>/<name>/<name>.{js,json,wxml,wxss}
app.json 注册路径："pages/<module>/<name>"
```

### 0.3 错误路径拦截

以下路径模式均为**非法**，必须在创建前拦截并提示用户修正：

| 非法路径 | 错误原因 | 正确路径 |
|---------|---------|---------|
| `pages/<module>/<name>.js` | 文件放在了模块根级，未建子目录 | `pages/<module>/<name>/<name>.js` |
| `pages/<name>.js` | 缺少模块目录 | `pages/<module>/<name>/<name>.js` |
| `pages/<module>/` （直接目录，无模块层级） | 缺少模块一级目录 | `pages/<module>/<name>/<name>.js` |

### 0.4 孤儿文件检查（已有模块）

如果 `pages/<module>/` 目录已存在，先检查根级是否有孤儿文件：

```
检查 `pages/<module>/` 根级是否存在 *.js / *.wxml / *.wxss / *.json 文件
  ├── 有 → 标记为孤儿文件，询问用户是否先清理
  └── 无 → 通过，继续下一步
```

---

## Step 1 — 读取项目上下文

创建任何页面前，确认关键约定：

```
Read app.json       → 确认 renderer: "skyline", componentFramework: "glass-easel"
Read app.wxss       → 确认 CSS 变量体系（--color-*, --font-*, --space-*, --radius-*）
Read app.js         → 确认 globalData 结构
Read .eslintrc.js   → 确认 globals（wx, App, Page, Component 等）
```

---

## Step 2 — 创建四文件骨架

按 PC.1 约定，每个页面必须包含四个文件：

```
pages/<name>/<name>.js
pages/<name>/<name>.json
pages/<name>/<name>.wxml
pages/<name>/<name>.wxss
```

### 2.1 `pages/<name>/<name>.json`

```json
{
  "usingComponents": {
    "loading-spinner": "/components/loading-spinner/loading-spinner",
    "empty-state": "/components/empty-state/empty-state",
    "toast": "/components/toast/toast",
    "navigation-bar": "/components/navigation-bar/navigation-bar"
  }
}
```

> 按实际需求增减组件注册。

### 2.2 `pages/<name>/<name>.js`

最小骨架，包含四种状态的数据字段：

```js
Page({
  data: {
    status: 'loading',
    errorMsg: '',
    list: []
  },

  onLoad(options) {
    this.loadData()
  },

  onShow() {},

  loadData() {
    this.setData({ status: 'loading' })
    // 异步数据获取 → 见 Step 3
  },

  onRetry() {
    this.loadData()
  },

  onEmptyAction() {
    // 空状态引导操作
  }
})
```

### 2.3 `pages/<name>/<name>.wxml`

四种状态分支模板：

> 自定义导航模式下（`"navigationStyle": "custom"`），参考 `custom-status-bar` Skill 处理状态栏留白，**不要**在设计稿中硬编码占位时间/电量图标。

```xml
<navigation-bar title="页面标题" back="{{true}}" />

<scroll-view class="page-scroll" scroll-y type="list">
  <!-- loading -->
  <view wx:if="{{status === 'loading'}}" class="status-container">
    <loading-spinner size="md" />
  </view>

  <!-- error -->
  <view wx:elif="{{status === 'error'}}" class="status-container">
    <text class="error-text">{{errorMsg}}</text>
    <view class="retry-btn" bind:tap="onRetry">
      <text>重试</text>
    </view>
  </view>

  <!-- empty -->
  <view wx:elif="{{status === 'empty'}}" class="status-container">
    <empty-state
      message="暂无内容"
      actionText="去创建"
      showAction="{{true}}"
      bind:action="onEmptyAction"
    />
  </view>

  <!-- normal -->
  <view wx:else class="page-content">
    <!-- 业务内容 -->
  </view>
</scroll-view>

<toast visible="{{showToast}}" type="{{toastType}}" message="{{toastMsg}}" />
```

### 2.4 `pages/<name>/<name>.wxss`

纯 CSS 变量体系，禁止硬编码色值：

```css
.page-scroll {
  flex: 1;
  height: 100%;
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.error-text {
  color: var(--color-text-secondary);
  font-size: var(--font-body);
}

.retry-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: var(--font-caption);
}

.page-content {
  padding: var(--space-lg);
}
```

---

## Step 3 — 数据流接入

按 PC.3 的数据流约定接入数据：

| 数据来源 | 接入方式 |
|---------|---------|
| 全局状态 | `getApp().globalData.xxx` |
| 页面状态 | `this.setData({ ... })` |
| 持久化 | `wx.getStorageSync('key')` / `wx.setStorageSync('key', val)` |
| 远程数据 | `wx.request({ ... })` 或在开发阶段用 `setTimeout` mock |

**loadData 模板（mock 开发版）：**

```js
loadData() {
  this.setData({ status: 'loading' })
  setTimeout(() => {
    // 模拟数据
    var data = [/* ... */]
    if (data.length === 0) {
      this.setData({ status: 'empty' })
    } else {
      this.setData({ status: 'normal', list: data })
    }
  }, 600)
}
```

---

## Step 4 — 样式规范

### PC.4 — 设计 Token 禁止硬编码

| Token | 使用方式 | 示例 |
|-------|---------|------|
| 品牌主色 | `--color-primary` | `background-color: var(--color-primary)` |
| 强调色 | `--color-primary-light` | 卡片背景、标签 |
| 文字色 | `--color-text-primary` / `--color-text-secondary` / `--color-text-hint` | 标题/正文/辅助文字 |
| 字号 | `--font-h1` ~ `--font-tag` | `font-size: var(--font-body)` |
| 间距 | `--space-xs` ~ `--space-xl` | `padding: var(--space-md)` |
| 圆角 | `--radius-sm` ~ `--radius-full` | `border-radius: var(--radius-lg)` |
| 背景 | `--color-bg-page` / `--color-bg-card` | 页面/卡片背景 |
| 阴影 | `--shadow-sm` / `--shadow-md` / `--shadow-lg` | 卡片阴影 |

> 默认品牌主色 `#4A90D9` 仅在管理端配置未下发时作为兜底。

### PC.5 — Skyline / glass-easel 兼容性

| 限制 | 影响 | 处理方式 |
|------|------|---------|
| 不支持 `::before`/`::after` | 装饰性伪元素不可用 | 用额外 `<view>` 替代 |
| `defaultDisplayBlock: true` | 所有 view/text 默认 block | 需显式 `display: flex` 才启用 flex 布局 |
| glass-easel 组件生命周期 | `lifetimes` 对象替代旧写法 | 使用 `lifetimes.attached()` 而非 `attached()` |
| 基础库 ≥ 3.0.0 | 部分新 API 不可用 | 查阅微信文档确认 API 兼容性 |

---

## Step 5 — 状态实现的组件映射

| 状态 | 使用组件 | 关键属性 |
|------|---------|---------|
| loading | `<loading-spinner>` | `size="md"` / `color` |
| empty | `<empty-state>` | `icon`, `message`, `actionText`, `showAction`, `bind:action` |
| error | 内联 view + `<toast>` | `type="error"`, `visible`, `message` |

### toast 类型速查

| type | 图标 | 颜色 | 默认持续 |
|------|:--:|------|:------:|
| `success` | ✓ | `#22C55E` | 2000ms |
| `info` | ℹ | `#4A90D9` | 2000ms |
| `warning` | ⚠ | `#F59E0B` | 3000ms |
| `error` | ✗ | `#EF4444` | 3000ms |

---

## Step 6 — 验证清单

创建页面后逐项检查：

- [ ] **路径合法性**：文件位于 `pages/<module>/<name>/<name>.js` 子目录内，非 `pages/<module>/<name>.js` 根级
- [ ] **无孤儿文件**：`pages/<module>/` 根级无 `.js` / `.wxml` / `.wxss` / `.json` 文件
- [ ] 四个文件均已创建
- [ ] `app.json` 的 `pages` 数组中已注册 `"pages/<module>/<name>"` 路径
- [ ] WXSS 中无硬编码色值（搜索 `#` 确认仅 CSS 变量中出现）
- [ ] loading / empty / error 三种状态分支齐全
- [ ] 错误状态有重试入口
- [ ] 空状态有引导按钮
- [ ] JS 文件无 lint 错误
- [ ] 未使用 `::before` / `::after` 伪元素
- [ ] 组件 lifecycle 使用 `lifetimes` 格式
