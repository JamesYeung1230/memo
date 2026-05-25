import json
import logging
from collections.abc import Mapping
from typing import Any

from openai import AsyncOpenAI

from shared.models.knowledge_read import (
    AIGeneratedCard,
    QuestionOptions,
    QuestionRead,
    ReviewResult,
)
from .base import AIProvider
from .prompts import (
    CARD_GENERATION_SYSTEM_PROMPT,
    CARD_GENERATION_USER_PROMPT,
    NOTE_REVIEW_SYSTEM_PROMPT,
    NOTE_REVIEW_USER_PROMPT,
    QUESTION_GENERATION_SYSTEM_PROMPT,
    QUESTION_GENERATION_USER_PROMPT,
)

logger = logging.getLogger(__name__)


class DeepSeekProvider(AIProvider):
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.deepseek.com",
        model: str = "deepseek-chat",
        max_retries: int = 2,
    ):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.max_retries = max_retries

    async def _call(
        self, system_prompt: str, user_prompt: str, retry_count: int = 0
    ) -> dict[str, Any]:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=2048,
            )
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from DeepSeek API")
            return json.loads(content)
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            if retry_count < self.max_retries:
                logger.warning(
                    "DeepSeek API response parse failed, retrying %d/%d: %s",
                    retry_count + 1,
                    self.max_retries,
                    str(e),
                )
                return await self._call(system_prompt, user_prompt, retry_count + 1)
            raise

    async def generate_card(self, topic: str, chapter_id: str) -> AIGeneratedCard:
        user_prompt = CARD_GENERATION_USER_PROMPT.format(topic=topic)
        data = await self._call(CARD_GENERATION_SYSTEM_PROMPT, user_prompt)
        return AIGeneratedCard(
            topic=topic,
            title=data.get("title", topic),
            core_concept=data.get("core_concept", ""),
            detail=data.get("detail", ""),
            life_analogy=data.get("life_analogy", ""),
            tags=data.get("tags", []),
            difficulty=data.get("difficulty", "beginner"),
            status="completed",
        )

    async def generate_cards(
        self, topics: list[str], chapter_id: str
    ) -> list[AIGeneratedCard]:
        results: list[AIGeneratedCard] = []
        for topic in topics:
            try:
                card = await self.generate_card(topic, chapter_id)
                results.append(card)
            except Exception as e:
                logger.error("Failed to generate card for topic '%s': %s", topic, str(e))
                results.append(
                    AIGeneratedCard(
                        topic=topic,
                        title="",
                        core_concept="",
                        detail="",
                        life_analogy="",
                        tags=[],
                        difficulty="beginner",
                        status="failed",
                    )
                )
        return results

    async def generate_question(
        self, card_id: str, card_content: Mapping[str, Any]
    ) -> QuestionRead:
        user_prompt = QUESTION_GENERATION_USER_PROMPT.format(
            title=card_content.get("title", ""),
            core_concept=card_content.get("core_concept", ""),
            detail=card_content.get("detail", ""),
            life_analogy=card_content.get("life_analogy", ""),
        )
        data = await self._call(QUESTION_GENERATION_SYSTEM_PROMPT, user_prompt)
        options = data.get("options", {})
        return QuestionRead(
            id="",
            card_id=card_id,
            question_text=data.get("question_text", ""),
            options=QuestionOptions(
                A=options.get("A", ""),
                B=options.get("B", ""),
                C=options.get("C", ""),
                D=options.get("D", ""),
            ),
            correct_option=data.get("correct_option", "A"),
            explanation=data.get("explanation", ""),
        )

    async def review_note(self, title: str, content: str) -> ReviewResult:
        user_prompt = NOTE_REVIEW_USER_PROMPT.format(title=title, content=content)
        data = await self._call(NOTE_REVIEW_SYSTEM_PROMPT, user_prompt)

        risk_score = data.get("risk_score", 0)
        needs_manual = data.get("needs_manual_review", False)
        is_rejected = data.get("is_rejected", False)

        if is_rejected or risk_score >= 61:
            status = "rejected"
        elif needs_manual or 31 <= risk_score <= 60:
            status = "pending_manual"
        else:
            status = "approved"

        return ReviewResult(
            review_id="",
            status=status,
            risk_score=risk_score,
            risk_labels=data.get("risk_labels", []),
            review_detail={
                "needs_manual_review": status == "pending_manual",
                "ai_reasoning": data.get("reasoning", ""),
                "reject_reason": data.get("reject_reason") if status == "rejected" else None,
            },
        )
