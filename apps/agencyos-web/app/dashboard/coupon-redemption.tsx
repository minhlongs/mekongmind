'use client'

import { useState } from 'react'

// Coupon Redemption — POST /v1/credits/redeem with coupon code
interface Props {
  token: string
  apiBase: string
  onSuccess?: (credits: number) => void
}

export default function CouponRedemption({ token, apiBase, onSuccess }: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRedeem() {
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch(`${apiBase}/v1/credits/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail ?? json?.error ?? 'Redemption failed')
      const credits = json?.credits ?? json?.creditsAdded ?? 0
      setStatus({ ok: true, msg: `Success! +${credits} credits added.` })
      setCode('')
      onSuccess?.(credits)
    } catch (e: any) {
      setStatus({ ok: false, msg: e.message })
    }
    setLoading(false)
  }

  return (
    <div style={{ marginBottom: '2rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '1rem 1.25rem' }}>
      <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '0.5rem' }}>Have a coupon?</p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
          placeholder="Enter coupon code"
          style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff', fontSize: '0.875rem', outline: 'none' }}
        />
        <button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: loading ? '#164e63' : '#22d3ee', color: '#000', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
        >
          {loading ? '...' : 'Redeem'}
        </button>
      </div>
      {status && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: status.ok ? '#22c55e' : '#ef4444' }}>
          {status.msg}
        </p>
      )}
    </div>
  )
}
