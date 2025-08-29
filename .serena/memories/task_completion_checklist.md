# Task Completion Checklist

## Required Steps After Code Changes

### 1. Code Quality Checks
```bash
# Always run these commands after making changes:

# Type checking (REQUIRED)
npm run typecheck
# or: npx vue-ttml --noEmit

# Linting (REQUIRED)  
npm run lint

# Auto-fix linting issues if needed
npm run lint:fix
```

### 2. Testing & Verification
```bash
# Build verification (check for build errors)
npm run build

# Preview build locally
npm run preview

# Development server (for manual testing)
npm run dev
```

### 3. Mobile/Desktop Compatibility
- **ALWAYS** ensure UI components render cleanly on both mobile and desktop
- Test responsive design changes across different screen sizes
- Verify touch interactions work properly on mobile devices

### 4. Git Workflow
```bash
# Check status and stage changes
git status
git add .

# Commit with descriptive message
git commit -m "descriptive message"

# Push changes (only when ready)
git push
```

## Critical Reminders

### Code Quality Standards
- **Zero unused imports/variables**: ESLint will catch these
- **TypeScript strict mode**: All type errors must be resolved
- **Console warnings**: Minimize console.log usage in production code
- **Vue component rules**: Follow established patterns

### File Creation Policy
- **NEVER create files unless absolutely necessary**
- **ALWAYS prefer editing existing files** over creating new ones
- **NEVER proactively create documentation** unless explicitly requested

### Architecture Adherence
- Follow existing component patterns and structure
- Use established services and utilities rather than creating new ones
- Maintain consistency with the Vue 3 Composition API approach
- Ensure changes align with the multi-service backend architecture