/**
 * Pure TypeScript translation of Verovio's `src/rest.cpp` /
 * `include/vrv/rest.h`.
 *
 * `Rest` models the MEI `<rest>` element.
 *
 * C++ multiple inheritance (LayerElement + AltSymInterface + DurationInterface
 * + OffsetInterface + PositionInterface + AttColor + AttCue +
 * AttEnclosingChars + AttExtSymAuth + AttExtSymNames + AttRestVisMensural)
 * is represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, BACKWARD, FORWARD, data_DURATION } from './vrvdef.js';
import type { Fraction } from './fraction.js';
import {
  DURATION_NONE, DURATION_longa, DURATION_maxima, DURATION_long, DURATION_breve,
  DURATION_1, DURATION_2, DURATION_4, DURATION_8, DURATION_16, DURATION_32,
  DURATION_64, DURATION_128, DURATION_256, DURATION_512, DURATION_1024,
} from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { ObjectFactory, VrvObject } from './object.js';
import { AltSymInterface, SymbolDefLike } from './altsyminterface.js';
import { DurationInterface } from './durationinterface.js';
import { OffsetInterface } from './offsetinterface.js';
import { PositionInterface } from './positioninterface.js';
import { PitchInterface } from './pitchinterface.js';
import { InstColor, InstCue, InstEnclosingChars } from './atts_shared.js';
import { InstExtSymAuth } from './atts_externalsymbols.js';
import { InstExtSymNames } from './atts_externalsymbols.js';
import { InstRestVisMensural } from './atts_mensural.js';
import { STAFFREL_basic_NONE } from './drawinginterface.js';
import { AttNIntegerComparison } from './comparison.js';
import { GetRelativeLayerElementFunctor } from './findlayerelementsfunctor.js';
import { ENCLOSURE_brack, ENCLOSURE_paren, ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_x, ACCIDENTAL_WRITTEN_n } from './accid.js';
import { LogError } from './vrv.js';

// Canonical libmei AttClassId ordinals (attmodule.ts ATT_CLASS_IDS).
const ATT_COLOR = 109;
const ATT_CUE = 116;
const ATT_ENCLOSINGCHARS = 129;
const ATT_EXTSYMAUTH = 46;
const ATT_EXTSYMNAMES = 47;
const ATT_RESTVISMENSURAL = 74;

// SMuFL glyph codes (src/smufl.ts).
import {
  SMUFL_E4E1_restLonga, SMUFL_E4E2_restDoubleWhole, SMUFL_E4E3_restWhole, SMUFL_E4E4_restHalf,
  SMUFL_E4E5_restQuarter, SMUFL_E4E6_rest8th, SMUFL_E4E7_rest16th, SMUFL_E4E8_rest32nd,
  SMUFL_E4E9_rest64th, SMUFL_E4EA_rest128th, SMUFL_E4EB_rest256th, SMUFL_E4EC_rest512th,
  SMUFL_E4ED_rest1024th,
  SMUFL_E9F0_mensuralRestMaxima, SMUFL_E9F2_mensuralRestLongaImperfecta,
  SMUFL_E9F3_mensuralRestBrevis, SMUFL_E9F4_mensuralRestSemibrevis,
  SMUFL_E9F5_mensuralRestMinima, SMUFL_E9F6_mensuralRestSemiminima,
  SMUFL_E9F7_mensuralRestFusa, SMUFL_E9F8_mensuralRestSemifusa,
  SMUFL_E26C_accidentalBracketLeft, SMUFL_E26D_accidentalBracketRight,
  SMUFL_E26A_accidentalParensLeft, SMUFL_E26B_accidentalParensRight,
} from './smufl.js';

/** RestLayer from `rest.h` (C++ enum). */
export enum RestLayer {
  RL_UNSET = -1,
  RL_sameLayer = 0,
  RL_otherLayer = 1,
}

/** RestAccidental from `rest.h` (C++ enum). */
export enum RestAccidental {
  RA_UNSET = -1,
  RA_none = 0,
  RA_s = 1,
  RA_f = 2,
  RA_x = 3,
  RA_n = 4,
}

/** RestLayerPlace from `rest.h` (C++ enum). */
export enum RestLayerPlace {
  RLP_UNSET = -1,
  RLP_restOnTopLayer = 0,
  RLP_restOnBottomLayer = 1,
}

/** RestNotePlace from `rest.h` (C++ enum). */
export enum RestNotePlace {
  RNP_UNSET = -1,
  RNP_noteInSpace = 0,
  RNP_noteOnLine = 1,
}

/** helper function for conversion. */
export function MeiAccidentalToRestAccidental(accidental: number): RestAccidental {
  switch (accidental) {
    case ACCIDENTAL_WRITTEN_s: return RestAccidental.RA_s;
    case ACCIDENTAL_WRITTEN_f: return RestAccidental.RA_f;
    case ACCIDENTAL_WRITTEN_x: return RestAccidental.RA_x;
    case ACCIDENTAL_WRITTEN_n: return RestAccidental.RA_n;
    default: return RestAccidental.RA_none;
  }
}

