# StudyFuel — Product Requirements Document

**Version**: 1.0  
**Author**: Suhiyini Kasim  
**Status**: In Progress  
**Last Updated**: May 2026

---

## 1. Overview

### 1.1 Product Summary

StudyFuel is an AI-powered health coach for university students that connects sleep, nutrition, and study performance data to generate personalized, research-backed interventions. It combines a RAG pipeline over peer-reviewed research with an agentic LLM that detects patterns, proposes interventions, schedules reminders, and generates weekly reports — all grounded in citations from real papers.

### 1.2 Problem Statement

University students chronically underperform on basic health behaviors (sleep, nutrition, caffeine timing) that directly impact their academic performance. Existing apps address each behavior in isolation (MyFitnessPal for food, Sleep Cycle for sleep) and offer generic advice rather than personalized, evidence-based interventions tied to the user's own data.

### 1.3 Goal

Build a technically rigorous solo project that demonstrates agentic LLM design, RAG pipeline engineering, and evaluation methodology — while solving a real problem for a relatable user base.

### 1.4 Non-Goals

- This is not a medical device and will not diagnose, treat, or prescribe
- This is not a social/community app
- This is not a calorie-counting app (logging is lightweight by design)
- Mobile app (web only for v1)

---

## 2. Users

### 2.1 Primary User

**University students (18–25)** who:

- Are aware that their habits affect their academic performance
- Want actionable advice, not generic health tips
- Will spend 2–5 minutes per day logging data if the return is meaningful
- Trust science-backed recommendations over influencer advice

### 2.2 User Stories

| ID  | As a student, I want to...             | So that...                                              |
| --- | -------------------------------------- | ------------------------------------------------------- |
| U1  | Log my sleep quickly each morning      | The system knows my sleep patterns over time            |
| U2  | Log meals and caffeine intake          | The agent can connect nutrition to my focus levels      |
| U3  | Log study sessions with a focus rating | I can track how productive I actually am                |
| U4  | Ask the coach a health question        | I get a research-backed answer specific to my situation |
| U5  | Receive a weekly report                | I can see trends without manually analyzing my own data |
| U6  | Get reminders for healthy habits       | I follow through on interventions I've agreed to        |
| U7  | See citations for every recommendation | I trust the advice and can read more if I want          |
| U8  | Set health goals                       | The agent prioritizes relevant interventions            |

---

## 3. Features

### 3.1 Core Features (MVP — Weeks 1–4)

#### F1: User Onboarding

- Sign up / sign in via Supabase Auth (email + password, Google OAuth)
- Profile setup: age, biological sex, height, weight, timezone
- Goal selection: choose 1–3 from `improve_sleep`, `increase_focus`, `gain_muscle`, `lose_weight`, `improve_grades`, `reduce_stress`

#### F2: Daily Logging

- **Sleep log**: bedtime, wake time, quality rating (1–5), optional notes
- **Meal log**: meal type, free-text description, optional macros (calories, protein, carbs, fat), caffeine (mg)
- **Study session log**: start time, end time, subject, focus rating (1–5), optional notes
- Logging should take under 60 seconds per entry

#### F3: Coach Chat Interface

- Streaming chat UI (token-by-token via Server-Sent Events)
- User asks health questions in natural language
- Agent retrieves relevant research, analyzes user logs, and responds with:
  - Detected patterns from user's own data
  - Research-backed recommendation
  - Inline citations (paper title, authors, year, source URL)
- Every claim is grounded — agent refuses to recommend things it can't cite

#### F4: Agent Actions

- Agent can schedule reminders as part of a response ("I'll remind you at 9pm to stop caffeine intake")
- User can accept or reject proposed reminders
- Agent can propose goal adjustments based on patterns

#### F5: Dashboard

- Summary cards: avg sleep (last 7 days), study hours (last 7 days), logging streak
- Sleep trend chart (last 14 days)
- Study session duration + focus rating chart
- Recent recommendations with user response tracking (accepted / rejected / ignored)

#### F6: Weekly Reports

- Auto-generated every Sunday via background job
- Summary of the week's patterns
- Top 2–3 insights with citations
- Comparison to previous week
- Delivered in-app (notifications v2)

### 3.2 Technical Features

#### F7: RAG Pipeline

- Corpus: 2,000–5,000 peer-reviewed papers from PubMed and Semantic Scholar
- Topics: sleep + cognition, nutrition + academic performance, caffeine timing, stress management, exercise + focus
- Section-aware chunking: split papers by section (Abstract, Methods, Results, Discussion), chunk within sections at ~500 tokens with 50-token overlap
- Embeddings: OpenAI `text-embedding-3-small` (1536 dimensions), stored in pgvector
- Retrieval: vector similarity top-20 candidates → Cohere Rerank → top-5 returned
- HNSW index on embedding column for fast approximate nearest-neighbor search

