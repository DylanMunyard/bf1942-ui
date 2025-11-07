# API Changes Summary - Tournament Navigation Redesign (v0.2)

## Overview

This document outlines all API changes needed to support the tournament navigation redesign. These changes enable:
- Tournament status management (Draft/Registration/Open/Closed)
- Game mode configuration
- Editable week date ranges
- Tournament file management
- Latest matches display
- Organizer information display

---

## 1. Tournament Detail Response - New Fields

### Endpoint
`GET /public/tournaments/:id` (PublicTournamentDetail)
`GET /admin/tournaments/:id` (AdminTournamentDetail)

### New Fields to Add

```typescript
{
  // Existing fields (keep unchanged)
  id: number;
  name: string;
  organizer: string;  // May already exist
  game: string;
  serverName?: string;
  rules?: string;
  discordUrl?: string;
  forumUrl?: string;
  hasHeroImage: boolean;
  hasCommunityLogo: boolean;

  // ADMIN ONLY - Tournament Management
  status: 'draft' | 'registration' | 'open' | 'closed';  // NEW
  gameMode: string;  // NEW (e.g., 'CTF', 'Conquest')

  // ADMIN ONLY - Date Management
  weekDates?: {                          // NEW
    week: string | null;                 // e.g., "Week 1", null for unweekly
    startDate: string;                   // ISO 8601
    endDate: string;                     // ISO 8601
  }[];

  // ADMIN ONLY - File Management
  files?: {                              // NEW
    id: number;
    name: string;                        // Display name (e.g., "Map Pack v1.0")
    url: string;                         // Download URL
    category?: string;                   // Optional: 'map', 'mod', 'program', etc.
    uploadedAt?: string;                 // ISO 8601
  }[];

  // PUBLIC - Latest Matches for Hub Display
  latestMatches?: PublicTournamentMatch[];  // NEW - 2 most recent completed matches

  // Existing nested objects
  teams: TournamentTeam[];
  matches?: TournamentMatch[];           // Admin endpoint only
  matchesByWeek?: {
    week: string | null;
    matches: PublicTournamentMatch[];
  }[];
  leaderboard?: PublicTournamentLeaderboard;
}
```

### Visibility Rules

**Public Endpoint** (`/public/tournaments/:id`):
- Include: `status`, `gameMode`, `latestMatches`
- **Important**: If `status === 'draft'`, return 404 or reject with "Tournament not found"
- Exclude: `files`, `weekDates` (admin only)
- Exclude: raw `matches` array (use `matchesByWeek` instead)

**Admin Endpoint** (`/admin/tournaments/:id`):
- Include: All fields above
- Include: `files`, `weekDates`, full `matches` array
- Include: Detailed team rosters with leader info

---

## 2. Update Tournament - Request Payload

### Endpoint
`PUT /admin/tournaments/:id`

### New Fields in Request Body

```typescript
{
  // Existing fields
  name?: string;
  organizer?: string;
  rules?: string;
  discordUrl?: string;
  forumUrl?: string;

  // NEW Fields
  status?: 'draft' | 'registration' | 'open' | 'closed';
  gameMode?: string;

  // Week dates - bulk update
  weekDates?: {
    week: string | null;
    startDate: string;
    endDate: string;
  }[];
}
```

### Response
Return updated tournament with all fields from Tournament Detail Response above.

---

## 3. Tournament Files Management

### Add File
**Endpoint**: `POST /admin/tournaments/:id/files`

```typescript
Request Body:
{
  name: string;           // Required
  url: string;            // Required (full URL or relative path)
  category?: string;      // Optional: 'map', 'mod', 'program', etc.
}

Response:
{
  id: number;
  name: string;
  url: string;
  category?: string;
  uploadedAt: string;     // ISO 8601
}
```

### Delete File
**Endpoint**: `DELETE /admin/tournaments/:id/files/:fileId`

```typescript
Response:
{
  success: boolean;
  message?: string;
}
```

### Update File
**Endpoint**: `PUT /admin/tournaments/:id/files/:fileId`

```typescript
Request Body:
{
  name?: string;
  url?: string;
  category?: string;
}

Response:
{
  id: number;
  name: string;
  url: string;
  category?: string;
  uploadedAt: string;
}
```

---

## 4. Week Dates Management (Alternative Approach)

If week dates should be separate from tournament update, add:

### Update Week Dates
**Endpoint**: `PUT /admin/tournaments/:id/weeks`

```typescript
Request Body:
{
  weekDates: {
    week: string | null;
    startDate: string;
    endDate: string;
  }[];
}

Response:
{
  weekDates: {
    week: string | null;
    startDate: string;
    endDate: string;
  }[];
}
```

---

## 5. Latest Matches - New Field

### Requirement
When returning PublicTournamentDetail or AdminTournamentDetail, include:

```typescript
latestMatches?: PublicTournamentMatch[];
```

### Definition
- **Count**: 2 most recent completed matches (sorted by `scheduledDate` descending)
- **Completed**: All maps in the match have `matchResults` with data
- **Include**: Same structure as matches in `matchesByWeek`
- **Order**: Most recent first

