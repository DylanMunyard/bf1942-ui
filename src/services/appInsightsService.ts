import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import router from '@/router'

class AppInsightsService {
  private appInsights: ApplicationInsights | null = null
  private initialized = false

  /**
   * Initialize Application Insights with the connection string
   */
  initialize(connectionString: string) {
    if (this.initialized || !connectionString) {
      return
    }

    try {
      // Initialize Application Insights
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString: connectionString,
          enableAutoRouteTracking: false, // We'll handle route tracking manually for Vue Router
          enableCorsCorrelation: true, // Enable correlation with backend
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          enableAjaxErrorStatusText: true,
          enableAjaxPerfTracking: true,
          maxAjaxCallsPerView: -1, // Track all AJAX calls
          enableUnhandledPromiseRejectionTracking: true
        }
      })

      // Load Application Insights
      this.appInsights.loadAppInsights()

      // Set up automatic page view tracking for Vue Router
      this.setupRouterTracking()

      // Set up global error handlers
      this.setupErrorHandlers()

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize Application Insights:', error)
    }
  }

  /**
   * Flush queued telemetry immediately. Call after init to send the first batch without waiting.
   */
  flush(): void {
    if (!this.appInsights) return
    try {
      this.appInsights.flush(true)
    } catch (error) {
      console.error('Application Insights flush failed:', error)
    }
  }

  /**
   * Flush after a delay (e.g. in dev so first page view appears in the portal quickly).
   */
  flushAfterDelay(ms: number): void {
    setTimeout(() => this.flush(), ms)
  }

  /**
   * Set up automatic page view tracking for Vue Router
   */
  private setupRouterTracking() {
    if (!this.appInsights) return

    // Track initial page view
    router.afterEach((to, from) => {
      // Track page view with route information
      this.trackPageView({
        name: to.name as string || to.path,
        uri: to.fullPath,
        properties: {
          routeName: to.name as string || 'unknown',
          routePath: to.path,
          routeParams: JSON.stringify(to.params),
          routeQuery: JSON.stringify(to.query),
          fromRoute: from.name as string || from.path
        }
      })
    })

    // Track initial page load
    if (router.currentRoute.value) {
      const route = router.currentRoute.value
      this.trackPageView({
        name: route.name as string || route.path,
        uri: route.fullPath,
        properties: {
          routeName: route.name as string || 'unknown',
          routePath: route.path,
          initialLoad: 'true'
        }
      })
    }
  }

  /**
   * Set up global error handlers
   */
  private setupErrorHandlers() {
    if (!this.appInsights) return

    // Track unhandled errors
    window.addEventListener('error', (event) => {
      this.trackException(
        event.error || new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno?.toString() || '',
          colno: event.colno?.toString() || '',
          errorType: 'unhandledError'
        },
        3 // SeverityLevel.Error
      )
    })

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      this.trackException(
        error,
        {
          errorType: 'unhandledPromiseRejection',
          reason: String(event.reason)
        },
        3 // SeverityLevel.Error
      )
    })
  }

  /**
   * Track a page view
   */
  trackPageView(pageView?: {
    name?: string
    uri?: string
    properties?: { [key: string]: string }
  }) {
    if (!this.appInsights) return

    try {
      this.appInsights.trackPageView(pageView)
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
    if (!this.appInsights) return

    try {
      this.appInsights.trackEvent(
        { name },
        {
          ...properties,
          timestamp: new Date().toISOString()
        },
        measurements
      )
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  /**
   * Track an exception
   */
  trackException(exception: Error, properties?: { [key: string]: string }, severityLevel?: number) {
    if (!this.appInsights) return

    try {
      this.appInsights.trackException(
        { exception, severityLevel },
        {
          ...properties,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      )
    } catch (error) {
      console.error('Failed to track exception:', error)
    }
  }

  /**
   * Track a trace message
   */
  trackTrace(message: string, severityLevel?: number, properties?: { [key: string]: string }) {
    if (!this.appInsights) return

    try {
      this.appInsights.trackTrace(
        { message, severityLevel },
        {
          ...properties,
          timestamp: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Failed to track trace:', error)
    }
  }

  /**
   * Track a metric
   */
  trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: { [key: string]: string }) {
    if (!this.appInsights) return

    try {
      this.appInsights.trackMetric(
        { name, average, sampleCount, min, max },
        {
          ...properties,
          timestamp: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Failed to track metric:', error)
    }
  }

  /**
   * Set user context (call after authentication)
   */
  setAuthenticatedUser(userId: string, accountId?: string) {
    if (!this.appInsights) return

    try {
      this.appInsights.setAuthenticatedUserContext(userId, accountId, true)
    } catch (error) {
      console.error('Failed to set authenticated user context:', error)
    }
  }

  /**
   * Clear user context (call on logout)
   */
  clearAuthenticatedUser() {
    if (!this.appInsights) return

    try {
      this.appInsights.clearAuthenticatedUserContext()
    } catch (error) {
      console.error('Failed to clear authenticated user context:', error)
    }
  }

  /**
   * Get the Application Insights instance (for advanced usage)
   */
  getInstance(): ApplicationInsights | null {
    return this.appInsights
  }

  /**
   * Check if Application Insights is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.appInsights !== null
  }
}

export const appInsightsService = new AppInsightsService()
