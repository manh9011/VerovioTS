// Bench: OSMD vs verovio WASM vs TS port on testcase/mxl (MusicXML only).
// Shared INFINITE single-line layout for fairness:
//   verovio: setOptions breaks:none + adjustPageHeight -> 1 page, render all pages.
//   OSMD: renderSingleHorizontalStaffline -> whole score on one staffline.
// Usage: node scripts/bench-osmd.mjs [--offset N] [--limit N] [--only f] [--target 100]
// Resumes: reads existing OUT rows, skips files already OK unless --redo.
// One process, one instance per engine. Logs muted during timing.
// Progress -> stderr, final summary -> stdout. Flushes JSON after each file.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const OFFSET = Number(opt('--offset', '0'));
const LIMIT = opt('--limit', null) ? Number(opt('--limit', '0')) : Infinity;
const ONLY = opt('--only', null);
const TARGET = Number(opt('--target', '100'));
const MAX_WT = Number(opt('--max-reps-wt', '8'));
const MAX_OSMD = Number(opt('--max-reps-osmd', '3'));
const REDO = args.includes('--redo');
const OUT = opt('--out', join(ROOT, '.tmp', 'bench', 'osmd-mxl.json'));
mkdirSync(dirname(OUT), { recursive: true });

const OPT_JSON = JSON.stringify({ breaks: 'none', adjustPageHeight: true });
const OPT_OBJ = { breaks: 'none', adjustPageHeight: true };

const origConsole = { ...console };
function mute() {
  for (const k of ['log', 'warn', 'error', 'info', 'debug']) console[k] = () => {};
}
function unmute() { Object.assign(console, origConsole); }
const prog = (s) => process.stderr.write(s + '\n');

// ---- DOM (jsdom + canvas) ----
const benchRequire = createRequire(join(ROOT, '.tmp', 'osmd-bench', 'probe2.cjs'));
const { JSDOM } = benchRequire('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="c" style="width:1440px"></div></body></html>', { pretendToBeVisual: true });
function setGlobal(k, v) { try { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); } catch { /* already set */ } }
setGlobal('window', dom.window);
setGlobal('document', dom.window.document);
setGlobal('navigator', dom.window.navigator);
setGlobal('Node', dom.window.Node);
setGlobal('Element', dom.window.Element);
setGlobal('HTMLElement', dom.window.HTMLElement);
setGlobal('SVGElement', dom.window.SVGElement);
setGlobal('XMLSerializer', dom.window.XMLSerializer);
setGlobal('DOMParser', dom.window.DOMParser);
setGlobal('self', globalThis.window ?? dom.window);
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
const { OpenSheetMusicDisplay } = benchRequire('opensheetmusicdisplay');

// ---- verovio engines ----
const require = createRequire(import.meta.url);
const WASM = process.env.VEROVIO_WASM ?? 'C:/Users/manh9/AppData/Local/Temp/vrv-orig/package/dist/verovio-toolkit-wasm.js';
const verovio = require(WASM);
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('wasm-init-timeout')), 50000);
  verovio.module.onRuntimeInitialized = () => { clearTimeout(t); resolve(); };
});
const otk = new verovio.toolkit();
mute();
const wOptRet = otk.setOptions(OPT_OBJ); // WASM binding takes object, not JSON string
unmute();
if (!wOptRet) { console.error('wasm setOptions failed'); process.exit(2); }

const { Toolkit } = await import('../dist/toolkit.js');
const { EnableLog } = await import('../dist/toolkitdef.js');
EnableLog(0);
const ptk = new Toolkit(true);
mute();
const tOptRet = ptk.SetOptions(OPT_JSON);
unmute();
if (!tOptRet) { console.error('ts SetOptions failed'); process.exit(2); }

mute();
const osmd = new OpenSheetMusicDisplay(document.getElementById('c'), {
  backend: 'svg', autoResize: false,
  drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false,
  renderSingleHorizontalStaffline: true, // infinite single-line layout, matches verovio breaks:none
});
unmute();

function wasmRenderAll() { const n = otk.getPageCount(); let s = ''; for (let i = 1; i <= n; i++) s += otk.renderToSVG(i); return s; }
function tsRenderAll() { const n = ptk.GetPageCount(); let s = ''; for (let i = 1; i <= n; i++) s += ptk.RenderToSVG(i); return s; }

function gc() { try { global.gc?.(); } catch {} }

async function benchEngine(tk, data, target, maxReps) {
  mute();
  try {
    let t0 = performance.now();
    const ok = await tk.load(data);
    const tL = performance.now();
    if (!ok) return { error: 'load-false' };
    const out0 = await tk.render();
    const tR = performance.now();
    const pilotTotal = tR - t0;
    let reps = Math.min(Math.max(Math.ceil(target / Math.max(pilotTotal, 1e-9)), 1), maxReps);
    let loadMs = tL - t0, renderMs = tR - tL, outLen = out0;
    if (reps > 1) {
      t0 = performance.now();
      for (let i = 0; i < reps; i++) await tk.load(data);
      const t1 = performance.now();
      await tk.load(data);
      for (let i = 0; i < reps; i++) outLen = await tk.render();
      const t2 = performance.now();
      loadMs = (t1 - t0) / reps;
      renderMs = (t2 - t1) / reps;
    }
    return { load: loadMs, render: renderMs, total: loadMs + renderMs, reps, outLen };
  } catch (e) {
    return { error: String(e && e.message || e).slice(0, 160) };
  } finally { unmute(); }
}

