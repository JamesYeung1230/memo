# 码上启航后端 — 数据库 ERD 设计文档

> **文档版本**：v1.0
> **创建日期**：2026-05-09
> **文档状态**：初稿
> **参考依据**：小程序 PRD、Web 管理端 PRD、接口规范文档、各服务接口契约文档

---

## 1. 设计总览

### 1.1 数据库实例

| 项目 | 配置 |
|------|------|
| 数据库类型 | PostgreSQL 16+ |
| 实例数量 | 1 个共享实例 |
| 数据库名称 | `codesail` |
| 连接方式 | `asyncpg`（异步驱动） |

### 1.2 Schema 隔离策略

| Schema | 所属服务 | 职责 |
|--------|---------|------|
| `auth` | Auth Service (8001) | 管理员账号、微信小程序用户 |
| `knowledge` | Knowledge Service (8002) | 知识内容、AI 生成、敏感词、审核流水线 |
| `core` | Core Service (8000) | 学习记录、答题、笔记、积分、运营配置、看板 |

### 1.3 命名规范

| 约定 | 规则 | 示例 |
|------|------|------|
| Schema 名 | 全小写，单数 | `auth`, `knowledge`, `core` |
| 表名 | 全小写，蛇形，单数 | `learning_record`, `review_config` |
| 主键 | `id` — UUID 类型，默认 `gen_random_uuid()` | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| 外键 | 引用表名 + `_id` | `chapter_id`, `user_id` |
| 创建时间 | `created_at` — `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | — |
| 更新时间 | `updated_at` — `TIMESTAMPTZ NOT NULL DEFAULT NOW()` | — |
| 索引 | `idx_{表名}_{字段名}` | `idx_learning_record_user_id` |
| 唯一约束 | `uq_{表名}_{字段名}` | `uq_note_user_card` |

### 1.4 通用字段约定

所有表均包含以下两个字段（已内置在下方每张表的定义中，不再单独说明）：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 最后更新时间（应用层或触发器自动更新）|

---

## 2. 枚举定义

### 2.1 knowledge 域枚举

#### card_difficulty

```sql
CREATE TYPE card_difficulty AS ENUM (
    'beginner',       -- 初级
    'intermediate',   -- 中级
    'advanced'        -- 高级
);
```

#### content_status

```sql
CREATE TYPE content_status AS ENUM (
    'draft',          -- 草稿（管理员创建中）
    'published'       -- 已发布（用户可见）
);
```

#### match_mode

```sql
CREATE TYPE match_mode AS ENUM (
    'exact',          -- 精确匹配
    'pinyin',         -- 拼音匹配
    'homophone',      -- 谐音匹配
    'regex'           -- 正则表达式
);
```

#### review_status（审核流水线内部状态）

```sql
CREATE TYPE review_status AS ENUM (
    'screening',      -- 敏感词筛查中
    'ai_review',      -- AI 审查中
    'pending_manual', -- 待人工复核
    'approved',       -- 审核通过
    'rejected'        -- 审核驳回
);
```

#### manual_result

```sql
CREATE TYPE manual_result AS ENUM (
    'approved',       -- 人工通过
    'rejected'        -- 人工驳回
);
```

#### ai_task_status

```sql
CREATE TYPE ai_task_status AS ENUM (
    'processing',     -- 处理中
    'completed',      -- 完成
    'failed'          -- 失败
);
```

#### ai_status_flag

```sql
CREATE TYPE ai_status_flag AS ENUM (
    'normal',         -- 正常
    'error'           -- AI 审核异常（兜底进入人工复核）
);
```

### 2.2 core 域枚举

#### learning_status

```sql
CREATE TYPE learning_status AS ENUM (
    'not_learned',    -- 未学
    'learning',       -- 学习中
    'mastered'        -- 已掌握
);
```

#### note_audit_status

```sql
CREATE TYPE note_audit_status AS ENUM (
    'draft',          -- 草稿（未提交审核）
    'submitted',      -- 已提交，审核中（含机器+人工）
    'reviewing',      -- 人工复核中
    'approved',       -- 审核通过
    'rejected'        -- 审核驳回
);
```

#### points_action_type

```sql
CREATE TYPE points_action_type AS ENUM (
    'learn_card',            -- 学习卡片（点「懂了」）
    'daily_challenge',       -- 每日挑战全对
    'checkin_milestone',     -- 连续打卡里程碑
    'create_note',           -- 创建笔记
    'ad_watch',              -- 观看激励广告
    'unlock_domain',         -- 解锁知识领域
    'unlock_card',           -- 解锁高级卡片
    'exchange_achievement',  -- 兑换成就徽章
    'admin_adjust'           -- 管理员手动调整
);
```

#### banner_status

```sql
CREATE TYPE banner_status AS ENUM (
    'enabled',        -- 启用
    'disabled'        -- 停用
);
```

#### achievement_status

```sql
CREATE TYPE achievement_status AS ENUM (
    'published',      -- 已发布
    'draft'           -- 草稿
);
```

---

## 3. auth Schema（2 张表）

### 3.1 auth.admin — 管理员账号

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `username` | `VARCHAR(50)` | `NOT NULL UNIQUE` | 管理员用户名 |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt 密码哈希 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**索引**：

```sql
CREATE UNIQUE INDEX idx_admin_username ON auth.admin (username);
```

**种子数据**：项目启动时初始化预设管理员 `admin`，密码通过环境变量 `ADMIN_PASSWORD_HASH` 传入。

---

### 3.2 auth.user — 微信小程序用户

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `openid` | `VARCHAR(64)` | `NOT NULL UNIQUE` | 微信 OpenID |
| `nickname` | `VARCHAR(100)` | `NULL` | 微信昵称（v1.0 暂不使用） |
| `avatar_url` | `VARCHAR(500)` | `NULL` | 头像 URL（v1.0 暂不使用） |
| `violation_count` | `INTEGER` | `NOT NULL DEFAULT 0` | 笔记违规累计次数（达 3 次限制提审 7 天）|
| `review_ban_until` | `TIMESTAMPTZ` | `NULL` | 笔记提审限制截止时间 |
| `share_ban_until` | `TIMESTAMPTZ` | `NULL` | 分享功能冻结截止时间（连续 3 次驳回触发）|
| `last_login_at` | `TIMESTAMPTZ` | `NULL` | 最后登录时间 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**索引**：

```sql
CREATE UNIQUE INDEX idx_user_openid ON auth.user (openid);
```

**设计说明**：
- `session_key` 不存储在 PostgreSQL，仅在 Redis 中缓存（Key: `wx:session:{openid}`, TTL: 7 天）
- 违反架构文档中"v1.0 简化"原则：昵称/头像字段预留但 `NULL` 可接受，暂不实际写入

---

## 4. knowledge Schema（8 张表）

### 4.1 knowledge.domain — 知识领域

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `name` | `VARCHAR(50)` | `NOT NULL` | 领域名称（如"编程基础概念"，最长20字）|
| `icon` | `VARCHAR(50)` | `NOT NULL` | 图标标识（如 "code"）|
| `sort_order` | `INTEGER` | `NOT NULL DEFAULT 0` | 排序序号（升序）|
| `is_free` | `BOOLEAN` | `NOT NULL DEFAULT true` | 是否免费 |
| `unlock_points` | `INTEGER` | `NULL` | 解锁所需积分（免费时为 NULL）|
| `status` | `content_status` | `NOT NULL DEFAULT 'published'` | 发布状态 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**索引**：

```sql
CREATE INDEX idx_domain_sort_order ON knowledge.domain (sort_order);
CREATE INDEX idx_domain_status ON knowledge.domain (status);
```

---

### 4.2 knowledge.chapter — 知识章节

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `domain_id` | `UUID` | `NOT NULL REFERENCES knowledge.domain(id) ON DELETE CASCADE` | 所属领域 |
| `name` | `VARCHAR(100)` | `NOT NULL` | 章节名称 |
| `sort_order` | `INTEGER` | `NOT NULL DEFAULT 0` | 排序序号（升序）|
| `status` | `content_status` | `NOT NULL DEFAULT 'published'` | 发布状态 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 同一领域下章节名称不可重复
CREATE UNIQUE INDEX uq_chapter_domain_name ON knowledge.chapter (domain_id, name);
-- 按领域查询章节排序
CREATE INDEX idx_chapter_domain_sort ON knowledge.chapter (domain_id, sort_order);
```

