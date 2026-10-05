import { TuningMock, parseASCLData, TuningError } from './tunings.js';
import { LogDebug, LogError } from './vrv.js';
import { ClassId } from './vrvdef.js';
import type { Doc } from './doc.js';
import type { Note } from './note.js';
import type { Accid } from './accid.js';
import type { ScoreDef } from './scoredef.js';
import { Accid as AccidImpl } from './accid.js';
import { AttConverterBase } from './attconverter.js';

// Local MusicXML accidental map (mirrors iomusxml ConvertAccidentalToAccid;
// kept local to avoid a customtuning<->iomusxml require cycle).
const MUSIC_XML_ACCIDENTALS: Record<string, number> = {
  sharp: 1, natural: 10, flat: 2, 'double-sharp': 4, 'sharp-sharp': 3,
  'flat-flat': 5, 'natural-sharp': 12, 'natural-flat': 11, 'quarter-flat': 20,
  'quarter-sharp': 22, 'three-quarters-flat': 21, 'three-quarters-sharp': 23,
  'sharp-down': 14, 'sharp-up': 13, 'natural-down': 16, 'natural-up': 15,
  'flat-down': 18, 'flat-up': 17, 'double-sharp-down': 24, 'double-sharp-up': 25,
  'flat-flat-down': 26, 'flat-flat-up': 27, 'triple-sharp': 8, 'triple-flat': 9,
  'slash-quarter-sharp': 37, 'slash-sharp': 38, 'slash-flat': 39,
  'double-slash-flat': 40, sori: 36, koron: 35, other: 0,
};
function ConvertAccidentalToAccid(value: string): number {
  return MUSIC_XML_ACCIDENTALS[value] ?? 0;
}

const SMUFL_E261_accidentalNatural = 0xE261;
const _accidConverter = new AttConverterBase();

export interface CustomTuningLike { IsValid(): boolean; }

interface GlyphTables {
  names: Map<string, number>;
  codes: Map<number, string>;
}

/** Sorted std::map-compatible view for the public note map. */
export class SortedStringMap implements Iterable<[string, string]> {
  private readonly values = new Map<string, string>();

