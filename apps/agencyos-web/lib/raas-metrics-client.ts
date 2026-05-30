/**
 * RaaS Metrics Client
 *
 * Client library để fetch trade execution metrics từ RaaS Gateway
 * Cung cấp real-time monitoring cho dashboard widget
 *
 * Features:
 * - Trade execution metrics (success rate, volume, latency)
 * - Latency percentiles (p50, p95, p99)
 * - Error rate tracking với trend analysis
 * - WebSocket real-time updates
 * - Tier-based feature gating (FREE/PRO/ENTERPRISE)
 */

export interface TradeMetrics {
  tenantId: string
  timestamp: string

  // Execution metrics
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  errorRate: number // percentage 0-100
  errorRateTrend: 'up' | 'down' | 'stable'

  // Latency metrics (milliseconds)
  latencyP50: number
  latencyP95: number
  latencyP99: number
  avgLatency: number

  // RaaS usage sync
  raasSyncStatus: 'synced' | 'syncing' | 'error'
  lastSyncAt?: string
  syncLatencyMs?: number

  // Anomaly detection (ENTERPRISE only)
  anomalies?: AnomalyAlert[]
}

export interface AnomalyAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'latency_spike' | 'error_rate_spike' | 'volume_drop' | 'unusual_pattern'
  message: string
  detectedAt: string
  metric: string
  expectedValue: number
  actualValue: number
  threshold: number
}

export interface LatencyData {
  timestamp: string
  p50: number
  p95: number
  p99: number
  history: LatencyPoint[]
}

export interface LatencyPoint {
  timestamp: string
  value: number
  percentile: 'p50' | 'p95' | 'p99'
}

export interface RaasMetricsConfig {
  baseUrl: string
  apiKey?: string
  tenantId?: string
  timeout?: number
  pollingInterval?: number // ms, default 5000
}

export type Tier = 'free' | 'pro' | 'enterprise'

export interface TierFeatures {
  realtimeUpdates: boolean
  latencyPercentiles: boolean
  anomalyDetection: boolean
  pollingInterval: number
  historyDepth: number // number of data points
}

const TIER_FEATURES: Record<Tier, TierFeatures> = {
  free: {
    realtimeUpdates: false,
    latencyPercentiles: false,
    anomalyDetection: false,
    pollingInterval: 10000, // 10s
    historyDepth: 10,
  },
  pro: {
    realtimeUpdates: true,
    latencyPercentiles: true,
    anomalyDetection: false,
    pollingInterval: 5000, // 5s
    historyDepth: 50,
  },
  enterprise: {
    realtimeUpdates: true,
    latencyPercentiles: true,
    anomalyDetection: true,
    pollingInterval: 2000, // 2s
    historyDepth: 200,
  },
}

export class RaasMetricsClient {
  private baseUrl: string
  private apiKey?: string
  private tenantId?: string
  private timeout: number
  private pollingInterval: number
  private tier: Tier = 'free'
  private wsConnection?: WebSocket
  private pollIntervalId?: NodeJS.Timeout
  private listeners: Set<(metrics: TradeMetrics) => void> = new Set()
  private latencyHistory: LatencyPoint[] = []

  constructor(config: RaasMetricsConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.tenantId = config.tenantId
    this.timeout = config.timeout || 30000
    this.pollingInterval = config.pollingInterval || 5000
  }

  /**
   * Set tenant tier for feature gating
   */
  setTier(tier: Tier): void {
    this.tier = tier
    const features = TIER_FEATURES[tier]
    this.pollingInterval = features.pollingInterval
  }

  /**
   * Get tier features
   */
  getTierFeatures(): TierFeatures {
    return TIER_FEATURES[this.tier]
  }

