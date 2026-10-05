/**
 * iopae.cpp / iopae.h — Plaine & Easie (PAE) input and output.
 *
 * Translated from src-cpp/src/iopae.cpp (new parser + PAEOutput only).
 * The old parser is guarded by the undefined USE_PAE_OLD_PARSER macro and
 * therefore not translated.
 *
 * C++ std::list<pae::Token> semantics preserved with Token[] arrays and index
 * iteration; splice positions follow the C++ iterator insert arithmetics.
 */

import { Input, Output } from './iobase.js';
import { VrvObject } from './object.js';
import { ClassId, DURATION_NONE, DURATION_maxima, DURATION_long, DURATION_breve, DURATION_1, DURATION_2,
  DURATION_4, DURATION_8, DURATION_16, DURATION_32, DURATION_64, DURATION_128, DURATION_longa,
  DURATION_brevis, DURATION_semibrevis, DURATION_minima, DURATION_semiminima, DURATION_fusa,
  DURATION_semifusa, type data_DURATION, type MapOfOctavedPitchAccid } from './vrvdef.js';
import { LogDebug, LogError, LogWarning, StringFormat, ExtractIDFragment } from './vrv.js';
import { Doc, DocType } from './doc.js';
import { Measure } from './measure.js';
import { MeasureType } from './vrvdef.js';
// BARRENDITION_* are module-local in measure.ts; canonical libmei ordinals (atttypes.h):
const BARRENDITION_invis = 10, BARRENDITION_single = 15, BARRENDITION_dbl = 3,
  BARRENDITION_rptend = 13, BARRENDITION_rptstart = 11, BARRENDITION_rptboth = 12;
import { Staff } from './staff.js';
import { Layer } from './layer.js';
import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { ScoreDef } from './scoredef.js';
import { StaffDef } from './staffdef.js';
import { StaffGrp } from './staffgrp.js';
import { Beam } from './beam.js';
import { Chord } from './chord.js';
import { Clef } from './clef.js';
// CLEFSHAPE_*/OCTAVE_DIS_8 are module-local in clef.ts; canonical libmei ordinals:
const CLEFSHAPE_G = 1, CLEFSHAPE_C = 4, CLEFSHAPE_F = 3, OCTAVE_DIS_8 = 8;
import { GraceGrp } from './gracegrp.js';
import { KeyAccid } from './keyaccid.js';
import { KeySig } from './keysig.js';
import { Accid, type data_ACCIDENTAL_WRITTEN, ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_s,
  ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_ss, ACCIDENTAL_WRITTEN_x, ACCIDENTAL_WRITTEN_ff,
  ACCIDENTAL_WRITTEN_n, ENCLOSURE_brack } from './accid.js';
import { Ligature } from './ligature.js';
import { Mensur } from './mensur.js';
import { MeterSig, METERSIGN_common, METERSIGN_cut } from './metersig.js';
import { MeterCountSign } from './libmei-att.js';
import { MRest } from './mrest.js';
import { MultiRest } from './multirest.js';
import { Note } from './note.js';
import { Rest } from './rest.js';
import { Space } from './space.js';
import { Trill } from './trill.js';
import { Fermata } from './fermata.js';
import { Tie } from './tie.js';
import { Tuplet } from './tuplet.js';
import { Dot } from './dot.js';
import { BarLine } from './barline.js';
import { Fraction } from './fraction.js';
import { Att } from './att.js';
import { PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b,
  type data_PITCHNAME } from './pitchinterface.js';
import { STEMDIRECTION_up, STAFFREL_basic_below } from './drawinginterface.js';
import { ClassIdsComparison, PointingToComparison } from './comparison.js';
import { JsonxxObject, JsonxxArray } from './jsonxx.js';
import { BOOLEAN_true } from './linkinginterface.js';
import type { AlignMeterParams } from './layerelement.js';
import { type DurationInterface } from './durationinterface.js';
import { SaveFunctor } from './savefunctor.js';

// Local canonical constants (values from attconverter.ts / atttypes.h):
const NOTATIONTYPE_mensural = 2;
const METERFORM_num = 1;
const GRACE_acc = 1;
const GRACE_unacc = 2;
const CANCELACCID_before = 2;
const MENSURATIONSIGN_C = 1;
const MENSURATIONSIGN_O = 2;

/** Structural narrowing of the object surface consumed by PAEOutput. */
type PaeObjectLike = VrvObject & {
  GetRight?: () => number;
  GetShape?: () => number;
  GetDis?: () => number;
  GetLine?: () => number;
  HasNotationtype?: () => boolean;
  GetNotationtype?: () => number;
  GetSig?: () => { first: number; second: data_ACCIDENTAL_WRITTEN };
  HasSym?: () => boolean;
  GetSym?: () => number;
  GetForm?: () => number;
  HasCount?: () => boolean;
  GetUnit?: () => number;
  GetTotalCount?: () => number;
  GetNum?: () => number;
  GetOct?: () => number;
  GetDur?: () => data_DURATION;
  HasDots?: () => boolean;
  GetDots?: () => number;
  GetGrace?: () => number;
  HasGrace?: () => boolean;
  IsGraceNote?: () => boolean;
};

//----------------------------------------------------------------------------
// PAEOutput
//----------------------------------------------------------------------------

export class PAEOutput extends Output {
  private readonly attConverter = new Att();
  private m_docScoreDef = true;
  private m_mensural = false;
  private m_skip = false;
  private m_layerN = -1;
  private m_staffN = -1;
  private m_currentOct = -1;
  private m_currentDur = -1 as number;
  private m_currentDots = -1;
  private m_grace = false;
  private m_currentMeasure: Measure | null = null;
  private m_streamStringOutput = '';

  constructor(doc: Doc) {
    super(doc);
  }

  private get doc(): Doc { return this.m_doc as unknown as Doc; }

  public Export(): string {
    this.m_docScoreDef = true;
    this.m_mensural = false;
    this.m_skip = false;
    this.m_layerN = -1;
    this.m_staffN = -1;
    this.m_currentOct = -1;
    this.m_currentDur = -1;
    this.m_currentDots = -1;
    this.m_grace = false;

    // C++: m_doc->GetFirstScoreDef()->SaveObject(this); m_docScoreDef=false; m_doc->SaveObject(this)
    // Adaptation: canonical SaveFunctor walks the tree writing through this output.
    const firstScoreDef = this.doc.GetFirstScoreDef() as unknown as VrvObject | null;
    if (firstScoreDef) {
      const save = new SaveFunctor(this as unknown as Output);
      save.SetVisibleOnly(false);
      firstScoreDef.Process(save);
    }
    this.m_docScoreDef = false;
    {
      const save = new SaveFunctor(this as unknown as Output);
      save.SetVisibleOnly(false);
      this.doc.Process(save);
    }

    return this.m_streamStringOutput;
  }

  public override WriteObject(object: unknown): boolean {
    const obj = object as VrvObject;
    if (obj.Is(ClassId.MDIV)) {
      this.m_streamStringOutput += '@data:';
    }
    else if (obj.Is(ClassId.STAFFDEF)) {
      this.WriteStaffDef(obj as unknown as StaffDef);
    }
    else if (obj.Is(ClassId.MEASURE)) {
      this.m_currentMeasure = obj as unknown as Measure;
    }
    else if (obj.Is(ClassId.STAFF)) {
      this.WriteStaff(obj as unknown as Staff);
    }
    else if (obj.Is(ClassId.LAYER)) {
      this.WriteLayer(obj as unknown as Layer);
    }
    else if (obj.Is(ClassId.BARLINE)) {
      if (!this.m_skip) this.m_streamStringOutput += '/';
    }
    else if (obj.Is(ClassId.BEAM)) {
      this.WriteBeam(obj as unknown as Beam);
    }
    else if (obj.Is(ClassId.CHORD)) {
      this.WriteChord(obj as unknown as Chord);
    }
    else if (obj.Is(ClassId.CLEF)) {
      this.WriteClef(obj as unknown as Clef);
    }
    else if (obj.Is(ClassId.GRACEGRP)) {
      // empty in C++
    }
    else if (obj.Is(ClassId.KEYACCID)) {
      // To do for cases when key signature have []
    }
    else if (obj.Is(ClassId.KEYSIG)) {
      this.WriteKeySig(obj as unknown as KeySig);
    }
    else if (obj.Is(ClassId.MENSUR)) {
      this.WriteMensur(obj as unknown as Mensur);
    }
    else if (obj.Is(ClassId.METERSIG)) {
      this.WriteMeterSig(obj as unknown as MeterSig);
    }
    else if (obj.Is(ClassId.MREST)) {
      this.WriteMRest(obj as unknown as MRest);
    }
    else if (obj.Is(ClassId.MULTIREST)) {
      if (!this.m_skip) this.m_streamStringOutput += '=' + (obj as unknown as MultiRest).GetNum();
    }
    else if (obj.Is(ClassId.NOTE)) {
      this.WriteNote(obj as unknown as Note);
    }
    else if (obj.Is(ClassId.REST)) {
      this.WriteRest(obj as unknown as Rest);
    }
    else if (obj.Is(ClassId.SPACE)) {
      this.WriteSpace(obj as unknown as Space);
    }
    else if (obj.Is(ClassId.TUPLET)) {
      this.WriteTuplet(obj as unknown as Tuplet);
    }
    // else: Log something?

    return true;
  }

  public override WriteObjectEnd(object: unknown): boolean {
    const obj = object as VrvObject;
    if (obj.Is(ClassId.MDIV)) {
      this.m_streamStringOutput += '\n';
    }
    else if (obj.Is(ClassId.MEASURE)) {
      this.WriteMeasureEnd(obj as unknown as Measure);
    }
    else if (obj.Is(ClassId.BEAM)) {
      this.WriteBeamEnd();
    }
    else if (obj.Is(ClassId.TUPLET)) {
      this.m_streamStringOutput += ';' + (obj as unknown as Tuplet).GetNum() + ')';
    }

    return true;
  }

  private WriteStaffDef(staffDef: StaffDef): void {
    if (this.m_staffN !== -1) return;

    this.m_staffN = staffDef.GetN();

    if (staffDef.HasNotationtype() && staffDef.GetNotationtype() === NOTATIONTYPE_mensural) {
      this.m_mensural = true;
    }
  }

  private WriteMeasureEnd(measure: Measure): void {
    let barLine: string;
    switch (measure.GetRight()) {
      case BARRENDITION_rptend: barLine = '://'; break;
      case BARRENDITION_rptboth: barLine = '://:'; break;
      case BARRENDITION_rptstart: barLine = '//:'; break;
      case BARRENDITION_dbl: barLine = '//'; break;
      case BARRENDITION_invis: barLine = ''; break;
      default: barLine = '/';
    }
    this.m_streamStringOutput += barLine;
  }

  private WriteStaff(staff: Staff): void {
    if (this.m_staffN === staff.GetN()) {
      this.m_skip = false;
      return;
    }
    this.m_skip = true;
  }

  private WriteLayer(layer: Layer): void {
    if (this.m_layerN === -1) {
      this.m_layerN = layer.GetN();
      this.m_skip = false;
      return;
    }
    // second layer in the staff
    if (!this.m_skip && (this.m_layerN !== layer.GetN())) {
      this.m_skip = true;
      return;
    }
  }

  private WriteBeam(beam: Beam): void {
    if (this.m_skip) return;

    this.m_grace = false;

    const matchType = new ClassIdsComparison([ClassId.NOTE, ClassId.CHORD]);
    const child = beam.FindDescendantByComparison(matchType) as unknown as PaeObjectLike | null;
    if (child && child.IsGraceNote && child.IsGraceNote()) {
      this.m_streamStringOutput += 'qq';
      this.m_grace = true;
    }

    this.m_streamStringOutput += '{';
  }

  private WriteBeamEnd(): void {
    if (this.m_skip) return;

    this.m_streamStringOutput += '}';

    if (this.m_grace) {
      this.m_streamStringOutput += 'r';
      this.m_grace = false;
    }
  }

  private WriteChord(chord: Chord): void {
    if (this.m_skip) return;

    this.WriteDur(chord as unknown as PaeObjectLike);
    this.WriteGrace(chord as unknown as PaeObjectLike);
  }

  private WriteClef(clef: Clef): void {
    if (this.m_skip) return;

    const outStart = this.m_docScoreDef ? '@clef:' : ' %';
    const outEnd = this.m_docScoreDef ? '\n' : ' ';

    let shape: string;
    if ((clef.GetShape() === CLEFSHAPE_G) && (clef.GetDis() === OCTAVE_DIS_8)) {
      shape = 'g';
    }
    else {
      switch (clef.GetShape()) {
        case CLEFSHAPE_C: shape = 'C'; break;
        case CLEFSHAPE_F: shape = 'F'; break;
        case CLEFSHAPE_G: shape = 'G'; break;
        default: shape = 'G';
      }
    }
    const sign = this.m_mensural ? '+' : '-';
    const line = StringFormat('%d', clef.GetLine());

    this.m_streamStringOutput += outStart + shape + sign + line + outEnd;
  }

  private WriteKeySig(keySig: KeySig): void {
    if (this.m_skip) return;

    const outStart = this.m_docScoreDef ? '@keysig:' : ' $';
    const outEnd = this.m_docScoreDef ? '\n' : ' ';

    const accidType = keySig.GetSig()[1];
    let sig = '';
    if (accidType !== ACCIDENTAL_WRITTEN_n) sig += (accidType === ACCIDENTAL_WRITTEN_s) ? 'x' : 'b';
    for (let i = 0; i < keySig.GetSig()[0]; ++i) {
      const pname = KeySig.GetAccidPnameAt(accidType, i);
      const pnameStr = this.attConverter.PitchnameToStr(pname);
      sig += pnameStr.charAt(0).toUpperCase();
    }

    this.m_streamStringOutput += outStart + sig + outEnd;
  }

  private WriteMensur(_mensur: Mensur): void {
    if (this.m_skip) return;

    const outStart = this.m_docScoreDef ? '@timesig:' : ' @';
    const outEnd = this.m_docScoreDef ? '\n' : ' ';

    this.m_streamStringOutput += outStart + outEnd;
  }

  private WriteMeterSig(meterSig: MeterSig): void {
    if (this.m_skip) return;

    const outStart = this.m_docScoreDef ? '@timesig:' : ' @';
    const outEnd = this.m_docScoreDef ? '\n' : ' ';

    let sig = '';
    if (meterSig.HasSym()) {
      sig = (meterSig.GetSym() === METERSIGN_common) ? 'c' : 'c/';
    }
    else if (meterSig.GetForm() === METERFORM_num) {
      sig = StringFormat('%d', meterSig.GetTotalCount());
    }
    else if (meterSig.HasCount() && meterSig.GetUnit()) {
      sig = StringFormat('%d/%d', meterSig.GetTotalCount(), meterSig.GetUnit());
    }

    this.m_streamStringOutput += outStart + sig + outEnd;
  }

  private WriteMRest(mRest: MRest): void {
    if (this.m_skip) return;

    const fermata = this.HasFermata(mRest as unknown as VrvObject);
    if (fermata) this.m_streamStringOutput += '(';

    this.m_streamStringOutput += '=';

    if (fermata) this.m_streamStringOutput += ')';
  }

