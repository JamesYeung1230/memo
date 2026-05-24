from datetime import datetime

import pytest
from pydantic import ValidationError

from shared.models.knowledge_read import (
    AIGeneratedCard,
    AIGenerateResult,
    AITaskResult,
    CardDetail,
    CardListItem,
    ChapterRead,
    DomainRead,
    QuestionForQuiz,
    QuestionOptions,
    QuestionRead,
    ReviewRecordRead,
    ReviewResult,
    ReviewStatistics,
    SensitiveWordRead,
)


NOW = datetime(2026, 1, 1, 12, 0, 0)


def make_domain(**overrides):
    return {
        "id": "D01",
        "name": "Test Domain",
        "icon": "book",
        "sort_order": 1,
        "is_free": True,
        "status": "published",
        "created_at": NOW,
        "updated_at": NOW,
        **overrides,
    }


class TestDomainRead:
    def test_minimal(self):
        DomainRead(**make_domain())

    def test_all_fields(self):
        d = DomainRead(**make_domain(
            unlock_points=100,
            chapter_count=5,
            total_card_count=50,
        ))
        assert d.id == "D01"
        assert d.name == "Test Domain"
        assert d.icon == "book"
        assert d.sort_order == 1
        assert d.is_free is True
        assert d.unlock_points == 100
        assert d.status == "published"
        assert d.chapter_count == 5
        assert d.total_card_count == 50
        assert d.created_at == NOW
        assert d.updated_at == NOW

    def test_defaults(self):
        d = DomainRead(**make_domain())
        assert d.unlock_points is None
        assert d.chapter_count == 0
        assert d.total_card_count == 0

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            DomainRead(**make_domain(status="invalid"))


class TestChapterRead:
    def test_minimal(self):
        c = ChapterRead(
            id="CH01",
            domain_id="D01",
            name="Chapter 1",
            sort_order=1,
            status="published",
            created_at=NOW,
            updated_at=NOW,
        )
        assert c.card_count == 0

    def test_with_card_count(self):
        c = ChapterRead(
            id="CH01",
            domain_id="D01",
            name="Chapter 1",
            sort_order=1,
            status="draft",
            card_count=10,
            created_at=NOW,
            updated_at=NOW,
        )
        assert c.card_count == 10

    def test_missing_required_id(self):
        with pytest.raises(ValidationError):
            ChapterRead(
                domain_id="D01",
                name="Chapter 1",
                sort_order=1,
                status="published",
                created_at=NOW,
                updated_at=NOW,
            )


class TestCardListItem:
    def test_minimal(self):
        c = CardListItem(
            id="C01",
            title="Card Title",
            core_concept="Concept",
            difficulty="beginner",
            is_premium=False,
            status="published",
        )
        assert c.tags == []

    def test_with_tags(self):
        c = CardListItem(
            id="C01",
            title="Card Title",
            core_concept="Concept",
            difficulty="advanced",
            is_premium=True,
            unlock_points=50,
            tags=["math", "science"],
            status="draft",
        )
        assert c.tags == ["math", "science"]
        assert c.unlock_points == 50

    def test_invalid_difficulty(self):
        with pytest.raises(ValidationError):
            CardListItem(
                id="C01",
                title="Card",
                core_concept="C",
                difficulty="expert",
                is_premium=False,
                status="published",
            )


class TestCardDetail:
    def test_all_fields(self):
        c = CardDetail(
            id="C01",
            chapter_id="CH01",
            title="Card",
            core_concept="Concept",
            detail="Full detail",
            life_analogy="Like a garden",
            tags=["tag1"],
            difficulty="intermediate",
            is_premium=False,
            status="published",
            created_at=NOW,
            updated_at=NOW,
        )
        assert c.id == "C01"
        assert c.life_analogy == "Like a garden"
        assert c.detail == "Full detail"

    def test_default_tags(self):
        c = CardDetail(
            id="C01",
            chapter_id="CH01",
            title="Card",
            core_concept="Concept",
            detail="Detail",
            life_analogy="Analogy",
            difficulty="beginner",
            is_premium=True,
            status="published",
            created_at=NOW,
            updated_at=NOW,
        )
        assert c.tags == []


class TestQuestionOptions:
    def test_all_options(self):
        opts = QuestionOptions(A="Alpha", B="Beta", C="Gamma", D="Delta")
        assert opts.A == "Alpha"
        assert opts.B == "Beta"
        assert opts.C == "Gamma"
        assert opts.D == "Delta"

    def test_missing_option_raises_error(self):
        with pytest.raises(ValidationError):
            QuestionOptions(A="A", B="B", C="C")


