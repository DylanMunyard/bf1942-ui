# Tournament Navigation Redesign - Current Implementation Status

## What's Done ✅

1. **TournamentHero Component** - Complete
   - Hero section displays tournament name, logo, organizer, status, game mode
   - Navigation buttons for all 6 pages
   - Styled with tournament theme colors

2. **PublicTournament.vue (Overview page)** - Mostly Complete
   - ✅ Latest 2 matches section implemented
   - ✅ Leaderboard displayed below latest matches
   - ✅ Match winner indicators (🏆) implemented
   - ✅ Score formatting (ticket score + round score)
   - Status: Content order is CORRECT per requirements

3. **Routes** - All 6 routes created:
   - `/tournaments/:id` → PublicTournament (Overview)
   - `/tournaments/:id/rules` → PublicTournamentRules
   - `/tournaments/:id/teams` → PublicTournamentTeams
   - `/tournaments/:id/matches` → PublicTournamentMatches
   - `/tournaments/:id/stats` → PublicTournamentStats
   - `/tournaments/:id/files` → PublicTournamentFiles

4. **PublicTournamentRules.vue** - Implemented (can display rules from tournament.rules)

## What Needs Work 🔧

### Menu Button Ordering Issue
**Current order in TournamentHero.vue**:
1. Overview
2. Teams
3. Matches
4. Rules
5. Files
6. Stats

**Requirements from README.md Section 2**:
Expected buttons based on sections 2.1-2.8:
- Status Badge (2.1)
- Game Mode Badge (2.2)
- Files Link (2.3) → `/tournaments/:id/files`
- Rules Link (2.4) → `/tournaments/:id/rules`
- Teams Link (2.5) → `/tournaments/:id/teams`
- Matches Link (2.6) → `/tournaments/:id/matches`
- **Rankings Link (2.7)** → MISSING - Should link to leaderboard (on Overview or separate page)
- Stats Link (2.8) → `/tournaments/:id/stats`

**Action needed**: Add Rankings button to menu, reorganize buttons to logical order

### Page Content Implementation Status

| Page | Status | Notes |
|------|--------|-------|
| Overview | ✅ Done | Shows latest 2 matches + leaderboard |
| Rules | ✅ Done | Can display tournament.rules as markdown |
| Teams | ❌ TODO | Placeholder - needs team roster display |
| Matches | ❌ TODO | Placeholder - needs match history with filtering |
| Stats | ❌ TODO | Placeholder - needs player statistics |
| Files | ❌ TODO | Placeholder - needs tournament files table |

## Key Questions for Implementation

1. **Rankings Button Behavior**: Should "Rankings" button:
   - Scroll to leaderboard section on Overview page? (anchor link)
   - Link to separate Rankings page?
   
2. **Teams Page Content**: Should display:
   - List of all registered teams?
   - Team rosters with member names?
   - Team leaders (need API field?)?

3. **Matches Page Content**: Should display:
   - Same match data as on Overview page?
   - With additional filtering (by week, by team)?
   - Should it include upcoming matches?

4. **Stats Page**: Player statistics for:
   - Individual players across all matches?
   - Seasonal stats?
   - When visible (end of season only per requirement)?

5. **Files Page**: Display tournament files:
   - Maps/game files?
   - Tournament rules/documents?
   - Organizer-managed file list?

## Next Steps
1. Fix menu button order to match requirements
2. Add Rankings button (determine behavior - anchor vs page)
3. Implement remaining 4 placeholder pages with real content
4. Update memory with implementation patterns once pages are created
