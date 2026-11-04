import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

// 從知識圖譜開始改成「一步一頁」：滑鼠滾一下、觸控板滑一次、按方向鍵或
// 「上一步／下一步」，都只會前進或後退一頁。前面的遷徙地圖維持自由捲動。
// 每個數字是一頁停下來的位置（單位：screen，對應 NanaoScrollyMap 的時間軸）。
export const STEP_STOPS = [
  24.2, // 知識圖譜開場：從遷徙到產業
  28.3, // 段木香菇
  32.3, // 第一層｜木材（四種木材都出現後）
  35.2, // 第二層｜聚落
  // 每一層只停一次，停在該層節點與連線都畫完的位置（按一次就看到完整的一層）。
  37.7, // 第三層｜菇農（全部菇農）
  39.6, // 第四層｜政策（兩條政策線都畫完）
  46.4, // 第五層｜組織（六個組織都出現）
  49, // 全部節點總覽
  55.2, // 南澳記憶庫
  // 精選故事：開頭、5 則故事、結尾，每一格剛好是一個畫面寬。
  60, 61, 62, 63, 64, 65, 66,
  72, // 探索地圖
];
// 第一頁按「上一步」時，回到遷徙地圖最後的「展開完整遷徙地圖」畫面。
const BEFORE_FIRST_STOP = 21.5;
// 這些段落在捲動地圖之後，是一般網頁，按鈕可以跳過去，但滑鼠維持自由捲動。
const TRAILING_SECTIONS = ['#memory-contribution', '#feedback-survey'];
const GESTURE_GAP_MS = 220;
const TOLERANCE_PX = 16;

export function createStepNavigation({ screenToY, onChange }) {
  let animating = false;
  let tween;
  let lastWheel = 0;
  let touchStartY = null;
  let lastState = '';

  const trailingYs = () => TRAILING_SECTIONS
    .map(selector => document.querySelector(selector))
    .filter(Boolean)
    .map(element => element.getBoundingClientRect().top + window.scrollY);
  const stopYs = () => [...STEP_STOPS.map(screenToY), ...trailingYs()];
  const pagedStart = () => screenToY(STEP_STOPS[0]);
  const pagedEnd = () => screenToY(STEP_STOPS[STEP_STOPS.length - 1]);

  function currentIndex() {
    const y = window.scrollY;
    const ys = stopYs();
    let index = -1;
    ys.forEach((stop, i) => { if (y >= stop - TOLERANCE_PX) index = i; });
    return index;
  }

  function goToY(y) {
    tween?.kill();
    const distance = Math.abs(y - window.scrollY) / window.innerHeight;
    animating = true;
    tween = gsap.to(window, {
      scrollTo: { y, autoKill: false },
      duration: Math.min(1.6, .6 + distance * .12),
      ease: 'power2.inOut',
      onComplete: () => { animating = false; report(); },
      onInterrupt: () => { animating = false; },
    });
  }

  function step(direction) {
    const y = window.scrollY;
    const ys = stopYs();
    if (direction > 0) {
      const next = ys.find(stop => stop > y + TOLERANCE_PX);
      if (next !== undefined) goToY(next);
    } else {
      const previous = [...ys].reverse().find(stop => stop < y - TOLERANCE_PX);
      goToY(previous ?? screenToY(BEFORE_FIRST_STOP));
    }
  }

  // 只有地圖的分頁區（知識圖譜到探索地圖）攔截滾動。
  function inPagedZone(direction) {
    const y = window.scrollY;
    const start = pagedStart();
    const end = pagedEnd();
    if (direction > 0) return (y >= start - window.innerHeight * .6) && y < end - TOLERANCE_PX;
    return y > start + TOLERANCE_PX && y <= end + TOLERANCE_PX;
  }

  // 卡片內文可以自己捲動時，讓它先捲。
  function canScrollInside(target, direction) {
    for (let element = target; element && element !== document.body; element = element.parentElement) {
      if (!(element instanceof HTMLElement)) continue;
      const style = getComputedStyle(element);
      if (!/(auto|scroll)/.test(style.overflowY) || element.scrollHeight <= element.clientHeight + 1) continue;
      if (direction > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1) return true;
      if (direction < 0 && element.scrollTop > 0) return true;
    }
    return false;
  }

  function onWheel(event) {
    if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    const direction = Math.sign(event.deltaY);
    if (!direction || !inPagedZone(direction) || canScrollInside(event.target, direction)) return;
    event.preventDefault();
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    // 觸控板放手後的慣性會一直送事件：同一次手勢只算一步。
    if (animating || gap < GESTURE_GAP_MS) return;
    step(direction);
  }

  function onKey(event) {
    if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
    const tag = event.target?.tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || event.target?.isContentEditable) return;
    const forward = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey && tag !== 'BUTTON' && tag !== 'A');
    const backward = ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
    const direction = forward ? 1 : backward ? -1 : 0;
    if (!direction || !inPagedZone(direction)) return;
    event.preventDefault();
    if (!animating) step(direction);
  }

  function onTouchStart(event) { touchStartY = event.touches[0]?.clientY ?? null; }
  function onTouchMove(event) {
    if (touchStartY === null) return;
    const delta = touchStartY - (event.touches[0]?.clientY ?? touchStartY);
    const direction = Math.sign(delta);
    if (direction && inPagedZone(direction) && !canScrollInside(event.target, direction)) event.preventDefault();
  }
  function onTouchEnd(event) {
    if (touchStartY === null) return;
    const delta = touchStartY - (event.changedTouches[0]?.clientY ?? touchStartY);
    touchStartY = null;
    const direction = Math.sign(delta);
    if (Math.abs(delta) < 40 || !inPagedZone(direction) || canScrollInside(event.target, direction) || animating) return;
    step(direction);
  }

  function report() {
    const index = currentIndex();
    const total = stopYs().length;
    const visible = window.scrollY >= pagedStart() - window.innerHeight * .5;
    const state = `${visible}:${index}:${total}`;
    if (state === lastState) return;
    lastState = state;
    document.body.classList.toggle('has-step-nav', visible);
    onChange({ visible, index, total });
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('scroll', report, { passive: true });
  report();

  return {
    next: () => step(1),
    previous: () => step(-1),
    report,
    destroy() {
      tween?.kill();
      document.body.classList.remove('has-step-nav');
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', report);
    },
  };
}