**外键**：

```
chapter.domain_id → domain.id (CASCADE DELETE：删除领域时级联删除所有章节)
```

---

### 4.3 knowledge.card — 知识卡片

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `chapter_id` | `UUID` | `NOT NULL REFERENCES knowledge.chapter(id) ON DELETE CASCADE` | 所属章节 |
| `title` | `VARCHAR(200)` | `NOT NULL` | 卡片标题 |
| `core_concept` | `VARCHAR(200)` | `NOT NULL` | 一句话核心概念（最长100字）|
| `detail` | `TEXT` | `NOT NULL` | 详细说明（富文本 HTML）|
| `life_analogy` | `TEXT` | `NOT NULL` | 生活类比 |
| `tags` | `JSONB` | `NOT NULL DEFAULT '[]'` | 关键词标签数组，如 `["变量", "基础"]` |
| `difficulty` | `card_difficulty` | `NOT NULL DEFAULT 'beginner'` | 难度等级 |
| `is_premium` | `BOOLEAN` | `NOT NULL DEFAULT false` | 是否高级卡片（需解锁）|
| `unlock_points` | `INTEGER` | `NULL` | 解锁所需积分 |
| `status` | `content_status` | `NOT NULL DEFAULT 'draft'` | 发布状态 |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | 软删除时间（NULL 表示未删除）|
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 同一章节下卡片标题不可重复
CREATE UNIQUE INDEX uq_card_chapter_title ON knowledge.card (chapter_id, title) WHERE deleted_at IS NULL;
-- 按章节查询卡片
CREATE INDEX idx_card_chapter ON knowledge.card (chapter_id);
-- 过滤已发布且未删除的卡片
CREATE INDEX idx_card_status ON knowledge.card (status) WHERE deleted_at IS NULL;
```

**外键**：

```
card.chapter_id → chapter.id (CASCADE DELETE)
```

---

### 4.4 knowledge.question — 题目（一对一关联卡片）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `card_id` | `UUID` | `NOT NULL UNIQUE REFERENCES knowledge.card(id) ON DELETE CASCADE` | 关联卡片（一对一）|
| `question_text` | `VARCHAR(1000)` | `NOT NULL` | 题干（最长500字）|
| `options` | `JSONB` | `NOT NULL` | 四个选项，格式: `{"A": "...", "B": "...", "C": "...", "D": "..."}` |
| `correct_option` | `CHAR(1)` | `NOT NULL` | 正确答案（A/B/C/D）|
| `explanation` | `VARCHAR(2000)` | `NOT NULL` | 答案解析（最长1000字）|
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- correct_option 只能是 A/B/C/D 之一
ALTER TABLE knowledge.question ADD CONSTRAINT chk_correct_option
    CHECK (correct_option IN ('A', 'B', 'C', 'D'));
```

