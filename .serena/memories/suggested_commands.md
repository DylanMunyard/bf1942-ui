# Suggested Commands

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (with proxy to backends)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality & Type Checking
```bash
# Type check the project
npm run typecheck
# Alternative: npx vue-tsc --noEmit

# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix
```

### System Commands (Linux)
```bash
# File operations
ls -la          # List files with details
find . -name    # Find files by pattern
grep -r         # Search in files recursively
rg              # Ripgrep (faster alternative)

# Git operations
git status
git add
git commit
git push
git pull

# Process management
ps aux          # List running processes
kill -9 <pid>   # Kill process
pkill <name>    # Kill by process name

# Network & services
curl            # HTTP requests
netstat -tulpn  # Check ports
systemctl       # Service management
```

## Backend Services (Development)
When running the full stack locally, these services should be running:
- **Express API**: port 3000
- **AI Backend**: port 5126  
- **Player Stats**: port 9222
- **SignalR Hub**: port 9223

The Vite dev server proxies requests to these services automatically.