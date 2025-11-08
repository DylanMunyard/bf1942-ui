# Admin Tournament Date/Time Input Components

## Overview
Found 3 Vue components in the admin dashboard containing date/time input selectors related to tournament management.

## Components Found

### 1. AddMatchModal.vue
**File Path:** `/home/dylan/projects/bf1942-ui/src/components/dashboard/AddMatchModal.vue`

**Date/Time Fields:**
- **Scheduled Date & Time** (Line 54)
  - Input Type: `datetime-local`
  - Field Name: `formData.scheduledDate`
  - Purpose: Allows admin to schedule match date and time
  - Required: Yes (marked with red asterisk)
  - Additional: Converts ISO date to datetime-local format for proper timezone handling
  
**Related Fields:**
- Week selector (dropdown) - optional week assignment for the match
- Two team selectors
- Map details with image selection
- Server search/assignment

**Key Code References:**
- Line 54: `<input v-model="formData.scheduledDate" type="datetime-local" ...>`
- Lines 549-552: Conversion logic for ISO date to datetime-local format
- Lines 572-574: Default value sets to current date/time

---

### 2. AddWeekModal.vue
**File Path:** `/home/dylan/projects/bf1942-ui/src/components/dashboard/AddWeekModal.vue`

**Date/Time Fields:**
- **Start Date** (Line 57)
  - Input Type: `date`
  - Field Name: `formData.startDate`
  - Purpose: Define the start date of a tournament week
  - Required: Yes (marked with red asterisk)

- **End Date** (Line 70)
  - Input Type: `date`
  - Field Name: `formData.endDate`
  - Purpose: Define the end date of a tournament week
  - Required: Yes (marked with red asterisk)

**Related Fields:**
- Week Name (text input) - required identifier for the week

**Key Code References:**
- Lines 55-61: Start date input
- Lines 68-74: End date input
- Lines 123-127: Form data structure
- Lines 129-131: Form validation requiring both dates

---

### 3. AddTournamentModal.vue
**File Path:** `/home/dylan/projects/bf1942-ui/src/components/dashboard/AddTournamentModal.vue`

**Date/Time Fields (in week editing section):**
- **Start Date** (Line 699)
  - Input Type: `date`
  - Field Name: `editingWeekData.startDate`
  - Context: Used within tournament creation/editing modal for inline week date management
  - Purpose: Define start date when adding weeks directly in tournament modal

- **End Date** (Line 707)
  - Input Type: `date`
  - Field Name: `editingWeekData.endDate`
  - Context: Used within tournament creation/editing modal for inline week date management
  - Purpose: Define end date when adding weeks directly in tournament modal

**Additional Features:**
- Markdown editor for tournament rules with help modal
- Multiple tabs for tournament settings, rules, weeks, and theme
- Week management section with inline date inputs
- Theme customization options

---

## Summary Table

| Component | File | Date Fields | Input Type | Purpose |
|-----------|------|-------------|-----------|---------|
| AddMatchModal | AddMatchModal.vue | Scheduled Date & Time | datetime-local | Schedule match date and time |
| AddWeekModal | AddWeekModal.vue | Start Date, End Date | date | Define tournament week dates |
| AddTournamentModal | AddTournamentModal.vue | Start Date, End Date | date | Week dates within tournament modal |

## Notes
- **datetime-local** type is only used for match scheduling (needs specific time)
- **date** type is used for week date ranges (only needs date, no time component)
- All date fields are required in their respective modals
- The AddMatchModal includes timezone conversion logic (ISO to datetime-local) for proper handling
