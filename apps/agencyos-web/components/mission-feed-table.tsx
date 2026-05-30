import type { ReactNode } from 'react'

export type MissionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'

export interface Mission {
  id: string
  goal: string
  status: MissionStatus
  agent: string
  mcuCost: number
  durationSec: number | null
  createdAt: string
}

const STATUS_CONFIG: Record<MissionStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-zinc-700/60 text-zinc-400 border border-zinc-600/40' },
  running:   { label: 'Running',   className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  success:   { label: 'Success',   className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  failed:    { label: 'Failed',    className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
}

function StatusBadge({ status }: { status: MissionStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function formatDuration(sec: number | null): string {
  if (sec === null) return '-'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

const MOCK_MISSIONS: Mission[] = [
  { id: 'msn_001', goal: 'Scrape 500 CEO leads from SaaS vertical', status: 'success',   agent: 'Tôm Hùm',     mcuCost: 1240, durationSec: 252, createdAt: '2026-03-02T09:12:00Z' },
  { id: 'msn_002', goal: 'SEO article batch #8 — 10 posts',          status: 'running',   agent: 'CC CLI',      mcuCost: 340,  durationSec: 125, createdAt: '2026-03-02T09:30:00Z' },
  { id: 'msn_003', goal: 'Competitor analysis — Linear.app',          status: 'pending',   agent: '-',           mcuCost: 0,    durationSec: null, createdAt: '2026-03-02T09:45:00Z' },
  { id: 'msn_004', goal: 'Lead nurturing email sequence draft',       status: 'failed',    agent: 'Antigravity', mcuCost: 89,   durationSec: 43,  createdAt: '2026-03-02T08:50:00Z' },
  { id: 'msn_005', goal: 'Scrape 200 CMO leads from Fintech sector', status: 'success',   agent: 'Tôm Hùm',    mcuCost: 590,  durationSec: 178, createdAt: '2026-03-02T08:20:00Z' },
  { id: 'msn_006', goal: 'Health check all running agents',           status: 'cancelled', agent: 'Tôm Hùm',    mcuCost: 12,   durationSec: 8,   createdAt: '2026-03-02T07:55:00Z' },
]

interface Props {
  missions?: Mission[]
  title?: ReactNode
  maxRows?: number
}

export function MissionFeedTable({ missions = MOCK_MISSIONS, title = 'Recent Missions', maxRows }: Props) {
  const rows = maxRows ? missions.slice(0, maxRows) : missions

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {title && (
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Mission feed">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Goal</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium hidden md:table-cell">Agent</th>
              <th className="px-5 py-3 font-medium hidden lg:table-cell">MCU</th>
              <th className="px-5 py-3 font-medium hidden lg:table-cell">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-zinc-600">{m.id}</td>
                <td className="px-5 py-3 text-zinc-200 max-w-[220px] truncate" title={m.goal}>{m.goal}</td>
                <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-5 py-3 text-zinc-500 hidden md:table-cell">{m.agent}</td>
                <td className="px-5 py-3 text-zinc-500 font-mono hidden lg:table-cell">{m.mcuCost.toLocaleString()}</td>
                <td className="px-5 py-3 text-zinc-500 font-mono hidden lg:table-cell">{formatDuration(m.durationSec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
