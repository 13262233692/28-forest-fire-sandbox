import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { EngineProvider } from '@/hooks/useFBOEngine'
import Terrain from './Terrain'
import FireOverlay from './FireOverlay'
import WindArrows from './WindArrows'

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#050508']} />

      <ambientLight intensity={0.08} color="#4466aa" />
      <directionalLight
        position={[5, 8, 3]}
        intensity={0.15}
        color="#6688cc"
        castShadow
      />
      <pointLight
        position={[0, 2, 0]}
        intensity={0.5}
        color="#ff6600"
        distance={8}
        decay={2}
      />

      <Stars
        radius={40}
        depth={50}
        count={2000}
        factor={3}
        saturation={0.2}
        fade
        speed={0.5}
      />

      <fog attach="fog" args={['#050508', 8, 20]} />

      <Terrain />
      <FireOverlay />
      <WindArrows />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function FireScene() {
  return (
    <Canvas
      camera={{ position: [0, 4, 3], fov: 50, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <EngineProvider>
          <SceneContent />
        </EngineProvider>
      </Suspense>
    </Canvas>
  )
}
