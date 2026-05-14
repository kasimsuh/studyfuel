-- ============================================================
-- AGENT RUNS (full trace of every agent invocation)
-- ============================================================

CREATE TABLE agent_runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    trigger             TEXT NOT NULL,  -- 'user_query', 'weekly_cron', 'pattern_detected'
    user_input          TEXT,
    final_response      TEXT,
    tool_calls          JSONB,
    tokens_used         INT,
    duration_ms         INT,
    langsmith_trace_id  TEXT,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_agent_runs_user ON agent_runs(user_id, started_at DESC);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================

CREATE TABLE recommendations (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    agent_run_id         UUID REFERENCES agent_runs(id),
    pattern_detected     TEXT,
    recommendation_text  TEXT NOT NULL,
    cited_paper_ids      UUID[],
    verification_score   NUMERIC(3,2) CHECK (verification_score BETWEEN 0 AND 1),
    user_response        TEXT CHECK (user_response IN ('accepted', 'rejected', 'ignored')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recs_user ON recommendations(user_id, created_at DESC);

-- ============================================================
-- REMINDERS
-- ============================================================

CREATE TABLE reminders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    recommendation_id   UUID REFERENCES recommendations(id) ON DELETE SET NULL,
    message             TEXT NOT NULL,
    scheduled_for       TIMESTAMPTZ NOT NULL,
    recurrence          TEXT,  -- 'once', 'daily', 'weekly', or a cron expression
    sent_at             TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'cancelled'
    ))
);

CREATE INDEX idx_reminders_due ON reminders(scheduled_for) WHERE status = 'pending';

-- ============================================================
-- WEEKLY REPORTS
-- ============================================================

CREATE TABLE weekly_reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    week_start  DATE NOT NULL,
    summary     TEXT NOT NULL,
    metrics     JSONB,
    insights    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_start)
);