import React from 'react';

export default function MemoryStoryCard({ memory, open, onClose }) {
  return <aside className="memory-story-card" aria-hidden={!open}>
    {memory && <>
      <button type="button" className="memory-story-close" aria-label="關閉故事" onClick={onClose}>×</button>
      <img className="memory-story-image" src={memory.image} alt="" />
      <div className="memory-story-content">
        <span className="memory-story-kicker">南澳記憶</span>
        <h3>{memory.title}</h3>
        <p className="memory-story-location">{memory.location}</p>
        <p className="memory-story-info">{memory.info || '這張照片留下了南澳地方生活的一段記憶。'}</p>
      </div>
    </>}
  </aside>;
}
