"""init knowledge schema: enums + all 8 tables

Revision ID: 0001_init_knowledge
Revises: None
Create Date: 2026-05-09 10:00:00.000000
"""
from alembic import op


revision = "0001_init_knowledge"
down_revision = None
branch_labels = None
depends_on = None


ENUMS = [
    "CREATE TYPE card_difficulty AS ENUM ('beginner', 'intermediate', 'advanced')",
    "CREATE TYPE content_status AS ENUM ('draft', 'published')",
    "CREATE TYPE match_mode AS ENUM ('exact', 'pinyin', 'homophone', 'regex')",
    "CREATE TYPE review_status AS ENUM ('screening', 'ai_review', 'pending_manual', 'approved', 'rejected')",
    "CREATE TYPE manual_result AS ENUM ('approved', 'rejected')",
    "CREATE TYPE ai_task_status AS ENUM ('processing', 'completed', 'failed')",
    "CREATE TYPE ai_status_flag AS ENUM ('normal', 'error')",
]


def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS knowledge")

    for enum_sql in ENUMS:
        op.execute(enum_sql)

    op.execute("""
        CREATE TABLE knowledge.domain (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL,
            icon VARCHAR(50) NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_free BOOLEAN NOT NULL DEFAULT true,
            unlock_points INTEGER DEFAULT NULL,
            status content_status NOT NULL DEFAULT 'published',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_domain_sort_order ON knowledge.domain (sort_order)")
    op.execute("CREATE INDEX idx_domain_status ON knowledge.domain (status)")

    op.execute("""
        CREATE TABLE knowledge.chapter (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            domain_id UUID NOT NULL REFERENCES knowledge.domain(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            status content_status NOT NULL DEFAULT 'published',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_chapter_domain_name ON knowledge.chapter (domain_id, name)")
    op.execute("CREATE INDEX idx_chapter_domain_sort ON knowledge.chapter (domain_id, sort_order)")

    op.execute("""
        CREATE TABLE knowledge.card (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            chapter_id UUID NOT NULL REFERENCES knowledge.chapter(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            core_concept VARCHAR(200) NOT NULL,
            detail TEXT NOT NULL,
            life_analogy TEXT NOT NULL,
            tags JSONB NOT NULL DEFAULT '[]',
            difficulty card_difficulty NOT NULL DEFAULT 'beginner',
            is_premium BOOLEAN NOT NULL DEFAULT false,
            unlock_points INTEGER DEFAULT NULL,
            status content_status NOT NULL DEFAULT 'draft',
            deleted_at TIMESTAMPTZ DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_card_chapter_title ON knowledge.card (chapter_id, title)
        WHERE deleted_at IS NULL
    """)
    op.execute("CREATE INDEX idx_card_chapter ON knowledge.card (chapter_id)")
    op.execute("CREATE INDEX idx_card_status ON knowledge.card (status)")

    op.execute("""
        CREATE TABLE knowledge.question (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            card_id UUID NOT NULL UNIQUE REFERENCES knowledge.card(id) ON DELETE CASCADE,
            question_text VARCHAR(1000) NOT NULL,
            options JSONB NOT NULL,
            correct_option CHAR(1) NOT NULL,
            explanation VARCHAR(2000) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("ALTER TABLE knowledge.question ADD CONSTRAINT chk_correct_option CHECK (correct_option IN ('A', 'B', 'C', 'D'))")

    op.execute("""
        CREATE TABLE knowledge.sensitive_word (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            word VARCHAR(100) NOT NULL,
            match_mode match_mode NOT NULL DEFAULT 'exact',
            enabled BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_sensitive_word_mode ON knowledge.sensitive_word (word, match_mode)")
    op.execute("CREATE INDEX idx_sensitive_word_enabled ON knowledge.sensitive_word (enabled)")

    op.execute("""
        CREATE TABLE knowledge.review_record (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            note_id UUID NOT NULL,
            author_id VARCHAR(64) NOT NULL,
            note_title VARCHAR(300) NOT NULL,
            note_content TEXT NOT NULL,
            status review_status NOT NULL DEFAULT 'screening',
            risk_score INTEGER DEFAULT NULL,
            risk_labels JSONB DEFAULT '[]',
            sensitive_words_hit JSONB DEFAULT '[]',
            ai_risk_score INTEGER DEFAULT NULL,
            ai_risk_labels JSONB DEFAULT '[]',
            ai_reasoning TEXT DEFAULT NULL,
            needs_manual_review BOOLEAN NOT NULL DEFAULT false,
            ai_status ai_status_flag NOT NULL DEFAULT 'normal',
            manual_reviewer VARCHAR(50) DEFAULT NULL,
            manual_result manual_result DEFAULT NULL,
            manual_reason TEXT DEFAULT NULL,
            reviewed_at TIMESTAMPTZ DEFAULT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX uq_review_note ON knowledge.review_record (note_id)")
    op.execute("CREATE INDEX idx_review_status ON knowledge.review_record (status)")
    op.execute("CREATE INDEX idx_review_created ON knowledge.review_record (created_at DESC)")
    op.execute("CREATE INDEX idx_review_author ON knowledge.review_record (author_id)")

    op.execute("""
        CREATE TABLE knowledge.ai_generation_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            generation_type VARCHAR(20) NOT NULL,
            topic VARCHAR(200) NOT NULL,
            source_card_id UUID DEFAULT NULL REFERENCES knowledge.card(id) ON DELETE SET NULL,
            chapter_id UUID DEFAULT NULL REFERENCES knowledge.chapter(id) ON DELETE SET NULL,
            task_id VARCHAR(64) DEFAULT NULL,
            task_status ai_task_status NOT NULL DEFAULT 'processing',
            generated_content JSONB DEFAULT NULL,
            admin_edited_content JSONB DEFAULT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_ai_gen_type ON knowledge.ai_generation_history (generation_type)")
    op.execute("CREATE INDEX idx_ai_gen_task ON knowledge.ai_generation_history (task_id)")
    op.execute("CREATE INDEX idx_ai_gen_topic ON knowledge.ai_generation_history (topic)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS knowledge.ai_generation_history CASCADE")
    op.execute("DROP TABLE IF EXISTS knowledge.review_record CASCADE")
    op.execute("DROP TABLE IF EXISTS knowledge.sensitive_word CASCADE")
    op.execute("DROP TABLE IF EXISTS knowledge.question CASCADE")
    op.execute("DROP TABLE IF EXISTS knowledge.card CASCADE")
    op.execute("DROP TABLE IF EXISTS knowledge.chapter CASCADE")
    op.execute("DROP TABLE IF EXISTS knowledge.domain CASCADE")

    for enum_sql in reversed(ENUMS):
        type_name = enum_sql.split()[3]
        op.execute(f"DROP TYPE IF EXISTS {type_name} CASCADE")

    op.execute("DROP SCHEMA IF EXISTS knowledge CASCADE")
