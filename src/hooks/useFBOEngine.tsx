import { useRef, useEffect, createContext, useContext } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '@/store/simulationStore'
import { generateHeightMap } from '@/utils/heightmap'

import fullscreenVert from '@/shaders/fullscreen.vert?raw'
import caUpdateFrag from '@/shaders/ca-update.frag?raw'
import fireRenderFrag from '@/shaders/fire-render.frag?raw'

class FBOEngine {
  gl: THREE.WebGLRenderer
  resolution: number
  readBuffer: THREE.WebGLRenderTarget
  writeBuffer: THREE.WebGLRenderTarget
  heightmapTexture: THREE.DataTexture
  windTexture: THREE.DataTexture
  ignitionTexture: THREE.DataTexture
  ignitionData: Uint8Array
  caMaterial: THREE.RawShaderMaterial
  renderMaterial: THREE.RawShaderMaterial
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  quad: THREE.Mesh
  initialized: boolean
  stepCount: number

  constructor(gl: THREE.WebGLRenderer, resolution: number) {
    this.gl = gl
    this.resolution = resolution
    this.initialized = false
    this.stepCount = 0

    const size = resolution

    const rtOpts: THREE.RenderTargetOptions = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }

    this.readBuffer = new THREE.WebGLRenderTarget(size, size, rtOpts)
    this.writeBuffer = new THREE.WebGLRenderTarget(size, size, rtOpts)

    const hData = generateHeightMap(size)
    const hmData = new Float32Array(size * size * 4)
    for (let i = 0; i < size * size; i++) {
      hmData[i * 4] = hData[i]
      hmData[i * 4 + 1] = 0.0
      hmData[i * 4 + 2] = 0.0
      hmData[i * 4 + 3] = 1.0
    }
    this.heightmapTexture = new THREE.DataTexture(
      hmData, size, size, THREE.RGBAFormat, THREE.FloatType
    )
    this.heightmapTexture.minFilter = THREE.LinearFilter
    this.heightmapTexture.magFilter = THREE.LinearFilter
    this.heightmapTexture.wrapS = THREE.ClampToEdgeWrapping
    this.heightmapTexture.wrapT = THREE.ClampToEdgeWrapping
    this.heightmapTexture.needsUpdate = true

    const windData = new Float32Array(size * size * 4)
    const dir = (45 * Math.PI) / 180
    const speed = 0.6
    for (let i = 0; i < size * size; i++) {
      windData[i * 4] = (Math.cos(dir) * speed + 1.0) / 2.0
      windData[i * 4 + 1] = (Math.sin(dir) * speed + 1.0) / 2.0
      windData[i * 4 + 2] = 0.0
      windData[i * 4 + 3] = 1.0
    }
    this.windTexture = new THREE.DataTexture(
      windData, size, size, THREE.RGBAFormat, THREE.FloatType
    )
    this.windTexture.minFilter = THREE.NearestFilter
    this.windTexture.magFilter = THREE.NearestFilter
    this.windTexture.needsUpdate = true

    this.ignitionData = new Uint8Array(size * size * 4)
    this.ignitionTexture = new THREE.DataTexture(
      this.ignitionData, size, size, THREE.RGBAFormat, THREE.UnsignedByteType
    )
    this.ignitionTexture.minFilter = THREE.NearestFilter
    this.ignitionTexture.magFilter = THREE.NearestFilter
    this.ignitionTexture.needsUpdate = true

