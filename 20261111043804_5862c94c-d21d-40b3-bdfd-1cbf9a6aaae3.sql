create type public.app_role as enum ('admin','manager','security','kiosk','patrol','cleaner','user');

create table public.control_rooms (id uuid primary key default gen_random_uuid(), name text not null unique, created_at timestamptz not null default now());
insert into public.control_rooms(name) values ('TGSC Control Room');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, email text, page_permissions text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role public.app_role not null, unique(user_id, role));
create table public.control_room_members (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, control_room_id uuid references public.control_rooms(id) on delete cascade not null, unique(user_id, control_room_id));

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.in_room(_room uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.control_room_members where user_id=auth.uid() and control_room_id=_room) $$;
create or replace function public.current_room()
returns uuid language sql stable security definer set search_path = public as $$
  select control_room_id from public.control_room_members where user_id=auth.uid() order by id limit 1 $$;
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;

create table public.compliance_audit_logs (
  id bigint generated always as identity primary key, occurred_at timestamptz not null default now(),
  actor_id uuid, actor_email text, action text not null, table_name text not null, record_id text,
  control_room_id uuid, old_data jsonb, new_data jsonb);
grant select on public.compliance_audit_logs to authenticated;
grant all on public.compliance_audit_logs to service_role;
alter table public.compliance_audit_logs enable row level security;
create policy "admins and managers read audit" on public.compliance_audit_logs for select to authenticated
  using ((public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager')) and (control_room_id is null or public.in_room(control_room_id)));
create or replace function public.block_audit_change()
returns trigger language plpgsql set search_path = public as $$ begin raise exception 'compliance_audit_logs is immutable'; end; $$;
create trigger trg_audit_immutable before update or delete on public.compliance_audit_logs for each row execute function public.block_audit_change();
create trigger trg_audit_no_truncate before truncate on public.compliance_audit_logs for each statement execute function public.block_audit_change();

create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb; o jsonb; n jsonb;
begin
  if tg_op <> 'INSERT' then o := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then n := to_jsonb(new); end if;
  r := coalesce(n, o);
  insert into public.compliance_audit_logs(actor_id, actor_email, action, table_name, record_id, control_room_id, old_data, new_data)
  values (auth.uid(), (select email from public.profiles where id=auth.uid()), tg_op, tg_table_name, r->>'id',
          nullif(r->>'control_room_id','')::uuid, o, n);
  return coalesce(new, old);
end; $$;

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));

grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

grant select, insert, update, delete on public.control_room_members to authenticated;
grant all on public.control_room_members to service_role;
alter table public.control_room_members enable row level security;
create policy "read own membership" on public.control_room_members for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage membership" on public.control_room_members for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

grant select on public.control_rooms to authenticated;
grant all on public.control_rooms to service_role;
alter table public.control_rooms enable row level security;
create policy "members read rooms" on public.control_rooms for select to authenticated using (public.in_room(id) or public.has_role(auth.uid(),'admin'));

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger trg_roles_audit after insert or update or delete on public.user_roles for each row execute function public.write_audit();
create trigger trg_members_audit after insert or update or delete on public.control_room_members for each row execute function public.write_audit();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);
  if (select count(*) from public.user_roles where role='admin') = 0 then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
    insert into public.control_room_members(user_id, control_room_id)
      select new.id, id from public.control_rooms order by created_at limit 1;
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.tenants (name text not null, unit_number text, floor text, loading_bays text, goods_lift_number text, contact_name text, contact_phone text, contact_email text, is_active boolean not null default true);
create table public.key_inventory (item_type text not null default 'Key', key_press_colour text, key_number text, pass_number text, total_keys_on_bunch int, description text, is_active boolean not null default true);
create table public.asset_inventory (asset_type text not null, asset_number text, serial text, model text, status text not null default 'available', is_active boolean not null default true);
create table public.contractor_inventory (company text not null, services text, emergency_phone text, email text, sla text, is_active boolean not null default true);
create table public.evacuation_events (started_at timestamptz not null default now(), ended_at timestamptz, status text not null default 'active', is_drill boolean not null default false, reason text, started_by text);
create table public.team_members (name text not null, team text not null default 'Dual Service', role_group text, email text, phone text, is_active boolean not null default true);
create table public.bookings (title text not null, space text, asset text, start_at timestamptz not null, end_at timestamptz not null, booked_by uuid default auth.uid(), booked_for text, status text not null default 'confirmed', notes text);

