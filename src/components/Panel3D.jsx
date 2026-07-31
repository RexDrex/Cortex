import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// The background card every in-world panel is built on. `billboard`
// keeps it facing the camera continuously — required for anything that
// moves relative to the player (Overview panels orbiting, the Map), not
// needed for things that spawn already facing them (a ring prompt).
export function Panel3D({
  position = [0, 1.6, 0],
  rotation,
  width = 2.4,
  height = 1.5,
  billboard = false,
  color = '#160f2a',
  borderColor = '#7f5af0',
  opacity = 0.92,
  children,
  scale = 1,
}) {
  const groupRef = useRef()

  useFrame(({ camera }) => {
    if (billboard && groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color={borderColor} transparent opacity={0.75} />
      </lineSegments>
      {children}
    </group>
  )
}

// A clickable region inside a panel. Highlights when the player's
// crosshair (screen center, since the pointer is locked) is resting on
// it — this is the in-world equivalent of a CSS :hover state, and it's
// what makes "look at it, then click" legible without a visible cursor.
export function PanelButton({ position, width = 1, height = 0.32, label, onSelect, tone = '#7f5af0', fontSize = 0.1 }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect && onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={tone} transparent opacity={hovered ? 0.85 : 0.45} />
      </mesh>
      <Text position={[0, 0, 0.01]} fontSize={fontSize} color="#f5f3ff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

// Multi-line body text that wraps within a panel's width, since drei's
// Text needs an explicit max-width to wrap instead of overflowing.
export function PanelText({ position, children, fontSize = 0.09, maxWidth = 2, color = '#c9c2ea', anchorX = 'center' }) {
  return (
    <Text
      position={position}
      fontSize={fontSize}
      maxWidth={maxWidth}
      lineHeight={1.4}
      color={color}
      anchorX={anchorX}
      anchorY="top"
      textAlign={anchorX}
    >
      {children}
    </Text>
  )
}