const allFiles = readdirSync(join(ROOT, 'testcase', 'mxl')).filter((f) => !f.startsWith('.')).sort();
let files = allFiles.slice(OFFSET, OFFSET + LIMIT);
if (ONLY) files = files.filter((f) => f === ONLY || `mxl/${f}` === ONLY);

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
const prevMap = new Map(prev.map((r) => [r.file, r]));
const flush = () => writeFileSync(OUT, JSON.stringify([...prevMap.values()].sort((a, b) => a.file < b.file ? -1 : 1)));
prog(`files=${files.length} (offset=${OFFSET}) target=${TARGET}ms maxReps wt=${MAX_WT} osmd=${MAX_OSMD} layout=infinite-single-line`);

// warmup
{
  const w = readFileSync(join(ROOT, 'testcase', 'mxl', allFiles[Math.floor(allFiles.length / 2)]), 'utf8');
  await benchEngine({ load: (d) => otk.loadData(d), render: () => wasmRenderAll().length }, w, 50, 2);
  await benchEngine({ load: (d) => ptk.LoadData(d), render: () => tsRenderAll().length }, w, 50, 2);
  await benchEngine({ load: (d) => osmd.load(d).then(() => true), render: () => { osmd.render(); return document.getElementById('c').innerHTML.length; } }, w, 50, 2);
  gc();
}

const wtk = { load: (d) => otk.loadData(d), render: () => wasmRenderAll().length };
const ttk = { load: (d) => ptk.LoadData(d), render: () => tsRenderAll().length };
const otkE = {
  load: (d) => osmd.load(d).then(() => true),
  render: () => { osmd.render(); return document.getElementById('c').innerHTML.length; },
};

let done = 0;
const tStart = performance.now();
for (const f of files) {
  const rel = `mxl/${f}`;
  if (!REDO && prevMap.get(rel)?.status === 'OK') { done++; continue; }
  const data = readFileSync(join(ROOT, 'testcase', rel), 'utf8');
  const w = await benchEngine(wtk, data, TARGET, MAX_WT);
  gc();
  const t = await benchEngine(ttk, data, TARGET, MAX_WT);
  gc();
  const o = await benchEngine(otkE, data, TARGET, MAX_OSMD);
  gc();
  const row = { file: rel, bytes: data.length };
  if (w.error || t.error || o.error) {
    row.status = 'ERROR';
    if (w.error) row.wasmError = w.error;
    if (t.error) row.tsError = t.error;
    if (o.error) row.osmdError = o.error;
  } else {
    row.status = 'OK';
    row.wasm = w; row.ts = t; row.osmd = o;
    row.osmdVsWasm = o.total / Math.max(w.total, 1e-9);
    row.osmdVsTs = o.total / Math.max(t.total, 1e-9);
    row.tsVsWasm = t.total / Math.max(w.total, 1e-9);
  }
  prevMap.set(rel, row);
  flush();
  if (++done % 10 === 0 || done === files.length)
    prog(`  ${done}/${files.length} elapsed=${((performance.now() - tStart) / 1000).toFixed(0)}s last=${rel} ${row.status}`);
}

const rows = [...prevMap.values()];
const ok = rows.filter((r) => r.status === 'OK');
const gmean = (xs) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
const q = (k, p) => {
  const s = [...ok].sort((a, b) => a[k] - b[k]);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))][k];
};
const sum = (e) => ok.reduce((a, r) => a + r[e].total, 0);
console.log(JSON.stringify({
  layout: 'infinite-single-line', verovioOptions: OPT_JSON, osmdSingleLine: true,
  files: allFiles.length, measured: rows.length, ok: ok.length,
  errors: rows.filter((r) => r.status !== 'OK').map((r) => `${r.file} osmd:${r.osmdError ?? 'ok'} wasm:${r.wasmError ?? 'ok'} ts:${r.tsError ?? 'ok'}`),
  nonSinglePage: ok.filter((r) => r.wasm.pages !== undefined && (r.wasm.pages !== 1 || r.ts.pages !== 1)).map((r) => `${r.file} w=${r.wasm.pages} ts=${r.ts.pages}`),
  sumMs: { wasm: sum('wasm'), ts: sum('ts'), osmd: sum('osmd') },
  overall: { tsVsWasm: sum('ts') / sum('wasm'), osmdVsWasm: sum('osmd') / sum('wasm'), osmdVsTs: sum('osmd') / sum('ts') },
  geomean: { tsVsWasm: gmean(ok.map((r) => r.tsVsWasm)), osmdVsWasm: gmean(ok.map((r) => r.osmdVsWasm)), osmdVsTs: gmean(ok.map((r) => r.osmdVsTs)) },
  p50: { tsVsWasm: q('tsVsWasm', .5), osmdVsWasm: q('osmdVsWasm', .5), osmdVsTs: q('osmdVsTs', .5) },
  p90: { tsVsWasm: q('tsVsWasm', .9), osmdVsWasm: q('osmdVsWasm', .9), osmdVsTs: q('osmdVsTs', .9) },
  osmdSlowestVsWasm: [...ok].sort((a, b) => b.osmdVsWasm - a.osmdVsWasm).slice(0, 5)
    .map((r) => `${r.file} x${r.osmdVsWasm.toFixed(1)} (w=${r.wasm.total.toFixed(0)} ts=${r.ts.total.toFixed(0)} osmd=${r.osmd.total.toFixed(0)}ms)`),
  osmdFastestVsWasm: [...ok].sort((a, b) => a.osmdVsWasm - b.osmdVsWasm).slice(0, 3).map((r) => `${r.file} x${r.osmdVsWasm.toFixed(1)}`),
}, null, 1));
