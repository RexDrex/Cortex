import { Panel3D, PanelButton, PanelText } from './Panel3D'

export default function RingPrompt3D({ position, label, onConfirm, onCancel }) {
  return (
    <Panel3D position={[position[0], position[1] + 1.6, position[2]]} billboard width={1.8} height={0.9} borderColor="#f2b84c">
      <PanelText position={[0, 0.24, 0.01]} fontSize={0.1} maxWidth={1.5}>
        {`Enter ${label}?`}
      </PanelText>
      <PanelButton position={[-0.44, -0.2, 0.01]} width={0.75} height={0.28} label="Enter" onSelect={onConfirm} tone="#f2b84c" />
      <PanelButton position={[0.44, -0.2, 0.01]} width={0.75} height={0.28} label="Not yet" onSelect={onCancel} tone="#3a3260" />
    </Panel3D>
  )
}