  private WriteNote(note: Note): void {
    if (this.m_skip) return;

    if (note.GetOct() !== this.m_currentOct) {
      this.m_currentOct = note.GetOct();
      const octSign = (this.m_currentOct > 3) ? "'" : ',';
      const signCount = (this.m_currentOct > 3) ? (this.m_currentOct - 3) : (4 - this.m_currentOct);
      this.m_streamStringOutput += octSign.repeat(Math.max(0, signCount));
    }

    // For chords, only output the top note
    const chord = note.IsChordTone() as (Chord & VrvObject) | null;
    if (chord) {
      if (note !== (chord.GetTopNote() as unknown as Note)) return;
    }
    else {
      this.WriteDur(note as unknown as PaeObjectLike);
      this.WriteGrace(note as unknown as PaeObjectLike);
    }

    const noteAccid = note.FindDescendantByType(ClassId.ACCID) as unknown as Accid | null;
    if (noteAccid) {
      let accid: string;
      switch (noteAccid.GetAccid()) {
        case ACCIDENTAL_WRITTEN_s: accid = 'x'; break;
        case ACCIDENTAL_WRITTEN_f: accid = 'b'; break;
        case ACCIDENTAL_WRITTEN_ss: accid = 'xx'; break;
        case ACCIDENTAL_WRITTEN_x: accid = 'xx'; break;
        case ACCIDENTAL_WRITTEN_ff: accid = 'bb'; break;
        case ACCIDENTAL_WRITTEN_n: accid = 'n'; break;
        default: accid = '';
      }
      this.m_streamStringOutput += accid;
    }

    const fermata = this.HasFermata(note as unknown as VrvObject);
    if (fermata) this.m_streamStringOutput += '(';

    const pname = this.attConverter.PitchnameToStr(note.GetPname());
    this.m_streamStringOutput += pname.toUpperCase();

    if (fermata) this.m_streamStringOutput += ')';

    if (this.m_currentMeasure) {
      const pointingToComparisonTrill = new PointingToComparison(ClassId.TRILL, note as unknown as VrvObject);
      const trill = this.m_currentMeasure.FindDescendantByComparison(pointingToComparisonTrill, 1);
      if (trill) this.m_streamStringOutput += 't';

      const pointingToComparisonTie = new PointingToComparison(ClassId.TIE, note as unknown as VrvObject);
      const tie = this.m_currentMeasure.FindDescendantByComparison(pointingToComparisonTie, 1);
      if (tie) this.m_streamStringOutput += '+';
    }
  }

  private WriteRest(rest: Rest): void {
    if (this.m_skip) return;

    this.WriteDur(rest as unknown as PaeObjectLike);

    const fermata = this.HasFermata(rest as unknown as VrvObject);
    if (fermata) this.m_streamStringOutput += '(';

    this.m_streamStringOutput += '-';

    if (fermata) this.m_streamStringOutput += ')';
  }

  private WriteSpace(space: Space): void {
    if (this.m_skip) return;

    this.WriteDur(space as unknown as PaeObjectLike);
    // Simply make it a rest - no other option in PAE
    this.m_streamStringOutput += '-';
  }

  private WriteTuplet(tuplet: Tuplet): void {
    const staff = tuplet.GetAncestorStaff() as unknown as
      { m_drawingNotationType?: number; GetDrawingNotationType?: () => number } | null;
    if (!staff) throw new Error('PAEOutput::WriteTuplet: missing ancestor staff');

    const notationType = staff.m_drawingNotationType ?? staff.GetDrawingNotationType?.() ?? 0;
    // C++ overload GetContentAlignmentDuration(notGraceOnly=true, notationType)
    const params: AlignMeterParams = { meterSig: null, mensur: null, proport: null, equivalence: DURATION_breve, metcon: true };
    const [tupletDur, remainder] = tuplet.GetContentAlignmentDuration(params, true, notationType).ToDur();
    // We should be looking for dotted values
    if (remainder.compare(new Fraction(0)) !== 0) {
      LogWarning('The tuplet content is not a single non-dotted duration');
    }

    let dur: string;
    switch (tupletDur) {
      case DURATION_long: dur = '0'; break;
      case DURATION_breve: dur = '9'; break;
      case DURATION_1: dur = '1'; break;
      case DURATION_2: dur = '2'; break;
      case DURATION_4: dur = '4'; break;
      case DURATION_8: dur = '8'; break;
      case DURATION_16: dur = '6'; break;
      case DURATION_32: dur = '3'; break;
      case DURATION_64: dur = '5'; break;
      case DURATION_128: dur = '7'; break;
      default: LogWarning('Unsupported tuplet duration'); dur = '4';
    }

    // For duration to be written within the tuplet
    this.m_currentDur = -1;
    this.m_streamStringOutput += dur + '(';
  }

  public static GetPaeDur(ndur: data_DURATION, ndots: number): string {
    let dur: string;
    switch (ndur) {
      case DURATION_long: dur = '0'; break;
      case DURATION_breve: dur = '9'; break;
      case DURATION_1: dur = '1'; break;
      case DURATION_2: dur = '2'; break;
      case DURATION_4: dur = '4'; break;
      case DURATION_8: dur = '8'; break;
      case DURATION_16: dur = '6'; break;
      case DURATION_32: dur = '3'; break;
      case DURATION_64: dur = '5'; break;
      case DURATION_128: dur = '7'; break;
      case DURATION_maxima: dur = '0'; break;
      case DURATION_longa: dur = '0'; break;
      case DURATION_brevis: dur = '9'; break;
      case DURATION_semibrevis: dur = '1'; break;
      case DURATION_minima: dur = '2'; break;
      case DURATION_semiminima: dur = '4'; break;
      case DURATION_fusa: dur = '8'; break;
      case DURATION_semifusa: dur = '6'; break;
      default: LogWarning('Unsupported duration'); dur = '4';
    }

    if (ndots > 0) {
      dur += '.'.repeat(ndots);
    }

    return dur;
  }

  private WriteDur(interface_: PaeObjectLike): void {
    const ndots = interface_.HasDots!() ? interface_.GetDots!() : 0;
    if ((interface_.GetDur!() !== this.m_currentDur) || (ndots !== this.m_currentDots)) {
      this.m_currentDur = interface_.GetDur!();
      this.m_currentDots = ndots;
      this.m_streamStringOutput += PAEOutput.GetPaeDur(interface_.GetDur!(), this.m_currentDots);
    }
  }

  private WriteGrace(attGraced: PaeObjectLike): void {
    // We are in a beam of grace notes;
    if (this.m_grace) return;

    if (attGraced.GetGrace!() === GRACE_unacc) {
      this.m_streamStringOutput += 'g';
    }
    else if (attGraced.HasGrace!()) {
      this.m_streamStringOutput += 'q';
    }
  }

  private HasFermata(object: VrvObject): boolean {
    if (!this.m_currentMeasure) return false;

    const pointingToComparisonFermata = new PointingToComparison(ClassId.FERMATA, object);
    const fermata = this.m_currentMeasure.FindDescendantByComparison(pointingToComparisonFermata, 1);
    return fermata !== null;
  }
}

//----------------------------------------------------------------------------
// pae namespace
//----------------------------------------------------------------------------

const PAEChars: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0,
  0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1,
  0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0,
];

const CONTAINER_END = '~';
const VOID = '_';
const INTERNAL_CHARS = 'QXY';
const KEYSIG_START = '$';
const KEYSIG = 'xnb[]ABCDEFG';
const CLEF_START = '%';
const CLEF = 'GCFg-+12345';
const METERSIG_START = '@';
const METERSIG = '/o.c0123456789';
const GRACE = 'qg';
const NOTENAME = 'ABCDEFG';
const DURATION_CHARS = '0123456789.';
const ACCIDENTAL_INTERNAL = 'xbnXY';
const MEASURE = ':/';

const enum status_FIGURE { FIGURE_NONE = 0, FIGURE_START, FIGURE_END, FIGURE_REPEAT }
const enum status_CHORD { CHORD_NONE = 0, CHORD_MARKER, CHORD_NOTE }
const enum status_LIGATURE { LIGATURE_NONE = 0, LIGATURE_MARKER, LIGATURE_NOTE }

// specific positions with negative numbers
const UNKOWN_POS = -1;
const KEYSIG_POS = -2;
const CLEF_POS = -3;
const TIMESIG_POS = -4;
const INPUT_POS = -5;

/** C++ char of value 0 — modeled as the NUL character in the TS adaptation. */
const NULL_CHAR = '\0';

export namespace pae {

  export class Token {
    public m_char: string;
    public m_inputChar: string;
    public m_position: number;
    public m_object: VrvObject | null;
    public m_treeObject: VrvObject | null;
    public m_isError: boolean;

    constructor(c: string, position: number, object: VrvObject | null = null) {
      this.m_char = c;
      this.m_inputChar = c;
      this.m_position = position;
      this.m_object = object;
      this.m_treeObject = null;
      this.m_isError = false;
    }

    public Is(classId: ClassId): boolean {
      return !!this.m_object && this.m_object.Is(classId);
    }

    public IsContainerEnd(): boolean {
      return !!this.m_object && this.m_char === CONTAINER_END;
    }

    public IsEnd(): boolean {
      return !this.m_object && this.m_char === CONTAINER_END;
    }

    public IsSpace(): boolean {
      return this.m_char === ' ';
    }

    public IsVoid(): boolean {
      return this.m_char === VOID;
    }

    public GetName(): string {
      if (!this.m_object) return '?';
      return this.m_object.GetClassName().toLowerCase();
    }

    public SetInTree(): void {
      this.m_treeObject = this.m_object;
      this.m_object = null;
    }

    /** Copy constructor equivalent (C++ copies tokens by value). */
    public Copy(): Token {
      const t = new Token(this.m_char, this.m_position, this.m_object);
      t.m_inputChar = this.m_inputChar;
      t.m_treeObject = this.m_treeObject;
      t.m_isError = this.m_isError;
      return t;
    }
  }
}

//----------------------------------------------------------------------------
// Error codes
//----------------------------------------------------------------------------

const enum PaeErrorCode {
  ERR_001_EMPTY,
  ERR_002_JSON_PARSE,
  ERR_003_JSON_KEY,
  ERR_004_KEY_SPACE,
  ERR_005_CLEF_SPACE,
  ERR_006_TIMESIG_SPACE,
  ERR_007_REP_EMPTY,
  ERR_008_REP_MARKER,
  ERR_009_REP_OPEN,
  ERR_010_REP_UNUSED,
  ERR_011_REP_NO_FIGURE,
  ERR_012_REP_NOT_BEGIN,
  ERR_013_REP_NO_CONTENT,
  ERR_014_REP_NO_BARLINE,
  ERR_015_MREST_INVALID,
  ERR_016_MREST_NUMBER,
  ERR_017_TRILL_INVALID,
  ERR_018_FERMATA_NESTED,
  ERR_019_ACCID_NO_NOTE,
  ERR_020_CHORD_NOTE_BEFORE,
  ERR_021_CHORD_NOTE_AFTER,
  ERR_022_BEAM_MENSURAL,
  ERR_023_BEAM_NESTED,
  ERR_024_BEAM_CLOSING,
  ERR_025_BEAM_OPEN,
  ERR_026_GRACE_NESTED,
  ERR_027_GRACE_CLOSING,
  ERR_028_GRACE_OPEN,
  ERR_029_GRACE_UNRESOLVED,
  ERR_030_GRACE_DURATION,
  ERR_031_GRACE_NO_NOTE,
  ERR_032_TUPLET_NESTED,
  ERR_033_TUPLET_CLOSING,
  ERR_034_TUPLET_NUM,
  ERR_035_TUPLET_OPEN,
  ERR_036_TUPLET_NUM_NUMBER,
  ERR_037_TIE_PITCH,
  ERR_038_TIE_OPEN,
  ERR_039_TIE_NO_NOTE,
  ERR_040_HIERARCHY_INVALID,
  ERR_041_NESTING_INVALID,
  ERR_042_CLEF_INCOMPLETE,
  ERR_043_CLEF_INVALID_2ND,
  ERR_044_CLEF_MENS,
  ERR_045_CLEF_INVALID_3RD,
  ERR_046_CLEF_INVALID,
  ERR_047_TIMESIG_INCOMPLETE,
  ERR_048_TIMESIG_INVALID,
  ERR_049_TIMESIG_MENS,
  ERR_050_INVALID_CHAR,
  ERR_051_BARLINE,
  ERR_052_DURATION,
  ERR_053_DURATION_MENS3,
  ERR_054_DURATION_MENS5,
  ERR_055_KEYSIG_CHANGE,
  ERR_056_TIMESIG_CHANGE,
  ERR_057_MENSUR_CHANGE,
  ERR_058_FERMATA_MREST,
  ERR_059_DOUBLE_DOTS_MENS,
  ERR_060_CLEF_MISSING,
  ERR_061_LIGATURE_NOTE_BEFORE,
  ERR_062_LIGATURE_NOTE_AFTER,
  ERR_063_LIGATURE_PITCH,
  ERR_064_LIGATURE_DURATION,
  ERR_065_MREST_INVALID_MEASURE,
  ERR_066_EMPTY_CONTAINER,
}

