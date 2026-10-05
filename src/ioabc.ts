/**
 * ioabc.ts — ABC input (full port of src-cpp/src/ioabc.cpp, 1820 lines).
 *
 * C++ `assert` invariants become no-ops (release/WASM parity). `delete` of
 * leftover beams/containers is GC-owned. `std::string::find` returning
 * `npos` maps to JS `indexOf(...) === -1`. Module-level `abcLine`,
 * `keyPitchAlter`, `keyPitchAlterAmount` mirror the C++ globals.
 */

import { Input, type DocLike } from './iobase.js';
import {
  LayoutInformation,
  ClassId,
  VisibilityType,
  DURATION_1, DURATION_2, DURATION_4, DURATION_8, DURATION_16,
  DURATION_32, DURATION_64, DURATION_128, DURATION_256, DURATION_NONE,
  DURATION_breve,
  type data_DURATION,
} from './vrvdef.js';
import { DocType } from './doc.js';
import type { data_BARRENDITION, repeatMarkLog_FUNC } from './iomusxml.js';
import {
  ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_x,
  ACCIDENTAL_WRITTEN_ff, ACCIDENTAL_WRITTEN_n, ACCIDENTAL_WRITTEN_NONE,
} from './accid.js';
import {
  ACCIDENTAL_GESTURAL_s, ACCIDENTAL_GESTURAL_f,
  STAFFREL_above, STAFFREL_below, STAFFREL_NONE,
} from './libmei-att.js';
const ACCIDENTAL_GESTURAL_basic_s = 1;
const ACCIDENTAL_GESTURAL_basic_f = 2;
const BOOLEAN_false = 2;
import { PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b } from './pitchinterface.js';
import { Att } from './att.js';
const _attHelper = new Att();
function strToPitchname(s: string): number {
  const m: Record<string, number> = { c: PITCHNAME_c, d: PITCHNAME_d, e: PITCHNAME_e, f: PITCHNAME_f, g: PITCHNAME_g, a: PITCHNAME_a, b: PITCHNAME_b };
  return m[s] ?? 0;
}
import type { data_ARTICULATION, data_STAFFREL } from './libmei-att.js';
import { VrvObject } from './object.js';
import { xml_node_type } from './pugixml.js';
import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Staff } from './staff.js';
import { StaffGrp } from './staffgrp.js';
import { StaffDef } from './staffdef.js';
import { ScoreDef } from './scoredef.js';
import { Layer } from './layer.js';
import { LayerElement } from './layerelement.js';
import { Measure } from './measure.js';
import { Note } from './note.js';
import { Chord } from './chord.js';
import { Rest } from './rest.js';
import { Space } from './space.js';
import { MultiRest } from './multirest.js';
import { Beam } from './beam.js';
import { Tuplet } from './tuplet.js';
import { Clef } from './clef.js';
import { KeySig } from './keysig.js';
import { MeterSig } from './metersig.js';
import { Accid } from './accid.js';
import { Artic } from './artic.js';
import { Harm } from './harm.js';
import { Dynam } from './dynam.js';
import { Fermata } from './fermata.js';
import { Mordent } from './mordent.js';
import { Turn } from './turn.js';
import { Trill } from './trill.js';
import { RepeatMark } from './repeatmark.js';
import { Slur } from './slur.js';
import { Tie } from './tie.js';
import { Tempo } from './tempo.js';
import { Annot } from './annot.js';
import { Text } from './text.js';
import { Rend } from './rend.js';
import { Verse } from './verse.js';
import { Syl } from './syl.js';
import { PgHead } from './pghead.js';
import { Pb } from './pb.js';
import { Sb } from './sb.js';
import { ControlElement } from './controlelement.js';
import { MeterCountSign } from './libmei-att.js';
import { LogDebug, LogError, LogWarning, StringFormat, UTF8to32, GetVersion } from './vrv.js';

// C++ data_* ordinals (libmei atttypes.h).
const BARRENDITION_NONE = 0;
const BARRENDITION_dbl = 3;
const BARRENDITION_end = 8;
const BARRENDITION_rptstart = 11;
const BARRENDITION_rptboth = 12;
const BARRENDITION_rptend = 13;
const BARRENDITION_single = 15;
const GRACE_NONE = 0;
const GRACE_acc = 1;
const GRACE_unacc = 2;
const CLEFSHAPE_G = 1;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_C = 4;
const CLEFSHAPE_NONE = 0;
const METERSIGN_common = 1;
const METERSIGN_cut = 2;
const MODE_NONE = 0;
const MODE_major = 1;
const MODE_minor = 2;
const MODE_dorian = 3;
const MODE_phrygian = 5;
const MODE_lydian = 7;
const MODE_mixolydian = 9;
const MODE_aeolian = 14;
const MODE_locrian = 16;
const MODE_ionian = 12;
const ARTICULATION_stacc = 5;
const ARTICULATION_stacciss = 7;
const ARTICULATION_acc = 1;
const ARTICULATION_marc = 2;
const ARTICULATION_ten = 4;
const ARTICULATION_stop = 10;
const ARTICULATION_snap = 16;
const ARTICULATION_scoop = 20;
const ARTICULATION_upbow = 8;
const ARTICULATION_dnbow = 9;
const ARTICULATION_open = 11;
const mordentLog_FORM_lower = 1;
const mordentLog_FORM_upper = 2;
const turnLog_FORM_lower = 1;
const turnLog_FORM_upper = 2;
const STEMMODIFIER_1slash = 2;
const repeatMarkLog_FUNC_NONE = 0;
const repeatMarkLog_FUNC_coda = 1;
const repeatMarkLog_FUNC_segno = 2;
const repeatMarkLog_FUNC_dalSegno = 3;
const repeatMarkLog_FUNC_daCapo = 4;
const sylLog_CON_NONE = 0;
const sylLog_CON_s = 1;
const sylLog_CON_d = 2;
const sylLog_CON_u = 3;
const sylLog_WORDPOS_m = 2;
const HORIZONTALALIGNMENT_center = 3;
const HORIZONTALALIGNMENT_right = 2;
const VERTICALALIGNMENT_middle = 2;
const VERTICALALIGNMENT_bottom = 3;
const FONTSIZETERM_small = 3;
const PGFUNC_first = 2;

const PITCH = 'FCGDAEB';
const SHORTHAND_DECORATION = '.~HLMOPSTuv';

// C++ file-scope globals.
let abcLine = '';
let keyPitchAlter = '';
let keyPitchAlterAmount = 0;

export interface AbcDocLike extends DocLike {
  Reset(): void;
  SetType(t: DocType): void;
  AddChild(child: VrvObject): boolean;
  ConvertToPageBasedDoc(): void;
  GetFirstScoreDef(): ScoreDef | null;
  m_header: {
    append_child(name: string): {
      append_child(name: string): any;
      append_attribute(name: string): { set_value(v: string): void };
      text(): { set(v: string): void };
    };
  };
}

export enum AbcElementType {
  Default,
  Tuplet,
}

export interface AbcContainerElement {
  m_type: AbcElementType;
  m_element: LayerElement | null;
  m_count: number;
}

export type MetadataEntry = [string, number];
export type InfoEntry = [[string, number], string];
export type ControlElementEntry = [string, ControlElement];

