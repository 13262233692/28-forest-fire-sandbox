import { useSimulationStore } from '@/store/simulationStore'
import { Flame, Wind, TrendingUp, BarChart3 } from 'lucide-react'

export default function StatsBar() {
  const burnedPercent = useSimulationStore((s) => s.burnedPercent)
  const activeFires = useSimulationStore((s) => s.activeFires)
  const spreadVelocity = useSimulationStore((s) => s.spreadVelocity)
  const windDirection = useSimulationStore((s) => s.windDirection)
  const windSpeed = useSimulationStore((s) => s.windSpeed)

  const stats = [
    {
      icon: <Flame size={12} className="text-orange-500" />,
      label: '燃烧面积',
      value: `${burnedPercent.toFixed(1)}%`,
    },
    {
      icon: <TrendingUp size={12} className="text-red-400" />,
      label: '活跃火点',
      value: activeFires.toLocaleString(),
    },
    {
      icon: <BarChart3 size={12} className="text-yellow-500" />,
      label: '蔓延速率',
      value: `${spreadVelocity.toFixed(2)} m/s`,
    },
    {
      icon: <Wind size={12} className="text-blue-400" />,
      label: '风向/风速',
      value: `${windDirection.toFixed(0)}° / ${windSpeed.toFixed(1)}`,
    },
  ]

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-6
        px-6 py-2.5 rounded-xl
        backdrop-blur-xl
        bg-black/50 border border-white/[0.06]
        shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2">
          {stat.icon}
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
              {stat.label}
            </span>
            <span className="text-xs text-zinc-200 font-mono tabular-nums leading-tight">
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
