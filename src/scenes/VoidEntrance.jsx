import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import * as THREE from 'three'

const STREAK_COUNT = 700
const FIELD_DEPTH = 60
const RADIUS_MIN = 1.0
const RADIUS_MAX = 13
const HEAD_STRIDE = 3

// Weighted color pool matching the reference: mostly blue/cyan, with
// occasional white-hot and violet/pink accents scattered through.
const COLOR_POOL = [
  '#bcd9ff', '#8fb4ff', '#a6c8ff', '#bcd9ff', '#8fb4ff', // blues, most common
  '#c9b8ff', '#e0c9ff', // violet accents
  '#ffffff', '#eaf4ff', // white-hot accents
  '#ffd1ea', // rare pink accent
]

function pickColor(i) {
  // Deterministic-but-varied pick so it doesn't reshuffle every render.
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

function makeDotTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.5, 'rgba(220,230,255,0.6)')
  grad.addColorStop(1, 'rgba(200,215,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// True hyperspace tunnel, built to match the reference directly: a very
// dense field of radial streaks (700+) converging on a single point,
// color-varied (mostly blue, scattered white/violet/pink accents),
// vignetted so the outer field reads dimmer than the bright, dense core
// (folded into per-vertex color since WebGL line opacity can't vary per
// vertex without a custom shader), a subset carrying bright comet-head
// points, and a double concentric "iris" ring halo around the core —
// the eye-like shape from the reference.
export default function VoidEntrance({ onComplete, flashRef }) {
  const streaksRef = useRef()
  const streakMatRef = useRef()
  const headsRef = useRef()
  const headsMatRef = useRef()
  const coreRef = useRef()
  const ringRef = useRef()
  const ringMatRef = useRef()
  const irisOuterRef = useRef()
  const irisOuterMatRef = useRef()
  const irisInnerRef = useRef()
  const irisInnerMatRef = useRef()
  const speedRef = useRef({ value: 0 })
  const { camera } = useThree()
  const ringTexture = useMemo(() => makeRingTexture(), [])
  const dotTexture = useMemo(() => makeDotTexture(), [])

  const { positions, colors, spokes, headIndices } = useMemo(() => {
    const spokes = new Float32Array(STREAK_COUNT * 3) // angle, radius, baseZ
    const colors = new Float32Array(STREAK_COUNT * 2 * 3)
    const headIndices = []
    const tmp = new THREE.Color()
    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
      spokes[i * 3] = angle
      spokes[i * 3 + 1] = radius
      spokes[i * 3 + 2] = -Math.random() * FIELD_DEPTH
      if (i % HEAD_STRIDE === 0) headIndices.push(i)

      // Vignette approximation: streaks further from the centre are
      // dimmed via a darker vertex color, since line materials can't
      // vary opacity per-vertex without a custom shader.
      const vignette = THREE.MathUtils.mapLinear(radius, RADIUS_MIN, RADIUS_MAX, 1, 0.32)
      tmp.set(pickColor(i)).multiplyScalar(vignette)
      const i6 = i * 6
      colors[i6] = tmp.r
      colors[i6 + 1] = tmp.g
      colors[i6 + 2] = tmp.b
      colors[i6 + 3] = tmp.r
      colors[i6 + 4] = tmp.g
      colors[i6 + 5] = tmp.b
    }
    const positions = new Float32Array(STREAK_COUNT * 2 * 3)
    return { positions, colors, spokes, headIndices }
  }, [])

  const headPositions = useMemo(() => new Float32Array(headIndices.length * 3), [headIndices])

  useEffect(() => {
    camera.fov = 45
    camera.position.set(0, 0, 5)
    camera.updateProjectionMatrix()
    if (streakMatRef.current) streakMatRef.current.opacity = 0
    if (headsMatRef.current) headsMatRef.current.opacity = 0
    if (ringMatRef.current) ringMatRef.current.opacity = 0
    if (irisOuterMatRef.current) irisOuterMatRef.current.opacity = 0
    if (irisInnerMatRef.current) irisInnerMatRef.current.opacity = 0
    if (ringRef.current) ringRef.current.scale.setScalar(0.05)
    if (flashRef?.current) flashRef.current.style.opacity = 0

    const tl = gsap.timeline({ onComplete: () => onComplete && onComplete() })

    if (coreRef.current) coreRef.current.material.color.set('#efeaff')
    tl.to(streakMatRef.current, { opacity: 1, duration: 0.25, ease: 'power1.out' })
    tl.to(headsMatRef.current, { opacity: 0.95, duration: 0.3, ease: 'power1.out' }, '<')

    // 1. Long acceleration into the tunnel.
    tl.to(speedRef.current, { value: 22, duration: 1.1, ease: 'power2.in' }, '-=0.1')
    tl.to(camera, { fov: 82, duration: 1.1, ease: 'power2.in', onUpdate: () => camera.updateProjectionMatrix() }, '<')
    tl.to(irisOuterMatRef.current, { opacity: 0.55, duration: 0.9, ease: 'power1.out' }, '<')
    tl.to(irisInnerMatRef.current, { opacity: 0.7, duration: 0.9, ease: 'power1.out' }, '<')

    // 2. Sustain — the actual "long tunnel". Speed and FOV breathe gently.
    tl.to(speedRef.current, { value: 28, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: 1 }, '>')
    tl.to(camera, { fov: 88, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: 1, onUpdate: () => camera.updateProjectionMatrix() }, '<')

    // 3. Final push.
    tl.to(speedRef.current, { value: 42, duration: 0.7, ease: 'power2.in' }, '>')
    tl.to(camera, { fov: 104, duration: 0.7, ease: 'power2.in', onUpdate: () => camera.updateProjectionMatrix() }, '<')
    tl.to(irisOuterMatRef.current, { opacity: 0, duration: 0.5, ease: 'power1.in' }, '<')
    tl.to(irisInnerMatRef.current, { opacity: 0, duration: 0.5, ease: 'power1.in' }, '<')

    // 4. THRESHOLD.
    tl.to(ringRef.current.scale, { x: 14, y: 14, z: 14, duration: 0.45, ease: 'power3.out' }, '-=0.15')
    tl.to(ringMatRef.current, { opacity: 1, duration: 0.12, ease: 'power1.in' }, '<')
    tl.to(ringMatRef.current, { opacity: 0, duration: 0.5, ease: 'power2.out' }, '>-0.05')
    if (flashRef?.current) {
      tl.to(flashRef.current.style, { opacity: 0.9, duration: 0.08 }, '<')
      tl.to(flashRef.current.style, { opacity: 0, duration: 0.45, ease: 'power2.out' }, '>-0.02')
    }
    tl.to(coreRef.current.scale, { x: 6, y: 6, z: 6, duration: 0.6, ease: 'power2.out' }, '<')

    // 5. Arrival.
    tl.to(speedRef.current, { value: 0, duration: 0.8, ease: 'power3.out' }, '-=0.35')
    tl.to(camera, { fov: 60, duration: 0.8, ease: 'power3.out', onUpdate: () => camera.updateProjectionMatrix() }, '<')
    tl.to(streakMatRef.current, { opacity: 0, duration: 0.5, ease: 'power1.in' }, '-=0.35')
    tl.to(headsMatRef.current, { opacity: 0, duration: 0.5, ease: 'power1.in' }, '<')

    return () => tl.kill()
  }, [camera, onComplete, flashRef])

  useFrame((state, delta) => {
    if (irisOuterRef.current) irisOuterRef.current.rotation.z += delta * 0.12
    if (irisInnerRef.current) irisInnerRef.current.rotation.z -= delta * 0.18

    const speed = speedRef.current.value
    if (!streaksRef.current) return

    const streakLen = THREE.MathUtils.clamp(speed * 0.32, 0.06, 6.5)
    const posAttr = streaksRef.current.geometry.attributes.position
    const arr = posAttr.array
    const headArr = headsRef.current ? headsRef.current.geometry.attributes.position.array : null
    let headCursor = 0

    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = spokes[i * 3]
      const radius = spokes[i * 3 + 1]
      let baseZ = spokes[i * 3 + 2]

      if (speed > 0.0001) {
        baseZ += speed * delta
        if (baseZ > 5) baseZ = -FIELD_DEPTH
        spokes[i * 3 + 2] = baseZ
      }

      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const i6 = i * 6
      arr[i6] = x
      arr[i6 + 1] = y
      arr[i6 + 2] = baseZ
      arr[i6 + 3] = x
      arr[i6 + 4] = y
      arr[i6 + 5] = baseZ - streakLen

      if (headArr && i % HEAD_STRIDE === 0) {
        headArr[headCursor * 3] = x
        headArr[headCursor * 3 + 1] = y
        headArr[headCursor * 3 + 2] = baseZ
        headCursor++
      }
    }
    posAttr.needsUpdate = true
    if (headArr) headsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      <mesh ref={coreRef} position={[0, 0, -FIELD_DEPTH]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial color="#efeaff" />
      </mesh>

      {/* The double-ring "iris" — the eye-like halo from the reference. */}
      <sprite ref={irisOuterRef} position={[0, 0, -16]} scale={8.5}>
        <spriteMaterial ref={irisOuterMatRef} map={ringTexture} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite ref={irisInnerRef} position={[0, 0, -14]} scale={5.2}>
        <spriteMaterial ref={irisInnerMatRef} map={ringTexture} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      <sprite ref={ringRef} position={[0, 0, -4]}>
        <spriteMaterial ref={ringMatRef} map={ringTexture} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      <lineSegments ref={streaksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={STREAK_COUNT * 2} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={STREAK_COUNT * 2} array={colors} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial ref={streakMatRef} vertexColors transparent opacity={0} />
      </lineSegments>

      <points ref={headsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={headIndices.length} array={headPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          ref={headsMatRef}
          map={dotTexture}
          size={0.17}
          color="#ffffff"
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}