#### F8: LangGraph Agent

- Stateful agent graph with explicit nodes: Analyze → Plan → Tool calls → Draft → Verify → Actions
- Tool set: `query_research`, `analyze_user_logs`, `find_correlations`, `propose_intervention`, `verify_recommendation`, `schedule_reminder`, `generate_weekly_report`
- Hard limits: max 8 tool calls per run, 30s timeout
- Verification node: separate LLM call scores every recommendation 0.0–1.0 for grounding; retries up to 2x if score < 0.7
- LangSmith tracing on every run

#### F9: Evaluation Suite

- **Layer 1 (Retrieval)**: 30 hand-curated question → relevant paper mappings; measures Recall@5, Recall@10, MRR
- **Layer 2 (Answer quality)**: 20 question/expected-facts pairs; LLM-as-judge scores correctness, grounding, safety
- **Layer 3 (Agent behavior)**: 20 synthetic user profiles; measures pattern detection accuracy, intervention match, citation validity, safety
- Eval runs tracked in CSV with version labels for before/after comparisons

### 3.3 Out of Scope for v1

- Push / email notifications (reminders are in-app only)
- Wearable integrations (Apple Health, Fitbit, Garmin)
- Sharing or social features
- Fine-tuned models
- Mobile app

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer            | Technology                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Frontend         | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query                     |
| Backend          | FastAPI (Python), SQLAlchemy, Alembic, Pydantic                                               |
| Auth             | Supabase Auth (JWT verification in FastAPI middleware)                                        |
| Database         | PostgreSQL 16 with pgvector (local Docker)                                                    |
| Agent            | LangGraph, LangChain, Anthropic Claude API (Sonnet 4 for reasoning, Haiku for cheap subtasks) |
| Embeddings       | OpenAI `text-embedding-3-small`                                                               |
| Reranking        | Cohere Rerank API                                                                             |
| Observability    | LangSmith                                                                                     |
| Background Jobs  | Inngest                                                                                       |
| Caching          | Redis (query result caching, Week 5)                                                          |
| Containerization | Docker + docker-compose                                                                       |
| Deployment       | Vercel (frontend), Render (backend), Supabase (auth)                                          |
| CI               | GitHub Actions (lint, test, build on PR)                                                      |

### 4.2 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                     │
│         Dashboard │ Chat UI │ Log Forms │ Reports        │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS + Bearer JWT
┌───────────────────────────▼─────────────────────────────┐
│                    FastAPI Backend                        │
│   Auth Middleware → validates Supabase JWT               │
│   REST endpoints: /logs, /agent, /reports, /reminders    │
└──────────┬─────────────────────────┬────────────────────┘
           │                         │
┌──────────▼──────────┐   ┌──────────▼──────────────────┐
│  PostgreSQL + pgvec │   │       LangGraph Agent        │
│  profiles           │   │  Analyze → Plan → Tools      │
│  sleep_logs         │   │  Draft → Verify → Actions    │
│  meals              │   └──────────┬──────────────────┘
│  study_sessions     │              │
│  papers             │   ┌──────────▼──────────────────┐
│  paper_chunks       │   │        Tool Services         │
│  agent_runs         │   │  RAG (pgvector + Cohere)     │
│  recommendations    │   │  Log Analysis (SQL)          │
│  reminders          │   │  Scheduler (Inngest)         │
└─────────────────────┘   └─────────────────────────────┘
```

### 4.3 Agent State Machine

```
User input
    │
    ▼
Analyze user logs (deterministic SQL — no LLM)
    │
    ▼
Plan tool calls (LLM decides next step)
    │
    ├──► query_research ──────────────────┐
    ├──► analyze_logs ────────────────────┤ Loop until
    └──► find_correlations ───────────────┘ "done" (max 8)
    │
    ▼
Draft recommendation (with inline citations)
    │
    ▼
Verify grounding (separate LLM call, score 0–1)
    │
    ├── score < 0.7 → retry draft (max 2x)
    │
    └── score ≥ 0.7 → execute actions → stream to user
