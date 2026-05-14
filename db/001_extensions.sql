-- Required extensions for the StudyFuel schema
CREATE EXTENSION IF NOT EXISTS vector;        -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- trigram index for fuzzy text search (handy later)