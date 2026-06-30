-- Run this in Supabase SQL editor to set up all tables + functions

-- 1. Enable pgvector if not already
create extension if not exists vector;

-- 2. match_components RPC (used by component-retrieval.ts)
create or replace function match_components(
  query_embedding vector(1536),
  match_industry text default null,
  min_quality int default 7,
  match_count int default 4
)
returns table (
  id uuid,
  component_name text,
  category text,
  industry text,
  design_style text,
  color_scheme text,
  tsx_code text,
  quality_score int,
  tags text[],
  preview_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    sc.id,
    sc.component_name,
    sc.category,
    sc.industry,
    sc.design_style,
    sc.color_scheme,
    sc.tsx_code,
    sc.quality_score,
    sc.tags,
    sc.preview_url,
    1 - (sc.embedding::vector(1536) <=> query_embedding) as similarity
  from scraped_components sc
  where
    sc.quality_score >= min_quality
    and (match_industry is null or sc.industry = match_industry)
    and sc.tsx_code is not null
    and length(sc.tsx_code) > 100
  order by sc.embedding::vector(1536) <=> query_embedding
  limit match_count;
end;
$$;

-- 3. User builds table — stores every successful build for RAG + training
create table if not exists user_builds (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  app_tsx text not null,
  category text,
  quality_score float,
  build_time_ms int,
  model_used text,
  created_at timestamptz default now(),
  embedding vector(1536)
);

create index if not exists user_builds_embedding_idx
  on user_builds using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. match_user_builds RPC — finds similar past builds
create or replace function match_user_builds(
  query_embedding vector(1536),
  match_count int default 3,
  min_quality float default 7.0
)
returns table (
  id uuid,
  prompt text,
  app_tsx text,
  category text,
  quality_score float,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    ub.id,
    ub.prompt,
    ub.app_tsx,
    ub.category,
    ub.quality_score,
    1 - (ub.embedding <=> query_embedding) as similarity
  from user_builds ub
  where
    ub.quality_score >= min_quality
    and ub.embedding is not null
  order by ub.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 5. Builder config table — stores the live system prompt (updated by training agent)
create table if not exists builder_config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now(),
  updated_by text default 'system'
);

-- Insert default (empty — generate.ts will fall back to hardcoded if not set)
insert into builder_config (key, value, updated_by)
values ('system_prompt_additions', '', 'setup')
on conflict (key) do nothing;

insert into builder_config (key, value, updated_by)
values ('forbidden_patterns', '', 'setup')
on conflict (key) do nothing;

insert into builder_config (key, value, updated_by)
values ('quality_score', '0', 'setup')
on conflict (key) do nothing;
