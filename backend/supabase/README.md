# Optional Supabase backend

The AG2 Creator Debugger is local-first and does not require a server. This backend is only for authenticated cross-device history sync.

## Deploy

1. Choose a Supabase project.
2. Run `schema.sql` in that project.
3. Deploy the `debug-ingest` Edge Function with JWT verification enabled.
4. Add GitHub repository secrets:
   - `AG2_SUPABASE_URL`
   - `AG2_SUPABASE_PUBLISHABLE_KEY`
5. Configure Supabase Auth for developer accounts.

The browser must only receive a publishable/anon key. Never expose a service-role key in GitHub Pages.

The RLS policies in `schema.sql` restrict each authenticated developer to their own debugging sessions.
