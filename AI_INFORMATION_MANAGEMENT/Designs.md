# DEWA Design System — Migration Guide

This document is a **self-contained spec** of the design system used in this project
(Stakeholder Engagement Platform). Follow it to reproduce the exact same look, feel,
and component behavior in another React + MUI project.

Stack this design system assumes: **React 18/19 + MUI v5 (`@mui/material`) + Emotion**.
No Tailwind, no CSS modules — all styling is via MUI's `ThemeProvider` + `sx` props.

---

## 1. What to copy verbatim

Copy these files as-is into the new project's `src/theme/` folder — they have **zero
project-specific logic**, only design tokens:

```
src/theme/palette.ts       # DEWA color tokens + MUI light/dark palettes
src/theme/typography.ts    # Font family + type scale
src/theme/shape.ts         # Border-radius scale
src/theme/shadows.ts       # 25-step MUI shadow array + semantic aliases
src/theme/spacing.ts       # 8dp spacing scale aliases
src/theme/components.ts    # Per-component MUI style overrides (light + dark)
src/theme/theme.ts         # createTheme() wiring the above together
src/theme/index.ts         # Barrel export
```

Also copy `src/index.css` (font-face + global scrollbar rules) and wire the app root:

```tsx
// main.tsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/theme';

<ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
  <CssBaseline />
  <App />
</ThemeProvider>
```

Dark/light mode is **app-controlled**, not OS-driven — store the mode in
localStorage/context (see `ThemeContext.tsx` + `useTheme.ts` in this repo) and toggle
between `lightTheme`/`darkTheme`.

---

## 2. Brand & Color Tokens

Source of truth: `src/theme/palette.ts` → `DEWA` object. Everything else derives from it.

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#007560` | DEWA green — brand, primary actions, active states |
| `primaryDark` | `#004937` | Gradients, hover-darken, dark-mode accents |
| `primaryLight` | `#00967A` | Gradients, lighter accents |
| `primaryContrast` | `#FFFFFF` | Text/icons on filled primary |
| `activeBackground` | `#E5F1EF` | Selected-row / hover tint (primary at low opacity, precomputed) |
| `background` | `#FFFFFF` | Paper / card surface |
| `surface` | `#EFEFF1` | Page background (`body` bg) |
| `surfaceVariant` | `#F5F5F7` | Secondary surface |
| `textPrimary` | `#222222` | Body text |
| `textSecondary` | `#6F6F6F` | Muted text |
| `textDisabled` | `#ADADAD` | Disabled text |
| `textInverse` | `#FFFFFF` | Text on dark/filled backgrounds |
| `border` | `#D7D7DF` | Default borders (inputs, cards) |
| `divider` | `#E8E8EC` | Hairline dividers |

**Semantic status colors** (each has `main/dark/light/surface`):

| Status | Main | Surface (light bg) |
|---|---|---|
| error | `#B00020` | `#FDECEA` |
| success | `#2E7D32` | `#E8F5E9` |
| warning | `#E65100` | `#FFF3E0` |
| info | `#0277BD` | `#E1F5FE` |
| purple (draft) | `#6A1B9A` | `#F3E5F5` |
| teal (extended) | `#00838F` | `#E0F7FA` |
| gold (extended) | `#F9A825` | `#FFF8E1` |

**Dark mode** overrides (`darkPalette` in `palette.ts`): primary shifts to a brighter
`#00B894` (better contrast on near-black), background goes to `#0F0F0F` / paper
`#1A1A1A`, divider `#2E2E2E`, text `#F0F0F0` / `#A0A0A0`.

**Rule of thumb when migrating to a different brand color:** only edit the `DEWA` block
in `palette.ts`. Everything downstream (`components.ts`, gradients, sidebar, etc.)
reads from these tokens or from MUI's `theme.palette.primary.*` — never hardcode hex
values in components.

---

## 3. Typography