const s_errCodes: Record<number, string> = {
  [PaeErrorCode.ERR_001_EMPTY]: 'The input cannot be empty.',
  [PaeErrorCode.ERR_002_JSON_PARSE]: 'The JSON input could not be parsed.',
  [PaeErrorCode.ERR_003_JSON_KEY]: 'The JSON data key is missing.',
  [PaeErrorCode.ERR_004_KEY_SPACE]: 'The key signature must be preceded by a space or an @ character.',
  [PaeErrorCode.ERR_005_CLEF_SPACE]: 'The clef must be preceded by a space or an % character.',
  [PaeErrorCode.ERR_006_TIMESIG_SPACE]: 'The time signature must be preceded by a space or an @ character.',
  [PaeErrorCode.ERR_007_REP_EMPTY]: 'The repetition of a figure must contain at least one character.',
  [PaeErrorCode.ERR_008_REP_MARKER]: 'A repetition of a figure cannot be indicated with "f" within a figure.',
  [PaeErrorCode.ERR_009_REP_OPEN]: 'The repetition of a figure must be closed with "!" before the end of the measure.',
  [PaeErrorCode.ERR_010_REP_UNUSED]: 'The repeated figure is not repeated with "f".',
  [PaeErrorCode.ERR_011_REP_NO_FIGURE]: 'A repetition of a figure cannot be indicated with "f" without a figure before it.',
  [PaeErrorCode.ERR_012_REP_NOT_BEGIN]: 'A repetition of a measure must start at the beginning of a measure.',
  [PaeErrorCode.ERR_013_REP_NO_CONTENT]: 'A repetition of a measure cannot be empty.',
  [PaeErrorCode.ERR_014_REP_NO_BARLINE]: 'A repetition of a measure must be placed before a barline.',
  [PaeErrorCode.ERR_015_MREST_INVALID]: 'A multi-measure rest cannot be indicated with "=" more than once in a row.',
  [PaeErrorCode.ERR_016_MREST_NUMBER]: 'A number starting with 0 cannot indicate a multi-measure rest.',
  [PaeErrorCode.ERR_017_TRILL_INVALID]: 'A trill must be attached to a note or a rest.',
  [PaeErrorCode.ERR_018_FERMATA_NESTED]: 'A fermata cannot be indicated with "(" within a fermata.',
  [PaeErrorCode.ERR_019_ACCID_NO_NOTE]: 'An accidental must be followed by a note.',
  [PaeErrorCode.ERR_020_CHORD_NOTE_BEFORE]: 'A chord must be preceded by a note or a rest.',
  [PaeErrorCode.ERR_021_CHORD_NOTE_AFTER]: 'A chord must be followed by a note or a rest.',
  [PaeErrorCode.ERR_022_BEAM_MENSURAL]: 'Beams cannot be used with mensural notation.',
  [PaeErrorCode.ERR_023_BEAM_NESTED]: 'Beams cannot be nested, except in a beam of grace notes.',
  [PaeErrorCode.ERR_024_BEAM_CLOSING]: 'A closing beam "}" is present without an open beam "{" before it.',
  [PaeErrorCode.ERR_025_BEAM_OPEN]: 'The beam must be closed with "}" before the end of the measure.',
  [PaeErrorCode.ERR_026_GRACE_NESTED]: 'The appoggiatura must be closed with "r" before starting a new one.',
  [PaeErrorCode.ERR_027_GRACE_CLOSING]: "An extra 'r' is present to close an appoggiatura",
  [PaeErrorCode.ERR_028_GRACE_OPEN]: "The appoggiatura must be closed with 'r' before the end of the measure.",
  [PaeErrorCode.ERR_029_GRACE_UNRESOLVED]: "A grace note cannot be started with 'g' or 'q' before completing the previous one.",
  [PaeErrorCode.ERR_030_GRACE_DURATION]: "No rhythmic value can be entered when using an acciaccatura with 'g'.",
  [PaeErrorCode.ERR_031_GRACE_NO_NOTE]: "A grace note using 'g' or 'q' must be followed by a note.",
  [PaeErrorCode.ERR_032_TUPLET_NESTED]: 'A special rhythm group cannot be started with \'(\' before closing the previous one.',
  [PaeErrorCode.ERR_033_TUPLET_CLOSING]: "An extra ')' to close a special rhythm group is present.",
  [PaeErrorCode.ERR_034_TUPLET_NUM]: "A ';' is present outside of a special rhythm group.",
  [PaeErrorCode.ERR_035_TUPLET_OPEN]: "The special rhythm group or fermata must be closed with ')' before the end of the measure.",
  [PaeErrorCode.ERR_036_TUPLET_NUM_NUMBER]: "A number must appear between the ';' and ')' in the special rhythm group.",
  [PaeErrorCode.ERR_037_TIE_PITCH]: "A tie using '+' can only connect two notes of the same octave and pitch.",
  [PaeErrorCode.ERR_038_TIE_OPEN]: "A tie using '+' must be follow by a note.",
  [PaeErrorCode.ERR_039_TIE_NO_NOTE]: "A tie using '+' must be preceded by a note.",
  [PaeErrorCode.ERR_040_HIERARCHY_INVALID]: "The resulting hierachy of elements for '%s' is invalid.",
  [PaeErrorCode.ERR_041_NESTING_INVALID]: "The nesting of opening and closing tags for '%s' is invalid.",
  [PaeErrorCode.ERR_042_CLEF_INCOMPLETE]: 'The clef is not complete (Setting to G-2 if running in non-pedantic mode).',
  [PaeErrorCode.ERR_043_CLEF_INVALID_2ND]: "The second character in the clef sign must be either '+' or '-'.",
  [PaeErrorCode.ERR_044_CLEF_MENS]: 'Mensural and non-mensural clefs cannot be mixed.',
  [PaeErrorCode.ERR_045_CLEF_INVALID_3RD]: 'The third character in the clef sign must be a digit.',
  [PaeErrorCode.ERR_046_CLEF_INVALID]: "The clef '%s' is invalid.",
  [PaeErrorCode.ERR_047_TIMESIG_INCOMPLETE]: 'The time signature cannot be parsed (Setting to 4/4 if running in non-pedantic mode).',
  [PaeErrorCode.ERR_048_TIMESIG_INVALID]: "The time signature '%s' is invalid.",
  [PaeErrorCode.ERR_049_TIMESIG_MENS]: "The mensur sign content cannot be parsed (Setting to 'O' if running in non-pedantic mode).",
  [PaeErrorCode.ERR_050_INVALID_CHAR]: "The input contains one or more character(s) '%s'.",
  [PaeErrorCode.ERR_051_BARLINE]: "The barline '%s' is invalid.",
  [PaeErrorCode.ERR_052_DURATION]: 'The duration content cannot be parsed (Setting to quarter note if running in non-pedantic mode).',
  [PaeErrorCode.ERR_053_DURATION_MENS3]: "The duration cannot be '3' with mensural notation.",
  [PaeErrorCode.ERR_054_DURATION_MENS5]: "The duration cannot be '5' with mensural notation.",
  [PaeErrorCode.ERR_055_KEYSIG_CHANGE]: 'The key signature cannot be changed more than once in a measure.',
  [PaeErrorCode.ERR_056_TIMESIG_CHANGE]: 'The time signature cannot be changed more than once in a measure.',
  [PaeErrorCode.ERR_057_MENSUR_CHANGE]: 'The mensur sign cannot be changed more than once in a measure.',
  [PaeErrorCode.ERR_058_FERMATA_MREST]: "A fermata on measure rest with extra '%s' is invalid.",
  [PaeErrorCode.ERR_059_DOUBLE_DOTS_MENS]: 'Double-dotted notes are invalid with mensural notation.',
  [PaeErrorCode.ERR_060_CLEF_MISSING]: 'A clef is required.',
  [PaeErrorCode.ERR_061_LIGATURE_NOTE_BEFORE]: "To indicate a ligature, a '+' must be preceded by a note.",
  [PaeErrorCode.ERR_062_LIGATURE_NOTE_AFTER]: "To indicate a ligature, a '+' must be followed by a note.",
  [PaeErrorCode.ERR_063_LIGATURE_PITCH]: 'A ligature cannot have two consecutive notes with the same pitch.',
  [PaeErrorCode.ERR_064_LIGATURE_DURATION]: 'The duration in a ligature cannot be shorter than a semibreve.',
  [PaeErrorCode.ERR_065_MREST_INVALID_MEASURE]: 'A measure with a measure rest cannot include anything else.',
  [PaeErrorCode.ERR_066_EMPTY_CONTAINER]: 'A grace group or a beam cannot be empty.',
};

//----------------------------------------------------------------------------
// PAEInput
//----------------------------------------------------------------------------

export class PAEInput extends Input {
  private m_pae: pae.Token[] = [];
  private m_scoreBased = false;
  private m_pedanticMode = false;
  private m_isMensural = false;
  private m_hasErrors = false;
  private m_hasClef = false;
  private m_hasKeySig = false;
  private m_hasMeterSig = false;
  private m_hasMensur = false;
  private m_clef = new Clef();
  private m_keySig = new KeySig();
  private m_mensur = new Mensur();
  private m_meterSig = new MeterSig();
  private m_inputLog = new JsonxxObject();
  private m_keysigLog = new JsonxxObject();
  private m_clefLog = new JsonxxObject();
  private m_timesigLog = new JsonxxObject();
  private m_dataLog = new JsonxxArray();

  constructor(doc: Doc) {
    super(doc);
    this.m_scoreBased = false;
  }

  public SetScoreBased(scoreBased: boolean): void {
    this.m_scoreBased = scoreBased;
  }

  private get doc(): Doc { return this.m_doc as unknown as Doc; }

  public ClearTokenObjects(): void {
    // In TS the GC owns token objects; only drop references.
    this.m_pae = [];
  }

  public GetValidationLog(): JsonxxObject {
    const log = new JsonxxObject();
    // If we have an input error, that is the only one to log
    if (!this.m_inputLog.empty()) {
      return this.m_inputLog;
    }
    if (!this.m_keysigLog.empty()) log.append('keysig', this.m_keysigLog);
    if (!this.m_clefLog.empty()) log.append('clef', this.m_clefLog);
    if (!this.m_timesigLog.empty()) log.append('timesig', this.m_timesigLog);
    if (!this.m_dataLog.empty()) log.append('data', this.m_dataLog);
    return log;
  }

  private LogPAE(errCode: PaeErrorCode, token: pae.Token, value = ''): void {
    const logEntry = new JsonxxObject();
    // Row is always 0
    logEntry.append('row', 0);
    let column = 0;
    switch (token.m_position) {
      case KEYSIG_POS:
      case CLEF_POS:
      case TIMESIG_POS:
      case INPUT_POS: column = 0; break;
      // Putting -1 when the position is unknown - maybe this could cause problems for tools that use it?
      case UNKOWN_POS: column = -1; break;
      default: column = token.m_position;
    }
    logEntry.append('column', column);
    const msg = (value === '') ? s_errCodes[errCode] : StringFormat(s_errCodes[errCode], value);
    logEntry.append('text', msg);
    if (value !== '') {
      logEntry.append('value', value);
    }
    logEntry.append('code', errCode);
    // Input log entry are always and error, include in non-pedantic mode because parsing fails and stops
    const logType = (this.m_pedanticMode || token.m_position === INPUT_POS) ? 'error' : 'warning';
    logEntry.append('type', logType);

    switch (token.m_position) {
      case KEYSIG_POS: this.m_keysigLog = logEntry; break;
      case CLEF_POS: this.m_clefLog = logEntry; break;
      case TIMESIG_POS: this.m_timesigLog = logEntry; break;
      case INPUT_POS: this.m_inputLog = logEntry; break;
      // Other log entries go in the 'data' array
      default: this.m_dataLog.append(logEntry);
    }

    this.m_hasErrors = true;
    token.m_isError = true;
    let posStr: string;
    switch (token.m_position) {
      case KEYSIG_POS: posStr = '(keysig input key)'; break;
      case CLEF_POS: posStr = '(clef input key)'; break;
      case TIMESIG_POS: posStr = '(timesig input key)'; break;
      case INPUT_POS: posStr = '(global input error)'; break;
      case UNKOWN_POS: posStr = '(unspecified position)'; break;
      default: posStr = StringFormat('(character %d)', token.m_position);
    }
    const fullMsg = StringFormat('PAE: %s %s', msg, posStr);

    if (this.m_pedanticMode) {
      LogError(fullMsg);
    }
    else {
      LogWarning(fullMsg);
    }
  }

  private LogDebugTokens(vertical = false): void {
    // For long incipits or to see full class name
    if (vertical) {
      for (const token of this.m_pae) {
        const c1 = token.m_char ? token.m_char : ' ';
        const c2 = token.m_inputChar ? token.m_inputChar : ' ';
        let className = token.m_object ? token.m_object.GetClassName() : '';
        if (token.m_isError) className += ' <';
        LogDebug(' %c | %c | %s', c1, c2, className);
      }
    }
    else {
      let row = '';
      for (const token of this.m_pae) {
        row += token.m_inputChar ? token.m_inputChar : ' ';
      }
      LogDebug(row.replace(/%/g, '%%'));
      if (this.m_hasErrors) {
        row = '';
        for (const token of this.m_pae) {
          row += token.m_isError ? '^' : ' ';
        }
        LogDebug(row);
      }
      row = '';
      for (const token of this.m_pae) {
        row += token.m_object ? token.m_object.GetClassName().charAt(0) : ' ';
      }
      LogDebug(row);
      row = '';
      for (const token of this.m_pae) {
        row += token.m_char ? token.m_char : ' ';
      }
      LogDebug(row);
    }
  }

  private Is(token: pae.Token, map: string): boolean {
    return token.m_char !== NULL_CHAR && map.indexOf(token.m_char) !== -1;
  }

  private Was(token: pae.Token, map: string): boolean {
    return token.m_inputChar !== NULL_CHAR && map.indexOf(token.m_inputChar) !== -1;
  }

  private HasInput(inputChar: string): boolean {
    return this.m_pae.some((token) => token.m_inputChar === inputChar);
  }

  private AddToken(c: string, positionRef: { value: number }): void {
    this.m_pae.push(new pae.Token(c, positionRef.value));
    // Internal characters are used to replace double letters for easier processing
    // When we add them as token, we want to store the original letters and their position
    // This means converting the internal characters back and stored as m_inputChar
    // The second letter is also marked as pae::VOID so it can be skipped during parsing
    const back = this.m_pae[this.m_pae.length - 1];
    if (this.Is(back, INTERNAL_CHARS)) {
      // The position is incremented because these are actually input chars
      positionRef.value++;
      if (c === 'Q') {
        back.m_inputChar = 'q';
        this.m_pae.push(new pae.Token('q', positionRef.value));
      }
      if (c === 'X') {
        back.m_inputChar = 'x';
        this.m_pae.push(new pae.Token('x', positionRef.value));
      }
      if (c === 'Y') {
        back.m_inputChar = 'b';
        this.m_pae.push(new pae.Token('b', positionRef.value));
      }
      this.m_pae[this.m_pae.length - 1].m_char = VOID;
    }
  }

  private PrepareInsertion(position: number, insertion: pae.Token[]): void {
    for (const token of insertion) {
      token.m_position = position;
      if (token.m_object) {
        token.m_object = token.m_object.Clone();
      }
    }
  }

  private InputKeysToJson(inputKeys: string): JsonxxObject {
    const jsonInput = new JsonxxObject();

    for (const line of inputKeys.split('\n')) {
      if (line.startsWith('@clef:')) {
        jsonInput.append('clef', line.substring(line.indexOf(':') + 1));
      }
      else if (line.startsWith('@key:')) {
        jsonInput.append('key', line.substring(line.indexOf(':') + 1));
      }
      else if (line.startsWith('@keysig:')) {
        jsonInput.append('keysig', line.substring(line.indexOf(':') + 1));
      }
      else if (line.startsWith('@timesig:')) {
        jsonInput.append('timesig', line.substring(line.indexOf(':') + 1));
      }
      else if (line.startsWith('@data:')) {
        jsonInput.append('data', line.substring(line.indexOf(':') + 1));
      }
    }

    return jsonInput;
  }

  private SingleLineToJson(singleLine: string): JsonxxObject {
    const jsonInput = new JsonxxObject();

    const scoreDef = singleLine.substring(0, singleLine.indexOf(' ') === -1 ? undefined : singleLine.indexOf(' '));
    // We need at least a clef - something is missing
    if (scoreDef.length < 4) return jsonInput;

    // First detect the end of the scoreDef. Because we can have spaces between scoreDef elements,
    // we look for the first character after a space that is not a scoreDef element delimiter
    let scoreDefEnd = singleLine.length; // C++ find returns end() when no space found
    {
      let start = 0;
      while (true) {
        const idx = singleLine.indexOf(' ', start);
        if (idx === -1) break;
        scoreDefEnd = idx;
        const next: string = idx + 1 < singleLine.length ? singleLine[idx + 1] : '';
        // C++ condition (next != '@' || next != '$') is always true — breaks at the first space
        if ((next as string) !== '@' || (next as string) !== '$') break;
        start = idx + 1;
      }
    }

    // Extract the beginning of each scoreDef element and add flags indicating existence
    const keysigStart = singleLine.indexOf('$');
    const hasKeysig = keysigStart !== -1 && keysigStart < scoreDefEnd;
    const timesigStart = singleLine.indexOf('@');
    const hasTimesig = timesigStart !== -1 && timesigStart < scoreDefEnd;

    const clef = singleLine.substring(1, 4);

    let keysig = '';
    if (hasKeysig) {
      // The end is a space or the timesigStart if we have one that is placed after the keysig
      const keysigEnd = (hasTimesig && timesigStart > keysigStart) ? timesigStart
        : (singleLine.indexOf(' ', keysigStart) === -1 ? singleLine.length : singleLine.indexOf(' ', keysigStart));
      keysig = singleLine.substring(keysigStart + 1, keysigEnd);
    }

    let timesig = '';
    if (hasTimesig) {
      // The end is a space of the keysigStart if we have one that is placed after the timesig
      const timesigEnd = (hasKeysig && keysigStart > timesigStart) ? keysigStart
        : (singleLine.indexOf(' ', timesigStart) === -1 ? singleLine.length : singleLine.indexOf(' ', timesigStart));
      timesig = singleLine.substring(timesigStart + 1, timesigEnd);
    }

    // Extract the data - everything after the scoreDef
    const data = singleLine.substring(scoreDefEnd + 1);

    // erase(find_last_not_of(' ') + 1): trim trailing spaces (npos+1==0 → empty)
    const trimRight = (s: string): string => {
      const last = s.search(/[ ]*$/);
      return s.substring(0, last === -1 ? 0 : last);
    };

    jsonInput.append('clef', clef);
    jsonInput.append('timesig', trimRight(timesig));
    jsonInput.append('keysig', trimRight(keysig));
    jsonInput.append('data', data);

    return jsonInput;
  }

