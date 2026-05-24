from services.knowledge.routes.domain import router as domain_router
from services.knowledge.routes.chapter import router as chapter_router
from services.knowledge.routes.card import router as card_router
from services.knowledge.routes.question import router as question_router
from services.knowledge.routes.ai_generation import router as ai_generation_router
from services.knowledge.routes.sensitive_words import router as sensitive_words_router

from services.knowledge.routes.review import router as review_router

__all__ = [
    "domain_router",
    "chapter_router",
    "card_router",
    "question_router",
    "ai_generation_router",
    "sensitive_words_router",
    "review_router",
]
