from services.auth.routes.admin import router as admin_router
from services.auth.routes.wechat import router as wechat_router

__all__ = ["admin_router", "wechat_router"]
