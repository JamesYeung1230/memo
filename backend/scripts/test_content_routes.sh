#!/bin/bash
# E2E test for content management admin proxy routes
set -e

TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")

echo "=== 1. GET /admin/domains ==="
curl -s "http://localhost:8000/api/v1/admin/domains?page=1&page_size=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "=== 2. GET /admin/chapters ==="
curl -s "http://localhost:8000/api/v1/admin/chapters" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "=== 3. GET /admin/cards ==="
curl -s "http://localhost:8000/api/v1/admin/cards?page=1&page_size=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "=== 4. GET /admin/questions ==="
curl -s "http://localhost:8000/api/v1/admin/questions?page=1&page_size=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo "=== 5. POST create domain ==="
curl -s -X POST http://localhost:8000/api/v1/admin/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"test_domain","icon":"🧪"}' | python3 -m json.tool

echo "=== All content route tests completed ==="
