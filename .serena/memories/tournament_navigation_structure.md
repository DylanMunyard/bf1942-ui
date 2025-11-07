# Tournament Pages Organization and Navigation

## Overview
The tournament pages are organized as a set of 6 related public-facing views under the `/tournaments/:id` route structure. All pages share a common hero section component and navigation system.

## File Structure

### View Files (in `/src/views/`)
1. **PublicTournament.vue** - Main/Overview page
2. **PublicTournamentMatches.vue** - Matches page (WIP)
3. **PublicTournamentTeams.vue** - Teams page (WIP)
4. **PublicTournamentRules.vue** - Rules page
5. **PublicTournamentStats.vue** - Statistics page (WIP)
6. **PublicTournamentFiles.vue** - Files page (WIP)

### Shared Components (in `/src/components/`)
1. **TournamentHero.vue** - Hero section with embedded navigation (reusable)
2. **TournamentPageNav.vue** - Separate navigation component (not currently used)

## Routing Structure

All tournament routes are defined in `/src/router/index.ts` with base path `/tournaments/:id`:

```
/tournaments/:id              -> PublicTournament (Overview)
/tournaments/:id/rules        -> PublicTournamentRules
/tournaments/:id/teams        -> PublicTournamentTeams
/tournaments/:id/matches      -> PublicTournamentMatches
/tournaments/:id/stats        -> PublicTournamentStats
/tournaments/:id/files        -> PublicTournamentFiles
```

## Navigation Components

### TournamentHero.vue
**Status**: ACTIVELY USED
**Location**: `/src/components/TournamentHero.vue`

**Usage**: Imported and rendered in ALL 6 public tournament pages
- Contains embedded navigation buttons that match all 6 routes
- Displays tournament information (name, organizer, status, game mode)
- Shows community logo and server info
- Includes link buttons (Discord, Forum, Rules)
- Navigation buttons are styled with accent colors from tournament theme

**Props**:
- `tournament: PublicTournamentDetail` - Tournament data
- `tournamentId: number | string` - Tournament ID
- `heroImageUrl: string | null` - Background hero image URL
- `logoImageUrl: string | null` - Community logo image URL

**Events**: 
- `open-rules` - Emitted when Rules button clicked

**Key Features**:
- Responsive design (mobile & desktop)
- Dynamic styling based on tournament theme colors
- Active page detection via regex pattern matching
- Background hero image with overlay gradient

### TournamentPageNav.vue
**Status**: NOT ACTIVELY USED (duplicate/unused)
**Location**: `/src/components/TournamentPageNav.vue`

**Purpose**: Alternative navigation component with same functionality as TournamentHero's navigation section
- Standalone nav component (not attached to hero)
- Similar button styling and active state detection
- Would be used if navigation needed to be separate from hero

**Why It Exists But Isn't Used**:
- TournamentHero was created later and consolidated hero image + navigation into one component
- TournamentPageNav appears to be a legacy component that's no longer needed
- Only imported in PublicTournamentFiles.vue but never actually rendered
- All active pages use TournamentHero instead

## Hero Image Usage

**Pages using hero images**: ALL 6 public tournament pages

Each page:
1. Loads tournament data via `publicTournamentService.getTournamentDetail()`
2. Checks `tournament.hasHeroImage` flag
3. Loads hero image asynchronously via `publicTournamentService.getTournamentImageUrl()`
4. Passes URLs to TournamentHero component

**Loading Pattern**:
```typescript
// Async loading (non-blocking)
if (data.hasHeroImage) {
  loadHeroImage().catch(err => console.debug('Failed to load hero image:', err))
}
if (data.hasCommunityLogo) {
  loadLogoImage().catch(err => console.debug('Failed to load logo image:', err))
}
```

## Current Page Status

| Page | Status | Content | Navigation |
|------|--------|---------|-----------|
| PublicTournament | Implemented | Full tournament overview with matches, leaderboard | TournamentHero |
| PublicTournamentRules | Implemented | Markdown rules rendering | TournamentHero |
| PublicTournamentMatches | WIP | "Coming Soon" placeholder | TournamentHero |
| PublicTournamentTeams | WIP | "Coming Soon" placeholder | TournamentHero |
| PublicTournamentStats | WIP | "Coming Soon" placeholder | TournamentHero |
| PublicTournamentFiles | WIP | "Coming Soon" placeholder | TournamentHero + unused TournamentPageNav |

## Theme System

All pages implement identical theme color system:
- Background color from `tournament.theme.backgroundColour`
- Text color from `tournament.theme.textColour`
- Accent color from `tournament.theme.accentColour`
- Defaults to dark theme (black bg, white text, golden accent)

## Key Observations

1. **TournamentPageNav.vue is redundant** - It's imported in PublicTournamentFiles.vue but never rendered; TournamentHero handles all navigation needs

2. **Hero image is on ALL pages** - Every tournament page displays the hero section with embedded navigation

3. **Consistent pattern** - All 6 pages follow identical structure:
   - Load tournament data
   - Load images (hero + logo)
   - Render TournamentHero
   - Display page-specific content

4. **Mobile-friendly** - All components use responsive Tailwind classes and support mobile/desktop views

5. **No admin routing links** - Admin tournament editor is at `/admin/tournaments/:id` (TournamentDetails.vue), completely separate from public views
