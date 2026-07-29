import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import * as THREE from 'three'

function makeBladeTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2)
  grad.addColorStop(0, 'rgba(220,232,255,0.85)')
  grad.addColorStop(0.35, 'rgba(140,170,235,0.5)')
  grad.addColorStop(0.7, 'rgba(60,80,150,0.22)')
  grad.addColorStop(1, 'rgba(20,25,60,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function makeCoreTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(210,225,255,0.7)')
  grad.addColorStop(1, 'rgba(180,200,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

const BLADE_COUNT = 6

// Leaving is not the reverse of entering \u2014 arriving is a burst toward
// you, leaving is something closing in around you. This is a slow,
// rotational, blurred vortex \u2014 soft overlapping "blade" glows spinning
// and spiralling inward, the camera itself rolling with them \u2014 built
// deliberately different from the sharp radiating entrance/warp tunnels.
export default function ExitVortex({ onComplete, flashRef }) {
  const bladeRefs = useRef([])
  const coreRef = useRef()
  const coreMatRef = useRef()
  const { camera } = useThree()
  const bladeTexture = useMemo(() => makeBladeTexture(), [])
  const coreTexture = useMemo(() => makeCoreTexture(), [])
  const spin = useRef({ value: 0 })
  const pull = useRef({ value: 0 })

  const blades = useMemo(
    () =>
      Array.from({ length: BLADE_COUNT }, (_, i) => ({
        offset: (i / BLADE_COUNT) * Math.PI * 2,
        dir: i % 2 === 0 ? 1 : -0.72,
        radius: 3.2 + (i % 3) * 0.6,
      })),
    []
  )

  useEffect(() => {
    camera.position.set(0, 0, 5)
    camera.fov = 55
    camera.rotation.z = 0
    camera.updateProjectionMatrix()
    if (coreMatRef.current) coreMatRef.current.opacity = 0
    if (flashRef?.current) flashRef.current.style.opacity = 0
    bladeRefs.current.forEach((b) => {
      if (b) {
        b.scale.set(1, 1, 1)
        b.material.opacity = 0
      }
    })

    const tl = gsap.timeline({ onComplete: () => onComplete && onComplete() })

    // 1. The blades fade in and begin a slow, gathering spin \u2014 nothing
    //    urgent yet, just the world starting to turn.
    bladeRefs.current.forEach((b, i) => {
      if (!b) return
      tl.to(b.material, { opacity: 0.6, duration: 0.6, ease: 'power1.out' }, i * 0.05)
    })
    tl.to(coreMatRef.current, { opacity: 0.5, duration: 0.8, ease: 'power1.out' }, '<')

    // 2. Accelerating spin and inward pull \u2014 long and sustained, a real
    //    sense of being drawn down and away, not rushed.
    tl.to(spin.current, { value: 1, duration: 3.4, ease: 'power2.in' }, '>')
    tl.to(pull.current, { value: 1, duration: 3.4, ease: 'power2.in' }, '<')
    tl.to(camera, { fov: 38, duration: 3.4, ease: 'power2.in', onUpdate: () => camera.updateProjectionMatrix() }, '<')

    // 3. The world closes in \u2014 blades and core swell and brighten
    //    briefly right before the cut, then everything fades to black.
    tl.to(coreMatRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.4')
    if (flashRef?.current) {
      tl.to(flashRef.current.style, { opacity: 1, duration: 0.55, ease: 'power2.in' }, '-=0.15')
    }
    tl.to({}, { duration: 0.35 })

    return () => tl.kill()
  }, [camera, onComplete, flashRef])

  useFrame((state, delta) => {
    const s = spin.current.value
    const p = pull.current.value
    camera.rotation.z += delta * (0.15 + s * 1.4)

    bladeRefs.current.forEach((b, i) => {
      if (!b) return
      const { offset, dir } = blades[i]
      b.material.rotation = state.clock.elapsedTime * (0.4 + s * 2.2) * dir + offset
      const scale = 1 + s * 1.6 - p * 0.5
      b.scale.set(scale, scale, 1)
    })

    if (coreRef.current) {
      const coreScale = 1 + p * 2.2
      coreRef.current.scale.setScalar(coreScale)
    }
  })

  return (
    <>
      {blades.map((bl, i) => (
        <sprite key={i} ref={(el) => (bladeRefs.current[i] = el)} position={[0, 0, -3]} scale={bl.radius * 2}>
          <spriteMaterial map={bladeTexture} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      ))}
      <sprite ref={coreRef} position={[0, 0, -2.5]} scale={0.9}>
        <spriteMaterial ref={coreMatRef} map={coreTexture} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </>
  )
}
