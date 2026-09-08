---
version: alpha
colors:
  canvas: "#07090D"
  canvasRaised: "#0A0D12"
  surface: "#0F141B"
  text: "#F3F6F9"
  textMuted: "#8A949F"
  metalHighlight: "#D9E0E7"
  metalMid: "#AEB9C5"
  accent: "#78BFFF"
  success: "#6ED2AA"
  warning: "#D9AE67"
  danger: "#FF6372"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
rounded:
  control: "13px"
  card: "22px"
  panel: "26px"
  shell: "28px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  navigationShell:
    radius: "28px"
  topCommandBar:
    radius: "21px"
  diagnosticPanel:
    radius: "26px"
  actionControl:
    radius: "13px"
---

## Overview

AG2 Developer Console is a **product surface**, not a marketing dashboard. Its primary user is the AG2 developer triaging ContentLog failures, runtime regressions, performance spikes, and weapon-state data on iPhone and desktop. The interface should feel like a precision diagnostic instrument viewed through ion-strengthened glass and bead-blasted titanium.

The North Star is **quiet technical luxury**: deep graphite, transparent dark glass, polished metal edges, precise type, and restrained semantic color. The signature is the metallic specular edge carried across the shell, top command bar, access gate, and diagnostic surfaces. That material language should be memorable; everything else stays disciplined.

Anti-references: RGB gaming dashboards, neon hacker terminals, generic SaaS card grids, heavy colored gradients, excessive glow, skeuomorphic brushed-metal textures, and decorative motion that competes with log analysis.

Runtime token owner for the console is `dev-console/theme-colorful.css` despite the legacy filename. This `DESIGN.md` records the durable intent; the CSS file implements the values and translucent alpha variants.

## Colors

Use `canvas` and `canvasRaised` for the document and deep shell. Most surfaces are translucent derivatives of `surface`; do not make every card a different hue.

`metalHighlight` and `metalMid` define titanium-like edges, buttons, and reflective detail. `accent` is reserved for focus, active navigation, selected state, and primary information. Semantic colors keep consistent meaning:

- `success`: healthy runtime / completed analysis
- `warning`: non-fatal risk / degraded state
- `danger`: critical or error state
- `accent`: selection, focus, active navigation, neutral diagnostic emphasis

Do not communicate severity by color alone; labels and counts remain explicit.

## Typography

Use the platform system stack so iPhone renders with its native San Francisco family without bundling proprietary font files. Desktop falls back to the system UI face. Headings use the display role with tight tracking and moderate weight; body copy stays regular and compact. Log payloads, source paths, timestamps, IDs, and runtime values use the mono role.

Avoid oversized hero typography inside the console. Page titles should orient, not dominate. Data numbers may be large only when they are primary diagnostic values.

## Layout

Desktop uses a floating persistent sidebar plus a floating command bar. The workspace remains document-scrolling; individual list surfaces may own internal scrolling when their existing behavior requires it.

The layout rhythm is deliberately asymmetric: KPI lenses and panels use softened corner families rather than identical rectangles. On mobile, the sidebar becomes an overlay sheet, the command bar stays reachable inside safe areas, KPI metrics form a two-column scan pattern, and dense filters may scroll horizontally.

Keep diagnostic content above decoration. Charts, tables, inspector details, and upload status must retain stable geometry while data changes.

## Elevation & Depth

Depth comes from four restrained layers:

1. dark translucent surface;
2. one bright top/inset edge;
3. one soft dark outer shadow;
4. a faint neutral/cool reflective wash.

Use real `backdrop-filter` only on the access gate, sidebar, and top command bar. Repeating blur on every diagnostic card is intentionally avoided because the console must stay responsive on iPhone. Diagnostic panels simulate glass through alpha layering and inset specular edges.

No strong bloom, no continuous animated blur, and no large moving background effects.

## Shapes

Controls use 13px radii; large diagnostic panels use 22–30px families. Major surfaces may use an intentionally asymmetric lower corner to break the box-grid feeling while keeping alignment predictable.

Pills are reserved for compact status, filters, counters, and metadata. Full content cards are not pills.

## Components

**Sidebar** — transparent graphite glass, titanium edge, restrained active capsule with a thin cool-blue locator. Navigation remains readable without relying on icons alone.

**Top command bar** — floating glass slab with search, build state, analysis action, and runtime state. It should read as one coherent tool surface.

**KPI lens** — neutral glass card with one semantic indicator, not a fully colored tile. Numbers are the hierarchy; color is a supporting signal.

**Diagnostic panel** — transparent graphite surface with integrated header. Avoid visible box-within-box framing unless the inner boundary communicates a real interaction region.

**Primary action** — polished light titanium treatment with dark text. Use sparingly for the action the user should take next.

**Ghost action** — dark glass, quiet border, clear hover/focus/pressed states.

**Input/search** — recessed dark glass with a cool focus ring. Search fields should expose a clear action when non-empty when the implementation owner supports it.

**Upload tray** — large rounded glass surface with a picker alternative; drag/drop is an enhancement, never the only interaction.

**Scrollbar** — globally visible, thin, graphite/titanium, and inherited by every owned scroll surface.

## Do's and Don'ts

Do:

- keep semantic colors sparse and meaningful;
- use reflective edges to communicate material rather than heavy decoration;
- preserve strong contrast and visible keyboard focus;
- keep mobile performance ahead of visual spectacle;
- prefer one premium material system across every route.

Don't:

- reintroduce multicolor neon cards;
- add animated particles, heavy blur loops, or full-screen glow effects;
- make all panels identical hard rectangles;
- hide scrollbars for aesthetics;
- use browser-native alert/confirm/prompt for product actions;
- place access keys, secrets, or sensitive log values in URLs or decorative UI.
