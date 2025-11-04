# Tournament API Schema Migration Plan

## Status
**In Progress** - Phases 1-5 completed, Phase 6 (Testing) in progress

## Last Updated
Session: Tournament API Schema Migration - Bug Fixes & Testing
Date: Implementation complete through Phase 5, Phase 6 (Testing) in progress
Recent: Fixed EditMapResultsModal component errors and TournamentCard.vue roundCount references

## Overview
Migrating from single `matchResult` per map to `matchResults[]` array to support multiple rounds per map in tournaments.

---

## Key Changes Summary

### OLD Schema
```typescript
map.matchResult = {
  id: 10,
  team1Name: "Alpha",
  team2Name: "Bravo",
  winningTeamName: "Alpha",
  team1Tickets: 200,
  team2Tickets: 100
}
map.roundId: "round-123" (nullable)
map.round: { ...roundData } (nullable)
```

### NEW Schema
```typescript
map.matchResults = [
  {
    id: 10,
    team1Name: "Alpha",
    team2Name: "Bravo",
    winningTeamId: 5,
    winningTeamName: "Alpha",
    team1Tickets: 200,
    team2Tickets: 100
  },
  {
    id: 11,
    team1Name: "Bravo",
    team2Name: "Alpha",
    winningTeamId: 6,
    winningTeamName: "Bravo",
    team1Tickets: 180,
    team2Tickets: 120
  }
]
// roundId no longer available in map
// round no longer available in map
```

### Removed Properties
- `map.roundId` - RoundId now only at database level
- `map.round` - Round details no longer in API response
- `map.matchResult` (singular) - Replaced by matchResults array

### What's Available Now
- Each matchResult has: `id`, `team1Id`, `team1Name`, `team2Id`, `team2Name`, `winningTeamId`, `winningTeamName`, `team1Tickets`, `team2Tickets`
- Round information: **NOT AVAILABLE** in API (future enhancement)
- Can have empty array `matchResults: []` if no results yet

---

## Code Patterns to Update

#### Pattern 1: Check if results exist
```typescript
// OLD
v-if="map.roundId && map.matchResult"

// NEW
v-if="map.matchResults?.length > 0"
```

#### Pattern 2: Access single result for aggregation
```typescript
// OLD
map.matchResult?.winningTeamName

// NEW
getResultsAggregation(map) // Returns "2-0", "1-1", etc
```

#### Pattern 3: Display team names
```typescript
// OLD
getTeamDisplayName(map, 1) -> uses map.matchResult?.teamName || map.round?.teamLabel

// NEW
getTeamDisplayName(map, 1) -> uses map.matchResults?.[0]?.teamName
```

---

## Session 3 Summary (UX Improvements & Full API Integration)

### What Was Implemented
1. **API Call Integration**
   - `saveManualResult()`: Full implementation for creating and updating manual results
   - `deleteResult()`: DELETE endpoint implementation for removing results
   - `onRoundLinked()`: Full round linking with automatic API calls
   - Auto-calculation of winning team based on ticket counts
   - Error handling with user-friendly alerts

2. **Team Mapping Warning Detection**
   - Checks API response for `teamMappingWarning` property
   - Displays warning alert when team auto-identification fails
   - Automatically opens the team mapping form
   - Preserves match data (tickets) for user correction
   - Guides user to manually select teams when needed

3. **UX Refactor for Better Usability**
   - **Removed:** Separate buttons for "Link Round" and "Manual"
   - **Added:** Dedicated blank row in results table with inline actions
   - **Benefits:**
     - More intuitive - users see the row to fill in
     - Inline expansion - form opens in the same row
     - Better context - edit/create in same location
     - Clearer workflow - buttons appear only when needed

### API Endpoints Now Called
- `POST /stats/admin/tournaments/{id}/matches/{matchId}/maps/{mapId}/result` - Create manual result
- `PUT /stats/admin/tournaments/{id}/match-results/{resultId}/manual-update` - Update manual result
- `PUT /stats/admin/tournaments/{id}/matches/{matchId}/maps/{mapId}` - Link round to map
- `DELETE /stats/admin/tournaments/{id}/match-results/{resultId}` - Delete result

### Code Quality
- Full TypeScript typing
- Proper error handling with try/catch
- Form validation (both teams required)
- Loading states to prevent duplicate submissions
- User feedback via alerts
- Console logging for debugging

---

## Related API Endpoints (already changed on backend)
- `GET /stats/admin/tournaments/{id}` - Returns new schema
- `GET /stats/admin/tournaments/{id}/matches/{matchId}` - Returns new schema
- `GET /stats/tournaments/{idOrName}` (public) - Returns new schema

---

## Technical Implementation Notes

### What's Gone (No Replacement)
- `map.roundId` - Not in API anymore
- `map.round` - Not in API anymore
- Round report viewing - Not supported in new UX
- Team mapping override for rounds - Use manual result entry instead

### What's New
- `map.matchResults[]` array - Central source of truth
- `EditMapResultsModal` - Unified data entry experience
- Result aggregation - Quick summary on main page
- Multiple rounds per map - Full support

### API Assumptions
- Backend already returns new schema
- `matchResults` always present as array (empty if no results)
- Each result has all needed info (team IDs, names, tickets, winner)
- RoundId available on each result (in database, not exposed in API)

---

## Next Steps for Implementation
1. Ensure all tournament-related components use the new schema
2. Test modal opening/closing
3. Test adding/editing/deleting results
4. Test aggregation display updates correctly
5. Verify E2E tests cover the new workflow
