import uuid
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.knowledge.ai import get_provider
from services.knowledge.models import Card, Chapter, AiGenerationHistory
from services.knowledge.routes.deps import get_db
from shared.errors import KnowledgeNotFoundError, KnowledgeAIError
from shared.responses import success

router = APIRouter(prefix="/api/v1/ai", tags=["AI - Content Generation"])


# ---- Pydantic Schemas ----

class GenerateCardsRequest(BaseModel):
    topics: list[str] = Field(min_length=1, max_length=10)
    chapter_id: str
    mode: Literal["sync", "async"] = "sync"


class GenerateQuestionRequest(BaseModel):
    mode: Literal["sync"] = "sync"


# ---- Routes ----

@router.post("/generate-cards")
async def generate_cards(
    body: GenerateCardsRequest,
    session: AsyncSession = Depends(get_db),
):
    """Generate knowledge cards by AI. Supports sync and async modes."""
    # Validate chapter exists
    chapter_result = await session.execute(select(Chapter).where(Chapter.id == body.chapter_id))
    if not chapter_result.scalar_one_or_none():
        raise KnowledgeNotFoundError()

    provider = get_provider()

    if body.mode == "async":
        # Async mode: create task record, return task_id
        task_id = str(uuid.uuid4())
        for topic in body.topics:
            history = AiGenerationHistory(
                generation_type="card",
                topic=topic,
                chapter_id=body.chapter_id,
                task_id=task_id,
                task_status="processing",
            )
            session.add(history)
        await session.commit()

        return success({
            "task_id": task_id,
            "status": "processing",
        })

    # Sync mode: generate cards directly
    results = await provider.generate_cards(body.topics, body.chapter_id)
    failed_topics = [r.topic for r in results if r.status == "failed"]

    # Save generation history
    for result in results:
        history = AiGenerationHistory(
            generation_type="card",
            topic=result.topic,
            chapter_id=body.chapter_id,
            task_status=result.status,
            generated_content=result.model_dump() if result.status == "completed" else None,
        )
        session.add(history)
    await session.commit()

    return success({
        "results": [r.model_dump() for r in results],
        "failed_topics": failed_topics,
    })


@router.get("/generate-cards/{task_id}/result")
async def get_generate_cards_result(
    task_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Poll async task result."""
    result = await session.execute(
        select(AiGenerationHistory).where(
            AiGenerationHistory.task_id == task_id,
            AiGenerationHistory.task_status.in_(["completed", "failed"]),
        ).limit(1)
    )
    history = result.scalar_one_or_none()

    if not history:
        # Check if still processing
        pending = await session.execute(
            select(AiGenerationHistory).where(
                AiGenerationHistory.task_id == task_id,
                AiGenerationHistory.task_status == "processing",
            ).limit(1)
        )
        if pending.scalar_one_or_none():
            return success({
                "task_id": task_id,
                "status": "processing",
                "progress": "",
                "results": [],
            })
        return success({
            "task_id": task_id,
            "status": "failed",
            "progress": "0/0",
            "results": [],
        })

    return success({
        "task_id": task_id,
        "status": history.task_status,
        "progress": "1/1",
        "results": [history.generated_content] if history.generated_content else [],
    })


@router.post("/generate-questions/{card_id}")
async def generate_question(
    card_id: str,
    body: GenerateQuestionRequest,
    session: AsyncSession = Depends(get_db),
):
    """Generate a single-choice question for a card by AI."""
    # Validate card exists
    card_result = await session.execute(select(Card).where(Card.id == card_id))
    card = card_result.scalar_one_or_none()
    if not card:
        raise KnowledgeNotFoundError()

    provider = get_provider()

    # Build card content dict for the provider
    card_content = {
        "title": card.title,
        "core_concept": getattr(card, "core_concept", ""),
        "detail": getattr(card, "detail", ""),
        "life_analogy": getattr(card, "life_analogy", ""),
    }

    try:
        question = await provider.generate_question(card_id, card_content)
    except Exception as e:
        raise KnowledgeAIError()

    # Save generation history
    history = AiGenerationHistory(
        generation_type="question",
        topic=card.title,
        source_card_id=card_id,
        task_status="completed",
        generated_content=question.model_dump() if hasattr(question, "model_dump") else None,
    )
    session.add(history)
    await session.commit()

    return success({
        "question_text": question.question_text,
        "options": question.options.model_dump() if hasattr(question.options, "model_dump") else question.options,
        "correct_option": question.correct_option,
        "explanation": question.explanation,
    })
