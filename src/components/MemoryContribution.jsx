import React, { useEffect, useRef, useState } from 'react';
import { buildMemorySubmission, submitMemorySubmission } from '../lib/memorySubmission.js';

const fullMemoryMapUrl = 'https://cherylhsu222.github.io/memory-map-cowork/';

export default function MemoryContribution({ overlayRef, standalone = false }) {
  const [story, setStory] = useState('');
  const [place, setPlace] = useState('');
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    if (!photo) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const choosePhoto = event => {
    const next = event.target.files?.[0];
    if (next) setPhoto(next);
  };

  const submit = async event => {
    event.preventDefault();
    if (!story.trim() || !place.trim() || status === 'submitting') return;
    setStatus('submitting');
    setErrorMessage('');
    try {
      await submitMemorySubmission(buildMemorySubmission({ story, place }), photo);
      setStatus('success');
    } catch (error) {
      console.error('Memory submission failed', error);
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  return <div ref={overlayRef} id="memory-contribution" className={`memory-contribution-overlay${standalone ? ' memory-contribution-standalone' : ''}`} aria-label="留下你的南澳記憶" aria-hidden={!standalone}>
    <div className="memory-contribution-shell">
      {status === 'success' ? <section className="memory-contribution-success" aria-live="polite">
        <span className="memory-contribution-kicker">南澳記憶庫</span>
        <h2>謝謝你，<br />這段記憶也成為南澳故事的一部分。</h2>
        <p>投稿將經整理與確認後公開。</p>
        <a className="memory-contribution-link" href={fullMemoryMapUrl} target="_blank" rel="noreferrer">看看其他人的記憶 →</a>
      </section> : <>
        <section className="memory-contribution-invitation">
          <span className="memory-contribution-kicker">留下你的南澳記憶</span>
          <h1>記憶不只被收藏，<br />也可以繼續被留下。</h1>
          <p>如果你也有一段關於南澳的故事，<br />願意把它留在這裡嗎？</p>
          <p className="memory-contribution-note">看完別人的記憶，也留下一點自己的。</p>
        </section>

        <form className="memory-contribution-form" onSubmit={submit}>
          <div className="memory-contribution-form-heading">
            <span>留下一段記憶</span>
            <small>投稿將經整理與確認後公開</small>
          </div>
          <div className="memory-contribution-field">
            <label htmlFor="memory-photo">照片</label>
            <button type="button" className={`memory-photo-picker${previewUrl ? ' has-preview' : ''}`} onClick={() => inputRef.current?.click()}>
              {previewUrl ? <img src={previewUrl} alt="照片預覽" /> : <><i>＋</i><span>加入一張照片</span></>}
            </button>
            <input ref={inputRef} id="memory-photo" type="file" accept="image/*" onChange={choosePhoto} />
          </div>
          <div className="memory-contribution-field">
            <label htmlFor="memory-story">故事</label>
            <textarea id="memory-story" value={story} onChange={event => setStory(event.target.value)} placeholder={'例如：我小時候最常跟家人去……\n第一次來到南澳時……'} rows={5} required />
          </div>
          <div className="memory-contribution-field">
            <label htmlFor="memory-place">地點</label>
            <input id="memory-place" type="text" value={place} onChange={event => setPlace(event.target.value)} placeholder="這段故事發生在哪裡？" required />
          </div>
          {status === 'error' && <p className="memory-contribution-error" role="alert">{errorMessage || '目前沒有成功送出，請稍後再試。'}</p>}
          <button className="memory-contribution-submit" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? '正在留下…' : '留下這段記憶 →'}</button>
          <a className="memory-contribution-full-link" href={fullMemoryMapUrl} target="_blank" rel="noreferrer">前往完整投稿頁 →</a>
        </form>
      </>}
    </div>
  </div>;
}

