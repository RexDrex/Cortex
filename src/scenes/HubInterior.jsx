import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

function SubOrb({ position, color, label, active, onSelect }) {
  const groupRef = useRef()
  const matRef = useRef()
  const lightRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    const bob = Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.12
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1] + bob, position[2])
      const s = hovered || active ? 1.35 : 1
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.15)
    }
    if (matRef.current) matRef.current.opacity = active ? 1 : hovered ? 0.95 : 0.8
    if (lightRef.current) lightRef.current.intensity = active ? 3 : hovered ? 2.6 : 1.4
  })

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <pointLight ref={lightRef} color={color} distance={5} decay={2} />
      <mesh>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshBasicMaterial ref={matRef} color={color} transparent opacity={0.8} />
      </mesh>
      <Text position={[0, 0.55, 0]} fontSize={0.22} color="#f5f3ff" anchorX="center" anchorY="bottom" outlineWidth={0.01} outlineColor="#050308">
        {label}
      </Text>
    </group>
  )
}

// Exit is deliberately NOT a ring — every other way of moving through
// this world (the 7 teleport rings, the 3 rings a feature would otherwise
// need) is an open loop you pass through, representing "going somewhere
// specific." Exit is the opposite: not a route to a place, a release
// back into free movement. A faceted crystal shard reads as a distinct
// silhouette from any angle, in a deliberately neutral warm-white/amber
// tone that doesn't borrow any feature's own color — "this isn't tied
// to a category, it's just the way out."
function ExitShard({ onExit }) {
  const ref = useRef()
  const matRef = useRef()
  const [hovered, setHovered] = useState(false)
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.35
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.15
    }
    if (matRef.current) {
      matRef.current.opacity = (hovered ? 0.95 : 0.7) + Math.sin(state.clock.elapsedTime * 1.6) * 0.1
    }
  })
  return (
    <group position={[0, 1.7, 7.5]}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onExit()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <octahedronGeometry args={[0.62, 0]} />
        <meshBasicMaterial ref={matRef} color="#ffe9b0" transparent opacity={0.75} />
      </mesh>
      <pointLight color="#ffe9b0" intensity={hovered ? 2.4 : 1.4} distance={6} decay={2} />
      <Text position={[0, -1.05, 0]} fontSize={0.18} color="#f5f3ff" anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#050308">
        Exit — back to Flow
      </Text>
    </group>
  )
}

// The ring facing "front" — back to the Surface Overview/center. This is
// its own distinct ring, separate from Exit: Exit drops you into free
// movement right where you are, this one is a structured jump all the
// way back to the world's center.
function CenterPortal({ onReturnToCenter }) {
  const ref = useRef()
  const matRef = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z += 0.005
    if (matRef.current) matRef.current.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 1.3) * 0.15
  })
  return (
    <group position={[0, 1.6, -7.5]}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onReturnToCenter()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'auto'
        }}
      >
        <torusGeometry args={[1.1, 0.09, 12, 48]} />
        <meshBasicMaterial ref={matRef} color="#7f5af0" transparent opacity={0.6} />
      </mesh>
      <pointLight color="#7f5af0" intensity={1.4} distance={6} decay={2} />
      <Text position={[0, -1.5, 0]} fontSize={0.16} color="#f5f3ff" anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#050308">
        Surface Overview
      </Text>
    </group>
  )
}

function NeighborPortal({ side, neighbor, onJump }) {
  const ref = useRef()
  const matRef = useRef()
  const x = side === 'left' ? -6.2 : 6.2
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z += 0.005
    if (matRef.current) matRef.current.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 1.1 + x) * 0.15
  })
  return (
    <group position={[x, 1.6, 1]} rotation={[0, side === 'left' ? Math.PI / 2.4 : -Math.PI / 2.4, 0]}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onJump(neighbor.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'auto'
        }}
      >
        <torusGeometry args={[0.85, 0.06, 12, 40]} />
        <meshBasicMaterial ref={matRef} color={neighbor.color} transparent opacity={0.55} />
      </mesh>
      <pointLight color={neighbor.color} intensity={1.2} distance={5} decay={2} />
      <Text position={[0, -1.15, 0]} fontSize={0.15} color="#f5f3ff" anchorX="center" anchorY="middle" outlineWidth={0.007} outlineColor="#050308">
        {neighbor.label}
      </Text>
    </group>
  )
}

// The sealed interior of a landmark, entered via a pierce-through from
// the open Void. Self-contained: a tinted enclosing shell, the category's
// sub-features arranged around the player within easy reach, and an
// explicit portal back out (plus a HUD fallback in App.jsx). This
// replaces walking around an object from outside with actually being
// inside it \u2014 which is what "entering a feature" should mean.
export default function HubInterior({ landmark, activeSubFeature, content, onSelectSubFeature, onExit, neighbors = [], onJumpToNeighbor, onReturnToCenter }) {
  const coreRef = useRef()
  const shellColor = useMemo(() => new THREE.Color(landmark.color).multiplyScalar(0.35), [landmark.color])

  const positions = useMemo(() => {
    const count = landmark.subFeatures.length
    return landmark.subFeatures.map((sf, i) => {
      const angle = (i / count) * Math.PI * 2
      return [Math.cos(angle) * 4.6, 1.6, Math.sin(angle) * 4.6]
    })
  }, [landmark])

  useFrame((state) => {
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.05
      coreRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <>
      <color attach="background" args={[`#${shellColor.getHexString()}`]} />
      <fog attach="fog" args={[`#${shellColor.getHexString()}`, 10, 26]} />

      {/* The enclosing shell \u2014 seen from inside, giving the sealed,
          "you are inside this now" feeling the open Void deliberately
          doesn't have. */}
      <mesh>
        <sphereGeometry args={[20, 32, 32]} />
        <meshBasicMaterial color={landmark.color} transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>

      <ambientLight intensity={0.12} />
      <pointLight position={[0, 3, 0]} color={landmark.color} intensity={4} distance={16} decay={1.8} />

      <group ref={coreRef} position={[0, 1.6, 0]}>
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshBasicMaterial color="#f5f3ff" />
        </mesh>
        <Text position={[0, 0.75, 0]} fontSize={0.26} color="#f5f3ff" anchorX="center" anchorY="bottom" outlineWidth={0.012} outlineColor="#050308">
          {landmark.label}
        </Text>
      </group>

      {content && (
        <Html position={[0, 2.9, 0]} center distanceFactor={9}>
          <div className="orbit-hub-panel">
            <div className="orbit-hub-title">{content.title}</div>
            <div className="orbit-hub-detail">{content.detail}</div>
            {content.extra && <div className="orbit-hub-extra">{content.extra}</div>}
          </div>
        </Html>
      )}

      {landmark.subFeatures.map((sf, i) => (
        <SubOrb
          key={sf.id}
          position={positions[i]}
          color={landmark.color}
          label={sf.label}
          active={activeSubFeature === sf.id}
          onSelect={() => onSelectSubFeature(sf.id)}
        />
      ))}

      <ExitShard onExit={onExit} />
      <CenterPortal onReturnToCenter={onReturnToCenter} />
      {neighbors[0] && <NeighborPortal side="left" neighbor={neighbors[0]} onJump={onJumpToNeighbor} />}
      {neighbors[1] && <NeighborPortal side="right" neighbor={neighbors[1]} onJump={onJumpToNeighbor} />}
    </>
  )
}
