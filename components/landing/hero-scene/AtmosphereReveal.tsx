'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 ratPosition;
  uniform float revealRadius;
  uniform float fadeStrength;
  uniform float baseOpacity;
  uniform float revealOpacity;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    float dist = distance(vWorldPosition.xy, ratPosition.xy);
    float dynamicRadius = revealRadius + sin(time * 2.0) * 5.0;
    float reveal = smoothstep(dynamicRadius * 0.2, dynamicRadius, dist);
    reveal = pow(reveal, fadeStrength);
    float opacity = mix(revealOpacity, baseOpacity, reveal);
    gl_FragColor = vec4(0.001, 0.001, 0.002, opacity);
  }
`

interface AtmosphereRevealProps {
  ratPositionRef: React.RefObject<THREE.Vector3>
}

export function AtmosphereReveal({ ratPositionRef }: AtmosphereRevealProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useRef({
    ratPosition: { value: new THREE.Vector3(0, 0, 0) },
    revealRadius: { value: 80 },
    fadeStrength: { value: 1.5 },
    baseOpacity: { value: 0.12 },
    revealOpacity: { value: 0.0 },
    time: { value: 0 },
  }).current

  useFrame((_, delta) => {
    if (!materialRef.current) return
    uniforms.time.value += delta * 0.6
    if (ratPositionRef.current) {
      uniforms.ratPosition.value.copy(ratPositionRef.current)
    }
  })

  return (
    <mesh position={[0, 0, -50]} renderOrder={-100}>
      <planeGeometry args={[300, 300]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
