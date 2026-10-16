import React, { useEffect, useState } from 'react';
import { explorationDestinations } from '../data/explorationDestinations.js';

const visitedKey = 'nanao-exploration-visited';

function readVisited() {
  try {
    const value = JSON.parse(window.localStorage.getItem(visitedKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function LandmarkArt({ region }) {
  return <span className={`exploration-landmark-art exploration-exhibit-icon exploration-exhibit-icon-${region}`} aria-hidden="true" />;
}

export default function ExplorationMapOverlay({ overlayRef }) {
  const [hovered, setHovered] = useState('');
  const [visited, setVisited] = useState(() => (typeof window === 'undefined' ? [] : readVisited()));

  useEffect(() => {
    try { window.localStorage.setItem(visitedKey, JSON.stringify(visited)); } catch { /* local-only enhancement */ }
  }, [visited]);

  const visit = id => setVisited(current => current.includes(id) ? current : [...current, id]);

  return <div ref={overlayRef} className="exploration-map-overlay" data-stage="explore" aria-label="南澳探索地圖" aria-hidden="true">
    <div className="exploration-map-copy">
      <span className="exploration-map-kicker">南澳探索地圖</span>
      <h1>接下來，換你自己探索</h1>
      <p>沿著山路和海岸，找到你想走近的南澳故事。</p>
    </div>

    <a className="exploration-contribution-link" href="#memory-contribution">也想留下一段故事？前往投稿 ↓</a>
    <div className="exploration-landmarks" data-hovered={hovered}>
      <span className="exploration-traveler" aria-hidden="true"><i /><b /><em /><u /></span>
      {explorationDestinations.map(destination => <a
        key={destination.id}
        className={`exploration-landmark exploration-landmark-${destination.region}`}
        href={destination.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${destination.title}：${destination.description}`}
        onMouseEnter={() => setHovered(destination.id)}
        onMouseLeave={() => setHovered('')}
        onFocus={() => setHovered(destination.id)}
        onBlur={() => setHovered('')}
        onClick={() => visit(destination.id)}
      >
        <LandmarkArt region={destination.region} />
        <span className="exploration-landmark-label" aria-hidden="true">
          <small>{destination.stamp}</small>
          <strong>{destination.title}</strong>
          {visited.includes(destination.id) && <em>已走過</em>}
        </span>
        <span className="exploration-landmark-popover">
          <small>{destination.stamp}</small>
          <strong>{destination.title}</strong>
          <em>{destination.description}</em>
          <span>前往探索 →</span>
        </span>
      </a>)}
    </div>
  </div>;
}
