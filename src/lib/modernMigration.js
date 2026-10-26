import * as maplibregl from 'maplibre-gl';
import places from '../data/migration-places.json';
import { mapStyle } from '../config/mapStyle.js';
import { parseGpxLatLon, distanceMeters, indexRoute, sliceRoute } from './migrationRoute.js';
import { continuationAt, relations, relatedTo } from './continuation.js';
import jinyue from '../data/g_jinyue.gpx?raw';

const raws = { g_jinyue: jinyue };
const ids = ['金岳村', '武塔村', '金洋村', '碧侯村', '澳花村', '南澳村', '東岳村'];
const point = id => { const p = places.find(p => p.id === id); return [p.lon, p.lat]; };
const feature = coordinates => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
function curve(a, b) {
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .025];
  return Array.from({ length: 33 }, (_, i) => { const t = i / 32; return a.map((v, j) => (1-t)**2*v + 2*(1-t)*t*mid[j] + t*t*b[j]); });
}

export function createModernMigration(map, overlay, refreshOld) {
  let state = continuationAt(0), selected = null, hovered = null, view = 'relations', targetCamera, explorationOverview = false;
  const nodes = [];
  const tracks = Object.entries(raws).map(([id, raw]) => {
    const relation = relations.find(r => r.route === id);
    const coordinates = parseGpxLatLon(raw);
    // Preserve real geometry; orient it from the mountains toward its destination.
    const destination = point(relation.current);
    if (distanceMeters(coordinates[0], destination) < distanceMeters(coordinates.at(-1), destination)) coordinates.reverse();
    const index = indexRoute(feature(coordinates));
    map.addSource(id, { type: 'geojson', data: feature([]) });
    map.addLayer({ id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#b98a57', 'line-width': 3.5, 'line-opacity': 0 } });
    return { id, index };
  });
  const activeId = () => hovered || selected;
  function weight(id) {
    const focus = activeId();
    return !focus || focus === id || relatedTo(focus).some(r => r.old === id || r.current === id) ? 1 : .25;
  }
  function draw() {
    const focus = activeId(), links = relatedTo(focus);
    tracks.forEach(({ id, index }, i) => {
      map.getSource(id).setData(sliceRoute(index, index.total * state.routeProgress[i]));
      const highlighted = !focus || links.some(r => r.route === id || relations.find(r => r.route === id)?.current === r.current);
      map.setPaintProperty(id, 'line-opacity', explorationOverview ? 0 : state.active ? (highlighted ? 1 : .16) * (1 - state.b * .4) * (1 - state.c * (view === 'relations' ? .65 : .1)) : 0);
    });
    // The final transition page is a quiet pause; relation lines are reserved
    // for the later knowledge-graph scene and stay hidden here.
    nodes.forEach(({ element, button, id }, i) => {
      const alpha = explorationOverview ? 0 : state.active ? state.currentOpacity[i] : 0;
      element.style.visibility = alpha > .01 ? 'visible' : 'hidden';
      button.style.opacity = alpha * weight(id);
      button.disabled = alpha < .95 || state.phase === 'migration-entry';
      button.tabIndex = button.disabled ? -1 : 0;
      button.setAttribute('aria-pressed', String(selected === id));
      element.classList.toggle('is-selected', activeId() === id);
    });
    // Fade only basemap paint, preserving the GPX and relationship layers.
    mapStyle.layers.forEach(layer => {
      const property = `${layer.type}-opacity`;
      const base = layer.paint?.[property] ?? 1;
      map.setPaintProperty(layer.id, property, base * (1 - state.c * .88));
    });
    overlay.dataset.phase = state.phase;
    overlay.style.setProperty('--entry-shade', state.backgroundFade * .84);
    // The parent scrollytelling scene owns the transition layer lifecycle.
    // Do not overwrite its aria-hidden state here: once graph scenes begin,
    // the question overlay must stay semantically removed as well as hidden.
    for (const [selector, opacity] of [['.continuation-a', state.active ? (1-state.b)*(1-state.c) : 0], ['.continuation-b', state.ctaOpacity], ['.continuation-c', state.questionOpacity]]) {
      const el = overlay.querySelector(selector);
      if (!el) continue;
      el.style.opacity = opacity;
      el.style.visibility = opacity > .01 ? 'visible' : 'hidden';
      el.style.pointerEvents = opacity > .95 ? 'auto' : 'none';
      el.inert = opacity < .95;
    }
    const description = overlay.querySelector('.continuation-description');
    if (description) {
      description.style.opacity = state.active ? state.descriptionOpacity : 0;
      description.style.visibility = state.descriptionOpacity > .01 ? 'visible' : 'hidden';
    }
    overlay.querySelector('.continuation-selection').textContent = '';
    refreshOld();
  }
  ids.forEach(id => {
    const element = document.createElement('div'); element.className = 'old-settlement current-settlement';
    const button = document.createElement('button'); button.className = 'old-settlement-hit'; button.type = 'button'; button.setAttribute('aria-label', id);
    const dot = document.createElement('i'); const label = document.createElement('span'); label.textContent = id;
    button.append(dot, label); element.append(button);
    button.addEventListener('click', event => {
      let target = id;
      if (event.detail > 0) {
        let nearest = Infinity;
        nodes.forEach(node => {
          if (node.button.disabled) return;
          const rect = node.button.getBoundingClientRect();
          const distance = Math.hypot(event.clientX - rect.x - 20, event.clientY - rect.y - 20);
          if (distance < nearest) { nearest = distance; target = node.id; }
        });
      }
      hovered = null;
      selected = selected === target ? null : target;
      draw();
    });
    button.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !button.disabled) { hovered = id; draw(); } });
    button.addEventListener('pointerleave', () => { hovered = null; draw(); });
    const marker = new maplibregl.Marker({ element }).setLngLat(point(id)).addTo(map);
    nodes.push({ element, button, marker, id });
  });
  return {
    get active() { return state.active; },
    get interactive() { return state.active && state.phase !== 'migration-entry'; },
    weight,
    isSelected: id => activeId() === id,
    select(id) { selected = selected === id ? null : id; draw(); },
    setView(value) { view = value; draw(); },
    resize() {
      const bounds = new maplibregl.LngLatBounds();
      places.filter(p => p.t === 'old' || p.t === 'cur').forEach(p => bounds.extend([p.lon, p.lat]));
      const camera = map.cameraForBounds(bounds, { padding: { top: 100, bottom: 80, left: 55, right: 55 } });
      targetCamera = { center: [camera.center.lng, camera.center.lat], zoom: camera.zoom };
    },
    camera(from) { if (!state.active || !targetCamera) return from; return { center: from.center.map((v,i) => v+(targetCamera.center[i]-v)*state.camera), zoom: from.zoom+(targetCamera.zoom-from.zoom)*state.camera }; },
    update(screen) {
      const next = continuationAt(screen);
      if (next.phase !== state.phase) { selected = null; hovered = null; }
      // The migration question belongs to the handoff scene only. Remove the
      // whole transition layer once the later exploration map takes over so
      // its large type cannot linger over the final map.
      overlay.style.display = screen > 24 ? 'none' : '';
      explorationOverview = screen > 24;
      state = next; draw();
    },
    destroy() { nodes.forEach(n => n.marker.remove()); },
  };
}
