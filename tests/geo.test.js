import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createOutsideMask} from '../src/lib/geo.js';
const nanao=JSON.parse(fs.readFileSync(new URL('../src/data/nanao-boundary.geojson',import.meta.url)));
function inRing(p,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function contains(p,f){const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;return polygons.some(r=>inRing(p,r[0])&&!r.slice(1).some(h=>inRing(p,h)));}
test('mask excludes Nanao but includes the sea and Taipei',()=>{
 const mask=createOutsideMask(nanao);
 assert.equal(contains([121.65,24.46],mask),false);
 assert.equal(contains([122,24.46],mask),true);
 assert.equal(contains([121.565,25.033],mask),true);
});
test('real boundary is Nanao and all six representative points are inside',()=>{
 assert.equal(nanao.properties.TOWNNAME,'南澳鄉');
 const points=JSON.parse(fs.readFileSync(new URL('../src/data/settlements.json',import.meta.url)));
 assert.equal(points.length,6);
 for(const p of points)assert.equal(contains(p.coordinates,nanao),true,p.name);
});
