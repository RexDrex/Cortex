import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { gsap } from 'gsap'
import Splash from './scenes/Splash'
import VoidEntrance from './scenes/VoidEntrance'
import ExitVortex from './scenes/ExitVortex'
import VoidWorld from './scenes/VoidWorld'
import HubInterior from './scenes/HubInterior'
import FirstPersonRig from './components/FirstPersonRig'
import CenterConsole from './components/CenterConsole'
import Map3D from './components/Map3D'
import Wisp from './components/Wisp'
import WarpBurst from './components/WarpBurst'
import TouchControls from './components/TouchControls'
import TeleportRing from './components/TeleportRing'
import PathLine from './components/PathLine'
import Overview, { buildFeaturePanels } from './components/Overview'
import EntryPrompt from './components/EntryPrompt'
import RingPrompt3D from './components/RingPrompt3D'
import Crosshair from './components/Crosshair'
import { isTouchDevice } from './logic/device'
import { speakGreeting } from './logic/speak'
import { matchVoidIntent } from './logic/voidIntents'
import { resolveSubFeature, resolveCategorySummary } from './logic/resolveFeature'
import { LANDMARKS, landmarkPosition, getLandmark, neighborsOf } from './logic/landmarks'

const RING_DIST = 10 // how far out from the center the teleportation rings sit
import './App.css'

const HINT_DELAY_MS = 7000
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const ENTER_RADIUS_MARGIN = 22 // safe return distance outside a hub's ENTER_RADIUS on exit (scaled with the enlarged hubs)

function pierceFlash(flashRef) {
  if (!flashRef.current) return
  gsap
    .timeline()
    .to(flashRef.current, { opacity: 0.88, duration: 0.12, ease: 'power1.out' })
    .to(flashRef.current, { opacity: 0, duration: 0.4, ease: 'power2.out' })
}

