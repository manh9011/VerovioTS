/**
 * Pure TypeScript translation of Verovio's `src/note.cpp` /
 * `include/vrv/note.h`.
 *
 * `Note` models the MEI <note> element.
 *
 * C++ multiple inheritance (LayerElement + StemmedDrawingInterface +
 * AltSymInterface + DurationInterface + OffsetInterface + PitchInterface +
 * PositionInterface + 15 generated libMEI attribute bases) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, data_DURATION, StemSameasDrawingRole, SMuFLGlyphAnchor } from './vrvdef.js';
import {
  MAX_CHORD_DEPTH, MAX_TABGRP_DEPTH, OCTAVE_OFFSET,
  STANDARD_STEMLENGTH, STANDARD_STEMLENGTH_TAB,
  DURATION_breve, DURATION_1, DURATION_2, DURATION_4,
} from './vrvdef.js';
import { LayerElement, NotePredicate, StaffSearch } from './layerelement.js';
import type { MapOfNoteLocs, MapOfDotLocs, StaffLike } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { LogError, LogWarning } from './vrv.js';
import { StemmedDrawingInterface } from './drawinginterface.js';
import { AltSymInterface, SymbolDefLike } from './altsyminterface.js';
import { DurationInterface } from './durationinterface.js';
import { OffsetInterface } from './offsetinterface.js';
import { PitchInterface, PITCHNAME_c } from './pitchinterface.js';
import { PositionInterface } from './positioninterface.js';
import { Point } from './devicecontextbase.js';
import { TransPitch } from './transposition.js';
import { Comparison } from './comparison.js';
import { UTF8to32 } from './vrv.js';
import type { Fraction } from './fraction.js';

/** IsAttributeComparison from `comparison.h`: ClassId match + IsAttribute(). */
function isAttributeComparison(classId: number): Comparison {
  return new Comparison((object: VrvObject) => object.GetClassId() === classId && object.IsAttribute());
}

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_COLORATION = 110;
const ATT_CUE = 116;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_GRACED = 22;
const ATT_HARMONICFUNCTION = 2;
const ATT_NOTEHEADS = 171;
const ATT_NOTEVISMENSURAL = 73;
const ATT_MIDIVELOCITY = 83;
const ATT_STEMS = 209;
const ATT_STEMSCMN = 35;
const ATT_STRINGTAB = 241;
const ATT_TIEPRESENT = 217;
const ATT_VISIBILITY = 228;

// Canonical data_STEMDIRECTION ordinals (libmei atttypes.h).
const STEMDIRECTION_NONE = 0;
const STEMDIRECTION_up = 1;
const STEMDIRECTION_down = 2;

// Canonical data_BOOLEAN ordinals.
const BOOLEAN_true = 1;
const BOOLEAN_NONE = 0;

// Canonical NOTATIONTYPE ordinals (attconverter.ts / atttypes.h).
const NOTATIONTYPE_tab_lute_italian = 12;
const NOTATIONTYPE_tab_lute_french = 11;
const NOTATIONTYPE_tab_lute_german = 13;
const NOTATIONTYPE_mensural_black = 3;

// Canonical data_HEADSHAPE type/list ordinals (./libmei-att.ts).
import { HEADSHAPE_headShapeList, HEADSHAPE_hexnum, data_HEADSHAPE } from './libmei-att.js';
// Canonical data_HEADSHAPE_list ordinals (libmei atttypes.h).
const HEADSHAPE_list_quarter = 1;
const HEADSHAPE_list_half = 2;
const HEADSHAPE_list_whole = 3;
const HEADSHAPE_list_plus = 6;
const HEADSHAPE_list_diamond = 7;
const HEADSHAPE_list_rectangle = 11;
const HEADSHAPE_list_slash = 14;
const HEADSHAPE_list_x = 16;
// Canonical data_FILL ordinals.
const FILL_void = 1;
const FILL_solid = 2;
// Canonical data_NOTEHEADMODIFIER ordinals.
const NOTEHEADMODIFIER_fences = 10;

import {
  SMUFL_E0A0_noteheadDoubleWhole, SMUFL_E0A1_noteheadDoubleWholeSquare, SMUFL_E0A2_noteheadWhole,
  SMUFL_E0A3_noteheadHalf, SMUFL_E0A4_noteheadBlack, SMUFL_E0A5_noteheadNull, SMUFL_E0A9_noteheadXBlack,
  SMUFL_E0AF_noteheadPlusBlack, SMUFL_E0B5_noteheadWholeWithX, SMUFL_E0B6_noteheadHalfWithX,
  SMUFL_E0B8_noteheadSquareWhite, SMUFL_E0B9_noteheadSquareBlack, SMUFL_E0D9_noteheadDiamondHalf,
  SMUFL_E0DB_noteheadDiamondBlack, SMUFL_E0DC_noteheadDiamondBlackWide, SMUFL_E0DE_noteheadDiamondWhiteWide,
  SMUFL_E0FA_noteheadWholeFilled, SMUFL_E0FB_noteheadHalfFilled,
  SMUFL_E101_noteheadSlashHorizontalEnds, SMUFL_E102_noteheadSlashWhiteWhole, SMUFL_E103_noteheadSlashWhiteHalf,
  SMUFL_E938_mensuralNoteheadSemibrevisBlack, SMUFL_E93C_mensuralNoteheadMinimaWhite,
  SMUFL_E93D_mensuralNoteheadSemiminimaWhite,
  SMUFL_EA51_figbass1, SMUFL_EA52_figbass2, SMUFL_EA54_figbass3, SMUFL_EA55_figbass4, SMUFL_EA57_figbass5,
  SMUFL_EA5F_figbass7Raised2, SMUFL_EA61_figbass9,
  SMUFL_EBC0_luteFrenchFretA, SMUFL_EBC1_luteFrenchFretB, SMUFL_EBC2_luteFrenchFretC,
  SMUFL_EBC3_luteFrenchFretD, SMUFL_EBC4_luteFrenchFretE, SMUFL_EBC5_luteFrenchFretF,
  SMUFL_EBC6_luteFrenchFretG, SMUFL_EBC7_luteFrenchFretH, SMUFL_EBC8_luteFrenchFretI,
  SMUFL_EBC9_luteFrenchFretK, SMUFL_EBCA_luteFrenchFretL, SMUFL_EBCB_luteFrenchFretM,
  SMUFL_EBCC_luteFrenchFretN,
  SMUFL_EBCD_luteFrench7thCourse,
  SMUFL_EBE0_luteItalianFret0, SMUFL_EBE4_luteItalianFret4,
  SMUFL_EC00_luteGermanALower, SMUFL_EC17_luteGermanAUpper,
} from './smufl.js';

// Attribute components (generated libMEI classes).
import { InstColor, InstColoration, InstCue, InstStems, InstTiePresent, InstVisibility, InstNoteHeads } from './atts_shared.js';
import { InstGraced, InstStemsCmn } from './atts_cmn.js';
import { InstHarmonicFunction } from './atts_analytical.js';
import { InstExtSymAuth, InstExtSymNames } from './atts_externalsymbols.js';
import { InstMidiVelocity } from './atts_midi.js';
import { InstNoteVisMensural } from './atts_mensural.js';
import { InstPitchGes } from './atts_gestural.js';
import { InstStringtab } from './atts_stringtab.js';
import { Accid } from './accid.js';

// Structural collaborator contracts for still-unmigrated units.
export interface NoteStaffLike {
  IsTabStaffLike?(): boolean;
  IsTablature?(): boolean;
  m_drawingNotationType?: number;
  m_drawingTuning?: { CalcPitchNumber(course: number, fret: number, notationType: number): number } | null;
  m_drawingStaffSize?: number;
  m_drawingLines?: number;
  GetDrawingY?(): number;
}

export interface NoteTabGrpLike {
  GetActualDur(): data_DURATION;
}

export interface NoteChordLike {
  GetActualDur(): data_DURATION;
  IsVisible(): boolean;
  GetDrawingStem?(): StemLikeContract | null;
}

export interface StemLikeContract {
  GetSelfTop(): number;
  GetSelfBottom(): number;
}

export interface NoteDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetCueSize(value: number): number;
  GetGlyphWidth(code: number, staffSize: number, isCueSize: boolean): number;
  GetGlyphHeight(code: number, staffSize: number, isCueSize: boolean): number;
  ConvertFontPoint(glyph: unknown, anchor: unknown, staffSize: number, isCueSize: boolean): Point;
  GetResources(): { GetGlyph(code: number): NoteGlyphLike | null; GetGlyphCode(name: string): number };
}

export interface NoteGlyphLike {
  HasAnchor(anchor: number): boolean;
  GetAnchor(anchor: number): Point;
}

export interface NoteResourcesLike {
  GetGlyph(code: number): unknown | null;
  GetGlyphCode(name: string): number;
}

export interface NoteSymbolLike {
  HasGlyphNum(): boolean;
  GetGlyphNum(): number;
  HasGlyphName(): boolean;
  GetGlyphName(): string;
}

export interface NoteLayerLike {
  GetClefLocOffset(element: unknown): number;
  GetAtPos(x: number): unknown;
}

/** ChordNoteGroup from `chord.h`: a vector of chord-tone pointers with 1-indexed positions. */
export type ChordNoteGroup = Note[];

/** C++ MapOfNoteLocs construction helper: single staff -> loc set. */
function MapOfNoteLocsProto(staff: StaffLike, locs: number[]): MapOfNoteLocs {
  const map: MapOfNoteLocs = new Map();
  map.set(staff, new Set(locs));
  return map;
}

/**
 * Unary predicate for sorting notes by diatonic pitch (C++ DiatonicSort).
 */
