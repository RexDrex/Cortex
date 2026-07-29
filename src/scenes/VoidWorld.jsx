import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import OrbitFeature from '../components/OrbitFeature'
import { LANDMARKS, landmarkPosition } from '../logic/landmarks'

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

function hexToRgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function DistantHaze({ pos, color }) {
  const texture = useMemo(
    () => makeGlowTexture([[0, hexToRgba(color, 0.35)], [0.5, hexToRgba(color, 0.15)], [1, 'rgba(5,3,8,0)']]),
    [color]
  )
  return (
    <sprite position={pos} scale={26}>
      <spriteMaterial map={texture} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  )
}

function AmbientMotes() {
  const ref = useRef()
  const positions = useMemo(() => {
    const count = 500
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 5 + Math.random() * 40
      const theta = Math.random() * Math.PI * 2
      arr[i * 3] = Math.cos(theta) * r
      arr[i * 3 + 1] = Math.random() * 6
      arr[i * 3 + 2] = Math.sin(theta) * r
    }
    return arr
  }, [])
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.004
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#8b83b3" transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// The Void, per V4: not a node map viewed from above — a vast, endless
// first-person world. Landmarks sit far out, huge and glowing, glimpsed
// through mist (fog + haze sprites) rather than rendered as small icons.
// Each landmark IS its Orbit feature at full world scale — the same
// object reads as a distant glow from afar and as a walkable structure
// up close, no separate "far" and "near" representations needed.
export default function VoidWorld({ activeCategory, activeSubFeature, content }) {
  return (
    <>
      <Stars radius={140} depth={70} count={5000} factor={4} saturation={0} fade speed={0.3} />
      <ambientLight intensity={0.07} />
      <AmbientMotes />

      {LANDMARKS.map((lm) => (
        <DistantHaze key={`haze-${lm.id}`} pos={[landmarkPosition(lm)[0], 3, landmarkPosition(lm)[2]]} color={lm.color} />
      ))}

      {LANDMARKS.map((lm) => (
        <group key={lm.id} position={[landmarkPosition(lm)[0], 2.6, landmarkPosition(lm)[2]]}>
          <OrbitFeature
            label={lm.label}
            color={lm.color}
            position={[0, 0, 0]}
            subFeatures={lm.subFeatures}
            activeSubFeature={activeCategory === lm.id ? activeSubFeature : null}
            content={activeCategory === lm.id ? content : null}
          />
        </group>
      ))}
    </>
  )
}
