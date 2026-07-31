import { Panel3D, PanelButton, PanelText } from './Panel3D'

// Replaces the old screen-locked dashboard-popup entirely. This exists
// as an object in the world, a few meters in front of where the player
// arrives — something they look at and choose from, not a website popup
// laid over the scene. Ignoring it and simply walking is still how a
// player ends up in free exploration; nothing here blocks movement.
export default function EntryPrompt({ onStateIntention, onLearnAboutCortex, onDismiss }) {
  return (
    <Panel3D position={[0, 1.7, 1.4]} width={2.6} height={1.7} billboard>
      <PanelText position={[0, 0.62, 0.01]} fontSize={0.11} maxWidth={2.3}>
        You have entered Cortex. How may I help you?
      </PanelText>
      <PanelButton position={[0, 0.12, 0.01]} width={2.1} height={0.34} label="State my intention" onSelect={onStateIntention} tone="#7f5af0" />
      <PanelButton
        position={[0, -0.3, 0.01]}
        width={2.1}
        height={0.34}
        label="Learn about Cortex"
        onSelect={onLearnAboutCortex}
        tone="#2cb1bc"
      />
      <PanelText position={[0, -0.62, 0.01]} fontSize={0.08} maxWidth={2.3} color="#8b83b3">
        Or just walk — press an arrow key to explore freely.
      </PanelText>
      <PanelButton position={[1.05, 0.72, 0.01]} width={0.28} height={0.22} label="\u2715" onSelect={onDismiss} tone="#3a3260" />
    </Panel3D>
  )
}
