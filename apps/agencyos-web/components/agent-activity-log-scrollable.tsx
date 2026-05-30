'use client'

import { useEffect, useRef } from 'react'

export interface ActivityEntry {
  id: string
  timestamp: string
  agentName: string
  action: string
  level?: 'info' | 'success' | 'error' | 'warn'
}

const LEVEL_COLORS: Record<NonNullable<ActivityEntry['level']>, string> = {
  info:    'text-blue-400',
  success: 'text-green-400',
  error:   'text-red-400',
  warn:    'text-yellow-400',
}

const MOCK_ENTRIES: ActivityEntry[] = [
  { id: 'a01', timestamp: '09:45:12', agentName: 'Tôm Hùm',     action: 'Dispatched mission msn_003 to CC CLI',             level: 'info' },
  { id: 'a02', timestamp: '09:44:58', agentName: 'CC CLI',       action: 'Mission msn_002 step 6/10 complete',               level: 'info' },
  { id: 'a03', timestamp: '09:42:30', agentName: 'Antigravity',  action: 'Generated auto-CTO task: type_safety sweep',       level: 'info' },
  { id: 'a04', timestamp: '09:40:15', agentName: 'Tôm Hùm',     action: 'Brain respawned after idle timeout',               level: 'warn' },
  { id: 'a05', timestamp: '09:38:00', agentName: 'CC CLI',       action: 'Mission msn_001 completed — 497 leads extracted',  level: 'success' },
  { id: 'a06', timestamp: '09:35:44', agentName: 'Tôm Hùm',     action: 'M1 cooling triggered — load 8.4, RAM 180MB free',  level: 'warn' },
  { id: 'a07', timestamp: '09:33:10', agentName: 'CC CLI',       action: 'Mission msn_004 failed — quota exceeded',          level: 'error' },
  { id: 'a08', timestamp: '09:30:05', agentName: 'Antigravity',  action: 'New mission queued: SEO articles batch #8',        level: 'info' },
  { id: 'a09', timestamp: '09:28:00', agentName: 'Tôm Hùm',     action: 'Proxy recovery script executed successfully',      level: 'success' },
  { id: 'a10', timestamp: '09:25:30', agentName: 'CC CLI',       action: 'Mission msn_005 completed — 200 CMO leads',        level: 'success' },
]

interface Props {
  entries?: ActivityEntry[]
  maxEntries?: number
  title?: string
}

export function AgentActivityLog({ entries = MOCK_ENTRIES, maxEntries = 50, title = 'Agent Activity' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const displayed = entries.slice(-maxEntries)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-800 shrink-0">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div
        ref={scrollRef}
        className="overflow-y-auto max-h-72 divide-y divide-zinc-800/40"
        role="log"
        aria-label="Agent activity log"
        aria-live="polite"
      >
        {displayed.map((entry) => {
          const levelColor = LEVEL_COLORS[entry.level ?? 'info']
          return (
            <div key={entry.id} className="flex items-start gap-3 px-5 py-2.5 hover:bg-zinc-800/30 transition-colors">
              <span className="font-mono text-xs text-zinc-600 shrink-0 mt-0.5 w-14">{entry.timestamp}</span>
              <span className={`text-xs font-medium shrink-0 w-24 truncate ${levelColor}`}>{entry.agentName}</span>
              <span className="text-xs text-zinc-300 leading-relaxed min-w-0">{entry.action}</span>
            </div>
          )
        })}
        {displayed.length === 0 && (
          <p className="px-5 py-4 text-xs text-zinc-600">No activity yet.</p>
        )}
      </div>
    </div>
  )
}
