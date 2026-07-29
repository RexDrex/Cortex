import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars, Text } from '@react-three/drei'
import * as THREE from 'three'

const CYCLE = 12 // seconds for one full pass through all four labels

function makeGlowTexture(stops) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2)
  stops.forEach(([offset, color]) => grad.addColorStop(offset, color))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function OrbitRing({ radius, color, speed, tilt }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.01, 8, 96]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  )
}

// Each orb's label surfaces in turn as its "peak time" comes around in the
// shared cycle, rather than every label sitting visible simultaneously \u2014
// paced reveal instead of a static diagram, like a trailer showing off
// one feature at a time.
function CirclingOrb({ radius, speed, angle0, color, label, peakTime, size = 0.07 }) {
  const ref = useRef()
  const lightRef = useRef()
  const labelGroupRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + angle0
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.4) * 0.35, Math.sin(t) * radius)
    }
    if (labelGroupRef.current) {
      const phase = state.clock.elapsedTime % CYCLE
      let d = Math.abs(phase - peakTime)
      d = Math.min(d, CYCLE - d) // wrap-around distance
      const focus = Math.exp(-(d * d) / (2 * 0.9 * 0.9))
      labelGroupRef.current.scale.setScalar(0.001 + focus)
    }
  })

  return (
    <group ref={ref}>
      <pointLight ref={lightRef} color={color} intensity={1.6} distance={2.5} decay={2} />
      <mesh>
        <sphereGeometry args={[size, 20, 20]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {label && (
        <group ref={labelGroupRef} scale={0.001}>
          <Text position={[0, size + 0.16, 0]} fontSize={0.09} color="#f5f3ff" anchorX="center" anchorY="bottom" outlineWidth={0.004} outlineColor="#050308">
            {label}
          </Text>
        </group>
      )}
    </group>
  )
}

// Stage 0 \u2014 a simple opening, but a genuinely cinematic one: the camera
// slowly arcs around the mark rather than sitting locked, and each
// feature's label surfaces in turn as its moment in the cycle comes
// around \u2014 motion and pacing, not more elements, is what makes this read
// as a trailer rather than a decorated poster.
export default function Splash() {
  const coreRef = useRef()
  const { camera } = useThree()
  const texture = useMemo(
    () => makeGlowTexture([[0, 'rgba(127,90,240,0.4)'], [0.5, 'rgba(80,50,180,0.18)'], [1, 'rgba(10,7,20,0)']]),
    []
  )
  const matRef = useRef()

  useFrame((state, delta) => {
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.06
      coreRef.current.scale.setScalar(pulse)
    }
    if (matRef.current) matRef.current.rotation += delta * 0.008

    // Slow cinematic drift \u2014 a wide, gentle arc, not a full spin, with a
    // slight bob so it never feels mechanically perfect.
    const t = state.clock.elapsedTime * 0.045
    camera.position.x = Math.sin(t) * 4.2
    camera.position.z = 5.2 + Math.cos(t) * 1.4
    camera.position.y = 0.3 + Math.sin(t * 1.7) * 0.25
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <Stars radius={110} depth={60} count={3200} factor={4} saturation={0} fade speed={0.3} />
      <sprite position={[0, 2, -20]} scale={34}>
        <spriteMaterial ref={matRef} map={texture} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 0, 0]} color="#c9b8ff" intensity={3.2} distance={9} decay={2} />

      <OrbitRing radius={1.3} color="#7f5af0" speed={0.09} tilt={0.2} />
      <OrbitRing radius={1.85} color="#2cb1bc" speed={-0.065} tilt={-0.15} />
      <OrbitRing radius={2.4} color="#f2b84c" speed={0.045} tilt={0.3} />
      <OrbitRing radius={2.9} color="#9b7bff" speed={-0.03} tilt={-0.22} />

      <CirclingOrb radius={1.3} speed={0.5} angle0={0} color="#c9b8ff" label="Accounts" peakTime={0} />
      <CirclingOrb radius={1.85} speed={-0.36} angle0={2.1} color="#9be8ec" label="Spending" peakTime={3} />
      <CirclingOrb radius={2.4} speed={0.28} angle0={4.3} color="#ffcf7f" label="Goals" peakTime={6} size={0.06} />
      <CirclingOrb radius={2.9} speed={-0.22} angle0={1.2} color="#c9a0ff" label="Investments" peakTime={9} size={0.06} />

      <mesh ref={coreRef}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial color="#f5f3ff" />
      </mesh>
    </>
  )
}
