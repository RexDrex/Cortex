import { useState, useRef, useCallback, useEffect } from 'react'

// The Surface layer's real tutorial: a handful of panels the player can
// grab and reposition, covering what this place is and how to move
// through it. Dismissing doesn't just fade them out — every panel
// swirls inward into an orbit around the player and vanishes, which is
// the "population circles around you and vanishes" moment.
const PANELS = [
  {
    id: 'welcome',
    title: 'The surface layer',
    body: "You're standing at the center of it. Your accounts, spending, goals, and everything else you keep here exist as real places around you — not menu items.",
    home: { top: '14%', left: '10%' },
  },
  {
    id: 'move',
    title: 'Moving freely',
    body: 'Arrow keys or WASD walk you forward, back, and side to side. Move your mouse — or drag on a touch screen — to look around.',
    home: { top: '10%', left: '62%' },
  },
  {
    id: 'vast',
    title: 'How vast this is',
    body: "This world is enormous — far too vast to see the features from here, and usually too vast to simply walk to one. That's what the other three ways of traveling are for.",
    home: { top: '58%', left: '8%' },
  },
  {
    id: 'travel',
    title: 'Four ways to get anywhere',
    body: 'Warp from the Map for an instant jump. Point Direction to see the path first, then get boosted along it. Flow — just walk. Or step through one of the rings around you.',
    home: { top: '62%', left: '58%' },
  },
  {
    id: 'rings',
    title: 'The rings around you',
    body: 'Each ring here faces one feature. Walking close raises a prompt — nothing teleports until you confirm it, so you never step through by accident.',
    home: { top: '34%', left: '36%' },
  },
]

function OverviewPanel({ panel, dismissing }) {
  const elRef = useRef(null)
  const dragState = useRef(null)
  const [pos, setPos] = useState({ top: panel.home.top, left: panel.home.left })
  const [dismissTransform, setDismissTransform] = useState('')

  const handlePointerDown = useCallback((e) => {
    if (dismissing) return
    const rect = elRef.current.getBoundingClientRect()
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [dismissing])

  const handlePointerMove = useCallback((e) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setPos({ top: `${dragState.current.origY + dy}px`, left: `${dragState.current.origX + dx}px` })
  }, [])

  const handlePointerUp = useCallback((e) => {
    dragState.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  useEffect(() => {
    if (!dismissing || !elRef.current) return
    // Measure wherever this panel actually is right now (it may have been
    // dragged anywhere) and swirl it inward toward the viewport center —
    // this is the "population circles around you and vanishes" moment.
    const rect = elRef.current.getBoundingClientRect()
    const dx = window.innerWidth / 2 - (rect.left + rect.width / 2)
    const dy = window.innerHeight / 2 - (rect.top + rect.height / 2)
    const spin = 200 + Math.random() * 120
    setDismissTransform(`translate(${dx}px, ${dy}px) scale(0.12) rotate(${spin}deg)`)
  }, [dismissing])

  return (
    <div
      ref={elRef}
      className={`overview-panel${dismissing ? ' is-dismissing' : ''}`}
      style={{ top: pos.top, left: pos.left, transform: dismissTransform || undefined }}
    >
      <div
        className="overview-panel-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {panel.title}
      </div>
      <div className="overview-panel-body">{panel.body}</div>
    </div>
  )
}

export default function Overview({ onComplete }) {
  const [dismissing, setDismissing] = useState(false)

  const handleDismiss = useCallback(() => {
    setDismissing(true)
    setTimeout(onComplete, 720) // matches the swirl-and-vanish transition duration below
  }, [onComplete])

  return (
    <div className="overview-overlay">
      {PANELS.map((panel) => (
        <OverviewPanel key={panel.id} panel={panel} dismissing={dismissing} />
      ))}
      <button className="landing-enter-btn overview-dismiss" onClick={handleDismiss} disabled={dismissing}>
        I've got it — let me in
      </button>
    </div>
  )
}
