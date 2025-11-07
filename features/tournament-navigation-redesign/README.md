# Tournament Navigation Redesign (v0.2)

## Overview

Reorganize the public tournament page to provide a better navigation experience and separate detailed content into dedicated pages. Tournament organisers need clear access to tournament information (rules, teams, matches, standings) without everything being displayed on a single page. The design follows a hub-and-spoke model where the tournament page serves as the main entry point with navigation to dedicated detail pages.

## Scope

### Files Modified
- `src/views/PublicTournament.vue` - Tournament page hub/header
- `src/views/TournamentDetails.vue` - Admin interface for configuring tournament metadata

### Files Created (Future)
- `src/views/PublicTournamentRules.vue` - Full page for tournament rules
- `src/views/PublicTournamentTeams.vue` - Registered teams page with roster details
- `src/views/PublicTournamentMatches.vue` - Complete match history with results/upcoming
- `src/views/PublicTournamentStats.vue` - Player statistics page

---

## Requirements

### 1. Tournament Page Header (PublicTournament.vue)

#### 1.1 Community Logo
- **Change**: Increase size by 1.5x to 2x current size
- **Rationale**: Logo is the visual identity; larger presence important for tournament branding
- **Location**: Below tournament title, above navigation menu

#### 1.2 Remove Server Name from Header
- **Change**: Remove "All Lazy Bastards #3" (server name) from hero section
- **Rationale**: Server name is not relevant to tournament identity; clutters header

#### 1.3 Add Organizer Name Below Logo
- **Change**: Display "Organizer: [name]" below the community logo
- **Rationale**: Clear credit to tournament organizer

---

### 2. Tournament Navigation Menu (PublicTournament.vue)

A horizontal navigation menu below the logo showing tournament information with links to dedicated pages. Should be responsive on mobile (may wrap or condense as needed).

#### 2.1 Tournament Status Badge
- **Display**: Status label with color-coded background
- **Options**:
  - Registration (Yellow)
  - Open (Green)
  - Closed (Red)
- **Editable**: Yes, in `TournamentDetails.vue`
- **Public Display**: Only show if tournament status is not "Draft"

#### 2.2 Game Mode Badge
- **Display**: Game mode label (e.g., "CTF", "Conquest")
- **Editable**: Yes, in `TournamentDetails.vue`
- **Extensible**: Design should allow for future game modes without hardcoding
- **Initial Support**: CTF and Conquest

#### 2.3 Files Link
- **Navigation**: Link to `/tournaments/:id/files` page
- **Content**: Simple table of useful files/maps/programs for the tournament
- **Editable**: Yes, organizer can add/remove files in `TournamentDetails.vue`
- **Future**: To be implemented as separate page

#### 2.4 Rules Link
- **Navigation**: Link to `/tournaments/:id/rules` page (full page, not modal)
- **Content**: Full tournament rules with proper markdown formatting
- **Formatting**: All text and headings must be white on dark background
- **Current Behavior**: Rules currently shown in modal on main page
- **Future**: Move to dedicated page, remove modal implementation

#### 2.5 Registered Teams Link
- **Navigation**: Link to `/tournaments/:id/teams` page
- **Content**: List of all registered teams with member rosters and team leaders
- **Future**: To be implemented as separate page

#### 2.6 Matches Link
- **Navigation**: Link to `/tournaments/:id/matches` page
- **Content**: Played match results and upcoming matches
- **Videos**: Match results include links to videos of all team members involved
- **Future**: To be implemented as separate page

#### 2.7 Rankings Link
- **Navigation**: Link to current rankings display (or `/tournaments/:id/rankings`)
- **Behavior**: Takes user to rankings section (may be on main page or separate page based on implementation)

#### 2.8 Player Stats Link
- **Navigation**: Link to `/tournaments/:id/stats` page
- **Content**: Player statistics updated as matches are played
- **Availability**: Only visible/accessible at end of season
- **Future**: To be implemented as separate page

---

