-- Apply only after inspecting the existing public schema for conflicts.
-- Visitors can read and add responses; only project administrators moderate them.
begin;
create table public.story_responses (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.memories(id) check (story_id in (
    '1ebf7dc1-c669-4ede-bd13-aa7cd1b5bb15'::uuid,
    'e4d02bc2-8e20-4a1b-9fa1-8793a3490dfe'::uuid,
    'b5010357-d829-40b9-9b56-547e6ed81dd3'::uuid,
    'c4208d04-9350-4843-8b48-5c49c7893d86'::uuid,
    '09759c77-ca1c-464f-8e7a-26559950f102'::uuid
  )),
  display_name text not null default '訪客' check (char_length(btrim(display_name)) between 1 and 40),
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index story_responses_story_created_idx on public.story_responses (story_id, created_at desc, id desc);
alter table public.story_responses enable row level security;
revoke all on public.story_responses from anon, authenticated;
grant select on public.story_responses to anon, authenticated;
grant insert (story_id, display_name, content) on public.story_responses to anon, authenticated;
create policy "Visitors read story responses" on public.story_responses for select to anon, authenticated using (true);
create policy "Visitors add story responses" on public.story_responses for insert to anon, authenticated with check (true);
commit;
