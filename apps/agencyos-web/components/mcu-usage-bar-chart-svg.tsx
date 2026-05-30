interface DayUsage {
  day: string
  mcu: number
}

const MOCK_DATA: DayUsage[] = [
  { day: 'Mon', mcu: 1240 },
  { day: 'Tue', mcu: 890 },
  { day: 'Wed', mcu: 2100 },
  { day: 'Thu', mcu: 1650 },
  { day: 'Fri', mcu: 3200 },
  { day: 'Sat', mcu: 740 },
  { day: 'Sun', mcu: 980 },
]

interface Props {
  data?: DayUsage[]
  title?: string
}

const CHART_HEIGHT = 80
const BAR_WIDTH = 28
const GAP = 12

export function McuUsageBarChart({ data = MOCK_DATA, title = 'MCU Usage — Last 7 Days' }: Props) {
  const max = Math.max(...data.map((d) => d.mcu), 1)
  const svgWidth = data.length * (BAR_WIDTH + GAP) - GAP
  const total = data.reduce((sum, d) => sum + d.mcu, 0)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-zinc-500">
          Total: <span className="text-purple-400 font-mono">{total.toLocaleString()}</span>
        </span>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${CHART_HEIGHT + 20}`}
        aria-label="MCU usage bar chart"
        role="img"
        className="overflow-visible"
      >
        {data.map((d, i) => {
          const barH = Math.max(4, Math.round((d.mcu / max) * CHART_HEIGHT))
          const x = i * (BAR_WIDTH + GAP)
          const y = CHART_HEIGHT - barH
          const isMax = d.mcu === max
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barH}
                rx={4}
                className={isMax ? 'fill-purple-500' : 'fill-zinc-700'}
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 14}
                textAnchor="middle"
                className="fill-zinc-500 text-[9px]"
                fontSize={9}
              >
                {d.day}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
