import { LANDMARKS, landmarkPosition } from '../logic/landmarks'

// A separate tool listing every feature. Selecting one either points the
// user toward it (a quick look-at snap, then they walk manually) or
// warps them there instantly via the same boost mechanic used elsewhere.
export default function Map({ onClose, onPointTheWay, onWarp }) {
  return (
    <div className="map-overlay">
      <div className="map-panel">
        <div className="map-header">
          <span>The Map</span>
          <button className="map-close" onClick={onClose} aria-label="Close map">
            {'\u2715'}
          </button>
        </div>
        <ul className="map-list">
          {LANDMARKS.map((lm) => (
            <li key={lm.id} className="map-item">
              <span className="map-item-dot" style={{ background: lm.color, boxShadow: `0 0 8px 2px ${lm.color}` }} />
              <span className="map-item-label">{lm.label}</span>
              <div className="map-item-actions">
                <button className="map-item-btn" onClick={() => onPointTheWay(lm.id, landmarkPosition(lm))}>
                  Point the way
                </button>
                <button className="map-item-btn map-item-btn-primary" onClick={() => onWarp(lm.id, landmarkPosition(lm))}>
                  Warp
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
