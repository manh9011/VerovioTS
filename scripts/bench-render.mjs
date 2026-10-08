// Bench: load + render-to-SVG, INFINITE single-line layout for fairness.
// verovio (WASM + TS port): setOptions breaks:none + adjustPageHeight -> 1 page, render all pages.
// Usage: node scripts/bench-render.mjs --dir mei|mxl|hum [--target 300] [--max-reps 30] [--out .tmp/bench/mei.json]
// Pilot 1 iter decides reps: reps = ceil(targetMs / pilotTotal), capped; reps=1 reuses pilot.
// One toolkit instance per engine reused across files. Logs muted during timing.
// Progress -> stderr, final summary -> stdout. Flushes JSON after each file.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const DIR = opt('--dir', null);
const TARGET = Number(opt('--target', '300'));
const MAXREPS = Number(opt('--max-reps', '30'));
const OUT = opt('--out', join(ROOT, '.tmp', 'bench', `${DIR ?? 'all'}.json`));
if (!DIR) { console.error('need --dir mei|mxl|hum'); process.exit(2); }
mkdirSync(dirname(OUT), { recursive: true });

const require = createRequire(import.meta.url);
const WASM = process.env.VEROVIO_WASM ?? 'C:/Users/manh9/AppData/Local/Temp/vrv-orig/package/dist/verovio-toolkit-wasm.js';
const WASM_HUM_URL = pathToFileURL('C:/Users/manh9/AppData/Local/Temp/vrv-orig/package/dist/verovio-module-hum.mjs').href;

// Shared infinite-layout options: single system line, page height fits content.
const OPT_JSON = JSON.stringify({ breaks: 'none', adjustPageHeight: true });
const OPT_OBJ = { breaks: 'none', adjustPageHeight: true };

// ---- mute (verovio warnings spam console; I/O cost would pollute timing) ----
const origConsole = { ...console };
function mute() {
  for (const k of ['log', 'warn', 'error', 'info', 'debug']) console[k] = () => {};
}
function unmute() { Object.assign(console, origConsole); }
const prog = (s) => process.stderr.write(s + '\n');

// ---- engines ----
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

let humTK = null; // lazy, only if .krn files present
async function getHumTK() {
  if (!humTK) {
    const Module = await (await import(WASM_HUM_URL)).default();
    const ctor = Module.cwrap('vrvToolkit_constructor', 'number', []);
    const load = Module.cwrap('vrvToolkit_loadData', 'number', ['number', 'string']);
    const render = Module.cwrap('vrvToolkit_renderToSVG', 'string', ['number', 'number', 'number']);
    const pages = Module.cwrap('vrvToolkit_getPageCount', 'number', ['number']);
    const setOpt = Module.cwrap('vrvToolkit_setOptions', 'number', ['number', 'string']);
    const ptr = ctor();
    if (!setOpt(ptr, OPT_JSON)) throw new Error('hum setOptions failed');
    humTK = {
      load: (d) => !!load(ptr, d),
      renderAll: () => { let s = ''; const n = pages(ptr); for (let i = 1; i <= n; i++) s += render(ptr, i, 0); return s; },
      getPageCount: () => { try { return pages(ptr); } catch { return null; } },
    };
  }
  return humTK;
}

const { Toolkit } = await import('../dist/toolkit.js');
const { EnableLog } = await import('../dist/toolkitdef.js');
EnableLog(0);
const ptk = new Toolkit(true);
mute();
const tOptRet = ptk.SetOptions(OPT_JSON);
unmute();
if (!tOptRet) { console.error('ts SetOptions failed'); process.exit(2); }

function wasmRenderAll() { const n = otk.getPageCount(); let s = ''; for (let i = 1; i <= n; i++) s += otk.renderToSVG(i); return s; }
function tsRenderAll() { const n = ptk.GetPageCount(); let s = ''; for (let i = 1; i <= n; i++) s += ptk.RenderToSVG(i); return s; }

function gc() { try { global.gc?.(); } catch {} }

// ---- measure one engine on one payload ----
function benchEngine(tk, data, target, maxReps) {
  mute();
  try {
    // Steady-state: one warmup pass so V8 compiles/monomorphizes before the
    // pilot decides reps. Without this, slow files get reps=1 cold for TS
    // while WASM (AOT) is unaffected, inflating small-file ratios ~2x.
    tk.load(data);
    tk.renderAll();
    let t0 = performance.now();
    const ok = tk.load(data);
    const tL = performance.now();
    if (!ok) return { error: 'load-false' };
    const svg0 = tk.renderAll();
    const tR = performance.now();
    const pilotLoad = tL - t0, pilotRender = tR - tL, pilotTotal = tR - t0;
    let reps = Math.ceil(target / Math.max(pilotTotal, 1e-9));
    reps = Math.min(Math.max(reps, 1), maxReps);
    let loadMs = pilotLoad, renderMs = pilotRender, svg = svg0;
    if (reps > 1) {
      t0 = performance.now();
      for (let i = 0; i < reps; i++) tk.load(data);
      const t1 = performance.now();
      tk.load(data);
      for (let i = 0; i < reps; i++) svg = tk.renderAll();
      const t2 = performance.now();
      loadMs = (t1 - t0) / reps;
      renderMs = (t2 - t1) / reps; // includes one extra load before render loop; negligible
    }
    let pages = null;
    try { pages = tk.getPageCount?.() ?? null; } catch {}
    return { load: loadMs, render: renderMs, total: loadMs + renderMs, reps, svgLen: svg.length, pages };
  } finally { unmute(); }
}

