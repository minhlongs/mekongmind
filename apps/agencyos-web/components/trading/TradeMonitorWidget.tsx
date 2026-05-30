'use client'

/**
 * TradeMonitorWidget
 *
 * Dashboard widget hiển thị trade execution metrics từ RaaS Gateway
 *
 * Features:
 * - Live trade execution status (streaming)
 * - Latency percentiles: p50, p95, p99 với sparkline chart
 * - Error rate % với trend indicator và color coding
 * - RaaS usage sync status
 * - Anomaly alerts (tier-based)
 *
 * Tier-based features:
 * - FREE: Basic metrics, 10s polling
 * - PRO: Latency percentiles, 5s polling, realtime updates
 * - ENTERPRISE: Anomaly detection, 2s polling, priority support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Activity, AlertTriangle, CheckCircle, Clock, RefreshCw, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RaasMetricsClient,
  TradeMetrics,
  LatencyData,
  AnomalyAlert,
  Tier,
  createRaasMetricsClient,
} from '@/lib/raas-metrics-client'

export interface TradeMonitorWidgetProps {
  tenantId: string
  apiKey: string // mk_ API key
  tier?: 'free' | 'pro' | 'enterprise'
  className?: string
  showHeader?: boolean
  compact?: boolean
}

/**
 * Sparkline chart component cho latency visualization
 */
function LatencySparkline({
  data,
  color = '#22c55e',
  height = 40,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  if (data.length === 0) return null

  const width = 120
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((value - min) / range) * height
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill={color}
            className="opacity-60"
          />
        )
      })}
    </svg>
  )
}

/**
 * Error rate indicator với color coding
 */
