'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMouseTracker } from './useMouseTracker'

const MAX_PARTICLES = 80
const PARTICLE_DECAY_RATE = 0.008
const PARTICLE_CREATION_RATE = 3

interface Particle {
  life: number
  decay: number
  velocity: THREE.Vector3
  active: boolean
  sprite: THREE.Sprite | null
}

interface ParticleTrailProps {
  ratPositionRef: React.RefObject<THREE.Vector3>
  coinTexture: THREE.CanvasTexture
}

export function ParticleTrail({ ratPositionRef, coinTexture }: ParticleTrailProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { isMoving } = useMouseTracker()

  const particles = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      life: 0,
      decay: 0,
      velocity: new THREE.Vector3(),
      active: false,
      sprite: null,
    }))
  )

  const lastSpawnTime = useRef(0)
  const spriteMaterials = useRef<THREE.SpriteMaterial[]>([])

  useEffect(() => {
    if (!groupRef.current) return
    const group = groupRef.current

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const mat = new THREE.SpriteMaterial({
        map: coinTexture,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false,
      })
      spriteMaterials.current.push(mat)
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(0, 0, 1)
      sprite.visible = false
      group.add(sprite)
      particles.current[i].sprite = sprite
    }

    return () => {
      for (const mat of spriteMaterials.current) {
        mat.dispose()
      }
      spriteMaterials.current = []
    }
  }, [coinTexture])

  useFrame((state) => {
    if (!groupRef.current || !ratPositionRef.current) return

    const group = groupRef.current
    const t = state.clock.getElapsedTime()

    const pos = ratPositionRef.current

    // Spawn particles when moving
    if (isMoving.current && t - lastSpawnTime.current > 0.12) {
      let spawned = 0
      for (let i = 0; i < MAX_PARTICLES && spawned < PARTICLE_CREATION_RATE; i++) {
        const p = particles.current[i]
        if (p.active || !p.sprite) continue

        p.active = true
        p.life = 1.0
        p.decay = Math.random() * 0.004 + PARTICLE_DECAY_RATE

        p.sprite.position.set(
          pos.x + (Math.random() - 0.5) * 4,
          pos.y + (Math.random() - 0.5) * 4 - 1,
          pos.z - 1 - Math.random() * 0.5
        )

        const s = 0.3 + Math.random() * 0.5
        p.sprite.scale.set(s, s, 1)
        p.sprite.visible = true
        ;(p.sprite.material as THREE.SpriteMaterial).opacity = 0.7

        p.velocity.set(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015 + 0.005,
          (Math.random() - 0.5) * 0.01
        )

        spawned++
      }
      lastSpawnTime.current = t
    }

    // Update active particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles.current[i]
      if (!p.active || !p.sprite) continue

      p.life -= p.decay

      if (p.life <= 0) {
        p.active = false
        p.sprite.visible = false
        ;(p.sprite.material as THREE.SpriteMaterial).opacity = 0
        p.sprite.scale.set(0, 0, 1)
        continue
      }

      // Move
      p.sprite.position.add(p.velocity)
      p.sprite.position.x += Math.cos(t * 1.5 + p.sprite.position.y) * 0.001

      // Fade + shrink
      ;(p.sprite.material as THREE.SpriteMaterial).opacity = p.life * 0.7
      const currentScale = p.sprite.scale.x * (0.998)
      p.sprite.scale.set(currentScale, currentScale, 1)
    }
  })

  return <group ref={groupRef} />
}
