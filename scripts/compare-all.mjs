// Driver: runs compare-one.mjs per testcase, one process each, 60s timeout.
// Usage: node scripts/compare-all.mjs [--dir mei|mxl|hum] [--limit N] [--only file]
// Writes .tmp/svgdiff/report.json + DIFF svg pairs. Never hangs: each child
// is killed after 60s and recorded as TIMEOUT.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const dirOpt = opt('--dir');
const DIRS = dirOpt ? [dirOpt] : ['mei', 'mxl', 'hum'];
const LIMIT = opt('--limit') ? Number(opt('--limit')) : Infinity;
const OFFSET = opt('--offset') ? Number(opt('--offset')) : 0;
const ONLY = opt('--only');
const SKIP_DONE = args.includes('--skip-done'); // skip files already IDENT in report.json

const outDir = join(ROOT, '.tmp', 'svgdiff');
mkdirSync(outDir, { recursive: true });

const prev = existsSync(join(outDir, 'report.json'))
  ? JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'))
  : [];
const prevMap = new Map(prev.map((r) => [r.file, r]));

const targets = [];
for (const dir of DIRS) {
  const files = readdirSync(join(ROOT, 'testcase', dir)).filter((f) => !f.startsWith('.')).sort();
  for (const f of files) {
    if (ONLY && `${dir}/${f}` !== ONLY && f !== ONLY) continue;
    targets.push(`${dir}/${f}`);
  }
}
const list = targets.slice(OFFSET, OFFSET + LIMIT).filter((t) => !(SKIP_DONE && prevMap.get(t)?.status === 'IDENT'));
console.log(`cases: ${list.length}`);

function flush() {
  writeFileSync(join(outDir, 'report.json'), JSON.stringify([...prevMap.values()], null, 1));
}

for (const t of list) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'compare-one.mjs'), t], {
    timeout: 60000, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  let row;
  const out = (r.stdout ?? '').split('\n').filter((l) => l.startsWith('RESULT:')).pop();
  if (out) {
    try { row = JSON.parse(out.slice(7)); } catch { row = { file: t, status: 'ERROR', detail: 'bad-result-json' }; }
  } else if (r.error?.code === 'ETIMEDOUT' || r.signalCode) {
    row = { file: t, status: 'TIMEOUT', detail: `killed after 60s (${r.signalCode ?? r.error?.code})` };
  } else {
    row = { file: t, status: 'ERROR', detail: `no-result exit=${r.status} err=${(r.stderr ?? '').slice(-200)}` };
  }
  if (row.status === 'DIFF' && row.origSvg) {
    writeFileSync(join(outDir, `${t.replace('/', '-')}.orig.svg`), row.origSvg);
    writeFileSync(join(outDir, `${t.replace('/', '-')}.port.svg`), row.portSvg);
    delete row.origSvg; delete row.portSvg;
  }
  prevMap.set(t, row);
  flush();
  console.log(`${row.status}\t${t}\t${row.detail ?? ''}`);
}

const batchCount = (s) => list.filter((t) => prevMap.get(t)?.status === s).length;
console.log(`\nBATCH ${list.length}: IDENT=${batchCount('IDENT')} CLOSE=${batchCount('CLOSE')} DIFF=${batchCount('DIFF')} ERROR=${batchCount('ERROR')} TIMEOUT=${batchCount('TIMEOUT')}`);
const rows = [...prevMap.values()];
const count = (s) => rows.filter((r) => r.status === s).length;
console.log(`TOTAL ${rows.length}: IDENT=${count('IDENT')} CLOSE=${count('CLOSE')} DIFF=${count('DIFF')} ERROR=${count('ERROR')} TIMEOUT=${count('TIMEOUT')}`);
flush();