function isSpace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v';
}
function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}
function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

export class ABCInput extends Input {
  protected m_docRef: AbcDocLike;
  protected m_filename = '';
  protected m_mdiv: Mdiv | null = null;
  protected m_clef: Clef | null = null;
  protected m_key: KeySig | null = null;
  protected m_meter: MeterSig | null = null;
  protected m_layer: Layer | null = null;

  protected m_durDefault: data_DURATION = DURATION_NONE;
  protected m_ID = '';
  protected m_unitDur = 0;
  protected m_barLines: [data_BARRENDITION, data_BARRENDITION] = [BARRENDITION_NONE, BARRENDITION_NONE];

  protected m_decoration = '!';
  protected m_linebreak = '$';
  protected m_lineNum = 1;
  protected m_broken = 0;
  protected m_gracecount = 0;
  protected m_stafflines = 5;
  protected m_transpose = 0;
  protected m_containerElement: AbcContainerElement = {
    m_type: AbcElementType.Default,
    m_element: null,
    m_count: 0,
  };

  protected m_composer: MetadataEntry[] = [];
  protected m_history: MetadataEntry[] = [];
  protected m_notes: MetadataEntry[] = [];
  protected m_origin: MetadataEntry[] = [];
  protected m_title: MetadataEntry[] = [];
  protected m_info: InfoEntry[] = [];

  protected m_tempoStack: ControlElement[] = [];
  protected m_harmStack: Harm[] = [];
  protected m_slurStack: Slur[] = [];
  protected m_tieStack: Tie[] = [];

  protected m_layerElements: LayerElement[] = [];
  protected m_noteStack: LayerElement[] = [];
  protected m_lineNoteArray: LayerElement[] = [];
  protected m_verseNumber = 1;

  protected m_artic: data_ARTICULATION[] = [];
  protected m_dynam: string[] = [];
  protected m_ornam = '';
  protected m_fermata: data_STAFFREL = STAFFREL_NONE;
  protected m_repeatMark: repeatMarkLog_FUNC = repeatMarkLog_FUNC_NONE;

  protected m_controlElements: ControlElementEntry[] = [];
  protected m_workList: any = null;

  public constructor(doc: AbcDocLike) {
    super(doc);
    this.m_docRef = doc;
    this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
  }

  public override Import(abc: string): boolean {
    this.ParseABC(abc.split('\n'));
    return true;
  }

  protected ParseABC(lines: string[]): void {
    this.m_docRef.Reset();
    this.m_docRef.SetType(DocType.Raw);

    let score: Score | null = null;
    let section: Section | null = null;
    this.CreateHeader();
    let idx = 0;
    const eof = () => idx >= lines.length;
    const getline = (): string => (idx < lines.length ? lines[idx++] : '');
    while (!eof()) {
      abcLine = getline();
      ++this.m_lineNum;
      if (abcLine.length > 0 && abcLine[0] === 'X') {
        while (!eof()) {
          if (abcLine.length >= 3) {
            this.ReadInformationField(abcLine[0], abcLine.substr(2));
            if (abcLine[0] === 'K') break;
          }
          abcLine = getline();
          ++this.m_lineNum;
        }
        if (eof()) break;
        if (this.m_title.length === 0) {
          LogWarning('ABC import: Title field missing, creating empty title');
          this.m_title.push(['', 0]);
        }
        this.CreateWorkEntry();
        const out = this.InitScoreAndSection();
        score = out.score;
        section = out.section;
        continue;
      }
      else if (!this.m_mdiv || !score || !section) {
        continue;
      }
      if (abcLine.length === 0 || abcLine.split('').every((c) => c === ' ')) {
        this.FlushControlElements(score, section);
        continue;
      }
      else if (abcLine[0] === '%') {
        continue;
      }
      else if (abcLine.length >= 3 && abcLine[1] === ':' && abcLine[0] !== '|') {
        if (abcLine[0] !== 'K') {
          this.ReadInformationField(abcLine[0], abcLine.substr(2));
        }
        else {
          LogWarning('ABC import: Key changes not supported');
        }
      }
      else {
        this.m_verseNumber = 1;
        this.m_lineNoteArray = [];
        this.ReadMusicCode(abcLine, section);
      }
    }
    if (score && section) this.FlushControlElements(score, section);

    if (section && score && !section.GetParent()) {
      score.AddChild(section);
    }

    this.m_composer = [];
    this.m_info = [];
    this.m_title = [];

    this.m_docRef.ConvertToPageBasedDoc();
  }

  protected SetBarLine(musicCode: string, i: number): number {
    let barLine: data_BARRENDITION = BARRENDITION_NONE;
    if (i >= 1 && musicCode[i - 1] === ':') {
      barLine = BARRENDITION_rptend;
    }
    else if (i + 1 < musicCode.length) {
      switch (musicCode[i + 1]) {
        case ':': barLine = BARRENDITION_rptstart; ++i; break;
        case '|': barLine = BARRENDITION_dbl; ++i; break;
        case ']': barLine = BARRENDITION_end; ++i; break;
        default: barLine = BARRENDITION_single; break;
      }
    }
    else {
      barLine = BARRENDITION_single;
    }
    if (this.m_layer!.GetChildCount() === 0) {
      this.m_barLines[0] = barLine;
    }
    else {
      this.m_barLines[1] = barLine;
    }
    return i;
  }

  protected CalcUnitNoteLength(): void {
    const firstScoreDef = this.m_docRef.GetFirstScoreDef();
    const meterSig = firstScoreDef
      ? (firstScoreDef.FindDescendantByType(ClassId.METERSIG) as unknown as MeterSig | null)
      : null;
    if (!meterSig || !meterSig.HasUnit() || (meterSig.GetTotalCount() / meterSig.GetUnit()) >= 0.75) {
      this.m_unitDur = 8;
      this.m_durDefault = DURATION_8;
    }
    else {
      this.m_unitDur = 16;
      this.m_durDefault = DURATION_16;
    }
  }

  protected AddLayerElement(): void {
    if (this.m_noteStack.length === 0) return;
    if (this.m_noteStack.length === 1) {
      if (this.m_containerElement.m_element && this.m_containerElement.m_type === AbcElementType.Tuplet) {
        this.m_containerElement.m_element.AddChild(this.m_noteStack[this.m_noteStack.length - 1]);
        if (!--this.m_containerElement.m_count) {
          this.m_layer!.AddChild(this.m_containerElement.m_element);
          this.m_containerElement = { m_type: AbcElementType.Default, m_element: null, m_count: 0 };
        }
      }
      else {
        this.m_layer!.AddChild(this.m_noteStack[this.m_noteStack.length - 1]);
      }
      this.m_noteStack = [];
      return;
    }
    const beam = new Beam();
    for (const element of this.m_noteStack) {
      beam.AddChild(element);
    }
    if (beam.FindDescendantByType(ClassId.NOTE)) {
      let element: LayerElement;
      if (this.m_containerElement.m_element && this.m_containerElement.m_type === AbcElementType.Tuplet) {
        element = this.m_containerElement.m_element;
        element.AddChild(beam);
        this.m_containerElement.m_element = null;
      }
      else {
        element = beam;
      }
      this.m_layer!.AddChild(element);
    }
    else {
      for (const element of this.m_noteStack) {
        this.m_layer!.AddChild(element);
      }
    }
    this.m_containerElement = { m_type: AbcElementType.Default, m_element: null, m_count: 0 };
    this.m_noteStack = [];
  }

