begin;
create table public.museum_memory_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null default '來自訪客的一段南澳記憶',
  content text not null check (char_length(btrim(content)) > 0),
  place_name text not null check (char_length(btrim(place_name)) > 0),
  category text not null default '生活',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  sharer_name text not null default '匿名',
  period_text text not null default '年代未提供',
  image_url text,
  source text not null default 'museum_contribution_form',
  created_at timestamptz not null default now()
);
create index museum_memory_submissions_review_idx on public.museum_memory_submissions (status, created_at desc);
alter table public.museum_memory_submissions enable row level security;
revoke all on public.museum_memory_submissions from public, anon, authenticated;
grant insert (title, content, place_name, category, status, sharer_name, period_text, image_url) on public.museum_memory_submissions to anon, authenticated;
create policy "Visitors submit pending museum memories" on public.museum_memory_submissions for insert to anon, authenticated with check (status = 'pending');
comment on table public.museum_memory_submissions is '南澳虛擬博物館簡易投稿表單；投稿待管理員整理與審核。';
commit;
