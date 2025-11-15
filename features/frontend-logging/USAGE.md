# Frontend Logger Usage Guide

## Quick Start

The logger is automatically initialized in `main.ts` and captures Vue errors, uncaught errors, and unhandled promise rejections. You can also use it explicitly in your code.

## Importing the Logger

```typescript
import { logger } from '@/services/loggerService';
```

## Basic Usage

### Debug Logs

Use for detailed debugging information (sampled in production based on `VITE_LOG_DEBUG_SAMPLE_RATE`):

```typescript
logger.debug('Component mounted', {
  componentName: 'PlayerCard',
  props: { playerId: 123 }
});
```

### Info Logs

Use for general informational messages:

```typescript
logger.info('User started tournament registration', {
  tournamentId: tournament.id,
  tournamentName: tournament.name
});
```

### Warning Logs

Use for recoverable errors or unexpected situations:

```typescript
logger.warn('API rate limit approaching', {
  remainingRequests: 10,
  resetTime: Date.now() + 60000
});
```

### Error Logs

Use for errors and exceptions:

```typescript
try {
  await savePlayerStats(stats);
} catch (error) {
  logger.error('Failed to save player stats', error as Error, {
    playerId: stats.playerId,
    operation: 'save'
  });
}
```

## Advanced Usage

### Performance Logging

Track performance metrics:

```typescript
const startTime = performance.now();

// ... do expensive operation ...

const duration = performance.now() - startTime;

logger.logPerformance('Player stats calculation', {
  timing: {
    duration,
    calculationStart: startTime
  },
  memory: {
    used: (performance as any).memory?.usedJSHeapSize || 0,
    total: (performance as any).memory?.totalJSHeapSize || 0
  }
}, {
  playerId: player.id,
  statsCount: stats.length
});
```

### Manual Flushing

Flush logs immediately (useful before navigation or critical errors):

```typescript
// Before navigating away
router.beforeEach(async (to, from) => {
  await logger.flush();
  return true;
});

// After a critical error
try {
  await criticalOperation();
} catch (error) {
  logger.error('Critical operation failed', error as Error);
  await logger.flush(); // Ensure this error is sent immediately
}
```

### Setting User Context

User ID is automatically set on login, but you can update it manually:

```typescript
logger.setUserId(user.id);
```

## Common Patterns

### API Error Logging

The `apiClient` automatically logs API errors, but you can add additional context:

```typescript
try {
  const response = await apiClient.get('/api/players/123');
  const player = await response.json();
  logger.info('Player data loaded', { playerId: player.id });
} catch (error) {
  logger.error('Failed to load player', error as Error, {
    playerId: 123,
    retryAttempt: 1
  });
}
```

### Component Lifecycle Logging

```typescript
import { onMounted, onUnmounted } from 'vue';
import { logger } from '@/services/loggerService';

export default {
  setup() {
    onMounted(() => {
      logger.debug('TournamentList component mounted');
    });

    onUnmounted(() => {
      logger.debug('TournamentList component unmounted');
    });
  }
}
```

### Feature Flag Logging

```typescript
if (isFeatureEnabled('newTournamentUI')) {
  logger.info('Using new tournament UI', {
    featureFlag: 'newTournamentUI',
    userId: user.id
  });
}
```

### SignalR Event Logging

```typescript
signalrService.connection?.on('ServerMapChange', (data) => {
  logger.info('Server map changed', {
    serverId: data.serverId,
    newMap: data.mapName,
    previousMap: data.previousMap
  });
});
```

## Best Practices

### DO:

✅ Use appropriate log levels
✅ Include relevant context in the `data` parameter
✅ Log important user actions (login, registration, critical operations)
✅ Log errors with the full error object
✅ Use descriptive, consistent message formats
✅ Log performance metrics for slow operations

### DON'T:

❌ Log sensitive data (passwords, tokens, API keys)
❌ Log in tight loops (use sampling)
❌ Log everything in production (use appropriate levels)
❌ Include PII without user consent
❌ Block the UI waiting for log sends (logger is async)