const files = readdirSync(join(ROOT, 'testcase', DIR)).filter((f) => !f.startsWith('.')).sort();
prog(`dir=${DIR} files=${files.length} target=${TARGET}ms maxReps=${MAXREPS} layout=infinite-single-line options=${OPT_JSON}`);

// warmup (JIT/GC steady state before measuring)
{
  const w = readFileSync(join(ROOT, 'testcase', DIR, files[Math.floor(files.length / 2)]), 'utf8');
  benchEngine({ load: (d) => otk.loadData(d), renderAll: () => wasmRenderAll(), getPageCount: () => otk.getPageCount() }, w, 50, 3);
  benchEngine({ load: (d) => ptk.LoadData(d), renderAll: () => tsRenderAll(), getPageCount: () => ptk.GetPageCount() }, w, 50, 3);
  gc();
}

const rows = [];
let done = 0;
const tStart = performance.now();
for (const f of files) {
  const rel = `${DIR}/${f}`;
  const data = readFileSync(join(ROOT, 'testcase', rel), 'utf8');
  const isKrn = f.endsWith('.krn');
  const htk = isKrn ? await getHumTK() : null;
  const wtk = isKrn
    ? { load: (d) => htk.load(d), renderAll: () => htk.renderAll(), getPageCount: () => htk.getPageCount() }
    : { load: (d) => otk.loadData(d), renderAll: () => wasmRenderAll(), getPageCount: () => { try { return otk.getPageCount(); } catch { return null; } } };
  const ttk = { load: (d) => ptk.LoadData(d), renderAll: () => tsRenderAll(), getPageCount: () => { try { return ptk.GetPageCount(); } catch { return null; } } };
  const w = benchEngine(wtk, data, TARGET, MAXREPS);
  gc();
  const t = benchEngine(ttk, data, TARGET, MAXREPS);
  gc();
  const row = { file: rel, bytes: data.length };
  if (w.error || t.error) row.status = 'ERROR';
  else {
    row.status = 'OK';
    row.wasm = w; row.ts = t;
    row.ratioTotal = t.total / Math.max(w.total, 1e-9);
    row.ratioLoad = t.load / Math.max(w.load, 1e-9);
    row.ratioRender = t.render / Math.max(w.render, 1e-9);
  }
  if (w.error) row.wasmError = w.error;
  if (t.error) row.tsError = t.error;
  rows.push(row);
  writeFileSync(OUT, JSON.stringify(rows));
  if (++done % 25 === 0 || done === files.length)
    prog(`  ${done}/${files.length} elapsed=${((performance.now() - tStart) / 1000).toFixed(0)}s`);
}

const ok = rows.filter((r) => r.status === 'OK');
const gmean = (xs) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
const sorted = [...ok].sort((a, b) => a.ratioTotal - b.ratioTotal);
const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].ratioTotal;
const sum = (k, e) => ok.reduce((a, r) => a + r[e][k], 0);
console.log(JSON.stringify({
  dir: DIR, files: files.length, ok: ok.length, layout: 'infinite-single-line', options: OPT_JSON,
  errors: rows.filter((r) => r.status !== 'OK').map((r) => r.file),
  nonSinglePage: ok.filter((r) => r.wasm.pages !== 1 || r.ts.pages !== 1).map((r) => `${r.file} w=${r.wasm.pages} ts=${r.ts.pages}`),
  pageMismatch: ok.filter((r) => r.wasm.pages !== r.ts.pages).map((r) => r.file),
  wasmTotalMs: sum('total', 'wasm'), tsTotalMs: sum('total', 'ts'),
  wasmLoadMs: sum('load', 'wasm'), tsLoadMs: sum('load', 'ts'),
  wasmRenderMs: sum('render', 'wasm'), tsRenderMs: sum('render', 'ts'),
  overallRatio: sum('total', 'ts') / Math.max(sum('total', 'wasm'), 1e-9),
  loadRatio: sum('load', 'ts') / Math.max(sum('load', 'wasm'), 1e-9),
  renderRatio: sum('render', 'ts') / Math.max(sum('render', 'wasm'), 1e-9),
  geomean: gmean(ok.map((r) => r.ratioTotal)),
  p50: q(0.5), p90: q(0.9), p99: q(0.99),
  slowest: [...ok].sort((a, b) => b.ratioTotal - a.ratioTotal).slice(0, 5)
    .map((r) => `${r.file} x${r.ratioTotal.toFixed(1)} (w=${r.wasm.total.toFixed(1)}ms ts=${r.ts.total.toFixed(1)}ms)`),
  fastest: sorted.slice(0, 3).map((r) => `${r.file} x${r.ratioTotal.toFixed(1)}`),
}, null, 1));
