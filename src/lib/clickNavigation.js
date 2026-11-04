import gsap from 'gsap';
import { STEP_STOPS } from './stepNavigation.js';

// 點擊版：整趟故事都是「一步一段」。每按一次下一步，畫面從目前位置
// 平順播放到下一個停點，剛好停在動畫結束的地方。
// 停點單位是 screen（對應 NanaoScrollyMap 的時間軸）。
export const CLICK_STOPS = [
  0.55, // 故事，從臺灣東北部的山海之間開始
  1.4, // 沿著海岸向南
  2.35, // 宜蘭最南端的南澳
  3.75, // 背靠中央山脈，面向太平洋
  4.75, // 故事要從很久以前說起
  5.6, // 往南投深山走
  6.6, // 瑞岩部落
  8.5, // 瑞岩部落照片（18 世紀）
  10.4, // 離開家鄉
  12.3, // 沿著溪谷向東
  14.2, // 經思源埡口來到南澳
  17.85, // 舊部落：停下來讓觀眾點選（字卡在畫面正中）
  18.9, // 從山中的舊部落，移向今天的南澳
  20.3, // 舊部落到今日部落的路線畫完＋完整遷徙地圖入口
  ...STEP_STOPS, // 知識圖譜 → 記憶庫 → 精選故事 → 探索地圖
];

// 故事之後的一般網頁段落（可以自己上下捲動）
const TRAILING_SECTIONS = ['#memory-contribution', '#feedback-survey'];
const GESTURE_GAP_MS = 220;

export function createClickNavigation({ getScreen, setScreen, onChange }) {
  let index = 0; // 0..CLICK_STOPS.length-1 是故事，之後是投稿與問卷
  let tween;
  let lastWheel = 0;
  let touchStartY = null;
  const total = CLICK_STOPS.length + TRAILING_SECTIONS.length;
  const inStory = () => index < CLICK_STOPS.length;

  function lockScroll(locked) {
    document.documentElement.classList.toggle('click-locked', locked);
  }

  function report() {
    onChange({ index, total, inStory: inStory() });
  }

  function playTo(screen, instant = false) {
    tween?.kill();
    const from = getScreen();
    const distance = Math.abs(screen - from);
    if (instant || distance < 0.001) {
      setScreen(screen);
      return;
    }
    const state = { screen: from };
    tween = gsap.to(state, {
      screen,
      duration: Math.min(3.2, 0.7 + distance * 0.32),
      ease: 'power1.inOut',
      onUpdate: () => setScreen(state.screen),
    });
  }

  function goTo(nextIndex, { instant = false } = {}) {
    nextIndex = Math.max(0, Math.min(total - 1, nextIndex));
    const wasInStory = inStory();
    index = nextIndex;
    if (inStory()) {
      if (!wasInStory) {
        lockScroll(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      playTo(CLICK_STOPS[index], instant);
    } else {
      lockScroll(false);
      const target = document.querySelector(TRAILING_SECTIONS[index - CLICK_STOPS.length]);
      if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: instant ? 'instant' : 'smooth' });
    }
    report();
  }

  const next = () => goTo(index + 1);
  const previous = () => goTo(index - 1);

  // 從問答頁直接跳進某一章時，找最接近的停點
  function enterAt(screen) {
    let nearest = 0;
    CLICK_STOPS.forEach((stop, i) => { if (Math.abs(stop - screen) < Math.abs(CLICK_STOPS[nearest] - screen)) nearest = i; });
    lockScroll(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    goTo(nearest, { instant: true });
  }

  // 卡片內文可以自己捲動時，讓它先捲
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

  // 在投稿頁最上面再往上，就回到故事的最後一步
  function atTrailingTop() {
    const first = document.querySelector(TRAILING_SECTIONS[0]);
    return !first || window.scrollY <= first.getBoundingClientRect().top + window.scrollY + 4;
  }

  function shouldHandle(direction, target) {
    if (document.documentElement.dataset.entered !== 'true') return false;
    if (canScrollInside(target, direction)) return false;
    if (inStory()) return true;
    return direction < 0 && index === CLICK_STOPS.length && atTrailingTop();
  }

  function onWheel(event) {
    if (event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    const direction = Math.sign(event.deltaY);
    if (!direction || !shouldHandle(direction, event.target)) return;
    event.preventDefault();
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    // 觸控板放手後的慣性會一直送事件：同一次手勢只算一步
    if (gap < GESTURE_GAP_MS) return;
    goTo(index + direction);
  }

  function onKey(event) {
    if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
    const tag = event.target?.tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || event.target?.isContentEditable) return;
    const forward = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey && tag !== 'BUTTON' && tag !== 'A');
    const backward = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key);
    const direction = forward ? 1 : backward ? -1 : 0;
    if (!direction || !shouldHandle(direction, event.target)) return;
    event.preventDefault();
    goTo(index + direction);
  }

  function onTouchStart(event) { touchStartY = event.touches[0]?.clientY ?? null; }
  function onTouchMove(event) {
    if (touchStartY === null) return;
    const direction = Math.sign(touchStartY - (event.touches[0]?.clientY ?? touchStartY));
    if (direction && shouldHandle(direction, event.target)) event.preventDefault();
  }
  function onTouchEnd(event) {
    if (touchStartY === null) return;
    const delta = touchStartY - (event.changedTouches[0]?.clientY ?? touchStartY);
    touchStartY = null;
    const direction = Math.sign(delta);
    if (Math.abs(delta) < 40 || !shouldHandle(direction, event.target)) return;
    goTo(index + direction);
  }

  // 自己捲動到投稿／問卷時，同步目前是第幾頁
  function onScroll() {
    if (inStory()) return;
    let current = CLICK_STOPS.length;
    TRAILING_SECTIONS.forEach((selector, i) => {
      const element = document.querySelector(selector);
      if (element && element.getBoundingClientRect().top <= window.innerHeight * 0.4) current = CLICK_STOPS.length + i;
    });
    if (current !== index) { index = current; report(); }
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('scroll', onScroll, { passive: true });
  lockScroll(true);
  report();

  return {
    next,
    previous,
    enterAt,
    stopsCount: total,
    destroy() {
      tween?.kill();
      lockScroll(false);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
    },
  };
}
