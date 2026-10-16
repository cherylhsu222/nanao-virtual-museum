import fs from 'node:fs';
import { feature } from 'topojson-client';
const atlas = JSON.parse(fs.readFileSync('node_modules/taiwan-atlas/towns-10t.json'));
fs.mkdirSync('src/data', { recursive: true });
const towns = feature(atlas, atlas.objects.towns);
const counties = feature(atlas, atlas.objects.counties);
const nanao = towns.features.find(f => f.properties.TOWNNAME === '南澳鄉');
if (!nanao) throw new Error('Missing real Nanao boundary');
for (const [name, data] of Object.entries({
  'nanao-boundary': nanao,
  'yilan-boundary': counties.features.find(f => f.properties.COUNTYNAME === '宜蘭縣'),
  'taiwan-boundary': feature(atlas, atlas.objects.nation),
})) fs.writeFileSync(`src/data/${name}.geojson`, JSON.stringify(data));
console.log('Extracted actual Nanao, Yilan and Taiwan boundaries from taiwan-atlas.');