    this.caMaterial = new THREE.RawShaderMaterial({
      vertexShader: fullscreenVert,
      fragmentShader: caUpdateFrag,
      uniforms: {
        uStateTexture: { value: null },
        uHeightmap: { value: this.heightmapTexture },
        uWindTexture: { value: this.windTexture },
        uIgnitionTexture: { value: this.ignitionTexture },
        uResolution: { value: new THREE.Vector2(size, size) },
        uIgnitionThreshold: { value: 0.25 },
        uBurnRate: { value: 0.4 },
        uFuelConsumptionRate: { value: 0.3 },
        uWindStrength: { value: 1.0 },
        uTemperatureDecay: { value: 0.97 },
        uSpreadRate: { value: 0.15 },
        uHumidity: { value: 0.2 },
        uDelta: { value: 1.0 },
        uMaxTempIncrease: { value: 0.35 },
        uSlopeFactor: { value: 2.0 },
        uReset: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.renderMaterial = new THREE.RawShaderMaterial({
      vertexShader: fullscreenVert,
      fragmentShader: fireRenderFrag,
      uniforms: {
        uStateTexture: { value: null },
        uHeightmap: { value: this.heightmapTexture },
        uWindTexture: { value: this.windTexture },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(size, size) },
      },
      depthTest: false,
      depthWrite: false,
    })

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.quad = new THREE.Mesh(geometry, this.caMaterial)
    this.scene.add(this.quad)
  }

  initialize() {
    if (this.initialized) return

    this.caMaterial.uniforms.uReset.value = 1
    this.quad.material = this.caMaterial

    const gl = this.gl

    gl.setRenderTarget(null)
    gl.setRenderTarget(this.readBuffer)
    gl.render(this.scene, this.camera)
    gl.setRenderTarget(null)

    gl.setRenderTarget(this.writeBuffer)
    gl.render(this.scene, this.camera)
    gl.setRenderTarget(null)

    this.caMaterial.uniforms.uReset.value = 0
    this.initialized = true
    this.stepCount = 0
  }

  setWindDirection(direction: number, speed: number) {
    const size = this.resolution
    const windData = new Float32Array(size * size * 4)
    const rad = (direction * Math.PI) / 180
    for (let i = 0; i < size * size; i++) {
      windData[i * 4] = (Math.cos(rad) * speed + 1.0) / 2.0
      windData[i * 4 + 1] = (Math.sin(rad) * speed + 1.0) / 2.0
      windData[i * 4 + 2] = 0.0
      windData[i * 4 + 3] = 1.0
    }
    this.windTexture.image.data.set(windData)
    this.windTexture.needsUpdate = true
  }

  addIgnition(uvX: number, uvY: number) {
    const size = this.resolution
    const cx = Math.floor(uvX * size)
    const cy = Math.floor(uvY * size)
    const radius = 3
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = cx + dx
        const py = cy + dy
        if (px >= 0 && px < size && py >= 0 && py < size) {
          if (dx * dx + dy * dy <= radius * radius) {
            const idx = (py * size + px) * 4
            this.ignitionData[idx] = 255
          }
        }
      }
    }
    this.ignitionTexture.needsUpdate = true
  }

  clearIgnitions() {
    this.ignitionData.fill(0)
    this.ignitionTexture.needsUpdate = true
  }

  swapBuffers() {
    const temp = this.readBuffer
    this.readBuffer = this.writeBuffer
    this.writeBuffer = temp
  }

  step(params: {
    ignitionThreshold: number
    burnRate: number
    fuelConsumptionRate: number
    windStrength: number
    temperatureDecay: number
    spreadRate: number
    humidity: number
    delta: number
    maxTempIncrease: number
    slopeFactor: number
  }) {
    const gl = this.gl

    gl.setRenderTarget(null)

    this.caMaterial.uniforms.uStateTexture.value = this.readBuffer.texture
    this.caMaterial.uniforms.uIgnitionThreshold.value = params.ignitionThreshold
    this.caMaterial.uniforms.uBurnRate.value = params.burnRate * params.delta
    this.caMaterial.uniforms.uFuelConsumptionRate.value = params.fuelConsumptionRate * params.delta
    this.caMaterial.uniforms.uWindStrength.value = params.windStrength
    this.caMaterial.uniforms.uTemperatureDecay.value = params.temperatureDecay
    this.caMaterial.uniforms.uSpreadRate.value = params.spreadRate * params.delta
    this.caMaterial.uniforms.uHumidity.value = params.humidity
    this.caMaterial.uniforms.uDelta.value = params.delta
    this.caMaterial.uniforms.uMaxTempIncrease.value = params.maxTempIncrease * params.delta
    this.caMaterial.uniforms.uSlopeFactor.value = params.slopeFactor

    this.quad.material = this.caMaterial

    gl.setRenderTarget(this.writeBuffer)
    gl.render(this.scene, this.camera)

    gl.setRenderTarget(null)

    this.swapBuffers()

    this.stepCount++

    if (this.stepCount % 10 === 0) {
      this.clearIgnitions()
    }
  }

  forceGpuSync() {
    const gl = this.gl
    const ctx = gl.getContext() as WebGL2RenderingContext
    if (ctx && typeof ctx.finish === 'function') {
      ctx.finish()
    }
  }

  reset() {
    this.initialized = false
    this.stepCount = 0
    this.ignitionData.fill(0)
    this.ignitionTexture.needsUpdate = true
    this.initialize()
  }

  getCurrentStateTexture(): THREE.Texture {
    return this.readBuffer.texture
  }

  computeStats(): { burned: number; active: number; velocity: number } {
    const size = this.resolution

    const gl = this.gl
    gl.setRenderTarget(null)
    gl.setRenderTarget(this.readBuffer)

    const pixels = new Float32Array(size * size * 4)
    gl.readRenderTargetPixels(this.readBuffer, 0, 0, size, size, pixels)

    gl.setRenderTarget(null)

    let burned = 0
    let active = 0
    const total = size * size

    for (let i = 0; i < total; i++) {
      const burnState = pixels[i * 4 + 2]
      if (burnState > 0.75) burned++
      else if (burnState > 0.25 && burnState < 0.75) {
        burned++
        active++
      }
    }

    return {
      burned: (burned / total) * 100,
      active,
      velocity: active * 0.01,
    }
  }

  updateRenderMaterial(time: number) {
    this.renderMaterial.uniforms.uStateTexture.value = this.getCurrentStateTexture()
    this.renderMaterial.uniforms.uTime.value = time
  }

  dispose() {
    this.readBuffer.dispose()
    this.writeBuffer.dispose()
    this.heightmapTexture.dispose()
    this.windTexture.dispose()
    this.ignitionTexture.dispose()
    this.caMaterial.dispose()
    this.renderMaterial.dispose()
    this.quad.geometry.dispose()
  }
}

