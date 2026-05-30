/**
 * useMonitoringMetrics Hook
 *
 * React hook để fetch và monitor trade execution metrics từ RaaS Gateway
 *
 * Features:
 * - Auto-polling mỗi 30s (configurable)
 * - JWT/mk_ API key authentication
 * - Loading/error states
 * - Manual refresh function
 * - Tier-based feature gating
 *
 * @example
 * ```tsx
 * const { metrics, latency, anomalies, isLoading, error, refresh } = useMonitoringMetrics({
 *   tenantId: 'tenant-123',
 *   apiKey: 'mk_xxx',
 *   tier: 'pro',
 *   refreshInterval: 30000,
 * })
 * ```
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RaasMetricsClient,
  TradeMetrics,
  LatencyData,
  AnomalyAlert,
  Tier,
  createRaasMetricsClient,
} from '@/lib/raas-metrics-client'

export interface UseMonitoringMetricsOptions {
  tenantId: string
  apiKey: string // mk_ API key
  tier?: Tier
  refreshInterval?: number // ms, default 30000
  baseUrl?: string
  enabled?: boolean // auto-fetch toggle, default true
}

export interface UseMonitoringMetricsReturn {
  // Data
  metrics: TradeMetrics | null
  latency: LatencyData | null
  anomalies: AnomalyAlert[]

  // States
  isLoading: boolean
  isError: boolean
  error: string | null
  isRefreshing: boolean

  // Actions
  refresh: () => Promise<void>
  clearError: () => void

  // Client access
  client: RaasMetricsClient | null
}

export function useMonitoringMetrics({
  tenantId,
  apiKey,
  tier = 'free',
  refreshInterval = 30000,
  baseUrl,
  enabled = true,
}: UseMonitoringMetricsOptions): UseMonitoringMetricsReturn {
  // States
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null)
  const [latency, setLatency] = useState<LatencyData | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Client ref (không re-create on re-render)
  const clientRef = useRef<RaasMetricsClient | null>(null)

  // Initialize client
  useEffect(() => {
    const metricsClient = createRaasMetricsClient({
      baseUrl: baseUrl || process.env.NEXT_PUBLIC_RAAS_GATEWAY_URL || 'https://raas.agencyos.network',
      apiKey,
      tenantId,
    })

    metricsClient.setTier(tier)
    clientRef.current = metricsClient

    return () => {
      metricsClient.cleanup()
    }
  }, [apiKey, tenantId, tier, baseUrl])

  // Fetch metrics function
  const fetchMetrics = useCallback(async (isRefresh = false) => {
    const client = clientRef.current
    if (!client) return

    try {
      if (!isRefresh) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setIsError(false)
      setError(null)

      // Fetch trade metrics
      const tradeMetrics = await client.getTradeMetrics()
      setMetrics(tradeMetrics)

      // Fetch latency percentiles (PRO+)
      if (tier !== 'free') {
        try {
          const latencyData = await client.getLatencyPercentiles()
          setLatency(latencyData)
        } catch (latencyError) {
          console.warn('Failed to fetch latency data:', latencyError)
          // Không fail cả hook, chỉ log warning
        }
      }

      // Fetch anomalies (ENTERPRISE only)
      if (tier === 'enterprise') {
        try {
          const anomalyList = await client.getAnomalies()
          setAnomalies(anomalyList)
        } catch (anomalyError) {
          console.warn('Failed to fetch anomalies:', anomalyError)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics'
      setError(errorMessage)
      setIsError(true)
      console.error('[useMonitoringMetrics] Fetch error:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [tier])

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchMetrics(true)
  }, [fetchMetrics])

  // Clear error function
  const clearError = useCallback(() => {
    setError(null)
    setIsError(false)
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (!enabled || !clientRef.current) return

    // Initial fetch
    fetchMetrics(false)

    // Setup auto-refresh
    const intervalId = setInterval(() => {
      fetchMetrics(true)
    }, refreshInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, refreshInterval, fetchMetrics])

  // Subscribe to real-time updates (PRO/ENTERPRISE)
  useEffect(() => {
    if (!enabled || !clientRef.current || tier === 'free') return

    const client = clientRef.current
    let unsubscribe: (() => void) | undefined

    // Subscribe to real-time updates
    unsubscribe = client.subscribeToUpdates((newMetrics) => {
      setMetrics(newMetrics)
      setIsLoading(false)
      setError(null)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [enabled, tier])

  return {
    // Data
    metrics,
    latency,
    anomalies,

    // States
    isLoading,
    isError,
    error,
    isRefreshing,

    // Actions
    refresh,
    clearError,

    // Client access
    client: clientRef.current,
  }
}

export default useMonitoringMetrics
