'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import { RataCharacter } from './RataCharacter'
import { ParticleTrail } from './ParticleTrail'
import { AtmosphereReveal } from './AtmosphereReveal'
import { GreenFireflies } from './GreenFireflies'
import { HeroPostProcessing } from './HeroPostProcessing'
import { createMoneyBagTexture } from './moneyBagTexture'

function HeroScene() {
  const ratPositionRef = useRef(new THREE.Vector3(0, 0, 0))
  const coinTexture = createMoneyBagTexture()

  useEffect(() => {
    return () => {
      coinTexture.dispose()
    }
  }, [])

  return (
    <>
      <AdaptiveDpr pixelated />
      <ambientLight color={0x0a2e0a} intensity={0.08} />
      <directionalLight color={0x2e8b57} intensity={1.8} position={[-8, 6, -4]} />
      <directionalLight color={0x32cd32} intensity={1.26} position={[8, -4, -6]} />

      <AtmosphereReveal ratPositionRef={ratPositionRef} />
      <GreenFireflies coinTexture={coinTexture} />
      <RataCharacter ratPositionRef={ratPositionRef} />
      <ParticleTrail ratPositionRef={ratPositionRef} coinTexture={coinTexture} />

      <HeroPostProcessing />
    </>
  )
}

export default function HeroCanvas() {

  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 75 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.9
        scene.background = new THREE.Color(0x151518)
      }}
    >
      <Suspense fallback={null}>
        <HeroScene />
      </Suspense>
    </Canvas>
  )
}
