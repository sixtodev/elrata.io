'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export function useMouseTracker() {
  const mouse = useRef(new THREE.Vector2(0, 0))
  const prevMouse = useRef(new THREE.Vector2(0, 0))
  const mouseSpeed = useRef(new THREE.Vector2(0, 0))
  const isMoving = useRef(false)

  useEffect(() => {
    let lastUpdate = 0
    let movementTimer: ReturnType<typeof setTimeout> | null = null

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastUpdate < 16) return

      prevMouse.current.copy(mouse.current)
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      mouseSpeed.current.x = mouse.current.x - prevMouse.current.x
      mouseSpeed.current.y = mouse.current.y - prevMouse.current.y
      isMoving.current = true

      if (movementTimer) clearTimeout(movementTimer)
      movementTimer = setTimeout(() => {
        isMoving.current = false
      }, 80)

      lastUpdate = now
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      const now = performance.now()
      if (now - lastUpdate < 16) return

      prevMouse.current.copy(mouse.current)
      mouse.current.x = (touch.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(touch.clientY / window.innerHeight) * 2 + 1
      mouseSpeed.current.x = mouse.current.x - prevMouse.current.x
      mouseSpeed.current.y = mouse.current.y - prevMouse.current.y
      isMoving.current = true

      if (movementTimer) clearTimeout(movementTimer)
      movementTimer = setTimeout(() => {
        isMoving.current = false
      }, 80)

      lastUpdate = now
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      if (movementTimer) clearTimeout(movementTimer)
    }
  }, [])

  return { mouse, mouseSpeed, isMoving }
}
