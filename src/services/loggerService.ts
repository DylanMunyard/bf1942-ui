/**
 * Frontend Logger Service
 *
 * Provides structured logging with automatic context enrichment and batching
 * for integration with LGTM observability stack (Loki, Grafana, Tempo, Prometheus).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  sessionId: string;
  route: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  environment: 'development' | 'production';
}

export interface LogError {
  message: string;
  stack?: string;
  name: string;
}

export interface LogPerformance {
  memory?: {
    used: number;
    total: number;
  };
  timing?: Record<string, number>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
  data?: Record<string, any>;
  error?: LogError;
  performance?: LogPerformance;
}

interface LoggerConfig {
  endpoint: string;
  minLevel: LogLevel;
  batchSize: number;
  batchInterval: number;
  debugSampleRate: number;
  maxBufferSize: number;
  enabled: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class LoggerService {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private sessionId: string;
  private flushTimer?: number;
  private userId?: string;

  constructor() {
    this.config = {
      endpoint: import.meta.env.VITE_LOG_ENDPOINT || '/api/logs',
      minLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
      batchSize: Number(import.meta.env.VITE_LOG_BATCH_SIZE) || 10,
      batchInterval: Number(import.meta.env.VITE_LOG_BATCH_INTERVAL) || 5000,
      debugSampleRate: Number(import.meta.env.VITE_LOG_DEBUG_SAMPLE_RATE) || 0.1,
      maxBufferSize: Number(import.meta.env.VITE_LOG_MAX_BUFFER_SIZE) || 100,
      enabled: import.meta.env.VITE_LOG_ENABLED !== 'false',
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();

    // Handle page unload - flush remaining logs
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Handle visibility change - flush when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush(false);
      }
    });
  }

  /**
   * Set the current user ID for log context enrichment
   */
  public setUserId(userId: string | undefined): void {
    this.userId = userId;
  }

  /**
   * Log a debug message (sampled in production)
   */
  public debug(message: string, data?: Record<string, any>): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    // Sample debug logs in production
    if (this.config.environment === 'production' && Math.random() > this.config.debugSampleRate) {
      return;
    }

    this.log('debug', message, data);
  }

  /**
   * Log an informational message
   */
  public info(message: string, data?: Record<string, any>): void {
    if (!this.shouldLog('info')) {
      return;
    }
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, data?: Record<string, any>): void {
    if (!this.shouldLog('warn')) {
      return;
    }
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error | unknown, data?: Record<string, any>): void {
    if (!this.shouldLog('error')) {
      return;
    }

    const logError = error ? this.serializeError(error) : undefined;
    this.log('error', message, data, logError);

    // Also log to console in development for immediate visibility
    if (import.meta.env.DEV) {
      console.error(`[Logger] ${message}`, error, data);
    }
  }

  /**
   * Log performance metrics
   */
  public logPerformance(message: string, metrics: LogPerformance, data?: Record<string, any>): void {
    if (!this.shouldLog('info')) {
      return;
    }

    const entry = this.createLogEntry('info', message, data);
    entry.performance = metrics;
    this.addToBuffer(entry);
  }

  /**
   * Manually flush logs (useful before navigation or critical errors)
   */
  public async flush(synchronous = false): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logs = [...this.buffer];
    this.buffer = [];

    if (synchronous) {
      // Use sendBeacon for synchronous sends (page unload)
      this.sendBeacon(logs);
    } else {
      // Use fetch for async sends
      await this.sendLogs(logs);
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: LogError
  ): void {
    const entry = this.createLogEntry(level, message, data, error);
    this.addToBuffer(entry);

    // Auto-flush on error level
    if (level === 'error') {
      this.flush(false);
    }
  }

  /**
   * Create a structured log entry with enriched context
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: LogError
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.getContext(),
      data: this.sanitizeData(data),
      error,
    };
  }

  /**
   * Get enriched context for log entries
   */
  private getContext(): LogContext {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      route: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      environment: import.meta.env.DEV ? 'development' : 'production',
    };
  }

  /**
   * Add memory usage if available
   */
  private getMemoryInfo(): LogPerformance['memory'] | undefined {
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
      };
    }
    return undefined;
  }

  /**
   * Serialize error objects to structured format
   */
  private serializeError(error: Error | unknown): LogError {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
      stack: undefined,
    };
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) {
      return undefined;
    }

    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'session'];

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Add log entry to buffer and trigger flush if needed
   */
  private addToBuffer(entry: LogEntry): void {
    if (!this.config.enabled) {
      return;
    }

    this.buffer.push(entry);

    // Enforce max buffer size - remove oldest entries
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.config.maxBufferSize);
    }

    // Auto-flush if batch size reached
    if (this.buffer.length >= this.config.batchSize) {
      this.flush(false);
    }
  }

  /**
   * Send logs to backend via fetch
   */
  private async sendLogs(logs: LogEntry[]): Promise<void> {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        // Don't log errors to prevent infinite loop
        if (import.meta.env.DEV) {
          console.warn(`Failed to send logs: ${response.status} ${response.statusText}`);
        }
      }
    } catch (err) {
      // Silently fail - don't want logging errors to break the app
      if (import.meta.env.DEV) {
        console.warn('Failed to send logs:', err);
      }
    }
  }

  /**
   * Send logs via sendBeacon for synchronous sends (page unload)
   */
  private sendBeacon(logs: LogEntry[]): void {
    try {
      const blob = new Blob([JSON.stringify({ logs })], { type: 'application/json' });
      navigator.sendBeacon(this.config.endpoint, blob);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Failed to send logs via beacon:', err);
      }
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush(false);
    }, this.config.batchInterval);
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Export singleton instance
export const logger = new LoggerService();

// Export for testing
export { LoggerService };
