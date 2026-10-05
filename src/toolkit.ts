/**
 * Pure TypeScript translation of verovio::Toolkit (src-cpp/src/toolkit.cpp, part 1).
 *
 * Covers the header contract plus lightweight accessors in C++ source order:
 * constructor state, GetID, GetResourcePath, SetResourcePath, SetFont, SetScale,
 * Select, SetOutputTo, SetInputFrom, IdentifyInputFrom, GetOptions variants,
 * GetOptionsObj, ResetOptions, GetLog, GetVersion, ResetXmlIdSeed, ResetLogBuffer.
 *
 * Later passes add LoadData/LoadFile/ZIP handling, rendering, MIDI/timemap/
 * expansion export, editing, humdrum buffers, locale and clock orchestration.
 */
import { Doc } from './doc.js';
import { View } from './view.js';
import { DocSelection } from './docselection.js';
import {
  Options,
  Option,
  OptionArray,
  OptionBool,
  OptionBreaks,
  OptionDbl,
  OptionDurationEq,
  OptionFooter,
  OptionHeader,
  OptionInt,
  OptionIntMap,
  OptionJson,
  OptionMensuralResp,
  OptionSmuflTextFont,
  OptionString,
  OptionsCategory,
  JsonSource,
} from './options.js';
import { FileFormat, LogLevel } from './toolkitdef.js';
import { HumdrumFileSet } from './humlib-core.js';
import { Tool_filter } from './hum-tools.js';
import { createMinizZipFile } from './miniz.js';
import { GetVersion as GetVrvVersion, ExtractIDFragment, FromCamelCase, Base64Encode, LogError, LogInfo, LogWarning, SetLogSink, logBuffer } from './vrv.js';
import { ClassId, FORWARD, LayoutInformation, MensuralCastOffType, UNLIMITED_DEPTH, VRV_UNSET } from './vrvdef.js';
import type { ArrayOfStrAttr } from './vrvdef.js';
import { ClassIdsComparison, MeasureOnsetOffsetComparison, NoteOrRestOnsetOffsetComparison } from './comparison.js';
import { FindElementInLayerStaffDefFunctor } from './findfunctor.js';
import { Timemap } from './timemap.js';
import { crcFast, crcInit } from './crc.js';
import { Input } from './iobase.js';
import { ABCInput } from './ioabc.js';
import { GABCInput } from './iogabc.js';
import { PAEInput, PAEOutput } from './iopae.js';
import { DarmsInput } from './iodarms.js';
import { VolpianoInput } from './iovolpiano.js';
import { CmmeInput } from './iocmme.js';
import { EditorToolkitCMN } from './editortoolkit_cmn.js';
import { EditorToolkitNeume } from './editortoolkit_neume.js';
import { UTF16to8, Base64Decode, IsNeumeType } from './vrv.js';
import { MEIInput, MEIOutput } from './iomei.js';
import { MusicXmlInput } from './iomusxml.js';
import { Tool_musicxml2hum } from './musicxml2hum.js';
import { Tool_mei2hum } from './mei2hum.js';
import { Tool_esac2hum } from './esac2hum.js';
import { Tool_musedata2hum } from './musedata2hum.js';
import { HumdrumInput } from './iohumdrum.js';
import { Page } from './page.js';
import { System } from './system.js';
import { VrvObject } from './object.js';
import { JsonxxObject } from './jsonxx.js';
import { RuntimeClock } from './runtimeclock.js';
import { ZipFileReader } from './filereader.js';
import type { FileBytesLoader, ZipFileLike } from './zip.js';
import { xml_document, xml_node } from './pugixml.js';
import type { EditorToolkit } from './editortoolkit.js';
import { SvgDeviceContext, SMUFLTEXTFONT } from './svgdevicecontext.js';
import { MidiFile } from './midifile.js';

/** C++ file-magic constants from src-cpp/src/toolkit.cpp:57-59. */
const UTF16_BE_BOM0 = 0xfe;
const UTF16_BE_BOM1 = 0xff;
const UTF16_LE_BOM0 = 0xff;
const UTF16_LE_BOM1 = 0xfe;
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];
const CONTAINER_XML = 'META-INF/container.xml';

/** Injectable file/zip seams (C++ ifstream + miniz_cpp boundaries). */
export type ToolkitFileWriter = (filename: string, data: string | Uint8Array) => boolean;

export interface ToolkitFileDeps {
  fileLoader?: FileBytesLoader | null;
  createZipFile?: ((bytes: Uint8Array) => ZipFileLike) | null;
  fileWriter?: ToolkitFileWriter | null;
}

declare const require: unknown;

function nodeFs(): any | null {
  try {
    if (typeof require === 'undefined') return null;
    const fs = (require as (id: string) => unknown)('fs') as any;
    return fs?.readFileSync ? fs : null;
  }
  catch (_) { return null; }
}

function defaultFileLoader(): FileBytesLoader | null {
  // ponytail: Node-only fallback mirroring src/glyph.ts; browsers must inject
  // a loader via SetFileDeps. Upgrade path: platform file-system adapter.
  const fs = nodeFs();
  if (!fs?.readFileSync) return null;
  return {
    readFileBytes(filename: string): Uint8Array | null {
      try {
        const buf = fs.readFileSync(filename);
        return buf instanceof Uint8Array ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : null;
      }
      catch (_) { return null; }
    },
  };
}

function defaultFileWriter(): ToolkitFileWriter | null {
  // ponytail: Node-only fallback mirroring defaultFileLoader; browsers must
  // inject a writer via SetFileDeps. Upgrade path: platform file-system adapter.
  const fs = nodeFs();
  if (!fs?.writeFileSync) return null;
  return (filename: string, data: string | Uint8Array): boolean => {
    try {
      if (typeof data === 'string') fs.writeFileSync(filename, data, 'utf8');
      else fs.writeFileSync(filename, data);
      return true;
    }
    catch (_) { return false; }
  };
}

/** Minimal resource surface consumed by the part-1 accessors. */
export interface ToolkitResourcesLike {
  Ok?: () => boolean;
  GetPath?: () => string;
  SetPath?: (path: string) => void;
  InitFonts?: () => boolean;
  AddCustom?: (extraFonts: readonly string[]) => boolean;
  SetCurrentFont?: (fontName: string, allowLoading?: boolean) => boolean;
  SetFallbackFont?: (fontName: string) => void;
  LoadAll?: () => boolean;
  UseLiberationTextFont?: (useLiberation: boolean) => boolean;
}

/** C++ option_SMUFLTEXTFONT order (embedded=0, linked=1, none=2) differs from
 * the TS SMUFLTEXTFONT order (none=0, embedded=1, linked=2); map explicitly. */
function mapSmuflTextFont(value: number): SMUFLTEXTFONT {
  switch (value) {
    case OptionSmuflTextFont.linked: return SMUFLTEXTFONT.linked;
    case OptionSmuflTextFont.none: return SMUFLTEXTFONT.none;
    default: return SMUFLTEXTFONT.embedded;
  }
}

function resourcesOf(doc: Doc): ToolkitResourcesLike {
  return doc.GetResourcesForModification() as unknown as ToolkitResourcesLike;
}

export class Toolkit {
  protected m_doc: Doc;
  protected m_docSelection: DocSelection;
  protected m_view: View;

  private m_midiDoc: Doc | null = null;
  private m_options: Options;
  private m_previousLocale: unknown = null;

  /** C++ `char *m_cString` buffer; TS keeps the decoded string. */
  private m_cString: string | null = null;
  private m_cerrCaptured = '';
  private m_cerrOriginalBuf: unknown = null;
  private m_editorToolkit: EditorToolkit | null = null;
  private m_runtimeClock: RuntimeClock | null = null;

  private static m_humdrumBuffer: string | null = null;

  private m_fileDeps: ToolkitFileDeps = {};

  public SetFileDeps(deps: ToolkitFileDeps): void {
    this.m_fileDeps = deps;
  }

  private resolveFileLoader(): FileBytesLoader | null {
    return this.m_fileDeps.fileLoader ?? defaultFileLoader();
  }

  private resolveFileWriter(): ToolkitFileWriter | null {
    return this.m_fileDeps.fileWriter ?? defaultFileWriter();
  }

  private writeFile(filename: string, data: string | Uint8Array): boolean {
    const writer = this.resolveFileWriter();
    if (!writer) return false;
    try {
      return writer(filename, data);
    }
    catch (_) {
      return false;
    }
  }

  public constructor(initFont = true) {
    this.m_doc = new Doc();
    this.m_doc.SetConversionFactories(() => new Page(), () => new System());
    this.m_docSelection = new DocSelection();
    this.m_view = new View();

    if (initFont) {
      const res = this.m_doc.GetResourcesForModification();
      res.InitFonts();
      if (!res.Ok()) {
        const candidates = ['src-cpp/data', '../src-cpp/data', 'data', '../data'];
        for (const c of candidates) {
          res.SetPath(c);
          if (res.InitFonts()) break;
        }
      }
    }

    this.m_options = this.m_doc.GetOptions();
  }

  /** C++ inline `GetID() { return m_doc.GetID(); }`. */
  public GetID(): string {
    return this.m_doc.GetID();
  }

  public GetResourcePath(): string {
    return resourcesOf(this.m_doc).GetPath?.() ?? '';
  }

