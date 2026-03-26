'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BAG_COUNT = 15
const BAG_SPEED = 0.025

interface BagData {
  position: THREE.Vector3
  velocity: THREE.Vector3
  phase: number
  pulseSpeed: number
  scale: number
}

interface GreenFirefliesProps {
  coinTexture: THREE.CanvasTexture
}

export function GreenFireflies({ coinTexture }: GreenFirefliesProps) {
  const groupRef = useRef<THREE.Group>(null)

  const spriteMaterial = useMemo(() => {
    return new THREE.SpriteMaterial({
      map: coinTexture,
      transparent: true,
      opacity: 0.7,
      depthTest: true,
      depthWrite: false,
    })
  }, [coinTexture])

  const bagData = useMemo<BagData[]>(() => {
    return Array.from({ length: BAG_COUNT }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 15 - 5
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * BAG_SPEED,
        (Math.random() - 0.5) * BAG_SPEED,
        (Math.random() - 0.5) * BAG_SPEED * 0.5
      ),
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 1.5 + Math.random() * 2,
      scale: 1.2 + Math.random() * 1.5,
    }))
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    const t = performance.now() * 0.001

    groupRef.current.children.forEach((sprite, i) => {
      const data = bagData[i]
      if (!data) return

      // Pulsing opacity
      const pulse = Math.sin((t + data.phase) * data.pulseSpeed) * 0.15 + 0.65
      const mat = (sprite as THREE.Sprite).material as THREE.SpriteMaterial
      if (mat) mat.opacity = pulse

      // Random walk
      data.velocity.x += (Math.random() - 0.5) * 0.0005
      data.velocity.y += (Math.random() - 0.5) * 0.0005
      data.velocity.z += (Math.random() - 0.5) * 0.0003
      data.velocity.clampLength(0, BAG_SPEED)

      data.position.add(data.velocity)

      // Gentle bob
      data.position.y += Math.sin(t * 1.2 + data.phase) * 0.02

      // Bounds
      if (Math.abs(data.position.x) > 35) data.velocity.x *= -0.5
      if (Math.abs(data.position.y) > 20) data.velocity.y *= -0.5
      if (Math.abs(data.position.z) > 15) data.velocity.z *= -0.5

      sprite.position.copy(data.position)
    })
  })

  return (
    <group ref={groupRef}>
      {bagData.map((data, i) => (
        <sprite
          key={i}
          position={data.position.toArray()}
          scale={[data.scale, data.scale, 1]}
          material={spriteMaterial.clone()}
        />
      ))}
    </group>
  )
}
