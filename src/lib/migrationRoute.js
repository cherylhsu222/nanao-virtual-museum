const EARTH_RADIUS_M = 6371008.8;

export function parseGpxLatLon(raw) {
  const points = [];
  const pattern = /<(?:rtept|trkpt)\b[^>]*\blat="([^" ]+)"[^>]*\blon="([^" ]+)"[^>]*>/g;
  for (const match of raw.matchAll(pattern)) points.push([Number(match[2]), Number(match[1])]);
  return points;
}

function radians(value) { return value * Math.PI / 180; }

export function distanceMeters(a, b) {
  const dLat = radians(b[1] - a[1]);
  const dLon = radians(b[0] - a[0]);
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function buildRuiyanToRyohenRoute(ancientRaw, siyuanRyohenRaw) {
  const ancient = parseGpxLatLon(ancientRaw);
  const siyuanRyohen = parseGpxLatLon(siyuanRyohenRaw);
  const joined = [...ancient];
  const first = siyuanRyohen[0];
  const last = joined[joined.length - 1];
  if (!last || !first || distanceMeters(last, first) > 30) joined.push(first);
  joined.push(...siyuanRyohen.slice(1));
  return {
    type: 'Feature',
    properties: { id: 'ruiyan-to-ryohen', start: '瑞岩部落', via: '思源埡口', end: 'Ryohen（流興社）' },
    geometry: { type: 'LineString', coordinates: joined },
  };
}

export function indexRoute(route) {
  const coordinates = route.geometry.coordinates;
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i += 1) cumulative.push(cumulative[i - 1] + distanceMeters(coordinates[i - 1], coordinates[i]));
  return { coordinates, cumulative, total: cumulative[cumulative.length - 1] };
}

export function pointAlongRoute(index, distance) {
  const target = Math.max(0, Math.min(index.total, distance));
  let i = 1;
  while (i < index.cumulative.length && index.cumulative[i] < target) i += 1;
  const start = index.cumulative[i - 1] ?? 0;
  const end = index.cumulative[i] ?? index.total;
  const t = end === start ? 0 : (target - start) / (end - start);
  return interpolate(index.coordinates[i - 1] ?? index.coordinates[0], index.coordinates[i] ?? index.coordinates.at(-1), t);
}

export function sliceRoute(index, distance) {
  const target = Math.max(0, Math.min(index.total, distance));
  const visible = [index.coordinates[0]];
  for (let i = 1; i < index.coordinates.length && index.cumulative[i] <= target; i += 1) visible.push(index.coordinates[i]);
  const current = pointAlongRoute(index, target);
  if (distanceMeters(visible.at(-1), current) > 0.5) visible.push(current);
  return { type: 'Feature', properties: { id: 'ruiyan-to-ryohen-visible' }, geometry: { type: 'LineString', coordinates: visible } };
}

export function bearingDegrees(a, b) {
  const lon1 = radians(a[0]);
  const lon2 = radians(b[0]);
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function shortestAngleDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}
