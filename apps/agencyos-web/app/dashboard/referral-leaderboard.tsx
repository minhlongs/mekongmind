'use client'

import { useEffect, useState } from 'react'

// Referral Leaderboard — GET /marketplace/leaderboard, top 5 referrers
interface LeaderEntry {
  rank: number
  name: string
  referralCount: number
  creditsEarned: number
}

interface Props {
  token: string
  apiBase: string
}

const MEDAL: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

export default function ReferralLeaderboard({ token, apiBase }: Props) {
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiBase}/marketplace/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        // Normalise varying API shapes
        const raw: any[] = json?.leaderboard ?? json?.entries ?? json?.data ?? json ?? []
        const normalised: LeaderEntry[] = raw.slice(0, 5).map((e: any, i: number) => ({
          rank: e.rank ?? i + 1,
          name: e.name ?? e.username ?? e.email ?? 'Anonymous',
          referralCount: e.referralCount ?? e.referrals ?? e.total_referred ?? 0,
          creditsEarned: e.creditsEarned ?? e.credits ?? e.credits_earned ?? 0,
        }))
        setEntries(normalised)
      } catch (e: any) {
        setError('Could not load leaderboard')
      }
      setLoading(false)
    }
    load()
  }, [token, apiBase])

  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Top Referrers</h2>
        <span style={{ fontSize: '0.75rem', color: '#71717a' }}>this month</span>
      </div>
      {loading && <p style={{ padding: '1rem 1.25rem', color: '#71717a', fontSize: '0.875rem' }}>Loading...</p>}
      {error && <p style={{ padding: '1rem 1.25rem', color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p style={{ padding: '1rem 1.25rem', color: '#71717a', fontSize: '0.875rem' }}>No data yet.</p>
      )}
      {entries.map((e) => (
        <div
          key={e.rank}
          style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(39,39,42,0.6)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}
        >
          <span style={{ fontWeight: 700, width: '1.5rem', color: MEDAL[e.rank] ?? '#71717a' }}>#{e.rank}</span>
          <span style={{ flex: 1, fontWeight: 500 }}>{e.name}</span>
          <span style={{ color: '#71717a' }}>{e.referralCount} refs</span>
          <span style={{ color: '#22d3ee', fontWeight: 600 }}>{e.creditsEarned} MCU</span>
        </div>
      ))}
    </div>
  )
}
