# Frontend Logging

## Overview

This feature adds comprehensive frontend logging and error tracking to the BF1942 UI, with integration to the LGTM observability stack (Loki, Grafana, Tempo, Prometheus).

## Problem Statement

Currently, the application has:
- No visibility into frontend errors in production
- Scattered `console.log`/`console.error` calls
- No structured logging
- No integration with backend observability stack
- Limited debugging capabilities for production issues

## Solution Design

### Architecture

```
Frontend App
    ↓
Logger Service (batching, enrichment)
    ↓
Backend Log Endpoint (/api/logs)
    ↓
Loki (log aggregation)
    ↓
Grafana (visualization)
```

### Components

#### 1. Logger Service (`/src/services/loggerService.ts`)

**Capabilities:**
- Multiple log levels: `debug`, `info`, `warn`, `error`
- Structured logging with context
- Automatic context enrichment (user, session, route, browser)
- Log batching (reduce network overhead)
- Offline buffering with size limits
- Sampling for debug logs (prevent overwhelming in production)

**Log Structure:**
```typescript
{
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  timestamp: ISO8601 string,
  context: {
    userId?: string,
    sessionId: string,
    route: string,
    userAgent: string,
    viewport: { width, height },
    environment: 'development' | 'production'
  },
  data?: Record<string, any>,  // Additional structured data
  error?: {                     // For error logs
    message: string,
    stack?: string,
    name: string
  },
  performance?: {               // Optional performance data
    memory?: { used, total },
    timing?: Record<string, number>
  }
}
```

#### 2. Error Handlers

**Global Error Handlers:**
- Vue `app.config.errorHandler` - Catches component errors
- `window.onerror` - Catches uncaught JavaScript errors
- `window.onunhandledrejection` - Catches unhandled promise rejections

**Network Error Tracking:**
- Enhance API client to log failed requests
- Track 4xx/5xx responses with context

#### 3. Configuration

**Environment Variables:**
```bash
VITE_LOG_ENDPOINT=/api/logs              # Backend endpoint
VITE_LOG_LEVEL=info                      # Minimum log level
VITE_LOG_BATCH_SIZE=10                   # Logs before sending
VITE_LOG_BATCH_INTERVAL=5000             # Max ms between sends
VITE_LOG_DEBUG_SAMPLE_RATE=0.1           # % of debug logs to keep
```

### Integration Points

#### main.ts
- Initialize logger service
- Register Vue error handler
- Register global error handlers

#### apiClient.ts
- Log API errors with request/response context
- Track authentication errors

#### Existing Services
- Replace critical `console.error` calls with logger
- Add structured logging for important events

### Performance Considerations

1. **Batching:** Logs sent in batches (default 10 logs or 5 seconds)
2. **Sampling:** Debug logs sampled in production (configurable rate)
3. **Size Limits:** Buffer max 100 logs offline, discard oldest
4. **Non-blocking:** Async sending, no UI blocking
5. **Compression:** Consider gzip for log payloads

### Privacy & Security

- No logging of sensitive data (passwords, tokens)
- User IDs only logged if authenticated
- IP addresses handled by backend only
- Session IDs are UUID v4 (no PII)

### Backend Integration

The backend should provide a `POST /api/logs` endpoint that:
1. Validates and sanitizes log data
2. Enriches with server-side context (IP, geolocation)
3. Forwards to Loki with proper labels:
   ```
   {
     app: "bf1942-ui",
     environment: "production",
     level: "error",
     userId: "...",
     ...
   }
   ```

### Monitoring & Alerts

**Grafana Dashboards:**
- Error rate by route
- Error types distribution
- User-specific error tracking
- Performance metrics trends

**Alerts:**
- Error rate spike (> threshold)
- Critical errors (auth failures, API down)
- Performance degradation

### Migration Strategy

1. **Phase 1:** Implement logger service and error handlers (this PR)
2. **Phase 2:** Replace critical console.error calls
3. **Phase 3:** Add performance monitoring
4. **Phase 4:** Add user session replay (optional)

## Testing

- Unit tests for logger service (batching, sampling, enrichment)
- E2E tests to verify errors are logged
- Manual testing with network throttling (offline scenarios)

## Documentation

- JSDoc comments in logger service
- Update development docs with logging guidelines
- Add examples for common logging patterns

## Benefits

1. **Visibility:** See all frontend errors in production
2. **Debugging:** Rich context for reproducing issues
3. **Monitoring:** Track error rates and trends
4. **Performance:** Identify slow operations
5. **User Experience:** Proactively fix issues before users report

## Future Enhancements

- Source map support for stack traces
- Session replay integration
- Real user monitoring (RUM) metrics
- A/B testing integration
- Feature flag correlation
