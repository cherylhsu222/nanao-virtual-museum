import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const files = JSON.parse(fs.readFileSync('/private/tmp/migration-files.json'));
const routes = { g_jinyue: '舊金岳', g_wuta: '武塔社', g_jinyang: '舊金洋', g_bihou: '碧候舊社', g_aohua: '舊澳花' };
for (const [key, name] of Object.entries(routes)) {
  const file = files.find(f => f.name.startsWith(name) && f.name.endsWith('.gpx'));
  if (!file) throw new Error(`Missing ${name}`);
  execFileSync('curl', ['-fL', encodeURI(file.download_url), '-o', `src/data/${key}.gpx`]);
  console.log(key, file.name);
}