**外键**：

```
question.card_id → card.id (CASCADE DELETE)
```

---

### 4.5 knowledge.sensitive_word — 敏感词库

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `word` | `VARCHAR(100)` | `NOT NULL` | 敏感词文本（最长50字）|
| `match_mode` | `match_mode` | `NOT NULL DEFAULT 'exact'` | 匹配模式 |
| `enabled` | `BOOLEAN` | `NOT NULL DEFAULT true` | 是否启用 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 同一匹配模式下不允许重复词
CREATE UNIQUE INDEX uq_sensitive_word_mode ON knowledge.sensitive_word (word, match_mode);
-- 仅查询启用中的敏感词
CREATE INDEX idx_sensitive_word_enabled ON knowledge.sensitive_word (enabled) WHERE enabled = true;
```

**缓存策略**：启动时全量加载至 Redis，Key 按 `match_mode` 分组：

| Redis Key | 数据结构 | 用途 |
|-----------|----------|------|
| `sensitive:exact` | Set | 精确匹配词集合 |
| `sensitive:pinyin` | Set | 拼音匹配词集合 |
| `sensitive:homophone` | Set | 谐音匹配词集合 |
| `sensitive:regex` | List | 正则表达式列表 |

变更敏感词后通过 `POST /api/v1/sensitive-words/reload` 触发 Redis 缓存刷新。

---

### 4.6 knowledge.review_record — 审核记录

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `note_id` | `UUID` | `NOT NULL` | 关联 core.note 的笔记 ID |
| `author_id` | `VARCHAR(64)` | `NOT NULL` | 笔记作者 OpenID |
| `note_title` | `VARCHAR(300)` | `NOT NULL` | 笔记标题（审核时快照）|
| `note_content` | `TEXT` | `NOT NULL` | 笔记正文（审核时快照）|
| `status` | `review_status` | `NOT NULL DEFAULT 'screening'` | 审核状态 |
| `risk_score` | `INTEGER` | `NULL` | AI 综合风险评分（0~100）|
| `risk_labels` | `JSONB` | `NULL DEFAULT '[]'` | AI 风险标签数组 |
| `sensitive_words_hit` | `JSONB` | `NULL DEFAULT '[]'` | 命中的敏感词列表 |
| `ai_risk_score` | `INTEGER` | `NULL` | AI 审查评分（0~100）|
| `ai_risk_labels` | `JSONB` | `NULL DEFAULT '[]'` | AI 审查标签 |
| `ai_reasoning` | `TEXT` | `NULL` | AI 判定理由 |
| `needs_manual_review` | `BOOLEAN` | `NOT NULL DEFAULT false` | 是否需要人工复核 |
| `ai_status` | `ai_status_flag` | `NOT NULL DEFAULT 'normal'` | AI 审核状态标记 |
| `manual_reviewer` | `VARCHAR(50)` | `NULL` | 人工审核人（admin 用户名）|
| `manual_result` | `manual_result` | `NULL` | 人工审核结果 |
| `manual_reason` | `TEXT` | `NULL` | 人工驳回原因 |
| `reviewed_at` | `TIMESTAMPTZ` | `NULL` | 审核完成时间 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 每篇笔记只有一条审核记录（覆盖更新）
CREATE UNIQUE INDEX uq_review_note ON knowledge.review_record (note_id);
-- 按状态筛选审核队列
CREATE INDEX idx_review_status ON knowledge.review_record (status);
-- 按时间倒序查看审核记录
CREATE INDEX idx_review_created ON knowledge.review_record (created_at DESC);
-- 作者查询自己的审核历史
CREATE INDEX idx_review_author ON knowledge.review_record (author_id);
```

**状态流转**：

```
screening → ai_review → pending_manual → approved
                     → approved
                     → rejected
                     → (arq 重试失败) → pending_manual (ai_status = error)
```

---

### 4.7 knowledge.ai_generation_history — AI 生成历史

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `generation_type` | `VARCHAR(20)` | `NOT NULL` | 生成类型: `card` 或 `question` |
| `topic` | `VARCHAR(200)` | `NOT NULL` | 原始输入主题 |
| `source_card_id` | `UUID` | `NULL REFERENCES knowledge.card(id) ON DELETE SET NULL` | 关联卡片（生成题目时引用）|
| `chapter_id` | `UUID` | `NULL REFERENCES knowledge.chapter(id) ON DELETE SET NULL` | 目标章节（生成卡片时引用）|
| `task_id` | `VARCHAR(64)` | `NULL` | arq 异步任务 ID |
| `task_status` | `ai_task_status` | `NOT NULL DEFAULT 'processing'` | 任务状态 |
| `generated_content` | `JSONB` | `NULL` | 生成的完整内容 |
| `admin_edited_content` | `JSONB` | `NULL` | 管理员编辑后的内容 |
| `version` | `INTEGER` | `NOT NULL DEFAULT 1` | 版本号（重新生成时递增）|
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
CREATE INDEX idx_ai_gen_type ON knowledge.ai_generation_history (generation_type);
CREATE INDEX idx_ai_gen_task ON knowledge.ai_generation_history (task_id);
CREATE INDEX idx_ai_gen_topic ON knowledge.ai_generation_history (topic);
```

---

## 5. core Schema（12 张表）

### 5.1 core.learning_record — 用户学习记录

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL` | 用户 ID（关联 auth.user.id）|
| `card_id` | `UUID` | `NOT NULL` | 卡片 ID（关联 knowledge.card.id）|
| `domain_id` | `UUID` | `NOT NULL` | 领域 ID（关联 knowledge.domain.id，冗余便于统计）|
| `chapter_id` | `UUID` | `NULL` | 章节 ID（关联 knowledge.chapter.id，冗余便于统计）|
| `status` | `learning_status` | `NOT NULL DEFAULT 'learning'` | 学习状态 |
| `learned_at` | `TIMESTAMPTZ` | `NULL` | 标记为「已掌握」的时间 |
| `review_count` | `INTEGER` | `NOT NULL DEFAULT 0` | 复习次数 |
| `next_review_at` | `TIMESTAMPTZ` | `NULL` | 下次复习提醒时间 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 每个用户对每张卡片只有一条学习记录
CREATE UNIQUE INDEX uq_learning_user_card ON core.learning_record (user_id, card_id);
-- 按用户查询学习进度
CREATE INDEX idx_learning_user ON core.learning_record (user_id);
-- 按领域统计学习热度
CREATE INDEX idx_learning_domain ON core.learning_record (domain_id);
-- 查询今日待复习卡片
CREATE INDEX idx_learning_next_review ON core.learning_record (user_id, next_review_at)
    WHERE next_review_at IS NOT NULL;
