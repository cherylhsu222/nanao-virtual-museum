import React from 'react';
export default function ContinuationOverlay({ overlayRef, onMode }) {
  return <div ref={overlayRef} className="continuation-overlay" aria-hidden="true">
    <section id="migration-to-present" className="scrolly-scene scene-route-caption" aria-label="流興部落到現址">
      <p className="continuation-a">從山中的舊部落，<br />族人的生活空間逐漸移向今天的南澳。</p>
    </section>
    <section id="migration-full-map-cta" className="scrolly-scene scene-migration-cta" aria-label="完整遷徙地圖引導">
      <div className="continuation-b">
        <p>想知道這些舊部落彼此之間是怎麼移動，<br />又如何來到今天的部落嗎？</p>
        <a href="https://cherylhsu222.github.io/migration-map/" target="_blank" rel="noopener noreferrer">展開完整遷徙地圖 →</a>
      </div>
    </section>
    <p className="continuation-selection" aria-live="polite" />
  </div>;
}
