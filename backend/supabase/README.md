# AG2 Supabase production backend

The AG2 Creator Debugger remains local-first. Raw ContentLog, profiler and diagnostics files are parsed in the browser. Production sync stores only summarized debugger sessions for authenticated cross-device history.

## Production status

- Supabase project: `drmacze`
- Project ref: `ydaeukhqwishlrjyfktk`
- Region: `ap-northeast-1`
- Table: `public.ag2_debug_sessions`
- Edge Function: `debug-ingest`
- Edge Function JWT verification: enabled
- Frontend key type: browser-safe Supabase publishable key
- RLS: enabled; authenticated users can only select/insert/delete their own rows
- `anon`: no table privileges

## Frontend authentication

The Creator Debugger page exposes a production backend panel with Supabase email/password sign-in, account creation, token refresh, sign-out, session sync, remote history and delete controls.

The browser never receives a service-role key. The publishable key and project URL are intentionally public client configuration. Access tokens are issued by Supabase Auth and RLS enforces row ownership.

## Data sent to production

Only summaries are synchronized:

- build label
- device label
- Minecraft version
- artifact metadata/summary
- ContentLog summary
- CPU profile summary/top hot paths
- diagnostics summary

Raw uploaded files remain on the device unless the architecture is explicitly changed later.

## Re-deployment

`schema.sql` mirrors the production table, grants and RLS policies. The GitHub Pages workflow has browser-safe production URL/key fallbacks and can still be overridden through repository secrets:

- `AG2_SUPABASE_URL`
- `AG2_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase service-role key into GitHub Pages or repository source.