  public get size(): number { return this.values.size; }
  public has(key: string): boolean { return this.values.has(key); }
  public get(key: string): string | undefined { return this.values.get(key); }
  public at(key: string): string {
    const value = this.values.get(key);
    if (value === undefined) throw new RangeError(`key not found: ${key}`);
    return value;
  }
  public insert(key: string, value: string): void {
    // std::map::insert does not replace an existing key.
    if (!this.values.has(key)) this.values.set(key, value);
  }
  public clear(): void { this.values.clear(); }
  public *entries(): IterableIterator<[string, string]> {
    const entries = [...this.values.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    yield* entries;
  }
  public [Symbol.iterator](): IterableIterator<[string, string]> { return this.entries(); }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readGlyphTable(doc: Doc): GlyphTables {
  const names = new Map<string, number>();
  const codes = new Map<number, string>();
  const resources = doc.GetResources();
  let rawJson: string | null = null;
  if (resources.GetResourceText) {
    rawJson = resources.GetResourceText('tuning-glyphnames.json');
  }
  if (rawJson === null) {
    LogError('Custom tuning: Invalid or missing file tuning-glyphnames.json');
    return { names, codes };
  }

  let json: Record<string, string>;
  try {
    json = JSON.parse(rawJson) as Record<string, string>;
  } catch {
    LogError('Custom tuning: Invalid or missing file tuning-glyphnames.json');
    return { names, codes };
  }

  for (const [glyphName, codepoint] of Object.entries(json)) {
    if (!codepoint.startsWith('U+')) {
      LogError('Custom tuning: SMuFL glyph \'%s\' has invalid codepoint in glyph table', glyphName);
      continue;
    }
    const code = Number.parseInt(codepoint.slice(2), 16);
    if (!Number.isFinite(code)) {
      LogError('Custom tuning: SMuFL glyph \'%s\' has invalid codepoint in glyph table', glyphName);
      continue;
    }
    names.set(glyphName, code);
    codes.set(code, glyphName);
  }
  return { names, codes };
}

/**
 * Pure-TypeScript translation of `include/vrv/customtuning.h` + `src/customtuning.cpp`.
 * External tuning-library and not-yet-migrated Verovio classes are expressed as typed mocks.
 */
export class CustomTuning implements CustomTuningLike {
  private static s_glyphNames = new Map<string, number>();
  private static s_glyphCodes = new Map<number, string>();

  private m_tuning = new TuningMock();
  private m_noteMap = new SortedStringMap();

  public constructor(tuningDef?: string, doc?: Doc, useMusicXmlAccidentals = false) {
    if (tuningDef === undefined) return;
    assert(doc !== undefined, 'CustomTuning requires a document when constructed with a tuning definition.');
    try {
      this.m_tuning = new TuningMock(parseASCLData(tuningDef));
      this.CreateGlyphMapping(doc);
      this.CreateNoteMapping(useMusicXmlAccidentals);
    } catch (error) {
      if (error instanceof TuningError) {
        LogError('Custom tuning: Invalid tuning definition: %s', error.message);
      } else {
        throw error;
      }
    }
  }

  public IsValid(): boolean { return this.m_tuning.notationMapping.count > 0; }
  public GetTuning(): TuningMock { return this.m_tuning; }
  public GetNoteMap(): SortedStringMap { return this.m_noteMap; }

  private CreateGlyphMapping(doc: Doc): void {
    if (CustomTuning.s_glyphNames.size > 0 && CustomTuning.s_glyphCodes.size > 0) return;
    const tables = readGlyphTable(doc);
    CustomTuning.s_glyphNames = tables.names;
    CustomTuning.s_glyphCodes = tables.codes;
  }

  private CreateNoteMapping(useMusicXmlAccidentals: boolean): void {
    this.m_noteMap.clear();
    const noteNameRegex = /(?:^|\/)([A-G])([^\/\s]*)/g;
    const accidNameRegex = /([^\+]+)\+?/g;

    for (const note of this.m_tuning.notationMapping.names) {
      noteNameRegex.lastIndex = 0;
      let noteMatch: RegExpExecArray | null;
      while ((noteMatch = noteNameRegex.exec(note)) !== null) {
        let mei = noteMatch[1];
        const accids = noteMatch[2];
        accidNameRegex.lastIndex = 0;
        let accidMatch: RegExpExecArray | null;
        let accidStartCount = 0;
        while ((accidMatch = accidNameRegex.exec(accids)) !== null) {
          const accid = accidMatch[1];
          let glyphName = '';
          let glyph = CustomTuning.GetGlyphCode(accid);
          if (glyph) {
            glyphName = accid;
          } else {
            glyph = CustomTuning.GetAccidGlyph(accid, useMusicXmlAccidentals);
            if (glyph) glyphName = CustomTuning.GetGlyphName(glyph);
          }
          if (!glyph) {
            LogError('Custom tuning: Tuning accidental "%s" is neither a %s accidental nor a SMuFL glyph', accid, useMusicXmlAccidentals ? 'MusicXML' : 'MEI');
          } else if (glyph !== SMUFL_E261_accidentalNatural && glyphName.length > 0) {
            if (accidStartCount > 0) mei += '+';
            mei += glyphName;
          }
          accidStartCount++;
          if (accidNameRegex.lastIndex === accidMatch.index) accidNameRegex.lastIndex++;
        }
        this.m_noteMap.insert(mei, note);
        noteNameRegex.lastIndex = noteMatch.index + noteMatch[0].length;
      }
    }
  }

  public static GetGlyphCode(glyphName: string, doc?: Doc): number {
    if (this.s_glyphNames.size === 0) {
      assert(doc !== undefined, 'CustomTuning.GetGlyphCode requires a document to initialize glyph tables.');
      const tables = readGlyphTable(doc);
      this.s_glyphNames = tables.names;
      this.s_glyphCodes = tables.codes;
    }
    const code = this.s_glyphNames.get(glyphName);
    if (code === undefined) {
      LogDebug('Custom tuning: SMuFL glyph \'%s\' not found in glyph table', glyphName);
      return 0;
    }
    return code;
  }

  public static GetGlyphName(glyphCode: number, doc?: Doc): string {
    if (this.s_glyphCodes.size === 0) {
      assert(doc !== undefined, 'CustomTuning.GetGlyphName requires a document to initialize glyph tables.');
      const tables = readGlyphTable(doc);
      this.s_glyphNames = tables.names;
      this.s_glyphCodes = tables.codes;
    }
    const name = this.s_glyphCodes.get(glyphCode);
    if (name === undefined) {
      LogError('Custom tuning: SMuFL glyph U+%04X not found in glyph table', glyphCode.toString(16).toUpperCase());
      return '';
    }
    return name;
  }

  public static GetAccidGlyph(accid: string, useMusicXmlAccidentals: boolean): number {
    const accidental = useMusicXmlAccidentals
      ? ConvertAccidentalToAccid(accid)
      : _accidConverter.StrToAccidentalWritten(accid);
    return AccidImpl.GetAccidGlyph(accidental);
  }

  public GetMIDIPitch(note: Note, _shift: number, octaveShift: number): number {
    let pname = note.GetPname();
    if (note.HasPnameGes()) pname = note.GetPnameGes();
    // data_PITCHNAME is c=1, d=2, e=3, f=4, g=5, a=6, b=7 in libmei.
    const noteName = String.fromCharCode(((pname - 1 + ('C'.charCodeAt(0) - 'A'.charCodeAt(0))) % 7) + 'A'.charCodeAt(0));

    let accs = 0;
    let mappedNoteName = noteName;
    for (const object of note.FindAllDescendantsByType(ClassId.ACCID)) {
      const accid = object as Accid;
      let glyph = 0;
      let glyphName = '';
      if (accid.HasGlyphName()) {
        glyph = CustomTuning.GetGlyphCode(accid.GetGlyphName());
      } else if (accid.HasAccid()) {
glyph = CustomTuning.GetAccidGlyph(_accidConverter.AccidentalWrittenToStr(accid.GetAccid()), false);
      } else if (accid.HasAccidGes()) {
glyph = CustomTuning.GetAccidGlyph(_accidConverter.AccidentalGesturalToStr(accid.GetAccidGes()), false);
      }
      if (glyph) glyphName = CustomTuning.GetGlyphName(glyph);
      if (glyph !== SMUFL_E261_accidentalNatural && glyphName.length > 0) {
        if (accs++ > 0) mappedNoteName += '+';
        mappedNoteName += glyphName;
      }
    }

    let oct = note.GetOct() + octaveShift;
    if (note.HasOctGes()) oct = note.GetOctGes();

    try {
      const tuningNoteName = this.m_noteMap.at(mappedNoteName);
      const index = this.m_tuning.notationMapping.names.indexOf(tuningNoteName);
      const scalePosition = (index + 1) % this.m_tuning.notationMapping.count;
      // C++ special case: B at scale degree 0 increments octave.
      if (pname === 7 && scalePosition === 0) oct++;
      return this.m_tuning.midiNoteForNoteName(tuningNoteName, oct);
    } catch (error) {
      if (error instanceof TuningError) {
        LogError('Custom tuning: Error mapping note to tuning: %s', error.message);
      } else if (error instanceof RangeError) {
        LogError('Custom tuning: Error mapping note to tuning: %s not mapped', mappedNoteName);
      } else {
        throw error;
      }
    }
    return note.GetMIDIPitch(_shift, octaveShift);
  }

  public static CopyCustomTunings(src: Doc, dst: Doc): void {
    const srcScoreDefs = src.FindAllDescendantsByType(ClassId.SCOREDEF) as ScoreDef[];
    const hasValidCustomTuning = srcScoreDefs.some((object) => object.GetCustomTuning().IsValid());
    if (!hasValidCustomTuning) return;

    const dstScoreDefs = dst.FindAllDescendantsByType(ClassId.SCOREDEF) as ScoreDef[];
    if (srcScoreDefs.length !== dstScoreDefs.length) {
      LogError('Custom tuning: Cannot reliably copy custom tunings from original doc to MIDI doc, because ScoreDef counts do not match');
    }
    const count = Math.min(srcScoreDefs.length, dstScoreDefs.length);
    for (let index = 0; index < count; index++) {
      const source = srcScoreDefs[index];
      const target = dstScoreDefs[index];
      if (source.GetCustomTuning().IsValid()) target.SetCustomTuning(source.GetCustomTuning());
    }
  }
}

export { parseASCLData };
