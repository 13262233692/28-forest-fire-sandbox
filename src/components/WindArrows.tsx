import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '@/store/simulationStore'

export default function WindArrows() {
  const groupRef = useRef<THREE.Group>(null)
  const windDirection = useSimulationStore((s) => s.windDirection)
  const windSpeed = useSimulationStore((s) => s.windSpeed)
  const windStrength = useSimulationStore((s) => s.windStrength)

  const arrowCount = 12
  const spacing = 4.5 / arrowCount

  const arrowGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.08)
    shape.lineTo(0.12, 0)
    shape.lineTo(0, -0.08)
    shape.lineTo(-0.03, 0)

    const geo = new THREE.ShapeGeometry(shape)
    return geo
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    const rad = (windDirection * Math.PI) / 180
    groupRef.current.children.forEach((child) => {
      child.rotation.z = -rad
    })
  })

  const arrows = useMemo(() => {
    const items: Array<{ x: number; y: number; key: string }> = []
    const count = arrowCount
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const x = -2.25 + i * spacing + (j % 2) * spacing * 0.5
        const y = -2.25 + j * spacing
        items.push({ x, y, key: `${i}-${j}` })
      }
    }
    return items
  }, [spacing])

  const color = useMemo(() => {
    const intensity = Math.min(1, windSpeed * windStrength)
    return new THREE.Color(
      0.2 + intensity * 0.3,
      0.4 + intensity * 0.3,
      0.8 + intensity * 0.2
    )
  }, [windSpeed, windStrength])

  return (
    <group ref={groupRef} position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {arrows.map(({ x, y, key }) => (
        <mesh key={key} geometry={arrowGeometry} position={[x, y, 0]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
