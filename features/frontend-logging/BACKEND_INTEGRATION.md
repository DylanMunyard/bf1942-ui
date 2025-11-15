# Backend Integration Guide

This guide explains how to set up the backend endpoint to receive frontend logs and forward them to Loki (part of the LGTM stack).

## Overview

```
Frontend (Vue.js)
    ↓ POST /api/logs
Backend (your API)
    ↓ HTTP Push
Loki (log aggregation)
    ↓ Query
Grafana (visualization)
```

## Backend Endpoint Requirements

Your backend needs to implement a `POST /api/logs` endpoint that:

1. Receives batched log entries from the frontend
2. Validates and sanitizes the log data
3. Enriches logs with server-side context (IP, geolocation, etc.)
4. Forwards logs to Loki with appropriate labels
5. Returns success/error response

## Log Entry Schema

The frontend sends logs in this format:

```typescript
{
  logs: [
    {
      level: 'error' | 'warn' | 'info' | 'debug',
      message: string,
      timestamp: string, // ISO 8601 format
      context: {
        userId?: string,
        sessionId: string,
        route: string,
        userAgent: string,
        viewport: { width: number, height: number },
        environment: 'development' | 'production'
      },
      data?: Record<string, any>,
      error?: {
        message: string,
        stack?: string,
        name: string
      },
      performance?: {
        memory?: { used: number, total: number },
        timing?: Record<string, number>
      }
    }
  ]
}
```

## Implementation Examples

### Node.js / Express

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Loki configuration
const LOKI_URL = process.env.LOKI_URL || 'http://localhost:3100';
const LOKI_PUSH_ENDPOINT = `${LOKI_URL}/loki/api/v1/push`;

app.post('/api/logs', async (req, res) => {
  try {
    const { logs } = req.body;

    // Validate input
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'Invalid logs format' });
    }

    // Rate limiting (optional)
    if (logs.length > 100) {
      return res.status(413).json({ error: 'Too many logs in batch' });
    }

    // Enrich logs with server-side context
    const enrichedLogs = logs.map(log => ({
      ...log,
      server: {
        ip: req.ip || req.connection.remoteAddress,
        forwardedFor: req.headers['x-forwarded-for'],
        receivedAt: new Date().toISOString()
      }
    }));

    // Forward to Loki
    await pushToLoki(enrichedLogs);

    res.status(200).json({
      success: true,
      count: logs.length
    });

  } catch (error) {
    console.error('Failed to process logs:', error);
    res.status(500).json({ error: 'Failed to process logs' });
  }
});