class TestQuestionRead:
    def test_all_fields(self):
        q = QuestionRead(
            id="Q01",
            card_id="C01",
            question_text="What is X?",
            options=QuestionOptions(A="1", B="2", C="3", D="4"),
            correct_option="A",
            explanation="Because...",
        )
        assert q.correct_option == "A"
        assert q.explanation == "Because..."


class TestQuestionForQuiz:
    def test_no_correct_option_or_explanation(self):
        q = QuestionForQuiz(
            id="Q01",
            card_id="C01",
            question_text="What?",
            options=QuestionOptions(A="1", B="2", C="3", D="4"),
        )
        assert q.question_text == "What?"


class TestSensitiveWordRead:
    def test_minimal(self):
        s = SensitiveWordRead(
            id="S01",
            word="badword",
            match_mode="exact",
            enabled=True,
            created_at=NOW,
            updated_at=NOW,
        )
        assert s.match_mode == "exact"
        assert s.enabled is True

    def test_invalid_match_mode(self):
        with pytest.raises(ValidationError):
            SensitiveWordRead(
                id="S01",
                word="badword",
                match_mode="fuzzy",
                enabled=True,
                created_at=NOW,
                updated_at=NOW,
            )


class TestReviewRecordRead:
    def test_minimal(self):
        r = ReviewRecordRead(
            id="R01",
            note_id="N01",
            author_id="A01",
            status="screening",
            created_at=NOW,
            updated_at=NOW,
        )
        assert r.risk_labels == []
        assert r.needs_manual_review is False
        assert r.risk_score is None

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            ReviewRecordRead(
                id="R01",
                note_id="N01",
                author_id="A01",
                status="unknown",
                created_at=NOW,
                updated_at=NOW,
            )


class TestAIGeneratedCard:
    def test_defaults(self):
        c = AIGeneratedCard(topic="Math", title="Algebra", core_concept="X", detail="D", life_analogy="LA")
        assert c.tags == []
        assert c.difficulty == "beginner"
        assert c.status == "completed"

    def test_custom_values(self):
        c = AIGeneratedCard(
            topic="Science",
            title="Physics",
            core_concept="E=mc2",
            detail="Detail",
            life_analogy="Analogy",
            tags=["physics"],
            difficulty="advanced",
            status="failed",
        )
        assert c.status == "failed"
        assert c.difficulty == "advanced"


class TestAIGenerateResult:
    def test_defaults(self):
        r = AIGenerateResult()
        assert r.results == []
        assert r.failed_topics == []

    def test_with_data(self):
        card = AIGeneratedCard(topic="M", title="T", core_concept="C", detail="D", life_analogy="L")
        r = AIGenerateResult(results=[card], failed_topics=["X"])
        assert len(r.results) == 1
        assert r.failed_topics == ["X"]


class TestAITaskResult:
    def test_minimal(self):
        t = AITaskResult(task_id="T01", status="processing")
        assert t.progress == ""
        assert t.results == []

    def test_completed_with_results(self):
        card = AIGeneratedCard(topic="M", title="T", core_concept="C", detail="D", life_analogy="L")
        t = AITaskResult(task_id="T01", status="completed", progress="100%", results=[card])
        assert t.progress == "100%"
        assert len(t.results) == 1


class TestReviewResult:
    def test_minimal(self):
        r = ReviewResult(review_id="RV01", status="approved")
        assert r.risk_score is None
        assert r.risk_labels == []
        assert r.review_detail == {}

    def test_with_all_fields(self):
        r = ReviewResult(
            review_id="RV01",
            status="rejected",
            risk_score=85,
            risk_labels=["spam"],
            review_detail={"reason": "spam content"},
        )
        assert r.risk_score == 85


class TestReviewStatistics:
    def test_defaults(self):
        s = ReviewStatistics()
        assert s.today_pending == 0
        assert s.today_reviewed == 0
        assert s.weekly_approval_rate == 0.0
        assert s.ai_accuracy == 0.0
        assert s.by_date == []

    def test_custom_values(self):
        s = ReviewStatistics(
            today_pending=10,
            today_reviewed=8,
            weekly_approval_rate=0.75,
            ai_accuracy=0.9,
            by_date=[{"date": "2026-01-01", "count": 5}],
        )
        assert s.today_pending == 10
        assert s.weekly_approval_rate == 0.75
        assert s.ai_accuracy == 0.9
