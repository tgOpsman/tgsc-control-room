revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.in_room(uuid) from public, anon;
revoke execute on function public.current_room() from public, anon;
revoke execute on function public.write_audit() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.in_room(uuid) to authenticated;
grant execute on function public.current_room() to authenticated;