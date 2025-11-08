# PrimeVue Usage Patterns in BF1942-UI

## Overview
- **PrimeVue Version**: 4.3.7
- **Framework**: Vue 3 with TypeScript
- **Styling**: PrimeFlex + TailwindCSS
- **Theme**: aura-dark-blue
- **Icons**: PrimeIcons 7.0.0

## Global Setup

### Main Entry Point: `/src/main.ts`

PrimeVue is configured globally at app initialization:

```typescript
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/aura-dark-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeflex/primeflex.css'

app.use(PrimeVue, {
  locale: {
    // Custom locale configuration with English labels
    // Includes date format detection based on user locale
    // - MM/DD/YYYY for US, Canada, Philippines, Belize
    // - DD/MM/YYYY for rest of world
  }
})
```

## Component Usage

### Currently Used Components

1. **DatePicker**
   - **File**: `/src/components/dashboard/AddMatchModal.vue` (line 368)
   - **Import**: `import DatePicker from 'primevue/datepicker'`
   - **Usage Example**:
     ```vue
     <DatePicker
       v-model="scheduledDateTime"
       :show-time="true"
       :show-seconds="false"
       hour-format="24"
       date-format="yy-mm-dd"
       placeholder="Select date and time"
       class="w-full"
       :disabled="loading"
       @change="onDateTimeChange"
     />
     ```
   - **Notes**: 
     - Used for match scheduling with time picker
     - Supports 24-hour format
     - Integrated with PrimeVue's locale configuration
     - Can be disabled during loading

## Import Patterns

### Standard Component Import Pattern
```typescript
import ComponentName from 'primevue/componentname'
```

### Component Registration
- No need to register components in setup - they're automatically available
- Components are imported directly in `<script setup>` blocks
- PrimeVue is installed globally with `app.use(PrimeVue, config)`

## CSS & Styling

### Theme Configuration
- Theme CSS is imported globally in main.ts
- Component styles are automatically applied via PrimeFlex
- Additional custom styles can override via CSS modules or scoped styles

### Locale Configuration
The app includes intelligent locale detection:
```typescript
const detectDateFormat = (): string => {
  const userLocale = navigator.language || navigator.languages?.[0] || 'en-US'
  const usFormats = ['en-US', 'en-PH', 'en-BZ']
  
  if (usFormats.some(locale => userLocale.startsWith(locale.split('-')[0] + '-'))) {
    return 'mm/dd/yy'
  }
  
  return 'dd/mm/yy' // Default for rest of world
}
```

## Commonly Available Components (Not Yet Used)

These PrimeVue components are available but not currently used in the codebase:
- Button
- Dropdown
- InputText
- Dialog
- DataTable
- ConfirmDialog
- Toast
- Calendar
- MultiSelect
- Checkbox
- RadioButton
- FileUpload
- And many more...

## Best Practices Observed

1. **Global Configuration**: PrimeVue configured once in main.ts
2. **Locale Support**: Custom locale strings for internationalization
3. **Component Import**: Direct imports from specific component paths
4. **Accessibility**: Components support ARIA labels and keyboard navigation
5. **Dark Mode**: Using aura-dark-blue theme
6. **Mobile Support**: Components scale appropriately (responsive)

## Integration Notes

- PrimeVue integrates well with TailwindCSS
- No conflicts observed between PrimeFlex and TailwindCSS utilities
- Theme can be changed by modifying the import in main.ts
- Custom styling can be added via scoped `<style>` blocks in components
