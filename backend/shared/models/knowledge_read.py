from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

CardDifficulty = Literal["beginner", "intermediate", "advanced"]
ContentStatus = Literal["draft", "published"]


class DomainRead(BaseModel):
    id: str
    name: str
    icon: str
    sort_order: int
    is_free: bool
    unlock_points: int | None = None
    status: ContentStatus
    chapter_count: int = 0
    total_card_count: int = 0
    created_at: datetime
    updated_at: datetime


class ChapterRead(BaseModel):
    id: str
    domain_id: str
    name: str
    sort_order: int
    status: ContentStatus
    card_count: int = 0
    created_at: datetime
    updated_at: datetime


class CardListItem(BaseModel):
    id: str
    title: str
    core_concept: str
    difficulty: CardDifficulty
    is_premium: bool
    unlock_points: int | None = None
    tags: list[str] = []
    status: ContentStatus


class CardDetail(BaseModel):
    id: str
    chapter_id: str
    title: str
    core_concept: str
    detail: str
    life_analogy: str
    tags: list[str] = []
    difficulty: CardDifficulty
    is_premium: bool
    unlock_points: int | None = None
    status: ContentStatus
    created_at: datetime
    updated_at: datetime


class QuestionOptions(BaseModel):
    A: str
    B: str
    C: str
    D: str


class QuestionRead(BaseModel):
    id: str
    card_id: str
    question_text: str
    options: QuestionOptions
    correct_option: str
    explanation: str


class QuestionForQuiz(BaseModel):
    id: str
    card_id: str
    question_text: str
    options: QuestionOptions


class SensitiveWordRead(BaseModel):
    id: str
    word: str
    match_mode: Literal["exact", "pinyin", "homophone", "regex"]
    enabled: bool
    created_at: datetime
    updated_at: datetime


class ReviewRecordRead(BaseModel):
    id: str
    note_id: str
    author_id: str
    status: Literal["screening", "ai_review", "pending_manual", "approved", "rejected"]
    risk_score: int | None = None
    risk_labels: list[str] = []
    needs_manual_review: bool = False
    manual_reviewer: str | None = None
    manual_result: Literal["approved", "rejected"] | None = None
    manual_reason: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AIGeneratedCard(BaseModel):
    topic: str
    title: str
    core_concept: str
    detail: str
    life_analogy: str
    tags: list[str] = []
    difficulty: CardDifficulty = "beginner"
    status: Literal["completed", "failed"] = "completed"


class AIGenerateResult(BaseModel):
    results: list[AIGeneratedCard] = []
    failed_topics: list[str] = []


class AITaskResult(BaseModel):
    task_id: str
    status: Literal["processing", "completed", "failed"]
    progress: str = ""
    results: list[AIGeneratedCard] = []


class ReviewResult(BaseModel):
    review_id: str
    status: Literal["approved", "rejected", "pending_manual"]
    risk_score: int | None = None
    risk_labels: list[str] = []
    review_detail: dict[str, Any] = {}


class ReviewStatistics(BaseModel):
    today_pending: int = 0
    today_reviewed: int = 0
    weekly_approval_rate: float = 0.0
    ai_accuracy: float = 0.0
    by_date: list[dict[str, Any]] = []