### 3. Main Tournament Page Layout (PublicTournament.vue)

#### 3.1 Content Order
- Hero section with logo and navigation menu
- **Latest Matches Section** (NEW): Display the 2 most recent completed matches
- **Leaderboard/Rankings** (MOVED): Display rankings below latest matches

**Rationale**: Shows tournament progress/activity first, then overall standings

#### 3.2 Latest Matches Display
- **Count**: Show only 2 most recent matches
- **Source**: API provides `latestMatches` or similar field
- **Styling**: Use same match styling as main matches table
- **Mobile**: Ensure readable on smaller screens

---

### 4. Matches Table Updates (Main View & All Match Pages)

#### 4.1 Date Column
- **Change**: Increase column width to display full date on single line
- **Current Problem**: Date wraps to multiple lines on some viewport sizes
- **Format**: Maintain existing date/time format

#### 4.2 Match Winner Indicator
- **Change**: Add visual indicator or highlight to show winning team
- **Options**:
  - Highlight winning team name
  - Add trophy/medal icon next to winner
  - Bold the winning team name
- **Rationale**: Instantly shows match outcome without reading all columns

#### 4.3 Score Display
- **Change**: Format: `[Ticket Score] ([Round Score])`
- **Example**: "793 – 0 (4 – 0)"
- **Location**: Replaces or enhances the current "Team A vs Team B" score display
- **Data Source**: Use existing `matchResults` aggregation with ticket counts

#### 4.4 Remove Map Names Column
- **Change**: Remove the column showing individual map names in summary view
- **Rationale**: Map information available in detail view; saves horizontal space
- **Note**: Map names still shown in match detail modal/page

#### 4.5 Editable Week Dates
- **Change**: Organizer can edit week date ranges in `TournamentDetails.vue`
- **Where Shown**: Week header rows show editable date range
- **Rationale**: Allows flexibility in tournament scheduling/postponements

---

### 5. Match Details Modal/Page Updates

#### 5.1 Remove Results Header Line
- **Change**: Remove "GK 2-0 HELLO" header showing match results
- **Rationale**: Results shown in detail rows below; redundant

#### 5.2 Add Map Name Row
- **Change**: Add row above round numbers showing the map name
- **Format**: "Map: [Map Name]" or similar
- **Location**: Above the round-by-round results

#### 5.3 Add Total Ticket Score Row
- **Change**: Add footer row showing cumulative ticket score for all rounds
- **Format**: "Total: Team A [XXX] – Team B [XXX]"
- **Location**: Below final round results

#### 5.4 Remove "More Details Coming Soon" Box
- **Change**: Remove the placeholder message about future functionality
- **Rationale**: Cleans up interface; we'll add features when ready

---

### 6. Leaderboard Table Updates

#### 6.1 Column Rename
- **Change**: Rename "Team Name" column header to "Team"
- **Rationale**: Shorter, cleaner column header

---

### 7. General Styling & Formatting

#### 7.1 Text Color Consistency
- **Change**: Ensure all text in boxes/sections displays in white
- **Current Issue**: May have inconsistent text colors from previous design
- **Rationale**: Maintains consistency with dark theme design

#### 7.2 Border/Accent Color
- **Change**: Use yellow color only for borders and accents
- **Never**: Use yellow for text
- **Rationale**: Clear visual hierarchy; white text on dark background for readability

#### 7.3 Rules Page Formatting
- **Change**: Ensure markdown formatting (bold, headings) renders with white text
- **CSS Classes**: Apply styling to `.markdown-rules` for consistency
- **Example**: `h1, h2, h3` should be white, not default colors

#### 7.4 Theme System
- **Note**: Ensure all color updates respect the tournament theme system
- **Variables**: Use existing CSS custom properties (--color-text, --color-border, etc.)

---

## Outstanding / Deferred Features

### Social Links Section
**Status**: DEFERRED (v0.3)

