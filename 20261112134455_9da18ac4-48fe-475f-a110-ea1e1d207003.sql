create table public.threat_levels (
  id uuid primary key default gen_random_uuid(),
  control_room_id uuid not null default public.current_room() references public.control_rooms(id),
  level text not null,
  set_at timestamptz not null default now(),
  set_by text,
  notes text,
  legacy_id text,
  extra jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.threat_levels to authenticated;
grant all on public.threat_levels to service_role;
alter table public.threat_levels enable row level security;
create policy "room read" on public.threat_levels for select to authenticated using (public.in_room(control_room_id));
create policy "room insert" on public.threat_levels for insert to authenticated with check (public.in_room(control_room_id));
create policy "room update" on public.threat_levels for update to authenticated using (public.in_room(control_room_id));
create policy "room delete" on public.threat_levels for delete to authenticated using (public.in_room(control_room_id) and (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager')));
create trigger trg_threat_levels_audit after insert or update or delete on public.threat_levels for each row execute function public.write_audit();
create trigger trg_threat_levels_updated before update on public.threat_levels for each row execute function public.touch_updated_at();
alter publication supabase_realtime add table public.threat_levels;