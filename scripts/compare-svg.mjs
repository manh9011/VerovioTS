// Compares TS-port SVG output vs original verovio WASM on testcase/*.
// Usage: node scripts/compare-svg.mjs [--limit N] [--dir mei|mxl|hum]
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
const dirIdx = args.indexOf('--dir');
const DIRS = dirIdx >= 0 ? [args[dirIdx + 1]] : ['mei', 'mxl', 'hum'];

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const WASM = 'C:/Users/manh9/AppData/Local/Temp/vrv-orig/package/dist/verovio-toolkit-wasm.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const verovio = require(WASM);
await new Promise((resolve) => { verovio.module.onRuntimeInitialized = resolve; });

const { Toolkit } = await import('../dist/toolkit.js');

function norm(svg) {
  return svg
    // random xml:ids leak into tie classes (class="tie id-xxx"); milestone
    // suffix classes (systemMilestoneEnd xxx) are random per run too.
    .replace(/((?:tie|slur|hairpin|tie\.\w+) )id-[A-Za-z0-9_-]+/g, '$1id-X')
    .replace(/class="([^"]*MilestoneEnd) [^"]*"/g, 'class="$1 X"')
    .replace(/#[A-Za-z0-9_-]+/g, '#X')
    .replace(/id="[^"]*"/g, 'id="X"')
    .replace(/xlink:href="#[^"]*"/g, 'xlink:href="#X"')
    .replace(/<desc>.*?<\/desc>/s, '<desc/>')
    .replace(/Engraved by Verovio [^<]*/, 'Engraved by Verovio X')
    .replace(/\s+/g, ' ')
    .trim();
}

mkdirSync(join(ROOT, '.tmp', 'svgdiff'), { recursive: true });
const rows = [];
for (const dir of DIRS) {
  const files = readdirSync(join(ROOT, 'testcase', dir))
    .filter((f) => !f.startsWith('.'))
    .sort()
    .slice(0, LIMIT);
  for (const f of files) {
    const data = readFileSync(join(ROOT, 'testcase', dir, f), 'utf8');
    // original
    const otk = new verovio.toolkit();
    let oSvg = '', oErr = '';
    try {
      if (!otk.loadData(data)) oErr = 'load-false';
      else oSvg = otk.renderToSVG(1);
    } catch (e) { oErr = String(e).slice(0, 120); }
    // port
    const ptk = new Toolkit(true);
    let pSvg = '', pErr = '';
    try {
      if (!ptk.LoadData(data)) pErr = 'load-false';
      else pSvg = ptk.RenderToSVG(1);
    } catch (e) { pErr = String(e).slice(0, 200); }
    let status, detail;
    if (oErr || pErr) { status = 'ERROR'; detail = `orig=${oErr || 'ok'} port=${pErr || 'ok'}`; }
    else if (norm(oSvg) === norm(pSvg)) { status = 'IDENT'; detail = `len=${pSvg.length}`; }
    else {
      const on = norm(oSvg), pn = norm(pSvg);
      // crude similarity: common prefix ratio
      let i = 0;
      while (i < Math.min(on.length, pn.length) && on[i] === pn[i]) i++;
      const sim = (i / Math.max(on.length, pn.length));
      status = sim > 0.9 ? 'CLOSE' : 'DIFF';
      detail = `orig=${oSvg.length} port=${pSvg.length} prefix=${(sim * 100).toFixed(1)}%`;
      if (status === 'DIFF') {
        writeFileSync(join(ROOT, '.tmp', 'svgdiff', `${dir}-${f}.orig.svg`), oSvg);
        writeFileSync(join(ROOT, '.tmp', 'svgdiff', `${dir}-${f}.port.svg`), pSvg);
      }
    }
    rows.push({ file: `${dir}/${f}`, status, detail });
    console.log(`${status}\t${dir}/${f}\t${detail}`);
  }
}
const ident = rows.filter((r) => r.status === 'IDENT').length;
console.log(`\n${ident}/${rows.length} identical, ${rows.filter((r) => r.status === 'CLOSE').length} close, ${rows.filter((r) => r.status === 'DIFF').length} diff, ${rows.filter((r) => r.status === 'ERROR').length} error`);
writeFileSync(join(ROOT, '.tmp', 'svgdiff', 'report.json'), JSON.stringify(rows, null, 1));
