export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-5xl animate-pulse">
      {/* Welcome skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-zinc-800" />
        <div className="h-4 w-48 rounded bg-zinc-800/60" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col gap-3">
            <div className="h-3 w-24 rounded bg-zinc-800" />
            <div className="h-8 w-16 rounded bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Chart + log skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/50" />
        <div className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/50" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <div className="h-4 w-32 rounded bg-zinc-800" />
        </div>
        <div className="divide-y divide-zinc-800/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex gap-6">
              <div className="h-3 w-16 rounded bg-zinc-800" />
              <div className="h-3 w-48 rounded bg-zinc-800" />
              <div className="h-3 w-14 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
