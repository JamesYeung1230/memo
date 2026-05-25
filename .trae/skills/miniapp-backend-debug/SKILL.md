---
name: "miniapp-backend-debug"
description: "诊断并修复 WeChat 小程序 + FastAPI 后端之间的数据契约不一致问题。当页面不显示、导航失败、API 返回异常、或点击无反应时触发此 skill。"
---

# 小程序后端集成调试

> 适用场景：WeChat 小程序 + FastAPI 微服务后端项目，页面数据不加载、接口调用成功但界面无反应、导航跳转失败等"前端看起来正常但实际不工作"的集成问题。

## 5 点检查清单

按顺序执行，每项完成后确认问题是否已修复。

---

### 1️⃣ 页面路径注册检查

**问题模式：** 导航 URL 路径与 `app.json` 注册不匹配。

```javascript
// app.json 注册（正确）：
"pages/learn/review-today"

// 导航代码（错误）：
wx.navigateTo({ url: '/pages/learn/review-today/review-today' })
// 重复目录名，页面不存在，微信静默失败
```

**检查命令：**
```bash
# 查找所有重复目录名模式的路径
grep -rn "/pages/[a-z-]\+/[a-z-]\+/" miniapp/pages/*.js | grep -v node_modules
```

**修复方式：** 将所有 `pages/X/Y/Y?` 改为 `pages/X/Y?`。

---

### 2️⃣ API 响应层解包

**问题模式：** `request.js` 对成功的 `{code: 0, data: ..., meta: ...}` 直接 resolve(整个 body)，但前端回调直接访问属性，没取 `.data`。

```javascript
// request.js resolve 的 body：
{code: 0, data: [...items...], meta: {total: 20}, request_id: "..."}

// 前端回调（错误）：
api.list().then(function(res) {
    res.length       // undefined — res 是 {code, data, meta}
    res[0].id        // 报错
})

// 正确写法：
api.list().then(function(res) {
    var items = res.data               // [...]
    var total = res.meta && res.meta.total  // 20
})
```

**修复方式：** 所有 `then(function(res)` 回调内，先 `var data = res && res.data`。

**特别提醒：** `paginated()` 助手返回的 `data` 是数组（不是 `{items: []}`），`total` 在 `meta.total` 中。

---

### 3️⃣ 前后端字段名审计

**问题模式：** 后端 API 返回的字段名与前端期望的字段名不一致。

| 后端返回 | 前端期望 | 影响 |
|:--------|:--------|:----|
| `question_text` | `question` / `content` | 题目不显示 |
| `options` (对象 `{"A":"文本"}`) | `options` (数组 `[{letter, text}]`) | 选项不渲染 |
| `question_id` | `id` | 提交时找不到题目 |
| `points_earned` | `points` | 积分不显示 |
| `correct` | `correct_count` | 结果不准 |

**修复方式：** 对照后端 Pydantic Schema 和前端回调中的字段访问，逐字段对齐。一端修改后用 `grep` 确认另一端已同步。

---

### 4️⃣ WXML 组件事件传递

**问题模式：** 自定义组件触发的自定义事件中，`e.currentTarget.dataset` 取不到宿主元素的 `data-*` 属性。

```xml
<!-- 错误：data-* 放在 wrapper 上，bind:select 在组件上 → 取不到 -->
<view data-question-idx="{{index}}">
  <quiz-option bind:select="onOptionSelect" />
</view>

<!-- 修复：使用 mark 属性（跨组件有效） -->
<quiz-option bind:select="onOptionSelect" mark:question-idx="{{index}}" />
```

```javascript
// 错误 — e.currentTarget.dataset 取不到 mark 或跨组件 data-*
var idx = e.currentTarget.dataset.questionIdx  // undefined

// 正确 — e.mark 跨组件有效
var idx = e.mark && e.mark['question-idx']
```

**避免内层 `wx:for` 覆盖外层 `index`：**
```xml
<!-- 错误：index 被内层循环覆盖 -->
<view wx:for="{{questions}}" wx:for-item="q">
  <view wx:for="{{q.options}}">
    <!-- 此处的 index 是选项索引 0~3，不是题目索引 -->
  </view>
</view>

<!-- 修复：显式命名外层 index -->
<view wx:for="{{questions}}" wx:for-item="q" wx:for-index="qIdx">
  <view wx:for="{{q.options}}">
    <!-- 用 qIdx 取题目索引 -->
    <quiz-option mark:question-idx="{{qIdx}}" />
  </view>
</view>
```

---

### 5️⃣ CSS 布局约束

**问题模式：** `flex: 1` 的 scroll-view 未获得有效高度约束，导致无法滚动或内容溢出。

```css
/* 错误：min-height 不提供确定约束 */
.page-wrapper { min-height: 100vh; }

/* 修复：固定高度 + overflow 约束 */
.page-wrapper { height: 100vh; overflow: hidden; }
.challenge-content { flex: 1; min-height: 0; }
.challenge-scroll { flex: 1; min-height: 0; }
```

**固定底部按钮避免遮挡内容：**
```css
.challenge-gap { height: 280rpx; }  /* 等于或大于底部按钮区域高度 */

/* 按钮文字用 view + line-height 确保居中 */
.submit-btn-text {
  line-height: 88rpx;  /* 与容器等高 */
  display: block;
}
```

---

## 调试流程

当出现「页面无内容 / 点击无反应 / 数据不显示」时：

```
1. 打开开发者工具 Console → 看是否有静默失败（路径错误、data 解包等）
2. 打开 Network → 确认 API 返回 200 + code:0，查看响应结构
3. 执行 5 点检查清单（按顺序）：
   ① 页面路径注册 → 所有导航 URL 对齐 app.json
   ② API 响应层 → 所有 .then 回调加 .data 解包
   ③ 字段名审计 → 后端 Schema vs 前端期望逐一对齐
   ④ WXML 事件 → mark 替代 data-*，wx:for-index 显式命名
   ⑤ CSS 布局 → height:100vh + min-height:0
4. 修复完一项 → 刷新验证 → 未解决则进入下一项
```

> **经验法则：** 大部分集成问题源自"后端返回的数据结构与前端预期的结构不完全一致"。优先排查 ①②③，这三项覆盖了 80% 以上的故障场景。