  public SetResourcePath(path: string): boolean {
    const resources = resourcesOf(this.m_doc);
    resources.SetPath?.(path);
    let success = resources.InitFonts?.() ?? true;
    if (this.m_options.m_fontAddCustom.isSet()) {
      // ponytail: C++ loads custom fonts from zip files here; the TS Resources
      // boundary needs an injected zip factory, so extra fonts are skipped until
      // the LoadZip seam lands. Upgrade path: thread the zip reader through.
      success = success && (resources.AddCustom?.(this.m_options.m_fontAddCustom.getValue()) ?? true);
    }
    if (this.m_options.m_font.isSet()) {
      success = success && this.SetFont(this.m_options.m_font.getValue());
    }
    if (this.m_options.m_fontFallback.isSet()) {
      resources.SetFallbackFont?.(this.m_options.m_fontFallback.getStrValue());
    }
    if (this.m_options.m_fontLoadAll.isSet()) {
      // ponytail: C++ scans the resource directory; TS LoadAll needs an explicit
      // file list, so this is a no-op until the file-loader seam lands.
      success = success && (resources.LoadAll?.() ?? true);
    }
    if (this.m_options.m_fontTextLiberation.isSet()) {
      resources.UseLiberationTextFont?.(this.m_options.m_fontTextLiberation.getValue());
    }
    return success;
  }

  public SetFont(fontName: string): boolean {
    const ok = resourcesOf(this.m_doc).SetCurrentFont?.(fontName, true) ?? false;
    if (!ok) LogWarning("Font '%s' could not be loaded", fontName);
    return ok;
  }

  public SetScale(scale: number): boolean {
    return this.m_options.m_scale.setValue(scale);
  }

  public Select(selection: string): boolean {
    return this.m_docSelection.Parse(selection);
  }

  public SetOutputTo(outputTo: string): boolean {
    return this.m_options.setOutputTo(outputTo);
  }

  public SetInputFrom(inputFrom: string): boolean {
    return this.m_options.setInputFrom(inputFrom);
  }

  public IdentifyInputFrom(data: string): FileFormat {
    // ponytail: MUSICXML_DEFAULT_HUMDRUM build flag not modeled; MUSICXML default
    // kept. Upgrade path: expose the flag through the toolkit runtime options.
    const musicxmlDefault = FileFormat.MUSICXML;

    if (data.length === 0) return FileFormat.UNKNOWN;
    if (data.charCodeAt(0) === 0) return FileFormat.UNKNOWN;
    const excerpt = data.substring(0, 2000);
    if (excerpt.includes('Group memberships:')) {
      // MuseData may contain '@' as first character, so needs
      // to be checked before PAE identification.
      return FileFormat.MUSEDATAHUM;
    }
    if (data[0] === '@' || data[0] === '{') return FileFormat.PAE;
    if (data[0] === '*' || data[0] === '!') return FileFormat.HUMDRUM;
    if (data[0] === 'X') return FileFormat.ABC;
    if (data[0] === '%' && data.length > 1) return data[1] === 'a' ? FileFormat.ABC : FileFormat.PAE;
    if (data.charCodeAt(0) === 0xff || data.charCodeAt(0) === 0xfe) {
      // Handle UTF-16 content here later.
      LogWarning('Warning: Cannot yet auto-detect format of UTF-16 data files.');
      return FileFormat.UNKNOWN;
    }
    const searchLimit = 600;
    const initial = data.substring(0, searchLimit);
    if (data[0] === '<') {
      if (/<(verovio-serialization)[\s>]/.test(initial)) return FileFormat.SERIALIZATION;
      if (/<(mei|music|pages)[\s>]/.test(initial)) return FileFormat.MEI;
      if (/<(!DOCTYPE )?(score-partwise|opus|score-timewise)[\s>]/.test(initial)) return musicxmlDefault;
      if (/<(Piece xmlns="http:\/\/www\.cmme\.org")[\s>]/.test(initial)) return FileFormat.CMME;
      LogWarning('Warning: Trying to load unknown XML data which cannot be identified.');
      return FileFormat.UNKNOWN;
    }
    if (initial.includes('\n!!')) return FileFormat.HUMDRUM;
    if (initial.includes('\n**')) return FileFormat.HUMDRUM;
    if (initial.includes('\nCUT[')) return FileFormat.ESAC;
    // GABC header block (`name:value;` attributes) terminated by `%%` on its own
    // line; the separator cannot legally appear inside MEI, ABC or PAE.
    if (initial.includes('\n%%') || initial.substring(0, 3) === '%%\n') return FileFormat.GABC;

    // Assume MEI when nothing else matched (DARMS cannot be auto-detected).
    return FileFormat.MEI;
  }

  public GetOptions(): string {
    return this.GetOptionsWithDefault(false);
  }

  public GetDefaultOptions(): string {
    return this.GetOptionsWithDefault(true);
  }

  public GetOptionsWithDefault(defaultValues: boolean): string {
    const o: Record<string, unknown> = {};
    // C++ iterates std::map (sorted by key); TS Map keeps insertion order,
    // so sort keys to preserve the observable JSON key order.
    const params = this.m_options.getItems();
    for (const key of [...params.keys()].sort()) {
      const opt = params.get(key) as Option;
      if (opt instanceof OptionDbl) {
        const dblValue = defaultValues ? opt.getDefault() : opt.getUnfactoredValue();
        o[key] = Math.round(dblValue * 100) / 100;
      } else if (opt instanceof OptionInt) {
        o[key] = defaultValues ? opt.getDefault() : opt.getUnfactoredValue();
      } else if (opt instanceof OptionBool) {
        o[key] = defaultValues ? opt.getDefault() : opt.getValue();
      } else if (opt instanceof OptionArray) {
        o[key] = defaultValues ? opt.getDefault() : opt.getValue();
      } else if (opt instanceof OptionJson) {
        // Reading json from file is not supported in toolkit
        if (opt.getSource() === JsonSource.String) o[key] = opt.getValue(defaultValues);
      } else {
        o[key] = defaultValues ? opt.getDefaultStrValue() : opt.getStrValue();
      }
    }

    // Other base options
    o['scale'] = defaultValues ? this.m_options.m_scale.getDefault() : this.m_options.m_scale.getUnfactoredValue();
    o['xmlIdSeed'] = defaultValues
      ? this.m_options.m_xmlIdSeed.getDefault()
      : this.m_options.m_xmlIdSeed.getUnfactoredValue();

    return JSON.stringify(o);
  }

  public GetOptionsObj(): Options {
    return this.m_options;
  }

  public ResetOptions(): void {
    for (const opt of this.m_options.getItems().values()) opt.reset();
    // Set the (default) font
    this.SetFont(this.m_options.m_font.getValue());
  }

  public GetLog(): string {
    let str = '';
    for (const logStr of logBuffer) str += logStr;
    this.ResetLogBuffer();
    return str;
  }

  public GetVersion(): string {
    return GetVrvVersion();
  }

  public ResetXmlIdSeed(seed: number): void {
    this.m_options.m_xmlIdSeed.setValue(seed);
    VrvObject.SeedID(this.m_options.m_xmlIdSeed.getValue());
  }

  public ResetLogBuffer(): void {
    logBuffer.splice(0, logBuffer.length);
  }

  public GetInputFrom(): FileFormat {
    return this.m_options.getInputFrom();
  }

  public GetOutputTo(): FileFormat {
    return this.m_options.getOutputTo();
  }

  public ResetMidiDoc(): void {
    this.m_midiDoc = null;
  }

  public SetMidiDoc(): void {
    // C++ Toolkit::SetMidiDoc (src-cpp/src/toolkit.cpp:275).
    if (this.m_midiDoc) return;
    const expansion = this.m_doc.m_expansionMap;
    const hasMap = expansion?.HasExpansionMap?.() ?? false;
    const isProcessed = expansion?.IsProcessed?.() ?? false;
    if (hasMap || this.m_options.m_expandNever.getValue() || isProcessed) {
      this.m_midiDoc = this.m_doc;
      return;
    }
    // ponytail: C++ also copies resources path + InitFonts and custom tunings;
    // resources init happens at LoadData, tunings rarely affect tick output.
    // Upgrade path: mirror resources path/fonts + CustomTuning copy if a
    // MIDI DIFF traces to fonts/tuning.
    const midiDoc = new Doc();
    midiDoc.SetOptions(this.m_doc.GetOptions());
    (midiDoc.GetOptions() as any).m_expandAlways.setValue(true);
    midiDoc.SetConversionFactories(() => new Page(), () => new System());
    const midiRes = midiDoc.GetResourcesForModification() as any;
    const mainRes = this.m_doc.GetResourcesForModification() as any;
    if (mainRes?.GetPath && midiRes?.SetPath) midiRes.SetPath(mainRes.GetPath());
    midiRes?.InitFonts?.();
    const midiInput = new MEIInput(midiDoc as never);
    let importOk = false;
    try {
      importOk = midiInput.Import(this.GetMEI());
    }
    catch (e) {
      LogWarning(`SetMidiDoc: MIDI expansion import threw ${String(e).slice(0, 160)}; using main doc.`);
      this.m_midiDoc = this.m_doc;
      return;
    }
    if (!importOk) {
      LogWarning('SetMidiDoc: MIDI expansion import failed; using main doc.');
      this.m_midiDoc = this.m_doc;
      return;
    }
    midiDoc.PrepareData();
    this.m_midiDoc = midiDoc;
  }

  public LoadFile(filename: string): boolean {
    // C++ Toolkit::LoadFile (src-cpp/src/toolkit.cpp:299).
    this.ResetMidiDoc();
    this.ResetLogBuffer();
    if (this.IsUTF16(filename)) return this.LoadUTF16File(filename);
    if (this.IsZip(filename)) return this.LoadZipFile(filename);
    const bytes = this.resolveFileLoader()?.readFileBytes(filename);
    if (!bytes) return false;
    return this.LoadData(new TextDecoder().decode(bytes), false);
  }