```

**外键说明**：`user_id`、`card_id`、`domain_id`、`chapter_id` 均为逻辑外键（跨 Schema），不做物理外键约束，通过应用层保证一致性。

---

### 5.2 core.answer_record — 答题记录

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL` | 用户 ID |
| `question_id` | `UUID` | `NOT NULL` | 题目 ID |
| `card_id` | `UUID` | `NULL` | 关联卡片 ID（冗余便于统计）|
| `domain_id` | `UUID` | `NULL` | 领域 ID（冗余便于统计）|
| `selected_option` | `CHAR(1)` | `NOT NULL` | 用户选择的选项（A/B/C/D）|
| `is_correct` | `BOOLEAN` | `NOT NULL` | 是否正确 |
| `is_daily_challenge` | `BOOLEAN` | `NOT NULL DEFAULT false` | 是否来自每日挑战 |
| `challenge_date` | `DATE` | `NULL` | 每日挑战日期 |
| `answered_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 答题时间 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
CREATE INDEX idx_answer_user ON core.answer_record (user_id);
CREATE INDEX idx_answer_question ON core.answer_record (question_id);
CREATE INDEX idx_answer_domain ON core.answer_record (domain_id);
-- 错题本查询（答错的题）
CREATE INDEX idx_answer_wrong ON core.answer_record (user_id) WHERE is_correct = false;
-- 每日挑战记录查询
CREATE INDEX idx_answer_challenge ON core.answer_record (user_id, challenge_date)
    WHERE is_daily_challenge = true;
```

---

### 5.3 core.note — 用户笔记

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL` | 用户 ID |
| `title` | `VARCHAR(300)` | `NOT NULL` | 笔记标题 |
| `content` | `TEXT` | `NOT NULL` | 笔记正文（纯文本，上限 5000 字）|
| `tags` | `JSONB` | `NULL DEFAULT '[]'` | 标签数组 |
| `associated_card_id` | `UUID` | `NULL` | 关联卡片 ID（关联笔记来源）|
| `audit_status` | `note_audit_status` | `NOT NULL DEFAULT 'draft'` | 笔记审核状态 |
| `reject_reason` | `TEXT` | `NULL` | 驳回原因 |
| `violation_flag` | `BOOLEAN` | `NOT NULL DEFAULT false` | 是否违规标记 |
| `submitted_at` | `TIMESTAMPTZ` | `NULL` | 提交审核时间 |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | 软删除时间 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
CREATE UNIQUE INDEX uq_note_user_card ON core.note (user_id, associated_card_id) 
    WHERE associated_card_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_note_user ON core.note (user_id);
CREATE INDEX idx_note_audit_status ON core.note (audit_status);
CREATE INDEX idx_note_user_audit ON core.note (user_id, audit_status);
-- 筛选已提交审核的笔记
CREATE INDEX idx_note_submitted ON core.note (submitted_at) WHERE submitted_at IS NOT NULL;

-- 笔记正文字数上限 5000 字
ALTER TABLE core.note ADD CONSTRAINT chk_note_content_length 
    CHECK (LENGTH(content) <= 5000);
-- 笔记标题长度上限
ALTER TABLE core.note ADD CONSTRAINT chk_note_title_length 
    CHECK (LENGTH(title) <= 300);
```

**状态流转**：

```
draft → submitted → reviewing → approved
                              → rejected
draft → submitted → approved  (AI 低风险直接通过)
draft → submitted → rejected  (敏感词命中/AI 高风险)
submitted → draft (撤回审核)
```

---

### 5.4 core.points_record — 积分记录

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL` | 用户 ID |
| `points` | `INTEGER` | `NOT NULL` | 变动积分值（正=获取，负=消耗）|
| `balance_after` | `INTEGER` | `NULL` | 变动后余额（冗余便于查询）|
| `action_type` | `points_action_type` | `NOT NULL` | 行为类型 |
| `reference_id` | `VARCHAR(64)` | `NULL` | 关联业务 ID（如 card_id, domain_id 等）|
| `description` | `VARCHAR(200)` | `NULL` | 描述信息 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
CREATE INDEX idx_points_user ON core.points_record (user_id);
CREATE INDEX idx_points_user_created ON core.points_record (user_id, created_at DESC);
CREATE INDEX idx_points_action ON core.points_record (action_type);
-- 统计每日积分发放/消耗
CREATE INDEX idx_points_created_date ON core.points_record (created_at::date);
```