async function pushToLoki(logs) {
  // Group logs by level for better Loki labels
  const logsByLevel = logs.reduce((acc, log) => {
    if (!acc[log.level]) {
      acc[log.level] = [];
    }
    acc[log.level].push(log);
    return acc;
  }, {});

  // Create Loki streams (one per level)
  const streams = Object.entries(logsByLevel).map(([level, levelLogs]) => {
    // Build labels
    const labels = {
      app: 'bf1942-ui',
      level: level,
      environment: levelLogs[0]?.context?.environment || 'unknown'
    };

    // Format log entries for Loki
    const values = levelLogs.map(log => {
      const timestamp = new Date(log.timestamp).getTime() * 1000000; // Nanoseconds
      const logLine = JSON.stringify({
        message: log.message,
        context: log.context,
        data: log.data,
        error: log.error,
        performance: log.performance,
        server: log.server
      });
      return [String(timestamp), logLine];
    });

    return {
      stream: labels,
      values: values
    };
  });

  // Push to Loki
  try {
    await axios.post(LOKI_PUSH_ENDPOINT, {
      streams: streams
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
  } catch (error) {
    console.error('Failed to push to Loki:', error.message);
    // Don't throw - we don't want to fail the request if Loki is down
  }
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Python / FastAPI

```python
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
from datetime import datetime

app = FastAPI()

LOKI_URL = os.getenv('LOKI_URL', 'http://localhost:3100')
LOKI_PUSH_ENDPOINT = f'{LOKI_URL}/loki/api/v1/push'

class LogContext(BaseModel):
    userId: Optional[str] = None
    sessionId: str
    route: str
    userAgent: str
    viewport: Dict[str, int]
    environment: str

class LogError(BaseModel):
    message: str
    stack: Optional[str] = None
    name: str

class LogPerformance(BaseModel):
    memory: Optional[Dict[str, int]] = None
    timing: Optional[Dict[str, float]] = None

class LogEntry(BaseModel):
    level: str
    message: str
    timestamp: str
    context: LogContext
    data: Optional[Dict[str, Any]] = None
    error: Optional[LogError] = None
    performance: Optional[LogPerformance] = None

class LogBatch(BaseModel):
    logs: List[LogEntry]

@app.post('/api/logs')
async def receive_logs(batch: LogBatch, request: Request):
    try:
        if not batch.logs or len(batch.logs) == 0:
            raise HTTPException(status_code=400, detail='No logs provided')

        if len(batch.logs) > 100:
            raise HTTPException(status_code=413, detail='Too many logs in batch')

        # Enrich logs
        enriched_logs = []
        for log in batch.logs:
            log_dict = log.dict()
            log_dict['server'] = {
                'ip': request.client.host,
                'receivedAt': datetime.utcnow().isoformat()
            }
            enriched_logs.append(log_dict)

        # Push to Loki
        await push_to_loki(enriched_logs)

        return {'success': True, 'count': len(batch.logs)}

    except Exception as e:
        print(f'Failed to process logs: {e}')
        raise HTTPException(status_code=500, detail='Failed to process logs')

async def push_to_loki(logs: List[Dict]):
    # Group by level
    logs_by_level = {}
    for log in logs:
        level = log['level']
        if level not in logs_by_level:
            logs_by_level[level] = []
        logs_by_level[level].append(log)

    # Create streams
    streams = []
    for level, level_logs in logs_by_level.items():
        labels = {
            'app': 'bf1942-ui',
            'level': level,
            'environment': level_logs[0]['context']['environment']
        }

        values = []
        for log in level_logs:
            timestamp = int(datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).timestamp() * 1e9)
            log_line = json.dumps({
                'message': log['message'],
                'context': log['context'],
                'data': log.get('data'),
                'error': log.get('error'),
                'performance': log.get('performance'),
                'server': log.get('server')
            })
            values.append([str(timestamp), log_line])

        streams.append({
            'stream': labels,
            'values': values
        })

    # Send to Loki
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                LOKI_PUSH_ENDPOINT,
                json={'streams': streams},
                timeout=5.0
            )
    except Exception as e:
        print(f'Failed to push to Loki: {e}')
        # Don't raise - log the error but continue
```

### Go / Gin

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
    "time"

    "github.com/gin-gonic/gin"
)

type LogEntry struct {
    Level       string                 `json:"level"`
    Message     string                 `json:"message"`
    Timestamp   string                 `json:"timestamp"`
    Context     map[string]interface{} `json:"context"`
    Data        map[string]interface{} `json:"data,omitempty"`
    Error       map[string]interface{} `json:"error,omitempty"`
    Performance map[string]interface{} `json:"performance,omitempty"`
}

type LogBatch struct {
    Logs []LogEntry `json:"logs"`
}

type LokiStream struct {
    Stream map[string]string `json:"stream"`
    Values [][]string        `json:"values"`
}

type LokiPayload struct {
    Streams []LokiStream `json:"streams"`
}

var lokiURL = getEnv("LOKI_URL", "http://localhost:3100")
var lokiPushEndpoint = lokiURL + "/loki/api/v1/push"

func main() {
    r := gin.Default()
    r.POST("/api/logs", handleLogs)
    r.Run(":3000")
}

func handleLogs(c *gin.Context) {
    var batch LogBatch

    if err := c.ShouldBindJSON(&batch); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
        return
    }

    if len(batch.Logs) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No logs provided"})
        return
    }

    if len(batch.Logs) > 100 {
        c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Too many logs"})
        return
    }

    // Enrich logs
    for i := range batch.Logs {
        batch.Logs[i].Data["server"] = map[string]interface{}{
            "ip":         c.ClientIP(),
            "receivedAt": time.Now().UTC().Format(time.RFC3339),
        }
    }

    // Push to Loki
    if err := pushToLoki(batch.Logs); err != nil {
        fmt.Printf("Failed to push to Loki: %v\n", err)
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "count":   len(batch.Logs),
    })
}