/** g_defaultRests offset table (rest.cpp static initialiser, verbatim). */
function buildDefaultRests(): Map<number, Map<number, Map<number, Map<number, Map<number, number>>>>> {
  const D = (v: [number, number][]): Map<number, number> => new Map(v);
  const NP = (inSpace: [number, number][], onLine: [number, number][]): Map<number, Map<number, number>> =>
    new Map([[RestNotePlace.RNP_noteInSpace, D(inSpace)], [RestNotePlace.RNP_noteOnLine, D(onLine)]]);
  const LP = (top: Map<number, Map<number, number>>, bottom: Map<number, Map<number, number>>): Map<number, Map<number, Map<number, number>>> =>
    new Map([[RestLayerPlace.RLP_restOnTopLayer, top], [RestLayerPlace.RLP_restOnBottomLayer, bottom]]);
  const RA = (placeMaps: Map<number, Map<number, Map<number, Map<number, number>>>>): Map<number, Map<number, Map<number, Map<number, number>>>> => placeMaps;

  const top_1_2_3_3 = [[DURATION_1, 3], [DURATION_2, 3], [DURATION_4, 5], [DURATION_8, 5],
    [DURATION_16, 7], [DURATION_32, 7], [DURATION_64, 9], [DURATION_128, 9],
    [DURATION_long, 5], [DURATION_breve, 5]] as [number, number][];
  const line_1_2_2_4 = [[DURATION_1, 2], [DURATION_2, 4], [DURATION_4, 6], [DURATION_8, 4],
    [DURATION_16, 6], [DURATION_32, 6], [DURATION_64, 8], [DURATION_128, 8],
    [DURATION_long, 6], [DURATION_breve, 4]] as [number, number][];
  const bottomInSpace = [[DURATION_1, -5], [DURATION_2, -5], [DURATION_4, -5], [DURATION_8, -5],
    [DURATION_16, -5], [DURATION_32, -7], [DURATION_64, -7], [DURATION_128, -9],
    [DURATION_long, -5], [DURATION_breve, -5]] as [number, number][];
  const bottomOnLine_f = [[DURATION_1, -6], [DURATION_2, -6], [DURATION_4, -6], [DURATION_8, -4],
    [DURATION_16, -4], [DURATION_32, -6], [DURATION_64, -6], [DURATION_128, -8],
    [DURATION_long, -6], [DURATION_breve, -6]] as [number, number][];
  const bottomOnLine_plain = [[DURATION_1, -6], [DURATION_2, -6], [DURATION_4, -6], [DURATION_8, -6],
    [DURATION_16, -6], [DURATION_32, -6], [DURATION_64, -6], [DURATION_128, -8],
    [DURATION_long, -6], [DURATION_breve, -6]] as [number, number][];

  return new Map<number, Map<number, Map<number, Map<number, Map<number, number>>>>>([
    [RestLayer.RL_otherLayer, RA(new Map([
      [RestAccidental.RA_none, LP(
        NP(top_1_2_3_3, line_1_2_2_4),
        NP(bottomInSpace, bottomOnLine_f))],
      [RestAccidental.RA_s, LP(
        NP([[DURATION_1, 3], [DURATION_2, 5], [DURATION_4, 7], [DURATION_8, 5],
          [DURATION_16, 7], [DURATION_32, 7], [DURATION_64, 9], [DURATION_128, 9],
          [DURATION_long, 5], [DURATION_breve, 5]] as [number, number][],
          [[DURATION_1, 2], [DURATION_2, 4], [DURATION_4, 6], [DURATION_8, 6],
            [DURATION_16, 8], [DURATION_32, 8], [DURATION_64, 10], [DURATION_128, 10],
            [DURATION_long, 6], [DURATION_breve, 4]] as [number, number][]),
        NP(bottomInSpace, bottomOnLine_plain))],
      [RestAccidental.RA_f, LP(
        NP(top_1_2_3_3,
          [[DURATION_1, 4], [DURATION_2, 4], [DURATION_4, 6], [DURATION_8, 6],
            [DURATION_16, 8], [DURATION_32, 8], [DURATION_64, 10], [DURATION_128, 10],
            [DURATION_long, 6], [DURATION_breve, 4]] as [number, number][]),
        NP(bottomInSpace, bottomOnLine_f))],
      [RestAccidental.RA_x, LP(
        NP(top_1_2_3_3,
          [[DURATION_1, 2], [DURATION_2, 4], [DURATION_4, 6], [DURATION_8, 6],
            [DURATION_16, 8], [DURATION_32, 8], [DURATION_64, 10], [DURATION_128, 10],
            [DURATION_long, 6], [DURATION_breve, 4]] as [number, number][]),
        NP(bottomInSpace,
          [[DURATION_1, -6], [DURATION_2, -4], [DURATION_4, -6], [DURATION_8, -4],
            [DURATION_16, -4], [DURATION_32, -6], [DURATION_64, -6], [DURATION_128, -8],
            [DURATION_long, -6], [DURATION_breve, -6]] as [number, number][]))],
      [RestAccidental.RA_n, LP(
        NP(top_1_2_3_3,
          [[DURATION_1, 2], [DURATION_2, 6], [DURATION_4, 6], [DURATION_8, 6],
            [DURATION_16, 8], [DURATION_32, 8], [DURATION_64, 10], [DURATION_128, 10],
            [DURATION_long, 6], [DURATION_breve, 4]] as [number, number][]),
        NP([[DURATION_1, -7], [DURATION_2, -5], [DURATION_4, -7], [DURATION_8, -5],
          [DURATION_16, -5], [DURATION_32, -7], [DURATION_64, -7], [DURATION_128, -9],
          [DURATION_long, -5], [DURATION_breve, -5]] as [number, number][],
          bottomOnLine_plain))],
    ]))],
    [RestLayer.RL_sameLayer, RA(new Map([
      [RestAccidental.RA_none, LP(
        NP([[DURATION_1, -1], [DURATION_2, 1], [DURATION_4, 1], [DURATION_8, 1],
          [DURATION_16, 3], [DURATION_32, 3], [DURATION_64, 5], [DURATION_128, 5],
          [DURATION_long, 3], [DURATION_breve, 1]] as [number, number][],
          [[DURATION_1, 0], [DURATION_2, 0], [DURATION_4, 2], [DURATION_8, 2],
            [DURATION_16, 2], [DURATION_32, 2], [DURATION_64, 4], [DURATION_128, 4],
            [DURATION_long, 2], [DURATION_breve, 2]] as [number, number][]),
        NP([[DURATION_1, -3], [DURATION_2, -1], [DURATION_4, -1], [DURATION_8, -1],
          [DURATION_16, -1], [DURATION_32, -3], [DURATION_64, -3], [DURATION_128, -5],
          [DURATION_long, -3], [DURATION_breve, -3]] as [number, number][],
          [[DURATION_1, -2], [DURATION_2, -2], [DURATION_4, -2], [DURATION_8, -2],
            [DURATION_16, -2], [DURATION_32, -4], [DURATION_64, -4], [DURATION_128, -6],
            [DURATION_long, -2], [DURATION_breve, -2]] as [number, number][]))],
    ]))],
  ]);
}

const g_defaultRests = buildDefaultRests();

/** Structural contract for a `Note` (until `src/note.ts` is migrated). */
export interface RestNoteLike {
  GetDrawingAccid(): { GetAccid(): number } | null;
}

/** Structural contract for a `Chord` (until fully integrated). */
export interface RestChordLike {
  GetTopNote(): RestNoteLike;
  GetBottomNote(): RestNoteLike;
}

