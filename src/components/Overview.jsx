import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Panel3D, PanelButton, PanelText } from './Panel3D'

// The Surface layer's real tutorial, now genuinely 3D: five panels
// orbit continuously around wherever the player is standing (movement
// is paused while this is open). Looking at one and clicking it pulls
// it in close and enlarges it; clicking it again releases it back into
// orbit. Dismissing spirals every panel inward and shrinks them away —
// the "population circles around you and vanishes" moment, now built
// out of the actual orbit rather than a separate animation bolted on.
// Generates the same kind of Overview panels for a specific feature,
// built from its real data rather than hand-written per feature — this
// is what fixes "no intro overview" for the interiors, reusing the
// exact same orbiting-panel system the Surface layer already has.
export function buildFeaturePanels(landmark) {
  if (!landmark) return SURFACE_PANELS
  const subNames = (landmark.subFeatures || []).map((s) => s.label).join(', ')
  return [
    {
      id: 'intro',
      title: landmark.label,
      body: landmark.intro,
    },
    {
      id: 'subfeatures',
      title: 'What lives here',
      body: subNames ? `${subNames}. Use the small navigation tool at the center to reach any of them.` : 'Walk the rings, or call one by name.',
    },
    {
      id: 'entering',
      title: 'Going deeper',
      body: 'Select a sub-feature to float toward it. Confirming steps you inside — the space around you dissolving into its own.',
    },
    {
      id: 'leaving',
      title: 'Leaving this hub',
      body: 'Two rings lead directly to the neighboring features. The shard near the entrance drops you back into open Flow. A third ring returns you all the way to the Surface Overview.',
    },
  ]
}

const SURFACE_PANELS = [
  {
    id: 'welcome',
    title: 'The surface layer',
    body: 'Your accounts, spending, goals, and everything else you keep here exist as real places around you — not menu items.',
  },
  {
    id: 'move',
    title: 'Moving freely',
    body: 'Arrow keys or WASD walk you forward, back, and side to side. Move your mouse — or drag on a touch screen — to look around.',
  },
  {
    id: 'vast',
    title: 'How vast this is',
    body: "This world is enormous — far too vast to see the features from here, and usually too vast to simply walk to one. That's what the other three ways of traveling are for.",
  },
  {
    id: 'travel',
    title: 'Four ways to get anywhere',
    body: 'Warp from the Map for an instant jump. Point Direction to see the path first, then get boosted along it. Flow — just walk. Or step through one of the rings around you.',
  },
  {
    id: 'rings',
    title: 'The rings around you',
    body: 'Each ring here faces one feature. Walking close raises a prompt — nothing teleports until you confirm it, so you never step through by accident.',
  },
]

const ORBIT_RADIUS = 2.4
const DISMISS_DURATION = 0.85

function OrbitPanel({ panel, index, total, anchor, focusedId, onFocus, dismissing, dismissStartRef }) {
  const groupRef = useRef()
  const baseAngle = (index / total) * Math.PI * 2
  const isFocused = focusedId === panel.id
  const isOther = focusedId && !isFocused

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    if (dismissing) {
      const elapsed = t - dismissStartRef.current
      const p = Math.min(elapsed / DISMISS_DURATION, 1)
      const radius = ORBIT_RADIUS * (1 - p)
      const angle = baseAngle + t * (0.5 + p * 3.5)
      const scale = 1 - p
      groupRef.current.position.set(anchor.x + Math.cos(angle) * radius, anchor.y + Math.sin(t * 0.6 + index) * 0.15, anchor.z + Math.sin(angle) * radius)
      groupRef.current.scale.setScalar(Math.max(scale, 0.001))
      groupRef.current.quaternion.copy(camera.quaternion)
      return
    }

    if (isFocused) {
      // Pulled in close, directly ahead of wherever the camera is
      // currently looking — enlarged, readable, no longer orbiting.
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      const target = camera.position.clone().add(forward.multiplyScalar(1.6))
      groupRef.current.position.lerp(target, 0.18)
      groupRef.current.quaternion.slerp(camera.quaternion, 0.25)
      groupRef.current.scale.lerp(new THREE.Vector3(1.55, 1.55, 1.55), 0.18)
      return
    }

    // Ordinary orbit: slow continuous rotation around the anchor, plus a
    // gentle vertical bob so the panels feel alive rather than static.
    const angle = baseAngle + t * 0.18
    groupRef.current.position.set(anchor.x + Math.cos(angle) * ORBIT_RADIUS, anchor.y + Math.sin(t * 0.7 + index) * 0.18, anchor.z + Math.sin(angle) * ORBIT_RADIUS)
    groupRef.current.quaternion.copy(camera.quaternion)
    const targetScale = isOther ? 0.62 : 1
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12)
  })

  return (
    <group ref={groupRef}>
      <Panel3D width={1.7} height={1.15} opacity={isFocused ? 0.95 : isOther ? 0.55 : 0.88}>
        <PanelText position={[0, 0.38, 0.01]} fontSize={0.1} maxWidth={1.5} color="#f5f3ff">
          {panel.title}
        </PanelText>
        <PanelText position={[0, 0.14, 0.01]} fontSize={0.072} maxWidth={1.5}>
          {panel.body}
        </PanelText>
        <PanelButton
          position={[0, -0.44, 0.01]}
          width={1.3}
          height={0.24}
          fontSize={0.07}
          label={isFocused ? 'Release' : 'Pull closer'}
          onSelect={() => onFocus(isFocused ? null : panel.id)}
          tone={isFocused ? '#2cb1bc' : '#7f5af0'}
        />
      </Panel3D>
    </group>
  )
}

export default function Overview({ onComplete, panels = SURFACE_PANELS }) {
  const { camera } = useThree()
  const anchor = useMemo(() => camera.position.clone(), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [focusedId, setFocusedId] = useState(null)
  const [dismissing, setDismissing] = useState(false)
  const dismissStartRef = useRef(0)
  const { clock } = useThree()

  const handleDismiss = useCallback(() => {
    setFocusedId(null)
    dismissStartRef.current = clock.elapsedTime
    setDismissing(true)
    setTimeout(onComplete, DISMISS_DURATION * 1000 + 80)
  }, [onComplete, clock])

  return (
    <group>
      {panels.map((panel, i) => (
        <OrbitPanel
          key={panel.id}
          panel={panel}
          index={i}
          total={panels.length}
          anchor={anchor}
          focusedId={focusedId}
          onFocus={setFocusedId}
          dismissing={dismissing}
          dismissStartRef={dismissStartRef}
        />
      ))}
      {!dismissing && (
        <Panel3D position={[anchor.x, anchor.y - 1.05, anchor.z]} billboard width={1.6} height={0.4} opacity={0.9}>
          <PanelButton
            position={[0, 0, 0.01]}
            width={1.4}
            height={0.3}
            label="I've got it — let me in"
            onSelect={handleDismiss}
            tone="#f2b84c"
          />
        </Panel3D>
      )}
    </group>
  )
}
