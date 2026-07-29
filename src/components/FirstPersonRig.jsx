import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'

const MOVE_SPEED = 5.2
const EYE_HEIGHT = 1.6
const BOOST_RADIUS = 9
const ENTER_RADIUS = 3.4
const APPROACH_OFFSET = 7.5
const TOUCH_LOOK_SENSITIVITY = 0.0026
const MAX_PITCH = Math.PI / 2 - 0.05

// Replaces the earlier "camera flies to a fixed node" model entirely.
// Two control schemes, chosen once by the caller via `touchMode`:
//   desktop — PointerLockControls (mouse-look) + WASD/arrow keys
//   touch   — manual yaw/pitch driven by a drag-to-look zone, movement
//             driven by a virtual joystick (both supplied externally via
//             refs, since PointerLockControls has no touch equivalent —
//             there's no pointer to lock on a touchscreen)
// Three things trigger the same unified "boost": proximity, a stated
// intent, or a Map selection.
export default function FirstPersonRig({
  enabled,
  landmarks = [],
  onArrive,
  onEnterHub,
  onBoostStart,
  onBoostEnd,
  warpRequest,
  lookAtRequest,
  teleportRequest,
  onLockChange,
  touchMode = false,
  joystickRef,
  lookDeltaRef,
}) {
  const controlsRef = useRef()
  const { camera } = useThree()
  const keys = useRef({})
  const moveVec = useRef(new THREE.Vector3())
  const forwardVec = useRef(new THREE.Vector3())
  const rightVec = useRef(new THREE.Vector3())
  const boosting = useRef(false)
  const arrivedId = useRef(null)
  const enteredId = useRef(null)
  const lastWarpKey = useRef(null)
  const lastLookKey = useRef(null)
  const lastTeleportKey = useRef(null)
  const yaw = useRef(0)
  const pitch = useRef(0)

  const syncYawPitchFromCamera = useCallback(() => {
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
    yaw.current = euler.y
    pitch.current = euler.x
  }, [camera])

  useEffect(() => {
    const isTypingTarget = () => {
      const el = document.activeElement
      return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
    }
    const down = (e) => {
      if (isTypingTarget()) return
      keys.current[e.code] = true
    }
    const up = (e) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    camera.position.y = EYE_HEIGHT
    if (touchMode) syncYawPitchFromCamera()
  }, [camera, touchMode, syncYawPitchFromCamera])

  const boostTo = useCallback(
    (targetPos, id) => {
      boosting.current = true
      onBoostStart && onBoostStart()
      const dir = new THREE.Vector3(targetPos[0] - camera.position.x, 0, targetPos[2] - camera.position.z)
      const dist = dir.length() || 1
      dir.normalize()
      const approachPoint = new THREE.Vector3(
        targetPos[0] - dir.x * APPROACH_OFFSET,
        EYE_HEIGHT,
        targetPos[2] - dir.z * APPROACH_OFFSET
      )
      gsap.to(camera.position, {
        x: approachPoint.x,
        y: approachPoint.y,
        z: approachPoint.z,
        duration: Math.min(2.6, 0.9 + dist * 0.03),
        ease: 'power2.inOut',
        onComplete: () => {
          boosting.current = false
          arrivedId.current = id
          onBoostEnd && onBoostEnd()
          onArrive && onArrive(id)
        },
      })
    },
    [camera, onArrive, onBoostStart, onBoostEnd]
  )

  useEffect(() => {
    if (!warpRequest || warpRequest.key === lastWarpKey.current) return
    lastWarpKey.current = warpRequest.key
    boostTo(warpRequest.position, warpRequest.id)
  }, [warpRequest, boostTo])

  useEffect(() => {
    if (!lookAtRequest || lookAtRequest.key === lastLookKey.current) return
    lastLookKey.current = lookAtRequest.key

    const startQuat = camera.quaternion.clone()
    const dummy = camera.clone()
    dummy.position.copy(camera.position)
    dummy.lookAt(lookAtRequest.position[0], EYE_HEIGHT, lookAtRequest.position[2])
    const endQuat = dummy.quaternion.clone()

    const obj = { t: 0 }
    gsap.to(obj, {
      t: 1,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate: () => camera.quaternion.slerpQuaternions(startQuat, endQuat, obj.t),
      onComplete: () => touchMode && syncYawPitchFromCamera(),
    })
  }, [lookAtRequest, camera, touchMode, syncYawPitchFromCamera])

  useEffect(() => {
    if (!teleportRequest || teleportRequest.key === lastTeleportKey.current) return
    lastTeleportKey.current = teleportRequest.key
    camera.position.set(teleportRequest.position[0], EYE_HEIGHT, teleportRequest.position[2])
    if (teleportRequest.lookAt) {
      camera.lookAt(teleportRequest.lookAt[0], EYE_HEIGHT, teleportRequest.lookAt[2])
    }
    if (touchMode) syncYawPitchFromCamera()
  }, [teleportRequest, camera, touchMode, syncYawPitchFromCamera])

  const handleLock = useCallback(() => onLockChange && onLockChange(true), [onLockChange])
  const handleUnlock = useCallback(() => onLockChange && onLockChange(false), [onLockChange])

  useFrame((_, delta) => {
    if (!enabled || boosting.current) return

    if (touchMode && lookDeltaRef && lookDeltaRef.current) {
      yaw.current -= lookDeltaRef.current.dx * TOUCH_LOOK_SENSITIVITY
      pitch.current -= lookDeltaRef.current.dy * TOUCH_LOOK_SENSITIVITY
      pitch.current = THREE.MathUtils.clamp(pitch.current, -MAX_PITCH, MAX_PITCH)
      lookDeltaRef.current.dx = 0
      lookDeltaRef.current.dy = 0
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw.current
      camera.rotation.x = pitch.current
      camera.rotation.z = 0
    }

    camera.getWorldDirection(forwardVec.current)
    forwardVec.current.y = 0
    forwardVec.current.normalize()
    rightVec.current.crossVectors(forwardVec.current, camera.up).normalize()

    moveVec.current.set(0, 0, 0)
    let intensity = 1
    if (touchMode && joystickRef && joystickRef.current) {
      const jx = joystickRef.current.x
      const jy = joystickRef.current.y
      moveVec.current.addScaledVector(forwardVec.current, -jy)
      moveVec.current.addScaledVector(rightVec.current, jx)
      intensity = Math.min(Math.hypot(jx, jy), 1)
    } else {
      if (keys.current['KeyW'] || keys.current['ArrowUp']) moveVec.current.add(forwardVec.current)
      if (keys.current['KeyS'] || keys.current['ArrowDown']) moveVec.current.sub(forwardVec.current)
      if (keys.current['KeyD'] || keys.current['ArrowRight']) moveVec.current.add(rightVec.current)
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveVec.current.sub(rightVec.current)
    }

    if (moveVec.current.lengthSq() > 0.0001) {
      moveVec.current.normalize().multiplyScalar(MOVE_SPEED * delta * intensity)
      camera.position.add(moveVec.current)
      camera.position.y = EYE_HEIGHT
    }

    for (const lm of landmarks) {
      const dx = camera.position.x - lm.position[0]
      const dz = camera.position.z - lm.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < BOOST_RADIUS && arrivedId.current !== lm.id) {
        boostTo(lm.position, lm.id)
        break
      }
      if (dist < ENTER_RADIUS && enteredId.current !== lm.id) {
        enteredId.current = lm.id
        onEnterHub && onEnterHub(lm.id, [camera.position.x, camera.position.y, camera.position.z])
      }
      if (dist >= ENTER_RADIUS && enteredId.current === lm.id) {
        enteredId.current = null
      }
    }
  })

  if (!enabled) return null
  if (touchMode) return null // no pointer to lock on a touchscreen — look is handled manually above

  return <PointerLockControls ref={controlsRef} onLock={handleLock} onUnlock={handleUnlock} />
}
