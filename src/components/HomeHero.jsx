import React, { useEffect, useState } from 'react';

const TRANSITION_MS = 1950;

export default function HomeHero({ onEnterComplete }) {
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (!isEntering) return undefined;
    const timer = window.setTimeout(() => onEnterComplete?.(), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [isEntering, onEnterComplete]);

  const enterMuseum = event => {
    event.preventDefault();
    if (isEntering) return;
    setIsEntering(true);
  };

  return <div className="home-hero-slot">
    <section className={`home-hero${isEntering ? ' is-entering' : ''}`} aria-labelledby="home-title">
      <div className="home-hero-landscape" aria-hidden="true" />
      <div className="home-hero-shade" aria-hidden="true" />
      <div className="home-hero-portal">
        <div className="home-hero-brand" aria-label="南澳虛擬博物館">
          <span>南澳虛擬博物館</span>
          <small>NAN’AO · A LIVING LAND</small>
        </div>
        <div className="home-hero-copy">
          <h1 id="home-title"><span>沿著遷徙的足跡，</span><span>走進南澳泰雅族的故事</span></h1>
          <p className="home-hero-intro">從山中的舊部落出發，<br />走進遷徙、聚落與生活記憶交織的南澳。</p>
          <a className="home-hero-cta" href="#chapter-1" onClick={enterMuseum}>進入虛擬博物館 <span aria-hidden="true">→</span></a>
        </div>
      </div>
      <div className="home-entry-fog" aria-hidden="true" />
    </section>
  </div>;
}