func pushToLoki(logs []LogEntry) error {
    // Group by level
    logsByLevel := make(map[string][]LogEntry)
    for _, log := range logs {
        logsByLevel[log.Level] = append(logsByLevel[log.Level], log)
    }

    // Create streams
    streams := []LokiStream{}
    for level, levelLogs := range logsByLevel {
        stream := LokiStream{
            Stream: map[string]string{
                "app":         "bf1942-ui",
                "level":       level,
                "environment": levelLogs[0].Context["environment"].(string),
            },
            Values: [][]string{},
        }

        for _, log := range levelLogs {
            timestamp, _ := time.Parse(time.RFC3339, log.Timestamp)
            nanos := fmt.Sprintf("%d", timestamp.UnixNano())

            logLine, _ := json.Marshal(map[string]interface{}{
                "message":     log.Message,
                "context":     log.Context,
                "data":        log.Data,
                "error":       log.Error,
                "performance": log.Performance,
            })

            stream.Values = append(stream.Values, []string{nanos, string(logLine)})
        }

        streams = append(streams, stream)
    }

    payload := LokiPayload{Streams: streams}
    jsonData, _ := json.Marshal(payload)

    resp, err := http.Post(lokiPushEndpoint, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("Loki returned %d", resp.StatusCode)
    }

    return nil
}

func getEnv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return fallback
}
```

## Loki Labels Strategy

Use these labels for efficient querying:

```
{
  app: "bf1942-ui",           // Application identifier
  level: "error",             // Log level
  environment: "production",  // Environment
  userId: "user-123",        // Optional: for user-specific queries
  route: "/tournaments"      // Optional: for route-specific queries
}
```

### Example LogQL Queries

```logql
# All errors in the last hour
{app="bf1942-ui", level="error"} |= "" | json

# Errors from a specific user
{app="bf1942-ui", level="error", userId="user-123"} |= "" | json

# Network errors
{app="bf1942-ui", level="error"} |= "Network request failed" | json

# Errors on a specific route
{app="bf1942-ui"} |= "" | json | route="/tournaments" | level="error"

# Error rate by route
sum by (route) (rate({app="bf1942-ui", level="error"}[5m]))
```

## Grafana Dashboard Setup

Create panels to visualize:

1. **Error Rate**: `sum(rate({app="bf1942-ui", level="error"}[5m]))`
2. **Error by Route**: `sum by (route) (rate({app="bf1942-ui", level="error"}[5m]))`
3. **Error Types**: `sum by (error_name) (rate({app="bf1942-ui", level="error"}[5m]))`
4. **User Sessions**: `count_over_time({app="bf1942-ui"} | json | sessionId != "" [1h])`
5. **Performance Metrics**: Extract timing data from performance logs

## Security Considerations

1. **Rate Limiting**: Limit requests per IP to prevent abuse
2. **Authentication**: Consider requiring API key for production
3. **Sanitization**: Validate and sanitize all log data
4. **Size Limits**: Limit batch size and individual log size
5. **PII Protection**: Strip sensitive data before storing

## Production Checklist

- [ ] Backend endpoint implemented and tested
- [ ] Loki is running and accessible
- [ ] Grafana dashboards configured
- [ ] Alerts set up for error spikes
- [ ] Rate limiting configured
- [ ] Log retention policy configured in Loki
- [ ] Monitoring for the logging pipeline itself
- [ ] Documentation updated with team procedures

## Troubleshooting

### Logs not reaching Loki?

1. Check backend endpoint is receiving logs
2. Verify Loki URL configuration
3. Check Loki is running: `curl http://localhost:3100/ready`
4. Check network connectivity between backend and Loki
5. Review backend logs for errors

### High volume of logs?

1. Implement sampling at backend level
2. Filter debug logs in production
3. Increase log retention to match volume
4. Consider log aggregation before Loki

### Performance issues?

1. Use asynchronous Loki pushes
2. Batch logs at backend level
3. Set up buffering/queue (Redis, RabbitMQ)
4. Scale Loki horizontally
