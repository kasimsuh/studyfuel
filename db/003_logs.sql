-- ============================================================
-- SLEEP LOGS
-- ============================================================

CREATE TABLE sleep_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    sleep_date       DATE NOT NULL,
    bedtime          TIMESTAMPTZ NOT NULL,
    wake_time        TIMESTAMPTZ NOT NULL,
    duration_minutes INT GENERATED ALWAYS AS
        (EXTRACT(EPOCH FROM (wake_time - bedtime))::INT / 60) STORED,
    quality_rating   INT CHECK (quality_rating BETWEEN 1 AND 5),
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, sleep_date),
    CHECK (wake_time > bedtime)
);

CREATE INDEX idx_sleep_user_date ON sleep_logs(user_id, sleep_date DESC);

-- ============================================================
-- MEALS
-- ============================================================

CREATE TABLE meals (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    meal_time   TIMESTAMPTZ NOT NULL,
    meal_type   TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    description TEXT NOT NULL,
    calories    INT CHECK (calories >= 0),
    protein_g   NUMERIC(6,2) CHECK (protein_g >= 0),
    carbs_g     NUMERIC(6,2) CHECK (carbs_g >= 0),
    fat_g       NUMERIC(6,2) CHECK (fat_g >= 0),
    caffeine_mg INT CHECK (caffeine_mg >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meals_user_time ON meals(user_id, meal_time DESC);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================

CREATE TABLE study_sessions (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    started_at         TIMESTAMPTZ NOT NULL,
    ended_at           TIMESTAMPTZ NOT NULL,
    duration_minutes   INT GENERATED ALWAYS AS
        (EXTRACT(EPOCH FROM (ended_at - started_at))::INT / 60) STORED,
    subject            TEXT,
    focus_rating       INT CHECK (focus_rating BETWEEN 1 AND 5),
    productivity_notes TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ended_at > started_at)
);

CREATE INDEX idx_study_user_started ON study_sessions(user_id, started_at DESC);