import { Panel3D, PanelButton, PanelText } from './Panel3D'

export default function HubBrief3D({ label, text, onDismiss }) {
  return (
    <Panel3D position={[0, 1.7, 1.2]} billboard width={2.3} height={1.3}>
      <PanelText position={[0, 0.42, 0.01]} fontSize={0.1} maxWidth={2} color="#f5f3ff">
        {label}
      </PanelText>
      <PanelText position={[0, 0.14, 0.01]} fontSize={0.08} maxWidth={2}>
        {text}
      </PanelText>
      <PanelButton position={[0, -0.46, 0.01]} width={1.2} height={0.28} label="Got it" onSelect={onDismiss} tone="#2cb1bc" />
    </Panel3D>
  )
}