  protected ParseTuplet(musicCode: string, index: number): number {
    const tupletChars = '(:0123456789 ';
    let start = index + 1;
    let tupletEnd = start;
    while (tupletEnd < musicCode.length && tupletChars.includes(musicCode[tupletEnd])) ++tupletEnd;
    const tupletStr = musicCode.substring(start, tupletEnd);

    const tuplet = new Tuplet();
    let separator = tupletStr.indexOf(':');
    let tupletNum = 0;
    if (separator !== -1) {
      tupletNum = parseInt(tupletStr.substring(0, separator), 10) || 0;
      ++separator;
    }
    else {
      tupletNum = parseInt(tupletStr, 10) || 0;
    }
    let tupletNumbase = 0;
    if (separator !== -1) {
      const secondSeparator = tupletStr.indexOf(':', separator);
      if (secondSeparator !== -1) {
        if (secondSeparator !== separator) {
          tupletNumbase = parseInt(tupletStr.substring(separator, secondSeparator), 10) || 0;
        }
      }
      else {
        tupletNumbase = parseInt(tupletStr.substring(separator), 10) || 0;
      }
    }
    const threeBase = new Set([2, 4, 8, 9]);
    if (!tupletNumbase) {
      tupletNumbase = threeBase.has(tupletNum) ? 3 : 2;
    }
    tuplet.SetNum(tupletNum);
    tuplet.SetNumbase(tupletNumbase);
    this.m_containerElement = { m_type: AbcElementType.Tuplet, m_element: tuplet, m_count: tupletNum };
    return tupletEnd - 1;
  }

  protected AddAnnot(remark: string): void {
    const annot = new Annot();
    const text = new Text();
    text.SetText(UTF8to32(remark));
    annot.AddChild(text);
    this.m_layer!.AddChild(annot);
  }

  protected AddArticulation(element: LayerElement): void {
    const artic = new Artic();
    artic.SetArtic([...this.m_artic]);
    element.AddChild(artic);
    this.m_artic = [];
  }

  protected AddChordSymbol(element: LayerElement): void {
    if (this.m_harmStack.length > 0 && !this.m_harmStack[this.m_harmStack.length - 1].HasStartid()) {
      this.m_harmStack[this.m_harmStack.length - 1].SetStartid('#' + element.GetID());
      this.m_harmStack = [];
    }
    this.m_harmStack = [];
  }

  protected AddDynamic(element: LayerElement): void {
    for (const str of this.m_dynam) {
      const dynam = new Dynam();
      dynam.SetStartid('#' + element.GetID());
      const text = new Text();
      text.SetText(UTF8to32(str));
      dynam.AddChild(text);
      this.m_controlElements.push([this.m_layer!.GetID(), dynam]);
    }
    this.m_dynam = [];
  }

  protected AddFermata(element: LayerElement): void {
    const fermata = new Fermata();
    fermata.SetStartid('#' + element.GetID());
    fermata.SetPlace(this.m_fermata);
    this.m_controlElements.push([this.m_layer!.GetID(), fermata]);
    this.m_fermata = STAFFREL_NONE;
  }

  protected AddOrnaments(element: LayerElement): void {
    const refId = '#' + element.GetID();
    if (this.m_ornam.includes('m')) {
      const mordent = new Mordent();
      mordent.SetStartid(refId);
      mordent.SetForm(mordentLog_FORM_lower);
      this.m_controlElements.push([this.m_layer!.GetID(), mordent]);
    }
    if (this.m_ornam.includes('M')) {
      const mordent = new Mordent();
      mordent.SetStartid(refId);
      mordent.SetForm(mordentLog_FORM_upper);
      this.m_controlElements.push([this.m_layer!.GetID(), mordent]);
    }
    if (this.m_ornam.includes('s')) {
      const turn = new Turn();
      turn.SetStartid(refId);
      turn.SetForm(turnLog_FORM_lower);
      this.m_controlElements.push([this.m_layer!.GetID(), turn]);
    }
    if (this.m_ornam.includes('S')) {
      const turn = new Turn();
      turn.SetStartid(refId);
      turn.SetForm(turnLog_FORM_upper);
      this.m_controlElements.push([this.m_layer!.GetID(), turn]);
    }
    if (this.m_ornam.includes('T')) {
      const trill = new Trill();
      trill.SetStartid(refId);
      this.m_controlElements.push([this.m_layer!.GetID(), trill]);
    }
    this.m_ornam = '';
  }

  protected AddRepeatMark(element: LayerElement): void {
    const rm = new RepeatMark();
    rm.SetStartid('#' + element.GetID());
    rm.SetFunc(this.m_repeatMark);
    this.m_controlElements.push([this.m_layer!.GetID(), rm]);
    this.m_repeatMark = repeatMarkLog_FUNC_NONE;
  }

  protected AddTie(): void {
    if (this.m_tieStack.length > 0) {
      LogWarning("ABC import: '%s' already tied", this.m_ID);
      return;
    }
    if (this.m_ID !== '') {
      const tie = new Tie();
      tie.SetStartid(this.m_ID);
      this.m_tieStack.push(tie);
      this.m_controlElements.push([this.m_layer!.GetID(), tie]);
    }
  }

  protected StartSlur(): void {
    const openSlur = new Slur();
    this.m_slurStack.push(openSlur);
    this.m_controlElements.push([this.m_layer!.GetID(), openSlur]);
  }

  protected EndSlur(): void {
    if (this.m_slurStack.length > 0) {
      if (!this.m_slurStack[this.m_slurStack.length - 1].HasStartid()) {
        LogError('ABC import: Empty slur found');
        this.m_slurStack.pop();
        return;
      }
      for (let r = this.m_slurStack.length - 1; r >= 0; --r) {
        if (this.m_slurStack[r].GetStartid().indexOf(this.m_ID) === -1) {
          this.m_slurStack[r].SetEndid('#' + this.m_ID);
          this.m_slurStack.splice(r, 1);
          break;
        }
      }
      return;
    }
    LogWarning("ABC import: Closing slur for element '%s' could not be matched", this.m_ID);
  }

