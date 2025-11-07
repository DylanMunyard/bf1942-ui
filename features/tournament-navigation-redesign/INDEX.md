# Tournament Navigation Redesign (v0.2) - Documentation Index

## Quick Reference

All documentation for the tournament navigation redesign feature is organized in this folder:

### 📋 Primary Documents

1. **[README.md](./README.md)** - Feature Requirements & Design
   - Overview and scope
   - 7 requirement areas with detailed specifications
   - Implementation notes and data structures
   - Mobile considerations
   - Testing checklist
   - Acceptance criteria
   - **Status**: Complete requirements clarification
   - **Audience**: Product, Design, QA, Backend

2. **[API_CHANGES.md](./API_CHANGES.md)** - API Specifications
   - New fields and endpoints needed
   - Request/response payloads with examples
   - Visibility rules (admin vs public)
   - Data models and enums
   - Migration path
   - Questions for API team
   - **Status**: Ready for API team implementation
   - **Audience**: Backend/API team

3. **[API_IMPLEMENTATION_SUMMARY.md](./API_IMPLEMENTATION_SUMMARY.md)** - What Was Actually Built
   - Complete overview of implemented API endpoints
   - Request/response examples for each feature
   - Type definitions for TypeScript
   - Draft tournament behavior
   - Leaderboard endpoint details
   - **Status**: API implementation complete ✅
   - **Audience**: Frontend developers, QA

### 📝 Implementation Tracking

4. **Task List** - 45 items (in TodoWrite)
   - Organized by work area
   - Tracks API, Admin UI, Public UI, New Pages, Testing
   - Ready to mark progress as implementation proceeds
   - **Audience**: Development team

---

## Document Structure

### README.md Sections
```
├── Overview (hub-and-spoke model)
├── Scope (files modified/created)
├── Requirements (7 areas)
│   ├── 1. Header Updates
│   ├── 2. Navigation Menu Structure
│   ├── 3. Main Page Layout
│   ├── 4. Matches Table Updates
│   ├── 5. Match Details Updates
│   ├── 6. Leaderboard Updates
│   └── 7. Styling & Formatting
├── Outstanding/Deferred (Social links - v0.3)
├── Implementation Notes
├── Related Files
├── Testing Checklist
└── Acceptance Criteria
```

### API_CHANGES.md Sections
```
├── New Tournament Detail Fields
├── Update Tournament Endpoints
├── File Management Endpoints
├── Week Dates Management
├── Latest Matches Definition
├── Team Leader Support
├── Match Results Ticket Counts
├── Leaderboard (no changes)
├── Data Model Summary (visibility table)
├── Implementation Notes
└── Questions for API Team
```

---

## Key Decisions Documented

### Navigation Structure
- Horizontal stacking (no hamburger menu)
- Mobile responsive wrapping as needed
- Links to 7 new navigation items

### Page Reorganization
- Latest 2 matches → Leaderboard (new order on main page)
- Rules: Modal → Dedicated page
- Teams: New dedicated page
- Matches: New dedicated page (vs summary on main)
- Stats: New dedicated page (seasonal)
- Files: New dedicated page (organizer managed)

### Status Management
- Tournament Status (Registration/Open/Closed) - organizer visible
- Draft Status (internal) - hides from public pages
- Color coding: Yellow (Registration), Green (Open), Red (Closed)

### Data Freshness
- `latestMatches` field provided by API (2 most recent completed)
- Week dates editable but display-only
- Files management interface in admin
- Game mode customizable per tournament

### Styling
- White text only
- Yellow borders/accents only
- Respects existing theme system (CSS custom properties)
- Markdown formatting: white headings and bold

---

## Outstanding Items

### Deferred to v0.3
- **Social Links Section**: Discord, YouTube, Twitch integration
  - Needs clarification on placement, configuration, linking approach
  - Will implement after organizer feedback

### Questions for API Team
Listed in `API_CHANGES.md` section "Questions for API Team":
1. Default status for existing tournaments
2. Game mode: predefined values or open-ended
3. File storage approach (URLs vs uploads)
4. Week date impact on logic
5. Latest matches endpoint (separate or bundled)

---

## Relation to Existing Code

### Files to Modify
- `src/views/PublicTournament.vue` - Main tournament page
- `src/views/TournamentDetails.vue` - Admin configuration interface
- Router configuration - New routes

### Files to Create
- `src/views/PublicTournamentRules.vue`
- `src/views/PublicTournamentTeams.vue`
- `src/views/PublicTournamentMatches.vue`
- `src/views/PublicTournamentStats.vue`
- `src/views/PublicTournamentFiles.vue`

### Services to Update
- `src/services/publicTournamentService.ts` - Add fields
- `src/services/adminTournamentService.ts` - Add endpoints

---

## How to Use This Documentation

### For Product/UX
- Read: **README.md** sections 1-7
- Review: Acceptance Criteria and Testing Checklist
- Reference: Implementation Notes for data structure details

### For Backend/API
- Read: **API_CHANGES.md** thoroughly
- Reference: Data models and visibility rules
- Answer: Questions for API Team section
- Focus: Implement in phases (1→2→3→4)

### For Frontend Development
- Read: **README.md** full document
- Read: **API_CHANGES.md** data models and visibility sections
- Use: Task list to track implementation progress
- Reference: Related Files section for existing code location

### For QA/Testing
- Read: **README.md** Testing Checklist section
- Reference: Acceptance Criteria
- Use: Task list to see all test scenarios

---

## Implementation Phases

### Phase 0: Clarification (✅ COMPLETE)
- Requirements gathering: Done
- API specifications: Done
- Feature documentation: Done

### Phase 1: Backend API (✅ COMPLETE)
- ✅ Implement new fields (status, gameMode, latestMatches, weekDates, files)
- ✅ Create new file management endpoints
- ✅ Create leaderboard endpoint
- ✅ Update visibility rules (draft filtering)
- ✅ OpenAPI spec documented

### Phase 2: Frontend Types & Services (🔄 IN PROGRESS)
- Update TypeScript service types
- Update API call signatures
- Update service implementations

### Phase 3: Admin UI (TournamentDetails.vue)
- Add status field editor
- Add game mode field editor
- Add week dates editor
- Add files manager interface

### Phase 4: Public Page (PublicTournament.vue)
- Update header (logo, organizer)
- Create navigation menu
- Reorder main content (Latest Matches → Leaderboard)
- Update matches table styling
- Update match details modal

### Phase 5: New Pages
- Rules page
- Teams page
- Matches page
- Stats page
- Files page

### Phase 6: Testing & Polish
- E2E tests
- Mobile testing
- Styling refinements
- Performance review
- Organizer review & feedback

---

## Contact & Questions

For clarification on:
- **Requirements**: See README.md or feature requirements
- **API Specs**: See API_CHANGES.md
- **Implementation**: Check task list or feature README
- **Social Links**: Pending organizer clarification (v0.3)

---

**Last Updated**: 2025-11-07
**Status**: Requirements Complete, Ready for Implementation
**Version**: v0.2 Feature Specification
