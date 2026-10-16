import { smooth } from './scene.js';
// This milestone ends at the knowledge-graph prelude. The full graph is
// intentionally deferred to a later scene/version.
// Two extra hold screens keep the featured-story outro readable before the
// final exploration map. Four final screens let the map fade in and hold as
// a free-choice ending.
export const TOTAL_SCREENS = 75;
export function continuationAt(screen) {
  const active = screen > 19;
  // The handoff is a compact two-screen beat. All transition layers derive
  // from this same progress so the question, veil, and graph stay in sync.
  const t = Math.max(0, Math.min(1, (screen - 19) / 3));
  const backgroundFade = smooth((t - .68) / .16);
  // Route/arrival comes first, then a dedicated CTA hold, then the question.
  const ctaOpacity = t < .45 ? 0 : t < .8 ? 1 : 1 - smooth((t - .8) / .12);
  const questionOpacity = smooth((t - .8) / .15);
  const descriptionOpacity = smooth((t - .86) / .12);
  const shiitakeOpacity = smooth((t - .86) / .14);
  const a = t;
  // Keep the historical fields for camera/route consumers; the explicit
  // opacity fields above are used by the transition text itself.
  const b = smooth((screen - 19.5) / .5) * (1 - smooth((screen - 20.5) / .5));
  const c = smooth((screen - 20) / 1);
  return { active, a, b, c, t, backgroundFade, ctaOpacity, questionOpacity, descriptionOpacity, shiitakeOpacity,
    phase: !active ? 'explore' : screen < 20.35 ? 'settlement-migration' : screen < 21.1 ? 'migration-entry' : 'network-prelude',
    camera: smooth((a - .06) / .22),
    routeProgress: [0, .25, .38, .51, .64].map(start => smooth((a - start - .12) / .22)),
    currentOpacity: [0, 1, 2, 3, 4, 5, 6].map(i => smooth((a - .24 - i * .09) / .12)),
  };
}

// Relations supported by the original exhibit's chapter text and PLACES info.
// No relation is inferred solely from proximity. Dongyue has no sourced edge.
export const relations = [
  { old: 'Ryohen（流興）', current: '金岳村', route: 'g_jinyue' },
  { old: '哈卡巴里斯', current: '武塔村', route: 'g_wuta' },
  { old: '舊金洋', current: '金洋村', route: 'g_jinyang' },
  { old: '奎諾斯社', current: '金洋村' },
  { old: '比亞毫社', current: '碧侯村', route: 'g_bihou' },
  { old: '莫瑤社', current: '澳花村', route: 'g_aohua' },
  { old: '克魯模安／庫巴博', current: '南澳村' },
  { old: '各姆姆社', current: '南澳村' },
];
export function relatedTo(id) {
  return relations.filter(r => r.old === id || r.current === id);
}