interface EngineContextValue {
  engine: FBOEngine | null
  getStateTexture: () => THREE.Texture | null
  getWindTexture: () => THREE.DataTexture | null
}

const EngineContext = createContext<EngineContextValue>({
  engine: null,
  getStateTexture: () => null,
  getWindTexture: () => null,
})

export function useEngine() {
  return useContext(EngineContext)
}

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<FBOEngine | null>(null)
  const { gl } = useThree()

  useEffect(() => {
    const resolution = useSimulationStore.getState().resolution
    engineRef.current = new FBOEngine(gl, resolution)
    engineRef.current.initialize()

    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [gl])

  useEffect(() => {
    const unsub = useSimulationStore.subscribe((state, prev) => {
      const engine = engineRef.current
      if (!engine) return

      if (state.windDirection !== prev.windDirection || state.windSpeed !== prev.windSpeed) {
        engine.setWindDirection(state.windDirection, state.windSpeed)
      }

      if (state.resetTrigger !== prev.resetTrigger) {
        engine.reset()
      }

      if (state.ignitions !== prev.ignitions && state.ignitions.length > prev.ignitions.length) {
        const newIgnitions = state.ignitions.slice(prev.ignitions.length)
        for (const ign of newIgnitions) {
          engine.addIgnition(ign.x, ign.y)
        }
      }
    })
    return unsub
  }, [])

  const frameCount = useRef(0)

  useFrame(() => {
    const engine = engineRef.current
    if (!engine || !engine.initialized) return

    const state = useSimulationStore.getState()

    if (state.isRunning) {
      const simSpeed = state.simulationSpeed
      const maxSubSteps = 8
      const subSteps = Math.min(Math.max(1, Math.round(simSpeed)), maxSubSteps)
      const delta = simSpeed / subSteps

      for (let i = 0; i < subSteps; i++) {
        engine.step({
          ignitionThreshold: state.ignitionThreshold,
          burnRate: state.burnRate,
          fuelConsumptionRate: state.fuelConsumptionRate,
          windStrength: state.windStrength,
          temperatureDecay: state.temperatureDecay,
          spreadRate: state.spreadRate,
          humidity: state.humidity,
          delta,
          maxTempIncrease: 0.35,
          slopeFactor: state.slopeFactor,
        })

        if (subSteps > 1 && i < subSteps - 1) {
          engine.forceGpuSync()
        }
      }
    }

    engine.updateRenderMaterial(performance.now() / 1000)

    frameCount.current++
    if (frameCount.current % 30 === 0) {
      const stats = engine.computeStats()
      useSimulationStore.getState().setStats(stats.burned, stats.active, stats.velocity)
    }
  })

  const getStateTexture = () => {
    const engine = engineRef.current
    if (!engine || !engine.initialized) return null
    return engine.getCurrentStateTexture()
  }

  const getWindTexture = () => {
    return engineRef.current?.windTexture ?? null
  }

  return (
    <EngineContext.Provider value={{ engine: engineRef.current, getStateTexture, getWindTexture }}>
      {children}
    </EngineContext.Provider>
  )
}
