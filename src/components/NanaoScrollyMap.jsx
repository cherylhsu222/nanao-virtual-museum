import React, { useLayoutEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
// ?worker&url bundles the worker together with maplibre-gl-shared.mjs, which
// a plain ?url copy leaves behind (the map stays blank in production builds).
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scenes, storySettings } from '../config/scenes.js';
import { mapStyle } from '../config/mapStyle.js';
import { sampleScene, settlementAlpha, smooth } from '../lib/scene.js';
import { createOutsideMask } from '../lib/geo.js';
import nanaoRaw from '../data/nanao-boundary.geojson?raw';
import yilanRaw from '../data/yilan-boundary.geojson?raw';
import settlements from '../data/settlements.json';
import StoryCaptions, { updateStoryCaptions } from './StoryCaptions.jsx';
import ancientGpx from '../data/g_ancient.gpx?raw';
import siyuanRyohenGpx from '../data/g_siyuan_ryohen.gpx?raw';
import { buildRuiyanToRyohenRoute, distanceMeters, indexRoute, pointAlongRoute, sliceRoute } from '../lib/migrationRoute.js';

import places from '../data/migration-places.json';
import { prepareOldSettlements, sampleExploration } from '../lib/oldSettlements.js';
import OldSettlementCard from './OldSettlementCard.jsx';
import { OLD_SETTLEMENT_IMAGES } from '../data/oldSettlementImages.js';
import ContinuationOverlay from './ContinuationOverlay.jsx';
import { createModernMigration } from '../lib/modernMigration.js';
import { TOTAL_SCREENS } from '../lib/continuation.js';
import KnowledgeGraphOverlay from './KnowledgeGraphOverlay.jsx';
import MemoryMapOverlay from './MemoryMapOverlay.jsx';
import MemoryFeaturedStories from './MemoryFeaturedStories.jsx';
import MemoryStoryCard from './MemoryStoryCard.jsx';
import MemoryContribution from './MemoryContribution.jsx';
import { memoryNodes } from '../data/memoryNodes.js';
import ExplorationMapOverlay from './ExplorationMapOverlay.jsx';

const oldSettlements = prepareOldSettlements(places);

// Candidate positions used by the collision-aware photo layout. The actual
// screen coordinates are calculated from MapLibre at runtime, so this remains
// stable across viewport sizes and zoom levels.
// Keep the visual spread vertical. Horizontal movement can push a coastal
// photo into the ocean even when its source coordinate is on land.
const memoryLayoutCandidates = [[0, 0], [0, -28], [0, 28], [0, -56], [0, 56], [0, -84], [0, 84], [0, -112], [0, 112]];

gsap.registerPlugin(ScrollTrigger);
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const nanao = JSON.parse(nanaoRaw);
const yilan = JSON.parse(yilanRaw);
const outsideMask = createOutsideMask(nanao);
const contextPlaces = [
  { name: '台 灣', en: 'TAIWAN', coordinates: [120.94, 23.78], kind: 'island', show: s => 1 - smooth(s.index + s.local - 0.55) },
  { name: '宜蘭', en: 'YILAN', coordinates: [121.75, 24.75], kind: 'city', show: s => s.index === 0 ? 0.5 : 1 },
  { name: '花蓮', en: 'HUALIEN', coordinates: [121.606, 23.987], kind: 'city', show: s => s.index === 0 ? 0.5 : 1 },
  { name: '太 平 洋', en: 'PACIFIC OCEAN', coordinates: [122.0, 24.37], kind: 'ocean', show: s => s.index >= 1 ? 0.75 : 0 },
  { name: '中 央 山 脈', en: 'CENTRAL RANGE', coordinates: [121.51, 24.43], kind: 'mountain', show: s => s.index >= 1 ? 0.65 : 0 },
];

