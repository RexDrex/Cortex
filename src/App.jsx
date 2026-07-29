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
import Map from './components/Map'
import Wisp from './components/Wisp'
import WarpBurst from './components/WarpBurst'
import TouchControls from './components/TouchControls'
import { isTouchDevice } from './logic/device'
import { speakGreeting } from './logic/speak'
import { matchVoidIntent } from './logic/voidIntents'
import { resolveSubFeature, resolveCategorySummary } from './logic/resolveFeature'
import { LANDMARKS, landmarkPosition, getLandmark } from './logic/landmarks'
import './App.css'

const HINT_DELAY_MS = 7000
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const ENTER_RADIUS_MARGIN = 6 // safe return distance outside a hub's ENTER_RADIUS on exit

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
  const [hubBrief, setHubBrief] = useState(null)
  const [interior, setInterior] = useState(null) // { landmarkId, returnPosition }
  const [isTouch] = useState(() => isTouchDevice())

  const flashRef = useRef()
  const greeted = useRef(false)
  const visitedLandmarks = useRef(new Set())
  const joystickRef = useRef({ x: 0, y: 0 })
  const lookDeltaRef = useRef({ dx: 0, dy: 0 })

  const landmarkTargets = useMemo(() => LANDMARKS.map((lm) => ({ id: lm.id, position: landmarkPosition(lm) })), [])

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
    document.exitPointerLock && document.exitPointerLock()
  }, [dismissPopup])

  const handleLearnAboutCortex = useCallback(() => {
    setLearnActive(true)
    dismissPopup()
    document.exitPointerLock && document.exitPointerLock()
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
        if (firstVisit) setHubBrief({ label: lm.label, text: lm.intro, key: Date.now() })
      }, 160)
    },
    [dismissPopup, activeCategory]
  )

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

  const dismissHubBrief = useCallback(() => setHubBrief(null), [])

  // Redundant safety net: even if the player neither moves nor manages
  // to click dismiss, the briefing never lingers indefinitely.
  useEffect(() => {
    if (!hubBrief) return
    const t = setTimeout(() => setHubBrief(null), 6500)
    return () => clearTimeout(t)
  }, [hubBrief])

  const handleOpenMap = useCallback(() => {
    setMapOpen(true)
    document.exitPointerLock && document.exitPointerLock()
  }, [])
  const handleCloseMap = useCallback(() => setMapOpen(false), [])

  const handlePointTheWay = useCallback(
    (id, position) => {
      setLookAtRequest({ id, position, key: `look-${Date.now()}` })
      handleCloseMap()
      dismissPopup()
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
    setHubBrief(null)
    setInterior(null)
    setBoosting(false)
    setListening(false)
    setHinting(false)
    visitedLandmarks.current.clear()
    greeted.current = false
    setPhase('splash')
  }, [])

  // Popups dismiss the moment the player shows intent to just move — this
  // matters especially for hub-brief, which otherwise has no way to
  // close if pointer-lock is engaged (a locked cursor can't click a
  // fixed-position button).
  useEffect(() => {
    if (!popupVisible && !hubBrief) return
    const handler = (e) => {
      if (MOVE_KEYS.includes(e.code)) {
        dismissPopup()
        setHubBrief(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [popupVisible, hubBrief, dismissPopup])

  // Map toggle (M), Escape-to-close for any open overlay, Backspace to
  // leave a hub interior — keyboard paths that don't depend on clicking,
  // since a locked pointer can make fixed-position buttons unreliable.
  useEffect(() => {
    if (phase !== 'world') return
    const handler = (e) => {
      if (e.code === 'KeyM' && !consoleOpen && !learnActive && !interior) {
        setMapOpen((v) => {
          const next = !v
          if (next) document.exitPointerLock && document.exitPointerLock()
          return next
        })
      }
      if (e.code === 'Backspace' && interior && !consoleOpen) {
        handleExitInterior()
      }
      if (e.code === 'Escape') {
        setConsoleOpen(false)
        setMapOpen(false)
        setLearnActive(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, consoleOpen, learnActive, interior, handleExitInterior])

  // The Wisp's hint state.
  useEffect(() => {
    if (phase !== 'world' || popupVisible || learnActive || consoleOpen || mapOpen || listening) {
      setHinting(false)
      return
    }
    const timer = setTimeout(() => setHinting(true), HINT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [phase, popupVisible, learnActive, consoleOpen, mapOpen, listening])

  const firstPersonEnabled = phase === 'world' && !consoleOpen && !mapOpen && !learnActive
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
              />
            ) : (
              <VoidWorld activeCategory={activeCategory} activeSubFeature={activeSubFeature} content={content} />
            )}
            <FirstPersonRig
              enabled={firstPersonEnabled}
              landmarks={interior ? [] : landmarkTargets}
              onArrive={handleArrive}
              onEnterHub={handleEnterHub}
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

      {phase === 'world' && popupVisible && (
        <div className="dashboard-popup">
          <p className="dashboard-popup-text">You have entered Cortex. How may I help you?</p>
          <div className="dashboard-popup-actions">
            <button className="landing-enter-btn" onClick={handleStateIntention}>
              State my intention
            </button>
            <button className="landing-enter-btn landing-enter-btn-ghost" onClick={handleLearnAboutCortex}>
              Learn about Cortex
            </button>
          </div>
          <p className="dashboard-popup-hint">Or just walk {'\u2014'} press W or an arrow key to explore freely.</p>
          <button className="dashboard-popup-dismiss" onClick={dismissPopup} aria-label="Dismiss">
            {'\u2715'}
          </button>
        </div>
      )}

      {phase === 'world' && learnActive && <LearnSequence onComplete={handleLearnComplete} />}

      {phase === 'world' && consoleOpen && (
        <CenterConsole onSubmitIntent={handleSubmitIntent} onActivityChange={setListening} />
      )}

      {phase === 'world' && mapOpen && !interior && (
        <Map onClose={handleCloseMap} onPointTheWay={handlePointTheWay} onWarp={handleWarp} />
      )}

      {phase === 'world' && hubBrief && (
        <div className="hub-brief-popup" key={hubBrief.key}>
          <div className="hub-brief-label">{hubBrief.label}</div>
          <div className="hub-brief-text">{hubBrief.text}</div>
          <button className="hub-brief-dismiss" onClick={dismissHubBrief} aria-label="Dismiss">
            {'\u2715'}
          </button>
        </div>
      )}

      {phase === 'world' && firstPersonEnabled && (
        <TouchControls joystickRef={joystickRef} lookDeltaRef={lookDeltaRef} visible={isTouch} />
      )}

      {phase === 'world' && !isTouch && !consoleOpen && !mapOpen && !learnActive && !pointerLocked && (
        <div className="lock-hint">Click to look around {'\u00b7'} WASD or arrows to move</div>
      )}

      {phase === 'world' && !isTouch && !consoleOpen && !mapOpen && !learnActive && pointerLocked && (
        <div className="unlock-hint">Esc to free your cursor for menus</div>
      )}

      {phase === 'world' && !consoleOpen && !learnActive && (
        <div className="world-hud">
          {!interior && (
            <button className="hud-btn" onClick={handleOpenMap}>
              Map
            </button>
          )}
          <button
            className="hud-btn"
            onClick={() => {
              setConsoleOpen(true)
              document.exitPointerLock && document.exitPointerLock()
            }}
          >
            Speak
          </button>
          {interior ? (
            <button className="hud-btn hud-btn-exit" onClick={handleExitInterior} title={isTouch ? undefined : 'Backspace also works'}>
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

// Stage 3 — "Learn about Cortex". A short immersive sequence rather than
// a static page: a few lines fade in and out in turn, then the player is
// handed back to free exploration.
function LearnSequence({ onComplete }) {
  const lines = [
    'Cortex is a fintech app rebuilt as a place, not a dashboard.',
    'Your accounts, spending, and goals exist as landmarks in an open world.',
    'Walk toward what you want — or simply say it, and Cortex carries you there.',
  ]
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index >= lines.length) {
      const t = setTimeout(onComplete, 900)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setIndex((i) => i + 1), 2600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  return (
    <div className="learn-overlay">
      {lines.map((line, i) => (
        <p key={i} className={`learn-line${i === index ? ' is-active' : ''}${i < index ? ' is-past' : ''}`}>
          {line}
        </p>
      ))}
      <button className="landing-enter-btn learn-skip" onClick={onComplete}>
        Continue exploring
      </button>
    </div>
  )
}
