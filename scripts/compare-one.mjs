// Single-case SVG compare: TS port vs original verovio WASM.
// Usage: node scripts/compare-one.mjs <dir/file>   (e.g. mei/001.mei)
// Prints one line: RESULT:<json>  (stdout may contain wasm warnings; parse last RESULT line)
// Exit 0 always (result carries status); external `timeout` kills hangs.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const target = process.argv[2];
const require = createRequire(import.meta.url);
const WASM = process.env.VEROVIO_WASM ?? 'C:/Users/manh9/AppData/Local/Temp/vrv-orig/package/dist/verovio-toolkit-wasm.js';
const WASM_HUM_URL = pathToFileURL('C:/Users/manh9/AppData/Local/Temp/vrv-orig/package/dist/verovio-module-hum.mjs').href;

// Raw Emscripten module (hum build) for .krn: the default toolkit bundle is
// built without humdrum support and loadData('.krn') always returns false.
let humMod = null;
async function getHum() {
  if (!humMod) humMod = await (await import(WASM_HUM_URL)).default();
  return humMod;
}
function humRender(data) {
  return getHum().then((Module) => {
    const ctor = Module.cwrap('vrvToolkit_constructor', 'number', []);
    const load = Module.cwrap('vrvToolkit_loadData', 'number', ['number', 'string']);
    const render = Module.cwrap('vrvToolkit_renderToSVG', 'string', ['number', 'number', 'number']);
    const dtor = Module.cwrap('vrvToolkit_destructor', null, ['number']);
    const ptr = ctor();
    try {
      if (!load(ptr, data)) return { err: 'load-false' };
      return { svg: render(ptr, 1, 0) };
    } finally { dtor(ptr); }
  });
}

function norm(svg) {
  return svg
    // random xml:ids leak into spanning classes (class="tie id-xxx spanning", beamSpan, ...)
    .replace(/\bid-[A-Za-z0-9_-]+\b/g, 'id-X')
    .replace(/class="([^"]*MilestoneEnd) [^"]*"/g, 'class="$1 X"')
    .replace(/#[A-Za-z0-9_-]+/g, '#X')
    .replace(/id="[^"]*"/g, 'id="X"')
    .replace(/xlink:href="#[^"]*"/g, 'xlink:href="#X"')
    .replace(/<desc>.*?<\/desc>/s, '<desc/>')
    .replace(/Engraved by Verovio [^<]*/, 'Engraved by Verovio X')
    .replace(/\s+/g, ' ')
    .trim();
}

function done(result) {
  console.log('RESULT:' + JSON.stringify(result));
  process.exit(0);
}

try {
  const data = readFileSync(join(ROOT, 'testcase', target), 'utf8');
  const verovio = require(WASM);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('wasm-init-timeout')), 50000);
    verovio.module.onRuntimeInitialized = () => { clearTimeout(t); resolve(); };
  });

  let oSvg = '', oErr = '';
  try {
    if (target.endsWith('.krn')) {
      const r = await humRender(data);
      if (r.err) oErr = r.err; else oSvg = r.svg;
    } else {
      const otk = new verovio.toolkit();
      if (!otk.loadData(data)) oErr = 'load-false';
      else oSvg = otk.renderToSVG(1);
    }
  } catch (e) { oErr = String(e).slice(0, 200); }

  const { Toolkit } = await import('../dist/toolkit.js');
  let pSvg = '', pErr = '';
  try {
    const ptk = new Toolkit(true);
    if (!ptk.LoadData(data)) pErr = 'load-false';
    else pSvg = ptk.RenderToSVG(1);
  } catch (e) { pErr = String(e && e.stack || e).slice(0, 300); }

  if (oErr || pErr) done({ file: target, status: 'ERROR', detail: `orig=${oErr || 'ok'} port=${pErr || 'ok'}` });
  else if (norm(oSvg) === norm(pSvg)) done({ file: target, status: 'IDENT', detail: `len=${pSvg.length}` });
  else {
    const on = norm(oSvg), pn = norm(pSvg);
    let i = 0;
    while (i < Math.min(on.length, pn.length) && on[i] === pn[i]) i++;
    const sim = i / Math.max(on.length, pn.length);
    done({
      file: target, status: sim > 0.9 ? 'CLOSE' : 'DIFF',
      detail: `orig=${oSvg.length} port=${pSvg.length} prefix=${(sim * 100).toFixed(1)}%`,
      ...(sim <= 0.9 ? { origSvg: oSvg, portSvg: pSvg } : {}),
    });
  }
} catch (e) {
  done({ file: target, status: 'ERROR', detail: `harness: ${String(e && e.message || e).slice(0, 200)}` });
}
