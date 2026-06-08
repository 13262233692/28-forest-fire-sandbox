import { create } from 'zustand'

interface SimulationStore {
  isRunning: boolean
  resolution: number
  ignitionThreshold: number
  burnRate: number
  fuelConsumptionRate: number
  windStrength: number
  windDirection: number
  windSpeed: number
  humidity: number
  temperatureDecay: number
  spreadRate: number
  simulationSpeed: number
  slopeFactor: number
  resetTrigger: number
  ignitions: Array<{ x: number; y: number }>
  burnedPercent: number
  activeFires: number
  spreadVelocity: number

  toggleRunning: () => void
  reset: () => void
  setParam: (key: string, value: number | boolean) => void
  addIgnition: (x: number, y: number) => void
  clearIgnitions: () => void
  setStats: (burned: number, active: number, velocity: number) => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  isRunning: false,
  resolution: 512,
  ignitionThreshold: 0.25,
  burnRate: 0.4,
  fuelConsumptionRate: 0.3,
  windStrength: 1.0,
  windDirection: 45,
  windSpeed: 0.6,
  humidity: 0.2,
  temperatureDecay: 0.97,
  spreadRate: 0.15,
  simulationSpeed: 1.0,
  slopeFactor: 2.0,
  resetTrigger: 0,
  ignitions: [],
  burnedPercent: 0,
  activeFires: 0,
  spreadVelocity: 0,

  toggleRunning: () => set((s) => ({ isRunning: !s.isRunning })),
  reset: () =>
    set((s) => ({
      resetTrigger: s.resetTrigger + 1,
      isRunning: false,
      ignitions: [],
      burnedPercent: 0,
      activeFires: 0,
      spreadVelocity: 0,
    })),
  setParam: (key, value) => set({ [key]: value }),
  addIgnition: (x, y) =>
    set((s) => ({ ignitions: [...s.ignitions, { x, y }] })),
  clearIgnitions: () => set({ ignitions: [] }),
  setStats: (burned, active, velocity) =>
    set({ burnedPercent: burned, activeFires: active, spreadVelocity: velocity }),
}))
