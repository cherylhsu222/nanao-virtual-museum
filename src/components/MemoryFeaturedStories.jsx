import React, { useState } from 'react';
import StoryResponseCard from './StoryResponseCard.jsx';
import { memoryFeaturedStories } from '../data/memoryFeaturedStories.js';

export default function MemoryFeaturedStories({ overlayRef }) {
  const [responseStory, setResponseStory] = useState(null);
  return <><div ref={overlayRef} className="memory-featured-overlay" aria-label="南澳記憶庫精選故事" aria-hidden="true">
    <div className="memory-featured-track">
      <section className="memory-featured-panel memory-featured-intro">
        <div className="memory-featured-intro-copy">
          <span className="memory-featured-kicker">南澳記憶庫｜精選故事</span>
          <h2>在這些記憶裡，<br />我們挑了幾段故事，<br />一起走近看看。</h2>
          <p>向下滑動，繼續閱讀 →</p>
        </div>
      </section>

      {memoryFeaturedStories.map((story, index) => (
        <article key={story.id} className={`memory-featured-panel memory-featured-story memory-featured-story-${index + 1}`} data-panel-index={index + 1}>
          <div className="memory-featured-story-image-wrap">
            <img className="memory-featured-story-image" src={story.image} alt="" />
          </div>
          <div className="memory-featured-story-copy">
            <span className="memory-featured-progress">故事 {story.number} / 05</span>
            <h2 className={story.titleSingleLine ? 'memory-featured-story-title memory-featured-story-title-single' : 'memory-featured-story-title'}>
              {story.titleLines.map((line, lineIndex) => <React.Fragment key={`${story.id}-${lineIndex}`}>{line}{lineIndex < story.titleLines.length - 1 ? <br /> : null}</React.Fragment>)}
            </h2>
            <p className="memory-featured-meta">{story.location} · {story.period}</p>
            <p className="memory-featured-excerpt">{story.excerpt}</p>
            <p className="memory-featured-credit">記憶分享：{story.sharer}</p>
            <button type="button" className="memory-response-trigger" onClick={() => setResponseStory(story)}>回應這則故事 <span aria-hidden="true">↗</span></button>
          </div>
        </article>
      ))}

      <section className="memory-featured-panel memory-featured-outro">
        <div className="memory-featured-outro-copy">
          <span className="memory-featured-kicker">南澳記憶庫</span>
          <h2>這些只是南澳記憶庫裡的一小部分</h2>
          <p>更多人的照片與故事，<br />仍散落在南澳不同角落。</p>
          <a href="https://cherylhsu222.github.io/memory-map-cowork/" target="_blank" rel="noreferrer">探索完整南澳記憶庫 →</a>
          <a className="memory-contribution-shortcut" href="#memory-contribution">留下你的南澳記憶 ↓</a>
        </div>
      </section>
    </div>
  </div>{responseStory && <StoryResponseCard key={responseStory.id} story={responseStory} onClose={() => setResponseStory(null)} />}</>;
}
