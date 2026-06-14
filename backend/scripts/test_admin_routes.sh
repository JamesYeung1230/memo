#!/bin/bash
set -e

# Login
RESP=$(curl -s -X POST http://localhost:8001/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")
echo "Token: ${TOKEN:0:20}..."

# Test 1: Review statistics
echo "=== GET /admin/review/statistics ==="
curl -s http://localhost:8000/api/v1/admin/review/statistics \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Test 2: Sensitive words list
echo "=== GET /admin/sensitive-words ==="
curl -s "http://localhost:8000/api/v1/admin/sensitive-words?page=1&page_size=5" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Test 3: Review queue
echo "=== GET /admin/review/queue ==="
curl -s "http://localhost:8000/api/v1/admin/review/queue?page=1&page_size=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "=== All tests passed ==="
