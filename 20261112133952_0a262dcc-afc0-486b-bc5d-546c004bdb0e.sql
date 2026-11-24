create policy "room files read" on storage.objects for select to authenticated using (bucket_id='control-room-files' and public.in_room(((storage.foldername(name))[1])::uuid));
create policy "room files insert" on storage.objects for insert to authenticated with check (bucket_id='control-room-files' and public.in_room(((storage.foldername(name))[1])::uuid));
create policy "room files update" on storage.objects for update to authenticated using (bucket_id='control-room-files' and public.in_room(((storage.foldername(name))[1])::uuid));
create policy "room files delete" on storage.objects for delete to authenticated using (bucket_id='control-room-files' and public.in_room(((storage.foldername(name))[1])::uuid) and (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager')));
alter table public.handover_reports add column if not exists reference text;
alter table public.defect_reports add column if not exists reference text;