  private CheckPAEChars(input: string, invalidCharsRef: { value: string }, validChars = ''): boolean {
    invalidCharsRef.value = '';
    let status = true;
    for (const ch of input) {
      // Negative chars are impossible in JS strings (UTF-16 code units); the C++ ch < 0 branch is unreachable.
      const code = ch.charCodeAt(0);
      // Use the entire pae::PAEChars set unless we are testing against another one
      const invalid = (validChars === '')
        ? !(PAEChars[code] ?? 0)
        : (validChars.indexOf(ch) === -1);
      if (invalid) {
        invalidCharsRef.value += ch;
        status = false;
      }
    }
    return status;
  }

  public Import(input: string): boolean {
    this.ClearTokenObjects();

    this.m_inputLog.reset();
    this.m_keysigLog.reset();
    this.m_clefLog.reset();
    this.m_timesigLog.reset();
    this.m_dataLog.reset();

    this.m_hasErrors = false;

    if (input.length === 0) {
      const inputToken = new pae.Token(NULL_CHAR, INPUT_POS);
      this.LogPAE(PaeErrorCode.ERR_001_EMPTY, inputToken);
      return false;
    }

    const jsonInput = new JsonxxObject();
    if (input.charAt(0) === '{') {
      if (!jsonInput.parse(input)) {
        const inputToken = new pae.Token(NULL_CHAR, INPUT_POS);
        this.LogPAE(PaeErrorCode.ERR_002_JSON_PARSE, inputToken);
        return false;
      }
    }
    else if (input.charAt(0) === '%') {
      // singleLine variant replaces this object
      const parsed = this.SingleLineToJson(input);
      jsonInput.import('clef', (parsed.get('clef')));
      jsonInput.import('timesig', (parsed.get('timesig')));
      jsonInput.import('keysig', (parsed.get('keysig')));
      jsonInput.import('data', (parsed.get('data')));
    }
    else {
      const parsed = this.InputKeysToJson(input);
      for (const key of ['clef', 'key', 'keysig', 'timesig', 'data']) {
        if (parsed.has(key)) jsonInput.import(key, parsed.get(key));
      }
    }

    // Eventually this should be made a --pae-pedantic option
    this.m_pedanticMode = false;

    this.m_isMensural = false;

    this.m_hasClef = false;
    this.m_hasKeySig = false;
    this.m_hasMeterSig = false;
    this.m_hasMensur = false;

    this.doc.Reset();
    this.doc.SetType(DocType.Raw);

    // Generate the header and add a comment to the project description
    this.doc.GenerateMEIHeader();
    // pugi select_node("//projectDesc") — adapted to direct traversal (PgHead precedent)
    const meiHead = this.doc.m_header.first_child();
    if (!meiHead.empty()) {
      const projectDesc = meiHead.child('encodingDesc').child('projectDesc');
      if (!projectDesc.empty()) {
        const p1 = projectDesc.append_child('p');
        p1.text().set('Converted from Plaine and Easie to MEI');
      }
    }

    let success = true;

    if (jsonInput.has('x-header')) {
      const header = jsonInput.get('x-header') as unknown as JsonxxObject;
      this.ParseHeader(header);
    }

    let keySigStr = '';
    if (jsonInput.has('keysig')) keySigStr = jsonInput.get('keysig') as string;

    let clefStr = '';
    if (jsonInput.has('clef')) clefStr = jsonInput.get('clef') as string;

    let meterSigOrMensurStr = '';
    if (jsonInput.has('timesig')) meterSigOrMensurStr = jsonInput.get('timesig') as string;

    if (keySigStr !== '') {
      const staffDefToken = new pae.Token(NULL_CHAR, KEYSIG_POS);
      this.m_hasKeySig = true;
      if (success) success = this.ParseKeySig(this.m_keySig, keySigStr, staffDefToken);
    }

    if (clefStr !== '') {
      const staffDefToken = new pae.Token(NULL_CHAR, CLEF_POS);
      this.m_hasClef = true;
      const mensuralRef = { value: this.m_isMensural };
      if (success) success = this.ParseClef(this.m_clef, clefStr, staffDefToken, mensuralRef);
      this.m_isMensural = mensuralRef.value;
    }
    else {
      const staffDefToken = new pae.Token(NULL_CHAR, CLEF_POS);
      this.LogPAE(PaeErrorCode.ERR_060_CLEF_MISSING, staffDefToken);
      if (this.m_pedanticMode) {
        success = false;
      }
      else {
        this.m_hasClef = true;
        this.m_clef.SetLine(2);
        this.m_clef.SetShape(CLEFSHAPE_G);
        this.m_clef.SetEnclose(ENCLOSURE_brack);
      }
    }

    if (meterSigOrMensurStr !== '') {
      const staffDefToken = new pae.Token(NULL_CHAR, TIMESIG_POS);
      if (this.m_isMensural) {
        this.m_hasMensur = true;
        if (success) success = this.ParseMensur(this.m_mensur, meterSigOrMensurStr, staffDefToken);
      }
      else {
        this.m_hasMeterSig = true;
        if (success) success = this.ParseMeterSig(this.m_meterSig, meterSigOrMensurStr, staffDefToken);
      }
    }

    // Something went wrong when parsing the scoreDef clef / keySig / mensur / meterSig
    if (!success) return false;

    // No data - we can stop here
    if (!jsonInput.has('data')) {
      const inputToken = new pae.Token(NULL_CHAR, INPUT_POS);
      this.LogPAE(PaeErrorCode.ERR_003_JSON_KEY, inputToken);
      return false;
    }

    let data = jsonInput.get('data') as string;

    const invalidChars = { value: '' };
    if (!this.CheckPAEChars(data, invalidChars)) {
      const inputToken = new pae.Token(NULL_CHAR, UNKOWN_POS);
      this.LogPAE(PaeErrorCode.ERR_050_INVALID_CHAR, inputToken, invalidChars.value);
      if (this.m_pedanticMode) return false;
    }

    // Add a measure at the beginning of the data because there is always at least one measure
    const measure = new Measure(MeasureType.MEASURED, 1);
    // By default there is no end barline on an incipit
    measure.SetRight(BARRENDITION_invis);
    this.m_pae.push(new pae.Token(NULL_CHAR, UNKOWN_POS, measure));

    // Remove non PAE internal characters
    for (const c of INTERNAL_CHARS) {
      data = data.split(c).join('');
    }

    data = data.replace(/qq/g, 'Q');
    data = data.replace(/xx/g, 'X');
    data = data.replace(/bb/g, 'Y');

    const positionRef = { value: 0 };
    for (const c of data) {
      // Ignore the character that is used internally as container end Token
      if (c === CONTAINER_END) continue;
      // Otherwise go ahead
      this.AddToken(c, positionRef);
      positionRef.value++;
    }

    // Add a token marking the end - special use of the CONTAINER_END with no object
    // See pae::Token::IsEnd();
    this.m_pae.push(new pae.Token(CONTAINER_END, UNKOWN_POS));

    return this.Parse();
  }

  private Parse(): boolean {
    let success = true;

    if (success) success = this.ConvertKeySig();
    if (success) success = this.ConvertClef();
    if (success) success = this.ConvertMeterSigOrMensur();
    if (success) success = this.ConvertMeasure();
    if (success) success = this.ConvertRepeatedFigure();
    if (success) success = this.ConvertRepeatedMeasure();
    if (success) success = this.ConvertMRestOrMultiRest();
    if (success) success = this.ConvertRest();
    if (success) success = this.ConvertPitch();
    if (success) success = this.ConvertOctave();
    if (success) success = this.ConvertTrill();
    if (success) success = this.ConvertFermata();
    if (success) success = this.ConvertAccidental();
    if (success) success = this.ConvertChord();
    if (success) success = this.ConvertBeam();
    if (success) success = this.ConvertGraceGrp();
    if (success) success = this.ConvertGrace();
    if (success) success = this.ConvertTuplet();
    if (success) success = this.ConvertDuration();
    if (success) success = this.ConvertTie();
    if (success) success = this.ConvertLigature();
    if (success) success = this.ConvertAccidGes();
    if (success) success = this.CheckContentPreBuild();
    if (success) success = this.CheckHierarchy();

    if (this.m_pedanticMode && !success) {
      this.ClearTokenObjects();
      return false;
    }

    // Set the notation type
    if (this.m_isMensural) (this.doc as unknown as { m_notationType: number }).m_notationType = NOTATIONTYPE_mensural;
    // The mdiv
    const mdiv = new Mdiv();
    mdiv.SetVisibility(1 /* Visible */);
    this.doc.AddChild(mdiv);
    // The score
    const score = new Score();
    mdiv.AddChild(score);
    // the section
    const section = new Section();
    score.AddChild(section);

    // add minimal scoreDef
    const staffGrp = new StaffGrp();
    const staffDef = new StaffDef();
    staffDef.SetN(1);
    staffDef.SetLines(5);
    staffGrp.AddChild(staffDef);
    (score.GetScoreDef() as unknown as ScoreDef).AddChild(staffGrp);

    if (this.m_isMensural) {
      staffDef.SetNotationtype(NOTATIONTYPE_mensural);
    }
    if (this.m_hasClef) {
      // Make it an attribute for now
      this.m_clef.SetAttribute(true);
      staffDef.AddChild(this.m_clef.Clone());
    }
    if (this.m_hasKeySig) {
      (score.GetScoreDef() as unknown as ScoreDef).AddChild(this.m_keySig.Clone());
    }
    if (this.m_hasMeterSig) {
      // Make it an attribute for now
      this.m_meterSig.SetAttribute(true);
      (score.GetScoreDef() as unknown as ScoreDef).AddChild(this.m_meterSig.Clone());
    }
    if (this.m_hasMensur) {
      // Make it an attribute for now
      this.m_mensur.SetAttribute(true);
      (score.GetScoreDef() as unknown as ScoreDef).AddChild(this.m_mensur.Clone());
    }

    // A stack to which layer element are added. At least a Layer, but then Beam, GraceGrp, Chord, etc.
    const layerElementContainers: VrvObject[] = [];
    // If we have a meterSig or a keySig change, we will add a new ScoreDef before the current measure
    let scoreDefChange: ScoreDef | null = null;
    // The current measure, used to know where to add a scoreDef change
    let currentMeasure: Measure | null = null;
    // The current meterSig, used to calculate the tstamp2 for open ties
    let currentMeterSig: MeterSig = this.m_meterSig;

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      // Double check that we don't have more than the layer on the layerStack
      if (token.IsEnd()) {
        if (layerElementContainers.length > 1) {
          LogDebug('The layer element container stack should not have more than one element');
        }
        continue;
      }

      // No object to add to the doc - we should also have no char left
      if (!token.m_object) {
        if (token.m_char !== NULL_CHAR) LogDebug("Remaining unprocessed char '%c'", token.m_char);
        continue;
      }

      // Every time we have a Measure, we need to add it to the section and fill it with a Staff and Layer
      if (token.Is(ClassId.MEASURE)) {
        currentMeasure = token.m_object as Measure;
        token.SetInTree();

        section.AddChild(currentMeasure);
        const staff = new Staff(1);
        currentMeasure.AddChild(staff);
        const layer = new Layer();
        layer.SetN(1);
        staff.AddChild(layer);
        // Clear the layer element container stack (only max 1 should be left) and the new layer
        if (layerElementContainers.length > 1) {
          LogDebug('The layer element container stack should not have more than one element');
        }
        layerElementContainers.length = 0;
        layerElementContainers.push(layer);
        // Reset the scoreDefChange pointer - a new one will be created if necessary
        scoreDefChange = null;
      }
      // Place the keySig, mensur or meterSig to the scoreDefChange - create it if necessary
      else if (token.m_object.IsAnyOf([ClassId.KEYSIG, ClassId.MENSUR, ClassId.METERSIG])) {
        if (!scoreDefChange) {
          scoreDefChange = new ScoreDef();
          if (!currentMeasure) throw new Error('PAEInput::Parse: scoreDefChange without current measure');
          section.InsertBefore(currentMeasure, scoreDefChange);
        }
        // For now ignore additional changes - not sure how these should be handled in MEI anyway
        if (scoreDefChange.FindDescendantByType(token.m_object.GetClassId())) {
          switch (token.m_object.GetClassId()) {
            case ClassId.KEYSIG: this.LogPAE(PaeErrorCode.ERR_055_KEYSIG_CHANGE, token); break;
            case ClassId.METERSIG: this.LogPAE(PaeErrorCode.ERR_056_TIMESIG_CHANGE, token); break;
            default: this.LogPAE(PaeErrorCode.ERR_057_MENSUR_CHANGE, token);
          }
          if (this.m_pedanticMode) return false;
          // C++ deletes the object; TS drops the reference (GC-owned).
          token.m_object = null;
        }
        else {
          scoreDefChange.AddChild(token.m_object);
          // For the meterSig and mensur, we can have them as attribute. KeySig not because of the enclose
          // attributes
          if (token.m_object.IsAnyOf([ClassId.MENSUR, ClassId.METERSIG])) {
            token.m_object.SetAttribute(true);
            if (token.m_object.Is(ClassId.METERSIG)) {
              currentMeterSig = token.m_object as MeterSig;
            }
          }
        }
        // Objects are owned by the scoreDef
        token.SetInTree();
        continue;
      }
      else if (token.m_object.IsLayerElement()) {
        const element = token.m_object;
        // The object is either a container end, or will be added to the layerElementContainers.back()
        token.SetInTree();

        // For a container end, no object to add to the doc.
        if (token.m_char === CONTAINER_END) {
          // Do check that we still have more than the layer before popping it from the stack
          if (layerElementContainers.length < 2) {
            LogDebug('The layer element container stack should have at least two elements');
            continue;
          }
          // Also double check that the open / close element is actually the same
          if (layerElementContainers[layerElementContainers.length - 1] !== element) {
            LogDebug('The layer element container stack top and the container end should match');
          }
          // Simply pop it and continue
          layerElementContainers.pop();
          continue;
        }

        // Something went really wrong... Still drop the element reference to avoid a leak
        if (layerElementContainers.length === 0) {
          LogDebug('The layer element container stack should have at least one element');
          token.m_object = null;
          continue;
        }
        layerElementContainers[layerElementContainers.length - 1].AddChild(element);

        // Add to the stack the layer element that are containers
        if (element.IsAnyOf([ClassId.BEAM, ClassId.CHORD, ClassId.GRACEGRP, ClassId.LIGATURE, ClassId.TUPLET])) {
          layerElementContainers.push(element);
        }
      }
      else if (token.m_object.IsControlElement()) {
        if (!currentMeasure) throw new Error('PAEInput::Parse: control element without current measure');
        currentMeasure.AddChild(token.m_object);
        // Find open ties
        if (token.m_object.Is(ClassId.TIE)) {
          const tie = token.m_object as unknown as Tie;
          if (!tie.HasEndid()) {
            const tstamp2 = currentMeterSig.GetTotalCount() + 1;
            tie.SetTstamp2([0, tstamp2]);
          }
        }
        token.SetInTree();
      }
    }

    this.CheckContentPostBuild();

    this.LogDebugTokens();

    // We should have no object left, just in case they need to be deleted.
    this.ClearTokenObjects();

