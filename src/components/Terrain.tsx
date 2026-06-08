import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngine } from '@/hooks/useFBOEngine'

function generateHeightMap(size: number): Float32Array {
  const data = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size
      const ny = y / size
      let h = 0
      h += Math.sin(nx * 3.0 + 0.5) * Math.cos(ny * 2.5 + 1.0) * 0.3
      h += Math.sin(nx * 7.0 + ny * 5.0) * 0.1
      h += Math.cos(nx * 12.0 - ny * 8.0 + 2.0) * 0.05
      h += Math.sin(nx * 1.5 + ny * 3.0) * 0.4
      h = (h + 1.0) * 0.5
      data[y * size + x] = h
    }
  }
  return data
}

export default function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { getStateTexture } = useEngine()

  const geometry = useMemo(() => {
    const gridSize = 256
    const segments = gridSize - 1
    const geo = new THREE.PlaneGeometry(6, 6, segments, segments)
    geo.rotateX(-Math.PI / 2)

    const hData = generateHeightMap(gridSize)
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const ix = i % gridSize
      const iy = Math.floor(i / gridSize)
      positions.setY(i, hData[iy * gridSize + ix] * 0.6)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.15, 0.25, 0.12),
      roughness: 0.9,
      metalness: 0.0,
    })
  }, [])

  useFrame(() => {
    const stateTexture = getStateTexture()
    if (stateTexture && meshRef.current) {
      const currentMat = meshRef.current.material as THREE.MeshStandardMaterial
      if (currentMat.map !== stateTexture) {
        currentMat.map = stateTexture
        currentMat.needsUpdate = true
      }
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      receiveShadow
      castShadow
    />
  )
}
