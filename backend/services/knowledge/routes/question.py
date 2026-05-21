from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.knowledge.models import Question, Card
from services.knowledge.routes.deps import get_db
from shared.errors import KnowledgeNotFoundError, KnowledgeDuplicateError
from shared.responses import success

router = APIRouter(prefix="/api/v1", tags=["Content - Questions"])


# ---- Pydantic Schemas ----

class QuestionCreate(BaseModel):
    card_id: str
    question_text: str = Field(min_length=1, max_length=1000)
    options: dict
    correct_option: str = Field(pattern=r"^[A-D]$")
    explanation: str = Field(min_length=1, max_length=2000)


class QuestionUpdate(BaseModel):
    question_text: str | None = Field(None, min_length=1, max_length=1000)
    options: dict | None = None
    correct_option: str | None = Field(None, pattern=r"^[A-D]$")
    explanation: str | None = Field(None, min_length=1, max_length=2000)


def _to_out(q: Question) -> dict:
    return {
        "id": q.id,
        "card_id": q.card_id,
        "question_text": q.question_text,
        "options": q.options if isinstance(q.options, dict) else {},
        "correct_option": q.correct_option,
        "explanation": q.explanation,
        "created_at": str(q.created_at) if hasattr(q, 'created_at') and q.created_at else None,
        "updated_at": str(q.updated_at) if hasattr(q, 'updated_at') and q.updated_at else None,
    }


# ---- Routes ----

@router.get("/cards/{card_id}/question")
async def get_question_by_card(
    card_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Question).where(Question.card_id == card_id))
    question = result.scalar_one_or_none()
    if not question:
        raise KnowledgeNotFoundError()

    return success(_to_out(question))


@router.get("/questions/{question_id}")
async def get_question(
    question_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise KnowledgeNotFoundError()

    return success(_to_out(question))


@router.post("/questions", status_code=201)
async def create_question(
    body: QuestionCreate,
    session: AsyncSession = Depends(get_db),
):
    # 验证卡片存在
    card_result = await session.execute(select(Card).where(Card.id == body.card_id))
    if not card_result.scalar_one_or_none():
        raise KnowledgeNotFoundError()

    # 检查卡片是否已有关联题目（一对一约束）
    existing = await session.execute(
        select(Question).where(Question.card_id == body.card_id)
    )
    if existing.scalar_one_or_none():
        raise KnowledgeDuplicateError()

    # 验证 correct_option 在 options 中
    if body.correct_option not in body.options:
        from shared.errors import AppException, ErrorCodes
        raise AppException(ErrorCodes.VALIDATION_ERROR, detail={
            "correct_option": f"Option {body.correct_option} not found in options"
        })

    question = Question(
        card_id=body.card_id,
        question_text=body.question_text,
        options=body.options,
        correct_option=body.correct_option,
        explanation=body.explanation,
    )
    session.add(question)
    await session.commit()
    await session.refresh(question)

    return success(_to_out(question))


@router.put("/questions/{question_id}")
async def update_question(
    question_id: str,
    body: QuestionUpdate,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise KnowledgeNotFoundError()

    update_data = body.model_dump(exclude_unset=True)

    # 如果更新了 correct_option，验证在 options 中
    if "correct_option" in update_data:
        options = update_data.get("options", question.options)
        if update_data["correct_option"] not in options:
            from shared.errors import AppException, ErrorCodes
            raise AppException(ErrorCodes.VALIDATION_ERROR, detail={
                "correct_option": f"Option {update_data['correct_option']} not found in options"
            })

    for key, value in update_data.items():
        setattr(question, key, value)

    await session.commit()
    await session.refresh(question)
    return success(_to_out(question))


@router.delete("/questions/{question_id}", status_code=204)
async def delete_question(
    question_id: str,
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise KnowledgeNotFoundError()

    await session.delete(question)
    await session.commit()
    return None
