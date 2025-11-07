# API Implementation Summary

API specification completed and documented in `tournament-api-spec.yaml`

## Key Implementations ✅

### 1. Tournament Status Field
- **Type**: Enum - `'draft' | 'registration' | 'open' | 'closed'`
- **Admin Response**: Includes full status value
- **Public Response**: Filters out `'draft'` status (404 if draft tournament)
- **Purpose**: Control tournament visibility and lifecycle

### 2. Game Mode Field
- **Type**: String (custom values allowed)
- **Examples**: 'CTF', 'Conquest', 'TDM', 'Coop'
- **Editable**: Yes, via `PUT /stats/admin/tournaments/{id}`
- **Purpose**: Display game mode to tournament visitors

### 3. Latest Matches Field
- **Type**: Array of `PublicTournamentMatchResponse[]`
- **Count**: 2 most recent completed matches
- **Criteria**: Only matches where ALL maps have completed results
- **Included in**: Both admin and public responses
- **Purpose**: Show recent tournament activity on hub page

### 4. Week Dates Management
- **Type**: Array of `{id, week, startDate, endDate}`
- **Admin Only**: Not visible in public API
- **Editable**: Via `PUT /stats/admin/tournaments/{id}` with `weekDates` array
- **Purpose**: Allow organizers to set/edit week date ranges for display

### 5. Tournament Files Management
- **Type**: Array of `{id, name, url, category, uploadedAt}`
- **Admin Only**: Not visible in public API
- **Endpoints**:
  - `POST /stats/admin/tournaments/{id}/files` - Create file
  - `PUT /stats/admin/tournaments/{id}/files/{fileId}` - Update file
  - `DELETE /stats/admin/tournaments/{id}/files/{fileId}` - Delete file
- **Purpose**: Manage tournament resources (brackets, maps, programs)

### 6. Leaderboard Endpoint (NEW)
- **Endpoint**: `GET /stats/tournaments/{idOrName}/leaderboard`
- **Query Param**: `?week={weekName}` (optional)
- **Behavior**:
  - If `week` provided: Returns standings for that week only
  - If `week` omitted: Returns cumulative standings
- **Response**: `PublicTournamentLeaderboardResponse`
- **Purpose**: Dedicated leaderboard endpoint (allows week filtering)

---

## Updated Tournament Responses

### TournamentDetailResponse (Admin)
```typescript
{
  id: number;
  name: string;
  organizer: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  createdAt: string; // ISO 8601
  anticipatedRoundCount?: number;

  // NEW FIELDS
  status: 'draft' | 'registration' | 'open' | 'closed';
  gameMode?: string;
  latestMatches: PublicTournamentMatchResponse[];
  weekDates: {
    id: number;
    week: string;
    startDate: string; // ISO 8601
    endDate: string;   // ISO 8601
  }[];
  files: {
    id: number;
    name: string;
    url: string;
    category?: string;
    uploadedAt: string; // ISO 8601
  }[];

  // EXISTING FIELDS
  teams: TournamentTeamResponse[];
  matchesByWeek: MatchWeekGroup[];
  hasHeroImage: boolean;
  hasCommunityLogo: boolean;
  rules?: string;
  serverGuid?: string;
  serverName?: string;
  discordUrl?: string;
  forumUrl?: string;
  theme?: TournamentThemeResponse;
}
```

### PublicTournamentDetailResponse (Public)
```typescript
{
  id: number;
  name: string;
  organizer: string;
  game: 'bf1942' | 'fh2' | 'bfvietnam';
  createdAt: string;
  anticipatedRoundCount?: number;

  // NEW FIELDS (admin-only fields excluded)
  status: 'registration' | 'open' | 'closed'; // draft filtered out
  gameMode?: string;
  latestMatches: PublicTournamentMatchResponse[];

  // EXISTING FIELDS
  teams: PublicTournamentTeamResponse[];
  matchesByWeek: PublicMatchWeekGroup[];
  hasHeroImage: boolean;
  hasCommunityLogo: boolean;
  rules?: string;
  serverGuid?: string;
  serverName?: string;
  discordUrl?: string;
  forumUrl?: string;
  theme?: PublicTournamentThemeResponse;
}
```

