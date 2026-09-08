# AG2 Developer Console UX Contract

This contract covers observable behavior for the private `dev-console/` product surface. Visual taste and tokens are owned by [`DESIGN.md`](./DESIGN.md).

## Product register

- Surface: developer/admin diagnostic tool.
- Primary task: analyze Minecraft Bedrock ContentLog data, isolate faults, inspect runtime state, compare builds, and export diagnostic evidence.
- Primary devices: iPhone Safari and desktop browsers.
- Locale: English UI.
- Accessibility target: WCAG 2.2 AA baseline.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native `<select>` in `dev-console/index.html` | This contract + `DESIGN.md` | weapon selector / build selectors | native keyboard + platform popup |
| Form | Access gate form + local ContentLog picker | `dev-console/auth-compat.js`, `dev-console/console.js` | access / local-file analysis | inline feedback + keyboard |
| Scrollbar | Global application theme | `dev-console/theme-colorful.css` + `DESIGN.md` | geometry only when a surface requires it | visible thumb/track + keyboard scroll |

Native select ownership is intentional: OS/browser-owned popup geometry is acceptable for the small number of developer-only selectors and is preferred to adding a custom listbox dependency.

## Navigation

Desktop uses a persistent sidebar. Narrow layouts use an overlay drawer. The drawer:

- opens from the menu button;
- moves focus into the drawer;
- traps Tab focus while open on narrow layouts;
- closes with Escape, the close control, or the scrim;
- restores focus to the menu trigger.

Views are peer diagnostic destinations: Dashboard, Live Console, Crash Analyzer, Error Inspector, Performance, Weapon Debug, ContentLog, and Build Compare.

Document titles follow `{View} — DLAVIE DEV`.

## Access gate

The access-key screen is a **UI/privacy gate only**, not server-side authorization. The repository README remains authoritative for this security boundary.

- Access key is masked by default and has an explicit Show/Hide control.
- Paste and password-manager behavior are not blocked.
- Failed access attempts show inline feedback; no browser alert is used.
- Five failed attempts trigger a 30-second local lockout.
- Successful access persists on the current browser/device until `Lock console` is used or site storage is cleared.
- Raw access keys are not written to URLs, logs, reports, or persistent storage.

## Search

Global Search and Live Console Search are local-only filters.

- No network request is triggered by typing.
- A non-empty field exposes an app-owned Clear search button.
- Clear happens immediately, dispatches the same local input/change path as typing, and returns focus to the field.
- Search controls remain usable with keyboard and touch.

## ContentLog analysis

ContentLog analysis is local-first.

- The visible drop zone always has a file-picker alternative.
- Enter or Space on the focused drop zone opens the picker.
- Accepted input is TXT/LOG as declared by the picker.
- Parsing status is exposed as a polite live status region.
- Existing parse progress, error, and result behavior remains owned by `dev-console/console.js`.
- The UI must never imply that local parsing uploaded the log to a server.

## Diagnostic views

Empty, analyzed, error, warning, and critical states retain stable panel geometry where feasible. Severity always uses text/count plus semantic color; color is never the sole signal.

View changes preserve the currently analyzed in-memory data. Build snapshots follow their existing local persistence behavior.

## Feedback and destructive actions

No current workflow requires a destructive confirmation dialog. `Lock console` explicitly clears the local persistent access session and returns to the gate on reload/navigation through the existing behavior.

Browser-native `alert()`, `confirm()`, and `prompt()` are not allowed for product feedback.

## Responsive behavior

- The page owns document scrolling.
- Sidebar becomes an overlay sheet below the desktop breakpoint.
- Dense filter chips may scroll horizontally on narrow screens.
- KPI metrics use a two-column mobile layout where space permits.
- Sticky/floating chrome must not obscure focused controls.
- Reduced-motion preference disables nonessential transitions.

## Security source

Repository security notes in `README.md` are authoritative: GitHub Pages is static, and the access-key gate is not strong server-side access control. Real access control requires an authenticated backend or identity-aware proxy.
