import fs from 'node:fs';
import path from 'node:path';
const places = JSON.parse(fs.readFileSync('src/data/migration-places.json'));
const aliases = { 'Ryohen（流興）': ['流興'], '比亞毫社': ['比亞豪'], '舊武塔社': ['武塔社'], '克魯模安／庫巴博': ['庫巴博'] };
const files = fs.readdirSync('pic').filter(f => /\.(jpe?g|png|webp)$/i.test(f));
const old = places.filter(p => p.t === 'old');
const matches = p => files.filter(f => [p.id, ...p.oldName.split(/[/／]/).map(s => s.trim()), ...(aliases[p.id] ?? [])].some(n => f.toLowerCase().includes(n.toLowerCase())));
const mapping = {};
fs.mkdirSync('public/images/old-settlements', { recursive: true });
console.log('Old Settlement Image Mapping');
for (const p of old) {
  // User confirmed this photograph is shared by these two settlements.
  const candidates = matches(p).filter(f => f === '舊金洋 奎諾斯社 .jpg' || old.filter(other => matches(other).includes(f)).length === 1);
  if (candidates.length !== 1) { console.log('⚠', p.id, '→ image not found or ambiguous:', matches(p)); continue; }
  const file = candidates[0];
  fs.copyFileSync(path.join('pic', file), path.join('public/images/old-settlements', file));
  mapping[p.id] = '/images/old-settlements/' + file;
  console.log('✓', p.id, '→', file);
}
fs.writeFileSync('src/data/oldSettlementImages.js', '// Photo presentation metadata; original PLACES is unchanged.\nexport const OLD_SETTLEMENT_IMAGES = ' + JSON.stringify(mapping, null, 2) + ';\n');
