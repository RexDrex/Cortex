import { LANDMARKS, landmarkPosition } from '../logic/landmarks'
import { Panel3D, PanelButton, PanelText } from './Panel3D'

const ROW_HEIGHT = 0.42
const TOP = (LANDMARKS.length - 1) * ROW_HEIGHT * 0.5

// Selecting an item still does exactly what it did as a DOM list: Point
// the way draws the light-path then boosts, Warp jumps instantly. The
// only thing that changed is where this list lives — as an object in
// front of the player, not a browser overlay.
export default function Map3D({ onClose, onPointTheWay, onWarp }) {
  return (
    <Panel3D position={[0, 1.7, 1.6]} billboard width={3.1} height={LANDMARKS.length * ROW_HEIGHT + 0.7}>
      <PanelText position={[0, TOP + 0.55, 0.01]} fontSize={0.13} color="#f5f3ff">
        The Map
      </PanelText>
      {LANDMARKS.map((lm, i) => {
        const y = TOP - i * ROW_HEIGHT + 0.15
        return (
          <group key={lm.id} position={[0, y, 0.01]}>
            <mesh position={[-1.35, 0, 0]}>
              <circleGeometry args={[0.05, 16]} />
              <meshBasicMaterial color={lm.color} />
            </mesh>
            <PanelText position={[-1.2, 0, 0]} fontSize={0.09} maxWidth={1.1} color="#f5f3ff" anchorX="left">
              {lm.label}
            </PanelText>
            <PanelButton
              position={[0.55, 0, 0]}
              width={0.95}
              height={0.24}
              fontSize={0.06}
              label="Point the way"
              onSelect={() => onPointTheWay(lm.id, landmarkPosition(lm))}
              tone="#2cb1bc"
            />
            <PanelButton
              position={[1.35, 0, 0]}
              width={0.55}
              height={0.24}
              fontSize={0.065}
              label="Warp"
              onSelect={() => onWarp(lm.id, landmarkPosition(lm))}
              tone="#7f5af0"
            />
          </group>
        )
      })}
      <PanelButton
        position={[0, -TOP - 0.42, 0.01]}
        width={1}
        height={0.26}
        fontSize={0.075}
        label="Close"
        onSelect={onClose}
        tone="#3a3260"
      />
    </Panel3D>
  )
}
