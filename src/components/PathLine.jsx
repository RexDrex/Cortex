import { useRef, useMemo, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

const LIFETIME = 1.8 // seconds the line stays visible before fading out

// Point Direction's signature: unlike Warp (an instant, abstracted
// boost), this shows the actual space being crossed — a straight line
// of light from wherever the player is standing right now, to the
// destination, that fades as the booster carries them along it.
export default function PathLine({ to, color = '#e9deff', requestKey }) {
  const { camera } = useThree()
  const start = useMemo(() => camera.position.clone(), [requestKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const materialRef = useRef()
  const elapsed = useRef(0)
  const points = useMemo(() => [start, new THREE.Vector3(to[0], 1.6, to[2])], [start, to])

  useEffect(() => {
    elapsed.current = 0
  }, [requestKey])

  useFrame((_, delta) => {
    elapsed.current += delta
    const t = elapsed.current / LIFETIME
    if (materialRef.current) {
      materialRef.current.opacity = t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.15) / 0.85)
    }
  })

  return <Line points={points} color={color} lineWidth={2} transparent onUpdate={(self) => (materialRef.current = self.material)} />
}
