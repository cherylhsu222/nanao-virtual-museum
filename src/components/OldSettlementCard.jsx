import React, { useEffect, useRef, useState } from 'react';

export default function OldSettlementCard({ settlement: requested, image, open, onClose }) {
  const [shown, setShown] = useState(null);
  const [phase, setPhase] = useState('closed');
  const [failed, setFailed] = useState(null);
  const current = useRef(null);
  useEffect(() => {
    let timer;
    if (!open || !requested) {
      setPhase('closing');
      timer = setTimeout(() => { setShown(null); current.current = null; }, 220);
    } else if (!current.current) {
      current.current = requested.id;
      setShown({ settlement: requested, image });
      setPhase('opening');
    } else if (current.current !== requested.id) {
      setPhase('switching');
      timer = setTimeout(() => {
        current.current = requested.id;
        setShown({ settlement: requested, image });
        setPhase('visible');
      }, 110);
    } else setPhase('visible');
    return () => clearTimeout(timer);
  }, [requested, image, open]);
  if (!shown) return null;
  const { settlement } = shown;
  const photo = shown.image || settlement.photo;
  return (
    <aside className={`old-settlement-card ${phase}`} aria-hidden={!open} aria-label={`${settlement.id} 資訊`}>
      <button className="old-settlement-card-close" type="button" onClick={onClose} aria-label="關閉部落資訊">×</button>
      <div className="old-settlement-card-body">
      {photo && failed !== photo ? <div className="settlement-photo"><img key={photo} src={photo} loading="lazy" alt={`${settlement.id}舊部落照片`} onError={() => { setFailed(photo); console.warn('[OldSettlementCard] Image failed:', settlement.id, photo); }} /></div> : null}
      <div className="old-settlement-card-content">
        <div className="settlement-eyebrow">舊部落</div>
        <h2>{settlement.id}</h2>
        {settlement.oldName ? <p className="old-settlement-card-old-name">{settlement.oldName}</p> : null}
        {settlement.info ? <p className="old-settlement-card-info">{settlement.info}</p> : null}
        <p className="old-settlement-card-hint">點擊其他舊部落，繼續探索</p>
      </div>
      </div>
    </aside>
  );
}