-- add standard columns to parents first so children can reference ids
do $$
declare t text;
begin
  foreach t in array array['tenants','key_inventory','asset_inventory','contractor_inventory','evacuation_events','team_members','bookings'] loop
    execute format('alter table public.%I add column id uuid primary key default gen_random_uuid()', t);
  end loop;
end $$;

create table public.out_of_hours_contacts (tenant_id uuid references public.tenants(id) on delete cascade, name text not null, role text, phone text, email text, notes text);
create table public.vehicle_visits (licence_plate text not null, vehicle_pass text, driver_name text, driver_company text, destination_tenant text, status text not null default 'active', check_in_time timestamptz not null default now(), check_out_time timestamptz, archived boolean not null default false, notes text);
create table public.check_in_records (visit_type text not null default 'Visitor', booking_ref text, full_name text not null, company text, destination text, access_reason text, badge_number text, status text not null default 'active', check_in_time timestamptz not null default now(), check_out_time timestamptz, archived boolean not null default false, notes text);
create table public.key_logs (key_id uuid references public.key_inventory(id) on delete set null, item_label text, issued_to text not null, company text, issued_at timestamptz not null default now(), returned_at timestamptz, status text not null default 'out', keys_out int, keys_returned int, count_mismatch boolean not null default false, notes text);
create table public.key_audits (audit_date timestamptz not null default now(), auditor_name text, status text not null default 'completed', issues jsonb not null default '[]'::jsonb, notes text);
create table public.asset_logs (asset_id uuid references public.asset_inventory(id) on delete set null, asset_label text, issued_to text not null, issued_at timestamptz not null default now(), returned_at timestamptz, status text not null default 'out', in_order boolean not null default true, notes text);
create table public.car_park_patrols (officer_name text not null, patrol_start timestamptz not null default now(), patrol_end timestamptz, status text not null default 'active', checkpoints jsonb not null default '[]'::jsonb, notes text);
create table public.barrier_raise_logs (raised_at timestamptz not null default now(), item text, reason text, vehicle_reg text, raised_by text, notes text);
create table public.cctv_logs (log_type text not null, logged_at timestamptz not null default now(), controller_name text, reference text, details jsonb not null default '{}'::jsonb, notes text);
create table public.fire_logs (log_type text not null, logged_at timestamptz not null default now(), reference text, result text, tested_by text, details jsonb not null default '{}'::jsonb, comments text);
create table public.contractor_callouts (contractor_id uuid references public.contractor_inventory(id) on delete set null, reference text, equipment text, fault_description text, called_at timestamptz not null default now(), attended_at timestamptz, resolved_at timestamptz, status text not null default 'open', resolution_notes text);
create table public.weather_logs (logged_at timestamptz not null default now(), reference text, outside_temp numeric, inside_temp numeric, weather text, wind text, recorded_by text, notes text);
create table public.spillage_logs (spilled_at timestamptz not null default now(), location text, spill_type text, spill_type_other text, reported_by text, cleaned_by text, cleaned_at timestamptz, status text not null default 'open', notes text);
create table public.radon_tests (test_start timestamptz not null default now(), test_finish timestamptz, location text, level numeric, status text not null default 'safe', tested_by text, notes text);
create table public.defect_reports (report_datetime timestamptz not null default now(), location text, description text not null, photo_url text, reported_by text, status text not null default 'open', resolved_by text, resolved_at timestamptz);
create table public.handover_reports (shift_date date not null default current_date, shift text, author text, checklist jsonb not null default '{}'::jsonb, summary text, issues text);
create table public.found_properties (record_type text not null default 'found', item_number text, item_date timestamptz not null default now(), description text not null, found_by text, where_stored text, owner_contacted text, returned text, destroyed text, status text not null default 'retained', notes text);
create table public.vacant_unit_checks (unit text not null, checked_at timestamptz not null default now(), inspector text, answers jsonb not null default '{}'::jsonb, notes text);
create table public.muster_records (event_id uuid references public.evacuation_events(id) on delete cascade, name text not null, company text, ref text, people int not null default 1, status text not null default 'unaccounted', checked_at timestamptz, notes text);
create table public.ct_incidents (title text not null, start_datetime timestamptz not null default now(), status text not null default 'active', is_drill boolean not null default false, logs jsonb not null default '[]'::jsonb, summary text);
create table public.bomb_threats (received_at timestamptz not null default now(), received_by text, threat_method text, caller_details text, exact_wording text, status text not null default 'open', details jsonb not null default '{}'::jsonb);
create table public.training_records (member_id uuid references public.team_members(id) on delete cascade, programme text, section text, module text, assessed_at timestamptz, method text, assessor text, status text not null default 'pending', notes text);
create table public.roster_shifts (member_id uuid references public.team_members(id) on delete cascade, shift_date date not null, shift_code text not null, notes text);
create table public.shift_checkoffs (member_id uuid references public.team_members(id) on delete cascade, shift_date date not null, hours numeric, verified_by text, notes text);
create table public.compliance_checks (booking_id uuid references public.bookings(id) on delete cascade, check_type text not null, checked_at timestamptz not null default now(), checked_by text, passed boolean not null default true, notes text);

