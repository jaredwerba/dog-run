# Go Dogs Boston Design System — Warm, Natural, Outdoorsy

The design language comes from the product's own world: Boston parks, trail signage,
race day, and dogs. Warm earth tones only — nothing neon, nothing that reads as
"software." The goal is that every screen makes you think of being outside: sun,
trees, fresh air.

## Color Palette

Defined as Tailwind v4 tokens in `app/globals.css` (`@theme inline`):

| Token | Hex | Role |
|---|---|---|
| `pine` | `#2f4f38` | Primary actions, dark sections, sent chat bubbles |
| `pine-deep` | `#22392a` | Hover states, footer, nav glass tint |
| `fern` | `#567c52` | Icons, mid-tone green, gradients |
| `moss` | `#8aa87a` | Avatar/photo placeholders, soft fills |
| `bark` | `#5a4534` | Trail-sign brown, secondary text, route line |
| `soil` | `#362b1f` | Body text ink (warm brown-black, never gray/black) |
| `sunlight` | `#e3a63c` | The sun, golden accents |
| `clay` | `#bd6b44` | Secondary accent, badges, eyebrows, Join button |
| `clay-deep` | `#a55835` | Clay hover, error text |
| `oat` | `#f6eedd` | Page background (`--background`) |
| `linen` | `#fbf6ea` | Cards, panels, alternate sections |
| `tennis` | `#c9d15f` | Tennis-ball motif, accents on dark green |

## Typography

- **Display — Bevan** (`font-display`): page/section headlines and the wordmark only.
  Chunky slab with vintage park-poster energy. Use with restraint.
- **Body — Public Sans** (`font-body`, set on `<body>`): a civic typeface, fitting
  for public parks. All UI copy.
- **Data — IBM Plex Mono** (`font-data`): paces, miles, timestamps, eyebrows,
  day labels. Uppercase with generous letter-spacing.

## Recurring motifs

- **Tennis ball** (`TennisBall` in `app/page.tsx`): headline punctuation, route-trail
  finish marker, "pack favorite" tag.
- **Trail signage**: dark-green boards with white lettering (route table), arrow-shaped
  wooden sign CTAs (`.trail-sign` clip-path), mile markers.
- **The illustrated forest**: layered SVG pines + glowing sun on the landing hero,
  with scroll parallax.
- **Hand-drawn doodles** (`components/JoggerDoodle.tsx`): wobbly-line cartoon of a
  runner jogging behind an English bulldog, palette colors only, animated with CSS
  keyframes plus an animated turbulence filter for the "boiling" hand-drawn look.
  Used on the landing match section and as the browse/messages empty states.
  New doodles should follow the same recipe: soil outlines (3–4px, round caps),
  flat palette fills, squigglevision filter, respect reduced motion.

## Motion — native iOS feel

Libraries: `motion` (Framer Motion) app-wide, `lenis` (smooth scrolling) on the landing
page, `three` + `@react-three/fiber` for 3D moments.
- iOS spring presets + press feedback live in `components/ux.tsx` (`spring`,
  `springBouncy`, `springGentle`, `press`, `pressFirm`). Every button gets `press`.
- `app/template.tsx` gives each navigation an iOS push-in; it also provides
  `MotionConfig reducedMotion="user"` app-wide.
- Patterns: segmented controls slide their indicator with `layoutId`; lists stagger in;
  chat bubbles pop from their tail like iMessage; forms slide up like sheets;
  multi-step flows push/pop horizontally with direction tracking.
- 3D (`components/TennisBall3D.tsx`, `components/PollenField.tsx`): warm-lit, subtle,
  `dynamic(..., { ssr: false })`, animation paused under reduced motion.
- Scroll reveals: fade-up, once, `viewport margin -60px`. One orchestrated moment
  per page max (hero parallax, route line drawing on scroll).

## App screens (browse, messages, profiles, auth)

- Page background `oat`, cards `linen` with `border-soil/10` + `shadow-sm`, radius `xl`.
- Primary buttons: `bg-pine text-oat font-bold`, hover `pine-deep`.
- Selected chips/slots: `bg-pine text-oat`; idle: `linen`/`oat` with `soil` text.
- Inputs: white fill, `border-soil/15`, `focus:ring-pine`.
- Errors: `text-clay-deep`, plain language, say how to fix.
- Labels/metadata in `font-data` uppercase; names/headings bold Public Sans;
  page titles in Bevan.
