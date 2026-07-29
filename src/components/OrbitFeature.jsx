import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

const HUB_RADIUS = 2.1
const RING_RADII = [3.6, 5.3]
const RING_SPEEDS = [0.06, -0.045]
const RING_TUBE = 0.18 // real width — these are meant to read as physical, walkable channels

function Ring({ radius, speed, color, tilt }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <torusGeometry args={[radius, RING_TUBE, 12, 72]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  )
}

function Moon({ ringIndex, angleOffset, color, label, active, hubPosition }) {
  const groupRef = useRef()
  const matRef = useRef()
  const lightRef = useRef()
  const radius = RING_RADII[ringIndex]
  const speed = RING_SPEEDS[ringIndex]

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + angleOffset
    const x = hubPosition[0] + Math.cos(t) * radius
    const z = hubPosition[2] + Math.sin(t) * radius
    const y = hubPosition[1] + Math.sin(state.clock.elapsedTime * 0.4 + angleOffset) * 0.15
    if (groupRef.current) {
      groupRef.current.position.set(x, y, z)
      const s = active ? 1.4 : 1
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.15)
    }
    if (matRef.current) matRef.current.opacity = active ? 1 : 0.8
    if (lightRef.current) lightRef.current.intensity = active ? 3.2 : 1.3
  })

  return (
    <group ref={groupRef}>
      <pointLight ref={lightRef} color={color} distance={4} decay={2} />
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial ref={matRef} color={color} transparent opacity={0.8} />
      </mesh>
      <Text position={[0, 0.62, 0]} fontSize={0.28} color="#f5f3ff" anchorX="center" anchorY="bottom" outlineWidth={0.012} outlineColor="#050308">
        {label}
      </Text>
    </group>
  )
}

// The standard pattern for every Surface-layer feature: a large central
// hub (the general category) with rotating rings carrying small orbiting
// moons (the specific sub-features). Calling a specific sub-feature fills
// the hub with its content while the other moons stay visible and
// reachable — the rings themselves are real, thick, physical channels,
// not thin decorative lines, since the user is standing among them.
export default function OrbitFeature({ label, color, position, activeSubFeature, content, subFeatures }) {
  const hubRef = useRef()
  const hubMatRef = useRef()
  const hubLightRef = useRef()

  useFrame((state) => {
    if (hubRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.7) * 0.04
      hubRef.current.scale.setScalar(pulse)
    }
    if (hubLightRef.current) {
      hubLightRef.current.intensity = content ? 5.5 : 3.2
    }
  })

  return (
    <group position={position}>
      <Ring radius={RING_RADII[0]} speed={RING_SPEEDS[0]} color={color} tilt={0.08} />
      <Ring radius={RING_RADII[1]} speed={RING_SPEEDS[1]} color={color} tilt={-0.12} />

      <group ref={hubRef}>
        <pointLight ref={hubLightRef} color={color} distance={14} decay={1.6} />
        <mesh>
          <sphereGeometry args={[HUB_RADIUS, 32, 32]} />
          <meshBasicMaterial ref={hubMatRef} color={color} transparent opacity={0.85} />
        </mesh>
        <Text position={[0, HUB_RADIUS + 0.7, 0]} fontSize={0.55} color="#f5f3ff" anchorX="center" anchorY="bottom" outlineWidth={0.02} outlineColor="#050308">
          {label}
        </Text>
      </group>

      {content && (
        <Html position={[0, HUB_RADIUS * 0.4, HUB_RADIUS + 0.3]} center distanceFactor={12}>
          <div className="orbit-hub-panel">
            <div className="orbit-hub-title">{content.title}</div>
            <div className="orbit-hub-detail">{content.detail}</div>
            {content.extra && <div className="orbit-hub-extra">{content.extra}</div>}
          </div>
        </Html>
      )}

      {subFeatures.map((sf, i) => (
        <Moon
          key={sf.id}
          ringIndex={i % 2}
          angleOffset={(i / subFeatures.length) * Math.PI * 2}
          color={color}
          label={sf.label}
          active={activeSubFeature === sf.id}
          hubPosition={[0, 0, 0]}
        />
      ))}
    </group>
  )
}
