# VMware+Ubuntu 安装 Claude Code 教程（使用 DeepSeek 模型）

> 本文档面向在 VMware 虚拟机上安装了 Ubuntu 并希望配置 Claude Code 使用 DeepSeek 模型的开发者。

---

## 目录

- [1. 环境概览](#1-环境概览)
- [2. 前置条件](#2-前置条件)
- [3. 安装 Node.js](#3-安装-nodejs)
- [4. 安装 Claude Code](#4-安装-claude-code)
- [5. 获取 DeepSeek API Key](#5-获取-deepseek-api-key)
- [6. 配置 DeepSeek 为后端模型](#6-配置-deepseek-为后端模型)
- [7. 验证安装](#7-验证安装)
- [8. 进阶：多 Provider 切换](#8-进阶多-provider-切换)
- [9. 常见问题](#9-常见问题)

---

## 1. 环境概览

```
宿主机: Windows
虚拟机软件: VMware Workstation / VMware Player
虚拟机系统: Ubuntu 22.04 LTS 或 24.04 LTS
目标工具: Claude Code CLI
后端模型: DeepSeek Chat (通过 Anthropic 兼容 API)
```

### 推荐虚拟机配置

| 资源 | 建议值 | 说明 |
|------|--------|------|
| CPU | 2 核+ | 影响 Claude Code 响应速度 |
| 内存 | 4GB+ | 8GB 更佳，Node.js 需要一定内存 |
| 磁盘 | 20GB+ | Claude Code 本身较小，需预留项目空间 |
| 网络 | NAT 或桥接 | 需访问 DeepSeek API |

---

## 2. 前置条件

确保 Ubuntu 虚拟机已就绪，网络连通：

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git build-essential
```

---

## 3. 安装 Node.js

Claude Code 需要 Node.js 18+，推荐安装 20.x LTS 版本。

### 方法一：使用 NodeSource 官方源（推荐）

```bash
# 添加 NodeSource 仓库（Node.js 20.x LTS）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
sudo apt install -y nodejs

# 验证安装
node --version   # 应输出 v20.x.x
npm --version    # 应输出 10.x.x
```

### 方法二：使用 nvm（Node Version Manager，多版本管理）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc

# 安装 Node.js 20 LTS
nvm install 20
nvm use 20

# 验证安装
node --version
npm --version
```

---

## 4. 安装 Claude Code

### 通过 npm 全局安装

```bash
npm install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

安装完成后，`claude` 命令即可全局使用。

---

## 5. 获取 DeepSeek API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册/登录账号
3. 进入 API Keys 页面，创建一个新的 API Key
4. 复制并保存好 API Key（离开页面后不再显示完整 Key）

> DeepSeek 目前提供一定的免费额度，适合开发和测试使用。

---

## 6. 配置 DeepSeek 为后端模型

DeepSeek 提供了 Anthropic 兼容 API，Claude Code 可以通过环境变量直接接入。有两种配置方式：

### 方式一：通过环境变量（推荐，灵活切换）

将以下内容添加到 `~/.bashrc` 或 `~/.zshrc`：

```bash
# === Claude Code + DeepSeek 配置 ===
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-你的DeepSeekAPIKey"   # 替换为你的 Key
export ANTHROPIC_MODEL="deepseek-chat"
export ANTHROPIC_SMALL_FAST_MODEL="deepseek-chat"
export API_TIMEOUT_MS=600000                           # 超时 10 分钟
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

重新加载配置：

```bash
source ~/.bashrc
```

### 方式二：通过 settings.json 配置（持久化）

创建或编辑 `~/.claude/settings.json`：

```json
{
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com/anthropic",
  "authToken": "sk-你的DeepSeekAPIKey",
  "modelConfig": {
    "smallFastModel": "deepseek-chat",
    "timeoutMs": 600000
  },
  "disableNonEssentialTraffic": true
}
```

### 关于环境变量的说明

| 环境变量 | 作用 | 说明 |
|---------|------|------|
| `ANTHROPIC_BASE_URL` | API 端点地址 | DeepSeek 的 Anthropic 兼容接口地址 |
| `ANTHROPIC_AUTH_TOKEN` | 认证 Token | 填入 DeepSeek API Key |
| `ANTHROPIC_MODEL` | 主模型 | `deepseek-chat` 为 DeepSeek V4 对话模型 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 快速模型 | 简单任务使用，可设为同一模型 |
| `API_TIMEOUT_MS` | 超时时间 | DeepSeek 模型输出较长时防止客户端超时 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | 禁用非必要流量 | 设为 1 可减少不必要的网络请求 |

---

## 7. 验证安装

### 7.1 验证接口连通性

先确认 DeepSeek API 能正常响应：

```bash
# 简单测试（替换为你的 API Key）
curl -X POST "https://api.deepseek.com/anthropic/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-你的DeepSeekAPIKey" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "deepseek-chat",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

如果返回包含 `content` 的 JSON 响应，说明 API 连通正常。

### 7.2 启动 Claude Code

```bash
# 进入项目目录
cd /path/to/your/project

# 启动交互式会话
claude
```

### 7.3 交互测试

在 Claude Code 交互界面中输入：

```
你好，请确认你现在使用的是 DeepSeek 模型。
```

能正常回复即表示配置成功。

---

## 8. 进阶：多 Provider 切换

如果需要在不同模型之间切换，可以在 `~/.bashrc` 中定义切换函数：

```bash
# === Claude Code 多 Provider 切换 ===

# 切换到 DeepSeek
deepseek() {
  export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
  export ANTHROPIC_AUTH_TOKEN="$DEEPSEEK_API_KEY"
  export ANTHROPIC_MODEL="deepseek-chat"
  export ANTHROPIC_SMALL_FAST_MODEL="deepseek-chat"
  export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
  echo "已切换到 DeepSeek"
  claude "$@"
}

# 重置为默认 Anthropic
claude_reset() {
  unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN ANTHROPIC_MODEL
  unset ANTHROPIC_SMALL_FAST_MODEL CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
  echo "已重置为默认 Anthropic 配置"
}
```

使用方式：

```bash
deepseek        # 启动 Claude Code 并使用 DeepSeek
deepseek "帮我分析这个项目的结构"   # 直接附带提示词
claude_reset                          # 切换回默认配置
```

---

## 9. 常见问题

### Q1: `claude` 命令找不到

**原因**：npm 全局安装路径未在 PATH 中。

**解决**：
```bash
# 查看 npm 全局安装路径
npm root -g

# 将路径添加到 ~/.bashrc
echo 'export PATH=$(npm root -g)/../bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Q2: API 超时

**原因**：DeepSeek 模型生成长内容时可能超时。

**解决**：
```bash
# 增大超时时间
export API_TIMEOUT_MS=600000
```

### Q3: "Not a valid model" 错误

**原因**：设置了错误的模型名。

**解决**：DeepSeek 目前支持 `deepseek-chat`，传入不支持的模型名时 API 会自动映射到 `deepseek-chat`。

### Q4: Node.js 版本过低

**原因**：系统包管理器安装的 Node.js 版本过旧。

**解决**：使用 NodeSource 源或 nvm 安装最新 LTS 版本。

### Q5: VMware 虚拟机网络问题

**原因**：虚拟机无法访问外部 API。

**解决**：
- 确认 VMware 虚拟机的网络适配器设置为 NAT 或桥接模式
- 在虚拟机内执行 `ping api.deepseek.com` 测试网络连通性
- 如果公司网络有防火墙限制，可能需要配置 HTTP 代理