export default function NanaoScrollyMap({ onComplete, onProgress, onOldSettlementSelect, entered = true, entryScreen = 0 }) {
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const clearSelectionRef = useRef(() => {});
  const selectedMemoryRef = useRef(null);
  const memoryMarkersRef = useRef([]);
  const continuationRef = useRef();
  const modernRef = useRef();
  const graphRef = useRef();
  const sectionRef = useRef();
  const jumpToScreenRef = useRef(() => {});
  const stageRef = useRef();
  const mapRef = useRef();
  const photoRef = useRef();
  const captionsRef = useRef();
  const memoryRef = useRef();
  const featuredRef = useRef();
  const explorationMapRef = useRef();
  const routeMarkersRef = useRef([]);
  const callbacks = useRef({ onComplete, onProgress, onOldSettlementSelect });
  callbacks.current = { onComplete, onProgress, onOldSettlementSelect };

  useLayoutEffect(() => {
    if (!entered) return undefined;
    const frame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      jumpToScreenRef.current(entryScreen);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [entered, entryScreen]);

  useLayoutEffect(() => {
    let map;
    let ready = false;
    let disposed = false;
    let completed = false;
    let markers = [];
    let ruiyanMarker;
    let routeMarkers = [];
    let routeHeadMarker;
    let memoryMarkers = [];
    let memoryLayoutKey = '';
    let modern;
    const oldMarkers = [];
    let selected = null;
    // Until a visitor clicks any old settlement, Ryohen pulses as a hint that the dots are clickable.
    let settlementTried = false;
    clearSelectionRef.current = () => {
      selected = null;
      setSelectedSettlement(null);
      updateOldMarkers?.();
    };
    let explorationCamera;
    let memoryCamera;
    let exploration = sampleExploration(0, oldSettlements.length);
    const route = buildRuiyanToRyohenRoute(ancientGpx, siyuanRyohenGpx);
    const routeIndex = indexRoute(route);
    const ruiyanStart = route.geometry.coordinates[0];
    const siyuanPoint = [121.427, 24.488];
    const ryohenPoint = [121.63211, 24.44615];
    let siyuanDistance = 0;
    let ryohenDistance = routeIndex.total;
    routeIndex.coordinates.forEach((coordinate, i) => {
      const siyuanGap = distanceMeters(coordinate, siyuanPoint);
      const ryohenGap = distanceMeters(coordinate, ryohenPoint);
      if (siyuanGap < distanceMeters(routeIndex.coordinates[Math.max(0, i - 1)] ?? coordinate, siyuanPoint)) siyuanDistance = routeIndex.cumulative[i];
      if (ryohenGap < distanceMeters(routeIndex.coordinates[Math.max(0, i - 1)] ?? coordinate, ryohenPoint)) ryohenDistance = routeIndex.cumulative[i];
    });
    let previousCamera;
    let raf = 0;
    let mapTimer;
    const proxy = { progress: 0 };
    const mapEnd = 0.42;
    const photoFadeEnd = 0.5;
    const photoHoldEnd = 0.6;
    const migrationStart = 0.68;
    const migrationCameraA = { center: [121.31, 24.31], zoom: 9.25 };
    const migrationCameraB = { center: [121.52, 24.455], zoom: 9.45 };
    const migrationCameraC = { center: [121.61, 24.45], zoom: 10.9 };
    let sizeCorrection = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function layoutMemoryMarkers() {
      if (!map || !memoryMarkers.length) return;
      const center = map.getCenter();
      const key = `${map.getZoom().toFixed(3)}:${center.lng.toFixed(4)}:${center.lat.toFixed(4)}:${mapRef.current.clientWidth}:${mapRef.current.clientHeight}`;
      if (key === memoryLayoutKey) return;
      memoryLayoutKey = key;
      const minDistance = 54;
      const placed = [];
      memoryMarkers.forEach(({ button, memory }) => {
        const base = map.project(memory.coordinates);
        const fits = candidate => {
          const position = [base.x + candidate[0], base.y + candidate[1]];
          return placed.every(previous => Math.hypot(position[0] - previous[0], position[1] - previous[1]) >= minDistance);
        };
        const selected = memoryLayoutCandidates.find(fits) ?? memoryLayoutCandidates.reduce((best, candidate) => {
          const position = [base.x + candidate[0], base.y + candidate[1]];
          const clearance = Math.min(...placed.map(previous => Math.hypot(position[0] - previous[0], position[1] - previous[1])));
          const bestPosition = [base.x + best[0], base.y + best[1]];
          const bestClearance = Math.min(...placed.map(previous => Math.hypot(bestPosition[0] - previous[0], bestPosition[1] - previous[1])));
          return clearance > bestClearance ? candidate : best;
        });
        button.style.setProperty('--memory-offset-x', `${selected[0]}px`);
        button.style.setProperty('--memory-offset-y', `${selected[1]}px`);
        placed.push([base.x + selected[0], base.y + selected[1]]);
      });
    }

    function updateOldMarkers() {
      oldMarkers.forEach(({ element, button, feature }, i) => {
        const active = modern?.active ? modern.isSelected(feature.properties.id) : selected?.id === feature.properties.id;
        element.style.visibility = exploration.opacities[i] > .001 ? 'visible' : 'hidden';
        button.style.opacity = exploration.opacities[i] * (modern?.active ? .72 * modern.weight(feature.properties.id) : selected && !active ? .6 : 1);
        button.style.setProperty('--reveal-scale', .7 + .3 * exploration.opacities[i]);
        button.disabled = modern?.active ? !modern.interactive : !exploration.interactive;
        button.tabIndex = button.disabled ? -1 : 0;
        button.setAttribute('aria-pressed', String(active));
        element.classList.toggle('is-selected', active);
        element.classList.toggle('is-inviting', i === 0 && !settlementTried && !selected && !modern?.active && exploration.interactive);
        button.style.setProperty('--story-label-opacity', i === 0 ? exploration.originLabelOpacity : 0);
        element.style.zIndex = active ? '3' : '2';
      });
    }

    function render() {
      // Preserve the original story and keep the final graph overview to a
      // short three-screen hold before the memory chapters begin.
      const screen = proxy.progress * TOTAL_SCREENS;
      // Let the graph core overlap the final question fade instead of waiting
      // for the transition layer to finish completely.
      // Knowledge graph is intentionally paused for this version. The scroll
      // story ends at the migration-to-question prelude; the graph overlay
      // remains mounted for the later milestone but is not entered yet.
      // 5-3 begins after the transition hold and reveals only materials.
      const graphProgress = Math.max(0, Math.min(1, (screen - 26) / 13));
      // Hold one full scroll step after 澳花村 has completed. The people layer
      // occupies exactly two scroll steps, then hands off directly to policy.
      const peopleProgress = Math.max(0, Math.min(1, (screen - 40) / 2));
      const policyProgress = Math.max(0, Math.min(1, (screen - 42) / 2));
      const organizationProgress = Math.max(0, Math.min(1, (screen - 46) / 5));
      const summaryProgress = Math.max(0, Math.min(1, (screen - 52) / 3));
      const memoryProgress = Math.max(0, Math.min(1, (screen - 55) / 8));
      const featuredProgress = Math.max(0, Math.min(1, (screen - 63) / 6));
      // Hold the featured-story outro for two full screens, then hand off
      // directly to the final exploration map.
      const explorationMapProgress = Math.max(0, Math.min(1, (screen - 71) / 4));
      if (memoryProgress <= .001 && selectedMemoryRef.current) {
        selectedMemoryRef.current = null;
        setSelectedMemory(null);
      }
      if (featuredProgress > .001 && selectedMemoryRef.current) {
        selectedMemoryRef.current = null;
        setSelectedMemory(null);
      }
      const storyProgress = Math.min(1, screen / 16);
      const exploreProgress = Math.max(0, (screen - 16) / 3);
      exploration = sampleExploration(exploreProgress, oldSettlements.length);
      if ((!exploration.interactive || screen > 19) && selected) {
        selected = null;
        setSelectedSettlement(null);
      }
      const mapProgress = Math.min(1, storyProgress / mapEnd);
      const photoIn = smooth((storyProgress - mapEnd) / (photoFadeEnd - mapEnd));
      const photoOut = smooth((storyProgress - photoHoldEnd) / (migrationStart - photoHoldEnd));
      const photoProgress = storyProgress < mapEnd ? 0 : storyProgress < photoHoldEnd ? photoIn : 1 - photoOut;
      const routeProgress = smooth((storyProgress - migrationStart) / (0.95 - migrationStart));
      const state = sampleScene(mapProgress);
      const stateCenter = state.index >= 7 ? ruiyanStart : state.center;
      sectionRef.current.dataset.scene = state.id;
      sectionRef.current.dataset.progress = proxy.progress.toFixed(4);
      sectionRef.current.dataset.exploration = exploreProgress.toFixed(4);
      sectionRef.current.dataset.mode = exploration.interactive ? 'explore' : 'story';
      sectionRef.current.dataset.graphProgress = graphProgress.toFixed(4);
      sectionRef.current.dataset.peopleProgress = peopleProgress.toFixed(4);
      sectionRef.current.dataset.policyProgress = policyProgress.toFixed(4);
      sectionRef.current.dataset.organizationProgress = organizationProgress.toFixed(4);
      sectionRef.current.dataset.summaryProgress = summaryProgress.toFixed(4);
      sectionRef.current.dataset.memoryProgress = memoryProgress.toFixed(4);
      sectionRef.current.dataset.featuredProgress = featuredProgress.toFixed(4);
      if (graphRef.current) {
        // The graph intro owns an opaque chapter background; reveal its
        // contents through --graph-progress instead of letting the map bleed
        // through during the text steps.
        graphRef.current.style.opacity = memoryProgress > .001 || featuredProgress > .001 || explorationMapProgress > .001 ? '0' : graphProgress > 0 ? '1' : '0';
        graphRef.current.style.visibility = memoryProgress > .001 || featuredProgress > .001 || explorationMapProgress > .001 ? 'hidden' : graphProgress > .001 ? 'visible' : 'hidden';
        graphRef.current.style.setProperty('--graph-progress', graphProgress);
        graphRef.current.style.setProperty('--people-progress', peopleProgress);
        graphRef.current.style.setProperty('--policy-progress', policyProgress);
        graphRef.current.style.setProperty('--organization-progress', organizationProgress);
        graphRef.current.style.setProperty('--summary-progress', summaryProgress);
        graphRef.current.dataset.stage = screen >= 52 ? 'summary' : screen >= 46 ? 'organizations' : screen >= 42 ? 'policy' : screen >= 40 ? 'people' : graphProgress < .25 ? 'intro' : graphProgress < .5 ? 'focus' : graphProgress < .68 ? 'core' : graphProgress < .80 ? 'materials' : 'places';
      }
      if (memoryRef.current) {
        const overviewFade = featuredProgress > .001 ? 1 - smooth(featuredProgress / .18) : 1;
        const memoryVisible = memoryProgress > .001 && overviewFade > .001;
        memoryRef.current.style.opacity = memoryVisible ? String(overviewFade) : '0';
        memoryRef.current.style.visibility = memoryVisible ? 'visible' : 'hidden';
        memoryRef.current.setAttribute('aria-hidden', String(!memoryVisible));
        memoryRef.current.style.setProperty('--memory-progress', memoryProgress);
      }
      if (featuredRef.current) {
        const visible = featuredProgress > .001 && explorationMapProgress <= .001;
        featuredRef.current.style.opacity = visible ? '1' : '0';
        featuredRef.current.style.visibility = visible ? 'visible' : 'hidden';
        featuredRef.current.style.pointerEvents = visible ? 'auto' : 'none';
        featuredRef.current.setAttribute('aria-hidden', String(!visible));
        featuredRef.current.style.setProperty('--featured-progress', featuredProgress);
        const track = featuredRef.current.querySelector('.memory-featured-track');
        if (track) {
          const distance = Math.max(0, track.scrollWidth - window.innerWidth);
          track.style.transform = `translate3d(${-distance * featuredProgress}px, 0, 0)`;
        }
      }
      if (explorationMapRef.current) {
        const visible = explorationMapProgress > .001;
        explorationMapRef.current.style.opacity = visible ? '1' : '0';
        explorationMapRef.current.style.visibility = visible ? 'visible' : 'hidden';
        explorationMapRef.current.style.pointerEvents = visible ? 'auto' : 'none';
        explorationMapRef.current.setAttribute('aria-hidden', String(!visible));
        explorationMapRef.current.style.setProperty('--exploration-progress', explorationMapProgress);
        explorationMapRef.current.dataset.stage = explorationMapProgress < .2 ? 'arriving' : 'explore';
      }
      if (continuationRef.current) {
        // Transition is its own short-lived layer. It fades during the last
        // part of the handoff and is fully unloaded before graph scenes begin.
        // Child layers own their timed opacity; keep the container mounted
        // until the handoff is complete, then remove it from rendering.
        continuationRef.current.style.opacity = '1';
        continuationRef.current.style.visibility = screen <= 26 ? 'visible' : 'hidden';
        continuationRef.current.style.pointerEvents = screen < 21 ? 'none' : 'none';
        continuationRef.current.setAttribute('aria-hidden', String(screen > 26));
        // Hard scene boundary: the migration CTA must be removed before the
        // question scene starts, rather than relying on opacity alone.
        const previousTextLayers = continuationRef.current.querySelectorAll('.continuation-a, .continuation-b');
        previousTextLayers.forEach(migrationCta => {
          // CTA belongs only to the dedicated migration-cta scene.
          const ctaVisible = screen > 19.5 && screen < 24;
          migrationCta.style.display = ctaVisible ? '' : 'none';
          migrationCta.style.visibility = ctaVisible ? 'visible' : 'hidden';
          migrationCta.style.pointerEvents = ctaVisible ? 'auto' : 'none';
          migrationCta.setAttribute('aria-hidden', String(!ctaVisible));
        });
      }
      mapRef.current.style.opacity = String(memoryProgress > 0 ? 1 : 1 - photoProgress);
      photoRef.current.style.opacity = String(photoProgress);
      photoRef.current.style.transform = `scale(${1.04 - photoProgress * 0.04})`;
      updateStoryCaptions(captionsRef.current, screen);
      if (ready) {
        modern?.update(screen);
        // Scene-scoped text lifecycles. These are deliberately applied after
        // the map migration renderer so no shared timeline can resurrect a
        // caption or CTA outside its own scene.
        if (continuationRef.current) {
          const caption = continuationRef.current.querySelector('.continuation-a');
          const cta = continuationRef.current.querySelector('.continuation-b');
          const question = continuationRef.current.querySelector('.continuation-c');
          if (caption) {
            const p = Math.max(0, Math.min(1, (screen - 18.25) / 1.25));
            const visible = screen >= 18.25 && screen < 19.5;
            caption.style.display = visible ? '' : 'none';
            caption.style.visibility = visible ? 'visible' : 'hidden';
            caption.style.opacity = visible ? String(smooth((p - .12) / .25) * (1 - smooth((p - .78) / .22))) : '0';
            caption.style.pointerEvents = 'none';
          }
          if (cta) {
            // Dedicated CTA scene: keep the invitation fully readable after
            // the representative route has arrived, before the question scene.
            const visible = screen >= 19.5 && screen < 24;
            cta.style.display = visible ? '' : 'none';
            cta.style.visibility = visible ? 'visible' : 'hidden';
            cta.style.opacity = visible ? '1' : '0';
            cta.style.pointerEvents = visible ? 'auto' : 'none';
            cta.setAttribute('aria-hidden', String(!visible));
          }
          if (question) {
            const visible = screen >= 24 && screen <= 26;
            question.style.display = visible ? '' : 'none';
            question.style.visibility = visible ? 'visible' : 'hidden';
            question.style.pointerEvents = visible ? 'auto' : 'none';
            if (visible) {
              const progress = Math.max(0, Math.min(1, (screen - 24) / 2));
              const line = (selector, opacity, y = 0) => {
                const element = question.querySelector(selector);
                if (!element) return;
                element.style.opacity = String(opacity);
                element.style.transform = selector === '.question-four' ? `translateX(-50%) translateY(${y}px)` : `translateY(${y}px)`;
              };
              const accumulated = (start, end, base = .5) => progress < start ? 0 : progress < end ? smooth((progress - start) / .16) : base;
              const finalRise = smooth((progress - .66) / .2);
              line('.question-one', progress < .68 ? accumulated(0, .18, .56) : .16, progress < .18 ? 8 * (1 - smooth(progress / .18)) : 0);
              line('.question-two', progress < .7 ? accumulated(.2, .38, .52) : .15, progress < .38 ? 8 * (1 - smooth((progress - .2) / .18)) : 0);
              line('.question-three', progress < .73 ? accumulated(.4, .58, .52) : .14, progress < .58 ? 8 * (1 - smooth((progress - .4) / .18)) : 0);
              line('.question-four', finalRise, 10 * (1 - finalRise));
              const choices = question.querySelector('.question-choices');
              if (choices) {
                const choiceProgress = smooth((progress - .8) / .16);
                choices.style.opacity = String(choiceProgress);
                choices.style.transform = `translateX(-50%) translateY(${10 * (1 - choiceProgress)}px)`;
                choices.style.pointerEvents = choiceProgress > .05 ? 'auto' : 'none';
              }
              question.dataset.questionProgress = progress.toFixed(3);
            }
          }
        }
        if (storyProgress >= migrationStart) {
          const travelled = routeIndex.total * routeProgress;
          const cameraA = { center: migrationCameraA.center, zoom: migrationCameraA.zoom + sizeCorrection };
          const cameraB = { center: migrationCameraB.center, zoom: migrationCameraB.zoom + sizeCorrection };
          const cameraC = { center: migrationCameraC.center, zoom: migrationCameraC.zoom + sizeCorrection };
          let camera = cameraA;
          if (routeProgress >= 0.48 && routeProgress < 0.55) {
            const t = smooth((routeProgress - 0.48) / 0.07);
            camera = { center: cameraA.center.map((value, i) => value + (cameraB.center[i] - value) * t), zoom: cameraA.zoom + (cameraB.zoom - cameraA.zoom) * t };
          } else if (routeProgress >= 0.55 && routeProgress < 0.92) {
            camera = cameraB;
          } else if (routeProgress >= 0.92 && routeProgress < 0.97) {
            const t = smooth((routeProgress - 0.92) / 0.05);
            camera = { center: cameraB.center.map((value, i) => value + (cameraC.center[i] - value) * t), zoom: cameraB.zoom + (cameraC.zoom - cameraB.zoom) * t };
          } else if (routeProgress >= 0.97) {
            camera = cameraC;
          }
          if (exploreProgress > 0 && explorationCamera) {
            const t = exploration.cameraMix;
            camera = {
              center: cameraC.center.map((value, i) => value + (explorationCamera.center[i] - value) * t),
              zoom: cameraC.zoom + (explorationCamera.zoom - cameraC.zoom) * t,
            };
          }
          if (modern?.active) camera = modern.camera(camera);
          if ((memoryProgress > 0 || featuredProgress > 0) && memoryCamera) camera = memoryCamera;
          const cameraChanged = !previousCamera || Math.abs(camera.zoom - previousCamera.zoom) > 0.001 || camera.center.some((value, i) => Math.abs(value - previousCamera.center[i]) > 0.00001);
          if (cameraChanged) {
            map.jumpTo({ center: camera.center, zoom: camera.zoom, bearing: 0, pitch: 0 });
            previousCamera = camera;
          }
          map.getSource('migration-route')?.setData(sliceRoute(routeIndex, travelled));
          if (routeHeadMarker) routeHeadMarker.setLngLat(pointAlongRoute(routeIndex, travelled));
        } else {
          const migrationCameraT = smooth((storyProgress - photoHoldEnd) / (migrationStart - photoHoldEnd));
          const camera = storyProgress >= photoHoldEnd
            ? { center: stateCenter.map((value, i) => value + (migrationCameraA.center[i] - value) * migrationCameraT), zoom: state.zoom + sizeCorrection + (migrationCameraA.zoom - state.zoom) * migrationCameraT }
            : { center: stateCenter, zoom: state.zoom + sizeCorrection };
          const cameraChanged = !previousCamera || Math.abs(camera.zoom - previousCamera.zoom) > 0.001 || camera.center.some((value, i) => Math.abs(value - previousCamera.center[i]) > 0.00001);
          if (cameraChanged) {
            map.jumpTo({ center: camera.center, zoom: camera.zoom, bearing: 0, pitch: 0 });
            previousCamera = camera;
          }
          map.getSource('migration-route')?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
          if (routeHeadMarker) routeHeadMarker.getElement().style.visibility = 'hidden';
        }
        updateOldMarkers();
        const explorationMapActive = explorationMapProgress > .001;
        map.setPaintProperty('migration-route', 'line-dasharray', explorationMapActive ? [0.65, 2.6] : [1, 0]);
        map.setPaintProperty('migration-route-casing', 'line-dasharray', explorationMapActive ? [0.65, 2.6] : [1, 0]);
        map.setPaintProperty('migration-route', 'line-width', explorationMapActive ? 2 : 4);
        map.setPaintProperty('migration-route-casing', 'line-width', explorationMapActive ? 4 : 7);
        map.setPaintProperty('migration-route', 'line-opacity', explorationMapActive ? 0 : exploration.routeOpacity);
        map.setPaintProperty('migration-route-casing', 'line-opacity', explorationMapActive ? 0 : .85 * exploration.routeOpacity);
        if (explorationMapActive) {
          map.setPaintProperty('major-roads', 'line-opacity', .06);
          map.setPaintProperty('minor-roads', 'line-opacity', 0);
          map.setPaintProperty('administration', 'line-opacity', 0);
          map.setPaintProperty('waterways', 'line-opacity', .18);
          map.setPaintProperty('forest', 'fill-opacity', .2);
          map.setPaintProperty('park', 'fill-opacity', .08);
          map.setPaintProperty('residential', 'fill-opacity', .1);
        }
        map.setPaintProperty('nanao-fill', 'fill-opacity', state.nanaoFillOpacity * 0.16);
        map.setPaintProperty('nanao-border', 'line-opacity', explorationMapActive ? 0 : state.nanaoBorderOpacity);
        map.setPaintProperty('outside-mask', 'fill-opacity', state.outsideMaskOpacity);
        map.setPaintProperty('yilan-border', 'line-opacity', explorationMapActive ? 0 : state.yilanOpacity);
        settlements.forEach((place, i) => {
          const opacity = settlementAlpha(state.settlementOpacity, i);
          map.setPaintProperty(`settlement-${place.id}`, 'circle-opacity', opacity);
          map.setPaintProperty(`settlement-${place.id}`, 'circle-stroke-opacity', opacity);
          const labelOpacity = settlementAlpha(state.settlementLabelOpacity, i);
          markers[i].getElement().style.opacity = labelOpacity;
          markers[i].getElement().style.visibility = labelOpacity > 0.001 ? 'visible' : 'hidden';
        });
        const contextFade = 1 - state.ruiyanOpacity * 0.45;
        contextPlaces.forEach((place, i) => {
          const contextMarker = markers[i + settlements.length].getElement();
          contextMarker.style.opacity = explorationMapActive ? 0 : place.show(state) * contextFade;
          contextMarker.style.visibility = explorationMapActive || modern?.active ? 'hidden' : 'visible';
        });
        if (explorationMapActive) {
          markers.slice(0, settlements.length).forEach(marker => {
            marker.getElement().style.opacity = 0;
            marker.getElement().style.visibility = 'hidden';
          });
        }
        if (ruiyanMarker) {
          const el = ruiyanMarker.getElement();
          const markerOpacity = state.ruiyanOpacity * (1 - photoProgress) * (1 - routeProgress * 0.92);
          el.style.opacity = markerOpacity;
          el.style.visibility = markerOpacity > 0.001 && !modern?.active ? 'visible' : 'hidden';
          el.querySelector('.ruiyan-dot').style.transform = `translate(-50%, -50%) scale(${0.7 + 0.3 * state.ruiyanOpacity})`;
          el.querySelector('.ruiyan-halo').style.opacity = state.ruiyanHaloOpacity;
          el.querySelector('.ruiyan-label').style.opacity = state.ruiyanLabelOpacity;
        }
        if (routeMarkers.length) {
          const travelled = routeIndex.total * routeProgress;
          const siyuanAlpha = travelled > siyuanDistance - 500 ? smooth((500 - Math.abs(travelled - siyuanDistance)) / 250) : 0;
          const ryohenAlpha = exploreProgress > 0 ? 0 : smooth((routeProgress - 0.95) / 0.05);
          routeMarkers[0].getElement().style.opacity = siyuanAlpha;
          routeMarkers[0].getElement().style.visibility = siyuanAlpha > 0.001 && !modern?.active ? 'visible' : 'hidden';
          routeMarkers[1].getElement().style.opacity = ryohenAlpha;
          routeMarkers[1].getElement().style.visibility = ryohenAlpha > 0.001 ? 'visible' : 'hidden';
        }
        if (routeHeadMarker && storyProgress >= migrationStart) {
          const headOpacity = routeProgress > 0.001 && routeProgress < 1 ? 1 : 0;
          routeHeadMarker.getElement().style.opacity = headOpacity;
          routeHeadMarker.getElement().style.visibility = headOpacity ? 'visible' : 'hidden';
        }
        // Reveal the overview as one calm photographic field after the camera
        // settles. An index-based stagger leaves many thumbnails half-opaque
        // at once, which reads as a jittery stack when locations are nearby.
        const memoryReveal = smooth((memoryProgress - .06) / .46);
        memoryMarkers.forEach(({ element }) => {
          const reveal = featuredProgress > .001 ? 0 : memoryReveal;
          // MapLibre owns the marker element's transform, so fade the child
          // button to keep the reveal value from being overwritten.
          const thumb = element.querySelector('.memory-thumb');
          element.style.opacity = reveal > .001 ? '1' : '0';
          element.style.visibility = reveal > .001 ? 'visible' : 'hidden';
          element.style.pointerEvents = reveal > .75 ? 'auto' : 'none';
          if (thumb) thumb.style.opacity = String(reveal);
          element.style.setProperty('--memory-reveal', reveal);
        });
        if (memoryProgress <= .001) memoryMarkers.forEach(({ element }) => element.classList.remove('is-selected'));
        if (memoryProgress > 0 || featuredProgress > 0) {
          layoutMemoryMarkers();
          oldMarkers.forEach(({ element, button }) => {
            element.style.visibility = 'hidden';
            button.disabled = true;
          });
          markers.forEach(marker => { marker.getElement().style.visibility = 'hidden'; });
          if (ruiyanMarker) ruiyanMarker.getElement().style.visibility = 'hidden';
          routeMarkers.forEach(marker => { marker.getElement().style.visibility = 'hidden'; });
          if (routeHeadMarker) routeHeadMarker.getElement().style.visibility = 'hidden';
          map.setPaintProperty('major-roads', 'line-opacity', .2);
          map.setPaintProperty('minor-roads', 'line-opacity', .14);
          map.setPaintProperty('administration', 'line-opacity', .12);
          map.setPaintProperty('waterways', 'line-opacity', .38);
          map.setPaintProperty('forest', 'fill-opacity', .34);
          map.setPaintProperty('park', 'fill-opacity', .16);
          map.setPaintProperty('nanao-fill', 'fill-opacity', 0);
          map.setPaintProperty('nanao-border', 'line-opacity', 0);
          map.setPaintProperty('outside-mask', 'fill-opacity', 0);
          map.setPaintProperty('yilan-border', 'line-opacity', 0);
          settlements.forEach(place => {
            map.setPaintProperty(`settlement-${place.id}`, 'circle-opacity', 0);
            map.setPaintProperty(`settlement-${place.id}`, 'circle-stroke-opacity', 0);
          });
        }
      }
      callbacks.current.onProgress?.({ progress: proxy.progress, scene: explorationMapProgress > 0 ? 'exploration-map' : featuredProgress > 0 ? 'memory-featured' : memoryProgress > 0 ? 'memory-overview' : exploreProgress > 0 ? 'old-settlements' : state.id, mode: exploration.interactive ? 'explore' : 'story' });
      if (proxy.progress >= 0.995 && !completed) {
        completed = true;
        callbacks.current.onComplete?.({ nextSection: 'knowledge-graph', mode: 'network-prelude' });
      }
      if (proxy.progress < 0.98) completed = false;
    }

    function resize() {
      if (!map) return;
      map.resize();
      sizeCorrection = Math.log2(Math.min(mapRef.current.clientWidth / 920, mapRef.current.clientHeight / 780));
      const bounds = new maplibregl.LngLatBounds();
      oldSettlements.forEach(feature => bounds.extend(feature.geometry.coordinates));
      const fitted = map.cameraForBounds(bounds, { padding: 64, bearing: 0, pitch: 0 });
      if (fitted) explorationCamera = {
        center: [fitted.center.lng, fitted.center.lat],
        zoom: Math.min(fitted.zoom, migrationCameraC.zoom + sizeCorrection - .45),
      };
      const memoryBounds = new maplibregl.LngLatBounds();
      memoryNodes.forEach(memory => memoryBounds.extend(memory.coordinates));
      const memoryFitted = map.cameraForBounds(memoryBounds, { padding: { top: 108, right: 96, bottom: 176, left: 96 }, bearing: 0, pitch: 0 });
      if (memoryFitted) memoryCamera = {
        center: [memoryFitted.center.lng, memoryFitted.center.lat],
        zoom: Math.min(memoryFitted.zoom, 11.2),
      };
      modern?.resize();
      render();
    }

    try {
      map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: scenes[0].center,
        zoom: scenes[0].zoom,
        interactive: false,
        attributionControl: { compact: true },
        renderWorldCopies: false,
        fadeDuration: 0,
        maxZoom: 15,
        localIdeographFontFamily: 'PingFang TC, Microsoft JhengHei, sans-serif',
      });
      mapTimer = setTimeout(() => {}, 10000);
      map.on('load', () => {
        if (disposed) return;
        clearTimeout(mapTimer);
        map.addSource('nanao', { type: 'geojson', data: nanao });
        map.addSource('yilan', { type: 'geojson', data: yilan });
        map.addSource('outside', { type: 'geojson', data: outsideMask });
        map.addSource('settlements', { type: 'geojson', data: { type: 'FeatureCollection', features: settlements.map(p => ({ type: 'Feature', properties: { id: p.id }, geometry: { type: 'Point', coordinates: p.coordinates } })) } });
        map.addSource('migration-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
        map.addLayer({ id: 'yilan-border', type: 'line', source: 'yilan', paint: { 'line-color': '#a79b7e', 'line-width': 1.4, 'line-opacity': 0, 'line-dasharray': [3, 3] } });
        map.addLayer({ id: 'outside-mask', type: 'fill', source: 'outside', paint: { 'fill-color': '#f3f2ed', 'fill-opacity': 0 } });
        map.addLayer({ id: 'nanao-fill', type: 'fill', source: 'nanao', paint: { 'fill-color': '#a7b18b', 'fill-opacity': 0 } });
        map.addLayer({ id: 'nanao-border', type: 'line', source: 'nanao', layout: { 'line-join': 'round' }, paint: { 'line-color': '#b98a57', 'line-width': 2.4, 'line-opacity': 0 } });
        map.addLayer({ id: 'migration-route-casing', type: 'line', source: 'migration-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': 'rgba(255,248,235,0.55)', 'line-width': 7, 'line-opacity': 0.85 } });
        map.addLayer({ id: 'migration-route', type: 'line', source: 'migration-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#b98a57', 'line-width': 4, 'line-opacity': 1 } });
        settlements.forEach(place => {
          map.addLayer({ id: `settlement-${place.id}`, type: 'circle', source: 'settlements', filter: ['==', ['get', 'id'], place.id], paint: { 'circle-radius': 4, 'circle-color': '#756b52', 'circle-stroke-color': '#fbf8ee', 'circle-stroke-width': 2, 'circle-opacity': 0, 'circle-stroke-opacity': 0 } });
          const el = document.createElement('div');
          el.className = 'settlement-label';
          el.style.opacity = 0;
          const [dx, dy] = place.labelOffset;
          const line = document.createElement('i');
          line.style.width = `${Math.hypot(dx, dy)}px`;
          line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
          const label = document.createElement('span');
          label.textContent = place.name;
          label.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
          el.append(line, label);
          markers.push(new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(place.coordinates).addTo(map));
        });
        contextPlaces.forEach(place => {
          const el = document.createElement('div');
          el.className = `context-label ${place.kind}`;
          const name = document.createElement('span');
          name.textContent = place.name;
          const en = document.createElement('small');
          en.textContent = place.en;
          el.append(name, en);
          markers.push(new maplibregl.Marker({ element: el }).setLngLat(place.coordinates).addTo(map));
        });
        const ruiyanEl = document.createElement('div');
        ruiyanEl.className = 'ruiyan-marker';
        ruiyanEl.innerHTML = '<i class="ruiyan-halo"></i><b class="ruiyan-dot"></b><span class="ruiyan-label">瑞岩部落</span>';
        ruiyanMarker = new maplibregl.Marker({ element: ruiyanEl, anchor: 'center' }).setLngLat(ruiyanStart).addTo(map);
        const createRouteMarker = (coordinates, label) => {
          const el = document.createElement('div');
          el.className = 'migration-node';
          el.innerHTML = `<b></b><span>${label}</span>`;
          el.style.opacity = 0;
          el.style.visibility = 'hidden';
          return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(coordinates).addTo(map);
        };
        routeMarkers = [createRouteMarker(siyuanPoint, '思源埡口'), createRouteMarker(ryohenPoint, 'Ryohen（流興社）')];
        routeMarkersRef.current = routeMarkers;
        const routeHeadEl = document.createElement('div');
        routeHeadEl.className = 'migration-progress-dot';
        routeHeadEl.style.visibility = 'hidden';
        routeHeadMarker = new maplibregl.Marker({ element: routeHeadEl, anchor: 'center' }).setLngLat(ruiyanStart).addTo(map);
        oldSettlements.forEach(feature => {
          const element = document.createElement('div');
          element.className = 'old-settlement';
          element.style.visibility = 'hidden';
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'old-settlement-hit';
          button.setAttribute('aria-label', feature.properties.id + ' · ' + feature.properties.oldName);
          button.dataset.settlementId = feature.properties.id;
          const dot = document.createElement('i');
          const label = document.createElement('span');
          label.textContent = feature.properties.id;
          button.append(dot, label);
          element.append(button);
          button.addEventListener('click', event => {
            if (!exploration.interactive) return;
            settlementTried = true;
            // Overlapping touch targets resolve to the nearest actual dot.
            // Keyboard activation still selects the focused settlement.
            let target = feature;
            if (event.detail > 0) {
              let nearest = Infinity;
              oldMarkers.forEach(candidate => {
                const rect = candidate.button.getBoundingClientRect();
                const distance = Math.hypot(event.clientX - rect.x - rect.width / 2, event.clientY - rect.y - rect.height / 2);
                if (distance < nearest) { nearest = distance; target = candidate.feature; }
              });
            }
            const { id, oldName, lat, lon, info } = target.properties;
            if (modern?.active) { if (modern.interactive) modern.select(id); return; }
            selected = { id, oldName, lat, lon, info };
            setSelectedSettlement(selected);
            updateOldMarkers();
            callbacks.current.onOldSettlementSelect?.(selected);
          });
          const marker = new maplibregl.Marker({ element, anchor: 'center' })
            .setLngLat(feature.geometry.coordinates).addTo(map);
          oldMarkers.push({ marker, element, button, feature });
        });
        memoryNodes.forEach((memory, memoryIndex) => {
          const element = document.createElement('div');
          element.className = 'memory-marker';
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'memory-thumb';
          button.style.setProperty('--memory-offset-x', '0px');
          button.style.setProperty('--memory-offset-y', '0px');
          button.setAttribute('aria-label', `${memory.title}｜${memory.location}`);
          button.innerHTML = `<img src="${memory.image}" alt="" loading="lazy"><span class="memory-tooltip"><b>${memory.title}</b><small>${memory.location}</small></span>`;
          button.addEventListener('click', () => {
            memoryMarkers.forEach(candidate => candidate.element.classList.remove('is-selected'));
            element.classList.add('is-selected');
            selectedMemoryRef.current = memory;
            setSelectedMemory(memory);
          });
          element.append(button);
          const marker = new maplibregl.Marker({ element, anchor: 'center' }).setLngLat(memory.coordinates).addTo(map);
          element.style.opacity = '0';
          element.style.visibility = 'hidden';
          element.style.pointerEvents = 'none';
          memoryMarkers.push({ marker, element, button, memory });
        });
        memoryMarkersRef.current = memoryMarkers;
        modern = createModernMigration(map, continuationRef.current, updateOldMarkers);
        modernRef.current = modern;
        ready = true;
        resize();
      });
    } catch (error) {
      console.error('Map initialization failed', error);
    }

    const tween = gsap.to(proxy, {
      progress: 1,
      ease: 'none',
      onUpdate: render,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * TOTAL_SCREENS}`,
        pin: stageRef.current,
        scrub: reduced ? true : storySettings.scrub,
        invalidateOnRefresh: true,
        onRefresh: resize,
      },
    });
    jumpToScreenRef.current = screen => {
      const trigger = tween.scrollTrigger;
      const progress = Math.max(0, Math.min(1, screen / TOTAL_SCREENS));
      // Jump directly: do not scrub through all the skipped chapters.
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: 'instant' });
      ScrollTrigger.update();
      trigger.getTween()?.progress?.(1);
      tween.progress(progress);
      render();
    };
    const observer = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(resize); });
    observer.observe(mapRef.current);
    render();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
      clearTimeout(mapTimer);
      markers.forEach(marker => marker.remove());
      routeMarkers.forEach(marker => marker.remove());
      oldMarkers.forEach(({ marker }) => marker.remove());
      memoryMarkers.forEach(({ marker }) => marker.remove());
      memoryMarkersRef.current = [];
      memoryLayoutKey = '';
      routeHeadMarker?.remove();
      ruiyanMarker?.remove();
      modern?.destroy();
      modernRef.current = null;
      map?.remove();
      clearSelectionRef.current = () => {};
    };
  }, []);

  return <main inert={!entered} aria-hidden={entered ? 'false' : 'true'}><section id="chapter-1" ref={sectionRef} className="story" data-selected-settlement={selectedSettlement?.id ?? ''} aria-label="南澳地圖動畫"><div ref={stageRef} className="stage"><div ref={mapRef} className="map" aria-label="南澳地理位置互動地圖" /><img ref={photoRef} className="ruiyan-photo" src="/images/瑞岩部落.jpg" alt="" draggable="false" /><StoryCaptions captionsRef={captionsRef} /><OldSettlementCard image={OLD_SETTLEMENT_IMAGES[selectedSettlement?.id]} settlement={selectedSettlement} open={Boolean(selectedSettlement)} onClose={() => clearSelectionRef.current()} /><ContinuationOverlay overlayRef={continuationRef} onMode={value => modernRef.current?.setView(value)} /><KnowledgeGraphOverlay graphRef={graphRef} /><MemoryMapOverlay overlayRef={memoryRef} /><MemoryFeaturedStories overlayRef={featuredRef} /><ExplorationMapOverlay overlayRef={explorationMapRef} /><MemoryStoryCard memory={selectedMemory} open={Boolean(selectedMemory)} onClose={() => { memoryMarkersRef.current.forEach(({ element }) => element.classList.remove('is-selected')); selectedMemoryRef.current = null; setSelectedMemory(null); }} /></div></section><MemoryContribution standalone /></main>;
}
