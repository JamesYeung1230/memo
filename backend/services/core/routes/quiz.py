from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from services.core.clients import KnowledgeClient
from services.core.models import AnswerRecord, DailyChallengeRecord, PointsRecord
from services.core.routes.deps import get_db, get_knowledge_client, get_user_id
from shared.responses import success

router = APIRouter(prefix="/api/v1/quiz", tags=["Quiz"])


# ---- Schemas ----

class QuizSubmitRequest(BaseModel):
    question_id: str
    selected_option: str


class WrongPracticeRequest(BaseModel):
    selected_option: str


class DailyChallengeSubmitRequest(BaseModel):
    answers: list[dict]


# ---- Routes ----

@router.get("/domain/{domain_id}/questions")
async def get_domain_questions(
    domain_id: str,
    client: KnowledgeClient = Depends(get_knowledge_client),
    user_id: str = Depends(get_user_id),
):
    """Get questions for a domain (learned cards first)."""
    questions = await client.get_review_queue(page=1, page_size=50)
    return success(questions or [])


@router.post("/submit")
async def submit_answer(
    body: QuizSubmitRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    """Submit a single answer. Returns correct/incorrect and explanation."""
    question = await client.get_question_detail(body.question_id)
    is_correct = body.selected_option == question.get("correct_option")

    answer = AnswerRecord(
        user_id=user_id,
        question_id=body.question_id,
        selected_option=body.selected_option,
        is_correct=is_correct,
    )
    db.add(answer)
    await db.flush()

    # Award points if correct
    points_earned = 15 if is_correct else 0
    if points_earned > 0:
        result_balance = await db.execute(
            select(func.coalesce(func.sum(PointsRecord.points), 0)).where(PointsRecord.user_id == user_id)
        )
        current_balance = result_balance.scalar() or 0
        points_record = PointsRecord(
            user_id=user_id,
            points=points_earned,
            balance_after=current_balance + points_earned,
            action_type="learn_card",
            reference_id=body.question_id,
            description="答题正确",
        )
        db.add(points_record)

    await db.commit()

    return success({
        "correct": is_correct,
        "correct_option": question.get("correct_option"),
        "explanation": question.get("explanation", ""),
        "points_earned": points_earned,
    })


@router.get("/wrong-questions")
async def get_wrong_questions(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get wrong question records for the user.
    每条记录会通过 KnowledgeClient 补充 question_text、options、correct_answer、explanation 字段。
    如果题目详情获取失败，返回原始记录数据，不阻塞整个请求。
    """
    subquery = (
        select(
            AnswerRecord.question_id,
            func.max(AnswerRecord.created_at).label("max_created"),
        )
        .where(AnswerRecord.user_id == user_id)
        .group_by(AnswerRecord.question_id)
    ).subquery()

    result = await db.execute(
        select(AnswerRecord)
        .join(subquery, and_(
            AnswerRecord.question_id == subquery.c.question_id,
            AnswerRecord.created_at == subquery.c.max_created,
        ))
        .where(AnswerRecord.is_correct == False)  # noqa: E712
        .order_by(AnswerRecord.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    records = result.scalars().all()

    items = []
    for r in records:
        item = {
            "id": r.id,
            "question_id": r.question_id,
            "selected_option": r.selected_option,
            "is_correct": r.is_correct,
            "answered_at": str(r.answered_at) if r.answered_at else None,
        }
        # 主动获取题目详情，失败时保持原始记录返回
        try:
            question = await client.get_question_detail(r.question_id)
            if question:
                item["question_text"] = question.get("question_text", "")
                raw_options = question.get("options", {})
                if isinstance(raw_options, dict):
                    item["options"] = [
                        {"letter": k, "text": v}
                        for k, v in raw_options.items()
                    ]
                else:
                    item["options"] = raw_options
                item["correct_answer"] = question.get("correct_option", "")
                item["explanation"] = question.get("explanation", "")
        except Exception:
            pass
        items.append(item)

    return success(items)


@router.post("/wrong-questions/{question_id}/practice")
async def practice_wrong_question(
    question_id: str,
    body: WrongPracticeRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    """Practice a wrong question. Returns correct/incorrect and explanation."""
    question = await client.get_question_detail(question_id)
    is_correct = body.selected_option == question.get("correct_option")

    # Record this practice attempt
    answer = AnswerRecord(
        user_id=user_id,
        question_id=question_id,
        selected_option=body.selected_option,
        is_correct=is_correct,
    )
    db.add(answer)

    # Award points if correct
    points_earned = 15 if is_correct else 0
    if points_earned > 0:
        result_balance = await db.execute(
            select(func.coalesce(func.sum(PointsRecord.points), 0)).where(PointsRecord.user_id == user_id)
        )
        current_balance = result_balance.scalar() or 0
        points_record = PointsRecord(
            user_id=user_id,
            points=points_earned,
            balance_after=current_balance + points_earned,
            action_type="learn_card",
            reference_id=question_id,
            description="错题重练正确",
        )
        db.add(points_record)

    await db.commit()

    return success({
        "correct": is_correct,
        "correct_option": question.get("correct_option"),
        "explanation": question.get("explanation", ""),
        "points_earned": points_earned,
    })


@router.post("/daily-challenge")
async def get_daily_challenge(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    """Get or create today's daily challenge."""
    today_str = date.today().isoformat()

    existing = await db.execute(
        select(DailyChallengeRecord).where(
            DailyChallengeRecord.user_id == user_id,
            DailyChallengeRecord.challenge_date == today_str,
        )
    )
    record = existing.scalar_one_or_none()
    if record and record.is_completed:
        return success({
            "challenge_id": record.id,
            "date": today_str,
            "is_completed": True,
            "all_correct": record.all_correct,
            "points_earned": record.points_earned,
            "questions": [],
        })

    questions = []
    try:
        domains = await client.get_domains(status="published")
        if domains:
            chapters = await client.get_chapters(domains[0]["id"], status="published")
            if chapters:
                cards = await client.get_cards(chapters[0]["id"], status="published")
                for card in cards[:5]:
                    q = await client.get_question(card["id"])
                    if q:
                        questions.append({
                            "question_id": q.get("id", card["id"]),
                            "card_id": card["id"],
                            "question_text": q.get("question_text", ""),
                            "options": q.get("options", {}),
                            "difficulty": card.get("difficulty", "beginner"),
                        })
    except Exception:
        pass
    return success({
        "challenge_id": record.id if record else None,
        "date": today_str,
        "is_completed": False,
        "questions": questions,
    })


@router.post("/daily-challenge/submit")
async def submit_daily_challenge(
    body: DailyChallengeSubmitRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
    client: KnowledgeClient = Depends(get_knowledge_client),
):
    """Submit daily challenge answers."""
    today_str = date.today().isoformat()
    total = len(body.answers)
    correct = 0

    for ans in body.answers:
        question = await client.get_question_detail(ans.get("question_id", ""))
        if ans.get("selected_option") == question.get("correct_option"):
            correct += 1
        answer = AnswerRecord(
            user_id=user_id,
            question_id=ans.get("question_id", ""),
            selected_option=ans.get("selected_option", ""),
            is_correct=ans.get("selected_option") == question.get("correct_option"),
            is_daily_challenge=True,
            challenge_date=today_str,
        )
        db.add(answer)

    all_correct = correct == total and total > 0
    points_earned = 15 if all_correct else 0

    # Check streak
    yesterday = date.today()
    yesterday = yesterday.replace(day=yesterday.day - 1)
    prev = await db.execute(
        select(DailyChallengeRecord).where(
            DailyChallengeRecord.user_id == user_id,
            DailyChallengeRecord.challenge_date == yesterday.isoformat(),
            DailyChallengeRecord.all_correct == True,  # noqa: E712
        )
    )
    prev_record = prev.scalar_one_or_none()
    streak = (prev_record.streak_days + 1) if prev_record else (1 if all_correct else 0)

    challenge = DailyChallengeRecord(
        user_id=user_id,
        challenge_date=today_str,
        total_questions=total,
        correct_count=correct,
        is_completed=True,
        all_correct=all_correct,
        points_earned=points_earned,
        streak_days=streak,
    )
    db.add(challenge)

    if points_earned > 0:
        points = PointsRecord(
            user_id=user_id,
            points=points_earned,
            action_type="daily_challenge",
            description=f"Daily challenge completed ({correct}/{total} correct)",
        )
        db.add(points)

    await db.commit()

    return success({
        "total": total,
        "correct": correct,
        "all_correct": all_correct,
        "points_earned": points_earned,
        "streak_days": streak,
    })


@router.get("/statistics")
async def get_quiz_statistics(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get user quiz statistics."""
    total = await db.execute(
        select(func.count(AnswerRecord.id)).where(AnswerRecord.user_id == user_id)
    )
    correct = await db.execute(
        select(func.count(AnswerRecord.id)).where(
            AnswerRecord.user_id == user_id,
            AnswerRecord.is_correct == True,  # noqa: E712
        )
    )
    total_count = total.scalar() or 0
    correct_count = correct.scalar() or 0

    return success({
        "total_answered": total_count,
        "correct_count": correct_count,
        "accuracy": round(correct_count / total_count * 100, 1) if total_count > 0 else 0.0,
    })
