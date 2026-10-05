// Verifies dist/browser/verovio-ts.mjs renders with NO fs/require/process.
// Reads inputs first, then runs the bundle inside a vm sandbox without Node globals.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync('dist/browser/verovio-ts.mjs', 'utf8');
const mei = readFileSync('testcase/mei/001.mei', 'utf8');
// vm classic scripts can't parse `export`; strip the trailing export list —
// all names are top-level consts in the bundle scope.
const runnable = code.replace(/export\s*\{[^}]*\};?\s*(\/\/# sourceMappingURL.*)?\s*$/, '');

const sandbox = { console, TextEncoder, TextDecoder, URL, Blob };
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);

vm.runInContext(runnable + ';globalThis.__T = { Toolkit, hasBundledData, bundledKeys };', sandbox, { timeout: 120000 });
const T = sandbox.__T;
console.log('hasBundledData:', T.hasBundledData(), 'keys:', T.bundledKeys().length);
const tk = new T.Toolkit(true);
const ok = tk.LoadData(mei);
console.log('load (no fs/require in sandbox):', ok);
const svg = tk.RenderToSVG(1);
console.log('svg len:', svg.length, 'has <svg:', svg.includes('<svg'));
if (!ok || !svg.includes('<svg')) process.exit(1);
console.log('BROWSER-SANDBOX-OK');
