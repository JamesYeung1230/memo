# Bug Report — CodeSail V1.0 Pre-Release

> 生成日期：2026-06-14
> 来源：代码审查 + 端点扫描 + 已知技术债务

---

## Bug 清单

### #1 Analytics 趋势/分布/排行 API 缺失

| 属性 | 内容 |
|------|------|
| **严重程度** | 🟡 中 |
| **组件** | Webapp / Analytics |
| **页面** | `/analytics/overview` Tab2-4 |
| **现象** | 10 个图表函数返回空数组 `{data: []}`，图表展示空白 |
| **根因** | 后端未提供趋势/分布/排行聚合 API（需求 M8） |
| **影响函数** | `getUserGrowthTrend`, `getDomainHeat`, `getCardLearningRank`, `getQuestionAccuracy`, `getUserGrowth`, `getActivityDistribution`, `getLearningFunnel`, `getPointsTrend`, `getAdStats`, `getPointsDistribution` |
| **标记** | `TODO(M8)` 注释 |
| **建议** | 后端新增 10 个趋势/排行 API 端点（按天/周/月聚合） |

### #2 部分数据指标不可用（返回 -1）

| 属性 | 内容 |
|------|------|
| **严重程度** | 🟡 中 |
| **组件** | Webapp / Dashboard + Overview |
| **页面** | `/dashboard`, `/analytics/overview` |
| **现象** | `totalCards`, `activeUsers7d`, `todayDau`, `retention7d` 返回 -1 |
| **根因** | 后端 overview 接口不包含这些聚合字段 |
| **影响** | Dashboard 卡片数、7日活跃、日活、7日留存显示 -1 |
| **建议** | 后端 `/admin/dashboard/overview` 增加 aggregate 查询（卡片总数、7日活跃用户数、今日 DAU、7日留存率） |

### #3 类型命名不一致（snake_case vs camelCase）

| 属性 | 内容 |
|------|------|
| **严重程度** | 🟢 低（功能正常，代码风格） |
| **组件** | Webapp / API types |
| **文件** | `src/api/logs.ts`, `src/types/log.ts`, `src/api/sensitive-words.ts`, `src/types/sensitive-word.ts` |
| **现象** | 前端类型定义使用 snake_case（如 `action_type`, `target_type`, `match_mode`），与其他 API 模块的 camelCase 不一致 |
| **影响** | 10 个组件引用处的字段名风格不统一 |
| **建议** | 统一为 camelCase + 增加字段映射函数，或后端期望保持一致 |

### #4 AI Generation History 端点缺失

| 属性 | 内容 |
|------|------|
| **严重程度** | 🟡 中 |
| **组件** | Webapp / AI Cards |
| **页面** | `/ai/cards` |
| **现象** | `GET /admin/ai/generation-history` 返回 404 |
| **根因** | 后端未实现该端点 |
| **影响** | AI 卡片生成历史列表为空 |
| **建议** | 后端实现 generation-history 端点（分页 + 按类型筛选） |

### #5 公告系统缺失

| 属性 | 内容 |
|------|------|
| **严重程度** | 🟢 低（非 MVP 核心） |
| **组件** | 三端 |
| **现象** | PRD §2.5.5 定义的公告弹窗（M17）无后端 API 支持，无前端配置页 |
| **影响** | 运营无法配置首页公告弹窗 |
| **建议** | 后端新增公告 CRUD API + Webapp 新增公告配置页 + Miniapp 新增公告弹窗组件 |

### #6 用户管理详情字段不全

| 属性 | 内容 |
|------|------|
| **严重程度** | 🟢 低 |
| **组件** | Webapp / Users |
| **页面** | `/users/:id` |
| **现象** | 后端返回 `violation_count`, `review_ban_until`, `share_ban_until`, `last_login_at`，但前端 `UserData` 类型未映射 |
| **根因** | `users.ts` mapper 未包含这些字段 |
| **建议** | 在 `UserData` 接口中增加对应字段并在 mapper 中映射 |

---

## 已修复项

| # | 描述 | 修复 Commit |
|:--|------|:----------:|
| - | `points.ts getChangeLogs` 无谓 API 调用 | `87c057a` |
| - | `analytics.ts` 不可用数据用 0（改为 -1） | `87c057a` |
| - | `analytics.ts` 10 个 stub 缺 TODO 标记 | `87c057a` |

---

## 总结

| 严重程度 | 数量 |
|---------|:----:|
| 🔴 高（阻塞） | 0 |
| 🟡 中（应修复） | 3 |
| 🟢 低（改进建议） | 3 |
| **合计** | **6** |
