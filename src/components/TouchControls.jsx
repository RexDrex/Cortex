import { useRef, useEffect, useState } from 'react'

const JOYSTICK_RADIUS = 52
const LEFT_ZONE_FRACTION = 0.42 // touches starting left of this fraction of screen width control movement

const UI_SELECTOR =
  'button, input, textarea, .map-overlay, .dashboard-popup, .hub-brief-popup, .console-wrap, .splash-overlay, .learn-overlay'

// A floating joystick (appears wherever the left thumb first touches) for
// movement, and a drag-anywhere-else zone for look — the touch equivalent
// of WASD + mouse-look. Two independent touch identifiers are tracked so
// both can be used at once, exactly like a real game's dual-stick layout.
export default function TouchControls({ joystickRef, lookDeltaRef, visible }) {
  const baseRef = useRef()
  const joystickTouchId = useRef(null)
  const lookTouchId = useRef(null)
  const lastLook = useRef({ x: 0, y: 0 })
  const [nubPos, setNubPos] = useState({ x: 0, y: 0 })
  const [baseVisible, setBaseVisible] = useState(false)
  const [basePos, setBasePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!visible) return

    const onTouchStart = (e) => {
      for (const t of e.changedTouches) {
        if (t.target && t.target.closest && t.target.closest(UI_SELECTOR)) continue
        const isLeft = t.clientX < window.innerWidth * LEFT_ZONE_FRACTION
        if (isLeft && joystickTouchId.current === null) {
          joystickTouchId.current = t.identifier
          baseRef.current.dataset.originX = t.clientX
          baseRef.current.dataset.originY = t.clientY
          setBasePos({ x: t.clientX, y: t.clientY })
          setBaseVisible(true)
        } else if (!isLeft && lookTouchId.current === null) {
          lookTouchId.current = t.identifier
          lastLook.current = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const onTouchMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joystickTouchId.current) {
          const ox = parseFloat(baseRef.current.dataset.originX)
          const oy = parseFloat(baseRef.current.dataset.originY)
          let dx = t.clientX - ox
          let dy = t.clientY - oy
          const dist = Math.hypot(dx, dy)
          if (dist > JOYSTICK_RADIUS) {
            dx = (dx / dist) * JOYSTICK_RADIUS
            dy = (dy / dist) * JOYSTICK_RADIUS
          }
          setNubPos({ x: dx, y: dy })
          if (joystickRef.current) {
            joystickRef.current.x = dx / JOYSTICK_RADIUS
            joystickRef.current.y = dy / JOYSTICK_RADIUS
          }
        } else if (t.identifier === lookTouchId.current) {
          const dx = t.clientX - lastLook.current.x
          const dy = t.clientY - lastLook.current.y
          if (lookDeltaRef.current) {
            lookDeltaRef.current.dx += dx
            lookDeltaRef.current.dy += dy
          }
          lastLook.current = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joystickTouchId.current) {
          joystickTouchId.current = null
          setNubPos({ x: 0, y: 0 })
          setBaseVisible(false)
          if (joystickRef.current) {
            joystickRef.current.x = 0
            joystickRef.current.y = 0
          }
        }
        if (t.identifier === lookTouchId.current) {
          lookTouchId.current = null
        }
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [visible, joystickRef, lookDeltaRef])

  if (!visible) return null

  return (
    <>
      <div
        ref={baseRef}
        className="touch-joystick-base"
        style={{
          opacity: baseVisible ? 1 : 0,
          left: basePos.x - JOYSTICK_RADIUS,
          top: basePos.y - JOYSTICK_RADIUS,
          width: JOYSTICK_RADIUS * 2,
          height: JOYSTICK_RADIUS * 2,
        }}
      >
        <div className="touch-joystick-nub" style={{ transform: `translate(${nubPos.x}px, ${nubPos.y}px)` }} />
      </div>
      <div className="touch-look-hint">Drag here to look around</div>
    </>
  )
}
