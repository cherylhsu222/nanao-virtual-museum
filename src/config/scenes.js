const base = {
  bearing: 0,
  pitch: 0,
  nanaoFillOpacity: 0,
  nanaoBorderOpacity: 0,
  outsideMaskOpacity: 0,
  settlementOpacity: 0,
  settlementLabelOpacity: 0,
  ruiyanOpacity: 0,
  ruiyanHaloOpacity: 0,
  ruiyanLabelOpacity: 0,
  yilanOpacity: 0,
};

// Camera keyframes are expressed in scroll progress, not timed animations.
export const scenes = [
  { id: 'taiwan', start: 0, center: [120.95, 23.75], zoom: 6.65 },
  { id: 'yilan', start: 0.15, center: [121.7, 24.62], zoom: 8.65, yilanOpacity: 0.8 },
  { id: 'nanao-approach', start: 0.3, center: [121.66, 24.465], zoom: 10.1, nanaoFillOpacity: 0.3, nanaoBorderOpacity: 0.35, outsideMaskOpacity: 0.18, yilanOpacity: 0.12 },
  { id: 'nanao-highlight', start: 0.45, center: [121.66, 24.465], zoom: 10.15, nanaoFillOpacity: 1, nanaoBorderOpacity: 1, outsideMaskOpacity: 0.34, yilanOpacity: 0.12 },
  { id: 'nanao-settlements', start: 0.6, center: [121.68, 24.465], zoom: 10.15, nanaoFillOpacity: 1, nanaoBorderOpacity: 1, outsideMaskOpacity: 0.34, settlementOpacity: 1, settlementLabelOpacity: 1, yilanOpacity: 0.1 },
  { id: 'leave-nanao', start: 0.72, center: [121.61, 24.43], zoom: 9.55, nanaoFillOpacity: 0.35, nanaoBorderOpacity: 0.35, outsideMaskOpacity: 0.16, settlementOpacity: 0.55, settlementLabelOpacity: 0.25, yilanOpacity: 0.06 },
  { id: 'toward-ruiyan', start: 0.82, center: [121.38, 24.26], zoom: 8.8, nanaoFillOpacity: 0.08, nanaoBorderOpacity: 0.08, outsideMaskOpacity: 0.05, settlementOpacity: 0.12, settlementLabelOpacity: 0.05, yilanOpacity: 0 },
  { id: 'ruiyan', start: 0.92, center: [121.1489, 24.1167], zoom: 9.7, ruiyanOpacity: 1, ruiyanHaloOpacity: 0.2, ruiyanLabelOpacity: 1 },
  { id: 'ruiyan-closeup', start: 1, center: [121.1489, 24.1167], zoom: 12.5, ruiyanOpacity: 1, ruiyanHaloOpacity: 0.24, ruiyanLabelOpacity: 1 },
].map(scene => ({ ...base, ...scene }));

export const storySettings = { scrollScreens: 16, scrub: true, transitionFraction: 1 };