```

---

## 5. Database Schema (Summary)

| Table             | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `profiles`        | User profile data; `user_id` is Supabase Auth UUID                     |
| `goals`           | Active and historical user goals                                       |
| `sleep_logs`      | Nightly sleep entries with generated `duration_minutes`                |
| `meals`           | Meal entries with optional macros and caffeine                         |
| `study_sessions`  | Study session entries with focus ratings                               |
| `papers`          | Ingested research papers metadata                                      |
| `paper_chunks`    | Chunked paper content with 1536-dim embeddings                         |
| `agent_runs`      | Full trace log of every agent invocation                               |
| `recommendations` | Agent-generated recommendations with citations and verification scores |
| `reminders`       | Scheduled actions with status tracking                                 |
| `weekly_reports`  | Auto-generated weekly summaries                                        |

---

## 6. Build Plan

### Week 1: Foundation + Data Pipeline

- Monorepo setup, Docker Compose, database schema
- PubMed ingestion script: fetch papers, parse, section-aware chunk, embed, store in pgvector
- Target: 2,000+ papers indexed
- Deliverable: CLI search over the corpus works end-to-end

### Week 2: RAG Core + Retrieval Eval

- FastAPI skeleton: auth middleware, log endpoints, `/research/query`
- Retrieval pipeline: vector search → Cohere rerank → return with citations
- Build eval Layer 1: 30 Q&A pairs, measure Recall@5/10 and MRR
- Basic frontend: auth flow, log entry forms
- Deliverable: retrieval works with baseline eval numbers logged

### Week 3: LangGraph Agent

- Implement all tool functions
- Build the agent graph (Analyze → Plan → Tools → Draft → Verify → Actions)
- LangSmith tracing enabled
- Expose `/agent/coach` endpoint
- Build eval Layer 2: 20 Q&A pairs, LLM-as-judge scoring
- Deliverable: "coach me" returns cited, verified recommendations

### Week 4: Actions + UX Polish

- Inngest background jobs: scheduled reminders, Sunday weekly report cron
- Streaming responses via Server-Sent Events
- Frontend: dashboard charts, streaming chat UI, reports view, reminders management
- Deliverable: agent schedules things and the app feels alive

### Week 5: Evaluation + Deploy

- Build eval Layer 3: 20 synthetic user profiles, agent behavior testing
- Redis caching for frequent retrieval queries
- GitHub Actions CI pipeline
- Deploy: Vercel + Render
- Write README: architecture diagram, demo GIF, eval results table
- Deliverable: live URL, polished repo, eval numbers ready to discuss in interviews

---

## 7. Evaluation Metrics

| Metric                            | Target | How Measured            |
| --------------------------------- | ------ | ----------------------- |
| Retrieval Recall@5                | ≥ 0.85 | Layer 1 eval suite      |
| Retrieval Recall@10               | ≥ 0.92 | Layer 1 eval suite      |
| MRR                               | ≥ 0.70 | Layer 1 eval suite      |
| Answer correctness                | ≥ 0.85 | LLM-as-judge, Layer 2   |
| Answer grounding                  | ≥ 0.90 | LLM-as-judge, Layer 2   |
| Safety (no unsafe medical claims) | 1.00   | LLM-as-judge, Layer 2   |
| Agent pattern detection accuracy  | ≥ 0.85 | Layer 3 synthetic users |
| Citation validity                 | ≥ 0.95 | Layer 3 synthetic users |
| Hallucination rate (production)   | < 0.05 | Verification node score |

---

## 8. Risks and Mitigations

| Risk                                      | Likelihood | Mitigation                                                                            |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| PubMed papers mostly paywalled            | High       | Use abstracts only (always free via API); full text is a bonus                        |
| Agent loop runs away                      | Medium     | Hard cap: 8 tool calls, 30s timeout                                                   |
| Eval harness built too late               | Medium     | Build Layer 1 in Week 2, not Week 5 — need baseline to show improvement               |
| Scope creep on features                   | High       | If behind in Week 4, drop actions layer; RAG + agent + eval alone is a strong project |
| Generated column syntax errors            | Low        | Already caught and fixed during schema development                                    |
| Docker volume not fresh on schema changes | Medium     | Document the `docker compose down -v` workflow clearly in README                      |

---

## 9. Resume Artifacts

When complete, this project supports the following resume bullets:

- Built agentic health coach for students using LangGraph with 6 tool integrations, combining personal log analysis with RAG over 3,000+ peer-reviewed papers from PubMed
- Implemented section-aware chunking and Cohere reranking pipeline, improving retrieval Recall@5 from X% to 89% on a 30-question evaluation suite
- Designed citation-grounded recommendation system with LLM-as-judge verification step, achieving <4% hallucination rate across 20 synthetic user profiles
- Engineered streaming agent responses via Server-Sent Events with Redis caching, achieving sub-200ms time-to-first-token
- Deployed full-stack application on Vercel and Render, containerized with Docker for reproducible local development

---

## 10. Open Questions

| #   | Question                                           | Resolution                                            |
| --- | -------------------------------------------------- | ----------------------------------------------------- |
| 1   | Use Inngest or Celery for background jobs?         | Inngest — simpler for solo dev, no broker setup       |
| 2   | Abstract-only corpus or full-text where available? | Start with abstracts; add full-text incrementally     |
| 3   | Which judge model for LLM-as-judge?                | Different from agent model to avoid self-grading bias |
| 4   | Add Alembic migrations in Week 1 or later?         | Week 1 once base schema is validated                  |
| 5   | v2: Apple Health / Google Fit integration?         | Post-launch — don't scope into v1                     |