/** Structural contract for the `Layer` positioning collaborators. */
export interface RestLayerLike {
  GetN(): number;
  GetLayerElementsForTimeSpanOf(element: unknown, withinMeasure: boolean): VrvObject[];
  GetFirstChildNot(classId: ClassId): VrvObject | null;
  Process(functor: unknown): void;
  GetChildCount?(classId: ClassId): number;
}

/** Structural contract for the `Staff` positioning collaborators. */
export interface RestStaffLike {
  GetN(): number;
  GetChildCount(classId: ClassId): number;
}

/** Structural contract for `GetRelativeLayerElementFunctor`. */
export interface GetRelativeLayerElementFunctorLike {
  SetDirection(direction: boolean): void;
  GetRelativeElement(): VrvObject | null;
}

/** Structural contract for the transposition pitch update. */
export interface TransPitchLike {
  GetPitchName(): number;
  m_oct: number;
}

/**
 * Pure TypeScript translation of Verovio's `Rest`.
 */
export class Rest extends LayerElement {
  // TS constructor-phase virtual Reset() dispatch runs before field
  // initializers (established adaptation): interfaces are optional and
  // lazily created on first Reset() so the observable C++ construction
  // ordering is preserved.
  private altSymInterface?: AltSymInterface;
  private durationInterface?: DurationInterface;
  private offsetInterface?: OffsetInterface;
  private positionInterface?: PositionInterface;

  private color?: InstColor;
  private cue?: InstCue;
  private enclosingChars?: InstEnclosingChars;
  private extSymAuth?: InstExtSymAuth;
  private extSymNames?: InstExtSymNames;
  private restVisMensural?: InstRestVisMensural;

  /** Factory wiring using real `GetRelativeLayerElementFunctor`. */
  private static relativeLayerElementFunctorFactory:
    (idx: number, withinMeasure: boolean) => GetRelativeLayerElementFunctorLike = (idx, withinMeasure) => {
    return new GetRelativeLayerElementFunctor(idx, withinMeasure) as unknown as GetRelativeLayerElementFunctorLike;
  };

  public static SetRelativeLayerElementFunctorFactory(
    factory: (idx: number, withinMeasure: boolean) => GetRelativeLayerElementFunctorLike,
  ): void {
    Rest.relativeLayerElementFunctorFactory = factory;
  }

