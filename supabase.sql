-- WordFlow: таблица для синхронизации прогресса через Supabase.
-- Как выполнить: Supabase → ваш проект → SQL Editor → New query → вставьте весь этот текст → Run.

create table if not exists public.wordflow_state (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Каждый пользователь видит и меняет только свою строку
alter table public.wordflow_state enable row level security;

drop policy if exists "wordflow: read own"   on public.wordflow_state;
drop policy if exists "wordflow: insert own" on public.wordflow_state;
drop policy if exists "wordflow: update own" on public.wordflow_state;
drop policy if exists "wordflow: delete own" on public.wordflow_state;

create policy "wordflow: read own"   on public.wordflow_state for select to authenticated using (auth.uid() = user_id);
create policy "wordflow: insert own" on public.wordflow_state for insert to authenticated with check (auth.uid() = user_id);
create policy "wordflow: update own" on public.wordflow_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wordflow: delete own" on public.wordflow_state for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.wordflow_state to authenticated;
