import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const POINT_COUNT = 46

// The Wisp — not a chatbot, not a character. A small coiling ribbon of
// light, built from the same particle language as the void itself. Now
// follows the camera through the open first-person world (V4) rather
// than sitting at a fixed scene anchor, staying just off to the side of
// view so it's present without blocking anything.
//   idle (default)  — drifts near the player, gentle pulse
//   active           — brighter, faster motion (acknowledging voice/text input)
//   hinting          — brighter still, offering a gentle suggestion after
//                       a stretch of hesitation
//   recede           — dims and pulls back once the user is confidently
//                       acting on their own — it must never nag
export default function Wisp({ active = false, hinting = false, recede = false }) {
  const pointsRef = useRef()
  const matRef = useRef()
  const groupRef = useRef()
  const scaleTarget = useRef(new THREE.Vector3(1, 1, 1))
  const { camera } = useThree()
  const offset = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())

  const basePositions = useMemo(() => new Float32Array(POINT_COUNT * 3), [])

  useFrame((state) => {
    const t0 = state.clock.elapsedTime
    if (!pointsRef.current) return

    const arr = pointsRef.current.geometry.attributes.position.array
    for (let i = 0; i < POINT_COUNT; i++) {
      const t = i / POINT_COUNT
      const coil = t * Math.PI * 4 + t0 * 0.9
      const r = 0.13 + 0.04 * Math.sin(t0 * 1.3 + t * 6)
      arr[i * 3] = Math.cos(coil) * r
      arr[i * 3 + 1] = (t - 0.5) * 0.4 + Math.sin(t0 * 0.7 + t * 3) * 0.025
      arr[i * 3 + 2] = Math.sin(coil) * r
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true

    if (groupRef.current) {
      // Follow just off to the camera's upper-right, in view but not in
      // the way — recomputed each frame from the camera's live transform.
      offset.current.set(0.85, -0.15, -1.6).applyQuaternion(camera.quaternion)
      desired.current.copy(camera.position).add(offset.current)
      desired.current.y += Math.sin(t0 * 0.35) * 0.1
      groupRef.current.position.lerp(desired.current, 0.06)

      const s = recede ? 0.55 : active ? 1.3 : hinting ? 1.15 : 1
      scaleTarget.current.set(s, s, s)
      groupRef.current.scale.lerp(scaleTarget.current, 0.05)
    }
    if (matRef.current) {
      matRef.current.opacity = recede ? 0.2 : active ? 0.95 : hinting ? 0.8 : 0.5
    }
  })

  const color = active ? '#f2b84c' : hinting ? '#9be8ec' : '#cdeff2'

  return (
    <group ref={groupRef}>
      <pointLight color={color} intensity={active ? 2.2 : hinting ? 1.6 : 1} distance={2.5} decay={2} />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={POINT_COUNT} array={basePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial ref={matRef} size={0.04} color={color} transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}
