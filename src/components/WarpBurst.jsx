import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import * as THREE from 'three'

const STREAK_COUNT = 550
const FIELD_DEPTH = 26
const RADIUS_MIN = 2.0
const RADIUS_MAX = 12

const COLOR_POOL = ['#bcd9ff', '#8fb4ff', '#a6c8ff', '#bcd9ff', '#8fb4ff', '#c9b8ff', '#ffffff', '#ffd1ea']
function pickColor(i) {
  return COLOR_POOL[i % COLOR_POOL.length]
}

function makeRingTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const grad = ctx.createRadialGradient(cx, cx, size * 0.28, cx, cx, size * 0.5)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.75, 'rgba(210,225,255,0.9)')
  grad.addColorStop(0.85, 'rgba(255,255,255,1)')
  grad.addColorStop(1, 'rgba(190,210,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function makeDarkCoreTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2)
  grad.addColorStop(0, 'rgba(4,3,10,1)')
  grad.addColorStop(0.55, 'rgba(4,3,10,0.92)')
  grad.addColorStop(0.85, 'rgba(4,3,10,0.35)')
  grad.addColorStop(1, 'rgba(4,3,10,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// The warp effect proper, built to the same reference as the entrance
// tunnel: a dense, color-varied, vignetted field of radiating streaks
// plus an iris ring — centred on wherever the camera currently is,
// independent of the GSAP travel happening underneath. Every warp in the
// app (Map, voice-called, proximity auto-boost) shares this one signature.
export default function WarpBurst({ active }) {
  const streaksRef = useRef()
  const matRef = useRef()
  const irisRef = useRef()
  const irisMatRef = useRef()
  const coreRef = useRef()
  const coreMatRef = useRef()
  const intensity = useRef({ value: 0 })
  const { camera } = useThree()
  const groupRef = useRef()

  const { spokes, colors } = useMemo(() => {
    const spokes = new Float32Array(STREAK_COUNT * 3)
    const colors = new Float32Array(STREAK_COUNT * 2 * 3)
    const tmp = new THREE.Color()
    for (let i = 0; i < STREAK_COUNT; i++) {
      spokes[i * 3] = Math.random() * Math.PI * 2
      spokes[i * 3 + 1] = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
      spokes[i * 3 + 2] = -Math.random() * FIELD_DEPTH
      const vignette = THREE.MathUtils.mapLinear(spokes[i * 3 + 1], RADIUS_MIN, RADIUS_MAX, 1, 0.3)
      tmp.set(pickColor(i)).multiplyScalar(vignette)
      const i6 = i * 6
      colors[i6] = tmp.r
      colors[i6 + 1] = tmp.g
      colors[i6 + 2] = tmp.b
      colors[i6 + 3] = tmp.r
      colors[i6 + 4] = tmp.g
      colors[i6 + 5] = tmp.b
    }
    return { spokes, colors }
  }, [])
  const positions = useMemo(() => new Float32Array(STREAK_COUNT * 2 * 3), [])
  const ringTexture = useMemo(() => makeRingTexture(), [])
  const coreTexture = useMemo(() => makeDarkCoreTexture(), [])

  useEffect(() => {
    gsap.to(intensity.current, {
      value: active ? 24 : 0,
      duration: active ? 0.35 : 0.5,
      ease: active ? 'power2.out' : 'power2.in',
    })
    gsap.to(irisMatRef.current || {}, {
      opacity: active ? 0.4 : 0,
      duration: active ? 0.45 : 0.4,
      ease: 'power1.out',
    })
    gsap.to(coreMatRef.current || {}, {
      opacity: active ? 1 : 0,
      duration: active ? 0.4 : 0.45,
      ease: 'power1.out',
    })
  }, [active])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position)
      groupRef.current.quaternion.copy(camera.quaternion)
    }
    if (irisRef.current) irisRef.current.rotation.z += delta * 0.2

    const speed = intensity.current.value
    if (matRef.current) matRef.current.opacity = THREE.MathUtils.clamp(speed / 24, 0, 1)

    if (!streaksRef.current || speed <= 0.001) return
    const streakLen = THREE.MathUtils.clamp(speed * 0.3, 0.05, 4.5)
    const posAttr = streaksRef.current.geometry.attributes.position
    const arr = posAttr.array

    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = spokes[i * 3]
      const radius = spokes[i * 3 + 1]
      let z = spokes[i * 3 + 2]
      z += speed * delta
      if (z > 3) z = -FIELD_DEPTH
      spokes[i * 3 + 2] = z

      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const i6 = i * 6
      arr[i6] = x
      arr[i6 + 1] = y
      arr[i6 + 2] = z
      arr[i6 + 3] = x
      arr[i6 + 4] = y
      arr[i6 + 5] = z - streakLen
    }
    posAttr.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <sprite ref={irisRef} position={[0, 0, -9]} scale={5.5}>
        <spriteMaterial ref={irisMatRef} map={ringTexture} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <lineSegments ref={streaksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={STREAK_COUNT * 2} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={STREAK_COUNT * 2} array={colors} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial ref={matRef} vertexColors transparent opacity={0} />
      </lineSegments>
      {/* Dark occluding core \u2014 not a bright burst, a near-black hole the
          streaks radiate away from, matching the reference exactly. */}
      <sprite ref={coreRef} position={[0, 0, -6]} scale={3.4}>
        <spriteMaterial ref={coreMatRef} map={coreTexture} transparent opacity={0} depthWrite={false} />
      </sprite>
    </group>
  )
}
