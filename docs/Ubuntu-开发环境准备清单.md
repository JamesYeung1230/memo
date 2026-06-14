# Ubuntu 开发环境准备清单

> 根据你的 4 项任务，梳理出在 Ubuntu 虚拟机上需要安装的全部软件和环境。
> 文档末尾附有**一键安装脚本**和**验证命令**，可直接复制执行。

---

## 目录

- [任务映射](#任务映射)
- [安装总览图](#安装总览图)
- [第一阶段：基础系统工具](#第一阶段基础系统工具)
- [第二阶段：运行环境安装](#第二阶段运行环境安装)
- [第三阶段：服务安装（Docker 方案）](#第三阶段服务安装docker-方案)
- [第三阶段（备选）：服务安装（本地方案）](#第三阶段备选服务安装本地方案)
- [第四阶段：Claude Code](#第四阶段claude-code)
- [第五阶段：Trae IDE 远程连接](#第五阶段trae-ide-远程连接)
- [第六阶段：项目部署](#第六阶段项目部署)
- [一键安装脚本](#一键安装脚本)
- [安装验证清单](#安装验证清单)

---

## 任务映射

| # | 你的任务 | 需要安装的内容 | 涉及阶段 |
|:-|---------|---------------|:-------:|
| 1 | 将后端工程搬到 Ubuntu | Git + SSH | 一、六 |
| 2 | 安装 Claude Code | Node.js + Claude Code CLI + DeepSeek 配置 | 四 |
| 3 | Trae IDE 链接虚拟机 | SSH Server + 网络配置 | 五 |
| 4 | 配置虚拟机所需环境 | Python + PostgreSQL + Redis + Docker | 一、二、三 |

---

## 安装总览图

```
Ubuntu 虚拟机 (VMware)
│
├── 🔧 基础工具层
│   ├── curl / wget / git / vim / build-essential
│   └── openssh-server（Trae IDE 远程连接用）
│
├── 🐍 Python 环境层
│   ├── Python 3.12
│   ├── pip / venv
│   └── ruff / pytest（全局工具）
│
├── 🗄️ 基础服务层（二选一）
│   ├── 🐳 Docker + Docker Compose（推荐）
│   │   └── 容器内运行 PostgreSQL 16 + Redis 7
│   └── 📦 本地安装（备选）
│       ├── PostgreSQL 16
│       └── Redis 7
│
├── 🤖 AI 工具层
│   ├── Node.js 20 LTS
│   └── Claude Code CLI （使用 DeepSeek 模型）
│
└── 📁 项目层
    └── git clone 后端项目 + pip install -r requirements
```

---

## 第一阶段：基础系统工具

### 1.1 系统更新

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 必备工具

| 软件 | 版本要求 | 用途 | 安装命令 |
|------|---------|------|---------|
| curl | 最新 | 下载文件、测试 API | `sudo apt install -y curl` |
| wget | 最新 | 下载文件 | `sudo apt install -y wget` |
| git | 最新 | 版本控制、clone 项目 | `sudo apt install -y git` |
| vim / nano | 最新 | 终端文本编辑 | `sudo apt install -y vim` |
| build-essential | 最新 | 编译 C 扩展（pip 安装时需要） | `sudo apt install -y build-essential` |
| openssh-server | 最新 | **Trae IDE 远程连接** | `sudo apt install -y openssh-server` |
| net-tools | 最新 | 网络诊断（ifconfig 等） | `sudo apt install -y net-tools` |

**安装命令：**

```bash
sudo apt install -y curl wget git vim build-essential openssh-server net-tools
```

### 1.3 验证基础工具

```bash
git --version
curl --version
ssh -V
```

---

## 第二阶段：运行环境安装

### 2.1 Python 3.12

项目要求 Python 3.12+。Ubuntu 22.04 默认是 Python 3.10，需要从 deadsnakes PPA 安装。

```bash
# 添加 deadsnakes PPA
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# 安装 Python 3.12
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# 安装 pip
curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.12

# 设置 python3 指向 3.12（可选）
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1

# 验证
python3 --version   # 应输出 Python 3.12.x
pip3 --version
```

### 2.2 全局 Python 工具

```bash
# 安装 ruff（linter）和 pytest（测试）
pip3 install ruff pytest
```

---

## 第三阶段：服务安装（Docker 方案）

**推荐方案**：本项目使用 Docker Compose 管理 PostgreSQL、Redis 和三个微服务。在 Ubuntu 上安装 Docker 即可一键启动所有服务。

### 3.1 Docker

```bash
# 卸载旧版本
sudo apt remove -y docker docker-engine docker.io containerd runc

# 安装依赖
sudo apt install -y ca-certificates gnupg

# 添加 Docker 官方 GPG 密钥和仓库
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 将当前用户加入 docker 组（免 sudo 执行 docker）
sudo usermod -aG docker $USER
newgrp docker    # 立即生效
```

### 3.2 验证 Docker

```bash
docker --version
docker compose version
docker run hello-world
```

### 3.3 后续操作说明

安装完成后，在项目目录中执行以下命令即可启动全部服务：

```bash
cd ~/codesail-backend
cp .env.example .env    # 按需编辑 .env
docker compose up -d    # 一键启动 PostgreSQL + Redis + 3 个服务
```

---

## 第三阶段（备选）：服务本地安装

如果不使用 Docker，也可以直接在系统中安装 PostgreSQL 和 Redis。

### 备选 3.1 PostgreSQL 16

```bash
# 添加 PostgreSQL 官方仓库
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16

# 启动服务
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 设置 postgres 用户密码
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# 验证
psql --version
```

### 备选 3.2 Redis 7

```bash
# 添加 Redis 官方仓库
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt update
sudo apt install -y redis

# 启动服务
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 验证
redis-cli --version
redis-cli ping    # 应返回 PONG
```

---

## 第四阶段：Claude Code

### 4.1 Node.js 20 LTS

```bash
# 使用 NodeSource 源安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version   # 应输出 v20.x.x
npm --version    # 应输出 10.x.x
```

### 4.2 Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code

# 验证
claude --version
```

### 4.3 配置 DeepSeek 模型

将以下内容追加到 `~/.bashrc`（或 `~/.zshrc`）：

```bash
# === Claude Code + DeepSeek 配置 ===
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-你的DeepSeekAPIKey"   # ⚠️ 替换为你的 Key
export ANTHROPIC_MODEL="deepseek-chat"
export ANTHROPIC_SMALL_FAST_MODEL="deepseek-chat"
export API_TIMEOUT_MS=600000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

```bash
source ~/.bashrc
```

---

## 第五阶段：Trae IDE 远程连接

### 5.1 确认 SSH Server 已安装

```bash
sudo systemctl status ssh

# 如果未运行，启动并设置开机自启
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 5.2 获取虚拟机 IP

```bash
ip addr show
# 或
hostname -I
```

找到 `192.168.x.x` 格式的 IP 地址（NAT 模式）或与宿主机同网段的 IP（桥接模式）。

### 5.3 （可选）设置固定 IP

如果使用桥接模式，建议在路由器上绑定 MAC 地址 + IP，或直接在 Ubuntu 的网络设置中配置静态 IP，避免每次重启 IP 变化。

### 5.4 在 Trae IDE 中连接

在 Trae IDE 中：
1. 安装 **Remote - SSH** 扩展（VS Code 兼容）
2. 添加 SSH 目标：`ssh 用户名@虚拟机IP`
3. 连接后打开的目录：`~/codesail-backend`

> 需要宿主机和虚拟机网络互通，建议 VMware 网络模式设为**桥接模式**。

---

## 第六阶段：项目部署

### 6.1 克隆项目

```bash
# 在虚拟机中创建项目目录
mkdir -p ~/codesail-backend
cd ~/codesail-backend

# 克隆项目（需先在 GitHub/Gitee 上托管）
git clone <你的仓库地址> .

# 或通过 scp 直接从宿主机复制
# scp -r 用户名@宿主机IP:/path/to/memo/backend/* .
```

### 6.2 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填写真实的配置值：
# - ADMIN_PASSWORD_HASH（用命令生成）
# - DEEPSEEK_API_KEY
# - WX_APPID / WX_SECRET（如果涉及微信登录）
vim .env
```

### 6.3 安装 Python 依赖

如果使用 Docker 方案（推荐），依赖在构建镜像时自动安装，无需手动操作。

如果使用本地方案：

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装各服务依赖
pip install -r services/auth/requirements.txt
pip install -r services/core/requirements.txt
pip install -r services/knowledge/requirements.txt
```

---

## 一键安装脚本

以下脚本合并了上述所有安装步骤，可直接在 Ubuntu 终端中执行：

```bash
#!/bin/bash
set -e

echo "===== 1/6: 系统更新 & 基础工具 ====="
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim build-essential openssh-server net-tools software-properties-common ca-certificates gnupg

echo "===== 2/6: Python 3.12 ====="
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev
curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.12
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1
pip3 install ruff pytest

echo "===== 3/6: Docker + Docker Compose ====="
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER

echo "===== 4/6: Node.js 20 LTS ====="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "===== 5/6: Claude Code CLI ====="
npm install -g @anthropic-ai/claude-code

echo "===== 6/6: 启动 SSH 服务 ====="
sudo systemctl enable ssh
sudo systemctl start ssh

echo ""
echo "============================================"
echo "✅ 安装完成！请手动执行以下操作："
echo "1. 重新登录使 docker 组权限生效：exit 后重新 SSH"
echo "2. 配置 DeepSeek API Key 到 ~/.bashrc"
echo "3. git clone 项目到 ~/codesail-backend"
echo "4. 进入项目目录执行：docker compose up -d"
echo "============================================"
```

> ⚠️ 执行完脚本后，请 **退出当前 SSH 会话并重新登录**，使 `docker` 组权限生效。

---

## 安装验证清单

完成全部安装后，逐一验证以下项目：

### 基础工具

| 验证项 | 命令 | 预期结果 |
|--------|------|---------|
| Git | `git --version` | git version 2.x |
| SSH 服务 | `sudo systemctl status ssh` | active (running) |
| 虚拟机 IP | `hostname -I` | 显示 IP 地址 |

### Python

| 验证项 | 命令 | 预期结果 |
|--------|------|---------|
| Python 版本 | `python3 --version` | Python 3.12.x |
| pip | `pip3 --version` | pip 24.x |
| ruff | `ruff --version` | ruff 0.x |

### Docker

| 验证项 | 命令 | 预期结果 |
|--------|------|---------|
| Docker | `docker --version` | Docker 27.x |
| Docker Compose | `docker compose version` | Docker Compose 2.x |
| 免 sudo | `docker run hello-world` | Hello from Docker! |

### Claude Code

| 验证项 | 命令 | 预期结果 |
|--------|------|---------|
| Node.js | `node --version` | v20.x.x |
| Claude Code | `claude --version` | 显示版本号 |
| DeepSeek 配置 | `echo $ANTHROPIC_BASE_URL` | https://api.deepseek.com/anthropic |

### 项目启动

| 验证项 | 命令 | 预期结果 |
|--------|------|---------|
| 克隆项目 | `ls ~/codesail-backend/` | 显示项目文件 |
| Docker 启动 | `cd ~/codesail-backend && docker compose up -d` | 所有容器正常启动 |
| 服务健康 | `docker ps` | 5 个容器均为 Up 状态 |
| API 测试 | `curl http://localhost:8001/health` | 返回健康检查通过 |

---

## 附录：参考文档

| 文档 | 位置 |
|------|------|
| Claude Code 安装教程 | [docs/VMware-Ubuntu-Claude-Code-安装教程.md](VMware-Ubuntu-Claude-Code-安装教程.md) |
| Claude Code 使用手册 | [docs/Claude-Code-使用手册.md](Claude-Code-使用手册.md) |
| 后端项目详情 | [backend/project.md](../backend/project.md) |
| 技术选型文档 | [backend/docs/02-后端技术选型及架构设计文档.md](../backend/docs/02-后端技术选型及架构设计文档.md) |
| 环境变量清单 | [backend/docs/06-环境变量清单.md](../backend/docs/06-环境变量清单.md) |
