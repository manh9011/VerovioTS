import { Point } from './devicecontextbase';
import { bundledReadText } from './data-bundle';
import { SMuFLGlyphAnchor } from './vrvdef';

export interface GlyphFileLoader { read(path: string): string; }
export interface GlyphLogger { info(message: string, ...args: unknown[]): void; error(message: string, ...args: unknown[]): void; }

declare const require: unknown;

function nodeFs(): { readFileSync(path: string, encoding: string): string } | null {
  try {
    if (typeof require === 'undefined') return null;
    const fs = (require as (id: string) => unknown)('fs') as { readFileSync(path: string, encoding: string): string } | null;
    return fs?.readFileSync ? fs : null;
  }
  catch (_) { return null; }
}

const defaultLoader: GlyphFileLoader = {
  read(path: string): string {
    // Bundled data/ first: per-glyph outlines resolve with no fs.
    const bundled = bundledReadText(path);
    if (bundled !== null) return bundled;
    const fs = nodeFs();
    if (!fs) return '';
    try { return fs.readFileSync(path, 'utf8'); } catch (_) { return ''; }
  }
};

/**
 * Browser seam (see Resources.setDefaultFileLoader): per-glyph outline XML
 * is loaded lazily through this module-level default. A browser host must
 * inject a synchronous loader (e.g. sync-XHR backed) or glyph outlines will
 * be missing from SVG output.
 */
let defaultLoaderOverride: GlyphFileLoader | null = null;
export function setDefaultGlyphFileLoader(loader: GlyphFileLoader | null): void {
  defaultLoaderOverride = loader;
}
function resolveDefaultLoader(): GlyphFileLoader {
  return defaultLoaderOverride ?? defaultLoader;
}

const defaultLogger: GlyphLogger = {
  info() {},
  error() {}
};

export class Glyph {
  private m_x = 0;
  private m_y = 0;
  private m_width = 0;
  private m_height = 0;
  private m_horizAdvX = 0;
  private m_unitsPerEm: number;
  private m_codeStr: string;
  private m_path: string;
  private m_xml = '';
  private readonly m_anchors = new Map<SMuFLGlyphAnchor, Point>();
  private m_isFallback = false;

  constructor(unitsPerEmOrPath?: number | string, codeStr?: string, loader: GlyphFileLoader = resolveDefaultLoader(), logger: GlyphLogger = defaultLogger) {
    this.m_unitsPerEm = 20480;
    this.m_codeStr = '[unset]';
    this.m_path = '[unset]';

    if (typeof unitsPerEmOrPath === 'number') {
      this.m_unitsPerEm = unitsPerEmOrPath * 10;
      return;
    }
    if (typeof unitsPerEmOrPath === 'string') {
      this.m_path = unitsPerEmOrPath;
      this.m_codeStr = codeStr ?? '[unset]';
      const xml = loader.read(unitsPerEmOrPath);
      if (!xml) {
        logger.error("Font file '%s' could not be loaded", unitsPerEmOrPath);
        return;
      }
      const viewBox = /\bviewBox\s*=\s*['"]([^'"]*)['"]/.exec(xml)?.[1];
      if (viewBox == null) {
        logger.info("Font file '%s' does not contain a viewBox attribute", unitsPerEmOrPath);
        return;
      }
      if ((viewBox.match(/ /g) ?? []).length < 3) {
        logger.info("Font file viewBox attribute '%s' is not valid", viewBox);
        return;
      }
      const tail = viewBox.slice(viewBox.lastIndexOf(' ') + 1);
      const parsed = Number.parseInt(tail, 10);
      this.m_unitsPerEm = (Number.isNaN(parsed) ? 0 : parsed) * 10;
    }
  }

  GetBoundingBox(): { x: number; y: number; w: number; h: number };
  GetBoundingBox(x: { value: number }, y: { value: number }, w: { value: number }, h: { value: number }): void;
  GetBoundingBox(x?: { value: number }, y?: { value: number }, w?: { value: number }, h?: { value: number }): { x: number; y: number; w: number; h: number } | void {
    const box = { x: this.m_x, y: this.m_y, w: this.m_width, h: this.m_height };
    if (x && y && w && h) { x.value = box.x; y.value = box.y; w.value = box.w; h.value = box.h; return; }
    return box;
  }

  SetBoundingBox(x: number, y: number, w: number, h: number): void {
    this.m_x = Math.trunc(10 * x); this.m_y = Math.trunc(10 * y);
    this.m_width = Math.trunc(10 * w); this.m_height = Math.trunc(10 * h);
  }

  GetUnitsPerEm(): number { return this.m_unitsPerEm; }
  SetUnitsPerEm(units: number): void { this.m_unitsPerEm = units; }
  GetCodeStr(): string { return this.m_codeStr; }
  SetCodeStr(codeStr: string): void { this.m_codeStr = codeStr; }
  GetPath(): string { return this.m_path; }
  SetPath(path: string): void { this.m_path = path; }
  GetHorizAdvX(): number { return this.m_horizAdvX; }
  SetHorizAdvX(horizAdvX: number): void { this.m_horizAdvX = Math.trunc(horizAdvX * 10); }
  GetFallback(): boolean { return this.m_isFallback; }
  SetFallback(isFallback: boolean): void { this.m_isFallback = isFallback; }

  SetAnchor(anchorStr: string, x: number, y: number): void {
    const map: Record<string, SMuFLGlyphAnchor> = {
      stemDownNW: SMuFLGlyphAnchor.SMUFL_stemDownNW,
      stemUpSE: SMuFLGlyphAnchor.SMUFL_stemUpSE,
      cutOutNE: SMuFLGlyphAnchor.SMUFL_cutOutNE,
      cutOutNW: SMuFLGlyphAnchor.SMUFL_cutOutNW,
      cutOutSE: SMuFLGlyphAnchor.SMUFL_cutOutSE,
      cutOutSW: SMuFLGlyphAnchor.SMUFL_cutOutSW
    };
    const anchorId = map[anchorStr];
    if (anchorId === undefined) return;
    this.m_anchors.set(anchorId, new Point(x * this.GetUnitsPerEm() / 4, y * this.GetUnitsPerEm() / 4));
  }

  HasAnchor(anchor: SMuFLGlyphAnchor): boolean { return this.m_anchors.has(anchor); }
  GetAnchor(anchor: SMuFLGlyphAnchor): Point {
    const point = this.m_anchors.get(anchor);
    if (!point) throw new RangeError(`Missing glyph anchor: ${anchor}`);
    return point;
  }
  SetXML(xml: string): void { this.m_xml = xml; }
  GetXML(loader: GlyphFileLoader = resolveDefaultLoader()): string { return this.m_xml !== '' ? this.m_xml : loader.read(this.m_path); }
}
