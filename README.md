# AG2DESITE

Website and developer tooling for **AG2 × DLavie Definitive**.

## Developer console

- Main diagnostics: `dev-console/`
- Creator Debugger Toolkit: `dev-console/creator-debugger.html`
- VS Code template: `dev-console/creator-kit/launch.json`

The console is local-first. ContentLog, `.cpuprofile`, and diagnostics artifacts can be analyzed without a Dedicated Server or backend.

### Minecraft Creator Debugger

The direct debugger connection is **Minecraft client → VS Code**, not Minecraft → GitHub Pages. The toolkit generates the required VS Code `launch.json` and `/script debugger connect` command for the AG2 module UUID `ec128ecf-402a-4361-a786-c8f39fa44e2c`.

Useful commands:

```text
/script debugger connect [host] [port]
/script debugger close
/script profiler start
/script profiler stop
/script diagnostics startcapture
/script diagnostics stopcapture
/reload
```

Default debugger port: `19144`.

## Optional backend

`backend/supabase/` contains an optional authenticated history-sync backend. The website does **not** require it to work.

Never expose a Supabase service-role key in GitHub Pages. Use a publishable key + authenticated user JWT + RLS.

## Developer console access gate

The static access-key screen is only a UI/privacy gate, not strong security on a public GitHub Pages site. For real access control, put the site behind an identity-aware proxy or configure authenticated backend access.

The Pages workflow can inject these repository secrets when present:

- `DEV_CONSOLE_ACCESS_SHA256`
- `AG2_SUPABASE_URL`
- `AG2_SUPABASE_PUBLISHABLE_KEY`
