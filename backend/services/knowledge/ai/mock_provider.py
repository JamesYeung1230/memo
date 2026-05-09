from collections.abc import Mapping
from typing import Any

from shared.models.knowledge_read import (
    AIGeneratedCard,
    QuestionOptions,
    QuestionRead,
    ReviewResult,
)
from .base import AIProvider


class MockProvider(AIProvider):
    async def generate_card(self, topic: str, chapter_id: str) -> AIGeneratedCard:
        return AIGeneratedCard(
            topic=topic,
            title=f"什么是{topic}",
            core_concept=f"{topic}是编程中一个基础且重要的概念，掌握它有助于理解更复杂的编程思想。",
            detail=(
                f"<p><strong>一、什么是{topic}</strong></p>"
                f"<p>{topic}是编程语言中的核心概念之一。简单来说，它就像我们在日常生活中使用的一个工具，"
                f"帮助我们更好地组织和处理信息。</p>"
                f"<p><strong>二、为什么要学习{topic}</strong></p>"
                f"<p>理解{topic}对于编写高质量的代码至关重要。它不仅能让你的代码更加清晰，"
                f"还能帮助你避免许多常见的编程错误。无论你是初学者还是有经验的开发者，"
                f"深入理解{topic}都会让你受益。</p>"
                f"<p><strong>三、实际应用</strong></p>"
                f"<p>在实际开发中，{topic}被广泛应用于各种场景。"
                f"掌握它之后，你将能够更高效地解决实际问题。</p>"
            ),
            life_analogy=(
                f"{topic}就像是我们日常生活中的抽屉。每个抽屉都有特定的用途，"
                f"我们把相关的东西放在同一个抽屉里，需要的时候就能快速找到。"
                f"编程中的{topic}也是类似的道理。"
            ),
            tags=[topic, "基础", "编程"],
            difficulty="beginner" if topic in ["变量", "函数", "条件判断", "循环", "数据类型"] else "intermediate",
            status="completed",
        )

    async def generate_cards(
        self, topics: list[str], chapter_id: str
    ) -> list[AIGeneratedCard]:
        return [
            await self.generate_card(topic, chapter_id) for topic in topics
        ]

    async def generate_question(
        self, card_id: str, card_content: Mapping[str, Any]
    ) -> QuestionRead:
        return QuestionRead(
            id="mock-q-001",
            card_id=card_id,
            question_text=f"根据所学内容，以下关于「{card_content.get('title', '知识点')}」的描述哪一项是正确的？",
            options=QuestionOptions(
                A="它是编程中用来组织代码的一种方式",
                B="它与日常编程实践无关",
                C="只有高级程序员才需要理解它",
                D="它只在特定编程语言中存在",
            ),
            correct_option="A",
            explanation=(
                f"正确答案是A。{card_content.get('core_concept', '该概念')}是编程中的基础知识，"
                f"无论什么水平的程序员都应该掌握。它帮助你写出更清晰、更易维护的代码。"
            ),
        )

    async def review_note(self, title: str, content: str) -> ReviewResult:
        sensitive_keywords = ["广告", "联系", "微信", "QQ", "电话", "收费", "代写"]

        for keyword in sensitive_keywords:
            if keyword in content:
                return ReviewResult(
                    review_id="mock-review-001",
                    status="rejected",
                    risk_score=80,
                    risk_labels=["违规广告"],
                    review_detail={
                        "needs_manual_review": False,
                        "ai_reasoning": f"命中敏感关键词「{keyword}」，风险评分80",
                        "reject_reason": "内容包含违规广告信息",
                    },
                )

        if len(content) < 50:
            return ReviewResult(
                review_id="mock-review-002",
                status="approved",
                risk_score=5,
                risk_labels=[],
                review_detail={
                    "needs_manual_review": False,
                    "ai_reasoning": "内容较短，无明显风险",
                    "reject_reason": None,
                },
            )

        return ReviewResult(
            review_id="mock-review-003",
            status="approved",
            risk_score=10,
            risk_labels=[],
            review_detail={
                "needs_manual_review": False,
                "ai_reasoning": "内容正常，无违规风险",
                "reject_reason": None,
            },
        )
