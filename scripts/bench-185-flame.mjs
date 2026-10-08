import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const FILE = join(ROOT, 'testcase', 'mxl', '185.musicxml');
const OPT_JSON = JSON.stringify({ breaks: 'none', adjustPageHeight: true });

const { Toolkit } = await import('../dist/toolkit.js');
const { EnableLog } = await import('../dist/toolkitdef.js');
EnableLog(0);

const data = readFileSync(FILE, 'utf8');
const tk = new Toolkit(true);
if (!tk.SetOptions(OPT_JSON)) { console.error('SetOptions failed'); process.exit(2); }

let t0 = performance.now();
const ok = tk.LoadData(data);
const tLoad = performance.now() - t0;
if (!ok) { console.error('LoadData false'); process.exit(2); }

const pages = tk.GetPageCount();

function norm(svg) {
  return svg
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

t0 = performance.now();
let svgLen = 0;
const hash = createHash('sha256');
for (let i = 1; i <= pages; i++) {
  const svg = tk.RenderToSVG(i);
  svgLen += svg.length;
  hash.update(norm(svg));
}
const tRender = performance.now() - t0;
const digest = hash.digest('hex');

mkdirSync(join(ROOT, '.tmp', 'prof'), { recursive: true });
const out = { file: 'mxl/185.musicxml', bytes: data.length, pages, loadMs: tLoad, renderMs: tRender, totalMs: tLoad + tRender, svgLen, sha256: digest, options: OPT_JSON };
writeFileSync(join(ROOT, '.tmp', 'prof', '185-result.json'), JSON.stringify(out, null, 1));
process.stderr.write(JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