  /**
   * Tạo HTTP headers với authentication
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Support both mk_ API key format and Bearer token
    if (this.apiKey) {
      if (this.apiKey.startsWith('mk_')) {
        headers['X-API-Key'] = this.apiKey
      } else {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }
    }

    return headers
  }

  /**
   * Timeout wrapper cho fetch requests
   */
  private async fetchWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.getHeaders(), ...options.headers },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }

  /**
   * GET /v1/metrics/trades - Fetch trade execution metrics
   */
  async getTradeMetrics(tenantId?: string): Promise<TradeMetrics> {
    const tid = tenantId || this.tenantId
    if (!tid) {
      throw new Error('Tenant ID is required. Provide it in constructor or method call.')
    }

    const endpoint = `/v1/metrics/trades?tenantId=${encodeURIComponent(tid)}`
    return this.fetchWithTimeout<TradeMetrics>(endpoint, { method: 'GET' })
  }

  /**
   * GET /v1/metrics/latency - Fetch latency percentiles với history
   */
  async getLatencyPercentiles(tenantId?: string): Promise<LatencyData> {
    const tid = tenantId || this.tenantId
    if (!tid) {
      throw new Error('Tenant ID is required')
    }

    const features = TIER_FEATURES[this.tier]
    const endpoint = `/v1/metrics/latency?tenantId=${encodeURIComponent(tid)}&depth=${features.historyDepth}`

    const data = await this.fetchWithTimeout<LatencyData>(endpoint, { method: 'GET' })

    // Store history for sparkline
    if (data.history) {
      this.latencyHistory = data.history
    }

    return data
  }

  /**
   * GET /v1/metrics/anomalies - Fetch anomaly alerts (ENTERPRISE only)
   */
  async getAnomalies(tenantId?: string): Promise<AnomalyAlert[]> {
    if (this.tier !== 'enterprise') {
      throw new Error('Anomaly detection is only available for Enterprise tier')
    }

    const tid = tenantId || this.tenantId
    if (!tid) {
      throw new Error('Tenant ID is required')
    }

    const endpoint = `/v1/metrics/anomalies?tenantId=${encodeURIComponent(tid)}`
    return this.fetchWithTimeout<AnomalyAlert[]>(endpoint, { method: 'GET' })
  }

  /**
   * Subscribe to real-time metrics updates
   *
   * Uses WebSocket if available (PRO/ENTERPRISE), falls back to polling
   *
   * @param callback - Called whenever new metrics arrive
   * @returns Unsubscribe function
   */
  subscribeToUpdates(callback: (metrics: TradeMetrics) => void): () => void {
    this.listeners.add(callback)
    const features = TIER_FEATURES[this.tier]

    // Start polling if realtime updates not available
    if (!features.realtimeUpdates || typeof WebSocket === 'undefined') {
      this.startPolling()
    } else {
      this.connectWebSocket()
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
      if (this.listeners.size === 0) {
        this.stopPolling()
        this.disconnectWebSocket()
      }
    }
  }

  /**
   * Start polling for metrics
   */
  private startPolling(): void {
    if (this.pollIntervalId) {
      return // Already polling
    }

    const poll = async () => {
      try {
        const metrics = await this.getTradeMetrics()
        this.notifyListeners(metrics)
      } catch (error) {
        console.error('[RaasMetricsClient] Polling error:', error)
      }
    }

    // Initial fetch
    poll()

    // Start polling interval
    const features = TIER_FEATURES[this.tier]
    this.pollIntervalId = setInterval(poll, features.pollingInterval)
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId)
      this.pollIntervalId = undefined
    }
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  private connectWebSocket(): void {
    if (this.wsConnection) {
      return // Already connected
    }

    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/v1/metrics/ws'
      this.wsConnection = new WebSocket(wsUrl)

      this.wsConnection.onopen = () => {
        console.log('[RaasMetricsClient] WebSocket connected')
        // Subscribe to tenant metrics
        if (this.tenantId) {
          this.wsConnection?.send(JSON.stringify({
            type: 'subscribe',
            tenantId: this.tenantId,
          }))
        }
      }

      this.wsConnection.onmessage = (event) => {
        try {
          const metrics: TradeMetrics = JSON.parse(event.data)
          this.notifyListeners(metrics)
        } catch (error) {
          console.error('[RaasMetricsClient] WebSocket message parse error:', error)
        }
      }

      this.wsConnection.onerror = (error) => {
        console.error('[RaasMetricsClient] WebSocket error:', error)
        // Fallback to polling
        this.disconnectWebSocket()
        this.startPolling()
      }

      this.wsConnection.onclose = () => {
        console.log('[RaasMetricsClient] WebSocket closed')
        this.wsConnection = undefined
        // Attempt reconnect after 5s
        setTimeout(() => this.connectWebSocket(), 5000)
      }
    } catch (error) {
      console.error('[RaasMetricsClient] WebSocket connection failed:', error)
      // Fallback to polling
      this.startPolling()
    }
  }

  /**
   * Disconnect WebSocket
   */
  private disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = undefined
    }
  }

  /**
   * Notify all listeners of new metrics
   */
  private notifyListeners(metrics: TradeMetrics): void {
    this.listeners.forEach(callback => {
      try {
        callback(metrics)
      } catch (error) {
        console.error('[RaasMetricsClient] Listener error:', error)
      }
    })
  }

  /**
   * Get latency history for sparkline chart
   */
  getLatencyHistory(): LatencyPoint[] {
    return this.latencyHistory
  }

  /**
   * Clear latency history
   */
  clearHistory(): void {
    this.latencyHistory = []
  }

  /**
   * Cleanup - disconnect WebSocket and stop polling
   */
  cleanup(): void {
    this.stopPolling()
    this.disconnectWebSocket()
    this.listeners.clear()
    this.clearHistory()
  }
}

/**
 * Factory function tạo RaasMetricsClient instance
 */
export function createRaasMetricsClient(
  config?: Partial<RaasMetricsConfig>
): RaasMetricsClient {
  const baseUrl =
    config?.baseUrl ||
    process.env.NEXT_PUBLIC_RAAS_GATEWAY_URL ||
    'https://raas.agencyos.network'

  const apiKey = config?.apiKey || process.env.NEXT_PUBLIC_RAAS_API_KEY
  const tenantId = config?.tenantId || process.env.NEXT_PUBLIC_RAAS_TENANT_ID

  return new RaasMetricsClient({
    baseUrl,
    apiKey,
    tenantId,
    timeout: config?.timeout,
    pollingInterval: config?.pollingInterval,
  })
}

export default RaasMetricsClient
