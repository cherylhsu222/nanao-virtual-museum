import React from 'react';

export default function MemoryMapOverlay({ overlayRef }) {
  return <div ref={overlayRef} className="memory-map-overlay" aria-label="南澳記憶分布總覽" aria-hidden="true">
    <div className="memory-map-heading">
      <span>南澳記憶庫</span>
      <h2>南澳的記憶，散落在不同的地方。</h2>
    </div>
    <p className="memory-map-caption">
      一張照片、一個人、一段生活，<br />
      都留下了屬於這片土地的故事。
    </p>
  </div>;
}
