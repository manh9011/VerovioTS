/** Pure TypeScript translation of verovio::Resources. */
import { Glyph } from './glyph';
import { xml_document, xml_node } from './pugixml';
import * as smufl from './smufl';
import { bundledReadText } from './data-bundle';
import { VRV_RESOURCE_DIR, UNICODE_DAL_SEGNO, UNICODE_DA_CAPO, UNICODE_SEGNO, UNICODE_CODA } from './vrvdef';

export enum data_FONTWEIGHT {
  FONTWEIGHT_NONE = 0,
  FONTWEIGHT_bold = 1,
  FONTWEIGHT_normal = 2,
  FONTWEIGHT_MAX = 3,
}

export enum data_FONTSTYLE {
  FONTSTYLE_NONE = 0,
  FONTSTYLE_italic = 1,
  FONTSTYLE_normal = 2,
  FONTSTYLE_oblique = 3,
  FONTSTYLE_MAX = 4,
}

export interface ResourcesFileLoader {
  readText(path: string): string | null;
}

export interface ResourcesZipReader {
  HasFile(name: string): boolean;
  ReadTextFile(name: string): string;
  GetFileList(): string[];
}

export interface ResourcesLogger {
  error(message: string, ...args: unknown[]): void;
  warning(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export interface ResourcesDependencies {
  fileLoader?: ResourcesFileLoader;
  logger?: ResourcesLogger;
}

const NOOP_LOGGER: ResourcesLogger = {
  error() {}, warning() {}, info() {}, debug() {},
};

declare const require: unknown;

function nodeFs(): { readFileSync(path: string, encoding: string): string } | null {
  try {
    if (typeof require === 'undefined') return null;
    const fs = (require as (id: string) => unknown)('fs') as { readFileSync(path: string, encoding: string): string } | null;
    return fs?.readFileSync ? fs : null;
  }
  catch (_) { return null; }
}

const NODE_FILE_LOADER: ResourcesFileLoader = {
  readText(path: string): string | null {
    // Bundled data/ first: works in browsers with no fs, and wins on Node too
    // so render output is path-independent.
    const bundled = bundledReadText(path);
    if (bundled !== null) return bundled;
    const fs = nodeFs();
    if (!fs) return null;
    try { return fs.readFileSync(path, 'utf8'); } catch (_) { return null; }
  },
};

type GlyphTable = Map<number, Glyph>;
type StyleKey = `${number}:${number}`;

type StyleAttributes = readonly [data_FONTWEIGHT, data_FONTSTYLE];

class LoadedFont {
  public readonly glyphTable: GlyphTable = new Map<number, Glyph>();
  private css = '';

  public constructor(public readonly name: string, public readonly isFallback: boolean) {}

  public setCSSFont(css: string): void { this.css = css; }

  public getCSSFont(path: string, loader: ResourcesFileLoader): string {
    if (this.css !== '') return this.css;
    return loader.readText(`${path}/${this.name}.css`) ?? '';
  }
}

export class Resources {
  private static defaultPath = VRV_RESOURCE_DIR;

  /**
   * Browser seam: the port loads fonts through a *synchronous* file loader.
   * Node uses fs; browsers have no sync fs, so a host app running in a
   * browser must inject a loader (e.g. backed by synchronous XMLHttpRequest
   * against a served data directory) via setDefaultFileLoader() before
   * creating any Toolkit, otherwise InitFonts() fails and LoadData() refuses
   * to load ("font resources are not available").
   */
  private static fileLoaderOverride: ResourcesFileLoader | null = null;
  public static setDefaultFileLoader(loader: ResourcesFileLoader | null): void {
    Resources.fileLoaderOverride = loader;
  }

  private m_useLiberation = false;
  private m_path = Resources.defaultPath;
  private m_defaultFontName = '';
  private m_fallbackFontName = '';
  private readonly m_loadedFonts = new Map<string, LoadedFont>();
  private m_currentFontName = '';
  private readonly m_textFont = new Map<StyleKey, GlyphTable>();
  private m_currentStyle: StyleAttributes = [data_FONTWEIGHT.FONTWEIGHT_normal, data_FONTSTYLE.FONTSTYLE_normal];
  private readonly m_glyphNameTable = new Map<string, number>();
  private m_cachedGlyph: [number, Glyph] | null = null;
  private readonly loader: ResourcesFileLoader;
  private readonly logger: ResourcesLogger;

  public constructor(dependencies: ResourcesDependencies = {}) {
    this.loader = dependencies.fileLoader ?? Resources.fileLoaderOverride ?? NODE_FILE_LOADER;
    this.logger = dependencies.logger ?? NOOP_LOGGER;
  }

  public static GetDefaultPath(): string { return Resources.defaultPath; }
  public static SetDefaultPath(path: string): void { Resources.defaultPath = path; }

  public GetPath(): string { return this.m_path; }
  public SetPath(path: string): void { this.m_path = path; }
  public Ok(): boolean { return this.m_loadedFonts.size > 1; }

  public UseLiberationTextFont(useLiberation?: boolean): boolean {
    if (useLiberation !== undefined) this.m_useLiberation = useLiberation;
    return this.m_useLiberation;
  }

  public GetTextFont(): string { return this.m_useLiberation ? 'Liberation' : 'Times'; }
  public GetFallbackFont(): string { return this.m_fallbackFontName; }
  public GetCurrentFont(): string { return this.m_currentFontName; }
  public IsFontLoaded(fontName: string): boolean { return this.m_loadedFonts.has(fontName); }
  public GetResourceText(key: string): string | null {
    const bundled = bundledReadText(`${this.m_path}/${key}`) ?? bundledReadText(key);
    if (bundled !== null) return bundled;
    const fs = nodeFs();
    if (!fs) return null;
    // direct file read from resource directory
    const path = `${this.m_path}/${key}`;
    try { return fs.readFileSync(path, 'utf8'); } catch (_) { return null; }
  }

  public InitFonts(): boolean {
    this.m_cachedGlyph = null;
    this.m_loadedFonts.clear();
    this.m_glyphNameTable.clear();

    if (!this.LoadFont('Bravura')) this.logger.error('Bravura font could not be loaded.');
    if (!this.LoadFont('Leipzig')) this.logger.error('Leipzig font could not be loaded.');

    this.m_defaultFontName = 'Leipzig';
    this.m_currentFontName = this.m_defaultFontName;
    this.m_fallbackFontName = this.m_defaultFontName;

    const textFonts: Array<readonly [StyleAttributes, string, boolean]> = [
      [[data_FONTWEIGHT.FONTWEIGHT_normal, data_FONTSTYLE.FONTSTYLE_normal], 'Times', true],
      [[data_FONTWEIGHT.FONTWEIGHT_bold, data_FONTSTYLE.FONTSTYLE_normal], 'Times-bold', false],
      [[data_FONTWEIGHT.FONTWEIGHT_bold, data_FONTSTYLE.FONTSTYLE_italic], 'Times-bold-italic', false],
      [[data_FONTWEIGHT.FONTWEIGHT_normal, data_FONTSTYLE.FONTSTYLE_italic], 'Times-italic', false],
    ];
    for (const [style, fileName, mandatory] of textFonts) {
      if (!this.InitTextFont(fileName, style) && mandatory) {
        this.logger.error('Text font could not be initialized.');
        return false;
      }
    }
    this.m_currentStyle = [data_FONTWEIGHT.FONTWEIGHT_normal, data_FONTSTYLE.FONTSTYLE_normal];
    return true;
  }

  public SetFont(fontName: string): boolean {
    this.m_cachedGlyph = null;
    if (fontName !== '' && !this.IsFontLoaded(fontName) && !this.LoadFont(fontName)) {
      this.logger.error('%s font could not be loaded.', fontName);
      return false;
    }
    this.m_defaultFontName = this.IsFontLoaded(fontName) ? fontName : 'Leipzig';
    this.m_currentFontName = this.m_defaultFontName;
    return true;
  }

  public AddCustom(extraFonts: readonly string[], zipFactory?: (filename: string) => ResourcesZipReader | null): boolean {
    let success = true;
    for (const fontFile of extraFonts) {
      const zipFile = zipFactory ? zipFactory(fontFile) : null;
      if (!zipFile) continue;
      const fontName = this.GetCustomFontname(fontFile, zipFile);
      if (fontName === '' || this.IsFontLoaded(fontName)) continue;
      success = this.LoadFont(fontName, zipFile) && success;
      if (!success) this.logger.error('Option supplied font %s could not be loaded.', fontName);
    }
    return success;
  }

  /** Loads every .xml font in the configured resource directory through the injected file loader. */
  public LoadAll(fontFiles: readonly string[] = []): boolean {
    let success = true;
    for (const file of fontFiles) {
      if (!file.toLowerCase().endsWith('.xml')) continue;
      const stem = file.slice(0, -4).split(/[\\/]/).pop() ?? '';
      if (stem && !this.IsFontLoaded(stem)) success = this.LoadFont(stem) && success;
    }
    return success;
  }

  public SetFallbackFont(fontName: string): void { this.m_cachedGlyph = null; this.m_fallbackFontName = fontName; }

  public SetCurrentFont(fontName: string, allowLoading = false): boolean {
    this.m_cachedGlyph = null;
    if (this.IsFontLoaded(fontName)) { this.m_currentFontName = fontName; return true; }
    if (allowLoading && this.LoadFont(fontName)) { this.m_currentFontName = fontName; return true; }
    return false;
  }

  public GetGlyph(smuflName: string): Glyph | null;
  public GetGlyph(smuflCode: number): Glyph | null;
  public GetGlyph(value: number | string): Glyph | null {
    if (typeof value === 'string') {
      const code = this.GetGlyphCode(value);
      return code ? this.GetGlyph(code) : null;
    }
    if (this.m_cachedGlyph?.[0] === value) return this.m_cachedGlyph[1];
    const current = this.m_loadedFonts.get(this.m_currentFontName)?.glyphTable;
    if (!current) return null;
    const glyph = current.get(value);
    if (glyph) { this.m_cachedGlyph = [value, glyph]; return glyph; }
    if (!this.IsCurrentFontFallback()) {
      const fallback = this.m_loadedFonts.get(this.m_fallbackFontName)?.glyphTable;
      const fallbackGlyph = fallback?.get(value);
      if (fallbackGlyph) { this.m_cachedGlyph = [value, fallbackGlyph]; return fallbackGlyph; }
    }
    return null;
  }
  public GetGlyphCode(smuflName: string): number { return this.m_glyphNameTable.get(smuflName) ?? 0; }

  public IsSmuflFallbackNeeded(text: string): boolean {
    const current = this.m_loadedFonts.get(this.m_currentFontName);
    if (!current) return false;
    if (current.isFallback) return false;
    for (const c of text) {
      if (!current.glyphTable.has(c.codePointAt(0)!)) return true;
    }
    return false;
  }

  public IsCurrentFontFallback(): boolean { return this.m_currentFontName === this.m_fallbackFontName; }

  public SelectTextFont(fontWeight: data_FONTWEIGHT, fontStyle: data_FONTSTYLE): void {
    if (fontWeight === data_FONTWEIGHT.FONTWEIGHT_NONE) fontWeight = data_FONTWEIGHT.FONTWEIGHT_normal;
    if (fontStyle === data_FONTSTYLE.FONTSTYLE_NONE) fontStyle = data_FONTSTYLE.FONTSTYLE_normal;
    const key = this.styleKey([fontWeight, fontStyle]);
    this.m_currentStyle = [fontWeight, fontStyle];
    if (!this.m_textFont.has(key)) {
      this.logger.warning('Text font for style (%d, %d) is not loaded. Use default', fontWeight, fontStyle);
      this.m_currentStyle = [data_FONTWEIGHT.FONTWEIGHT_normal, data_FONTSTYLE.FONTSTYLE_normal];
    }
  }

  public GetTextGlyph(code: number): Glyph | null {
    const key = this.m_textFont.has(this.styleKey(this.m_currentStyle)) ? this.styleKey(this.m_currentStyle) : this.styleKey([data_FONTWEIGHT.FONTWEIGHT_normal, data_FONTSTYLE.FONTSTYLE_normal]);
    return this.m_textFont.get(key)?.get(code) ?? null;
  }

  public FontHasGlyphAvailable(fontName: string, smuflCode: number): boolean {
    return this.m_loadedFonts.get(fontName)?.glyphTable.has(smuflCode) ?? false;
  }

  public GetCSSFontFor(fontName: string): string {
    if (fontName === this.GetTextFont()) return this.loader.readText(`${this.m_path}/${this.GetTextFont()}.css`) ?? '';
    const font = this.m_loadedFonts.get(fontName);
    return font ? font.getCSSFont(this.m_path, this.loader) : '';
  }

  public GetCustomFontname(filename: string, _zipFile: ResourcesZipReader): string {
    const normalized = filename.replace(/\\/g, '/');
    const base = normalized.slice(normalized.lastIndexOf('/') + 1);
    const stem = base.includes('.') ? base.slice(0, base.lastIndexOf('.')) : base;
    return stem;
  }

  public static GetSmuflGlyphForUnicodeChar(unicodeChar: number | string): number {
    const code = typeof unicodeChar === 'string' ? (unicodeChar.codePointAt(0) ?? 0) : unicodeChar;
    switch (code) {
      case UNICODE_DAL_SEGNO.codePointAt(0): return smufl.SMUFL_E045_dalSegno;
      case UNICODE_DA_CAPO.codePointAt(0): return smufl.SMUFL_E046_daCapo;
      case UNICODE_SEGNO.codePointAt(0): return smufl.SMUFL_E047_segno;
      case UNICODE_CODA.codePointAt(0): return smufl.SMUFL_E048_coda;
      default: return code;
    }
  }

  private LoadFont(fontName: string, zipFile: ResourcesZipReader | null = null): boolean {
    const xmlText = zipFile ? (zipFile.HasFile(`${fontName}.xml`) ? zipFile.ReadTextFile(`${fontName}.xml`) : null) : this.loader.readText(`${this.m_path}/${fontName}.xml`);
    if (xmlText == null) {
      this.logger.error(zipFile ? 'Failed to load the XML file containing glyph bounding boxes' : 'Failed to load font and glyph bounding boxes');
      return false;
    }
    const doc = new xml_document();
    const parsed = doc.load_string(xmlText);
    if (!parsed) {
      this.logger.error(zipFile ? 'Failed to parse the XML file containing glyph bounding boxes' : 'Failed to load font and glyph bounding boxes');
      return false;
    }
    const root = doc.first_child();
    const unitsPerEmAttr = root.attribute('units-per-em');
    if (unitsPerEmAttr.empty()) { this.logger.error('No units-per-em attribute in bounding box file'); return false; }

    const buildNameTable = fontName === 'Bravura';
    const isFallback = fontName === 'Bravura' || fontName === 'Leipzig';
    const font = new LoadedFont(fontName, isFallback);
    if (zipFile) font.setCSSFont(zipFile.ReadTextFile(`${fontName}.css`));
    const unitsPerEm = unitsPerEmAttr.as_int();

    for (let current = root.child('g'); !current.empty(); current = current.next_sibling('g')) {
      const c = current.attribute('c');
      const n = current.attribute('n');
      if (c.empty() || n.empty()) continue;
      // C++ resources.cpp:377 passes unitsPerEm * 10 to SetUnitsPerEm (no extra
      // multiply). Glyph(int) ctor already multiplies by 10 internally, so pass
      // the raw value here; passing unitsPerEm * 10 double-multiplies (0.072 scale vs 0.72).
      const glyph = new Glyph(unitsPerEm);
      glyph.SetCodeStr(c.value());
      const x = current.attribute('x').empty() ? 0 : current.attribute('x').as_float();
      const y = current.attribute('y').empty() ? 0 : current.attribute('y').as_float();
      const width = current.attribute('w').empty() ? 0 : current.attribute('w').as_float();
      const height = current.attribute('h').empty() ? 0 : current.attribute('h').as_float();
      glyph.SetBoundingBox(x, y, width, height);
      if (zipFile) glyph.SetXML(zipFile.ReadTextFile(`${fontName}/${c.value()}.xml`));
      else glyph.SetPath(`${this.m_path}/${fontName}/${c.value()}.xml`);
      if (!current.attribute('h-a-x').empty()) glyph.SetHorizAdvX(current.attribute('h-a-x').as_float());
      for (let anchor = current.child('a'); !anchor.empty(); anchor = anchor.next_sibling('a')) {
        const name = anchor.attribute('n');
        if (!name.empty()) glyph.SetAnchor(name.value(), anchor.attribute('x').as_float(), anchor.attribute('y').as_float());
      }
      const code = Number.parseInt(c.value(), 16);
      if (!Number.isFinite(code)) continue;
      font.glyphTable.set(code, glyph);
      if (buildNameTable) this.m_glyphNameTable.set(n.value(), code);
    }
    if (isFallback && font.glyphTable.size < smufl.SMUFL_COUNT) {
      this.logger.error('Expected %d default SMuFL glyphs but could load only %d.', smufl.SMUFL_COUNT, font.glyphTable.size);
      return false;
    }
    this.m_loadedFonts.set(fontName, font);
    return true;
  }

  private InitTextFont(fontName: string, style: StyleAttributes): boolean {
    const xmlText = this.loader.readText(`${this.m_path}/text/${fontName}.xml`);
    if (xmlText == null) { this.logger.info("Cannot load bounding boxes for text font '%s'", `${this.m_path}/text/${fontName}.xml`); return false; }
    const doc = new xml_document();
    const parsed = doc.load_string(xmlText);
    if (!parsed) { this.logger.info("Cannot load bounding boxes for text font '%s'", `${this.m_path}/text/${fontName}.xml`); return false; }
    const root = doc.first_child();
    const unitsPerEmAttr = root.attribute('units-per-em');
    if (unitsPerEmAttr.empty()) { this.logger.warning('No units-per-em attribute in bounding box file'); return false; }
    const key = this.styleKey(style);
    if (!this.m_textFont.has(key)) this.m_textFont.set(key, new Map<number, Glyph>());
    const currentTable = this.m_textFont.get(key)!;
    for (let current = root.child('g'); !current.empty(); current = current.next_sibling('g')) {
      const c = current.attribute('c');
      if (c.empty()) continue;
      const code = Number.parseInt(c.value(), 16);
      if (!Number.isFinite(code)) continue;
      const glyph = new Glyph(unitsPerEmAttr.as_int());
      const x = current.attribute('x').empty() ? 0 : current.attribute('x').as_float();
      const y = current.attribute('y').empty() ? 0 : current.attribute('y').as_float();
      const width = current.attribute('w').empty() ? 0 : current.attribute('w').as_float();
      const height = current.attribute('h').empty() ? 0 : current.attribute('h').as_float();
      glyph.SetBoundingBox(x, y, width, height);
      if (!current.attribute('h-a-x').empty()) glyph.SetHorizAdvX(current.attribute('h-a-x').as_float());
      currentTable.set(code, glyph);
    }
    return true;
  }

  private styleKey(style: StyleAttributes): StyleKey { return `${style[0]}:${style[1]}`; }
}

export function SetDefaultResourcePath(path: string): void {
  Resources.SetDefaultPath(path);
}