function ErrorRateIndicator({
  errorRate,
  trend,
}: {
  errorRate: number
  trend: 'up' | 'down' | 'stable'
}) {
  const getColor = () => {
    if (errorRate < 1) return 'text-green-500'
    if (errorRate < 5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getBgColor = () => {
    if (errorRate < 1) return 'bg-green-500/10'
    if (errorRate < 5) return 'bg-yellow-500/10'
    return 'bg-red-500/10'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingUp : Activity

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', getBgColor())}>
      <div className={cn('text-2xl font-bold', getColor())}>
        {errorRate.toFixed(2)}%
      </div>
      <TrendIcon
        className={cn('h-4 w-4', getColor(), trend === 'up' && 'rotate-180')}
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * Sync status badge
 */
function SyncStatusBadge({
  status,
  latency,
}: {
  status: 'synced' | 'syncing' | 'error'
  latency?: number
}) {
  const config = {
    synced: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      label: 'Synced',
      animate: false,
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      label: 'Syncing',
      animate: true,
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      label: 'Sync Error',
      animate: false,
    },
  }

  const { icon: Icon, color, bg, label, animate } = config[status]

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', bg)}>
      <Icon className={cn('h-4 w-4', color, animate && 'animate-spin')} aria-hidden="true" />
      <span className={cn('text-xs font-medium', color)}>{label}</span>
      {latency && status === 'synced' && (
        <span className="text-xs text-zinc-500">{latency}ms</span>
      )}
    </div>
  )
}

/**
 * Anomaly alert banner (ENTERPRISE only)
 */
function AnomalyAlertBanner({ anomalies }: { anomalies: AnomalyAlert[] }) {
  if (anomalies.length === 0) return null

  const severityColors = {
    low: 'border-blue-500/50 bg-blue-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    critical: 'border-red-500/50 bg-red-500/10',
  }

  const severityIcons = {
    low: AlertTriangle,
    medium: AlertTriangle,
    high: Zap,
    critical: Zap,
  }

  return (
    <div className="space-y-2">
      {anomalies.slice(0, 3).map((anomaly) => {
        const Icon = severityIcons[anomaly.severity]
        return (
          <div
            key={anomaly.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border',
              severityColors[anomaly.severity]
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium">{anomaly.message}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Expected: {anomaly.expectedValue} | Actual: {anomaly.actualValue}
              </p>
            </div>
            <span className="text-xs text-zinc-500">{anomaly.severity}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Main widget component
 */
export function TradeMonitorWidget({
  tenantId,
  apiKey,
  tier = 'free',
  className,
  showHeader = true,
  compact = false,
}: TradeMonitorWidgetProps) {
  // State
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null)
  const [latencyData, setLatencyData] = useState<LatencyData | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<RaasMetricsClient | null>(null)

  // Initialize client
  useEffect(() => {
    const metricsClient = createRaasMetricsClient({
      baseUrl: process.env.NEXT_PUBLIC_RAAS_GATEWAY_URL || 'https://raas.agencyos.network',
      apiKey,
      tenantId,
    })

    metricsClient.setTier(tier)
    setClient(metricsClient)

    return () => {
      metricsClient.cleanup()
    }
  }, [apiKey, tenantId, tier])

  // Subscribe to updates
  useEffect(() => {
    if (!client) return

    const unsubscribe = client.subscribeToUpdates((newMetrics) => {
      setMetrics(newMetrics)
      setIsLoading(false)
      setError(null)
    })

    // Initial fetch
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        const [tradeMetrics, latency] = await Promise.all([
          client.getTradeMetrics(),
          tier !== 'free' ? client.getLatencyPercentiles() : Promise.resolve(null),
          tier === 'enterprise' ? client.getAnomalies() : Promise.resolve([]),
        ])

        setMetrics(tradeMetrics)
        if (latency) setLatencyData(latency)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
        setIsLoading(false)
      }
    }

    fetchInitialData()

    return () => {
      unsubscribe()
    }
  }, [client, tier])

  // Fetch anomalies periodically for enterprise
  useEffect(() => {
    if (tier !== 'enterprise' || !client) return

    const fetchAnomalies = async () => {
      try {
        const anomalyList = await client.getAnomalies()
        setAnomalies(anomalyList)
      } catch (error) {
        console.error('Failed to fetch anomalies:', error)
      }
    }

    fetchAnomalies()
    const interval = setInterval(fetchAnomalies, 30000) // 30s
    return () => clearInterval(interval)
  }, [client, tier])

  // Compute sparkline data from latency history
  const sparklineData = useMemo(() => {
    if (!latencyData?.history || latencyData.history.length === 0) return []
    return latencyData.history
      .filter((p) => p.percentile === 'p95')
      .map((p) => p.value)
  }, [latencyData])

  // Render loading state
  if (isLoading && !metrics) {
    return (
      <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/50 p-6', className)}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 text-zinc-600 animate-spin" aria-hidden="true" />
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className={cn('rounded-xl border border-red-900/50 bg-red-900/10 p-6', className)}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-medium text-red-500">Failed to load metrics</h3>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const features = client?.getTierFeatures()

  return (
    <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/50 p-6', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-purple-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-white">Trade Monitor</h3>
          </div>
          <SyncStatusBadge
            status={metrics?.raasSyncStatus || 'syncing'}
            latency={metrics?.syncLatencyMs}
          />
        </div>
      )}

      {/* Metrics Grid */}
      <div className={cn('grid gap-4', compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4')}>
        {/* Error Rate */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <span className="text-xs text-zinc-500">Error Rate</span>
          </div>
          {metrics && (
            <ErrorRateIndicator errorRate={metrics.errorRate} trend={metrics.errorRateTrend} />
          )}
        </div>

        {/* Latency Percentiles */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <span className="text-xs text-zinc-500">Latency</span>
          </div>
          {metrics && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">P50</span>
                <span className="text-white font-medium">{metrics.latencyP50}ms</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">P95</span>
                <span className="text-white font-medium">{metrics.latencyP95}ms</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">P99</span>
                <span className="text-white font-medium">{metrics.latencyP99}ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Trade Volume */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <span className="text-xs text-zinc-500">Trades</span>
          </div>
          {metrics && (
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metrics.successfulTrades}/{metrics.totalTrades}
              </div>
              <div className="text-xs text-green-500">
                {metrics.totalTrades > 0
                  ? ((metrics.successfulTrades / metrics.totalTrades) * 100).toFixed(1)
                  : 0}% success
              </div>
            </div>
          )}
        </div>

        {/* Sparkline Chart (PRO+) */}
        {tier !== 'free' && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              <span className="text-xs text-zinc-500">Latency Trend</span>
            </div>
            {sparklineData.length > 0 ? (
              <LatencySparkline data={sparklineData} color="#a855f7" height={40} />
            ) : (
              <div className="text-xs text-zinc-600">No data</div>
            )}
          </div>
        )}
      </div>

      {/* Anomaly Alerts (ENTERPRISE only) */}
      {tier === 'enterprise' && anomalies.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            <span className="text-xs font-medium text-zinc-400">Active Anomalies</span>
          </div>
          <AnomalyAlertBanner anomalies={anomalies} />
        </div>
      )}

      {/* Tier Badge */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {features?.realtimeUpdates ? 'Real-time updates' : 'Polling updates'}
          </span>
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              tier === 'free' && 'bg-zinc-800 text-zinc-400',
              tier === 'pro' && 'bg-purple-500/20 text-purple-400',
              tier === 'enterprise' && 'bg-yellow-500/20 text-yellow-400'
            )}
          >
            {tier.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default TradeMonitorWidget