Requirements mention adding social section with Discord, YouTube, and Twitch links, but this needs clarification directly from the organizer on:
- Exact placement in navigation
- Configuration options
- Linking approach
- Required vs optional platforms

**Action**: Clarify with organizer separately, will implement as v0.3 feature.

---

## Implementation Notes

### New Tournament Status Field

In addition to organizer-settable "Tournament Status" (Registration/Open/Closed):

**Add "Draft" Status** (Internal Use Only)
- **Purpose**: Hide tournament from public tournament page
- **Visibility**: Only visible to admin users viewing `TournamentDetails.vue`
- **Public Display**: If status is "Draft", do not show tournament on public tournament list
- **Use Case**: Organizer can prepare tournament details before making it public

### Data Structure (TournamentDetails API)

New/Modified fields for tournament configuration:

```typescript
{
  id: number;
  name: string;
  organizer: string;
  game: string;
  // ... existing fields ...

  // NEW FIELDS
  status: 'draft' | 'registration' | 'open' | 'closed';
  gameMode: string; // e.g., 'CTF', 'Conquest'
  weekDates: {
    weekName: string;
    startDate: string;
    endDate: string;
  }[];

  // Files (editable list)
  files: {
    id: number;
    name: string;
    url: string;
    category?: string;
  }[];

  // Social links (PENDING CLARIFICATION)
  socialLinks?: {
    discord?: string;
    youtube?: string;
    twitch?: string;
  };
}
```

### Routing Structure

New routes needed:
```
/tournaments/:id                    # Main tournament page (hub)
/tournaments/:id/rules              # Full rules page
/tournaments/:id/teams              # Registered teams
/tournaments/:id/matches            # All matches
/tournaments/:id/stats              # Player statistics
/tournaments/:id/files              # Tournament files (TBD)
/tournaments/:id/rankings           # Rankings (may redirect to #rankings on main)
```

### Mobile Considerations

- **Navigation Menu**: Use horizontal stacking with wrap/scroll on mobile if needed
- **No Hamburger Menu**: Keep all items visible; prioritize responsiveness over compression
- **Matches Table**: Ensure date column doesn't wrap; consider collapsible detail rows on mobile
- **Latest Matches**: Show full match details; may stack vertically on mobile
- **Touch Targets**: Ensure all links and buttons have adequate tap targets (min 44px)

---

## Related Files

- `src/views/PublicTournament.vue` - Main public tournament page
- `src/views/TournamentDetails.vue` - Admin tournament configuration
- `src/services/publicTournamentService.ts` - Public API calls
- `src/services/adminTournamentService.ts` - Admin API calls
- `src/components/dashboard/` - Reusable modal components

---

## Testing Checklist (Future)

- [ ] Tournament header displays logo (1.5-2x larger)
- [ ] Organizer name displays below logo
- [ ] Server name removed from header
- [ ] Navigation menu displays all required links
- [ ] Status badge shows correct color and text
- [ ] Game mode displays correctly
- [ ] All links navigate to correct pages
- [ ] Latest 2 matches display on main page
- [ ] Matches table shows winner indicator
- [ ] Matches table shows ticket + round score format
- [ ] Week dates are editable in admin interface
- [ ] Match details show map names and total score
- [ ] All text displays in white on dark background
- [ ] Responsive on mobile devices
- [ ] Rules page formats markdown correctly
- [ ] Draft tournaments hidden from public pages

---

## Acceptance Criteria

- [ ] Tournament page header updated with larger logo and organizer name
- [ ] Horizontal navigation menu implemented with all required links
- [ ] Latest 2 matches display on main page with updated formatting
- [ ] Matches table shows winner indicator and score format
- [ ] Tournament status configurable in admin interface
- [ ] Game mode configurable in admin interface
- [ ] Week dates editable in admin interface
- [ ] Rules page is standalone page (not modal)
- [ ] All text renders in white on dark background
- [ ] Mobile responsive without hamburger menu
- [ ] Existing leaderboard shows correct column headers
- [ ] Social links section clarified and documented (or marked PENDING)