### PublicTournamentLeaderboardResponse (NEW)
```typescript
{
  tournamentId: number;
  tournamentName: string;
  week?: string; // null for cumulative
  rankings: {
    rank: number;
    teamId: number;
    teamName: string;
    matchesPlayed: number;
    victories: number;
    ties: number;
    losses: number;
    roundsWon: number;
    roundsTied: number;
    roundsLost: number;
    ticketsFor: number;
    ticketsAgainst: number;
    ticketDifferential: number;
    points: number; // primary ranking metric
    totalRounds: number; // calculated
  }[];
}
```

---

## Updated Tournament Update Request

### PUT /stats/admin/tournaments/{id}

```typescript
{
  // Existing fields
  name?: string;
  organizer?: string;
  game?: 'bf1942' | 'fh2' | 'bfvietnam';
  anticipatedRoundCount?: number;
  serverGuid?: string;

  // NEW FIELDS
  status?: 'draft' | 'registration' | 'open' | 'closed';
  gameMode?: string;
  weekDates?: {
    week: string;
    startDate: string; // ISO 8601
    endDate: string;   // ISO 8601
  }[];

  // Image/logo
  heroImageBase64?: string;
  heroImageContentType?: string;
  communityLogoBase64?: string;
  communityLogoContentType?: string;
  removeHeroImage?: boolean;
  removeCommunityLogo?: boolean;

  // Other
  rules?: string;
  discordUrl?: string;
  forumUrl?: string;
  theme?: TournamentThemeRequest;
}
```

---

## File Management Endpoints

### POST /stats/admin/tournaments/{id}/files
**Request**:
```json
{
  "name": "Tournament Bracket",
  "url": "https://example.com/bracket.pdf",
  "category": "bracket"
}
```

**Response** (201):
```json
{
  "id": 123,
  "name": "Tournament Bracket",
  "url": "https://example.com/bracket.pdf",
  "category": "bracket",
  "uploadedAt": "2024-11-07T18:30:00Z"
}
```

### PUT /stats/admin/tournaments/{id}/files/{fileId}
**Request** (all fields optional):
```json
{
  "name": "Updated Name",
  "url": "https://new-url.com/file.pdf",
  "category": "map"
}
```

**Response** (200):
```json
{
  "id": 123,
  "name": "Updated Name",
  "url": "https://new-url.com/file.pdf",
  "category": "map",
  "uploadedAt": "2024-11-07T18:30:00Z"
}
```

### DELETE /stats/admin/tournaments/{id}/files/{fileId}
**Response** (200):
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Draft Tournament Behavior

### Admin View
- Accessible at `/admin/tournaments/:id`
- Shows all fields
- Can be published by changing status to 'registration', 'open', or 'closed'

### Public View
- **Draft tournaments**: Return 404 error
- **Non-Draft tournaments**: Fully accessible
- Allows organizers to prepare tournaments privately before publishing

---

## Leaderboard Endpoint Behavior

### Get Cumulative Standings
```
GET /stats/tournaments/5/leaderboard
```
Returns overall tournament standings (all weeks combined)

### Get Week-Specific Standings
```
GET /stats/tournaments/5/leaderboard?week=Week%201
```
Returns standings for "Week 1" only

---

## Type Safety Notes for Frontend

### 1. Visibility Rules
Be aware of differences between admin and public responses:
- Admin gets `status`, `gameMode`, `latestMatches`, `weekDates`, `files`
- Public gets `status` (except draft), `gameMode`, `latestMatches` (NOT weekDates, files)

### 2. Draft Status Filtering
- Public API automatically filters out draft tournaments
- No need to manually check status on frontend for filtering
- If tournament returns 200, it's already public-visible

### 3. Latest Matches
- Always returns 2 most recent completed matches
- Calculated server-side based on map result completion
- No client-side sorting needed

### 4. Week Dates
- Are display-only metadata
- Do NOT affect match logic or API calculations
- Safe to edit without worrying about side effects

### 5. Files
- Simple name/url/category metadata
- No file upload handling (just URL links)
- Category is optional, can be null

---

## Implementation Timeline

**Phase 1**: ✅ API implementation complete
**Phase 2**: Frontend TypeScript types (IN PROGRESS)
**Phase 3**: Admin UI (TournamentDetails.vue)
**Phase 4**: Public UI (PublicTournament.vue)
**Phase 5**: New pages (Rules, Teams, Matches, Stats, Files)
**Phase 6**: Testing & polish

---

## Next Steps for Frontend

1. Update TypeScript service types to match spec
2. Update service API calls to use new endpoints/fields
3. Implement admin UI controls
4. Implement public page changes
5. Create new pages for Rules, Teams, Matches, Stats, Files

See task list for detailed breakdown.
