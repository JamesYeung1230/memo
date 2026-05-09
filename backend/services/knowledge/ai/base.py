from collections.abc import Mapping
from typing import Any, Protocol

from shared.models.knowledge_read import AIGeneratedCard, QuestionRead, ReviewResult


class AIProvider(Protocol):
    async def generate_card(self, topic: str, chapter_id: str) -> AIGeneratedCard:
        ...

    async def generate_cards(
        self, topics: list[str], chapter_id: str
    ) -> list[AIGeneratedCard]:
        ...

    async def generate_question(
        self, card_id: str, card_content: Mapping[str, Any]
    ) -> QuestionRead:
        ...

    async def review_note(self, title: str, content: str) -> ReviewResult:
        ...
