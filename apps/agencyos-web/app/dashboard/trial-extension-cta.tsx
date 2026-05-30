'use client'

import { useState } from 'react'

// Trial Extension CTA — share on Twitter → POST /v1/tenants/trial-extend → +10 credits
interface Props {
  token: string
  apiBase: string
  onExtended?: () => void
}

export default function TrialExtensionCta({ token, apiBase, onExtended }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleExtend() {
    setStatus('loading')
    try {
      const res = await fetch(`${apiBase}/v1/tenants/trial-extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.detail ?? json?.error ?? 'Request failed')
      setMsg(json?.message ?? 'Done! +10 credits added to your account.')
      setStatus('done')
      onExtended?.()
    } catch (e: any) {
      setMsg(e.message)
      setStatus('error')
    }
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Just discovered @mekong_cli — AI-operated business platform. Try it free! https://agencyos.network')}`

  async function handleShareAndExtend() {
    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
    // Give user a moment, then call the trial-extend endpoint
    setTimeout(handleExtend, 1500)
  }

  if (status === 'done') {
    return (
      <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🎉</span>
        <p style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 500 }}>{msg}</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #0f172a 100%)', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
          Share on Twitter, get <span style={{ color: '#22d3ee' }}>10 free credits!</span>
        </p>
        <p style={{ color: '#71717a', fontSize: '0.8rem' }}>One tweet = instant credit bonus. No strings attached.</p>
        {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{msg}</p>}
      </div>
      <button
        onClick={handleShareAndExtend}
        disabled={status === 'loading'}
        style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', background: status === 'loading' ? '#1d4ed8' : '#1d9bf0', color: '#fff', fontWeight: 700, border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <span>𝕏</span>
        {status === 'loading' ? 'Processing...' : 'Share & Claim'}
      </button>
    </div>
  )
}
