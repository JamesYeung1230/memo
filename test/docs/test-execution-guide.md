# Test Execution Script — CodeSail V1.0 Full Test Suite

> 使用前确保后端服务可访问（`docker compose up -d` 或指向 PROD API）

## 快速开始

```bash
cd memo/test

# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量（复制并编辑 .env.example）
cp .env.example .env
# 编辑 .env:
#   AUTH_BASE_URL=http://<backend-host>:8001/api/v1
#   KNOWLEDGE_BASE_URL=http://<backend-host>:8002/api/v1
#   CORE_BASE_URL=http://<backend-host>:8000/api/v1
#   ADMIN_USERNAME=admin
#   ADMIN_PASSWORD=admin123
#   WX_MOCK_MODE=true

# 3a. 运行 API 集成测试
pytest tests/auth/ tests/knowledge/ tests/core/ -v --tb=short

# 3b. 运行 Webapp E2E 测试（需先启动 webapp dev server）
cd ../webapp && npm run dev &
cd ../test
pytest tests/webapp/ -v --tb=short

# 3c. 运行全部测试 + HTML 报告
pytest tests/ -v --tb=short --html=test-report.html --self-contained-html

# 4. 按标记筛选
pytest -m auth -v                    # Auth 服务测试
pytest -m knowledge -v               # Knowledge 服务测试
pytest -m webapp -v                  # Webapp E2E 测试
pytest -m smoke -v                   # 冒烟测试
```

## 预计测试覆盖

| 测试套件 | 文件 | 用例数 | 运行时间 |
|---------|------|:-----:|:------:|
| Auth API | tests/auth/ (6 files) | 36 | ~30s |
| Knowledge API | tests/knowledge/ (7 files) | 51 | ~2min |
| Core API | tests/core/ (1 file) | 1 | ~5s |
| Webapp AI Workbench | tests/webapp/test_ai_workbench.py | 20 | ~2min |
| Webapp Content | tests/webapp/test_content.py | 18 | ~3min |
| Webapp Operations | tests/webapp/test_operations.py | 22 | ~3min |
| Webapp Dashboard | tests/webapp/test_dashboard_system.py | 28 | ~3min |
| **合计** | **18 files** | **176+** | **~14min** |

## 手动测试

小程序黑盒测试用例参见 `docs/miniapp-test-cases.md`，需在微信开发者工具或真机上手动执行。
