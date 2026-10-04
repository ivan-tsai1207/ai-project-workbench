-- psql "$DATABASE_URL" -v user_a=UUID -v user_b=UUID -f supabase/tests/workbench_rls.sql
-- Requires two distinct PRECREATED Supabase Auth users; runs in a rollback transaction.
\set ON_ERROR_STOP on
begin;
select set_config('wb.test_a',:'user_a',true),set_config('wb.test_b',:'user_b',true);
do $$ begin if current_setting('wb.test_a')=current_setting('wb.test_b') then raise exception 'two different users required';end if;end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('wb.test_a'),true);
insert into public.wb_projects(name,summary) values('RLS A','temporary test') returning id as project_a \gset
select set_config('wb.project_a',:'project_a',true);
insert into public.wb_notes(project_id,content) values(:'project_a','A note');
update public.wb_projects set plan='A plan' where id=:'project_a';
select set_config('request.jwt.claim.sub',current_setting('wb.test_b'),true);
insert into public.wb_projects(name,summary) values('RLS B','temporary test') returning id as project_b \gset
select set_config('wb.project_b',:'project_b',true);
insert into public.wb_notes(project_id,content) values(:'project_b','B note');
do $$declare n int;begin
 select count(*) into n from public.wb_projects where id=current_setting('wb.project_a')::uuid;if n<>0 then raise exception 'B read A';end if;
 select count(*) into n from public.wb_notes where project_id=current_setting('wb.project_a')::uuid;if n<>0 then raise exception 'B read A notes';end if;
 update public.wb_projects set plan='attack' where id=current_setting('wb.project_a')::uuid;get diagnostics n=row_count;if n<>0 then raise exception 'B updated A';end if;
 begin insert into public.wb_notes(project_id,content) values(current_setting('wb.project_a')::uuid,'attack');raise exception 'cross-owner note accepted';exception when foreign_key_violation then null;end;
 begin insert into public.wb_projects(owner_id,name,summary) values(current_setting('wb.test_a')::uuid,'attack','attack');raise exception 'forged owner accepted';exception when insufficient_privilege then null;end;
 begin update public.wb_projects set owner_id=current_setting('wb.test_a')::uuid where id=current_setting('wb.project_b')::uuid;raise exception 'owner update accepted';exception when insufficient_privilege then null;end;
 begin update public.wb_notes set content='changed';raise exception 'note update accepted';exception when insufficient_privilege then null;end;
 begin delete from public.wb_projects;raise exception 'delete accepted';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('wb.test_a'),true);
do $$declare n int;begin
 select count(*) into n from public.wb_projects where id=current_setting('wb.project_b')::uuid;if n<>0 then raise exception 'A read B';end if;
 select count(*) into n from public.wb_notes where project_id=current_setting('wb.project_b')::uuid;if n<>0 then raise exception 'A read B notes';end if;
 update public.wb_projects set plan='attack' where id=current_setting('wb.project_b')::uuid;get diagnostics n=row_count;if n<>0 then raise exception 'A updated B';end if;
 begin insert into public.wb_notes(project_id,content) values(current_setting('wb.project_b')::uuid,'attack');raise exception 'reverse foreign note accepted';exception when foreign_key_violation then null;end;
end $$;
set local role anon;
do $$begin begin perform * from public.wb_projects;raise exception 'anon read accepted';exception when insufficient_privilege then null;end;begin insert into public.wb_notes(project_id,content) values(current_setting('wb.project_a')::uuid,'anon');raise exception 'anon write accepted';exception when insufficient_privilege then null;end;end $$;
rollback;
\echo 'RLS assertions passed; fixtures rolled back'
