"""init core schema: enums + all 12 tables

Revision ID: 0001_init_core
Revises: None
Create Date: 2026-05-09 10:00:00.000000
"""
from alembic import op


revision = "0001_init_core"
down_revision = None
branch_labels = None
depends_on = None


ENUMS = [
    "CREATE TYPE learning_status AS ENUM ('not_learned', 'learning', 'mastered')",
    "CREATE TYPE note_audit_status AS ENUM ('draft', 'submitted', 'reviewing', 'approved', 'rejected')",
    "CREATE TYPE points_action_type AS ENUM "
    "('learn_card', 'daily_challenge', 'checkin_milestone', 'create_note', 'ad_watch', "
    "'unlock_domain', 'unlock_card', 'exchange_achievement', 'admin_adjust')",
    "CREATE TYPE banner_status AS ENUM ('enabled', 'disabled')",
    "CREATE TYPE achievement_status AS ENUM ('published', 'draft')",
]


def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS core")

    for enum_sql in ENUMS:
        op.execute(enum_sql)

    op.execute("""
        CREATE TABLE core.learning_record (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            card_id UUID NOT NULL,
            domain_id UUID NOT NULL,
            chapter_id UUID DEFAULT NULL,
            status learning_status NOT NULL DEFAULT 'learning',
            learned_at TIMESTAMPTZ DEFAULT NULL,
            review_count INTEGER NOT NULL DEFAULT 0,
            next_review_at TIMESTAMPTZ DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_learning_user_card ON core.learning_record (user_id, card_id)")
    op.execute("CREATE INDEX idx_learning_user ON core.learning_record (user_id)")
    op.execute("CREATE INDEX idx_learning_domain ON core.learning_record (domain_id)")
    op.execute("""
        CREATE INDEX idx_learning_next_review ON core.learning_record (user_id, next_review_at)
        WHERE next_review_at IS NOT NULL
    """)

    op.execute("""
        CREATE TABLE core.answer_record (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            question_id UUID NOT NULL,
            card_id UUID DEFAULT NULL,
            domain_id UUID DEFAULT NULL,
            selected_option CHAR(1) NOT NULL,
            is_correct BOOLEAN NOT NULL,
            is_daily_challenge BOOLEAN NOT NULL DEFAULT false,
            challenge_date DATE DEFAULT NULL,
            answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_answer_user ON core.answer_record (user_id)")
    op.execute("CREATE INDEX idx_answer_question ON core.answer_record (question_id)")
    op.execute("CREATE INDEX idx_answer_domain ON core.answer_record (domain_id)")
    op.execute("CREATE INDEX idx_answer_wrong ON core.answer_record (user_id) WHERE is_correct = false")
    op.execute("""
        CREATE INDEX idx_answer_challenge ON core.answer_record (user_id, challenge_date)
        WHERE is_daily_challenge = true
    """)

    op.execute("""
        CREATE TABLE core.note (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            title VARCHAR(300) NOT NULL,
            content TEXT NOT NULL,
            tags JSONB DEFAULT '[]',
            associated_card_id UUID DEFAULT NULL,
            audit_status note_audit_status NOT NULL DEFAULT 'draft',
            reject_reason TEXT DEFAULT NULL,
            violation_flag BOOLEAN NOT NULL DEFAULT false,
            submitted_at TIMESTAMPTZ DEFAULT NULL,
            deleted_at TIMESTAMPTZ DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_note_user_card ON core.note (user_id, associated_card_id)
        WHERE associated_card_id IS NOT NULL AND deleted_at IS NULL
    """)
    op.execute("CREATE INDEX idx_note_user ON core.note (user_id)")
    op.execute("CREATE INDEX idx_note_audit_status ON core.note (audit_status)")
    op.execute("CREATE INDEX idx_note_user_audit ON core.note (user_id, audit_status)")
    op.execute("CREATE INDEX idx_note_submitted ON core.note (submitted_at) WHERE submitted_at IS NOT NULL")
    op.execute("ALTER TABLE core.note ADD CONSTRAINT chk_note_content_length CHECK (LENGTH(content) <= 5000)")
    op.execute("ALTER TABLE core.note ADD CONSTRAINT chk_note_title_length CHECK (LENGTH(title) <= 300)")

    op.execute("""
        CREATE TABLE core.points_record (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            points INTEGER NOT NULL,
            balance_after INTEGER DEFAULT NULL,
            action_type points_action_type NOT NULL,
            reference_id VARCHAR(64) DEFAULT NULL,
            description VARCHAR(200) DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_points_user ON core.points_record (user_id)")
    op.execute("CREATE INDEX idx_points_user_created ON core.points_record (user_id, created_at DESC)")
    op.execute("CREATE INDEX idx_points_action ON core.points_record (action_type)")

    op.execute("""
        CREATE TABLE core.config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            config_key VARCHAR(100) NOT NULL UNIQUE,
            config_value JSONB NOT NULL,
            description VARCHAR(500) DEFAULT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            updated_by VARCHAR(50) DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE core.banner (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(50) NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            link_type VARCHAR(50) DEFAULT NULL,
            link_param VARCHAR(200) DEFAULT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            status banner_status NOT NULL DEFAULT 'enabled',
            start_date TIMESTAMPTZ DEFAULT NULL,
            end_date TIMESTAMPTZ DEFAULT NULL,
            click_count INTEGER NOT NULL DEFAULT 0,
            impression_pv INTEGER NOT NULL DEFAULT 0,
            impression_uv INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_banner_sort ON core.banner (sort_order) WHERE status = 'enabled'")
    op.execute("CREATE INDEX idx_banner_dates ON core.banner (start_date, end_date) WHERE status = 'enabled'")

    op.execute("""
        CREATE TABLE core.achievement (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            icon_url VARCHAR(500) NOT NULL,
            points_required INTEGER DEFAULT NULL,
            status achievement_status NOT NULL DEFAULT 'published',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE core.user_achievement (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            achievement_id UUID NOT NULL,
            obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_user_achievement ON core.user_achievement (user_id, achievement_id)")
    op.execute("CREATE INDEX idx_user_achievement_user ON core.user_achievement (user_id)")

    op.execute("""
        CREATE TABLE core.op_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            operator VARCHAR(50) NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            target_type VARCHAR(50) NOT NULL,
            target_id UUID NOT NULL,
            detail JSONB DEFAULT NULL,
            ip_address VARCHAR(45) DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_op_log_created ON core.op_log (created_at DESC)")
    op.execute("CREATE INDEX idx_op_log_action ON core.op_log (action_type)")

    op.execute("""
        CREATE TABLE core.favorite_card (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            card_id UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_favorite_user_card ON core.favorite_card (user_id, card_id)")
    op.execute("CREATE INDEX idx_favorite_user ON core.favorite_card (user_id)")

    op.execute("""
        CREATE TABLE core.daily_challenge_record (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            challenge_date DATE NOT NULL,
            total_questions INTEGER NOT NULL DEFAULT 0,
            correct_count INTEGER NOT NULL DEFAULT 0,
            is_completed BOOLEAN NOT NULL DEFAULT false,
            all_correct BOOLEAN NOT NULL DEFAULT false,
            points_earned INTEGER NOT NULL DEFAULT 0,
            streak_days INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_challenge_user_date ON core.daily_challenge_record (user_id, challenge_date)")
    op.execute("CREATE INDEX idx_challenge_date ON core.daily_challenge_record (challenge_date)")

    op.execute("""
        CREATE TABLE core.review_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE,
            review_nodes JSONB NOT NULL DEFAULT '[1,2,4,7,15]',
            daily_limit INTEGER NOT NULL DEFAULT 20,
            forgotten_alert_days INTEGER NOT NULL DEFAULT 7,
            reminder_time TIME NOT NULL DEFAULT '20:00',
            weekend_quiet BOOLEAN NOT NULL DEFAULT false,
            preset VARCHAR(20) DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_review_config_user ON core.review_config (user_id)")


def downgrade():
    tables = [
        "core.review_config",
        "core.daily_challenge_record",
        "core.favorite_card",
        "core.op_log",
        "core.user_achievement",
        "core.achievement",
        "core.banner",
        "core.config",
        "core.points_record",
        "core.note",
        "core.answer_record",
        "core.learning_record",
    ]
    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")

    for enum_sql in reversed(ENUMS):
        type_name = enum_sql.split()[3].split("(")[0]
        op.execute(f"DROP TYPE IF EXISTS {type_name} CASCADE")

    op.execute("DROP SCHEMA IF EXISTS core CASCADE")
