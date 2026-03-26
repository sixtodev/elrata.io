'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMouseTracker } from './useMouseTracker'

const FOLLOW_SPEED = 0.075
const FLOAT_SPEED = 1.6
const WOBBLE_AMOUNT = 0.35
const PULSE_SPEED = 1.6
const PULSE_INTENSITY = 0.6
const EYE_GLOW_DECAY = 0.95
const EYE_GLOW_RESPONSE = 0.31
const MOVEMENT_THRESHOLD = 0.07
const EMISSIVE_INTENSITY = 5.8
const GREEN = 0xc4ef16

interface RataCharacterProps {
  ratPositionRef: React.RefObject<THREE.Vector3>
}

export function RataCharacter({ ratPositionRef }: RataCharacterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const leftEyeMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const rightEyeMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const leftOuterGlowMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const rightOuterGlowMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null)

  const currentMovement = useRef(0)
  const time = useRef(0)
  const prevPos = useRef(new THREE.Vector3())
  const moveDir = useRef(new THREE.Vector2())

  const { mouse, mouseSpeed } = useMouseTracker()

  // Rat body geometry — elongated oval with pointed snout
  const bodyGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.8, 24, 24)
    const pos = geo.getAttribute('position')
    const positions = pos.array as Float32Array

    for (let i = 0; i < positions.length; i += 3) {
      let x = positions[i]
      let y = positions[i + 1]
      let z = positions[i + 2]

      // 1) Elongate body along Z (front-back) — make it oval, not round
      positions[i + 2] = z * 1.5

      // 2) Squash height slightly for a stockier look
      positions[i + 1] = y * 0.85

      // 3) Taper the front into a snout — narrow X and Y as Z increases
      const zNorm = z / 1.8 // 0 at center, 1 at front
      if (zNorm > 0.3) {
        const taper = 1.0 - (zNorm - 0.3) * 0.7
        positions[i] *= taper      // narrow X
        positions[i + 1] *= taper  // narrow Y
        // Push forward to make snout pointy
        positions[i + 2] += (zNorm - 0.3) * 0.8
      }

      // 4) Round the belly — push bottom vertices down slightly
      y = positions[i + 1]
      if (y < -0.3) {
        positions[i + 1] *= 1.1  // slightly bigger belly
      }

      // 5) Flatten the top of the head a bit
      y = positions[i + 1]
      if (y > 1.2) {
        positions[i + 1] *= 0.85
      }

      // 6) Taper the back (butt area) slightly
      z = positions[i + 2]
      if (z < -2.0) {
        const backTaper = 1.0 - Math.abs((z + 2.0) / 2.0) * 0.3
        positions[i] *= backTaper
        positions[i + 1] *= backTaper
      }
    }

    geo.computeVertexNormals()
    return geo
  }, [])

  // Tail — long curving S-shape behind the body
  const tailGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.2, -2.8),
      new THREE.Vector3(-0.6, 0.3, -4.0),
      new THREE.Vector3(0.5, 0.8, -5.2),
      new THREE.Vector3(-0.3, 1.4, -6.2),
      new THREE.Vector3(0.2, 2.0, -7.0),
      new THREE.Vector3(-0.1, 2.5, -7.6),
    ])
    return new THREE.TubeGeometry(curve, 20, 0.08, 6, false)
  }, [])

  // Whisker geometries — thin lines from snout
  const whiskerGeometries = useMemo(() => {
    const whiskers: THREE.TubeGeometry[] = []
    const whiskerDefs = [
      // Left whiskers
      { start: [-0.3, 0.1, 3.2], end: [-2.0, 0.3, 3.8] },
      { start: [-0.3, 0.0, 3.3], end: [-2.0, -0.1, 4.0] },
      { start: [-0.3, -0.1, 3.2], end: [-1.8, -0.4, 3.6] },
      // Right whiskers
      { start: [0.3, 0.1, 3.2], end: [2.0, 0.3, 3.8] },
      { start: [0.3, 0.0, 3.3], end: [2.0, -0.1, 4.0] },
      { start: [0.3, -0.1, 3.2], end: [1.8, -0.4, 3.6] },
    ]
    for (const w of whiskerDefs) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(...(w.start as [number, number, number])),
        new THREE.Vector3(
          (w.start[0] + w.end[0]) / 2,
          (w.start[1] + w.end[1]) / 2 + 0.05,
          (w.start[2] + w.end[2]) / 2
        ),
        new THREE.Vector3(...(w.end as [number, number, number])),
      ])
      whiskers.push(new THREE.TubeGeometry(curve, 8, 0.02, 4, false))
    }
    return whiskers
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const dt = Math.min(delta, 0.1)
    time.current += dt * 0.6

    const t = time.current

    // Mouse following with lerp — centered area
    const targetX = mouse.current.x * 11
    const targetY = mouse.current.y * 7
    prevPos.current.copy(groupRef.current.position)

    groupRef.current.position.x += (targetX - groupRef.current.position.x) * FOLLOW_SPEED
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * FOLLOW_SPEED

    // Update shared position ref for atmosphere
    if (ratPositionRef.current) {
      ratPositionRef.current.copy(groupRef.current.position)
    }

    // Movement tracking
    const movementAmount = prevPos.current.distanceTo(groupRef.current.position)
    currentMovement.current = currentMovement.current * EYE_GLOW_DECAY + movementAmount * (1 - EYE_GLOW_DECAY)

    // Floating animation — 3 sine/cosine layers
    const float1 = Math.sin(t * FLOAT_SPEED * 1.5) * 0.03
    const float2 = Math.cos(t * FLOAT_SPEED * 0.7) * 0.018
    const float3 = Math.sin(t * FLOAT_SPEED * 2.3) * 0.008
    groupRef.current.position.y += float1 + float2 + float3

    // Pulsing glow
    const pulse1 = Math.sin(t * PULSE_SPEED) * PULSE_INTENSITY
    const breathe = Math.sin(t * 0.6) * 0.12
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity = EMISSIVE_INTENSITY + pulse1 + breathe
    }

    // Body tilt/wobble
    if (bodyRef.current) {
      moveDir.current.set(
        targetX - groupRef.current.position.x,
        targetY - groupRef.current.position.y
      ).normalize()

      const tiltStrength = 0.1 * WOBBLE_AMOUNT
      const tiltDecay = 0.95
      bodyRef.current.rotation.z = bodyRef.current.rotation.z * tiltDecay + (-moveDir.current.x * tiltStrength * (1 - tiltDecay))
      bodyRef.current.rotation.x = bodyRef.current.rotation.x * tiltDecay + (moveDir.current.y * tiltStrength * (1 - tiltDecay))
      bodyRef.current.rotation.y = Math.sin(t * 1.4) * 0.05 * WOBBLE_AMOUNT

      // Scale breathing
      const scaleVar = 1 + Math.sin(t * 2.1) * 0.025 * WOBBLE_AMOUNT + pulse1 * 0.015
      const scaleBreath = 1 + Math.sin(t * 0.8) * 0.012
      const s = scaleVar * scaleBreath
      bodyRef.current.scale.set(s, s, s)
    }

    // Eye glow — brightens on movement, fades on idle
    const isMovingNow = currentMovement.current > MOVEMENT_THRESHOLD
    const targetGlow = isMovingNow ? 1.0 : 0.0
    const glowSpeed = isMovingNow ? EYE_GLOW_RESPONSE * 2 : EYE_GLOW_RESPONSE

    if (leftEyeMatRef.current && rightEyeMatRef.current) {
      const newOpacity = leftEyeMatRef.current.opacity + (targetGlow - leftEyeMatRef.current.opacity) * glowSpeed
      leftEyeMatRef.current.opacity = newOpacity
      rightEyeMatRef.current.opacity = newOpacity
    }
    if (leftOuterGlowMatRef.current && rightOuterGlowMatRef.current) {
      const outerOpacity = (leftEyeMatRef.current?.opacity ?? 0) * 0.3
      leftOuterGlowMatRef.current.opacity = outerOpacity
      rightOuterGlowMatRef.current.opacity = outerOpacity
    }
  })

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={bodyRef} geometry={bodyGeometry}>
        <meshStandardMaterial
          ref={bodyMatRef}
          color={0x0f1a0f}
          emissive={GREEN}
          emissiveIntensity={EMISSIVE_INTENSITY}
          transparent
          opacity={0.88}
          roughness={0.02}
          metalness={0.0}
          side={THREE.DoubleSide}
          alphaTest={0.1}
        />
      </mesh>

      {/* Left Ear — large round rat ear */}
      <mesh position={[-1.1, 1.3, 0.0]} scale={[0.7, 1.0, 0.35]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial
          color={0x0f1a0f}
          emissive={GREEN}
          emissiveIntensity={3.5}
          transparent
          opacity={0.88}
          roughness={0.02}
        />
      </mesh>
      {/* Left ear inner */}
      <mesh position={[-1.1, 1.35, 0.15]} scale={[0.45, 0.65, 0.2]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.8, 10, 10]} />
        <meshStandardMaterial color={0x1a2e1a} emissive={GREEN} emissiveIntensity={5.0} transparent opacity={0.6} />
      </mesh>

      {/* Right Ear — large round rat ear */}
      <mesh position={[1.1, 1.3, 0.0]} scale={[0.7, 1.0, 0.35]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial
          color={0x0f1a0f}
          emissive={GREEN}
          emissiveIntensity={3.5}
          transparent
          opacity={0.88}
          roughness={0.02}
        />
      </mesh>
      {/* Right ear inner */}
      <mesh position={[1.1, 1.35, 0.15]} scale={[0.45, 0.65, 0.2]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.8, 10, 10]} />
        <meshStandardMaterial color={0x1a2e1a} emissive={GREEN} emissiveIntensity={5.0} transparent opacity={0.6} />
      </mesh>

      {/* Nose — black */}
      <mesh position={[0, -0.05, 3.5]}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Tail — long S-curve */}
      <mesh geometry={tailGeometry}>
        <meshStandardMaterial
          color={0x0f1a0f}
          emissive={GREEN}
          emissiveIntensity={3.0}
          transparent
          opacity={0.88}
          roughness={0.02}
        />
      </mesh>

      {/* Whiskers */}
      {whiskerGeometries.map((geo, i) => (
        <mesh key={`whisker-${i}`} geometry={geo}>
          <meshBasicMaterial color={GREEN} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* === Eyes — positioned on the snout area === */}
      {/* Left eye socket */}
      <mesh position={[-0.5, 0.4, 2.4]} scale={[0.9, 0.85, 0.5]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      {/* Right eye socket */}
      <mesh position={[0.5, 0.4, 2.4]} scale={[0.9, 0.85, 0.5]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>

      {/* Left eye glow */}
      <mesh position={[-0.5, 0.4, 2.5]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial ref={leftEyeMatRef} color={GREEN} transparent opacity={0} />
      </mesh>
      {/* Right eye glow */}
      <mesh position={[0.5, 0.4, 2.5]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial ref={rightEyeMatRef} color={GREEN} transparent opacity={0} />
      </mesh>

      {/* Left outer glow */}
      <mesh position={[-0.5, 0.4, 2.45]}>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshBasicMaterial ref={leftOuterGlowMatRef} color={GREEN} transparent opacity={0} side={THREE.BackSide} />
      </mesh>
      {/* Right outer glow */}
      <mesh position={[0.5, 0.4, 2.45]}>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshBasicMaterial ref={rightOuterGlowMatRef} color={GREEN} transparent opacity={0} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
