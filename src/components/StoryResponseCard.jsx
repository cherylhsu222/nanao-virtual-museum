import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { storyResponses } from '../lib/storyResponses.js';

export default function StoryResponseCard({ story, onClose }) {
  const dialogRef = useRef(null);
  const [responses, setResponses] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const sendingRef = useRef(false);
  const revisionRef = useRef(0);
  const aliveRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { aliveRef.current = false; dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const load = async () => {
      if (busy || sendingRef.current) return;
      busy = true;
      const revision = revisionRef.current;
      try {
        const rows = await storyResponses.list(story.id, controller.signal);
        if (!controller.signal.aborted && !sendingRef.current && revision === revisionRef.current) { setResponses(rows); setLoadError(''); }
      } catch (error) {
        if (!controller.signal.aborted && revision === revisionRef.current) setLoadError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
        busy = false;
      }
    };
    load();
    const timer = window.setInterval(load, 20000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [story.id, reload]);

  const submit = async event => {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    revisionRef.current += 1;
    setSending(true); setSendError(''); setNotice('');
    try {
      const rows = await storyResponses.submit(story.id, name, content);
      if (!aliveRef.current) return;
      setResponses(previous => [...rows, ...previous.filter(row => !rows.some(next => next.id === row.id))].slice(0, 100));
      setContent(''); setLoadError(''); setNotice('回應已公開，謝謝你留下共鳴。');
    } catch (error) {
      if (aliveRef.current) setSendError(error.message);
    } finally {
      sendingRef.current = false;
      if (aliveRef.current) setSending(false);
    }
  };

  return createPortal(<dialog ref={dialogRef} className="story-response-card" aria-labelledby="story-response-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialogRef.current) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <header className="story-response-heading">
      <span>南澳記憶庫 · 故事回應</span>
      <button type="button" className="story-response-close" onClick={onClose} aria-label="關閉回應">×</button>
      <h2 id="story-response-title">{story.title}</h2>
      <p>這段記憶，也讓你想起了什麼嗎？</p>
    </header>
    <section className="story-response-list" aria-label="觀眾回應" aria-busy={loading}>
      {loading ? <p className="story-response-empty">正在讀取回應…</p> : loadError ? <div className="story-response-empty" role="status"><p>{loadError}</p><button type="button" onClick={() => { setLoading(true); setReload(value => value + 1); }}>重新載入</button></div> : responses.length ? responses.map(response => <article className="story-response-item" key={response.id}>
        <span className="story-response-avatar" aria-hidden="true">{Array.from(response.display_name)[0]}</span>
        <div><div className="story-response-bubble"><strong>{response.display_name}</strong><p>{response.content}</p></div><time dateTime={response.created_at}>{new Intl.DateTimeFormat('zh-TW', {timeZone:'Asia/Taipei', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}).format(new Date(response.created_at))}</time></div>
      </article>) : <p className="story-response-empty">還沒有人回應，留下一點你的共鳴吧。</p>}
      {responses.length >= 100 && <p className="story-response-empty">顯示最新 100 則回應</p>}
    </section>
    <form className="story-response-form" onSubmit={submit}>
      <label htmlFor="response-name">暱稱 <small>選填</small></label>
      <input id="response-name" maxLength={40} value={name} onChange={event => setName(event.target.value)} placeholder="怎麼稱呼你？" disabled={sending} />
      <label htmlFor="response-content">你的回應</label>
      <textarea id="response-content" rows={3} maxLength={1000} required value={content} onChange={event => setContent(event.target.value)} placeholder="我也有類似的記憶……" disabled={sending} />
      <div className="story-response-form-footer"><small>回應送出後將公開顯示</small><button type="submit" disabled={sending || !content.trim()}>{sending ? '送出中…' : '送出回應 →'}</button></div>
      {sendError && <p className="story-response-error" role="alert">{sendError}</p>}
      <p className="story-response-notice" role="status">{notice}</p>
    </form>
  </dialog>, document.body);
}
