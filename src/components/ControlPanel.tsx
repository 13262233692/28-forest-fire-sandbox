import { useSimulationStore } from '@/store/simulationStore'
import {
  Play,
  Pause,
  RotateCcw,
  Flame,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Zap,
} from 'lucide-react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  icon: React.ReactNode
  onChange: (v: number) => void
  unit?: string
}

function Slider({ label, value, min, max, step, icon, onChange, unit = '' }: SliderProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          {icon}
          {label}
        </span>
        <span className="text-xs text-orange-400 font-mono tabular-nums">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer
          bg-zinc-700/50
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-orange-500
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,100,0,0.5)]
          [&::-webkit-slider-thumb]:hover:bg-orange-400
          [&::-webkit-slider-thumb]:transition-colors"
      />
    </div>
  )
}

export default function ControlPanel() {
  const store = useSimulationStore()

  return (
    <div
      className="absolute top-4 right-4 w-72 rounded-2xl overflow-hidden
        backdrop-blur-xl
        bg-black/60 border border-white/[0.06]
        shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h2
          className="text-sm font-semibold tracking-wider uppercase"
          style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ff8c00' }}
        >
          林火态势推演
        </h2>
        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
          Forest Fire Spread Simulator
        </p>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={store.toggleRunning}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono
              transition-all duration-200
              ${store.isRunning
                ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30'
                : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
              }`}
          >
            {store.isRunning ? <Pause size={12} /> : <Play size={12} />}
            {store.isRunning ? '暂停' : '推演'}
          </button>
          <button
            onClick={store.reset}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono
              bg-zinc-700/30 text-zinc-400 border border-zinc-600/30
              hover:bg-zinc-700/50 hover:text-zinc-300 transition-all duration-200"
          >
            <RotateCcw size={12} />
            重置
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 px-2 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
          <Flame size={14} className="text-orange-500" />
          <span className="text-[10px] text-zinc-400 font-mono">
            点击地形设置起火点
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            蔓延参数
          </div>

          <Slider
            label="蔓延速率"
            value={store.spreadRate}
            min={0.01}
            max={0.5}
            step={0.01}
            icon={<Zap size={11} className="text-yellow-500" />}
            onChange={(v) => store.setParam('spreadRate', v)}
          />

          <Slider
            label="点火阈值"
            value={store.ignitionThreshold}
            min={0.05}
            max={0.8}
            step={0.01}
            icon={<Thermometer size={11} className="text-red-500" />}
            onChange={(v) => store.setParam('ignitionThreshold', v)}
          />

          <Slider
            label="燃烧速率"
            value={store.burnRate}
            min={0.05}
            max={1.0}
            step={0.01}
            icon={<Flame size={11} className="text-orange-500" />}
            onChange={(v) => store.setParam('burnRate', v)}
          />

          <Slider
            label="燃料消耗"
            value={store.fuelConsumptionRate}
            min={0.05}
            max={1.0}
            step={0.01}
            icon={<Flame size={11} className="text-amber-600" />}
            onChange={(v) => store.setParam('fuelConsumptionRate', v)}
          />

          <Slider
            label="温度衰减"
            value={store.temperatureDecay}
            min={0.8}
            max={0.999}
            step={0.001}
            icon={<Gauge size={11} className="text-cyan-500" />}
            onChange={(v) => store.setParam('temperatureDecay', v)}
          />
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            风场控制
          </div>

          <Slider
            label="风向"
            value={store.windDirection}
            min={0}
            max={360}
            step={1}
            icon={<Wind size={11} className="text-blue-400" />}
            onChange={(v) => store.setParam('windDirection', v)}
            unit="°"
          />

          <Slider
            label="风速"
            value={store.windSpeed}
            min={0}
            max={1.5}
            step={0.01}
            icon={<Wind size={11} className="text-blue-300" />}
            onChange={(v) => store.setParam('windSpeed', v)}
          />

          <Slider
            label="风力系数"
            value={store.windStrength}
            min={0}
            max={3.0}
            step={0.1}
            icon={<Wind size={11} className="text-sky-400" />}
            onChange={(v) => store.setParam('windStrength', v)}
          />
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            环境
          </div>

          <Slider
            label="湿度"
            value={store.humidity}
            min={0}
            max={1.0}
            step={0.01}
            icon={<Droplets size={11} className="text-blue-400" />}
            onChange={(v) => store.setParam('humidity', v)}
          />

          <Slider
            label="推演速度"
            value={store.simulationSpeed}
            min={0.1}
            max={5.0}
            step={0.1}
            icon={<Gauge size={11} className="text-green-400" />}
            onChange={(v) => store.setParam('simulationSpeed', v)}
            unit="x"
          />
        </div>
      </div>
    </div>
  )
}
