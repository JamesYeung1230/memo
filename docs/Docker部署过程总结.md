# Docker 部署全过程总结

> 从 Trae IDE 对话开始 → 到 `docker compose up -d` 三个应用服务 `Restarting`、PostgreSQL 和 Redis 健康运行为止。
> 由于项目处于 M1 基础设施搭建阶段，应用服务代码未开发，`Restarting` 状态属正常现象。

---

## 从准备 Ubuntu 开发环境开始

### 1、执行 `sudo apt install -y curl wget git vim build-essential openssh-server ...`，遇到依赖冲突

**问题**：`bzip2` 依赖的 `libbz2-1.0` 版本不匹配，`build-essential` 无法安装。

**解决**：该项目使用 Docker 运行服务，宿主机不需要编译 C 扩展，直接跳过 `build-essential`，仅安装核心工具。

---

### 2、执行 `sudo add-apt-repository ppa:deadsnakes/ppa -y && sudo apt install -y python3.12 python3.12-venv python3.12-dev`，遇到依赖冲突

**问题**：`python3.12-dev` 依赖的 `zlib1g-dev` → `zlib1g` 版本不匹配。

**解决**：跳过 `python3.12-dev`（Docker 构建时自动处理编译依赖），只安装 `python3.12` 和 `python3.12-venv`，安装成功。

---

### 3、执行 Docker 安装命令，遇到网络连接失败和 GPG 密钥错误

**问题**：`curl` 连接 `download.docker.com` 被重置，`gpg` 无法获取密钥。最终 `apt install docker-ce` 报错"没有可安装候选"。

**尝试**：使用阿里云镜像 `mirrors.aliyun.com` 替代 Docker 官方源。

**最终解决**：使用 Docker 官方一键安装脚本 `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`，安装成功。

---

### 4、执行 `docker ps`，遇到权限拒绝

**问题**：`permission denied while trying to connect to the Docker API at unix:///var/run/docker.sock`。

**原因**：虽然执行了 `sudo usermod -aG docker $USER`，但当前 SSH 会话未重新登录，组权限未生效。

**解决**：执行 `exit` 退出 SSH 重新连接，`docker ps` 正常执行。

---

### 5、执行 `scp -r d:\workspace\memo\backend` 复制文件到 Ubuntu，遇到路径识别错误

**问题**：PowerShell 中 `scp` 报错 `stat local "d:workspacememobackend": No such file or directory`。

**原因**：反斜杠 `\` 被 shell 吃掉。

**解决**：确认使用正确的 Windows 路径格式 `d:\workspace\memo\backend`，复制成功。

---

### 6、执行 `ssh peng@192.168.234.128`，遇到密码拒绝

**问题**：`Permission denied, please try again.`，密码确认正确。

**原因**：用户名大小写问题。Ubuntu 实际用户名是 `peng`（小写），Windows 端输入了 `Peng`（大写）。

**解决**：使用小写用户名 `ssh peng@192.168.234.128`，登录成功。

---

### 7、执行 `scp` 复制文件到 `~/memo/`，遇到权限拒绝

**问题**：提示 `Permission denied`。

**原因**：Ubuntu 上 `~/memo/` 目录不存在，SCP 无法自动创建目标目录。

**解决**：先在 Ubuntu 执行 `mkdir -p ~/memo`，然后重新执行 SCP 复制，成功。

---

### 8、执行 `docker compose up -d` 拉取镜像，遇到 Docker Hub 连接失败

**问题**：`failed to resolve reference "docker.io/library/postgres:16": dial tcp 157.240.7.8:443: connect: connection refused`。Docker Hub 被墙。

**尝试方案 A**：配置 Docker 镜像加速器 `registry-mirrors`，先后尝试了：
- `docker.1ms.run`、`docker.xuanyuan.me` → 拉取到一半报错 `content digest not found`，缓存不完整
- 阿里云 `registry.cn-hangzhou.aliyuncs.com` → 需要写完整镜像路径
- `docker.nju.edu.cn`、`docker.mirrors.sjtug.sjtu.edu.cn`、`mirror.baidubce.com` → 同样连不上
- 清空加速器直接拉取原始镜像 → Ubuntu 网络连不上 Docker Hub

**最终解决**：使用 `daocloud.io` 镜像加速器组合 `docker.m.daocloud.io` + `docker.1ms.run` + `docker.xuanyuan.me`，`docker compose pull` 执行成功。

---

### 9、执行 `docker compose up -d` 启动服务，三个应用服务反复重启

**问题**：三个应用服务 `codesail-auth`、`codesail-core`、`codesail-knowledge` 状态为 `Restarting`，日志报错 `Could not import module "main"`。

**原因**：项目处于 M1 基础设施搭建阶段，`services/auth/`、`services/core/`、`services/knowledge/` 目录下**还没有 `main.py` 代码文件**，只有 Dockerfile、requirements.txt、alembic 等配置。服务代码尚未开发，镜像中的入口文件不存在，容器自然无法启动。

**结论**：这不是故障，是项目进度的正常现象。PostgreSQL 和 Redis 已健康运行，三个应用服务待后续开发代码后重新构建镜像即可正常运行。

---

## 最终结果

通过 `docker ps` 判断：

```
STATUS:
  postgres:16   → Up (healthy)    ✅
  redis:7       → Up (healthy)    ✅
  backend-auth  → Restarting      ⏳（代码未开发，正常）
  backend-core  → Restarting      ⏳（代码未开发，正常）
  backend-knowledge → Restarting  ⏳（代码未开发，正常）
```

**指标**：PostgreSQL 和 Redis 健康运行即表示 Docker 部署成功。应用服务待后续开发代码后，执行 `docker compose build <service>` 构建镜像即可恢复正常。
