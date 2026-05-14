-- ============================================================
-- PROFILES
-- ============================================================
-- user_id is the Supabase Auth user UUID (from supabase.auth.getUser()).
-- No FK to auth.users because that table lives in Supabase, not here.
-- Your backend validates the Supabase JWT, then trusts the user_id claim.

CREATE TABLE profiles (
    user_id        UUID PRIMARY KEY,
    display_name   TEXT,
    age            INT CHECK (age BETWEEN 13 AND 120),
    biological_sex TEXT CHECK (biological_sex IN ('male', 'female', 'other')),
    height_cm      NUMERIC(5,2),
    weight_kg      NUMERIC(5,2),
    timezone       TEXT NOT NULL DEFAULT 'UTC',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- GOALS
-- ============================================================

CREATE TABLE goals (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    goal_type    TEXT NOT NULL CHECK (goal_type IN (
        'improve_sleep', 'increase_focus', 'gain_muscle',
        'lose_weight', 'improve_grades', 'reduce_stress'
    )),
    target_value JSONB,
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'paused', 'achieved', 'abandoned'
    )),
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at     TIMESTAMPTZ
);

CREATE INDEX idx_goals_user_active ON goals(user_id) WHERE status = 'active';