do $$
declare t text;
  parents text[] := array['tenants','key_inventory','asset_inventory','contractor_inventory','evacuation_events','team_members','bookings'];
  all_t text[] := array['tenants','key_inventory','asset_inventory','contractor_inventory','evacuation_events','team_members','bookings',
    'out_of_hours_contacts','vehicle_visits','check_in_records','key_logs','key_audits','asset_logs','car_park_patrols','barrier_raise_logs',
    'cctv_logs','fire_logs','contractor_callouts','weather_logs','spillage_logs','radon_tests','defect_reports','handover_reports',
    'found_properties','vacant_unit_checks','muster_records','ct_incidents','bomb_threats','training_records','roster_shifts','shift_checkoffs','compliance_checks'];
begin
  foreach t in array all_t loop
    if not (t = any(parents)) then
      execute format('alter table public.%I add column id uuid primary key default gen_random_uuid()', t);
    end if;
    execute format('alter table public.%I
      add column control_room_id uuid not null default public.current_room() references public.control_rooms(id) on delete cascade,
      add column legacy_id text,
      add column extra jsonb not null default ''{}''::jsonb,
      add column created_by uuid default auth.uid(),
      add column created_at timestamptz not null default now(),
      add column updated_at timestamptz not null default now()', t);
    execute format('create index on public.%I(control_room_id)', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "room members read" on public.%I for select to authenticated using (public.in_room(control_room_id))', t);
    execute format('create policy "room members add" on public.%I for insert to authenticated with check (public.in_room(control_room_id))', t);
    execute format('create policy "room members edit" on public.%I for update to authenticated using (public.in_room(control_room_id)) with check (public.in_room(control_room_id))', t);
    execute format('create policy "managers delete" on public.%I for delete to authenticated using (public.in_room(control_room_id) and (public.has_role(auth.uid(),''admin'') or public.has_role(auth.uid(),''manager'')))', t);
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.touch_updated_at()', t, t);
    execute format('create trigger trg_%s_audit after insert or update or delete on public.%I for each row execute function public.write_audit()', t, t);
  end loop;
end $$;

create table public.access_requests (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null, company text, reason text,
  status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant insert on public.access_requests to anon;
grant select, insert, update, delete on public.access_requests to authenticated;
grant all on public.access_requests to service_role;
alter table public.access_requests enable row level security;
create policy "anyone can request" on public.access_requests for insert to anon, authenticated with check (status = 'pending');
create policy "admins review" on public.access_requests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins update" on public.access_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins delete" on public.access_requests for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger trg_access_requests_audit after insert or update or delete on public.access_requests for each row execute function public.write_audit();

create table public.staff_login_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), user_name text, email text, role text, login_at timestamptz not null default now());
grant select, insert on public.staff_login_logs to authenticated;
grant all on public.staff_login_logs to service_role;
alter table public.staff_login_logs enable row level security;
create policy "log own login" on public.staff_login_logs for insert to authenticated with check (user_id = auth.uid());
create policy "managers read logins" on public.staff_login_logs for select to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));