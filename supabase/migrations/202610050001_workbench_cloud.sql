begin;
create table public.wb_projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(char_length(btrim(name)) between 1 and 100),
 summary text not null check(char_length(btrim(summary)) between 1 and 5000),
 plan text not null default '' check(char_length(plan)<=12000),
 repo_url text not null default '' check(repo_url='' or (repo_url ~ '^https://github[.]com/[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$' and repo_url !~ '/[.]{1,2}$')),
 created_at timestamptz not null default now(),unique(id,owner_id)
);
create table public.wb_notes (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null,
 owner_id uuid not null default auth.uid() references auth.users(id),
 content text not null check(char_length(btrim(content)) between 1 and 8000),
 created_at timestamptz not null default now(),
 foreign key(project_id,owner_id) references public.wb_projects(id,owner_id)
);
alter table public.wb_projects enable row level security;
alter table public.wb_notes enable row level security;
revoke all on public.wb_projects,public.wb_notes from public,anon,authenticated;
grant select,insert on public.wb_projects,public.wb_notes to authenticated;
grant update(plan,repo_url) on public.wb_projects to authenticated;
create policy wb_projects_select on public.wb_projects for select to authenticated using(owner_id=auth.uid());
create policy wb_projects_insert on public.wb_projects for insert to authenticated with check(owner_id=auth.uid());
create policy wb_projects_update on public.wb_projects for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy wb_notes_select on public.wb_notes for select to authenticated using(owner_id=auth.uid());
create policy wb_notes_insert on public.wb_notes for insert to authenticated with check(owner_id=auth.uid());
commit;
