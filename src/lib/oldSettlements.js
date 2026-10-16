import { distanceMeters } from './migrationRoute.js';
import { smooth } from './scene.js';

export function prepareOldSettlements(places) {
  const old = places.filter(place => place.t === 'old');
  const origin = old.find(place => place.oldName.startsWith('Ryohen'));
  if (!origin) throw new Error('Missing Ryohen in source PLACES');
  return old.map(place => ({
    type: 'Feature', properties: { ...place },
    geometry: { type: 'Point', coordinates: [place.lon, place.lat] },
  })).sort((a, b) => distanceMeters([origin.lon, origin.lat], a.geometry.coordinates) - distanceMeters([origin.lon, origin.lat], b.geometry.coordinates));
}

// Batches describe distance from Ryohen, never historical migration order.
export function sampleExploration(progress, count) {
  const p = Math.max(0, Math.min(1, progress));
  return {
    originLabelOpacity: 1 - smooth((p - .10) / .15),
    cameraMix: smooth((p - .12) / .18),
    routeOpacity: 1 - .6 * smooth((p - .12) / .18),
    // Dots finish by p=.56 (screen ≈17.7) so visitors get ~1.3 screens to click
    // before the continuation chapter takes over at screen 19.
    interactive: p >= .56,
    opacities: Array.from({ length: count }, (_, i) => {
      if (i === 0) return p > 0 ? 1 : 0;
      const batch = Math.min(3, Math.floor((i - 1) * 4 / (count - 1)));
      const start = [.22, .30, .38, .46][batch];
      const duration = .10;
      return smooth((p - start) / duration);
    }),
  };
}