  protected ParseDecoration(decorationString: string): void {
    if (decorationString.length > 0 && isDigit(decorationString[0])) {
      LogWarning('ABC import: Fingering not supported', decorationString);
      return;
    }
    if (decorationString === '.') this.m_artic.push(ARTICULATION_stacc);
    else if (decorationString === '~' || decorationString === 'roll') this.m_ornam += 'S';
    else if (decorationString === 'trill' || decorationString === 'T') this.m_ornam += 'T';
    else if (decorationString === 'mordent' || decorationString === 'lowermordent' || decorationString === 'M') this.m_ornam += 'm';
    else if (decorationString === 'pralltriller' || decorationString === 'uppermordent' || decorationString === 'P') this.m_ornam += 'M';
    else if (decorationString === 'turn') this.m_ornam += 'S';
    else if (decorationString === 'invertedturn') this.m_ornam += 's';
    else if (decorationString === '>' || decorationString === 'accent' || decorationString === 'emphasis') this.m_artic.push(ARTICULATION_acc);
    else if (decorationString === '^' || decorationString === 'marcato') this.m_artic.push(ARTICULATION_marc);
    else if (decorationString === 'fermata' || decorationString === 'H') this.m_fermata = STAFFREL_above;
    else if (decorationString === 'invertedfermata') this.m_fermata = STAFFREL_below;
    else if (decorationString === 'tenuto') this.m_artic.push(ARTICULATION_ten);
    else if (decorationString === '+' || decorationString === 'plus') this.m_artic.push(ARTICULATION_stop);
    else if (decorationString === 'snap') this.m_artic.push(ARTICULATION_snap);
    else if (decorationString === 'slide') this.m_artic.push(ARTICULATION_scoop);
    else if (decorationString === 'wedge') this.m_artic.push(ARTICULATION_stacciss);
    else if (decorationString === 'upbow' || decorationString === 'u') this.m_artic.push(ARTICULATION_upbow);
    else if (decorationString === 'downbow' || decorationString === 'v') this.m_artic.push(ARTICULATION_dnbow);
    else if (decorationString === 'open') this.m_artic.push(ARTICULATION_open);
    else if (['pppp', 'ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff', 'ffff', 'sfz'].includes(decorationString)) this.m_dynam.push(decorationString);
    else if (decorationString === 'segno') this.m_repeatMark = repeatMarkLog_FUNC_segno;
    else if (decorationString === 'coda') this.m_repeatMark = repeatMarkLog_FUNC_coda;
    else if (decorationString === 'D.S.') this.m_repeatMark = repeatMarkLog_FUNC_dalSegno;
    else if (decorationString === 'D.C.') this.m_repeatMark = repeatMarkLog_FUNC_daCapo;
    else LogWarning('ABC import: Decoration %s not supported', decorationString);
  }

  protected ParseInstruction(instruction: string): void {
    if (instruction.startsWith('abc-include')) {
      LogWarning('ABC import: Include field is ignored');
    }
    else if (instruction.startsWith('linebreak')) {
      if (instruction.includes('<none>')) {
        this.m_linebreak = '\0';
        this.m_layoutInformation = LayoutInformation.LAYOUT_NONE;
      }
      else {
        this.m_linebreak = '$';
        this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
        LogWarning('ABC import: Default linebreaks are used for now.');
      }
    }
    else if (instruction.startsWith('decoration')) {
      this.m_decoration = instruction[11];
    }
  }

  protected ParseKey(keyStringIn: string): void {
    let keyString = keyStringIn;
    let i = 0;
    this.m_ID = '';
    let accidNum = 0;
    let mode: number = MODE_NONE;
    this.m_key = new KeySig();
    this.m_key.SetAttribute(true);
    this.m_clef = new Clef();
    while (i < keyString.length && isSpace(keyString[i])) ++i;
    if (i < keyString.length && PITCH.includes(keyString[i])) {
      accidNum = PITCH.indexOf(keyString[i]) - 1;
      keyString = keyString.substring(0, i) + keyString[i].toLowerCase() + keyString.substring(i + 1);
      this.m_key.SetPname(strToPitchname(keyString.substring(i, i + 1)));
      ++i;
    }
    while (i < keyString.length && isSpace(keyString[i])) ++i;
    if (i < keyString.length) {
      if (keyString[i] === '#') {
        this.m_key.SetAccid(ACCIDENTAL_GESTURAL_basic_s);
        accidNum += 7;
        ++i;
      }
      else if (keyString[i] === 'b') {
        this.m_key.SetAccid(ACCIDENTAL_GESTURAL_basic_f);
        accidNum -= 7;
        ++i;
      }
    }
    if (this.m_key.HasPname()) {
      mode = MODE_major;
      while (i < keyString.length && isSpace(keyString[i])) ++i;
      if (i < keyString.length && keyString[i]) {
        let modeString = keyString.substring(i);
        modeString = modeString.substring(0, 3).toLowerCase();
        if (modeString === 'min' || (modeString[0] === 'm' && !isAlpha(modeString[1] || ''))) {
          mode = MODE_minor; accidNum -= 3;
        }
        else if (modeString === 'ion') mode = MODE_dorian;
        else if (modeString === 'dor') { mode = MODE_dorian; accidNum -= 2; }
        else if (modeString === 'phr') { mode = MODE_phrygian; accidNum -= 4; }
        else if (modeString === 'lyd') { mode = MODE_lydian; accidNum += 1; }
        else if (modeString === 'mix') { mode = MODE_mixolydian; accidNum -= 1; }
        else if (modeString === 'aeo') { mode = MODE_aeolian; accidNum -= 3; }
        else if (modeString === 'loc') { mode = MODE_locrian; accidNum -= 5; }
      }
    }
    this.m_key.SetMode(mode);
    if (accidNum !== 0) {
      let keySig: string;
      let posStart = 0;
      const posEnd = Math.abs(accidNum);
      if (accidNum < 0) {
        keySig = StringFormat('%df', Math.abs(accidNum));
        posStart = PITCH.length - posEnd;
        keyPitchAlterAmount = -1;
      }
      else {
        keySig = StringFormat('%ds', accidNum);
        keyPitchAlterAmount = 1;
      }
      this.m_key.SetSig(_attHelper.StrToKeysignature(keySig));
      keyPitchAlter = PITCH.substring(posStart, posStart + posEnd);
    }
    if (keyString.includes('alto')) {
      this.m_clef.SetShape(CLEFSHAPE_C); i += 4; this.m_clef.SetLine(3);
    }
    else if (keyString.includes('tenor')) {
      this.m_clef.SetShape(CLEFSHAPE_C); i += 5; this.m_clef.SetLine(4);
    }
    else if (keyString.includes('bass')) {
      this.m_clef.SetShape(CLEFSHAPE_F); i += 4; this.m_clef.SetLine(4);
    }
    else if (keyString.includes('perc')) {
      LogWarning('ABC Input: Drum clef is not supported');
    }
    else if (keyString.includes('none')) {
      i += 4; this.m_clef.SetShape(CLEFSHAPE_NONE);
    }
    else {
      this.m_clef.SetShape(CLEFSHAPE_G); this.m_clef.SetLine(2);
    }
    const tpos = keyString.indexOf('transpose=', i);
    if (tpos !== -1) {
      i = tpos + 10;
      let transStr = '';
      while (i < keyString.length && (keyString[i] === '-' || isDigit(keyString[i]))) {
        transStr += keyString[i]; ++i;
      }
      this.m_transpose = parseInt(transStr, 10) || 0;
    }
    const spos = keyString.indexOf('stafflines=', i);
    if (spos !== -1) {
      const pos = spos + 11;
      let end = pos;
      while (end < keyString.length && isDigit(keyString[end])) ++end;
      this.m_stafflines = parseInt(keyString.substring(pos, end), 10) || 0;
    }
  }

