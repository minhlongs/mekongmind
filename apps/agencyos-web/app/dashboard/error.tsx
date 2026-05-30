'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    // Log lỗi để debug
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
      <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Dashboard failed to load</h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          Could not fetch dashboard data. Check that openclaw-worker data files are accessible.
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-700 font-mono">Error ID: {error.digest}</p>
        )}
      </div>

      <button
        onClick={reset}
        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-5 py-2 text-sm text-white transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