Font: **"Dubai"** (RTA/DEWA commercial font — not bundled; requires license) with a
system fallback chain: `"Dubai", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.

If the target project has no Dubai license, keep the fallback chain — it degrades
gracefully to Segoe UI / Roboto. Font files go in `public/fonts/` as:
`Dubai-Light.woff2`, `Dubai-Regular.woff2`, `Dubai-Medium.woff2`, `Dubai-Bold.woff2`
(weights 300/400/500/700), declared via `@font-face` in `index.css`.

Type scale (`src/theme/typography.ts`):

| Variant | Size | Weight | Notes |
|---|---|---|---|
| h1 | 2rem | 700 | letter-spacing -0.02em |
| h2 | 1.75rem | 700 | letter-spacing -0.01em |
| h3 | 1.5rem | 600 | |
| h4 | 1.25rem | 600 | used for page titles (`PageHeader`) |
| h5 | 1.125rem | 600 | |
| h6 | 1rem | 600 | |
| subtitle1 | 0.9375rem | 500 | |
| subtitle2 | 0.875rem | 600 | card headers, menu section titles |
| body1 | 0.9375rem | 400 | |
| body2 | 0.875rem | 400 | default UI text size |
| caption | 0.75rem | 400 | |
| overline | 0.6875rem | 700 | uppercase, letter-spacing 0.1em — KPI labels, table headers |
| button | 0.875rem | 600 | `textTransform: none` (no uppercase buttons) |

---

## 4. Shape, Spacing & Shadows

**Border radius scale** (`src/theme/shape.ts`) — never use raw pixel values, always
these named steps:

```
none 0 · xs 2 (tight inner elements) · sm 4 (chips/badges) · md 6 (tooltips, small inputs)
lg 8 (buttons/menus/inputs — MUI default shape) · xl 12 (cards/dialogs)
xxl 16 (drawers/modals) · pill 24 (pill buttons) · circle 9999
```

**Spacing** (`src/theme/spacing.ts`) — 8dp grid, MUI `spacing(1) = 8px`:

```
xxs 0.5 (4px) · xs 1 (8px) · sm 1.5 (12px) · md 2 (16px) · lg 3 (24px) · xl 4 (32px) · xxl 6 (48px)
```

**Shadows** (`src/theme/shadows.ts`) — full 25-step MUI array (neutral black at low
opacity, not colored). Semantic aliases for direct `sx` use:

```
SHADOW.card   = shadows[2]   // 0 1px 4px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04)
SHADOW.menu   = shadows[8]
SHADOW.dialog = shadows[12]
SHADOW.fab    = shadows[6]
```

---

## 5. Component Overrides (`src/theme/components.ts`)

This is the bulk of the visual identity — MUI `components.styleOverrides` per
component, defined separately for `lightComponents` and `darkComponents`. Key
decisions to replicate:

- **Buttons**: `disableElevation`, radius `lg` (8px), no uppercase, primary contained
  button uses a **diagonal gradient** (`primaryLight → primary`, darkening on hover),
  outlined/text primary hover to `activeBackground`. `sizeLarge` bumps radius to `xl`.
- **Cards/Paper**: radius `xl` (12px), thin 1px border in `border` color, flat
  `boxShadow: shadows[2]`-equivalent, no gradient background image.
- **AppBar**: white background, bottom hairline (`1px solid border`) instead of a shadow.
- **Drawer (sidebar)**: filled with the primary-green **vertical gradient**
  (`primaryLight 0% → primary 30% → primaryDark 100%`), white text at reduced opacity
  tiers (see §6), `boxShadow: dialog`.
- **TextField/Select/OutlinedInput**: radius `lg`, default `size="small"`, 2px border
  on focus in primary color.
- **Table**: uppercase, letter-spaced, secondary-colored header cells on a `surface`
  background; row hover = primary at 3% alpha; selected row = `activeBackground`.
- **Dialog**: radius `xxl` (16px), heavier ambient shadow.
- **Chip**: radius `sm`, bold small text; `colorPrimary` variant = `activeBackground`
  fill + primary text + 30%-alpha primary border.
- **Tabs**: 2px bottom indicator in primary color, selected tab text = primary.
- **Menu/Popover**: radius `xl`, `border` outline, `menu` shadow, items get `sm` radius
  with small margins (floating-item look, not edge-to-edge).
- **Avatar**: primary-filled by default; `colorDefault` variant = primary at 12% alpha.
- **Focus rings**: interactive elements get `2px solid primary` outline on
  `:focus-visible` (accessibility — don't drop this when migrating).

Dark mode keeps the same shapes/radii but swaps surfaces to near-black
(`#0F0F0F`/`#1A1A1A`), borders to `#2E2E2E`, and primary to the brighter `#00B894` for
contrast; the sidebar drops the gradient and just becomes flat `#0F0F0F` with a border.

---

## 6. Layout Shell

Three-piece shell: fixed-width collapsible **Sidebar** (green gradient) + fixed
**TopNavigation** (AppBar) + scrollable content area + slim **Footer**.

Dimensions (`src/constants/app.ts`):

```
SIDEBAR.EXPANDED_WIDTH  = 264px
SIDEBAR.COLLAPSED_WIDTH = 72px
SIDEBAR.TRANSITION_DURATION = 220ms   // width/left transitions, cubic-bezier(0.4,0,0.2,1)
TOPBAR.HEIGHT  = 64px
FOOTER.HEIGHT  = 48px
```

**AppLayout** (`src/components/layout/AppLayout.tsx`): flex row, sidebar first, then a
flex column containing TopNavigation (fixed, `left`/`width` animate with sidebar state)
+ `<main>` (`mt: TOPBAR.HEIGHT`, `height: calc(100vh - topbar - footer)`, own
`overflowY: auto`) + Footer. Content padding: `{ xs: 2, md: 3 }`.

**Sidebar** (`src/components/layout/Sidebar.tsx`):
- On mobile (`< md` breakpoint): MUI `Drawer variant="temporary"`. On desktop:
  `variant="permanent"`, width animates between expanded/collapsed.