  protected ParseUnitNoteLength(unitNoteLength: string): void {
    const slash = unitNoteLength.indexOf('/');
    if (slash !== -1) this.m_unitDur = parseInt(unitNoteLength.substring(slash + 1), 10) || 0;
    else if (parseInt(unitNoteLength, 10) === 1) this.m_unitDur = 1;
    switch (this.m_unitDur) {
      case 1: this.m_durDefault = DURATION_1; break;
      case 2: this.m_durDefault = DURATION_2; break;
      case 4: this.m_durDefault = DURATION_4; break;
      case 8: this.m_durDefault = DURATION_8; break;
      case 16: this.m_durDefault = DURATION_16; break;
      case 32: this.m_durDefault = DURATION_32; break;
      case 64: this.m_durDefault = DURATION_64; break;
      case 128: this.m_durDefault = DURATION_128; break;
      case 256: this.m_durDefault = DURATION_256; break;
      default: break;
    }
  }

  protected ParseMeter(meterString: string): void {
    this.m_meter = new MeterSig();
    if (meterString.includes('C')) {
      if (meterString[meterString.indexOf('C') + 1] === '|') {
        this.m_meter.SetSym(METERSIGN_cut);
        this.m_meter.SetCount({ count: [2], sign: MeterCountSign.None });
        this.m_meter.SetUnit(2);
      }
      else {
        this.m_meter.SetSym(METERSIGN_common);
        this.m_meter.SetCount({ count: [4], sign: MeterCountSign.None });
        this.m_meter.SetUnit(4);
      }
    }
    else if (meterString.includes('/')) {
      const slash = meterString.indexOf('/');
      let meterCount = meterString.substring(0, slash);
      if (meterCount.startsWith('(') && meterCount.endsWith(')')) meterCount = meterCount.substring(1, meterCount.length - 1);
      this.m_meter.SetCount({ count: [parseInt(meterCount, 10) || 0], sign: MeterCountSign.None });
      this.m_meter.SetUnit(parseInt(meterString.substring(slash + 1), 10) || 0);
    }
  }

  protected ParseTempo(tempoString: string): void {
    const tempo = new Tempo();
    const eq = tempoString.indexOf('=');
    if (eq !== -1) {
      tempo.SetMm(parseFloat(tempoString.substring(eq + 1)));
    }
    const q1 = tempoString.indexOf('"');
    if (q1 !== -1) {
      let tempoWord = tempoString.substring(q1 + 1);
      const q2 = tempoWord.indexOf('"');
      if (q2 !== -1) tempoWord = tempoWord.substring(0, q2);
      if (tempoWord !== '') {
        const text = new Text();
        text.SetText(UTF8to32(tempoWord));
        tempo.AddChild(text);
      }
    }
    tempo.SetTstamp(1);
    this.m_tempoStack.push(tempo);
    LogWarning('ABC import: Tempo definitions are not fully supported yet');
  }

  protected ParseReferenceNumber(referenceNumberString: string): void {
    this.m_mdiv = new Mdiv();
    this.m_mdiv.SetVisibility(VisibilityType.Visible);
    if (referenceNumberString !== '') {
      const mdivNum = parseInt(referenceNumberString, 10) || 0;
      if (mdivNum < 1) LogError('ABC import: reference number should be a positive integer');
      this.m_mdiv.SetN(String(mdivNum));
    }
    this.m_docRef.AddChild(this.m_mdiv);
    this.m_durDefault = DURATION_NONE;
    this.m_composer = [];
    this.m_history = [];
    this.m_info = [];
    this.m_origin = [];
    this.m_title = [];
  }

  protected PrintInformationFields(score: Score): void {
    const pgHead = new PgHead();
    (pgHead as unknown as { SetFunc(v: number): void }).SetFunc?.(PGFUNC_first);
    for (const it of this.m_title) {
      const titleRend = new Rend();
      titleRend.SetHalign(HORIZONTALALIGNMENT_center);
      titleRend.SetValign(VERTICALALIGNMENT_middle);
      if (it !== this.m_title[0]) {
        titleRend.SetFontsize({ SetTerm: (t: number) => t } as never);
      }
      const text = new Text();
      text.SetText(UTF8to32(it[0]));
      titleRend.AddChild(text);
      pgHead.AddChild(titleRend);
    }
    void FONTSIZETERM_small;
    for (const it of this.m_composer) {
      const compRend = new Rend();
      compRend.SetHalign(HORIZONTALALIGNMENT_right);
      compRend.SetValign(VERTICALALIGNMENT_bottom);
      const composer = new Text();
      composer.SetText(UTF8to32(it[0]));
      compRend.AddChild(composer);
      if (this.m_origin.length > 0) {
        const origin = new Text();
        origin.SetText(UTF8to32(' (' + this.m_origin[0][0] + ')'));
        compRend.AddChild(origin);
      }
      pgHead.AddChild(compRend);
    }
    if (this.m_composer.length === 0 && this.m_origin.length > 0) {
      const originRend = new Rend();
      originRend.SetHalign(HORIZONTALALIGNMENT_right);
      originRend.SetValign(VERTICALALIGNMENT_bottom);
      const origin = new Text();
      origin.SetText(UTF8to32('(' + this.m_origin[0][0] + ')'));
      originRend.AddChild(origin);
      pgHead.AddChild(originRend);
    }
    score.GetScoreDef()!.AddChild(pgHead);
  }