export class DiatonicSort {
  public call(first: VrvObject, second: VrvObject): boolean {
    const n1 = first as unknown as Note;
    const n2 = second as unknown as Note;
    if (!n1 || !n2 || typeof n1.GetDiatonicPitch !== 'function' || typeof n2.GetDiatonicPitch !== 'function') {
      throw new Error('DiatonicSort: both objects must be Note instances');
    }
    return n1.GetDiatonicPitch() < n2.GetDiatonicPitch();
  }
}

/**
 * Unary predicate for sorting notes by course number (C++ TabCourseSort).
 */
export class TabCourseSort {
  public call(first: VrvObject, second: VrvObject): boolean {
    const n1 = first as unknown as Note;
    const n2 = second as unknown as Note;
    if (!n1 || !n2 || typeof n1.GetTabCourse !== 'function' || typeof n2.GetTabCourse !== 'function') {
      throw new Error('TabCourseSort: both objects must be Note instances');
    }
    return n1.GetTabCourse() > n2.GetTabCourse();
  }
}

export class Note extends LayerElement {
  // Composed C++ bases.
  private stemmedDrawingInterface: StemmedDrawingInterface | null = null;
  private altSymInterface: AltSymInterface | null = null;
  private durationInterface: DurationInterface | null = null;
  private offsetInterface: OffsetInterface | null = null;
  private pitchInterface: PitchInterface | null = null;
  private positionInterface: PositionInterface | null = null;

  // Generated attribute components.
  private attColor?: InstColor;
  private attColoration?: InstColoration;
  private attCue?: InstCue;
  private attExtSymAuth?: InstExtSymAuth;
  private attExtSymNames?: InstExtSymNames;
  private attGraced?: InstGraced;
  private attHarmonicFunction?: InstHarmonicFunction;
  private attMidiVelocity?: InstMidiVelocity;
  private attNoteHeads?: InstNoteHeads;
  private attNoteVisMensural?: InstNoteVisMensural;
  private attStems?: InstStems;
  private attStemsCmn?: InstStemsCmn;
  private attStringtab?: InstStringtab;
  private attTiePresent?: InstTiePresent;
  private attVisibility?: InstVisibility;
  // C++ Note has no AttPitchGes of its own; gestural pitch lives in the
  // inherited PitchInterface. Alias keeps the existing call sites working.
  private get attPitchGes(): PitchInterface { return this.pitchInterface!; }

  // Private state (note.h).
  private m_flippedNotehead = false;
  private m_noteGroup: ChordNoteGroup | null = null;
  private m_noteGroupPosition = 0;
  private m_stemSameas: Note | null = null;
  private m_stemSameasRole: StemSameasDrawingRole = StemSameasDrawingRole.SAMEAS_NONE;