**设计说明**：积分余额通过 Redis Lua 脚本原子操作 + 定时持久化到 DB。本表为流水日志，`balance_after` 为冗余字段用于快速查询当前余额。

**积分日上限持久化策略**：

```
┌─────────────────────────────────────────────────────────────┐
│ Redis（运行时计数）                  PostgreSQL（持久化兜底）  │
│ ┌──────────────────┐               ┌────────────────────┐  │
│ │ points:daily:{uid}│ ←每5分钟同步→ │ points_record 流水  │  │
│ │ :{action}:{date}  │               │ （应用层统计日上限）  │  │
│ │ TTL: 25h         │               └────────────────────┘  │
│ └──────────────────┘                                        │
│                                                             │
│ 正常流程: Redis 原子计数（INCRBY + EXPIRE）                  │
│ 服务重启: 从 points_record 统计当日各行为积分汇总，重建缓存   │
└─────────────────────────────────────────────────────────────┘
```

**重建逻辑**（服务启动或 Redis 数据丢失时）：

```sql
-- 恢复某用户当日的 learn_card 积分计数
SELECT COALESCE(SUM(points), 0) 
FROM core.points_record 
WHERE user_id = :uid 
  AND action_type = 'learn_card' 
  AND created_at::date = CURRENT_DATE;
```

> 由于积分流水表记录了所有操作，服务重启后可以从 `points_record` 按 `user_id + action_type + created_at::date` 维度聚合恢复当日计数。无需新建持久化表。

---

### 5.5 core.config — 系统配置（KV 存储）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `config_key` | `VARCHAR(100)` | `NOT NULL UNIQUE` | 配置键名 |
| `config_value` | `JSONB` | `NOT NULL` | 配置值 |
| `description` | `VARCHAR(500)` | `NULL` | 配置说明 |
| `version` | `INTEGER` | `NOT NULL DEFAULT 1` | 版本号（乐观锁，用于并发控制）|
| `updated_by` | `VARCHAR(50)` | `NULL` | 更新人（admin 用户名）|
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**预定义配置项**：

| config_key | config_value 示例 | 说明 |
|-----------|-------------------|------|
| `points_rules` | `{"learn_card": 1, "daily_learn_card_limit": 10, "daily_challenge": 15, "daily_challenge_limit": 15, "create_note": 5, "daily_create_note_limit": 15, "ad_watch": 10, "daily_ad_watch_limit": 100}` | 积分规则（含各行为积分数值和日上限）|
| `checkin_milestones` | `{"3": 15, "7": 30, "14": 60}` | 连续打卡里程碑积分配置 |
| `unlock_config` | `{"domain_unlock_ranges": {"K04": 40, "K05": 40, "K06": 50, "K07": 60}, "premium_card_unlock": 20}` | 知识领域和高级卡片解锁积分配置 |
| `theme_config` | `{"primary_color": "#4A90D9", "primary_light": "#7AB8F5", "primary_dark": "#2D6EC9"}` | 主题色配置 |
| `ad_config` | `{"splash_enabled": true, "splash_ad_unit_id": "xxx", "reward_ad_unit_id": "xxx", "splash_skip_seconds": 5}` | 广告配置（开屏广告开关/广告位ID/跳过时长）|
| `announcement` | `{"title": "...", "content": "...", "expires_at": "..."}` | 公告配置（JSONB 可存多条）|
| `default_review_config` | `{"review_nodes": [1,2,4,7,15], "daily_limit": 20, "forgotten_alert_days": 7, "reminder_time": "20:00", "weekend_quiet": false}` | 默认复习计划 |

---

### 5.6 core.banner — Banner 轮播图

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `title` | `VARCHAR(50)` | `NOT NULL` | Banner 标题（最长20字）|
| `image_url` | `VARCHAR(500)` | `NOT NULL` | 图片 URL（相对路径）|
| `link_type` | `VARCHAR(50)` | `NULL` | 跳转类型（如 `pages/learn/card`）|
| `link_param` | `VARCHAR(200)` | `NULL` | 跳转参数（JSON 字符串）|
| `sort_order` | `INTEGER` | `NOT NULL DEFAULT 0` | 排序序号 |
| `status` | `banner_status` | `NOT NULL DEFAULT 'enabled'` | 启用状态 |
| `start_date` | `TIMESTAMPTZ` | `NULL` | 生效开始时间 |
| `end_date` | `TIMESTAMPTZ` | `NULL` | 生效结束时间 |
| `click_count` | `INTEGER` | `NOT NULL DEFAULT 0` | 点击次数（PV）|
| `impression_pv` | `INTEGER` | `NOT NULL DEFAULT 0` | 曝光次数（PV）|
| `impression_uv` | `INTEGER` | `NOT NULL DEFAULT 0` | 曝光用户数（UV）|
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 按排序查询启用的 Banner
CREATE INDEX idx_banner_sort ON core.banner (sort_order) WHERE status = 'enabled';
-- 查询有效期内的 Banner
CREATE INDEX idx_banner_dates ON core.banner (start_date, end_date) WHERE status = 'enabled';
```

---

### 5.7 core.achievement — 成就徽章定义

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `name` | `VARCHAR(100)` | `NOT NULL` | 徽章名称 |
| `description` | `TEXT` | `NOT NULL` | 获取条件说明 |
| `icon_url` | `VARCHAR(500)` | `NOT NULL` | 图标 URL |
| `points_required` | `INTEGER` | `NULL` | 兑换所需积分（NULL 表示非兑换获取）|
| `status` | `achievement_status` | `NOT NULL DEFAULT 'published'` | 发布状态 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

---

### 5.8 core.user_achievement — 用户获得成就

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL` | 用户 ID |
| `achievement_id` | `UUID` | `NOT NULL` | 徽章 ID |
| `obtained_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 获得时间 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 每个用户对每个徽章只能获得一次
CREATE UNIQUE INDEX uq_user_achievement ON core.user_achievement (user_id, achievement_id);
CREATE INDEX idx_user_achievement_user ON core.user_achievement (user_id);
```