  public constructor() {
    super(ClassId.REST);
    this.ensureAttributes();
    this.RegisterInterface(this.altSymInterface!.GetAttClasses(), this.altSymInterface!.IsInterface());
    this.RegisterInterface(this.durationInterface!.GetAttClasses(), this.durationInterface!.IsInterface());
    this.RegisterInterface(this.offsetInterface!.GetAttClasses(), this.offsetInterface!.IsInterface());
    this.RegisterInterface(this.positionInterface!.GetAttClasses(), this.positionInterface!.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.RegisterAttClass(ATT_CUE);
    this.RegisterAttClass(ATT_ENCLOSINGCHARS);
    this.RegisterAttClass(ATT_EXTSYMAUTH);
    this.RegisterAttClass(ATT_EXTSYMNAMES);
    this.RegisterAttClass(ATT_RESTVISMENSURAL);
    this.Reset();
  }

  private ensureAttributes(): void {
    this.altSymInterface ??= new AltSymInterface();
    this.durationInterface ??= new DurationInterface();
    this.offsetInterface ??= new OffsetInterface();
    this.positionInterface ??= new PositionInterface();
    this.color ??= new InstColor();
    this.cue ??= new InstCue();
    this.enclosingChars ??= new InstEnclosingChars();
    this.extSymAuth ??= new InstExtSymAuth();
    this.extSymNames ??= new InstExtSymNames();
    this.restVisMensural ??= new InstRestVisMensural();
  }

  private requireInterfaces(): void {
    this.ensureAttributes();
  }

  public override Reset(): void {
    super.Reset();
    this.ensureAttributes();
    this.altSymInterface!.Reset();
    this.durationInterface!.Reset();
    this.offsetInterface!.Reset();
    this.positionInterface!.Reset();
    this.color!.ResetColor();
    this.cue!.ResetCue();
    this.enclosingChars!.ResetEnclosingChars();
    this.extSymAuth!.ResetExtSymAuth();
    this.extSymNames!.ResetExtSymNames();
    this.restVisMensural!.ResetRestVisMensural();
  }

  public override Clone(): VrvObject {
    const clone = new Rest();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all members (composition adaptation:
    // AssignFrom covers only the object-tree state). Interface composition
    // members hold external attribute state that is copied explicitly.
    // DurationInterface
    if (this.HasDur()) clone.SetDur(this.GetDur());
    if (this.HasDurGes()) clone.SetDurGes(this.GetDurGes());
    if (this.HasDots()) clone.SetDots(this.GetDots());
    if (this.HasDotsGes()) clone.SetDotsGes(this.GetDotsGes());
    if (this.HasNum()) clone.SetNum(this.GetNum());
    if (this.HasNumbase()) clone.SetNumbase(this.GetNumbase());
    if (this.HasDurQuality()) clone.SetDurQuality(this.GetDurQuality());
    // OffsetInterface
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    // PositionInterface
    if (this.HasPloc()) clone.SetPloc(this.GetPloc());
    if (this.HasOloc()) clone.SetOloc(this.GetOloc());
    if (this.HasLoc()) clone.SetLoc(this.GetLoc());
    // AltSymInterface
    if (this.HasAltsym()) clone.SetAltsym(this.GetAltsym());
    // Attributes
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasCue()) clone.SetCue(this.GetCue());
    if (this.HasEnclose()) clone.SetEnclose(this.GetEnclose());
    if (this.HasGlyphAuth()) clone.SetGlyphAuth(this.GetGlyphAuth());
    if (this.HasGlyphUri()) clone.SetGlyphUri(this.GetGlyphUri());
    if (this.HasGlyphName()) clone.SetGlyphName(this.GetGlyphName());
    if (this.HasGlyphNum()) clone.SetGlyphNum(this.GetGlyphNum());
    if (this.HasSpaces()) clone.SetSpaces(this.GetSpaces());
    return clone;
  }

  public override GetClassName(): string { return 'rest'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    const supported: ClassId[] = [ClassId.DOTS];

    if (supported.includes(classId)) {
      return true;
    }
    else if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    else {
      return false;
    }
  }

  public override AddChild(child: VrvObject): boolean {
    if (!this.IsSupportedChild(child.GetClassId()) || !this.AddChildAdditionalCheck(child)) {
      LogError("Adding '%s' to a '%s'", child.GetClassName(), this.GetClassName());
      return false;
    }

    child.SetParent(this as unknown as VrvObject);

    const children = this.GetChildrenForModification();

    // Dots are always added by PrepareLayerElementParts (for now) and we want them to be in the front
    // for the drawing order in the SVG output
    if (child.Is(ClassId.DOTS)) {
      children.unshift(child);
    }
    else {
      children.push(child);
    }
    this.Modify();

    return true;
  }

  public override GetAltSymInterface(): AltSymInterface | null { this.requireInterfaces(); return this.altSymInterface!; }
  public override GetOffsetInterface(): OffsetInterface | null { this.requireInterfaces(); return this.offsetInterface!; }
  public override GetPositionInterface(): PositionInterface | null { this.requireInterfaces(); return this.positionInterface!; }
  public override GetDurationInterface(): DurationInterface | null { this.requireInterfaces(); return this.durationInterface!; }

  /** Override the method since alignment is required. */
  public override HasToBeAligned(): boolean { return true; }

  /**
   * Get the SMuFL glyph or a rest considering its actual duration.
   * This is valid only for CMN.
   */
  // C++ Rest::GetRestGlyph overloads: GetRestGlyph() uses GetActualDur(),
  // GetRestGlyph(duration) uses the given dur (view_element.cpp:1660 passes the
  // tabGrp-resolved drawingDur). A single optional-arg method covers both.
  public GetRestGlyph(duration?: data_DURATION): number {
    if (duration === undefined) return this.GetRestGlyph(this.GetActualDur());
    const resources = this.GetDocResources() as unknown as {
      GetGlyph(code: number): unknown;
      GetGlyphCode(name: string): number;
    } | null;

    // If there is glyph.num, prioritize it
    if (this.HasGlyphNum()) {
      const code = this.GetGlyphNum();
      if (resources && resources.GetGlyph(code)) return code;
    }
    // If there is glyph.name (second priority)
    else if (this.HasGlyphName()) {
      const code = resources!.GetGlyphCode(this.GetGlyphName());
      if (resources!.GetGlyph(code)) return code;
    }
    // If there is @altsym (third priority)
    else if (this.HasAltsym() && this.HasAltSymbolDef()) {
      const symbolDef = this.GetAltSymbolDef()!;
      const symbol = (symbolDef as unknown as { GetFirst(classId: number): unknown }).GetFirst(ClassId.SYMBOL) as {
        HasGlyphNum(): boolean; GetGlyphNum(): number;
        HasGlyphName(): boolean; GetGlyphName(): string;
      } | null;
      if (symbol !== null) {
        // If there is @glyph.num, return glyph based on it (fourth priority)
        if (symbol.HasGlyphNum()) {
          const code = symbol.GetGlyphNum();
          if (resources && resources.GetGlyph(code)) return code;
        }
        // If there is @glyph.name (fifth priority)
        else if (symbol.HasGlyphName()) {
          const code = resources!.GetGlyphCode(symbol.GetGlyphName());
          if (resources!.GetGlyph(code)) return code;
        }
      }
    }

    if (this.IsMensuralDur()) {
      switch (duration) {
        case DURATION_maxima: return SMUFL_E9F0_mensuralRestMaxima;
        case DURATION_long: return SMUFL_E9F2_mensuralRestLongaImperfecta;
        case DURATION_breve: return SMUFL_E9F3_mensuralRestBrevis;
        case DURATION_1: return SMUFL_E9F4_mensuralRestSemibrevis;
        case DURATION_2: return SMUFL_E9F5_mensuralRestMinima;
        case DURATION_4: return SMUFL_E9F6_mensuralRestSemiminima;
        case DURATION_8: return SMUFL_E9F7_mensuralRestFusa;
        case DURATION_16: return SMUFL_E9F8_mensuralRestSemifusa;
        default: return 0;
      }
    }
    else {
      switch (duration) {
        case DURATION_long: return SMUFL_E4E1_restLonga;
        case DURATION_breve: return SMUFL_E4E2_restDoubleWhole;
        case DURATION_1: return SMUFL_E4E3_restWhole;
        case DURATION_2: return SMUFL_E4E4_restHalf;
        case DURATION_4: return SMUFL_E4E5_restQuarter;
        case DURATION_8: return SMUFL_E4E6_rest8th;
        case DURATION_16: return SMUFL_E4E7_rest16th;
        case DURATION_32: return SMUFL_E4E8_rest32nd;
        case DURATION_64: return SMUFL_E4E9_rest64th;
        case DURATION_128: return SMUFL_E4EA_rest128th;
        case DURATION_256: return SMUFL_E4EB_rest256th;
        case DURATION_512: return SMUFL_E4EC_rest512th;
        case DURATION_1024: return SMUFL_E4ED_rest1024th;
        default: return 0;
      }
    }
  }

  /** Legacy alias kept for existing callers/tests. */
  public GetRestGlyphWithDur(duration: data_DURATION): number {
    return this.GetRestGlyph(duration);
  }

  /** Retrieve parentheses / brackets from the enclose attribute. */
  public GetEnclosingGlyphs(): [number, number] {
    if (this.HasEnclose()) {
      switch (this.GetEnclose()) {
        case ENCLOSURE_brack: return [SMUFL_E26C_accidentalBracketLeft, SMUFL_E26D_accidentalBracketRight];
        case ENCLOSURE_paren: return [SMUFL_E26A_accidentalParensLeft, SMUFL_E26B_accidentalParensRight];
        default: break;
      }
    }
    return [0, 0];
  }

  /** Update the rest location based on the input TransPitch. */
  public UpdateFromTransLoc(tp: TransPitchLike): void {
    if (this.HasOloc() && this.HasPloc()) {
      this.SetPloc(tp.GetPitchName());

      if (this.GetOloc() !== tp.m_oct) {
        this.SetOloc(tp.m_oct);
      }
    }
  }

  /** Get the vertical location for the rests that are located on other layers. */
  public GetOptimalLayerLocation(
    staff: RestStaffLike, layer: RestLayerLike | null, defaultLocation: number,
  ): number {
    const linking = this.GetLinkingInterface();
    if (!layer || (linking && linking.HasSameasLink())) return defaultLocation;
    const isTopLayer = { value: false };
    if (!this.DetermineRestPosition(staff, layer, isTopLayer)) return defaultLocation;

    // find best rest location relative to elements on other layers
    const restOverlap = { value: true };
    const otherLayerRelativeLocationInfo = this.GetLocationRelativeToOtherLayers(layer, isTopLayer.value, restOverlap);
    let currentLayerRelativeLocation = this.GetLocationRelativeToCurrentLayer(staff, layer, isTopLayer.value);
    // C++ `int` arithmetic wraps on overflow: VRV_UNSET (-0x7FFFFFFF) plus a
    // negative offset becomes a large positive, which min()/max() then ignore.
    // `| 0` reproduces the 32-bit wrap; plain float math keeps a large
    // negative that min() wrongly selects (garbage rest Y, broken cast-off).
    let otherLayerRelativeLocation = (otherLayerRelativeLocationInfo[0]
      + this.GetRestOffsetFromOptions(RestLayer.RL_otherLayer, otherLayerRelativeLocationInfo, isTopLayer.value)) | 0;
    if (currentLayerRelativeLocation === VRV_UNSET_SENTINEL) {
      currentLayerRelativeLocation = defaultLocation;
    }
    else {
      const currentLayerRelativeLocationInfo: [number, RestAccidental]
        = [currentLayerRelativeLocation, RestAccidental.RA_none];
      currentLayerRelativeLocation
        += this.GetRestOffsetFromOptions(RestLayer.RL_sameLayer, currentLayerRelativeLocationInfo, isTopLayer.value);
    }
    if (this.m_crossStaff) {
      if (isTopLayer.value) {
        otherLayerRelativeLocation += defaultLocation + 2;
      }
      else {
        otherLayerRelativeLocation -= 2;
      }
    }

    const marginLocation = this.GetMarginLayerLocation(isTopLayer.value, restOverlap.value);
    const optimalLocation = isTopLayer.value
      ? Math.max(otherLayerRelativeLocation, currentLayerRelativeLocation, defaultLocation, marginLocation)
      : Math.min(otherLayerRelativeLocation, currentLayerRelativeLocation, defaultLocation, marginLocation);

    return optimalLocation;
  }

  /**
   * Find whether there is correct number of rests for automatic placement
   * and determine position of the rest (top/bottom) if there is.
   */
  private DetermineRestPosition(staff: RestStaffLike, layer: RestLayerLike, isTopLayer: { value: boolean }): boolean {
    const elements = layer.GetLayerElementsForTimeSpanOf(this, true);
    if (elements.length === 0) return false;

    let firstElement: VrvObject | null = null;
    const layers = new Set<number>();
    for (const element of elements) {
      const layerElement = element as unknown as LayerElement;
      layers.add(layerElement.GetAlignmentLayerN());
      if (!firstElement) firstElement = layerElement;
    }

    if (!firstElement) return false;

    // handle rest positioning for 2 layers. 3 layers and more are much more complex to solve
    if (layers.size === 1) {
      const first = [...layers][0];
      if (this.m_crossStaff) {
        isTopLayer.value = staff.GetN() < (this.m_crossStaff as unknown as RestStaffLike).GetN();
      }
      else if (layer.GetN() < first) {
        isTopLayer.value = true;
      }
      else {
        if (first < 0) {
          const ancestorStaff = (firstElement as unknown as LayerElement).GetAncestorStaff();
          isTopLayer.value = staff.GetN() < (ancestorStaff as unknown as RestStaffLike).GetN();
        }
        else {
          isTopLayer.value = false;
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Get the rest vertical location relative to location of elements placed on
   * other layers.
   */
  private GetLocationRelativeToOtherLayers(
    currentLayer: RestLayerLike, isTopLayer: boolean, restOverlap: { value: boolean },
  ): [number, RestAccidental] {
    if (!currentLayer) return [VRV_UNSET_SENTINEL, RestAccidental.RA_none];

    const collidingElementsList = currentLayer.GetLayerElementsForTimeSpanOf(this, true);
    if (collidingElementsList.length === 0) return [VRV_UNSET_SENTINEL, RestAccidental.RA_none];

    let finalElementInfo: [number, RestAccidental] = [VRV_UNSET_SENTINEL, RestAccidental.RA_none];
    // Go through each colliding element and figure out optimal location for the rest
    for (const object of collidingElementsList) {
      const layerElement = object as unknown as LayerElement;
      const objectLayer = layerElement.m_crossLayer
        ? layerElement.m_crossLayer as unknown as RestLayerLike
        : object.GetFirstAncestor(ClassId.LAYER) as unknown as RestLayerLike;
      if (object.Is(ClassId.NOTE)) restOverlap.value = false;
      const currentElementInfo = this.GetElementLocation(object, objectLayer, isTopLayer);
      if (currentElementInfo[0] === VRV_UNSET_SENTINEL) continue;
      // If note on other layer is not on the same x position as rest - ignore its accidental
      const thisTime = (this.GetAlignment() as unknown as { GetTime?(): number })?.GetTime?.();
      const otherTime = ((object as unknown as LayerElement).GetAlignment() as unknown as { GetTime?(): number })?.GetTime?.();
      if (thisTime !== otherTime) {
        currentElementInfo[1] = RestAccidental.RA_none;
        // limit how much rest can be offset when there is duration overlap, but no x position overlap
        if ((isTopLayer && (currentElementInfo[0] > 12)) || (!isTopLayer && (currentElementInfo[0] < -4))) {
          if (finalElementInfo[0] !== VRV_UNSET_SENTINEL) continue;
          currentElementInfo[0] = isTopLayer ? 12 : -4;
        }
      }
      if ((VRV_UNSET_SENTINEL === finalElementInfo[0])
        || (isTopLayer && (finalElementInfo[0] < currentElementInfo[0]))
        || (!isTopLayer && (finalElementInfo[0] > currentElementInfo[0]))) {
        const tmp = finalElementInfo;
        finalElementInfo = currentElementInfo;
        // C++ std::swap leaves the swapped-out value in currentElementInfo;
        // the loop discards it immediately, so a plain swap suffices.
        currentElementInfoRef.value = tmp;
      }
    }

    return finalElementInfo;
  }

  /**
   * Get the rest vertical location relative to location of elements placed on
   * current layers.
   */
  private GetLocationRelativeToCurrentLayer(
    currentStaff: RestStaffLike, currentLayer: RestLayerLike, isTopLayer: boolean,
  ): number {
    if (!currentStaff || !currentLayer) return VRV_UNSET_SENTINEL;

    let previousElement: VrvObject | null = null;
    let nextElement: VrvObject | null = null;
    // Get previous and next elements from the current layer
    if (currentLayer.GetFirstChildNot && currentLayer.GetFirstChildNot(ClassId.REST)) {
      const getRelativeLayerElementBackwards = Rest.relativeLayerElementFunctorFactory(this.GetIdx(), false);
      getRelativeLayerElementBackwards.SetDirection(BACKWARD);
      currentLayer.Process(getRelativeLayerElementBackwards);
      previousElement = getRelativeLayerElementBackwards.GetRelativeElement();

      // search in other direction
      const getRelativeLayerElementForwards = Rest.relativeLayerElementFunctorFactory(this.GetIdx(), false);
      currentLayer.Process(getRelativeLayerElementForwards);
      nextElement = getRelativeLayerElementForwards.GetRelativeElement();
    }

    // For chords we want to get the closest element to opposite layer, hence we pass negative 'isTopLayer' value
    // That way we'll get bottom chord note for top layer and top chord note for bottom layer
    const previousElementLoc = previousElement
      ? this.GetElementLocation(previousElement, currentLayer, !isTopLayer)[0]
      : this.GetFirstRelativeElementLocation(currentStaff, currentLayer, true, isTopLayer);
    const nextElementLoc = nextElement
      ? this.GetElementLocation(nextElement, currentLayer, !isTopLayer)[0]
      : this.GetFirstRelativeElementLocation(currentStaff, currentLayer, false, isTopLayer);

    // Calculate optimal location depending on existence of values for previous and next element location
    let currentOptimalLocation = 0;
    if (VRV_UNSET_SENTINEL === previousElementLoc) {
      if (VRV_UNSET_SENTINEL === nextElementLoc) {
        return VRV_UNSET_SENTINEL;
      }
      else {
        currentOptimalLocation = nextElementLoc;
      }
    }
    else {
      if (VRV_UNSET_SENTINEL === nextElementLoc) {
        currentOptimalLocation = previousElementLoc;
      }
      else {
        currentOptimalLocation = Math.trunc((previousElementLoc + nextElementLoc) / 2);
      }
    }

    const marginLocation = isTopLayer ? 10 : -2;
    currentOptimalLocation = isTopLayer
      ? Math.min(currentOptimalLocation, marginLocation)
      : Math.max(currentOptimalLocation, marginLocation);

    return currentOptimalLocation;
  }

  /**
   * Get location of first/last element of the corresponding layer.
   */
  private GetFirstRelativeElementLocation(
    currentStaff: RestStaffLike & { FindAllDescendantsByType?(classId: ClassId, any: boolean): VrvObject[] },
    currentLayer: RestLayerLike, isPrevious: boolean, isTopLayer: boolean,
  ): number {
    // current system / measure traversal is delegated to structural
    // collaborators until the owning classes are migrated; the C++ flow is
    // preserved through the FindDescendantByComparison/child-index contract.
    const system = this.GetFirstAncestor(ClassId.SYSTEM) as unknown as {
      GetChildIndex(measure: unknown): number;
      GetChild(index: number): VrvObject | null;
    } | null;
    const measure = this.GetFirstAncestor(ClassId.MEASURE);
    if (!system || !measure) return VRV_UNSET_SENTINEL;

    const index = system.GetChildIndex(measure);
    const relativeMeasure = system.GetChild(isPrevious ? index - 1 : index + 1);
    if (!relativeMeasure || !relativeMeasure.Is(ClassId.MEASURE)) return VRV_UNSET_SENTINEL;

    // Find staff with the same N as current staff
    const previousStaff = relativeMeasure.FindDescendantByComparison(
      new AttNIntegerComparison(ClassId.STAFF, currentStaff.GetN()),
    ) as unknown as (RestStaffLike & {
      FindAllDescendantsByType(classId: ClassId, any: boolean): VrvObject[];
    }) | null;
    if (!previousStaff) return VRV_UNSET_SENTINEL;

    // Compare number of layers in the next/previous staff and if it's the same - find layer with same N
    const layers = previousStaff.FindAllDescendantsByType(ClassId.LAYER, false);
    const layerIter = layers.find(foundLayer =>
      (foundLayer as unknown as RestLayerLike).GetN() === currentLayer.GetN());
    if ((layers.length !== currentStaff.GetChildCount(ClassId.LAYER)) || !layerIter) return VRV_UNSET_SENTINEL;

    // Get last element if it's previous layer, get first one otherwise
    const getRelativeLayerElement = Rest.relativeLayerElementFunctorFactory(this.GetIdx(), true);
    // C++ passes `!isPrevious` as bool with FORWARD=true, BACKWARD=false:
    // previous measure -> BACKWARD (last element), next measure -> FORWARD (first).
    getRelativeLayerElement.SetDirection(isPrevious ? BACKWARD : FORWARD);
    (layerIter as unknown as RestLayerLike).Process(getRelativeLayerElement);

    const lastLayerElement = getRelativeLayerElement.GetRelativeElement();
    if (lastLayerElement && lastLayerElement.IsAnyOf([ClassId.NOTE, ClassId.CHORD, ClassId.FTREM] as unknown as number[])) {
      return this.GetElementLocation(lastLayerElement, layerIter as unknown as RestLayerLike, !isTopLayer)[0];
    }

    return VRV_UNSET_SENTINEL;
  }

  /**
   * For two layers, top layer shouldn't go below center and lower layer
   * shouldn't go above it. Enforce this by adding margin that will adjust
   * rest position.
   */
  private GetMarginLayerLocation(isTopLayer: boolean, restOverlap: boolean): number {
    let marginLocation = isTopLayer ? 6 : 2;
    if ((this.GetDur() === DURATION_long) || ((this.GetDur() === DURATION_4) && restOverlap)) {
      marginLocation = isTopLayer ? 8 : 0;
    }
    else if (this.GetDur() >= DURATION_8) {
      marginLocation = isTopLayer
        ? (6 + Math.trunc((this.GetDur() - DURATION_4) / 2) * 2)
        : (2 - Math.trunc((this.GetDur() - DURATION_8) / 2) * 2);
    }
    if (this.GetDur() >= DURATION_1024) {
      marginLocation -= 2;
    }

    return marginLocation;
  }

  /**
   * Get location of the object on the layer if it's note, chord or ftrem.
   */
  private GetElementLocation(object: VrvObject, layer: RestLayerLike, isTopLayer: boolean): [number, RestAccidental] {
    if (object.Is(ClassId.NOTE)) {
      const note = object as unknown as RestNoteLike;
      const accid = note.GetDrawingAccid();
      return [
        this.CalcLocForElement(object, layer, note),
        (accid && accid.GetAccid() !== 0) ? MeiAccidentalToRestAccidental(accid.GetAccid()) : RestAccidental.RA_none,
      ];
    }
    if (object.Is(ClassId.CHORD)) {
      const chord = object as unknown as RestChordLike;
      const relevantNote = isTopLayer ? chord.GetTopNote() : chord.GetBottomNote();
      const accid = relevantNote.GetDrawingAccid();
      return [
        this.CalcLocForElement(object, layer, relevantNote, isTopLayer),
        (accid && accid.GetAccid() !== 0) ? MeiAccidentalToRestAccidental(accid.GetAccid()) : RestAccidental.RA_none,
      ];
    }
    if (object.Is(ClassId.FTREM)) {
      const btremElements: [number, RestAccidental][] = [];
      for (let i = 0; i < object.GetChildrenForModification().length; ++i) {
        const child = object.GetChild(i);
        if (child) btremElements.push(this.GetElementLocation(child, layer, isTopLayer));
      }
      // C++ compares the pairs lexicographically via max_element/min_element
      return isTopLayer
        ? btremElements.reduce((a, b) => (b > a ? b : a))
        : btremElements.reduce((a, b) => (b < a ? b : a));
    }
    if (object.Is(ClassId.REST)) {
      if (!this.m_crossStaff) return [VRV_UNSET_SENTINEL, RestAccidental.RA_none];
      const rest = object as unknown as Rest;
      return [rest.GetDrawingLoc(), RestAccidental.RA_none];
    }
    return [VRV_UNSET_SENTINEL, RestAccidental.RA_none];
  }

  /**
   * Delegate to `PitchInterface::CalcLoc` (migrated static helper) for note
   * and chord location calculation.
   */
  private CalcLocForElement(object: VrvObject, layer: RestLayerLike, note: unknown, isTopLayer?: boolean): number {
    // PitchInterface::CalcLoc(note, layer, note) / (chord, layer, relevantNote, isTopLayer)
    // The migrated static helper accepts structural collaborators.
    return CalcLocDelegation(object, layer, note, isTopLayer);
  }

  /**
   * Get correct offset for the rest from the options based on layer and
   * location.
   */
  private GetRestOffsetFromOptions(
    layer: RestLayer, location: [number, RestAccidental], isTopLayer: boolean,
  ): number {
    let duration = this.GetActualDur();
    // Make sure we are in the boundaries of g_defaultRests
    if (duration > DURATION_128) duration = DURATION_128;
    if (duration < DURATION_long) duration = DURATION_long;
    return g_defaultRests.get(layer)!
      .get(RestLayer.RL_sameLayer === layer ? location[1] : RestAccidental.RA_none)!
      .get(isTopLayer ? RestLayerPlace.RLP_restOnTopLayer : RestLayerPlace.RLP_restOnBottomLayer)!
      .get(0 === location[0] % 2 ? RestNotePlace.RNP_noteOnLine : RestNotePlace.RNP_noteInSpace)!
      .get(duration)!;
  }

  //----------//
  // Functors //
  //----------//

  public override Accept(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitRest');
  }

  public override AcceptEnd(functor: unknown): FunctorCode {
    return this.visit(functor, 'VisitRestEnd');
  }

  private visit(functor: unknown, method: string): FunctorCode {
    const f = functor as Record<string, unknown>;
    const fn = f[method];
    if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, this);
    if (typeof f['VisitObject'] === 'function') {
      return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, this);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  //---------//
  // AltSymInterface facade
  //---------//
  public SetAltsym(value: string): void { this.altSymInterface!.SetAltsym(value); }
  public GetAltsym(): string { return this.altSymInterface!.GetAltsym(); }
  public HasAltsym(): boolean { return this.altSymInterface!.HasAltsym(); }
  public SetAltSymbolDef(symbolDef: SymbolDefLike): void { this.altSymInterface!.SetAltSymbolDef(symbolDef); }
  public GetAltSymbolDef(): SymbolDefLike | null { return this.altSymInterface!.GetAltSymbolDef(); }
  public HasAltSymbolDef(): boolean { return this.altSymInterface!.HasAltSymbolDef(); }

  //---------//
  // DurationInterface facade
  //---------//
  public SetDots(v: number): void { this.durationInterface!.SetDots(v); }
  public SetFermata(v: number): void { this.durationInterface!.SetFermata(v); }
  public GetFermata(): number { return this.durationInterface!.GetFermata(); }
  public HasFermata(): boolean { return this.durationInterface!.HasFermata(); }
  public ResetFermataPresent(): void { this.durationInterface!.ResetFermataPresent(); }
  public SetDurPpq(v: number): void { this.durationInterface!.SetDurPpq(v); }
  public GetDurPpq(): number { return this.durationInterface!.GetDurPpq(); }
  public SetStaff(v: number[]): void { this.durationInterface!.SetStaff(v); }
  public GetStaff(): number[] { return this.durationInterface!.GetStaff(); }
  public HasStaff(): boolean { return this.durationInterface!.HasStaff(); }
  public ResetStaffIdent(): void { this.durationInterface!.ResetStaffIdent(); }
  public GetDots(): number { return this.durationInterface!.GetDots(); }
  public HasDots(): boolean { return this.durationInterface!.HasDots(); }
  public SetDurGes(v: data_DURATION): void { this.durationInterface!.SetDurGes(v); }
  public GetDurGes(): data_DURATION { return this.durationInterface!.GetDurGes(); }
  public HasDurGes(): boolean { return this.durationInterface!.HasDurGes(); }
  public SetDotsGes(v: number): void { this.durationInterface!.SetDotsGes(v); }
  public GetDotsGes(): number { return this.durationInterface!.GetDotsGes(); }
  public HasDotsGes(): boolean { return this.durationInterface!.HasDotsGes(); }
  public SetDur(v: data_DURATION): void { this.durationInterface!.SetDur(v); }
  public GetDur(): data_DURATION { return this.durationInterface!.GetDur(); }
  public HasDur(): boolean { return this.durationInterface!.HasDur(); }
  public SetDurQuality(v: number): void { this.durationInterface!.SetDurQuality(v); }
  public GetDurQuality(): number { return this.durationInterface!.GetDurQuality(); }
  public HasDurQuality(): boolean { return this.durationInterface!.HasDurQuality(); }
  public SetNum(v: number): void { this.durationInterface!.SetNum(v); }
  public GetNum(): number { return this.durationInterface!.GetNum(); }
  public HasNum(): boolean { return this.durationInterface!.HasNum(); }
  public SetNumbase(v: number): void { this.durationInterface!.SetNumbase(v); }
  public GetNumbase(): number { return this.durationInterface!.GetNumbase(); }
  public HasNumbase(): boolean { return this.durationInterface!.HasNumbase(); }
  public GetActualDur(): data_DURATION { return this.durationInterface!.GetActualDur(); }
  public IsMensuralDur(): boolean { return this.durationInterface!.IsMensuralDur(); }
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

  //---------//
  // OffsetInterface facade
  //---------//
  public SetHo(value: number): void { this.offsetInterface!.SetHo(value); }
  public GetHo(): number { return this.offsetInterface!.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface!.HasHo(); }
  public SetVo(value: number): void { this.offsetInterface!.SetVo(value); }
  public GetVo(): number { return this.offsetInterface!.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface!.HasVo(); }

  //---------//
  // PositionInterface facade
  //---------//
  public SetPloc(value: number): void { this.positionInterface!.SetPloc(value); }
  public GetPloc(): number { return this.positionInterface!.GetPloc(); }
  public HasPloc(): boolean { return this.positionInterface!.HasPloc(); }
  public SetOloc(value: number): void { this.positionInterface!.SetOloc(value); }
  public GetOloc(): number { return this.positionInterface!.GetOloc(); }
  public HasOloc(): boolean { return this.positionInterface!.HasOloc(); }
  public SetLoc(value: number): void { this.positionInterface!.SetLoc(value); }
  public GetLoc(): number { return this.positionInterface!.GetLoc(); }
  public HasLoc(): boolean { return this.positionInterface!.HasLoc(); }
  public SetDrawingLoc(value: number): void { this.positionInterface!.SetDrawingLoc(value); }
  public GetDrawingLoc(): number { return this.positionInterface!.GetDrawingLoc(); }
  public CalcDrawingLoc(layer: unknown, element: unknown): number { return this.positionInterface!.CalcDrawingLoc(layer as never, element as never); }
  public HasLedgerLines(above: unknown, below: unknown, staff: unknown): boolean { return this.positionInterface!.HasLedgerLines(above, below, staff); }

  //---------//
  // AttColor forwarding surface
  //---------//
  public ResetColor(): void { this.color!.ResetColor(); }
  public SetColor(value: string): void { this.color!.SetColor(value); }
  public GetColor(): string { return this.color!.GetColor(); }
  public HasColor(): boolean { return this.color!.GetColor() !== ''; }

  //---------//
  // AttCue forwarding surface
  //---------//
  public ResetCue(): void { this.cue!.ResetCue(); }
  public SetCue(value: number): void { this.cue!.SetCue(value); }
  public GetCue(): number { return this.cue!.GetCue(); }
  public HasCue(): boolean { return this.cue!.HasCue(); }

  //---------//
  // AttEnclosingChars forwarding surface
  //---------//
  public ResetEnclosingChars(): void { this.enclosingChars!.ResetEnclosingChars(); }
  public SetEnclose(value: number): void { this.enclosingChars!.SetEnclose(value); }
  public GetEnclose(): number { return this.enclosingChars!.GetEnclose(); }
  public HasEnclose(): boolean { return this.enclosingChars!.HasEnclose(); }

  //---------//
  // AttExtSymAuth forwarding surface
  //---------//
  public ResetExtSymAuth(): void { this.extSymAuth!.ResetExtSymAuth(); }
  public SetGlyphAuth(value: string): void { this.extSymAuth!.SetGlyphAuth(value); }
  public GetGlyphAuth(): string { return this.extSymAuth!.GetGlyphAuth(); }
  public HasGlyphAuth(): boolean { return this.extSymAuth!.GetGlyphAuth() !== ''; }
  public SetGlyphUri(value: string): void { this.extSymAuth!.SetGlyphUri(value); }
  public GetGlyphUri(): string { return this.extSymAuth!.GetGlyphUri(); }
  public HasGlyphUri(): boolean { return this.extSymAuth!.GetGlyphUri() !== ''; }

  //---------//
  // AttExtSymNames forwarding surface
  //---------//
  public ResetExtSymNames(): void { this.extSymNames!.ResetExtSymNames(); }
  public SetGlyphName(value: string): void { this.extSymNames!.SetGlyphName(value); }
  public GetGlyphName(): string { return this.extSymNames!.GetGlyphName(); }
  public HasGlyphName(): boolean { return this.extSymNames!.GetGlyphName() !== ''; }
  public SetGlyphNum(value: number): void { this.extSymNames!.SetGlyphNum(value); }
  public GetGlyphNum(): number { return this.extSymNames!.GetGlyphNum(); }
  public HasGlyphNum(): boolean { return this.extSymNames!.GetGlyphNum() !== 0; }

  //---------//
  // AttRestVisMensural forwarding surface
  //---------//
  public ResetRestVisMensural(): void { this.restVisMensural!.ResetRestVisMensural(); }
  public SetSpaces(value: number): void { this.restVisMensural!.SetSpaces(value); }
  public GetSpaces(): number { return this.restVisMensural!.GetSpaces(); }
  public HasSpaces(): boolean { return this.restVisMensural!.HasSpaces(); }
}

// VRV_UNSET sentinel (-0x7FFFFFFF) without a circular import.
const VRV_UNSET_SENTINEL = -0x7FFFFFFF;

/** Adapter for the swapped-out reference in GetLocationRelativeToOtherLayers. */
const currentElementInfoRef: { value: [number, RestAccidental] | null } = { value: null };

/**
 * PitchInterface::CalcLoc delegation through the migrated static helper.
 * The migrated `PitchInterface.CalcLoc(note, layer, note, ...)` accepts
 * structural collaborators; the note/chord branch behavior is preserved.
 */
function CalcLocDelegation(object: VrvObject, layer: RestLayerLike, note: unknown, isTopLayer?: boolean): number {
  return PitchInterface.CalcLoc(object as never, layer as never, note as never, isTopLayer);
}

// Factory registration (C++ `ClassRegistrar<Rest> s_factory("rest", REST)`).
ObjectFactory.GetInstance().Register('rest', ClassId.REST, () => new Rest());
