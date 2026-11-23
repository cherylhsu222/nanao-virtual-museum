import React, { useEffect, useRef, useState } from 'react';

// 右上角漢堡選單：直接跳到三大章節的開頭（screen 與開場問答頁的入口一致）。
const chapters = [
  { label: '南澳互動遷徙地圖', screen: 0 },
  { label: '南澳知識圖譜', screen: 24.2 },
  { label: '南澳記憶庫', screen: 55.2 },
];

export default function ChapterMenu({ visible, onJump }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => { if (!visible) setOpen(false); }, [visible]);

  return <nav ref={rootRef} className={`chapter-menu${visible ? ' is-visible' : ''}${open ? ' is-open' : ''}`} aria-label="章節目錄">
    <button type="button" className="chapter-menu-toggle" aria-expanded={open} aria-controls="chapter-menu-list" aria-label={open ? '關閉章節目錄' : '開啟章節目錄'} onClick={() => setOpen(value => !value)}>
      <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
    </button>
    <ul id="chapter-menu-list" className="chapter-menu-list" hidden={!open}>
      {chapters.map(({ label, screen }, index) => <li key={label}>
        <button type="button" onClick={() => { setOpen(false); onJump(screen); }}>
          <small>{String(index + 1).padStart(2, '0')}</small>{label}
        </button>
      </li>)}
    </ul>
  </nav>;
}