### Example

```typescript
latestMatches: [
  {
    id: 456,
    team1Name: "Golden Knights",
    team2Name: "Phoenix Rising",
    scheduledDate: "2024-11-15T19:00:00Z",
    serverName: "Main Server",
    maps: [
      {
        id: 1,
        mapName: "Iwo Jima",
        mapOrder: 0,
        teamName: "Golden Knights",
        matchResults: [
          {
            id: 1,
            round: 1,
            team1Id: 1,
            team2Id: 2,
            team1Name: "Golden Knights",
            team2Name: "Phoenix Rising",
            team1Tickets: 250,
            team2Tickets: 0,
            winningTeamId: 1
          },
          {
            id: 2,
            round: 2,
            team1Id: 1,
            team2Id: 2,
            team1Name: "Golden Knights",
            team2Name: "Phoenix Rising",
            team1Tickets: 300,
            team2Tickets: 50,
            winningTeamId: 1
          }
        ]
      }
    ]
  },
  // ... second most recent match
]
```

---

## 6. Tournament Team Enhancements

### Current Field (Verify Exists)
```typescript
teams: {
  id: number;
  name: string;
  players: {
    playerName: string;
    totalScore?: number;
    totalKills?: number;
    totalDeaths?: number;
  }[];
}
```

### Add Leader Support (Optional for Teams Page)
```typescript
teams: {
  id: number;
  name: string;
  leader?: string;          // Player name of team leader (optional)
  players: {
    playerName: string;
    totalScore?: number;
    totalKills?: number;
    totalDeaths?: number;
  }[];
}
```

---

## 7. Match Results - Ticket Count Verification

### Requirement
Ensure `matchResults` objects include ticket counts for score formatting:

```typescript
matchResults: {
  id: number;
  round: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  team1Tickets: number;      // MUST exist
  team2Tickets: number;      // MUST exist
  winningTeamId?: number;    // null = draw
}[]
```

**Purpose**: Frontend needs ticket counts to display score format `[Tickets] ([Rounds])`
**Example**: "793 – 0 (4 – 0)" = 793 total tickets vs 0 tickets (4 rounds won vs 0 rounds won)

---

## 8. Leaderboard Response - No Changes

The existing leaderboard response should remain unchanged. Frontend will only rename column header "Team Name" → "Team" (UI change, no API change needed).

---

## Data Model Summary

### Tournament Status Enum
```
'draft' - Private, not visible on public page
'registration' - Registration open, visible on public page with yellow badge
'open' - Tournament in progress, visible with green badge
'closed' - Tournament finished, visible with red badge
```

### Tournament Response Visibility

| Field | Admin | Public | Notes |
|-------|-------|--------|-------|
| `id, name, organizer` | ✅ | ✅ | Core fields |
| `game, rules, urls` | ✅ | ✅ | Existing fields |
| `status` | ✅ | ✅* | *Only if not 'draft' |
| `gameMode` | ✅ | ✅* | *Only if not 'draft' |
| `weekDates` | ✅ | ❌ | Admin only |
| `files` | ✅ | ❌ | Admin only |
| `latestMatches` | ✅ | ✅* | *Only if not 'draft' |
| `teams` | ✅ | ✅ | Existing (admin has more detail) |
| `matches` | ✅ | ❌ | Use matchesByWeek on public |
| `matchesByWeek` | ✅ | ✅ | Existing |
| `leaderboard` | ✅ | ✅ | Existing |

---

## Implementation Notes

### Draft Status Behavior
- When `status === 'draft'`:
  - Tournament should NOT appear in public tournament list
  - Requests to `/public/tournaments/:draft-id` return 404
  - Admin can view at `/admin/tournaments/:draft-id` normally
  - Allows organizers to prepare tournament before publishing

### Week Dates as Editable Metadata
- Week dates are display-only information (not used in match logic)
- Can be updated independently of matches
- Used in UI to show "Week 1: Nov 10 - Nov 16" date ranges
- Helpful for tournament planning and communication

### Latest Matches Calculation
- Query for matches with `scheduledDate` in descending order
- Filter: Only include matches where ALL maps have completed results
- Limit: 2 results
- Used on tournament hub page to show recent activity

---

## Migration Path

1. **Phase 1**: Add new fields to Tournament response (status, gameMode, latestMatches)
2. **Phase 2**: Add file management endpoints (/files operations)
3. **Phase 3**: Add week dates management
4. **Phase 4**: Add draft status filtering to public endpoint

All changes are backward compatible - existing fields remain unchanged.

---

## Questions for API Team

1. How should `status` default for existing tournaments? (recommend: 'open')
2. Should `gameMode` have predefined values or accept any string? (recommend: predefined: 'CTF', 'Conquest', with extensibility for future modes)
3. For file storage: Should URLs be full URLs or relative paths?
4. Should files support file uploads, or just URL links?
5. For week dates: Should they affect anything in match logic, or purely for display?
6. Should there be a separate endpoint to get only `latestMatches`, or always include in tournament detail?
