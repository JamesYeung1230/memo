#!/usr/bin/env bash
# ============================================================
# 同步 backend/ 代码到 VM (tar+ssh 管道模式，无需 rsync)
#
# 用法：
#   ./backend/scripts/sync-backend.sh           # 手动同步
#   ./backend/scripts/sync-backend.sh --watch   # 启动文件监听
#
# 原理：tar 打包 → SSH 管道 → 远端解包
#       新增/修改文件会同步，删除文件需手动清理
# ============================================================

set -e

VM_USER="peng"
VM_HOST="192.168.234.128"
VM_BASE="/home/peng/memo"
LOCAL_BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
SYNCIGNORE="${LOCAL_BACKEND}/.syncignore"

VM_BACKEND="${VM_BASE}/backend"

echo "=========================================="
echo "  同步 backend/ → ${VM_USER}@${VM_HOST}:${VM_BACKEND}"
echo "=========================================="

# 远端创建目标目录
ssh "${VM_USER}@${VM_HOST}" "mkdir -p ${VM_BACKEND}"

# tar 打包 → SSH 管道 → 远端解包
tar czf - \
  --exclude-from="${SYNCIGNORE}" \
  -C "${LOCAL_BACKEND}" . \
| ssh "${VM_USER}@${VM_HOST}" "tar xzf - -C ${VM_BACKEND}"

echo ""
echo "  ✅ 同步完成"
echo "=========================================="