---

### 5.9 core.op_log — 操作日志

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `operator` | `VARCHAR(50)` | `NOT NULL` | 操作人（admin 用户名）|
| `action_type` | `VARCHAR(50)` | `NOT NULL` | 操作类型（如 `delete_domain`, `delete_card`）|
| `target_type` | `VARCHAR(50)` | `NOT NULL` | 操作对象类型 |
| `target_id` | `UUID` | `NOT NULL` | 操作对象 ID |
| `detail` | `JSONB` | `NULL` | 操作详情 |
| `ip_address` | `VARCHAR(45)` | `NULL` | 操作人 IP |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
CREATE INDEX idx_op_log_created ON core.op_log (created_at DESC);
CREATE INDEX idx_op_log_action ON core.op_log (action_type);
```

---

### 5.10 core.favorite_card — 用户收藏卡片

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL` | 用户 ID |
| `card_id` | `UUID` | `NOT NULL` | 卡片 ID |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
CREATE UNIQUE INDEX uq_favorite_user_card ON core.favorite_card (user_id, card_id);
CREATE INDEX idx_favorite_user ON core.favorite_card (user_id);
```

---

### 5.11 core.daily_challenge_record — 每日挑战记录

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL` | 用户 ID |
| `challenge_date` | `DATE` | `NOT NULL` | 挑战日期 |
| `total_questions` | `INTEGER` | `NOT NULL DEFAULT 0` | 题目总数 |
| `correct_count` | `INTEGER` | `NOT NULL DEFAULT 0` | 正确数 |
| `is_completed` | `BOOLEAN` | `NOT NULL DEFAULT false` | 是否完成 |
| `all_correct` | `BOOLEAN` | `NOT NULL DEFAULT false` | 是否全对 |
| `points_earned` | `INTEGER` | `NOT NULL DEFAULT 0` | 获得积分 |
| `streak_days` | `INTEGER` | `NOT NULL DEFAULT 0` | 连续打卡天数 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
-- 每个用户每天只有一条挑战记录
CREATE UNIQUE INDEX uq_challenge_user_date ON core.daily_challenge_record (user_id, challenge_date);
CREATE INDEX idx_challenge_date ON core.daily_challenge_record (challenge_date);
```

---

### 5.12 core.review_config — 用户复习计划配置

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `UUID` | `NOT NULL UNIQUE` | 用户 ID（一对一）|
| `review_nodes` | `JSONB` | `NOT NULL DEFAULT '[1,2,4,7,15]'` | 复习节点（天），如 `[1, 2, 4, 7, 15]` |
| `daily_limit` | `INTEGER` | `NOT NULL DEFAULT 20` | 每日复习上限（5~50）|
| `forgotten_alert_days` | `INTEGER` | `NOT NULL DEFAULT 7` | 遗忘预警天数（3~30）|
| `reminder_time` | `TIME` | `NOT NULL DEFAULT '20:00'` | 复习提醒时间 |
| `weekend_quiet` | `BOOLEAN` | `NOT NULL DEFAULT false` | 周末是否免打扰 |
| `preset` | `VARCHAR(20)` | `NULL` | 当前预设标识: `standard` / `relaxed` / `intensive` / `custom` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | — |

**约束**：

```sql
CREATE UNIQUE INDEX uq_review_config_user ON core.review_config (user_id);
```

**设计说明**：
- 用户首次进入复习设置页时，系统自动创建默认配置（从 `core.config` 的 `default_review_config` 读取）
- 修改配置仅对新学习的知识点生效，已排入复习计划的不受影响
- 三档预设一键切换：`standard`（标准/1,2,4,7,15）、`relaxed`（轻松/7,14,30）、`intensive`（强化/1,2,3,5,7,10）

---

## 6. 数据看板查询支持说明

### 6.1 跨 Schema 统计查询

数据看板需要聚合 `auth`、`knowledge`、`core` 三域数据。以下为各看板指标的查询来源和实现策略：

| 看板指标 | 来源表 | 查询方式 | 性能策略 |
|---------|-------|---------|---------|
| 累计用户数 | `auth.user` | `COUNT(*)` | 直接查询 |
| 日活用户(DAU) | `auth.user.last_login_at` | `WHERE last_login_at::date = CURRENT_DATE` | 直接查询，索引覆盖 |
| 7日留存率 | `auth.user.created_at` + `last_login_at` | 按注册日期分组，统计后续登录回访 | 物化视图（按天刷新）|
| 今日学习卡片数 | `core.learning_record.learned_at` | `WHERE learned_at::date = CURRENT_DATE` | `idx_learning_user` 索引 |
| 今日答题数 | `core.answer_record.answered_at` | `WHERE answered_at::date = CURRENT_DATE` | `idx_answer_user` 索引 |
| 各领域学习热度 | `core.learning_record.domain_id` | `GROUP BY domain_id` + COUNT | 小时级物化视图 |
| 题目正确率 | `core.answer_record` | `AVG(is_correct::int) GROUP BY domain_id` | 直接查询 |
| 用户增长趋势 | `auth.user.created_at` | `date_trunc('day', created_at)` + COUNT | 直接查询 |
| 积分发放/消耗 | `core.points_record` | `GROUP BY action_type, date_trunc` | `idx_points_created_date` 索引 |
| 审核统计 | `knowledge.review_record` | 按 status + created_at 聚合 | `idx_review_status` 索引 |

### 6.2 DAU 精确统计建议

> **当前设计**：`auth.user.last_login_at` 记录用户最后登录时间，可推算当日登录用户数（DAU=当天有 last_login_at 的用户数）。但无法精确计算 7 日留存（需要按注册队列统计后续每天的回访）。
>
> **建议**：若数据看板需要精确的 DAU 和留存曲线，有以下两种方案：

| 方案 | 说明 | 优缺点 |
|:----:|------|--------|
| **A. 利用现有表** | 从 `answer_record.answered_at` + `learning_record.learned_at` + `points_record.created_at` + `user.last_login_at` 多表 UNION 推导日活 | ✅ 无需新表；❌ 查询复杂，精度受限于各表时间戳 |
| **B. 新增 user_daily_activity 表** | `core.user_daily_activity(user_id, activity_date, is_active BOOLEAN)`，每日登录/任意操作时 upsert | ✅ 查询精确、性能好；❌ 需维护额外写入 |

> **v1.0 建议**：采用方案 A，从现有表 UNION 聚合推导 DAU。若后续运营需求增长再迁移至方案 B。

### 6.3 物化视图规划

以下物化视图按小时刷新，用于数据看板高频查询：

```sql
-- 领域学习热度（按小时刷新）
CREATE MATERIALIZED VIEW core.mv_domain_heat AS
SELECT 
    lr.domain_id,
    d.name AS domain_name,
    COUNT(DISTINCT lr.user_id) AS learner_count,
    COUNT(*) AS total_learn_actions,
    COUNT(DISTINCT lr.card_id) AS unique_cards_learned