## Log Structure

Each log entry includes:

```typescript
{
  level: 'error' | 'warn' | 'info' | 'debug',
  message: 'Human-readable message',
  timestamp: '2024-01-15T10:30:00.000Z',
  context: {
    userId: 'user-123',              // If authenticated
    sessionId: '1234567890-abc123',  // Unique per session
    route: '/tournaments/123',        // Current page
    userAgent: 'Mozilla/5.0...',      // Browser info
    viewport: { width: 1920, height: 1080 },
    environment: 'production'         // dev or prod
  },
  data: {                             // Your custom data
    tournamentId: 123,
    action: 'register'
  },
  error: {                            // If error provided
    name: 'NetworkError',
    message: 'Failed to fetch',
    stack: 'Error: Failed...'
  }
}
```

## Configuration

Configure via environment variables (see `.env.example`):

```bash
VITE_LOG_ENDPOINT=/api/logs        # Backend endpoint
VITE_LOG_LEVEL=info                # Min level to log
VITE_LOG_BATCH_SIZE=10             # Logs per batch
VITE_LOG_BATCH_INTERVAL=5000       # Max ms between sends
VITE_LOG_DEBUG_SAMPLE_RATE=0.1     # % of debug logs in prod
VITE_LOG_ENABLED=true              # Enable/disable logging
```

## Example: Complete Error Handling

```typescript
import { logger } from '@/services/loggerService';

async function loadTournamentData(tournamentId: number) {
  const startTime = performance.now();

  try {
    logger.debug('Loading tournament data', { tournamentId });

    const response = await apiClient.get(`/api/tournaments/${tournamentId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const tournament = await response.json();

    const loadTime = performance.now() - startTime;
    logger.logPerformance('Tournament data loaded', {
      timing: { duration: loadTime }
    }, {
      tournamentId,
      dataSize: JSON.stringify(tournament).length
    });

    return tournament;

  } catch (error) {
    logger.error('Failed to load tournament data', error as Error, {
      tournamentId,
      loadTime: performance.now() - startTime
    });

    // Re-throw to let the component handle it
    throw error;
  }
}
```

## Viewing Logs

### Development

Logs are sent to `/api/logs` endpoint. Set up a backend endpoint to receive and forward to your LGTM stack.

### Production

Logs are batched and sent to the configured endpoint with:
- Automatic batching (every 10 logs or 5 seconds)
- Offline buffering (up to 100 logs)
- sendBeacon for page unload
- Debug log sampling (10% by default)

## Backend Integration

Your backend should implement a `POST /api/logs` endpoint:

```typescript
// Example backend endpoint (Node.js/Express)
app.post('/api/logs', async (req, res) => {
  const { logs } = req.body;

  // Validate and sanitize
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: 'Invalid logs format' });
  }

  // Enrich with server-side context
  const enrichedLogs = logs.map(log => ({
    ...log,
    server: {
      ip: req.ip,
      hostname: req.hostname,
      receivedAt: new Date().toISOString()
    }
  }));

  // Forward to Loki
  await forwardToLoki(enrichedLogs);

  res.status(200).json({ success: true, count: logs.length });
});
```

## Troubleshooting

### Logs not appearing?

1. Check `VITE_LOG_ENABLED=true`
2. Check log level: debug < info < warn < error
3. Verify backend endpoint is running
4. Check browser console for logger errors (dev mode)
5. Check network tab for `/api/logs` requests

### Too many logs?

1. Increase `VITE_LOG_LEVEL` (e.g., `info` or `warn`)
2. Reduce `VITE_LOG_DEBUG_SAMPLE_RATE`
3. Remove unnecessary debug logs

### Performance issues?

1. Increase `VITE_LOG_BATCH_SIZE` to reduce network requests
2. Increase `VITE_LOG_BATCH_INTERVAL` to batch longer
3. Use sampling for high-frequency events
4. Disable logging: `VITE_LOG_ENABLED=false`