  constructor() {
    super(ClassId.NOTE);
    // C++ constructor: interfaces + att classes registered before Reset().
    // TS adaptation: fields initialize after super() (which invokes virtual
    // Reset()), so materialize composed state before registration.
    this.ensureAttributes();
    this.RegisterInterface(this.altSymInterface!.GetAttClasses(), this.altSymInterface!.IsInterface());
    this.RegisterInterface(this.durationInterface!.GetAttClasses(), this.durationInterface!.IsInterface());
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.RegisterInterface(this.pitchInterface!.GetAttClasses(), this.pitchInterface!.IsInterface());
    this.RegisterInterface(this.positionInterface!.GetAttClasses(), this.positionInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_COLORATION);
    this.RegisterAttClass(ATT_CUE);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_GRACED);
    this.RegisterAttClass(ATT_HARMONICFUNCTION);
    this.RegisterAttClass(ATT_NOTEHEADS);
    this.RegisterAttClass(ATT_NOTEVISMENSURAL);
    this.RegisterAttClass(ATT_MIDIVELOCITY);
    this.RegisterAttClass(ATT_STEMS);
    this.RegisterAttClass(ATT_STEMSCMN);
    this.RegisterAttClass(ATT_STRINGTAB);
    this.RegisterAttClass(ATT_TIEPRESENT);
    this.RegisterAttClass(ATT_VISIBILITY);
    this.Reset();
  }

  protected ensureAttributes(): void {
    const self = this;
    // C++ interface cast retains Note's virtual overrides; composition must too.
    this.stemmedDrawingInterface ??= new (class extends StemmedDrawingInterface {
      GetStemUpSE(doc: NoteDocLike, staffSize: number, isCueSize: boolean): Point {
        return self.GetStemUpSE(doc, staffSize, isCueSize);
      }
      GetStemDownNW(doc: NoteDocLike, staffSize: number, isCueSize: boolean): Point {
        return self.GetStemDownNW(doc, staffSize, isCueSize);
      }
      CalcStemLenInThirdUnits(staff: NoteStaffLike & { m_drawingLines: number }, stemDir: number): number {
        return self.CalcStemLenInThirdUnits(staff, stemDir);
      }
    })();
    this.altSymInterface ??= new AltSymInterface();
    this.durationInterface ??= new DurationInterface();
    this.offsetInterface ??= new OffsetInterface();
    this.pitchInterface ??= new PitchInterface();
    this.positionInterface ??= new PositionInterface();
    this.attColor ??= new InstColor();
    this.attColoration ??= new InstColoration();
    this.attCue ??= new InstCue();
    this.attExtSymAuth ??= new InstExtSymAuth();
    this.attExtSymNames ??= new InstExtSymNames();
    this.attGraced ??= new InstGraced();
    this.attHarmonicFunction ??= new InstHarmonicFunction();
    this.attMidiVelocity ??= new InstMidiVelocity();
    this.attNoteHeads ??= new InstNoteHeads();
    this.attNoteVisMensural ??= new InstNoteVisMensural();
    this.attStems ??= new InstStems();
    this.attStemsCmn ??= new InstStemsCmn();
    this.attStringtab ??= new InstStringtab();
    this.attTiePresent ??= new InstTiePresent();
    this.attVisibility ??= new InstVisibility();
  }

  public Reset(): void {
    this.ensureAttributes();
    super.Reset();
    this.stemmedDrawingInterface!.Reset();
    this.altSymInterface!.Reset();
    this.durationInterface!.Reset();
    this.offsetInterface!.Reset();
    this.pitchInterface!.Reset();
    this.positionInterface!.Reset();
    this.attColor!.ResetColor();
    this.attColoration!.ResetColoration();
    this.attCue!.ResetCue();
    this.attExtSymAuth!.ResetExtSymAuth();
    this.attExtSymNames!.ResetExtSymNames();
    this.attGraced!.ResetGraced();
    this.attHarmonicFunction!.ResetHarmonicFunction();
    this.attNoteHeads!.ResetNoteHeads();
    this.attNoteVisMensural!.ResetNoteVisMensural();
    this.attMidiVelocity!.ResetMidiVelocity();
    this.attStems!.ResetStems();
    this.attStemsCmn!.ResetStemsCmn();
    this.attStringtab!.ResetStringtab();
    this.attTiePresent!.ResetTiePresent();
    this.attVisibility!.ResetVisibility();

    this.m_noteGroupPosition = 0;
    this.m_noteGroup = null;
    this.m_flippedNotehead = false;
    this.m_stemSameas = null;
    this.m_stemSameasRole = StemSameasDrawingRole.SAMEAS_NONE;
  }

  public CloneReset(): void {
    this.m_noteGroupPosition = 0;
    this.m_noteGroup = null;
    this.m_flippedNotehead = false;
    this.m_stemSameas = null;
    this.m_stemSameasRole = StemSameasDrawingRole.SAMEAS_NONE;
  }

  public GetClassName(): string { return 'note'; }

  public Clone(): VrvObject {
    const clone = new Note();
    clone.AssignFrom(this);
    clone.CloneReset();
    this.CopyNoteState(clone);
    return clone;
  }

  protected CopyNoteState(clone: Note): void {
    // Explicit copy of composed interface/attribute state (TS has no
    // automatic member copy of these components).
    clone.m_flippedNotehead = this.m_flippedNotehead;
    clone.m_noteGroupPosition = this.m_noteGroupPosition;
    clone.m_stemSameasRole = this.m_stemSameasRole;
    clone.m_stemSameas = this.m_stemSameas;
    clone.m_noteGroup = this.m_noteGroup;
    clone.attColor!.SetColor(this.attColor!.GetColor());
    clone.attColoration!.SetColored(this.attColoration!.GetColored());
    clone.attCue!.SetCue(this.attCue!.GetCue());
    if (this.attGraced!.HasGrace()) clone.attGraced!.SetGrace(this.attGraced!.GetGrace());
    if (this.attGraced!.HasGraceTime()) clone.attGraced!.SetGraceTime(this.attGraced!.GetGraceTime());
    clone.attStringtab!.SetTabFret(this.attStringtab!.GetTabFret());
    clone.attStringtab!.SetTabCourse(this.attStringtab!.GetTabCourse());
    clone.attExtSymNames!.SetGlyphName(this.attExtSymNames!.GetGlyphName());
    clone.attExtSymNames!.SetGlyphNum(this.attExtSymNames!.GetGlyphNum());
    clone.attVisibility!.SetVisible(this.attVisibility!.GetVisible());
    if (this.attNoteHeads!.HasHeadShape()) {
      const hs = this.attNoteHeads!.GetHeadShape() as data_HEADSHAPE;
      if (hs.GetType() === HEADSHAPE_headShapeList) clone.attNoteHeads!.GetHeadShape().SetHeadShapeList(hs.GetHeadShapeList());
      else if (hs.GetType() === HEADSHAPE_hexnum) clone.attNoteHeads!.GetHeadShape().SetHexnum(hs.GetHexnum());
    }
    clone.attNoteHeads!.SetHeadFill(this.attNoteHeads!.GetHeadFill());
    clone.attNoteHeads!.SetHeadMod(this.attNoteHeads!.GetHeadMod());
    clone.altSymInterface!.SetAltsym(this.altSymInterface!.GetAltsym());
    clone.pitchInterface!.SetPname(this.pitchInterface!.GetPname());
    if (this.pitchInterface!.HasOct()) clone.pitchInterface!.SetOct(this.pitchInterface!.GetOct());
    if (this.pitchInterface!.HasOctDefault()) clone.pitchInterface!.SetOctDefault(this.pitchInterface!.GetOctDefault());
    if (this.attPitchGes!.HasOctGes()) clone.attPitchGes!.SetOctGes(this.attPitchGes!.GetOctGes());
    if (this.positionInterface!.HasLoc()) clone.positionInterface!.SetLoc(this.positionInterface!.GetLoc());
    clone.durationInterface!.SetDur(this.durationInterface!.GetDur());
    if (this.durationInterface!.HasDurGes()) clone.durationInterface!.SetDurGes(this.durationInterface!.GetDurGes());
    if (this.attStems!.HasStemDir()) clone.attStems!.SetStemDir(this.attStems!.GetStemDir());
    if (this.attStems!.HasStemLen()) clone.attStems!.SetStemLen(this.attStems!.GetStemLen());
    if (this.attStems!.HasStemMod()) clone.attStems!.SetStemMod(this.attStems!.GetStemMod());
    if (this.attStems!.HasStemPos()) clone.attStems!.SetStemPos(this.attStems!.GetStemPos());
    if (this.attStems!.HasStemSameas()) clone.attStems!.SetStemSameas(this.attStems!.GetStemSameas());
    if (this.attStems!.HasStemVisible()) clone.attStems!.SetStemVisible(this.attStems!.GetStemVisible());
    if (this.attStems!.HasStemX()) clone.attStems!.SetStemX(this.attStems!.GetStemX());
    if (this.attStems!.HasStemY()) clone.attStems!.SetStemY(this.attStems!.GetStemY());
    if (this.attStringtab!.HasTabFret()) clone.attStringtab!.SetTabFret(this.attStringtab!.GetTabFret());
    if (this.attStringtab!.HasTabCourse()) clone.attStringtab!.SetTabCourse(this.attStringtab!.GetTabCourse());
    if (this.attStringtab!.HasTabFing()) clone.attStringtab!.SetTabFing(this.attStringtab!.GetTabFing());
    if (this.attStringtab!.HasTabLine()) clone.attStringtab!.SetTabLine(this.attStringtab!.GetTabLine());
    if (this.attStringtab!.HasTabString()) clone.attStringtab!.SetTabString(this.attStringtab!.GetTabString());
    if (this.attHarmonicFunction!.HasDeg()) clone.attHarmonicFunction!.SetDeg(this.attHarmonicFunction!.GetDeg());
    if (this.attMidiVelocity!.HasVel()) clone.attMidiVelocity!.SetVel(this.attMidiVelocity!.GetVel());
    if (this.attStemsCmn!.HasStemWith()) clone.attStemsCmn!.SetStemWith(this.attStemsCmn!.GetStemWith());
    if (this.attTiePresent!.HasTie()) clone.attTiePresent!.SetTie(this.attTiePresent!.GetTie());
    if (this.attNoteVisMensural!.HasLig()) clone.attNoteVisMensural!.SetLig(this.attNoteVisMensural!.GetLig());
    if (this.attExtSymAuth!.HasGlyphAuth()) clone.attExtSymAuth!.SetGlyphAuth(this.attExtSymAuth!.GetGlyphAuth());
    if (this.attExtSymAuth!.HasGlyphUri()) clone.attExtSymAuth!.SetGlyphUri(this.attExtSymAuth!.GetGlyphUri());
    if (this.offsetInterface!.HasHo()) clone.offsetInterface!.SetHo(this.offsetInterface!.GetHo());
    if (this.offsetInterface!.HasVo()) clone.offsetInterface!.SetVo(this.offsetInterface!.GetVo());
  }

  // ---------------- Interface getters ----------------
  public GetAltSymInterface(): AltSymInterface | null { return this.altSymInterface; }
  public GetDurationInterface(): DurationInterface | null { return this.durationInterface; }
  public GetOffsetInterface(): OffsetInterface | null { return this.offsetInterface; }
  public GetPitchInterface(): PitchInterface | null { return this.pitchInterface; }
  public GetPositionInterface(): PositionInterface | null { return this.positionInterface; }
  public GetStemmedDrawingInterface(): StemmedDrawingInterface | null { return this.stemmedDrawingInterface; }

  public HasToBeAligned(): boolean { return true; }

  // ---------------- Child policy ----------------
  public IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.ACCID, ClassId.ARTIC, ClassId.DOTS, ClassId.PLICA, ClassId.REFRAIN, ClassId.STEM, ClassId.SYL, ClassId.VERSE];
    if (supported.includes(classId)) return true;
    if (VrvObject.IsEditorialElement(classId)) return true;
    return false;
  }

  public AddChild(child: VrvObject): boolean {
    if (!this.IsSupportedChild(child.GetClassId()) || !this.AddChildAdditionalCheck(child)) {
      LogError("Adding '%s' to a '%s'", child.GetClassName(), this.GetClassName());
      return false;
    }
    child.SetParent(this);
    const children = this.GetChildrenForModification();
    // Stem and dots are always added to the front for the drawing order
    if (child.IsAnyOf([ClassId.DOTS, ClassId.STEM] as unknown as number[])) {
      children.unshift(child);
    } else {
      children.push(child);
    }
    this.Modify();
    return true;
  }

  public AddChildAdditionalCheck(child: VrvObject): boolean {
    if (child.Is(ClassId.ACCID)) {
      if (this.FindDescendantByComparison(isAttributeComparison(ClassId.ACCID))) {
        LogWarning('Having both @accid or @accid.ges and <accid> child will cause problems');
      }
    } else if (child.Is(ClassId.ARTIC)) {
      if (this.FindDescendantByComparison(isAttributeComparison(ClassId.ARTIC))) {
        LogWarning('Having both @artic and <artic> child will cause problems');
      }
    }
    return super.AddChildAdditionalCheck(child);
  }

  // ---------------- Dots shift alignment ----------------
  public AlignDotsShift(otherNote: Note): void {
    const dots = this.FindDescendantByType(ClassId.DOTS, 1) as { GetFlagShift(): number; SetFlagShift(v: number): void } | null;
    const otherDots = otherNote.FindDescendantByType(ClassId.DOTS, 1) as { GetFlagShift(): number; SetFlagShift(v: number): void } | null;
    if (!dots || !otherDots) return;
    if (otherDots.GetFlagShift()) {
      dots.SetFlagShift(otherDots.GetFlagShift());
    }
  }

  // ---------------- Accid pointer ----------------
  public GetDrawingAccid(): Accid | null {
    return this.FindDescendantByType(ClassId.ACCID) as Accid | null;
  }

  // ---------------- Chord / TabGrp ancestry ----------------
  public IsChordTone(): NoteChordLike | null {
    return this.GetFirstAncestor(ClassId.CHORD, MAX_CHORD_DEPTH) as unknown as NoteChordLike | null;
  }

  public GetDrawingDur(): data_DURATION {
    const staff = this.GetAncestorStaff() as unknown as NoteStaffLike | null;
    if (staff?.IsTabStaffLike?.()) {
      const tabGrpParent = this.GetFirstAncestor(ClassId.TABGRP, MAX_TABGRP_DEPTH) as unknown as NoteTabGrpLike | null;
      if (tabGrpParent && !this.durationInterface!.HasDur()) {
        return tabGrpParent.GetActualDur();
      }
    } else {
      const chordParent = this.GetFirstAncestor(ClassId.CHORD, MAX_CHORD_DEPTH) as unknown as NoteChordLike | null;
      if (chordParent && !this.durationInterface!.HasDur()) {
        return chordParent.GetActualDur();
      }
    }
    return this.durationInterface!.GetActualDur();
  }

  public IsNoteGroupExtreme(): boolean {
    const noteGroup = this.m_noteGroup!;
    if (this === noteGroup[0]) return true;
    return this === noteGroup[noteGroup.length - 1];
  }

  public IsTabGrpNote(): NoteTabGrpLike | null {
    return this.GetFirstAncestor(ClassId.TABGRP, MAX_TABGRP_DEPTH) as unknown as NoteTabGrpLike | null;
  }

  // ---------------- Tab fret string ----------------
  public GetTabFretString(notationType: number, refs: { overline: number; strike: number; underline: number }): number[] {
    let overline = 0;
    let strike = 0;
    let underline = 0;

    // @glyph.num, @glyph.name or @altsym
    const resources = this.GetDocResources() as unknown as NoteResourcesLike | null;
    if (resources) {
      const fretStr: number[] = [];
      if (this.attExtSymNames!.HasGlyphNum()) {
        const code = this.attExtSymNames!.GetGlyphNum();
        if (resources.GetGlyph(code)) fretStr.push(code);
      } else if (this.attExtSymNames!.HasGlyphName()) {
        const code = resources.GetGlyphCode(this.attExtSymNames!.GetGlyphName());
        if (resources.GetGlyph(code)) fretStr.push(code);
      } else if (this.altSymInterface!.HasAltsym() && this.altSymInterface!.HasAltSymbolDef()) {
        const symbolDef = this.altSymInterface!.GetAltSymbolDef() as unknown as VrvObject;
        for (const child of symbolDef.GetChildren()) {
          if (child.Is(ClassId.SYMBOL)) {
            const symbol = child as unknown as NoteSymbolLike;
            if (symbol.HasGlyphNum()) {
              const code = symbol.GetGlyphNum();
              if (resources.GetGlyph(code)) fretStr.push(code);
            } else if (symbol.HasGlyphName()) {
              const code = resources.GetGlyphCode(symbol.GetGlyphName());
              if (resources.GetGlyph(code)) fretStr.push(code);
            }
          }
        }
      }
      if (fretStr.length) {
        refs.overline = overline; refs.strike = strike; refs.underline = underline;
        return fretStr;
      }
    }

    if (notationType === NOTATIONTYPE_tab_lute_italian) {
      const fretStr: number[] = [];
      const fret = this.attStringtab!.GetTabFret();
      const course = this.attStringtab!.GetTabCourse();

      if (course <= 7 || fret !== 0) {
        const quot = Math.trunc(fret / 10);
        const rem = fret % 10;
        if (quot > 0) fretStr.push(SMUFL_EBE0_luteItalianFret0 + quot);
        if (rem <= 9) fretStr.push(SMUFL_EBE0_luteItalianFret0 + rem);
        if (course >= 7) strike = 1;
        underline = Math.max(0, course - 7);
      } else {
        const quot = Math.trunc(course / 10);
        const rem = course % 10;
        if (quot > 0) fretStr.push(SMUFL_EBE0_luteItalianFret0 + quot);
        if (rem <= 9) fretStr.push(SMUFL_EBE0_luteItalianFret0 + rem);
      }
      refs.overline = overline; refs.strike = strike; refs.underline = underline;
      return fretStr;
    }

    if (notationType === NOTATIONTYPE_tab_lute_french) {
      const fretStr: number[] = [];
      const fret = this.attStringtab!.GetTabFret();
      const course = this.attStringtab!.GetTabCourse();
      if (course >= 11) {
        fretStr.push(SMUFL_EBE4_luteItalianFret4 + course - 11);
      } else if (course >= 7 && fret === 0) {
        fretStr.push(SMUFL_EBCD_luteFrench7thCourse + course - 7);
      } else {
        if (course >= 8) {
          for (let i = 0; i < course - 7; i++) fretStr.push(SMUFL_E101_noteheadSlashHorizontalEnds);
        }
        const letter = [
          SMUFL_EBC0_luteFrenchFretA, SMUFL_EBC1_luteFrenchFretB, SMUFL_EBC2_luteFrenchFretC,
          SMUFL_EBC3_luteFrenchFretD, SMUFL_EBC4_luteFrenchFretE, SMUFL_EBC5_luteFrenchFretF,
          SMUFL_EBC6_luteFrenchFretG, SMUFL_EBC7_luteFrenchFretH, SMUFL_EBC8_luteFrenchFretI,
          SMUFL_EBC9_luteFrenchFretK, SMUFL_EBCA_luteFrenchFretL, SMUFL_EBCC_luteFrenchFretN,
          SMUFL_EBCB_luteFrenchFretM, SMUFL_EBCC_luteFrenchFretN,
        ];
        if (fret >= 0 && fret < letter.length) {
          for (const c of [letter[fret]]) fretStr.push(c);
        }
      }
      refs.overline = overline; refs.strike = strike; refs.underline = underline;
      return fretStr;
    }

    if (notationType === NOTATIONTYPE_tab_lute_german) {
      const fretStr: number[] = [];
      const fret = this.attStringtab!.GetTabFret();
      const course = this.attStringtab!.GetTabCourse();

      if (course >= 6 && fret >= 0 && fret <= 13) {
        if (fret === 0) {
          fretStr.push(SMUFL_EA51_figbass1);
          strike = course - 5;
        } else {
          fretStr.push(SMUFL_EC17_luteGermanAUpper + fret - 1);
          overline = course - 6;
        }
      } else if (course >= 1 && course <= 5 && fret === 0) {
        const digit = [SMUFL_EA51_figbass1, SMUFL_EA52_figbass2, SMUFL_EA54_figbass3, SMUFL_EA55_figbass4, SMUFL_EA57_figbass5];
        fretStr.push(digit[5 - course]);
      } else if (course >= 1 && course <= 5 && fret >= 0 && fret <= 10) {
        const firstAlphabetFret = fret <= 5 ? fret : fret - 5;
        if (course === 2 && firstAlphabetFret === 5) {
          fretStr.push(SMUFL_EA5F_figbass7Raised2);
        } else if (course === 1 && firstAlphabetFret === 5) {
          fretStr.push(SMUFL_EA61_figbass9);
        } else {
          fretStr.push(SMUFL_EC00_luteGermanALower + (5 - course) + (firstAlphabetFret - 1) * 5);
        }
        overline = fret >= 6 ? 1 : 0;
      }
      refs.overline = overline; refs.strike = strike; refs.underline = underline;
      return fretStr;
    }

    const str = String(this.attStringtab!.GetTabFret());
    refs.overline = overline; refs.strike = strike; refs.underline = underline;
    return UTF8to32(str);
  }

  // ---------------- Unison / enharmonic / MIDI ----------------
  public IsUnisonWith(note: Note, ignoreAccid = false): boolean {
    if (!ignoreAccid && !this.IsEnharmonicWith(note)) return false;
    return this.GetPname() === note.GetPname() && this.GetOct() === note.GetOct();
  }

  public SetNoteGroup(noteGroup: ChordNoteGroup, position: number): void {
    this.m_noteGroup = noteGroup;
    this.m_noteGroupPosition = position;
  }

  public GetNoteGroup(): ChordNoteGroup | null { return this.m_noteGroup; }
  public GetNoteGroupPosition(): number { return this.m_noteGroupPosition; }

  public SetFlippedNotehead(flippedNotehead: boolean): void { this.m_flippedNotehead = flippedNotehead; }
  public GetFlippedNotehead(): boolean { return this.m_flippedNotehead; }

  public GetDiatonicPitch(): number {
    if (this.pitchInterface!.HasOct()) {
      const pitch = this.pitchInterface!.HasPname() ? this.pitchInterface!.GetPname() - 1 : 0;
      return this.pitchInterface!.GetOct() * 7 + pitch;
    } else if (this.positionInterface!.HasLoc()) {
      let layer = this.GetFirstAncestor(ClassId.LAYER) as unknown as NoteLayerLike | null;
      let layerElementY: unknown = this;
      if (this.m_crossStaff && this.m_crossLayer) {
        layerElementY = (this.m_crossLayer as unknown as NoteLayerLike).GetAtPos(this.GetDrawingX());
        layer = this.m_crossLayer as unknown as NoteLayerLike;
      }
      if (!layer) throw new Error('Note::GetDiatonicPitch: layer ancestor required');
      const clefLocOffset = layer.GetClefLocOffset(layerElementY);
      return this.positionInterface!.GetLoc() + OCTAVE_OFFSET * 7 - clefLocOffset;
    }
    return 0;
  }

  // ---------------- Stem attachment ----------------
  public GetStemUpSE(doc: NoteDocLike, staffSize: number, isCueSize: boolean): Point {
    let defaultYShift = Math.trunc(doc.GetDrawingUnit(staffSize) / 4);
    if (isCueSize) defaultYShift = doc.GetCueSize(defaultYShift);
    const defaultXShift = doc.GetGlyphWidth(this.GetNoteheadGlyph(this.durationInterface!.GetActualDur()), staffSize, isCueSize);
    const p = new Point(defaultXShift, defaultYShift);

    let code = this.GetNoteheadGlyph(this.GetDrawingDur());

    if (this.durationInterface!.IsMensuralDur()) {
      code = this.GetMensuralNoteheadGlyph();
      p.y = Math.trunc(doc.GetGlyphHeight(code, staffSize, isCueSize) / 2);
      p.x = doc.GetGlyphWidth(code, staffSize, isCueSize);
    }

    const resources = doc.GetResources();
    const glyph = resources.GetGlyph(code) as NoteGlyphLike | null;
    if (!glyph) throw new Error('Note::GetStemUpSE: glyph required');

    if (glyph.HasAnchor(SMUFL_stemUpSE)) {
      const anchor = glyph.GetAnchor(SMUFL_stemUpSE);
      const converted = doc.ConvertFontPoint(glyph, anchor, staffSize, isCueSize);
      p.x = converted.x; p.y = converted.y;
    }
    return p;
  }

  public GetStemDownNW(doc: NoteDocLike, staffSize: number, isCueSize: boolean): Point {
    let defaultYShift = Math.trunc(doc.GetDrawingUnit(staffSize) / 4);
    if (isCueSize) defaultYShift = doc.GetCueSize(defaultYShift);
    const p = new Point(0, -defaultYShift);

    let code = this.GetNoteheadGlyph(this.GetDrawingDur());

    if (this.durationInterface!.IsMensuralDur()) {
      code = this.GetMensuralNoteheadGlyph();
      p.y = Math.trunc(-doc.GetGlyphHeight(code, staffSize, isCueSize) / 2);
      p.x = doc.GetGlyphWidth(code, staffSize, isCueSize);
    }

    const resources = doc.GetResources();
    const glyph = resources.GetGlyph(code) as NoteGlyphLike | null;
    if (!glyph) throw new Error('Note::GetStemDownNW: glyph required');

    if (glyph.HasAnchor(SMUFL_stemDownNW)) {
      const anchor = glyph.GetAnchor(SMUFL_stemDownNW);
      const converted = doc.ConvertFontPoint(glyph, anchor, staffSize, isCueSize);
      p.x = converted.x; p.y = converted.y;
    }
    return p;
  }

  public CalcStemLenInThirdUnits(staff: NoteStaffLike & { m_drawingLines: number }, stemDir: number): number {
    if (stemDir !== STEMDIRECTION_down && stemDir !== STEMDIRECTION_up) return 0;

    let baseStem = (staff.IsTablature?.() || staff.IsTabStaffLike?.()) ? STANDARD_STEMLENGTH_TAB : STANDARD_STEMLENGTH;
    baseStem *= 3;

    let shortening = 0;
    const unitToLine = (stemDir === STEMDIRECTION_up)
      ? -this.positionInterface!.GetDrawingLoc() + Math.imul((staff.m_drawingLines - 1) | 0, 2)
      : this.positionInterface!.GetDrawingLoc();
    if (unitToLine < 5) {
      switch (unitToLine) {
        case 4: shortening = 1; break;
        case 3: shortening = 2; break;
        case 2: shortening = 3; break;
        case 1: shortening = 4; break;
        case 0: shortening = 5; break;
        default: shortening = 6;
      }
    }

    if ((this.GetDrawingDur() > DURATION_4) && !this.IsInBeam()) {
      if (this.stemmedDrawingInterface!.GetDrawingStemDir() === STEMDIRECTION_up) {
        shortening = Math.min(4, shortening);
      } else {
        shortening = Math.min(3, shortening);
      }
    }

    baseStem -= shortening;
    return baseStem;
  }

  // ---------------- Notehead glyphs ----------------
  public GetMensuralNoteheadGlyph(): number {
    if (!this.durationInterface!.IsMensuralDur()) {
      throw new Error('Note::GetMensuralNoteheadGlyph: mensural duration required');
    }
    const drawingDur = this.GetDrawingDur();
    if (drawingDur < DURATION_1) return 0;

    const staff = this.GetAncestorStaff() as unknown as NoteStaffLike | null;
    const mensuralBlack = staff?.m_drawingNotationType === NOTATIONTYPE_mensural_black;

    let code = 0;
    if (mensuralBlack) {
      code = SMUFL_E938_mensuralNoteheadSemibrevisBlack;
    } else {
      if (this.attColoration!.GetColored() === BOOLEAN_true) {
        if (drawingDur > DURATION_2) code = SMUFL_E93C_mensuralNoteheadMinimaWhite;
        else code = SMUFL_E93D_mensuralNoteheadSemiminimaWhite;
      } else {
        if (drawingDur > DURATION_2) code = SMUFL_E93D_mensuralNoteheadSemiminimaWhite;
        else code = SMUFL_E93C_mensuralNoteheadMinimaWhite;
      }
    }
    return code;
  }

  public GetNoteheadGlyph(duration: data_DURATION): number {
    const additionalNoteheadSymbols = new Map<string, number>([
      ['noteheadDiamondBlackWide', SMUFL_E0DC_noteheadDiamondBlackWide],
      ['noteheadDiamondWhiteWide', SMUFL_E0DE_noteheadDiamondWhiteWide],
      ['noteheadNull', SMUFL_E0A5_noteheadNull],
    ]);

    if (this.attExtSymNames!.HasGlyphName()) {
      const glyph = this.attExtSymNames!.GetGlyphName();
      if (!additionalNoteheadSymbols.has(glyph)) return SMUFL_E0A4_noteheadBlack;
      return additionalNoteheadSymbols.get(glyph)!;
    }

    if (this.attNoteHeads!.HasHeadShape()) {
      const hs = this.attNoteHeads!.GetHeadShape() as data_HEADSHAPE;
      if (hs.GetType() === HEADSHAPE_headShapeList) {
        switch (this.attNoteHeads!.GetHeadShape().GetHeadShapeList()) {
          case HEADSHAPE_list_quarter: return SMUFL_E0A4_noteheadBlack;
          case HEADSHAPE_list_half: return SMUFL_E0A3_noteheadHalf;
          case HEADSHAPE_list_whole: return SMUFL_E0A2_noteheadWhole;
          case HEADSHAPE_list_plus: return SMUFL_E0AF_noteheadPlusBlack;
          case HEADSHAPE_list_diamond: {
            if (duration < DURATION_4) {
              return this.attNoteHeads!.GetHeadFill() === FILL_solid ? SMUFL_E0DB_noteheadDiamondBlack : SMUFL_E0D9_noteheadDiamondHalf;
            } else {
              return this.attNoteHeads!.GetHeadFill() === FILL_void ? SMUFL_E0D9_noteheadDiamondHalf : SMUFL_E0DB_noteheadDiamondBlack;
            }
          }
          case HEADSHAPE_list_rectangle: {
            if (duration < DURATION_4) {
              return this.attNoteHeads!.GetHeadFill() === FILL_solid ? SMUFL_E0B9_noteheadSquareBlack : SMUFL_E0B8_noteheadSquareWhite;
            } else {
              return this.attNoteHeads!.GetHeadFill() === FILL_void ? SMUFL_E0B8_noteheadSquareWhite : SMUFL_E0B9_noteheadSquareBlack;
            }
          }
          case HEADSHAPE_list_slash: {
            if (DURATION_1 >= duration) return SMUFL_E102_noteheadSlashWhiteWhole;
            if (DURATION_2 === duration) return SMUFL_E103_noteheadSlashWhiteHalf;
            return SMUFL_E101_noteheadSlashHorizontalEnds;
          }
          case HEADSHAPE_list_x: {
            if (DURATION_1 === duration) return SMUFL_E0B5_noteheadWholeWithX;
            if (DURATION_2 === duration) return SMUFL_E0B6_noteheadHalfWithX;
            return SMUFL_E0A9_noteheadXBlack;
          }
          default: break;
        }
      } else if (hs.GetType() === HEADSHAPE_hexnum) {
        return this.attNoteHeads!.GetHeadShape().GetHexnum();
      }
    }

    switch (this.attNoteHeads!.GetHeadMod()) {
      case NOTEHEADMODIFIER_fences: return SMUFL_E0A0_noteheadDoubleWhole;
      default: break;
    }

    if (!this.attNoteHeads!.HasHeadFill()) {
      const staff = this.GetAncestorStaff() as unknown as NoteStaffLike | null;
      if (staff?.IsTabStaffLike?.()) return SMUFL_E0A4_noteheadBlack;
    }

    if (DURATION_breve === duration) return SMUFL_E0A1_noteheadDoubleWholeSquare;
    if (DURATION_1 === duration) {
      return this.attNoteHeads!.GetHeadFill() === FILL_solid ? SMUFL_E0FA_noteheadWholeFilled : SMUFL_E0A2_noteheadWhole;
    }
    if (DURATION_2 === duration) {
      return this.attNoteHeads!.GetHeadFill() === FILL_solid ? SMUFL_E0FB_noteheadHalfFilled : SMUFL_E0A3_noteheadHalf;
    }
    return this.attNoteHeads!.GetHeadFill() === FILL_void ? SMUFL_E0A3_noteheadHalf : SMUFL_E0A4_noteheadBlack;
  }

  // ---------------- Visibility ----------------
  public IsVisible(): boolean {
    if (this.attVisibility!.HasVisible()) {
      return this.attVisibility!.GetVisible() === BOOLEAN_true;
    } else if (this.GetParent() && this.GetParent()!.Is(ClassId.CHORD)) {
      const chord = this.GetParent() as unknown as NoteChordLike;
      return chord.IsVisible();
    }
    return true;
  }

  // ---------------- MIDI ----------------
  public GetMIDIPitch(shift = 0, octaveShift = 0): number {
    let pitch = 0;
    if (this.attPitchGes!.HasPnum()) {
      pitch = this.attPitchGes!.GetPnum();
    } else if (this.pitchInterface!.HasPname() || this.attPitchGes!.HasPnameGes()) {
      const pclass = this.GetPitchClass();
      let oct = this.pitchInterface!.GetOct() + octaveShift;
      if (this.attPitchGes!.HasOctGes()) oct = this.attPitchGes!.GetOctGes();
      pitch = pclass + (oct + 1) * 12;
    } else if (this.attStringtab!.HasTabCourse()) {
      const staff = this.GetAncestorStaff() as unknown as NoteStaffLike | null;
      if (staff?.m_drawingTuning) {
        pitch = staff.m_drawingTuning.CalcPitchNumber(
          this.attStringtab!.GetTabCourse(), this.attStringtab!.GetTabFret(), staff.m_drawingNotationType ?? 0);
      }
    }
    return pitch + shift;
  }

  public GetPitchClass(): number {
    let pname = this.pitchInterface!.GetPname();
    if (this.attPitchGes!.HasPnameGes()) pname = this.attPitchGes!.GetPnameGes();
    let pitchClass = Note.PnameToPclass(pname);
    pitchClass += this.GetChromaticAlteration();
    return pitchClass;
  }

  private GetChromaticAlteration(): number {
    const accid = this.GetDrawingAccid();
    if (accid) {
      return TransPitch.GetChromaticAlteration(accid.GetAccidGes(), accid.GetAccid());
    }
    return 0;
  }

  // ---------------- Transposition ----------------
  public GetTransPitch(): TransPitch {
    const pname = this.pitchInterface!.GetPname() - PITCHNAME_c;
    return new TransPitch(pname, this.GetChromaticAlteration(), this.pitchInterface!.GetOct());
  }

  public UpdateFromTransPitch(tp: TransPitch, hasKeySig: boolean): void {
    this.pitchInterface!.SetPname(tp.GetPitchName());

    let accid = this.GetDrawingAccid();
    if (!accid) {
      accid = new Accid();
      this.AddChild(accid);
    }

    let transposeGesturalAccid = accid.HasAccidGes();
    let transposeWrittenAccid = accid.HasAccid();
    if (!accid.HasAccidGes() && !accid.HasAccid()) {
      transposeGesturalAccid = true;
    }

    if (!hasKeySig && transposeGesturalAccid) {
      accid.ResetAccidentalGes();
      transposeGesturalAccid = false;
      if (tp.m_accid !== 0) transposeWrittenAccid = true;
    }

    if (transposeGesturalAccid) accid.SetAccidGes(tp.GetAccidGes());
    if (transposeWrittenAccid) accid.SetAccid(tp.GetAccidWritten());

    if (this.pitchInterface!.GetOct() !== tp.m_oct) {
      if (this.attPitchGes!.HasOctGes()) {
        this.attPitchGes!.SetOctGes(this.attPitchGes!.GetOctGes() + tp.m_oct - this.pitchInterface!.GetOct());
      }
      this.pitchInterface!.SetOct(tp.m_oct);
    }
  }

  // ---------------- Stem sameas ----------------
  public HasStemSameasNote(): boolean { return this.m_stemSameas !== null; }
  public GetStemSameasNote(): Note | null { return this.m_stemSameas; }
  public SetStemSameasNote(stemSameas: Note | null): void { this.m_stemSameas = stemSameas; }
  public GetStemSameasRole(): StemSameasDrawingRole { return this.m_stemSameasRole; }
  public SetStemSameasRole(role: StemSameasDrawingRole): void { this.m_stemSameasRole = role; }

  public IsCursor(): boolean { return false; }

  public CalcStemDirForSameasNote(verticalCenter: number): number {
    if (!this.m_stemSameas) throw new Error('Note::CalcStemDirForSameasNote: stem sameas note required');
    if (!this.m_stemSameas.HasStemSameasNote()) throw new Error('Note::CalcStemDirForSameasNote: sameas backlink required');
    if (this.m_stemSameas.GetStemSameasNote() !== this) throw new Error('Note::CalcStemDirForSameasNote: sameas backlink must point to this');

    if (this.m_stemSameasRole === StemSameasDrawingRole.SAMEAS_UNSET) {
      let stemDir = STEMDIRECTION_up;
      const topNote = this.GetDrawingY() > this.m_stemSameas.GetDrawingY() ? this : this.m_stemSameas;
      const bottomNote = this.GetDrawingY() > this.m_stemSameas.GetDrawingY() ? this.m_stemSameas : this;
      if (this.attStems!.HasStemDir()) {
        stemDir = this.attStems!.GetStemDir();
      } else {
        const topY = topNote.GetDrawingY();
        const bottomY = bottomNote.GetDrawingY();
        const middlePoint = Math.trunc((topY + bottomY) / 2);
        stemDir = middlePoint > verticalCenter ? STEMDIRECTION_down : STEMDIRECTION_up;
      }
      topNote.SetStemSameasRole(stemDir === STEMDIRECTION_up ? StemSameasDrawingRole.SAMEAS_PRIMARY : StemSameasDrawingRole.SAMEAS_SECONDARY);
      bottomNote.SetStemSameasRole(stemDir === STEMDIRECTION_up ? StemSameasDrawingRole.SAMEAS_SECONDARY : StemSameasDrawingRole.SAMEAS_PRIMARY);

      this.CalcNoteHeadShiftForSameasNote(this.m_stemSameas, stemDir);
      return stemDir;
    }
    return this.m_stemSameas.stemmedDrawingInterface!.GetDrawingStemDir();
  }

  public CalcNoteHeadShiftForSameasNote(stemSameas: Note, stemDir: number): void {
    if (Math.abs(this.GetDiatonicPitch() - stemSameas.GetDiatonicPitch()) > 1) return;

    let noteToShift: Note = this;
    if (stemDir === STEMDIRECTION_up) {
      if (this.GetDrawingY() < stemSameas.GetDrawingY()) noteToShift = stemSameas;
    } else {
      if (this.GetDrawingY() > stemSameas.GetDrawingY()) noteToShift = stemSameas;
    }
    noteToShift.SetFlippedNotehead(true);
  }

  public IsEnharmonicWith(note: Note): boolean {
    return this.GetMIDIPitch() === note.GetMIDIPitch();
  }

  // ---------------- Static methods ----------------
  public static HandleLedgerLineStemCollision(
    doc: { GetDrawingUnit(staffSize: number): number },
    staff: NoteStaffLike & { m_drawingStaffSize: number; m_drawingLines: number; GetDrawingY(): number },
    note1: Note,
    note2: Note,
  ): boolean {
    if (note1.GetDrawingLoc() === note2.GetDrawingLoc()) return false;
    const upperNote = note1.GetDrawingLoc() > note2.GetDrawingLoc() ? note1 : note2;
    const lowerNote = note1.GetDrawingLoc() > note2.GetDrawingLoc() ? note2 : note1;

    if (upperNote.GetDrawingStemDir() !== STEMDIRECTION_down) return false;
    if (lowerNote.GetDrawingStemDir() !== STEMDIRECTION_up) return false;

    const linesRefUpper = { above: 0, below: 0 };
    const linesRefLower = { above: 0, below: 0 };
    (note1 as unknown as { HasLedgerLines(above: { value: number }, below: { value: number }, staff: unknown): void })
      .HasLedgerLines(linesRefUpper.above !== undefined ? { value: 0 } : { value: 0 }, { value: 0 }, staff);
    // PositionInterface::HasLedgerLines mutates {value} refs.
    const aboveUpper = { value: 0 }; const belowUpper = { value: 0 };
    const aboveLower = { value: 0 }; const belowLower = { value: 0 };
    (upperNote as unknown as { HasLedgerLines(a: { value: number }, b: { value: number }, s: unknown): void }).HasLedgerLines(aboveUpper, belowUpper, staff);
    (lowerNote as unknown as { HasLedgerLines(a: { value: number }, b: { value: number }, s: unknown): void }).HasLedgerLines(aboveLower, belowLower, staff);

    const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);

    if (belowLower.value > belowUpper.value) {
      const upperChord = upperNote.IsChordTone();
      const upperStem = upperChord?.GetDrawingStem?.() ?? upperNote.GetDrawingStem();
      if (upperStem) {
        const staffBottom = staff.GetDrawingY() - Math.imul(Math.imul((staff.m_drawingLines - 1) | 0, 2), unit);
        const stemBottom = upperStem.GetSelfBottom();
        if (stemBottom < staffBottom - unit) return true;
      }
    }

    if (aboveUpper.value > aboveLower.value) {
      const lowerChord = lowerNote.IsChordTone();
      const lowerStem = lowerChord?.GetDrawingStem?.() ?? lowerNote.GetDrawingStem();
      if (lowerStem) {
        const staffTop = staff.GetDrawingY();
        const stemTop = lowerStem.GetSelfTop();
        if (stemTop > staffTop + unit) return true;
      }
    }
    return false;
  }

  public static PnameToPclass(pitchName: number): number {
    switch (pitchName) {
      case PITCHNAME_c: return 0;
      case PITCHNAME_c + 1: return 2;
      case PITCHNAME_c + 2: return 4;
      case PITCHNAME_c + 3: return 5;
      case PITCHNAME_c + 4: return 7;
      case PITCHNAME_c + 5: return 9;
      case PITCHNAME_c + 6: return 11;
      default: return 0;
    }
  }

  // ---------------- Visitor dispatch ----------------
  public Accept(functor: object): FunctorCode {
    return visit(functor, 'VisitNote', this);
  }

  public AcceptEnd(functor: object): FunctorCode {
    return visit(functor, 'VisitNoteEnd', this);
  }

  // ---------------- Location calculation ----------------
  protected CalcNoteLocations(predicate: NotePredicate | null = null): MapOfNoteLocs {
    if (predicate && !predicate(this)) return new Map();
    const staff = this.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF) as unknown as StaffLike;
    const noteLocations = MapOfNoteLocsProto(staff, [this.positionInterface!.GetDrawingLoc()]);
    return noteLocations;
  }

  protected CalcDotLocations(layerCount: number, primary: boolean): MapOfDotLocs {
    const isUpwardDirection = this.stemmedDrawingInterface!.GetDrawingStemDir() === STEMDIRECTION_up || layerCount === 1;
    const shiftUpwards = isUpwardDirection === primary;
    const noteLocs = this.CalcNoteLocations();
    if (noteLocs.size !== 1) throw new Error('Note::CalcDotLocations: exactly one note location expected');
    const entry = noteLocs.entries().next();
    if (!entry.done) {
      const staff = entry.value[0];
      const loc0 = entry.value[1].values().next().value as number;
      let loc = loc0;
      if (loc % 2 === 0) loc += shiftUpwards ? 1 : -1;
      return MapOfNoteLocsProto(staff, [loc]) as unknown as MapOfDotLocs;
    }
    throw new Error('Note::CalcDotLocations: exactly one note location expected');
  }

  // ------------- Pitch/position/duration forwarding surface -------------
  // PitchInterface facade
  public GetPname(): number { return this.pitchInterface!.GetPname(); }
  public SetPname(v: number): void { this.pitchInterface!.SetPname(v); }
  public HasPname(): boolean { return this.pitchInterface!.HasPname(); }
  public GetOct(): number { return this.pitchInterface!.GetOct(); }
  public SetOct(v: number): void { this.pitchInterface!.SetOct(v); }
  public HasOct(): boolean { return this.pitchInterface!.HasOct(); }
  public GetOctDefault(): number { return this.pitchInterface!.GetOctDefault(); }
  public SetOctDefault(v: number): void { this.pitchInterface!.SetOctDefault(v); }
  public HasOctDefault(): boolean { return this.pitchInterface!.HasOctDefault(); }
  public GetOctGes(): number { return this.attPitchGes!.GetOctGes(); }
  public SetOctGes(v: number): void { this.attPitchGes!.SetOctGes(v); }
  public HasOctGes(): boolean { return this.attPitchGes!.HasOctGes(); }
  public GetPnameGes(): number { return this.attPitchGes!.GetPnameGes(); }
  public SetPnameGes(v: number): void { this.attPitchGes!.SetPnameGes(v); }
  public HasPnameGes(): boolean { return this.attPitchGes!.HasPnameGes(); }
  public GetPnum(): number { return this.attPitchGes!.GetPnum(); }
  public HasPnum(): boolean { return this.attPitchGes!.HasPnum(); }

  // PositionInterface facade
  public GetLoc(): number { return this.positionInterface!.GetLoc(); }
  public SetLoc(v: number): void { this.positionInterface!.SetLoc(v); }
  public HasLoc(): boolean { return this.positionInterface!.HasLoc(); }
  public GetPloc(): number { return this.positionInterface!.GetPloc(); }
  public SetPloc(v: number): void { this.positionInterface!.SetPloc(v); }
  public GetOloc(): number { return this.positionInterface!.GetOloc(); }
  public SetOloc(v: number): void { this.positionInterface!.SetOloc(v); }
  public CalcDrawingLoc(layer: any, element: any): number { return this.positionInterface!.CalcDrawingLoc(layer, element); }
  public HasLedgerLines(linesAboveRef: { value: number } | any, linesBelowRef: { value: number } | any, staff: any): boolean {
    return this.positionInterface!.HasLedgerLines(linesAboveRef, linesBelowRef, staff);
  }

  // DurationInterface facade
  public GetDur(): data_DURATION { return this.durationInterface!.GetDur(); }
  public SetDur(v: data_DURATION): void { this.durationInterface!.SetDur(v); }
  /** C++ DurationInterface::SetNum/SetNumbase (iocmme proportionate durations). */
  public SetNum(v: number): void { this.durationInterface!.SetNum(v); }
  public SetNumbase(v: number): void { this.durationInterface!.SetNumbase(v); }
  /** C++ DurationInterface forwarding (iohumdrum convertNote). */
  public SetBreaksec(v: number): void { this.durationInterface!.SetBreaksec(v); }
  public GetBreaksec(): number { return this.durationInterface!.GetBreaksec(); }
  public HasBreaksec(): boolean { return this.durationInterface!.HasBreaksec(); }
  public SetDurQuality(v: number): void { this.durationInterface!.SetDurQuality(v); }
  public HasDur(): boolean { return this.durationInterface!.HasDur(); }
  public GetActualDur(): data_DURATION { return this.durationInterface!.GetActualDur(); }
  public IsMensuralDur(): boolean { return this.durationInterface!.IsMensuralDur(); }
  public GetDurGes(): data_DURATION { return this.durationInterface!.GetDurGes(); }
  public SetDurGes(v: data_DURATION): void { this.durationInterface!.SetDurGes(v); }  public SetDots(v: number): void { this.durationInterface!.SetDots(v); }
  public SetFermata(v: number): void { this.durationInterface!.SetFermata(v); }
  public GetFermata(): number { return this.durationInterface!.GetFermata(); }
  public HasFermata(): boolean { return this.durationInterface!.HasFermata(); }
  public ResetFermataPresent(): void { this.durationInterface!.ResetFermataPresent(); }
  public SetDotsGes(v: number): void { this.durationInterface!.SetDotsGes(v); }
  public SetDurPpq(v: number): void { this.durationInterface!.SetDurPpq(v); }
  public GetDurPpq(): number { return this.durationInterface!.GetDurPpq(); }
  public SetStaff(v: number[]): void { this.durationInterface!.SetStaff(v); }
  public GetStaff(): number[] { return this.durationInterface!.GetStaff(); }
  public HasStaff(): boolean { return this.durationInterface!.HasStaff(); }
  public ResetStaffIdent(): void { this.durationInterface!.ResetStaffIdent(); }
  public GetDots(): number { return this.durationInterface!.GetDots(); }
  public HasDots(): boolean { return this.durationInterface!.HasDots(); }
  public ResetAugmentDots(): void { this.durationInterface!.ResetAugmentDots(); }
  public SetScoreTimeOnset(v: Fraction): void { this.durationInterface!.SetScoreTimeOnset(v); }
  public SetRealTimeOnsetSeconds(v: number): void { this.durationInterface!.SetRealTimeOnsetSeconds(v); }
  public SetScoreTimeOffset(v: Fraction): void { this.durationInterface!.SetScoreTimeOffset(v); }
  public SetRealTimeOffsetSeconds(v: number): void { this.durationInterface!.SetRealTimeOffsetSeconds(v); }
  public SetScoreTimeTiedDuration(v: Fraction): void { this.durationInterface!.SetScoreTimeTiedDuration(v); }
  public GetScoreTimeOnset(): Fraction { return this.durationInterface!.GetScoreTimeOnset(); }
  public GetRealTimeOnsetMilliseconds(): number { return this.durationInterface!.GetRealTimeOnsetMilliseconds(); }
  public GetScoreTimeOffset(): Fraction { return this.durationInterface!.GetScoreTimeOffset(); }
  public GetRealTimeOffsetMilliseconds(): number { return this.durationInterface!.GetRealTimeOffsetMilliseconds(); }
  public GetScoreTimeTiedDuration(): Fraction { return this.durationInterface!.GetScoreTimeTiedDuration(); }
  public GetScoreTimeDuration(): Fraction { return this.durationInterface!.GetScoreTimeDuration(); }

  // StemmedDrawingInterface facade
  public GetDrawingStem(): StemLikeContract | null { return this.stemmedDrawingInterface!.GetDrawingStem() as unknown as StemLikeContract | null; }
  public SetDrawingStem(s: unknown): void { this.stemmedDrawingInterface!.SetDrawingStem(s as never); }
  public GetDrawingStemDir(): number { return this.stemmedDrawingInterface!.GetDrawingStemDir(); }
  public SetDrawingStemDir(d: number): void { this.stemmedDrawingInterface!.SetDrawingStemDir(d); }
  public GetDrawingStemLen(): number { return this.stemmedDrawingInterface!.GetDrawingStemLen(); }
  public SetDrawingStemLen(n: number): void { this.stemmedDrawingInterface!.SetDrawingStemLen(n); }
  public GetDrawingStemModRelY(): number { return this.stemmedDrawingInterface!.GetDrawingStemModRelY(); }
  public GetDrawingLoc(): number { return this.positionInterface!.GetDrawingLoc(); }
  public SetDrawingLoc(v: number): void { this.positionInterface!.SetDrawingLoc(v); }

  // Stringtab facade
  public GetTabFret(): number { return this.attStringtab!.GetTabFret(); }
  public SetTabFret(v: number): void { this.attStringtab!.SetTabFret(v); }
  public HasTabFret(): boolean { return this.attStringtab!.HasTabFret(); }
  public GetTabCourse(): number { return this.attStringtab!.GetTabCourse(); }
  public SetTabCourse(v: number): void { this.attStringtab!.SetTabCourse(v); }
  public HasTabCourse(): boolean { return this.attStringtab!.HasTabCourse(); }
  public GetTabFing(): string { return this.attStringtab!.GetTabFing(); }
  public SetTabFing(v: string): void { this.attStringtab!.SetTabFing(v); }
  public HasTabFing(): boolean { return this.attStringtab!.HasTabFing(); }
  public GetTabLine(): number { return this.attStringtab!.GetTabLine(); }
  public SetTabLine(v: number): void { this.attStringtab!.SetTabLine(v); }
  public HasTabLine(): boolean { return this.attStringtab!.HasTabLine(); }
  public GetTabString(): string { return this.attStringtab!.GetTabString(); }
  public SetTabString(v: string): void { this.attStringtab!.SetTabString(v); }
  public HasTabString(): boolean { return this.attStringtab!.HasTabString(); }
  public ResetStringtab(): void { this.attStringtab!.ResetStringtab(); }

  // NoteHeads facade
  public GetHeadShapeAlternate(): data_HEADSHAPE { return this.attNoteHeads!.GetHeadShape(); }
  public GetHeadShape(): data_HEADSHAPE { return this.attNoteHeads!.GetHeadShape(); }
  public SetHeadShape(v: data_HEADSHAPE): void { this.attNoteHeads!.SetHeadShape(v); }
  public SetHeadShapeList(v: number): void { this.attNoteHeads!.GetHeadShape().SetHeadShapeList(v); }
  public SetHexnum(v: number): void { this.attNoteHeads!.GetHeadShape().SetHexnum(v); }
  public GetHeadFill(): number { return this.attNoteHeads!.GetHeadFill(); }
  public SetHeadFill(v: number): void { this.attNoteHeads!.SetHeadFill(v); }
  public HasHeadFill(): boolean { return this.attNoteHeads!.HasHeadFill(); }
  public GetHeadMod(): number { return this.attNoteHeads!.GetHeadMod(); }
  public SetHeadMod(v: number): void { this.attNoteHeads!.SetHeadMod(v); }
  public HasHeadMod(): boolean { return this.attNoteHeads!.HasHeadMod(); }
  public HasHeadShape(): boolean { return this.attNoteHeads!.HasHeadShape(); }

  // Color facade
  public GetColor(): string { return this.attColor!.GetColor(); }
  public SetColor(v: string): void { this.attColor!.SetColor(v); }
  public HasColor(): boolean { return this.attColor!.HasColor(); }
  public ResetColor(): void { this.attColor!.ResetColor(); }
  public SetColored(v: number): void { this.attColoration!.SetColored(v); }
  public GetColored(): number { return this.attColoration!.GetColored(); }
  public HasColored(): boolean { return this.attColoration!.GetColored() !== BOOLEAN_NONE; }

  // Visibility facade
  public GetVisible(): number { return this.attVisibility!.GetVisible(); }
  public SetVisible(v: number): void { this.attVisibility!.SetVisible(v); }
  public HasVisible(): boolean { return this.attVisibility!.HasVisible(); }
  public ResetVisibility(): void { this.attVisibility!.ResetVisibility(); }

  // ExtSymNames facade
  public GetGlyphName(): string { return this.attExtSymNames!.GetGlyphName(); }
  public SetGlyphName(v: string): void { this.attExtSymNames!.SetGlyphName(v); }
  public HasGlyphName(): boolean { return this.attExtSymNames!.HasGlyphName(); }
  public GetGlyphNum(): number { return this.attExtSymNames!.GetGlyphNum(); }
  public SetGlyphNum(v: number): void { this.attExtSymNames!.SetGlyphNum(v); }
  public HasGlyphNum(): boolean { return this.attExtSymNames!.HasGlyphNum(); }

  // AltSym facade
  public HasAltsym(): boolean { return this.altSymInterface!.HasAltsym(); }
  public SetAltsym(v: string): void { this.altSymInterface!.SetAltsym(v); }
  public GetAltsym(): string { return this.altSymInterface!.GetAltsym(); }
  public HasAltSymbolDef(): boolean { return this.altSymInterface!.HasAltSymbolDef(); }
  public GetAltSymbolDef(): SymbolDefLike | null { return this.altSymInterface!.GetAltSymbolDef(); }

  // Stems facade
  public GetStemDir(): number { return this.attStems!.GetStemDir(); }
  public SetStemDir(v: number): void { this.attStems!.SetStemDir(v); }
  public HasStemDir(): boolean { return this.attStems!.HasStemDir(); }
  public GetStemLen(): number { return this.attStems!.GetStemLen(); }
  public SetStemLen(v: number): void { this.attStems!.SetStemLen(v); }
  public HasStemLen(): boolean { return this.attStems!.HasStemLen(); }
  public GetStemMod(): number { return this.attStems!.GetStemMod(); }
  public SetStemMod(v: number): void { this.attStems!.SetStemMod(v); }
  public HasStemMod(): boolean { return this.attStems!.HasStemMod(); }
  public GetStemPos(): number { return this.attStems!.GetStemPos(); }
  public SetStemPos(v: number): void { this.attStems!.SetStemPos(v); }
  public HasStemPos(): boolean { return this.attStems!.HasStemPos(); }
  public GetStemSameas(): string { return this.attStems!.GetStemSameas(); }
  public SetStemSameas(v: string): void { this.attStems!.SetStemSameas(v); }
  /** C++ LayerElement::SetSameas (iohumdrum checkForJoin). */
  public SetSameas(v: string): void { this.GetLinkingInterface()?.SetSameas(v); }
  public HasStemSameas(): boolean { return this.attStems!.HasStemSameas(); }
  public GetStemVisible(): number { return this.attStems!.GetStemVisible(); }
  public SetStemVisible(v: number): void { this.attStems!.SetStemVisible(v); }
  public HasStemVisible(): boolean { return this.attStems!.HasStemVisible(); }
  public GetStemX(): number { return this.attStems!.GetStemX(); }
  public SetStemX(v: number): void { this.attStems!.SetStemX(v); }
  public HasStemX(): boolean { return this.attStems!.HasStemX(); }
  public GetStemY(): number { return this.attStems!.GetStemY(); }
  public SetStemY(v: number): void { this.attStems!.SetStemY(v); }
  public HasStemY(): boolean { return this.attStems!.HasStemY(); }
  public ResetStems(): void { this.attStems!.ResetStems(); }

  // Offset facade
  public GetHo(): number { return this.offsetInterface!.GetHo(); }
  public SetHo(v: number): void { this.offsetInterface!.SetHo(v); }
  public HasHo(): boolean { return this.offsetInterface!.HasHo(); }
  public ResetOffset(): void { this.offsetInterface!.Reset(); }

  // HarmonicFunction facade
  public GetDeg(): string { return this.attHarmonicFunction!.GetDeg(); }
  public SetDeg(v: string): void { this.attHarmonicFunction!.SetDeg(v); }
  public HasDeg(): boolean { return this.attHarmonicFunction!.HasDeg(); }
  public ResetHarmonicFunction(): void { this.attHarmonicFunction!.ResetHarmonicFunction(); }

  // ExtSymAuth facade
  public GetGlyphAuth(): string { return this.attExtSymAuth!.GetGlyphAuth(); }
  public SetGlyphAuth(v: string): void { this.attExtSymAuth!.SetGlyphAuth(v); }
  public HasGlyphAuth(): boolean { return this.attExtSymAuth!.HasGlyphAuth(); }
  public GetGlyphUri(): string { return this.attExtSymAuth!.GetGlyphUri(); }
  public SetGlyphUri(v: string): void { this.attExtSymAuth!.SetGlyphUri(v); }
  public HasGlyphUri(): boolean { return this.attExtSymAuth!.HasGlyphUri(); }
  public ResetExtSymAuth(): void { this.attExtSymAuth!.ResetExtSymAuth(); }
  public ResetExtSymNames(): void { this.attExtSymNames!.ResetExtSymNames(); }

  // NoteVisMensural facade
  public GetLig(): number { return this.attNoteVisMensural!.GetLig(); }
  public SetLig(v: number): void { this.attNoteVisMensural!.SetLig(v); }
  public HasLig(): boolean { return this.attNoteVisMensural!.HasLig(); }
  public ResetNoteVisMensural(): void { this.attNoteVisMensural!.ResetNoteVisMensural(); }

  // MidiVelocity facade
  public GetVel(): number { return this.attMidiVelocity!.GetVel(); }
  public SetVel(v: number): void { this.attMidiVelocity!.SetVel(v); }
  public HasVel(): boolean { return this.attMidiVelocity!.HasVel(); }
  public ResetMidiVelocity(): void { this.attMidiVelocity!.ResetMidiVelocity(); }

  // StemsCmn facade
  public GetStemWith(): number { return this.attStemsCmn!.GetStemWith(); }
  public SetStemWith(v: number): void { this.attStemsCmn!.SetStemWith(v); }
  public HasStemWith(): boolean { return this.attStemsCmn!.HasStemWith(); }
  public ResetStemsCmn(): void { this.attStemsCmn!.ResetStemsCmn(); }

  // TiePresent facade
  public GetTie(): number { return this.attTiePresent!.GetTie(); }
  public SetTie(v: number): void { this.attTiePresent!.SetTie(v); }
  public HasTie(): boolean { return this.attTiePresent!.HasTie(); }
  public ResetTiePresent(): void { this.attTiePresent!.ResetTiePresent(); }

  // Cue facade
  public GetCue(): number { return this.attCue!.GetCue(); }
  public SetCue(v: number): void { this.attCue!.SetCue(v); }
  public HasCue(): boolean { return this.attCue!.HasCue(); }
  public ResetCue(): void { this.attCue!.ResetCue(); }

  // Graced facade
  public GetGrace(): number { return this.attGraced!.GetGrace(); }
  public SetGrace(v: number): void { this.attGraced!.SetGrace(v); }
  public HasGrace(): boolean { return this.attGraced!.HasGrace(); }
  public GetGraceTime(): number { return this.attGraced!.GetGraceTime(); }
  public SetGraceTime(v: number): void { this.attGraced!.SetGraceTime(v); }
  public HasGraceTime(): boolean { return this.attGraced!.HasGraceTime(); }
  public ResetGraced(): void { this.attGraced!.ResetGraced(); }

  // NoteHeads additional facade
  public GetHeadAltsym(): string { return this.attNoteHeads!.GetHeadAltsym(); }
  public SetHeadAltsym(v: string): void { this.attNoteHeads!.SetHeadAltsym(v); }
  public HasHeadAltsym(): boolean { return this.attNoteHeads!.HasHeadAltsym(); }
  public GetHeadAuth(): string { return this.attNoteHeads!.GetHeadAuth(); }
  public SetHeadAuth(v: string): void { this.attNoteHeads!.SetHeadAuth(v); }
  public HasHeadAuth(): boolean { return this.attNoteHeads!.HasHeadAuth(); }
  public GetHeadColor(): string { return this.attNoteHeads!.GetHeadColor(); }
  public SetHeadColor(v: string): void { this.attNoteHeads!.SetHeadColor(v); }
  public HasHeadColor(): boolean { return this.attNoteHeads!.HasHeadColor(); }
  public GetHeadFillcolor(): string { return this.attNoteHeads!.GetHeadFillcolor(); }
  public SetHeadFillcolor(v: string): void { this.attNoteHeads!.SetHeadFillcolor(v); }
  public HasHeadFillcolor(): boolean { return this.attNoteHeads!.HasHeadFillcolor(); }
  public GetHeadRotation(): number { return this.attNoteHeads!.GetHeadRotation(); }
  public SetHeadRotation(v: number): void { this.attNoteHeads!.SetHeadRotation(v); }
  public HasHeadRotation(): boolean { return this.attNoteHeads!.HasHeadRotation(); }
  public GetHeadVisible(): number { return this.attNoteHeads!.GetHeadVisible(); }
  public SetHeadVisible(v: number): void { this.attNoteHeads!.SetHeadVisible(v); }
  public HasHeadVisible(): boolean { return this.attNoteHeads!.HasHeadVisible(); }
  public ResetNoteHeads(): void { this.attNoteHeads!.ResetNoteHeads(); }
}

// Anchor IDs are enum ordinals, not SMuFL glyph code points.
const { SMUFL_stemUpSE, SMUFL_stemDownNW } = SMuFLGlyphAnchor;

/** C++ FunctorInterface VisitNote default: forward to VisitObject. */
function visit(functor: object, methodName: string, note: Note): FunctorCode {
  const anyFunctor = functor as Record<string, unknown>;
  if (typeof anyFunctor[methodName] === 'function') {
    return (anyFunctor[methodName] as (n: Note) => FunctorCode)(note);
  }
  if (typeof anyFunctor.VisitObject === 'function') {
    return (anyFunctor.VisitObject as (n: Note) => FunctorCode)(note);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

ObjectFactory.GetInstance().Register('note', ClassId.NOTE, () => new Note());
