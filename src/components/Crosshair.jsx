// With the pointer locked for genuine first-person look, there's no
// visible cursor at all. Every interactive object in the world (rings,
// panels, buttons) is now selected by looking at it and clicking — this
// small fixed reticle is what tells the player where "looking" currently
// points. This is a targeting reticle, not a menu or popup: every
// first-person game has one, and removing it would make 3D buttons
// impossible to aim at.
export default function Crosshair({ visible }) {
  if (!visible) return null
  return (
    <div className="crosshair" aria-hidden="true">
      <span className="crosshair-dot" />
    </div>
  )
}
