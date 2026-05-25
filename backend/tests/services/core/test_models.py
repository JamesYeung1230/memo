"""
Core service unit test - ORM model import and basic attribute check.

Strategy: Import all 12 ORM models and verify they:
  1. Can be imported without syntax/import errors
  2. Have the expected __tablename__ and __table_args__ schema
  3. Can be instantiated with required fields
"""

import pytest
from sqlalchemy.orm import DeclarativeMeta

from services.core.models import (
    Base,
    LearningRecord,
    AnswerRecord,
    Note,
    PointsRecord,
    Config,
    Banner,
    Achievement,
    UserAchievement,
    OpLog,
    FavoriteCard,
    DailyChallengeRecord,
    ReviewConfig,
)


class TestModelImports:
    """Verify all 12 ORM models can be imported without errors."""

    def test_base_imported(self):
        assert issubclass(Base, DeclarativeMeta)

    def test_learning_record_model(self):
        assert LearningRecord.__tablename__ == "learning_record"
        assert LearningRecord.__table_args__["schema"] == "core"

    def test_answer_record_model(self):
        assert AnswerRecord.__tablename__ == "answer_record"
        assert AnswerRecord.__table_args__["schema"] == "core"

    def test_note_model(self):
        assert Note.__tablename__ == "note"
        assert Note.__table_args__["schema"] == "core"

    def test_points_record_model(self):
        assert PointsRecord.__tablename__ == "points_record"
        assert PointsRecord.__table_args__["schema"] == "core"

    def test_config_model(self):
        assert Config.__tablename__ == "config"
        assert Config.__table_args__["schema"] == "core"

    def test_banner_model(self):
        assert Banner.__tablename__ == "banner"
        assert Banner.__table_args__["schema"] == "core"

    def test_achievement_model(self):
        assert Achievement.__tablename__ == "achievement"
        assert Achievement.__table_args__["schema"] == "core"

    def test_user_achievement_model(self):
        assert UserAchievement.__tablename__ == "user_achievement"
        assert UserAchievement.__table_args__["schema"] == "core"

    def test_op_log_model(self):
        assert OpLog.__tablename__ == "op_log"
        assert OpLog.__table_args__["schema"] == "core"

    def test_favorite_card_model(self):
        assert FavoriteCard.__tablename__ == "favorite_card"
        assert FavoriteCard.__table_args__["schema"] == "core"

    def test_daily_challenge_record_model(self):
        assert DailyChallengeRecord.__tablename__ == "daily_challenge_record"
        assert DailyChallengeRecord.__table_args__["schema"] == "core"

    def test_review_config_model(self):
        assert ReviewConfig.__tablename__ == "review_config"
        assert ReviewConfig.__table_args__["schema"] == "core"


class TestModelInstantiation:
    """Verify each model can be instantiated with required fields."""

    def test_learning_record_instance(self):
        record = LearningRecord(user_id="u1", card_id="c1", domain_id="d1")
        assert record.user_id == "u1"
        assert record.card_id == "c1"
        assert record.domain_id == "d1"

    def test_answer_record_instance(self):
        record = AnswerRecord(user_id="u1", card_id="c1", question_id="q1", selected_option="A", is_correct=True)
        assert record.user_id == "u1"
        assert record.is_correct is True

    def test_note_instance(self):
        note = Note(user_id="u1", title="test-title", content="test-content")
        assert note.title == "test-title"
        assert note.content == "test-content"

    def test_points_record_instance(self):
        record = PointsRecord(user_id="u1", points=10, record_type="earn")
        assert record.points == 10
        assert record.record_type == "earn"

    def test_config_instance(self):
        config = Config(key="test-key", value={"val": 1})
        assert config.key == "test-key"
        assert config.value == {"val": 1}

    def test_banner_instance(self):
        banner = Banner(title="test-banner", image_url="https://example.com/img.jpg")
        assert banner.title == "test-banner"

    def test_achievement_instance(self):
        ach = Achievement(name="test-ach", icon="star", description="desc")
        assert ach.name == "test-ach"
        assert ach.icon == "star"

    def test_user_achievement_instance(self):
        ua = UserAchievement(user_id="u1", achievement_id="a1")
        assert ua.user_id == "u1"

    def test_op_log_instance(self):
        log = OpLog(user_id="u1", action="delete", target_type="domain", target_id="d1")
        assert log.action == "delete"

    def test_favorite_card_instance(self):
        fc = FavoriteCard(user_id="u1", card_id="c1")
        assert fc.user_id == "u1"
        assert fc.card_id == "c1"

    def test_daily_challenge_record_instance(self):
        dcr = DailyChallengeRecord(user_id="u1", challenge_date="2026-05-21", status="completed")
        assert dcr.challenge_date == "2026-05-21"

    def test_review_config_instance(self):
        rc = ReviewConfig(user_id="u1")
        assert rc.user_id == "u1"
