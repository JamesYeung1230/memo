# 码上启航 (CodeSail) — AI编程知识学习小程序

面向非专业编程用户的碎片化学习工具，通过知识卡片、刷题练习与间隔重复记忆强化，帮助 AI 编程学习者建立计算机基础认知。

## 技术栈

- **框架**：微信原生框架
- **渲染引擎**：Skyline
- **组件框架**：glass-easel
- **设计来源**：Pixso (CodeSail.pen)

## 当前阶段

🟢 **项目初始化已完成** — 项目骨架搭建完毕，37个页面 + 17个公共组件就绪。

## 代码仓库

[https://github.com/JamesYeung1230/memo.git](https://github.com/JamesYeung1230/memo.git)

## 文档

| 文档 | 说明 |
|------|------|
| [project.md](project.md) | 项目总览、里程碑、强制要求 |
| [PRD.md](docs/PRD.md) | 产品需求文档 |
| [交互设计.md](docs/交互设计.md) | 交互设计与 UI 规范 |
| [CodeSail.pen](designs/CodeSail.pen) | UI 设计源文件 |

## 项目结构

```
miniapp/
├── app.js                          # 小程序入口（登录态/主题色管理）
├── app.json                        # 全局配置（37页面路由 + 自定义TabBar）
├── app.wxss                        # 全局样式（Design Token CSS变量）
├── .eslintrc.js                    # ESLint 配置
├── sitemap.json                    # 站点地图
├── pages/
│   ├── login/                      # L0 登录页
│   ├── home/home/                  # L1 首页（Tab）
│   ├── learn/                      # L1 学习Tab + L2/L3 子页面
│   │   ├── learn/                  # L1 学习主页
│   │   ├── knowledge-tree/         # L2 知识目录导航
│   │   ├── card-browse/            # L2 知识卡片浏览
│   │   ├── card-detail/            # L3 卡片详情
│   │   ├── quiz/                   # L2 答题页面
│   │   ├── quiz-result/            # L3 答题结果与解析
│   │   ├── quiz-analysis/          # L3 单题解析
│   │   ├── daily-challenge/        # L2 每日挑战
│   │   ├── challenge-result/       # L3 每日挑战结果
│   │   ├── error-book/             # L2 错题本
│   │   ├── error-review/           # L2 错题再练
│   │   ├── quiz-stats/             # L2 答题统计
│   │   ├── review-today/           # L2 今日复习
│   │   ├── note-review/            # L2 笔记回顾
│   │   ├── chapter-progress/       # L3 章节学习进度
│   │   └── review-settings/        # L3 复习计划配置
│   ├── notes/                      # L1 笔记Tab + L2/L3 子页面
│   │   ├── notes/                  # L1 笔记列表主页
│   │   ├── note-editor/            # L2 新建/编辑笔记
│   │   ├── note-detail/            # L2 笔记详情
│   │   └── note-share/             # L3 笔记分享预览
│   ├── points/                     # L1 积分Tab + L2/L3 子页面
│   │   ├── points/                 # L1 积分主页
│   │   ├── points-detail/          # L2 积分明细
│   │   ├── unlock-shop/            # L2 知识解锁商店
│   │   ├── unlock-confirm/         # L3 解锁确认
│   │   ├── achievements/           # L2 成就徽章墙
│   │   └── achievement-detail/     # L3 徽章详情
│   └── profile/                    # L1 个人中心Tab + L2/L3 子页面
│       ├── profile/                # L1 个人主页
│       ├── study-stats/            # L2 学习统计总览
│       ├── favorites/              # L2 收藏夹
│       ├── calendar/               # L2 打卡日历
│       ├── audit-history/          # L2 笔记审核记录
│       ├── settings/               # L2 设置入口
│       ├── memory-settings/        # L3 记忆强化设置
│       ├── home-settings/          # L3 首页模块设置
│       └── general-settings/       # L3 通用设置
├── components/
│   ├── navigation-bar/             # C01 自定义导航栏（已有）
│   ├── tab-bar/                    # C02 自定义底部导航栏
│   ├── knowledge-card/             # C03 知识卡片
│   ├── progress-ring/              # C04 环形进度条
│   ├── progress-bar/               # C05 线性进度条
│   ├── empty-state/                # C06 空状态占位
│   ├── loading-skeleton/           # C07 骨架屏
│   ├── loading-spinner/            # C08 加载旋转器
│   ├── toast/                      # C09 全局提示
│   ├── tag/                        # C10 标签碎片
│   ├── badge/                      # C11 通知徽标
│   ├── swipe-action/               # C12 左滑操作
│   ├── modal/                      # C14 居中弹窗
│   ├── search-bar/                 # C16 搜索栏
│   ├── quiz-option/                # C17 答题选项
│   ├── status-dot/                 # C21 审核状态点
│   └── button/                     # 统一按钮组件
└── docs/                           # 产品与设计文档
```

## 设计规范

详见 [交互设计.md](docs/交互设计.md)：
- **设计 Token**：颜色/字体/间距/圆角/阴影 均通过 CSS 变量统一定义
- **主题色**：默认 #4A90D9（品牌蓝），支持管理端动态下发
- **组件库**：C01~C24 共 24 个公共组件（已实现核心 17 个）
- **路由层级**：L0(登录) → L1(Tab) → L2(子页) → L3(详情) → L4(弹窗)

## 开发里程碑

| 阶段 | 内容 | 状态 |
|------|------|:----:|
| M0 | 项目初始化 | 🟢 已完成 |
| M1 | 首页框架 MVP | ⚪ 待开始 |
| M2 | 知识卡片学习 | ⚪ 待开始 |
| M3 | 刷题学习 | ⚪ 待开始 |
| M4 | 笔记管理 | ⚪ 待开始 |
| M5 | 笔记审核与分享 | ⚪ 待开始 |
| M6 | 记忆强化系统 | ⚪ 待开始 |
| M7 | 积分与成就体系 | ⚪ 待开始 |
| M8 | 首页个性化 | ⚪ 待开始 |
| M9 | 个人中心 | ⚪ 待开始 |
| M10 | 数据持久化 | ⚪ 待开始 |
| M11 | V1.0 提测 | ⚪ 待开始 |
