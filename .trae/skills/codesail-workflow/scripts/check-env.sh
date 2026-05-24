#!/bin/bash
# ============================================================
# CodeSail 环境自检脚本
# 用法：上传到 VM 后 bash /tmp/check-env.sh
# 检查项：Auth API / PostgreSQL / Redis / 容器状态
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass()  { echo -e "${GREEN}[PASS]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
check() {
    if [ $? -eq 0 ]; then pass "$1"; else fail "$1"; fi
}

echo "=========================================="
echo "  CodeSail 环境自检"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# ---- Auth API ----
echo "--- Auth API (:8001) ---"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 http://localhost:8001/docs)
if [ "$HTTP_CODE" = "200" ]; then
    pass "Auth /docs HTTP $HTTP_CODE"
else
    fail "Auth /docs HTTP $HTTP_CODE"
fi

LOGIN_RESP=$(curl -s -X POST http://localhost:8001/api/v1/wechat/login \
    -H 'Content-Type: application/json' \
    -d '{"code":"env_check_'$(date +%s)'"}' --connect-timeout 5)
LOGIN_CODE=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
if [ "$LOGIN_CODE" = "0" ]; then
    pass "POST /api/v1/wechat/login → code=0"
else
    fail "POST /api/v1/wechat/login 异常: $LOGIN_RESP"
fi

# ---- PostgreSQL ----
echo ""
echo "--- PostgreSQL (:5432) ---"
SCHEMAS=$(docker exec codesail-postgres psql -U postgres -d codesail -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';" 2>/dev/null)
if [ -n "$SCHEMAS" ]; then
    pass "Schema 列表: $(echo $SCHEMAS | tr '\n' ' ')"
else
    fail "无法查询 Schema"
fi

TABLE_COUNT=$(docker exec codesail-postgres psql -U postgres -d codesail -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('auth','knowledge','core');" 2>/dev/null | tr -d ' ')
echo "  总表数: $TABLE_COUNT"

# ---- Redis ----
echo ""
echo "--- Redis (:6379) ---"
REDIS_PING=$(docker exec codesail-redis redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" = "PONG" ]; then
    pass "Redis PING → PONG"
else
    fail "Redis PING 失败"
fi

# ---- 容器状态 ----
echo ""
echo "--- 容器状态 ---"
docker ps -a --format '  {{.Names}}\t{{.Status}}' | while read line; do
    name=$(echo "$line" | awk '{print $1}')
    status=$(echo "$line" | cut -f2-)
    if echo "$status" | grep -q "Up"; then
        pass "$name → $status"
    else
        warn "$name → $status"
    fi
done

# ---- 服务缺失提醒 ----
echo ""
if ! docker ps --format '{{.Names}}' | grep -q "codesail-knowledge"; then
    warn "Knowledge 服务未启动（待 K1 开发）"
fi
if ! docker ps --format '{{.Names}}' | grep -q "codesail-core"; then
    warn "Core 服务未启动（待 C1 开发）"
fi

echo ""
echo "=========================================="
echo "  自检完成"
echo "=========================================="
