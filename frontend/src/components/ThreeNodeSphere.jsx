import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const NODE_COUNT = 500
const SPHERE_RADIUS = 2.4

// Icon SVG paths as textures drawn on canvas
const ICONS = [
  // Shield
  { pos: [0, 1.2, 2.0], path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  // User
  { pos: [-1.8, 0.5, 1.5], path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  // Brain/CPU
  { pos: [1.8, -0.2, 1.6], path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
  // Bell
  { pos: [1.0, -1.6, 1.9], path: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  // Chat
  { pos: [-1.2, -1.5, 1.8], path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
]

function createIconTexture(svgPath) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')

  // Background circle
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(32, 32, 30, 0, Math.PI * 2)
  ctx.fill()

  // Glow ring
  const gradient = ctx.createRadialGradient(32, 32, 20, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(74,222,128,0.0)')
  gradient.addColorStop(1, 'rgba(74,222,128,0.5)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(32, 32, 31, 0, Math.PI * 2)
  ctx.fill()

  // Icon
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = '#4ade80'
  ctx.shadowBlur = 8

  const p = new Path2D(svgPath)
  ctx.save()
  // scale from 24x24 icon to canvas
  ctx.translate(8, 8)
  ctx.scale((64 - 16) / 24, (64 - 16) / 24)
  ctx.stroke(p)
  ctx.restore()

  return new THREE.CanvasTexture(canvas)
}

export default function ThreeNodeSphere() {
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    // Gentle auto rotation
    groupRef.current.rotation.y += 0.003

    // Mouse interactivity
    const targetX = state.pointer.y * 0.3
    const targetY = state.pointer.x * 0.3
    groupRef.current.rotation.x += 0.05 * (targetX - groupRef.current.rotation.x)
    groupRef.current.rotation.y += 0.05 * (targetY - groupRef.current.rotation.y)
  })

  // Generate sphere points
  const points = useMemo(() => {
    const pts = []
    const phi = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < 100; i++) {
      const y = 1 - (i / 99) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = phi * i
      pts.push([
        Math.cos(theta) * r * SPHERE_RADIUS,
        y * SPHERE_RADIUS,
        Math.sin(theta) * r * SPHERE_RADIUS
      ])
    }
    return pts
  }, [])

  return (
    <group ref={groupRef}>
      {/* Individual mesh nodes */}
      {points.map((pos, i) => (
        <mesh key={i} position={pos}>
          <circleGeometry args={[0.08, 8]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {/* Center sphere */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#064e3b" transparent opacity={0.1} wireframe />
      </mesh>
    </group>
  )
}
