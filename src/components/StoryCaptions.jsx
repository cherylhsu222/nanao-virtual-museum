import React from 'react';
import { storyCaptions } from '../data/storyCaptions.js';

// Positions are driven from NanaoScrollyMap's render loop via updateStoryCaptions,
// so the cards move 1:1 with the scroll like 報導者's scrollable-video captions.
export default function StoryCaptions({ captionsRef }) {
  return <div ref={captionsRef} className="story-captions" aria-hidden="true">
    {storyCaptions.map((caption, i) => <div key={i} className="story-caption">
      {caption.text.map((paragraph, j) => <p key={j}>{paragraph.split('\n').map((line, k) => <span key={k}>{line}</span>)}</p>)}
    </div>)}
  </div>;
}

export function updateStoryCaptions(container, screen) {
  if (!container) return;
  const height = window.innerHeight;
  [...container.children].forEach((element, i) => {
    const offset = storyCaptions[i].screen - screen;
    const visible = Math.abs(offset) < 0.85;
    element.style.visibility = visible ? 'visible' : 'hidden';
    if (visible) element.style.transform = `translateY(calc(${offset * height}px - 50%))`;
  });
}