FROM core.learning_record lr
JOIN knowledge.domain d ON lr.domain_id = d.id
WHERE lr.learned_at >= NOW() - INTERVAL '30 days'
GROUP BY lr.domain_id, d.name;

-- 用户增长趋势（按天刷新）
CREATE MATERIALIZED VIEW core.mv_user_growth AS
SELECT 
    date_trunc('day', created_at) AS reg_date,
    COUNT(*) AS new_users
FROM auth.user
GROUP BY date_trunc('day', created_at)
ORDER BY reg_date DESC;
```

## 7. 表关系总览图（文本 ERD）

```
auth Schema
============

auth.admin ────── (管理员账号，独立表，无外键关联)

auth.user ─┐
           │ 1
           │
           ├────────── core.learning_record (user_id)
           ├────────── core.answer_record (user_id)
           ├────────── core.note (user_id)
           ├────────── core.points_record (user_id)
           ├────────── core.favorite_card (user_id)
           ├────────── core.user_achievement (user_id)
           ├────────── core.daily_challenge_record (user_id)
           ├────────── core.review_config (user_id)  [一对一]
           └────────── knowledge.review_record (author_id=openid)


knowledge Schema
=================

knowledge.domain ──┐ 1
                   │
                   └────────── knowledge.chapter (domain_id)
                                     │ 1
                                     │
                                     └────────── knowledge.card (chapter_id)
                                                    │ 1
                                                    │
                                                    ├────────── knowledge.question (card_id)  [一对一]
                                                    │
                                                    └────────── core.learning_record (card_id)
                                                    └────────── core.favorite_card (card_id)
                                                    └────────── core.note (associated_card_id)
                                                    └────────── core.answer_record (card_id)

knowledge.sensitive_word ── (独立表，无外键关联，仅业务关联审核流程)

knowledge.review_record ── (note_id 为逻辑外键关联 core.note.id)

knowledge.ai_generation_history ── (source_card_id → card.id, chapter_id → chapter.id)


core Schema
============

core.note ─────────── knowledge.review_record.note_id  (逻辑外键，跨 Schema)

core.achievement ──┐ 1
                   │
                   └────────── core.user_achievement (achievement_id)

core.config ── (KV 配置表，无外键关联)

core.banner ── (独立表，无外键关联)

