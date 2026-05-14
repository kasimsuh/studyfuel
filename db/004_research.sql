-- ============================================================
-- PAPERS
-- ============================================================

CREATE TABLE papers (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source            TEXT NOT NULL,         -- 'pubmed', 'semantic_scholar', 'manual'
    external_id       TEXT NOT NULL,         -- e.g., PubMed PMID
    title             TEXT NOT NULL,
    authors           TEXT[],
    abstract          TEXT,
    journal           TEXT,
    publication_year  INT,
    doi               TEXT,
    source_url        TEXT,
    topics            TEXT[],
    citation_count    INT DEFAULT 0,
    is_peer_reviewed  BOOLEAN DEFAULT TRUE,
    ingested_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source, external_id)
);

CREATE INDEX idx_papers_topics ON papers USING GIN (topics);
CREATE INDEX idx_papers_year   ON papers(publication_year DESC);

-- ============================================================
-- PAPER CHUNKS (the RAG retrieval target)
-- ============================================================

CREATE TABLE paper_chunks (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id      UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    chunk_index   INT NOT NULL,
    section_type  TEXT NOT NULL CHECK (section_type IN (
        'abstract', 'introduction', 'methods', 'results',
        'discussion', 'conclusion', 'other'
    )),
    content       TEXT NOT NULL,
    token_count   INT NOT NULL,
    embedding     vector(1536),              -- OpenAI text-embedding-3-small
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (paper_id, chunk_index)
);

-- HNSW index for fast cosine similarity search
CREATE INDEX idx_chunks_embedding ON paper_chunks
    USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_chunks_section ON paper_chunks(section_type);