    if (!this.m_scoreBased) this.doc.ConvertToPageBasedDoc();

    return success;
  }

  private ConvertKeySig(): boolean {
    let keySigToken: pae.Token | null = null;
    let paeStr = '';

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.m_char === KEYSIG_START) {
        keySigToken = token;
        paeStr = '';
      }
      else if (keySigToken) {
        if (this.Is(token, KEYSIG)) {
          paeStr += token.m_char;
          token.m_char = NULL_CHAR;
          continue;
        }
        if (!token.IsEnd() && !token.IsSpace()) {
          this.LogPAE(PaeErrorCode.ERR_004_KEY_SPACE, token);
          if (this.m_pedanticMode) return false;
        }
        else {
          token.m_char = NULL_CHAR;
        }
        keySigToken.m_char = NULL_CHAR;
        const keySig = new KeySig();
        keySigToken.m_object = keySig;
        // Will fail in pedantic mode
        if (!this.ParseKeySig(keySig, paeStr, keySigToken)) return false;
        keySigToken = null;
      }
    }

    return true;
  }

  private ParseHeader(header: JsonxxObject): void {
    // Get the nodes for elements that have to be already in the header
    // pugi select_node("//fileDesc") — adapted to direct traversal
    const meiHead = this.doc.m_header.first_child();
    if (meiHead.empty()) return;
    const fileDesc = meiHead.child('fileDesc');
    if (fileDesc.empty()) return;

    const titleStmt = fileDesc.child('titleStmt');
    if (titleStmt.empty()) return;

    const pubStmt = fileDesc.child('pubStmt');
    if (pubStmt.empty()) return;

    // normally the header already has an empty title - add if missing
    let title = titleStmt.child('title');
    if (title.empty()) title = titleStmt.append_child('title');

    if (header.has('source_title')) {
      title.text().set(header.get('source_title') as string);
    }

    if (header.has('title')) {
      const subTitle = titleStmt.append_child('title');
      subTitle.append_attribute('type').set_value('subordinate');
      subTitle.text().set(header.get('title') as string);
      if (header.has('movement')) {
        subTitle.append_attribute('label').set_value(header.get('movement') as string);
      }
    }

    if (header.has('composer')) {
      const composer = titleStmt.append_child('composer');
      composer.text().set(header.get('composer') as string);
    }

    if (header.has('source_url') || header.has('download_url')) {
      const identifier = pubStmt.append_child('identifier');
      if (header.has('source_url')) {
        const ptr = identifier.append_child('ptr');
        ptr.append_attribute('type').set_value('rism:Source');
        ptr.append_attribute('target').set_value(header.get('source_url') as string);
      }
      if (header.has('download_url')) {
        const ptr = identifier.append_child('ptr');
        ptr.append_attribute('type').set_value('rism:Incipit');
        ptr.append_attribute('target').set_value(header.get('download_url') as string);
      }
    }

    if (header.has('notes')) {
      const notesStmt = fileDesc.append_child('notesStmt');
      const array = header.get('notes') as unknown as JsonxxArray;
      for (let i = 0; i < array.size(); ++i) {
        const annot = notesStmt.append_child('annot');
        annot.text().set(array.get(i) as string);
      }
    }

    // Typo "voice_intrument" preserved from the C++ source
    let hasIncip = false;
    for (const key of ['scoring', 'key_mode', 'role', 'voice_intrument']) {
      hasIncip = hasIncip || header.has(key);
    }
    if (hasIncip) {
      const workList = meiHead.append_child('workList');
      const work = workList.append_child('work');
      const title2 = work.append_child('title');
      if (header.has('title')) {
        title2.text().set(header.get('title') as string);
      }
      const incip = work.append_child('incip');
      if (header.has('role')) {
        incip.append_child('role').text().set(header.get('role') as string);
      }
      if (header.has('scoring') || header.has('voice_intrument')) {
        const perfResList = incip.append_child('perfResList');
        if (header.has('voice_instrument')) {
          perfResList.append_child('perfRes').text().set(header.get('voice_instrument') as string);
        }
        if (header.has('scoring')) {
          perfResList.append_child('perfRes').text().set(header.get('scoring') as string);
        }
      }
      if (header.has('key_mode')) {
        incip.append_child('key').text().set(header.get('key_mode') as string);
      }
      if (header.has('text_incipits')) {
        const incipText = incip.append_child('incipText');
        const array = header.get('text_incipits') as unknown as JsonxxArray;
        for (let i = 0; i < array.size(); ++i) {
          const p = incipText.append_child('p');
          p.text().set(array.get(i) as string);
        }
      }
    }
  }

  private ConvertClef(): boolean {
    let clefToken: pae.Token | null = null;
    let paeStr = '';

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.m_char === CLEF_START) {
        clefToken = token;
        paeStr = '';
      }
      else if (clefToken) {
        if (this.Is(token, CLEF)) {
          paeStr += token.m_char;
          token.m_char = NULL_CHAR;
          continue;
        }
        if (!token.IsEnd() && !token.IsSpace()) {
          this.LogPAE(PaeErrorCode.ERR_005_CLEF_SPACE, token);
          if (this.m_pedanticMode) return false;
        }
        else {
          token.m_char = NULL_CHAR;
        }
        clefToken.m_char = NULL_CHAR;
        const clef = new Clef();
        clefToken.m_object = clef;
        // Will fail in pedantic mode
        const mensuralRef = { value: this.m_isMensural };
        if (!this.ParseClef(clef, paeStr, clefToken, mensuralRef)) return false;
        clefToken = null;
      }
    }

    return true;
  }

  private ConvertMeterSigOrMensur(): boolean {
    let meterSigOrMensurToken: pae.Token | null = null;
    let paeStr = '';

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.m_char === METERSIG_START) {
        meterSigOrMensurToken = token;
        paeStr = '';
      }
      else if (meterSigOrMensurToken) {
        if (this.Is(token, METERSIG)) {
          paeStr += token.m_char;
          token.m_char = NULL_CHAR;
          continue;
        }
        if (!token.IsEnd() && !token.IsSpace()) {
          this.LogPAE(PaeErrorCode.ERR_006_TIMESIG_SPACE, token);
          if (this.m_pedanticMode) return false;
        }
        else {
          token.m_char = NULL_CHAR;
        }
        meterSigOrMensurToken.m_char = NULL_CHAR;
        if (this.m_isMensural) {
          const mensur = new Mensur();
          meterSigOrMensurToken.m_object = mensur;
          // Will fail in pedantic mode
          if (!this.ParseMensur(mensur, paeStr, meterSigOrMensurToken)) return false;
        }
        else {
          const meterSig = new MeterSig();
          meterSigOrMensurToken.m_object = meterSig;
          // Will fail in pedantic mode
          if (!this.ParseMeterSig(meterSig, paeStr, meterSigOrMensurToken)) return false;
        }
        meterSigOrMensurToken = null;
      }
    }

    return true;
  }

  private ConvertMeasure(): boolean {
    let currentMeasure: Measure | null = null;
    let measureToken: pae.Token | null = null;
    let paeStr = '';
    // measureCount is currently ignored by the Measure constructor
    let measureCount = 1;

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      // This is the first (default) measure added to the tokens in Import
      if (token.Is(ClassId.MEASURE)) {
        currentMeasure = token.m_object as Measure;
      }
      if (this.Is(token, MEASURE)) {
        if (!measureToken) {
          measureToken = token;
        }
        paeStr += token.m_char;
        token.m_char = NULL_CHAR;
      }
      else if (measureToken) {
        // assert(currentMeasure) from C++ — a measure token must have been seen
        if (!currentMeasure) throw new Error('PAEInput::ConvertMeasure: missing current measure');
        // When reaching a barline, we need to set it to the previous measure (@right)
        if (!this.ParseMeasure(currentMeasure, paeStr, measureToken)) return false;
        // We can now create a new measure but not if we have reached the end of the data
        if (!token.IsEnd()) {
          measureCount++;
          const measure = new Measure(MeasureType.MEASURED, measureCount);
          measure.SetRight(BARRENDITION_invis);
          measureToken.m_object = measure;
        }
        measureToken = null;
        paeStr = '';
      }
    }

    return true;
  }

  private ConvertRepeatedFigure(): boolean {
    if (!this.HasInput('!')) return true;

    // A status flag indicating that we are in figure of in a repetition of a figure
    let status: status_FIGURE = status_FIGURE.FIGURE_NONE;
    // The figure that will be repeated and to which we copy tokens
    const figure: pae.Token[] = [];
    // A pointer to the beginning of the figure (for debugging purposes)
    let figureToken: pae.Token | null = null;

    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      // We are within a figure to be repeated
      if (status === status_FIGURE.FIGURE_START) {
        // This is the end of the figure
        if (token.m_char === '!') {
          // The list should not be empty
          if (figure.length === 0) {
            this.LogPAE(PaeErrorCode.ERR_007_REP_EMPTY, token);
            if (this.m_pedanticMode) return false;
          }
          token.m_char = NULL_CHAR;
          status = status_FIGURE.FIGURE_END;
        }
        // We should not have a repeat sign before the end
        else if (token.m_char === 'f') {
          this.LogPAE(PaeErrorCode.ERR_008_REP_MARKER, token);
          if (this.m_pedanticMode) return false;
          token.m_char = NULL_CHAR;
        }
        // We should not reach the end or the end of a measure
        else if (token.IsEnd() || token.Is(ClassId.MEASURE)) {
          this.LogPAE(PaeErrorCode.ERR_009_REP_OPEN, token);
          if (this.m_pedanticMode) return false;
          figure.length = 0;
          status = status_FIGURE.FIGURE_NONE;
          figureToken = null;
        }
        // All good - add it to the figure
        else {
          figure.push(token.Copy());
        }
      }
      // We are starting a new figure to be repeated
      else if (token.m_char === '!') {
        token.m_char = NULL_CHAR;
        figureToken = token;
        figure.length = 0;
        status = status_FIGURE.FIGURE_START;
      }
      // We have completed a figure and will be repeating it
      else if (status === status_FIGURE.FIGURE_END || status === (status_FIGURE.FIGURE_REPEAT as status_FIGURE)) {
        // Repeat the figure. That is simply add it to the map
        if (token.m_char === 'f') {
          token.m_char = NULL_CHAR;
          // Set position and clone objects
          this.PrepareInsertion(token.m_position, figure);
          // C++: ++token; insert(token, ...); --token; → next processed is the token after the figure
          this.m_pae.splice(i + 1, 0, ...figure);
          i += figure.length + 1;
          status = status_FIGURE.FIGURE_REPEAT;
          continue;
        }
        // End of repetitions
        else {
          // Make sure we repeated the figure at least once (is this too pedantic?)
          if (status === status_FIGURE.FIGURE_END) {
            this.LogPAE(PaeErrorCode.ERR_010_REP_UNUSED, figureToken!);
            if (this.m_pedanticMode) return false;
          }
          status = status_FIGURE.FIGURE_NONE;
          figureToken = null;
          figure.length = 0;
        }
      }
      // We should not have a repeat sign not after a figure end
      else if (token.m_char === 'f') {
        this.LogPAE(PaeErrorCode.ERR_011_REP_NO_FIGURE, token);
        if (this.m_pedanticMode) return false;
        // ignore it
        token.m_char = NULL_CHAR;
      }
      ++i;
    }

    return true;
  }

  private ConvertRepeatedMeasure(): boolean {
    if (!this.HasInput('i')) return true;

    // The measure that will be repeated and to which we copy tokens
    const measure: pae.Token[] = [];
    let measureStart = false;
    let repeat = false;

    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      if (token.Is(ClassId.MEASURE)) {
        measureStart = true;
        repeat = false;
      }
      else if (token.m_char === 'i') {
        token.m_char = NULL_CHAR;
        if (!measureStart) {
          this.LogPAE(PaeErrorCode.ERR_012_REP_NOT_BEGIN, token);
          if (this.m_pedanticMode) return false;
        }
        else if (measure.length === 0) {
          this.LogPAE(PaeErrorCode.ERR_013_REP_NO_CONTENT, token);
          if (this.m_pedanticMode) return false;
        }
        else {
          // Set position and clone objects
          this.PrepareInsertion(token.m_position, measure);
          // C++: ++token; insert(token, ...); --token; → next processed is the token after the measure
          this.m_pae.splice(i + 1, 0, ...measure);
          i += measure.length + 1;
          continue;
        }
      }
      // Something else
      else if (!this.Was(token, MEASURE) && !token.IsEnd()) {
        // We had a i in the current measure, we should have nothing else
        if (repeat) {
          this.LogPAE(PaeErrorCode.ERR_014_REP_NO_BARLINE, token);
          if (this.m_pedanticMode) return false;
        }
        // We did not, this is content that will potentially be repeated
        else if (measureStart) {
          // This is the first token in the measure, clear the previous one
          measure.length = 0;
          measureStart = false;
        }
        measure.push(token.Copy());
      }
      ++i;
    }

    return true;
  }

  private ConvertMRestOrMultiRest(): boolean {
    let mRestOrMultiRestToken: pae.Token | null = null;
    let paeStr = '';

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.m_char === '=') {
        if (mRestOrMultiRestToken) {
          this.LogPAE(PaeErrorCode.ERR_015_MREST_INVALID, token);
          if (this.m_pedanticMode) return false;
        }
        mRestOrMultiRestToken = token;
        token.m_char = NULL_CHAR;
      }
      else if (mRestOrMultiRestToken) {
        if (token.m_char >= '0' && token.m_char <= '9') {
          paeStr += token.m_char;
          token.m_char = NULL_CHAR;
        }
        else {
          if (paeStr.length > 0 && paeStr.charAt(0) === '0') {
            this.LogPAE(PaeErrorCode.ERR_016_MREST_NUMBER, token);
            if (this.m_pedanticMode) return false;
            // erase(0, find_first_not_of('0'))
            const firstNonZero = paeStr.search(/[^0]/);
            paeStr = firstNonZero === -1 ? '' : paeStr.substring(firstNonZero);
          }
          if (paeStr.length === 0 || paeStr === '1') {
            mRestOrMultiRestToken.m_object = new MRest();
          }
          else {
            const multiRest = new MultiRest();
            multiRest.SetNum(parseInt(paeStr, 10));
            mRestOrMultiRestToken.m_object = multiRest;
          }
          mRestOrMultiRestToken = null;
          paeStr = '';
        }
      }
    }

    return true;
  }

  private ConvertPitch(): boolean {
    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (this.Is(token, NOTENAME)) {
        const note = new Note();
        let pitch = PITCHNAME_c;
        switch (token.m_char) {
          case 'A': pitch = PITCHNAME_a; break;
          case 'B': pitch = PITCHNAME_b; break;
          case 'C': pitch = PITCHNAME_c; break;
          case 'D': pitch = PITCHNAME_d; break;
          case 'E': pitch = PITCHNAME_e; break;
          case 'F': pitch = PITCHNAME_f; break;
          case 'G': pitch = PITCHNAME_g; break;
          default: break;
        }
        note.SetPname(pitch);
        token.m_object = note;
        token.m_char = NULL_CHAR;
      }
    }

    return true;
  }

  private ConvertOctave(): boolean {
    const OCTAVEUP = "'";
    const OCTAVEDOWN = ',';

    let oct = 4;
    let readingOct = '';

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.m_char === OCTAVEUP) {
        // Init to 4 when starting to read octave '
        if (readingOct !== OCTAVEUP) {
          oct = 4;
          readingOct = OCTAVEUP;
        }
        else {
          oct++;
        }
        token.m_char = NULL_CHAR;
      }
      else if (token.m_char === OCTAVEDOWN) {
        // Init to 3 when starting to read octave ,
        if (readingOct !== OCTAVEDOWN) {
          oct = 3;
          readingOct = OCTAVEDOWN;
        }
        else {
          oct--;
        }
        token.m_char = NULL_CHAR;
      }
      else {
        // We are not reading octave signs anymore
        readingOct = '';
      }

      // Simply set it to the notes
      if (token.Is(ClassId.NOTE)) {
        const note = token.m_object as Note;
        note.SetOct(oct);
      }
    }

    return true;
  }

  private ConvertTrill(): boolean {
    let note: VrvObject | null = null;

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      // Keep a pointer and simply continue
      if (token.Is(ClassId.NOTE)) {
        note = token.m_object;
        continue;
      }
      if (token.m_char === 't') {
        token.m_char = NULL_CHAR;
        if (note) {
          const trill = new Trill();
          trill.GetTimeSpanningInterface().SetStartid('#' + note.GetID());
          token.m_object = trill;
        }
        else {
          this.LogPAE(PaeErrorCode.ERR_017_TRILL_INVALID, token);
          if (this.m_pedanticMode) return false;
        }
        note = null;
        continue;
      }
      // A trill can be placed after the closing fermata ) or after a tie +
      if (note && (token.m_char === ')' || token.m_char === '+')) {
        continue;
      }
      // Anything else that is not a fermata or tie means that a previous note is no longer a target
      else {
        note = null;
      }
    }

    return true;
  }

  private ConvertFermata(): boolean {
    let fermataToken: pae.Token | null = null;
    let fermataTarget: VrvObject | null = null;

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.m_char === '(') {
        // Weird case - could be a
        if (fermataToken) {
          this.LogPAE(PaeErrorCode.ERR_018_FERMATA_NESTED, token);
          if (this.m_pedanticMode) return false;
        }
        fermataToken = token;
      }
      else if (fermataToken) {
        // We have an open fermata sign but have not reached a fermata target
        if (!fermataTarget) {
          if (token.m_object && token.m_object.IsAnyOf([ClassId.MREST, ClassId.NOTE, ClassId.REST])) {
            fermataTarget = token.m_object;
            continue;
          }
          // We still allow duration, accidental or octave markers within a fermata ()
          else if (!this.Is(token, DURATION_CHARS) && this.Is(token, ACCIDENTAL_INTERNAL)
            && this.Was(token, "',")) {
            // This was probably not a fermata sign but a tuplet one
            fermataToken = null;
            continue;
          }
        }
        else {
          if (token.m_char === ')') {
            const fermata = new Fermata();
            fermataToken.m_object = fermata;
            fermata.SetStartid('#' + fermataTarget.GetID());
            fermataToken.m_char = NULL_CHAR;
            token.m_char = NULL_CHAR;
            fermataToken = null;
            fermataTarget = null;
          }
          // A trill before the closing fermata ) is valid
          else if (fermataTarget.Is(ClassId.NOTE) && token.Is(ClassId.TRILL)) {
            continue;
          }
          // PAE guidelines are ambiguous because they say fermata should contain only a single rest sign (=)
          // but at the same time allow =1 for a mrest - in non pendantic mode we want to support (=1)
          else if (fermataTarget.Is(ClassId.MREST) && token.m_inputChar >= '0' && token.m_inputChar <= '9') {
            this.LogPAE(PaeErrorCode.ERR_058_FERMATA_MREST, token, StringFormat('%c', token.m_inputChar));
            if (this.m_pedanticMode) return false;
            continue;
          }
          else {
            // Leave everything as is - the ( could be a tuplet start
            fermataToken = null;
            fermataTarget = null;
          }
        }
      }
    }

    return true;
  }

  private ConvertAccidental(): boolean {
    let accidental = ACCIDENTAL_WRITTEN_NONE;

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (this.Is(token, ACCIDENTAL_INTERNAL)) {
        switch (token.m_char) {
          case 'x': accidental = ACCIDENTAL_WRITTEN_s; break;
          case 'b': accidental = ACCIDENTAL_WRITTEN_f; break;
          case 'n': accidental = ACCIDENTAL_WRITTEN_n; break;
          case 'X': accidental = ACCIDENTAL_WRITTEN_x; break;
          case 'Y': accidental = ACCIDENTAL_WRITTEN_ff; break;
          default: break;
        }
        token.m_char = NULL_CHAR;
      }
      else if (accidental !== ACCIDENTAL_WRITTEN_NONE) {
        if (token.Is(ClassId.NOTE)) {
          const note = token.m_object as Note;
          const accid = new Accid();
          accid.SetAccid(accidental);
          note.AddChild(accid);
          accidental = ACCIDENTAL_WRITTEN_NONE;
        }
        // The note has a fermata, one more step to get it
        else if (token.Is(ClassId.FERMATA)) {
          continue;
        }
        else {
          this.LogPAE(PaeErrorCode.ERR_019_ACCID_NO_NOTE, token);
          if (this.m_pedanticMode) return false;
          accidental = ACCIDENTAL_WRITTEN_NONE;
        }
      }
    }
    return true;
  }

  private ConvertRest(): boolean {
    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.m_char === '-') {
        token.m_object = new Rest();
        token.m_char = NULL_CHAR;
      }
    }

    return true;
  }

  private ConvertChord(): boolean {
    if (!this.HasInput('^')) return true;

    // A flag for the chord status NONE|MARKER|NOTE
    let status = status_CHORD.CHORD_NONE;
    // The index of the last note that can become the first note of a chord (-1 == m_pae.end())
    let noteIdx = -1;

    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      // We encounter a chord marker - change the status if we have a note previously
      if (token.m_char === '^') {
        token.m_char = NULL_CHAR;
        if (noteIdx === -1) {
          this.LogPAE(PaeErrorCode.ERR_020_CHORD_NOTE_BEFORE, token);
          if (this.m_pedanticMode) return false;
        }
        else {
          status = status_CHORD.CHORD_MARKER;
        }
        ++i;
        continue;
      }

      // We expect a note
      if (status === status_CHORD.CHORD_MARKER) {
        // If we have a note, we change the status - we will be able to decide to close the chord on the next token
        if (token.Is(ClassId.NOTE)) {
          status = status_CHORD.CHORD_NOTE;
        }
        // After a marker, we should allow octave or accidental markers, but nothing else
        else if (!this.Was(token, ACCIDENTAL_INTERNAL) && !this.Was(token, "',")) {
          this.LogPAE(PaeErrorCode.ERR_021_CHORD_NOTE_AFTER, token);
          if (this.m_pedanticMode) return false;
          status = status_CHORD.CHORD_NONE;
          noteIdx = -1;
        }
        ++i;
        continue;
      }

      // We passed the last note of the chord - create it
      if (status === status_CHORD.CHORD_NOTE) {
        const chord = new Chord();
        // m_pae.insert(note, ...) — insert before the note index, then before the current token
        this.m_pae.splice(noteIdx, 0, new pae.Token(NULL_CHAR, UNKOWN_POS, chord));
        noteIdx++; // account for the inserted token
        this.m_pae.splice(i, 0, new pae.Token(CONTAINER_END, UNKOWN_POS, chord));
        i++; // account for the inserted token — next processed is the original current token
      }

      status = status_CHORD.CHORD_NONE;
      if (token.Is(ClassId.NOTE)) {
        noteIdx = i;
      }
      // Previous token was already a note - we allow fermata or trill on the first note of a chord
      else if (noteIdx !== -1 && ((token.m_char === NULL_CHAR && token.m_inputChar === ')') || token.Is(ClassId.TRILL))) {
        ++i;
        continue;
      }
      else {
        noteIdx = -1;
      }

      ++i;
    }

    return true;
  }

  private ConvertBeam(): boolean {
    let beam: Beam | null = null;
    let graceBeam: Beam | null = null;
    let withinGrace = false;

    // Here we need an iterator because we might have to add a missing closing tag
    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      if (token.m_char === '{') {
        token.m_char = NULL_CHAR;
        if (this.m_isMensural) {
          this.LogPAE(PaeErrorCode.ERR_022_BEAM_MENSURAL, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        if (beam) {
          // Nested beams only allowed if the second one is in a grace group
          if (!withinGrace) {
            this.LogPAE(PaeErrorCode.ERR_023_BEAM_NESTED, token);
            if (this.m_pedanticMode) return false;
            ++i;
            continue;
          }
          // No nested beams within a grace group
          else if (graceBeam) {
            this.LogPAE(PaeErrorCode.ERR_023_BEAM_NESTED, token);
            if (this.m_pedanticMode) return false;
            ++i;
            continue;
          }
          // Create a grace beam
          graceBeam = new Beam();
          token.m_object = graceBeam;
        }
        else {
          // Create a beam
          beam = new Beam();
          token.m_object = beam;
        }
      }
      else if (token.m_char === '}') {
        token.m_char = NULL_CHAR;
        if (this.m_isMensural) {
          // No warning necessary here because we must have had one before already
          ++i;
          continue;
        }
        // Closing while no beam or grace beam have been open
        if (!beam && !graceBeam) {
          this.LogPAE(PaeErrorCode.ERR_024_BEAM_CLOSING, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        if (graceBeam) {
          token.m_object = graceBeam;
          token.m_char = CONTAINER_END;
          graceBeam = null;
        }
        else {
          token.m_object = beam;
          token.m_char = CONTAINER_END;
          beam = null;
        }
      }
      // Flag the beginning of a grace group
      else if (token.m_char === 'Q') {
        withinGrace = true;
      }
      // Flag the end
      else if (token.m_char === 'r') {
        withinGrace = false;
      }
      // Close beams left open
      else if (token.IsEnd() || token.Is(ClassId.MEASURE)) {
        if (graceBeam) {
          this.LogPAE(PaeErrorCode.ERR_025_BEAM_OPEN, token);
          if (this.m_pedanticMode) return false;
          this.m_pae.splice(i, 0, new pae.Token(CONTAINER_END, UNKOWN_POS, graceBeam));
          graceBeam = null;
        }
        if (beam) {
          this.LogPAE(PaeErrorCode.ERR_025_BEAM_OPEN, token);
          if (this.m_pedanticMode) return false;
          this.m_pae.splice(i, 0, new pae.Token(CONTAINER_END, UNKOWN_POS, beam));
          beam = null;
        }
      }
      ++i;
    }

    return true;
  }

  private ConvertGraceGrp(): boolean {
    // 'qq' has been replaced by 'Q' in the input in Import (see the commented-out original C++ pass).

    let graceGrp: GraceGrp | null = null;

    // Here we need an iterator because we might have to add a missing closing tag
    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      if (token.m_char === 'Q') {
        token.m_char = NULL_CHAR;
        if (graceGrp) {
          this.LogPAE(PaeErrorCode.ERR_026_GRACE_NESTED, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        graceGrp = new GraceGrp();
        token.m_object = graceGrp;
      }
      else if (token.m_char === 'r') {
        token.m_char = NULL_CHAR;
        if (!graceGrp) {
          this.LogPAE(PaeErrorCode.ERR_027_GRACE_CLOSING, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        token.m_object = graceGrp;
        token.m_char = CONTAINER_END;
        graceGrp = null;
      }
      else if (this.Is(token, GRACE)) {
        if (graceGrp) {
          this.LogPAE(PaeErrorCode.ERR_026_GRACE_NESTED, token);
          if (this.m_pedanticMode) return false;
          token.m_char = NULL_CHAR;
        }
      }
      else if (token.IsEnd() || token.Is(ClassId.MEASURE)) {
        if (graceGrp) {
          this.LogPAE(PaeErrorCode.ERR_028_GRACE_OPEN, token);
          if (this.m_pedanticMode) return false;
          this.m_pae.splice(i, 0, new pae.Token(CONTAINER_END, UNKOWN_POS, graceGrp));
          graceGrp = null;
        }
      }
      ++i;
    }

    return true;
  }

  private ConvertGrace(): boolean {
    let graceToken: pae.Token | null = null;
    let isAcciaccatura = false;

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (this.Is(token, GRACE)) {
        // Keep a flag for distinguishing them
        isAcciaccatura = (token.m_char === 'g');
        if (graceToken) {
          this.LogPAE(PaeErrorCode.ERR_029_GRACE_UNRESOLVED, token);
          if (this.m_pedanticMode) return false;
        }
        graceToken = token;
        token.m_char = NULL_CHAR;
      }
      else if (graceToken) {
        // Having an accidental is fine
        if (this.Was(token, ACCIDENTAL_INTERNAL)) {
          continue;
        }
        // Having an octave is fine
        if (this.Was(token, "',")) {
          continue;
        }
        // Having a duration is fine for appogiatura
        if (this.Is(token, DURATION_CHARS)) {
          // For acciaccature, not in pedantic mode
          if (isAcciaccatura) {
            this.LogPAE(PaeErrorCode.ERR_030_GRACE_DURATION, token);
            if (this.m_pedanticMode) return false;
          }
          continue;
        }
        if (token.Is(ClassId.NOTE)) {
          const note = token.m_object as Note;
          if (isAcciaccatura) {
            note.SetDur(DURATION_8);
            note.SetGrace(GRACE_unacc);
          }
          else {
            note.SetGrace(GRACE_acc);
          }
          note.SetStemDir(STEMDIRECTION_up);
        }
        else {
          this.LogPAE(PaeErrorCode.ERR_031_GRACE_NO_NOTE, token);
          if (this.m_pedanticMode) return false;
        }
        graceToken = null;
        isAcciaccatura = false;
      }
    }
    return true;
  }

  private ConvertTuplet(): boolean {
    let tuplet: Tuplet | null = null;
    let tupletNumStr = '';
    let isNumPart = false;

    const GetNum = (numStr: string): number => {
      if (numStr.length === 0) return 3;
      return parseInt(numStr, 10);
    };

    // Here we need an iterator because we might have to add a missing closing tag
    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      if (token.m_char === '(') {
        token.m_char = NULL_CHAR;
        if (tuplet) {
          this.LogPAE(PaeErrorCode.ERR_032_TUPLET_NESTED, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        isNumPart = false;
        tuplet = new Tuplet();
        tuplet.SetNumbase(2);
        token.m_object = tuplet;
      }
      else if (token.m_char === ')') {
        token.m_char = NULL_CHAR;
        if (!tuplet) {
          this.LogPAE(PaeErrorCode.ERR_033_TUPLET_CLOSING, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        token.m_object = tuplet;
        token.m_char = CONTAINER_END;
        tuplet.SetNum(GetNum(tupletNumStr));
        isNumPart = false;
        tuplet = null;
      }
      else if (token.m_char === ';') {
        token.m_char = NULL_CHAR;
        if (!tuplet || isNumPart) {
          this.LogPAE(PaeErrorCode.ERR_034_TUPLET_NUM, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        tupletNumStr = '';
        isNumPart = true;
      }
      else if (token.IsEnd() || token.Is(ClassId.MEASURE)) {
        if (tuplet) {
          this.LogPAE(PaeErrorCode.ERR_035_TUPLET_OPEN, token);
          if (this.m_pedanticMode) return false;
          this.m_pae.splice(i, 0, new pae.Token(CONTAINER_END, UNKOWN_POS, tuplet));
          tuplet.SetNum(GetNum(tupletNumStr));
          isNumPart = false;
          tuplet = null;
        }
      }
      else if (isNumPart) {
        if (token.m_char && !(token.m_char >= '0' && token.m_char <= '9')) {
          this.LogPAE(PaeErrorCode.ERR_036_TUPLET_NUM_NUMBER, token);
          if (this.m_pedanticMode) return false;
          ++i;
          continue;
        }
        tupletNumStr += token.m_char;
        token.m_char = NULL_CHAR;
      }
      ++i;
    }

    return true;
  }

  private ConvertDuration(): boolean {
    // The stack of durations for handling patterns
    const durations: Array<{ first: data_DURATION; second: number }> = [];
    // Add a default quarter note duration
    if (this.m_isMensural) {
      durations.push({ first: DURATION_semibrevis, second: 0 });
    }
    else {
      durations.push({ first: DURATION_4, second: 0 });
    }
    // Point to it
    let currentDurIdx = 0;

    let durationToken: pae.Token | null = null;
    let paeStr = '';
    let isChord = false;

    // Here we need an iterator because we might have to add a mensural dots
    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      // Extract duration string we can then convert in one go
      if (this.Is(token, DURATION_CHARS)) {
        if (!durationToken) {
          durationToken = token;
          paeStr = '';
        }
        paeStr += token.m_char;
        token.m_char = NULL_CHAR;
        ++i;
        continue;
      }
      // We have reached the end of a duration string - convert it, including patterns
      else if (durationToken) {
        // Will fail in pedantic mode
        if (!this.ParseDuration(durations, paeStr, durationToken)) return false;
        durationToken = null;
        // ParseDuration makes sure we have at least one duration on the stack - point to it
        currentDurIdx = 0;
      }
      // For chords we don't want to set the duration on the child notes so we need to keep a flag
      if (token.Is(ClassId.CHORD)) {
        isChord = !token.IsContainerEnd();
        if (token.IsContainerEnd()) {
          ++i;
          continue;
        }
      }
      // Apply the current duration
      if ((token.Is(ClassId.NOTE) && !isChord) || token.Is(ClassId.CHORD) || token.Is(ClassId.REST)) {
        // We should also skip acciaccature
        if (token.Is(ClassId.NOTE)) {
          const note = token.m_object as Note;
          if (note.GetGrace() === GRACE_unacc) {
            ++i;
            continue;
          }
        }
        // Set the duration to the note, chord or rest
        const interface_ = (token.m_object as unknown as { GetDurationInterface: () => DurationInterface }).GetDurationInterface();
        const currentDur = durations[currentDurIdx];
        interface_.SetDur(currentDur.first);
        if (currentDur.second) {
          if (interface_.GetDur() === DURATION_128 && token.Is(ClassId.NOTE)) {
            const note = token.m_object as Note;
            note.SetDur(DURATION_NONE);
          }
          else if (this.m_isMensural) {
            if (currentDur.second > 1) {
              this.LogPAE(PaeErrorCode.ERR_059_DOUBLE_DOTS_MENS, token);
              if (this.m_pedanticMode) return false;
            }
            const dot = new Dot();
            // C++: ++token; insert(token, dot) → next processed is the token after the dot
            this.m_pae.splice(i + 1, 0, new pae.Token(NULL_CHAR, UNKOWN_POS, dot));
            i++;
          }
          else {
            interface_.SetDots(currentDur.second);
          }
        }
        // Move to the next on the stack - but this is meaningless if we have a single value
        if (durations.length > 1) {
          currentDurIdx++;
          // Return to the beginning once we have reached the end
          if (currentDurIdx === durations.length) currentDurIdx = 0;
        }
      }
      ++i;
    }

    return true;
  }

  private ConvertTie(): boolean {
    // No ties in mensural
    // Since now we use the same symbol just return - eventually we want to check them in pedantic mode
    // if (m_isMensural) return true;

    let note: Note | null = null;
    let tie: Tie | null = null;
    // A pointer to the token to be able to reset it to '+' in mensural notation
    let tieToken: pae.Token | null = null;

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.Is(ClassId.NOTE)) {
        const tokenNote = token.m_object as Note;
        if (tie && note) {
          if (note.GetOct() !== tokenNote.GetOct() || note.GetPname() !== tokenNote.GetPname()) {
            if (this.m_isMensural && tieToken) {
              // This is probably a ligature - reset it back
              tieToken.m_char = '+';
            }
            else {
              this.LogPAE(PaeErrorCode.ERR_037_TIE_PITCH, token);
              if (this.m_pedanticMode) return false;
            }
            // C++ deletes the tie; TS drops the reference (GC-owned).
            tie = null;
            tieToken!.m_object = null;
            tieToken = null;
            note = null;
          }
          else {
            tie.SetEndid('#' + tokenNote.GetID());
            tie = null;
          }
        }
        note = tokenNote;
        continue;
      }
      if (token.m_char === '+') {
        token.m_char = NULL_CHAR;
        if (tie) {
          this.LogPAE(PaeErrorCode.ERR_038_TIE_OPEN, token);
          if (this.m_pedanticMode) return false;
          continue;
        }
        if (note) {
          // Keep a pointer to the token in case this is a ligature
          tieToken = token;
          tie = new Tie();
          tie.SetStartid('#' + note.GetID());
          token.m_object = tie;
        }
        else {
          this.LogPAE(PaeErrorCode.ERR_039_TIE_NO_NOTE, token);
          if (this.m_pedanticMode) return false;
        }
        continue;
      }
      // A tie can be placed after the closing fermata ) or after a trill t
      if (note && (token.m_inputChar === ')' || token.Is(ClassId.TRILL))) {
        continue;
      }
      else if (!tie) {
        note = null;
      }
    }

    return true;
  }

  private ConvertLigature(): boolean {
    // No ligatures in non mensural
    // Since now we use the same symbol just return
    // Eventually, once we have a distinct symbol we will want to check them in pedantic mode
    if (!this.m_isMensural) return true;

    if (!this.HasInput('+')) return true;

    // A flag for the ligature status NONE|MARKER|NOTE
    let status = status_LIGATURE.LIGATURE_NONE;
    // The index of the last note that can become the first note of a ligature (-1 == m_pae.end())
    let noteIdx = -1;
    // The previous ligature note for checking that it is not of the same pitch
    let previousNote: Note | null = null;

    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid()) { ++i; continue; }

      // We encounter a ligature marker - change the status if we have a note previously
      if (token.m_char === '+') {
        token.m_char = NULL_CHAR;
        if (noteIdx === -1) {
          this.LogPAE(PaeErrorCode.ERR_061_LIGATURE_NOTE_BEFORE, token);
          if (this.m_pedanticMode) return false;
        }
        else {
          // assert(previousNote) invariant from C++
          if (!previousNote) throw new Error('PAEInput::ConvertLigature: missing previous note');
          status = status_LIGATURE.LIGATURE_MARKER;
        }
        ++i;
        continue;
      }

      // We expect a note
      if (status === status_LIGATURE.LIGATURE_MARKER) {
        // If we have a note, we change the status - we will be able to decide to close the ligature on the next
        // token
        if (token.Is(ClassId.NOTE)) {
          const tokenNote = token.m_object as Note;
          // assert(previousNote) invariant from C++
          if (!previousNote) throw new Error('PAEInput::ConvertLigature: missing previous note');
          // Check we don't have two consecutive notes with the same pitch
          if (previousNote.GetOct() === tokenNote.GetOct()
            && previousNote.GetPname() === tokenNote.GetPname()) {
            this.LogPAE(PaeErrorCode.ERR_063_LIGATURE_PITCH, token);
            if (this.m_pedanticMode) return false;
            status = status_LIGATURE.LIGATURE_NONE;
            noteIdx = -1;
            previousNote = null;
          }
          // Check the duration is valid for a ligature
          else if (tokenNote.GetDur() > DURATION_semibrevis) {
            this.LogPAE(PaeErrorCode.ERR_064_LIGATURE_DURATION, token);
            if (this.m_pedanticMode) return false;
            status = status_LIGATURE.LIGATURE_NONE;
            noteIdx = -1;
            previousNote = null;
          }
          else {
            status = status_LIGATURE.LIGATURE_NOTE;
            previousNote = tokenNote;
          }
        }
        // After a marker, we should allow accidentals, octave, duration or fermata markers but nothing else
        else if (!this.Was(token, ACCIDENTAL_INTERNAL) && !this.Was(token, "',")
          && !this.Was(token, DURATION_CHARS) && token.m_inputChar !== '(') {
          this.LogPAE(PaeErrorCode.ERR_062_LIGATURE_NOTE_AFTER, token);
          if (this.m_pedanticMode) return false;
          status = status_LIGATURE.LIGATURE_NONE;
          noteIdx = -1;
          previousNote = null;
        }
        ++i;
        continue;
      }

      // We passed the last note of the ligature - create it
      if (status === status_LIGATURE.LIGATURE_NOTE) {
        const ligature = new Ligature();
        this.m_pae.splice(noteIdx, 0, new pae.Token(NULL_CHAR, UNKOWN_POS, ligature));
        noteIdx++; // account for the inserted token
        this.m_pae.splice(i, 0, new pae.Token(CONTAINER_END, UNKOWN_POS, ligature));
        i++; // account for the inserted token — next processed is the original current token
      }

      status = status_LIGATURE.LIGATURE_NONE;
      if (token.Is(ClassId.NOTE)) {
        noteIdx = i;
        previousNote = token.m_object as Note;
      }
      // Previous token was a note but current is a ')' skip it because we allow fermata on a ligature note
      else if (token.m_inputChar !== ')') {
        noteIdx = -1;
        previousNote = null;
      }

      ++i;
    }

    return true;
  }

  private ConvertAccidGes(): boolean {
    const currentAccids: MapOfOctavedPitchAccid = new Map();
    this.m_keySig.FillMap(currentAccids);
    let currentKeySigAccids: MapOfOctavedPitchAccid = new Map(currentAccids);
    let lastNote: Note | null = null;
    const ties = new Map<string, data_ACCIDENTAL_WRITTEN>();

    for (const token of this.m_pae) {
      if (token.IsVoid()) continue;

      if (token.Is(ClassId.KEYSIG)) {
        const keySig = token.m_object as KeySig;
        keySig.FillMap(currentAccids);
        currentKeySigAccids = new Map(currentAccids);
      }
      else if (token.Is(ClassId.NOTE)) {
        const note = token.m_object as Note;
        const accid = note.FindDescendantByType(ClassId.ACCID) as Accid | null;
        const octavedPitch = note.GetPname() + note.GetOct() * 7;

        const noteID = note.GetID();
        if (!accid) {
          // Tied note with a previous note with an accidental
          if (ties.has(noteID)) {
            const tieAccid = new Accid();
            note.AddChild(tieAccid);
            tieAccid.SetAccidGes(Att.AccidentalWrittenToGestural(ties.get(noteID)!));
            ties.delete(noteID);
          }
          // Nothing in front of the note, but something in the list - make it an accid.ges
          else if (currentAccids.has(octavedPitch)) {
            const gesAccid = new Accid();
            note.AddChild(gesAccid);
            const accidWritten = currentAccids.get(octavedPitch)!;
            gesAccid.SetAccidGes(Att.AccidentalWrittenToGestural(accidWritten));
          }
        }
        else {
          const noteAccid = accid.GetAccid();
          // Natural in front of the note, remove it from the current list
          if (noteAccid === ACCIDENTAL_WRITTEN_n) {
            if (currentAccids.has(octavedPitch)) {
              currentAccids.set(octavedPitch, ACCIDENTAL_WRITTEN_n);
            }
          }
          // Not a natural in front of the note, add it to the current list
          else if (noteAccid !== ACCIDENTAL_WRITTEN_NONE) {
            currentAccids.set(octavedPitch, noteAccid);
          }
        }
        lastNote = note;
      }
      else if (token.Is(ClassId.TIE) && lastNote) {
        const accid = lastNote.FindDescendantByType(ClassId.ACCID) as Accid | null;
        // The note before had an accidental - we assume it to be the @startid of the tie
        if (accid) {
          const accidWritten = accid.HasAccid()
            ? accid.GetAccid()
            : Att.AccidentalGesturalToWritten(accid.GetAccidGes());
          const tie = token.m_object as Tie;
          ties.set(ExtractIDFragment(tie.GetEndid()), accidWritten);
        }
      }
      // Reset the last note unless we have a fermata or a trill
      else if (!token.Is(ClassId.FERMATA) && !token.Is(ClassId.TRILL)) {
        lastNote = null;
        if (token.Is(ClassId.MEASURE)) {
          // Copy the key-signature accids back into the current map (value semantics)
          currentAccids.clear();
          for (const [k, v] of currentKeySigAccids) currentAccids.set(k, v);
        }
      }
    }

    return true;
  }

  private CheckHierarchy(): boolean {
    const stack: pae.Token[] = [];
    // A reference layer to test with
    const layer = new Layer();
    const layerToken = new pae.Token(VOID, UNKOWN_POS, layer);

    let isValid = false;
    // Limit the number of checks
    let checkCount = 0;

    while (!isValid && checkCount < 5) {
      checkCount++;
      isValid = true;
      for (const token of this.m_pae) {
        if (token.IsVoid()) continue;

        if (!token.m_object) continue;

        if (token.m_object.Is(ClassId.MEASURE)) {
          stack.length = 0;
          stack.push(layerToken);
        }

        if (!token.m_object.IsLayerElement()) continue;

        // These will be added to a scoreDef
        if (token.m_object.IsAnyOf([ClassId.KEYSIG, ClassId.METERSIG, ClassId.MENSUR])) continue;

        // Test if the element is supported by the current top container
        if (!token.IsContainerEnd() && !stack[stack.length - 1].m_object!.IsSupportedChild(token.m_object.GetClassId())) {
          this.LogPAE(PaeErrorCode.ERR_040_HIERARCHY_INVALID, token,
            StringFormat('%s / %s', token.GetName(), stack[stack.length - 1].GetName()));
          if (this.m_pedanticMode) return false;
          // Indicate that the data was not valid in this pass so we will check it again
          isValid = false;
          // Remove it and continue (do not add it to the stack anymore)
          this.RemoveContainerToken(token.m_object);
          continue;
        }

        // Add to the stack the layer element that are containers
        if (token.m_object.IsAnyOf([ClassId.BEAM, ClassId.CHORD, ClassId.GRACEGRP, ClassId.TUPLET])) {
          // Beginning of a container - simply push it to the stack
          if (token.m_char !== CONTAINER_END) {
            stack.push(token);
          }
          // End of a container - check for invalid nesting of opening and closing tags
          else {
            // The object is not the same on top of the stack and the one we are popping
            // This means that the hierarchy is invalid
            if (stack[stack.length - 1].m_object !== token.m_object) {
              this.LogPAE(PaeErrorCode.ERR_041_NESTING_INVALID, token,
                StringFormat('%s / %s', token.GetName(), stack[stack.length - 1].GetName()));
              if (this.m_pedanticMode) return false;
              // Indicate that the data was not valid in this pass so we will check it again
              isValid = false;
              // Remove the problematic container
              this.RemoveContainerToken(token.m_object!);
              // If we want to continue, we should remove the last one added from the tokens
              this.RemoveContainerToken(stack[stack.length - 1].m_object!);
              stack.pop();
              // We should also remove from the stack the object we were expecting
              for (let j = stack.length - 1; j >= 0; j--) {
                if (stack[j].m_object === token.m_object) stack.splice(j, 1);
              }
            }
            // This is all good, simply pop it
            else {
              stack.pop();
            }
          }
        }
      }
    }

    return isValid;
  }

  private CheckContentPreBuild(): boolean {
    // Additional checks to do here
    // * a measure with mRest or multiRest should not include anything else

    let previousToken: pae.Token | null = null;

    let i = 0;
    while (i < this.m_pae.length) {
      const token = this.m_pae[i];
      if (token.IsVoid() || !token.m_object) {
        ++i;
        continue;
      }
      // Check that the measure rest is at the beginning of a measure
      if (token.Is(ClassId.MULTIREST) && previousToken && !previousToken.Is(ClassId.MEASURE) && !previousToken.Is(ClassId.KEYSIG)
        && !previousToken.Is(ClassId.METERSIG) && !previousToken.Is(ClassId.METERSIGGRP)) {
        this.LogPAE(PaeErrorCode.ERR_065_MREST_INVALID_MEASURE, token);
        if (this.m_pedanticMode) return false;
        const measure = new Measure();
        measure.SetRight(BARRENDITION_invis);
        this.m_pae.splice(i, 0, new pae.Token(NULL_CHAR, UNKOWN_POS, measure));
      }
      // Check that the measure rest is at the end of a measure
      else if (previousToken && previousToken.Is(ClassId.MULTIREST) && !token.Is(ClassId.MEASURE)) {
        this.LogPAE(PaeErrorCode.ERR_065_MREST_INVALID_MEASURE, previousToken);
        if (this.m_pedanticMode) return false;
        const measure = new Measure();
        measure.SetRight(BARRENDITION_invis);
        this.m_pae.splice(i, 0, new pae.Token(NULL_CHAR, UNKOWN_POS, measure));
      }

      if (token.m_object) {
        previousToken = token;
      }
      ++i;
    }

    return true;
  }

  private CheckContentPostBuild(): boolean {
    // Additional checks to do here
    // * beam should have more than two children
    // * graceGrp should not be empty
    // * keySig / meterSig change more than once in a measure

    const comparison = new ClassIdsComparison([ClassId.BEAM, ClassId.GRACEGRP]);
    const noteOrRest = new ClassIdsComparison([ClassId.NOTE, ClassId.REST]);
    const containers: VrvObject[] = [];
    this.doc.FindAllDescendantsByComparison(containers, comparison);
    for (const container of containers) {
      const notesOrRests: VrvObject[] = [];
      container.FindAllDescendantsByComparison(notesOrRests, noteOrRest);
      if (notesOrRests.length < 1) {
        const token = this.GetTokenForTreeObject(container);
        if (token) {
          this.LogPAE(PaeErrorCode.ERR_066_EMPTY_CONTAINER, token);
          if (this.m_pedanticMode) return false;
        }
      }
    }

    return true;
  }

  private RemoveContainerToken(object: VrvObject): void {
    let deleted = false;
    for (const token of this.m_pae) {
      if (token.IsVoid() || !token.m_object) continue;

      if (token.m_object === object) {
        if (!token.IsContainerEnd()) {
          // Make sure we delete it only once - even though it should never be there more than once
          LogDebug('Deleting %s', object.GetClassName());
          // C++ deletes the object; TS drops the reference (GC-owned).
          deleted = true;
        }
        token.m_char = NULL_CHAR;
        token.m_object = null;
      }
    }
  }

  private GetTokenForTreeObject(object: VrvObject): pae.Token | null {
    for (const token of this.m_pae) {
      if (token.m_treeObject === object) return token;
    }
    return null;
  }

  private ParseKeySig(keySig: KeySig, paeStr: string, token: pae.Token): boolean {
    keySig.Reset();

    const invalidChars = { value: '' };
    if (!this.CheckPAEChars(paeStr, invalidChars, KEYSIG)) {
      this.LogPAE(PaeErrorCode.ERR_050_INVALID_CHAR, token, invalidChars.value);
      if (this.m_pedanticMode) return false;
    }

    let altNumber = 0;
    let endOfKeysig = false;
    let enclosed = false;
    let hasEnclosed = false;
    const enclosedAccids: boolean[] = new Array(7).fill(false);
    let cancel = false;
    let alterationType: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE;
    for (const c of paeStr) {
      switch (c) {
        case 'b':
          altNumber = 0;
          alterationType = ACCIDENTAL_WRITTEN_f;
          break;
        case 'x':
          altNumber = 0;
          alterationType = ACCIDENTAL_WRITTEN_s;
          break;
        case 'n':
          altNumber = 0;
          cancel = true;
          break;
        case '[':
          enclosed = true;
          hasEnclosed = true;
          break;
        case ']': enclosed = false; break;
        case 'F':
        case 'C':
        case 'G':
        case 'D':
        case 'A':
        case 'E':
        case 'B': altNumber++; break;
        default: endOfKeysig = true; break;
      }
      if (!endOfKeysig) {
        if (altNumber < 7) {
          enclosedAccids[altNumber] = enclosed;
        }
      }
    }

    // Just in case
    altNumber = Math.min(7, altNumber);

    if (alterationType !== ACCIDENTAL_WRITTEN_NONE) {
      if (hasEnclosed === true) {
        keySig.SetAttribute(false);
        for (let i = 0; i < altNumber; ++i) {
          const keyAccid = new KeyAccid();
          const pname = (alterationType === ACCIDENTAL_WRITTEN_f) ? KeySig.S_PNAME_FOR_FLATS[i]
            : KeySig.S_PNAME_FOR_SHARPS[i];
          keyAccid.SetPname(pname);
          keyAccid.SetAccid(alterationType);
          keySig.AddChild(keyAccid);
          if (enclosedAccids[i]) {
            keyAccid.SetEnclose(ENCLOSURE_brack);
          }
        }
      }
      else {
        keySig.SetSig([altNumber, alterationType]);
      }
      if (cancel) {
        keySig.SetCancelaccid(CANCELACCID_before);
      }
    }
    else {
      keySig.SetSig([0, ACCIDENTAL_WRITTEN_n]);
    }
    return true;
  }

  private ParseClef(clef: Clef, paeStr: string, token: pae.Token, mensuralScoreDef?: { value: boolean }): boolean {
    clef.Reset();

    const invalidChars = { value: '' };
    if (!this.CheckPAEChars(paeStr, invalidChars, CLEF)) {
      this.LogPAE(PaeErrorCode.ERR_050_INVALID_CHAR, token, invalidChars.value);
      if (this.m_pedanticMode) return false;
    }

    if (paeStr.length < 3) {
      this.LogPAE(PaeErrorCode.ERR_042_CLEF_INCOMPLETE, token);
      if (this.m_pedanticMode) return false;
      clef.SetLine(2);
      clef.SetShape(CLEFSHAPE_G);
      if (mensuralScoreDef) mensuralScoreDef.value = false;
      return true;
    }

    if (paeStr.length > 3) {
      this.LogPAE(PaeErrorCode.ERR_046_CLEF_INVALID, token, paeStr);
      if (this.m_pedanticMode) return false;
    }

    const clefShape = paeStr.charAt(0);

    // Second character - or +
    if (paeStr.charAt(1) !== '+' && paeStr.charAt(1) !== '-') {
      this.LogPAE(PaeErrorCode.ERR_043_CLEF_INVALID_2ND, token);
      if (this.m_pedanticMode) return false;
    }
    const isMensural = (paeStr.charAt(1) === '+');

    if (mensuralScoreDef) {
      mensuralScoreDef.value = isMensural;
    }
    else if (this.m_isMensural !== isMensural) {
      this.LogPAE(PaeErrorCode.ERR_044_CLEF_MENS, token);
      if (this.m_pedanticMode) return false;
    }

    // Third character a digit
    if (!(paeStr.charAt(2) >= '0' && paeStr.charAt(2) <= '9')) {
      this.LogPAE(PaeErrorCode.ERR_045_CLEF_INVALID_3RD, token);
      if (this.m_pedanticMode) return false;
    }
    const clefLine = paeStr.charCodeAt(2);

    // Building the clef
    if (clefShape === 'G') {
      clef.SetShape(CLEFSHAPE_G);
      clef.SetLine(clefLine - 48);
    }
    else if (clefShape === 'C') {
      clef.SetShape(CLEFSHAPE_C);
      clef.SetLine(clefLine - 48);
    }
    else if (clefShape === 'F') {
      clef.SetShape(CLEFSHAPE_F);
      clef.SetLine(clefLine - 48);
    }
    else if (clefShape === 'g') {
      clef.SetShape(CLEFSHAPE_G);
      clef.SetLine(clefLine - 48);
      clef.SetDis(OCTAVE_DIS_8);
      clef.SetDisPlace(STAFFREL_basic_below);
    }
    else {
      this.LogPAE(PaeErrorCode.ERR_046_CLEF_INVALID, token, paeStr);
      if (this.m_pedanticMode) return false;
    }
    return true;
  }

  private ParseMeterSig(meterSig: MeterSig, paeStr: string, token: pae.Token): boolean {
    meterSig.Reset();

    const invalidChars = { value: '' };
    if (!this.CheckPAEChars(paeStr, invalidChars, METERSIG)) {
      this.LogPAE(PaeErrorCode.ERR_050_INVALID_CHAR, token, invalidChars.value);
      if (this.m_pedanticMode) return false;
    }

    if (paeStr.length < 1) {
      this.LogPAE(PaeErrorCode.ERR_047_TIMESIG_INCOMPLETE, token);
      if (this.m_pedanticMode) return false;
      meterSig.SetCount([[4], MeterCountSign.None]);
      meterSig.SetUnit(4);
      return true;
    }

    let m: RegExpMatchArray | null;
    if ((m = paeStr.match(/^(\d+)\/(\d+)$/))) {
      meterSig.SetCount([[parseInt(m[1], 10)], MeterCountSign.None]);
      meterSig.SetUnit(parseInt(m[2], 10));
    }
    else if (/^\d+$/.test(paeStr)) {
      meterSig.SetCount([[parseInt(paeStr, 10)], MeterCountSign.None]);
      meterSig.SetUnit(1);
      meterSig.SetForm(METERFORM_num);
    }
    else if (paeStr === 'c') {
      // C
      meterSig.SetSym(METERSIGN_common);
    }
    else if (paeStr === 'c/') {
      // C|
      meterSig.SetSym(METERSIGN_cut);
    }
    else if (paeStr === 'c3') {
      // C3
      meterSig.SetSym(METERSIGN_common);
      meterSig.SetCount([[3], MeterCountSign.None]);
    }
    else if (paeStr === 'c3/2') {
      // C3/2
      meterSig.SetSym(METERSIGN_common); // ??
      meterSig.SetCount([[3], MeterCountSign.None]);
      meterSig.SetUnit(2);
    }
    else {
      this.LogPAE(PaeErrorCode.ERR_048_TIMESIG_INVALID, token, paeStr);
      if (this.m_pedanticMode) return false;
    }
    return true;
  }

  private ParseMensur(mensur: Mensur, paeStr: string, token: pae.Token): boolean {
    mensur.Reset();

    const invalidChars = { value: '' };
    if (!this.CheckPAEChars(paeStr, invalidChars, METERSIG)) {
      this.LogPAE(PaeErrorCode.ERR_050_INVALID_CHAR, token, invalidChars.value);
      if (this.m_pedanticMode) return false;
    }

    if (paeStr.length < 1) {
      this.LogPAE(PaeErrorCode.ERR_049_TIMESIG_MENS, token);
      if (this.m_pedanticMode) return false;
      mensur.SetSign(MENSURATIONSIGN_O);
      return true;
    }

    let m: RegExpMatchArray | null;
    if ((m = paeStr.match(/^(\d+)\/(\d+)$/))) {
      mensur.SetNum(parseInt(m[1], 10));
      mensur.SetNumbase(parseInt(m[2], 10));
    }
    else if (/^\d+$/.test(paeStr)) {
      mensur.SetNum(parseInt(paeStr, 10));
    }
    else if ((m = paeStr.match(/^([co])([.\/]?)([.\/]?)(\d*)\/?(\d*)$/))) {
      // C
      if (m[1] === 'c') {
        mensur.SetSign(MENSURATIONSIGN_C);
      }
      // O
      else {
        mensur.SetSign(MENSURATIONSIGN_O);
      }
      // Dot (second or third match since order between . and / is not defined in PAE)
      if (m[2] === '.' || m[3] === '.') {
        mensur.SetDot(BOOLEAN_true);
      }
      // Slash (second or third match, ditto)
      if (m[2] === '/' || m[3] === '/') {
        mensur.SetSlash(1);
      }
      // Num
      if (m[4] !== '') {
        mensur.SetNum(parseInt(m[4], 10));
      }
      // Numbase (but only if Num is given)
      if (m[4] !== '' && m[5] !== '') {
        mensur.SetNumbase(parseInt(m[5], 10));
      }
    }
    else {
      this.LogPAE(PaeErrorCode.ERR_048_TIMESIG_INVALID, token, paeStr);
      if (this.m_pedanticMode) return false;
    }
    return true;
  }

  private ParseMeasure(measure: Measure, paeStr: string, token: pae.Token): boolean {
    if (paeStr === '/') {
      measure.SetRight(BARRENDITION_single);
    }
    else if (paeStr === '//') {
      measure.SetRight(BARRENDITION_dbl);
    }
    else if (paeStr === '://') {
      measure.SetRight(BARRENDITION_rptend);
    }
    else if (paeStr === '//:') {
      measure.SetRight(BARRENDITION_rptstart);
    }
    else if (paeStr === '://:') {
      measure.SetRight(BARRENDITION_rptboth);
    }
    else {
      this.LogPAE(PaeErrorCode.ERR_051_BARLINE, token, paeStr);
      if (this.m_pedanticMode) return false;
      // Put a single line by default in non pedantic mode
      measure.SetRight(BARRENDITION_single);
    }

    return true;
  }

  private ParseDuration(durations: Array<{ first: data_DURATION; second: number }>, paeStr: string, token: pae.Token): boolean {
    durations.length = 0;

    if (paeStr.length < 1 || paeStr.charAt(0) === '.') {
      this.LogPAE(PaeErrorCode.ERR_052_DURATION, token);
      // Default to quarter note
      if (this.m_pedanticMode) return false;
      durations.push({ first: DURATION_4, second: 0 });
      return true;
    }

    for (const c of paeStr) {
      if (c >= '0' && c <= '9') {
        let duration: data_DURATION = DURATION_4;
        if (this.m_isMensural) {
          switch (c) {
            case '0': duration = DURATION_longa; break;
            case '1': duration = DURATION_semibrevis; break;
            case '2': duration = DURATION_minima; break;
            case '3':
              duration = DURATION_breve;
              // Ideally we should pass an offset to LogPAE because this is going to show the position in
              // token. However, using rhythmic patterns in mensural notation is probably not very common...
              this.LogPAE(PaeErrorCode.ERR_053_DURATION_MENS3, token);
              if (this.m_pedanticMode) return false;
              break;
            case '4': duration = DURATION_semiminima; break;
            case '5':
              duration = DURATION_breve;
              this.LogPAE(PaeErrorCode.ERR_054_DURATION_MENS5, token);
              if (this.m_pedanticMode) return false;
              break;
            case '6': duration = DURATION_semifusa; break;
            case '7': duration = DURATION_breve; break;
            case '8': duration = DURATION_fusa; break;
            case '9': duration = DURATION_brevis; break;
          }
        }
        else {
          switch (c) {
            case '0': duration = DURATION_long; break;
            case '1': duration = DURATION_1; break;
            case '2': duration = DURATION_2; break;
            case '3': duration = DURATION_32; break;
            case '4': duration = DURATION_4; break;
            case '5': duration = DURATION_64; break;
            case '6': duration = DURATION_16; break;
            case '7': duration = DURATION_128; break;
            case '8': duration = DURATION_8; break;
            case '9': duration = DURATION_breve; break;
          }
        }
        durations.push({ first: duration, second: 0 });
      }
      else {
        durations[durations.length - 1].second += 1;
      }
    }

    // just in case not to screw up iterators in ConvertDuration
    if (durations.length === 0) {
      LogDebug('Something went wrong with the parsing of durations');
      durations.push({ first: DURATION_4, second: 0 });
    }

    return true;
  }
}
