import FireScene from '@/components/FireScene'
import ControlPanel from '@/components/ControlPanel'
import StatsBar from '@/components/StatsBar'

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508]">
      <FireScene />
      <ControlPanel />
      <StatsBar />
    </div>
  )
}
