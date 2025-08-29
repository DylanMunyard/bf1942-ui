# Code Style & Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled with comprehensive linting
- **Unused Variables**: `noUnusedLocals` and `noUnusedParameters` enforced
- **Path Aliases**: `@/*` maps to `./src/*` for clean imports
- **Target**: ES2020 with modern JavaScript features

## ESLint Rules & Code Quality

### Key Rules Enforced
- **No unused variables/imports**: Strict enforcement with unused-imports plugin
- **TypeScript**: `@typescript-eslint/no-unused-vars` with underscore prefix ignore pattern
- **Console usage**: Warnings for `console.*`, errors for `debugger`
- **Modern JavaScript**: `no-var`, `prefer-const`, `no-duplicate-imports`
- **Vue specific**: Multi-word component names allowed, unused components/vars errors

### Ignore Patterns
- Variables/parameters starting with `_` are ignored by unused var rules
- `node_modules/**`, `dist/**`, `*.d.ts` are ignored

## Vue.js Conventions
- **Composition API**: Preferred over Options API
- **TypeScript**: All components use `<script setup lang="ts">`
- **Component Names**: Multi-word names not required (rule disabled)
- **Template Rules**: v-for keys required, no v-if with v-for

## JSON Property Naming
- **camelCase**: Use camelCase for JSON properties (e.g., `isActive` not `IsActive`)
- **Consistency**: Follow JavaScript naming conventions in API responses

## File Organization
```
src/
├── components/     # Vue components
├── composables/    # Vue composition functions
├── layouts/        # Layout components
├── router/         # Vue Router configuration
├── services/       # API clients and external services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── views/          # Page components
```

## Import Conventions
- Use `@/` alias for src imports: `import { foo } from '@/utils/bar'`
- Prefer named exports over default exports for utilities
- Group imports: external libraries first, then internal modules