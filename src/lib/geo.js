import { difference } from '@turf/difference';
import { featureCollection, polygon } from '@turf/helpers';
// Polygon clipping preserves all islands and any holes, rather than assuming a single ring.
export function createOutsideMask(boundary) {
  const world=polygon([[[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]]]);
  return difference(featureCollection([world,boundary]));
}