  protected CreateHeader(): void {
    const header = this.m_docRef.m_header;
    const meiHead = header.append_child('meiHead');
    const fileDesc = meiHead.append_child('fileDesc');
    const fileTitleStmt = fileDesc.append_child('titleStmt');
    const fileTitle = fileTitleStmt.append_child('title');
    fileTitle.text().set(this.m_filename);
    if (this.m_composer.length > 0) {
      for (const it of this.m_composer) {
        const composer = fileTitleStmt.append_child('composer');
        composer.text().set(it[0]);
        composer.append_attribute('xml:id').set_value(StringFormat('abcLine%02d', it[1]));
        composer.append_attribute('analog').set_value('abc:C');
      }
    }
    const pubStmt = fileDesc.append_child('pubStmt');
    pubStmt.append_child(xml_node_type.node_pcdata);
    if (this.m_notes.length > 0) {
      const notes = fileDesc.append_child('notesStmt');
      for (const it of this.m_notes) {
        const annot = notes.append_child('annot');
        annot.text().set(it[0]);
        annot.append_attribute('xml:id').set_value(StringFormat('abcLine%02d', it[1]));
        annot.append_attribute('analog').set_value('abc:N');
      }
    }
    const encodingDesc = meiHead.append_child('encodingDesc');
    const appInfo = encodingDesc.append_child('appInfo');
    const app = appInfo.append_child('application');
    const appName = app.append_child('name');
    appName.text().set('Verovio');
    const appText = app.append_child('p');
    appText.text().set('Transcoded from abc music');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = StringFormat('%d-%02d-%02dT%02d:%02d:%02d',
      now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    void pad;
    app.append_attribute('isodate').set_value(dateStr);
    app.append_attribute('version').set_value(GetVersion());
    this.m_workList = meiHead.append_child('workList');
  }

  protected CreateWorkEntry(): void {
    const work = this.m_workList.append_child('work');
    work.append_attribute('n').set_value(this.m_mdiv!.GetN());
    work.append_attribute('data').set_value(StringFormat('#%s', this.m_mdiv!.GetID()));
    let first = true;
    for (const it of this.m_title) {
      const title = work.append_child('title');
      title.text().set(it[0]);
      if (it[1] !== 0) title.append_attribute('xml:id').set_value(StringFormat('abcLine%02d', it[1]));
      title.append_attribute('analog').set_value('abc:T');
      title.append_attribute('type').set_value(first ? 'main' : 'alternative');
      first = false;
    }
    if (this.m_composer.length > 0) {
      for (const it of this.m_composer) {
        const composer = work.append_child('composer');
        composer.text().set(it[0]);
        composer.append_attribute('xml:id').set_value(StringFormat('abcLine%02d', it[1]));
        composer.append_attribute('analog').set_value('abc:C');
      }
    }
    if (this.m_history.length > 0) {
      const history = work.append_child('history');
      history.append_attribute('analog').set_value('abc:H');
      for (const it of this.m_history) {
        const histLine = history.append_child('p');
        histLine.text().set(it[0]);
        histLine.append_attribute('xml:id').set_value(StringFormat('abcLine%02d', it[1]));
      }
    }
    if (this.m_info.length > 0) {
      const notes = work.append_child('notesStmt');
      for (const it of this.m_info) {
        const annot = notes.append_child('annot');
        annot.text().set(it[0][0]);
        annot.append_attribute('xml:id').set_value(StringFormat('abcLine%02d', it[0][1]));
        annot.append_attribute('analog').set_value(StringFormat('abc:%c', it[1]));
      }
    }
  }

  protected FlushControlElements(score: Score, section: Section): void {
    let layer: Layer | null = null;
    let measure: Measure | null = null;
    for (const iter of this.m_controlElements) {
      if (!measure || (layer && layer.GetID() !== iter[0])) {
        layer = section.FindDescendantByID(iter[0]) as unknown as Layer | null;
      }
      if (!layer) {
        LogWarning("ABC import: Element '%s' could not be assigned to layer '%s'",
          (iter[1] as VrvObject).GetClassName(), iter[0]);
        continue;
      }
      measure = layer.GetFirstAncestor(ClassId.MEASURE) as unknown as Measure;
      measure.AddChild(iter[1]);
    }
    if (!section.GetParent()) {
      score.AddChild(section);
    }
    this.m_controlElements = [];
  }

  protected InitScoreAndSection(): { score: Score; section: Section } {
    const score = new Score();
    this.m_mdiv!.AddChild(score);
    const staffGrp = new StaffGrp();
    const staffDef = new StaffDef();
    staffDef.SetN(1);
    staffDef.SetLines(this.m_stafflines);
    staffDef.SetTransSemi(this.m_transpose);
    if (this.m_clef) {
      staffDef.AddChild(this.m_clef);
      this.m_clef = null;
    }
    if (this.m_meter) {
      staffDef.AddChild(this.m_meter);
      this.m_meter = null;
    }
    staffGrp.AddChild(staffDef);
    this.PrintInformationFields(score);
    score.GetScoreDef()!.AddChild(staffGrp);
    if (this.m_key) {
      score.GetScoreDef()!.AddChild(this.m_key);
      this.m_key = null;
    }
    const section = new Section();
    if (this.m_linebreak !== '\0') {
      const pb = new Pb();
      pb.SetID(StringFormat('abcLine%02d', this.m_lineNum + 1));
      section.AddChild(pb);
    }
    if (this.m_durDefault === DURATION_NONE) {
      this.CalcUnitNoteLength();
    }
    score.GetScoreDef()!.SetDurDefault(this.m_durDefault);
    this.m_durDefault = DURATION_NONE;
    this.m_layer = new Layer();
    this.m_layer.SetN(1);
    return { score, section };
  }

  protected ParseLyrics(): void {
    const syllables: Array<[Syl, number]> = [];
    const delimiters = '-_*~ ';
    let start = 2;
    const findDelim = (from: number): number => {
      for (let k = from; k < abcLine.length; ++k) {
        if (delimiters.includes(abcLine[k])) return k;
      }
      return -1;
    };
    let found = findDelim(2);
    while (found !== -1) {
      let counter = 1;
      let sylType = sylLog_CON_NONE;
      if (abcLine[found] === '_') {
        while (found < abcLine.length && abcLine[found] === '_') { ++counter; ++found; }
        --found;
        sylType = sylLog_CON_u;
      }
      else if (abcLine[found] === '~') {
        counter = 0;
        sylType = sylLog_CON_s;
      }
      else if (abcLine[found] === '-') {
        if (found > 0 && abcLine[found - 1] === '\\') counter = 0;
        sylType = sylLog_CON_d;
      }
      else if (abcLine[found] === '*') {
        ++counter;
      }
      let syllable = abcLine.substring(start, found).split('').filter((x) => x !== '_' && x !== '\\').join('');
      if (syllable !== '') {
        const sylText = new Text();
        sylText.SetText(UTF8to32(syllable));
        const syl = new Syl();
        syl.AddChild(sylText);
        syl.SetCon(sylType);
        if (sylType === sylLog_CON_d) syl.SetWordpos(sylLog_WORDPOS_m);
        syllables.push([syl, counter]);
      }
      start = found + 1;
      found = findDelim(start);
      if (found === -1 && start < abcLine.length) {
        let last = abcLine.substring(start);
        if (last.endsWith('\r')) last = last.substring(0, last.length - 1);
        if (last !== '') {
          const sylText = new Text();
          sylText.SetText(UTF8to32(last));
          const syl = new Syl();
          syl.AddChild(sylText);
          syl.SetCon(sylType);
          syllables.push([syl, counter]);
        }
      }
    }
    for (let i = 0, j = 0; i < this.m_lineNoteArray.length && j < syllables.length; ++j) {
      while (i < this.m_lineNoteArray.length && (this.m_lineNoteArray[i] as LayerElement).IsGraceNote()) ++i;
      if (i >= this.m_lineNoteArray.length) break;
      let verse = this.m_lineNoteArray[i].GetChild(0, ClassId.VERSE) as unknown as Verse | null;
      if (!verse) {
        verse = new Verse();
        verse.SetN(this.m_verseNumber);
        this.m_lineNoteArray[i].AddChild(verse);
      }
      verse.AddChild(syllables[j][0]);
      i += syllables[j][1];
    }
    ++this.m_verseNumber;
  }

  protected ReadInformationField(dataKey: string, valueIn: string): void {
    if (dataKey === '%' || dataKey === '\0') return;
    let value = valueIn;
    const comment = value.indexOf('%');
    if (comment !== -1) value = value.substring(0, comment);
    while (value.length > 0 && isSpace(value[value.length - 1])) value = value.substring(0, value.length - 1);
    if (value === '') return;
    while (value.length > 0 && isSpace(value[0])) value = value.substring(1);
    if (dataKey === '+') {
      LogWarning('ABC import: Field continuation (+) is not supported');
      return;
    }
    switch (dataKey) {
      case 'B': this.m_info.push([[value, this.m_lineNum], dataKey]); break;
      case 'C': this.m_composer.push([value, this.m_lineNum]); break;
      case 'D': this.m_info.push([[value, this.m_lineNum], dataKey]); break;
      case 'F': this.m_info.push([[value, this.m_lineNum], dataKey]); break;
      case 'H': this.m_history.push([value, this.m_lineNum]); break;
      case 'I': this.ParseInstruction(value); break;
      case 'K': this.ParseKey(value); break;
      case 'L': this.ParseUnitNoteLength(value); break;
      case 'M': this.ParseMeter(value); break;
      case 'N': this.m_info.push([[value, this.m_lineNum], dataKey]); break;
      case 'O': this.m_origin.push([value, this.m_lineNum]); break;
      case 'Q': this.ParseTempo(value); break;
      case 'S': this.m_info.push([[value, this.m_lineNum], dataKey]); break;
      case 'T': this.m_title.push([value, this.m_lineNum]); break;
      case 'U': LogWarning('ABC import: User defined sympols are not supported'); break;
      case 'V': LogWarning('ABC import: Multi-voice music is not supported'); break;
      case 'w': this.ParseLyrics(); break;
      case 'W': LogWarning('ABC import: Lyrics are not supported yet'); break;
      case 'X': this.ParseReferenceNumber(value); break;
      case 'Z': this.m_info.push([[value, this.m_lineNum], dataKey]); break;
      default: LogWarning('ABC import: Information field %c is ignored', dataKey);
    }
  }

  protected ReadMusicCode(musicCode: string, section: Section): void {
    let i = 0;
    let sysBreak = true;
    let grace = GRACE_NONE;
    let chord: Chord | null = null;
    const at = (k: number): string => (k < musicCode.length ? musicCode[k] : '\0');

    while (i < musicCode.length) {
      if (musicCode[i] === '`') {
        // keeps a beam
      }
      if (isSpace(musicCode[i])) {
        this.AddLayerElement();
      }
      else if (musicCode[i] === '%') {
        break;
      }
      else if (i + 2 < musicCode.length && musicCode[i] === '[' && isDigit(musicCode[i + 1])) {
        ++i; ++i;
      }
      else if (i + 2 < musicCode.length && musicCode[i] === '[' && musicCode[i + 2] === ':') {
        ++i;
        const dataKey = musicCode[i];
        ++i; ++i;
        let information = '';
        while (at(i) !== ']' && i < musicCode.length) { information += musicCode[i]; ++i; }
        if (dataKey === 'r') this.AddAnnot(information);
        else this.ReadInformationField(dataKey, information);
      }
      else if (musicCode[i] === this.m_linebreak) {
        this.AddLayerElement();
        const sb = new Sb();
        section.AddChild(sb);
      }
      else if (SHORTHAND_DECORATION.includes(musicCode[i])) {
        this.ParseDecoration(musicCode[i]);
      }
      else if (musicCode[i] === this.m_decoration) {
        ++i;
        if (i < musicCode.length && !isSpace(musicCode[i])) {
          let decorationString = '';
          while (i < musicCode.length && musicCode[i] !== this.m_decoration) {
            decorationString += musicCode[i]; ++i;
          }
          this.ParseDecoration(decorationString);
        }
      }
      else if (i + 2 < musicCode.length && musicCode[i] === '(' && isDigit(musicCode[i + 1])) {
        i = this.ParseTuplet(musicCode, i);
      }
      else if (musicCode[i] === '(') {
        this.StartSlur();
      }
      else if (musicCode[i] === ')') {
        this.EndSlur();
      }
      else if (musicCode[i] === '-') {
        this.AddTie();
      }
      else if (i + 2 < musicCode.length && musicCode[i] === '[' && musicCode[i + 1] !== '|') {
        chord = new Chord();
        if (this.m_artic.length > 0) this.AddArticulation(chord);
        if (this.m_harmStack.length > 0) this.AddChordSymbol(chord);
        if (this.m_dynam.length > 0) this.AddDynamic(chord);
        if (this.m_fermata !== STAFFREL_NONE) this.AddFermata(chord);
        if (this.m_repeatMark !== repeatMarkLog_FUNC_NONE) this.AddRepeatMark(chord);
      }
      else if (i >= 1 && musicCode[i] === ']' && musicCode[i - 1] !== '|') {
        if (chord && chord.GetDur() < DURATION_8) {
          if (this.m_noteStack.length > 0) this.AddLayerElement();
          this.m_layer!.AddChild(chord);
          this.m_lineNoteArray.push(chord);
        }
        else if (chord) {
          this.m_noteStack.push(chord);
          this.m_lineNoteArray.push(chord);
        }
        chord = null;
      }
      else if (i + 2 < musicCode.length && (musicCode[i] === '{' || musicCode[i] === '}')) {
        if (musicCode[i] === '{') {
          grace = GRACE_acc;
          if (musicCode[i + 1] === '/') { grace = GRACE_unacc; ++i; }
        }
        else {
          if (this.m_gracecount > 1 || grace === GRACE_unacc) this.AddLayerElement();
          grace = GRACE_NONE;
          this.m_gracecount = 0;
        }
      }
      else if (PITCH.includes(musicCode[i].toUpperCase())) {
        let oct = 0;
        const note = new Note();
        this.m_ID = note.GetID();
        if (i >= 1) {
          let abcAccid = ACCIDENTAL_WRITTEN_NONE;
          switch (musicCode[i - 1]) {
            case '^':
              abcAccid = (i > 1 && musicCode[i - 2] === '^') ? ACCIDENTAL_WRITTEN_x : ACCIDENTAL_WRITTEN_s;
              break;
            case '=': abcAccid = ACCIDENTAL_WRITTEN_n; break;
            case '_':
              abcAccid = (i > 1 && musicCode[i - 2] === '_') ? ACCIDENTAL_WRITTEN_ff : ACCIDENTAL_WRITTEN_f;
              break;
            default: break;
          }
          if (abcAccid !== ACCIDENTAL_WRITTEN_NONE) {
            const accid = new Accid();
            accid.SetAccid(abcAccid);
            note.AddChild(accid);
          }
        }
        if (keyPitchAlter.includes(musicCode[i].toUpperCase())) {
          let accid = note.GetFirst(ClassId.ACCID) as unknown as Accid | null;
          if (!accid) {
            accid = new Accid();
            note.AddChild(accid);
            accid.SetAttribute(true);
            accid.SetAccidGes(keyPitchAlterAmount < 0 ? ACCIDENTAL_GESTURAL_f : ACCIDENTAL_GESTURAL_s);
          }
        }
        oct = musicCode[i] === musicCode[i].toUpperCase() ? 4 : 5;
        note.SetPname(strToPitchname(musicCode[i].toLowerCase()));
        while (i + 1 < musicCode.length && (musicCode[i + 1] === '\'' || musicCode[i + 1] === ',')) {
          if (musicCode[i + 1] === ',') oct -= 1;
          else oct += 1;
          ++i;
        }
        note.SetOct(oct);
        const dl = this.ParseDurationLength(musicCode, i, grace);
        i = dl.index;
        if (grace !== GRACE_NONE) {
          ++this.m_gracecount;
          note.SetGrace(grace);
          note.SetDur(DURATION_8);
          if (grace === GRACE_unacc) note.SetStemMod(STEMMODIFIER_1slash);
        }
        if (this.m_artic.length > 0) this.AddArticulation(note);
        if (this.m_harmStack.length > 0) this.AddChordSymbol(note);
        if (this.m_dynam.length > 0) this.AddDynamic(note);
        if (this.m_fermata !== STAFFREL_NONE) this.AddFermata(note);
        if (this.m_ornam !== '') this.AddOrnaments(note);
        if (this.m_repeatMark !== repeatMarkLog_FUNC_NONE) this.AddRepeatMark(note);
        if (chord) {
          chord.AddChild(note);
          if (!chord.HasDur()) {
            if (dl.dots > 0) chord.SetDots(dl.dots);
            if (dl.num === 0) chord.SetStemVisible(BOOLEAN_false);
            chord.SetDur(dl.meiDur);
          }
        }
        else {
          if (dl.dots > 0) note.SetDots(dl.dots);
          if (dl.num === 0) note.SetStemVisible(BOOLEAN_false);
          note.SetDur(dl.meiDur);
          if (note.GetDur() < DURATION_8) {
            if (this.m_noteStack.length > 0) this.AddLayerElement();
            this.m_layer!.AddChild(note);
            this.m_lineNoteArray.push(note);
          }
          else {
            this.m_noteStack.push(note);
            this.m_lineNoteArray.push(note);
          }
        }
        if (this.m_tieStack.length > 0) {
          this.m_tieStack[this.m_tieStack.length - 1].SetEndid('#' + this.m_ID);
          this.m_tieStack = [];
        }
        for (const slur of this.m_slurStack) {
          if (!slur.HasStartid()) slur.SetStartid('#' + this.m_ID);
        }
      }
      else if (musicCode[i] === 'x') {
        const space = new Space();
        this.m_ID = space.GetID();
        if (this.m_harmStack.length > 0) this.AddChordSymbol(space);
        const dl = this.ParseDurationLength(musicCode, i, grace);
        i = dl.index;
        if (dl.dots > 0) space.SetDots(dl.dots);
        space.SetDur(dl.meiDur);
        this.AddLayerElement();
        this.m_layer!.AddChild(space);
      }
      else if (musicCode[i] === 'y') {
        LogWarning('ABC import: Extra space not supported');
      }
      else if (musicCode[i] === 'z') {
        const rest = new Rest();
        this.m_ID = rest.GetID();
        if (this.m_harmStack.length > 0) this.AddChordSymbol(rest);
        if (this.m_fermata !== STAFFREL_NONE) this.AddFermata(rest);
        if (this.m_repeatMark !== repeatMarkLog_FUNC_NONE) this.AddRepeatMark(rest);
        const dl = this.ParseDurationLength(musicCode, i, grace);
        i = dl.index;
        if (dl.dots > 0) rest.SetDots(dl.dots);
        rest.SetDur(dl.meiDur);
        this.AddLayerElement();
        this.m_layer!.AddChild(rest);
      }
      else if (musicCode[i] === 'Z') {
        const multiRest = new MultiRest();
        let numString = '';
        while (i + 1 < musicCode.length && isDigit(musicCode[i + 1])) {
          numString += musicCode[i + 1]; ++i;
        }
        multiRest.SetNum(parseInt(numString, 10) || 0);
        this.m_layer!.AddChild(multiRest);
      }
      else if (musicCode[i] === '"') {
        ++i;
        if (['^', '_', '<', '>', '@'].includes(at(i))) {
          LogWarning('ABC import: Annotations are not fully support yet');
          ++i;
        }
        let chordSymbol = '';
        while (i < musicCode.length && musicCode[i] !== '"') { chordSymbol += musicCode[i]; ++i; }
        const harm = new Harm();
        const text = new Text();
        text.SetText(UTF8to32(chordSymbol));
        harm.AddChild(text);
        this.m_harmStack.push(harm);
        this.m_controlElements.push([this.m_layer!.GetID(), harm]);
      }
      else if (musicCode[i] === '\\') {
        sysBreak = false;
      }
      else if (musicCode[i] === '|') {
        this.AddLayerElement();
        i = this.SetBarLine(musicCode, i);
        if (this.m_barLines[1] !== BARRENDITION_NONE) {
          const measure = new Measure();
          measure.SetLeft(this.m_barLines[0]);
          measure.SetRight(this.m_barLines[1]);
          this.m_barLines = [BARRENDITION_NONE, BARRENDITION_NONE];
          const staff = new Staff();
          staff.AddChild(this.m_layer!);
          measure.AddChild(staff);
          section.AddChild(measure);
          this.m_layer = new Layer();
          this.m_layer.SetN(1);
          for (const tempo of this.m_tempoStack) {
            measure.AddChild(tempo);
          }
          this.m_tempoStack = [];
        }
      }

      ++i;
      if (this.m_clef) {
        this.m_noteStack.push(this.m_clef);
        this.m_clef = null;
      }
      if (this.m_meter) {
        const scoreDef = new ScoreDef();
        this.m_meter.SetAttribute(true);
        scoreDef.AddChild(this.m_meter);
        section.AddChild(scoreDef);
        this.m_meter = null;
      }
      if (this.m_durDefault !== DURATION_NONE) {
        const scoreDef = new ScoreDef();
        scoreDef.SetDurDefault(this.m_durDefault);
        section.AddChild(scoreDef);
        this.m_durDefault = DURATION_NONE;
      }
    }

    if (sysBreak && this.m_linebreak !== '\0' && !(section.GetLast() as VrvObject | null)?.Is(ClassId.SB)) {
      this.AddLayerElement();
      const sb = new Sb();
      sb.SetID(StringFormat('abcLine%02d', this.m_lineNum + 1));
      section.AddChild(sb);
    }
  }

  private ParseDurationLength(musicCode: string, i: number, grace: number): { index: number; dots: number; num: number; meiDur: data_DURATION } {
    let numStr = '';
    let numbaseStr = '';
    let dots = 0;
    let numbase = 1;
    if (this.m_broken < 0 && grace === GRACE_NONE) {
      dots = -this.m_broken;
      this.m_broken = 0;
    }
    while (i + 1 < musicCode.length && isDigit(musicCode[i + 1])) { ++i; numStr += musicCode[i]; }
    while (i + 1 < musicCode.length && musicCode[i + 1] === '/') { ++i; numbase *= 2; }
    while (i + 1 < musicCode.length && isDigit(musicCode[i + 1])) { ++i; numbaseStr += musicCode[i]; }
    while (i + 1 < musicCode.length && musicCode[i + 1] === '>') { ++i; ++this.m_broken; ++dots; }
    while (i + 1 < musicCode.length && musicCode[i + 1] === '<') { ++i; --this.m_broken; }
    const num = numStr === '' ? 1 : parseInt(numStr, 10);
    numbase = numbaseStr === '' ? numbase : parseInt(numbaseStr, 10);
    let n = num;
    while ((n & (n - 1)) !== 0) { ++dots; n = n - Math.floor(n / 3); }
    if ((numbase & (numbase - 1)) !== 0) LogError('ABC import: note length divider must be power of 2');
    let dur = num === 0 ? 4 : Math.floor((this.m_unitDur * numbase) / num);
    if (this.m_broken < 0 && grace === GRACE_NONE) {
      for (let k = 0; k !== -this.m_broken; ++k) dur = dur * 2;
    }
    else if (dots === 0 && this.m_broken > 0 && grace === GRACE_NONE) {
      for (; this.m_broken !== 0; --this.m_broken) dur = dur * 2;
    }
    const meiDur: data_DURATION = dur === 0 ? DURATION_breve : _attHelper.StrToDuration(String(dur));
    return { index: i, dots, num, meiDur };
  }
}
