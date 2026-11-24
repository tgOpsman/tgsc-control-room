<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Architecture
- Red Hat loads room-scoped live occupancy through a shared snapshot helper, storing source IDs to avoid reloading rows and preserve checkoffs; tenant headcounts remain unknown until entered. Why: live directories supply occupiers, not staff counts.
- Tenant contact dialogs read and manage linked out-of-hours contacts by tenant ID and room ID through the browser client, with deletion restricted by existing admin/manager RLS. Why: contacts stay linked to their store without bypassing room permissions.
- Tenant directory fields remain in the shared module configuration, with client-side natural sorting in a dedicated helper. Why: spreadsheet details use the existing editor while sorting works across the filtered list.
- Every operational log is defined in `src/lib/modules.ts` and rendered by `src/components/app/ModulePage.tsx`; add new logs there plus a thin route file, not bespoke pages. Why: 30+ similar logs stay consistent.
- Every scoped table has `control_room_id` (defaults to `current_room()`), RLS via `in_room()`, and the `write_audit` trigger. New tables must copy this pattern. Why: room-scoped access + UK GDPR audit coverage.
- `compliance_audit_logs` is append-only (triggers block update/delete/truncate); never add write grants or policies to it.
- Roles live only in `user_roles`; never on profiles. Extra/unknown imported Base44 fields go in each table's `extra` jsonb, original ids in `legacy_id`.
- Privileged access-check helpers (room/role) live in the non-exposed `private` schema as SECURITY DEFINER; `public` versions are thin SECURITY INVOKER wrappers. Why: keeps RLS working without exposing definer functions via the API.
- Staff accounts are created by admins via `createStaffAccounts` (service role, admin-checked); usernames map to `<username>@staff.tgsc.local` (src/lib/usernames.ts) and `user_metadata.must_complete_profile` gates the first-login profile screen. Why: no public sign-up; Auth requires an email.

- Idle sign-out lives in src/hooks/use-idle-logout.tsx and is mounted in the _authenticated shell (kiosk role exempt). Why: shared 24/7 control room desks.
- Admin password resets go through `resetStaffPassword` (service role, admin-checked) and re-set `must_complete_profile`. Why: username-only staff have no inbox for reset emails.
- The UK threat level is set only by the GOV.UK sync (no manual picker); it syncs from the GOV.UK content API (MI5 feed is behind a Cloudflare challenge) once per sign-in session, and only inserts when it differs. Why: avoids duplicate history rows.
- Shared overdue/archive/regular-visitor rules live in src/lib/overdue.ts. Why: one tested source for 24h/12h thresholds.
- Public QR visitor check-in (`/visitor-checkin`) uses unauthenticated server functions in `src/lib/visitor.functions.ts` that require the room's `control_rooms.checkin_token`, write only one check-in row and return only shop names. Why: visitors have no account; the key scopes writes to one site.
- New-entry saves go through `insertOrQueue` (src/lib/offline-queue.ts); network failures queue locally and `OfflineBanner` replays them. Why: internet drops must not lose control room entries.
