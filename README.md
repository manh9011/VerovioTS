# verovio-ts

Pure TypeScript port of [Verovio](https://github.com/rism-digital/verovio) music engraving

## Install

```sh
npm install verovio-ts
```

Requires Node >= 18. No runtime dependencies.

## Usage

```js
const { Toolkit } = require('verovio-ts');
const fs = require('fs');

const tk = new Toolkit(false);
tk.LoadData(fs.readFileSync('score.musicxml', 'utf8'));

fs.writeFileSync('out.svg', tk.RenderToSVG(1));
fs.writeFileSync('out.mei', tk.GetMEI());
fs.writeFileSync('out.mid', Buffer.from(tk.RenderToMIDI(), 'binary'));
```

## Formats

Inputs (via `SetInputFrom` or auto-detect): MEI, MusicXML (direct or via Humdrum with `musicxml-hum`), Humdrum, ABC, GABC, PAE, CMME, DARMS, Volpiano, ESAC, MuseData.

Outputs: MEI (`GetMEI`), Humdrum (`GetHumdrum`), SVG (`RenderToSVG`), MIDI (`RenderToMIDI`), PAE (`RenderToPAE`), timemap (`RenderToTimemap`).

## API

- `new Toolkit(loaded = true)` - main entry point, mirrors verovio `Toolkit`
- `Toolkit.LoadData(data)` / `LoadFile` / `LoadZipData` - load score
- `Toolkit.SetInputFrom(fmt)` / `SetOutputTo(fmt)` / `IdentifyInputFrom(data)`
- `Toolkit.RenderToSVG(page)` / `GetMEI` / `GetHumdrum` / `RenderToMIDI` / `RenderToPAE` / `RenderToTimemap`
- `FileFormat`, `LogLevel`, `GetVersion` - enums and helpers

## Browser (no Node, no fetch)

`data/` (fonts, glyph outlines, text fonts, `footer.svg`, tuning table) is
embedded at build time, so the browser bundle renders with zero I/O:

```sh
npm run embed-data    # regenerate src/generated/verovio-data.ts after data/ changes
npm run build:bundle # -> dist/browser/verovio-ts.mjs (single ESM file)
```

```html
<script type="module">
import { Toolkit } from './dist/browser/verovio-ts.mjs';
const tk = new Toolkit(true); // fonts resolve from embedded data
tk.LoadData(meiString);
document.getElementById('out').innerHTML = tk.RenderToSVG(1);
</script>
```

Try `demo/index.html` served over HTTP (module scripts need http(s)).
Node still works as before: `new Toolkit(true)` reads from the same
embedded data first and falls back to `data/` on disk for overrides.

## Verification (SVG parity vs original verovio WASM)

```sh
node scripts/compare-all.mjs            # every testcase/mei|mxl|hum, 60s timeout each
node scripts/compare-all.mjs --dir mei  # subset; --offset/--limit for batches
node scripts/verify-browser.mjs         # bundle renders with no fs/require
```

Current status: **541/541 IDENT** (74 MEI + 235 MusicXML + 232 Humdrum),
compared byte-for-byte after normalizing random xml:ids, vs verovio 6.3.0 WASM.

## Build

```sh
npm run build   # tsc -> dist/ (js + .d.ts + sourcemaps)
```

## License

LGPL-3.0 (see `LICENSE`); upstream Verovio by RISM Digital Center.
