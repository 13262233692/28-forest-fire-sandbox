import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { useEngine } from '@/hooks/useFBOEngine'
import { useSimulationStore } from '@/store/simulationStore'

export default function FireOverlay() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { engine, getStateTexture, getWindTexture } = useEngine()
  const addIgnition = useSimulationStore((s) => s.addIgnition)

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        precision highp sampler2D;
        uniform sampler2D uStateTexture;
        uniform sampler2D uWindTexture;
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec4 state = texture(uStateTexture, vUv);
          float burnState = state.b;
          float burnProgress = state.a;
          float fuel = state.r;

          vec2 windVec = texture(uWindTexture, vUv).rg * 2.0 - 1.0;

          if (burnState < 0.25) {
            float heatGlow = 0.0;
            float dx = uResolution.x > 0.0 ? 1.0 / uResolution.x : 0.0;
            float dy = uResolution.y > 0.0 ? 1.0 / uResolution.y : 0.0;
            for (int i = -3; i <= 3; i++) {
              for (int j = -3; j <= 3; j++) {
                vec2 off = vec2(float(i) * dx, float(j) * dy);
                vec2 sUv = vUv + off;
                if (sUv.x < 0.0 || sUv.x > 1.0 || sUv.y < 0.0 || sUv.y > 1.0) continue;
                vec4 nb = texture(uStateTexture, sUv);
                if (nb.b > 0.25 && nb.b < 0.75) {
                  float dist = length(vec2(float(i), float(j)));
                  heatGlow += exp(-dist * 1.2) * 0.15;
                }
              }
            }
            vec3 preheat = vec3(0.6, 0.15, 0.0) * heatGlow;
            gl_FragColor = vec4(preheat, heatGlow * 0.8);
            return;
          }

          if (burnState > 0.75) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }

          vec2 fireUv = vUv + windVec * 0.02 * (1.0 - burnProgress);

          float fireNoise = fbm(fireUv * 10.0 + vec2(0.0, -uTime * 4.0));
          float fireNoise2 = fbm(fireUv * 18.0 + vec2(uTime * 2.0, -uTime * 5.0));

          float intensity = (1.0 - burnProgress) * (0.7 + 0.3 * fireNoise);

          float windStretch = 1.0 + max(dot(windVec, vec2(0.0, 1.0)), 0.0) * 1.5;
          intensity *= windStretch;

          vec3 fireColor = mix(
            vec3(1.0, 0.2, 0.0),
            vec3(1.0, 0.8, 0.1),
            fireNoise
          );
          fireColor = mix(fireColor, vec3(1.0, 0.95, 0.7), fireNoise2 * 0.3);
          fireColor *= 1.2 + fireNoise * 0.5;

          float alpha = intensity * 0.9;

          float edgeFade = smoothstep(0.0, 0.2, burnProgress) * smoothstep(1.0, 0.6, burnProgress);
          alpha *= (0.5 + edgeFade * 0.5);

          float smokeAmount = smoothstep(0.5, 0.9, burnProgress);
          vec3 smokeColor = vec3(0.25, 0.22, 0.2);
          float smokeNoise = fbm(vUv * 6.0 + vec2(uTime * 0.2, -uTime * 0.6));
          fireColor = mix(fireColor, smokeColor, smokeAmount * smokeNoise * 0.6);
          alpha = mix(alpha, smokeAmount * smokeNoise * 0.4, smokeAmount * 0.5);

          gl_FragColor = vec4(fireColor * intensity, alpha);
        }
      `,
      uniforms: {
        uStateTexture: { value: null },
        uWindTexture: { value: null },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(512, 512) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame(() => {
    const stateTexture = getStateTexture()
    const windTexture = getWindTexture()

    if (stateTexture) {
      material.uniforms.uStateTexture.value = stateTexture
    }
    if (windTexture) {
      material.uniforms.uWindTexture.value = windTexture
    }
    material.uniforms.uTime.value = performance.now() / 1000
  })

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      if (!e.uv) return
      const uv = e.uv
      addIgnition(uv.x, uv.y)

      if (engine) {
        engine.addIgnition(uv.x, uv.y)
      }
    },
    [addIgnition, engine]
  )

  return (
    <mesh
      ref={meshRef}
      position={[0, 0.35, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      onClick={handleClick}
    >
      <planeGeometry args={[6, 6]} />
    </mesh>
  )
}