- Fill: `backgroundColor: primary` + `linear-gradient(180deg, primaryLight 0%, primary
  30%, primaryDark 100%)`.
- All sidebar text/icons/borders use a **local opacity-overlay palette** (not the MUI
  theme's text tokens, since everything sits on a colored fill):
  ```
  border 10% · hover 10% · selected 18% · selectedHover 24% · iconActive 100%
  iconInactive 72% · textPrimary 90% · textMuted 42% · footerText 35%
  ```
- Structure: brand header (32×32 gradient logo mark + wordmark, 64px min-height,
  bottom hairline) → scrollable nav groups (optional `overline` group label, role-gated
  via `NAV_GROUPS[].roles`) → collapsible parent items (chevron, `Collapse`) → leaf
  items with a 3px left accent bar when active → footer with version text.
- Collapsed state: icons only, centered, `Tooltip` on hover shows the label.

**TopNavigation** (`src/components/layout/TopNavigation.tsx`): `AppBar
position="fixed"`, `elevation={0}`, animates `left`/`width` in lockstep with sidebar.
Left-to-right: mobile hamburger → global search box (debounced, dropdown results
grouped by entity type with colored icon chips) → spacer → right-aligned icon rail
(AI assistant shortcut, light/dark toggle, language switcher EN/AR, notifications
bell w/ badge + dropdown, user avatar w/ account menu). All icon buttons are `size="small"`,
color `text.secondary`, hover tints toward `primary.main` at 8% alpha background.

---

## 7. Reusable Building Blocks

Pattern-level components to reproduce (in `src/components/common/`):

- **PageHeader** — title (`h4`, 700) + optional subtitle + optional `Breadcrumb` above
  + right-aligned actions slot + bottom divider. Every page opens with this.
- **KPICard** — `Card` with a 4px colored **left border accent**, overline label,
  large `h4` value, optional trend chip (up/down/flat icon + %, colored green/red/gray),
  optional 48×48 icon swatch at `color + "18"` alpha in the top-right. Hover lifts
  `translateY(-2px)` + shadow escalates to `SHADOW.menu`. Has a `loading` skeleton state.
- **StatusChip** — maps a fixed status vocabulary (active/inactive/pending/completed/
  cancelled/draft/published/approved/rejected/inprogress) to a `{label, bgcolor, color}`
  pair drawn from the semantic surface/solid color pairs in §2. Always `size="small"`,
  22px height, no border, bold caption text. This is the canonical way status is shown
  anywhere in the app — never inline a colored `Chip` ad hoc.
- **EmptyState** — centered icon-in-circle (`bgcolor: action.hover`) + title (`h6`/600)
  + description + optional outlined action button. Has a `compact` variant for
  in-card use vs full-page use.
- **AppButton** — thin wrapper over MUI `Button` adding a `loading` prop that swaps
  `startIcon` for a small `CircularProgress` and dims the label to 70% opacity.
- Also present: `AppInput`, `AppSelect`, `AppDatePicker`, `AppModal` (use **slide-in
  panel**, not centered modal — DAK convention), `ConfirmationDialog`, `DataTable`,
  `Breadcrumb`, `NotificationBadge`, `SearchBox`, `Loader`, `PlaceholderPage`.

---

## 8. Migration Checklist

1. `npm i @mui/material @mui/icons-material @emotion/react @emotion/styled`
   (+ `@mui/x-date-pickers`, `dayjs`, `recharts` if charts/date-pickers are used).
2. Copy `src/theme/*` verbatim into the new project.
3. Copy the font-face block + scrollbar rules from `src/index.css`; drop the Dubai
   `woff2` files into `public/fonts/` if licensed, otherwise leave the fallback chain.
4. Wrap the app root in `<ThemeProvider theme={lightTheme|darkTheme}><CssBaseline />`.
5. Recreate a light theme-mode context (`ThemeContext.tsx` + `useTheme.ts` pattern) —
   mode is app-controlled, no `prefers-color-scheme` auto-switch.
6. Copy `SIDEBAR`/`TOPBAR`/`FOOTER` dimension constants and the `AppLayout` +
   `Sidebar` + `TopNavigation` + `Footer` components; swap `NAV_GROUPS` for the new
   project's nav tree (shape: `{ id, label, roles?, items: [{ id, label, icon, path,
   children? }] }`).
7. Copy `common/PageHeader.tsx`, `KPICard.tsx`, `StatusChip.tsx`, `EmptyState.tsx`,
   `AppButton.tsx` (and any other `App*` primitives actually used) — adjust the
   `StatusVariant` union to the new domain's status vocabulary, keep the color-mapping
   pattern.
8. If rebranding: edit only the `DEWA` token block in `palette.ts` (primary/dark/light
   + `activeBackground`) — do not touch `components.ts`, since it all derives from
   tokens, not hardcoded colors.
9. Verify: light + dark mode toggle, sidebar collapse/expand animation, focus-visible
   outlines on buttons/inputs/tabs (accessibility), and that no component hardcodes a
   hex color outside of `palette.ts`.
