import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

// A physical ring standing at the world center, facing the direction of
// one landmark. Unlike a button, this is something the player walks
// toward and passes near — proximity is detected in FirstPersonRig and
// reported up as `onApproachRing`. Passing close never teleports by
// itself; it only raises a confirm prompt, so nobody falls through one
// by accident while just moving around the center.
export default function TeleportRing({ position, angle, color, label }) {
  const ringRef = useRef()
  const matRef = useRef()

  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.z += 0.004
    if (matRef.current) {
      matRef.current.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.15
    }
  })

  return (
    <group position={position} rotation={[0, -angle + Math.PI / 2, 0]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.3, 0.07, 12, 48]} />
        <meshBasicMaterial ref={matRef} color={color} transparent opacity={0.6} />
      </mesh>
      <pointLight color={color} intensity={1.6} distance={6} decay={2} />
      <Text
        position={[0, -1.7, 0]}
        fontSize={0.2}
        color="#f5f3ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.009}
        outlineColor="#050308"
      >
        {label}
      </Text>
    </group>
  )
}