core.op_log ── (独立表，无外键关联)
```

---

## 8. 索引策略总结

| 分类 | 索引用途 | 数量 |
|------|---------|:----:|
| 主键索引 | 每表一个（UUID PK） | 22 |
| 唯一约束 | 防止数据重复（用户名、OpenID、章节-卡片名、用户-收藏、用户-每日挑战等）| ~10 |
| 外键查询 | 按 user_id / card_id / domain_id / chapter_id 快速关联查询 | ~15 |
| 排序&过滤 | 按 sort_order, status, created_at 排序和筛选 | ~8 |
| 部分索引 | 仅索引活跃数据（未删除的卡片、启用的敏感词、启用的 Banner）| ~4 |

---

## 9. 迁移策略

### 9.1 Alembic 规划

每个 Schema 独立初始化 Alembic：

```
services/auth/alembic/          → 管理 auth Schema 迁移
services/knowledge/alembic/     → 管理 knowledge Schema 迁移
services/core/alembic/          → 管理 core Schema 迁移
```

每个 Alembic 的 `env.py` 连接对应服务的 `DATABASE_URL`，并在 `target_metadata` 中仅包含本 Schema 的模型。

### 9.2 首次迁移内容

按依赖顺序执行：

| 序号 | 迁移内容 | 说明 |
|:----:|---------|------|
| 1 | `CREATE SCHEMA auth; CREATE SCHEMA knowledge; CREATE SCHEMA core;` | 创建 3 个 Schema |
| 2 | 创建所有 ENUM 类型 | 在各自 Schema 中创建 |
| 3 | auth.admin + auth.user | 无外部依赖 |
| 4 | knowledge.domain + sensitive_word | 无外部依赖 |
| 5 | knowledge.chapter (依赖 domain) | — |
| 6 | knowledge.card (依赖 chapter) | — |
| 7 | knowledge.question (依赖 card) | — |
| 8 | knowledge.review_record + ai_generation_history | 无物理外键 |
| 9 | core 全部 12 张表 | 无物理外键（逻辑关联）|

### 9.3 种子数据迁移

创建 `data_migration` 版本，插入：

1. **管理员账号**：`auth.admin`，用户名 `admin`，密码哈希由环境变量注入
2. **7 个知识领域**（K01~K07）：名称、图标、积分定价
3. **积分规则默认值**：写入 `core.config` 表的 `points_rules` 和 `checkin_milestones`
4. **默认复习节点配置**：写入 `core.config` 表的 `default_review_config`
5. **默认主题色**：写入 `core.config` 表的 `theme_config`

---

## 10. JSONB 字段结构规范

### 10.1 card.tags

```json
["变量", "基础", "编程"]
```

### 10.2 question.options

```json
{
    "A": "存储数据",
    "B": "显示图像",
    "C": "播放声音",
    "D": "连接网络"
}
```

### 10.3 review_record.risk_labels / ai_risk_labels

```json
["违规广告", "色情低俗", "暴力谩骂", "政治敏感", "虚假信息"]
```

### 10.4 review_record.sensitive_words_hit

```json
[
    {"word": "违禁词", "match_mode": "exact", "position": 15},
    {"word": "jinbi", "match_mode": "pinyin", "position": 42}
]
```

### 10.5 op_log.detail

```json
{
    "deleted_name": "编程基础概念",
    "deleted_card_count": 12
}
```

### 10.6 review_config.review_nodes

```json
[1, 2, 4, 7, 15]
```

**三档预设**：

| 预设标识 | 名称 | review_nodes | 适用场景 |
|---------|------|:------------:|---------|
| `standard` | 标准配置 | `[1, 2, 4, 7, 15]` | 默认，均衡记忆曲线 |
| `relaxed` | 轻松配置 | `[7, 14, 30]` | 低频复习，减少打扰 |
| `intensive` | 强化配置 | `[1, 2, 3, 5, 7, 10]` | 高频复习，强化记忆 |

### 10.7 config.config_value 各键值结构

**points_rules**：
```json
{
    "learn_card": 1,
    "daily_learn_card_limit": 10,
    "daily_challenge": 15,
    "daily_challenge_limit": 15,
    "create_note": 5,
    "daily_create_note_limit": 15,
    "ad_watch": 10,
    "daily_ad_watch_limit": 100
}
```

**checkin_milestones**：
```json
{
    "3": 15,
    "7": 30,
    "14": 60
}
```

**unlock_config**：
```json
{
    "domain_unlock_ranges": {
        "K04": 40,
        "K05": 40,
        "K06": 50,
        "K07": 60
    },
    "premium_card_unlock": 20
}
```

### 10.8 ai_generation_history.generated_content / admin_edited_content

卡片生成内容结构：
```json
{
    "title": "什么是变量",
    "core_concept": "变量是存储数据的容器",
    "detail": "<p>详细说明...</p>",
    "life_analogy": "变量就像带标签的盒子...",
    "tags": ["变量", "基础"],
    "difficulty": "beginner"
}
```

题目生成内容结构：
```json
{
    "question_text": "题干...",
    "options": {
        "A": "选项A",
        "B": "选项B",
        "C": "选项C",
        "D": "选项D"
    },
    "correct_option": "A",
    "explanation": "解析..."
}
```

---

## 11. 物理外键 vs 逻辑外键

| 表 | 外键 | 策略 | 理由 |
|----|------|:----:|------|
| knowledge 内部表 | `chapter.domain_id`, `card.chapter_id`, `question.card_id` | ✅ 物理 FK + CASCADE DELETE | 同 Schema，强一致性必须保证 |
| 跨 Schema 引用 | `core.*.user_id → auth.user.id`, `core.*.card_id → knowledge.card.id` | ❌ 逻辑 FK | 跨 Schema 物理 FK 增加耦合，且 Core 需要 auth 只读权限 |
| review_record.note_id | → core.note.id | ❌ 逻辑 FK | 跨 Schema |
| ai_generation_history.*_id | → knowledge.card.id / chapter.id | ✅ 物理 FK + SET NULL | 同 Schema，删除引用对象时保留生成历史 |

---

## 12. 修订记录

| 版本 | 日期 | 修订内容 |
|------|------|---------|
| v1.0 | 2026-05-09 | 初稿创建，覆盖 3 Schema 22 张表的完整设计 |
| v1.1 | 2026-05-09 | 字段长度对齐 PRD（domain.name VARCHAR(50) 等）；补充 note.content CHECK 约束；补充 auth.user.share_ban_until 分享冻结字段；补充 core.banner 曝光统计字段（impression_pv/uv）；补充 core.config 缺失配置项（unlock_config 等）；新增 §6 数据看板查询支持说明；补充 JSONB 结构规范（review_config、config 各键值、ai_generation_history）|