// Phase: 'splash' -> 'entrance' (hyperspace tunnel) -> 'world' -> 'exit' -> 'splash'
// Within 'world': either the open Void (roaming, calling, warping between
// landmarks) or, once a landmark's threshold is pierced, a sealed
// `interior` — its own self-contained scene the player is inside of,
// with an explicit way back out to exactly where they were standing.
export default function App() {
  const [phase, setPhase] = useState('splash')
  const [popupVisible, setPopupVisible] = useState(false)
  const [learnActive, setLearnActive] = useState(false)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [pointerLocked, setPointerLocked] = useState(false)
  const [listening, setListening] = useState(false)
  const [hinting, setHinting] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeSubFeature, setActiveSubFeature] = useState(null)
  const [content, setContent] = useState(null)
  const [warpRequest, setWarpRequest] = useState(null)
  const [lookAtRequest, setLookAtRequest] = useState(null)
  const [teleportRequest, setTeleportRequest] = useState(null)
  const [boosting, setBoosting] = useState(false)
  const [featureOverviewOpen, setFeatureOverviewOpen] = useState(false)
  const [interior, setInterior] = useState(null) // { landmarkId, returnPosition }
  const [isTouch] = useState(() => isTouchDevice())
  const [ringPrompt, setRingPrompt] = useState(null) // { id, label, position }
  const [pathRequest, setPathRequest] = useState(null) // { to, key } — the visible Point Direction line

  const flashRef = useRef()
  const greeted = useRef(false)
  const visitedLandmarks = useRef(new Set())
  const joystickRef = useRef({ x: 0, y: 0 })
  const lookDeltaRef = useRef({ dx: 0, dy: 0 })

  const landmarkTargets = useMemo(() => LANDMARKS.map((lm) => ({ id: lm.id, position: landmarkPosition(lm) })), [])

  // One ring per landmark, standing near the center, each rotated to
  // face that landmark's actual direction — so "which ring goes where"
  // is legible just from how they're arranged, not just from labels.
  const teleportRings = useMemo(
    () =>
      LANDMARKS.map((lm) => {
        const angle = Math.atan2(lm.z, lm.x)
        return {
          id: lm.id,
          label: lm.label,
          color: lm.color,
          angle,
          position: [Math.cos(angle) * RING_DIST, 1.6, Math.sin(angle) * RING_DIST],
        }
      }),
    []
  )

  const dismissPopup = useCallback(() => setPopupVisible(false), [])

  const handleEnterSplash = useCallback(() => setPhase('entrance'), [])

  const handleEntranceComplete = useCallback(() => {
    setPhase('world')
    setPopupVisible(true)
    if (!greeted.current) {
      greeted.current = true
      setTimeout(() => speakGreeting('You have entered Cortex. How may I help you?'), 500)
    }
  }, [])

  const handleStateIntention = useCallback(() => {
    setConsoleOpen(true)
    dismissPopup()
    // CenterConsole still needs a real DOM text input for typing — the
    // one deliberate exception in an otherwise fully 3D interface, so
    // this is the one place a lock release is still genuinely required.
    document.exitPointerLock && document.exitPointerLock()
  }, [dismissPopup])

  const handleLearnAboutCortex = useCallback(() => {
    setLearnActive(true)
    dismissPopup()
  }, [dismissPopup])

  const handleLearnComplete = useCallback(() => setLearnActive(false), [])

  const applyResult = useCallback((categoryId, subFeatureId) => {
    setActiveCategory(categoryId)
    setActiveSubFeature(subFeatureId)
    setContent(subFeatureId ? resolveSubFeature(categoryId, subFeatureId) : resolveCategorySummary(categoryId))
  }, [])

  const handleSubmitIntent = useCallback(
    (text) => {
      // Inside a sealed interior, intent only searches this hub's own
      // sub-features — no warping away while you're standing inside
      // something else.
      if (interior) {
        const lm = getLandmark(interior.landmarkId)
        const lower = text.toLowerCase()
        const match = lm.subFeatures.find((sf) => sf.keywords.some((k) => lower.includes(k)))
        if (match) {
          applyResult(interior.landmarkId, match.id)
        } else {
          speakGreeting(`Try one of: ${lm.subFeatures.map((s) => s.label).join(', ')}.`)
        }
        setConsoleOpen(false)
        return
      }

      const matched = matchVoidIntent(text)
      if (!matched) {
        speakGreeting("I don't have that yet — try accounts, spending, or a goal by name.")
        return
      }
      applyResult(matched.categoryId, matched.subFeatureId)
      const lm = getLandmark(matched.categoryId)
      setWarpRequest({ id: lm.id, position: landmarkPosition(lm), key: `intent-${Date.now()}` })
      setConsoleOpen(false)
      dismissPopup()
    },
    [interior, applyResult, dismissPopup]
  )

  const handleArrive = useCallback(() => {
    dismissPopup()
  }, [dismissPopup])

  const handleEnterHub = useCallback(
    (landmarkId, exteriorPos) => {
      dismissPopup()
      const lm = getLandmark(landmarkId)
      if (!lm) return

      const firstVisit = !visitedLandmarks.current.has(landmarkId)
      visitedLandmarks.current.add(landmarkId)

      // Stale content from a different landmark shouldn't carry in.
      if (activeCategory !== landmarkId) {
        setActiveSubFeature(null)
        setContent(null)
        setActiveCategory(landmarkId)
      }

      const [lx, , lz] = landmarkPosition(lm)
      const dx = exteriorPos[0] - lx
      const dz = exteriorPos[2] - lz
      const dist = Math.sqrt(dx * dx + dz * dz) || 1
      const returnPosition = [lx + (dx / dist) * ENTER_RADIUS_MARGIN, 0, lz + (dz / dist) * ENTER_RADIUS_MARGIN]

      pierceFlash(flashRef)
      setTimeout(() => {
        setInterior({ landmarkId, returnPosition })
        setTeleportRequest({ position: [0, 1.6, 3], lookAt: [0, 1.6, 0], key: `pierce-in-${Date.now()}` })
        if (firstVisit) setFeatureOverviewOpen(true)
      }, 160)
    },
    [dismissPopup, activeCategory]
  )

  const handleApproachRing = useCallback(
    (id) => {
      const ring = teleportRings.find((r) => r.id === id)
      if (!ring) return
      setRingPrompt(ring)
    },
    [teleportRings]
  )

  const handleLeaveRing = useCallback((id) => {
    setRingPrompt((prev) => (prev && prev.id === id ? null : prev))
  }, [])

  const handleCancelRingPrompt = useCallback(() => setRingPrompt(null), [])

  const handleConfirmRingTeleport = useCallback(() => {
    if (!ringPrompt) return
    const { id, position } = ringPrompt
    const lm = getLandmark(id)
    if (!lm) return
    setRingPrompt(null)

    const firstVisit = !visitedLandmarks.current.has(id)
    visitedLandmarks.current.add(id)
    if (activeCategory !== id) {
      setActiveSubFeature(null)
      setContent(null)
      setActiveCategory(id)
    }

    pierceFlash(flashRef)
    setTimeout(() => {
      // Landing back here later (via this hub's own Exit ring) returns
      // the player to exactly the ring they stepped through — a clean
      // round trip, the same way piercing in from the open Void does.
      setInterior({ landmarkId: id, returnPosition: position })
      setTeleportRequest({ position: [0, 1.6, 3], lookAt: [0, 1.6, 0], key: `ring-in-${Date.now()}` })
      if (firstVisit) setFeatureOverviewOpen(true)
    }, 160)
  }, [ringPrompt, activeCategory])

  const handleJumpToNeighbor = useCallback(
    (neighborId) => {
      const lm = getLandmark(neighborId)
      if (!lm) return
      const firstVisit = !visitedLandmarks.current.has(neighborId)
      visitedLandmarks.current.add(neighborId)
      if (activeCategory !== neighborId) {
        setActiveSubFeature(null)
        setContent(null)
        setActiveCategory(neighborId)
      }
      const [lx, , lz] = landmarkPosition(lm)
      const dist = Math.sqrt(lx * lx + lz * lz) || 1
      const returnPosition = [lx - (lx / dist) * ENTER_RADIUS_MARGIN, 0, lz - (lz / dist) * ENTER_RADIUS_MARGIN]
      pierceFlash(flashRef)
      setTimeout(() => {
        setInterior({ landmarkId: neighborId, returnPosition })
        setTeleportRequest({ position: [0, 1.6, 3], lookAt: [0, 1.6, 0], key: `neighbor-${Date.now()}` })
        if (firstVisit) setFeatureOverviewOpen(true)
      }, 160)
    },
    [activeCategory]
  )

  // The ring back to the Surface Overview/center — a structured jump to
  // the world's spawn point, distinct from Exit (which just drops the
  // player into Flow exactly where they already were).
  const handleReturnToCenter = useCallback(() => {
    pierceFlash(flashRef)
    setTimeout(() => {
      setInterior(null)
      setTeleportRequest({ position: [0, 1.6, 5], key: `return-center-${Date.now()}` })
    }, 160)
  }, [])

  const handleExitInterior = useCallback(() => {
    if (!interior) return
    const returnPosition = interior.returnPosition
    pierceFlash(flashRef)
    setTimeout(() => {
      setInterior(null)
      setTeleportRequest({ position: returnPosition, key: `pierce-out-${Date.now()}` })
    }, 160)
  }, [interior])

  const handleInteriorSelectSubFeature = useCallback(
    (subFeatureId) => {
      if (!interior) return
      applyResult(interior.landmarkId, subFeatureId)
    },
    [interior, applyResult]
  )

  // Feature Overview has its own explicit dismiss controls (each panel's
  // "Pull closer/Release", plus the main entry button) and movement is
  // already paused while it's open, so no separate safety-net timeout
  // is needed the way the old DOM hub-brief required one.

  const handleOpenMap = useCallback(() => {
    setMapOpen(true)
  }, [])
  const handleCloseMap = useCallback(() => setMapOpen(false), [])

  const handlePointTheWay = useCallback(
    (id, position) => {
      const key = `look-${Date.now()}`
      setLookAtRequest({ id, position, key })
      setPathRequest({ to: position, key })
      handleCloseMap()
      dismissPopup()
      // Let the path actually be seen before the booster fires — this
      // delay is the whole point of Point Direction: you watch the route
      // light up first, instead of an instant, abstracted jump.
      setTimeout(() => {
        setWarpRequest({ id, position, key: `pointdir-${Date.now()}` })
      }, 650)
    },
    [handleCloseMap, dismissPopup]
  )

  const handleWarp = useCallback(
    (id, position) => {
      setWarpRequest({ id, position, key: `warp-${Date.now()}` })
      handleCloseMap()
      dismissPopup()
    },
    [handleCloseMap, dismissPopup]
  )

  const handleExit = useCallback(() => setPhase('exit'), [])

  const handleExitComplete = useCallback(() => {
    setPopupVisible(false)
    setLearnActive(false)
    setConsoleOpen(false)
    setMapOpen(false)
    setActiveCategory(null)
    setActiveSubFeature(null)
    setContent(null)
    setWarpRequest(null)
    setLookAtRequest(null)
    setTeleportRequest(null)
    setFeatureOverviewOpen(false)
    setInterior(null)
    setBoosting(false)
    setListening(false)
    setHinting(false)
    setRingPrompt(null)
    setPathRequest(null)
    visitedLandmarks.current.clear()
    greeted.current = false
    setPhase('splash')
  }, [])

  // The entry popup dismisses the moment the player shows intent to just
  // move — a nice-to-have fallback alongside its own explicit dismiss
  // button, which (now that it's a real 3D panel) works under pointer
  // lock the same way every other in-world button does.
  useEffect(() => {
    if (!popupVisible) return
    const handler = (e) => {
      if (MOVE_KEYS.includes(e.code)) dismissPopup()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [popupVisible, dismissPopup])

  // Map toggle (M), Escape-to-close for any open overlay, Backspace to
  // Map (M), Speak (V), Backspace to leave a hub interior, Q to leave
  // Cortex entirely — every action reachable by key, since the old
  // fixed-position button bar is gone along with the rest of the 2D UI.
  // Disabling firstPersonEnabled (via mapOpen/consoleOpen) already
  // unmounts PointerLockControls and releases the lock on its own.
  useEffect(() => {
    if (phase !== 'world') return
    const handler = (e) => {
      if (e.code === 'KeyM' && !consoleOpen && !learnActive && !interior) {
        setMapOpen((v) => !v)
      }
      if (e.code === 'KeyV' && !mapOpen && !learnActive) {
        setConsoleOpen(true)
        document.exitPointerLock && document.exitPointerLock()
      }
      if (e.code === 'Backspace' && interior && !consoleOpen) {
        handleExitInterior()
      }
      if (e.code === 'KeyQ' && !consoleOpen && !mapOpen && !learnActive) {
        handleExit()
      }
      if (e.code === 'Escape') {
        setConsoleOpen(false)
        setMapOpen(false)
        setLearnActive(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, consoleOpen, mapOpen, learnActive, interior, handleExitInterior, handleExit])

  // The Wisp's hint state.
  useEffect(() => {
    if (phase !== 'world' || popupVisible || learnActive || consoleOpen || mapOpen || listening) {
      setHinting(false)
      return
    }
    const timer = setTimeout(() => setHinting(true), HINT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase, popupVisible, learnActive, consoleOpen, mapOpen, listening])

  const firstPersonEnabled = phase === 'world' && !consoleOpen && !mapOpen && !learnActive && !ringPrompt && !featureOverviewOpen
  const activeLandmark = interior ? getLandmark(interior.landmarkId) : null

  return (
    <div className="scene-container">
      <Canvas camera={{ position: [0, 1.6, 5], fov: 62 }} gl={{ antialias: true }}>
        {!interior && <color attach="background" args={['#07050f']} />}
        {!interior && <fog attach="fog" args={['#07050f', 22, 95]} />}

        {phase === 'splash' && <Splash />}
        {phase === 'entrance' && <VoidEntrance onComplete={handleEntranceComplete} flashRef={flashRef} />}

        {phase === 'world' && (
          <>
            {interior ? (
              <HubInterior
                landmark={activeLandmark}
                activeSubFeature={activeSubFeature}
                content={content}
                onSelectSubFeature={handleInteriorSelectSubFeature}
                onExit={handleExitInterior}
                neighbors={interior ? neighborsOf(interior.landmarkId) : []}
                onJumpToNeighbor={handleJumpToNeighbor}
                onReturnToCenter={handleReturnToCenter}
              />
            ) : (
              <VoidWorld activeCategory={activeCategory} activeSubFeature={activeSubFeature} content={content} />
            )}
            {!interior &&
              teleportRings.map((r) => (
                <TeleportRing key={r.id} position={r.position} angle={r.angle} color={r.color} label={r.label} />
              ))}
            {!interior && pathRequest && <PathLine to={pathRequest.to} requestKey={pathRequest.key} />}
            {!interior && popupVisible && (
              <EntryPrompt onStateIntention={handleStateIntention} onLearnAboutCortex={handleLearnAboutCortex} onDismiss={dismissPopup} />
            )}
            {!interior && ringPrompt && (
              <RingPrompt3D
                key={ringPrompt.id}
                position={ringPrompt.position}
                label={ringPrompt.label}
                onConfirm={handleConfirmRingTeleport}
                onCancel={handleCancelRingPrompt}
              />
            )}
            {!interior && mapOpen && <Map3D onClose={handleCloseMap} onPointTheWay={handlePointTheWay} onWarp={handleWarp} />}
            {learnActive && <Overview onComplete={handleLearnComplete} />}
            {interior && featureOverviewOpen && (
              <Overview panels={buildFeaturePanels(activeLandmark)} onComplete={() => setFeatureOverviewOpen(false)} />
            )}
            <FirstPersonRig
              enabled={firstPersonEnabled}
              landmarks={interior ? [] : landmarkTargets}
              rings={interior ? [] : teleportRings}
              onArrive={handleArrive}
              onEnterHub={handleEnterHub}
              onApproachRing={handleApproachRing}
              onLeaveRing={handleLeaveRing}
              onBoostStart={() => setBoosting(true)}
              onBoostEnd={() => setBoosting(false)}
              warpRequest={warpRequest}
              lookAtRequest={lookAtRequest}
              teleportRequest={teleportRequest}
              onLockChange={setPointerLocked}
              touchMode={isTouch}
              joystickRef={joystickRef}
              lookDeltaRef={lookDeltaRef}
            />
            <WarpBurst active={boosting} />
            <Wisp active={listening} hinting={hinting} recede={Boolean(content)} />
          </>
        )}

        {phase === 'exit' && <ExitVortex onComplete={handleExitComplete} flashRef={flashRef} />}

        <EffectComposer>
          <Bloom intensity={1.5} luminanceThreshold={0.12} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>

      <div ref={flashRef} className="flash-overlay" />

      {phase === 'splash' && (
        <div className="splash-overlay">
          <h1 className="splash-title">Welcome to Cortex</h1>
          <p className="splash-subcopy">Your financial life, as a place you actually stand inside.</p>
          <button className="landing-enter-btn" onClick={handleEnterSplash}>
            Enter, Explore, Discover
          </button>
        </div>
      )}

      {phase === 'world' && consoleOpen && (
        <CenterConsole onSubmitIntent={handleSubmitIntent} onActivityChange={setListening} />
      )}

      <Crosshair visible={phase === 'world' && firstPersonEnabled && !isTouch} />

      {phase === 'world' && firstPersonEnabled && (
        <TouchControls joystickRef={joystickRef} lookDeltaRef={lookDeltaRef} visible={isTouch} />
      )}

      {phase === 'world' && !isTouch && !consoleOpen && !mapOpen && !learnActive && !pointerLocked && (
        <div className="lock-hint">
          Click to look around {'\u00b7'} WASD or arrows to move {'\u00b7'} M for the Map {'\u00b7'} V to speak
          {interior ? ' \u00b7 Backspace to leave' : ' \u00b7 Q to exit Cortex'}
        </div>
      )}

      {phase === 'world' && !isTouch && !consoleOpen && !mapOpen && !learnActive && pointerLocked && (
        <div className="unlock-hint">Esc to free your cursor {'\u00b7'} M \u00b7 V {'\u00b7'} Q</div>
      )}

      {/* Touch devices have no keyboard for the M / V / Q shortcuts above,
          so this small trigger row is a deliberate, minimal exception —
          not a return to the old fixed 2D button bar, just the minimum
          needed for touch users to reach the same actions. */}
      {phase === 'world' && isTouch && !consoleOpen && !learnActive && !featureOverviewOpen && (
        <div className="world-hud world-hud-touch">
          {!interior && (
            <button className="hud-btn" onClick={handleOpenMap}>
              Map
            </button>
          )}
          <button
            className="hud-btn"
            onClick={() => {
              setConsoleOpen(true)
            }}
          >
            Speak
          </button>
          {interior ? (
            <button className="hud-btn hud-btn-exit" onClick={handleExitInterior}>
              Leave
            </button>
          ) : (
            <button className="hud-btn hud-btn-exit" onClick={handleExit}>
              Exit
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Stage 3 — "Learn about Cortex" now renders the real Overview
// component (src/components/Overview.jsx) — floating, draggable panels
// with a proper swirl-and-vanish dismiss, replacing the old three-line
// placeholder that used to live here.
