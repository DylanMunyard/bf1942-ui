# Design System

Quick reference for frontend implementation when UX details are vague.

## Two Themes

### Main Theme
Used for: Landing page, server details, player details, public/primary pages
- **Style**: Clean, professional, Tailwind CSS
- **Colors**: Neutral (gray/black) base + cyan, green, orange, red accents
- **Feel**: Modern, accessible, straightforward
- **Layout**: Flex/grid with responsive breakpoints
- Example: `LandingPageV2.vue`, `ServerDetails.vue`, `PlayerDetails.vue`

### Portal/Hacker Theme
Used for: Dashboard, admin pages, authenticated features, data explorer
- **Style**: Terminal aesthetic, CSS custom properties (`--portal-*`)
- **Colors**: Dark backgrounds + neon accents (cyan, green, gold, red, pink)
- **Feel**: Immersive, gamified, technical
- **Effects**: Scanlines, matrix rain, ASCII art, glitch text
- **Layout**: Similar structure but with theme styling
- Example: `Dashboard.vue`, `AdminDataManagement.vue`, `DataExplorer.vue`

**Default**: When in doubt, use Main Theme for new public pages, Portal Theme for admin/dashboard features.

## Color Palette

### Main Theme
```css
bg: neutral-950, neutral-900, neutral-800, neutral-700...
text: neutral-200, neutral-300, neutral-400
accents: cyan-400/500, green-400/500, orange-400, red-400, emerald-400
```

### Portal Theme
```css
--portal-bg: dark (typically #111 area)
--portal-surface: slightly lighter
--portal-border: subtle dividers
--portal-text: neutral-300
--portal-accent: cyan/green/gold/red/pink depending on context
--portal-accent-dim: accent with lower opacity
```

## Common Components

### Buttons
**Main**: `bg-cyan-500 hover:bg-cyan-400`, `bg-neutral-800 border border-neutral-600`
**Portal**: `bg-cyan-500/20 text-cyan-400 border border-cyan-500/30`

### Cards/Panels
**Main**: `bg-neutral-900/80 border border-neutral-700/50 rounded-xl`
**Portal**: `bg-[var(--portal-surface)] border 1px var(--portal-border)`

### Tables
**Main**: Tailwind table styling with hover states
**Portal**: Uses unscoped `.admin-data-portal .portal-*` classes (see AdminDataManagement unscoped styles)

### Section Headers
- H1/H2: Large, bold, color accent when needed
- Small descriptive text: text-neutral-400 or text-xs text-neutral-500
- Icons/emoji: Used to visually label sections

### Loading States
Spinner: border animation or animated divs with rotating borders
Content: `flex items-center justify-center py-20` for full-screen, smaller for inline

### Empty States
Centered icon + heading + description + optional action button
Use emoji or SVG icons

## Mobile/Responsive

**Breakpoints**: `sm:` (640px), `lg:` (1024px), `xl:` (1280px)

**Patterns**:
- Tables → stacked cards on mobile
- Side panels → fixed overlay on mobile, relative on lg+
- Filters → collapse to dropdowns on mobile
- Spacing: `px-2 sm:px-6 lg:px-12` or `p-3 sm:p-6`

## Decision Tree

```
New page or feature?
├─ Public, main app feature? → Main Theme
├─ Admin, dashboard, internal? → Portal Theme
├─ Showing data/stats? → Main Theme unless admin context
└─ Highly interactive, immersive? → Portal Theme

Need a card/panel?
├─ Light background? → bg-neutral-900/80 border border-neutral-700/50
├─ Dark background? → bg-neutral-800/40
└─ Portal context? → bg-[var(--portal-surface)] border 1px var(--portal-border)

Need an accent color?
├─ Status/action? → cyan-400 or cyan-500
├─ Success/positive? → green-400
├─ Warning? → orange-400 or amber-400
├─ Error? → red-400
└─ Portal with multiple purposes? → Use different portal accent per context
```

## Quick Gotchas

- **Portal theme CSS**: Some portal styles are in unscoped `<style>` blocks to reach child components (see AdminDataManagement.vue)
- **Dark mode**: Both themes support dark mode via CSS custom properties; test both
- **Mobile overlays**: Use `fixed inset-0 z-[100] lg:relative` pattern for side panels
- **Hover effects**: Main theme uses brightness/color shifts; Portal uses opacity/glow
- **Typography**: Prefer Tailwind font sizes over custom CSS
