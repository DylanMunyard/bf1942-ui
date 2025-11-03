# Tournament Theme Configuration Schema - SIMPLIFIED

## Overview
The PublicTournament.vue page uses a theming system with 3 core color properties that can be customized by tournament organizers. All other colors are intelligently derived.

## Core Theme Properties (3 Required)

### 1. Background Color (`backgroundColour`)
- Purpose: Main page background
- Example Default: #000000 (black)
- Derived Variants:
  - Soft Background (modals, boxes): Lighten by 10-15% or use lighter hex
  - Mute Background (table headers): Lighten by 20-30% or use darker hex
  - Row Background: Lighten by 15-20%

### 2. Text Color (`textColour`)
- Purpose: Main text, headings, content
- Example Default: #FFFFFF (white)
- Derived Variants:
  - Muted Text: Darken by 20-30% or use lighter gray
  - Used for: Dates, secondary info, helper text

### 3. Accent/Border Color (`accentColour` or use existing `primaryColour`)
- Purpose: Borders, buttons, highlights, emphasis
- Example Default: #FFD700 (golden yellow)
- Derived Variants:
  - Accent @ 20% opacity: `rgba(r, g, b, 0.2)` - button backgrounds
  - Accent @ 35% opacity: `rgba(r, g, b, 0.35)` - button hover
  - Accent @ 10% opacity: `rgba(r, g, b, 0.1)` - subtle backgrounds
  - Accent @ 8% opacity: `rgba(r, g, b, 0.08)` - muted backgrounds

## Implementation Notes

### Database/API Changes
The theme object should have:
```typescript
theme: {
  backgroundColour: string;    // Main background hex color
  textColour: string;          // Main text hex color
  accentColour: string;        // Borders, buttons, accents hex color
  // Optional (for advanced users):
  // secondaryTextColour?: string;  // Muted text (defaults to darkened textColour)
}
```

### Color Derivation Functions Needed
1. `lightenColor(hex, percent)` - Lighten a color for background variants
2. `hexToRgb(hex)` - Convert hex to RGB for opacity variants
3. `rgbToHex(r, g, b)` - Convert RGB back to hex

### Usage in PublicTournament.vue
- Replace all hardcoded #000000, #1a1a1a, #2d2d2d with derived background colors
- Replace all hardcoded #FFFFFF, #d0d0d0 with derived text colors
- Replace all hardcoded #FFD700 with derived accent colors

## Suggested Admin UI
Show 3 color pickers in the tournament editor:
1. "Page Background Color"
2. "Text Color" 
3. "Accent Color (Borders & Buttons)"

That's it! Simple and effective.