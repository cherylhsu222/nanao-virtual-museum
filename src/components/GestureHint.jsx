import React from 'react';

const Hand = () => <svg viewBox="0 0 24 24">
  <path d="M22 14a8 8 0 0 1-8 8" />
  <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
  <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
  <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
  <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
</svg>;

// 滑鼠＋滾輪＋下方箭頭，讓人一看就知道是「轉滑鼠滾輪往下」。
const Mouse = () => <svg viewBox="0 0 24 24">
  <rect x="7" y="1.5" width="10" height="15" rx="5" />
  <line className="gesture-mouse-wheel" x1="12" y1="4.5" x2="12" y2="7.5" />
  <path className="gesture-mouse-arrow" d="M8.5 19l3.5 3 3.5-3" />
</svg>;

// 手勢提示：
// tap = 手指點一下（點選）；tap-down = 手指朝下（點選下方的選項）；
// scroll = 往下捲動：電腦顯示滑鼠滾輪，手機顯示手指往上滑。
export default function GestureHint({ type = 'scroll', children, className = '' }) {
  const icon = type === 'scroll'
    ? <><span className="gesture-icon gesture-mouse"><Mouse /></span><span className="gesture-icon gesture-hand gesture-swipe"><Hand /></span></>
    : <span className="gesture-icon gesture-hand"><Hand /></span>;
  return <span className={`gesture-hint is-${type} ${className}`.trim()}>
    <span className="gesture-icons" aria-hidden="true">{icon}</span>
    <span>{children}</span>
  </span>;
}
