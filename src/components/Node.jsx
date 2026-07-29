import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'

const VIOLET = '#7f5af0'
const CYAN = '#2cb1bc'
const WHITE = '#f5f3ff'
const LEAN_AMOUNT = 0.5

// The core visual unit of CORTEX. States:
//   idle       — gentle ambient bob/pulse, resting brightness
//   listening  — leans toward the camera, brightens (voice/text input active)
//   hover      — glows warmer, pulse ring emitted
//   selected   — the current camera-flight target, detail visible
//   dimmed     — a non-selected node once something else is focused
// Birth: if birthFrom is given, the node launches from that point to its
// final `position` on mount (staggered by birthDelay) instead of just
// appearing there — this is what makes the materialized cluster feel like it
// grows from a single point rather than being swapped in.
export default function Node({
  position,
  label,
  size = 0.22,
  accent = false,
  central = false,
  listening = false,
  dimmed = false,
  selected = false,
  birthFrom = null,
  birthDelay = 0,
  idleBob = 0.035,
  onSelect,
  onPosition,
}) {
  const groupRef = useRef()
  const lightRef = useRef()
  const matRef = useRef()
  const ringRef = useRef()
  const ringMatRef = useRef()
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()
  const basePos = useRef(new THREE.Vector3(...(birthFrom || position)))
  const displayPos = useRef(new THREE.Vector3())
  const leanVec = useRef(new THREE.Vector3())
  const bobSeed = useRef(position[0] * 3.7 + position[2] * 1.3)

  useEffect(() => {
    if (!birthFrom) return
    gsap.to(basePos.current, {
      x: position[0],
      y: position[1],
      z: position[2],
      duration: 0.85,
      delay: birthDelay,
      ease: 'power2.out',
    })
    // Only run once on mount for a given node instance — remounting (new
    // key) is how a fresh birth is triggered elsewhere in the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const color = central ? WHITE : accent ? CYAN : VIOLET

  useFrame((state) => {
    const t = state.clock.elapsedTime

    displayPos.current.copy(basePos.current)

    if (idleBob > 0) {
      displayPos.current.y += Math.sin(t * 0.6 + bobSeed.current) * idleBob
      displayPos.current.x += Math.sin(t * 0.4 + bobSeed.current * 1.7) * idleBob * 0.5
    }

    if (listening && !selected) {
      leanVec.current
        .copy(camera.position)
        .sub(displayPos.current)
        .normalize()
        .multiplyScalar(LEAN_AMOUNT)
      displayPos.current.add(leanVec.current)
    }

    const activeBoost = listening ? 0.22 : hovered ? 0.16 : 0
    const pulseSpeed = listening ? 3.2 : hovered ? 2.2 : 1.2
    const wobble = Math.sin(t * pulseSpeed + bobSeed.current) * (dimmed ? 0.03 : 0.08)
    const scale = 1 + activeBoost + wobble

    if (groupRef.current) {
      groupRef.current.position.copy(displayPos.current)
      groupRef.current.scale.setScalar(scale)
    }
    if (lightRef.current) {
      lightRef.current.intensity = dimmed ? 0.5 : listening ? 3.4 : hovered ? 3 : selected ? 2.6 : 2
    }
    if (matRef.current) {
      matRef.current.opacity = dimmed ? 0.3 : 1
    }
    if (ringMatRef.current && ringRef.current) {
      if (hovered && !dimmed) {
        ringRef.current.scale.setScalar(1.6 + Math.sin(t * 4) * 0.15)
        ringMatRef.current.opacity = 0.5
      } else {
        ringMatRef.current.opacity = 0
      }
    }

    onPosition && onPosition(displayPos.current)
  })

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        if (!onSelect) return
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        if (!onSelect) return
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect && onSelect()
      }}
    >
      <pointLight ref={lightRef} color={color} distance={5} decay={2} />

      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial ref={matRef} color={color} transparent />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.4, size * 1.6, 32]} />
        <meshBasicMaterial ref={ringMatRef} color={color} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {label && (
        <Text
          position={[0, size + 0.22, 0]}
          fontSize={central ? 0.16 : 0.12}
          color={dimmed ? 'rgba(245,243,255,0.35)' : '#f5f3ff'}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.006}
          outlineColor="#050308"
        >
          {label}
        </Text>
      )}
    </group>
  )
}
