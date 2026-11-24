create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_room() returns uuid language sql stable security definer set search_path to 'public' as $$
  select control_room_id from public.control_room_members where user_id=auth.uid() order by id limit 1 $$;
create or replace function private.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function private.in_room(_room uuid) returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists(select 1 from public.control_room_members where user_id=auth.uid() and control_room_id=_room) $$;
revoke all on function private.current_room(), private.has_role(uuid, public.app_role), private.in_room(uuid) from public, anon;
grant execute on function private.current_room(), private.has_role(uuid, public.app_role), private.in_room(uuid) to authenticated, service_role;

create or replace function public.current_room() returns uuid language sql stable security invoker set search_path to 'public' as $$ select private.current_room() $$;
create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security invoker set search_path to 'public' as $$ select private.has_role(_user_id, _role) $$;
create or replace function public.in_room(_room uuid) returns boolean language sql stable security invoker set search_path to 'public' as $$ select private.in_room(_room) $$;