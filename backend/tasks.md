# 码上启航后端 — 任务追踪

> 本文件与 project.md 的里程碑表配合使用，粒度更细。
> 状态说明：🟢 已完成 / 🔴 进行中 / ⚪ 待开始

---

## 🟢 已完成

- [x] shared/config.py — 配置加载（2026-05-08）
- [x] shared/errors.py — 错误码体系（2026-05-08）
- [x] shared/responses.py — 响应模型（2026-05-08）
- [x] shared/auth.py — JWT 签发/验证工具（2026-05-08）
- [x] shared/seed.py — 种子数据默认值（2026-05-08）
- [x] docs/01~04 — 技术可行性分析、架构设计、接口规范、接口契约
- [x] docs/05-数据库ERD设计文档（2026-05-09）
- [x] docs/06-环境变量清单（2026-05-09）
- [x] docs/07-种子数据定义文档（2026-05-09）
- [x] docker-compose.yml — 5 容器完整编排
- [x] 3 服务 Dockerfile + requirements.txt
- [x] .env.example 环境变量模板
- [x] docs 目录清理（删除过期的 05，重新编号）
- [x] project_rules.md 更新（新增 B.15~B.17）
- [x] project.md 里程碑表更新（反映实际状态）
- [x] tasks.md 创建（本文件）
- [x] docs/_templates/ — AI 指令模板 + 验收 checklist + 速查卡
- [x] Auth 服务 Alembic：env.py + script.py.mako + 0001_init_auth
- [x] Auth 服务：修复 0002_seed_admin.py（参数化查询替代 f-string）
- [x] Knowledge 服务 Alembic：env.py + script.py.mako + 0001_init_knowledge
- [x] Knowledge 服务：修复 0002_seed_domains.py（参数化查询替代 f-string）
- [x] Core 服务 Alembic：env.py + script.py.mako + 0001_init_core
- [x] Core 服务：0002_seed_config.py（7 个默认配置项）
- [x] **阶段一完成** — 项目搬迁至 Ubuntu + Docker 环境搭建 + Alembic 迁移验证（完成于 2026-05-09）
- [x] **A1** Auth 骨架搭建：main.py + models/Admin.py + models/User.py + base.py（完成于 2026-05-11）
- [x] **A2** 管理员认证：routes/admin.py（登录 + JWT 签发 + Token 刷新 + 密码修改）（完成于 2026-05-11）
- [x] **A3** 微信登录：routes/wechat.py（wx.login code → OpenID → JWT）（完成于 2026-05-11）
- [x] **K1** Knowledge 骨架搭建：main.py + 8 张 ORM 模型 + deps.py（完成于 2026-05-21）
- [x] **K2** 内容管理 CRUD：routes/ domain/chapter/card/question + 全量测试 99 个（完成于 2026-05-21）
- [x] **K3** AI 内容生成：routes/ai_generation.py + MockProvider + 全量测试（完成于 2026-05-21）
- [x] **K4** 敏感词库：routes/sensitive_words.py + 7 端点 + Redis 缓存同步 + 全量测试（完成于 2026-05-21）
- [x] **K5** AI 笔记审核：routes/review.py + 10 端点 + 三级审核流程 + 全量测试（完成于 2026-05-21）

---

## 🔴 进行中

_暂无进行中任务_

---

## ⚪ 待开始（按依赖顺序排列）

### ① 认证服务 (Auth) — 4 个子任务（A1/A2/A3 已完成）
- [ ] Auth 服务单元测试
- [ ] Auth API 集成测试

### ② 知识管理服务 (Knowledge) — 12 个子任务
- [x] **K1** Knowledge 骨架搭建：main.py + 全部 ORM 模型（8 张表）
- [x] **K2** 内容管理 CRUD：routes/ domain / chapter / card / question
- [x] **K3** AI 内容生成：ai/AIProvider.py + ai/deepseek.py + 生成路由
- [x] **K4** 敏感词库：routes/sensitive_words.py + Redis 缓存同步
- [x] **K5** AI 笔记审核：tasks/review_worker.py + 审核路由
- [ ] **K6** 审核统计
- [ ] Knowledge 服务单元测试
- [ ] Knowledge API 集成测试

### ③ 核心服务 (Core) — 16 个子任务
- [ ] **C1** Core 骨架搭建：main.py + ORM 模型（12 张表）+ clients/KnowledgeClient.py + middleware/JWT 中间件
- [ ] **C2** 学习记录 API：学习状态、答题判定、错题本、收藏夹、每日挑战
- [ ] **C3** 记忆强化 API：间隔重复调度、复习计划配置、遗忘预警
- [ ] **C4** 笔记管理 API：笔记 CRUD + 审核提交/撤回/分享/违规限制
- [ ] **C5** 积分体系 API：积分获取/消耗/里程碑/明细
- [ ] **C6** 运营配置 API：Banner/主题色/公告/广告/成就徽章
- [ ] **C7** 数据看板 API：核心指标/内容数据/用户数据/积分广告统计/审核统计
- [ ] **C8** 系统管理：操作日志
- [ ] Core 服务单元测试
- [ ] Core API 集成测试

### 🔗 联调提测
- [ ] **M15** V1.0 联调提测

---

## 状态总览摘要

| 模块 | 总子任务 | ✅ 已完成 | 🔴 进行中 | ⚪ 待开始 | 完成率 |
|:----|:-------:|:--------:|:---------:|:---------:|:-----:|
| 文档 & 规范 | 13 | 13 | 0 | 0 | 100% |
| Alembic 迁移修复 | 8 | 8 | 0 | 0 | 100% |
| 搬迁至 Ubuntu | 3 | 3 | 0 | 0 | 100% |
| Auth 服务 | 8 | 4 (A1, A2, A3, A4) | 0 | 4 | 50% |
| Knowledge 服务 | 12 | 5 (K1~K5) | 0 | 7 | 42% |
| Core 服务 | 16 | 0 | 0 | 16 | 0% |
| 联调提测 | 1 | 0 | 0 | 1 | 0% |
| **合计** | **61** | **33** | **0** | **28** | **54%** |