  public IsUTF16(filename: string): boolean {
    // C++ Toolkit::IsUTF16: BOM check on the first two bytes.
    const bytes = this.resolveFileLoader()?.readFileBytes(filename);
    if (!bytes || bytes.length < 2) return false;
    return (bytes[0] === UTF16_LE_BOM0 && bytes[1] === UTF16_LE_BOM1)
      || (bytes[0] === UTF16_BE_BOM0 && bytes[1] === UTF16_BE_BOM1);
  }

  public LoadUTF16File(filename: string): boolean {
    // C++ Toolkit::LoadUTF16File: BOM skip + UTF16to8, then LoadData.
    LogInfo('The file seems to be UTF-16 - trying to convert to UTF-8');
    const bytes = this.resolveFileLoader()?.readFileBytes(filename);
    if (!bytes) return false;
    const littleEndian = bytes.length >= 2 && bytes[0] === UTF16_LE_BOM0 && bytes[1] === UTF16_LE_BOM1;
    const units: number[] = [];
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      units.push(littleEndian ? (bytes[i] | (bytes[i + 1] << 8)) : ((bytes[i] << 8) | bytes[i + 1]));
    }
    if (units[0] === 0xfeff) units.shift();
    let utf8line: string;
    try {
      utf8line = UTF16to8(units);
    }
    catch (_) {
      return false;
    }
    return this.LoadData(utf8line, false);
  }

  public IsZip(filename: string): boolean {
    // C++ Toolkit::IsZip: PK\x03\x04 magic on the first four bytes.
    const bytes = this.resolveFileLoader()?.readFileBytes(filename);
    if (!bytes || bytes.length < 4) return false;
    return ZIP_SIGNATURE.every((b, i) => bytes[i] === b);
  }

  public LoadZipFile(filename: string): boolean {
    // C++ Toolkit::LoadZipFile: read raw bytes, delegate to LoadZipData.
    const bytes = this.resolveFileLoader()?.readFileBytes(filename);
    if (!bytes) return false;
    return this.LoadZipData(bytes);
  }

  public LoadZipData(bytes: Uint8Array): boolean {
    // C++ Toolkit::LoadZipData (MXL container.xml -> rootfile -> LoadData).
    this.ResetMidiDoc();
    this.ResetLogBuffer();
    // C++ bundles miniz-cpp; TS ships the minimal equivalent in miniz.ts.
    // An injected createZipFile still wins when provided.
    const create = this.m_fileDeps.createZipFile ?? createMinizZipFile;
    const reader = new ZipFileReader({
      createZipFile: create,
      fileLoader: this.resolveFileLoader() ?? { readFileBytes: () => null },
      logError: (message: string, ...args: unknown[]) => LogError(message, ...args),
    });
    if (!reader.LoadBytes(bytes)) return false;
    if (!reader.HasFile(CONTAINER_XML)) {
      LogError("No '%s' file to load found in the archive", CONTAINER_XML);
      return false;
    }
    const containerXml = reader.ReadTextFile(CONTAINER_XML);
    const doc = new xml_document();
    doc.load_string(containerXml);
    // C++ root.select_node("/container/rootfiles/rootfile") parity via manual
    // traversal (TS pugixml has no select_node).
    let container: xml_node | null = null;
    for (const child of doc.children()) {
      if ((child as xml_node).name() === 'container') {
        container = child as xml_node;
        break;
      }
    }
    const rootfile = container?.child('rootfiles')?.child('rootfile');
    const innerName = rootfile && !rootfile.empty() ? rootfile.attribute('full-path').value() : '';
    if (!innerName) {
      LogError('No file to load found in the archive');
      return false;
    }
    LogInfo("Loading file '%s' in the archive", innerName);
    return this.LoadData(reader.ReadTextFile(innerName), false);
  }

  public LoadZipDataBase64(data: string): boolean {
    let bytes: Uint8Array;
    try {
      bytes = Base64Decode(data);
    }
    catch (_) {
      return false;
    }
    return this.LoadZipData(bytes);
  }

  public LoadZipDataBuffer(data: Uint8Array, length: number): boolean {
    return this.LoadZipData(data.slice(0, length));
  }

  public SetViewAndEditor(): void {
    this.m_view.SetDoc(this.m_doc as never);
    this.m_editorToolkit = null;
    // ponytail: EditorToolkitMensural is still C++-only; mensural docs fall
    // back to the CMN kit until that migration lands. Upgrade path: construct
    // EditorToolkitMensural for NOTATIONTYPE_mensural* here.
    if (IsNeumeType(this.m_doc.m_notationType)) {
      this.m_editorToolkit = new EditorToolkitNeume(this.m_doc, this.m_view as never);
    }
    else {
      this.m_editorToolkit = new EditorToolkitCMN(this.m_doc, this.m_view);
    }
  }

  public SetHumdrumBuffer(data: string): void {
    Toolkit.m_humdrumBuffer = data;
  }

  public GetHumdrumBuffer(): string {
    return Toolkit.m_humdrumBuffer ?? '[empty]';
  }

  public ClearHumdrumBuffer(): void {
    Toolkit.m_humdrumBuffer = null;
  }

  public SetCString(data: string): void {
    this.m_cString = data;
  }

  public GetCString(): string {
    return this.m_cString ?? '[unspecified]';
  }

  public LoadData(data: string, resetLogBuffer = true): boolean {
    const resources = this.m_doc.GetResources();
    if (typeof (resources as any).Ok === 'function' && !(resources as any).Ok()) {
      const resMod = this.m_doc.GetResourcesForModification();
      resMod.InitFonts?.();
      if (typeof resMod.Ok === 'function' && !resMod.Ok()) {
        const candidates = ['src-cpp/data', '../src-cpp/data', 'data', '../data'];
        for (const c of candidates) {
          resMod.SetPath?.(c);
          if (resMod.InitFonts?.()) break;
        }
      }
    }
    if (typeof (resources as any).Ok === 'function' && !(resources as any).Ok()) {
      LogError('The data cannot be loaded because the font resources are not available');
      return false;
    }

    this.ResetMidiDoc();
    if (resetLogBuffer) this.ResetLogBuffer();
    this.m_doc.m_expansionMap.Reset();

    if (this.m_options.m_xmlIdChecksum.getValue()) {
      crcInit();
      const bytes = new TextEncoder().encode(data);
      VrvObject.SeedID(crcFast(bytes, bytes.length));
    }

    this.ClearHumdrumBuffer();

    let inputFrom = this.m_options.getInputFrom();
    if (inputFrom === FileFormat.AUTO) inputFrom = this.IdentifyInputFrom(data);

    let input: Input | null = null;
    let newData = '';
    if (inputFrom === FileFormat.ABC) input = new ABCInput(this.m_doc as never);
    else if (inputFrom === FileFormat.GABC) input = new GABCInput(this.m_doc as never);
    else if (inputFrom === FileFormat.PAE) input = new PAEInput(this.m_doc);
    else if (inputFrom === FileFormat.DARMS) input = new DarmsInput(this.m_doc as never);
    else if (inputFrom === FileFormat.VOLPIANO) input = new VolpianoInput(this.m_doc as never);
    else if (inputFrom === FileFormat.CMME) {
      if (this.m_options.m_durationEquivalence.getValue() !== OptionDurationEq.minima) {
        LogWarning("CMME input uses 'minima' duration equivalence, changing the option accordingly.");
        this.m_options.m_durationEquivalence.setValue(OptionDurationEq.minima);
      }
      input = new CmmeInput(this.m_doc as never);
    }
    else if (inputFrom === FileFormat.MEI) {
      input = new MEIInput(this.m_doc as never);
    }
    else if (inputFrom === FileFormat.SERIALIZATION) {
      const meiInput = new MEIInput(this.m_doc as never);
      meiInput.SetDeserializing(true);
      input = meiInput;
    }
    else if (inputFrom === FileFormat.MUSICXML) {
      input = new MusicXmlInput(this.m_doc as never);
    }
    else if (inputFrom === FileFormat.HUMDRUM) {
      input = new HumdrumInput(this.m_doc as never);
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        (input as HumdrumInput).SetOutputFormat('humdrum');
      }
      if (!input.Import(data)) {
        LogError('Error importing Humdrum data (1)');
        return false;
      }
      this.SetHumdrumBuffer((input as HumdrumInput).GetHumdrumString());
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        return true;
      }
      (input as HumdrumInput).parseEmbeddedOptions(this.m_doc as never);
    }
    else if (inputFrom === FileFormat.HUMMEI) {
      const tempdoc = new Doc();
      tempdoc.SetOptions(this.m_doc.GetOptions());
      tempdoc.SetConversionFactories(() => new Page(), () => new System());
      const tempinput = new HumdrumInput(tempdoc as never);
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        tempinput.SetOutputFormat('humdrum');
      }
      if (!tempinput.Import(data)) {
        LogError('Error importing Humdrum data (1)');
        return false;
      }
      this.SetHumdrumBuffer(tempinput.GetHumdrumString());
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        return true;
      }
      const meioutput = new MEIOutput(tempdoc);
      meioutput.SetScoreBasedMEI(true);
      newData = meioutput.Export();
      tempinput.parseEmbeddedOptions(this.m_doc as never);
      input = new MEIInput(this.m_doc as never);
    }
    else if (inputFrom === FileFormat.MUSICXMLHUM) {
      const converter = new Tool_musicxml2hum();
      let status = false;
      let buffer = '';
      try {
        const result = converter.convertDocStr(data);
        buffer = result.output;
        status = result.status && buffer.length > 0;
      }
      catch (e) {
        status = false;
      }
      if (!status) {
        LogError('Error converting MusicXML data');
        return false;
      }
      this.SetHumdrumBuffer(buffer);
      const tempdoc = new Doc();
      tempdoc.SetOptions(this.m_doc.GetOptions());
      tempdoc.SetConversionFactories(() => new Page(), () => new System());
      const tempinput = new HumdrumInput(tempdoc as never);
      if (!tempinput.Import(buffer)) {
        LogError('Error importing Humdrum data (2)');
        return false;
      }
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        return true;
      }
      const meioutput = new MEIOutput(tempdoc);
      meioutput.SetScoreBasedMEI(true);
      newData = meioutput.Export();
      tempinput.parseEmbeddedOptions(this.m_doc as never);
      input = new MEIInput(this.m_doc as never);
    }
    else if (inputFrom === FileFormat.MEIHUM) {
      const converter = new Tool_mei2hum();
      let status = false;
      let buffer = '';
      try {
        const result = converter.convertDocStr(data);
        buffer = result.output;
        status = result.status && buffer.length > 0;
      }
      catch (e) {
        status = false;
      }
      if (!status) {
        LogError('Error converting MEI data');
        return false;
      }
      this.SetHumdrumBuffer(buffer);
      const tempdoc = new Doc();
      tempdoc.SetOptions(this.m_doc.GetOptions());
      tempdoc.SetConversionFactories(() => new Page(), () => new System());
      const tempinput = new HumdrumInput(tempdoc as never);
      if (!tempinput.Import(buffer)) {
        LogError('Error importing Humdrum data (2)');
        return false;
      }
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        return true;
      }
      const meioutput = new MEIOutput(tempdoc);
      meioutput.SetScoreBasedMEI(true);
      newData = meioutput.Export();
      tempinput.parseEmbeddedOptions(this.m_doc as never);
      input = new MEIInput(this.m_doc as never);
    }
    else if (inputFrom === FileFormat.ESAC) {
      const converter = new Tool_esac2hum();
      let status = false;
      let buffer = '';
      try {
        const result = converter.convert(data);
        buffer = result.output;
        status = result.status && buffer.length > 0;
      }
      catch (e) {
        status = false;
      }
      if (!status) {
        LogError('Error converting EsAC data');
        return false;
      }
      this.SetHumdrumBuffer(buffer);
      const tempdoc = new Doc();
      tempdoc.SetOptions(this.m_doc.GetOptions());
      tempdoc.SetConversionFactories(() => new Page(), () => new System());
      const tempinput = new HumdrumInput(tempdoc as never);
      if (!tempinput.Import(buffer)) {
        LogError('Error importing Humdrum data (5)');
        return false;
      }
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        return true;
      }
      const meioutput = new MEIOutput(tempdoc);
      meioutput.SetScoreBasedMEI(true);
      newData = meioutput.Export();
      tempinput.parseEmbeddedOptions(this.m_doc as never);
      input = new MEIInput(this.m_doc as never);
    }
    else if (
      inputFrom === FileFormat.MUSEDATAHUM
    ) {
      const converter = new Tool_musedata2hum();
      let status = false;
      let buffer = '';
      try {
        const result = converter.convert(data);
        buffer = result.output;
        status = result.status && buffer.length > 0;
      }
      catch (e) {
        status = false;
      }
      if (!status) {
        LogError('Error converting MuseData data');
        return false;
      }
      this.SetHumdrumBuffer(buffer);
      const tempdoc = new Doc();
      tempdoc.SetOptions(this.m_doc.GetOptions());
      tempdoc.SetConversionFactories(() => new Page(), () => new System());
      const tempinput = new HumdrumInput(tempdoc as never);
      if (!tempinput.Import(buffer)) {
        LogError('Error importing Humdrum data (4)');
        return false;
      }
      if (this.GetOutputTo() === FileFormat.HUMDRUM) {
        return true;
      }
      const meioutput = new MEIOutput(tempdoc);
      meioutput.SetScoreBasedMEI(true);
      newData = meioutput.Export();
      tempinput.parseEmbeddedOptions(this.m_doc as never);
      input = new MEIInput(this.m_doc as never);
    }
    else {
      LogInfo('Unsupported format');
      return false;
    }

    if (!input) {
      LogError('Unknown error');
      return false;
    }

    let ok = false;
    try {
      // C++ toolkit.cpp skips the second import for HUMDRUM (already imported above).
      if (inputFrom === FileFormat.HUMDRUM) ok = true;
      else ok = input.Import(newData.length > 0 ? newData : data);
    }
    catch (e) {
      LogError('Error importing data');
      return false;
    }
    if (!ok) {
      LogError('Error importing data');
      return false;
    }

    const adjustPageHeight = this.m_options.m_adjustPageHeight.getValue();
    const footerOption = this.m_options.m_footer.getValue();
    if ((!adjustPageHeight && footerOption === OptionFooter.auto) || footerOption === OptionFooter.always) {
      this.m_doc.GenerateFooter();
    }
    if (this.m_options.m_header.getValue() === OptionHeader.auto) {
      this.m_doc.GenerateHeader();
    }

    this.m_doc.GenerateMeasureNumbers();

    if (
      this.m_options.m_transpose.isSet()
      || this.m_options.m_transposeMdiv.isSet()
      || this.m_options.m_transposeToSoundingPitch.isSet()
    ) {
      this.m_doc.PrepareData();
      this.m_doc.TransposeDoc();
    }

    this.m_doc.PrepareData();
    this.m_doc.InitSelectionDoc(this.m_docSelection as never, true);

    if (
      this.m_doc.IsMensuralMusicOnly()
      && this.m_options.m_mensuralResponsiveView.getValue() !== OptionMensuralResp.none
    ) {
      if (this.m_options.m_mensuralScoreUp.getValue()) this.m_doc.ScoringUpDoc();
      if (this.m_options.m_mensuralResponsiveView.getValue() === OptionMensuralResp.selection) {
        this.m_doc.ConvertToMensuralViewDoc();
      }
      else if (this.m_options.m_mensuralToCmn.getValue()) {
        this.m_doc.ConvertToCmnDoc();
      }
      else {
        this.m_doc.ConvertToCastOffMensuralDoc(MensuralCastOffType.MENSURAL_CAST_OFF_INIT);
      }
    }

    let breaks = this.m_options.m_breaks.getValue();
    if (input.GetLayoutInformation() === LayoutInformation.LAYOUT_DONE) {
      if (breaks !== OptionBreaks.auto) LogWarning('Requesting layout with specific breaks but the layout is already done');
      breaks = OptionBreaks.none;
    }
    if (this.m_doc.IsFacs()) breaks = OptionBreaks.none;
    if (this.m_doc.IsTranscription()) {
      breaks = this.m_doc.HasFacsimile() ? OptionBreaks.encoded : OptionBreaks.none;
    }

    if (breaks !== OptionBreaks.none) {
      if (
        input.GetLayoutInformation() === LayoutInformation.LAYOUT_ENCODED
        && (breaks === OptionBreaks.encoded || breaks === OptionBreaks.line || breaks === OptionBreaks.smart)
      ) {
        if (breaks === OptionBreaks.encoded) this.m_doc.CastOffEncodingDoc();
        else if (breaks === OptionBreaks.line) this.m_doc.CastOffLineDoc();
        else if (breaks === OptionBreaks.smart) this.m_doc.CastOffSmartDoc();
      }
      else {
        if (breaks === OptionBreaks.encoded) {
          LogWarning('Requesting layout with encoded breaks but nothing provided in the data');
        }
        else if (breaks === OptionBreaks.line) {
          LogWarning('Requesting layout with line breaks but nothing provided in the data');
        }
        else if (breaks === OptionBreaks.smart) {
          LogWarning('Requesting layout with smart breaks but nothing provided in the data');
        }
        this.m_doc.CastOffDoc();
      }
    }
    else {
      this.m_doc.ScoreDefSetCurrentDoc();
    }

    if (this.m_doc.IsTranscription() && this.m_doc.HasFacsimile()) {
      this.m_doc.SyncFromFacsimileDoc();
    }

    this.SetViewAndEditor();
    return true;
  }

  public GetDescriptiveFeatures(options: string): string {
    // C++ Toolkit::GetDescriptiveFeatures: no option handling yet.
    const output = { value: '' };
    this.m_doc.ExportFeatures(output, options);
    return output.value;
  }

  public GetPageWithElement(xmlId: string): number {
    const element = this.m_doc.FindDescendantByID(xmlId) as any;
    if (!element) {
      LogWarning("Element '%s' not found", xmlId);
      return 0;
    }
    const page = element.GetFirstAncestor(ClassId.PAGE) as any;
    if (!page) return 0;
    return page.GetIdx() + 1;
  }

  public GetElementAttr(xmlId: string): string {
    let element = (this.m_doc.GetDrawingPage() as any)?.FindDescendantByID?.(xmlId) as any;
    if (!element) element = this.m_doc.FindDescendantByID(xmlId) as any;
    if (!element) {
      const finder = new FindElementInLayerStaffDefFunctor(xmlId);
      const drawingPage = this.m_doc.GetDrawingPage() as any;
      if (drawingPage) {
        drawingPage.Process(finder);
        element = finder.GetElement() as any;
      }
      if (!element) {
        (this.m_doc as any).Process(finder);
        element = finder.GetElement() as any;
      }
      if (element) {
        const link = (typeof element.GetLinkingInterface === 'function' ? element.GetLinkingInterface() : null) as {
          HasCorresp?: () => boolean; GetCorresp?: () => string;
        } | null;
        if (link?.HasCorresp?.()) {
          const correspId = ExtractIDFragment(link.GetCorresp!());
          let origin = this.m_doc.FindDescendantByID(correspId) as any;
          if (!origin && this.isScoredefElement(element)) {
            const page = this.m_doc.FindDescendantByType(ClassId.PAGE) as any;
            const scoreDef = page?.m_score?.GetScoreDef?.();
            if (scoreDef) origin = scoreDef.FindDescendantByID(correspId) as any;
          }
          if (origin) element = origin;
        }
      }
    }
    if (!element) {
      LogWarning("Element '%s' not found", xmlId);
      return JSON.stringify({});
    }
    const attributes: ArrayOfStrAttr = [];
    element.GetAttributes(attributes);
    const o: Record<string, string> = {};
    for (const [name, value] of attributes) o[name] = value;
    return JSON.stringify(o);
  }

  private isScoredefElement(element: any): boolean {
    const classId = element?.GetClassId?.();
    return classId === ClassId.CLEF || classId === ClassId.GRPSYM || classId === ClassId.KEYSIG
      || classId === ClassId.MENSUR || classId === ClassId.METERSIG || classId === ClassId.METERSIGGRP;
  }

  public GetNotatedIdForElement(xmlId: string): string {
    this.SetMidiDoc();
    const midiDoc = this.m_midiDoc as any;
    if (midiDoc.m_expansionMap.HasExpansionMap()) {
      return midiDoc.m_expansionMap.GetExpansionIDsForElement(xmlId)[0];
    }
    return xmlId;
  }

  public GetExpansionIdsForElement(xmlId: string): string {
    this.SetMidiDoc();
    const midiDoc = this.m_midiDoc as any;
    const ids: string[] = midiDoc.m_expansionMap.HasExpansionMap()
      ? [...midiDoc.m_expansionMap.GetExpansionIDsForElement(xmlId)]
      : [''];
    return JSON.stringify(ids);
  }

  public GetTimeForElement(xmlId: string): number {
    this.SetMidiDoc();
    this.ResetLogBuffer();
    const midiDoc = this.m_midiDoc as any;
    const element = midiDoc.FindDescendantByID(xmlId) as any;
    if (!element) {
      LogWarning("Element '%s' not found", xmlId);
      return 0;
    }
    let timeOfElement = 0;
    if (!midiDoc.HasTimemap()) midiDoc.CalculateTimemap();
    if (!midiDoc.HasTimemap()) LogWarning('Calculation of MIDI timemap failed, time value is invalid.');
    const classId = element.GetClassId?.();
    if (classId === ClassId.NOTE) {
      const measure = element.GetFirstAncestor(ClassId.MEASURE) as any;
      timeOfElement = measure.GetRealTimeOnsetMilliseconds(1) + element.GetRealTimeOnsetMilliseconds();
    }
    else if (classId === ClassId.MEASURE) {
      timeOfElement = element.GetRealTimeOnsetMilliseconds(1);
    }
    else if (classId === ClassId.CHORD) {
      const note = element.FindDescendantByType(ClassId.NOTE) as any;
      const measure = note.GetFirstAncestor(ClassId.MEASURE) as any;
      timeOfElement = measure.GetRealTimeOnsetMilliseconds(1) + note.GetRealTimeOnsetMilliseconds();
    }
    return timeOfElement;
  }

  public GetTimesForElement(xmlId: string): string {
    this.SetMidiDoc();
    this.ResetLogBuffer();
    // C++ quirk parity: element resolved on m_doc while timemap comes from m_midiDoc.
    const element = this.m_doc.FindDescendantByID(xmlId) as any;
    if (!element) {
      LogWarning("Element '%s' not found", xmlId);
      return JSON.stringify({});
    }
    const midiDoc = this.m_midiDoc as any;
    if (!midiDoc.HasTimemap()) midiDoc.CalculateTimemap();
    if (!midiDoc.HasTimemap()) {
      LogWarning('Calculation of MIDI timemap failed, time value is invalid.');
      return JSON.stringify({});
    }
    const o: Record<string, unknown> = {};
    if (element.GetClassId?.() === ClassId.NOTE) {
      const measure = element.GetFirstAncestor(ClassId.MEASURE) as any;
      const measureOnset = measure.GetRealTimeOnsetMilliseconds(1);
      const measureScoreOnset = measure.GetScoreTimeOnset(1);
      o['qfracOn'] = [Timemap.ToArray(measureScoreOnset.add(element.GetScoreTimeOnset()))];
      o['qfracOff'] = [Timemap.ToArray(measureScoreOnset.add(element.GetScoreTimeOffset()))];
      o['qfracDuration'] = [Timemap.ToArray(element.GetScoreTimeDuration())];
      o['qfracTiedDuration'] = [Timemap.ToArray(element.GetScoreTimeTiedDuration())];
      o['tstampOn'] = [measureOnset + element.GetRealTimeOnsetMilliseconds()];
      o['tstampOff'] = [measureOnset + element.GetRealTimeOffsetMilliseconds()];
    }
    return JSON.stringify(o);
  }

  public GetMIDIValuesForElement(xmlId: string): string {
    this.SetMidiDoc();
    this.ResetLogBuffer();
    const midiDoc = this.m_midiDoc as any;
    const element = midiDoc.FindDescendantByID(xmlId) as any;
    if (!element) {
      LogWarning("Element '%s' not found", xmlId);
      return JSON.stringify({});
    }
    const o: Record<string, unknown> = {};
    if (element.GetClassId?.() === ClassId.NOTE) {
      if (!midiDoc.HasTimemap()) (this.m_doc as any).CalculateTimemap();
      if (!midiDoc.HasTimemap()) {
        LogWarning('Calculation of MIDI timemap failed, time value is invalid.');
        return JSON.stringify({});
      }
      o['time'] = this.GetTimeForElement(xmlId);
      o['pitch'] = element.GetMIDIPitch();
      o['duration'] = element.GetRealTimeOffsetMilliseconds() - element.GetRealTimeOnsetMilliseconds();
    }
    return JSON.stringify(o);
  }

  public GetElementsAtTime(millisec: number): string {
    this.SetMidiDoc();
    this.ResetLogBuffer();
    const midiDoc = this.m_midiDoc as any;
    if (!midiDoc.HasTimemap()) midiDoc.CalculateTimemap();
    const measure = midiDoc.FindDescendantByComparison(new MeasureOnsetOffsetComparison(millisec)) as any;
    if (!measure) return JSON.stringify({});
    const repeat = measure.EnclosesTime(millisec);
    const measureTimeOffset = measure.GetRealTimeOnsetMilliseconds(repeat);
    let pageNo = -1;
    if (this.m_midiDoc === (this.m_doc as unknown)) {
      const page = measure.GetFirstAncestor(ClassId.PAGE) as any;
      if (page) pageNo = page.GetIdx() + 1;
    }
    else {
      const notatedPageNo = this.GetPageWithElement(this.GetNotatedIdForElement(measure.GetID()));
      if (notatedPageNo > 0) pageNo = notatedPageNo;
    }
    const notesOrRests: any[] = [];
    measure.FindAllDescendantsByComparison(notesOrRests, new NoteOrRestOnsetOffsetComparison(millisec - measureTimeOffset));
    measure.FindAllDescendantsByComparison(
      notesOrRests, new ClassIdsComparison([ClassId.MULTIREST, ClassId.MREST]), UNLIMITED_DEPTH, FORWARD, false);
    const notes: string[] = [];
    const rests: string[] = [];
    const chords: any[] = [];
    for (const object of notesOrRests) {
      const classId = object.GetClassId?.();
      if (classId === ClassId.NOTE) {
        notes.push(object.GetID());
        const chord = object.IsChordTone();
        if (chord) chords.push(chord);
      }
      else if (classId === ClassId.MREST || classId === ClassId.MULTIREST || classId === ClassId.REST) {
        rests.push(object.GetID());
      }
    }
    const chordIds: string[] = [];
    for (const chord of chords) {
      if (!chordIds.includes(chord.GetID())) chordIds.push(chord.GetID());
    }
    return JSON.stringify({ notes, chords: chordIds, rests, page: pageNo, measure: measure.GetID() });
  }

  public Edit(editorAction: string): boolean {
    this.ResetLogBuffer();
    if (!this.m_editorToolkit) return false;
    return this.m_editorToolkit.ParseEditorAction(editorAction);
  }

  public EditResponse(): string {
    if (!this.m_editorToolkit) return '{}';
    return this.m_editorToolkit.EditResponse();
  }

  public EditStatus(): string {
    if (!this.m_editorToolkit) return '{}';
    return this.m_editorToolkit.EditStatus();
  }

  public RedoLayout(jsonOptions = ''): void {
    let resetCache = true;
    if (jsonOptions.length > 0) {
      try {
        const parsed: unknown = JSON.parse(jsonOptions);
        if (typeof parsed === 'object' && parsed !== null && 'resetCache' in parsed) {
          resetCache = Boolean((parsed as Record<string, unknown>)['resetCache']);
        }
      }
      catch (_) {
        LogWarning('Cannot parse JSON std::string. Using default options.');
      }
    }
    this.ResetLogBuffer();
    if (this.GetPageCount() === 0 || this.m_doc.IsTranscription() || this.m_doc.IsFacs()) {
      LogWarning('No data to re-layout');
      return;
    }
    if (this.m_docSelection.m_isPending) {
      this.m_doc.InitSelectionDoc(this.m_docSelection as never, resetCache);
    }
    else {
      this.m_doc.UnCastOffDoc(resetCache);
    }
    const breaks = this.m_options.m_breaks.getValue();
    if (breaks === OptionBreaks.line) {
      this.m_doc.CastOffLineDoc();
    }
    else if (breaks === OptionBreaks.encoded && this.m_doc.FindDescendantByType(ClassId.PB)) {
      this.m_doc.CastOffEncodingDoc();
    }
    else if (breaks === OptionBreaks.smart) {
      this.m_doc.CastOffSmartDoc();
    }
    else if (breaks !== OptionBreaks.none) {
      this.m_doc.CastOffDoc();
    }
  }

  public RedoPagePitchPosLayout(): void {
    this.ResetLogBuffer();
    const page = this.m_doc.GetDrawingPage() as any;
    if (!page) {
      LogWarning('No page to re-layout');
      return;
    }
    page.LayOutPitchPos();
  }

  public RenderToDeviceContext(pageNo: number, deviceContext: {
    SetBaseSize: (width: number, height: number) => void;
    SetUserScale: (xScale: number, yScale: number) => void;
    SetWidth: (width: number) => void;
    SetHeight: (height: number) => void;
    SetViewBoxFactor: (ppuFactor: number) => void;
  }): boolean {
    if (pageNo > this.GetPageCount()) {
      LogWarning('Page %d does not exist', pageNo);
      return false;
    }
    pageNo--;
    this.m_doc.SetDrawingPage(pageNo, true);
    this.m_view.SetPage(this.m_doc.GetDrawingPage() as never, true);
    let width = this.m_options.m_pageWidth.getUnfactoredValue();
    let height = this.m_options.m_pageHeight.getUnfactoredValue();
    const breaks = this.m_options.m_breaks.getValue();
    const adjustHeight = this.m_options.m_adjustPageHeight.getValue();
    const adjustWidth = this.m_options.m_adjustPageWidth.getValue();
    if (adjustWidth || breaks === OptionBreaks.none) width = this.m_doc.GetAdjustedDrawingPageWidth();
    if (adjustHeight || breaks === OptionBreaks.none) height = this.m_doc.GetAdjustedDrawingPageHeight();
    if (this.m_doc.IsTranscription()) {
      width = this.m_doc.GetAdjustedDrawingPageWidth();
      height = this.m_doc.GetAdjustedDrawingPageHeight();
    }
    if (this.m_options.m_landscape.getValue()) {
      const swapped = height;
      height = width;
      width = swapped;
    }
    const userScale = this.m_options.m_scale.getValue() / 100.0;
    if (this.m_options.m_scaleToPageSize.getValue()) {
      deviceContext.SetBaseSize(width, height);
      height = Math.trunc(height * (1.0 / userScale));
      width = Math.trunc(width * (1.0 / userScale));
    }
    deviceContext.SetUserScale(userScale, userScale);
    deviceContext.SetWidth(width);
    deviceContext.SetHeight(height);
    deviceContext.SetViewBoxFactor(this.m_view.GetPPUFactor());
    if (this.m_doc.IsFacs()) {
      const facsimile = this.m_doc.GetFacsimile() as any;
      deviceContext.SetWidth(facsimile.GetMaxX());
      deviceContext.SetHeight(facsimile.GetMaxY());
    }
    this.m_view.DrawCurrentPage(deviceContext as never, false);
    return true;
  }

  public GetPageCount(): number {
    return this.m_doc.GetPageCount();
  }

  // C++ source order 1732-1739.
  public RenderData(data: string, jsonOptions: string): string {
    if (this.SetOptions(jsonOptions) && this.LoadData(data, false)) return this.RenderToSVG(1);
    return '';
  }

  // C++ source order 1740-1798.
  public RenderToSVG(pageNo = 1, xmlDeclaration = false): string {
    this.ResetLogBuffer();
    const svg = new SvgDeviceContext(this.m_doc.GetID());
    svg.SetResources(this.m_doc.GetResources() as never);
    const indent = this.m_options.m_outputIndentTab.getValue() ? -1 : this.m_options.m_outputIndent.getValue();
    svg.SetIndent(indent);
    if (this.m_options.m_mmOutput.getValue()) svg.SetMMOutput(true);
    if (this.m_options.m_showHidden.getValue()) svg.SetShowHidden(true);
    if (this.m_doc.IsFacs()) svg.SetFacsimile(true);
    if (this.m_options.m_svgBoundingBoxes.getValue()) svg.SetSvgBoundingBoxes(true);
    if (this.m_options.m_svgContentBoundingBoxes.getValue()) svg.SetSvgContentBoundingBoxes(true);
    if (this.m_options.m_svgCss.getValue().length > 0) svg.SetCss(this.m_options.m_svgCss.getValue());
    if (this.m_options.m_svgViewBox.getValue()) svg.SetSvgViewBox(true);
    if (this.m_options.m_fontTextLiberation.getValue()) svg.SetUseLiberation(true);
    svg.SetHtml5(this.m_options.m_svgHtml5.getValue());
    svg.SetFormatRaw(this.m_options.m_svgFormatRaw.getValue());
    svg.SetRemoveXlink(this.m_options.m_svgRemoveXlink.getValue());
    svg.SetAdditionalAttributes(this.m_options.m_svgAdditionalAttribute.getValue());
    svg.SetSmuflTextFont(mapSmuflTextFont(this.m_options.m_smuflTextFont.getValue()));
    this.RenderToDeviceContext(pageNo, svg as never);
    return svg.GetStringSVG(xmlDeclaration);
  }

  // C++ source order 1799-1817 (ofstream boundary via fileWriter seam).
  public RenderToSVGFile(filename: string, pageNo = 1): boolean {
    this.ResetLogBuffer();
    return this.writeFile(filename, this.RenderToSVG(pageNo, true));
  }

  // C++ source order 1818-1842. The ostream overload has no TS equivalent;
  // file output goes through the fileWriter seam.
  public GetHumdrum(): string {
    return this.GetHumdrumBuffer();
  }

  public GetHumdrumFile(filename: string): boolean {
    return this.writeFile(filename, this.GetHumdrumBuffer());
  }

  // C++ source order 1843-1859.
  public RenderToMIDI(): string {
    this.SetMidiDoc();
    this.ResetLogBuffer();
    const outputfile = new MidiFile();
    (this.m_midiDoc as Doc).ExportMIDI(outputfile as never);
    return Base64Encode(outputfile.write());
  }

  // C++ source order 1860-1891.
  public RenderToPAE(): string {
    this.ResetLogBuffer();
    if (this.GetPageCount() === 0) {
      LogWarning('No data loaded');
      return '';
    }
    const output = new PAEOutput(this.m_doc).Export();
    if (output.length === 0) LogError('Export to PAE failed');
    return output;
  }

  public RenderToPAEFile(filename: string): boolean {
    this.ResetLogBuffer();
    return this.writeFile(filename, this.RenderToPAE());
  }

  // C++ source order 1892-1921.
  public RenderToTimemap(jsonOptions = ''): string {
    let includeMeasures = false;
    let includeRests = false;
    let useFractions = false;
    if (jsonOptions.length > 0) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(jsonOptions);
      }
      catch (_) {
        parsed = null;
      }
      if (parsed === null || typeof parsed !== 'object') {
        LogWarning('Cannot parse JSON std::string. Using default options.');
      }
      else {
        const opts = parsed as Record<string, unknown>;
        if (typeof opts['includeMeasures'] === 'boolean') includeMeasures = opts['includeMeasures'];
        if (typeof opts['includeRests'] === 'boolean') includeRests = opts['includeRests'];
        if (typeof opts['useFractions'] === 'boolean') useFractions = opts['useFractions'];
      }
    }
    this.SetMidiDoc();
    this.ResetLogBuffer();
    const output = { value: '' };
    (this.m_midiDoc as Doc).ExportTimemap(output, includeRests, includeMeasures, useFractions);
    return output.value;
  }

  // C++ source order 1922-1932.
  public RenderToExpansionMap(): string {
    this.SetMidiDoc();
    this.ResetLogBuffer();
    const output = { value: '' };
    (this.m_midiDoc as Doc).ExportExpansionMap(output);
    return output.value;
  }

  // C++ source order 2007-2045 (ofstream boundary via fileWriter seam).
  public RenderToMIDIFile(filename: string): boolean {
    this.SetMidiDoc();
    this.ResetLogBuffer();
    const outputfile = new MidiFile();
    (this.m_midiDoc as Doc).ExportMIDI(outputfile as never);
    return this.writeFile(filename, outputfile.write());
  }

  public RenderToTimemapFile(filename: string, jsonOptions = ''): boolean {
    return this.writeFile(filename, this.RenderToTimemap(jsonOptions));
  }

  public RenderToExpansionMapFile(filename: string): boolean {
    return this.writeFile(filename, this.RenderToExpansionMap());
  }

  // C++ source order 936-1036 (toolkit.cpp). Parses the same JSON option
  // keys and drives MEIOutput::Export; mensural cast-off and selection
  // restore bracketing preserved.
  public GetMEI(jsonOptions = ''): string {
    let scoreBased = true;
    let basic = false;
    let ignoreHeader = false;
    let removeIds = this.m_options.m_removeIds.getValue();
    let firstPage = 0;
    let lastPage = 0;
    let firstMeasure = '';
    let lastMeasure = '';
    let mdiv = '';
    let generateFacs = false;
    let serialized = false;

    if (jsonOptions !== '') {
      const json = new JsonxxObject();
      if (!json.parse(jsonOptions)) {
        LogWarning('Cannot parse JSON std::string. Using default options.');
      }
      else {
        // C++ json.has<Boolean>/get<Boolean|Number|String> per key.
        if (json.has('scoreBased')) scoreBased = Boolean(json.get('scoreBased'));
        if (json.has('basic')) basic = Boolean(json.get('basic'));
        if (json.has('ignoreHeader')) ignoreHeader = Boolean(json.get('ignoreHeader'));
        if (json.has('removeIds')) removeIds = Boolean(json.get('removeIds'));
        if (json.has('firstPage')) firstPage = Number(json.get('firstPage'));
        if (json.has('lastPage')) lastPage = Number(json.get('lastPage'));
        if (json.has('pageNo')) {
          firstPage = Number(json.get('pageNo'));
          lastPage = firstPage;
        }
        if (json.has('firstMeasure')) firstMeasure = String(json.get('firstMeasure'));
        if (json.has('lastMeasure')) lastMeasure = String(json.get('lastMeasure'));
        if (json.has('mdiv')) mdiv = String(json.get('mdiv'));
        if (json.has('generateFacs')) generateFacs = Boolean(json.get('generateFacs'));
        if (json.has('serialized')) serialized = Boolean(json.get('serialized'));
      }
    }

    if (this.GetPageCount() === 0) {
      LogWarning('No data loaded');
      return '';
    }

    const drawingPage = this.m_doc.GetDrawingPage() as unknown as { GetIdx(): number } | null;
    const initialPageNo = drawingPage === null ? -1 : drawingPage.GetIdx();

    let hadSelection = false;
    if (this.m_doc.HasSelection()) {
      if (!scoreBased || serialized) {
        LogError('Page-based MEI or serialized output is not possible when a selection is set.');
        return '';
      }
      hadSelection = true;
      this.m_doc.DeactiveateSelection();
    }

    const meioutput = new MEIOutput(this.m_doc as never);
    meioutput.SetScoreBasedMEI(scoreBased);
    meioutput.SetBasic(basic);

    const indent = this.m_options.m_outputIndentTab.getValue() ? -1 : this.m_options.m_outputIndent.getValue();
    meioutput.SetIndent(indent);
    meioutput.SetIgnoreHeader(ignoreHeader);
    meioutput.SetRemoveIds(removeIds);

    if (firstPage > 0) meioutput.SetFirstPage(firstPage);
    if (lastPage > 0) meioutput.SetLastPage(lastPage);
    if (firstMeasure !== '') meioutput.SetFirstMeasure(firstMeasure);
    if (lastMeasure !== '') meioutput.SetLastMeasure(lastMeasure);
    if (mdiv !== '') meioutput.SetMdiv(mdiv);

    if (generateFacs) {
      if (meioutput.HasFilter() || !scoreBased || this.m_options.m_breaks.getValue() !== OptionBreaks.encoded
        || this.m_doc.HasSelection()) {
        LogError('Generating facsimile is only possible with all pages, encoded breaks, score-based output and '
          + 'without selection.');
        return '';
      }
      this.m_doc.SyncToFacsimileDoc();
    }

    if (serialized) {
      if (meioutput.HasFilter()) {
        LogError('Page-base MEI serialization is only possible with all pages.');
        return '';
      }
      meioutput.SetSerializing(true);
      // Force these flags instead of cumbersome combination checking
      meioutput.SetBasic(false);
      meioutput.SetScoreBasedMEI(false);
    }

    const output = meioutput.Export();

    if (hadSelection) this.m_doc.ReactivateSelection(false);

    if (initialPageNo >= 0) this.m_doc.SetDrawingPage(initialPageNo);
    return output;
  }

  // C++ source order 1055-1074.
  public SaveFile(filename: string, jsonOptions = ''): boolean {
    const output = this.GetMEI(jsonOptions);
    if (output.length === 0) return false;
    if (!this.writeFile(filename, output)) {
      LogError('Unable to write MEI to %s', filename);
      return false;
    }
    return true;
  }

  // C++ source order 1037-1074 (SaveFile skipped: needs GetMEI/MEIOutput).
  public ValidatePAEFile(filename: string): string {
    const bytes = this.resolveFileLoader()?.readFileBytes(filename);
    return this.ValidatePAE(bytes ? new TextDecoder().decode(bytes) : '');
  }

  public ValidatePAE(data: string): string {
    const input = new PAEInput(this.m_doc);
    input.Import(data);
    this.m_doc.Reset();
    return input.GetValidationLog().json();
  }

  // C++ source order 1144-1180.
  public GetAvailableOptions(): string {
    const grps: Record<string, unknown> = {};
    grps['0-base'] = this.m_options.getBaseOptGrp();
    for (const grp of this.m_options.getGrps()) {
      const opts: Record<string, unknown> = {};
      for (const option of grp.getOptions()) {
        // Reading json from file is not supported in toolkit
        if (option instanceof OptionJson && option.getSource() === JsonSource.FilePath) continue;
        opts[option.getKey()] = option.toJson();
      }
      grps[grp.getId()] = { name: grp.getLabel(), options: opts };
    }
    return JSON.stringify({ groups: grps });
  }

  // C++ source order 1179-1302.
  public SetOptions(jsonOptions: string): boolean {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonOptions);
    }
    catch {
      LogError('Cannot parse JSON std::string.');
      return false;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      LogError('Cannot parse JSON std::string.');
      return false;
    }
    const record = parsed as Record<string, unknown>;
    const items = this.m_options.getItems();
    // C++ iterates std::map (sorted by key); sort keys for parity.
    for (const key of Object.keys(record).sort()) {
      const value = record[key];
      if (!items.has(key)) {
        // Base options
        if (key === 'inputFrom') {
          if (typeof value === 'string') this.SetInputFrom(value);
        }
        else if (key === 'outputTo') {
          if (typeof value === 'string') this.SetOutputTo(value);
        }
        else if (key === 'scale') {
          if (typeof value === 'number') this.SetScale(value);
        }
        else if (key === 'xmlIdSeed') {
          if (typeof value === 'number') {
            this.m_options.m_xmlIdSeed.setValue(value);
            VrvObject.SeedID(this.m_options.m_xmlIdSeed.getValue());
          }
        }
        else {
          LogError("Unsupported option '%s'", key);
        }
        continue;
      }
      // Mapped options
      const opt = items.get(key) as Option;
      if (typeof value === 'number') {
        opt.setValueDbl(value);
      }
      else if (typeof value === 'boolean') {
        opt.setValueBool(value);
      }
      else if (typeof value === 'string') {
        opt.setValue(value);
      }
      else if (Array.isArray(value)) {
        const strValues: string[] = [];
        for (const v of value) if (typeof v === 'string') strValues.push(v);
        opt.setValueArray(strValues);
      }
      else if (typeof value === 'object' && value !== null) {
        if (opt instanceof OptionJson && opt.getSource() === JsonSource.String) {
          opt.setValue(JSON.stringify(value));
        }
      }
      else {
        LogError("Unsupported type for option '%s'", key);
      }
    }
    this.m_options.sync();
    this.SetLocale();
    // Forcing font resource to be reset if the font is given in the options
    if (Array.isArray(record['fontAddCustom'])) {
      resourcesOf(this.m_doc).AddCustom?.(this.m_options.m_fontAddCustom.getValue());
    }
    if (typeof record['font'] === 'string') {
      this.SetFont(this.m_options.m_font.getValue());
    }
    if (typeof record['fontFallback'] === 'string') {
      resourcesOf(this.m_doc).SetFallbackFont?.(this.m_options.m_fontFallback.getStrValue());
    }
    if (typeof record['fontLoadAll'] === 'boolean') {
      resourcesOf(this.m_doc).LoadAll?.();
    }
    if (typeof record['fontTextLiberation'] === 'boolean') {
      resourcesOf(this.m_doc).UseLiberationTextFont?.(this.m_options.m_fontTextLiberation.getValue());
    }
    // If changing midi options, reset the MIDI doc
    if (typeof record['midiTempoAdjustment'] === 'number' || typeof record['midiNoCue'] === 'boolean') {
      this.ResetMidiDoc();
    }
    if (this.m_editorToolkit) this.m_editorToolkit.OptionsChanged();
    return true;
  }

  // C++ source order 1303-1370.
  public PrintOptionUsageOutput(option: Option | null): string {
    if (!option) return '';
    let optionStr = ' ';
    if (option.getShortOption()) optionStr += `-${option.getShortOption()}, `;
    if (option.getKey().length > 0) optionStr += `--${FromCamelCase(option.getKey())}`;
    const optDbl = option instanceof OptionDbl ? option : null;
    const optInt = option instanceof OptionInt ? option : null;
    const optIntMap = option instanceof OptionIntMap ? option : null;
    const optString = option instanceof OptionString ? option : null;
    const optArray = option instanceof OptionArray ? option : null;
    const optBool = option instanceof OptionBool ? option : null;
    if (optDbl) {
      optionStr += ' <f>';
    }
    else if (optInt) {
      optionStr += ' <i>';
    }
    else if (optString) {
      optionStr += ' <s>';
    }
    else if (optArray) {
      optionStr += '* <s>';
    }
    else if (!optBool) {
      optionStr += ' <s>';
    }
    const helpTabs = 32;
    if (optionStr.length < helpTabs) {
      optionStr += ' '.repeat(helpTabs - optionStr.length);
    }
    else {
      optionStr += '\t';
    }
    // C++ sets output.precision(2) + std::fixed for doubles.
    let out = optionStr + option.getDescription();
    if (optInt && optInt.getMin() !== optInt.getMax()) {
      out += ` (default: ${optInt.getDefault()}; min: ${optInt.getMin()}; max: ${optInt.getMax()})`;
    }
    if (optDbl && optDbl.getMin() !== optDbl.getMax()) {
      out += ` (default: ${optDbl.getDefault().toFixed(2)}; min: ${optDbl.getMin().toFixed(2)}; max: ${optDbl.getMax().toFixed(2)})`;
    }
    if (optString) {
      out += ` (default: "${optString.getDefault()}")`;
    }
    if (optIntMap) {
      out += ` (default: "${optIntMap.getDefaultStrValue()}"; other values: ${optIntMap.getStrValuesAsStr(true)})`;
    }
    out += '\n';
    return out;
  }

  // C++ source order 1370-1445. C++ writes to ostream&; TS returns the text.
  public PrintOptionUsage(category: string): string {
    const categories: Array<[OptionsCategory, string]> = [
      [OptionsCategory.Base, 'base'], [OptionsCategory.General, 'general'],
      [OptionsCategory.Json, 'json'], [OptionsCategory.Layout, 'layout'],
      [OptionsCategory.Margins, 'margins'], [OptionsCategory.Mensural, 'mensural'],
      [OptionsCategory.Midi, 'midi'], [OptionsCategory.Neume, 'neume'],
      [OptionsCategory.Selectors, 'selectors'], [OptionsCategory.Full, 'full'],
    ];
    const nameOf = (cat: OptionsCategory): string => categories.find(([c]) => c === cat)?.[1] ?? '';
    let out = `Verovio ${this.GetVersion()}\n\nExample usage:\n\n verovio [-s scale] [-r resource-path] [-o outfile] infile\n\n`;
    // C++ matches the category name case-insensitively (full-string equality).
    const lower = category.toLowerCase();
    const found = categories.find(([, name]) => lower === name);
    if (!found) {
      let optionStr = '';
      out += 'Help manual categories: \n';
      optionStr += ` -h ${nameOf(this.m_options.m_baseOptions.getCategory())}\t${this.m_options.m_baseOptions.getLabel()}\n`;
      for (const group of this.m_options.getGrps()) {
        optionStr += ` -h ${nameOf(group.getCategory())}\t${group.getLabel()}\n`;
      }
      optionStr += ' -h full\tPrint all help manual and exit';
      out += optionStr + '\n';
    }
    else {
      out += 'Options (marked as * are repeatable)\n';
      if (found[0] === OptionsCategory.Base || found[0] === OptionsCategory.Full) {
        for (const option of this.m_options.getBaseOptions()) out += this.PrintOptionUsageOutput(option);
      }
      for (const group of this.m_options.getGrps()) {
        if (found[0] === group.getCategory() || found[0] === OptionsCategory.Full) {
          out += `\n${group.getLabel()}\n`;
          for (const option of group.getOptions()) out += this.PrintOptionUsageOutput(option);
        }
      }
    }
    return out;
  }

  public GetOptionUsageString(): string {
    return this.PrintOptionUsage('full');
  }

  // C++ source order 1587-1615. std::cerr capture has no TS equivalent;
  // reroute the vrv log sink into m_cerrCaptured instead.
  public LogRedirectStart(): void {
    if (this.m_cerrOriginalBuf) {
      LogError('In Toolkit::LogRedirectStart: Only one log redirect can be active at a time.');
      return;
    }
    if (this.m_cerrCaptured.length > 0) {
      LogWarning('In Toolkit::LogRedirectStart: Log capture buffer not empty, sending current contents to LogWarning and resetting.');
      LogWarning(this.m_cerrCaptured);
      this.m_cerrCaptured = '';
    }
    this.m_cerrOriginalBuf = true;
    const self = this;
    SetLogSink((_level, message) => {
      self.m_cerrCaptured += message;
    });
  }

  public LogRedirectStop(): void {
    // Restore first so the flush is observable (C++ LogWarning bypasses cerr).
    if (this.m_cerrOriginalBuf) this.restoreLogSink();
    this.m_cerrOriginalBuf = null;
    if (this.m_cerrCaptured.length > 0) {
      const captured = this.m_cerrCaptured;
      this.m_cerrCaptured = '';
      LogWarning(captured);
    }
  }

  private restoreLogSink(): void {
    // ponytail: vrv.ts exposes SetLogSink but no getter for the previous sink,
    // so restore the default console sink. Upgrade path: export a getLogSink()
    // accessor from vrv.ts and restore the saved sink here.
    SetLogSink((level, message) => {
      if (typeof console === 'undefined') return;
      switch (level) {
        case LogLevel.LOG_DEBUG: console.debug(message); break;
        case LogLevel.LOG_ERROR: console.error(message); break;
        case LogLevel.LOG_WARNING: console.warn(message); break;
        case LogLevel.LOG_INFO: console.info(message); break;
        default: console.log(message); break;
      }
    });
  }

  // C++ source order 2377-2391. No process-wide locale in TS; keep the marker.
  public SetLocale(): void {
    if (this.m_options.m_setLocale.getValue() && !this.m_previousLocale) {
      // ponytail: C++ installs std::locale::classic() globally for StringFormat.
      // TS number formatting is locale-independent; marker only. Upgrade path:
      // thread an explicit formatter through StringFormat if locales ever matter.
      this.m_previousLocale = true;
    }
  }

  public ResetLocale(): void {
    // C++ restores the saved global locale but keeps m_previousLocale set.
    if (this.m_previousLocale) {
      // No global locale state exists in TS; the marker is retained per C++.
    }
  }

  // C++ source order 2392-2455 (NO_RUNTIME is never defined in TS).
  public InitClock(): void {
    if (!this.m_runtimeClock) {
      this.m_runtimeClock = new RuntimeClock();
    }
  }

  public ResetClock(): void {
    if (this.m_runtimeClock) {
      this.m_runtimeClock.Reset();
    }
    else {
      LogWarning("No clock available. Please call 'InitClock' to create one.");
    }
  }

  public GetRuntimeInSeconds(): number {
    if (this.m_runtimeClock) {
      return this.m_runtimeClock.GetSeconds();
    }
    LogWarning("No clock available. Please call 'InitClock' to create one.");
    return 0.0;
  }

  public LogRuntime(): void {
    if (!this.m_runtimeClock) {
      LogWarning("No clock available. Please call 'InitClock' to create one.");
      return;
    }
    const seconds = this.m_runtimeClock.GetSeconds();
    const minutes = Math.trunc(seconds / 60.0);
    if (minutes > 0) {
      LogInfo('Total runtime is %d min %.3f s.', minutes, seconds - 60.0 * minutes);
    }
    else {
      LogInfo('Total runtime is %.3f s.', seconds);
    }
  }

  // C++ source order 2297-2367. Humdrum tools (hum::Tool_mei2hum,
  // HumdrumFileSet, Tool_filter) are not yet ported, so the MEI/Humdrum
  // conversions fail explicitly. Upgrade path: run the ported humdrum tools
  // here and keep the SetHumdrumBuffer side effects from C++.
  public ConvertMEIToHumdrum(meiData: string): string {
    const converter = new Tool_mei2hum();
    try {
      const result = converter.convertDocStr(meiData);
      if (!result.status || !result.output.length) {
        LogError('Humdrum conversion is not supported in this build.');
        return '';
      }
      return result.output;
    }
    catch (e) {
      LogError('Humdrum conversion is not supported in this build.');
      return '';
    }
  }

  // C++ Toolkit::ConvertHumdrumToHumdrum (toolkit.cpp:2319): parse, apply
  // filters, re-serialize. TS HumdrumFileSet.readString returns the segment
  // count (C++ returns bool), so count<=0 covers both C++ failure branches.
  public ConvertHumdrumToHumdrum(humdrumData: string): string {
    const infiles = new HumdrumFileSet();
    const result = infiles.readString(humdrumData);
    if (result <= 0) {
      this.SetHumdrumBuffer('');
      return '';
    }
    if (infiles.getCount() === 0) {
      this.SetHumdrumBuffer('');
      return '';
    }
    const filter = new Tool_filter();
    for (let i = 0; i < infiles.getCount(); ++i) {
      if (infiles.at(i).hasGlobalFilters()) {
        filter.run(infiles.at(i));
        if (filter.hasHumdrumText()) infiles.at(i).readString(filter.getHumdrumText());
      }
    }
    if (infiles.hasUniversalFilters()) {
      filter.runUniversal(infiles);
      if (filter.hasHumdrumText()) infiles.readString(filter.getHumdrumText());
    }
    const humout = infiles.at(0).toString();
    this.SetHumdrumBuffer(humout);
    return humout;
  }

  public ConvertHumdrumToMIDI(humdrumData: string): string {
    void humdrumData;
    // C++ returns this constant in both the supported and NO_HUMDRUM_SUPPORT
    // branches; preserved verbatim.
    return 'TVRoZAAAAAYAAQAAAGRNVHJrAAAADQCQPHCBSJA8AAD/LwA=';
  }
}
