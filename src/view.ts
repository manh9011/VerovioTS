/**
 * Pure TypeScript translation of src-cpp/src/view.cpp (View core slice).
 * Only the state/offset/coordinate/figure/font-size methods defined in view.cpp.
 * The view_* drawing methods are pending their owning passes.
 */
import { Point, COLOR_NONE, PenStyle, LineCapStyle, LineJoinStyle } from './devicecontextbase';
import { SpanningType, DEFINITION_FACTOR, InterfaceId, ClassId, GraphicID, CURVEDIR_none, DURATION_NONE, DURATION_1, DURATION_2, DURATION_4, DURATION_8, DURATION_16, DURATION_32, DURATION_64, LIGATURE_DEFAULT, LIGATURE_STEM_LEFT_UP, LIGATURE_STEM_LEFT_DOWN, LIGATURE_STEM_RIGHT_UP, LIGATURE_STEM_RIGHT_DOWN, LIGATURE_OBLIQUE, LIGATURE_STACKED, BACKWARD, VisibilityOptimization as OPT } from './vrvdef';
export { BACKWARD };
const OPTIMIZATION_HIDDEN = OPT.OPTIMIZATION_HIDDEN;
export { DURATION_NONE, DURATION_1, DURATION_2, DURATION_4, DURATION_8, DURATION_16, DURATION_32, DURATION_64 };
import { UTF8to32, LogDebug, LogError, LogWarning, UTF32to8, ConcatenateIDs, IsNeumeType } from './vrv';
import { TEMP_KEYSIG_STEP, TEMP_KEYSIG_NATURAL_STEP } from './options';
import { SMUFL_E050_gClef, SMUFL_E262_accidentalSharp, SMUFL_E000_brace, SMUFL_E003_bracketTop, SMUFL_E004_bracketBottom, SMUFL_E044_repeatDot, SMUFL_E04A_segnoSerpent1, SMUFL_E500_repeat1Bar, SMUFL_E501_repeat2Bars, SMUFL_E504_repeatBarSlash, SMUFL_E260_accidentalFlat, SMUFL_E261_accidentalNatural, SMUFL_E4E1_restLonga, SMUFL_E4E2_restDoubleWhole, SMUFL_E4E3_restWhole, SMUFL_E4E4_restHalf, SMUFL_E4E5_restQuarter, SMUFL_E4E6_rest8th, SMUFL_E4E7_rest16th, SMUFL_E4E8_rest32nd, SMUFL_E4E9_rest64th, SMUFL_E220_tremolo1, SMUFL_E645_vocalSprechgesang, SMUFL_E0A3_noteheadHalf, SMUFL_E0FA_noteheadWholeFilled, SMUFL_E0FB_noteheadHalfFilled, SMUFL_E26A_accidentalParensLeft, SMUFL_E26B_accidentalParensRight } from './smufl';
import { BarLinePosition } from './barline';
import { Fermata } from './fermata.js';
import { Accid } from './accid.js';
import { AttNIntegerComparison } from './comparison';
import { Fraction } from './fraction';
// Canonical libMEI data.PITCHNAME ordinals (atttypes.h; PITCHNAME_NONE=0, c=1..b=7).
export const PITCHNAME_NONE = 0;
export const PITCHNAME_c = 1;
export const PITCHNAME_d = 2;
export const PITCHNAME_e = 3;
export const PITCHNAME_f = 4;
export const PITCHNAME_g = 5;
export const PITCHNAME_a = 6;
export const PITCHNAME_b = 7;
import { BoundingBox, SegmentedLine } from './boundingbox';
import { VrvObject } from './object';
import { TextExtend, FontInfo, FontStyle, FontWeight } from './devicecontextbase';
import { Text } from './text.js';
import { VRV_UNSET, SUPER_SCRIPT_FACTOR, SUPER_SCRIPT_POSITION, SUB_SCRIPT_POSITION, ArrayOfStringDynamTypePairs, CSS_SHOW_HIDDEN, STAFFREL_above, STAFFREL_below, STAFFREL_between, STAFFREL_within, ElementScoreDefRole, UNLIMITED_DEPTH } from './vrvdef';
import { Resources } from './resources';
import { Dynam } from './dynam';
import { Syl } from './syl.js';
import { KeySig } from './keysig';
import { PitchInterface } from './pitchinterface';
import {
  ENCLOSURE_NONE, ENCLOSURE_paren, ENCLOSURE_brack,
  FONTSIZE_fontSizeNumeric, FONTSIZE_term, FONTSIZE_percent,
  TEXTRENDITION_sup, TEXTRENDITION_sub, TEXTRENDITION_box,
  FONTSTYLE_NONE, FONTSTYLE_normal, FONTWEIGHT_NONE,
  ELISION_unicode, UNICODE_UNDERTIE_CP,
  SMUFL_EA63_figbassDoubleFlat, SMUFL_EA64_figbassFlat, SMUFL_EA65_figbassNatural,
  SMUFL_EA66_figbassSharp, SMUFL_EA67_figbassDoubleSharp,
  codePointsEqual,
} from './view-text-support';
import {
  SMUFL_E08D_timeSigPlusSmall, SMUFL_E08E_timeSigFractionalSlash,
  SMUFL_E090_timeSigMinus, SMUFL_E091_timeSigMultiply,
  SMUFL_E241_flag8thDown,
  SMUFL_0020_space,
  SMUFL_ECA1_metNoteDoubleWholeSquare, SMUFL_ECA2_metNoteWhole, SMUFL_ECA3_metNoteHalfUp,
  SMUFL_ECA5_metNoteQuarterUp, SMUFL_ECA7_metNote8thUp, SMUFL_ECA9_metNote16thUp,
  SMUFL_ECAB_metNote32ndUp, SMUFL_ECAD_metNote64thUp, SMUFL_ECB7_metAugmentationDot,
  SMUFL_E910_mensuralProlation1, SMUFL_E911_mensuralProlation2,
  SMUFL_E915_mensuralProlation6, SMUFL_E916_mensuralProlation7,
  SMUFL_E920_mensuralProlationCombiningDot, SMUFL_E925_mensuralProlationCombiningStroke,
  SMUFL_E93E_mensuralCombStemUp, SMUFL_E93F_mensuralCombStemDown,
  SMUFL_E949_mensuralCombStemUpFlagSemiminima, SMUFL_E94A_mensuralCombStemDownFlagSemiminima,
  SMUFL_E94B_mensuralCombStemUpFlagFusa, SMUFL_E94C_mensuralCombStemDownFlagFusa,
  SMUFL_E08C_timeSigPlus,
  SMUFL_E56C_ornamentShortTrill,
  SMUFL_E4CE_breathMarkComma,
  SMUFL_EAA9_wiggleArpeggiatoUp,
  SMUFL_EAAA_wiggleArpeggiatoDown,
  SMUFL_EAAD_wiggleArpeggiatoUpArrow,
  SMUFL_EAAE_wiggleArpeggiatoDownArrow,
  SMUFL_E566_ornamentTrill,
  SMUFL_E59D_ornamentZigZagLineNoRightEnd,
  SMUFL_E59E_ornamentZigZagLineWithRightEnd,
  SMUFL_E650_keyboardPedalPed,
  SMUFL_E655_keyboardPedalUp,
  SMUFL_E0A2_noteheadWhole,
  SMUFL_E51A_octaveParensLeft,
  SMUFL_E51B_octaveParensRight,
  SMUFL_EAAF_wiggleGlissando,
} from './smufl';

// Canonical libMEI data.LINEFORM ordinals (attconverter.ts).
export const LINEFORM_dashed = 1;
export const LINEFORM_dotted = 2;
export const LINEFORM_wavy = 4;

// Canonical option_SYSTEMDIVIDER ordinals (options.h:90).
export const SYSTEMDIVIDER_none = 0;
export const SYSTEMDIVIDER_auto = 1;
export const SYSTEMDIVIDER_left = 2;
export const SYSTEMDIVIDER_left_right = 3;

// Canonical libMEI data.BARRENDITION ordinals (attconverter.ts:2054).
export const BARRENDITION_NONE = 0;
// Canonical libmei ordinals (atttypes.h): meterSigGrpLog_FUNC_mixed = 3; cutout_CUTOUT_cutout = 1;
const meterSigGrpLog_FUNC_mixed = 3;
const cutout_CUTOUT_cutout = 1;
// DocType.Facs (doc.ts: Raw=0, Rendering, Transcription, Facs=3)
const FacsType = 3;
const FONTSTYLE_italic = 1;
// Pass 325 local ordinals (verified runtime/attconverter).
const CANCELACCID_none = 1; // attconverter.ts:209
const CANCELACCID_after = 3; // attconverter.ts:206
const CLEFSHAPE_perc = 5; // clef.ts:54 / attconverter CLEFSHAPE_perc
const BEATRPT_REND_mixed = 6; // BeatrptRendToStr ordinal from att converter
const dotLog_FORM_aug = 1; // att.ts dotLog_FORM ordinals (aug=1, div=2)
const accidLog_FUNC_edit = 2; // cursor.ts:26
export interface ViewElementDrawSeam {
  DrawLayerElement(dc: unknown, element: unknown, layer: unknown, staff: unknown, measure: unknown): void;
}
export const BARRENDITION_dashed = 1;
export const BARRENDITION_dotted = 2;
export const BARRENDITION_dbl = 3;
export const BARRENDITION_dbldashed = 4;
export const BARRENDITION_dbldotted = 5;
export const BARRENDITION_dblheavy = 6;
export const BARRENDITION_dblsegno = 7;
export const BARRENDITION_end = 8;
export const BARRENDITION_heavy = 9;
export const BARRENDITION_invis = 10;
export const BARRENDITION_rptstart = 11;
export const BARRENDITION_rptboth = 12;
export const BARRENDITION_rptend = 13;
export const BARRENDITION_segno = 14;
export const BARRENDITION_single = 15;

// Canonical libMEI data.BARMETHOD ordinals (atts_visual.ts).
export const BARMETHOD_NONE = 0;
export const BARMETHOD_mensur = 1;
export const BARMETHOD_staff = 2;
export const BARMETHOD_takt = 3;

// Canonical libMEI data.STAFFGROUPINGSYM ordinals (atts_cmn.ts).
export const staffGroupingSym_SYMBOL_NONE = 0;
export const staffGroupingSym_SYMBOL_brace = 1;
export const staffGroupingSym_SYMBOL_bracket = 2;
export const staffGroupingSym_SYMBOL_bracketsq = 3;
export const staffGroupingSym_SYMBOL_line = 4;

// Canonical ScoreDefDrawingLabels ordinals (vrvdef.h:621).
export const DRAWING_LABEL_FULL = 0;
export const DRAWING_LABEL_ABBR = 1;
export const DRAWING_LABEL_NONE = 2;

// libmei/comparison.h StaffSearch enum (layerelement.ts parity).
export const StaffSearch = { ANCESTOR_ONLY: 0, RESOLVE_CROSS_STAFF: 1 };

// Canonical ordinals shared with adjusttupletsxfunctor/attconverter (local to avoid import weight).
export const BOOLEAN_false = 2;
export const STAFFREL_basic_NONE = 0;
export const STAFFREL_basic_above = 1;
export const STAFFREL_basic_below = 2;
export const HORIZONTALALIGNMENT_NONE = 0;
export const HORIZONTALALIGNMENT_left = 1;
export const HORIZONTALALIGNMENT_right = 2;
// Canonical data.BEAMPLACE ordinals (attconverter.ts).
export const BEAMPLACE_NONE = 0;
export const BEAMPLACE_above = 1;
export const BEAMPLACE_below = 2;
export const BEAMPLACE_mixed = 3;
// Canonical beam partial codes (beam.cpp: PARTIAL_NONE=0, THROUGH=1, RIGHT=2, LEFT=3).
export const PARTIAL_NONE = 0;
export const PARTIAL_THROUGH = 1;
export const PARTIAL_RIGHT = 2;
export const PARTIAL_LEFT = 3;
export interface ViewBeamSegmentLike {
  InitCoordRefs(coords: unknown): void;
  InitSameasRoles(sameas: unknown, place: number): void;
  StemSameasIsSecondary(): boolean;
  CalcBeam(layer: unknown, staff: unknown, doc: unknown, beamInterface: unknown, place?: number): void;
  GetElementCoordRefs(): ViewCoordLike[];
  m_firstNoteOrChord: ViewCoordLike | null;
  m_beamSlope: number;
}
export interface ViewCoordLike {
  m_x: number;
  m_yBeam: number;
  m_dur: number;
  m_breaksec: number;
  m_beamRelativePlace: number;
  m_partialFlagPlace: number;
  m_partialFlags: number[];
  m_element: { Is(classId: number): boolean } | null;
}
export interface ViewBeamLike {
  GetID(): string;
  HasEmptyList(): boolean;
  GetFirst(classId: number): unknown;
  GetElementCoords(): ViewCoordLike[];
  GetPlace(): number;
  HasStemSameasBeam(): boolean;
  GetStemSameasBeam(): unknown;
  m_beamSegment: ViewBeamSegmentLike;
  m_beamStaff: unknown;
}
export interface ViewBeamInterfaceLike {
  m_drawingPlace: number;
  m_beamWidth: number;
  m_beamWidthBlack: number;
  m_beamWidthWhite: number;
  m_fractionSize: number;
  m_cueSize: boolean;
  m_shortestDur: number;
}
export interface ViewFTremLike {
  GetID(): string;
  HasEmptyList(): boolean;
  GetElementCoords(): ViewCoordLike[];
  HasBeams(): boolean;
  GetBeams(): number;
  HasBeamsFloat(): boolean;
  GetBeamsFloat(): number;
  GetUnitdur(): number;
  m_beamSegment: ViewBeamSegmentLike;
  m_beamStaff: unknown;
  m_drawingPlace: number;
  m_cueSize: boolean;
  m_beamWidthBlack: number;
  m_beamWidthWhite: number;
}
export interface ViewBeamStaffLike {
  m_drawingStaffSize: number;
  IsTabLuteFrench(): boolean;
  IsTabLuteGerman(): boolean;
  IsTabLuteItalian(): boolean;
  IsTabStaffLike(): boolean;
}
export interface ViewBeamDocLike extends DocGraphLike {
  GetDrawingStemWidth(staffSize: number): number;
  GetDrawingBeamWidth(staffSize: number, graceSize: boolean): number;
  GetDrawingBeamWhiteWidth(staffSize: number, graceSize: boolean): number;
  GetGlyphWidth(code: number, staffSize: number, graceSize: boolean): number;
}
export interface ViewBeamLayerElementLike {
  GetDur?(): number;
}
export interface ViewBeamSpanLike {
  GetID(): string;
  m_beamElementCoords: ViewCoordLike[];
  m_drawingPlace: number;
  GetSegmentForSystem(s: unknown): ViewBeamSpanSegmentLike | null;
}
export interface ViewBeamSpanSegmentLike extends ViewBeamSegmentLike {
  GetBeginCoord(): ViewCoordLike;
  GetEndCoord(): ViewCoordLike;
  Reset(): void;
  GetLayer(): unknown;
  GetStaff(): ViewBeamStaffLike;
  GetMeasure(): unknown;
  AppendSpanningCoordinates(measure: unknown): void;
}
export interface ViewBeamDrawSeam {
  DrawLayerChildren(dc: unknown, element: unknown, layer: unknown, staff: unknown, measure: unknown): void;
  DrawBeamSegment(dc: unknown, segment: unknown, beamInterface: unknown, layer: unknown, staff: unknown): void;
}
export interface DocGraphLike extends DocSlurLike {
  GetDrawingDoubleUnit(staffSize: number): number;
  GetGlyphAdvX(code: number, staffSize: number, graceSize: boolean): number;
  GetGlyphWidth(code: number, staffSize: number, graceSize: boolean): number;
}
export interface ViewSymbolDefLike {
  GetSymbolHeight(doc: unknown, staffSize: number, dimin: boolean): number;
  GetSymbolWidth(doc: unknown, staffSize: number, dimin: boolean): number;
  SetTemporaryParent(parent: unknown): void;
  ResetTemporaryParent(): void;
  GetChildren(): { Is(classId: number): boolean }[];
}
export interface ViewGraphicLike { _graphic: true; }
export interface ViewSvgLike { _svg: true; }
export interface ViewGraphDrawSeam {
  DrawGraphic(dc: unknown, graphic: unknown, params: TabTextParamsLike, staffSize: number, dimin: boolean): void;
  DrawSvg(dc: unknown, svg: unknown, params: TabTextParamsLike, staffSize: number, dimin: boolean): void;
}
//----------------------------------------------------------------------------
// View - TextDrawingParams (src-cpp/include/vrv/view.h)
//----------------------------------------------------------------------------
/** View::TextDrawingParams from textelement.h — mutable drawing context accumulator. */
export class TextDrawingParams {
  public m_x: number = 0;
  public m_y: number = 0;
  public m_width: number = 0;
  public m_height: number = 0;
  public m_pointSize: number = 0;
  public m_staffSize: number = 100;
  public m_alignment: number = HORIZONTALALIGNMENT_left;
  public m_enclose: number = 0;
  public m_textEnclose: number = ENCLOSURE_NONE;
  public m_explicitPosition: boolean = false;
  public m_verticalShift: boolean = false;
  public m_laidOut: boolean = false;
  public m_actualWidth: number = 0;
  public m_enclosedRend: ViewTextRendLike[] = [];
  /** C++ copies TextDrawingParams by value (vector included); aliasing it corrupts siblings. */
  public Clone(): TextDrawingParams {
    const copy = new TextDrawingParams();
    copy.m_x = this.m_x;
    copy.m_y = this.m_y;
    copy.m_width = this.m_width;
    copy.m_height = this.m_height;
    copy.m_pointSize = this.m_pointSize;
    copy.m_staffSize = this.m_staffSize;
    copy.m_alignment = this.m_alignment;
    copy.m_enclose = this.m_enclose;
    copy.m_textEnclose = this.m_textEnclose;
    copy.m_explicitPosition = this.m_explicitPosition;
    copy.m_verticalShift = this.m_verticalShift;
    copy.m_laidOut = this.m_laidOut;
    copy.m_actualWidth = this.m_actualWidth;
    copy.m_enclosedRend = [...this.m_enclosedRend];
    return copy;
  }
}
// Subset consts re-exported at view boundary for the text slice.
const TD_ALIGNMENT_NONE = 0;
export interface ViewTextRendLike {
  GetID(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetContentRight(): number;
  GetContentLeft(): number;
  GetContentBottom(): number;
  GetContentTop(): number;
  HasHalign(): boolean;
  GetHalign(): number;
  HasFontname(): boolean;
  GetFontname(): string;
  HasFontfam?(): boolean;
  HasFontsize(): boolean;
  GetFontsizeAlternate(): { GetType(): number; GetPercentForTerm(): number; GetPercent(): number };
  HasGlyphAuth(): boolean;
  GetGlyphAuth(): string;
  HasFontstyle(): boolean;
  GetFontstyle(): number;
  HasFontweight(): boolean;
  GetFontweight(): number;
  HasLetterspacing(): boolean;
  GetLetterspacing(): number;
  GetRend(): number;
  HasEnclosure(): boolean;
}
export interface ViewTextFLike { GetID(): string; GetStart(): unknown; GetEnd(): unknown; GetFirstAncestor(classId: number): unknown; }
export interface ViewTextSystemLike { AddToDrawingList(el: unknown): void; }
export interface ViewTextElementLike { Is(classId: number): boolean; }
export interface ViewTextLbLike { GetID(): string; }
export interface ViewTextTextLike { GetID(): string; GetText(): number[]; GetContentRight(): number; GetFirstAncestor(classId: number): unknown; }
export interface ViewTextNumLike { GetID(): string; GetCurrentText(): { GetText(): number[] } | null; }
export interface ViewTextFigLike { GetID(): string; GetDrawingX(): number; GetDrawingY(): number; FindDescendantByType?(classId: number, depth?: number): unknown; }
export interface ViewTextSvgLike { GetID(): string; GetWidth(): number; GetHeight(): number; Get(): unknown; }
export interface ViewTextSymbolLike { GetID(): string; GetSymbolGlyph(): number; HasFontsize(): boolean; GetFontsizeAlternate(): { GetType(): number; GetPercentForTerm(): number; GetPercent(): number }; HasFontstyle(): boolean; GetFontstyle(): number; HasGlyphAuth(): boolean; GetGlyphAuth(): string; }
export interface ViewTextGraphicLike2 { GetID(): string; GetDrawingWidth(unit: number, staffSize: number): number; GetDrawingHeight(unit: number, staffSize: number): number; GetTarget(): string; }
export interface ViewTextPageLike { GetHeader(): ViewTextLayoutElementLike | null; GetFooter(): ViewTextLayoutElementLike | null; }
export interface ViewTextLayoutElementLike { GetID(): string; GetDrawingX(): number; GetDrawingY(): number; GetTotalWidth(doc: unknown): number; }
export interface ViewTextBBoxDCLike { UpdateVerticalValues(): boolean; }
export interface ViewTextDocLike extends DocSlurLike {
  GetMusicToLyricFontSizeRatio(): number;
  GetTextGlyphHeight(code: number, font: unknown, graceSize: boolean): number;
  GetTextLineHeight(font: unknown, graceSize: boolean): number;
  GetDrawingLyricFont(staffSize: number): { GetPointSize(): number };
  GetResources(): { GetTextFont(): string; GetCurrentFont(): string; IsSmuflFallbackNeeded(text: string): boolean };
}
export interface ViewTextDeviceContextLike extends TabDeviceContextLike {
  GetFont(): FontInfo;
  HasFont(): boolean;
  GetResources(): { SelectTextFont(weight: FontWeight, style: FontStyle): void } | null;
  StartText(x: number, y: number, alignment: number): void;
  StartTextGraphic(el: unknown, cls: string, id?: string): void;
  EndTextGraphic(el: unknown, obj: unknown): void;
  StartGraphic(el: unknown, cls: string, id?: string, graphicID?: number): void;
  EndGraphic(el: unknown, obj: unknown): void;
  DrawText(text: string, u32?: number[], x?: number, y?: number, width?: number, height?: number): void;
  MoveTextTo(x: number, y: number, alignment: number): void;
  MoveTextVerticallyTo(y: number): void;
  DrawGraphicUri(x: number, y: number, width: number, height: number, target: string): void;
  DrawSvgShape(x: number, y: number, width: number, height: number, scale: number, node: unknown): void;
  Is(classId: number): boolean;
}
export interface ViewTextDrawSeam {
  DrawTextChildren(dc: unknown, element: unknown, params: TextDrawingParams): void;
  DrawRunningChildren(dc: unknown, element: unknown, params: TextDrawingParams): void;
  DrawLb(dc: unknown, lb: unknown, params: TextDrawingParams): void;
  DrawNum(dc: unknown, num: unknown, params: TextDrawingParams): void;
  DrawRend(dc: unknown, rend: unknown, params: TextDrawingParams): void;
  DrawText(dc: unknown, text: unknown, params: TextDrawingParams): void;
  DrawSymbol(dc: unknown, symbol: unknown, params: TextDrawingParams): void;
  DrawSvg(dc: unknown, svg: unknown, params: TextDrawingParams, staffSize: number, dimin: boolean): void;
  DrawTextLayoutElement(dc: unknown, element: unknown): void;
}
export interface ViewGraphDeviceContextLike extends TabDeviceContextLike {
  SetPen(width: number, style: PenStyle, dashLength?: number, gapLength?: number): void;
  SetBrush(opacity: number): void;
  ResetBrush(): void;
  DrawEllipse(x: number, y: number, width: number, height: number): void;
  DrawRoundedRectangle(x: number, y: number, width: number, height: number, radius: number): void;
  DrawPolygon(n: number, points: Point[]): void;
  DrawMusicText(str: number[], x: number, y: number, setBBGlyph?: boolean): void;
  DrawCircle(x: number, y: number, radius: number): void;
  DrawLine(x1: number, y1: number, x2: number, y2: number): void;
  SetFont(f: unknown): void;
  ResetFont(): void;
  ResetPen(): void;
  GetSmuflTextExtent(s: number[], extend: TextExtend): void;
  StartCustomGraphic(name: string, gClass?: string): void;
  EndCustomGraphic(): void;
  SetCustomGraphicAttributes?(name: string, value: string): void;
  DrawBentParallelogramFilled(side: Point[], height: number): void;
}
export const tupletVis_NUMFORMAT_ratio = 2;
// Canonical SMuFL (smufl.ts).
export const SMUFL_E88A_tupletColon = 0xE88A;
export const SMUFL_EBA6_luteDurationDoubleWhole = 0xEBA6;
export const SMUFL_EBA7_luteDurationWhole = 0xEBA7;
export const SMUFL_EBA8_luteDurationHalf = 0xEBA8;
export const SMUFL_EBA9_luteDurationQuarter = 0xEBA9;
export const SMUFL_EBAA_luteDuration8th = 0xEBAA;
export const SMUFL_EBAB_luteDuration16th = 0xEBAB;
export const SMUFL_EBAC_luteDuration32nd = 0xEBAC;
export const SMUFL_EBE0_luteItalianFret0 = 0xEBE0;
export const SMUFL_EC17_luteGermanAUpper = 0xEC17;
export const SMUFL_E0A4_noteheadBlack = 0xE0A4;
export const SMUFL_E8F3_chantDivisioMinima = 0xE8F3;
export const SMUFL_E8F4_chantDivisioMaior = 0xE8F4;
export const SMUFL_E8F5_chantDivisioMaxima = 0xE8F5;
export const SMUFL_E8F6_chantDivisioFinalis = 0xE8F6;
export const SMUFL_E8F7_chantVirgula = 0xE8F7;
export const SMUFL_E8F8_chantCaesura = 0xE8F8;
export const SMUFL_E9D0_chantIctusAbove = 0xE9D0;
export const SMUFL_E9D1_chantIctusBelow = 0xE9D1;
export const SMUFL_E9D8_chantEpisema = 0xE9D8;
// Canonical libMEI enum ordinals: divLineLog_FORM (attconverter.ts).
export const divLineLog_FORM_caesura = 1;
export const divLineLog_FORM_finalis = 2;
export const divLineLog_FORM_maior = 3;
export const divLineLog_FORM_maxima = 4;
export const divLineLog_FORM_minima = 5;
export const divLineLog_FORM_virgula = 6;
// Canonical libMEI enum ordinals: EVENTREL / episemaVis_FORM (attconverter.ts).
export const EVENTREL_below = 2;
export const episemaVis_FORM_h = 1;

export interface ViewNeumeStaffLike extends ViewTabStaffLike {
  HasDrawingRotation(): boolean;
  GetDrawingRotationOffsetFor(x: number): number;
  IsOnStaffLine(y: number, doc: unknown): boolean;
}

export interface ViewNeumeLike {
  GetID(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface ViewNcGlyphLike {
  m_xOffset: number;
  m_yOffset: number;
  m_fontNo: number;
}

export interface ViewNcLike extends ViewNeumeLike {
  m_drawingGlyphs: ViewNcGlyphLike[];
  FindDescendantByType(classId: ClassId): unknown;
}

export interface ViewNeumeObjLike extends ViewNeumeLike {
  GetFirst(classId: ClassId): unknown;
  GetLast(classId: ClassId): unknown;
}

export interface ViewNeumeNcHeadLike extends ViewNcLike {
  GetDrawingRadius(doc: unknown): number;
}

export interface ViewDivLineLike extends ViewNeumeLike {
  GetForm(): number;
}

export interface ViewEpisemaLike extends ViewNeumeLike {
  GetFirstAncestor(classId: ClassId): unknown;
  GetForm(): number;
  GetPlace(): number;
}

export interface ViewNeumeDeviceContextLike extends TabDeviceContextLike {
  SetPenFull(width: number, style: PenStyle, dash: number, cap: number, join: number): void;
  DrawLine(x1: number, y1: number, x2: number, y2: number): void;
}

export interface ViewNeumeDrawSeam extends ViewTabDrawSeam {
  DrawNcGlyphs(dc: unknown, nc: unknown, staff: unknown): void;
  DrawLayerChildren(dc: unknown, element: unknown, layer: unknown, staff: unknown, measure: unknown): void;
  DrawSmuflCode(dc: unknown, x: number, y: number, code: number, staffSize: number, dimin: boolean, setBBGlyph?: boolean): void;
}

export interface ViewNeumeOptionsLike {
  m_neumeAsNote: { GetValue(): boolean };
  m_octaveLineThickness: { GetValue(): number };
}
// Canonical libMEI data_NOTATIONTYPE ordinals (attconverter.ts; atttypes.h ordering).
export const NOTATIONTYPE_tab_guitar = 10;
export const NOTATIONTYPE_tab_lute_french = 11;
export const NOTATIONTYPE_tab_lute_italian = 12;
export const NOTATIONTYPE_tab_lute_german = 13;
// Canonical data_STEMDIRECTION ordinals.
export const STEMDIRECTION_NONE = 0;
// Canonical data_STEMMODIFIER ordinals (attconverter.ts).
export const STEMMODIFIER_NONE = 0;
export const STEMMODIFIER_none = 1;
export const STEMMODIFIER_6slash = 7;
// Canonical data_NOTEHEADMODIFIER ordinals (attconverter.ts).
export const NOTEHEADMODIFIER_paren = 6;
// Canonical data_GRACE ordinals (attconverter.ts).
export const GRACE_unacc = 2;
// Canonical data_SYLLOG_CON ordinals (attconverter.ts; b=8 elision).
const sylLog_CON_b = 8;
export const STEMDIRECTION_up = 1;
export const STEMDIRECTION_down = 2;
export const HORIZONTALALIGNMENT_center = 3;

export interface FontInfoLike {
  faceName?: string;
  pointSize?: number;
  GetFaceName(): string;
  SetFaceName(v: string): void;
  GetPointSize(): number;
  SetPointSize(v: number): void;
}

export interface TabTextParamsLike {
  m_x: number; m_y: number; m_width: number; m_height: number;
  m_laidOut: boolean; m_explicitPosition: boolean; m_verticalShift: boolean;
  m_alignment: number; m_pointSize: number; m_staffSize: number; m_actualWidth: number;
  m_enclose: number; m_textEnclose: number;
}

export interface ViewTabClefLike {
  GetID(): string;
  GetDrawingX(): number;
  GetClefGlyph(notationType: number): number;
  SetEmptyBB(): void;
}

export interface ViewTabNoteLike {
  GetID(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetTabFretString(notationType: number, refs: { overline: number; strike: number; underline: number }): number[];
}

export interface ViewTabDurSymLike {
  GetID(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetFirstAncestor(classId: ClassId): unknown;
  GetDrawingStemDir(): number;
  GetDrawingStem(): { GetDrawingY(): number } | null;
}

export interface ViewTabGrpLike {
  GetDurGes(): number;
  GetActualDurGes(): number;
  GetActualDur(): number;
  HasDots(): boolean;
  GetDots(): number;
  IsInBeam(): boolean;
}

export interface ViewTabStaffLike {
  m_drawingStaffSize: number;
  m_drawingNotationType: number;
  m_drawingLines: number;
  GetDrawingStaffNotationSize(): number;
  GetDrawingY(): number;
  IsTabGuitar(): boolean;
  IsTabLuteItalian(): boolean;
  IsTabLuteFrench(): boolean;
  IsTabLuteGerman(): boolean;
}

export interface DocTabLike extends DocSlurLike {
  GetResources(): { GetTextFont(): string };
  GetDrawingLyricFont(staffSize: number): { GetPointSize(): number };
  GetTextGlyphHeight(code: number, font: FontInfoLike, graceSize: boolean): number;
  GetGlyphHeight(code: number, glyphSize: number, drawingCueSize: boolean): number;
  GetGlyphWidth(code: number, glyphSize: number, drawingCueSize: boolean): number;
  GetDrawingStaffLineWidth(staffSize: number): number;
}

export interface TabDeviceContextLike extends TupletDeviceContextLike {
  UseGlobalStyling(): boolean;
  StartText(x: number, y: number, alignment: number): void;
  EndText(): void;
  DrawLine(x1: number, y1: number, x2: number, y2: number): void;
  SetPen(width: number, style: PenStyle): void;
  DrawCircle(x: number, y: number, radius: number): void;
}

export interface ViewTabDrawSeam extends ViewTupletDrawSeam {
  DrawSmuflCode(dc: unknown, x: number, y: number, code: number, staffSize: number, dimin: boolean, setBBGlyph?: boolean): void;
  DrawClefEnclosing(dc: unknown, clef: unknown, staff: unknown, glyph: number, x: number, y: number): void;
  DrawTextString(dc: unknown, str: number[], params: TabTextParamsLike): void;
  DrawDot(dc: unknown, x: number, y: number, staffSize: number, dimin?: boolean): void;
  DrawSmuflString(dc: unknown, x: number, y: number, s: number[], alignment: number, staffSize: number, dimin?: boolean): void;
}

export interface DocSlurLike extends ViewDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetDrawingStemWidth(staffSize: number): number;
  GetDrawingSmuflFont(glyphSize: number, drawingCueSize: boolean): unknown;
  GetGlyphHeight(code: number, glyphSize: number, drawingCueSize: boolean): number;
}

export interface FloatingCurvePositionerLike {
  GetPoints(): Point[];
  GetThickness(): number;
  GetDir(): number;
  IsCrossStaff(): boolean;
  SetCachedX12(v: [number, number]): void;
}

export interface SlurDrawLike {
  GetID(): string;
  GetLform(): number;
  GetCurrentFloatingPositioner(): (FloatingCurvePositionerLike & { Is(classId: ClassId): boolean }) | null;
  CalcInitialCurve(doc: unknown, curve: FloatingCurvePositionerLike, nearEndCollision?: unknown): void;
  CalcSpannedElements(curve: FloatingCurvePositionerLike): void;
  AddPositionerToArticulations(curve: FloatingCurvePositionerLike): void;
}

export interface SlurStaffLike {
  m_drawingStaffSize: number;
}

export interface SlurDeviceContextLike extends DeviceContextLike {
  Is(classId: ClassId): boolean;
  ResumeGraphic(object: unknown, gId: string): void;
  StartGraphic(object: unknown, gClass: string, gId: string, graphicID?: number): void;
  EndResumedGraphic(object: unknown, view: unknown): void;
  EndGraphic(object: unknown, view: unknown): void;
  SetPen(width: number, style: PenStyle): void;
  ResetPen(): void;
  DrawCubicBezierPathFilled(bezier1: Point[], bezier2: Point[]): void;
  DrawCubicBezierPath(bezier: Point[]): void;
}

export interface NestedTupletObjectLike {
  GetChildCount(): number;
  GetChild(idx: number): NestedTupletObjectLike;
  Is(classId: ClassId): boolean;
}

export interface ViewTupletLike {
  GetID(): string;
  GetDrawingBracketPos(): number;
  CalcDrawingBracketAndNumPos(tupletNumHead: boolean): void;
  GetDrawingLeft(): unknown | null;
  GetDrawingRight(): unknown | null;
  HasNum(): boolean;
  GetNum(): number;
  GetNumbase(): number;
  HasNumbase(): boolean;
  GetNumVisible(): number;
  GetNumFormat(): number;
  GetDrawingCueSize(): boolean;
}

export interface ViewTupletBracketLike {
  GetID(): string;
  GetBracketVisible(): number;
  SetEmptyBB(): void;
  GetFirstAncestor(classId: ClassId): unknown;
  GetAlignedNum(): { HasSelfBB(): boolean; GetSelfLeft(): number; GetSelfRight(): number; GetSelfTop(): number; GetSelfBottom(): number } | null;
  GetDrawingXLeft(): number;
  GetDrawingXRight(): number;
  GetDrawingYLeft(): number;
  GetDrawingYRight(): number;
}

export interface ViewTupletNumLike {
  GetID(): string;
  SetEmptyBB(): void;
  GetFirstAncestor(classId: ClassId): unknown;
  GetDrawingXMid(doc: unknown): number;
  GetDrawingYMid(): number;
}

export interface TupletStaffLike extends SlurStaffLike {
  GetDrawingStaffNotationSize(): number;
}

export interface TupletDeviceContextLike extends SlurDeviceContextLike {
  SetFont(font: unknown): void;
  ResetFont(): void;
  GetSmuflTextExtent(s: number[], extend: TextExtend): void;
  SetPenFull(width: number, style: PenStyle, dash: number, cap: number, join: number): void;
  DrawPolyline(n: number, points: Point[]): void;
  DrawMusicText(s: number[], x: number, y: number): void;
}

export interface ViewTupletDrawSeam {
  DrawLayerChildren(dc: unknown, tuplet: unknown, layer: unknown, staff: unknown, measure: unknown): void;
  DrawSmuflString(dc: unknown, x: number, y: number, s: number[], alignment: number, staffSize: number, dimin: boolean): void;
}

export const FONTSIZE_numeric = 1;
// Canonical libMEI ordinals: FONTSIZENUMERIC_vu == 2 (./libmei-att.ts).
export const FONTSIZENUMERIC_vu = 2;

export interface FontSizeNumericLike {
  GetType(): number;
  GetFontSizeNumeric(): number;
  GetFontSizeNumericType(): number;
}

export interface DocDrawingUnitLike extends ViewDocLike {
  GetDrawingUnit(staffSize: number): number;
}

export enum SlurHandling { Ignore = 0, Initialize, Drawing }

/** View::Offset internal class from view.h. */
export class ViewOffset {
  public m_ho = 0;
  public m_vo = 0;
  public m_startho = 0;
  public m_startvo = 0;
  public m_endho = 0;
  public m_endvo = 0;
  public m_object: unknown = null;
  public m_staffSize = 100;
}

export interface ViewDocLike {
  GetOptions(): {
    m_unit: { GetValue(): number };
    m_slurEndpointThickness?: { GetValue(): number };
    m_tupletNumHead?: { GetValue(): boolean };
    m_showHidden?: { GetValue(): boolean };
    m_tupletBracketThickness?: { GetValue(): number };
    m_dynamSingleGlyphs?: { GetValue(): boolean };
    m_lyricElision?: { GetValue(): number };
    m_graceFactor?: { GetValue(): number };
    m_ligatureAsBracket?: { GetValue(): boolean };
    m_ligatureOblique?: { GetValue(): number };
    m_shrinkToFit?: { GetValue(): boolean };
    m_useBraceGlyph?: { GetValue(): boolean };
    m_bracketThickness?: { GetValue(): number };
    m_subBracketThickness?: { GetValue(): number };
    m_staffLineWidth?: { GetValue(): number };
    m_barLineSeparation?: { GetValue(): number };
    m_barLineWidth?: { GetValue(): number };
    m_thickBarlineThickness?: { GetValue(): number };
    m_dashedBarLineDashLength?: { GetValue(): number };
    m_dashedBarLineGapLength?: { GetValue(): number };
    m_repeatBarLineDotSeparation?: { GetValue(): number };
    m_systemDivider?: { GetValue(): number };
    m_ledgerLineThickness?: { GetValue(): number };
    m_ledgerLineExtension?: { GetValue(): number };
    m_multiRestThickness?: { GetValue(): number };
    m_svgHtml5?: { GetValue(): boolean };
    m_textEnclosureThickness?: { GetValue(): number };
    m_mnumInterval?: { GetValue(): number };
  };
  m_drawingPageContentHeight: number;
  m_drawingPageMarginLeft: number;
  m_drawingPageMarginTop: number;
  GetAdjustedDrawingPageHeight(): number;
  GetLeftMargin(id: number): number;
  GetRightMargin(id: number): number;
  GetTextLineHeight(f: unknown, b: boolean): number;
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
  GetDrawingStemWidth(staffSize: number): number;
  GetDrawingStaffSize(staffSize: number): number;
  GetDrawingOctaveSize(staffSize: number): number;
  GetDrawingBarLineWidth(staffSize: number): number;
  GetDrawingStaffLineWidth(staffSize: number): number;
  GetDrawingBeamWhiteWidth(staffSize: number, b: boolean): number;
  GetDrawingHairpinSize(staffSize: number, b: boolean): number;
  GetGlyphWidth(code: number, staffSize: number, grace: boolean): number;
  GetGlyphHeight(code: number, staffSize: number, grace: boolean): number;
  GetGlyphLeft(code: number, staffSize: number, grace: boolean): number;
  GetGlyphBottom(code: number, staffSize: number, grace: boolean): number;
  GetGlyphTop(code: number, staffSize: number, grace: boolean): number;
  GetGlyphAdvX(code: number, staffSize: number, grace: boolean): number;
  GetDrawingSmuflFont(staffSize: number, grace: boolean): unknown;
  GetDrawingLyricFont(staffSize: number): { GetPointSize(): number };
  GetBottomMargin(id: number): number;
  GetTextGlyphHeight(code: number, font: unknown, graceSize: boolean): number;
  GetTextGlyphDescender(code: number, font: unknown, graceSize: boolean): number;
  GetResourcesForModification?(): unknown;
  GetResources(): unknown;
  GetOptions(): {
    m_unit: { GetValue(): number };
    m_slurEndpointThickness?: { GetValue(): number };
    m_tupletNumHead?: { GetValue(): boolean };
    m_showHidden?: { GetValue(): boolean };
    m_lyricVerseCollapse?: { GetValue(): boolean };
    m_lyricHeightFactor?: { GetValue(): number };
    m_tupletBracketThickness?: { GetValue(): number };
    m_dynamSingleGlyphs?: { GetValue(): boolean };
    m_lyricElision?: { GetValue(): number };
    m_graceFactor?: { GetValue(): number };
    m_ligatureAsBracket?: { GetValue(): boolean };
    m_ligatureOblique?: { GetValue(): number };
    m_shrinkToFit?: { GetValue(): boolean };
    m_useBraceGlyph?: { GetValue(): boolean };
    m_bracketThickness?: { GetValue(): number };
    m_subBracketThickness?: { GetValue(): number };
    m_staffLineWidth?: { GetValue(): number };
    m_barLineSeparation?: { GetValue(): number };
    m_barLineWidth?: { GetValue(): number };
    m_thickBarlineThickness?: { GetValue(): number };
    m_dashedBarLineDashLength?: { GetValue(): number };
    m_dashedBarLineGapLength?: { GetValue(): number };
    m_repeatBarLineDotSeparation?: { GetValue(): number };
    m_systemDivider?: { GetValue(): number };
    m_ledgerLineThickness?: { GetValue(): number };
    m_ledgerLineExtension?: { GetValue(): number };
    m_multiRestThickness?: { GetValue(): number };
    m_svgHtml5?: { GetValue(): boolean };
    m_textEnclosureThickness?: { GetValue(): number };
    m_mnumInterval?: { GetValue(): number };
  };
  IsTranscription?(): boolean;
  IsFacs?(): boolean;
  GetType?(): number;
  GetDrawingUnit(staffSize: number): number;
  ScoreDefSetCurrentDoc?(): void;
}

export interface ViewPageLike {
  LayOut?(): void;
  LayOutTranscription?(force?: boolean): void;
  GetPPUFactor?(): number;
  m_drawingScoreDef?: ViewPageScoreDefLike;
  GetChildren?(): ViewPageObjectLike[];
  GetID?(): string;
  GetHeader?(): unknown;
  GetFooter?(): unknown;
}

export interface ViewObjectLike {
  HasInterface(interfaceId: InterfaceId): boolean;
  GetOffsetInterface?(): unknown;
  GetOffsetSpanningInterface?(): unknown;
}

export interface OffsetHoVoLike {
  HasHo(): boolean; HasVo(): boolean;
  GetHo(): { GetVu(): number }; GetVo(): { GetVu(): number };
}

export interface OffsetSpanningLike {
  HasStartho(): boolean; HasStartvo(): boolean; HasEndho(): boolean; HasEndvo(): boolean;
  GetStartho(): { GetVu(): number }; GetStartvo(): { GetVu(): number };
  GetEndho(): { GetVu(): number }; GetEndvo(): { GetVu(): number };
}

export interface DeviceContextLike {
  ApplyOffset?(): boolean;
}

// =========================================================================
// view_page.cpp — Pass 323 structural contracts
// =========================================================================

export interface ViewPageDeviceContextLike extends ViewGraphDeviceContextLike {
  HasResources(): boolean;
  SetResources(r: unknown): void;
  ResetResources(): void;
  DrawBackgroundImage(): void;
  GetLogicalOrigin(): { x: number; y: number };
  SetLogicalOrigin(x: number, y: number): void;
  StartPage(): void;
  EndPage(): void;
  SetContentHeight(h: number): void;
  GetHeight(): number;
  StartGraphic(o: unknown, name: string, id: string): void;
  EndGraphic(o: unknown, v: unknown): void;
  StartTextGraphic(o: unknown, name: string, id: string): void;
  EndTextGraphic(o: unknown, v: unknown): void;
  StartText(x: number, y: number, align: number): void;
  EndText(): void;
  UseGlobalStyling(): boolean;
  GetTextExtent?(s: string, e: TextExtend, wordSpace: boolean): void;
  Is(classId: number): boolean;
  AddDescription?(s: string): void;
  DrawFilledRectangle?(x1: number, y1: number, x2: number, y2: number): void;
  GetFont(): FontInfo;
  HasFont(): boolean;
  GetResources(): { SelectTextFont(weight: FontWeight, style: FontStyle): void } | null;
  DrawText(text: string, u32?: number[], x?: number, y?: number, width?: number, height?: number): void;
  MoveTextTo(x: number, y: number, alignment: number): void;
  MoveTextVerticallyTo(y: number): void;
  DrawGraphicUri(x: number, y: number, width: number, height: number, target: string): void;
  DrawSvgShape(x: number, y: number, width: number, height: number, scale: number, node: unknown): void;
}

export interface ViewPageObjectLike {
  GetID(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetDrawingXRel?(): number;
  GetContentLeft?(): number;
  GetContentRight?(): number;
  Is?(id: number): boolean;
  IsMilestoneElement?(): boolean;
  IsPageElement?(): boolean;
  IsHidden?(): boolean;
  IsSystemElement?(): boolean;
  IsControlElement?(): boolean;
  IsEditorialElement?(): boolean;
  IsLayerElement?(): boolean;
  IsTextElement?(): boolean;
  IsAnyOf?(classes: number[]): boolean;
  HasInterface?(interfaceId: InterfaceId): boolean;
  GetChildren?(): ViewPageObjectLike[];
  GetChildrenForModification?(): ViewPageObjectLike[];
  GetChildCount?(classId?: number): number;
  GetChild?(i: number, classId?: number): ViewPageObjectLike | null;
  GetFirstAncestor?(id: number): ViewPageObjectLike | null;
  GetParent?(): ViewPageObjectLike | null;
  FindDescendantByType?(id: number, depth?: number, direction?: boolean): ViewPageObjectLike | null;
  FindAllDescendantsByType?(id: number, b?: boolean): ViewPageObjectLike[];
  FindDescendantByComparison?(c: unknown, depth?: number, direction?: boolean): ViewPageObjectLike | null;
  HasNonEditorialContent?(): boolean;
  HasText?(testOnly: boolean): boolean;
  GetText?(testOnly: boolean): number[];
  GetTextOnFacsimile?(dc: unknown): number[];
  GetIDStr?(): string;
  GetDescendantIndex?(child: ViewPageObjectLike, classId: number, depth: number): number;
}

export interface ViewPageElementLike extends ViewPageObjectLike {
  GetStart?(): ViewPageObjectLike | null;
}

export interface ViewPageMilestoneEndLike extends ViewPageObjectLike {
  GetStart(): ViewPageObjectLike;
}

export interface ViewPageSystemLike extends ViewPageObjectLike {
  GetDrawingScoreDef(): ViewPageScoreDefLike;
  GetDrawingX(): number;
  GetDrawingY(): number;
  ResetDrawingList(): void;
  GetDrawingList(): ViewPageObjectLike[];
  AddToDrawingList?(o: unknown): void;
  IsFirstInPage(): boolean;
  IsFirstOfMdiv(): boolean;
  IsDrawingOptimized(): boolean;
  GetTopVisibleStaff(a: boolean): ViewPageStaffLike | null;
  GetNext?(o: unknown, id: number): ViewPageObjectLike | null;
  SetDrawingAbbrLabelsWidth?(w: number): void;
  m_systemAligner?: { FindAllIntersectionPoints?(l: unknown, lines: unknown, ids: number[], m: number): void };
  SetCurrentFloatingPositioner?(staffN: number, object: ViewPageObjectLike, staff: unknown, object2: unknown): boolean;
  AddToDrawingListIfNecessary?(o: unknown): void;
  IsLastOfMdiv?(): boolean;
}

export interface ViewPageScoreDefLike extends ViewPageObjectLike {
  DrawLabels?(): boolean;
  SetDrawingWidth(w: number): void;
  HasKeySigInfo?(): boolean;
  GetKeySig(): { GetAccidCount(): number } | null;
  GetList(): ViewPageObjectLike[];
  GetStaffDef?(n: number): ViewPageStaffDefLike | null;
  HasSystemStartLine(): boolean;
  GetMaxStaffSize(): number;
  SetDrawingLabelsWidth?(w: number): void;
  GetMnumVisible?(): number;
}

export interface ViewPageStaffGrpLike extends ViewPageObjectLike {
  GetDrawingVisibility?(): number;
  GetFirstLastStaffDef(): [ViewPageStaffDefLike | null, ViewPageStaffDefLike | null];
  GetMaxStaffSize(): number;
  GetGroupSymbol?(): ViewPageGrpSymLike | null;
}

export interface ViewPageStaffDefLike extends ViewPageObjectLike {
  GetN(): number;
  GetLines(): number;
  HasKeySigInfo?(): boolean;
  GetKeySig(): { GetAccidCount(): number } | null;
  HasLayerDefWithLabel?(): boolean;
  GetDrawingVisibility?(): number;
  GetLinesVisible?(): number;
}

export interface ViewPageGrpSymLike extends ViewPageObjectLike {
  GetStartDef(): ViewPageStaffDefLike;
  GetEndDef(): ViewPageStaffDefLike;
  GetSymbol(): number;
}

export interface ViewStaffAlignmentLike {
  GetStaffHeight(): number;
  GetOverflowAbove(): number;
  GetOverflowBelow(): number;
  GetVersePositionAbove(verseN: number, collapse: boolean, voltaN?: number): number;
  GetVersePositionBelow(verseN: number, collapse: boolean, voltaN?: number): number;
  FindFirstFloatingPositioner?(classId: number): { GetDrawingY(): number } | null;
}

export interface ViewPageStaffLike extends ViewPageObjectLike {
  m_drawingStaffSize: number;
  m_drawingLines: number;
  m_drawingNotationType: number;
  m_drawingStaffDef?: unknown;
  CalcPitchPosYRel?(doc: unknown, loc: number): number;
  GetAlignment?(): ViewStaffAlignmentLike | null;
  m_timeSpanningElements?: ViewPageObjectLike[];
  GetDrawingY(): number;
  GetDrawingX(): number;
  SetEmptyBB?(): void;
  DrawingIsVisible?(): boolean;
  HasVisible?(): boolean;
  GetVisible?(): number;
  GetN?(): number;
  GetDrawingStaffNotationSize(): number;
  IsTabWithStemsOutside?(): boolean;
  IsCurrentVisible?(): boolean;
  IsTabLuteGerman?(): boolean;
  IsTabLuteFrench?(): boolean;
  IsTabLuteItalian?(): boolean;
  IsTablature?(): boolean;
  IsOssia?(): boolean;
  GetOssiaDrawingShift?(m: unknown, d: unknown): number;
  HasDrawingRotation?(): boolean;
  GetDrawingRotation?(): number;
  GetLedgerLinesAbove?(): ViewPageLedgerLineLike[];
  GetLedgerLinesBelow?(): ViewPageLedgerLineLike[];
  GetLedgerLinesAboveCue?(): ViewPageLedgerLineLike[];
  GetLedgerLinesBelowCue?(): ViewPageLedgerLineLike[];
  AdjustDrawingYRel?(s: unknown, d: unknown): void;
  IsOnStaffLine(y: number, doc: unknown): boolean;
  IsMensural(): boolean;
}

export interface ViewPageLedgerLineLike {
  m_dashes: { m_x1: number; m_x2: number; m_events?: unknown[] }[];
}

export interface ViewPageMRestLike extends ViewPageObjectLike {
  GetCutout?(): number;
}

export interface ViewPageMeterSigLike extends ViewPageObjectLike {
  GetVisible?(): number;
  HasCount?(): boolean;
  GetDrawingX(): number;
  GetContentLeft?(): number;
  GetContentRight?(): number;
}

export interface ViewPageMeterSigGrpLike extends ViewPageObjectLike {
  GetList?(): ViewPageObjectLike[];
  GetFunc?(): number;
}

export interface ViewPageMNumLike extends ViewPageObjectLike {
  GetChildRendAlignment?(): number;
  HasFontsize?(): boolean;
  GetFontsizeAlternate?(): unknown;
}

export interface ViewPageOssiaLike extends ViewPageObjectLike {
  GetDrawingTopOStaff?(): ViewPageStaffLike | null;
  GetDrawingBottopOStaff?(): ViewPageStaffLike | null;
  IsFirst?(): boolean;
  IsLast?(): boolean;
  DrawScoreDef?(): boolean;
  HasMultipleOStaves?(): boolean;
  HasShowBarLines?(): boolean;
  GetShowBarLines?(): number;
  GetDrawingStaffGrp?(): ViewPageStaffGrpLike | null;
  GetDrawingLeftBarLine?(): ViewPageBarLineLike | null;
}

export interface ViewPageMeasureLike extends ViewPageObjectLike {
  GetN?(): string;
  GetDrawingY(): number;
  GetDrawingX(): number;
  GetDrawingXRel?(): number;
  GetWidth?(): number;
  GetInnerWidth?(): number;
  m_measureAligner?: { GetMaxTime(): Fraction };
  GetRightBarLineLeft?(): number;
  GetRightBarLineRight?(): number;
  HasInvisibleStaffBarlines?(): boolean;
  GetDrawingLeftBarLineByStaffN?(n: number): number;
  GetDrawingRightBarLineByStaffN?(n: number): number;
  IsMeasuredMusic?(): boolean;
  GetMeasureOrdinalNumber?(s: unknown): number;
  GetBottomVisibleStaff?(): ViewPageStaffLike | null;
  GetDrawingLeftBarLine?(): number;
  GetDrawingRightBarLine?(): number;
  GetLeftBarLine?(): ViewPageBarLineLike | null;
  GetRightBarLine?(): ViewPageBarLineLike | null;
  IsLastInSystem?(): boolean;
}

export interface ViewPageBarLineLike extends ViewPageObjectLike {
  GetForm(): number;
  GetPosition(): number;
  IsDrawnThrough(g: ViewPageStaffGrpLike): boolean;
  HasRepetitionDots(): boolean;
  GetMethodFromContext(s: ViewPageStaffDefLike | null): [boolean, number];
  GetPlaceFromContext(s: ViewPageStaffDefLike | null): [boolean, number];
  GetLengthFromContext(s: ViewPageStaffDefLike | null): [boolean, number];
  SetEmptyBB?(): void;
  GetAlignment?(): { GetType?(): number } | null;
  GetAncestorStaff?(s: number, b: boolean): ViewPageStaffLike | null;
}

export interface ViewPageLabelLike extends ViewPageObjectLike {
  GetText(): number[];
  GetTextLines(l: string[]): void;
  GetContentX1?(): number;
  GetContentX2?(): number;
}

export interface ViewPageLabelHolderLike extends ViewPageObjectLike {
}

export interface ViewPageLayerDefLike extends ViewPageObjectLike {
}

export interface ViewPageLayerLike extends ViewPageObjectLike {
  ResetDrawingList(): void;
  GetDrawingList(): ViewPageObjectLike[];
  GetLast?(classId?: number): ViewPageObjectLike | null;
  GetNextOf?(child: unknown, classId?: number): ViewPageObjectLike | null;
  GetNext?(o?: unknown): ViewPageObjectLike | null;
  HasCursor(): boolean;
  GetCursor(): ViewPageObjectLike | null;
  GetClef(e: ViewPageObjectLike | null): ViewPageObjectLike | null;
  GetAtPos(x: number): ViewPageObjectLike | null;
  GetPreviousInLayer(e: ViewPageObjectLike | null): ViewPageObjectLike | null;
  HasStaffDef?(): boolean;
  HasCautionStaffDef?(): boolean;
  GetStaffDefMeterSigGrp?(): ViewPageMeterSigGrpLike | null;
  GetStaffDefClef?(): ViewPageObjectLike | null;
  GetStaffDefKeySig?(): ViewPageObjectLike | null;
  GetStaffDefMensur?(): ViewPageObjectLike | null;
  GetStaffDefMeterSig?(): ViewPageObjectLike | null;
  GetCautionStaffDefClef?(): ViewPageObjectLike | null;
  GetCautionStaffDefKeySig?(): ViewPageObjectLike | null;
  GetCautionStaffDefMensur?(): ViewPageObjectLike | null;
  GetCautionStaffDefMeterSig?(): ViewPageObjectLike | null;
}

export interface ViewPageAppLike extends ViewPageObjectLike {
  GetLevel(): number;
}


export class View {
  public static s_drawingLigX: [number, number] = [0, 0];
  public static s_drawingLigY: [number, number] = [0, 0];
  public static s_drawingLigObliqua = false;
  public m_doc: ViewDocLike | null = null;
  public m_options: ReturnType<ViewDocLike['GetOptions']> | null = null;
  public m_drawingScoreDef: ViewPageScoreDefLike | null = null;
  public m_currentPage: ViewPageLike | null = null;
  protected m_currentColor = COLOR_NONE;
  protected m_slurHandling = SlurHandling.Initialize;
  private readonly m_currentOffsets: ViewOffset[] = [];

  public constructor() {}

  public GetSlurHandling(): SlurHandling { return this.m_slurHandling; }
  public SetSlurHandling(slurHandling: SlurHandling): void { this.m_slurHandling = slurHandling; }

  public SetDoc(doc: ViewDocLike | null): void {
    if (doc == null) {
      this.m_doc = null;
      this.m_options = null;
    }
    else {
      this.m_doc = doc;
      this.m_options = doc.GetOptions();
    }
    this.m_currentPage = null;
  }

  public SetPage(page: ViewPageLike, doLayout: boolean): void {
    if (!page) throw new Error('View::SetPage requires a page.');
    this.m_currentPage = page;
    if (doLayout) {
      this.m_doc!.ScoreDefSetCurrentDoc!();
      if (this.m_doc!.IsTranscription?.() || this.m_doc!.IsFacs?.()) {
        this.m_currentPage!.LayOutTranscription?.();
      }
      else {
        this.m_currentPage!.LayOut?.();
      }
    }
  }

  // C++ View::GetPPUFactor() const. DrawSmuflCodeWithCustomFont is commented out in C++ — not ported.
  public GetPPUFactor(): number {
    if (!this.m_currentPage) return 1.0;
    return this.m_currentPage.GetPPUFactor!();
  }

  public ToDeviceContextX(i: number): number { return i; }
  public ToLogicalX(i: number): number { return i; }
  public ToDeviceContextY(i: number): number {
    if (!this.m_doc) return 0;
    return this.m_doc.m_drawingPageContentHeight - i;
  }
  public ToLogicalY(i: number): number {
    if (!this.m_doc) return 0;
    return this.m_doc.m_drawingPageContentHeight - i;
  }
  public ToDeviceContext(p: Point): Point { return new Point(this.ToDeviceContextX(p.x), this.ToDeviceContextY(p.y)); }
  public ToLogical(p: Point): Point { return new Point(this.ToLogicalX(p.x), this.ToLogicalY(p.y)); }

  public IntToTupletFigures(number: number): number[] { return this.IntToSmuflFigures(number, 0xe880); }
  public IntToTimeSigFigures(number: number): number[] { return this.IntToSmuflFigures(number, 0xe080); }

  public IntToSmuflFigures(number: number, offset: number): number[] {
    const str = UTF8to32(String(number));
    return str.map((c) => c + offset - 48);
  }

  public StartOffset(dc: DeviceContextLike, object: ViewObjectLike, staffSize: number): void {
    if (!dc.ApplyOffset?.()) return;

    const unit = this.m_doc!.GetOptions().m_unit.GetValue();

    const offset = new ViewOffset();

    if (object.HasInterface(InterfaceId.INTERFACE_OFFSET)) {
      const iface = object.GetOffsetInterface?.() as OffsetHoVoLike | null | undefined;
      if (iface) {
        if (iface.HasHo() || iface.HasVo()) {
          // TS m_unit is 10x C++ DEFAULT_UNIT (90 vs 9), so vu * unit already
          // yields drawing units; WASM ground truth: vo="-7" shifts +630 at staffSize 100.
          offset.m_ho = iface.HasHo() ? iface.GetHo().GetVu() * unit : 0;
          offset.m_vo = iface.HasVo() ? iface.GetVo().GetVu() * unit : 0;
          offset.m_object = object;
          offset.m_staffSize = staffSize;
        }
      }
    }

    if (object.HasInterface(InterfaceId.INTERFACE_OFFSET_SPANNING)) {
      const iface = object.GetOffsetSpanningInterface?.() as OffsetSpanningLike | null | undefined;
      if (iface) {
        if (iface.HasStartho() || iface.HasStartvo() || iface.HasEndho() || iface.HasEndvo()) {
          offset.m_startho = iface.HasStartho() ? iface.GetStartho().GetVu() * unit : 0;
          offset.m_startvo = iface.HasStartvo() ? iface.GetStartvo().GetVu() * unit : 0;
          offset.m_endho = iface.HasEndho() ? iface.GetEndho().GetVu() * unit : 0;
          offset.m_endvo = iface.HasEndvo() ? iface.GetEndvo().GetVu() * unit : 0;
          offset.m_object = object;
          offset.m_staffSize = staffSize;
        }
      }
    }

    if (offset.m_object) this.m_currentOffsets.unshift(offset);
  }

  public EndOffset(dc: DeviceContextLike, object: unknown): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    if (this.m_currentOffsets[0].m_object === object) this.m_currentOffsets.shift();
  }

  public SetOffsetStaffSize(object: unknown, staffSize: number): void {
    if (this.m_currentOffsets.length === 0) return;
    if (this.m_currentOffsets[0].m_object === object) this.m_currentOffsets[0].m_staffSize = staffSize;
  }

  // C++ integer arithmetic: ho * staffSize / 100 truncates toward zero.
  private offsetSpanningX(offset: ViewOffset, value: number, factor: number): number {
    return Math.trunc(value * offset.m_staffSize / 100 * factor);
  }

  public CalcOffset(dc: DeviceContextLike, p: { x: number; y: number }): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    for (const offset of this.m_currentOffsets) {
      p.x = p.x + Math.trunc(offset.m_ho * offset.m_staffSize / 100);
      p.y = p.y + Math.trunc(offset.m_vo * offset.m_staffSize / 100);
    }
  }

  public CalcOffsetX(dc: DeviceContextLike, x: { value: number }): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    for (const offset of this.m_currentOffsets) {
      x.value = x.value + Math.trunc(offset.m_ho * offset.m_staffSize / 100);
    }
  }

  public CalcOffsetY(dc: DeviceContextLike, y: { value: number }): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    for (const offset of this.m_currentOffsets) {
      y.value = y.value + Math.trunc(offset.m_vo * offset.m_staffSize / 100);
    }
  }

  public CalcOffsetSpanningStartX(dc: DeviceContextLike, x: { value: number }, spanningType: number, factor = 1.0): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    for (const offset of this.m_currentOffsets) {
      if (spanningType === SpanningType.SPANNING_START_END) {
        x.value = x.value + this.offsetSpanningX(offset, offset.m_startho, factor);
      }
      else if (spanningType === SpanningType.SPANNING_START) {
        x.value = x.value + this.offsetSpanningX(offset, offset.m_startho, factor);
      }
    }
  }

  public CalcOffsetSpanningEndX(dc: DeviceContextLike, x: { value: number }, spanningType: number, factor = 1.0): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    for (const offset of this.m_currentOffsets) {
      if (spanningType === SpanningType.SPANNING_START_END) {
        x.value = x.value + this.offsetSpanningX(offset, offset.m_endho, factor);
      }
      else if (spanningType === SpanningType.SPANNING_END) {
        x.value = x.value + this.offsetSpanningX(offset, offset.m_endho, factor);
      }
    }
  }

  public CalcOffsetSpanningStartY(dc: DeviceContextLike, y: { value: number }, spanningType: number, factor = 1.0): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    for (const offset of this.m_currentOffsets) {
      if (spanningType === SpanningType.SPANNING_START_END) {
        y.value = y.value + Math.trunc(offset.m_startvo * offset.m_staffSize / 100 * factor);
      }
      else if (spanningType === SpanningType.SPANNING_START) {
        y.value = y.value + Math.trunc(offset.m_startvo * offset.m_staffSize / 100 * factor);
      }
      else if (spanningType === SpanningType.SPANNING_END) {
        y.value = y.value + Math.trunc(Math.trunc((offset.m_startvo + offset.m_endvo) / 2) * offset.m_staffSize / 100 * factor);
      }
      else {
        const diff = Math.trunc((offset.m_startvo - offset.m_endvo) / 2);
        y.value = y.value + Math.trunc((Math.trunc((offset.m_startvo + offset.m_endvo) / 2) + diff) * offset.m_staffSize / 100 * factor);
      }
    }
  }

  public CalcOffsetSpanningEndY(dc: DeviceContextLike, y: { value: number }, spanningType: number, factor = 1.0): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    for (const offset of this.m_currentOffsets) {
      if (spanningType === SpanningType.SPANNING_START_END) {
        y.value = y.value + Math.trunc(offset.m_endvo * offset.m_staffSize / 100 * factor);
      }
      else if (spanningType === SpanningType.SPANNING_START) {
        y.value = y.value + Math.trunc(Math.trunc((offset.m_endvo + offset.m_startvo) / 2) * offset.m_staffSize / 100 * factor);
      }
      else if (spanningType === SpanningType.SPANNING_END) {
        y.value = y.value + Math.trunc(offset.m_endvo * offset.m_staffSize / 100 * factor);
      }
      else {
        const diff = Math.trunc((offset.m_endvo - offset.m_startvo) / 2);
        y.value = y.value + Math.trunc((Math.trunc((offset.m_startvo + offset.m_endvo) / 2) + diff) * offset.m_staffSize / 100 * factor);
      }
    }
  }

  public CalcOffsetBezier(dc: DeviceContextLike, points: Point[], spanningType: number): void {
    if (!dc.ApplyOffset?.() || this.m_currentOffsets.length === 0) return;
    const diff = points[3].x - points[0].x;
    const factorStart = diff !== 0.0 ? (points[3].x - points[1].x) / diff : 1.0;
    const factorEnd = diff !== 0.0 ? (points[2].x - points[0].x) / diff : 1.0;
    const p0y = { value: points[0].y };
    this.CalcOffsetSpanningStartY(dc, p0y, spanningType);
    points[0].y = p0y.value;
    const p1y1 = { value: points[1].y };
    this.CalcOffsetSpanningStartY(dc, p1y1, spanningType, factorStart);
    points[1].y = p1y1.value;
    const p1y2 = { value: points[1].y };
    this.CalcOffsetSpanningEndY(dc, p1y2, spanningType, Math.abs(1.0 - factorStart));
    points[1].y = p1y2.value;
    const p2y1 = { value: points[2].y };
    this.CalcOffsetSpanningStartY(dc, p2y1, spanningType, Math.abs(1.0 - factorEnd));
    points[2].y = p2y1.value;
    const p2y2 = { value: points[2].y };
    this.CalcOffsetSpanningEndY(dc, p2y2, spanningType, factorEnd);
    points[2].y = p2y2.value;
    const p3y = { value: points[3].y };
    this.CalcOffsetSpanningEndY(dc, p3y, spanningType);
    points[3].y = p3y.value;
    const p0x = { value: points[0].x };
    this.CalcOffsetSpanningStartX(dc, p0x, spanningType);
    points[0].x = p0x.value;
    const p1x1 = { value: points[1].x };
    this.CalcOffsetSpanningStartX(dc, p1x1, spanningType, factorStart);
    points[1].x = p1x1.value;
    const p1x2 = { value: points[1].x };
    this.CalcOffsetSpanningEndX(dc, p1x2, spanningType, Math.abs(1.0 - factorStart));
    points[1].x = p1x2.value;
    const p2x1 = { value: points[2].x };
    this.CalcOffsetSpanningStartX(dc, p2x1, spanningType, Math.abs(1.0 - factorEnd));
    points[2].x = p2x1.value;
    const p2x2 = { value: points[2].x };
    this.CalcOffsetSpanningEndX(dc, p2x2, spanningType, factorEnd);
    points[2].x = p2x2.value;
    const p3x = { value: points[3].x };
    this.CalcOffsetSpanningEndX(dc, p3x, spanningType);
    points[3].x = p3x.value;
    if (spanningType === SpanningType.SPANNING_START_END) {
      for (let i = 0; i < 4; i++) {
        const p = { x: points[i].x, y: points[i].y };
        this.CalcOffset(dc, p);
        points[i].x = p.x; points[i].y = p.y;
      }
    }
    else if (spanningType === SpanningType.SPANNING_START) {
      for (let i = 2; i < 4; i++) {
        const p = { x: points[i].x, y: points[i].y };
        this.CalcOffset(dc, p);
        points[i].x = p.x; points[i].y = p.y;
      }
      const y0 = { value: points[0].y };
      this.CalcOffsetY(dc, y0);
      points[0].y = y0.value;
      const y1 = { value: points[1].y };
      this.CalcOffsetY(dc, y1);
      points[1].y = y1.value;
    }
    else if (spanningType === SpanningType.SPANNING_END) {
      for (let i = 0; i < 2; i++) {
        const p = { x: points[i].x, y: points[i].y };
        this.CalcOffset(dc, p);
        points[i].x = p.x; points[i].y = p.y;
      }
      const y2 = { value: points[2].y };
      this.CalcOffsetY(dc, y2);
      points[2].y = y2.value;
      const y3 = { value: points[3].y };
      this.CalcOffsetY(dc, y3);
      points[3].y = y3.value;
    }
    else {
      for (let i = 0; i < 4; i++) {
        const y = { value: points[i].y };
        this.CalcOffsetY(dc, y);
        points[i].y = y.value;
      }
    }
  }

  public ConvertFontSizeNumeric(fontSize: FontSizeNumericLike, staffSize: number): number {
    if (fontSize.GetType() !== FONTSIZE_numeric) throw new Error('View::ConvertFontSizeNumeric requires fontSizeNumeric.');
    if (fontSize.GetFontSizeNumericType() === FONTSIZENUMERIC_vu) {
      if (!this.m_doc) throw new Error('View::ConvertFontSizeNumeric requires a document.');
      return Math.round(fontSize.GetFontSizeNumeric() * (this.m_doc as DocDrawingUnitLike).GetDrawingUnit(staffSize));
    }
    return View.ConvertFontPointSize(fontSize.GetFontSizeNumeric());
  }

  public static ConvertFontPointSize(pointSize: number): number {
    const millimetersPerInch = 25.4;
    const pointsPerInch = 72.0;
    const drawingUnitsPerMillimeter = 10.0 * DEFINITION_FACTOR;
    return Math.round(pointSize * millimetersPerInch * drawingUnitsPerMillimeter / pointsPerInch);
  }

  //----------------------------------------------------------------------------
  // View - Slur (src-cpp/src/view_slur.cpp)
  //----------------------------------------------------------------------------

  public DrawSlur(dc: SlurDeviceContextLike, slur: SlurDrawLike, x1: number, x2: number, staff: SlurStaffLike, spanningType: number, graphic?: ViewObjectLike | null): void {
    if (!dc) throw new Error('View::DrawSlur requires a device context.');
    if (!slur) throw new Error('View::DrawSlur requires a slur.');
    if (!staff) throw new Error('View::DrawSlur requires a staff.');
    const curve = this.CalcInitialSlur(dc, slur, x1, x2, staff, spanningType);
    const points = curve.GetPoints();
    this.CalcOffsetBezier(dc, points, spanningType);
    if (graphic) {
      dc.ResumeGraphic(graphic, (graphic as unknown as { GetID(): string }).GetID());
    }
    else {
      dc.StartGraphic(slur, '', (slur as { GetID(): string }).GetID(), GraphicID.SPANNING);
    }
    let penStyle = PenStyle.PEN_SOLID;
    switch (slur.GetLform()) {
      case LINEFORM_dashed: penStyle = PenStyle.PEN_SHORT_DASH; break;
      case LINEFORM_dotted: penStyle = PenStyle.PEN_DOT; break;
      case LINEFORM_wavy:
      // TODO: Implement wavy slur.
      default: break;
    }
    const penWidth = Math.trunc((this.m_doc!.GetOptions() as { m_slurEndpointThickness: { GetValue(): number } }).m_slurEndpointThickness.GetValue() * (this.m_doc as DocSlurLike).GetDrawingUnit(staff.m_drawingStaffSize));
    const thicknessCoefficient = BoundingBox.GetBezierThicknessCoefficient(points, curve.GetThickness(), penWidth);
    this.DrawThickBezierCurve(dc, points, Math.trunc(thicknessCoefficient * curve.GetThickness()), staff.m_drawingStaffSize, penWidth, penStyle);
    if (graphic) {
      dc.EndResumedGraphic(graphic, this);
    }
    else {
      dc.EndGraphic(slur, this);
    }
  }

  public CalcInitialSlur(dc: SlurDeviceContextLike, slur: SlurDrawLike, x1: number, x2: number, staff: SlurStaffLike, spanningType: number): FloatingCurvePositionerLike {
    const positioner = slur.GetCurrentFloatingPositioner();
    if (!positioner || !positioner.Is(ClassId.FLOATING_CURVE_POSITIONER)) throw new Error('View::CalcInitialSlur requires a floating curve positioner.');
    const curve = positioner;
    if (this.m_slurHandling === SlurHandling.Initialize && dc.Is(ClassId.BBOX_DEVICE_CONTEXT)
      && (curve.GetDir() === CURVEDIR_none || curve.IsCrossStaff())) {
      curve.SetCachedX12([x1, x2]);
      slur.CalcInitialCurve(this.m_doc, curve);
      slur.CalcSpannedElements(curve);
      slur.AddPositionerToArticulations(curve);
    }
    return curve;
  }

  //----------------------------------------------------------------------------
  // View - Tuplet (src-cpp/src/view_tuplet.cpp)
  //----------------------------------------------------------------------------

  public NestedTuplets(object: NestedTupletObjectLike): number {
    if (!object) throw new Error('View::NestedTuplets requires an object.');
    let tupletDepth = 1;
    for (let i = 0; i < object.GetChildCount(); ++i) {
      let tupletCount = 1;
      const child = object.GetChild(i);
      // check how many nested tuplets there are
      if (child.Is(ClassId.TUPLET)) {
        tupletCount += this.NestedTuplets(child);
      }
      // and don't forget beams
      if (child.Is(ClassId.BEAM)) {
        tupletCount = this.NestedTuplets(child);
      }
      tupletDepth = tupletCount > tupletDepth ? tupletCount : tupletDepth;
    }
    return tupletDepth;
  }

  public DrawTuplet(dc: TupletDeviceContextLike, element: ViewTupletLike, layer: ViewObjectLike, staff: TupletStaffLike, measure: ViewObjectLike): void {
    if (!dc) throw new Error('View::DrawTuplet requires a device context.');
    if (!element) throw new Error('View::DrawTuplet requires an element.');
    if (!layer) throw new Error('View::DrawTuplet requires a layer.');
    if (!staff) throw new Error('View::DrawTuplet requires a staff.');
    if (!measure) throw new Error('View::DrawTuplet requires a measure.');

    const tuplet = element;

    // We do it here because we have no dedicated functor to do it (which would be an overkill)
    if (tuplet.GetDrawingBracketPos() === STAFFREL_basic_NONE) {
      tuplet.CalcDrawingBracketAndNumPos((this.m_doc!.GetOptions() as { m_tupletNumHead: { GetValue(): boolean } }).m_tupletNumHead.GetValue());
    }

    dc.StartGraphic(element, '', element.GetID());

    // Draw the inner elements (seam: DrawLayerChildren lives in view_element.cpp, pending)
    (this as unknown as ViewTupletDrawSeam).DrawLayerChildren(dc, tuplet, layer as never, staff as never, measure as never);

    dc.EndGraphic(element, this);
  }

  public DrawTupletBracket(dc: TupletDeviceContextLike, element: ViewTupletBracketLike, layer: ViewObjectLike, staff: TupletStaffLike, measure: ViewObjectLike): void {
    if (!dc) throw new Error('View::DrawTupletBracket requires a device context.');
    if (!element) throw new Error('View::DrawTupletBracket requires an element.');
    if (!layer) throw new Error('View::DrawTupletBracket requires a layer.');
    if (!staff) throw new Error('View::DrawTupletBracket requires a staff.');
    if (!measure) throw new Error('View::DrawTupletBracket requires a measure.');

    const tupletBracket = element;

    const showHidden = (this.m_doc!.GetOptions() as { m_showHidden: { GetValue(): boolean } }).m_showHidden.GetValue();

    if (!showHidden && tupletBracket.GetBracketVisible() === BOOLEAN_false) {
      tupletBracket.SetEmptyBB();
      return;
    }

    const tuplet = tupletBracket.GetFirstAncestor(ClassId.TUPLET) as ViewTupletLike | null;
    if (!tuplet) throw new Error('View::DrawTupletBracket requires a tuplet ancestor.');

    if (!tuplet.GetDrawingLeft() || !tuplet.GetDrawingRight()) {
      tupletBracket.SetEmptyBB();
      return;
    }

    dc.ResumeGraphic(tupletBracket, tupletBracket.GetID());

    const unit = (this.m_doc as unknown as DocSlurLike).GetDrawingUnit(staff.m_drawingStaffSize);
    const lineWidth = Math.trunc(unit * (this.m_options as unknown as { m_tupletBracketThickness: { GetValue(): number } }).m_tupletBracketThickness.GetValue());
    const xLeft = tupletBracket.GetDrawingXLeft() + Math.trunc(lineWidth / 2);
    const xRight = tupletBracket.GetDrawingXRight() - Math.trunc(lineWidth / 2);
    const yLeft = tupletBracket.GetDrawingYLeft();
    const yRight = tupletBracket.GetDrawingYRight();
    let bracketHeight = (tuplet.GetDrawingBracketPos() === STAFFREL_basic_above) ? -1 : 1;

    dc.SetPenFull(lineWidth, PenStyle.PEN_SOLID, 0, LineCapStyle.LINECAP_BUTT, LineJoinStyle.LINEJOIN_MITER);

    // Draw a bracket with a gap
    if (tupletBracket.GetAlignedNum() && tupletBracket.GetAlignedNum()!.HasSelfBB()) {
      const xNumLeft = tupletBracket.GetAlignedNum()!.GetSelfLeft() - Math.trunc(unit / 2);
      const xNumRight = tupletBracket.GetAlignedNum()!.GetSelfRight() + Math.trunc(unit / 2);
      const slope = (yRight - yLeft) / (xRight - xLeft);
      const yNumLeft = Math.trunc(yLeft + slope * (xNumLeft - xLeft));
      const yNumRight = Math.trunc(yRight - slope * (xRight - xNumRight));
      bracketHeight *= Math.trunc(Math.abs(tupletBracket.GetAlignedNum()!.GetSelfTop() - tupletBracket.GetAlignedNum()!.GetSelfBottom()) / 2);

      const bracketLeft: Point[] = [
        new Point(this.ToDeviceContextX(xLeft), this.ToDeviceContextY(yLeft + bracketHeight)),
        new Point(this.ToDeviceContextX(xLeft), this.ToDeviceContextY(yLeft)),
        new Point(this.ToDeviceContextX(xNumLeft), this.ToDeviceContextY(yNumLeft)),
      ];
      const bracketRight: Point[] = [
        new Point(this.ToDeviceContextX(xRight), this.ToDeviceContextY(yRight + bracketHeight)),
        new Point(this.ToDeviceContextX(xRight), this.ToDeviceContextY(yRight)),
        new Point(this.ToDeviceContextX(xNumRight), this.ToDeviceContextY(yNumRight)),
      ];

      dc.DrawPolyline(3, bracketLeft);
      dc.DrawPolyline(3, bracketRight);
    }
    else {
      bracketHeight *= unit + lineWidth;

      const bracket: Point[] = [
        new Point(this.ToDeviceContextX(xLeft), this.ToDeviceContextY(yLeft + bracketHeight)),
        new Point(this.ToDeviceContextX(xLeft), this.ToDeviceContextY(yLeft)),
        new Point(this.ToDeviceContextX(xRight), this.ToDeviceContextY(yRight)),
        new Point(this.ToDeviceContextX(xRight), this.ToDeviceContextY(yRight + bracketHeight)),
      ];

      dc.DrawPolyline(4, bracket);
    }

    dc.ResetPen();

    dc.EndResumedGraphic(tupletBracket, this);
  }

  public DrawTupletNum(dc: TupletDeviceContextLike, element: ViewTupletNumLike, layer: ViewObjectLike, staff: TupletStaffLike, measure: ViewObjectLike): void {
    if (!dc) throw new Error('View::DrawTupletNum requires a device context.');
    if (!element) throw new Error('View::DrawTupletNum requires an element.');
    if (!layer) throw new Error('View::DrawTupletNum requires a layer.');
    if (!staff) throw new Error('View::DrawTupletNum requires a staff.');
    if (!measure) throw new Error('View::DrawTupletNum requires a measure.');

    const tupletNum = element;

    const tuplet = tupletNum.GetFirstAncestor(ClassId.TUPLET) as ViewTupletLike | null;
    if (!tuplet) throw new Error('View::DrawTupletNum requires a tuplet ancestor.');

    const showHidden = (this.m_doc!.GetOptions() as { m_showHidden: { GetValue(): boolean } }).m_showHidden.GetValue();

    if (!tuplet.HasNum() || (!showHidden && tuplet.GetNumVisible() === BOOLEAN_false)) {
      tupletNum.SetEmptyBB();
      return;
    }

    if (!tuplet.GetDrawingLeft() || !tuplet.GetDrawingRight()) {
      tupletNum.SetEmptyBB();
      return;
    }

    const extend = new TextExtend();
    let notes: number[];

    const drawingCueSize = tuplet.GetDrawingCueSize();
    const glyphSize = staff.GetDrawingStaffNotationSize();
    dc.SetFont((this.m_doc as unknown as DocSlurLike).GetDrawingSmuflFont(glyphSize, drawingCueSize));
    notes = this.IntToTupletFigures((tuplet.GetNum() & 0xffff) | (((tuplet.GetNum() & 0x8000) !== 0 ? 0xffff0000 : 0)));
    if (tuplet.GetNumFormat() === tupletVis_NUMFORMAT_ratio) {
      if (tuplet.HasNumbase()) {
        notes.push(SMUFL_E88A_tupletColon);
        notes = notes.concat(this.IntToTupletFigures((tuplet.GetNumbase() & 0xffff) | (((tuplet.GetNumbase() & 0x8000) !== 0 ? 0xffff0000 : 0))));
      }
    }
    dc.GetSmuflTextExtent(notes, extend);

    let x = tupletNum.GetDrawingXMid(this.m_doc);
    // since the number is slanted, move the center left
    x -= Math.trunc(extend.m_width / 2);

    let y = tupletNum.GetDrawingYMid();
    // adjust the baseline (to be improved with slanted brackets
    y -= Math.trunc((this.m_doc as unknown as DocSlurLike).GetGlyphHeight(notes[notes.length - 1], glyphSize, drawingCueSize) / 2);

    dc.ResumeGraphic(tupletNum, tupletNum.GetID());

    (this as unknown as ViewTupletDrawSeam).DrawSmuflString(dc, x, y, notes, HORIZONTALALIGNMENT_left, glyphSize, drawingCueSize);

    dc.EndResumedGraphic(tupletNum, this);

    dc.ResetFont();
  }

  public DrawThickBezierCurve(dc: SlurDeviceContextLike, bezier: Point[], thickness: number, staffSize: number, penWidth: number, penStyle: PenStyle): void {
    if (!dc) throw new Error('View::DrawThickBezierCurve requires a device context.');
    const bez1: Point[] = [];
    const bez2: Point[] = [];
    BoundingBox.CalcThickBezier(bezier, thickness, bez1, bez2);
    for (let i = 0; i < 4; i++) bez1[i] = this.ToDeviceContext(bez1[i]);
    for (let i = 0; i < 4; i++) bez2[i] = this.ToDeviceContext(bez2[i]);
    if (penStyle === PenStyle.PEN_SOLID) {
      dc.SetPen(Math.max(1, Math.trunc((this.m_doc as DocSlurLike).GetDrawingStemWidth(staffSize) / 2)), penStyle);
      dc.DrawCubicBezierPathFilled(bez1, bez2);
    }
    else {
      dc.SetPen(thickness, penStyle);
      dc.DrawCubicBezierPath(bez1);
    }
    dc.ResetPen();
  }

  //----------------------------------------------------------------------------
  // View - Tab (src-cpp/src/view_tab.cpp)
  //----------------------------------------------------------------------------

  public DrawTabClef(dc: TabDeviceContextLike, element: ViewTabClefLike, layer: ViewObjectLike, staff: ViewTabStaffLike, measure: ViewObjectLike): void {
    if (!dc) throw new Error('View::DrawTabClef requires a device context.');
    if (!element) throw new Error('View::DrawTabClef requires an element.');
    if (!layer) throw new Error('View::DrawTabClef requires a layer.');
    if (!staff) throw new Error('View::DrawTabClef requires a staff.');
    if (!measure) throw new Error('View::DrawTabClef requires a measure.');

    const clef = element;

    const glyphSize = staff.GetDrawingStaffNotationSize();

    let y = staff.GetDrawingY();
    const x = element.GetDrawingX();

    const sym = clef.GetClefGlyph(staff.m_drawingNotationType);

    if (sym === 0) {
      clef.SetEmptyBB();
      return;
    }

    y -= Math.imul((this.m_doc as DocSlurLike).GetDrawingUnit(staff.m_drawingStaffSize), ((staff.m_drawingLines - 1) | 0));

    dc.StartGraphic(element, '', element.GetID());

    (this as unknown as ViewTabDrawSeam).DrawSmuflCode(dc, x, y, sym, glyphSize, false);

    // Possibly draw enclosing brackets
    (this as unknown as ViewTabDrawSeam).DrawClefEnclosing(dc, clef, staff, sym, x, y);

    dc.EndGraphic(element, this);
  }

  public DrawTabGrp(dc: TabDeviceContextLike, element: ViewObjectLike, layer: ViewObjectLike, staff: ViewTabStaffLike, measure: ViewObjectLike): void {
    if (!dc) throw new Error('View::DrawTabGrp requires a device context.');
    if (!element) throw new Error('View::DrawTabGrp requires an element.');
    if (!layer) throw new Error('View::DrawTabGrp requires a layer.');
    if (!staff) throw new Error('View::DrawTabGrp requires a staff.');

    const tabGrp = element as unknown as { GetID(): string };

    dc.StartGraphic(tabGrp, '', tabGrp.GetID());

    // Draw children (rhythm, notes)
    (this as unknown as ViewTabDrawSeam).DrawLayerChildren(dc, tabGrp, layer, staff, measure);

    dc.EndGraphic(tabGrp, this);
  }

  public DrawTabNote(dc: TabDeviceContextLike, element: ViewTabNoteLike, layer: ViewObjectLike, staff: ViewTabStaffLike, measure: ViewObjectLike): void {
    if (!dc) throw new Error('View::DrawTabNote requires a device context.');
    if (!element) throw new Error('View::DrawTabNote requires an element.');
    if (!layer) throw new Error('View::DrawTabNote requires a layer.');
    if (!staff) throw new Error('View::DrawTabNote requires a staff.');

    const note = element;

    dc.StartGraphic(note, '', note.GetID());

    let x = element.GetDrawingX();
    let y = element.GetDrawingY();

    const pRef = { x: x, y: y };
    this.CalcOffset(dc as never, pRef);
    x = pRef.x; y = pRef.y;

    const glyphSize = staff.GetDrawingStaffNotationSize();
    const drawingCueSize = false;
    const refs = { overline: 0, strike: 0, underline: 0 };

    if (staff.m_drawingNotationType === NOTATIONTYPE_tab_guitar) {
      const fret = note.GetTabFretString(staff.m_drawingNotationType, refs);

      const fretTxt = new FontInfo();
      if (!dc.UseGlobalStyling()) {
        fretTxt.SetFaceName((this.m_doc as DocTabLike).GetResources().GetTextFont());
      }

      const params = { m_x: x, m_y: y, m_pointSize: 0, m_width: 0, m_height: 0, m_alignment: 0, m_enclose: 0, m_textEnclose: 0, m_laidOut: false, m_explicitPosition: false, m_verticalShift: false, m_staffSize: 100, m_actualWidth: 0 } as TabTextParamsLike;
      params.m_pointSize = Math.trunc((this.m_doc as DocTabLike).GetDrawingLyricFont(glyphSize).GetPointSize() * 4 / 5);
      fretTxt.SetPointSize(params.m_pointSize);

      dc.SetFont(fretTxt);

      params.m_y -= Math.trunc((this.m_doc as DocTabLike).GetTextGlyphHeight(48, fretTxt, drawingCueSize) / 2);

      dc.StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_center);
      (this as unknown as ViewTabDrawSeam).DrawTextString(dc, fret, params);
      dc.EndText();

      dc.ResetFont();
    }
    else {
      const fret = note.GetTabFretString(staff.m_drawingNotationType, refs);
      // Center for italian tablature
      if (staff.IsTabLuteItalian()) {
        y -= Math.trunc((this.m_doc as DocTabLike).GetGlyphHeight(SMUFL_EBE0_luteItalianFret0, glyphSize, drawingCueSize) / 2);
      }
      // Above the line for french tablature
      else if (staff.IsTabLuteFrench()) {
        y -= Math.trunc((this.m_doc as DocTabLike).GetDrawingUnit(staff.m_drawingStaffSize) - (this.m_doc as DocTabLike).GetDrawingStaffLineWidth(staff.m_drawingStaffSize));
      }
      // Center for German tablature
      else if (staff.IsTabLuteGerman()) {
        y -= Math.trunc((this.m_doc as DocTabLike).GetGlyphHeight(SMUFL_EC17_luteGermanAUpper, glyphSize, drawingCueSize) / 2);
      }

      dc.SetFont((this.m_doc as DocSlurLike).GetDrawingSmuflFont(glyphSize, false));
      (this as unknown as ViewTabDrawSeam).DrawSmuflString(dc, x, y, fret, HORIZONTALALIGNMENT_center, glyphSize);

      // Add overlines, strikethoughs and underlines if required
      if ((refs.overline > 0 || refs.strike > 0 || refs.underline > 0) && fret.length > 0) {
        const lineThickness = Math.trunc((this.m_options as unknown as { m_lyricLineThickness: { GetValue(): number } }).m_lyricLineThickness.GetValue() * (this.m_doc as DocTabLike).GetDrawingUnit(staff.m_drawingStaffSize));
        const widthFront = (this.m_doc as DocTabLike).GetGlyphWidth(fret[0], glyphSize, drawingCueSize);
        const widthBack = (this.m_doc as DocTabLike).GetGlyphWidth(fret[fret.length - 1], glyphSize, drawingCueSize);
        const extend = new TextExtend();
        dc.GetSmuflTextExtent(fret, extend);

        // TODO These fiddle factors seem necessary to get the lines balanced on either side
        // of the fret string.  Can we do better?
        const x1 = Math.trunc(x - (fret.length === 1 ? widthFront * 7 / 10 : widthFront * 12 / 10)); // extend on the left hand side
        const x2 = Math.trunc(x + extend.m_width - widthBack * 1 / 10); // trim right hand overhang on last character

        dc.SetPen(lineThickness, PenStyle.PEN_SOLID);

        // overlines
        let y1 = Math.trunc(y + extend.m_ascent + lineThickness);

        for (let i = 0; i < refs.overline; ++i) {
          dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y1));
          y1 = Math.trunc(y1 + 2 * lineThickness);
        }

        // strikethroughs
        y1 = Math.trunc(y + extend.m_ascent / 2 - (refs.strike - 1) * lineThickness);

        for (let i = 0; i < refs.strike; ++i) {
          dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y1));
          y1 = Math.trunc(y1 + 2 * lineThickness);
        }

        // underlines
        y1 = Math.trunc(y - extend.m_descent - lineThickness);

        for (let i = 0; i < refs.underline; ++i) {
          dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y1));
          y1 = Math.trunc(y1 - 2 * lineThickness);
        }

        dc.ResetPen();
      }
      dc.ResetFont();
    }

    // Draw children (nothing yet)
    (this as unknown as ViewTabDrawSeam).DrawLayerChildren(dc, note, layer, staff, measure);

    dc.EndGraphic(note, this);
  }

  public DrawTabDurSym(dc: TabDeviceContextLike, element: ViewTabDurSymLike, layer: ViewObjectLike, staff: ViewTabStaffLike, measure: ViewObjectLike): void {
    if (!dc) throw new Error('View::DrawTabDurSym requires a device context.');
    if (!element) throw new Error('View::DrawTabDurSym requires an element.');
    if (!layer) throw new Error('View::DrawTabDurSym requires a layer.');
    if (!staff) throw new Error('View::DrawTabDurSym requires a staff.');

    const tabDurSym = element;

    const tabGrp = tabDurSym.GetFirstAncestor(ClassId.TABGRP) as ViewTabGrpLike | null;
    if (!tabGrp) throw new Error('View::DrawTabDurSym requires a tabGrp ancestor.');

    dc.StartGraphic(tabDurSym, '', tabDurSym.GetID());

    let x = element.GetDrawingX();
    let y = element.GetDrawingY();

    const glyphSize = staff.GetDrawingStaffNotationSize();

    const drawingDur = (tabGrp.GetDurGes() !== DURATION_NONE) ? tabGrp.GetActualDurGes() : tabGrp.GetActualDur();

    // For beam and guitar notation, stem are drawn through the child Stem
    if (!tabGrp.IsInBeam() && !staff.IsTabGuitar()) {
      let symc = 0;
      switch (drawingDur) {
        case DURATION_1: symc = SMUFL_EBA6_luteDurationDoubleWhole; break; // 1 back flag */
        case DURATION_2: symc = SMUFL_EBA7_luteDurationWhole; break; // 0 flags
        case DURATION_4: symc = SMUFL_EBA8_luteDurationHalf; break; // 1 flag
        case DURATION_8: symc = SMUFL_EBA9_luteDurationQuarter; break; // 2 flags
        case DURATION_16: symc = SMUFL_EBAA_luteDuration8th; break; // 3 flags
        case DURATION_32: symc = SMUFL_EBAB_luteDuration16th; break; // 4 flags
        case DURATION_64: symc = SMUFL_EBAC_luteDuration32nd; break; // 5 flags
        default: symc = SMUFL_EBA9_luteDurationQuarter; // 2 flags
      }

      (this as unknown as ViewTabDrawSeam).DrawSmuflCode(dc, x, y, symc, glyphSize, true);
    }

    if (tabGrp.HasDots()) {
      const stemDirFactor = (tabDurSym.GetDrawingStemDir() === STEMDIRECTION_down) ? -1 : 1;
      if (tabDurSym.GetDrawingStem()) {
        y = tabDurSym.GetDrawingStem()!.GetDrawingY();
      }

      let dotSize = 0;

      if (tabGrp.IsInBeam() || staff.IsTabGuitar()) {
        y = Math.trunc(y + (this.m_doc as DocTabLike).GetDrawingUnit(glyphSize) * 0.5 * stemDirFactor);
        x = Math.trunc(x + (this.m_doc as DocTabLike).GetDrawingUnit(glyphSize));
        dotSize = Math.trunc(glyphSize * 2 / 3);
      }
      else {
        // Vertical: the more flags the lower the dots
        let durOffset = (drawingDur > DURATION_2) ? drawingDur : DURATION_2;
        durOffset = (durOffset < DURATION_64) ? durOffset : DURATION_64;
        const durfactor = DURATION_64 - durOffset + 1;

        y = Math.trunc(y + (this.m_doc as DocTabLike).GetDrawingUnit(glyphSize) * stemDirFactor * durfactor * 2 / 5);

        // Horizontal: allow for font width
        x = Math.trunc(x + (this.m_doc as DocTabLike).GetGlyphWidth(SMUFL_EBA9_luteDurationQuarter, glyphSize, false) / 2);
        dotSize = Math.trunc(glyphSize * 9 / 10);
      }

      for (let i = 0; i < tabGrp.GetDots(); ++i) {
        (this as unknown as ViewTabDrawSeam).DrawDot(dc, x, y, dotSize);
        // HARDCODED
        x = Math.trunc(x + (this.m_doc as DocTabLike).GetDrawingUnit(glyphSize) * 0.75);
      }
    }

    // Draw children (stems) for beam or guitar notation
    if (tabGrp.IsInBeam() || staff.IsTabGuitar()) {
      (this as unknown as ViewTabDrawSeam).DrawLayerChildren(dc, tabDurSym, layer, staff, measure);
    }

    dc.EndGraphic(tabDurSym, this);
  }

  //----------------------------------------------------------------------------
  // View - Neume (src-cpp/src/view_neume.cpp)
  //----------------------------------------------------------------------------

  public DrawSyllable(dc: ViewNeumeDeviceContextLike, element: ViewNeumeLike, layer: unknown, staff: unknown, measure: unknown): void {
    if (!dc) throw new Error('View::DrawSyllable requires a device context.');
    if (!layer) throw new Error('View::DrawSyllable requires a layer.');
    if (!staff) throw new Error('View::DrawSyllable requires a staff.');
    if (!measure) throw new Error('View::DrawSyllable requires a measure.');

    // Start the Beam graphic and draw the children
    dc.StartGraphic(element, '', element.GetID());

    // Draw the children
    (this as unknown as ViewNeumeDrawSeam).DrawLayerChildren(dc, element, layer, staff, measure);

    dc.EndGraphic(element, this);
  }

  public DrawLiquescent(dc: ViewNeumeDeviceContextLike, element: ViewNeumeLike, layer: unknown, staff: unknown, measure: unknown): void {
    if (!dc) throw new Error('View::DrawLiquescent requires a device context.');
    if (!layer) throw new Error('View::DrawLiquescent requires a layer.');
    if (!staff) throw new Error('View::DrawLiquescent requires a staff.');
    if (!measure) throw new Error('View::DrawLiquescent requires a measure.');

    dc.StartGraphic(element, '', element.GetID());

    dc.EndGraphic(element, this);
  }

  public DrawNc(dc: ViewNeumeDeviceContextLike, element: ViewNcLike, layer: unknown, staff: ViewNeumeStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawNc requires a device context.');
    if (!layer) throw new Error('View::DrawNc requires a layer.');
    if (!staff) throw new Error('View::DrawNc requires a staff.');
    if (!measure) throw new Error('View::DrawNc requires a measure.');

    const nc = element;

    if ((this.m_options as unknown as ViewNeumeOptionsLike).m_neumeAsNote.GetValue()) {
      this.DrawNcAsNotehead(dc, nc, layer, staff, measure);
      return;
    }

    dc.StartGraphic(element, '', element.GetID());

    this.DrawNcGlyphs(dc, nc, staff);

    // Draw the children
    (this as unknown as ViewNeumeDrawSeam).DrawLayerChildren(dc, nc, layer, staff, measure);

    dc.EndGraphic(element, this);
  }

  public DrawNeume(dc: ViewNeumeDeviceContextLike, element: ViewNeumeObjLike, layer: unknown, staff: ViewNeumeStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawNeume requires a device context.');
    if (!layer) throw new Error('View::DrawNeume requires a layer.');
    if (!staff) throw new Error('View::DrawNeume requires a staff.');
    if (!measure) throw new Error('View::DrawNeume requires a measure.');

    // Start the Neume graphic and draw the children
    dc.StartGraphic(element, '', element.GetID());
    (this as unknown as ViewNeumeDrawSeam).DrawLayerChildren(dc, element, layer, staff, measure);

    if ((this.m_options as unknown as ViewNeumeOptionsLike).m_neumeAsNote.GetValue()) {
      const first = element.GetFirst(ClassId.NC) as ViewNeumeNcHeadLike | null;
      const last = element.GetLast(ClassId.NC) as ViewNeumeNcHeadLike | null;

      if (first !== last) {
        const unit = (this.m_doc as DocSlurLike).GetDrawingUnit(staff.m_drawingStaffSize);
        const lineWidth = Math.trunc((this.m_options as unknown as ViewNeumeOptionsLike).m_octaveLineThickness.GetValue() * unit);

        let x1 = first!.GetDrawingX();
        let x2 = last!.GetDrawingX();
        let y = staff.GetDrawingY();

        const pRef = { x: x1, y: y };
        this.CalcOffset(dc as never, pRef);
        x1 = pRef.x; y = pRef.y;
        const x2Ref = { value: x2 };
        this.CalcOffsetX(dc as never, x2Ref);
        x2 = x2Ref.value;

        const maxNcY = Math.max(first!.GetDrawingY(), last!.GetDrawingY());
        y = Math.max(y, maxNcY + unit);
        y += 2 * unit;

        x1 += Math.trunc(lineWidth / 2);
        x2 += Math.trunc(2 * last!.GetDrawingRadius(this.m_doc) - lineWidth / 2);

        dc.SetPenFull(lineWidth, PenStyle.PEN_SOLID, 0, LineCapStyle.LINECAP_BUTT, LineJoinStyle.LINEJOIN_MITER);

        dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y), this.ToDeviceContextX(x2), this.ToDeviceContextY(y));
        dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(Math.trunc(y + lineWidth / 2)), this.ToDeviceContextX(x1), this.ToDeviceContextY(y - unit));
        dc.DrawLine(this.ToDeviceContextX(x2), this.ToDeviceContextY(Math.trunc(y + lineWidth / 2)), this.ToDeviceContextX(x2), this.ToDeviceContextY(y - unit));

        dc.ResetPen();
      }
    }

    dc.EndGraphic(element, this);
  }

  public DrawNcAsNotehead(dc: ViewNeumeDeviceContextLike, nc: ViewNcLike, layer: unknown, staff: ViewNeumeStaffLike, measure: unknown): void {
    // Start the Neume graphic and draw the children
    dc.StartGraphic(nc, '', nc.GetID());

    const noteX = nc.GetDrawingX();
    const noteY = nc.GetDrawingY();

    let cueSize = false;
    if (nc.FindDescendantByType(ClassId.LIQUESCENT)) {
      cueSize = true;
    }

    (this as unknown as ViewNeumeDrawSeam).DrawSmuflCode(dc, noteX, noteY, SMUFL_E0A4_noteheadBlack, staff.m_drawingStaffSize, cueSize, true);

    dc.EndGraphic(nc, this);
  }

  public DrawDivLine(dc: ViewNeumeDeviceContextLike, element: ViewDivLineLike, layer: unknown, staff: ViewNeumeStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawDivLine requires a device context.');
    if (!element) throw new Error('View::DrawDivLine requires an element.');
    if (!layer) throw new Error('View::DrawDivLine requires a layer.');
    if (!staff) throw new Error('View::DrawDivLine requires a staff.');
    if (!measure) throw new Error('View::DrawDivLine requires a measure.');

    dc.StartGraphic(element, '', element.GetID());

    let sym = 0;

    switch (element.GetForm()) {
      case divLineLog_FORM_minima: sym = SMUFL_E8F3_chantDivisioMinima; break;
      case divLineLog_FORM_maior: sym = SMUFL_E8F4_chantDivisioMaior; break;
      case divLineLog_FORM_maxima: sym = SMUFL_E8F5_chantDivisioMaxima; break;
      case divLineLog_FORM_finalis: sym = SMUFL_E8F6_chantDivisioFinalis; break;
      case divLineLog_FORM_caesura: sym = SMUFL_E8F8_chantCaesura; break;
      case divLineLog_FORM_virgula: sym = SMUFL_E8F7_chantVirgula; break;
      default: break;
    }

    let x = element.GetDrawingX();
    let y = staff.GetDrawingY();

    const pRef = { x: x, y: y };
    this.CalcOffset(dc as never, pRef);
    x = pRef.x; y = pRef.y;

    y -= Math.trunc((this.m_doc as DocSlurLike).GetDrawingUnit(staff.m_drawingStaffSize) * 3);

    if (staff.HasDrawingRotation()) {
      y -= staff.GetDrawingRotationOffsetFor(x);
    }

    (this as unknown as ViewNeumeDrawSeam).DrawSmuflCode(dc, x, y, sym, staff.m_drawingStaffSize, false, true);

    dc.EndGraphic(element, this);
  }

  public DrawEpisema(dc: ViewNeumeDeviceContextLike, element: ViewEpisemaLike, layer: unknown, staff: ViewNeumeStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawEpisema requires a device context.');
    if (!layer) throw new Error('View::DrawEpisema requires a layer.');
    if (!staff) throw new Error('View::DrawEpisema requires a staff.');
    if (!measure) throw new Error('View::DrawEpisema requires a measure.');

    dc.StartGraphic(element, '', element.GetID());

    const nc = element.GetFirstAncestor(ClassId.NC) as ViewNcLike | null;
    if (nc) {
      let x = nc.GetDrawingX();
      let y = nc.GetDrawingY();

      if (nc.m_drawingGlyphs.length > 0) {
        x += Math.trunc((this.m_doc as DocTabLike).GetGlyphWidth(nc.m_drawingGlyphs[0].m_fontNo, staff.m_drawingStaffSize, false) / 2);
      }

      if (staff.HasDrawingRotation()) {
        y -= staff.GetDrawingRotationOffsetFor(x);
      }

      const pRef = { x: x, y: y };
      this.CalcOffset(dc as never, pRef);
      x = pRef.x; y = pRef.y;

      const unit = (this.m_doc as DocSlurLike).GetDrawingUnit(staff.m_drawingStaffSize);
      const above = (element.GetPlace() !== EVENTREL_below);
      // The SMuFL glyphs place their mark ~1 unit from the anchor (e.g. chantEpisema bar
      // is at +125 font units = +1 drawing unit above the anchor). This naturally lands
      // on the adjacent space when the anchor is on a line. When the anchor is on a space
      // the inherent +1 unit would land on the intermediate line instead, so shift the
      // anchor by 1 unit toward the target direction first.
      if (!staff.IsOnStaffLine(y, this.m_doc)) {
        y += above ? unit : -unit;
      }

      let sym = 0;
      if (element.GetForm() === episemaVis_FORM_h) {
        sym = SMUFL_E9D8_chantEpisema;
      }
      else {
        sym = above ? SMUFL_E9D0_chantIctusAbove : SMUFL_E9D1_chantIctusBelow;
      }

      (this as unknown as ViewNeumeDrawSeam).DrawSmuflCode(dc, x, y, sym, staff.m_drawingStaffSize, false, true);
    }

    dc.EndGraphic(element, this);
  }

  public DrawOriscus(dc: ViewNeumeDeviceContextLike, element: ViewNeumeLike, layer: unknown, staff: unknown, measure: unknown): void {
    if (!dc) throw new Error('View::DrawOriscus requires a device context.');
    if (!layer) throw new Error('View::DrawOriscus requires a layer.');
    if (!staff) throw new Error('View::DrawOriscus requires a staff.');
    if (!measure) throw new Error('View::DrawOriscus requires a measure.');

    dc.StartGraphic(element, '', element.GetID());

    dc.EndGraphic(element, this);
  }

  public DrawQuilisma(dc: ViewNeumeDeviceContextLike, element: ViewNeumeLike, layer: unknown, staff: unknown, measure: unknown): void {
    if (!dc) throw new Error('View::DrawQuilisma requires a device context.');
    if (!layer) throw new Error('View::DrawQuilisma requires a layer.');
    if (!staff) throw new Error('View::DrawQuilisma requires a staff.');
    if (!measure) throw new Error('View::DrawQuilisma requires a measure.');

    dc.StartGraphic(element, '', element.GetID());

    dc.EndGraphic(element, this);
  }

  public DrawStrophicus(dc: ViewNeumeDeviceContextLike, element: ViewNeumeLike, layer: unknown, staff: unknown, measure: unknown): void {
    if (!dc) throw new Error('View::DrawStrophicus requires a device context.');
    if (!layer) throw new Error('View::DrawStrophicus requires a layer.');
    if (!staff) throw new Error('View::DrawStrophicus requires a staff.');
    if (!measure) throw new Error('View::DrawStrophicus requires a measure.');

    dc.StartGraphic(element, '', element.GetID());

    dc.EndGraphic(element, this);
  }

  public DrawNcGlyphs(dc: ViewNeumeDeviceContextLike, nc: ViewNcLike, staff: ViewNeumeStaffLike): void {
    if (!dc) throw new Error('View::DrawNcGlyphs requires a device context.');
    if (!nc) throw new Error('View::DrawNcGlyphs requires an nc.');
    if (!staff) throw new Error('View::DrawNcGlyphs requires a staff.');

    const ncX = nc.GetDrawingX();
    let ncY = nc.GetDrawingY();

    if (staff.HasDrawingRotation()) {
      ncY -= staff.GetDrawingRotationOffsetFor(ncX);
    }

    for (const glyph of nc.m_drawingGlyphs) {
      (this as unknown as ViewNeumeDrawSeam).DrawSmuflCode(
        dc, ncX + glyph.m_xOffset, ncY + glyph.m_yOffset, glyph.m_fontNo, staff.m_drawingStaffSize, false, true);
    }
  }

  //----------------------------------------------------------------------------
  // View - Graph (src-cpp/src/view_graph.cpp)
  //----------------------------------------------------------------------------

  public DrawVerticalLine(dc: ViewGraphDeviceContextLike, y1: number, y2: number, x1: number, width: number, dashLength: number, gapLength: number): void {
    if (!dc) throw new Error('View::DrawVerticalLine requires a device context.');

    dc.SetPen(Math.max(1, this.ToDeviceContextX(width)), PenStyle.PEN_SOLID, dashLength, gapLength);

    dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x1), this.ToDeviceContextY(y2));

    dc.ResetPen();
    return;
  }

  public DrawHorizontalLine(dc: ViewGraphDeviceContextLike, x1: number, x2: number, y1: number, width: number, dashLength: number, gapLength: number): void {
    if (!dc) throw new Error('View::DrawHorizontalLine requires a device context.');

    dc.SetPen(Math.max(1, this.ToDeviceContextX(width)), PenStyle.PEN_SOLID, dashLength, gapLength);

    dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y1));

    dc.ResetPen();
    return;
  }

  public DrawObliqueLine(dc: ViewGraphDeviceContextLike, x1: number, x2: number, y1: number, y2: number, width: number, dashLength: number, gapLength: number): void {
    if (!dc) throw new Error('View::DrawObliqueLine requires a device context.');

    dc.SetPen(Math.max(1, this.ToDeviceContextX(width)), PenStyle.PEN_SOLID, dashLength, gapLength);

    dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y2));

    dc.ResetPen();
    return;
  }

  public DrawVerticalSegmentedLine(dc: ViewGraphDeviceContextLike, x1: number, line: SegmentedLine, width: number, dashLength: number, gapLength: number): void {
    for (let i = 0; i < line.GetSegmentCount(); ++i) {
      const [start, end] = line.GetStartEnd(i);
      this.DrawVerticalLine(dc, start, end, x1, width, dashLength, gapLength);
    }
  }

  public DrawHorizontalSegmentedLine(dc: ViewGraphDeviceContextLike, y1: number, line: SegmentedLine, width: number, dashLength: number, gapLength: number): void {
    for (let i = 0; i < line.GetSegmentCount(); ++i) {
      const [start, end] = line.GetStartEnd(i);
      this.DrawHorizontalLine(dc, start, end, y1, width, dashLength, gapLength);
    }
  }

  public DrawNotFilledEllipse(dc: ViewGraphDeviceContextLike, x1: number, y1In: number, x2: number, y2In: number, lineThickness: number): void {
    if (!dc) throw new Error('View::DrawNotFilledEllipse requires a device context.'); // DC cannot be NULL

    let y1 = y1In;
    let y2 = y2In;
    [y1, y2] = [y2, y1]; // std::swap(y1, y2)

    dc.SetPen(lineThickness, PenStyle.PEN_SOLID);
    dc.SetBrush(0.0);

    const width = x2 - x1;
    const height = y1 - y2;

    dc.DrawEllipse(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), width, height);

    dc.ResetPen();
    dc.ResetBrush();
  }

  public DrawNotFilledRectangle(dc: ViewGraphDeviceContextLike, x1: number, y1In: number, x2: number, y2In: number, lineThickness: number, radius = 0): void {
    if (!dc) throw new Error('View::DrawNotFilledRectangle requires a device context.'); // DC cannot be NULL

    let y1 = y1In;
    let y2 = y2In;
    [y1, y2] = [y2, y1]; // std::swap(y1, y2)

    const penWidth = lineThickness;
    dc.SetPen(penWidth, PenStyle.PEN_SOLID);
    dc.SetBrush(0.0);

    dc.DrawRoundedRectangle(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2 - x1), this.ToDeviceContextX(y1 - y2), radius);

    dc.ResetPen();
    dc.ResetBrush();

    return;
  }

  // Draw a filled rectangle with horizontal and vertical sides.
  public DrawFilledRectangle(dc: ViewGraphDeviceContextLike, x1: number, y1: number, x2: number, y2: number): void {
    if (!dc) throw new Error('View::DrawFilledRectangle requires a device context.');

    this.DrawFilledRoundedRectangle(dc, x1, y1, x2, y2, 0);

    return;
  }

  public DrawFilledRoundedRectangle(dc: ViewGraphDeviceContextLike, x1: number, y1In: number, x2: number, y2In: number, radius: number): void {
    if (!dc) throw new Error('View::DrawFilledRoundedRectangle requires a device context.');

    let y1 = y1In;
    let y2 = y2In;
    [y1, y2] = [y2, y1]; // std::swap(y1, y2)

    dc.SetPen(0, PenStyle.PEN_SOLID);

    dc.DrawRoundedRectangle(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2 - x1), this.ToDeviceContextX(y1 - y2), radius);

    dc.ResetPen();

    return;
  }

  // Draw an oblique quadrilateral: specifically, a parallelogram with vertical left
  // and right sides, and with opposite vertices at (x1,y1) and (x2,y2).
  public DrawObliquePolygon(dc: ViewGraphDeviceContextLike, x1: number, y1: number, x2: number, y2: number, heightIn: number): void {
    const p: Point[] = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];

    dc.SetPen(0, PenStyle.PEN_SOLID);

    const height = this.ToDeviceContextX(heightIn);
    p[0].x = this.ToDeviceContextX(x1);
    p[0].y = this.ToDeviceContextY(y1);
    p[1].x = this.ToDeviceContextX(x2);
    p[1].y = this.ToDeviceContextY(y2);
    p[2].x = p[1].x;
    p[2].y = p[1].y - height;
    p[3].x = p[0].x;
    p[3].y = p[0].y - height;

    dc.DrawPolygon(4, p);

    dc.ResetPen();
  }

  // Draw an empty ("void") diamond with its top lefthand point at (x1, y1).
  public DrawDiamond(dc: ViewGraphDeviceContextLike, x1: number, y1: number, height: number, width: number, fill: boolean, linewidth: number): void {
    const p: Point[] = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];

    dc.SetPen(linewidth, PenStyle.PEN_SOLID);
    if (fill) {
      dc.SetBrush(1.0);
    }
    else {
      dc.SetBrush(0.0);
    }

    const dHeight = this.ToDeviceContextX(height);
    const dWidth = this.ToDeviceContextX(width);
    p[0].x = this.ToDeviceContextX(x1);
    p[0].y = this.ToDeviceContextY(y1);
    p[1].x = this.ToDeviceContextX(x1 + Math.trunc(dWidth / 2));
    p[1].y = this.ToDeviceContextY(y1 + Math.trunc(dHeight / 2));
    p[2].x = p[0].x + dWidth;
    p[2].y = p[0].y;
    p[3].x = this.ToDeviceContextX(x1 + Math.trunc(dWidth / 2));
    p[3].y = this.ToDeviceContextY(y1 - Math.trunc(dHeight / 2));

    dc.DrawPolygon(4, p);

    dc.ResetPen();
    dc.ResetBrush();
  }

  public DrawDot(dc: ViewGraphDeviceContextLike, x: number, y: number, staffSize: number, dimin = false): void {
    let r = Math.max(Math.trunc(this.ToDeviceContextX((this.m_doc as DocGraphLike).GetDrawingDoubleUnit(staffSize) / 5)), 2); // C++ int r
    if (dimin) r = Math.trunc(r * (this.m_options as unknown as { m_graceFactor: { GetValue(): number } }).m_graceFactor.GetValue()); // C++ int r *= double

    dc.SetPen(0, PenStyle.PEN_SOLID);

    dc.DrawCircle(this.ToDeviceContextX(x), this.ToDeviceContextY(y), r);

    dc.ResetPen();
  }

  public DrawVerticalDots(dc: ViewGraphDeviceContextLike, x: number, line: SegmentedLine, barlineWidth: number, interval: number): void {
    if (line.GetSegmentCount() > 1) return;

    const [top, bottom] = line.GetStartEnd(0);
    const radius = Math.max(barlineWidth, 2);
    let drawingPosition = top - Math.trunc(interval / 2);

    dc.SetPen(0, PenStyle.PEN_SOLID);

    while (drawingPosition > bottom) {
      dc.DrawCircle(this.ToDeviceContextX(x), this.ToDeviceContextY(drawingPosition), radius);
      drawingPosition -= interval;
    }

    dc.ResetPen();
  }

  public DrawSquareBracket(dc: ViewGraphDeviceContextLike, leftBracket: boolean, x: number, y: number, height: number, width: number, horizontalThickness: number, verticalThickness: number): void {
    if (!dc) throw new Error('View::DrawSquareBracket requires a device context.');

    const sign = leftBracket ? 1 : -1;

    this.DrawFilledRectangle(dc, x, y - Math.trunc(horizontalThickness / 2), x + sign * verticalThickness, y + height + Math.trunc(horizontalThickness / 2)); // vertical
    this.DrawFilledRectangle(dc, x, y - Math.trunc(horizontalThickness / 2), x + sign * width, y + Math.trunc(horizontalThickness / 2)); // horizontal bottom
    this.DrawFilledRectangle(dc, x, y + height - Math.trunc(horizontalThickness / 2), x + sign * width, y + height + Math.trunc(horizontalThickness / 2)); // horizontal top
  }

  public DrawEnclosingBrackets(dc: ViewGraphDeviceContextLike, x: number, y: number, height: number, width: number, offset: number, bracketWidth: number, horizontalThickness: number, verticalThickness: number): void {
    if (!dc) throw new Error('View::DrawEnclosingBrackets requires a device context.');

    this.DrawSquareBracket(dc, true, x - offset, y - offset, height + 2 * offset, bracketWidth, horizontalThickness, verticalThickness);
    this.DrawSquareBracket(dc, false, x + width + offset, y - offset, height + 2 * offset, bracketWidth, horizontalThickness, verticalThickness);
  }

  public DrawSmuflCode(dc: ViewGraphDeviceContextLike, x: number, y: number, code: number, staffSize: number, dimin: boolean, setBBGlyph = false): void {
    if (!dc) throw new Error('View::DrawSmuflCode requires a device context.');

    if (code === 0) return;

    const str: number[] = [];
    str.push(code);

    dc.SetFont((this.m_doc as DocSlurLike).GetDrawingSmuflFont(staffSize, dimin));

    dc.DrawMusicText(str, this.ToDeviceContextX(x), this.ToDeviceContextY(y), setBBGlyph);

    dc.ResetFont();

    return;
  }

  public DrawSmuflLine(dc: ViewGraphDeviceContextLike, orig: Point, length: number, staffSize: number, dimin: boolean, fill: number, start: number, end: number): void {
    if (!dc) throw new Error('View::DrawSmuflLine requires a device context.');

    if (length <= 0) return;

    const startWidth = (start === 0) ? 0 : (this.m_doc as DocGraphLike).GetGlyphAdvX(start, staffSize, dimin);
    const endWidth = (end === 0) ? 0 : (this.m_doc as DocGraphLike).GetGlyphAdvX(end, staffSize, dimin);
    let fillWidth = (this.m_doc as DocGraphLike).GetGlyphAdvX(fill, staffSize, dimin);

    if (fillWidth === 0) fillWidth = (this.m_doc as DocGraphLike).GetGlyphWidth(fill, staffSize, dimin);

    // We add half a fill length for an average shorter / longer line result
    const count = Math.trunc((length + Math.trunc(fillWidth / 2) - startWidth - endWidth) / fillWidth);

    dc.SetFont((this.m_doc as DocSlurLike).GetDrawingSmuflFont(staffSize, dimin));

    const str: number[] = [];

    if (start !== 0) {
      str.push(start);
    }

    for (let i = 0; i < count; ++i) {
      str.push(fill);
    }

    if (end !== 0) {
      str.push(end);
    }

    dc.DrawMusicText(str, this.ToDeviceContextX(orig.x), this.ToDeviceContextY(orig.y), false);

    dc.ResetFont();
  }

  public DrawSmuflString(dc: ViewGraphDeviceContextLike, x: number, y: number, s: number[], alignment: number, staffSize: number, dimin = false, setBBGlyph = false): void {
    if (!dc) throw new Error('View::DrawSmuflString requires a device context.');

    let xDC = this.ToDeviceContextX(x);

    dc.SetFont((this.m_doc as DocSlurLike).GetDrawingSmuflFont(staffSize, dimin));

    if (alignment === HORIZONTALALIGNMENT_center) {
      const extend = new TextExtend();
      dc.GetSmuflTextExtent(s, extend);
      xDC -= Math.trunc(extend.m_width / 2);
    }
    else if (alignment === HORIZONTALALIGNMENT_right) {
      const extend = new TextExtend();
      dc.GetSmuflTextExtent(s, extend);
      xDC -= extend.m_width;
    }

    dc.DrawMusicText(s, xDC, this.ToDeviceContextY(y), setBBGlyph);

    dc.ResetFont();
  }

  public DrawSymbolDef(dc: ViewGraphDeviceContextLike, parent: unknown, symbolDef: ViewSymbolDefLike, x: number, y: number, staffSize: number, dimin: boolean, alignment: number): void {
    if (!dc) throw new Error('View::DrawSymbolDef requires a device context.');
    if (!symbolDef) throw new Error('View::DrawSymbolDef requires a symbolDef.');

    const params = { m_x: x, m_y: y, m_width: 0, m_height: 0, m_laidOut: false, m_explicitPosition: false, m_verticalShift: false, m_alignment: 0, m_pointSize: 0, m_staffSize: 100, m_actualWidth: 0, m_enclose: 0, m_textEnclose: 0 } as TabTextParamsLike;

    // Because image y coordinates are inverted we need to adjust the y position
    params.m_y += symbolDef.GetSymbolHeight(this.m_doc, staffSize, dimin);

    if (alignment !== HORIZONTALALIGNMENT_left) {
      const width = symbolDef.GetSymbolWidth(this.m_doc, staffSize, dimin);
      params.m_x -= (alignment === HORIZONTALALIGNMENT_center) ? Math.trunc(width / 2) : width;
    }

    // Because the Svg is a child of symbolDef we need to temporarily change the parent for the bounding boxes
    // to be properly propagated in the device context
    symbolDef.SetTemporaryParent(parent as never);

    for (const current of symbolDef.GetChildren()) {
      if (current.Is(ClassId.GRAPHIC)) {
        const graphic = current as unknown as ViewGraphicLike;
        (this as unknown as ViewGraphDrawSeam).DrawGraphic(dc, graphic, params, staffSize, dimin);
      }
      if (current.Is(ClassId.SVG)) {
        const svg = current as unknown as ViewSvgLike;
        (this as unknown as ViewGraphDrawSeam).DrawSvg(dc, svg, params, staffSize, dimin);
      }
    }

    symbolDef.ResetTemporaryParent();
  }

  //----------------------------------------------------------------------------
  // View - Beam (src-cpp/src/view_beam.cpp)
  //----------------------------------------------------------------------------

  public DrawBeam(dc: ViewGraphDeviceContextLike, element: ViewBeamLike, layer: unknown, staff: unknown, measure: unknown): void {
    if (!dc) throw new Error('View::DrawBeam requires a device context.');
    if (!layer) throw new Error('View::DrawBeam requires a layer.');
    if (!staff) throw new Error('View::DrawBeam requires a staff.');
    if (!measure) throw new Error('View::DrawBeam requires a measure.');

    const beam = element;

    // initialization

    // Should we assert this at the beginning?
    if (beam.HasEmptyList()) {
      return;
    }

    if (beam.GetFirst(ClassId.FTREM)) {
      // If there is a fTrem we ignore the beam and just handle its children
      dc.StartGraphic(element, '', beam.GetID());
      (this as unknown as ViewBeamDrawSeam).DrawLayerChildren(dc, beam, layer, staff, measure);
      dc.EndGraphic(element, this);
      return;
    }

    beam.m_beamSegment.InitCoordRefs(beam.GetElementCoords());

    const initialPlace = beam.GetPlace();
    if (beam.HasStemSameasBeam()) beam.m_beamSegment.InitSameasRoles(beam.GetStemSameasBeam(), initialPlace);

    // Calculate the beam slope and position

    if (!beam.m_beamSegment.StemSameasIsSecondary()) {
      beam.m_beamSegment.CalcBeam(layer, beam.m_beamStaff, this.m_doc, beam, initialPlace);
    }

    // Start the Beam graphic and draw the children

    dc.StartGraphic(element, '', beam.GetID());

    // Draw the children

    (this as unknown as ViewBeamDrawSeam).DrawLayerChildren(dc, beam, layer, staff, measure);

    // Draw the beamSegment - but not if it is a secondary beam in a stem.sameas

    if (!beam.m_beamSegment.StemSameasIsSecondary())
      this.DrawBeamSegment(dc, beam.m_beamSegment, beam as unknown as ViewBeamInterfaceLike, layer, staff as ViewBeamStaffLike);

    dc.EndGraphic(element, this);
  }

  public DrawFTrem(dc: ViewGraphDeviceContextLike, element: ViewFTremLike, layer: unknown, staff: ViewBeamStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawFTrem requires a device context.');
    if (!element) throw new Error('View::DrawFTrem requires an element.');
    if (!layer) throw new Error('View::DrawFTrem requires a layer.');
    if (!staff) throw new Error('View::DrawFTrem requires a staff.');
    if (!measure) throw new Error('View::DrawFTrem requires a measure.');

    const fTrem = element;

    // initialization

    // Should we assert this at the beginning?
    if (fTrem.HasEmptyList()) {
      return;
    }
    const beamElementCoords = fTrem.GetElementCoords();

    if (beamElementCoords.length !== 2) {
      LogError('View draw: <fTrem> element has invalid number of descendants.');
      return;
    }

    // Calculate the beam slope and position

    fTrem.m_beamSegment.CalcBeam(layer, fTrem.m_beamStaff, this.m_doc, fTrem);

    // Start the graphic

    dc.StartGraphic(element, '', fTrem.GetID());

    // Draw the children

    (this as unknown as ViewBeamDrawSeam).DrawLayerChildren(dc, fTrem, layer, staff, measure);

    // Draw the stems and the bars

    this.DrawFTremSegment(dc, staff, fTrem);

    dc.EndGraphic(element, this);
  }

  public DrawFTremSegment(dc: ViewGraphDeviceContextLike, staff: ViewBeamStaffLike, fTrem: ViewFTremLike): void {
    if (!dc) throw new Error('View::DrawFTremSegment requires a device context.');
    if (!staff) throw new Error('View::DrawFTremSegment requires a staff.');
    if (!fTrem) throw new Error('View::DrawFTremSegment requires an fTrem.');

    const beamElementCoords = fTrem.GetElementCoords();

    const firstElement = beamElementCoords[0];
    const secondElement = beamElementCoords[1];

    // We look only at the first one for the duration since both are expected to be the same
    const durationElement = firstElement.m_element as ViewBeamLayerElementLike | null;
    if (!durationElement || !durationElement.GetDur) return;
    const dur = durationElement.GetDur();

    if (dur > DURATION_1) {
      // Adjust the x position of the first and last element for taking into account the stem width
      firstElement.m_x -= Math.trunc((this.m_doc as ViewBeamDocLike).GetDrawingStemWidth(staff.m_drawingStaffSize) / 2);
      secondElement.m_x += Math.trunc((this.m_doc as ViewBeamDocLike).GetDrawingStemWidth(staff.m_drawingStaffSize) / 2);
    }

    // Number of beams to draw
    const allBars = fTrem.HasBeams() ? fTrem.GetBeams() : fTrem.GetUnitdur() - DURATION_4;
    let floatingBars = fTrem.HasBeamsFloat() ? fTrem.GetBeamsFloat() : 0;
    let fullBars = allBars - floatingBars;

    // Set initial coordinates for the beam
    // C++ int locals: truncate every double accumulation (slope products).
    let y1 = Math.trunc(firstElement.m_yBeam);
    let y2 = Math.trunc(secondElement.m_yBeam);

    let x1 = Math.trunc(firstElement.m_x);
    let x2 = Math.trunc(secondElement.m_x);

    // Shift direction
    const shiftY = (fTrem.m_drawingPlace === BEAMPLACE_below) ? 1.0 : -1.0;
    const dy1 = shiftY;
    const dy2 = shiftY;

    const space = (this.m_doc as ViewBeamDocLike).GetDrawingBeamWidth(staff.m_drawingStaffSize, fTrem.m_cueSize);
    // for non-stem notes the bar should be shortened
    if (dur < DURATION_2) {
      if (fTrem.m_drawingPlace === BEAMPLACE_below) x1 += 2 * space;
      y1 = Math.trunc(y1 + 2 * space * fTrem.m_beamSegment.m_beamSlope);
      if (fTrem.m_drawingPlace === BEAMPLACE_above) x2 -= 2 * space;
      y2 = Math.trunc(y2 - 2 * space * fTrem.m_beamSegment.m_beamSlope);
      // floating bars make no sense here
      fullBars = allBars;
      floatingBars = 0;
    }
    else if ((dur > DURATION_2) && !floatingBars) {
      fullBars = dur - 4;
      floatingBars = allBars - fullBars;
    }

    const polygonHeight = Math.trunc(fTrem.m_beamWidthBlack * shiftY);
    for (let j = 0; j < fullBars; ++j) {
      this.DrawObliquePolygon(dc, x1, y1, x2, y2, polygonHeight);
      y1 += polygonHeight;
      y2 += polygonHeight;
      y1 += Math.trunc(dy1 * fTrem.m_beamWidthWhite);
      y2 += Math.trunc(dy2 * fTrem.m_beamWidthWhite);
    }

    // If we have no full bar but only floating bars, then move it inside
    if (fullBars === 0) {
      y1 += Math.floor(dy1 * fTrem.m_beamWidthWhite / 2);
      y2 += Math.floor(dy2 * fTrem.m_beamWidthWhite / 2);
    }

    // shorten the bar after having drawn the first one (but the first one)
    x1 += space;
    y1 = Math.trunc(y1 + space * fTrem.m_beamSegment.m_beamSlope);
    x2 -= space;
    y2 = Math.trunc(y2 - space * fTrem.m_beamSegment.m_beamSlope);

    for (let j = 0; j < floatingBars; ++j) {
      this.DrawObliquePolygon(dc, x1, y1, x2, y2, polygonHeight);
      y1 += polygonHeight;
      y2 += polygonHeight;
      y1 += Math.trunc(dy1 * fTrem.m_beamWidthWhite);
      y2 += Math.trunc(dy2 * fTrem.m_beamWidthWhite);
    }
  }

  public DrawBeamSegment(dc: ViewGraphDeviceContextLike, beamSegment: ViewBeamSegmentLike, beamInterface: ViewBeamInterfaceLike, layer: unknown, staff: ViewBeamStaffLike): void {
    if (!dc) throw new Error('View::DrawBeamSegment requires a device context.');
    if (!beamSegment) throw new Error('View::DrawBeamSegment requires a beamSegment.');
    if (!beamInterface) throw new Error('View::DrawBeamSegment requires a beamInterface.');
    if (!layer) throw new Error('View::DrawBeamSegment requires a layer.');
    if (!staff) throw new Error('View::DrawBeamSegment requires a staff.');

    // temporary coordinates
    let x1: number, x2: number, y1: number, y2: number;

    // temporary variables
    let shiftY: number;

    // loops
    let i: number;

    const beamElementCoords = beamSegment.GetElementCoordRefs();

    const elementCount = beamElementCoords.length;
    const last = elementCount - 1;

    // Draw the beam full bar

    // Adjust the x position of the first and last element for taking into account the stem width
    beamElementCoords[0].m_x -= Math.trunc((this.m_doc as ViewBeamDocLike).GetDrawingStemWidth(staff.m_drawingStaffSize) / 2);
    beamElementCoords[last].m_x += Math.trunc((this.m_doc as ViewBeamDocLike).GetDrawingStemWidth(staff.m_drawingStaffSize) / 2);

    // Shift direction
    shiftY = (beamInterface.m_drawingPlace === BEAMPLACE_below) ? 1.0 : -1.0;

    y1 = beamElementCoords[0].m_yBeam;
    y2 = beamElementCoords[last].m_yBeam;

    x1 = beamElementCoords[0].m_x;
    x2 = beamElementCoords[last].m_x;

    // For acc and rit beam (see AttBeamingVis set
    // s_y = 0 and s_y2 = 0 respectively

    const polygonHeight = Math.trunc(beamInterface.m_beamWidthBlack * shiftY);
    this.DrawObliquePolygon(dc, x1, y1, x2, y2, polygonHeight);

    // Draw the beam for partial bars (if any)

    // Map the indexes of the notes/chords since we need to ignore rests when drawing partials
    // However, exception for the first and last element of a beam
    const noteIndexes: number[] = [];
    for (i = 0; i < elementCount; ++i) {
      if (beamElementCoords[i].m_element?.Is(ClassId.REST))
        if (i > 0 && i < elementCount - 1) continue;
      noteIndexes.push(i);
    }
    const noteCount = noteIndexes.length;

    let durRef = DURATION_8;
    let durRef2 = DURATION_16;

    if (staff.IsTabLuteFrench() || staff.IsTabLuteGerman() || staff.IsTabLuteItalian() || staff.IsTabStaffLike()) {
      durRef = DURATION_4;
      durRef2 = DURATION_8;
    }

    let barY = 0;

    if (noteCount > 0) {
      let testDur = durRef2;

      const fractBeamWidth = (this.m_doc as ViewBeamDocLike).GetGlyphWidth(
        SMUFL_E0A4_noteheadBlack, beamInterface.m_fractionSize, beamInterface.m_cueSize);

      // loop
      while (testDur <= beamInterface.m_shortestDur) {
        // true at the beginning of a beam or after a breakSec
        let start = true;

        let idx = 0;
        barY += beamInterface.m_beamWidth;

        // all but the last one
        for (i = 0; i < noteCount - 1; ++i) {
          idx = noteIndexes[i];
          const nextIdx = noteIndexes[i + 1];

          const breakSec = !!((beamElementCoords[idx].m_breaksec)
            && (testDur - durRef >= beamElementCoords[idx].m_breaksec));
          beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_NONE;
          // partial is needed
          if (beamElementCoords[idx].m_dur >= testDur) {
            // and for the next one too, but no break - through
            if ((beamElementCoords[nextIdx].m_dur >= testDur) && !breakSec) {
              beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_THROUGH;
            }
            // not needed for the next one or break
            else {
              // we are starting a beam or after a beam break - put it right
              if (start) {
                if ((idx !== 0) && (beamElementCoords[idx - 1].m_element?.Is(ClassId.REST))) {
                  beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_LEFT;
                }
                else {
                  beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_RIGHT;
                }
              }
              // or the previous one had no partial
              else if (beamElementCoords[noteIndexes[i - 1]].m_dur < testDur) {
                // if we are at the full bar level, put it left
                if (testDur === durRef2) {
                  beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_LEFT;
                }
                // if the previous level underneath was a partial through, put it left
                else if (beamElementCoords[noteIndexes[i - 1]].m_partialFlags[testDur - 1 - durRef] === PARTIAL_THROUGH) {
                  beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_LEFT;
                }
                // if the level underneath was not left (right or through), put it right
                else if (beamElementCoords[idx].m_partialFlags[testDur - 1 - durRef] !== PARTIAL_LEFT) {
                  beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_RIGHT;
                }
                // it was put left before, put it left
                else {
                  beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_LEFT;
                }
              }
            }
          }
          // we are not in a group
          start = breakSec;
        }
        // last one
        idx = noteIndexes[noteCount - 1];
        beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_NONE;
        // partial is needed
        if ((beamElementCoords[idx].m_dur >= testDur)) {
          // and the previous one had no partial - put it left
          if ((noteCount === 1) || (beamElementCoords[noteIndexes[i - 1]].m_dur < testDur)
            || start) {
            beamElementCoords[idx].m_partialFlags[testDur - durRef] = PARTIAL_LEFT;
          }
        }

        // draw them
        for (i = 0; i < noteCount; ++i) {
          let barYPos = 0;
          idx = noteIndexes[i];
          if (BEAMPLACE_mixed === beamInterface.m_drawingPlace) {
            let elemIndex = idx;
            if (BEAMPLACE_NONE === beamElementCoords[idx].m_partialFlagPlace) {
              if ((0 === i) || ((noteCount - 1) === i)
                || (beamElementCoords[noteIndexes[i - 1]].m_partialFlagPlace
                  !== beamElementCoords[noteIndexes[i + 1]].m_partialFlagPlace)) {
                continue;
              }
              elemIndex = i - 1;
            }
            barYPos = barY * ((BEAMPLACE_above === beamElementCoords[elemIndex].m_partialFlagPlace) ? 1 : -1);
          }
          else {
            barYPos = Math.trunc(shiftY * barY);
          }
          if (beamElementCoords[idx].m_partialFlags[testDur - durRef] === PARTIAL_THROUGH) {
            // through should never be set on the last one
            if (i >= noteCount - 1) continue; // assert for debug and skip otherwise
            y1 = beamElementCoords[idx].m_yBeam + barYPos;
            y2 = beamElementCoords[noteIndexes[i + 1]].m_yBeam + barYPos;
            this.DrawObliquePolygon(dc, beamElementCoords[idx].m_x, y1,
              beamElementCoords[noteIndexes[i + 1]].m_x, y2, polygonHeight);
          }
          else if (beamElementCoords[idx].m_partialFlags[testDur - durRef] === PARTIAL_RIGHT) {
            y1 = beamElementCoords[idx].m_yBeam + barYPos;
            const x2r = beamElementCoords[idx].m_x + fractBeamWidth;
            // C++ y1/y2 are int: the slope interpolation narrows on assignment.
            y2 = Math.trunc(beamSegment.m_firstNoteOrChord!.m_yBeam + barYPos
              + beamSegment.m_beamSlope * (x2r - beamSegment.m_firstNoteOrChord!.m_x));
            this.DrawObliquePolygon(dc, beamElementCoords[idx].m_x, y1, x2r, y2, polygonHeight);
          }
          else if (beamElementCoords[idx].m_partialFlags[testDur - durRef] === PARTIAL_LEFT) {
            y2 = beamElementCoords[idx].m_yBeam + barYPos;
            const x1l = beamElementCoords[idx].m_x - fractBeamWidth;
            // C++ y1/y2 are int: the slope interpolation narrows on assignment.
            y1 = Math.trunc(beamSegment.m_firstNoteOrChord!.m_yBeam + barYPos
              + beamSegment.m_beamSlope * (x1l - beamSegment.m_firstNoteOrChord!.m_x));
            this.DrawObliquePolygon(dc, x1l, y1, beamElementCoords[idx].m_x, y2, polygonHeight);
          }
        }

        testDur += 1;

      } // end of while
    } // end of drawing partial bars
  }

  public DrawBeamSpan(dc: ViewGraphDeviceContextLike, beamSpan: ViewBeamSpanLike, system: unknown, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawBeamSpan requires a device context.');
    if (!beamSpan) throw new Error('View::DrawBeamSpan requires a beamSpan.');
    if (!system) throw new Error('View::DrawBeamSpan requires a system.');

    // Draw segments for the beamSpan
    if (graphic) {
      dc.ResumeGraphic(graphic, (graphic as { GetID(): string }).GetID());
    }
    else {
      dc.StartGraphic(beamSpan, '', beamSpan.GetID(), GraphicID.SPANNING);
    }

    const segment = beamSpan.GetSegmentForSystem(system);
    if (segment) {
      // Reset current segment and set coordinates based on stored begin/end iterators for the ElementCoords
      segment.Reset();

      // C++ view_beam.cpp:449-451 reads begin/end from the segment, not the span.
      const coordsFirst = beamSpan.m_beamElementCoords.indexOf(segment.GetBeginCoord());
      const coordsLast = beamSpan.m_beamElementCoords.indexOf(segment.GetEndCoord());

      if ((coordsFirst !== -1) && (coordsLast !== -1)) {
        const coord = beamSpan.m_beamElementCoords.slice(coordsFirst, coordsLast + 1);
        segment.InitCoordRefs(coord);
        segment.CalcBeam(segment.GetLayer(), segment.GetStaff(), this.m_doc, beamSpan, beamSpan.m_drawingPlace);
        segment.AppendSpanningCoordinates(segment.GetMeasure());

        // Draw corresponding beam segment
        this.DrawBeamSegment(dc, segment, beamSpan as unknown as ViewBeamInterfaceLike, segment.GetLayer(), segment.GetStaff());
      }
    }

    if (graphic) {
      dc.EndResumedGraphic(graphic, this);
    }
    else {
      dc.EndGraphic(beamSpan, this);
    }
  }

  //----------------------------------------------------------------------------
  // View - TextElement (src-cpp/src/view_text.cpp)
  //----------------------------------------------------------------------------

  public DrawF(dc: ViewTextDeviceContextLike, f: ViewTextFLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawF requires a device context.');
    if (!f) throw new Error('View::DrawF requires an F element.');

    dc.StartTextGraphic(f, '', f.GetID());

    (this as unknown as ViewTextDrawSeam).DrawTextChildren(dc, f, params);

    if (f.GetStart && f.GetEnd && f.GetStart() && f.GetEnd()) {
      const currentSystem = f.GetFirstAncestor?.(ClassId.SYSTEM) as ViewTextSystemLike | null;
      // Postpone the drawing of the end of the system; this will call DrawFConnector
      if (currentSystem) {
        currentSystem.AddToDrawingList?.(f);
      }
    }

    dc.EndTextGraphic(f, this);
  }

  public DrawTextString(dc: ViewTextDeviceContextLike, str: number[], params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawTextString requires a device context.');

    dc.DrawText(UTF32to8(str), str);
  }

  public DrawDirString(dc: ViewTextDeviceContextLike, str: number[], params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawDirString requires a device context.');
    if (!dc.HasFont()) throw new Error('View::DrawDirString requires a font.');

    const convertedStr = [...str];
    // If the current font is a music font, we want to convert Music Unicode glyph to SMuFL
    if (dc.GetFont().GetSmuflFont()) {
      for (let i = 0; i < str.length; ++i) {
        convertedStr[i] = Resources.GetSmuflGlyphForUnicodeChar(str[i]);
      }
    }
    this.DrawTextString(dc, convertedStr, params);
  }

  public DrawDynamString(dc: ViewTextDeviceContextLike, str: number[], params: TextDrawingParams, rend: ViewTextRendLike | null): void {
    if (!dc) throw new Error('View::DrawDynamString requires a device context.');
    if (!dc.HasFont()) throw new Error('View::DrawDynamString requires a font.');

    const singleGlyphs = (this.m_doc as ViewTextDocLike).GetOptions().m_dynamSingleGlyphs!.GetValue();

    if (rend && rend.HasFontfam && rend.HasFontfam()) {
      this.DrawTextString(dc, str, params);
      return;
    }

    if (params.m_textEnclose !== ENCLOSURE_NONE) {
      const open: number[] = [];
      switch (params.m_textEnclose) {
        case ENCLOSURE_paren: open.push('('.codePointAt(0)!); break;
        case ENCLOSURE_brack: open.push('['.codePointAt(0)!); break;
        default: break;
      }
      this.DrawTextString(dc, open, params);
    }

    const tokens: ArrayOfStringDynamTypePairs = [];
    if (Dynam.GetSymbolsInStr(UTF32to8(str), tokens)) {
      let first = true;
      for (const token of tokens) {
        if (!first) {
          // this->DrawTextString(dc, U" ", params);
        }
        first = false;

        if (token[1]) {
          const smuflStr = UTF8to32(Dynam.GetSymbolStr(token[0], singleGlyphs));
          const vrvTxt = new FontInfo();
          vrvTxt.SetPointSize(Math.trunc(dc.GetFont().GetPointSize() * (this.m_doc as ViewTextDocLike).GetMusicToLyricFontSizeRatio()));
          vrvTxt.SetFaceName((this.m_doc as ViewTextDocLike).GetResources().GetCurrentFont());
          const isFallbackNeeded = (this.m_doc as ViewTextDocLike).GetResources().IsSmuflFallbackNeeded(UTF32to8(smuflStr));
          vrvTxt.SetSmuflWithFallback(isFallbackNeeded);
          vrvTxt.SetStyle(FONTSTYLE_normal as FontStyle);
          vrvTxt.SetLetterSpacing(90);
          dc.SetFont(vrvTxt);
          this.DrawTextString(dc, smuflStr, params);
          dc.ResetFont();
        }
        else {
          this.DrawTextString(dc, UTF8to32(token[0]), params);
        }
      }
    }
    else {
      this.DrawTextString(dc, str, params);
    }

    if (params.m_textEnclose !== ENCLOSURE_NONE) {
      const close: number[] = [];
      switch (params.m_textEnclose) {
        case ENCLOSURE_paren: close.push(')'.codePointAt(0)!); break;
        case ENCLOSURE_brack: close.push(']'.codePointAt(0)!); break;
        default: break;
      }
      this.DrawTextString(dc, close, params);
    }
  }

  public DrawHarmString(dc: ViewTextDeviceContextLike, str: number[], params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawHarmString requires a device context.');
    if (!dc.HasFont()) throw new Error('View::DrawHarmString requires a font.');

    const VRV_TEXT_HARM_CODES = [0x266D, 0x266E, 0x266F, 0xE260, 0xE261, 0xE262, 0xE263, 0xE264,
      0xEA50, 0xEA51, 0xEA52, 0xEA53, 0xEA54, 0xEA55, 0xEA56, 0xEA57, 0xEA58, 0xEA59, 0xEA5A, 0xEA5B, 0xEA5C, 0xEA5D, 0xEA5E,
      0xEA5F, 0xEA60, 0xEA61, 0xEA62, 0xEA63, 0xEA64, 0xEA65, 0xEA66, 0xEA67, 0xECC0];

    let prevPos = 0;
    let pos: number;
    while ((pos = str.findIndex((c, k) => k >= prevPos && VRV_TEXT_HARM_CODES.includes(c))) !== -1) {
      // If pos is > than the previous, it is the substring to extract
      if (pos > prevPos) {
        const substr = str.slice(prevPos, pos);
        dc.DrawText(UTF32to8(substr), substr);
      }

      // if it is the same or we still have space, it is the accidental
      if (pos === prevPos || pos < str.length) {
        // Then the accidental
        const accid = str.slice(pos, pos + 1);
        const smuflAccid: number[] = [];
        if (accid[0] === 0x266D || accid[0] === 0xE260) { // MUSIC or SMUFL FLAT SIGN
          smuflAccid.push(SMUFL_EA64_figbassFlat);
        }
        else if (accid[0] === 0x266E || accid[0] === 0xE261) { // MUSIC or SMUFL NATURAL SIGN
          smuflAccid.push(SMUFL_EA65_figbassNatural);
        }
        else if (accid[0] === 0x266F || accid[0] === 0xE262) { // MUSIC or SMUFL SHARP SIGN
          smuflAccid.push(SMUFL_EA66_figbassSharp);
        }
        else if (accid[0] === 0xE264) { // SMUFL DOUBLE FLAT SIGN
          smuflAccid.push(SMUFL_EA63_figbassDoubleFlat);
        }
        else if (accid[0] === 0xE263) { // SMUFL DOUBLE SHARP SIGN
          smuflAccid.push(SMUFL_EA67_figbassDoubleSharp);
        }
        else {
          smuflAccid.push(accid[0]);
        }

        const vrvTxt = new FontInfo();
        vrvTxt.SetPointSize(Math.trunc(dc.GetFont().GetPointSize() * (this.m_doc as ViewTextDocLike).GetMusicToLyricFontSizeRatio()));
        vrvTxt.SetFaceName((this.m_doc as ViewTextDocLike).GetResources().GetCurrentFont());
        const isFallbackNeeded = (this.m_doc as ViewTextDocLike).GetResources().IsSmuflFallbackNeeded(UTF32to8(smuflAccid));
        vrvTxt.SetSmuflWithFallback(isFallbackNeeded);
        dc.SetFont(vrvTxt);
        dc.DrawText(UTF32to8(smuflAccid), smuflAccid);
        dc.ResetFont();
      }
      // Skip the accidental and continue
      prevPos = pos + 1;
    }
    // Print the remainder of the string, or the full string if no accid
    if (prevPos < str.length) {
      const substr = str.slice(prevPos);
      dc.DrawText(UTF32to8(substr), substr);
    }

    // Continue subsequent harmony children in the current text run.
    params.m_x = VRV_UNSET;
  }

  public DrawTextElement(dc: ViewTextDeviceContextLike, element: ViewTextElementLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawTextElement requires a device context.');
    if (!element) throw new Error('View::DrawTextElement requires an element.');

    if (element.Is(ClassId.FIGURE)) {
      this.DrawF(dc, element as unknown as ViewTextFLike, params);
    }
    else if (element.Is(ClassId.LB)) {
      (this as unknown as ViewTextDrawSeam).DrawLb(dc, element as unknown as ViewTextLbLike, params);
    }
    else if (element.Is(ClassId.NUM)) {
      (this as unknown as ViewTextDrawSeam).DrawNum(dc, element as unknown as ViewTextNumLike, params);
    }
    else if (element.Is(ClassId.REND)) {
      (this as unknown as ViewTextDrawSeam).DrawRend(dc, element as unknown as ViewTextRendLike, params);
    }
    else if (element.Is(ClassId.SYMBOL)) {
      (this as unknown as ViewTextDrawSeam).DrawSymbol(dc, element as unknown as ViewTextSymbolLike, params);
    }
    else if (element.Is(ClassId.TEXT)) {
      (this as unknown as ViewTextDrawSeam).DrawText(dc, element as unknown as ViewTextTextLike, params);
    }
    else {
      throw new Error('View::DrawTextElement received an unsupported text element.');
    }
  }

  public DrawLyricString(dc: ViewTextDeviceContextLike, str: number[], staffSize: number, params?: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawLyricString requires a device context.');
    if (!dc.HasFont()) throw new Error('View::DrawLyricString requires a font.');

    let wroteText = false;
    let syl: number[] = [];
    let lyricStr = [...str];

    const dcX = params ? this.ToDeviceContextX(params.m_x) : VRV_UNSET;
    const dcY = params ? this.ToDeviceContextY(params.m_y) : VRV_UNSET;
    const width = params ? params.m_width : VRV_UNSET;
    const height = params ? params.m_height : VRV_UNSET;

    if ((this.m_doc as ViewTextDocLike).GetOptions().m_lyricElision!.GetValue() === ELISION_unicode) {
      lyricStr = lyricStr.map((c) => (c === '_'.codePointAt(0) ? UNICODE_UNDERTIE_CP : c));
      dc.DrawText(UTF32to8(lyricStr), lyricStr, dcX, dcY, width, height);
    }
    else {
      while (!codePointsEqual(lyricStr, syl)) {
        wroteText = true;
        const index = lyricStr.findIndex((c) => c === '_'.codePointAt(0));
        syl = index === -1 ? [...lyricStr] : lyricStr.slice(0, index);
        dc.DrawText(UTF32to8(syl), syl, dcX, dcY, width, height);

        // no _
        if (index === -1) break;

        const vrvTxt = new FontInfo();
        vrvTxt.SetPointSize(Math.trunc(dc.GetFont().GetPointSize() * (this.m_doc as ViewTextDocLike).GetMusicToLyricFontSizeRatio()));
        vrvTxt.SetFaceName((this.m_doc as ViewTextDocLike).GetResources().GetCurrentFont());
        const elision: number[] = [(this.m_doc as ViewTextDocLike).GetOptions().m_lyricElision!.GetValue()];
        const isFallbackNeeded = (this.m_doc as ViewTextDocLike).GetResources().IsSmuflFallbackNeeded(UTF32to8(elision));
        vrvTxt.SetSmuflWithFallback(isFallbackNeeded);
        dc.SetFont(vrvTxt);
        dc.DrawText(UTF32to8(elision), elision, dcX, dcY, width, height);
        dc.ResetFont();

        // next syllable
        syl = [];
        lyricStr = lyricStr.slice(index + 1);
      }
    }

    // This should only be called in facsimile mode where a zone is specified but there is
    // no text. This draws the bounds of the zone but leaves the space blank.
    if (!wroteText && params) {
      dc.DrawText('', [], this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), params.m_width, params.m_height);
    }
  }

  public DrawLb(dc: ViewTextDeviceContextLike, lb: ViewTextLbLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawLb requires a device context.');
    if (!dc.HasFont()) throw new Error('View::DrawLb requires a font.');
    if (!lb) throw new Error('View::DrawLb requires an Lb element.');

    dc.StartTextGraphic(lb, '', lb.GetID());

    const currentFont = dc.GetFont();

    params.m_y -= (this.m_doc as ViewTextDocLike).GetTextLineHeight(currentFont, false);
    params.m_explicitPosition = true;

    dc.EndTextGraphic(lb, this);
  }

  public DrawNum(dc: ViewTextDeviceContextLike, num: ViewTextNumLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawNum requires a device context.');
    if (!num) throw new Error('View::DrawNum requires a Num element.');

    dc.StartTextGraphic(num, '', num.GetID());

    const currentText = num.GetCurrentText();
    if (currentText && currentText.GetText().length > 0) {
      (this as unknown as ViewTextDrawSeam).DrawText(dc, currentText as unknown as ViewTextTextLike, params);
    }
    else {
      (this as unknown as ViewTextDrawSeam).DrawTextChildren(dc, num, params);
    }

    dc.EndTextGraphic(num, this);
  }

  public DrawFig(dc: ViewTextDeviceContextLike, fig: ViewTextFigLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawFig requires a device context.');
    if (!fig) throw new Error('View::DrawFig requires a Fig element.');

    dc.StartGraphic(fig, '', fig.GetID());

    const svg = fig.FindDescendantByType?.(ClassId.SVG) as ViewTextSvgLike | null;
    if (svg) {
      params.m_x = fig.GetDrawingX();
      params.m_y = fig.GetDrawingY();
      (this as unknown as ViewTextDrawSeam).DrawSvg(dc, svg, params, 100, false);
    }

    dc.EndGraphic(fig, this);
  }

  public DrawRend(dc: ViewTextDeviceContextLike, rend: ViewTextRendLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawRend requires a device context.');
    if (!rend) throw new Error('View::DrawRend requires a Rend element.');

    dc.StartTextGraphic(rend, '', rend.GetID());

    if (params.m_laidOut) {
      if (params.m_alignment === HORIZONTALALIGNMENT_NONE) {
        params.m_alignment = rend.HasHalign() ? rend.GetHalign() : HORIZONTALALIGNMENT_left;
        params.m_x = rend.GetDrawingX();
        params.m_y = rend.GetDrawingY();
        dc.MoveTextTo(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), params.m_alignment);
      }
    }

    const rendFont = new FontInfo();
    let customFont = false;
    if (rend.HasFontname()) {
      rendFont.SetFaceName(rend.GetFontname());
      customFont = true;
    }
    if (rend.HasFontsize()) {
      const fs = rend.GetFontsizeAlternate();
      if (fs.GetType() === FONTSIZE_fontSizeNumeric) {
        rendFont.SetPointSize(this.ConvertFontSizeNumeric(fs as unknown as FontSizeNumericLike, params.m_staffSize));
      }
      else if (fs.GetType() === FONTSIZE_term) {
        const percent = fs.GetPercentForTerm();
        rendFont.SetPointSize(Math.trunc(params.m_pointSize * percent / 100));
      }
      else if (fs.GetType() === FONTSIZE_percent) {
        rendFont.SetPointSize(Math.trunc(params.m_pointSize * fs.GetPercent() / 100));
      }
      customFont = true;
      // Also pass it to the children
      params.m_pointSize = rendFont.GetPointSize();
    }
    if (rend.HasGlyphAuth() && rend.GetGlyphAuth() === 'smufl') {
      // Because we do not have the string at this stage we rely only on the selected font
      // This means fallback will not work for missing glyphs within <rend>
      rendFont.SetSmuflWithFallback(false);
      rendFont.SetFaceName((this.m_doc as ViewTextDocLike).GetResources().GetCurrentFont());
      const pointSize = (rendFont.GetPointSize() !== 0) ? rendFont.GetPointSize() : params.m_pointSize;
      rendFont.SetPointSize(Math.trunc(pointSize * (this.m_doc as ViewTextDocLike).GetMusicToLyricFontSizeRatio()));
      customFont = true;
    }
    if (rend.HasFontstyle()) {
      rendFont.SetStyle(rend.GetFontstyle() as FontStyle);
      customFont = true;
    }
    if (rend.HasFontweight()) {
      rendFont.SetWeight(rend.GetFontweight() as FontWeight);
      customFont = true;
    }
    if (rend.HasLetterspacing()) {
      rendFont.SetLetterSpacing(Math.trunc(rend.GetLetterspacing() * (this.m_doc as ViewTextDocLike).GetDrawingUnit(100)));
      customFont = true;
    }

    if (customFont) dc.SetFont(rendFont);

    let yShift = 0;
    if ((rend.GetRend() === TEXTRENDITION_sup) || (rend.GetRend() === TEXTRENDITION_sub)) {
      const MHeight = (this.m_doc as ViewTextDocLike).GetTextGlyphHeight('M'.codePointAt(0)!, dc.GetFont(), false);
      if (rend.GetRend() === TEXTRENDITION_sup) {
        yShift += (this.m_doc as ViewTextDocLike).GetTextGlyphHeight('o'.codePointAt(0)!, dc.GetFont(), false);
        // C++ `yShift += (MHeight * SUPER_SCRIPT_POSITION)` converts the double sum, not the product.
        yShift = Math.trunc(yShift + MHeight * SUPER_SCRIPT_POSITION);
      }
      else {
        yShift += Math.trunc(MHeight * SUB_SCRIPT_POSITION);
      }
      params.m_y += yShift;
      params.m_verticalShift = true;
      dc.GetFont().SetSupSubScript(true);
      dc.GetFont().SetPointSize(Math.trunc(dc.GetFont().GetPointSize() * SUPER_SCRIPT_FACTOR));
    }

    if ((rend.GetRend() === TEXTRENDITION_box) && (params.m_actualWidth !== 0)) {
      params.m_x = params.m_actualWidth + (this.m_doc as ViewTextDocLike).GetDrawingUnit(100);
      params.m_explicitPosition = true;
    }

    (this as unknown as ViewTextDrawSeam).DrawTextChildren(dc, rend, params);

    if ((rend.GetRend() === TEXTRENDITION_sup) || (rend.GetRend() === TEXTRENDITION_sub)) {
      params.m_y -= yShift;
      params.m_verticalShift = true;
      dc.GetFont().SetSupSubScript(false);
      dc.GetFont().SetPointSize(Math.trunc(dc.GetFont().GetPointSize() / SUPER_SCRIPT_FACTOR));
    }

    // Do not render enclosings if the content is empty
    if (rend.HasEnclosure()) {
      params.m_enclosedRend.push(rend);
      params.m_x = rend.GetContentRight() + (this.m_doc as ViewTextDocLike).GetDrawingUnit(100);
      params.m_explicitPosition = true;
      params.m_enclose = rend.GetRend();
    }

    if (customFont) {
      dc.ResetFont();
      // Reset the point size not to have it cummulated
      if (!dc.HasFont()) throw new Error('View::DrawRend requires a font after reset.');
      params.m_pointSize = dc.GetFont().GetPointSize();
      // Possilbe corner case: maybe we also need to reset text enclosure here?
    }

    dc.EndTextGraphic(rend, this);
  }

  public DrawText(dc: ViewTextDeviceContextLike, text: ViewTextTextLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawText requires a device context.');
    if (!dc.HasFont()) throw new Error('View::DrawText requires a font.');
    if (!text) throw new Error('View::DrawText requires a Text element.');

    const resources = dc.GetResources();
    if (!resources) throw new Error('View::DrawText requires resources.');

    dc.StartTextGraphic(text, '', text.GetID());

    resources.SelectTextFont(dc.GetFont().GetWeight(), dc.GetFont().GetStyle());

    if (params.m_explicitPosition) {
      dc.MoveTextTo(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_NONE);
      params.m_explicitPosition = false;
    }
    else if (params.m_verticalShift) {
      dc.MoveTextVerticallyTo(this.ToDeviceContextY(params.m_y));
      params.m_verticalShift = false;
    }

    // special case where we want to replace some unicode music points to SMuFL
    if (text.GetFirstAncestor(ClassId.CPMARK) || text.GetFirstAncestor(ClassId.DIR) || text.GetFirstAncestor(ClassId.ORNAM)
      || text.GetFirstAncestor(ClassId.REPEATMARK)) {
      this.DrawDirString(dc, text.GetText(), params);
    }
    else if (text.GetFirstAncestor(ClassId.DYNAM)) {
      this.DrawDynamString(dc, text.GetText(), params, text.GetFirstAncestor(ClassId.REND) as unknown as ViewTextRendLike | null);
    }
    // special case where we want to replace the '#' or 'b' with a VerovioText glyphs
    else if (text.GetFirstAncestor(ClassId.HARM)) {
      this.DrawHarmString(dc, text.GetText(), params);
    }
    // special case where we want to replace the '_' with a lyric connector
    // '_' are produce with the SibMEI plugin
    else if (text.GetFirstAncestor(ClassId.SYL)) {
      if (params.m_height !== VRV_UNSET && params.m_height !== 0) {
        this.DrawLyricString(dc, text.GetText(), 100, params);
      }
      else {
        this.DrawLyricString(dc, text.GetText(), 100);
      }
    }
    else {
      this.DrawTextString(dc, text.GetText(), params);
    }

    params.m_actualWidth = text.GetContentRight();

    resources.SelectTextFont(FONTWEIGHT_NONE as FontWeight, FONTSTYLE_NONE as FontStyle);

    dc.EndTextGraphic(text, this);
  }

  public DrawGraphic(dc: ViewTextDeviceContextLike, graphic: ViewTextGraphicLike2, params: TextDrawingParams, staffSize: number, dimin: boolean): void {
    if (!dc) throw new Error('View::DrawGraphic requires a device context.');
    if (!graphic) throw new Error('View::DrawGraphic requires a Graphic element.');

    dc.StartGraphic(graphic, '', graphic.GetID(), GraphicID.SYMBOLREF);

    let width = graphic.GetDrawingWidth((this.m_doc as ViewTextDocLike).GetDrawingUnit(staffSize), staffSize);
    let height = graphic.GetDrawingHeight((this.m_doc as ViewTextDocLike).GetDrawingUnit(staffSize), staffSize);

    if (dimin) {
      width = Math.trunc(width * this.m_options!.m_graceFactor!.GetValue());
      height = Math.trunc(height * this.m_options!.m_graceFactor!.GetValue());
    }

    dc.DrawGraphicUri(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), width, height, graphic.GetTarget());

    dc.EndGraphic(graphic, this);
  }

  public DrawSvg(dc: ViewTextDeviceContextLike, svg: ViewTextSvgLike, params: TextDrawingParams, staffSize: number, dimin: boolean): void {
    if (!dc) throw new Error('View::DrawSvg requires a device context.');
    if (!svg) throw new Error('View::DrawSvg requires an Svg element.');

    dc.StartGraphic(svg, '', svg.GetID());

    let width = svg.GetWidth();
    let height = svg.GetHeight();
    let scale = 1.0;

    if (staffSize !== 100) {
      width = Math.trunc(width * staffSize / 100);
      height = Math.trunc(height * staffSize / 100);
      scale = scale * staffSize / 100;
    }
    if (dimin) {
      width = Math.trunc(width * this.m_options!.m_graceFactor!.GetValue());
      height = Math.trunc(height * this.m_options!.m_graceFactor!.GetValue());
      scale = scale * this.m_options!.m_graceFactor!.GetValue();
    }

    dc.DrawSvgShape(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), width, height, scale, svg.Get());

    dc.EndGraphic(svg, this);
  }

  public DrawSymbol(dc: ViewTextDeviceContextLike, symbol: ViewTextSymbolLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawSymbol requires a device context.');
    if (!symbol) throw new Error('View::DrawSymbol requires a Symbol element.');

    dc.StartTextGraphic(symbol, '', symbol.GetID());

    // This can happen after an <lb/>
    if (params.m_explicitPosition) {
      dc.MoveTextTo(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_NONE);
      params.m_explicitPosition = false;
    }

    const str: number[] = [symbol.GetSymbolGlyph()];

    const symbolFont = new FontInfo();

    if (symbol.HasFontsize()) {
      const fs = symbol.GetFontsizeAlternate();
      if (fs.GetType() === FONTSIZE_fontSizeNumeric) {
        symbolFont.SetPointSize(this.ConvertFontSizeNumeric(fs as unknown as FontSizeNumericLike, params.m_staffSize));
      }
      else if (fs.GetType() === FONTSIZE_term) {
        const percent = fs.GetPercentForTerm();
        symbolFont.SetPointSize(Math.trunc(params.m_pointSize * percent / 100));
      }
      else if (fs.GetType() === FONTSIZE_percent) {
        symbolFont.SetPointSize(Math.trunc(params.m_pointSize * fs.GetPercent() / 100));
      }
    }
    if (symbol.HasFontstyle()) {
      symbolFont.SetStyle(symbol.GetFontstyle() as FontStyle);
    }
    else {
      // By default explicitly render it as normal
      symbolFont.SetStyle(FONTSTYLE_normal as FontStyle);
    }

    if (symbol.HasGlyphAuth() && symbol.GetGlyphAuth() === 'smufl') {
      const isFallbackNeeded = (this.m_doc as ViewTextDocLike).GetResources().IsSmuflFallbackNeeded(UTF32to8(str));
      symbolFont.SetSmuflWithFallback(isFallbackNeeded);
      symbolFont.SetFaceName((this.m_doc as ViewTextDocLike).GetResources().GetCurrentFont());
      const pointSize = (symbolFont.GetPointSize() !== 0) ? symbolFont.GetPointSize() : params.m_pointSize;
      symbolFont.SetPointSize(Math.trunc(pointSize * (this.m_doc as ViewTextDocLike).GetMusicToLyricFontSizeRatio()));
    }

    dc.SetFont(symbolFont);

    this.DrawTextString(dc, str, params);

    dc.ResetFont();

    dc.EndTextGraphic(symbol, this);
  }

  public DrawRunningElements(dc: ViewTextDeviceContextLike, page: ViewTextPageLike): void {
    if (!dc) throw new Error('View::DrawRunningElements requires a device context.');
    if (!page) throw new Error('View::DrawRunningElements requires a page.');

    if (dc.Is && dc.Is(ClassId.BBOX_DEVICE_CONTEXT)) {
      if (!(dc as unknown as ViewTextBBoxDCLike).UpdateVerticalValues()) return;
    }

    const header = page.GetHeader();
    if (header) {
      (this as unknown as ViewTextDrawSeam).DrawTextLayoutElement(dc, header);
    }
    const footer = page.GetFooter();
    if (footer) {
      (this as unknown as ViewTextDrawSeam).DrawTextLayoutElement(dc, footer);
    }
  }

  public DrawTextLayoutElement(dc: ViewTextDeviceContextLike, textLayoutElement: ViewTextLayoutElementLike): void {
    if (!dc) throw new Error('View::DrawTextLayoutElement requires a device context.');
    if (!textLayoutElement) throw new Error('View::DrawTextLayoutElement requires a text layout element.');

    dc.StartGraphic(textLayoutElement, '', textLayoutElement.GetID());

    const textElementFont = new FontInfo();
    if (!dc.UseGlobalStyling()) {
      textElementFont.SetFaceName((this.m_doc as ViewTextDocLike).GetResources().GetTextFont());
    }

    const params = new TextDrawingParams();

    // If we have not timestamp
    params.m_x = textLayoutElement.GetDrawingX();
    params.m_y = textLayoutElement.GetDrawingY();
    params.m_width = textLayoutElement.GetTotalWidth(this.m_doc);
    params.m_alignment = HORIZONTALALIGNMENT_NONE;
    params.m_laidOut = true;
    params.m_pointSize = (this.m_doc as ViewTextDocLike).GetDrawingLyricFont(100).GetPointSize();

    textElementFont.SetPointSize(params.m_pointSize);

    dc.SetFont(textElementFont);

    (this as unknown as ViewTextDrawSeam).DrawRunningChildren(dc, textLayoutElement, params);

    dc.ResetFont();

    dc.EndGraphic(textLayoutElement, this);
  }

  public DrawDiv(dc: ViewTextDeviceContextLike, div: ViewTextLayoutElementLike, system: unknown): void {
    this.DrawTextLayoutElement(dc, div);
  }

  // =========================================================================
  // view_page.cpp — Pass 323
  // =========================================================================

  public DrawCurrentPage(dc: ViewPageDeviceContextLike, background: boolean): void {
    if (!dc) throw new Error('View::DrawCurrentPage requires a device context.');
    if (!this.m_currentPage) throw new Error('View::DrawCurrentPage requires a current page.');

    // Ensure that resources are set
    const dcHasResources = dc.HasResources();
    if (!dcHasResources) dc.SetResources(this.m_doc!.GetResources());

    // Keep the width of the initial scoreDef
    this.SetScoreDefDrawingWidth(dc, this.m_currentPage.m_drawingScoreDef!);

    // Set the current score def to the page one
    this.m_drawingScoreDef = this.m_currentPage.m_drawingScoreDef ?? null;

    if ((this.m_doc!.GetAdjustedDrawingPageHeight() > dc.GetHeight()) && this.m_options!.m_shrinkToFit!.GetValue()) {
      dc.SetContentHeight(this.m_doc!.GetAdjustedDrawingPageHeight());
    }
    else {
      dc.SetContentHeight(dc.GetHeight());
    }

    dc.DrawBackgroundImage();

    const origin = dc.GetLogicalOrigin();
    dc.SetLogicalOrigin(origin.x - this.m_doc!.m_drawingPageMarginLeft, origin.y - this.m_doc!.m_drawingPageMarginTop);

    dc.StartPage();

    for (const child of this.m_currentPage.GetChildren?.() ?? []) {
      if (child.IsPageElement?.()) {
        this.DrawPageElement(dc, child as ViewPageElementLike);
      }
      else if (child.Is?.(ClassId.SYSTEM)) {
        this.DrawSystem(dc, child as unknown as ViewPageSystemLike);
      }
      else {
        throw new Error('View::DrawCurrentPage: unexpected page child.');
      }
    }

    this.DrawRunningElements(dc as unknown as ViewTextDeviceContextLike, this.m_currentPage as unknown as ViewTextPageLike);

    dc.EndPage();

    if (!dcHasResources) dc.ResetResources();
  }

  public SetScoreDefDrawingWidth(dc: ViewPageDeviceContextLike, scoreDef: ViewPageScoreDefLike): void {
    if (!dc) throw new Error('View::SetScoreDefDrawingWidth requires a device context.');
    if (!scoreDef) throw new Error('View::SetScoreDefDrawingWidth requires a scoreDef.');

    let numAlteration = 0;

    // key signature of the scoreDef
    if (scoreDef.HasKeySigInfo?.()) {
      const keySig = scoreDef.GetKeySig();
      if (!keySig) throw new Error('View::SetScoreDefDrawingWidth: keySig required');
      numAlteration = (keySig.GetAccidCount() > numAlteration) ? keySig.GetAccidCount() : numAlteration;
    }

    // longest key signature of the staffDefs
    const childList = scoreDef.GetList(); // make sure it's initialized
    for (const child of childList) {
      const staffDef = child as unknown as ViewPageStaffDefLike;
      if (!staffDef.HasKeySigInfo?.()) continue;
      const keySig = staffDef.GetKeySig();
      if (!keySig) throw new Error('View::SetScoreDefDrawingWidth: staffDef keySig required');
      numAlteration = (keySig.GetAccidCount() > numAlteration) ? keySig.GetAccidCount() : numAlteration;
    }

    const unit = this.m_doc!.GetDrawingUnit(100);
    let width = 0;
    // G-clef as default width
    width += this.m_doc!.GetGlyphWidth(SMUFL_E050_gClef, 100, false)
      + (this.m_doc!.GetLeftMargin(ClassId.CLEF) + this.m_doc!.GetRightMargin(ClassId.CLEF)) * unit;
    if (numAlteration > 0) {
      width += this.m_doc!.GetGlyphWidth(SMUFL_E262_accidentalSharp, 100, false) * TEMP_KEYSIG_STEP
        + (this.m_doc!.GetLeftMargin(ClassId.KEYSIG) + this.m_doc!.GetRightMargin(ClassId.KEYSIG)) * unit;
    }

    scoreDef.SetDrawingWidth(Math.trunc(width));
  }

  public DrawPageElement(dc: ViewPageDeviceContextLike, element: ViewPageElementLike): void {
    if (!dc) throw new Error('View::DrawPageElement requires a device context.');
    if (!element) throw new Error('View::DrawPageElement requires an element.');

    if (element.Is?.(ClassId.PAGE_MILESTONE_END)) {
      const elementEnd = element as unknown as ViewPageMilestoneEndLike;
      if (!elementEnd.GetStart()) throw new Error('View::DrawPageElement: milestone end without start');
      dc.StartGraphic(element, elementEnd.GetStart().GetID(), element.GetID());
      dc.EndGraphic(element, this);
    }
    else if (element.Is?.(ClassId.MDIV)) {
      const elementStart = (element.IsMilestoneElement?.()) ? 'pageMilestone' : '';
      dc.StartGraphic(element, elementStart, element.GetID());
      dc.EndGraphic(element, this);
    }
    else if (element.Is?.(ClassId.SCORE)) {
      dc.StartGraphic(element, 'pageMilestone', element.GetID());
      dc.EndGraphic(element, this);
    }
  }

  public DrawSystem(dc: ViewPageDeviceContextLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawSystem requires a device context.');
    if (!system) throw new Error('View::DrawSystem requires a system.');

    dc.StartGraphic(system, '', system.GetID());

    const firstMeasure = system.FindDescendantByType?.(ClassId.MEASURE, 1) as ViewPageMeasureLike | null;

    this.DrawSystemDivider(dc, system, firstMeasure);

    // first we need to clear the drawing list of postponed elements
    system.ResetDrawingList();

    if (firstMeasure) {
      this.DrawScoreDef(dc, system.GetDrawingScoreDef(), firstMeasure, system.GetDrawingX(), null, false, false, false);
    }

    this.DrawSystemChildren(dc, system, system);

    this.DrawSystemList(dc, system, ClassId.SYL);
    this.DrawSystemList(dc, system, ClassId.ANNOTSCORE);
    this.DrawSystemList(dc, system, ClassId.BEAMSPAN);
    this.DrawSystemList(dc, system, ClassId.BRACKETSPAN);
    this.DrawSystemList(dc, system, ClassId.DYNAM);
    this.DrawSystemList(dc, system, ClassId.DIR);
    this.DrawSystemList(dc, system, ClassId.GLISS);
    this.DrawSystemList(dc, system, ClassId.HAIRPIN);
    this.DrawSystemList(dc, system, ClassId.TRILL);
    this.DrawSystemList(dc, system, ClassId.FIGURE);
    this.DrawSystemList(dc, system, ClassId.LV);
    this.DrawSystemList(dc, system, ClassId.PHRASE);
    this.DrawSystemList(dc, system, ClassId.OCTAVE);
    this.DrawSystemList(dc, system, ClassId.ORNAM);
    this.DrawSystemList(dc, system, ClassId.PEDAL);
    this.DrawSystemList(dc, system, ClassId.PITCHINFLECTION);
    this.DrawSystemList(dc, system, ClassId.TEMPO);
    this.DrawSystemList(dc, system, ClassId.TIE);
    this.DrawSystemList(dc, system, ClassId.SLUR);
    this.DrawSystemList(dc, system, ClassId.ENDING);

    dc.EndGraphic(system, this);
  }

  public DrawSystemList(dc: ViewPageDeviceContextLike, system: ViewPageSystemLike, classId: number): void {
    if (!dc) throw new Error('View::DrawSystemList requires a device context.');
    if (!system) throw new Error('View::DrawSystemList requires a system.');

    const drawingList = system.GetDrawingList();

    for (const object of drawingList) {
      const timeSpanningClasses = [ClassId.ANNOTSCORE, ClassId.BEAMSPAN, ClassId.BRACKETSPAN, ClassId.DIR, ClassId.DYNAM, ClassId.FIGURE,
        ClassId.GLISS, ClassId.HAIRPIN, ClassId.LV, ClassId.OCTAVE, ClassId.ORNAM, ClassId.PEDAL, ClassId.PHRASE, ClassId.PITCHINFLECTION, ClassId.SLUR, ClassId.SYL, ClassId.TEMPO, ClassId.TIE, ClassId.TRILL];
      if (object.Is?.(classId) && timeSpanningClasses.includes(classId)) {
        this.StartOffset(dc, object as unknown as ViewObjectLike, 100);
        (this as unknown as { DrawTimeSpanningElement(dc: unknown, object: unknown, system: unknown): void }).DrawTimeSpanningElement?.(dc, object, system);
        this.EndOffset(dc, object as unknown as ViewObjectLike);
      }
      if (object.Is?.(classId) && (classId === ClassId.ENDING)) {
        (this as unknown as { DrawEnding?(dc: unknown, ending: unknown, system: unknown): void }).DrawEnding?.(dc, object, system);
      }
    }
  }

  public DrawScoreDef(dc: ViewPageDeviceContextLike, scoreDef: ViewPageScoreDefLike, measure: ViewPageMeasureLike, x: number, barLine: ViewPageBarLineLike | null,
    isLastMeasure = false, isLastSystem = false, noLabels = false): void {
    if (!dc) throw new Error('View::DrawScoreDef requires a device context.');
    if (!scoreDef) throw new Error('View::DrawScoreDef requires a scoreDef.');
    if (!measure) throw new Error('View::DrawScoreDef requires a measure.');

    const staffGrp = scoreDef.FindDescendantByType?.(ClassId.STAFFGRP) as ViewPageStaffGrpLike | null;
    if (!staffGrp) {
      return;
    }

    if (barLine === null) {
      // Draw the first staffGrp and from there its children recursively
      let drawingLabels = (scoreDef.DrawLabels!()) ? DRAWING_LABEL_FULL : DRAWING_LABEL_ABBR;
      if (noLabels) drawingLabels = DRAWING_LABEL_NONE;
      this.DrawStaffGrp(dc, measure, staffGrp, x, true, drawingLabels);
    }
    else {
      dc.StartGraphic(barLine, '', barLine.GetID());
      const yBottomPrevious = { value: VRV_UNSET };
      this.DrawBarLines(dc, measure, staffGrp, barLine, isLastMeasure, isLastSystem, yBottomPrevious);
      dc.EndGraphic(barLine, this);
    }
  }

  public DrawStaffGrp(dc: ViewPageDeviceContextLike, measure: ViewPageMeasureLike, staffGrp: ViewPageStaffGrpLike, x: number, topStaffGrp: boolean,
    drawingLabels: number): void {
    if (!dc) throw new Error('View::DrawStaffGrp requires a device context.');
    if (!measure) throw new Error('View::DrawStaffGrp requires a measure.');
    if (!staffGrp) throw new Error('View::DrawStaffGrp requires a staffGrp.');

    if (staffGrp.GetDrawingVisibility?.() === OPTIMIZATION_HIDDEN) {
      return;
    }

    const [firstDef, lastDef] = staffGrp.GetFirstLastStaffDef();

    // Get the first and last staffDef of the staffGrp
    if (!firstDef || !lastDef) {
      return;
    }

    // Get the corresponding staff looking at the previous (or first) measure
    const first = measure.FindDescendantByComparison?.(new AttNIntegerComparison(ClassId.STAFF, firstDef.GetN()), 1) as ViewPageStaffLike | null;
    const last = measure.FindDescendantByComparison?.(new AttNIntegerComparison(ClassId.STAFF, lastDef.GetN()), 1) as ViewPageStaffLike | null;

    if (!first || !last) {
      return;
    }

    const staffSize = staffGrp.GetMaxStaffSize();
    let yTop = first.GetDrawingY();
    // C++ computes in 32-bit int (wraps when GetLines() == VRV_UNSET); replicate with imul.
    let yBottom
      = last.GetDrawingY() - Math.imul((lastDef.GetLines() - 1) | 0, this.m_doc!.GetDrawingDoubleUnit(last.m_drawingStaffSize));
    // adjust to single line staves
    if (firstDef.GetLines() <= 1) yTop += this.m_doc!.GetDrawingDoubleUnit(last.m_drawingStaffSize);
    if (lastDef.GetLines() <= 1) yBottom -= this.m_doc!.GetDrawingDoubleUnit(last.m_drawingStaffSize);

    // draw the system start bar line
    const scoreDef = staffGrp.GetFirstAncestor?.(ClassId.SCOREDEF) as ViewPageScoreDefLike | null;
    if (topStaffGrp) {
      if (scoreDef && scoreDef.HasSystemStartLine()) {
        const barLineWidth = this.m_doc!.GetDrawingBarLineWidth(staffSize);
        this.DrawVerticalLine(dc, yTop, yBottom, x + Math.trunc(barLineWidth / 2), barLineWidth, VRV_UNSET, VRV_UNSET);
      }
    }

    // draw the group symbol
    const staffGrpX = x;
    const xRef = { value: x };
    this.DrawGrpSym(dc, measure, staffGrp, xRef);
    // C++ passes `int &x` by reference (view_page.cpp:336): the grpSym mutation
    // inside DrawGrpSym persists for children, xLabel and DrawStaffDefLabels.
    x = xRef.value;
    const grpSymSpace = staffGrpX - x;

    // recursively draw the children
    const childCount = staffGrp.GetChildCount?.() ?? 0;
    for (let i = 0; i < childCount; ++i) {
      const childStaffGrp = staffGrp.GetChild?.(i) as ViewPageStaffGrpLike | null;
      if (childStaffGrp?.Is?.(ClassId.STAFFGRP)) {
        this.DrawStaffGrp(dc, measure, childStaffGrp, x, false, drawingLabels);
      }
    }

    if (drawingLabels !== DRAWING_LABEL_NONE) {
      const abbreviations = (drawingLabels === DRAWING_LABEL_ABBR);
      // DrawStaffGrpLabel
      const space = this.m_doc!.GetDrawingDoubleUnit(staffGrp.GetMaxStaffSize());
      const xLabel = x - space;
      const yLabel = yBottom - Math.trunc((yBottom - yTop) / 2) - this.m_doc!.GetDrawingUnit(100);
      this.DrawLabels(dc, scoreDef, staffGrp, xLabel, yLabel, abbreviations, 100, 2 * space + grpSymSpace);

      this.DrawStaffDefLabels(dc, measure, staffGrp, x, abbreviations);
    }
  }

  public DrawStaffDefLabels(dc: ViewPageDeviceContextLike, measure: ViewPageMeasureLike, staffGrp: ViewPageStaffGrpLike, x: number, abbreviations: boolean): void {
    if (!dc) throw new Error('View::DrawStaffDefLabels requires a device context.');
    if (!measure) throw new Error('View::DrawStaffDefLabels requires a measure.');
    if (!staffGrp) throw new Error('View::DrawStaffDefLabels requires a staffGrp.');

    const childCount = staffGrp.GetChildCount?.() ?? 0;
    for (let i = 0; i < childCount; ++i) {
      const staffDef = staffGrp.GetChild?.(i) as ViewPageStaffDefLike | null;

      if (!staffDef?.Is?.(ClassId.STAFFDEF)) {
        continue;
      }

      const staff = measure.FindDescendantByComparison?.(new AttNIntegerComparison(ClassId.STAFF, staffDef.GetN()), 1) as ViewPageStaffLike | null;
      const scoreDef = staffGrp.GetFirstAncestor?.(ClassId.SCOREDEF) as ViewPageScoreDefLike | null;

      if (!staff || !scoreDef) {
        continue;
      }

      if (!staff.DrawingIsVisible?.()) {
        continue;
      }

      // HARDCODED
      const doubleUnit = this.m_doc!.GetDrawingDoubleUnit(staffGrp.GetMaxStaffSize());
      const space = doubleUnit;
      // C++ computes in 32-bit int: lines * doubleUnit wraps, then truncates / 2; replicate.
      const y = staff.GetDrawingY() - Math.trunc(Math.imul(staffDef.GetLines() | 0, doubleUnit) / 2);

      const staffSize = staff.GetDrawingStaffNotationSize?.() ?? 100;
      let adjust = 0;
      if (staffDef.HasLayerDefWithLabel?.()) adjust = 3 * doubleUnit;
      this.DrawLabels(
        dc, scoreDef, staffDef, x - doubleUnit - adjust, y, abbreviations, staffSize, 2 * space + adjust);

      this.DrawLayerDefLabels(dc, scoreDef, staff, staffDef, x, abbreviations);
    }
  }

  public DrawGrpSym(dc: ViewPageDeviceContextLike, measure: ViewPageMeasureLike, staffGrp: ViewPageStaffGrpLike, xRef: { value: number }): void {
    // draw the group symbol
    const groupSymbol = staffGrp.GetGroupSymbol?.() as ViewPageGrpSymLike | null;
    if (!groupSymbol) return;

    // Get the corresponding staff looking at the previous (or first) measure
    const first = measure.FindDescendantByComparison?.(new AttNIntegerComparison(ClassId.STAFF, groupSymbol.GetStartDef().GetN()), 1) as ViewPageStaffLike | null;
    const last = measure.FindDescendantByComparison?.(new AttNIntegerComparison(ClassId.STAFF, groupSymbol.GetEndDef().GetN()), 1) as ViewPageStaffLike | null;

    if (!first || !last) {
      return;
    }

    dc.StartGraphic(groupSymbol, '', groupSymbol.GetID());

    const staffSize = staffGrp.GetMaxStaffSize();
    let yTop = first.GetDrawingY();
    // C++ computes in 32-bit int (wraps when GetLines() == VRV_UNSET); replicate with imul.
    let yBottom = last.GetDrawingY()
      - Math.imul((groupSymbol.GetEndDef().GetLines() - 1) | 0, this.m_doc!.GetDrawingDoubleUnit(last.m_drawingStaffSize));
    // for the bottom position we need to take into account the number of lines and the staff size
    if (groupSymbol.GetStartDef().GetLines() <= 1) yTop += this.m_doc!.GetDrawingDoubleUnit(last.m_drawingStaffSize);
    if (groupSymbol.GetEndDef().GetLines() <= 1) yBottom -= this.m_doc!.GetDrawingDoubleUnit(last.m_drawingStaffSize);

    switch (groupSymbol.GetSymbol()) {
      case staffGroupingSym_SYMBOL_line: {
        const lineWidth = Math.trunc(this.m_doc!.GetDrawingUnit(staffSize) * this.m_options!.m_bracketThickness!.GetValue());
        const yOffset = Math.trunc(this.m_doc!.GetDrawingUnit(staffSize) * this.m_options!.m_staffLineWidth!.GetValue() / 2);
        this.DrawVerticalLine(dc, yTop + yOffset, yBottom - yOffset, Math.trunc(xRef.value - 1.5 * lineWidth), lineWidth, VRV_UNSET, VRV_UNSET);
        xRef.value = Math.trunc(xRef.value - 2 * lineWidth);
        break;
      }
      case staffGroupingSym_SYMBOL_brace: {
        this.DrawBrace(dc, xRef.value, yTop, yBottom, staffSize, false);
        xRef.value = Math.trunc(xRef.value - 2.5 * this.m_doc!.GetDrawingUnit(staffSize));
        break;
      }
      case staffGroupingSym_SYMBOL_bracket: {
        this.DrawBracket(dc, xRef.value, yTop, yBottom, staffSize);
        xRef.value = Math.trunc(xRef.value - this.m_doc!.GetDrawingUnit(staffSize) * (1.0 + this.m_options!.m_bracketThickness!.GetValue()));
        break;
      }
      case staffGroupingSym_SYMBOL_bracketsq: {
        this.DrawBracketSq(dc, xRef.value, yTop, yBottom, staffSize);
        xRef.value = Math.trunc(xRef.value - this.m_doc!.GetDrawingUnit(staffSize));
        break;
      }
      default: break;
    }

    dc.EndGraphic(groupSymbol, this);
  }

  public DrawLayerDefLabels(
    dc: ViewPageDeviceContextLike, scoreDef: ViewPageScoreDefLike, staff: ViewPageStaffLike, staffDef: ViewPageStaffDefLike, x: number, abbreviations: boolean): void {
    if (!dc) throw new Error('View::DrawLayerDefLabels requires a device context.');
    if (!staff) throw new Error('View::DrawLayerDefLabels requires a staff.');
    if (!staffDef) throw new Error('View::DrawLayerDefLabels requires a staffDef.');

    // constants
    const space = this.m_doc!.GetDrawingDoubleUnit(scoreDef.GetMaxStaffSize());
    // C++ computes in 32-bit int: lines * doubleUnit wraps, then truncates / 2; replicate.
    const yCenter
      = staff.GetDrawingY() - Math.trunc(Math.imul(staffDef.GetLines() | 0, this.m_doc!.GetDrawingDoubleUnit(staff.m_drawingStaffSize)) / 2);
    const staffSize = staff.GetDrawingStaffNotationSize?.() ?? 100;
    const pointSize = this.m_doc!.GetDrawingLyricFont(staffSize).GetPointSize();
    const layerDefCount = staffDef.GetChildCount?.(ClassId.LAYERDEF) ?? 0;
    const requiredSpace = pointSize * layerDefCount;

    let initialY = yCenter + Math.trunc((requiredSpace - pointSize) / 2);
    for (let i = 0; i < layerDefCount; ++i) {
      const layerDef = staffDef.GetChild?.(i, ClassId.LAYERDEF) as ViewPageLayerDefLike | null;
      if (!layerDef) continue;

      this.DrawLabels(dc, scoreDef, layerDef, x - space, initialY, abbreviations, staffSize, space);
      initialY -= pointSize;
    }
  }

  public DrawLabels(
    dc: ViewPageDeviceContextLike, scoreDef: ViewPageScoreDefLike | null, object: ViewPageLabelHolderLike, x: number, y: number, abbreviations: boolean, staffSize: number, space: number): void {
    if (!dc) throw new Error('View::DrawLabels requires a device context.');
    if (!scoreDef) throw new Error('View::DrawLabels requires a scoreDef.');

    const label = object.FindDescendantByType?.(ClassId.LABEL, 1) as ViewPageLabelLike | null;
    const labelAbbr = object.FindDescendantByType?.(ClassId.LABELABBR, 1) as ViewPageLabelLike | null;
    let graphic: ViewPageLabelLike | null = label;

    let labelStr: number[] = label ? label.GetText() : [];
    const labelAbbrStr: number[] = labelAbbr ? labelAbbr.GetText() : [];

    if (abbreviations) {
      labelStr = labelAbbrStr;
      graphic = labelAbbr;
    }

    if (!graphic || (labelStr.length === 0)) {
      return;
    }

    const labelTxt = new FontInfo();
    if (!dc.UseGlobalStyling?.()) {
      labelTxt.SetFaceName((this.m_doc as { GetResources(): { GetTextFont(): string } }).GetResources().GetTextFont());
    }
    labelTxt.SetPointSize(this.m_doc!.GetDrawingLyricFont(staffSize).GetPointSize());

    const lineCount = (graphic.GetChildCount?.(ClassId.LB) ?? 0) + 1;
    if (lineCount > 1) {
      y += Math.trunc(this.m_doc!.GetTextLineHeight(labelTxt, false) * (lineCount - 1) / 2);
    }

    const params = new TextDrawingParams();
    params.m_x = x;
    params.m_y = y;
    params.m_staffSize = staffSize;
    params.m_pointSize = labelTxt.GetPointSize();

    dc.SetFont(labelTxt);

    dc.StartGraphic(graphic, '', graphic.GetID());

    dc.StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_right);
    this.DrawTextChildren(dc, graphic, params);
    dc.EndText();

    dc.EndGraphic(graphic, this);

    // keep the widest width for the system - careful: this can be the label OR labelAbbr
    scoreDef.SetDrawingLabelsWidth?.((graphic.GetContentX2?.() ?? 0) - (graphic.GetContentX1?.() ?? 0) + space);
    // also store in the system the maximum width with abbreviations for justification
    if (labelAbbr && !abbreviations && (labelAbbrStr.length > 0)) {
      const extend = new TextExtend();
      const lines: string[] = [];
      labelAbbr.GetTextLines(lines);
      let maxLength = 0;
      for (const line of lines) {
        dc.GetTextExtent?.(line, extend, true);
        maxLength = (extend.m_width > maxLength) ? extend.m_width : maxLength;
      }
      const system = scoreDef.GetFirstAncestor?.(ClassId.SYSTEM) as ViewPageSystemLike | null;
      if (!system) throw new Error('View::DrawLabels: system required');
      system.SetDrawingAbbrLabelsWidth?.(maxLength + space);
    }

    dc.ResetFont();
  }

  public DrawBracket(dc: ViewPageDeviceContextLike, x: number, y1: number, y2: number, staffSize: number): void {
    if (!dc) throw new Error('View::DrawBracket requires a device context.');

    const offset = Math.trunc(this.m_doc!.GetDrawingStaffLineWidth(staffSize) / 2);
    const basicDist = this.m_doc!.GetDrawingUnit(staffSize);

    const bracketThickness = Math.trunc(this.m_doc!.GetDrawingUnit(staffSize) * this.m_options!.m_bracketThickness!.GetValue());

    const x2 = x - basicDist;
    const x1 = x2 - bracketThickness;

    this.DrawSmuflCode(dc, x1, y1 + offset + Math.trunc(bracketThickness / 2), SMUFL_E003_bracketTop, staffSize, false);
    this.DrawSmuflCode(dc, x1, y2 - offset - Math.trunc(bracketThickness / 2), SMUFL_E004_bracketBottom, staffSize, false);

    this.DrawFilledRectangle(
      dc, x1, y1 + 2 * offset + Math.trunc(bracketThickness / 2), x2, y2 - 2 * offset - Math.trunc(bracketThickness / 2));
  }

  public DrawBracketSq(dc: ViewPageDeviceContextLike, x: number, y1: number, y2: number, staffSize: number): void {
    if (!dc) throw new Error('View::DrawBracketSq requires a device context.');

    const y = Math.min(y1, y2);
    const height = Math.abs(y2 - y1);
    const horizontalThickness = this.m_doc!.GetDrawingStaffLineWidth(staffSize);
    const verticalThickness = Math.trunc(this.m_doc!.GetDrawingUnit(staffSize) * this.m_options!.m_subBracketThickness!.GetValue());
    const width = this.m_doc!.GetDrawingUnit(staffSize);

    this.DrawSquareBracket(dc, true, x - width, y, height, width, horizontalThickness, verticalThickness);
  }

  public DrawBrace(dc: ViewPageDeviceContextLike, xIn: number, y1In: number, y2In: number, staffSize: number, forceGlyph: boolean): void {
    if (!dc) throw new Error('View::DrawBrace requires a device context.');

    const basicDist = this.m_doc!.GetDrawingUnit(staffSize);

    let x = xIn - basicDist;

    if (forceGlyph || this.m_doc!.GetOptions().m_useBraceGlyph!.GetValue()) {
      const font = this.m_doc!.GetDrawingSmuflFont(staffSize, false) as FontInfo;
      const width = this.m_doc!.GetGlyphWidth(SMUFL_E000_brace, staffSize, false);
      const height = 8 * this.m_doc!.GetDrawingUnit(staffSize);
      const scale = (y1In - y2In) / height;
      // We want the brace width always to be 2 units
      const braceWidth = this.m_doc!.GetDrawingDoubleUnit(staffSize);
      x -= braceWidth;
      const currentWidthToHeightRatio = font.GetWidthToHeightRatio();
      const widthAfterScalling = width * scale;
      font.SetWidthToHeightRatio(braceWidth / widthAfterScalling);
      this.DrawSmuflCode(dc, x, y2In, SMUFL_E000_brace, staffSize * scale, false);
      font.SetWidthToHeightRatio(currentWidthToHeightRatio);
      return;
    }

    const points = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
    const bez1 = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
    const bez2 = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];

    let y1 = y1In, y2 = y2In;
    const penWidth = this.m_doc!.GetDrawingStemWidth(staffSize);
    y1 -= penWidth;
    y2 += penWidth;
    x += penWidth;
    [y1, y2] = [y2, y1]; // std::swap(y1, y2)

    const fact = this.m_doc!.GetDrawingBeamWhiteWidth(staffSize, false) + this.m_doc!.GetDrawingStemWidth(staffSize);
    const xdec = this.ToDeviceContextX(fact);
    const ymed = Math.trunc((y1 + y2) / 2);

    points[0].x = this.ToDeviceContextX(x);
    points[0].y = this.ToDeviceContextY(y1);
    points[1].x = this.ToDeviceContextX(x - this.m_doc!.GetDrawingDoubleUnit(staffSize) * 2);
    points[1].y = points[0].y - this.ToDeviceContextX(this.m_doc!.GetDrawingDoubleUnit(staffSize) * 3);
    points[3].x = this.ToDeviceContextX(x - this.m_doc!.GetDrawingDoubleUnit(staffSize));
    points[3].y = this.ToDeviceContextY(ymed);
    points[2].x = this.ToDeviceContextX(x + this.m_doc!.GetDrawingUnit(staffSize));
    points[2].y = points[3].y + this.ToDeviceContextX(this.m_doc!.GetDrawingDoubleUnit(staffSize));

    // C++ `bez1[i] = points[i]` copies Point value structs; TS arrays hold
    // references, so copy at every bez* assignment or the later `points[i].x +=
    // xdec` mutation retroactively rewrites the committed bez1/bez2 (43a brace).
    const copyPoint = (p: Point): Point => new Point(p.x, p.y);
    bez1[0] = copyPoint(points[0]); bez1[1] = copyPoint(points[1]); bez1[2] = copyPoint(points[2]); bez1[3] = copyPoint(points[3]);

    points[1].x += xdec;
    points[2].x += xdec;

    bez2[0] = copyPoint(points[0]); bez2[1] = copyPoint(points[1]); bez2[2] = copyPoint(points[2]); bez2[3] = copyPoint(points[3]);

    dc.SetPen(Math.max(1, penWidth), PenStyle.PEN_SOLID);

    dc.DrawCubicBezierPathFilled?.(bez1, bez2);

    // on produit l'image reflet vers le bas: 0 est identique
    points[0].y = this.ToDeviceContextY(y2);
    points[1].y = points[0].y + this.ToDeviceContextX(this.m_doc!.GetDrawingDoubleUnit(staffSize) * 3);
    points[3].y = this.ToDeviceContextY(ymed);
    points[2].y = points[3].y - this.ToDeviceContextX(this.m_doc!.GetDrawingDoubleUnit(staffSize));

    bez1[0] = copyPoint(points[0]); bez1[1] = copyPoint(points[1]); bez1[2] = copyPoint(points[2]); bez1[3] = copyPoint(points[3]);

    points[1].x -= xdec;
    points[2].x -= xdec;

    bez2[0] = copyPoint(points[0]); bez2[1] = copyPoint(points[1]); bez2[2] = copyPoint(points[2]); bez2[3] = copyPoint(points[3]);

    dc.DrawCubicBezierPathFilled?.(bez1, bez2);

    dc.ResetPen();
  }

  public DrawBarLines(dc: ViewPageDeviceContextLike, measure: ViewPageMeasureLike, staffGrp: ViewPageStaffGrpLike, barLine: ViewPageBarLineLike, isLastMeasure: boolean,
    isLastSystem: boolean, yBottomPrevious: { value: number }): void {
    if (!dc) throw new Error('View::DrawBarLines requires a device context.');
    if (!measure) throw new Error('View::DrawBarLines requires a measure.');
    if (!staffGrp) throw new Error('View::DrawBarLines requires a staffGrp.');
    if (!barLine) throw new Error('View::DrawBarLines requires a barLine.');
    // ponytail: per-measure staff index (P31). The loop ran
    // measure.FindDescendantByComparison(new AttNIntegerComparison(...), 1)
    // per staffDef (functor alloc + full Process for a direct-child scan).
    // Deepness-1 STAFF match == direct child with same N; index once.
    const staffByN = new Map<number, ViewPageStaffLike>();
    const mCount = measure.GetChildCount?.() ?? 0;
    for (let mi = 0; mi < mCount; ++mi) {
      const mChild = measure.GetChild?.(mi) as (ViewPageStaffLike & { GetN?: () => number }) | null;
      if (mChild?.Is?.(ClassId.STAFF) && typeof mChild.GetN === 'function') {
        if (!staffByN.has(mChild.GetN())) staffByN.set(mChild.GetN(), mChild);
      }
    }
    this.drawBarLinesIndexed(dc, measure, staffGrp, barLine, isLastMeasure, isLastSystem, yBottomPrevious, staffByN);
  }

  private drawBarLinesIndexed(dc: ViewPageDeviceContextLike, measure: ViewPageMeasureLike, staffGrp: ViewPageStaffGrpLike, barLine: ViewPageBarLineLike, isLastMeasure: boolean,
    isLastSystem: boolean, yBottomPrevious: { value: number }, staffByN: Map<number, ViewPageStaffLike>): void {
    if (!dc) throw new Error('View::DrawBarLines requires a device context.');
    if (!measure) throw new Error('View::DrawBarLines requires a measure.');
    if (!staffGrp) throw new Error('View::DrawBarLines requires a staffGrp.');
    if (!barLine) throw new Error('View::DrawBarLines requires a barLine.');

    const showHidden = (this.m_doc!.GetOptions().m_showHidden!.GetValue());

    if (staffGrp.GetDrawingVisibility?.() === OPTIMIZATION_HIDDEN) {
      return;
    }

    const barlineThrough = barLine.IsDrawnThrough(staffGrp);

    const childCount = staffGrp.GetChildCount?.() ?? 0;
    for (let i = 0; i < childCount; ++i) {
      const child = staffGrp.GetChild?.(i)!;

      // Recursive call for staff group
      if (child.Is?.(ClassId.STAFFGRP)) {
        this.drawBarLinesIndexed(dc, measure, child as ViewPageStaffGrpLike, barLine, isLastMeasure, isLastSystem, yBottomPrevious, staffByN);
        if (!barlineThrough) yBottomPrevious.value = VRV_UNSET;
        continue;
      }

      // Determine the staff def
      if (!child.Is?.(ClassId.STAFFDEF)) continue;
      const staffDef = child as ViewPageStaffDefLike;
      if (staffDef.GetDrawingVisibility?.() === OPTIMIZATION_HIDDEN) {
        continue;
      }

      // Determine the barline form
      let form = barLine.GetForm();
      if (!barlineThrough && (measure.HasInvisibleStaffBarlines?.())) {
        const barlineRend = (barLine.GetPosition() === BarLinePosition.Right)
          ? measure.GetDrawingRightBarLineByStaffN?.(staffDef.GetN())
          : measure.GetDrawingLeftBarLineByStaffN?.(staffDef.GetN());
        if (barlineRend !== undefined && barlineRend !== null && barlineRend !== BARRENDITION_NONE) form = barlineRend;
      }
      if (form === BARRENDITION_NONE) {
        yBottomPrevious.value = VRV_UNSET;
        continue;
      }

      // Determine the method
      const [hasMethod, method] = barLine.GetMethodFromContext(staffDef);
      const methodMensur = hasMethod && (method === BARMETHOD_mensur);
      const methodTakt = hasMethod && (method === BARMETHOD_takt);

      // Get the corresponding staff
      const staff = staffByN.get(staffDef.GetN()) ?? null;
      const hiddenStaff = (!staff || (staff.HasVisible?.() && (staff.GetVisible?.() === BOOLEAN_false)));
      if (!showHidden && hiddenStaff) {
        yBottomPrevious.value = VRV_UNSET;
        continue;
      }
      if (!barlineThrough && hiddenStaff) {
        yBottomPrevious.value = VRV_UNSET;
        continue;
      }
      if (!staff) throw new Error('View::DrawBarLines: staff required');
      const unit = this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);

      // For the bottom position we need to take into account the number of lines and the staff size
      const yStaffTop = staff.GetDrawingY();
      // C++ computes in 32-bit int: 2 * (UNSET-1) wraps to 0 via imul; replicate.
      const yStaffBottom = yStaffTop - Math.imul(Math.imul(2, (staffDef.GetLines() - 1) | 0), unit);
      let yBottom = yStaffBottom;
      let yLength = yStaffTop - yStaffBottom;

      // Adjust start and length
      if (!methodMensur && !methodTakt) {
        const [hasPlace, place] = barLine.GetPlaceFromContext(staffDef);
        if (hasPlace) {
          // bar.place counts upwards (note order).
          yBottom += place * unit;
        }
        else if (staffDef.GetLines() <= 1) {
          // Make sure barlines are visible with a single line
          yBottom -= 2 * unit;
        }

        const [hasLength, length] = barLine.GetLengthFromContext(staffDef);
        if (hasLength) {
          yLength = length * unit;
        }
        else if (staffDef.GetLines() <= 1) {
          yLength = 4 * unit;
        }
      }
      const yTop = yBottom + yLength;

      // Shift the taktstrich outwards?
      const yTaktstrichShift = methodMensur ? unit : 0;

      // Determine which parts to draw
      let drawInsideStaff = !methodMensur && !methodTakt;
      let drawOutsideStaff = !methodTakt && barlineThrough;
      let drawTaktstrichAbove = (methodMensur && !barlineThrough) || methodTakt;
      let drawTaktstrichBelow = methodMensur && !barlineThrough;
      if ((isLastMeasure && isLastSystem) || barLine.HasRepetitionDots()) {
        drawInsideStaff = true;
        drawTaktstrichAbove = false;
        drawTaktstrichBelow = false;
      }

      // Now draw the barline part inside the staff
      if (drawInsideStaff) {
        this.DrawBarLine(dc, yTop, yBottom, barLine, form);
        if (barLine.HasRepetitionDots()) {
          this.DrawBarLineDots(dc, staff, barLine);
        }
      }

      // ... and the barline part outside the staff
      if (drawOutsideStaff && (yBottomPrevious.value !== VRV_UNSET)) {
        // Do not erase intersections with right barline of the last measure of the system
        const eraseIntersections = !isLastMeasure || (barLine.GetPosition() !== BarLinePosition.Right);

        this.DrawBarLine(dc, yBottomPrevious.value, yTop, barLine, form, true, eraseIntersections);
      }
      yBottomPrevious.value = drawOutsideStaff ? yBottom : VRV_UNSET;

      // Draw the taktstrich above the staff
      if (drawTaktstrichAbove) {
        const yTaktstrichCenter = yStaffTop + yTaktstrichShift;
        this.DrawBarLine(dc, yTaktstrichCenter + unit, yTaktstrichCenter - unit, barLine, form);
      }

      // Draw the taktstrich below the staff
      if (drawTaktstrichBelow) {
        const yTaktstrichCenter = yStaffBottom - yTaktstrichShift;
        this.DrawBarLine(dc, yTaktstrichCenter + unit, yTaktstrichCenter - unit, barLine, form);
      }
    }
  }

  public DrawBarLine(dc: ViewPageDeviceContextLike, yTopIn: number, yBottomIn: number, barLine: ViewPageBarLineLike, form: number,
    inStaffSpace = false, eraseIntersections = false): void {
    if (!dc) throw new Error('View::DrawBarLine requires a device context.');
    if (!barLine) throw new Error('View::DrawBarLine requires a barLine.');

    let yTop = yTopIn, yBottom = yBottomIn;

    const staff = barLine.GetAncestorStaff?.(StaffSearch.ANCESTOR_ONLY, false) as ViewPageStaffLike | null;
    const staffSize = (staff) ? (staff.GetDrawingStaffNotationSize?.() ?? 100) : 100;
    const unit = this.m_doc!.GetDrawingUnit(staffSize);

    const x = barLine.GetDrawingX();
    const barLineWidth = this.m_doc!.GetDrawingBarLineWidth(staffSize);
    const barLineThickWidth = Math.trunc(unit * this.m_options!.m_thickBarlineThickness!.GetValue());
    const barLineSeparation = Math.trunc(unit * this.m_options!.m_barLineSeparation!.GetValue());
    const barLinesSum = barLineThickWidth + barLineWidth;
    let x2 = x + barLineSeparation;

    const dashLength = Math.trunc(unit * this.m_options!.m_dashedBarLineDashLength!.GetValue());
    const gapLength = Math.trunc(unit * this.m_options!.m_dashedBarLineGapLength!.GetValue());
    if (inStaffSpace && ((form === BARRENDITION_dashed) || (form === BARRENDITION_dbldashed))) {
      // Dashed lines in staff space should start with a gap
      yTop -= dashLength;
      yBottom += dashLength;
    }
    const serpentWidth = this.m_doc!.GetGlyphWidth(SMUFL_E04A_segnoSerpent1, staffSize, false);

    const line = new SegmentedLine(yTop, yBottom);
    // We do not need to do this during layout calculation
    if (eraseIntersections && !(dc as unknown as { Is?: (id: number) => boolean }).Is?.(ClassId.BBOX_DEVICE_CONTEXT)) {
      const system = barLine.GetFirstAncestor?.(ClassId.SYSTEM) as ViewPageSystemLike | null;
      if (system) {
        let minX = x - Math.trunc(barLineWidth / 2);
        let maxX = x + Math.trunc(barLineWidth / 2);
        if ((form === BARRENDITION_rptend) || (form === BARRENDITION_end)) {
          maxX = x2 + Math.trunc(barLinesSum / 2);
        }
        else if (form === BARRENDITION_heavy) {
          minX = x - Math.trunc(barLineThickWidth / 2);
          maxX = x + Math.trunc(barLineThickWidth / 2);
        }
        else if (form === BARRENDITION_rptboth) {
          maxX = x + barLinesSum + barLineSeparation * 2;
        }
        else if (form === BARRENDITION_rptstart) {
          minX = x - Math.trunc(barLineThickWidth / 2);
          maxX = x2 + Math.trunc(barLinesSum / 2);
        }
        else if ((form === BARRENDITION_dbl) || (form === BARRENDITION_dbldashed)
          || (form === BARRENDITION_dbldotted)) {
          maxX = x2 + Math.trunc(barLineWidth / 2);
        }
        else if (form === BARRENDITION_dblheavy) {
          minX = x - Math.trunc(barLineThickWidth / 2);
          maxX = x2 + Math.trunc(barLineThickWidth / 2);
        }
        // C++ view_page.cpp constructs a real `Object lines` (Object :
        // BoundingBox); the previous structural stub lacked HasContentBB and
        // crashed FindAllIntersectionPoints as soon as a CPMARK/DIR/DYNAM/
        // TEMPO positioner overlapped a barline with erased intersections.
        const lines = new VrvObject();
        lines.SetParent(system as never);
        lines.UpdateContentBBoxX(minX, maxX);
        lines.UpdateContentBBoxY(yTop, yBottom);
        const margin = Math.trunc(unit / 2);
        system.m_systemAligner?.FindAllIntersectionPoints?.(line, lines, [ClassId.CPMARK, ClassId.DIR, ClassId.DYNAM, ClassId.TEMPO], margin);
      }
    }

    switch (form) {
      case BARRENDITION_NONE: //
        // fallthrough
      case BARRENDITION_single: //
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_dashed: //
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, dashLength, gapLength);
        break;
      case BARRENDITION_dotted: //
        this.DrawVerticalDots(dc, x, line, barLineWidth, 2 * unit);
        break;
      case BARRENDITION_heavy: //
        this.DrawVerticalSegmentedLine(dc, x, line, barLineThickWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_rptend:
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, x2 + Math.trunc(barLinesSum / 2), line, barLineThickWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_rptboth:
        x2 = x + barLinesSum + barLineSeparation * 2;
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, Math.trunc((x + x2) / 2), line, barLineThickWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, x2, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_rptstart:
        this.DrawVerticalSegmentedLine(dc, x, line, barLineThickWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, x2 + Math.trunc(barLinesSum / 2), line, barLineWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_invis: //
        barLine.SetEmptyBB?.();
        break;
      case BARRENDITION_end:
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, x2 + Math.trunc(barLinesSum / 2), line, barLineThickWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_dbl:
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, x2 + barLineWidth, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_dblheavy:
        this.DrawVerticalSegmentedLine(dc, x, line, barLineThickWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, x2 + barLineThickWidth, line, barLineThickWidth, VRV_UNSET, VRV_UNSET);
        break;
      case BARRENDITION_dblsegno:
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        this.DrawVerticalSegmentedLine(dc, x2 + barLineWidth, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        this.DrawSmuflCode(dc, Math.trunc((x + (barLineSeparation + barLineWidth - serpentWidth) / 2)), yBottom,
          SMUFL_E04A_segnoSerpent1, staffSize, false);
        break;
      case BARRENDITION_dbldashed:
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, dashLength, gapLength);
        this.DrawVerticalSegmentedLine(dc, x2 + barLineWidth, line, barLineWidth, dashLength, gapLength);
        break;
      case BARRENDITION_dbldotted:
        this.DrawVerticalDots(dc, x, line, barLineWidth, 2 * unit);
        this.DrawVerticalDots(dc, x2 + barLineWidth, line, barLineWidth, 2 * unit);
        break;
      default:
        // Use solid barline as fallback
        this.DrawVerticalSegmentedLine(dc, x, line, barLineWidth, VRV_UNSET, VRV_UNSET);
        break;
    }
  }

  public DrawBarLineDots(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, barLine: ViewPageBarLineLike): void {
    if (!dc) throw new Error('View::DrawBarLineDots requires a device context.');
    if (!staff) throw new Error('View::DrawBarLineDots requires a staff.');
    if (!barLine) throw new Error('View::DrawBarLineDots requires a barLine.');

    const x = barLine.GetDrawingX();
    const dotSeparation = Math.trunc(this.m_doc!.GetDrawingUnit(100) * this.m_options!.m_repeatBarLineDotSeparation!.GetValue());
    const barLineWidth = Math.trunc(this.m_doc!.GetDrawingUnit(100) * this.m_options!.m_barLineWidth!.GetValue());
    const thickBarLineWidth = Math.trunc(this.m_doc!.GetDrawingUnit(100) * this.m_options!.m_thickBarlineThickness!.GetValue());
    const barLineSeparation = Math.trunc(this.m_doc!.GetDrawingUnit(100) * this.m_options!.m_barLineSeparation!.GetValue());
    const xShift = thickBarLineWidth + dotSeparation + barLineSeparation + barLineWidth;
    const staffSize = staff.m_drawingStaffSize;
    const dotWidth = this.m_doc!.GetGlyphWidth(SMUFL_E044_repeatDot, staffSize, false);

    const x1 = x - Math.trunc(barLineWidth / 2) - (dotSeparation + dotWidth);
    const x2 = x + xShift;

    const numDots = 3 - staff.m_drawingLines % 2; // odd => 2 dots, even => 3 dots
    const yInc = this.m_doc!.GetDrawingDoubleUnit(staffSize); // vertical distance between dots
    // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
    const yBottom = staff.GetDrawingY() - Math.imul((staff.m_drawingLines + numDots % 2) | 0, this.m_doc!.GetDrawingUnit(staffSize));
    const yTop = yBottom + (numDots - 1) * yInc;

    if (barLine.GetForm() === BARRENDITION_rptstart) {
      for (let y = yTop; y >= yBottom; y -= yInc) {
        this.DrawSmuflCode(dc, x2 - Math.trunc(thickBarLineWidth / 2), y, SMUFL_E044_repeatDot, staffSize, false);
      }
    }
    if (barLine.GetForm() === BARRENDITION_rptboth) {
      for (let y = yTop; y >= yBottom; y -= yInc) {
        this.DrawSmuflCode(
          dc, x2 + barLineSeparation + Math.trunc(barLineWidth / 2), y, SMUFL_E044_repeatDot, staffSize, false);
      }
    }
    if ((barLine.GetForm() === BARRENDITION_rptend) || (barLine.GetForm() === BARRENDITION_rptboth)) {
      for (let y = yTop; y >= yBottom; y -= yInc) {
        this.DrawSmuflCode(dc, x1, y, SMUFL_E044_repeatDot, staffSize, false);
      }
    }
  }

  public DrawMeasure(dc: ViewPageDeviceContextLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawMeasure requires a device context.');
    if (!measure) throw new Error('View::DrawMeasure requires a measure.');
    if (!system) throw new Error('View::DrawMeasure requires a system.');

    // This is a special case where we do not draw (SVG, Bounding boxes, etc.) the measure for unmeasured music
    if (measure.IsMeasuredMusic?.()) {
      dc.StartGraphic(measure, '', measure.GetID());
    }

    if (this.m_drawingScoreDef?.GetMnumVisible?.() !== BOOLEAN_false) {
      const mnum = measure.FindDescendantByType?.(ClassId.MNUM) as ViewPageMNumLike | null;
      const reh = measure.FindDescendantByType?.(ClassId.REH) as any;
      const hasRehearsal = reh
        && ((reh.HasTstamp?.() && (reh.GetTstamp() === 0.0))
          || (reh.GetStart?.()?.Is?.(ClassId.BARLINE)
            && reh.GetStart().GetPosition?.() === BarLinePosition.Left));
      if (mnum && !hasRehearsal) {
        const systemStart = system.FindDescendantByType?.(ClassId.MEASURE) as ViewPageMeasureLike | null;
        const mnumInterval = this.m_options!.m_mnumInterval!.GetValue();
        const nStr = String(measure.GetN?.() ?? '');
        const nInt = parseInt(nStr, 10);
        if ((mnumInterval === 0 && measure === systemStart && nStr !== '0' && nStr !== '1')
          || !(mnum as any).IsGenerated?.()
          || (mnumInterval >= 1 && (!isNaN(nInt) && nInt % mnumInterval === 0))) {
          let symbolOffset = this.m_doc!.GetDrawingUnit(100);
          const scoreDef = system.GetDrawingScoreDef?.() as ViewPageScoreDefLike | null;
          const groupSymbol = scoreDef?.FindDescendantByType?.(ClassId.GRPSYM) as any;
          if (groupSymbol && groupSymbol.GetSymbol?.() === staffGroupingSym_SYMBOL_bracket) {
            symbolOffset += this.m_doc!.GetGlyphHeight(SMUFL_E003_bracketTop, 100, false) + Math.trunc(this.m_doc!.GetDrawingUnit(100) / 6);
          }
          const yOffset = this.m_doc!.GetDrawingLyricFont(60).GetPointSize();
          this.DrawMNum(dc, mnum, measure, system, Math.max(symbolOffset, yOffset));
        }
      }
    }

    // Draw the measure (all its staves)
    this.DrawMeasureChildren(dc, measure, measure, system);

    // Draw the barlines only with measured music
    if (measure.IsMeasuredMusic?.()) {
      const sys = (measure.GetFirstAncestor?.(ClassId.SYSTEM) ?? system) as ViewPageSystemLike;
      const leftBarLine = (measure as any).GetLeftBarLine?.() as ViewPageBarLineLike | null;
      const rightBarLine = (measure as any).GetRightBarLine?.() as ViewPageBarLineLike | null;
      if (((measure as any).GetDrawingLeftBarLine?.() !== BARRENDITION_NONE) || (measure as any).HasInvisibleStaffBarlines?.()) {
        if (leftBarLine) {
          this.DrawScoreDef(dc, sys.GetDrawingScoreDef(), measure, leftBarLine.GetDrawingX(), leftBarLine);
        }
      }
      if (((measure as any).GetDrawingRightBarLine?.() !== BARRENDITION_NONE) || (measure as any).HasInvisibleStaffBarlines?.()) {
        if (rightBarLine) {
          this.DrawScoreDef(
            dc, sys.GetDrawingScoreDef(), measure, rightBarLine.GetDrawingX(), rightBarLine,
            measure.IsLastInSystem?.() ?? false, sys.IsLastOfMdiv?.() ?? false);
        }
      }
    }

    if (measure.IsMeasuredMusic?.()) {
      dc.EndGraphic(measure, this);
    }

    if ((measure as any).GetDrawingEnding?.()) {
      system.AddToDrawingList?.((measure as any).GetDrawingEnding());
    }
  }

  public DrawMeterSigGrp(dc: ViewPageDeviceContextLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike): void {
    if (!dc) throw new Error('View::DrawMeterSigGrp requires a device context.');
    if (!layer) throw new Error('View::DrawMeterSigGrp requires a layer.');
    if (!staff) throw new Error('View::DrawMeterSigGrp requires a staff.');

    const showHidden = (this.m_options!.m_showHidden!.GetValue());

    const meterSigGrp = layer.GetStaffDefMeterSigGrp?.() as ViewPageMeterSigGrpLike | null;
    if (!meterSigGrp) throw new Error('View::DrawMeterSigGrp requires a meterSigGrp.');
    let childList: ViewPageObjectLike[] = meterSigGrp.GetList?.() ?? [];

    // Ignore invisible meter signatures and those without count
    childList = childList.filter((object) => {
      const meterSig = object as ViewPageMeterSigLike;
      if (!meterSig) throw new Error('View::DrawMeterSigGrp requires a meterSig.');
      return !((!showHidden && (meterSig.GetVisible?.() === BOOLEAN_false)) || !meterSig.HasCount?.());
    });

    const glyphSize = staff.GetDrawingStaffNotationSize();

    const unit = this.m_doc!.GetDrawingUnit(glyphSize);
    let offset = 0;
    dc.StartGraphic(meterSigGrp, '', meterSigGrp.GetID());
    // Draw meterSigGrp by alternating meterSig and plus sign (when required)
    for (let idx = 0; idx < childList.length; ++idx) {
      const meterSig = childList[idx] as ViewPageMeterSigLike;
      if (!meterSig) throw new Error('View::DrawMeterSigGrp requires a meterSig.');
      (this as unknown as { DrawMeterSig?(dc: unknown, m: unknown, s: unknown, o: number): void }).DrawMeterSig?.(dc, meterSig, staff, offset);

      const y = staff.GetDrawingY() - Math.imul(unit, (staff.m_drawingLines - 1) | 0);
      const x = meterSig.GetDrawingX() + offset;
      const width = (meterSig.GetContentRight?.() ?? 0) - (meterSig.GetContentLeft?.() ?? 0);
      if ((meterSigGrp.GetFunc?.() === meterSigGrpLog_FUNC_mixed) && (idx !== childList.length - 1)) {
        // draw plus sign here
        const plusX = x + width + Math.trunc(unit / 2);
        this.DrawSmuflCode(dc, plusX, y, SMUFL_E08C_timeSigPlus, glyphSize, false);
        offset += width + unit + this.m_doc!.GetGlyphWidth(SMUFL_E08C_timeSigPlus, glyphSize, false);
      }
      else {
        offset += width + unit;
      }
    }

    dc.EndGraphic(meterSigGrp, this);
  }

  public DrawMNum(dc: ViewPageDeviceContextLike, mnum: ViewPageMNumLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike, yOffset: number): void {
    if (!dc) throw new Error('View::DrawMNum requires a device context.');
    if (!measure) throw new Error('View::DrawMNum requires a measure.');
    if (!mnum) throw new Error('View::DrawMNum requires an mnum.');

    const staff = system.GetTopVisibleStaff?.(true) as ViewPageStaffLike | null;
    if (staff) {
      // Only one FloatingPositioner on the top (visible) staff
      if (!system.SetCurrentFloatingPositioner?.(staff.GetN?.() as number, mnum, staff, staff)) {
        return;
      }

      dc.StartGraphic(mnum, '', mnum.GetID());

      const mnumTxt = new FontInfo();
      if (!dc.UseGlobalStyling()) {
        mnumTxt.SetFaceName((this.m_doc!.GetResources() as { GetTextFont(): string }).GetTextFont());
        mnumTxt.SetStyle(FONTSTYLE_italic);
      }

      const params = new TextDrawingParams();

      let alignment = mnum.GetChildRendAlignment?.() as number;
      // mNum are center aligned by default
      if (alignment === HORIZONTALALIGNMENT_NONE) alignment = HORIZONTALALIGNMENT_center;

      // HARDCODED
      // we set mNum to a fixed height above the system and make it a bit smaller than other text
      params.m_x = measure.GetDrawingX();
      params.m_y = staff.GetDrawingY() + yOffset;
      params.m_staffSize = staff.m_drawingStaffSize;
      const basePointSize = this.m_doc!.GetDrawingLyricFont!(staff.m_drawingStaffSize).GetPointSize();
      if (mnum.HasFontsize?.()) {
        const fs = mnum.GetFontsizeAlternate?.() as { GetType(): number; GetPercentForTerm(): number; GetPercent(): number } | null;
        if (!fs) throw new Error('View::DrawMNum requires a fontsize.');
        if (fs.GetType() === FONTSIZE_fontSizeNumeric) {
          mnumTxt.SetPointSize(this.ConvertFontSizeNumeric(fs as never, staff.m_drawingStaffSize));
        }
        else if (fs.GetType() === FONTSIZE_term) {
          const percent = fs.GetPercentForTerm();
          mnumTxt.SetPointSize(basePointSize * percent / 100);
        }
        else if (fs.GetType() === FONTSIZE_percent) {
          mnumTxt.SetPointSize(basePointSize * fs.GetPercent() / 100);
        }
      }
      else {
        mnumTxt.SetPointSize(this.m_doc!.GetDrawingLyricFont!(80).GetPointSize());
      }
      params.m_pointSize = mnumTxt.GetPointSize();

      dc.SetFont(mnumTxt);

      dc.StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), alignment);
      (this as unknown as ViewTextDrawSeam).DrawTextChildren(dc, mnum, params);
      dc.EndText();

      dc.ResetFont();

      (this as unknown as { DrawTextEnclosure?(dc: unknown, params: unknown, staffSize: number): void }).DrawTextEnclosure?.(dc, params, staff.m_drawingStaffSize);

      dc.EndGraphic(mnum, this);
    }
  }

  public DrawOssia(dc: ViewPageDeviceContextLike, ossia: ViewPageOssiaLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawOssia requires a device context.');
    if (!ossia) throw new Error('View::DrawOssia requires an ossia.');
    if (!measure) throw new Error('View::DrawOssia requires a measure.');
    if (!system) throw new Error('View::DrawOssia requires a system.');

    dc.StartGraphic(ossia, '', ossia.GetID());

    const topOStaff = ossia.GetDrawingTopOStaff?.() as ViewPageStaffLike | null;
    const bottomOStaff = ossia.GetDrawingBottopOStaff?.() as ViewPageStaffLike | null;

    // Draw scoreDef line and brace
    if (ossia.IsFirst?.() && ossia.DrawScoreDef?.() && ossia.HasMultipleOStaves?.()) {
      if (topOStaff && bottomOStaff) {
        const staffSize = bottomOStaff.m_drawingStaffSize;
        const x = topOStaff.GetDrawingX() + (topOStaff.GetOssiaDrawingShift?.(measure, this.m_doc) as number);
        const y1 = topOStaff.GetDrawingY();
        const doubleUnit = this.m_doc!.GetDrawingDoubleUnit(staffSize);
        const y2 = bottomOStaff.GetDrawingY() - Math.imul(doubleUnit, (bottomOStaff.m_drawingLines - 1) | 0);
        // Bar lines always 100
        const barLineWidth = this.m_doc!.GetDrawingBarLineWidth(100);
        this.DrawVerticalLine(dc, y1, y2, x + Math.trunc(barLineWidth / 2), barLineWidth, VRV_UNSET, VRV_UNSET);
        this.DrawBrace(dc, x, y1, y2, staffSize, false);
      }
    }

    for (const child of ossia.GetChildren?.() ?? []) {
      if (child.Is?.(ClassId.STAFF)) {
        this.DrawStaff(dc, child as ViewPageStaffLike, measure, system);
      }
      else {
        throw new Error('View::DrawOssia: unsupported ossia child.');
      }
    }

    // No bar lines to draw if we have no ossia staves (e.g., all hidden)
    if (!topOStaff || !bottomOStaff) {
      dc.EndGraphic(ossia, this);
      return;
    }

    const showBarLines = ossia.HasShowBarLines?.() ? (ossia.GetShowBarLines?.() === BOOLEAN_true) : false;
    const showForceLeft = (showBarLines && ossia.IsFirst?.() && (measure.GetDrawingLeftBarLine?.() === BARRENDITION_NONE));

    // Draw bar lines
    if (measure.GetDrawingLeftBarLine?.() !== BARRENDITION_NONE) {
      const yBottomPrevious = { value: VRV_UNSET };
      const barLine = measure.GetLeftBarLine?.() as ViewPageBarLineLike;
      if (!barLine) throw new Error('View::DrawOssia requires a left barLine.');
      dc.StartGraphic(barLine, '', barLine.GetID());
      this.DrawBarLines(dc, measure, ossia.GetDrawingStaffGrp?.() as ViewPageStaffGrpLike, barLine, measure.IsLastInSystem?.() as boolean,
        system.IsLastOfMdiv?.() as boolean, yBottomPrevious);
      dc.EndGraphic(barLine, this);
    }
    if ((showBarLines || !ossia.IsLast?.()) && (measure.GetDrawingRightBarLine?.() !== BARRENDITION_NONE)) {
      const yBottomPrevious = { value: VRV_UNSET };
      const barLine = measure.GetRightBarLine?.() as ViewPageBarLineLike;
      if (!barLine) throw new Error('View::DrawOssia requires a right barLine.');
      dc.StartGraphic(barLine, '', barLine.GetID());
      this.DrawBarLines(dc, measure, ossia.GetDrawingStaffGrp?.() as ViewPageStaffGrpLike, barLine, measure.IsLastInSystem?.() as boolean,
        system.IsLastOfMdiv?.() as boolean, yBottomPrevious);
      dc.EndGraphic(barLine, this);
    }

    if (showForceLeft) {
      const yBottomPrevious = { value: VRV_UNSET };
      // Use the ossia drawing barline it that case
      const barLine = ossia.GetDrawingLeftBarLine?.() as ViewPageBarLineLike;
      if (!barLine) throw new Error('View::DrawOssia requires a drawing left barLine.');
      dc.StartGraphic(barLine, '', barLine.GetID());
      this.DrawBarLines(dc, measure, ossia.GetDrawingStaffGrp?.() as ViewPageStaffGrpLike, barLine, measure.IsLastInSystem?.() as boolean,
        system.IsLastOfMdiv?.() as boolean, yBottomPrevious);
      dc.EndGraphic(barLine, this);
    }

    dc.EndGraphic(ossia, this);
  }

  public DrawStaff(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawStaff requires a device context.');
    if (!staff) throw new Error('View::DrawStaff requires a staff.');
    if (!measure) throw new Error('View::DrawStaff requires a measure.');
    if (!system) throw new Error('View::DrawStaff requires a system.');

    if (staff.IsHidden?.()) return;

    const drawingScoreDef = system.GetDrawingScoreDef?.() as ViewPageScoreDefLike | null;
    if (!drawingScoreDef) throw new Error('View::DrawStaff requires a drawing scoreDef.');
    const staffDef = drawingScoreDef.GetStaffDef?.(staff.GetN?.() as number) as ViewPageStaffDefLike | null;
    if (staffDef && (staffDef.GetDrawingVisibility?.() === OPTIMIZATION_HIDDEN)) {
      return;
    }

    dc.StartGraphic(staff, '', staff.GetID());

    if (this.m_doc!.IsFacs?.()) {
      (staff as unknown as { SetFromFacsimile(d: unknown): void }).SetFromFacsimile(this.m_doc);
    }

    const mrest = staff.FindDescendantByType?.(ClassId.MREST) as ViewPageMRestLike | null;
    if (!mrest || mrest.GetCutout?.() !== cutout_CUTOUT_cutout) {
      this.DrawStaffLines(dc, staff, staffDef, measure, system);
    }

    if (staffDef && (this.m_doc!.GetType?.() !== FacsType)) {
      this.DrawStaffDef(dc, staff, measure);
    }

    if ((staff.GetLedgerLinesAbove?.() ?? []).length > 0) {
      this.DrawLedgerLines(dc, staff, staff.GetLedgerLinesAbove?.() ?? [], false, false);
    }
    if ((staff.GetLedgerLinesBelow?.() ?? []).length > 0) {
      this.DrawLedgerLines(dc, staff, staff.GetLedgerLinesBelow?.() ?? [], true, false);
    }
    if ((staff.GetLedgerLinesAboveCue?.() ?? []).length > 0) {
      this.DrawLedgerLines(dc, staff, staff.GetLedgerLinesAboveCue?.() ?? [], false, true);
    }
    if ((staff.GetLedgerLinesBelowCue?.() ?? []).length > 0) {
      this.DrawLedgerLines(dc, staff, staff.GetLedgerLinesBelowCue?.() ?? [], true, true);
    }

    this.DrawStaffChildren(dc, staff, staff, measure);

    this.DrawStaffDefCautionary(dc, staff, measure);

    for (const spanningElement of staff.m_timeSpanningElements ?? []) {
      system.AddToDrawingListIfNecessary?.(spanningElement);
    }

    dc.EndGraphic(staff, this);
  }

  public DrawStaffLines(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, staffDef: ViewPageStaffDefLike | null, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawStaffLines requires a device context.');
    if (!staff) throw new Error('View::DrawStaffLines requires a staff.');
    if (!staffDef) throw new Error('View::DrawStaffLines requires a staffDef.');
    if (!measure) throw new Error('View::DrawStaffLines requires a measure.');
    if (!system) throw new Error('View::DrawStaffLines requires a system.');

    // If German lute tablature the default is @lines.visible="false", but setting @lines.visible="true"
    // will draw the staff lines.
    const gltLines = (staff.IsTabLuteGerman?.() && staffDef.GetLinesVisible?.() !== BOOLEAN_true);
    // For anything other than German lute tablature the default is @lines.visible="true"
    const visibleLines = (staffDef.GetLinesVisible?.() !== BOOLEAN_false);

    // Nothing to do if both are false
    if (!gltLines && !visibleLines) return;

    let x1: number, x2: number, y1: number, y2: number;

    x1 = measure.GetDrawingX();
    x2 = x1 + (measure.GetWidth?.() as number);
    if (staff.IsOssia?.()) {
      const shift = staff.GetOssiaDrawingShift?.(measure, this.m_doc) as number;
      x1 += shift;
    }
    y1 = staff.GetDrawingY();
    if (!staff.HasDrawingRotation?.()) {
      y2 = y1;
    }
    else {
      y2 = y1 - (measure.GetWidth?.() as number) * Math.tan((staff.GetDrawingRotation?.() as number) * Math.PI / 180.0);
    }

    const lineWidth = this.m_doc!.GetDrawingStaffLineWidth(staff.m_drawingStaffSize);
    dc.SetPen(this.ToDeviceContextX(lineWidth), PenStyle.PEN_SOLID);

    // If German lute tablature the default is @lines.visible="false", but setting @lines.visible="true"
    // will draw the staff lines.
    // For anything other than German lute tablature the default is @lines.visible="true"
    if (gltLines) {
      // German tablature has no staff, just a single base line
      // But internally we maintain the fiction of an invisible staff as a coordinate system
      const line = new SegmentedLine(x1, x2);
      // Issue #3589 move base line slightly further down and reduce thickness
      y1 -= Math.trunc((this.m_doc!.GetDrawingDoubleUnit(staff.m_drawingStaffSize) * staff.m_drawingLines) * 11 / 10);
      this.DrawHorizontalSegmentedLine(dc, y1, line, Math.trunc(lineWidth / 2), VRV_UNSET, VRV_UNSET);
    }
    // Normal staff lines
    else {
      // draw staff lines
      for (let j = 0; j < staff.m_drawingLines; ++j) {
        // Skewed lines - with Facs (neumes) only for now
        if (y1 !== y2) {
          dc.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2),
            this.ToDeviceContextY(y2));
          // For drawing rectangles instead of lines
          y1 -= this.m_doc!.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
          y2 -= this.m_doc!.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
        }
        else {
          const isFrenchOrGermanOrItalianTablature
            = (staff.IsTabLuteFrench?.() || staff.IsTabLuteGerman?.() || staff.IsTabLuteItalian?.());
          const line = new SegmentedLine(x1, x2);
          // We do not need to do this during layout calculation - and only with guitar tablature but not for
          // French, German or Italian lute tablature
          if (!dc.Is(ClassId.BBOX_DEVICE_CONTEXT) && staff.IsTablature?.() && !isFrenchOrGermanOrItalianTablature) {
            // C++ view_page.cpp:1394 constructs a real `Object fullLine` (Object :
            // BoundingBox), so VerticalContentOverlap/UpdateContentBBox*/SetParent
            // dispatch virtually. The previous structural stub lacked those methods.
            const fullLine = new VrvObject();
            fullLine.SetParent(system as never);
            fullLine.UpdateContentBBoxY(y1 + Math.trunc(lineWidth / 2), y1 - Math.trunc(lineWidth / 2));
            fullLine.UpdateContentBBoxX(x1, x2);
            const margin = Math.trunc(this.m_doc!.GetDrawingUnit(100) / 2);
            const notes = staff.FindAllDescendantsByType?.(ClassId.NOTE, false) ?? [];
            for (const note of notes) {
              if ((note as unknown as { VerticalContentOverlap(l: unknown, m: number): boolean }).VerticalContentOverlap(fullLine, Math.trunc(margin / 2))) {
                line.AddGap(note.GetContentLeft?.()! - margin, note.GetContentRight?.()! + margin);
              }
            }
          }
          this.DrawHorizontalSegmentedLine(dc, y1, line, lineWidth, VRV_UNSET, VRV_UNSET);
          y1 -= this.m_doc!.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
          y2 = y1;
        }
      }
    }

    dc.ResetPen();

    return;
  }

  public DrawLedgerLines(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, lines: ViewPageLedgerLineLike[], below: boolean, cueSize: boolean): void {
    if (!dc) throw new Error('View::DrawLedgerLines requires a device context.');
    if (!staff) throw new Error('View::DrawLedgerLines requires a staff.');

    let gClass = 'above';
    let y = staff.GetDrawingY();
    const x = staff.GetDrawingX();
    let ySpace = this.m_doc!.GetDrawingDoubleUnit(staff.m_drawingStaffSize);

    if (below) {
      gClass = 'below';
      ySpace *= -1;
      y += Math.imul(ySpace, (staff.m_drawingLines - 1) | 0);
    }
    y += ySpace;

    if (cueSize) {
      gClass += ' cue';
    }

    dc.StartCustomGraphic('ledgerLines', gClass);

    let lineWidth
      = this.m_options!.m_ledgerLineThickness!.GetValue() * this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
    if (cueSize) lineWidth *= this.m_options!.m_graceFactor!.GetValue();

    dc.SetPen(this.ToDeviceContextX(lineWidth), PenStyle.PEN_SOLID);

    const svgHtml5 = (this.m_options!.m_svgHtml5!.GetValue());

    for (const line of lines) {
      for (const dash of line.m_dashes) {
        if (svgHtml5) {
          // Add the custom graphic only with html5
          dc.StartCustomGraphic('lineDash');
          const events = ConcatenateIDs((dash.m_events ?? []) as { GetID(): string }[]);
          dc.SetCustomGraphicAttributes?.('related', events);
        }

        dc.DrawLine(this.ToDeviceContextX(x + dash.m_x1), this.ToDeviceContextY(y),
          this.ToDeviceContextX(x + dash.m_x2), this.ToDeviceContextY(y));

        if (svgHtml5) dc.EndCustomGraphic();
      }
      y += ySpace;
    }

    dc.ResetPen();

    dc.EndCustomGraphic();
  }

  public DrawStaffDef(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawStaffDef requires a device context.');
    if (!staff) throw new Error('View::DrawStaffDef requires a staff.');
    if (!measure) throw new Error('View::DrawStaffDef requires a measure.');

    // StaffDef information is always in the first layer
    const layer = staff.FindDescendantByType?.(ClassId.LAYER) as ViewPageLayerLike | null;
    if (!layer || !layer.HasStaffDef?.()) return;

    // StaffDef staffDef;
    // dc->StartGraphic(&staffDef, "", staffDef.GetID());

    // draw the scoreDef if required
    if (layer.GetStaffDefClef?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetStaffDefClef?.(), layer, staff, measure);
    }
    if (layer.GetStaffDefKeySig?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetStaffDefKeySig?.(), layer, staff, measure);
    }
    if (layer.GetStaffDefMensur?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetStaffDefMensur?.(), layer, staff, measure);
    }
    if (layer.GetStaffDefMeterSigGrp?.()) {
      this.DrawMeterSigGrp(dc, layer, staff);
    }
    else if (layer.GetStaffDefMeterSig?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetStaffDefMeterSig?.(), layer, staff, measure);
    }

    // dc->EndGraphic(&staffDef, this);
  }

  public DrawStaffDefCautionary(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawStaffDefCautionary requires a device context.');
    if (!staff) throw new Error('View::DrawStaffDefCautionary requires a staff.');
    if (!measure) throw new Error('View::DrawStaffDefCautionary requires a measure.');

    // StaffDef cautionary information is always in the first layer
    const layer = staff.FindDescendantByType?.(ClassId.LAYER) as ViewPageLayerLike | null;
    if (!layer || !layer.HasCautionStaffDef?.()) return;

    // StaffDef staffDef;
    // dc->StartGraphic(&staffDef, "cautionary", staffDef.GetID());

    // draw the scoreDef if required
    if (layer.GetCautionStaffDefClef?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetCautionStaffDefClef?.(), layer, staff, measure);
    }
    if (layer.GetCautionStaffDefKeySig?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetCautionStaffDefKeySig?.(), layer, staff, measure);
    }
    if (layer.GetCautionStaffDefMensur?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetCautionStaffDefMensur?.(), layer, staff, measure);
    }
    if (layer.GetCautionStaffDefMeterSig?.()) {
      (this as unknown as ViewElementDrawSeam).DrawLayerElement(dc, layer.GetCautionStaffDefMeterSig?.(), layer, staff, measure);
    }

    // dc->EndGraphic(&staffDef, this);
  }

  public CalculatePitchCode(layer: ViewPageLayerLike, y_nIn: number, x_pos: number, octave: { value: number }): number {
    if (!layer) throw new Error('View::CalculatePitchCode requires a layer.');
    if (!octave) throw new Error('View::CalculatePitchCode requires an octave reference.');

    const parentStaff = layer.GetFirstAncestor?.(ClassId.STAFF) as ViewPageStaffLike | null;
    if (!parentStaff) throw new Error('View::CalculatePitchCode requires a parent staff.');

    const touches = [PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b];
    let y_dec: number, yb: number, plafond: number;
    let degres: number, octaves: number, position: number, code: number;

    const staffSize = parentStaff.m_drawingStaffSize;
    // calculer position du do central en fonction clef
    // y_n += (int) m_doc->GetDrawingUnit(staffSize) / 4;
    yb = parentStaff.GetDrawingY() - this.m_doc!.GetDrawingStaffSize(staffSize); // UT1 default

    plafond = yb + 8 * this.m_doc!.GetDrawingOctaveSize(staffSize);
    let y_n = y_nIn;
    if (y_n > plafond) y_n = plafond;

    let pelement = layer.GetAtPos(x_pos);
    const previous = layer.GetPreviousInLayer(pelement);
    if (previous) pelement = previous;

    const clef = layer.GetClef(pelement);
    if (clef) {
      yb += (clef as unknown as { GetClefLocOffset(): number }).GetClefLocOffset() * this.m_doc!.GetDrawingUnit(staffSize); // UT1 reel
    }
    yb -= 4 * this.m_doc!.GetDrawingOctaveSize(staffSize); // UT, note la plus grave

    y_dec = y_n - yb; // decalage par rapport a UT le plus grave

    if (y_dec < 0) y_dec = 0;

    degres = Math.trunc(y_dec / this.m_doc!.GetDrawingUnit(staffSize)); // ecart en degres (PITCHNAME_c..PITCHNAME_b) par rapport a UT1
    octaves = Math.trunc(degres / 7);
    position = degres % 7;

    code = touches[position];
    octave.value = octaves; // oct 0 ‡ 7

    return (code);
  }

  public DrawLayer(dc: ViewPageDeviceContextLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawLayer requires a device context.');
    if (!layer) throw new Error('View::DrawLayer requires a layer.');
    if (!staff) throw new Error('View::DrawLayer requires a staff.');
    if (!measure) throw new Error('View::DrawLayer requires a measure.');

    // first we need to clear the drawing list of postponed elements
    layer.ResetDrawingList();

    // Now start to draw the layer content

    dc.StartGraphic(layer, '', layer.GetID());

    this.DrawLayerChildren(dc, layer, layer, staff, measure);

    if (layer.HasCursor()) {
      const cursor = layer.GetCursor() as unknown as { m_x: number; m_y: number; GetID(): string } | null;
      if (!cursor) throw new Error('View::DrawLayer: cursor required');
      const fakeLayer = layer as unknown as { m_parent?: { AddChild(c: unknown): unknown } };
      (this as unknown as { DrawCursor?(dc: unknown, cursor: unknown, layer: unknown, staff: unknown, measure: unknown): void }).DrawCursor?.(dc, cursor, layer, staff, measure);
    }

    dc.EndGraphic(layer, this);

    // first draw the postponed tuplets
    this.DrawLayerList(dc, layer, staff, measure, ClassId.TUPLET_BRACKET);
    this.DrawLayerList(dc, layer, staff, measure, ClassId.TUPLET_NUM);
  }

  public DrawLayerList(dc: ViewPageDeviceContextLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike, classId: number): void {
    if (!dc) throw new Error('View::DrawLayerList requires a device context.');
    if (!layer) throw new Error('View::DrawLayerList requires a layer.');
    if (!staff) throw new Error('View::DrawLayerList requires a staff.');
    if (!measure) throw new Error('View::DrawLayerList requires a measure.');

    const drawingList = layer.GetDrawingList();

    for (const object of drawingList) {
      if (object.Is?.(classId) && (classId === ClassId.TUPLET_BRACKET)) {
        this.DrawTupletBracket(dc, object as unknown as ViewTupletBracketLike, layer as unknown as ViewObjectLike, staff as unknown as ViewPageStaffLike, measure as unknown as ViewObjectLike);
      }
      if (object.Is?.(classId) && (classId === ClassId.TUPLET_NUM)) {
        this.DrawTupletNum(dc, object as unknown as ViewTupletNumLike, layer as unknown as ViewObjectLike, staff as unknown as ViewPageStaffLike, measure as unknown as ViewObjectLike);
      }
    }
  }

  public DrawSystemDivider(dc: ViewPageDeviceContextLike, system: ViewPageSystemLike, firstMeasure: ViewPageMeasureLike | null): void {
    if (!dc) throw new Error('View::DrawSystemDivider requires a device context.');
    if (!system) throw new Error('View::DrawSystemDivider requires a system.');

    // Draw system divider (from the second one) if scoreDef is optimized
    if (!firstMeasure || (this.m_options!.m_systemDivider!.GetValue() === SYSTEMDIVIDER_none)) return;
    // No system divider if we are on the first system of a page or of an mdiv
    if (system.IsFirstInPage() || system.IsFirstOfMdiv()) return;

    // initialize to zero, first measure is not supposed to have system divider
    let previousSystemBottomMarginY = 0;
    const currentPage = system.GetFirstAncestor?.(ClassId.PAGE);
    if (currentPage) {
      const previousSystem = (currentPage as unknown as { GetPrevious?(o: unknown): ViewPageSystemLike | null }).GetPrevious?.(system);
      if (previousSystem) {
        const previousSystemMeasure = previousSystem.FindDescendantByType?.(ClassId.MEASURE, 1) as ViewPageMeasureLike | null;
        if (previousSystemMeasure) {
          const bottomStaff = previousSystemMeasure.GetBottomVisibleStaff?.() ?? null;
          // set Y position to that of lowest (bottom) staff, substact space taken by staff lines and
          // substract offset of the system divider symbol itself (added to y2 and y4)
          if (bottomStaff) {
            previousSystemBottomMarginY = bottomStaff.GetDrawingY()
              - Math.imul((bottomStaff.m_drawingLines - 1) | 0,
                this.m_doc!.GetDrawingDoubleUnit(bottomStaff.m_drawingStaffSize))
              - this.m_doc!.GetDrawingUnit(100) * 5;
          }
        }
      }
    }

    const SYSTEMDIVIDER_left_right_local = SYSTEMDIVIDER_left_right;
    if ((system.IsDrawingOptimized() || (this.m_options!.m_systemDivider!.GetValue() > SYSTEMDIVIDER_auto))) {
      let y = system.GetDrawingY();
      const staff = system.GetTopVisibleStaff(true);
      if (staff) {
        // Place it in the middle of current and previous systems - in very tight layout this can collision with
        // the staff above. To be improved
        y = Math.trunc((staff.GetDrawingY() + previousSystemBottomMarginY) / 2);
      }
      const x1 = system.GetDrawingX() - this.m_doc!.GetDrawingUnit(100) * 3;
      const x2 = system.GetDrawingX() + this.m_doc!.GetDrawingUnit(100) * 3;
      const y1 = y - this.m_doc!.GetDrawingUnit(100) * 1;
      const y2 = y + this.m_doc!.GetDrawingUnit(100) * 3;
      const y3 = y1 + this.m_doc!.GetDrawingUnit(100) * 2;
      const y4 = y2 + this.m_doc!.GetDrawingUnit(100) * 2;
      // left and left-right
      dc.StartCustomGraphic('systemDivider');

      this.DrawObliquePolygon(dc, x1, y1, x2, y2, Math.trunc(this.m_doc!.GetDrawingUnit(100) * 1.5));
      this.DrawObliquePolygon(dc, x1, y3, x2, y4, Math.trunc(this.m_doc!.GetDrawingUnit(100) * 1.5));
      if (this.m_options!.m_systemDivider!.GetValue() === SYSTEMDIVIDER_left_right_local) {
        // Right divider is not taken into account in the layout calculation and can collision with the music
        // content
        const lastMeasure = system.FindDescendantByType?.(ClassId.MEASURE, 1, BACKWARD) as ViewPageMeasureLike | null;
        if (!lastMeasure) throw new Error('View::DrawSystemDivider: lastMeasure required');
        const x4 = lastMeasure.GetDrawingX() + (lastMeasure.GetRightBarLineRight?.() ?? 0);
        const x3 = x4 - this.m_doc!.GetDrawingUnit(100) * 6;
        this.DrawObliquePolygon(dc, x3, y1, x4, y2, Math.trunc(this.m_doc!.GetDrawingUnit(100) * 1.5));
        this.DrawObliquePolygon(dc, x3, y3, x4, y4, Math.trunc(this.m_doc!.GetDrawingUnit(100) * 1.5));
      }

      dc.EndCustomGraphic();
    }
  }

  // =========================================================================
  // view_page.cpp — Pass 323 Children
  // =========================================================================

  public DrawSystemChildren(dc: ViewPageDeviceContextLike, parent: ViewPageObjectLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawSystemChildren requires a device context.');
    if (!parent) throw new Error('View::DrawSystemChildren requires a parent.');
    if (!system) throw new Error('View::DrawSystemChildren requires a system.');

    for (const current of parent.GetChildrenForModification?.() ?? parent.GetChildren?.() ?? []) {
      if (current.Is?.(ClassId.MEASURE)) {
        // cast to Measure check in DrawMeasure
        this.DrawMeasure(dc, current as unknown as ViewPageMeasureLike, system);
      }
      // scoreDef are not drawn directly, but anything else should not be possible
      else if (current.Is?.(ClassId.SCOREDEF)) {
        // nothing to do, then
        const scoreDef = current as ViewPageScoreDefLike;

        const nextMeasure = system.GetNext?.(scoreDef, ClassId.MEASURE) as ViewPageMeasureLike | null;
        if (nextMeasure && scoreDef.DrawLabels?.()) {
          let scoreDefToDraw = scoreDef;
          let noLabels = false;
          // If we have an emprty scoreDef after a section with `@restart="true"`
          // still draw the staffGrp symbols (braces, bracket) but no labels - use the system scoreDef for that
          if ((scoreDef.GetChildCount?.() ?? 0) === 0) {
            scoreDefToDraw = system.GetDrawingScoreDef();
            noLabels = true;
          }
          this.DrawScoreDef(
            dc, scoreDefToDraw, nextMeasure, nextMeasure.GetDrawingX(), null, false, false, noLabels);
        }

        this.SetScoreDefDrawingWidth(dc, scoreDef);
      }
      else if (current.IsSystemElement?.()) {
        // cast to SystemElement check in DrawSystemEditorial element
        (this as unknown as { DrawSystemElement(dc: unknown, element: unknown, system: unknown): void }).DrawSystemElement?.(dc, current, system);
      }
      else if (current.Is?.(ClassId.DIV)) {
        // cast to Div check in DrawDiv element
        this.DrawDiv(dc, current as unknown as ViewTextLayoutElementLike, system);
      }
      else if (current.IsEditorialElement?.()) {
        // cast to EditorialElement check in DrawSystemEditorial element
        this.DrawSystemEditorialElement(dc, current, system);
      }
      else {
        throw new Error('View::DrawSystemChildren: unexpected system child.');
      }
    }
  }

  public DrawMeasureChildren(dc: ViewPageDeviceContextLike, parent: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawMeasureChildren requires a device context.');
    if (!parent) throw new Error('View::DrawMeasureChildren requires a parent.');
    if (!measure) throw new Error('View::DrawMeasureChildren requires a measure.');
    if (!system) throw new Error('View::DrawMeasureChildren requires a system.');

    const objects = parent.FindAllDescendantsByType?.(ClassId.BEAMSPAN, false) ?? [];
    for (const element of objects) {
      const beamSpan = element as unknown as { GetSegmentForSystem(s: unknown): { CalcBeam(l: unknown, st: unknown, d: unknown, b: unknown, p: number): void; GetLayer(): unknown; GetStaff(): unknown } | null; m_drawingPlace: number };
      const segment = beamSpan.GetSegmentForSystem(system);
      if (segment) {
        segment.CalcBeam(segment.GetLayer(), segment.GetStaff(), this.m_doc, beamSpan, beamSpan.m_drawingPlace);
      }
    }

    for (const current of parent.GetChildrenForModification?.() ?? parent.GetChildren?.() ?? []) {
      if (current.Is?.(ClassId.OSSIA)) {
        this.DrawOssia(dc, current, measure, system);
      }
      else if (current.Is?.(ClassId.STAFF)) {
        // cast to Staff check in DrawStaff
        this.DrawStaff(dc, current as ViewPageStaffLike, measure, system);
      }
      else if (current.IsControlElement?.()) {
        // cast to ControlElement check in DrawControlElement
        (this as unknown as { DrawControlElement?(d: unknown, c: unknown, m: unknown, s: unknown): void }).DrawControlElement?.(dc, current, measure, system);
      }
      else if (current.IsEditorialElement?.()) {
        // cast to EditorialElement check in DrawMeasureEditorialElement
        this.DrawMeasureEditorialElement(dc, current, measure, system);
      }
      else {
        throw new Error(`View::DrawMeasureChildren: unexpected measure child ${String((current as unknown as { GetClassName?(): string }).GetClassName?.())}`);
      }
    }
  }

  public DrawStaffChildren(dc: ViewPageDeviceContextLike, parent: ViewPageObjectLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawStaffChildren requires a device context.');
    if (!parent) throw new Error('View::DrawStaffChildren requires a parent.');
    if (!staff) throw new Error('View::DrawStaffChildren requires a staff.');
    if (!measure) throw new Error('View::DrawStaffChildren requires a measure.');

    for (const current of parent.GetChildrenForModification?.() ?? parent.GetChildren?.() ?? []) {
      if (current.Is?.(ClassId.LAYER)) {
        // cast to Layer check in DrawLayer
        this.DrawLayer(dc, current as ViewPageLayerLike, staff, measure);
      }
      else if (current.IsEditorialElement?.()) {
        // cast to EditorialElement check in DrawStaffEditorialElement
        this.DrawStaffEditorialElement(dc, current, staff, measure);
      }
      else {
        throw new Error('View::DrawStaffChildren: unexpected staff child.');
      }
    }
  }

  public DrawLayerChildren(dc: ViewPageDeviceContextLike, parent: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawLayerChildren requires a device context.');
    if (!parent) throw new Error('View::DrawLayerChildren requires a parent.');
    if (!layer) throw new Error('View::DrawLayerChildren requires a layer.');
    if (!staff) throw new Error('View::DrawLayerChildren requires a staff.');
    if (!measure) throw new Error('View::DrawLayerChildren requires a measure.');

    for (const current of parent.GetChildrenForModification?.() ?? parent.GetChildren?.() ?? []) {
      if (current.IsLayerElement?.()) {
        (this as unknown as { DrawLayerElement?(d: unknown, e: unknown, l: unknown, st: unknown, m: unknown): void }).DrawLayerElement?.(dc, current, layer, staff, measure);
      }
      else if (current.IsEditorialElement?.()) {
        // cast to EditorialElement check in DrawLayerEditorialElement
        this.DrawLayerEditorialElement(dc, current, layer, staff, measure);
      }
      else if (!current.IsAnyOf?.([ClassId.LABEL, ClassId.LABELABBR])) {
        throw new Error('View::DrawLayerChildren: unexpected layer child.');
      }
    }
  }

  public DrawTextChildren(dc: ViewPageDeviceContextLike, parent: ViewPageObjectLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawTextChildren requires a device context.');
    if (!parent) throw new Error('View::DrawTextChildren requires a parent.');

    // For ControlElement, we need to set the positioner empty bounding box if no text
    if (parent.IsControlElement?.()) {
      if (!(parent.GetChildCount?.() ?? 0) || !parent.HasNonEditorialContent?.()) {
        const controlElement = parent as unknown as { GetCurrentFloatingPositioner?(): { SetEmptyBB(): void } | null };
        // With MNum drawn from DrawMeasure there will be no positioner
        const positioner = controlElement.GetCurrentFloatingPositioner?.() ?? null;
        if (positioner) positioner.SetEmptyBB();
      }
    }

    for (const current of parent.GetChildrenForModification?.() ?? parent.GetChildren?.() ?? []) {
      if (current.IsTextElement?.()) {
        this.DrawTextElement(dc, current as unknown as ViewTextElementLike, params);
      }
      else if (current.IsEditorialElement?.()) {
        // cast to EditorialElement check in DrawTextEditorialElement
        this.DrawTextEditorialElement(dc, current, params);
      }
      else {
        throw new Error('View::DrawTextChildren: unexpected text child.');
      }
    }
  }

  public DrawFbChildren(dc: ViewPageDeviceContextLike, parent: ViewPageObjectLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawFbChildren requires a device context.');
    if (!parent) throw new Error('View::DrawFbChildren requires a parent.');

    for (const current of parent.GetChildrenForModification?.() ?? parent.GetChildren?.() ?? []) {
      if (current.IsTextElement?.()) {
        this.DrawTextElement(dc, current as unknown as ViewTextElementLike, params);
      }
      else if (current.IsEditorialElement?.()) {
        // cast to EditorialElement check in DrawLayerEditorialElement
        this.DrawFbEditorialElement(dc, current, params);
      }
      else {
        throw new Error('View::DrawFbChildren: unexpected fb child.');
      }
    }
  }

  public DrawRunningChildren(dc: ViewPageDeviceContextLike, parent: ViewPageObjectLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawRunningChildren requires a device context.');
    if (!parent) throw new Error('View::DrawRunningChildren requires a parent.');

    for (const current of parent.GetChildrenForModification?.() ?? parent.GetChildren?.() ?? []) {
      if (current.Is?.(ClassId.FIG)) {
        this.DrawFig(dc, current as unknown as ViewTextFigLike, params);
      }
      else if (current.IsTextElement?.()) {
        // We are now reaching a text element - start set only here because we can have a figure
        const paramsChild = params.Clone();
        dc.StartText(
          this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_left);
        this.DrawTextElement(dc, current as unknown as ViewTextElementLike, paramsChild);
        dc.EndText();
      }
      else if (current.IsEditorialElement?.()) {
        // cast to EditorialElement check in DrawLayerEditorialElement
        this.DrawRunningEditorialElement(dc, current, params);
      }
      else {
        throw new Error('View::DrawRunningChildren: unexpected running child.');
      }
    }
  }

  // =========================================================================
  // view_page.cpp — Pass 323 Editorial
  // =========================================================================

  public DrawSystemEditorialElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, system: ViewPageSystemLike): void {
    if (!element) throw new Error('View::DrawSystemEditorialElement requires an element.');
    if (element.Is?.(ClassId.ANNOT)) {
      this.DrawAnnot(dc, element, false);
      return;
    }
    if (element.Is?.(ClassId.APP)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if ((level !== 1 /* EDITORIAL_SCORE */) && (level !== 2 /* EDITORIAL_TOPLEVEL */)) return;
    }
    else if (element.Is?.(ClassId.CHOICE)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if ((level !== 1 /* EDITORIAL_SCORE */) && (level !== 2 /* EDITORIAL_TOPLEVEL */)) return;
    }
    let elementStart = '';
    if (element.IsMilestoneElement?.()) elementStart = 'systemElementStart';

    dc.StartGraphic(element, elementStart, element.GetID());
    // EditorialElements at the system level that are visible have no children
    // if (element->m_visibility == Visible) {
    //    DrawSystemChildren(dc, element, system);
    //}
    dc.EndGraphic(element, this);
  }

  public DrawMeasureEditorialElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!element) throw new Error('View::DrawMeasureEditorialElement requires an element.');
    if (element.Is?.(ClassId.ANNOT)) {
      this.DrawAnnot(dc, element, false);
      return;
    }
    if (element.Is?.(ClassId.APP)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 5 /* EDITORIAL_MEASURE */) {
        throw new Error('View::DrawMeasureEditorialElement: app level required');
      }
    }
    else if (element.Is?.(ClassId.CHOICE)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 5 /* EDITORIAL_MEASURE */) {
        throw new Error('View::DrawMeasureEditorialElement: choice level required');
      }
    }

    dc.StartGraphic(element, '', element.GetID());
    if (!element.IsHidden?.()) {
      this.DrawMeasureChildren(dc, element, measure, system);
    }
    dc.EndGraphic(element, this);
  }

  public DrawStaffEditorialElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!element) throw new Error('View::DrawStaffEditorialElement requires an element.');
    if (element.Is?.(ClassId.ANNOT)) {
      this.DrawAnnot(dc, element, false);
      return;
    }
    if (element.Is?.(ClassId.APP)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 6 /* EDITORIAL_STAFF */) {
        throw new Error('View::DrawStaffEditorialElement: app level required');
      }
    }
    else if (element.Is?.(ClassId.CHOICE)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 6 /* EDITORIAL_STAFF */) {
        throw new Error('View::DrawStaffEditorialElement: choice level required');
      }
    }

    dc.StartGraphic(element, '', element.GetID());
    if (!element.IsHidden?.()) {
      this.DrawStaffChildren(dc, element, staff, measure);
    }
    dc.EndGraphic(element, this);
  }

  public DrawLayerEditorialElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!element) throw new Error('View::DrawLayerEditorialElement requires an element.');
    if (element.Is?.(ClassId.ANNOT)) {
      this.DrawAnnot(dc, element, false);
      return;
    }
    if (element.Is?.(ClassId.APP)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 7 /* EDITORIAL_LAYER */) {
        throw new Error('View::DrawLayerEditorialElement: app level required');
      }
    }
    else if (element.Is?.(ClassId.CHOICE)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 7 /* EDITORIAL_LAYER */) {
        throw new Error('View::DrawLayerEditorialElement: choice level required');
      }
    }

    dc.StartGraphic(element, '', element.GetID());
    if (!element.IsHidden?.()) {
      this.DrawLayerChildren(dc, element, layer, staff, measure);
    }
    dc.EndGraphic(element, this);
  }

  public DrawTextEditorialElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, params: TextDrawingParams): void {
    if (!element) throw new Error('View::DrawTextEditorialElement requires an element.');
    if (element.Is?.(ClassId.ANNOT)) {
      this.DrawAnnot(dc, element, true);
      return;
    }
    if (element.Is?.(ClassId.APP)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 9 /* EDITORIAL_TEXT */) {
        throw new Error('View::DrawTextEditorialElement: app level required');
      }
    }
    else if (element.Is?.(ClassId.CHOICE)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 9 /* EDITORIAL_TEXT */) {
        throw new Error('View::DrawTextEditorialElement: choice level required');
      }
    }

    dc.StartTextGraphic(element, '', element.GetID());
    if (!element.IsHidden?.()) {
      this.DrawTextChildren(dc, element, params);
    }
    dc.EndTextGraphic(element, this);
  }

  public DrawFbEditorialElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, params: TextDrawingParams): void {
    if (!element) throw new Error('View::DrawFbEditorialElement requires an element.');
    if (element.Is?.(ClassId.ANNOT)) {
      this.DrawAnnot(dc, element, true);
      return;
    }
    if (element.Is?.(ClassId.APP)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 10 /* EDITORIAL_FB */) {
        throw new Error('View::DrawFbEditorialElement: app level required');
      }
    }
    else if (element.Is?.(ClassId.CHOICE)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 10 /* EDITORIAL_FB */) {
        throw new Error('View::DrawFbEditorialElement: choice level required');
      }
    }

    dc.StartTextGraphic(element, '', element.GetID());
    if (!element.IsHidden?.()) {
      this.DrawFbChildren(dc, element, params);
    }
    dc.EndTextGraphic(element, this);
  }

  public DrawRunningEditorialElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, params: TextDrawingParams): void {
    if (!element) throw new Error('View::DrawRunningEditorialElement requires an element.');
    if (element.Is?.(ClassId.ANNOT)) {
      this.DrawAnnot(dc, element, true);
      return;
    }
    if (element.Is?.(ClassId.APP)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 11 /* EDITORIAL_RUNNING */) {
        throw new Error('View::DrawRunningEditorialElement: app level required');
      }
    }
    else if (element.Is?.(ClassId.CHOICE)) {
      const level = (element as ViewPageAppLike).GetLevel();
      if (level !== 11 /* EDITORIAL_RUNNING */) {
        throw new Error('View::DrawRunningEditorialElement: choice level required');
      }
    }

    dc.StartGraphic(element, '', element.GetID());
    if (!element.IsHidden?.()) {
      this.DrawRunningChildren(dc, element, params);
    }
    dc.EndGraphic(element, this);
  }

  public DrawAnnot(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, isTextElement = false): void {
    if (!element) throw new Error('View::DrawAnnot requires an element.');

    if (isTextElement) {
      dc.StartTextGraphic(element, '', element.GetID());
    }
    else {
      dc.StartGraphic(element, '', element.GetID());
    }

    const annot = element as unknown as { GetText(): number[] };
    dc.AddDescription?.(UTF32to8(annot.GetText()));

    if (isTextElement) {
      dc.EndTextGraphic(element, this);
    }
    else {
      dc.EndGraphic(element, this);
    }
  }

  // =========================================================================
  // view_mensural.cpp — Pass 322
  // =========================================================================

  public DrawMensuralNote(dc: ViewGraphDeviceContextLike, element: ViewMensuralNoteLike, layer: unknown, staff: ViewMensuralStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawMensuralNote requires a device context.');
    if (!element) throw new Error('View::DrawMensuralNote requires an element.');
    if (!layer) throw new Error('View::DrawMensuralNote requires a layer.');
    if (!staff) throw new Error('View::DrawMensuralNote requires a staff.');
    if (!measure) throw new Error('View::DrawMensuralNote requires a measure.');

    const note = element as unknown as ViewMensuralNoteLike;

    dc.StartGraphic(note, '', note.GetID());

    let x = element.GetDrawingX();
    let y = element.GetDrawingY();
    const p = { x, y };
    this.CalcOffset(dc as DeviceContextLike, p);
    x = p.x; y = p.y;

    const drawingDur = note.GetDrawingDur();

    // Ligature, maxima, longa, and brevis
    if (note.IsInLigature() && !this.m_options!.m_ligatureAsBracket!.GetValue()) {
      this.DrawLigatureNote(dc, element, layer, staff);
    }
    else if (drawingDur < DURATION_1) {
      this.DrawMaximaToBrevis(dc, y, element, layer, staff);
    }
    // Semibrevis and shorter
    else {
      const code = note.GetMensuralNoteheadGlyph();
      dc.StartCustomGraphic('notehead');
      this.DrawSmuflCode(dc, x, y, code, staff.m_drawingStaffSize, false);
      dc.EndCustomGraphic();
    }

    // Draw children (verse / syl)
    (this as unknown as { DrawLayerChildren?(dc: unknown, element: unknown, layer: unknown, staff: unknown, measure: unknown): void }).DrawLayerChildren?.(dc, note, layer, staff, measure);

    dc.EndGraphic(note, this);
  }

  public DrawMensur(dc: ViewGraphDeviceContextLike, element: ViewMensurLike, layer: unknown, staff: ViewMensuralStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawMensur requires a device context.');
    if (!element) throw new Error('View::DrawMensur requires an element.');
    if (!layer) throw new Error('View::DrawMensur requires a layer.');
    if (!staff) throw new Error('View::DrawMensur requires a staff.');
    if (!measure) throw new Error('View::DrawMensur requires a measure.');

    const mensur = element as unknown as ViewMensurLike;

    if (!mensur.HasSign() && !mensur.HasNum()) {
      // only react to visual attributes
      return;
    }

    let y = staff.GetDrawingY() - Math.imul(this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize), (staff.m_drawingLines - 1) | 0);
    let x = element.GetDrawingX();
    const perfectRadius = Math.trunc(this.m_doc!.GetGlyphWidth(SMUFL_E910_mensuralProlation1, staff.m_drawingStaffSize, false) / 2);
    let code = 0;

    if (mensur.HasLoc()) {
      y = staff.GetDrawingY()
        - this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize) * (2 * staff.m_drawingLines - 2 - mensur.GetLoc());
    }
    else if (mensur.HasNumbase() && !mensur.HasNum()) {
      y += 2 * this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
    }

    if (mensur.GetSign() === MENSURATIONSIGN_O) {
      code = SMUFL_E911_mensuralProlation2;
    }
    else if (mensur.GetSign() === MENSURATIONSIGN_C) {
      if (mensur.GetOrient() === ORIENTATION_reversed) {
        code = SMUFL_E916_mensuralProlation7;
      }
      else {
        code = SMUFL_E915_mensuralProlation6;
      }
    }

    dc.StartGraphic(element, '', element.GetID());

    this.DrawSmuflCode(dc, x, y, code, staff.m_drawingStaffSize, false);

    x += perfectRadius;
    // only one slash supported
    if (mensur.HasSlash()) {
      this.DrawSmuflCode(dc,
        x - Math.trunc(this.m_doc!.GetGlyphWidth(SMUFL_E925_mensuralProlationCombiningStroke, staff.m_drawingStaffSize, false) / 2),
        y, SMUFL_E925_mensuralProlationCombiningStroke, staff.m_drawingStaffSize, false);
    }
    if (mensur.GetDot() === BOOLEAN_true) {
      this.DrawSmuflCode(dc,
        x - Math.trunc(this.m_doc!.GetGlyphWidth(SMUFL_E920_mensuralProlationCombiningDot, staff.m_drawingStaffSize, false) / 2), y,
        SMUFL_E920_mensuralProlationCombiningDot, staff.m_drawingStaffSize, false);
    }

    if (mensur.HasNum()) {
      x = element.GetDrawingX();
      if (mensur.HasSign() || mensur.HasTempus()) {
        x += this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize) * 6;
      }
      const numbase = mensur.HasNumbase() ? mensur.GetNumbase() : 0;
      this.DrawProportFigures(dc, x, y, mensur.GetNum(), numbase, staff);
    }
    // It is sure we have a sign - draw the numbase underneath the sign
    else if (mensur.HasNumbase()) {
      // Draw a single figure but passing numbase - adjust the y accordingly
      y -= 4 * this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
      this.DrawProportFigures(dc, x, y, mensur.GetNumbase(), 0, staff);
    }

    dc.EndGraphic(element, this);
  }

  public DrawMensuralStem(dc: ViewGraphDeviceContextLike, note: ViewMensuralNoteLike, staff: ViewMensuralStaffLike, dir: number, xn: number, originYIn: number): void {
    if (!note) throw new Error('View::DrawMensuralStem requires a note.');

    const staffSize = staff.m_drawingStaffSize;
    const drawingDur = note.GetDrawingDur();
    const radius = note.GetDrawingRadius(this.m_doc as unknown as ViewMensuralDocLike);
    // Cue size is currently disabled
    const drawingCueSize = false;
    const mensural_black = (staff.m_drawingNotationType === NOTATIONTYPE_mensural_black);

    const nbFlags = (mensural_black ? drawingDur - DURATION_2 : drawingDur - DURATION_4);

    // SMuFL's mensural stems are not centered
    const halfStemWidth = Math.trunc(this.m_doc!.GetGlyphWidth(SMUFL_E93E_mensuralCombStemUp, staff.m_drawingStaffSize, drawingCueSize) / 2);
    const yOffset = this.m_doc!.GetDrawingUnit(staffSize) - halfStemWidth;
    const originY = (dir === STEMDIRECTION_up) ? originYIn + yOffset : originYIn - yOffset;

    // draw the stems and the flags
    let code: number;
    if (dir === STEMDIRECTION_up) {
      switch (nbFlags) {
        case 1: code = SMUFL_E949_mensuralCombStemUpFlagSemiminima; break;
        case 2: code = SMUFL_E94B_mensuralCombStemUpFlagFusa; break;
        default: code = SMUFL_E93E_mensuralCombStemUp;
      }
    }
    else {
      switch (nbFlags) {
        case 1: code = SMUFL_E94A_mensuralCombStemDownFlagSemiminima; break;
        case 2: code = SMUFL_E94C_mensuralCombStemDownFlagFusa; break;
        default: code = SMUFL_E93F_mensuralCombStemDown;
      }
    }

    this.DrawSmuflCode(dc, xn + radius - halfStemWidth, originY, code, staff.m_drawingStaffSize, drawingCueSize);

    // Store the stem direction ?
    note.SetDrawingStemDir(dir);
  }

  public DrawMaximaToBrevis(dc: ViewGraphDeviceContextLike, y: number, element: ViewMensuralNoteLike, layer: unknown, staff: ViewMensuralStaffLike): void {
    if (!dc) throw new Error('View::DrawMaximaToBrevis requires a device context.');
    if (!element) throw new Error('View::DrawMaximaToBrevis requires an element.');
    if (!layer) throw new Error('View::DrawMaximaToBrevis requires a layer.');
    if (!staff) throw new Error('View::DrawMaximaToBrevis requires a staff.');

    const note = element as unknown as ViewMensuralNoteLike;

    const isMensuralBlack = (staff.m_drawingNotationType === NOTATIONTYPE_mensural_black);
    const fillNotehead = (isMensuralBlack || !!note.GetColored()) && !(isMensuralBlack && !!note.GetColored());

    const stemWidth = this.m_doc!.GetDrawingStemWidth(staff.m_drawingStaffSize);
    const strokeWidth = Math.trunc(2.8 * stemWidth);
    const staffSize = staff.m_drawingStaffSize;

    let shape = LIGATURE_DEFAULT;
    if (note.GetActualDur() !== DURATION_breve) {
      let up = false;
      // Mensural notes have no Stem child - rely on the MEI @stem.dir
      if (note.GetStemDir() !== STEMDIRECTION_NONE) {
        up = (note.GetStemDir() === STEMDIRECTION_up);
      }
      // For CMN we rely on the drawing stem dir interface pre-calculated in functors
      else if (staff.m_drawingNotationType === NOTATIONTYPE_NONE
        || staff.m_drawingNotationType === NOTATIONTYPE_cmn) {
        up = (note.GetDrawingStemDir() === STEMDIRECTION_up);
      }
      // For mensural white, just calculate it here - keep it down for mensural black
      else if (staff.m_drawingNotationType !== NOTATIONTYPE_mensural_black) {
        const verticalCenter = staff.GetDrawingY() - Math.imul(this.m_doc!.GetDrawingUnit(staffSize), (staff.m_drawingLines - 1) | 0);
        up = (note.GetDrawingY() < verticalCenter);
      }
      shape = (up) ? LIGATURE_STEM_RIGHT_UP : LIGATURE_STEM_RIGHT_DOWN;
    }

    const topLeft = new Point(0, 0);
    const bottomRight = new Point(0, 0);
    const sides = [0, 0, 0, 0];
    this.CalcBrevisPoints(note, staff, topLeft, bottomRight, sides, shape, isMensuralBlack);

    dc.StartCustomGraphic('notehead');

    if (!fillNotehead) {
      // double the bases of rectangles
      this.DrawObliquePolygon(dc, topLeft.x + stemWidth, topLeft.y, bottomRight.x - stemWidth, topLeft.y, -strokeWidth);
      this.DrawObliquePolygon(dc, topLeft.x + stemWidth, bottomRight.y, bottomRight.x - stemWidth, bottomRight.y, strokeWidth);
    }
    else {
      this.DrawFilledRectangle(dc, topLeft.x + stemWidth, topLeft.y, bottomRight.x - stemWidth, bottomRight.y);
    }

    if (note.FindDescendantByType(ClassId.PLICA)) {
      // Right side is a stem - end the notehead first
      dc.EndCustomGraphic();
      return;
    }

    // serifs and / or stem
    this.DrawFilledRectangle(dc, topLeft.x, sides[0], topLeft.x + stemWidth, sides[1]);

    if (note.GetActualDur() !== DURATION_breve) {
      // Right side is a stem - end the notehead first
      dc.EndCustomGraphic();
      dc.StartCustomGraphic('stem');
      this.DrawFilledRectangle(dc, bottomRight.x - stemWidth, sides[2], bottomRight.x, sides[3]);
      dc.EndCustomGraphic();
    }
    else {
      // Right side is a serif
      this.DrawFilledRectangle(dc, bottomRight.x - stemWidth, sides[2], bottomRight.x, sides[3]);
      dc.EndCustomGraphic();
    }
  }

  public DrawLigature(dc: ViewGraphDeviceContextLike, element: ViewMensuralLigatureLike, layer: unknown, staff: ViewMensuralStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawLigature requires a device context.');
    if (!element) throw new Error('View::DrawLigature requires an element.');
    if (!layer) throw new Error('View::DrawLigature requires a layer.');
    if (!staff) throw new Error('View::DrawLigature requires a staff.');

    const ligature = element as unknown as ViewMensuralLigatureLike;

    dc.StartGraphic(ligature, '', ligature.GetID());

    // Draw children (notes)
    (this as unknown as { DrawLayerChildren?(dc: unknown, element: unknown, layer: unknown, staff: unknown, measure: unknown): void }).DrawLayerChildren?.(dc, ligature, layer, staff, measure);

    // Render a bracket for the ligature
    if (this.m_options!.m_ligatureAsBracket!.GetValue()) {
      const notes = ligature.GetList();

      if (notes.length > 0) {
        let y = staff.GetDrawingY();
        const firstNote = ligature.GetFirstNote();
        const x1 = firstNote.GetContentLeft();
        const lastNote = ligature.GetLastNote();
        const x2 = lastNote.GetContentRight();
        // Look for the highest note position in the ligature
        for (const object of notes) {
          const note = object as unknown as ViewMensuralNoteLike;
          y = Math.max(y, note.GetContentTop());
        }
        const bracketSize = 2 * this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
        // move the bracket up
        y += bracketSize + this.m_doc!.GetDrawingStemWidth(staff.m_drawingStaffSize);
        const lineWidth = this.m_doc!.GetDrawingStemWidth(staff.m_drawingStaffSize);
        this.DrawFilledRectangle(dc, x1, y, x1 + lineWidth, y - bracketSize);
        this.DrawFilledRectangle(dc, x1, y, x2, y - lineWidth);
        this.DrawFilledRectangle(dc, x2 - lineWidth, y, x2, y - bracketSize);
      }
    }

    dc.EndGraphic(ligature, this);
  }

  public DrawLigatureNote(dc: ViewGraphDeviceContextLike, element: ViewMensuralNoteLike, layer: unknown, staff: ViewMensuralStaffLike): void {
    if (!dc) throw new Error('View::DrawLigatureNote requires a device context.');
    if (!element) throw new Error('View::DrawLigatureNote requires an element.');
    if (!layer) throw new Error('View::DrawLigatureNote requires a layer.');
    if (!staff) throw new Error('View::DrawLigatureNote requires a staff.');

    const note = element as unknown as ViewMensuralNoteLike;

    const ligature = note.GetFirstAncestor(ClassId.LIGATURE) as unknown as ViewMensuralLigatureLike | null;
    if (!ligature) throw new Error('View::DrawLigatureNote: note has no Ligature ancestor.');

    if (ligature.m_drawingShapes.length < 2) return;

    const prevNote = ligature.GetListPrevious(note) as unknown as ViewMensuralNoteLike | null;
    const nextNote = ligature.GetListNext(note) as unknown as ViewMensuralNoteLike | null;

    const position = ligature.GetListIndex(note);
    if (position === -1) throw new Error('View::DrawLigatureNote: note not in ligature list.');
    const shape = ligature.m_drawingShapes[position];
    const prevShape = (position > 0) ? ligature.m_drawingShapes[position - 1] : 0;

    /** code duplicated from View::DrawMaximaToBrevis */
    const isMensuralBlack = (staff.m_drawingNotationType === NOTATIONTYPE_mensural_black);
    const fillNotehead = (isMensuralBlack || !!note.GetColored()) && !(isMensuralBlack && !!note.GetColored());
    const oblique = !!(shape & LIGATURE_OBLIQUE) || !!(prevShape & LIGATURE_OBLIQUE);
    const obliqueEnd = !!(prevShape & LIGATURE_OBLIQUE);
    const stackedEnd = !!(shape & LIGATURE_STACKED);
    const stemWidth = this.m_doc!.GetDrawingStemWidth(staff.m_drawingStaffSize);
    const strokeWidth = Math.trunc(2.8 * stemWidth);
    /** end code duplicated */

    let straight = true;
    switch (this.m_doc!.GetOptions().m_ligatureOblique!.GetValue()) {
      case LIGATURE_OBL_auto: straight = !isMensuralBlack; break;
      case LIGATURE_OBL_straight: straight = true; break;
      case LIGATURE_OBL_curved: straight = false; break;
    }

    const points = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
    const topLeft = points[0];
    const bottomLeft = points[1];
    const topRight = points[2];
    const bottomRight = points[3];
    const sides = [0, 0, 0, 0];
    if (!oblique) {
      this.CalcBrevisPoints(note, staff, topLeft, bottomRight, sides, shape, isMensuralBlack);
      bottomLeft.x = topLeft.x;
      bottomLeft.y = bottomRight.y;
      topRight.x = bottomRight.x;
      topRight.y = topLeft.y;
    }
    else {
      // First half of the oblique - checking the nextNote is there just in case, but is should
      if ((shape & LIGATURE_OBLIQUE) && nextNote) {
        this.CalcObliquePoints(note, nextNote, staff, points, sides, shape, isMensuralBlack, true, straight);
      }
      // Second half of the oblique - checking the prevNote is there just in case, but is should
      else if ((prevShape & LIGATURE_OBLIQUE) && prevNote) {
        this.CalcObliquePoints(prevNote, note, staff, points, sides, prevShape, isMensuralBlack, false, straight);
      }
      else {
        throw new Error('View::DrawLigatureNote: oblique ligature note without a valid neighbor.');
      }
    }

    // Oblique polygons
    if (straight) {
      if (!fillNotehead) {
        this.DrawObliquePolygon(dc, topLeft.x, topLeft.y, topRight.x, topRight.y, -strokeWidth);
        this.DrawObliquePolygon(dc, bottomLeft.x, bottomLeft.y, bottomRight.x, bottomRight.y, strokeWidth);
      }
      else {
        this.DrawObliquePolygon(dc, topLeft.x, topLeft.y, topRight.x, topRight.y, bottomLeft.y - topLeft.y);
      }
    }
    // Bent parallelograms
    else {
      const thickness = topLeft.y - bottomLeft.y;
      // The curved side points (two ends and two control points)
      const curvedSide = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
      curvedSide[0] = this.ToDeviceContext(topLeft);
      curvedSide[3] = this.ToDeviceContext(topRight);
      //
      const width = (curvedSide[3].x - curvedSide[0].x);
      const height = (curvedSide[3].y - curvedSide[0].y);
      curvedSide[1] = new Point(curvedSide[3].x, curvedSide[3].y);
      curvedSide[1].x -= Math.trunc(width * 0.7);
      curvedSide[1].y -= Math.trunc((height * 0.7) + (height * 0.07));
      curvedSide[2] = new Point(curvedSide[3].x, curvedSide[3].y);
      curvedSide[2].x -= Math.trunc(width * 0.3);
      curvedSide[2].y -= Math.trunc((height * 0.3) + (height * 0.07));

      if (!fillNotehead) {
        dc.DrawBentParallelogramFilled(curvedSide, strokeWidth);
        for (const point of curvedSide) point.y += thickness - strokeWidth;
        dc.DrawBentParallelogramFilled(curvedSide, strokeWidth);
      }
      else {
        dc.DrawBentParallelogramFilled(curvedSide, thickness);
      }
    }

    // Do not draw a left connector with obliques
    if (!obliqueEnd) {
      let sideTop = sides[0];
      let sideBottom = sides[1];
      if (prevNote) {
        const prevSides = [sides[0], sides[1], sides[2], sides[3]];
        this.CalcBrevisPoints(prevNote, staff, topLeft, bottomRight, prevSides, prevShape, isMensuralBlack);
        if (!stackedEnd) {
          sideTop = Math.max(sides[0], prevSides[2]);
          sideBottom = Math.min(sides[1], prevSides[3]);
        }
        else {
          // Stacked end - simply use the bottom right [3] note since the interval is going up anyway
          sides[3] = prevSides[3];
        }
      }
      this.DrawFilledRoundedRectangle(dc, topLeft.x, sideTop, topLeft.x + stemWidth, sideBottom, Math.trunc(stemWidth / 3));
    }

    if (!nextNote) {
      this.DrawFilledRoundedRectangle(dc, bottomRight.x - stemWidth, sides[2], bottomRight.x, sides[3], Math.trunc(stemWidth / 3));
    }
  }

  public DrawDotInLigature(dc: ViewGraphDeviceContextLike, element: ViewMensuralDotLike, layer: unknown, staff: ViewMensuralStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawDotInLigature requires a device context.');
    if (!element) throw new Error('View::DrawDotInLigature requires an element.');
    if (!layer) throw new Error('View::DrawDotInLigature requires a layer.');
    if (!staff) throw new Error('View::DrawDotInLigature requires a staff.');

    const dot = element as unknown as ViewMensuralDotLike;

    if (!dot.m_drawingPreviousElement || !dot.m_drawingPreviousElement.Is(ClassId.NOTE)) {
      throw new Error('View::DrawDotInLigature: dot must have a previous NOTE.');
    }
    const note = dot.m_drawingPreviousElement as unknown as ViewMensuralNoteLike;

    const ligature = note.GetFirstAncestor(ClassId.LIGATURE) as unknown as ViewMensuralLigatureLike | null;
    if (!ligature) throw new Error('View::DrawDotInLigature: note has no Ligature ancestor.');

    let shiftMultiplier = 3.0;
    let isVerticalDot = false;
    if (!this.m_doc!.GetOptions().m_ligatureAsBracket!.GetValue()) {
      const position = ligature.GetListIndex(note);
      if (position === -1) throw new Error('View::DrawDotInLigature: note not in ligature list.');
      const shape = ligature.m_drawingShapes[position];
      const isLast = (position === (ligature.m_drawingShapes.length - 1));
      isVerticalDot = !isLast && !!(shape & LIGATURE_OBLIQUE);
    }
    else {
      if (note.GetActualDur() === DURATION_1) shiftMultiplier = 3.5;
    }

    let y = note.GetDrawingY();
    let x = note.GetDrawingX();
    if (isVerticalDot) {
      x += note.GetDrawingRadius(this.m_doc as unknown as ViewMensuralDocLike, true);
      y += this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
    }
    else {
      x += Math.trunc(shiftMultiplier * note.GetDrawingRadius(this.m_doc as unknown as ViewMensuralDocLike, true));
      y -= this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
    }

    (this as unknown as { DrawDotsPart?(dc: unknown, x: number, y: number, dotCount: number, staff: unknown): void }).DrawDotsPart?.(dc, x, y, 1, staff);
  }

  public DrawPlica(dc: ViewGraphDeviceContextLike, element: ViewMensuralPlicaLike, layer: unknown, staff: ViewMensuralStaffLike, measure: unknown): void {
    if (!dc) throw new Error('View::DrawPlica requires a device context.');
    if (!element) throw new Error('View::DrawPlica requires an element.');
    if (!layer) throw new Error('View::DrawPlica requires a layer.');
    if (!staff) throw new Error('View::DrawPlica requires a staff.');

    const plica = element as unknown as ViewMensuralPlicaLike;

    const note = plica.GetFirstAncestor(ClassId.NOTE) as unknown as ViewMensuralNoteLike | null;
    if (!note) throw new Error('View::DrawPlica: plica has no NOTE ancestor.');

    const isMensuralBlack = (staff.m_drawingNotationType === NOTATIONTYPE_mensural_black);
    const stemWidth = this.m_doc!.GetDrawingStemWidth(staff.m_drawingStaffSize);

    const isLonga = (note.GetActualDur() === DURATION_long);
    const up = (plica.GetDir() === STEMDIRECTION_basic_up);

    const shape = LIGATURE_DEFAULT;
    const topLeft = new Point(0, 0);
    const bottomRight = new Point(0, 0);
    const sides = [0, 0, 0, 0];
    this.CalcBrevisPoints(note, staff, topLeft, bottomRight, sides, shape, isMensuralBlack);

    let stem = this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
    stem *= (!isMensuralBlack) ? 7 : 5;
    let shortStem = this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
    shortStem = Math.trunc(shortStem * ((!isMensuralBlack) ? 3.5 : 2.5));

    dc.StartGraphic(plica, '', plica.GetID());

    if (isLonga) {
      if (up) {
        this.DrawFilledRectangle(dc, topLeft.x, sides[1], topLeft.x + stemWidth, sides[1] + shortStem);
        this.DrawFilledRectangle(dc, bottomRight.x, sides[1], bottomRight.x - stemWidth, sides[1] + stem);
      }
      else {
        this.DrawFilledRectangle(dc, topLeft.x, sides[0], topLeft.x + stemWidth, sides[0] - shortStem);
        this.DrawFilledRectangle(dc, bottomRight.x, sides[0], bottomRight.x - stemWidth, sides[0] - stem);
      }
    }
    // brevis
    else {
      if (up) {
        this.DrawFilledRectangle(dc, topLeft.x, sides[1], topLeft.x + stemWidth, sides[1] + stem);
        this.DrawFilledRectangle(dc, bottomRight.x, sides[1], bottomRight.x - stemWidth, sides[1] + shortStem);
      }
      else {
        this.DrawFilledRectangle(dc, topLeft.x, sides[0], topLeft.x + stemWidth, sides[0] - stem);
        this.DrawFilledRectangle(dc, bottomRight.x, sides[0], bottomRight.x - stemWidth, sides[0] - shortStem);
      }
    }

    dc.EndGraphic(plica, this);
  }

  public DrawProportFigures(dc: ViewGraphDeviceContextLike, x: number, y: number, num: number, numBase: number, staff: ViewMensuralStaffLike): void {
    if (!dc) throw new Error('View::DrawProportFigures requires a device context.');
    if (!staff) throw new Error('View::DrawProportFigures requires a staff.');

    let ynum = 0, yden = 0;
    const textSize = staff.m_drawingStaffSize;
    let wtext: number[];

    if (numBase) {
      ynum = y + this.m_doc!.GetDrawingDoubleUnit(textSize);
      yden = y - this.m_doc!.GetDrawingDoubleUnit(textSize);
    }
    else {
      ynum = y;
    }

    if (numBase > 9 || num > 9) {
      x += this.m_doc!.GetDrawingUnit(textSize) * 2;
    }

    dc.SetFont(this.m_doc!.GetDrawingSmuflFont(textSize, false));

    wtext = this.IntToTimeSigFigures(num);
    this.DrawSmuflString(dc, x, ynum, wtext, HORIZONTALALIGNMENT_center, textSize);

    if (numBase) {
      wtext = this.IntToTimeSigFigures(numBase);
      this.DrawSmuflString(dc, x, yden, wtext, HORIZONTALALIGNMENT_center, textSize);
    }

    dc.ResetFont();
  }

  public DrawProport(dc: ViewGraphDeviceContextLike, element: ViewMensuralProportLike, layer: unknown, staff: unknown, measure: unknown): void {
    if (!element) throw new Error('View::DrawProport requires an element.');
    if (!layer) throw new Error('View::DrawProport requires a layer.');
    if (!staff) throw new Error('View::DrawProport requires a staff.');

    dc.StartGraphic(element, '', element.GetID());

    dc.EndGraphic(element, this);
  }

  public CalcBrevisPoints(note: ViewMensuralNoteLike, staff: ViewMensuralStaffLike, topLeft: Point, bottomRight: Point, sides: number[], shape: number, isMensuralBlack: boolean): void {
    if (!note) throw new Error('View::CalcBrevisPoints requires a note.');
    if (!staff) throw new Error('View::CalcBrevisPoints requires a staff.');
    if (!topLeft) throw new Error('View::CalcBrevisPoints requires topLeft.');
    if (!bottomRight) throw new Error('View::CalcBrevisPoints requires bottomRight.');

    const y = note.GetDrawingY();

    // Calculate size of the rectangle
    topLeft.x = note.GetDrawingX();
    const width = 2 * note.GetDrawingRadius(this.m_doc as unknown as ViewMensuralDocLike, true);
    bottomRight.x = topLeft.x + width;

    const heightFactor = (isMensuralBlack) ? 0.8 : 1.0;
    topLeft.y = Math.trunc(y + this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize) * heightFactor);
    bottomRight.y = Math.trunc(y - this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize) * heightFactor);

    sides[0] = topLeft.y;
    sides[1] = bottomRight.y;

    if (!isMensuralBlack) {
      // add sherif
      sides[0] += Math.trunc(Math.trunc(this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize)) / 3);
      sides[1] -= Math.trunc(Math.trunc(this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize)) / 3);
    }
    else if (shape & LIGATURE_OBLIQUE) {
      // shorten the sides to make sure they are note visible with oblique ligatures
      sides[0] -= Math.trunc(Math.trunc(this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize)) / 2);
      sides[1] += Math.trunc(Math.trunc(this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize)) / 2);
    }

    sides[2] = sides[0];
    sides[3] = sides[1];

    let stem = this.m_doc!.GetDrawingUnit(staff.m_drawingStaffSize);
    stem *= (!isMensuralBlack) ? 7 : 5;

    if (shape & LIGATURE_STEM_LEFT_UP) sides[0] = y + stem;
    if (shape & LIGATURE_STEM_LEFT_DOWN) sides[1] = y - stem;
    if (shape & LIGATURE_STEM_RIGHT_UP) sides[2] = y + stem;
    if (shape & LIGATURE_STEM_RIGHT_DOWN) sides[3] = y - stem;
  }

  public CalcObliquePoints(note1: ViewMensuralNoteLike, note2: ViewMensuralNoteLike, staff: ViewMensuralStaffLike, points: Point[], sides: number[], shape: number,
    isMensuralBlack: boolean, firstHalf: boolean, straight: boolean): void {
    if (!note1) throw new Error('View::CalcObliquePoints requires note1.');
    if (!note2) throw new Error('View::CalcObliquePoints requires note2.');
    if (!staff) throw new Error('View::CalcObliquePoints requires a staff.');

    const stemWidth = this.m_doc!.GetDrawingStemWidth(staff.m_drawingStaffSize);
    const noteDiff = note1.PitchDifferenceTo(note2);

    // Adjustment for end points according to the note diff
    const yAdjust = Math.trunc(noteDiff * stemWidth / 5);

    const topLeft = points[0];
    const bottomLeft = points[1];
    const topRight = points[2];
    const bottomRight = points[3];

    const sides1 = [0, 0, 0, 0];
    this.CalcBrevisPoints(note1, staff, topLeft, bottomLeft, sides1, shape, isMensuralBlack);
    // Correct the x of bottomLeft
    bottomLeft.x = topLeft.x;
    // Copy the left sides
    sides[0] = sides1[0];
    sides[1] = sides1[1];

    const sides2 = [0, 0, 0, 0];
    // add OBLIQUE shape to make sure sides are shortened in mensural black
    this.CalcBrevisPoints(note2, staff, topRight, bottomRight, sides2, LIGATURE_OBLIQUE, isMensuralBlack);
    // Correct the x of topRight;
    topRight.x = bottomRight.x;
    // Copy the right sides
    sides[2] = sides2[2];
    sides[3] = sides2[3];

    // With oblique it is best visually to move them up / down - more with (white) ligatures with serif
    // double adjustmentFactor = (isMensuralBlack) ? 2.5 : 1.8;
    let slope = 0.0;
    if (bottomRight.x !== bottomLeft.x)
      slope = (bottomRight.y - bottomLeft.y) / (bottomRight.x - bottomLeft.x);

    let length = Math.trunc((bottomRight.x - bottomLeft.x) / 2);
    if (!straight) slope *= 0.85;

    if (firstHalf) {
      // make sure there is one pixel of overlap
      length += 1;
      bottomRight.x = bottomLeft.x + length;
      topRight.x = bottomRight.x;
      bottomRight.y = bottomLeft.y + Math.trunc(length * slope);
      topRight.y = topLeft.y + Math.trunc(length * slope);
      //
      topLeft.y += yAdjust;
      bottomLeft.y += yAdjust;
    }
    else {
      bottomLeft.x = bottomLeft.x + length;
      topLeft.x = bottomLeft.x;
      bottomLeft.y = bottomLeft.y + Math.trunc(length * slope);
      topLeft.y = topLeft.y + Math.trunc(length * slope);
      //
      topRight.y -= yAdjust;
      bottomRight.y -= yAdjust;
    }
  }

  public GetMensuralStemDir(layer: ViewMensuralLayerLike, note: ViewMensuralNoteLike, verticalCenter: number): number {
    // constants
    const drawingDur = note.GetDrawingDur();
    const yNote = note.GetDrawingY();

    let stemDir = STEMDIRECTION_NONE;
    if (note.HasStemDir()) {
      stemDir = note.GetStemDir();
    }
    else {
      const layerStemDir = layer.GetDrawingStemDir(note);
      if (layerStemDir !== STEMDIRECTION_NONE) {
        stemDir = layerStemDir;
      }
      else {
        if (drawingDur < DURATION_1) {
          stemDir = STEMDIRECTION_down;
        }
        else {
          stemDir = (yNote > verticalCenter) ? STEMDIRECTION_down : STEMDIRECTION_up;
        }
      }
    }
    return stemDir;
  }

  // ==========================================================================
  // view_element.cpp — Pass 325
  // ==========================================================================

  // Canonical constants (include/vrv/keysig.h, note.h, vrvdef.h)
  public static readonly VE_MAX_ACCID_DEPTH = 3; // note.h MAX_ACCID_DEPTH
  public static readonly VE_STANDARD_STEMLENGTH = 8; // vrvdef.h STANDARD_STEMLENGTH
  public static readonly VE_TEMP_KEYSIG_STEP = TEMP_KEYSIG_STEP;
  public static readonly VE_TEMP_KEYSIG_NATURAL_STEP = TEMP_KEYSIG_NATURAL_STEP;

  public DrawLayerElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawLayerElement requires a device context.');
    if (!element) throw new Error('View::DrawLayerElement requires an element.');
    if (!layer) throw new Error('View::DrawLayerElement requires a layer.');
    if (!staff) throw new Error('View::DrawLayerElement requires a staff.');
    if (!measure) throw new Error('View::DrawLayerElement requires a measure.');

    const e = element as unknown as { Is(id: number): boolean; IsLyricElement(): boolean; GetClassName(): string; GetID(): string; SetEmptyBB?(): void };
    if ((element as unknown as { HasSameas?(): boolean }).HasSameas?.()) {
      dc.StartGraphic(element, "", element.GetID());
      (element as unknown as { SetEmptyBB(): void }).SetEmptyBB();
      dc.EndGraphic(element, this);
      return;
    }

    this.StartOffset(dc, element as unknown as ViewObjectLike, staff.m_drawingStaffSize);

    const C = ClassId;
    const cast = this as unknown as Record<string, ((dc: unknown, e: unknown, l: unknown, s: unknown, m: unknown) => void) | undefined>;

    const addToList = (el: unknown): void => {
      (layer as unknown as { AddToDrawingList?(e: unknown): void }).AddToDrawingList?.(el);
    };

    if (e.Is(C.ACCID)) {
      cast.DrawAccid?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.ARTIC)) {
      cast.DrawArtic?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.BARLINE)) {
      cast.DrawBarLineLayerElement?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.BEAM)) {
      cast.DrawBeam?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.BEATRPT)) {
      cast.DrawBeatRpt?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.BTREM)) {
      cast.DrawBTrem?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.CHORD)) {
      cast.DrawDurationElement?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.CLEF)) {
      cast.DrawClef?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.CUSTOS)) {
      cast.DrawCustos?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.DIVLINE)) {
      cast.DrawDivLine?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.DOT)) {
      cast.DrawDotElement?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.DOTS)) {
      cast.DrawDots?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.EPISEMA)) {
      cast.DrawEpisema?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.FTREM)) {
      cast.DrawFTrem?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.FLAG)) {
      cast.DrawFlag?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.GENERIC_ELEMENT)) {
      cast.DrawGenericLayerElement?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.GRACEGRP)) {
      cast.DrawGraceGrp?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.HALFMRPT)) {
      cast.DrawHalfmRpt?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.KEYSIG)) {
      cast.DrawKeySig?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.LIGATURE)) {
      cast.DrawLigature?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.LIQUESCENT)) {
      cast.DrawLiquescent?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.MENSUR)) {
      cast.DrawMensur?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.METERSIG)) {
      this.DrawMeterSigElement(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.MREST)) {
      cast.DrawMRest?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.MRPT)) {
      cast.DrawMRpt?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.MRPT2)) {
      cast.DrawMRpt2?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.MSPACE)) {
      cast.DrawMSpace?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.MULTIREST)) {
      cast.DrawMultiRest?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.MULTIRPT)) {
      cast.DrawMultiRpt?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.NC)) {
      cast.DrawNc?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.NOTE)) {
      cast.DrawDurationElement?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.NEUME)) {
      cast.DrawNeume?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.ORISCUS)) {
      cast.DrawOriscus?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.PLICA)) {
      cast.DrawPlica?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.PROPORT)) {
      cast.DrawProport?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.QUILISMA)) {
      cast.DrawQuilisma?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.STROPHICUS)) {
      cast.DrawStrophicus?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.REST)) {
      cast.DrawDurationElement?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.SPACE)) {
      cast.DrawSpace?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.STEM)) {
      cast.DrawStem?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.SYL)) {
      cast.DrawSyl?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.SYLLABLE)) {
      cast.DrawSyllable?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.TABDURSYM)) {
      cast.DrawTabDurSym?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.TABGRP)) {
      cast.DrawTabGrp?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.TUPLET)) {
      cast.DrawTuplet?.(dc, element, layer, staff, measure);
    }
    else if (e.Is(C.TUPLET_BRACKET)) {
      const tupletBracket = element as unknown as ViewElementTupletPartLike;
      const showHidden = ((this.m_doc!.GetOptions().m_showHidden?.GetValue() ?? false) && tupletBracket.GetBracketVisible() === BOOLEAN_false);
      dc.StartGraphic(element, (showHidden ? CSS_SHOW_HIDDEN : ""), element.GetID());
      dc.EndGraphic(element, this);
      addToList(element);
    }
    else if (e.Is(C.TUPLET_NUM)) {
      const tupletNum = element as unknown as ViewElementTupletPartLike;
      const showHidden = ((this.m_doc!.GetOptions().m_showHidden?.GetValue() ?? false) && tupletNum.GetNumVisible() === BOOLEAN_false);
      dc.StartGraphic(element, (showHidden ? CSS_SHOW_HIDDEN : ""), element.GetID());
      dc.EndGraphic(element, this);
      addToList(element);
    }
    else if (e.Is(C.VOLTA)) {
      cast.DrawVolta?.(dc, element, layer, staff, measure);
    }
    else if (e.IsLyricElement()) {
      cast.DrawLyricElement?.(dc, element, layer, staff, measure);
    }
    else {
      // This should never happen
      LogError("Element '%s' cannot be drawn", e.GetClassName());
    }

    this.EndOffset(dc, element);
  }

  public DrawAccid(dc: ViewPageDeviceContextLike, element: ViewElementAccidLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawAccid requires a device context.');
    if (!element) throw new Error('View::DrawAccid requires an element.');
    if (!layer) throw new Error('View::DrawAccid requires a layer.');
    if (!staff) throw new Error('View::DrawAccid requires a staff.');
    if (!measure) throw new Error('View::DrawAccid requires a measure.');

    const accid = element;
    const doc = this.m_doc!;
    const showAccidGes = doc.GetOptions().m_showHidden?.GetValue() ?? false;
    const showHidden = showAccidGes && ((accid as unknown as { GetParent(): { Is(id: number): boolean } }).GetParent().Is(ClassId.ACCID));

    // This can happen with accid within note with only accid.ges
    // We still create an graphic in the output
    if (!accid.HasAccid() || staff.IsTablature?.()) {
      dc.StartGraphic(element, "", element.GetID());
      accid.SetEmptyBB();
      if (showAccidGes) this.DrawLayerChildren(dc, element, layer, staff, measure);
      dc.EndGraphic(element, this);
      return;
    }

    let drawingElement: unknown = element;
    const editorialAccid = accid.GetFloatingObject();
    if (editorialAccid) {
      drawingElement = editorialAccid;
    }

    dc.StartGraphic(drawingElement, (showHidden ? CSS_SHOW_HIDDEN : ""), element.GetID());

    const notationType = staff.m_drawingNotationType;
    const accidStr = accid.GetSymbolStr(notationType);

    let x = accid.GetDrawingX();
    let y = accid.GetDrawingY();

    const pAccid = { x, y };
    this.CalcOffset(dc, pAccid);
    x = pAccid.x; y = pAccid.y;

    // Set with edit `@func`
    if (editorialAccid) {
      const system = (measure as unknown as { GetFirstAncestor(id: number): unknown }).GetFirstAncestor(ClassId.SYSTEM) as unknown as {
        SetCurrentFloatingPositioner(staffN: number, positioner: unknown, element: unknown, staff: unknown): boolean;
      } | null;
      if (!system) throw new Error('View::DrawAccid: system required for editorial accid.');
      if (system.SetCurrentFloatingPositioner((staff as unknown as { GetN(): number }).GetN(), editorialAccid, accid, staff)) {
        x = (editorialAccid as unknown as { GetDrawingX(): number }).GetDrawingX();
        y = (editorialAccid as unknown as { GetDrawingY(): number }).GetDrawingY();
        const p2 = { x, y };
        this.CalcOffset(dc, p2);
        x = p2.x; y = p2.y;
      }
    }

    if (accid.HasPlace() || accid.HasOnstaff() || (accid.GetFunc() === 2 /* accidLog_FUNC_edit */)) {
      const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);

      // look at the note position and adjust it if necessary
      const note = (accid as unknown as { GetFirstAncestor(id: number, depth?: number): ViewElementNoteLike | null }).GetFirstAncestor(ClassId.NOTE, View.VE_MAX_ACCID_DEPTH);
      if (!editorialAccid && note) {
        const staffTop = staff.GetDrawingY();
        const staffBottom = staffTop - Math.imul(Math.imul((staff.m_drawingLines - 1) | 0, unit), 2);
        const drawingDur = note.GetDrawingDur();
        let noteTop = (note as unknown as ViewElementNoteBoundsLike).GetDrawingTop(doc, staff.m_drawingStaffSize);
        let noteBottom = (note as unknown as ViewElementNoteBoundsLike).GetDrawingBottom(doc, staff.m_drawingStaffSize);
        let onStaff = (accid.GetOnstaff() === BOOLEAN_true);

        // Adjust position to mensural stems
        if (note.IsMensuralDur()) {
          if (accid.GetFunc() !== 2 /* accidLog_FUNC_edit */) onStaff = (accid.GetOnstaff() !== BOOLEAN_false);
          const verticalCenter = staffTop - Math.imul((staff.m_drawingLines - 1) | 0, unit);
          const stemDir = this.GetMensuralStemDir(layer as never, note as never, verticalCenter);
          if ((drawingDur > DURATION_1) || (drawingDur < DURATION_breve)) {
            if (stemDir === STEMDIRECTION_up) {
              noteTop = note.GetDrawingY() + unit * View.VE_STANDARD_STEMLENGTH;
              noteBottom -= unit;
            }
            else {
              noteBottom = note.GetDrawingY() - unit * View.VE_STANDARD_STEMLENGTH;
            }
          }
        }
        if (accid.GetPlace() === STAFFREL_below) {
          y = ((noteBottom <= staffBottom) || onStaff) ? noteBottom : staffBottom;
        }
        else {
          y = ((noteTop >= staffTop) || onStaff) ? noteTop : staffTop;
        }
      }

      // Increase the x position of the accid
      if (note) x += note.GetDrawingRadius(doc);

      const extend = new TextExtend();
      dc.SetFont(doc.GetDrawingSmuflFont(staff.m_drawingStaffSize, accid.GetDrawingCueSize()));
      dc.GetSmuflTextExtent(accid.GetSymbolStr(notationType), extend);
      dc.ResetFont();
      y = (accid.GetPlace() === STAFFREL_below) ? y - extend.m_ascent - unit : y + extend.m_descent + unit;
    }

    this.DrawSmuflString(dc, x, y, accidStr, HORIZONTALALIGNMENT_center, staff.m_drawingStaffSize, accid.GetDrawingCueSize(), true);

    if (showAccidGes) this.DrawLayerChildren(dc, element, layer, staff, measure);

    dc.EndGraphic(drawingElement, this);
  }

  public DrawArtic(dc: ViewPageDeviceContextLike, element: ViewElementArticLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawArtic requires a device context.');
    if (!element) throw new Error('View::DrawArtic requires an element.');
    if (!layer) throw new Error('View::DrawArtic requires a layer.');
    if (!staff) throw new Error('View::DrawArtic requires a staff.');
    if (!measure) throw new Error('View::DrawArtic requires a measure.');

    const artic = element;
    const doc = this.m_doc!;

    /************** draw the artic **************/

    let x = artic.GetDrawingX();
    let y = artic.GetDrawingY();

    const pArtic = { x, y };
    this.CalcOffset(dc, pArtic);
    x = pArtic.x; y = pArtic.y;

    const drawingCueSize = artic.GetDrawingCueSize();

    dc.SetFont(doc.GetDrawingSmuflFont(staff.m_drawingStaffSize, drawingCueSize));

    const articValue = artic.GetArticFirst();
    const place = artic.GetDrawingPlace();

    const code = artic.GetArticGlyph(articValue, place);
    const [enclosingFront, enclosingBack] = artic.GetEnclosingGlyphs();

    // Skip it if we do not have it in the font (for now - we should log / document this somewhere)
    if (code === 0) {
      artic.SetEmptyBB();
      dc.ResetFont();
      return;
    }

    // The correction for centering the glyph
    const xCorr = Math.trunc(doc.GetGlyphWidth(code, staff.m_drawingStaffSize, drawingCueSize) / 2);

    const glyphHeight = doc.GetGlyphHeight(code, staff.m_drawingStaffSize, drawingCueSize);

    // The height by which enclosing brackets exceed the artic symbol
    let exceedingHeight = 0;
    for (const symbol of [enclosingFront, enclosingBack]) {
      if (symbol === 0) continue;
      const symbolHeight = doc.GetGlyphHeight(symbol, staff.m_drawingStaffSize, drawingCueSize);
      exceedingHeight = Math.max(exceedingHeight, symbolHeight - glyphHeight);
    }

    // Center the glyph if necessary
    let yCorr = 0;
    if (artic.IsCentered(articValue) && !enclosingFront && !enclosingBack) {
      y += (place === STAFFREL_above) ? -Math.trunc(glyphHeight / 2) : Math.trunc(glyphHeight / 2);
    }
    else {
      y += (place === STAFFREL_above) ? Math.trunc(exceedingHeight / 2) : -Math.trunc(exceedingHeight / 2);
      // @glyph.num/name are (usually?) aligned for placement above and needs to be shifted when below
      if ((artic.HasGlyphNum() || artic.HasGlyphName()) && (place === STAFFREL_below)) {
        yCorr += glyphHeight;
      }
    }

    // The relative vertical displacement of enclosing brackets
    let yCorrEncl = (place === STAFFREL_above) ? -Math.trunc(glyphHeight / 2) : Math.trunc(glyphHeight / 2);

    // Adjust the baseline for glyph above the baseline in SMuFL
    if (artic.VerticalCorr(code, place)) {
      y -= glyphHeight;
      yCorrEncl = -Math.trunc(glyphHeight / 2);
    }

    // Draw glyph including possible enclosing brackets
    dc.StartGraphic(element, "", element.GetID());

    if (enclosingFront) {
      let xCorrEncl = Math.max(xCorr, Math.trunc(doc.GetDrawingUnit(staff.m_drawingStaffSize) * 2 / 3));
      xCorrEncl += doc.GetGlyphWidth(enclosingFront, staff.m_drawingStaffSize, drawingCueSize);
      this.DrawSmuflCode(dc, x - xCorrEncl, y - yCorrEncl, enclosingFront, staff.m_drawingStaffSize, drawingCueSize);
    }

    this.DrawSmuflCode(dc, x - xCorr, y - yCorr, code, staff.m_drawingStaffSize, drawingCueSize);

    if (enclosingBack) {
      const xCorrEncl = Math.max(xCorr, Math.trunc(doc.GetDrawingUnit(staff.m_drawingStaffSize) * 2 / 3));
      this.DrawSmuflCode(dc, x + xCorrEncl, y - yCorrEncl, enclosingBack, staff.m_drawingStaffSize, drawingCueSize);
    }

    dc.EndGraphic(element, this);

    dc.ResetFont();
  }

  public DrawBarLineLayerElement(dc: ViewPageDeviceContextLike, element: ViewElementBarLineLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawBarLine(layer element) requires a device context.');
    if (!element) throw new Error('View::DrawBarLine(layer element) requires an element.');
    if (!layer) throw new Error('View::DrawBarLine(layer element) requires a layer.');
    if (!staff) throw new Error('View::DrawBarLine(layer element) requires a staff.');
    if (!measure) throw new Error('View::DrawBarLine(layer element) requires a measure.');

    const barLine = element;
    const doc = this.m_doc!;

    if (barLine.GetForm() === BARRENDITION_invis) {
      barLine.SetEmptyBB();
      return;
    }
    const drawingStaffDef = staff.m_drawingStaffDef;
    // Determine the method
    if (!drawingStaffDef) throw new Error('View::DrawBarLine(layer element): drawing staffDef required.');
    const [, method] = barLine.GetMethodFromContext(drawingStaffDef);
    const resolvedMethod = barLine.HasMethod() ? barLine.GetMethod() : method;

    dc.StartGraphic(element, "", element.GetID());

    let yTop = staff.GetDrawingY();
    let yBottom = yTop - Math.imul((staff.m_drawingLines - 1) | 0, doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize));

    if (resolvedMethod === BARMETHOD_takt) {
      yTop += doc.GetDrawingUnit(staff.m_drawingStaffSize);
      yBottom = yTop - doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
    }

    const offset = (yTop === yBottom) ? doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize) : 0;

    this.DrawBarLine(dc, yTop + offset, yBottom - offset, barLine as never, barLine.GetForm());
    if (barLine.HasRepetitionDots()) {
      this.DrawBarLineDots(dc, staff, barLine as never);
    }

    dc.EndGraphic(element, this);
  }

  public DrawBeatRpt(dc: ViewPageDeviceContextLike, element: ViewElementBeatRptLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawBeatRpt requires a device context.');
    if (!element) throw new Error('View::DrawBeatRpt requires an element.');
    if (!layer) throw new Error('View::DrawBeatRpt requires a layer.');
    if (!staff) throw new Error('View::DrawBeatRpt requires a staff.');
    if (!measure) throw new Error('View::DrawBeatRpt requires a measure.');

    const beatRpt = element;
    const doc = this.m_doc!;

    dc.StartGraphic(element, "", element.GetID());

    const staffSize = staff.m_drawingStaffSize;
    const xSymbol = element.GetDrawingX();
    const ySymbol = element.GetDrawingY() - (staff.m_drawingLines - 1) * doc.GetDrawingUnit(staffSize);

    if (beatRpt.GetSlash() === 6 /* BEATRPT_REND_mixed */) {
      this.DrawSmuflCode(dc, xSymbol, ySymbol, SMUFL_E501_repeat2Bars, staffSize, false);
    }
    else {
      const slash = SMUFL_E504_repeatBarSlash;
      const slashNum = beatRpt.HasSlash() ? beatRpt.GetSlash() : 1;
      const halfWidth = Math.trunc(doc.GetGlyphWidth(slash, staffSize, false) / 2);
      for (let i = 0; i < slashNum; ++i) {
        this.DrawSmuflCode(dc, xSymbol + i * halfWidth, ySymbol, slash, staffSize, false);
      }
    }

    dc.EndGraphic(element, this);
  }

  public DrawBTrem(dc: ViewPageDeviceContextLike, element: ViewElementBTremLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawBTrem requires a device context.');
    if (!element) throw new Error('View::DrawBTrem requires an element.');
    if (!layer) throw new Error('View::DrawBTrem requires a layer.');
    if (!staff) throw new Error('View::DrawBTrem requires a staff.');
    if (!measure) throw new Error('View::DrawBTrem requires a measure.');

    const bTrem = element;
    const doc = this.m_doc!;
    const staffSize = staff.m_drawingStaffSize;
    let xOffset = 0;
    let yTop = staff.GetDrawingY();
    let yBottom = yTop - (staff.m_drawingLines - 1) * doc.GetDrawingDoubleUnit(staffSize);

    // Get the chord or note child
    let bTremElement: ViewElementChordChildLike | null = (bTrem as unknown as { FindDescendantByType(id: number): unknown }).FindDescendantByType(ClassId.CHORD) as ViewElementChordChildLike | null;
    if (!bTremElement) bTremElement = (bTrem as unknown as { FindDescendantByType(id: number): unknown }).FindDescendantByType(ClassId.NOTE) as ViewElementChordChildLike | null;
    if (!bTremElement) {
      bTrem.SetEmptyBB();
      return;
    }

    dc.StartGraphic(element, "", element.GetID());

    this.DrawLayerChildren(dc, element, layer, staff, measure);

    if (bTremElement.Is(ClassId.CHORD)) {
      const childChord = bTremElement;
      xOffset = childChord.GetDrawingRadius(doc);
      yTop = (childChord.GetDrawingTop(doc, staffSize) > yTop) ? childChord.GetDrawingTop(doc, staffSize) : yTop;
      yBottom = (childChord.GetDrawingBottom(doc, staffSize) < yBottom) ? childChord.GetDrawingBottom(doc, staffSize) : yBottom;
    }
    else if (bTremElement.Is(ClassId.NOTE)) {
      const childNote = bTremElement;
      if (childNote.HasStemSameasNote?.() && childNote.GetStemSameasRole?.() === 1 /* SAMEAS_SECONDARY */) {
        bTrem.SetEmptyBB();
        dc.EndGraphic(element, this);
        return;
      }
      xOffset = childNote.GetDrawingRadius(doc);
      yTop = (childNote.GetDrawingTop(doc, staffSize) > yTop) ? childNote.GetDrawingTop(doc, staffSize) : yTop;
      yBottom = (childNote.GetDrawingBottom(doc, staffSize) < yBottom) ? childNote.GetDrawingBottom(doc, staffSize) : yBottom;
    }

    (this as unknown as { DrawStemMod?(dc: unknown, e: unknown, s: unknown): void }).DrawStemMod?.(dc, element, staff);

    const showHidden = doc.GetOptions().m_showHidden?.GetValue() ?? false;

    // draw the (tuplet) number
    if (bTrem.HasNum() && (showHidden || bTrem.GetNumVisible() !== BOOLEAN_false)) {
      dc.StartCustomGraphic("bTremNum", (bTrem.GetNumVisible() === BOOLEAN_false) ? CSS_SHOW_HIDDEN : "");
      dc.SetFont(doc.GetDrawingSmuflFont(staff.m_drawingStaffSize, false));
      // calculate the extend of the number
      const extend = new TextExtend();
      const figures = this.IntToTupletFigures(bTrem.GetNum());
      dc.GetSmuflTextExtent(figures, extend);
      let yNum = yTop + doc.GetDrawingUnit(staffSize);
      if (bTrem.GetNumPlace() === STAFFREL_basic_below) {
        yNum = yBottom - doc.GetDrawingUnit(staffSize) - extend.m_height;
      }
      dc.DrawMusicText(figures, this.ToDeviceContextX(element.GetDrawingX() + xOffset - Math.trunc(extend.m_width / 2)), this.ToDeviceContextY(yNum));
      dc.ResetFont();
      dc.EndCustomGraphic();
    }

    dc.EndGraphic(element, this);
  }

  public DrawChord(dc: ViewPageDeviceContextLike, element: ViewElementChordLike, layer: ViewPageLayerLike, staffIn: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawChord requires a device context.');
    if (!element) throw new Error('View::DrawChord requires an element.');

    const chord = element;
    let staff = staffIn;

    dc.StartGraphic(chord, "", chord.GetID());

    if (chord.HasCluster()) {
      this.DrawChordCluster(dc, chord, layer, staff, measure);
      return;
    }

    if (chord.m_crossStaff) staff = chord.m_crossStaff;

    chord.ResetDrawingList();

    /************ Draw children (notes, accidentals, etc) ************/

    this.DrawLayerChildren(dc, chord, layer, staff, measure);

    dc.EndGraphic(chord, this);
  }

  public DrawChordCluster(dc: ViewPageDeviceContextLike, chord: ViewElementChordLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawChordCluster requires a device context.');
    if (!chord) throw new Error('View::DrawChordCluster requires a chord.');
    if (!layer) throw new Error('View::DrawChordCluster requires a layer.');
    if (!staff) throw new Error('View::DrawChordCluster requires a staff.');
    if (!measure) throw new Error('View::DrawChordCluster requires a measure.');

    const doc = this.m_doc!;
    const topNote = chord.GetTopNote();
    const bottomNote = chord.GetBottomNote();

    const staffSize = staff.m_drawingStaffSize;
    const unit = doc.GetDrawingUnit(staffSize);
    const x = chord.GetDrawingX();
    const y1 = topNote.GetDrawingY() + unit;
    const y2 = bottomNote.GetDrawingY() - unit;
    const width = 2 * topNote.GetDrawingRadius(doc);

    dc.StartCustomGraphic("notehead");

    if (chord.GetActualDur() < DURATION_4) {
      const line = Math.trunc(unit / 2);
      this.DrawNotFilledRectangle(dc, x + Math.trunc(line / 2), y1 - Math.trunc(line / 2), x + width - Math.trunc(line / 2), y2 + Math.trunc(line / 2), line, 0);
    }
    else {
      this.DrawFilledRectangle(dc, x, y1, x + width, y2);
    }

    dc.EndCustomGraphic();

    if (chord.GetCluster() !== 3 /* CLUSTER_chromatic */) {
      const staffTop = staff.GetDrawingY();
      const staffBottom = staffTop - (staff.m_drawingLines - 1) * unit * 2;
      const accidGlyph = (chord.GetCluster() === 2 /* CLUSTER_black */) ? SMUFL_E260_accidentalFlat : SMUFL_E261_accidentalNatural;
      const accidX = x + Math.trunc((width - doc.GetGlyphWidth(accidGlyph, staffSize, true)) / 2);

      let accidY: number;
      if (chord.GetDrawingStemDir() === STEMDIRECTION_down) {
        accidY = Math.max(staffTop, y1) + unit - doc.GetGlyphBottom(accidGlyph, staffSize, true);
      }
      else {
        accidY = Math.min(staffBottom, y2) - unit - doc.GetGlyphTop(accidGlyph, staffSize, true);
      }

      dc.StartCustomGraphic("accid");
      this.DrawSmuflCode(dc, accidX, accidY, accidGlyph, staffSize, true, true);
      dc.EndCustomGraphic();
    }

    // Draw dots and stem

    dc.StartCustomGraphic("dots");
    const cueFactor = chord.GetDrawingCueSize() ? (doc.GetOptions().m_graceFactor?.GetValue() ?? 1) : 1.0;
    const dotsX = x + width + unit * cueFactor;
    (this as unknown as { DrawDotsPart?(dc: unknown, x: number, y: number, dotCount: number, s: unknown, cue: boolean): void }).DrawDotsPart?.(dc, dotsX, topNote.GetDrawingY(), chord.GetDots(), staff, chord.GetDrawingCueSize());
    if ((y1 - y2) > 5 * unit) {
      (this as unknown as { DrawDotsPart?(dc: unknown, x: number, y: number, dotCount: number, s: unknown, cue: boolean): void }).DrawDotsPart?.(dc, dotsX, bottomNote.GetDrawingY(), chord.GetDots(), staff, chord.GetDrawingCueSize());
    }
    dc.EndCustomGraphic();

    const stem = (chord as unknown as { GetFirst(id: number): unknown }).GetFirst(ClassId.STEM) as ViewElementStemLike;
    (this as unknown as { DrawStem?(dc: unknown, stem: unknown, l: unknown, s: unknown, m: unknown): void }).DrawStem?.(dc, stem, layer, staff, measure);
  }

  public DrawClef(dc: ViewPageDeviceContextLike, element: ViewElementClefLike, layer: ViewPageLayerLike, staffIn: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawClef requires a device context.');
    if (!element) throw new Error('View::DrawClef requires an element.');
    if (!layer) throw new Error('View::DrawClef requires a layer.');
    if (!staffIn) throw new Error('View::DrawClef requires a staff.');
    if (!measure) throw new Error('View::DrawClef requires a measure.');

    const showHidden = this.m_doc!.GetOptions().m_showHidden?.GetValue() ?? false;
    const doc = this.m_doc!;
    const clef = element;
    let staff = staffIn;

    if (clef.m_crossStaff) staff = clef.m_crossStaff;

    // hidden clef
    if (!showHidden && (clef.GetVisible() === BOOLEAN_false)) {
      dc.StartGraphic(element, "", element.GetID());
      clef.SetEmptyBB();
      dc.EndGraphic(element, this);
      return;
    }

    if (staff.IsTablature?.()) {
      this.DrawTabClef(dc, element as never, layer as never, staff as never, measure as never);
      return;
    }

    let x: number, y: number;
    y = staff.GetDrawingY();
    x = element.GetDrawingX();

    const pClef = { x, y };
    this.CalcOffset(dc, pClef);
    x = pClef.x; y = pClef.y;

    const sym = clef.GetClefGlyph(staff.m_drawingNotationType);

    if (sym === 0) {
      clef.SetEmptyBB();
      return;
    }

    if (clef.HasLine()) {
      // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
      y -= Math.imul(doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize), (staff.m_drawingLines - clef.GetLine()) | 0);
      if ((staff as unknown as ViewElementRotatingStaffLike).HasDrawingRotation?.()) {
        y -= (staff as unknown as ViewElementRotatingStaffLike).GetDrawingRotationOffsetFor?.(x) ?? 0;
      }
    }
    else if (clef.GetShape() === 5 /* CLEFSHAPE_perc */) {
      // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
      y -= Math.imul(doc.GetDrawingUnit(staff.m_drawingStaffSize), (staff.m_drawingLines - 1) | 0);
    }
    else {
      // we have no information where to put it
      return;
    }

    dc.StartGraphic(element, "", element.GetID());

    let previousFont = "";
    if (clef.HasFontname()) {
      const resources = doc.GetResourcesForModification!() as unknown as { GetCurrentFont(): string; SetCurrentFont(name: string): void };
      previousFont = resources.GetCurrentFont();
      resources.SetCurrentFont(clef.GetFontname());
    }

    this.DrawSmuflCode(dc, x, y, sym, staff.m_drawingStaffSize, false);

    // Possibly draw enclosing brackets
    this.DrawClefEnclosing(dc, clef, staff, sym, x, y);

    if (previousFont !== "") {
      const resources = doc.GetResourcesForModification!() as unknown as { GetCurrentFont(): string; SetCurrentFont(name: string): void };
      resources.SetCurrentFont(previousFont);
    }

    dc.EndGraphic(element, this);
  }

  public DrawClefEnclosing(dc: ViewPageDeviceContextLike, clef: ViewElementClefLike, staff: ViewPageStaffLike, glyph: number, x: number, y: number): void {
    const doc = this.m_doc as unknown as ViewElementDocGlyphsLike;
    if ((clef.GetEnclose() === ENCLOSURE_brack) || (clef.GetEnclose() === 9 /* ENCLOSURE_box */)) {
      const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);
      const glyphSize = (staff as unknown as { GetDrawingStaffNotationSize(): number }).GetDrawingStaffNotationSize();
      x += doc.GetGlyphLeft(glyph, glyphSize, false);
      y += doc.GetGlyphBottom(glyph, glyphSize, false);
      const height = doc.GetGlyphHeight(glyph, glyphSize, false);
      const width = doc.GetGlyphWidth(glyph, glyphSize, false);
      const offset = Math.trunc(unit * 3 / 4);
      // We use overlapping brackets to draw boxes :)
      const bracketWidth = (clef.GetEnclose() === ENCLOSURE_brack) ? unit : (width + offset);
      const verticalThickness = doc.GetDrawingStemWidth(glyphSize);
      const horizontalThickness = ((clef.GetEnclose() === ENCLOSURE_brack) ? 2 : 1) * verticalThickness;

      this.DrawEnclosingBrackets(dc, x, y, height, width, offset, bracketWidth, horizontalThickness, verticalThickness);
    }
    else if (clef.HasEnclose() && (clef.GetEnclose() !== ENCLOSURE_NONE)) {
      LogWarning("Only drawing of enclosing brackets and boxes is supported for clef.");
    }
  }

  public DrawCustos(dc: ViewPageDeviceContextLike, element: ViewElementCustosLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawCustos requires a device context.');
    if (!element) throw new Error('View::DrawCustos requires an element.');
    if (!layer) throw new Error('View::DrawCustos requires a layer.');
    if (!staff) throw new Error('View::DrawCustos requires a staff.');
    if (!measure) throw new Error('View::DrawCustos requires a measure.');

    const doc = this.m_doc!;
    const custos = element;

    dc.StartGraphic(element, "", element.GetID());

    // Select glyph to use for this custos
    const sym = custos.GetCustosGlyph(staff.m_drawingNotationType);

    let x = element.GetDrawingX();
    let y = element.GetDrawingY();

    const pCustos = { x, y };
    this.CalcOffset(dc, pCustos);
    x = pCustos.x; y = pCustos.y;

    // Because SMuFL does not have the origin corresponding to the pitch as for notes, we need to correct it.
    // This will remain approximate
    if (!IsNeumeType(staff.m_drawingNotationType)) {
      y -= doc.GetDrawingUnit(staff.m_drawingStaffSize);
    }

    if ((staff as unknown as ViewElementRotatingStaffLike).HasDrawingRotation?.()) {
      y -= (staff as unknown as ViewElementRotatingStaffLike).GetDrawingRotationOffsetFor?.(x) ?? 0;
    }

    this.DrawSmuflCode(dc, x, y, sym, staff.m_drawingStaffSize, false, true);

    /************ Draw children (accidentals, etc) ************/

    this.DrawLayerChildren(dc, custos as never, layer, staff, measure);

    dc.EndGraphic(element, this);
  }

  public DrawDotElement(dc: ViewPageDeviceContextLike, element: ViewElementDotLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawDot requires a device context.');
    if (!element) throw new Error('View::DrawDot requires an element.');
    if (!layer) throw new Error('View::DrawDot requires a layer.');
    if (!staff) throw new Error('View::DrawDot requires a staff.');
    if (!measure) throw new Error('View::DrawDot requires a measure.');

    const doc = this.m_doc!;
    const dot = element;

    dc.StartGraphic(element, "", element.GetID());

    if (dot.m_drawingPreviousElement && (dot.m_drawingPreviousElement as unknown as { IsInLigature(): boolean }).IsInLigature()) {
      this.DrawDotInLigature(dc, element as never, layer as never, staff as never, measure as never);
    }
    else {
      let x = element.GetDrawingX();
      let y = element.GetDrawingY();

      const pDot = { x, y };
      this.CalcOffset(dc, pDot);
      x = pDot.x; y = pDot.y;

      if (doc.GetType?.() !== 2 /* DocType::Transcription */) {
        // Use the note to which the dot points to for position if no next element or for augmentation dots
        if (dot.m_drawingPreviousElement && (!dot.m_drawingNextElement || dot.GetForm() === 1 /* dotLog_FORM_aug */)) {
          x += Math.trunc(doc.GetDrawingUnit(staff.m_drawingStaffSize) * 7 / 2);
          y = dot.m_drawingPreviousElement.GetDrawingY();
          (this as unknown as { DrawDotsPart?(dc: unknown, x: number, y: number, dotCount: number, s: unknown, cue: boolean): void }).DrawDotsPart?.(dc, x, y, 1, staff, false);
        }
        else if (dot.m_drawingPreviousElement && dot.m_drawingNextElement) {
          // Do not take into account the spacing since it is placed in-between
          (dc as unknown as { DeactivateGraphicX(): void }).DeactivateGraphicX();
          x += Math.trunc((dot.m_drawingNextElement.GetDrawingX() - dot.m_drawingPreviousElement.GetDrawingX()) / 2);
          x += dot.m_drawingPreviousElement.GetDrawingRadius(doc);
          y = dot.m_drawingPreviousElement.GetDrawingY();
          (this as unknown as { DrawDotsPart?(dc: unknown, x: number, y: number, dotCount: number, s: unknown, cue: boolean): void }).DrawDotsPart?.(dc, x, y, 1, staff, false);
          (dc as unknown as { ReactivateGraphic(): void }).ReactivateGraphic();
        }
      }
      else {
        (this as unknown as { DrawDotsPart?(dc: unknown, x: number, y: number, dotCount: number, s: unknown, cue: boolean): void }).DrawDotsPart?.(dc, x, y, 1, staff, false);
      }
    }

    dc.EndGraphic(element, this);
  }

  public DrawDots(dc: ViewPageDeviceContextLike, element: ViewElementDotsLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawDots requires a device context.');
    if (!element) throw new Error('View::DrawDots requires an element.');
    if (!layer) throw new Error('View::DrawDots requires a layer.');
    if (!staff) throw new Error('View::DrawDots requires a staff.');
    if (!measure) throw new Error('View::DrawDots requires a measure.');

    const doc = this.m_doc!;
    const dots = element;
    const offsetFactor = dots.GetDrawingCueSize() ? (doc.GetOptions().m_graceFactor?.GetValue() ?? 1) : 1.0;

    dc.StartGraphic(element, "", element.GetID());

    for (const [mapStaff, locs] of dots.GetMapOfDotLocs()) {
      const dotStaff = (mapStaff as ViewPageStaffLike | null) ?? staff;
      // C++ computes y in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
      let y = dotStaff.GetDrawingY() - Math.imul(doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize), (dotStaff.m_drawingLines - 1) | 0);
      let x = Math.trunc(dots.GetDrawingX() + doc.GetDrawingUnit(staff.m_drawingStaffSize) * offsetFactor);
      const pDots = { x, y };
      this.CalcOffset(dc, pDots);
      x = pDots.x; y = pDots.y;

      for (const loc of locs) {
        (this as unknown as { DrawDotsPart?(dc: unknown, x: number, y: number, dotCount: number, s: unknown, cue: boolean): void }).DrawDotsPart?.(dc, x, y + loc * doc.GetDrawingUnit(staff.m_drawingStaffSize), dots.GetDots(), dotStaff, dots.GetDrawingCueSize());
      }
    }

    dc.EndGraphic(element, this);
  }

  public DrawDurationElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike & { Is(id: number): boolean }, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawDurationElement requires a device context.');
    if (!element) throw new Error('View::DrawDurationElement requires an element.');
    if (!layer) throw new Error('View::DrawDurationElement requires a layer.');
    if (!staff) throw new Error('View::DrawDurationElement requires a staff.');
    if (!measure) throw new Error('View::DrawDurationElement requires a measure.');

    const cast = this as unknown as Record<string, ((dc: unknown, e: unknown, l: unknown, s: unknown, m: unknown) => void) | undefined>;
    if (element.Is(ClassId.CHORD)) {
      cast.DrawChord?.(dc, element, layer, staff, measure);
    }
    else if (element.Is(ClassId.NOTE)) {
      cast.DrawNote?.(dc, element, layer, staff, measure);
    }
    else if (element.Is(ClassId.REST)) {
      cast.DrawRest?.(dc, element, layer, staff, measure);
    }
  }

  public DrawFlag(dc: ViewPageDeviceContextLike, element: ViewElementFlagLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawFlag requires a device context.');
    if (!element) throw new Error('View::DrawFlag requires an element.');
    if (!layer) throw new Error('View::DrawFlag requires a layer.');
    if (!staff) throw new Error('View::DrawFlag requires a staff.');
    if (!measure) throw new Error('View::DrawFlag requires a measure.');

    const doc = this.m_doc!;
    const flag = element;

    const stem = (flag as unknown as { GetFirstAncestor(id: number): ViewElementStemLike }).GetFirstAncestor(ClassId.STEM);
    if (!stem) throw new Error('View::DrawFlag requires a stem ancestor.');

    let x = flag.GetDrawingX() - Math.trunc(doc.GetDrawingStemWidth(staff.m_drawingStaffSize) / 2);
    let y = flag.GetDrawingY();

    const pFlag = { x, y };
    this.CalcOffset(dc, pFlag);
    x = pFlag.x; y = pFlag.y;

    dc.StartGraphic(element, "", element.GetID());

    const code = flag.GetFlagGlyph(stem.GetDrawingStemDir());
    this.DrawSmuflCode(dc, x, y, code, (staff as unknown as { GetDrawingStaffNotationSize(): number }).GetDrawingStaffNotationSize(), flag.GetDrawingCueSize());

    dc.EndGraphic(element, this);
  }

  public DrawGenericLayerElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawGenericLayerElement requires a device context.');
    if (!element) throw new Error('View::DrawGenericLayerElement requires an element.');
    if (!layer) throw new Error('View::DrawGenericLayerElement requires a layer.');
    if (!staff) throw new Error('View::DrawGenericLayerElement requires a staff.');
    if (!measure) throw new Error('View::DrawGenericLayerElement requires a measure.');

    dc.StartGraphic(element, "", element.GetID());

    dc.EndGraphic(element, this);
  }

  public DrawGraceGrp(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawGraceGrp requires a device context.');
    if (!element) throw new Error('View::DrawGraceGrp requires an element.');
    if (!layer) throw new Error('View::DrawGraceGrp requires a layer.');
    if (!staff) throw new Error('View::DrawGraceGrp requires a staff.');
    if (!measure) throw new Error('View::DrawGraceGrp requires a measure.');

    dc.StartGraphic(element, "", element.GetID());

    // basically nothing to do here
    this.DrawLayerChildren(dc, element, layer, staff, measure);

    dc.EndGraphic(element, this);
  }

  public DrawHalfmRpt(dc: ViewPageDeviceContextLike, element: ViewElementHalfmRptLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawHalfmRpt requires a device context.');
    if (!element) throw new Error('View::DrawHalfmRpt requires an element.');
    if (!layer) throw new Error('View::DrawHalfmRpt requires a layer.');
    if (!staff) throw new Error('View::DrawHalfmRpt requires a staff.');
    if (!measure) throw new Error('View::DrawHalfmRpt requires a measure.');

    const doc = this.m_doc!;
    const halfmRpt = element;

    let x = halfmRpt.GetDrawingX();
    let y = staff.GetDrawingY();

    const pHalf = { x, y };
    this.CalcOffset(dc, pHalf);
    x = pHalf.x; y = pHalf.y;

    x += Math.trunc(doc.GetGlyphWidth(SMUFL_E500_repeat1Bar, staff.m_drawingStaffSize, false) / 2);

    dc.StartGraphic(element, "", element.GetID());

    (this as unknown as { DrawMRptPart?(dc: unknown, x: number, y: number, glyph: number, num: number, chordB: boolean, s: unknown): void }).DrawMRptPart?.(dc, x, y, SMUFL_E500_repeat1Bar, 0, false, staff);

    dc.EndGraphic(element, this);
  }

  public DrawKeySig(dc: ViewPageDeviceContextLike, element: ViewElementKeySigLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawKeySig requires a device context.');
    if (!element) throw new Error('View::DrawKeySig requires an element.');
    if (!layer) throw new Error('View::DrawKeySig requires a layer.');
    if (!staff) throw new Error('View::DrawKeySig requires a staff.');
    if (!measure) throw new Error('View::DrawKeySig requires a measure.');

    const doc = this.m_doc!;
    const showHidden = doc.GetOptions().m_showHidden?.GetValue() ?? false;

    if (staff.IsTablature?.()) {
      // Encoded keySig will not be shown on tablature
      return;
    }

    const keySig = element;

    const drawingClef = keySig.GetDrawingClef();
    const clef = (drawingClef ? drawingClef : (layer as unknown as { GetClef(e: unknown): unknown }).GetClef(element)) as ViewElementClefLike;
    if (!clef) {
      keySig.SetEmptyBB();
      return;
    }
    const clefLocOffset = clef.GetClefLocOffset();

    // hidden key signature
    if (!showHidden && (keySig.GetVisible() === BOOLEAN_false)) {
      dc.StartGraphic(element, "", element.GetID());
      keySig.SetEmptyBB();
      dc.EndGraphic(element, this);
      return;
    }

    // C major (0) key sig and no cancellation
    else if ((keySig.GetAccidCount() === 0) && (keySig.m_drawingCancelAccidCount === 0)) {
      dc.StartGraphic(element, "", element.GetID());
      keySig.SetEmptyBB();
      dc.EndGraphic(element, this);
      return;
    }

    // C major (0) key sig and system scoreDef - cancellation (if any) is done at the end of the previous system
    else if ((keySig.GetScoreDefRole() === ElementScoreDefRole.SCOREDEF_SYSTEM) && (keySig.GetAccidCount() === 0)) {
      keySig.SetEmptyBB();
      return;
    }

    let x = element.GetDrawingX();
    // HARDCODED
    const step = Math.trunc(doc.GetDrawingUnit(staff.m_drawingStaffSize) * View.VE_TEMP_KEYSIG_STEP);

    dc.StartGraphic(element, "", element.GetID());

    let showCancelAfter = false;
    const xRef = { get value() { return x; }, set value(v: number) { x = v; } };

    // Show cancellation if showchange is true (false by default) or if C major
    if ((keySig.GetScoreDefRole() !== ElementScoreDefRole.SCOREDEF_SYSTEM)
      && ((keySig.HasCancelaccid() && (keySig.GetCancelaccid() !== CANCELACCID_none))
        || (keySig.GetAccidCount() === 0))) {
      if (keySig.m_skipCancellation) {
        LogWarning("Cautionary accidentals are skipped if the new or previous KeySig contains KeyAccid children.");
      }
      // For French style (after)
      else if ((keySig.GetCancelaccid() === CANCELACCID_after)
        && (keySig.GetAccidType() === keySig.m_drawingCancelAccidType)) {
        showCancelAfter = true;
      }
      else {
        const beginCancel = (keySig.GetAccidType() === keySig.m_drawingCancelAccidType) ? keySig.GetAccidCount() : 0;
        this.DrawKeySigCancellation(dc, keySig, staff, clef, clefLocOffset, beginCancel, xRef);
      }
    }

    dc.SetFont(doc.GetDrawingSmuflFont(staff.m_drawingStaffSize, false));

    const childList = (keySig as unknown as { GetList(): unknown[] }).GetList();
    for (const child of childList) {
      const keyAccid = child as unknown as ViewElementKeyAccidLike;
      this.DrawKeyAccid(dc, keyAccid, staff, clef, clefLocOffset, xRef);
      x += step;
    }

    if (showCancelAfter) {
      this.DrawKeySigCancellation(dc, keySig, staff, clef, clefLocOffset, keySig.GetAccidCount(), xRef);
    }

    dc.ResetFont();

    dc.EndGraphic(element, this);
  }

  public DrawKeySigCancellation(dc: ViewPageDeviceContextLike, keySig: ViewElementKeySigLike, staff: ViewPageStaffLike, clef: ViewElementClefLike, clefLocOffset: number, beginCancel: number, x: { value: number }): void {
    const doc = this.m_doc as unknown as ViewElementDocGlyphsLike;
    const naturalGlyphWidth = doc.GetGlyphWidth(SMUFL_E261_accidentalNatural, staff.m_drawingStaffSize, false);
    const naturalStep = Math.trunc(doc.GetDrawingUnit(staff.m_drawingStaffSize) * View.VE_TEMP_KEYSIG_NATURAL_STEP);

    for (let i = beginCancel; i < keySig.m_drawingCancelAccidCount; ++i) {
      const pitch = KeySig.GetAccidPnameAt(keySig.m_drawingCancelAccidType, i);
      const loc = PitchInterface.CalcLoc(pitch, KeySig.GetOctave(keySig.m_drawingCancelAccidType, pitch, clef as unknown as Parameters<typeof KeySig.GetOctave>[2]), clefLocOffset);
      const y = staff.GetDrawingY() + (staff as unknown as ViewPageStaffLike).CalcPitchPosYRel!(doc, loc);

      (dc as unknown as { StartCustomGraphic(n: string): void }).StartCustomGraphic("keyAccid");

      this.DrawSmuflCode(dc, x.value, y, SMUFL_E261_accidentalNatural, staff.m_drawingStaffSize, false);

      dc.EndCustomGraphic();

      x.value += naturalGlyphWidth + naturalStep;
    }
  }

  public DrawKeyAccid(dc: ViewPageDeviceContextLike, keyAccid: ViewElementKeyAccidLike, staff: ViewPageStaffLike, clef: ViewElementClefLike, clefLocOffset: number, x: { value: number }): void {
    const doc = this.m_doc as unknown as ViewElementDocGlyphsLike;
    const symbolStr = keyAccid.GetSymbolStr(staff.m_drawingNotationType);
    const loc = keyAccid.CalcStaffLoc(clef, clefLocOffset);
    const y = staff.GetDrawingY() + (staff as unknown as ViewPageStaffLike).CalcPitchPosYRel!(doc, loc);

    (dc as unknown as { StartCustomGraphic(n: string, c: string, id: string): void }).StartCustomGraphic("keyAccid", "", keyAccid.GetID());

    this.DrawSmuflString(dc, x.value, y, symbolStr, HORIZONTALALIGNMENT_left, staff.m_drawingStaffSize, false);

    dc.EndCustomGraphic();

    const extend = new TextExtend();
    dc.GetSmuflTextExtent(symbolStr, extend);
    x.value += extend.m_width;
  }
  public DrawMeterSigElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawMeterSig requires a device context.');
    if (!element) throw new Error('View::DrawMeterSig requires an element.');
    if (!staff) throw new Error('View::DrawMeterSig requires a staff.');
    const meterSig = element as unknown as ViewElementMeterSigLike;
    const E = element as unknown as { SetEmptyBB(): void; GetID(): string; GetVisible(): number };
    const showHidden = (this.m_doc!.GetOptions() as { m_showHidden: { GetValue(): boolean } }).m_showHidden.GetValue();
    if (!showHidden && (meterSig.GetVisible() === BOOLEAN_false)) {
      dc.StartGraphic(element, '', E.GetID());
      E.SetEmptyBB();
      dc.EndGraphic(element, this);
      return;
    }
    this.DrawMeterSig(dc, meterSig, staff as never, 0);
  }

  public DrawMeterSig(dc: ViewPageDeviceContextLike, meterSig: ViewElementMeterSigLike, staff: ViewPageStaffLike, horizOffset: number): void {
    if (!dc) throw new Error('View::DrawMeterSig requires a device context.');
    if (!meterSig) throw new Error('View::DrawMeterSig requires a meterSig.');
    const doc = this.m_doc as unknown as ViewElementDocGlyphsLike;
    const M = meterSig as unknown as {
      GetID(): string; HasSym(): boolean; HasGlyphNum(): boolean; HasGlyphName(): boolean;
      GetForm(): number; HasCount(): boolean; GetUnit(): number; HasFontname(): boolean; GetFontname(): string;
      GetSymbolGlyph(): number; GetEnclosingGlyphs(small: boolean): [number, number]; GetDrawingX(): number; GetCount(): [number[], number];
    };
    const hasSmallEnclosing = (M.HasSym() || (M.GetForm() === 1 /* METERFORM_num */));
    const [enclosingFront, enclosingBack] = M.GetEnclosingGlyphs(hasSmallEnclosing);
    dc.StartGraphic(meterSig, '', M.GetID());
    let previousFont = '';
    if (M.HasFontname()) {
      const resources = doc.GetResourcesForModification!() as unknown as { GetCurrentFont(): string; SetCurrentFont(name: string): void };
      previousFont = resources.GetCurrentFont();
      resources.SetCurrentFont(M.GetFontname());
    }
    // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
    let y = staff.GetDrawingY() - Math.imul(doc.GetDrawingUnit(staff.m_drawingStaffSize), (staff.m_drawingLines - 1) | 0);
    let x = M.GetDrawingX() + horizOffset;
    const glyphSize = staff.GetDrawingStaffNotationSize();
    if (enclosingFront) {
      this.DrawSmuflCode(dc, x, y, enclosingFront, glyphSize, false);
      x += doc.GetGlyphWidth(enclosingFront, glyphSize, false);
    }
    if (M.HasSym() || M.HasGlyphNum() || M.HasGlyphName()) {
      const code = M.GetSymbolGlyph();
      this.DrawSmuflCode(dc, x, y, code, glyphSize, false);
      x += doc.GetGlyphWidth(code, glyphSize, false);
    }
    else if (M.GetForm() === 1 /* METERFORM_num */) {
      x += (this as unknown as { DrawMeterSigFigures?(dc: unknown, x: number, y: number, m: unknown, den: number, s: unknown): number }).DrawMeterSigFigures?.(dc, x, y, meterSig as never, 0, staff as never) ?? 0;
    }
    else if (M.HasCount()) {
      x += (this as unknown as { DrawMeterSigFigures?(dc: unknown, x: number, y: number, m: unknown, den: number, s: unknown): number }).DrawMeterSigFigures?.(dc, x, y, meterSig as never, M.GetUnit(), staff as never) ?? 0;
    }
    if (enclosingBack) {
      this.DrawSmuflCode(dc, x, y, enclosingBack, glyphSize, false);
    }
    if (previousFont !== '') {
      const resources = doc.GetResourcesForModification!() as unknown as { SetCurrentFont(name: string): void };
      resources.SetCurrentFont(previousFont);
    }
    dc.EndGraphic(meterSig, this);
  }

  public DrawMRest(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawMRest requires a device context.');
    if (!element) throw new Error('View::DrawMRest requires an element.');
    if (!measure) throw new Error('View::DrawMRest requires a measure.');
    const doc = this.m_doc!;
    const mRest = element as unknown as { GetParent(): { Is(id: number): boolean } | null; GetCutout(): number; CenterDrawingX(): void; GetDrawingCueSize(): boolean; GetDrawingX(): number; GetID(): string };
    const showHidden = (doc.GetOptions().m_showHidden?.GetValue() ?? false) && (mRest.GetParent()?.Is(ClassId.MSPACE) ?? false);
    dc.StartGraphic(element, (showHidden ? CSS_SHOW_HIDDEN : ''), element.GetID());
    if (mRest.GetCutout() === cutout_CUTOUT_cutout) {
      dc.EndGraphic(element, this);
      return;
    }
    mRest.CenterDrawingX();
    const staffSize = staff.GetDrawingStaffNotationSize();
    const drawingCueSize = mRest.GetDrawingCueSize();
    let x = mRest.GetDrawingX();
    if (!measure.m_measureAligner) throw new Error('View::DrawMRest requires measure aligner.');
    const isDouble = (measure.m_measureAligner.GetMaxTime().compare(new Fraction(2)) >= 0);
    let y = isDouble ? element.GetDrawingY() - doc.GetDrawingDoubleUnit(staffSize) : element.GetDrawingY();
    const p = { x, y };
    this.CalcOffset(dc, p);
    x = p.x; y = p.y;
    const rest = isDouble ? SMUFL_E4E2_restDoubleWhole : SMUFL_E4E3_restWhole;
    x -= Math.trunc(doc.GetGlyphWidth(rest, staffSize, drawingCueSize) / 2);
    this.DrawSmuflCode(dc, x, y, rest, staffSize, drawingCueSize);
    if (!isDouble
      // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
      && (y > staff.GetDrawingY()
        || y < staff.GetDrawingY() - Math.imul((staff.m_drawingLines - 1) | 0, doc.GetDrawingDoubleUnit(staffSize)))) {
      const width = doc.GetGlyphWidth(rest, staffSize, drawingCueSize);
      // C++ declares these as int: option-double products narrow on assignment.
      let ledgerLineThickness = Math.trunc((doc.GetOptions().m_ledgerLineThickness?.GetValue() ?? 0) * doc.GetDrawingUnit(staffSize));
      let ledgerLineExtension = Math.trunc((doc.GetOptions().m_ledgerLineExtension?.GetValue() ?? 0) * doc.GetDrawingUnit(staffSize));
      if (drawingCueSize) {
        ledgerLineThickness = Math.trunc(ledgerLineThickness * (doc.GetOptions().m_graceFactor?.GetValue() ?? 1));
        ledgerLineExtension = Math.trunc(ledgerLineExtension * (doc.GetOptions().m_graceFactor?.GetValue() ?? 1));
      }
      dc.StartCustomGraphic('ledgerLines');
      this.DrawHorizontalLine(dc, x - ledgerLineExtension, x + width + ledgerLineExtension, y, ledgerLineThickness, VRV_UNSET, VRV_UNSET);
      dc.EndCustomGraphic();
    }
    dc.EndGraphic(element, this);
  }

  public DrawMRpt(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawMRpt requires a device context.');
    if (!element) throw new Error('View::DrawMRpt requires an element.');
    const doc = this.m_doc!;
    const mRpt = element as unknown as { CenterDrawingX(): void; HasNum(): boolean; GetNum(): number; m_drawingMeasureCount: number; GetNumVisible(): number; GetNumPlace(): number; GetDrawingX(): number; GetID(): string };
    mRpt.CenterDrawingX();
    const staffSize = staff.GetDrawingStaffNotationSize();
    dc.StartGraphic(element, '', element.GetID());
    this.DrawMRptPart(dc, element.GetDrawingX(), staff.GetDrawingY(), SMUFL_E500_repeat1Bar, 0, false, staff);
    const showHidden = (doc.GetOptions().m_showHidden?.GetValue() ?? false);
    const mRptNum = mRpt.HasNum() ? mRpt.GetNum() : mRpt.m_drawingMeasureCount;
    if ((mRptNum > 0) && (showHidden || mRpt.GetNumVisible() !== BOOLEAN_false)) {
      dc.StartCustomGraphic('mRptNum', (mRpt.GetNumVisible() === BOOLEAN_false) ? CSS_SHOW_HIDDEN : '');
      dc.SetFont(doc.GetDrawingSmuflFont(staffSize, false));
      const extend = new TextExtend();
      const figures = this.IntToTupletFigures(mRptNum);
      dc.GetSmuflTextExtent(figures, extend);
      const staffHeight = (staff.m_drawingLines - 1) * doc.GetDrawingDoubleUnit(staffSize);
      const offset = Math.max(doc.GetGlyphHeight(SMUFL_E500_repeat1Bar, staffSize, false) - staffHeight, 0);
      let yNum = staff.GetDrawingY() + doc.GetDrawingUnit(staffSize) + Math.trunc(offset / 2);
      if (mRpt.GetNumPlace() === STAFFREL_basic_below) {
        yNum -= staff.m_drawingLines * doc.GetDrawingDoubleUnit(staffSize) + extend.m_height + offset;
      }
      dc.DrawMusicText(figures, this.ToDeviceContextX(element.GetDrawingX() - Math.trunc(extend.m_width / 2)), this.ToDeviceContextY(yNum));
      dc.ResetFont();
      dc.EndCustomGraphic();
    }
    dc.EndGraphic(element, this);
  }

  public DrawMRpt2(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawMRpt2 requires a device context.');
    if (!element) throw new Error('View::DrawMRpt2 requires an element.');
    const mRpt2 = element as unknown as { CenterDrawingX(): void };
    mRpt2.CenterDrawingX();
    dc.StartGraphic(element, '', element.GetID());
    this.DrawMRptPart(dc, element.GetDrawingX(), staff.GetDrawingY(), SMUFL_E501_repeat2Bars, 2, true, staff);
    dc.EndGraphic(element, this);
  }

  public DrawMSpace(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawMSpace requires a device context.');
    if (!element) throw new Error('View::DrawMSpace requires an element.');
    const showMSpace = (this.m_doc!.GetOptions().m_showHidden?.GetValue() ?? false);
    dc.StartGraphic(element, '', element.GetID());
    (dc as unknown as { DrawPlaceholder?(x: number, y: number): void }).DrawPlaceholder?.(this.ToDeviceContextX(element.GetDrawingX()), this.ToDeviceContextY(element.GetDrawingY()));
    if (showMSpace) this.DrawLayerChildren(dc, element, layer, staff, measure);
    dc.EndGraphic(element, this);
  }

  public DrawMultiRest(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawMultiRest requires a device context.');
    if (!element) throw new Error('View::DrawMultiRest requires an element.');
    const doc = this.m_doc!;
    const multiRest = element as unknown as { CenterDrawingX(): void; GetDrawingX(): number; HasNum(): boolean; GetNum(): number; HasLoc(): boolean; GetLoc(): number; UseBlockStyle(doc: unknown): boolean; HasWidth(): boolean; AttWidthGetWidth?(): { GetType(): number; GetVu(): number }; GetWidth(): { GetType(): number; GetVu(): number }; GetNumVisible(): number; GetNumPlace(): number; GetID(): string };
    multiRest.CenterDrawingX();
    const staffNotationSize = staff.GetDrawingStaffNotationSize();
    const staffSize = staff.m_drawingStaffSize;
    dc.StartGraphic(element, '', element.GetID());
    let measureWidth = measure.GetInnerWidth!();
    let xCentered = multiRest.GetDrawingX();
    if (layer.GetLast?.() !== element) {
      const object = layer.GetNextOf?.(element) as ViewPageObjectLike | null;
      if (object && object.Is?.(ClassId.CLEF)) {
        const rightMargin = xCentered + Math.trunc(measureWidth / 2);
        const widthAdjust = rightMargin - object.GetDrawingX();
        measureWidth -= widthAdjust;
        xCentered -= Math.trunc(widthAdjust / 2);
      }
    }
    const num = multiRest.HasNum() ? Math.min(multiRest.GetNum(), 999) : 1;
    const multiRestThickness = Math.trunc(doc.GetDrawingUnit(staffNotationSize) * (doc.GetOptions().m_multiRestThickness?.GetValue() ?? 0));
    let y2 = staff.GetDrawingY() - Math.imul(doc.GetDrawingUnit(staffSize), (staff.m_drawingLines - 1) | 0) - Math.trunc(multiRestThickness / 2);
    if (multiRest.HasLoc()) {
      y2 -= Math.imul(doc.GetDrawingUnit(staffSize), ((staff.m_drawingLines - 1 - multiRest.GetLoc()) | 0));
    }
    let y1 = y2 + multiRestThickness;
    if (multiRest.UseBlockStyle(doc)) {
      let width = measureWidth - 2 * doc.GetDrawingDoubleUnit(staffNotationSize);
      if (multiRest.HasWidth() && multiRest.GetWidth().GetType() === 1 /* MEASUREMENTTYPE_vu */) {
        const fixedWidth = Math.trunc(multiRest.GetWidth().GetVu() * doc.GetDrawingUnit(staffNotationSize));
        width = (width > fixedWidth) ? fixedWidth : width;
      }
      if (width > doc.GetDrawingStemWidth(staffNotationSize) * 4) {
        const x1 = xCentered - Math.trunc(width / 2);
        const x2 = xCentered + Math.trunc(width / 2);
        (dc as unknown as { DeactivateGraphicX(): void }).DeactivateGraphicX?.();
        this.DrawFilledRectangle(dc, x1, y1, x2, y2);
        const border = doc.GetDrawingUnit(staffNotationSize);
        this.DrawFilledRectangle(dc, x1, y1 + border, x1 + doc.GetDrawingStemWidth(staffNotationSize) * 2, y2 - border);
        this.DrawFilledRectangle(dc, x2 - doc.GetDrawingStemWidth(staffSize) * 2, y1 + border, x2, y2 - border);
        (dc as unknown as { ReactivateGraphic(): void }).ReactivateGraphic?.();
      }
    }
    else {
      if (staff.m_drawingLines % 2 !== 0) {
        y2 += doc.GetDrawingUnit(staffSize);
        y1 += doc.GetDrawingUnit(staffSize);
      }
      const lgWidth = doc.GetGlyphWidth(SMUFL_E4E1_restLonga, staffSize, false);
      const brWidth = doc.GetGlyphWidth(SMUFL_E4E2_restDoubleWhole, staffSize, false);
      const sbWidth = doc.GetGlyphWidth(SMUFL_E4E3_restWhole, staffSize, false);
      let width = Math.trunc(num / 4) * (lgWidth + doc.GetDrawingUnit(staffSize));
      width += Math.trunc((num % 4) / 2) * (brWidth + doc.GetDrawingUnit(staffSize));
      width = (num % 2) ? width + sbWidth : width - doc.GetDrawingUnit(staffSize);
      let x1 = xCentered - Math.trunc(width / 2);
      let count = num;
      while (Math.trunc(count / 4)) {
        this.DrawSmuflCode(dc, x1, y2, SMUFL_E4E1_restLonga, staffSize, false);
        x1 += lgWidth + doc.GetDrawingUnit(staffSize);
        count -= 4;
      }
      while (Math.trunc(count / 2)) {
        this.DrawSmuflCode(dc, x1, y2, SMUFL_E4E2_restDoubleWhole, staffSize, false);
        x1 += brWidth + doc.GetDrawingUnit(staffSize);
        count -= 2;
      }
      if (count) this.DrawSmuflCode(dc, x1, y1, SMUFL_E4E3_restWhole, staffSize, false);
    }
    const showHidden = (doc.GetOptions().m_showHidden?.GetValue() ?? false);
    if (showHidden || multiRest.GetNumVisible() !== BOOLEAN_false) {
      dc.StartCustomGraphic('multiRestNum', (multiRest.GetNumVisible() === BOOLEAN_false) ? CSS_SHOW_HIDDEN : '');
      dc.SetFont(doc.GetDrawingSmuflFont(staffNotationSize, false));
      const staffHeight = (staff.m_drawingLines - 1) * doc.GetDrawingDoubleUnit(staffSize);
      const offset = 3 * doc.GetDrawingUnit(staffNotationSize);
      const y = (multiRest.GetNumPlace() === STAFFREL_basic_below)
        ? Math.min(staff.GetDrawingY() - staffHeight, y2) - offset
        : Math.max(staff.GetDrawingY(), y1) + offset;
      this.DrawSmuflString(dc, xCentered, y, this.IntToTimeSigFigures(num), HORIZONTALALIGNMENT_center, staffNotationSize);
      dc.ResetFont();
      dc.EndCustomGraphic();
    }
    dc.EndGraphic(element, this);
  }

  public DrawMultiRpt(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawMultiRpt requires a device context.');
    if (!element) throw new Error('View::DrawMultiRpt requires an element.');
    const multiRpt = element as unknown as { CenterDrawingX(): void; GetNum(): number };
    multiRpt.CenterDrawingX();
    dc.StartGraphic(element, '', element.GetID());
    this.DrawMRptPart(dc, element.GetDrawingX(), staff.GetDrawingY(), SMUFL_E501_repeat2Bars, multiRpt.GetNum(), true, staff);
    dc.EndGraphic(element, this);
    return;
  }

  public DrawNote(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawNote requires a device context.');
    if (!element) throw new Error('View::DrawNote requires an element.');
    const doc = this.m_doc!;
    const note = element as unknown as { IsMensuralDur(): boolean; FindDescendantByType?(id: number): ViewPageObjectLike | null; m_crossStaff: ViewPageStaffLike | null; GetDrawingCueSize(): boolean; GetDrawingX(): number; GetDrawingY(): number; HasStemSameasNote(): boolean; GetFlippedNotehead(): boolean; GetDrawingRadius(doc: unknown): number; GetDrawingStemDir(): number; GetHeadVisible(): number; GetDrawingDur(): number; IsInBeam(): boolean; GetID(): string; GetColored(): number; HasHeadColor(): boolean; GetHeadColor(): string; GetNoteheadGlyph(d: number): number; HasHeadMod(): boolean; GetHeadMod(): number; GetDrawingStemWidth?(x: number): number };
    if (note.IsMensuralDur()) {
      this.DrawMensuralNote(dc, element as never, layer as never, staff as never, measure as never);
      if (note.FindDescendantByType?.(ClassId.DOTS)) {
        this.DrawLayerChildren(dc, note as never, layer, staff, measure);
      }
      return;
    }
    if (staff.IsTablature?.()) {
      (this as unknown as { DrawTabNote(dc: unknown, e: unknown, l: unknown, s: unknown, m: unknown): void }).DrawTabNote(dc as never, element as never, layer as never, staff as never, measure as never);
      return;
    }
    if (note.m_crossStaff) staff = note.m_crossStaff;
    dc.StartGraphic(note, '', note.GetID());
    const drawingCueSize = note.GetDrawingCueSize();
    let x = element.GetDrawingX();
    let y = element.GetDrawingY();
    const p = { x, y };
    this.CalcOffset(dc, p);
    x = p.x; y = p.y;
    if (note.HasStemSameasNote() && note.GetFlippedNotehead()) {
      let xShift = note.GetDrawingRadius(doc) * 2 - doc.GetDrawingStemWidth(staff.m_drawingStaffSize);
      xShift *= (note.GetDrawingStemDir() === STEMDIRECTION_up) ? -1 : 1;
      x -= xShift;
    }
    if (!(note.GetHeadVisible() === BOOLEAN_false)) {
      let drawingDur = note.GetDrawingDur();
      if (drawingDur === DURATION_NONE) {
        if (note.IsInBeam() && !(dc as unknown as { Is?: (id: number) => boolean }).Is?.(ClassId.BBOX_DEVICE_CONTEXT)) {
          LogWarning("Missing duration for note '%s' in beam", note.GetID());
        }
        drawingDur = DURATION_4;
      }
      if (drawingDur < DURATION_breve) {
        this.DrawMaximaToBrevis(dc, y, element as never, layer as never, staff as never);
      }
      else {
        let fontNo: number;
        if (note.GetColored() === BOOLEAN_true) {
          if (DURATION_1 === drawingDur) fontNo = SMUFL_E0FA_noteheadWholeFilled;
          else if (DURATION_2 === drawingDur) fontNo = SMUFL_E0FB_noteheadHalfFilled;
          else fontNo = SMUFL_E0A3_noteheadHalf;
        }
        else {
          fontNo = note.GetNoteheadGlyph(drawingDur);
        }
        dc.StartCustomGraphic('notehead');
        if (note.HasHeadColor()) {
          (dc as unknown as { SetCustomGraphicColor?(c: string): void }).SetCustomGraphicColor?.(note.GetHeadColor());
        }
        this.DrawSmuflCode(dc, x, y, fontNo, staff.m_drawingStaffSize, drawingCueSize, true);
        if (note.HasHeadMod()) {
          if (note.GetHeadMod() === NOTEHEADMODIFIER_paren) {
            this.DrawSmuflCode(dc, x - note.GetDrawingRadius(doc), y, SMUFL_E26A_accidentalParensLeft, staff.m_drawingStaffSize, drawingCueSize, true);
            this.DrawSmuflCode(dc, x + note.GetDrawingRadius(doc) * 2, y, SMUFL_E26B_accidentalParensRight, staff.m_drawingStaffSize, drawingCueSize, true);
          }
        }
        dc.EndCustomGraphic();
      }
    }
    this.DrawLayerChildren(dc, note as never, layer, staff, measure);
    dc.EndGraphic(note, this);
  }

  public DrawRest(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawRest requires a device context.');
    if (!element) throw new Error('View::DrawRest requires an element.');
    if (!element.GetParent?.()) throw new Error('View::DrawRest requires a parent.');
    const doc = this.m_doc!;
    const rest = element as unknown as { m_crossStaff: ViewPageStaffLike | null; GetDrawingCueSize(): boolean; GetParent(): ViewPageObjectLike | null; GetActualDur(): number; GetFirstAncestor(id: number): ViewPageObjectLike | null; GetRestGlyph(d: number): number; GetDrawingX(): number; GetDrawingY(): number; GetEnclosingGlyphs(): [number, number]; HasDots(): boolean; GetDots(): number; GetID(): string };
    if (rest.m_crossStaff) staff = rest.m_crossStaff;
    const drawingCueSize = rest.GetDrawingCueSize();
    const staffSize = staff.GetDrawingStaffNotationSize();
    const parent = rest.GetParent()!;
    const showHidden = ((doc.GetOptions().m_showHidden?.GetValue() ?? false) && (parent as unknown as { Is?(id: number): boolean }).Is?.(ClassId.SPACE));
    let drawingDur = rest.GetActualDur();
    if ((drawingDur === DURATION_NONE) && (staff.IsTablature?.() || (staff as unknown as { IsTabStaffLike?(): boolean }).IsTabStaffLike?.())) {
      const tabGrp = rest.GetFirstAncestor(ClassId.TABGRP) as unknown as { GetActualDur(): number } | null;
      if (tabGrp !== null) drawingDur = tabGrp.GetActualDur();
    }
    if ((drawingDur === DURATION_NONE) && !(dc as unknown as { Is?: (id: number) => boolean }).Is?.(ClassId.BBOX_DEVICE_CONTEXT)) {
      LogWarning("Missing duration for rest '%s'", rest.GetID());
      drawingDur = DURATION_4;
    }
    dc.StartGraphic(rest, (showHidden ? CSS_SHOW_HIDDEN : ''), rest.GetID());
    const drawingGlyph = rest.GetRestGlyph(drawingDur);
    let x = element.GetDrawingX();
    let y = element.GetDrawingY();
    const p = { x, y };
    this.CalcOffset(dc, p);
    x = p.x; y = p.y;
    const [enclosingFront, enclosingBack] = rest.GetEnclosingGlyphs();
    const drawingWidth = doc.GetGlyphWidth(drawingGlyph, staffSize, drawingCueSize);
    let drawingUnit = doc.GetDrawingUnit(staffSize);
    if (drawingCueSize) drawingUnit = Math.trunc(drawingUnit * (doc.GetOptions().m_graceFactor?.GetValue() ?? 1));
    if (enclosingFront) {
      const parenOffset = doc.GetGlyphWidth(enclosingFront, staffSize, drawingCueSize);
      this.DrawSmuflCode(dc, x - parenOffset, y, enclosingFront, staffSize, drawingCueSize);
    }
    this.DrawSmuflCode(dc, x, y, drawingGlyph, staffSize, drawingCueSize);
    if (enclosingBack) {
      let parenOffset = doc.GetGlyphWidth(enclosingBack, staffSize, drawingCueSize) - doc.GetGlyphAdvX(enclosingBack, staffSize, drawingCueSize);
      if (rest.HasDots()) parenOffset += Math.trunc(rest.GetDots() * drawingUnit * 3 / 2);
      this.DrawSmuflCode(dc, x + drawingWidth + parenOffset, y, enclosingBack, staffSize, drawingCueSize);
    }
    this.DrawLayerChildren(dc, rest as never, layer, staff, measure);
    if ((drawingDur === DURATION_1 || drawingDur === DURATION_2 || drawingDur === DURATION_breve)) {
      const width = doc.GetGlyphWidth(drawingGlyph, staffSize, drawingCueSize);
      const ledgerLineThickness = Math.trunc((doc.GetOptions().m_ledgerLineThickness?.GetValue() ?? 0) * drawingUnit);
      const ledgerLineExtension = Math.trunc((doc.GetOptions().m_ledgerLineExtension?.GetValue() ?? 0) * drawingUnit);
      const topMargin = staff.GetDrawingY();
      // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
      const bottomMargin = staff.GetDrawingY() - Math.imul((staff.m_drawingLines - 1) | 0, doc.GetDrawingDoubleUnit(staffSize));
      dc.StartCustomGraphic('ledgerLines');
      if ((drawingDur === DURATION_1 || drawingDur === DURATION_2) && (y > topMargin || y < bottomMargin)) {
        (dc as unknown as { DeactivateGraphicX(): void }).DeactivateGraphicX();
        this.DrawHorizontalLine(dc, x - ledgerLineExtension, x + width + ledgerLineExtension, y, ledgerLineThickness, VRV_UNSET, VRV_UNSET);
        (dc as unknown as { ReactivateGraphic(): void }).ReactivateGraphic();
      }
      else if (drawingDur === DURATION_breve && (y >= topMargin || y <= bottomMargin)) {
        const height = doc.GetGlyphHeight(drawingGlyph, staffSize, drawingCueSize);
        (dc as unknown as { DeactivateGraphicX(): void }).DeactivateGraphicX();
        if (y !== topMargin) {
          this.DrawHorizontalLine(dc, x - ledgerLineExtension, x + width + ledgerLineExtension, y, ledgerLineThickness, VRV_UNSET, VRV_UNSET);
        }
        if (y !== bottomMargin - height) {
          this.DrawHorizontalLine(dc, x - ledgerLineExtension, x + width + ledgerLineExtension, y + height, ledgerLineThickness, VRV_UNSET, VRV_UNSET);
        }
        (dc as unknown as { ReactivateGraphic(): void }).ReactivateGraphic();
      }
      dc.EndCustomGraphic();
    }
    dc.EndGraphic(rest, this);
  }

  public DrawSpace(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawSpace requires a device context.');
    if (!element) throw new Error('View::DrawSpace requires an element.');
    const showSpace = (this.m_doc!.GetOptions().m_showHidden?.GetValue() ?? false);
    dc.StartGraphic(element, '', element.GetID());
    (dc as unknown as { DrawPlaceholder?(x: number, y: number): void }).DrawPlaceholder?.(this.ToDeviceContextX(element.GetDrawingX()), this.ToDeviceContextY(element.GetDrawingY()));
    if (showSpace) this.DrawLayerChildren(dc, element, layer, staff, measure);
    dc.EndGraphic(element, this);
  }

  public DrawStem(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawStem requires a device context.');
    if (!element) throw new Error('View::DrawStem requires an element.');
    const doc = this.m_doc!;
    const stem = element as unknown as { GetFirstAncestor(id: number): ViewPageObjectLike | null; HasDir(): boolean; GetDir(): number; GetDrawingX(): number; GetDrawingY(): number; GetDrawingStemLen(): number; GetDrawingStemAdjust(): number; GetGrace(): number; IsInBeam(): boolean; IsVirtual(): boolean; GetID(): string };
    const parent = stem.GetFirstAncestor(ClassId.NOTE) as unknown as { IsMensuralDur(): boolean; GetDrawingDur(): number; GetDrawingX(): number; GetDrawingY(): number } | null;
    if (parent && parent.IsMensuralDur()) {
      if (parent.GetDrawingDur() > DURATION_1) {
        // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
        const staffCenter = staff.GetDrawingY() - Math.imul(doc.GetDrawingUnit(staff.m_drawingStaffSize), (staff.m_drawingLines - 1) | 0);
        const stemDir = (stem.HasDir()) ? stem.GetDir() : this.GetMensuralStemDir(layer as never, parent as never, staffCenter);
        dc.StartGraphic(element, '', element.GetID());
        this.DrawMensuralStem(dc, parent as never, staff as never, stemDir, parent.GetDrawingX(), parent.GetDrawingY());
        dc.EndGraphic(element, this);
      }
      return;
    }
    if (stem.IsVirtual()) return;
    dc.StartGraphic(element, '', element.GetID());
    let x = stem.GetDrawingX();
    let y = stem.GetDrawingY();
    const p = { x, y };
    this.CalcOffset(dc, p);
    x = p.x; y = p.y;
    this.DrawVerticalLine(dc, y, y - (stem.GetDrawingStemLen() + stem.GetDrawingStemAdjust()), x, doc.GetDrawingStemWidth(staff.m_drawingStaffSize), VRV_UNSET, VRV_UNSET);
    this.DrawStemMod(dc, element, staff);
    this.DrawLayerChildren(dc, stem as never, layer, staff, measure);
    if ((stem.GetGrace() === GRACE_unacc) && !stem.IsInBeam()) {
      (this as unknown as { DrawAcciaccaturaSlash?(dc: unknown, stem: unknown, staff: unknown): void }).DrawAcciaccaturaSlash?.(dc, stem, staff);
    }
    dc.EndGraphic(element, this);
  }

  public DrawStemMod(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, staff: ViewPageStaffLike): void {
    if (!dc) throw new Error('View::DrawStemMod requires a device context.');
    if (!element) throw new Error('View::DrawStemMod requires an element.');
    const doc = this.m_doc!;
    const el = element as unknown as { GetFirstAncestor(id: number): ViewPageObjectLike | null; Is(id: number): boolean; FindDescendantByType?(id: number): ViewPageObjectLike | null; GetParent?(): ViewPageObjectLike | null; GetDrawingStemMod(): number; StemModToGlyph(m: number): number };
    if (el.GetFirstAncestor(ClassId.BTREM)) return;
    let childElement: ViewPageObjectLike | null = null;
    if (el.Is(ClassId.BTREM)) {
      childElement = el.FindDescendantByType?.(ClassId.CHORD) ?? null;
      if (!childElement) childElement = el.FindDescendantByType?.(ClassId.NOTE) ?? null;
    }
    else if (el.Is(ClassId.STEM)) {
      childElement = el.GetParent?.() ?? null;
    }
    else {
      LogWarning('Drawing stem mod supported only for elements of <stem> or <bTrem> type.');
      return;
    }
    if (!childElement) return;
    const child = childElement as unknown as { Is(id: number): boolean; GetStemmedDrawingInterface?(): { GetDrawingStemDir(): number; GetDrawingStemModRelY(): number; GetDrawingStemStart(c: unknown): { x: number } } | null; GetDrawingY(): number; GetDrawingX(): number; GetDrawingRadius(doc: unknown): number; IsGraceNote(): boolean; GetDrawingCueSize(): boolean; GetDurationInterface?(): { GetActualDur(): number } | null; GetTopNote?(): { GetDrawingY(): number } | null; GetBottomNote?(): { GetDrawingY(): number } | null };
    let stemDir = STEMDIRECTION_NONE;
    let stemRelY = 0;
    let stemX = 0;
    const stemIf = child.GetStemmedDrawingInterface?.();
    if (stemIf) {
      stemDir = stemIf.GetDrawingStemDir();
      stemRelY = stemIf.GetDrawingStemModRelY();
      stemX = stemIf.GetDrawingStemStart(childElement).x;
    }
    let noteY: number | null = null;
    let isGrace = false;
    let isCue = false;
    if (child.Is(ClassId.NOTE)) {
      const n = child as unknown as { GetDrawingY(): number; IsGraceNote(): boolean; GetDrawingCueSize(): boolean };
      noteY = n.GetDrawingY();
      isGrace = n.IsGraceNote();
      isCue = n.GetDrawingCueSize();
    }
    else if (child.Is(ClassId.CHORD)) {
      const top = child.GetTopNote?.();
      const bottom = child.GetBottomNote?.();
      const picked = (stemDir === STEMDIRECTION_up) ? top : bottom;
      if (!picked) return;
      noteY = picked.GetDrawingY();
      const cn = child as unknown as { IsGraceNote?(): boolean; GetDrawingCueSize?(): boolean };
      isGrace = cn.IsGraceNote?.() ?? false;
      isCue = cn.GetDrawingCueSize?.() ?? false;
    }
    if (noteY === null || isGrace || isCue) return;
    const duration = child.GetDurationInterface?.();
    const drawingDur = duration ? duration.GetActualDur() : 0;
    const stemMod = el.GetDrawingStemMod();
    if ((stemMod === STEMMODIFIER_NONE) || (stemMod === STEMMODIFIER_none)) return;
    const code = el.StemModToGlyph(stemMod);
    if (!code) return;
    const y = noteY + stemRelY;
    const x = (drawingDur <= DURATION_1) ? child.GetDrawingX() + child.GetDrawingRadius(doc) : stemX;
    if ((code !== SMUFL_E645_vocalSprechgesang) || !el.Is(ClassId.BTREM)) {
      let adjust = 0;
      if (stemMod === STEMMODIFIER_6slash) {
        const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);
        const sign = (stemDir === STEMDIRECTION_up) ? 1 : -1;
        const slash1height = doc.GetGlyphHeight(SMUFL_E220_tremolo1, staff.m_drawingStaffSize, false);
        const slash6height = doc.GetGlyphHeight(code, staff.m_drawingStaffSize, false);
        adjust = -sign * unit;
        const slash1adjust = Math.trunc(sign * 0.75 * (slash6height - slash1height)) + adjust;
        this.DrawSmuflCode(dc, x, y + slash1adjust, SMUFL_E220_tremolo1, staff.m_drawingStaffSize, false);
      }
      this.DrawSmuflCode(dc, x, y + adjust, code, staff.m_drawingStaffSize, false);
    }
  }

  public DrawSyl(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawSyl requires a device context.');
    if (!element) throw new Error('View::DrawSyl requires an element.');
    const doc = this.m_doc!;
    const syl = element as unknown as {
      GetID(): string; GetDrawingX(): number; GetDrawingY(): number;
      GetStart?(): { GetDrawingCueSize?(): boolean } | null;
      GetEnd?(): unknown | null;
      GetTimeSpanningInterface?(): { GetStart?(): { GetDrawingCueSize?(): boolean } | null; GetEnd?(): unknown | null } | null;
      GetFirstAncestorInRange?(min: number, max: number): unknown | null;
      GetFirstAncestor?(id: number): unknown | null;
      SetDrawingYRel?(v: number): void;
      ResetDrawingTextInkBounds?(): void;
      SetDrawingTextInkBounds?(top: number, bottom: number): void;
      GetText?(): unknown;
      GetCon?(): number;
      HasLetterspacing?(): boolean;
      GetLetterspacing?(): number;
      GetDrawingWidth?(): number;
      GetDrawingHeight?(): number;
      HasFontname?(): boolean; GetFontname?(): string;
      HasFontfam?(): boolean; GetFontfam?(): string;
      HasFontsize?(): boolean; GetFontsize?(): { GetType(): number; GetFontSizeNumeric(): number; GetPercentForTerm(): number; GetPercent(): number };
      HasFontweight?(): boolean; GetFontweight?(): number;
      HasFontstyle?(): boolean; GetFontstyle?(): number;
      m_drawingVerseN: number; m_drawingVersePlace: number; m_drawingVoltaN: number;
    };
    const tsi = syl.GetTimeSpanningInterface?.() ?? null;
    const startEl = syl.GetStart?.() ?? tsi?.GetStart?.() ?? null;
    const endEl = syl.GetEnd?.() ?? tsi?.GetEnd?.() ?? null;
    const docSeam = doc as unknown as {
      IsFacs?(): boolean; IsTranscription?(): boolean; IsNeumeLines?(): boolean;
      GetCueSize(v: number): number; GetMusicToLyricFontSizeRatio(): number;
      GetDrawingUnit(s: number): number;
      GetDrawingLyricFont(s: number): { GetPointSize(): number };
      GetResources(): { GetTextFont(): string; GetCurrentFont(): string; IsSmuflFallbackNeeded(t: string): boolean };
    };
    if (!startEl && !IsNeumeType(staff.m_drawingNotationType)) {
      LogWarning('Parent note for <syl> was not found');
      return;
    }
    if (!docSeam.IsFacs?.() && !docSeam.IsTranscription?.() && !docSeam.IsNeumeLines?.()) {
      syl.SetDrawingYRel?.(this.GetSylYRel(syl.m_drawingVerseN, staff, syl.m_drawingVersePlace, syl.m_drawingVoltaN));
    }
    dc.StartGraphic(syl, '', syl.GetID());
    (dc as unknown as { DeactivateGraphicY?(): void }).DeactivateGraphicY?.();
    const lyricFontPoint = docSeam.GetDrawingLyricFont(staff.m_drawingStaffSize).GetPointSize();
    const currentFont = new FontInfo();
    currentFont.SetPointSize(lyricFontPoint);
    const applyTypography = (font: FontInfo, typography: {
      HasFontname?(): boolean; GetFontname?(): string;
      HasFontfam?(): boolean; GetFontfam?(): string;
      HasFontsize?(): boolean; GetFontsize?(): { GetType(): number; GetFontSizeNumeric(): number; GetPercentForTerm(): number; GetPercent(): number };
      HasFontweight?(): boolean; GetFontweight?(): number;
      HasFontstyle?(): boolean; GetFontstyle?(): number;
      HasLetterspacing?(): boolean; GetLetterspacing?(): number;
    } | null | undefined): void => {
      if (!typography) return;
      if (typography.HasFontname?.()) {
        font.SetFaceName(typography.GetFontname?.() ?? '');
      }
      else if (typography.HasFontfam?.()) {
        font.SetFaceName(typography.GetFontfam?.() ?? '');
      }
      if (typography.HasFontsize?.()) {
        const fontSize = typography.GetFontsize?.();
        if (fontSize) {
          if (fontSize.GetType() === FONTSIZE_fontSizeNumeric) {
            font.SetPointSize(fontSize.GetFontSizeNumeric());
          }
          else if (fontSize.GetType() === FONTSIZE_term) {
            font.SetPointSize(font.GetPointSize() * fontSize.GetPercentForTerm() / 100);
          }
          else if (fontSize.GetType() === FONTSIZE_percent) {
            font.SetPointSize(font.GetPointSize() * fontSize.GetPercent() / 100);
          }
        }
      }
      if (typography.HasFontweight?.()) font.SetWeight(typography.GetFontweight?.() ?? 0);
      if (typography.HasFontstyle?.()) font.SetStyle(typography.GetFontstyle?.() ?? 0);
      if (typography.HasLetterspacing?.()) {
        font.SetLetterSpacing((typography.GetLetterspacing?.() ?? 0) * docSeam.GetDrawingUnit(staff.m_drawingStaffSize));
      }
    };
    const lyricElement = (syl.GetFirstAncestorInRange?.(ClassId.LYRIC_ELEMENT, ClassId.LYRIC_ELEMENT_max) ?? null) as {
      HasFontname?(): boolean; GetFontname?(): string;
      HasFontfam?(): boolean; GetFontfam?(): string;
      HasFontsize?(): boolean; GetFontsize?(): { GetType(): number; GetFontSizeNumeric(): number; GetPercentForTerm(): number; GetPercent(): number };
      HasFontweight?(): boolean; GetFontweight?(): number;
      HasFontstyle?(): boolean; GetFontstyle?(): number;
      HasLetterspacing?(): boolean; GetLetterspacing?(): number;
    } | null;
    const volta = (syl.GetFirstAncestor?.(ClassId.VOLTA) ?? (element.GetFirstAncestor?.(ClassId.VOLTA) ?? null)) as {
      HasFontname?(): boolean; GetFontname?(): string;
      HasFontfam?(): boolean; GetFontfam?(): string;
      HasFontsize?(): boolean; GetFontsize?(): { GetType(): number; GetFontSizeNumeric(): number; GetPercentForTerm(): number; GetPercent(): number };
      HasFontweight?(): boolean; GetFontweight?(): number;
      HasFontstyle?(): boolean; GetFontstyle?(): number;
      HasLetterspacing?(): boolean; GetLetterspacing?(): number;
    } | null;
    applyTypography(currentFont, lyricElement);
    applyTypography(currentFont, volta);
    applyTypography(currentFont, syl);
    if (startEl && startEl.GetDrawingCueSize?.()) {
      currentFont.SetPointSize(docSeam.GetCueSize(currentFont.GetPointSize()));
    }
    if (syl.HasLetterspacing?.()) {
      currentFont.SetLetterSpacing((syl.GetLetterspacing?.() ?? 0) * docSeam.GetDrawingUnit(staff.m_drawingStaffSize));
    }
    dc.SetFont(currentFont);
    let x = syl.GetDrawingX();
    let y = syl.GetDrawingY();
    const p = { x, y };
    this.CalcOffset(dc, p);
    x = p.x; y = p.y;
    syl.ResetDrawingTextInkBounds?.();
    const sylText = syl.GetText?.() as unknown;
    const sylTextEmpty = Array.isArray(sylText) ? sylText.length === 0 : !sylText;
    if (!sylTextEmpty) {
      const inkExtent = new TextExtend();
      const inkStr = Array.isArray(sylText) ? (sylText as unknown[]).map((c) => (typeof c === 'string' ? c : String.fromCodePoint(c as number))).join('') : String(sylText);
      (dc as unknown as { GetTextExtent?(s: string, e: TextExtend, w: boolean): void }).GetTextExtent?.(inkStr, inkExtent, false);
      syl.SetDrawingTextInkBounds?.(y + inkExtent.m_ascent, y - inkExtent.m_descent);
    }
    const params = new TextDrawingParams();
    params.m_x = x;
    params.m_y = y;
    params.m_staffSize = staff.m_drawingStaffSize;
    if (docSeam.IsFacs?.() || docSeam.IsNeumeLines?.()) {
      params.m_width = syl.GetDrawingWidth?.() ?? 0;
      params.m_height = syl.GetDrawingHeight?.() ?? 0;
    }
    if (!dc.HasFont()) throw new Error('View::DrawSyl requires a font.');
    params.m_pointSize = dc.GetFont().GetPointSize();
    dc.StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_left);
    this.DrawTextChildren(dc, element, params);
    if ((syl.GetCon?.() ?? 0) === sylLog_CON_b) {
      (dc as unknown as { ReactivateGraphic?(): void }).ReactivateGraphic?.();
      (dc as unknown as { DeactivateGraphic?(): void }).DeactivateGraphic?.();
      const elision = (this.m_doc!.GetOptions() as unknown as { m_lyricElision?: { GetValue(): number } }).m_lyricElision?.GetValue() ?? 0;
      if (elision === ELISION_unicode) {
        const str = [UNICODE_UNDERTIE_CP];
        dc.DrawText(UTF32to8(str), str);
      }
      else {
        const vrvTxt = new FontInfo();
        if (!dc.HasFont()) throw new Error('View::DrawSyl requires a font.');
        vrvTxt.SetPointSize(dc.GetFont().GetPointSize() * docSeam.GetMusicToLyricFontSizeRatio());
        vrvTxt.SetFaceName(docSeam.GetResources().GetCurrentFont());
        const str = [elision];
        const isFallbackNeeded = docSeam.GetResources().IsSmuflFallbackNeeded(UTF32to8(str));
        vrvTxt.SetSmuflWithFallback(isFallbackNeeded);
        dc.SetFont(vrvTxt);
        dc.DrawText(UTF32to8(str), str);
        dc.ResetFont();
      }
      (dc as unknown as { ReactivateGraphic?(): void }).ReactivateGraphic?.();
      (dc as unknown as { DeactivateGraphicY?(): void }).DeactivateGraphicY?.();
    }
    dc.EndText();
    dc.ResetFont();
    if (startEl && endEl) {
      const currentSystem = measure.GetFirstAncestor?.(ClassId.SYSTEM) as unknown as { AddToDrawingList?(el: unknown): void } | null;
      if (currentSystem) {
        currentSystem.AddToDrawingList?.(syl);
      }
    }
    (dc as unknown as { ReactivateGraphic?(): void }).ReactivateGraphic?.();
    dc.EndGraphic(syl, this);
  }

  public DrawLyricElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawLyricElement requires a device context.');
    if (!element) throw new Error('View::DrawLyricElement requires an element.');
    if (!layer) throw new Error('View::DrawLyricElement requires a layer.');
    if (!staff) throw new Error('View::DrawLyricElement requires a staff.');
    if (!measure) throw new Error('View::DrawLyricElement requires a measure.');
    const doc = this.m_doc!;
    const el = element as unknown as {
      Is(id: number): boolean; GetID(): string; GetDrawingX(): number;
      FindDescendantByType?(id: number, depth?: number): ViewPageObjectLike | null;
      FindAllDescendantsByType?(id: number, b?: boolean): ViewPageObjectLike[];
      GetDrawingVerseN(): number; GetPlace(): number;
      GetVoltaCount(): number; HasVoltasym(): boolean; GetVoltasym(): number; GetVoltaDrawingRange(): [number, number];
      HasDrawingDirectSylTrack(): boolean;
      GetFirstAncestorInRange?(min: number, max: number): { GetDrawingCueSize?(): boolean } | null;
    };
    const lyricElement = el as unknown as ViewPageObjectLike & { GetDrawingVerseN(): number; GetPlace(): number; GetVoltaCount(): number; HasVoltasym(): boolean; GetVoltasym(): number; GetVoltaDrawingRange(): [number, number]; HasDrawingDirectSylTrack(): boolean };
    const isVerse = (lyricElement.Is?.(ClassId.VERSE) ?? false);
    const verse = isVerse ? (lyricElement as unknown) : null;
    const label = (isVerse ? (lyricElement.FindDescendantByType?.(ClassId.LABEL, 1) ?? null) : null) as ViewPageObjectLike | null;
    const labelAbbr = (isVerse ? ((verse as unknown as { GetDrawingLabelAbbr?(): ViewPageObjectLike | null }).GetDrawingLabelAbbr?.() ?? null) : null) as ViewPageObjectLike | null;
    if (label || labelAbbr) {
      const graphic = ((label ?? labelAbbr)!) as ViewPageObjectLike;
      const layerAncestor = lyricElement.GetFirstAncestor?.(ClassId.LAYER) as unknown as { GetDrawingCueSize?(): boolean } | null;
      const labelTxt = new FontInfo();
      if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
        labelTxt.SetFaceName((doc.GetResources() as unknown as { GetTextFont(): string }).GetTextFont());
      }
      let pointSize = doc.GetDrawingLyricFont(staff.m_drawingStaffSize).GetPointSize();
      if (layerAncestor && (layerAncestor.GetDrawingCueSize?.() ?? false)) {
        pointSize = (doc as unknown as { GetCueSize(v: number): number }).GetCueSize(pointSize);
      }
      labelTxt.SetPointSize(pointSize);
      const params = new TextDrawingParams();
      params.m_x = lyricElement.GetDrawingX() - doc.GetDrawingUnit(staff.m_drawingStaffSize);
      params.m_y = staff.GetDrawingY() + this.GetSylYRel(lyricElement.GetDrawingVerseN(), staff, lyricElement.GetPlace(), 0);
      params.m_staffSize = staff.m_drawingStaffSize;
      params.m_pointSize = labelTxt.GetPointSize();
      dc.SetFont(labelTxt);
      dc.StartGraphic(graphic, '', graphic.GetID());
      dc.StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_right);
      this.DrawTextChildren(dc, graphic, params);
      dc.EndText();
      dc.EndGraphic(graphic, this);
      dc.ResetFont();
    }
    dc.StartGraphic(lyricElement, '', lyricElement.GetID());
    this.DrawLayerChildren(dc, lyricElement, layer, staff, measure);
    // C++ ordinals from attconverter.ts: brace=1, bracket=2, bracketsq=3, line=4, none=5.
    if ((lyricElement.GetVoltaCount() > 1) && lyricElement.HasVoltasym() && (lyricElement.GetVoltasym() !== 5)) {
      let hasContentBounds = false;
      let yTop = 0;
      let yBottom = 0;
      for (const obj of (lyricElement.FindAllDescendantsByType?.(ClassId.VOLTA) ?? [])) {
        for (const sylObj of (obj.FindAllDescendantsByType?.(ClassId.SYL) ?? [])) {
          const syl = sylObj as unknown as { HasDrawingTextInkBounds(): boolean; GetDrawingTextInkTop(): number; GetDrawingTextInkBottom(): number };
          if (!syl.HasDrawingTextInkBounds()) continue;
          if (!hasContentBounds) {
            yTop = syl.GetDrawingTextInkTop();
            yBottom = syl.GetDrawingTextInkBottom();
            hasContentBounds = true;
          }
          else {
            yTop = Math.max(yTop, syl.GetDrawingTextInkTop());
            yBottom = Math.min(yBottom, syl.GetDrawingTextInkBottom());
          }
        }
      }
      if (!hasContentBounds) {
        const verseN = lyricElement.GetDrawingVerseN();
        const [firstVoltaTrack, lastVoltaTrack] = lyricElement.GetVoltaDrawingRange();
        const directTrackOffset = lyricElement.HasDrawingDirectSylTrack() ? 1 : 0;
        const firstVoltaLine = firstVoltaTrack + directTrackOffset;
        const lastVoltaLine = lastVoltaTrack + directTrackOffset;
        const getLineY = (line: number): number => {
          if ((lyricElement.Is?.(ClassId.REFRAIN) ?? false)) {
            return staff.GetDrawingY() + this.GetSylYRel(verseN + line - 1, staff, lyricElement.GetPlace(), 0);
          }
          return staff.GetDrawingY() + this.GetSylYRel(verseN, staff, lyricElement.GetPlace(), Math.trunc(line));
        };
        const firstY = getLineY(firstVoltaLine);
        const lastY = getLineY(lastVoltaLine);
        const lyricFont = doc.GetDrawingLyricFont(staff.m_drawingStaffSize);
        yTop = Math.max(firstY, lastY) + doc.GetTextGlyphHeight('I'.codePointAt(0)!, lyricFont as unknown, false);
        yBottom = Math.min(firstY, lastY) + doc.GetTextGlyphDescender('q'.codePointAt(0)!, lyricFont as unknown, false);
      }
      const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);
      const x = lyricElement.GetDrawingX() - unit;
      (dc as unknown as { StartCustomGraphic(name: string): void }).StartCustomGraphic('voltaGroupingSym');
      switch (lyricElement.GetVoltasym()) {
        case 1: this.DrawBrace(dc, x, yTop, yBottom, staff.m_drawingStaffSize, true); break;
        case 2: this.DrawBracket(dc, x, yTop, yBottom, staff.m_drawingStaffSize); break;
        case 3: this.DrawBracketSq(dc, x - unit, yTop, yBottom, staff.m_drawingStaffSize); break;
        case 4: this.DrawVerticalLine(dc, yTop, yBottom, x - unit, doc.GetDrawingStaffLineWidth(staff.m_drawingStaffSize), VRV_UNSET, VRV_UNSET); break;
        default: break;
      }
      (dc as unknown as { EndCustomGraphic(): void }).EndCustomGraphic();
    }
    dc.EndGraphic(lyricElement, this);
  }

  public DrawAcciaccaturaSlash(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, staff: ViewPageStaffLike): void {
    if (!dc) throw new Error('View::DrawAcciaccaturaSlash requires a device context.');
    if (!element) throw new Error('View::DrawAcciaccaturaSlash requires an element.');
    if (!staff) throw new Error('View::DrawAcciaccaturaSlash requires a staff.');
    const doc = this.m_doc!;
    const stem = element as unknown as {
      GetDrawingX(): number; GetDrawingY(): number; GetDrawingStemLen(): number; GetDrawingStemDir(): number;
      GetFirst(id: number): ViewPageObjectLike | null;
    };
    (dc as unknown as { SetPen(w: number, style: number): void }).SetPen(doc.GetDrawingStemWidth(staff.m_drawingStaffSize) * 1.2, PenStyle.PEN_SOLID);
    const cue = (doc as unknown as { GetCueSize(v: number): number }).GetCueSize(doc.GetDrawingUnit(staff.m_drawingStaffSize));
    const positionShiftX1 = cue;
    const positionShiftY1 = cue * -4;
    const positionShiftX2 = cue * 2;
    const positionShiftY2 = cue * -1;
    const stemDir = stem.GetDrawingStemDir();
    let y = stem.GetDrawingY() - stem.GetDrawingStemLen();
    const flag = stem.GetFirst(ClassId.FLAG) as unknown as { GetFlagGlyph(dir: number): number } | null;
    if (flag) {
      const glyph = flag.GetFlagGlyph(stemDir);
      if (glyph) {
        const slashAdjust = (stemDir === STEMDIRECTION_up)
          ? doc.GetGlyphTop(glyph, staff.m_drawingStaffSize, true)
          : doc.GetGlyphBottom(glyph, staff.m_drawingStaffSize, true);
        y += slashAdjust;
      }
    }
    if ((stemDir === STEMDIRECTION_down) && (!flag || (flag.GetFlagGlyph(stemDir) === SMUFL_E241_flag8thDown))) {
      y -= Math.trunc(doc.GetDrawingUnit(staff.m_drawingStaffSize) / 3);
    }
    const startX = stem.GetDrawingX();
    if (stemDir === STEMDIRECTION_up) {
      (dc as unknown as { DrawLine(x1: number, y1: number, x2: number, y2: number): void }).DrawLine(this.ToDeviceContextX(startX - positionShiftX1), this.ToDeviceContextY(y + positionShiftY1), this.ToDeviceContextX(startX + positionShiftX2), this.ToDeviceContextY(y + positionShiftY2));
    }
    else {
      (dc as unknown as { DrawLine(x1: number, y1: number, x2: number, y2: number): void }).DrawLine(this.ToDeviceContextX(startX - positionShiftX1), this.ToDeviceContextY(y - positionShiftY1), this.ToDeviceContextX(startX + positionShiftX2), this.ToDeviceContextY(y - positionShiftY2));
    }
    (dc as unknown as { ResetPen(): void }).ResetPen();
  }

  public DrawDotsPart(dc: ViewPageDeviceContextLike, x: number, y: number, dots: number, staff: ViewPageStaffLike, dimin = false): void {
    if (!dc) throw new Error('View::DrawDotsPart requires a device context.');
    if (!staff) throw new Error('View::DrawDotsPart requires a staff.');
    const doc = this.m_doc!;
    const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);
    if (staff.IsOnStaffLine(y, doc)) {
      y += unit;
    }
    const distance = dimin ? ((doc.GetOptions() as unknown as { m_graceFactor: { GetValue(): number } }).m_graceFactor.GetValue()) : 1.0;
    for (let i = 0; i < dots; ++i) {
      if (staff.IsMensural()) {
        this.DrawDiamond(dc, x - Math.trunc(unit / 2), y, unit, unit, true, 0);
      }
      else {
        this.DrawDot(dc, x, y, staff.m_drawingStaffSize, dimin);
      }
      x += Math.trunc(doc.GetDrawingUnit(staff.m_drawingStaffSize) * 1.5 * distance);
    }
  }

  public DrawMeterSigFigures(dc: ViewPageDeviceContextLike, x: number, y: number, element: ViewPageObjectLike, den: number, staff: ViewPageStaffLike): number {
    if (!dc) throw new Error('View::DrawMeterSigFigures requires a device context.');
    if (!element) throw new Error('View::DrawMeterSigFigures requires an element.');
    if (!staff) throw new Error('View::DrawMeterSigFigures requires a staff.');
    const doc = this.m_doc!;
    const meterSig = element as unknown as { GetCount(): [number[], number] };
    const [numSummands, numSign] = meterSig.GetCount();
    let timeSigCombNumerator: number[] = [];
    let timeSigCombDenominator: number[] = [];
    // MeterCountSign ordinals from ./libmei-att.ts: None=0, Slash=1, Minus=2, Asterisk=3, Plus=4.
    for (const summand of numSummands) {
      if (timeSigCombNumerator.length) {
        switch (numSign) {
          case 1: timeSigCombNumerator.push(SMUFL_E08E_timeSigFractionalSlash); break;
          case 2: timeSigCombNumerator.push(SMUFL_E090_timeSigMinus); break;
          case 3: timeSigCombNumerator.push(SMUFL_E091_timeSigMultiply); break;
          case 4: timeSigCombNumerator.push(SMUFL_E08D_timeSigPlusSmall); break;
          default: break;
        }
      }
      timeSigCombNumerator = timeSigCombNumerator.concat(this.IntToTimeSigFigures(summand));
    }
    if (den) timeSigCombDenominator = this.IntToTimeSigFigures(den);
    const glyphSize = staff.GetDrawingStaffNotationSize();
    dc.SetFont(doc.GetDrawingSmuflFont(glyphSize, false));
    const widthText = (timeSigCombNumerator.length > timeSigCombDenominator.length) ? timeSigCombNumerator : timeSigCombDenominator;
    const extend = new TextExtend();
    (dc as unknown as { GetSmuflTextExtent(s: number[], e: TextExtend): void }).GetSmuflTextExtent(widthText, extend);
    const width = extend.m_width;
    x += Math.trunc(width / 2);
    if (den) {
      let yNum = y + doc.GetDrawingDoubleUnit(glyphSize);
      let yDen = y - doc.GetDrawingDoubleUnit(glyphSize);
      const fontInfo = (dc as unknown as { GetFont(): { GetFaceName(): string } }).GetFont();
      const handwrittenFonts = ((doc.GetOptions() as unknown as { m_handwrittenFont: { GetValue(): string[] } }).m_handwrittenFont.GetValue());
      if (handwrittenFonts.indexOf(fontInfo.GetFaceName()) !== -1) {
        const numExtend = new TextExtend();
        (dc as unknown as { GetSmuflTextExtent(s: number[], e: TextExtend): void }).GetSmuflTextExtent(timeSigCombNumerator, numExtend);
        yNum = y + Math.trunc(numExtend.m_height / 2);
        const denExtend = new TextExtend();
        (dc as unknown as { GetSmuflTextExtent(s: number[], e: TextExtend): void }).GetSmuflTextExtent(timeSigCombDenominator, denExtend);
        yDen = y - Math.trunc(denExtend.m_height / 2);
      }
      this.DrawSmuflString(dc, x, yNum, timeSigCombNumerator, HORIZONTALALIGNMENT_center, glyphSize);
      this.DrawSmuflString(dc, x, yDen, timeSigCombDenominator, HORIZONTALALIGNMENT_center, glyphSize);
    }
    else {
      this.DrawSmuflString(dc, x, y, timeSigCombNumerator, HORIZONTALALIGNMENT_center, glyphSize);
    }
    dc.ResetFont();
    return width;
  }

  public HasValidTimeSpanningOrder(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, start: ViewPageObjectLike | null, end: ViewPageObjectLike | null): boolean {
    if (!start || !end) return false;
    const tsi = (element as unknown as { GetTimeSpanningInterface?(): { IsOrdered(s: unknown, e: unknown): boolean } | null }).GetTimeSpanningInterface?.();
    if (tsi && !tsi.IsOrdered(start, end)) {
      // C++ exceptional cases: same-alignment grace slurs; OCTAVE/SYL always valid.
      if (element.Is?.(ClassId.SLUR)) {
        const s = start as unknown as { GetAlignment(): unknown; IsGraceNote(): boolean };
        const e = end as unknown as { GetAlignment(): unknown; IsGraceNote(): boolean };
        if (s.GetAlignment() === e.GetAlignment()) {
          if (s.IsGraceNote() || e.IsGraceNote()) return true;
        }
      }
      else if ((element as unknown as { IsAnyOf?(c: number[]): boolean }).IsAnyOf?.([ClassId.OCTAVE, ClassId.SYL])) {
        return true;
      }
      // C++ warns once during actual drawing (non-BBOX, same current page); keep warn + false.
      const isBbox = (dc as unknown as { Is?: (id: number) => boolean }).Is?.(ClassId.BBOX_DEVICE_CONTEXT);
      if (!isBbox) {
        const page = (start as unknown as { GetFirstAncestor(id: number): unknown }).GetFirstAncestor(ClassId.PAGE);
        if (this.m_currentPage === page) {
          LogWarning("%s '%s' is ignored, since start '%s' does not occur temporally before end '%s'.",
            (element as unknown as { GetClassName(): string }).GetClassName(), element.GetID(),
            (start as unknown as { GetID(): string }).GetID(), (end as unknown as { GetID(): string }).GetID());
        }
      }
      return false;
    }
    return true;
  }

  public DrawTimeSpanningElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawTimeSpanningElement requires a device context.');
    if (!element) throw new Error('View::DrawTimeSpanningElement requires an element.');
    if (!system) throw new Error('View::DrawTimeSpanningElement requires a system.');
    const el = element as unknown as {
      Is(id: number): boolean; IsAnyOf(c: number[]): boolean; IsControlElement(): boolean;
      GetTimeSpanningInterface(): {
        GetStart(): ViewPageObjectLike | null; GetEnd(): ViewPageObjectLike | null;
        GetStartMeasure(): ViewPageMeasureLike | null; GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      } | null;
      HasInterface(id: number): boolean;
      GetLinkingInterface(): { GetNextLink(): { GetTimePointInterface(): { GetStart(): ViewPageObjectLike | null } | null } | null } | null;
    };
    if (dc.Is(ClassId.BBOX_DEVICE_CONTEXT)) {
      const bbox = dc as unknown as { UpdateVerticalValues(): boolean };
      if (!bbox.UpdateVerticalValues()) {
        if (el.IsAnyOf([ClassId.ANNOTSCORE, ClassId.BRACKETSPAN, ClassId.HAIRPIN, ClassId.OCTAVE, ClassId.PITCHINFLECTION])) return;
      }
    }
    const tsi = el.GetTimeSpanningInterface();
    if (!tsi) throw new Error('View::DrawTimeSpanningElement requires a time-spanning interface.');
    let start = tsi.GetStart() as unknown as (ViewPageObjectLike & { GetFirstAncestor(id: number): unknown; GetDrawingRadius(d: unknown): number; Is(id: number): boolean }) | null;
    let end: (ViewPageObjectLike & { GetFirstAncestor(id: number): unknown; GetDrawingRadius(d: unknown): number; Is(id: number): boolean }) | null = tsi.GetEnd() as unknown as (ViewPageObjectLike & { GetFirstAncestor(id: number): unknown; GetDrawingRadius(d: unknown): number; Is(id: number): boolean }) | null;
    if (!end && el.HasInterface(InterfaceId.INTERFACE_LINKING)) {
      const next = el.GetLinkingInterface()?.GetNextLink();
      if (next) end = next.GetTimePointInterface()?.GetStart() as unknown as (ViewPageObjectLike & { GetFirstAncestor(id: number): unknown; GetDrawingRadius(d: unknown): number; Is(id: number): boolean }) | null;
    }
    if (!this.HasValidTimeSpanningOrder(dc, element, start, end)) return;
    const s1 = start!.GetFirstAncestor(ClassId.SYSTEM);
    const s2 = end!.GetFirstAncestor(ClassId.SYSTEM);
    let drawingX1 = 0; let drawingX2 = 0;
    let objectX: unknown = null;
    let measure: ViewPageMeasureLike | null = null;
    let graphic: unknown = null;
    let spanningType = SpanningType.SPANNING_START_END;
    const sys = system as unknown;
    if ((sys === s1) && (sys === s2)) {
      measure = tsi.GetStartMeasure();
      if (!measure) return;
      drawingX1 = (start as unknown as { GetDrawingX(): number }).GetDrawingX();
      objectX = start;
      drawingX2 = (end as unknown as { GetDrawingX(): number }).GetDrawingX();
      graphic = element;
    }
    else if (sys === s1) {
      measure = (system as unknown as { FindDescendantByType(id: number, d: number, dir: boolean): ViewPageMeasureLike }).FindDescendantByType(ClassId.MEASURE, 1, BACKWARD);
      if (!measure) return;
      drawingX1 = (start as unknown as { GetDrawingX(): number }).GetDrawingX();
      objectX = start;
      drawingX2 = measure.GetDrawingX() + ((measure as unknown as { GetRightBarLineXRel?(): number }).GetRightBarLineXRel?.() ?? 0);
      graphic = element;
      spanningType = SpanningType.SPANNING_START;
    }
    else if (sys === s2) {
      measure = (system as unknown as { FindDescendantByType(id: number, d: number, dir: boolean): ViewPageMeasureLike }).FindDescendantByType(ClassId.MEASURE, 1, !BACKWARD /* FORWARD */);
      if (!measure) return;
      // C++ END branch: drawingX1 = measure->GetDrawingX() + measure->GetLeftBarLineXRel().
      drawingX1 = measure.GetDrawingX() + ((measure as unknown as { GetLeftBarLineXRel?(): number }).GetLeftBarLineXRel?.() ?? 0);
      objectX = (measure as unknown as { GetLeftBarLine?(): unknown }).GetLeftBarLine?.() ?? measure;
      drawingX2 = (end as unknown as { GetDrawingX(): number }).GetDrawingX();
      // C++ leaves graphic NULL for SPANNING_END: each segment gets its own
      // StartGraphic wrapper. Passing the element resumes the START segment's
      // <g>, which lives in another page/system tree, orphaning the path.
      spanningType = SpanningType.SPANNING_END;
    }
    else if (VrvObject.IsPreOrdered(s1 as unknown as VrvObject, sys as unknown as VrvObject) && VrvObject.IsPreOrdered(sys as unknown as VrvObject, s2 as unknown as VrvObject)) {
      // C++ SPANNING_MIDDLE: connector throughout the system, graphic NULL.
      measure = (system as unknown as { FindDescendantByType(id: number, d: number, dir: boolean): ViewPageMeasureLike }).FindDescendantByType(ClassId.MEASURE, 1, !BACKWARD /* FORWARD */);
      if (!measure) return;
      drawingX1 = measure.GetDrawingX() + ((measure as unknown as { GetLeftBarLineXRel?(): number }).GetLeftBarLineXRel?.() ?? 0);
      objectX = (measure as unknown as { GetLeftBarLine?(): unknown }).GetLeftBarLine?.() ?? measure;
      const last = (system as unknown as { FindDescendantByType(id: number, d: number, dir: boolean): ViewPageMeasureLike }).FindDescendantByType(ClassId.MEASURE, 1, BACKWARD);
      if (!last) return;
      drawingX2 = last.GetDrawingX() + ((last as unknown as { GetRightBarLineXRel?(): number }).GetRightBarLineXRel?.() ?? 0);
      spanningType = SpanningType.SPANNING_MIDDLE;
    }
    else {
      return;
    }
    // Open-ended control events ending on a right barline become SPANNING_START.
    if ((spanningType === SpanningType.SPANNING_START_END) && (end as unknown as { Is(id: number): boolean }).Is(ClassId.BARLINE)) {
      const pos = (end as unknown as { GetPosition(): number }).GetPosition();
      if (pos === BarLinePosition.Right) spanningType = SpanningType.SPANNING_START;
    }
    const doc = this.m_doc!;
    let startRadius = 0;
    if (!(start as unknown as { Is(id: number): boolean }).Is(ClassId.TIMESTAMP_ATTR)) startRadius = (start as unknown as { GetDrawingRadius(d: unknown): number }).GetDrawingRadius(doc);
    let endRadius = 0;
    if (!(end as unknown as { Is(id: number): boolean }).Is(ClassId.TIMESTAMP_ATTR)) endRadius = (end as unknown as { GetDrawingRadius(d: unknown): number }).GetDrawingRadius(doc);
    if (spanningType === SpanningType.SPANNING_START_END) { drawingX1 += startRadius; drawingX2 += endRadius; }
    else if (spanningType === SpanningType.SPANNING_START) { drawingX1 += startRadius; }
    else if (spanningType === SpanningType.SPANNING_END) { drawingX2 += endRadius; }
    const staffList = tsi.GetTstampStaves(measure, element);
    const cast = this as unknown as Record<string, ((...a: unknown[]) => void) | undefined>;
    let isFirst = true;
    for (let staff of staffList) {
      const staffSize = staff.m_drawingStaffSize;
      const x1 = { value: drawingX1 }; const x2 = { value: drawingX2 };
      this.SetOffsetStaffSize(element, staffSize);
      this.CalcOffsetSpanningStartX(dc as never, x1, spanningType);
      this.CalcOffsetSpanningEndX(dc as never, x2, spanningType);
      if (el.IsControlElement?.()) {
        if (el.IsAnyOf?.([ClassId.PHRASE, ClassId.SLUR])) {
          if (this.GetSlurHandling() === SlurHandling.Ignore) break;
          const slur = element as unknown as { CalculatePrincipalStaff(s: unknown, a: number, b: number): ViewPageStaffLike };
          staff = slur.CalculatePrincipalStaff?.(staff, x1.value, x2.value) ?? staff;
        }
        const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown, t: number): boolean }).SetCurrentFloatingPositioner;
        const staffN = (staff as unknown as { GetN(): number }).GetN();
        const ok = setPos ? setPos.call(system, staffN, element as unknown, objectX, staff, spanningType) : false;
        if (!ok) continue;
      }
      // C++ dispatch order kept; each Draw* remains an optional seam until its pass lands.
      if (el.Is?.(ClassId.ANNOTSCORE)) cast.DrawAnnotScore?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.DIR)) cast.DrawControlElementConnector?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.DYNAM)) cast.DrawControlElementConnector?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.FIGURE)) cast.DrawFConnector?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.BEAMSPAN)) cast.DrawBeamSpan?.(dc as never, element as never, system as never, graphic as never);
      else if (el.Is?.(ClassId.BRACKETSPAN)) cast.DrawBracketSpan?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.GLISS)) { if (!isFirst) continue; cast.DrawGliss?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never); }
      else if (el.Is?.(ClassId.HAIRPIN)) cast.DrawHairpin?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.LV)) { if (!isFirst) continue; cast.DrawTie?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never); }
      else if (el.Is?.(ClassId.PHRASE)) { if (this.GetSlurHandling() === SlurHandling.Ignore) continue; if (!isFirst) continue; cast.DrawSlur?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never); }
      else if (el.Is?.(ClassId.OCTAVE)) cast.DrawOctave?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.PEDAL)) cast.DrawPedalLine?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.PITCHINFLECTION)) cast.DrawPitchInflection?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.SLUR)) { if (this.GetSlurHandling() === SlurHandling.Ignore) continue; if (!isFirst) continue; cast.DrawSlur?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never); }
      else if (el.Is?.(ClassId.SYL)) { x2.value += endRadius; cast.DrawSylConnector?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never); }
      else if (el.Is?.(ClassId.TEMPO)) cast.DrawControlElementConnector?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      else if (el.Is?.(ClassId.TIE)) { if (!isFirst) continue; cast.DrawTie?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never); }
      else if (el.Is?.(ClassId.TRILL)) cast.DrawTrillExtension?.(dc as never, element as never, x1.value, x2.value, staff as never, spanningType, graphic as never);
      isFirst = false;
    }
  }

  //---- view_control.cpp tranche 2: text leaves ----
  // C++ View::DrawTextEnclosure(dc, params, staffSize); enclosure per enclosed REND.
  // Local TEXTRENDITION ordinals from attconverter.ts (non-exported): box=9, circle=10, dbox=11.
  public DrawTextEnclosure(dc: ViewGraphDeviceContextLike, params: TextDrawingParams, staffSize: number): void {
    if (!dc) throw new Error('View::DrawTextEnclosure requires a device context.');
    const doc = this.m_doc!;
    const options = (this as unknown as { m_options?: { m_textEnclosureThickness?: { GetValue(): number } } }).m_options
      ?? (doc as unknown as { GetOptions?(): { m_textEnclosureThickness?: { GetValue(): number } } }).GetOptions?.();
    const lineThickness = (options?.m_textEnclosureThickness?.GetValue() ?? 0) * staffSize;
    const margin = (doc as unknown as { GetDrawingUnit(s: number): number }).GetDrawingUnit(staffSize);
    (dc as unknown as { SetPushBack(): void }).SetPushBack();
    for (const rend of params.m_enclosedRend) {
      const x1 = (rend.GetContentLeft() ?? 0) - margin;
      const x2 = (rend.GetContentRight() ?? 0) + margin;
      const y1 = (rend.GetContentBottom() ?? 0) - Math.trunc(margin / 2);
      const y2 = (rend.GetContentTop() ?? 0) + margin;
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      if (params.m_enclose === 9 /* TEXTRENDITION_box */) {
        this.DrawNotFilledRectangle(dc, x1, y1, x2, y2, lineThickness, 0);
      }
      else if (params.m_enclose === 11 /* TEXTRENDITION_dbox */) {
        const yCenter = y1 + Math.trunc((y2 - y1) / 2);
        this.DrawDiamond(dc, x1 - Math.trunc(width / 2), yCenter, height * Math.SQRT2, width * 2, false, lineThickness);
      }
      else if (params.m_enclose === 10 /* TEXTRENDITION_circle */) {
        let bx1 = x1; let bx2 = x2;
        if (height > width) {
          const cx = x1 + Math.trunc((x2 - x1) / 2);
          bx1 = cx - Math.trunc(height / 2);
          bx2 = cx + Math.trunc(height / 2);
        }
        else if (height < width) {
          bx1 -= Math.trunc(width / 8);
          bx2 += Math.trunc(width / 8);
        }
        this.DrawNotFilledEllipse(dc, bx1, y1, bx2, y2, lineThickness);
      }
    }
    (dc as unknown as { ResetPushBack(): void }).ResetPushBack();
  }

  // C++ View::DrawDynam(dc, dynam, measure, system); symbol-only SMuFL path else text path.
  public DrawDynam(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawDynam requires a device context.');
    if (!element) throw new Error('View::DrawDynam requires an element.');
    if (!measure) throw new Error('View::DrawDynam requires a measure.');
    if (!system) throw new Error('View::DrawDynam requires a system.');
    const dyn = element as unknown as {
      Is(id: number): boolean; GetID(): string; GetDrawingY(): number; GetChildRendAlignment(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      IsSymbolOnly(): boolean; GetNumberOfLines(e: unknown): number;
      HasEnclose(): boolean; GetEnclose(): number; GetPlace(): number;
      GetSymbolStr(single: boolean): string;
      GetEnclosingGlyphs(): [number, number];
    };
    if (!dyn.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const isSymbolOnly = dyn.IsSymbolOnly();
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetResources(): { GetTextFont(): string };
      GetDrawingLyricFont(s: number): { GetPointSize(): number };
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
      GetTextLineHeight(f: unknown, b: boolean): number;
      GetTextXHeight(f: unknown, b: boolean): number;
      GetGlyphLeft(c: number, s: number, g: boolean): number;
      GetGlyphRight(c: number, s: number, g: boolean): number;
      GetGlyphAdvX(c: number, s: number, g: boolean): number;
      GetGlyphWidth(c: number, s: number, g: boolean): number;
      GetDrawingUnit(s: number): number;
    };
    const dynamTxt = new FontInfo();
    if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
      dynamTxt.SetFaceName(docExt.GetResources().GetTextFont());
      dynamTxt.SetStyle(FONTSTYLE_italic as FontStyle);
    }
    const lineCount = dyn.GetNumberOfLines(element);
    let alignment = dyn.GetChildRendAlignment();
    if (alignment === 0) {
      alignment = (dyn.GetStart()!.Is?.(ClassId.TIMESTAMP_ATTR)) ? HORIZONTALALIGNMENT_left : HORIZONTALALIGNMENT_center;
    }
    const options = (this as unknown as { m_options?: { m_dynamSingleGlyphs?: { GetValue(): boolean } } }).m_options
      ?? (doc as unknown as { GetOptions?(): { m_dynamSingleGlyphs?: { GetValue(): boolean } } }).GetOptions?.();
    const singleGlyphs = options?.m_dynamSingleGlyphs?.GetValue() ?? false;
    const staffList = dyn.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const startObj = dyn.GetStart() as unknown;
      const ok = setPos ? setPos.call(system, staffN, element as unknown, startObj, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = dyn.GetStart()!.GetDrawingX() + dyn.GetStart()!.GetDrawingRadius(doc);
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const params = new TextDrawingParams();
      params.m_x = x; params.m_y = y; params.m_staffSize = ss;
      params.m_pointSize = docExt.GetDrawingLyricFont(ss).GetPointSize();
      if (dyn.HasEnclose()) params.m_textEnclose = dyn.GetEnclose();
      dynamTxt.SetPointSize(params.m_pointSize);
      if (dyn.GetPlace() === STAFFREL_between) {
        if (lineCount > 1) {
          params.m_y += Math.trunc(docExt.GetTextLineHeight(dynamTxt, false) * (lineCount - 1) / 2);
        }
        params.m_y -= Math.trunc(docExt.GetTextXHeight(dynamTxt, false) / 2);
      }
      if (isSymbolOnly) {
        const dynamSymbol = UTF8to32(dyn.GetSymbolStr(singleGlyphs));
        this.DrawDynamSymbolOnly(dc, staff, element, dynamSymbol, alignment, params);
      }
      else {
        (dc as unknown as { SetFont(f: unknown): void }).SetFont(dynamTxt);
        (dc as unknown as { StartText(x: number, y: number, a: number): void })
          .StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), alignment);
        this.DrawTextChildren(dc, element, params);
        (dc as unknown as { EndText(): void }).EndText();
        (dc as unknown as { ResetFont(): void }).ResetFont();
      }
      this.DrawTextEnclosure(dc as never, params, ss);
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawDynamSymbolOnly(dc, staff, dynam, dynamSymbol, alignment, params);
  // SMuFL width accumulation with enclosing pair drawn at +unit.
  public DrawDynamSymbolOnly(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, element: ViewPageObjectLike, dynamSymbol: number[], alignment: number, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawDynamSymbolOnly requires a device context.');
    if (!staff) throw new Error('View::DrawDynamSymbolOnly requires a staff.');
    if (!element) throw new Error('View::DrawDynamSymbolOnly requires an element.');
    const dyn = element as unknown as { GetEnclosingGlyphs(): [number, number] };
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
      GetGlyphLeft(c: number, s: number, g: boolean): number;
      GetGlyphRight(c: number, s: number, g: boolean): number;
      GetGlyphAdvX(c: number, s: number, g: boolean): number;
      GetGlyphWidth(c: number, s: number, g: boolean): number;
      GetDrawingUnit(s: number): number;
    };
    const ss = staff.m_drawingStaffSize;
    (dc as unknown as { SetFont(f: unknown): void }).SetFont(docExt.GetDrawingSmuflFont(ss, false));
    const pair = dyn.GetEnclosingGlyphs();
    const enclosingFront = pair[0]; const enclosingBack = pair[1];
    const left = docExt.GetGlyphLeft(dynamSymbol[0], ss, false);
    let width = 0;
    for (let i = 0; i < dynamSymbol.length; ++i) {
      if (i === dynamSymbol.length - 1) width += docExt.GetGlyphRight(dynamSymbol[i], ss, false);
      else width += docExt.GetGlyphAdvX(dynamSymbol[i], ss, false);
    }
    const unit = docExt.GetDrawingUnit(ss);
    if (enclosingFront) {
      this.DrawSmuflString(dc as never, params.m_x, params.m_y + unit, [enclosingFront], alignment, ss);
      params.m_x += docExt.GetGlyphWidth(enclosingFront, ss, false) - left + Math.trunc(unit / 6);
    }
    this.DrawSmuflString(dc as never, params.m_x, params.m_y, dynamSymbol, alignment, ss);
    if (enclosingBack) {
      params.m_x += width + Math.trunc(unit / 6);
      this.DrawSmuflString(dc as never, params.m_x, params.m_y + unit, [enclosingBack], alignment, ss);
    }
    (dc as unknown as { ResetFont(): void }).ResetFont();
  }

  // C++ View::DrawHarm(dc, harm, measure, system); centered default; FB child else text path.
  public DrawHarm(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawHarm requires a device context.');
    if (!element) throw new Error('View::DrawHarm requires an element.');
    if (!measure) throw new Error('View::DrawHarm requires a measure.');
    if (!system) throw new Error('View::DrawHarm requires a system.');
    const harm = element as unknown as {
      Is(id: number): boolean; GetID(): string; GetDrawingY(): number; GetChildRendAlignment(): number;
      GetStart(): (ViewControlStartLike & { Is(id: number): boolean }) | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      GetFirst(): { Is(id: number): boolean } | null;
    };
    if (!harm.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetResources(): { GetTextFont(): string };
      GetDrawingLyricFont(s: number): { GetPointSize(): number };
    };
    // C++ view_control.cpp uses a real FontInfo; a literal lacks GetWeight/
    // GetStyle and crashes DrawText via dc.GetFont().
    const harmTxt = new FontInfo();
    if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
      harmTxt.SetFaceName(docExt.GetResources().GetTextFont());
    }
    let alignment = harm.GetChildRendAlignment();
    if (alignment === 0) {
      alignment = (harm.GetStart()!.Is?.(ClassId.TIMESTAMP_ATTR) ?? false) ? HORIZONTALALIGNMENT_left : HORIZONTALALIGNMENT_center;
    }
    const staffList = harm.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, harm.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = harm.GetStart()!.GetDrawingX() + harm.GetStart()!.GetDrawingRadius(doc);
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const params = new TextDrawingParams();
      params.m_x = x; params.m_y = y; params.m_staffSize = ss;
      const first = harm.GetFirst();
      if (first && first.Is(ClassId.FB)) {
        (this as unknown as { DrawFb(dc: unknown, s: unknown, f: unknown, p: unknown): void }).DrawFb(dc, staff, first, params);
      }
      else {
        params.m_pointSize = docExt.GetDrawingLyricFont(ss).GetPointSize();
        harmTxt.SetPointSize(params.m_pointSize);
        (dc as unknown as { SetFont(f: unknown): void }).SetFont(harmTxt);
        (dc as unknown as { StartText(x: number, y: number, a: number): void })
          .StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), alignment);
        this.DrawTextChildren(dc, element, params);
        (dc as unknown as { EndText(): void }).EndText();
        (dc as unknown as { ResetFont(): void }).ResetFont();
        this.DrawTextEnclosure(dc as never, params, ss);
      }
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawFermata(dc, fermata, measure, system); centered glyph + enclosing pair.
  public DrawFermata(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawFermata requires a device context.');
    if (!element) throw new Error('View::DrawFermata requires an element.');
    if (!measure) throw new Error('View::DrawFermata requires a measure.');
    if (!system) throw new Error('View::DrawFermata requires a system.');
    const ferm = element as unknown as {
      GetID(): string; GetDrawingY(): number; GetPlace(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      HasAltsym(): boolean; HasAltSymbolDef(): boolean; GetAltSymbolDef(): ViewSymbolDefLike;
      GetFermataGlyph(): number; GetEnclosingGlyphs(): [number, number]; GetVerticalAlignment(c: number): number;
    };
    if (!ferm.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const symbolDef = (ferm.HasAltsym() && ferm.HasAltSymbolDef()) ? ferm.GetAltSymbolDef() : null;
    const code = ferm.GetFermataGlyph();
    const enc = ferm.GetEnclosingGlyphs();
    const enclosingFront = enc[0]; const enclosingBack = enc[1];
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
      GetGlyphWidth(c: number, s: number, g: boolean): number;
      GetGlyphHeight(c: number, s: number, g: boolean): number;
      GetGlyphBottom(c: number, s: number, g: boolean): number;
      GetDrawingUnit(s: number): number;
    };
    const drawingX = ferm.GetStart()!.GetDrawingX() + ferm.GetStart()!.GetDrawingRadius(doc);
    const staffList = ferm.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, ferm.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = (staff as unknown as { GetDrawingStaffNotationSize(): number }).GetDrawingStaffNotationSize();
      let x = drawingX;
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const width = symbolDef ? symbolDef.GetSymbolWidth(doc, ss, false) : docExt.GetGlyphWidth(code, ss, false);
      const height = symbolDef ? symbolDef.GetSymbolHeight(doc, ss, false) : docExt.GetGlyphHeight(code, ss, false);
      const xCorr = Math.trunc(width / 2);
      let yCorr = 0;
      // Local VERTICALALIGNMENT ordinals (atts_stringtab.ts): top=1, middle=2, bottom=3.
      // C++ view_control.cpp:2048 calls the static Fermata::GetVerticalAlignment.
      const yAlignment = Fermata.GetVerticalAlignment(code);
      let enclosureYCorr = 0;
      if (yAlignment === 1 /* top */) yCorr = Math.trunc(height / 2);
      else if (yAlignment === 3 /* bottom */) yCorr = -Math.trunc(height / 2);
      else {
        const glyphBottomY = docExt.GetGlyphBottom(code, ss, false);
        if (ferm.GetPlace() === STAFFREL_above) yCorr = Math.trunc(height / 2) + glyphBottomY;
        else enclosureYCorr = Math.trunc(height / 2) + glyphBottomY;
      }
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(docExt.GetDrawingSmuflFont(ss, false));
      if (enclosingFront) {
        const xCorrEncl = xCorr + Math.trunc(docExt.GetDrawingUnit(ss) / 3) + docExt.GetGlyphWidth(enclosingFront, ss, false);
        this.DrawSmuflCode(dc as never, x - xCorrEncl, y + enclosureYCorr + yCorr, enclosingFront, ss, false);
      }
      if (symbolDef) {
        this.DrawSymbolDef(dc as never, element as never, symbolDef, x - xCorr, y, ss, false, HORIZONTALALIGNMENT_left);
      }
      else {
        this.DrawSmuflCode(dc as never, x - xCorr, y, code, ss, false);
      }
      if (enclosingBack) {
        const xCorrEncl = xCorr + Math.trunc(docExt.GetDrawingUnit(ss) / 3);
        this.DrawSmuflCode(dc as never, x + xCorrEncl, y + enclosureYCorr + yCorr, enclosingBack, ss, false);
      }
      (dc as unknown as { ResetFont(): void }).ResetFont();
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawMordent(dc, mordent, measure, system); centered glyph, accid kerning, enclosing pair.
  // Local ACCIDENTAL_WRITTEN ordinals (attconverter.ts non-exported): ff=5, f=2, n=10, s=1, x=4.
  public DrawMordent(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawMordent requires a device context.');
    if (!element) throw new Error('View::DrawMordent requires an element.');
    if (!measure) throw new Error('View::DrawMordent requires a measure.');
    if (!system) throw new Error('View::DrawMordent requires a system.');
    const mord = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      HasAltsym(): boolean; HasAltSymbolDef(): boolean; GetAltSymbolDef(): ViewSymbolDefLike;
      GetMordentGlyph(): number; GetEnclosingGlyphs(): [number, number];
      HasAccidlower(): boolean; GetAccidlower(): number;
      HasAccidupper(): boolean; GetAccidupper(): number;
    };
    if (!mord.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const symbolDef = (mord.HasAltsym() && mord.HasAltSymbolDef()) ? mord.GetAltSymbolDef() : null;
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
      GetGlyphWidth(c: number, s: number, g: boolean): number;
      GetGlyphHeight(c: number, s: number, g: boolean): number;
      GetGlyphTop(c: number, s: number, g: boolean): number;
      GetGlyphBottom(c: number, s: number, g: boolean): number;
      GetGlyphAdvX(c: number, s: number, g: boolean): number;
      GetDrawingUnit(s: number): number;
    };
    // C++ calls the static Accid::GetAccidGlyph directly (view_control.cpp).
    const accidExt = (a: number): number => Accid.GetAccidGlyph(a as never);
    const drawingX = mord.GetStart()!.GetDrawingX() + mord.GetStart()!.GetDrawingRadius(doc);
    const code = mord.GetMordentGlyph();
    const enc = mord.GetEnclosingGlyphs();
    const enclosingFront = enc[0]; const enclosingBack = enc[1];
    const str = [code];
    const staffList = mord.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, mord.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = drawingX;
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const mordentHeight = symbolDef ? symbolDef.GetSymbolHeight(doc, ss, false) : docExt.GetGlyphHeight(code, ss, false);
      const mordentWidth = symbolDef ? symbolDef.GetSymbolWidth(doc, ss, false) : docExt.GetGlyphWidth(code, ss, false);
      x -= Math.trunc(mordentWidth / 2);
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(docExt.GetDrawingSmuflFont(ss, false));
      if (mord.HasAccidlower()) {
        const accid = accidExt ? accidExt(mord.GetAccidlower()) : 0;
        let accidY = y;
        let accidX = x;
        if (!symbolDef) {
          let xShift = 0.0;
          let factor = 1.0;
          const meiaccid = mord.GetAccidlower();
          if (meiaccid === 5 /* ff */) { factor = 1.20; xShift = 0.14; }
          else if (meiaccid === 2 /* f */) { factor = 1.20; xShift = -0.02; }
          else if (meiaccid === 10 /* n */) { factor = 0.90; xShift = -0.04; }
          else if (meiaccid === 1 /* s */) { factor = 1.15; }
          else if (meiaccid === 4 /* x */) { factor = 2.00; }
          accidX += Math.trunc((1 + xShift) * mordentWidth / 2);
          accidY -= Math.trunc(factor * docExt.GetGlyphHeight(accid, ss, true) / 2);
        }
        else {
          accidX += Math.trunc(mordentWidth / 2);
          accidY -= (docExt.GetGlyphTop(accid, Math.trunc(ss / 2), true) + docExt.GetDrawingUnit(Math.trunc(ss * 2 / 3)));
        }
        this.DrawSmuflString(dc as never, accidX, accidY, [accid], HORIZONTALALIGNMENT_center, Math.trunc(ss / 2), false);
      }
      else if (mord.HasAccidupper()) {
        const accid = accidExt ? accidExt(mord.GetAccidupper()) : 0;
        let accidY = y;
        let accidX = x;
        if (!symbolDef) {
          let xShift = 0.0;
          let factor = 1.75;
          const meiaccid = mord.GetAccidupper();
          if (meiaccid === 5 /* ff */) { factor = 1.40; }
          else if (meiaccid === 2 /* f */) { factor = 1.25; }
          else if (meiaccid === 10 /* n */) { factor = 1.60; xShift = -0.10; }
          else if (meiaccid === 1 /* s */) { factor = 1.60; xShift = -0.06; }
          else if (meiaccid === 4 /* x */) { factor = 1.35; xShift = -0.08; }
          accidX += Math.trunc((1 + xShift) * mordentWidth / 2);
          accidY += Math.trunc(factor * mordentHeight);
        }
        else {
          accidX += Math.trunc(mordentWidth / 2);
          accidY += (mordentHeight - docExt.GetGlyphBottom(accid, Math.trunc(ss / 2), true)
            + docExt.GetDrawingUnit(Math.trunc(ss * 2 / 3)));
        }
        this.DrawSmuflString(dc as never, accidX, accidY, [accid], HORIZONTALALIGNMENT_center, Math.trunc(ss / 2), false);
      }
      const yCorrEncl = Math.trunc(docExt.GetGlyphHeight(SMUFL_E56C_ornamentShortTrill, ss, false) / 2);
      if (enclosingFront) {
        const xCorrEncl = docExt.GetGlyphWidth(enclosingFront, ss, false);
        this.DrawSmuflCode(dc as never, x - xCorrEncl, y + yCorrEncl, enclosingFront, ss, false);
      }
      if (symbolDef) {
        this.DrawSymbolDef(dc as never, element as never, symbolDef, x, y, ss, false, HORIZONTALALIGNMENT_left);
      }
      else {
        this.DrawSmuflString(dc as never, x, y, str, HORIZONTALALIGNMENT_left, ss);
      }
      if (enclosingBack) {
        const xCorrEncl = mordentWidth + docExt.GetGlyphWidth(enclosingBack, ss, false)
          - docExt.GetGlyphAdvX(enclosingBack, ss, false);
        this.DrawSmuflCode(dc as never, x + xCorrEncl, y + yCorrEncl, enclosingBack, ss, false);
      }
      (dc as unknown as { ResetFont(): void }).ResetFont();
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawBreath(dc, breath, measure, system); comma glyph, timestamp?left:center.
  public DrawBreath(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawBreath requires a device context.');
    if (!element) throw new Error('View::DrawBreath requires an element.');
    if (!measure) throw new Error('View::DrawBreath requires a measure.');
    if (!system) throw new Error('View::DrawBreath requires a system.');
    const breath = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      HasAltsym(): boolean; HasAltSymbolDef(): boolean; GetAltSymbolDef(): ViewSymbolDefLike;
    };
    if (!breath.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const symbolDef = (breath.HasAltsym() && breath.HasAltSymbolDef()) ? breath.GetAltSymbolDef() : null;
    const doc = this.m_doc!;
    const drawingX = breath.GetStart()!.GetDrawingX() + breath.GetStart()!.GetDrawingRadius(doc);
    const str = [SMUFL_E4CE_breathMarkComma];
    let alignment = HORIZONTALALIGNMENT_center;
    if (breath.GetStart()!.Is?.(ClassId.TIMESTAMP_ATTR)) alignment = HORIZONTALALIGNMENT_left;
    const staffList = breath.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, breath.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = drawingX;
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      if (symbolDef) {
        this.DrawSymbolDef(dc as never, element as never, symbolDef, x, y, ss, false, alignment);
      }
      else {
        (dc as unknown as { SetFont(f: unknown): void }).SetFont((doc as unknown as { GetDrawingSmuflFont(s: number, b: boolean): unknown }).GetDrawingSmuflFont(ss, false));
        this.DrawSmuflString(dc as never, x, y, str, alignment, ss);
        (dc as unknown as { ResetFont(): void }).ResetFont();
      }
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawCaesura(dc, caesura, measure, system); radius*3, within?staff-based y.
  public DrawCaesura(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawCaesura requires a device context.');
    if (!element) throw new Error('View::DrawCaesura requires an element.');
    if (!measure) throw new Error('View::DrawCaesura requires a measure.');
    if (!system) throw new Error('View::DrawCaesura requires a system.');
    const caes = element as unknown as {
      GetID(): string; GetDrawingY(): number; HasPlace(): boolean; GetPlace(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      HasAltsym(): boolean; HasAltSymbolDef(): boolean; GetAltSymbolDef(): ViewSymbolDefLike;
      GetCaesuraGlyph(): number;
    };
    if (!caes.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const symbolDef = (caes.HasAltsym() && caes.HasAltSymbolDef()) ? caes.GetAltSymbolDef() : null;
    const doc = this.m_doc!;
    const docExt = doc as unknown as { GetGlyphHeight(c: number, s: number, b: boolean): number };
    const code = caes.GetCaesuraGlyph();
    const drawingX = caes.GetStart()!.GetDrawingX() + caes.GetStart()!.GetDrawingRadius(doc) * 3;
    const staffList = caes.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, caes.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = drawingX;
      const glyphHeight = symbolDef ? symbolDef.GetSymbolHeight(doc, ss, false) : docExt.GetGlyphHeight(code, ss, false);
      const staffY = (staff as unknown as { GetDrawingY(): number }).GetDrawingY();
      let y = (caes.HasPlace() && (caes.GetPlace() !== STAFFREL_within)) ? element.GetDrawingY() : staffY - Math.trunc(glyphHeight / 2);
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      if (symbolDef) {
        this.DrawSymbolDef(dc as never, element as never, symbolDef, x, y, ss, false, HORIZONTALALIGNMENT_left);
      }
      else {
        this.DrawSmuflCode(dc as never, x, y, code, ss, false);
      }
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawReh(dc, reh, measure, system); bold text at measure start, clef/metersig adjust.
  public DrawReh(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawReh requires a device context.');
    if (!element) throw new Error('View::DrawReh requires an element.');
    if (!measure) throw new Error('View::DrawReh requires a measure.');
    if (!system) throw new Error('View::DrawReh requires a system.');
    const reh = element as unknown as {
      GetID(): string; GetDrawingY(): number; GetChildRendAlignment(): number;
      GetStart(): (ViewControlStartLike & { Is?(id: number): boolean; GetContentRight?(): number; GetContentLeft?(): number }) | null;
      HasTstamp(): boolean; GetTstamp(): number;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
    };
    if (!reh.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetResources(): { GetTextFont(): string };
      GetDrawingLyricFont(s: number): { GetPointSize(): number };
      GetDrawingUnit(s: number): number;
    };
    // C++ view_control.cpp:2600 `FontInfo rehTxt;` — SetFont(FontInfo&) keeps the
    // font stack typed; a plain object breaks dc.GetFont().GetWeight() (31a).
    const rehTxt = new FontInfo();
    if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
      rehTxt.SetFaceName(docExt.GetResources().GetTextFont());
      rehTxt.SetWeight(1 as FontWeight); // FONTWEIGHT_bold
    }
    let yMargin = 3;
    let drawingX = reh.GetStart()!.GetDrawingX();
    const sysExt = system as unknown as {
      GetFirst(id: number): unknown;
      IsFirstOfMdiv?(): boolean;
      GetTopVisibleStaff?(b: boolean): ViewPageStaffLike | null;
      SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean;
    };
    const adjustPosition = ((reh.HasTstamp() && (reh.GetTstamp() === 0.0))
      || (reh.GetStart()!.Is?.(ClassId.BARLINE) && (reh.GetStart() as unknown as { GetPosition?(): number }).GetPosition?.() === 1 /* Left */));
    if ((sysExt.GetFirst(ClassId.MEASURE) === measure) && adjustPosition) {
      // StaffDef info always in first layer; seams for unmigrated Layer contracts.
      const layer = (measure as unknown as { FindDescendantByType?(id: number): unknown }).FindDescendantByType?.(ClassId.LAYER) as unknown as {
        GetStaffDefClef?(): { GetDrawingX(): number; GetContentRight?(): number; GetContentLeft?(): number } | null;
        GetStaffDefMeterSig?(): { GetDrawingX(): number; GetContentRight?(): number; GetContentLeft?(): number } | null;
      } | null | undefined;
      if (sysExt.IsFirstOfMdiv && !sysExt.IsFirstOfMdiv()) {
        const clef = layer?.GetStaffDefClef?.();
        if (clef) {
          const right = clef.GetContentRight?.() ?? 0;
          const left = clef.GetContentLeft?.() ?? 0;
          drawingX = clef.GetDrawingX() + Math.trunc((right - left) / 2);
          yMargin = 5;
        }
      }
      else {
        const metersig = layer?.GetStaffDefMeterSig?.();
        if (metersig) {
          const right = metersig.GetContentRight?.() ?? 0;
          const left = metersig.GetContentLeft?.() ?? 0;
          drawingX = metersig.GetDrawingX() + Math.trunc((right - left) / 2);
        }
      }
    }
    let alignment = reh.GetChildRendAlignment();
    if (alignment === 0) alignment = HORIZONTALALIGNMENT_center;
    let staffList = reh.GetTstampStaves(measure, element);
    if (staffList.length === 0) {
      const top = sysExt.GetTopVisibleStaff?.(false);
      if (top) staffList = [top];
    }
    for (const staff of staffList) {
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = sysExt.SetCurrentFloatingPositioner ? sysExt.SetCurrentFloatingPositioner.call(system, staffN, element as unknown, reh.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = drawingX;
      if ((sysExt.GetFirst(ClassId.MEASURE) !== measure) && adjustPosition) {
        x = (staff as unknown as { GetDrawingX(): number }).GetDrawingX();
      }
      let y = element.GetDrawingY() + yMargin * docExt.GetDrawingUnit(ss);
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const params = new TextDrawingParams();
      params.m_x = x; params.m_y = y; params.m_staffSize = ss;
      params.m_pointSize = docExt.GetDrawingLyricFont(ss).GetPointSize();
      rehTxt.SetPointSize(params.m_pointSize);
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(rehTxt);
      (dc as unknown as { StartText(x: number, y: number, a: number): void })
        .StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), alignment);
      this.DrawTextChildren(dc, element, params);
      (dc as unknown as { EndText(): void }).EndText();
      (dc as unknown as { ResetFont(): void }).ResetFont();
      this.DrawTextEnclosure(dc as never, params, ss);
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawRepeatMark(dc, repeatMark, measure, system); text path if children else glyph.
  public DrawRepeatMark(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawRepeatMark requires a device context.');
    if (!element) throw new Error('View::DrawRepeatMark requires an element.');
    if (!measure) throw new Error('View::DrawRepeatMark requires a measure.');
    if (!system) throw new Error('View::DrawRepeatMark requires a system.');
    const mark = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      HasAltsym(): boolean; HasAltSymbolDef(): boolean; GetAltSymbolDef(): ViewSymbolDefLike;
      GetMarkGlyph(): number;
    };
    if (!mark.GetStart()) return;
    const childCount = (element as unknown as { GetChildCount?(): number }).GetChildCount?.() ?? 0;
    if (childCount > 0) {
      this.DrawControlElementText(dc, element, measure, system);
      return;
    }
    dc.StartGraphic(element, '', element.GetID());
    const symbolDef = (mark.HasAltsym() && mark.HasAltSymbolDef()) ? mark.GetAltSymbolDef() : null;
    const doc = this.m_doc!;
    const drawingX = mark.GetStart()!.GetDrawingX() + mark.GetStart()!.GetDrawingRadius(doc);
    const code = mark.GetMarkGlyph();
    let alignment = HORIZONTALALIGNMENT_center;
    if (mark.GetStart()!.Is?.(ClassId.TIMESTAMP_ATTR)) alignment = HORIZONTALALIGNMENT_left;
    const str = [code];
    const staffList = mark.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, mark.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = drawingX;
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      (dc as unknown as { SetFont(f: unknown): void }).SetFont((doc as unknown as { GetDrawingSmuflFont(s: number, b: boolean): unknown }).GetDrawingSmuflFont(ss, false));
      if (symbolDef) {
        this.DrawSymbolDef(dc as never, element as never, symbolDef, x, y, ss, false, alignment);
      }
      else {
        this.DrawSmuflString(dc as never, x, y, str, alignment, ss);
      }
      (dc as unknown as { ResetFont(): void }).ResetFont();
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawTempo(dc, tempo, measure, system); bold left-aligned text, between shift.
  public DrawTempo(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawTempo requires a device context.');
    if (!element) throw new Error('View::DrawTempo requires an element.');
    if (!measure) throw new Error('View::DrawTempo requires a measure.');
    if (!system) throw new Error('View::DrawTempo requires a system.');
    const tempo = element as unknown as {
      GetID(): string; GetDrawingY(): number; GetChildRendAlignment(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      GetNumberOfLines(e: unknown): number; GetPlace(): number;
      GetDrawingXRelativeToStaff(n: number): number;
    };
    if (!tempo.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetResources(): { GetTextFont(): string };
      GetDrawingLyricFont(s: number): { GetPointSize(): number };
      GetTextLineHeight(f: unknown, b: boolean): number;
      GetTextXHeight(f: unknown, b: boolean): number;
    };
    const tempoTxt = new FontInfo();
    if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
      tempoTxt.SetFaceName(docExt.GetResources().GetTextFont());
      tempoTxt.SetWeight(1 as FontWeight); // FONTWEIGHT_bold
    }
    const lineCount = tempo.GetNumberOfLines(element);
    let alignment = tempo.GetChildRendAlignment();
    if (alignment === 0) alignment = HORIZONTALALIGNMENT_left;
    const staffList = tempo.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, tempo.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = tempo.GetDrawingXRelativeToStaff(staffN);
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const params = new TextDrawingParams();
      params.m_x = x; params.m_y = y; params.m_staffSize = ss;
      params.m_pointSize = docExt.GetDrawingLyricFont(ss).GetPointSize();
      tempoTxt.SetPointSize(params.m_pointSize);
      if (tempo.GetPlace() === STAFFREL_between) {
        if (lineCount > 1) {
          params.m_y += Math.trunc(docExt.GetTextLineHeight(tempoTxt, false) * (lineCount - 1) / 2);
        }
        params.m_y -= Math.trunc(docExt.GetTextXHeight(tempoTxt, false) / 2);
      }
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(tempoTxt);
      (dc as unknown as { StartText(x: number, y: number, a: number): void })
        .StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), alignment);
      this.DrawTextChildren(dc, element, params);
      (dc as unknown as { EndText(): void }).EndText();
      (dc as unknown as { ResetFont(): void }).ResetFont();
      this.DrawTextEnclosure(dc as never, params, ss);
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawFing(dc, fing, measure, system); centered fingering-font text.
  public DrawFing(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawFing requires a device context.');
    if (!element) throw new Error('View::DrawFing requires an element.');
    if (!measure) throw new Error('View::DrawFing requires a measure.');
    if (!system) throw new Error('View::DrawFing requires a system.');
    const fing = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetStart(): ViewControlStartLike | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
    };
    if (!fing.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetResources(): { GetTextFont(): string };
      GetFingeringFont(s: number): { GetPointSize(): number };
    };
    const fingTxt = new FontInfo();
    if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
      fingTxt.SetFaceName(docExt.GetResources().GetTextFont());
    }
    const alignment = HORIZONTALALIGNMENT_center;
    const staffList = fing.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, fing.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = fing.GetStart()!.GetDrawingX() + fing.GetStart()!.GetDrawingRadius(doc);
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const params = new TextDrawingParams();
      params.m_x = x; params.m_y = y; params.m_staffSize = ss;
      params.m_pointSize = docExt.GetFingeringFont(ss).GetPointSize();
      fingTxt.SetPointSize(params.m_pointSize);
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(fingTxt);
      (dc as unknown as { StartText(x: number, y: number, a: number): void })
        .StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), alignment);
      this.DrawTextChildren(dc, element, params);
      (dc as unknown as { EndText(): void }).EndText();
      (dc as unknown as { ResetFont(): void }).ResetFont();
      this.DrawTextEnclosure(dc as never, params, ss);
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawControlElementConnector(dc, element, x1, x2, staff, spanningType, graphic);
  // Dashed extender line: x1 from current positioner content-right, x2 from next-link content-left.
  public DrawControlElementConnector(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!element) throw new Error('View::DrawControlElementConnector requires an element.');
    if (!staff) throw new Error('View::DrawControlElementConnector requires a staff.');
    const ctrl = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetTimeSpanningInterface(): { GetEnd(): unknown | null } | null;
      GetNextLink(): unknown | null;
      GetCurrentFloatingPositioner(): { HasContentBB(): boolean; GetContentRight(): number; SetDrawingExtenderWidth(w: number): void } | null;
      GetCorrespFloatingPositioner(link: unknown): { HasContentBB(): boolean; GetContentLeft(): number } | null;
    };
    const tsi = ctrl.GetTimeSpanningInterface();
    if (!ctrl.GetNextLink() && !(tsi && tsi.GetEnd())) return;
    if ((spanningType === SpanningType.SPANNING_START) || (spanningType === SpanningType.SPANNING_START_END)) {
      const pos = ctrl.GetCurrentFloatingPositioner();
      if (pos && pos.HasContentBB()) x1 = pos.GetContentRight();
    }
    if ((spanningType === SpanningType.SPANNING_END) || (spanningType === SpanningType.SPANNING_START_END)) {
      if (ctrl.GetNextLink()) {
        const nextLink = ctrl.GetCorrespFloatingPositioner(ctrl.GetNextLink() as never);
        if (nextLink && nextLink.HasContentBB()) x2 = nextLink.GetContentLeft();
      }
    }
    const opts = (this as unknown as { m_options: { m_lyricLineThickness: { GetValue(): number }; m_extenderLineMinSpace: { GetValue(): number } } }).m_options;
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetDrawingStaffSize(s: number): number;
    };
    const width = Math.trunc(opts.m_lyricLineThickness.GetValue() * docExt.GetDrawingUnit(staff.m_drawingStaffSize));
    let y = element.GetDrawingY() + Math.trunc(width / 2);
    const yRef = { value: y };
    this.CalcOffsetY(dc as never, yRef);
    y = yRef.value;
    const unit = docExt.GetDrawingUnit(staff.m_drawingStaffSize);
    const dashSpace = Math.trunc(docExt.GetDrawingStaffSize(staff.m_drawingStaffSize) * 5 / 3);
    const minDashSpace = Math.trunc(opts.m_extenderLineMinSpace.GetValue() * unit);
    const halfDashLength = Math.trunc(unit * 2 / 3);
    const dist = x2 - x1;
    let nbDashes = Math.trunc(dist / dashSpace);
    let margin = Math.trunc(dist / 2);
    if (dist < minDashSpace) nbDashes = 0;
    else if (nbDashes < 2) nbDashes = 1;
    else margin = Math.trunc((dist - ((nbDashes - 1) * dashSpace)) / 2);
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      DeactivateGraphic?(): void; ReactivateGraphic?(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    let deactivate = true;
    if (!ctrl.GetNextLink() && (spanningType !== SpanningType.SPANNING_START_END) && (spanningType !== SpanningType.SPANNING_START)) {
      deactivate = false;
    }
    if (deactivate) {
      dcExt.DeactivateGraphic?.();
      ctrl.GetCurrentFloatingPositioner()?.SetDrawingExtenderWidth(dist);
    }
    for (let i = 0; i < nbDashes; ++i) {
      let x = x1 + margin + (i * dashSpace);
      x = Math.max(x, x1);
      this.DrawFilledRectangle(dc as never, x - halfDashLength, y, x + halfDashLength, y + width);
    }
    if (deactivate) dcExt.ReactivateGraphic?.();
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawSystemElement(dc, element, system); milestone/ending/pb/sb/section placeholders.
  public DrawSystemElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawSystemElement requires a device context.');
    if (!element) throw new Error('View::DrawSystemElement requires an element.');
    if (!system) throw new Error('View::DrawSystemElement requires a system.');
    const el = element as unknown as {
      Is(id: number): boolean; GetID(): string;
      GetStart(): { GetID(): string } | null;
    };
    if (el.Is(ClassId.SYSTEM_MILESTONE_END)) {
      const start = el.GetStart();
      if (!start) throw new Error('View::DrawSystemElement: milestone end requires start.');
      dc.StartGraphic(element, start.GetID(), element.GetID());
      dc.EndGraphic(element, this);
    }
    else if (el.Is(ClassId.ENDING)) {
      dc.StartGraphic(element, 'systemMilestone', element.GetID());
      dc.EndGraphic(element, this);
    }
    else if (el.Is(ClassId.PB)) {
      dc.StartGraphic(element, '', element.GetID());
      dc.EndGraphic(element, this);
    }
    else if (el.Is(ClassId.SB)) {
      dc.StartGraphic(element, '', element.GetID());
      dc.EndGraphic(element, this);
    }
    else if (el.Is(ClassId.SECTION)) {
      dc.StartGraphic(element, 'systemMilestone', element.GetID());
      dc.EndGraphic(element, this);
    }
  }

  // C++ View::DrawArpeg(dc, arpeg, measure, system); bracket or rotated smufl line.
  // Local ordinals: arpegLog_ORDER_down=2, nonarp=3; BOOLEAN_true=1; LINESTARTENDSYMBOL_none=20.
  public DrawArpeg(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawArpeg requires a device context.');
    if (!element) throw new Error('View::DrawArpeg requires an element.');
    if (!measure) throw new Error('View::DrawArpeg requires a measure.');
    if (!system) throw new Error('View::DrawArpeg requires a system.');
    const arpeg = element as unknown as {
      GetID(): string; GetDrawingX(): number; GetDrawingXRel(): number;
      GetDrawingTopBottomNotes(): {
        top: { GetDrawingY(): number; GetAncestorStaff(): ViewPageStaffLike | null; GetDrawingCueSize?(): boolean } | null;
        bottom: { GetDrawingY(): number } | null;
      };
      GetOrder(): number; GetArrow(): number; GetArrowShape(): number;
      GetCurrentFloatingPositioner(): { SetDrawingXRel(x: number): void } | null;
    };
    const notes = arpeg.GetDrawingTopBottomNotes();
    const topNote = notes.top; const bottomNote = notes.bottom;
    if (!topNote || !bottomNote) return;
    const top = topNote.GetDrawingY();
    const bottom = bottomNote.GetDrawingY();
    const staff = topNote.GetAncestorStaff();
    if (!staff) return;
    const drawingCueSize = topNote.GetDrawingCueSize?.() ?? false;
    const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
    const staffN = (staff as unknown as { GetN(): number }).GetN();
    if (!(setPos ? setPos.call(system, staffN, element as unknown, topNote as unknown, staff as unknown) : false)) return;
    arpeg.GetCurrentFloatingPositioner()?.SetDrawingXRel(arpeg.GetDrawingXRel());
    let length = top - bottom;
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetDrawingStemWidth(s: number): number;
    };
    const unit = docExt.GetDrawingUnit(staff.m_drawingStaffSize);
    let x = arpeg.GetDrawingX();
    let y = bottom - unit;
    this.SetOffsetStaffSize(element as never, staff.m_drawingStaffSize);
    const p = { x, y };
    this.CalcOffset(dc as never, p);
    x = p.x; y = p.y;
    const order = arpeg.GetOrder();
    if (order === 3 /* nonarp */) {
      dc.StartGraphic(element, '', element.GetID());
      const offset = Math.trunc(unit / 2);
      const thickness = docExt.GetDrawingStemWidth(staff.m_drawingStaffSize);
      this.DrawSquareBracket(dc as never, true, x - unit, bottom - offset, length + 2 * offset, unit, thickness, thickness);
      dc.EndGraphic(element, this);
    }
    else {
      length += 2 * unit;
      let startGlyph = SMUFL_EAA9_wiggleArpeggiatoUp;
      let fillGlyph = SMUFL_EAA9_wiggleArpeggiatoUp;
      let endGlyph = (arpeg.GetArrow() === 1 /* BOOLEAN_true */) ? SMUFL_EAAD_wiggleArpeggiatoUpArrow : 0;
      if (order === 2 /* down */) {
        startGlyph = (arpeg.GetArrow() === 1) ? SMUFL_EAAE_wiggleArpeggiatoDownArrow : 0;
        fillGlyph = SMUFL_EAAA_wiggleArpeggiatoDown;
        endGlyph = SMUFL_EAAA_wiggleArpeggiatoDown;
      }
      if (arpeg.GetArrowShape() === 20 /* none */) endGlyph = 0;
      const orig = new Point(x, y);
      dc.StartGraphic(element, '', element.GetID());
      (dc as unknown as { RotateGraphic?(p: { x: number; y: number }, a: number): void })
        .RotateGraphic?.({ x: this.ToDeviceContextX(x), y: this.ToDeviceContextY(y) }, -90);
      this.DrawSmuflLine(dc as never, orig, length, staff.m_drawingStaffSize, drawingCueSize, fillGlyph, startGlyph, endGlyph);
      dc.EndGraphic(element, this);
      this.DrawArpegEnclosing(dc, element, staff, startGlyph, fillGlyph, endGlyph, x, y, length, drawingCueSize);
    }
  }

  // C++ View::DrawArpegEnclosing(...); brack/box brackets, else warning for other enclosures.
  public DrawArpegEnclosing(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, staff: ViewPageStaffLike, startGlyph: number, fillGlyph: number, endGlyph: number, x: number, y: number, height: number, cueSize: boolean): void {
    if (!dc) throw new Error('View::DrawArpegEnclosing requires a device context.');
    if (!element) throw new Error('View::DrawArpegEnclosing requires an element.');
    if (!staff) throw new Error('View::DrawArpegEnclosing requires a staff.');
    const arpeg = element as unknown as {
      GetID(): string; GetEnclose(): number; HasEnclose(): boolean;
      GetArrow(): number; GetOrder(): number;
    };
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetGlyphHeight(c: number, s: number, b: boolean): number;
      GetDrawingStemWidth(s: number): number;
    };
    if ((arpeg.GetEnclose() === 2 /* brack */) || (arpeg.GetEnclose() === 3 /* box */)) {
      const unit = docExt.GetDrawingUnit(staff.m_drawingStaffSize);
      const width0 = docExt.GetGlyphHeight(fillGlyph, staff.m_drawingStaffSize, cueSize);
      let exceedingWidth = Math.max(unit - width0, 0);
      if (arpeg.GetArrow() === 1) {
        let arrowWidth = 0;
        if (arpeg.GetOrder() === 2 /* down */) arrowWidth = docExt.GetGlyphHeight(startGlyph, staff.m_drawingStaffSize, cueSize);
        else arrowWidth = docExt.GetGlyphHeight(endGlyph, staff.m_drawingStaffSize, cueSize);
        exceedingWidth = Math.max(exceedingWidth, arrowWidth - width0);
      }
      x -= (width0 + Math.trunc(exceedingWidth / 2));
      const width = width0 + exceedingWidth;
      const offset = Math.trunc(3 * unit / 4);
      const bracketWidth = (arpeg.GetEnclose() === 2) ? unit : (width + offset);
      const verticalThickness = docExt.GetDrawingStemWidth(staff.m_drawingStaffSize);
      const horizontalThickness = ((arpeg.GetEnclose() === 2) ? 2 : 1) * verticalThickness;
      dc.StartGraphic(element, '', element.GetID());
      this.DrawEnclosingBrackets(dc as never, x, y, height, width, offset, bracketWidth, horizontalThickness, verticalThickness);
      dc.EndGraphic(element, this);
    }
    else if (arpeg.HasEnclose() && (arpeg.GetEnclose() !== 4 /* none */)) {
      LogWarning('Only drawing of enclosing brackets and boxes is supported for arpeggio.');
    }
  }

  // C++ View::DrawFConnector(dc, f, x1, x2, staff, spanningType, graphic); solid lyric line via FB ancestor.
  public DrawFConnector(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!element) throw new Error('View::DrawFConnector requires an F.');
    if (!staff) throw new Error('View::DrawFConnector requires a staff.');
    const f = element as unknown as {
      GetID(): string; GetStart(): unknown | null; GetEnd(): unknown | null;
      GetContentRight(): number; GetFirst(classId: number): { GetContentRight(): number } | null;
    };
    if (!f.GetStart() || !f.GetEnd()) return;
    let y = this.GetFYRel(element, staff);
    const yRef = { value: y };
    this.CalcOffsetY(dc as never, yRef);
    y = yRef.value;
    if (spanningType === SpanningType.SPANNING_START_END) {
      x1 = f.GetContentRight();
    }
    else if (spanningType === SpanningType.SPANNING_START) {
      const text = f.GetFirst(ClassId.TEXT);
      if (text) x1 = text.GetContentRight();
    }
    const fb = (graphic ? (graphic as unknown as { GetFirstAncestor?(id: number): unknown }).GetFirstAncestor?.(ClassId.FB) : null) ?? null;
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      DeactivateGraphic?(): void; ReactivateGraphic?(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (fb) dcExt.ResumeGraphic?.(fb, (fb as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic({ fConnector: true }, '', f.GetID?.() ?? '', GraphicID.SPANNING);
    dcExt.DeactivateGraphic?.();
    const opts = (this as unknown as { m_options: { m_lyricLineThickness: { GetValue(): number }; m_lyricSize: { GetValue(): number; GetDefault(): number } } }).m_options;
    const docExt = (this.m_doc!) as unknown as { GetDrawingUnit(s: number): number };
    let width = Math.trunc(opts.m_lyricLineThickness.GetValue() * docExt.GetDrawingUnit(staff.m_drawingStaffSize));
    width = Math.trunc(width * opts.m_lyricSize.GetValue() / opts.m_lyricSize.GetDefault());
    this.DrawFilledRectangle(dc as never, x1, y, x2, y + width);
    dcExt.ReactivateGraphic?.();
    if (fb) dcExt.EndResumedGraphic?.(fb, this);
    else dcExt.EndGraphic({ fConnector: true }, this);
  }

  // C++ View::DrawSylConnectorLines(dc, x1, x2, y, syl, staff); hyphen dashes (d) or solid (u).
  // Local ordinals: sylLog_CON_d=2, sylLog_CON_u=3 (attconverter non-exported).
  public DrawSylConnectorLines(dc: ViewPageDeviceContextLike, x1: number, x2: number, y: number, element: ViewPageObjectLike, staff: ViewPageStaffLike): void {
    if (!staff) throw new Error('View::DrawSylConnectorLines requires a staff.');
    if (dc.Is && dc.Is(ClassId.BBOX_DEVICE_CONTEXT)) return;
    const syl = element as unknown as {
      GetCon(): number;
      CalcHyphenLength(doc: unknown, staffSize: number): number;
    };
    const opts = (this as unknown as { m_options: { m_lyricLineThickness: { GetValue(): number }; m_lyricSize: { GetValue(): number; GetDefault(): number } } }).m_options;
    const docExt = (this.m_doc!) as unknown as {
      GetDrawingUnit(s: number): number;
      GetDrawingStaffSize(s: number): number;
    };
    let thickness = Math.trunc(opts.m_lyricLineThickness.GetValue() * docExt.GetDrawingUnit(staff.m_drawingStaffSize));
    thickness = Math.trunc(thickness * opts.m_lyricSize.GetValue() / opts.m_lyricSize.GetDefault());
    if (syl.GetCon() === 2 /* d */) {
      y += Math.trunc(opts.m_lyricSize.GetValue() * docExt.GetDrawingUnit(staff.m_drawingStaffSize) / 5);
      const dashLength = syl.CalcHyphenLength(this.m_doc, staff.m_drawingStaffSize);
      const halfDashLength = Math.trunc(dashLength / 2);
      const dashSpace = Math.trunc(docExt.GetDrawingStaffSize(staff.m_drawingStaffSize) * 5 / 3);
      const dist = x2 - x1;
      let nbDashes = Math.trunc(dist / dashSpace);
      let margin = Math.trunc(dist / 2);
      if (dist < dashLength) {
        LogDebug('Hyphen space under the limit');
        nbDashes = 0;
      }
      else if (nbDashes < 2) nbDashes = 1;
      else margin = Math.trunc((dist - ((nbDashes - 1) * dashSpace)) / 2);
      for (let i = 0; i < nbDashes; ++i) {
        let x = x1 + margin + (i * dashSpace);
        x = Math.max(x, x1);
        this.DrawFilledRectangle(dc as never, x - halfDashLength, y, x + halfDashLength, y + thickness);
      }
    }
    else if (syl.GetCon() === 3 /* u */) {
      x1 += Math.trunc(docExt.GetDrawingUnit(staff.m_drawingStaffSize) / 2);
      if (x2 > x1) this.DrawFilledRectangle(dc as never, x1, y, x2, y + thickness);
    }
  }

  // C++ View::DrawSylConnector(dc, syl, x1, x2, staff, spanningType, graphic).
  public DrawSylConnector(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    // C++ temporary Syl for the connector graphic scope (BBox EndGraphic asserts stack identity).
    const sylConnectorLocal: { value: Syl | null } = { value: null };
    if (!element) throw new Error('View::DrawSylConnector requires a syl.');
    if (!staff) throw new Error('View::DrawSylConnector requires a staff.');
    const syl = element as unknown as {
      GetID(): string; HasContentHorizontalBB(): boolean;
      GetContentRight(): number;
      m_drawingVerseN: number; m_drawingVersePlace: number; m_drawingVoltaN: number;
      m_nextWordSyl: { HasContentHorizontalBB(): boolean; GetContentLeft(): number } | null;
      GetStart(): unknown | null; GetEnd(): {
        GetAlignment(): { GetTime(): number } | null;
        GetFirstAncestor(id: number): { GetFirstAncestor(id: number): unknown } | null;
      } | null;
    };
    if (!syl.GetStart() || !syl.GetEnd()) return;
    let y = staff.GetDrawingY() + this.GetSylYRel(syl.m_drawingVerseN, staff, syl.m_drawingVersePlace, syl.m_drawingVoltaN);
    const yRef = { value: y };
    this.CalcOffsetY(dc as never, yRef);
    y = yRef.value;
    if (!syl.HasContentHorizontalBB()) return;
    if (syl.m_nextWordSyl && !syl.m_nextWordSyl.HasContentHorizontalBB()) return;
    if (spanningType === SpanningType.SPANNING_START_END) {
      x1 = syl.GetContentRight();
      if (syl.m_nextWordSyl) x2 = syl.m_nextWordSyl.GetContentLeft();
    }
    else if (spanningType === SpanningType.SPANNING_START) {
      x1 = syl.GetContentRight();
    }
    else if (spanningType === SpanningType.SPANNING_END) {
      const opts = (this as unknown as { m_options: { m_lyricNoStartHyphen: { GetValue(): boolean } } }).m_options;
      const alignTime = syl.GetEnd()!.GetAlignment()?.GetTime() ?? -1;
      if (opts.m_lyricNoStartHyphen.GetValue() && (alignTime === 0)) {
        const measure = syl.GetEnd()!.GetFirstAncestor(ClassId.MEASURE) as unknown as {
          GetFirstAncestor(id: number): unknown;
        } | null;
        if (!measure) return;
        const system = measure.GetFirstAncestor(ClassId.SYSTEM) as unknown as {
          FindDescendantByType(id: number): unknown;
        } | null;
        if (!system) return;
        if (measure === system.FindDescendantByType(ClassId.MEASURE)) return;
      }
      if (syl.m_nextWordSyl) x2 = syl.m_nextWordSyl.GetContentLeft();
      x1 -= (this.m_doc!)!.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
    }
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      DeactivateGraphic?(): void; ReactivateGraphic?(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else {
      // C++ instantiates a temporary Syl so the real Syl bounding box is untouched.
      // One shared local: BBox EndGraphic asserts stack identity.
      sylConnectorLocal.value = new Syl();
      dcExt.StartGraphic(sylConnectorLocal.value as never, '', syl.GetID(), GraphicID.SPANNING);
    }
    dcExt.DeactivateGraphic?.();
    this.DrawSylConnectorLines(dc, x1, x2, y, element, staff);
    dcExt.ReactivateGraphic?.();
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else {
      dcExt.EndGraphic(sylConnectorLocal.value as never, this);
      sylConnectorLocal.value = null;
    }
  }

  // C++ View::DrawFb(dc, staff, fb, params); stacked FIGURE/editorial lines bottom-up.
  public DrawFb(dc: ViewPageDeviceContextLike, staff: ViewPageStaffLike, element: ViewPageObjectLike, params: TextDrawingParams): void {
    if (!dc) throw new Error('View::DrawFb requires a device context.');
    if (!element) throw new Error('View::DrawFb requires an fb.');
    dc.StartGraphic(element, '', element.GetID());
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingLyricFont(s: number): { GetPointSize(): number; SetPointSize?(s: number): void };
      GetTextLineHeight(f: unknown, b: boolean): number;
    };
    const fontDim = docExt.GetDrawingLyricFont(staff.m_drawingStaffSize);
    const lineHeight = docExt.GetTextLineHeight(fontDim, false);
    const startX = params.m_x;
    fontDim.SetPointSize?.(docExt.GetDrawingLyricFont(staff.m_drawingStaffSize).GetPointSize());
    (dc as unknown as { SetFont(f: unknown): void }).SetFont(fontDim);
    const fb = element as unknown as {
      GetChildren(): Array<{ Is(id: number): boolean; IsEditorialElement?(): boolean }>;
    };
    for (const current of fb.GetChildren()) {
      (dc as unknown as { StartText(x: number, y: number, a: number): void })
        .StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_left);
      if (current.Is(ClassId.FIGURE)) {
        (this as unknown as { DrawF(dc: unknown, f: unknown, p: unknown): void }).DrawF(dc, current as never, params);
      }
      else if (current.IsEditorialElement?.()) {
        (this as unknown as { DrawFbEditorialElement(dc: unknown, el: unknown, p: unknown): void }).DrawFbEditorialElement(dc, current as never, params);
      }
      else {
        throw new Error('View::DrawFb received an unsupported fb child.');
      }
      (dc as unknown as { EndText(): void }).EndText();
      params.m_y -= lineHeight;
      params.m_x = startX;
    }
    (dc as unknown as { ResetFont(): void }).ResetFont();
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawPedalLine(dc, pedal, x1, x2, staff, spanningType, graphic).
  // Local ordinals: PEDALSTYLE_pedline=2, pedstar=3.
  public DrawPedalLine(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawPedalLine requires a device context.');
    if (!element) throw new Error('View::DrawPedalLine requires a pedal.');
    if (!staff) throw new Error('View::DrawPedalLine requires a staff.');
    const pedal = element as unknown as {
      GetID(): string; GetDrawingY(): number; GetForm(): number;
      GetStart(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
      GetEnd(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
    };
    if (!pedal.GetStart()) throw new Error('View::DrawPedalLine requires a pedal start.');
    if (!pedal.GetEnd()) throw new Error('View::DrawPedalLine requires a pedal end.');
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetDrawingDoubleUnit(s: number): number;
      GetDrawingStemWidth(s: number): number;
      GetGlyphWidth(c: number, s: number, b: boolean): number;
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
    };
    let y = pedal.GetDrawingY();
    const yRef = { value: y };
    this.CalcOffsetY(dc as never, yRef);
    y = yRef.value;
    let startRadius = 0;
    if (!pedal.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) startRadius = pedal.GetStart()!.GetDrawingRadius(doc);
    let endRadius = 0;
    if (!pedal.GetEnd()!.Is(ClassId.TIMESTAMP_ATTR)) endRadius = pedal.GetEnd()!.GetDrawingRadius(doc);
    if (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_START) {
      x1 -= startRadius;
      if ((pedal.GetForm() === 2 /* pedline */) || (pedal.GetForm() === 3 /* pedstar */)) {
        x1 += docExt.GetGlyphWidth(SMUFL_E650_keyboardPedalPed, staff.m_drawingStaffSize, false);
      }
    }
    if (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_END) {
      x2 -= endRadius - docExt.GetDrawingStemWidth(staff.m_drawingStaffSize);
    }
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
      SetFont(f: unknown): void; ResetFont(): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    const opts = (this as unknown as { m_options: { m_pedalLineThickness: { GetValue(): number } } }).m_options;
    const bracketSize = docExt.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
    const lineWidth = Math.trunc(opts.m_pedalLineThickness.GetValue() * docExt.GetDrawingUnit(staff.m_drawingStaffSize));
    if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_START)) {
      if ((pedal.GetForm() !== 2) && (pedal.GetForm() !== 3)) {
        this.DrawFilledRectangle(dc as never, x1, y, x1 + Math.trunc(bracketSize / 2), y + lineWidth);
        this.DrawFilledRectangle(dc as never, x1, y, x1 + lineWidth, y + bracketSize);
      }
    }
    if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_END)) {
      if (pedal.GetForm() !== 3 /* pedstar */) {
        this.DrawFilledRectangle(dc as never, x2 - Math.trunc(bracketSize / 2), y, x2, y + lineWidth);
        this.DrawFilledRectangle(dc as never, x2 - lineWidth, y, x2, y + bracketSize);
      }
      else {
        const str = [SMUFL_E655_keyboardPedalUp];
        dcExt.SetFont(docExt.GetDrawingSmuflFont(staff.m_drawingStaffSize, false));
        this.DrawSmuflString(dc as never, x2, y, str, HORIZONTALALIGNMENT_left, staff.m_drawingStaffSize, false);
        dcExt.ResetFont();
      }
    }
    this.DrawFilledRectangle(dc as never, x1 + Math.trunc(bracketSize / 2), y, x2 - Math.trunc(bracketSize / 2), y + lineWidth);
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawTrillExtension(dc, trill, x1, x2, staff, spanningType, graphic).
  public DrawTrillExtension(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawTrillExtension requires a device context.');
    if (!element) throw new Error('View::DrawTrillExtension requires a trill.');
    if (!staff) throw new Error('View::DrawTrillExtension requires a staff.');
    const trill = element as unknown as {
      GetID(): string; GetDrawingY(): number; GetLstartsym(): number;
      GetStart(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
      GetEnd(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
    };
    if (!trill.GetStart()) throw new Error('View::DrawTrillExtension requires a trill start.');
    if (!trill.GetEnd()) throw new Error('View::DrawTrillExtension requires a trill end.');
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetDrawingDoubleUnit(s: number): number;
      GetGlyphHeight(c: number, s: number, b: boolean): number;
      GetGlyphWidth(c: number, s: number, b: boolean): number;
    };
    let y = trill.GetDrawingY() + Math.trunc(docExt.GetGlyphHeight(SMUFL_E566_ornamentTrill, staff.m_drawingStaffSize, false) / 3);
    const yRef = { value: y };
    this.CalcOffsetY(dc as never, yRef);
    y = yRef.value;
    if (trill.GetLstartsym() === 20 /* none */) {
      x1 -= trill.GetStart()!.GetDrawingRadius(doc);
      y += Math.trunc(docExt.GetDrawingUnit(staff.m_drawingStaffSize) / 2);
    }
    else if ((spanningType === SpanningType.SPANNING_START) || (spanningType === SpanningType.SPANNING_START_END)) {
      let offsetFactor = 2;
      if (trill.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) offsetFactor = 1;
      x1 += Math.trunc(docExt.GetGlyphWidth(SMUFL_E566_ornamentTrill, staff.m_drawingStaffSize, false) / offsetFactor);
    }
    if (!trill.GetEnd()!.Is(ClassId.TIMESTAMP_ATTR)) x2 -= trill.GetEnd()!.GetDrawingRadius(doc);
    x2 -= docExt.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
    const length = x2 - x1;
    const orig = new Point(x1, y);
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    this.DrawSmuflLine(dc as never, orig, length, staff.m_drawingStaffSize, false, SMUFL_E59D_ornamentZigZagLineNoRightEnd, 0, SMUFL_E59E_ornamentZigZagLineWithRightEnd);
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawTie(dc, tie, x1, x2, staff, spanningType, graphic); thick bezier via CalculatePosition.
  public DrawTie(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawTie requires a device context.');
    if (!element) throw new Error('View::DrawTie requires a tie.');
    if (!staff) throw new Error('View::DrawTie requires a staff.');
    const tie = element as unknown as {
      GetID(): string; GetLform(): number;
      CalculatePosition(doc: unknown, s: unknown, a: number, b: number, t: number, bez: Point[]): boolean;
    };
    const bezier: Point[] = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
    if (!tie.CalculatePosition(this.m_doc, staff, x1, x2, spanningType, bezier)) return;
    for (const point of bezier) {
      const yRef = { value: point.y };
      this.CalcOffsetY(dc as never, yRef);
      point.y = yRef.value;
    }
    let penStyle = PenStyle.PEN_SOLID;
    switch (tie.GetLform()) {
      case LINEFORM_dashed: penStyle = PenStyle.PEN_SHORT_DASH; break;
      case LINEFORM_dotted: penStyle = PenStyle.PEN_DOT; break;
      default: break;
    }
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    const opts = (this as unknown as { m_options: { m_tieMidpointThickness: { GetValue(): number }; m_tieEndpointThickness: { GetValue(): number } } }).m_options;
    const docExt = (this.m_doc!) as unknown as { GetDrawingUnit(s: number): number };
    const thickness = Math.trunc(docExt.GetDrawingUnit(staff.m_drawingStaffSize) * opts.m_tieMidpointThickness.GetValue());
    const penWidth = Math.trunc(opts.m_tieEndpointThickness.GetValue() * docExt.GetDrawingUnit(staff.m_drawingStaffSize));
    const thicknessCoefficient = BoundingBox.GetBezierThicknessCoefficient(bezier, thickness, penWidth);
    this.DrawThickBezierCurve(dc as never, bezier, Math.trunc(thicknessCoefficient * thickness), staff.m_drawingStaffSize, penWidth, penStyle);
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawPitchInflection(dc, pitchInflection, x1, x2, staff, spanningType, graphic).
  public DrawPitchInflection(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawPitchInflection requires a device context.');
    if (!element) throw new Error('View::DrawPitchInflection requires a pitch inflection.');
    if (!staff) throw new Error('View::DrawPitchInflection requires a staff.');
    const pinf = element as unknown as {
      GetID(): string;
      GetStart(): { GetDrawingY?(): number; GetDrawingYRel?(): number; Is?(id: number): boolean } | null;
      GetEnd(): { GetDrawingY?(): number; GetDrawingYRel?(): number; Is?(id: number): boolean } | null;
    };
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetDrawingDoubleUnit(s: number): number;
      GetDrawingStemWidth(s: number): number;
    };
    const topY = staff.GetDrawingY() + docExt.GetDrawingDoubleUnit(staff.m_drawingStaffSize);
    const note1 = pinf.GetStart() as { GetDrawingY?(): number; GetDrawingYRel?(): number } | null;
    const baseY1 = (note1 && note1.GetDrawingY) ? note1.GetDrawingY()! : topY;
    const note2 = pinf.GetEnd() as { GetDrawingY?(): number; GetDrawingYRel?(): number } | null;
    const baseY2 = (note2 && note2.GetDrawingY) ? note2.GetDrawingY()! : topY;
    const y1Ref = { value: baseY1 };
    this.CalcOffsetY(dc as never, y1Ref);
    const y2Ref = { value: baseY2 };
    this.CalcOffsetY(dc as never, y2Ref);
    const up = note1 ? true : false;
    let y1 = up ? y1Ref.value : topY;
    let y2 = up ? topY : y2Ref.value;
    let xControl = x2;
    let yControl = y1;
    let drawArrow = true;
    if (spanningType === SpanningType.SPANNING_START) {
      drawArrow = false;
      if (!up && note2 && note2.GetDrawingYRel) y2 = staff.GetDrawingY() + note2.GetDrawingYRel()!;
      y2 -= Math.trunc((y2 - y1) / 2);
      yControl = y1 + Math.trunc((y2 - y1) / 4);
      xControl = x2 - Math.trunc((x2 - x1) / 4);
    }
    else if (spanningType === SpanningType.SPANNING_END) {
      if (up && note1 && note1.GetDrawingYRel) y1 = staff.GetDrawingY() + note1.GetDrawingYRel()!;
      y1 += Math.trunc((y2 - y1) / 2);
      yControl = y1 + Math.trunc((y2 - y1) / 4);
      xControl = x2 - Math.trunc((x2 - x1) / 4);
    }
    else if (spanningType === SpanningType.SPANNING_MIDDLE) {
      return;
    }
    const points = [
      new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1)),
      new Point(this.ToDeviceContextX(xControl), this.ToDeviceContextY(yControl)),
      new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y2)),
    ];
    const arrowWidth = Math.trunc(docExt.GetDrawingUnit(staff.m_drawingStaffSize) / 2);
    let arrowHeight = Math.trunc(arrowWidth * 3 / 2);
    arrowHeight = up ? arrowHeight : -arrowHeight;
    const arrow = [
      new Point(this.ToDeviceContextX(x2 - arrowWidth), this.ToDeviceContextY(y2)),
      new Point(this.ToDeviceContextX(x2 + arrowWidth), this.ToDeviceContextY(y2)),
      new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y2 + arrowHeight)),
    ];
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string): void;
      SetPen(w: number, s: number): void;
      DrawQuadBezierPath(p: Point[]): void;
      DrawPolygon(n: number, p: Point[]): void;
      ResetPen(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, 'spanning-pinflection', '');
    dcExt.SetPen(docExt.GetDrawingStemWidth(staff.m_drawingStaffSize), PenStyle.PEN_SOLID);
    dcExt.DrawQuadBezierPath(points);
    if (drawArrow) dcExt.DrawPolygon(3, arrow);
    dcExt.ResetPen();
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawAnnotScore(dc, annotScore, x1, x2, staff, spanningType, graphic); red debug box.
  public DrawAnnotScore(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawAnnotScore requires a device context.');
    if (!element) throw new Error('View::DrawAnnotScore requires an annotScore.');
    if (!staff) throw new Error('View::DrawAnnotScore requires a staff.');
    const annot = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetBoxHeight(d: unknown, u: number): number;
      GetLineWidth(d: unknown, u: number): number;
      GetStart(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
      GetEnd(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
    };
    if (!annot.GetStart()) throw new Error('View::DrawAnnotScore requires an annotScore start.');
    if (!annot.GetEnd()) throw new Error('View::DrawAnnotScore requires an annotScore end.');
    let y = annot.GetDrawingY();
    const yRef = { value: y };
    this.CalcOffsetY(dc as never, yRef);
    y = yRef.value;
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      SetPenFull(w: number, s: number, d: number, c: number, j: number): void;
      DrawPolyline(n: number, p: Point[], close?: boolean): void;
      DrawLine(a: number, b: number, c: number, d: number): void;
      SetBrush(o: number, col: number): void;
      ResetBrush(): void; ResetPen(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    const doc = this.m_doc!;
    const docExt = doc as unknown as { GetDrawingUnit(s: number): number };
    const unit = docExt.GetDrawingUnit(staff.m_drawingStaffSize);
    const boxHeight = annot.GetBoxHeight(doc, unit);
    const lineWidth = annot.GetLineWidth(doc, unit);
    const halfLineWidth = Math.trunc(lineWidth / 2);
    dcExt.SetPenFull(lineWidth, PenStyle.PEN_SOLID, 0, LineCapStyle.LINECAP_BUTT, LineJoinStyle.LINEJOIN_MITER);
    if (spanningType === SpanningType.SPANNING_START) {
      if (!annot.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) x1 -= annot.GetStart()!.GetDrawingRadius(doc);
      const boxOutline = [
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y)),
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y)),
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y + boxHeight)),
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y + boxHeight)),
      ];
      dcExt.DrawPolyline(4, boxOutline);
      dcExt.SetBrush(0.5, 255 << 16);
      this.DrawFilledRectangle(dc as never, x1 + halfLineWidth, y + halfLineWidth, x2, y + boxHeight - halfLineWidth);
      dcExt.ResetBrush();
    }
    else if (spanningType === SpanningType.SPANNING_MIDDLE) {
      if (!annot.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) x1 -= annot.GetStart()!.GetDrawingRadius(doc);
      dcExt.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y), this.ToDeviceContextX(x2), this.ToDeviceContextY(y));
      dcExt.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y + boxHeight), this.ToDeviceContextX(x2), this.ToDeviceContextY(y + boxHeight));
      dcExt.SetBrush(0.5, 255 << 16);
      this.DrawFilledRectangle(dc as never, x1, y + halfLineWidth, x2, y + boxHeight - halfLineWidth);
      dcExt.ResetBrush();
    }
    else if (spanningType === SpanningType.SPANNING_START_END) {
      if (!annot.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) x1 -= annot.GetStart()!.GetDrawingRadius(doc);
      if (!annot.GetEnd()!.Is(ClassId.TIMESTAMP_ATTR)) x2 += annot.GetEnd()!.GetDrawingRadius(doc);
      const boxOutline = [
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y)),
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y)),
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y + boxHeight)),
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y + boxHeight)),
      ];
      dcExt.DrawPolyline(4, boxOutline, true);
      dcExt.SetBrush(0.5, 255 << 16);
      this.DrawFilledRectangle(dc as never, x1 + halfLineWidth, y + halfLineWidth, x2 - halfLineWidth, y + boxHeight - halfLineWidth);
      dcExt.ResetBrush();
    }
    else if (spanningType === SpanningType.SPANNING_END) {
      if (!annot.GetEnd()!.Is(ClassId.TIMESTAMP_ATTR)) x2 += annot.GetEnd()!.GetDrawingRadius(doc);
      const boxOutline = [
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y)),
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y)),
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y + boxHeight)),
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y + boxHeight)),
      ];
      dcExt.DrawPolyline(4, boxOutline);
      dcExt.SetBrush(0.5, 255 << 16);
      this.DrawFilledRectangle(dc as never, x1, y + halfLineWidth, x2 - halfLineWidth, y + boxHeight - halfLineWidth);
      dcExt.ResetBrush();
    }
    dcExt.ResetPen();
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawBracketSpan(dc, bracketSpan, x1, x2, staff, spanningType, graphic).
  // Local ordinals: LINESTARTENDSYMBOL_none=20; lstartsym/lendsym compared as strings via converter parity.
  public DrawBracketSpan(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawBracketSpan requires a device context.');
    if (!element) throw new Error('View::DrawBracketSpan requires a bracketSpan.');
    if (!staff) throw new Error('View::DrawBracketSpan requires a staff.');
    const span = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetLineWidth(d: unknown, u: number): number;
      GetStart(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
      GetEnd(): { Is(id: number): boolean; GetDrawingRadius(d: unknown): number } | null;
      GetLstartsym(): unknown; GetLendsym(): unknown;
      HasLform(): boolean; GetLform(): number;
    };
    if (!span.GetStart()) throw new Error('View::DrawBracketSpan requires a bracketSpan start.');
    if (!span.GetEnd()) throw new Error('View::DrawBracketSpan requires a bracketSpan end.');
    let y = span.GetDrawingY();
    const yRef = { value: y };
    this.CalcOffsetY(dc as never, yRef);
    y = yRef.value;
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      SetPen(w: number, s: number, d: number, g: number, c: number, j?: number): void;
      DrawPolyline(n: number, p: Point[]): void;
      DrawLine(a: number, b: number, c: number, d: number): void;
      ResetPen(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    const doc = this.m_doc!;
    const unit = (doc as unknown as { GetDrawingUnit(s: number): number }).GetDrawingUnit(staff.m_drawingStaffSize);
    const lineWidth = span.GetLineWidth(doc, unit);
    x1 += Math.trunc(lineWidth / 2);
    x2 -= Math.trunc(lineWidth / 2);
    dcExt.SetPen(lineWidth, PenStyle.PEN_SOLID, 0, 0, LineCapStyle.LINECAP_BUTT, LineJoinStyle.LINEJOIN_MITER);
    if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_START)) {
      if (!span.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) x1 -= span.GetStart()!.GetDrawingRadius(doc);
      // C++ GetLstartsym() != LINESTARTENDSYMBOL_none(20); unset NONE(0) draws the hook.
      if ((span.GetLstartsym() as unknown) !== 20 && span.GetLstartsym() !== 'none') {
        const hookLeft = [
          new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y - unit * 2)),
          new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y)),
          new Point(this.ToDeviceContextX(x1 + unit), this.ToDeviceContextY(y)),
        ];
        dcExt.DrawPolyline(3, hookLeft);
      }
    }
    if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_END)) {
      if (!span.GetEnd()!.Is(ClassId.TIMESTAMP_ATTR)) x2 += span.GetEnd()!.GetDrawingRadius(doc);
      // C++ GetLendsym() != LINESTARTENDSYMBOL_none(20); unset NONE(0) draws the hook.
      if ((span.GetLendsym() as unknown) !== 20 && span.GetLendsym() !== 'none') {
        const hookRight = [
          new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y - unit * 2)),
          new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y)),
          new Point(this.ToDeviceContextX(x2 - unit), this.ToDeviceContextY(y)),
        ];
        dcExt.DrawPolyline(3, hookRight);
      }
    }
    if (span.HasLform()) {
      let penStyle = PenStyle.PEN_SOLID;
      let lineCapStyle = LineCapStyle.LINECAP_BUTT;
      if (span.GetLform() === LINEFORM_dashed) {
        penStyle = PenStyle.PEN_LONG_DASH;
        lineCapStyle = LineCapStyle.LINECAP_SQUARE;
      }
      else if (span.GetLform() === LINEFORM_dotted) {
        penStyle = PenStyle.PEN_DOT;
        lineCapStyle = LineCapStyle.LINECAP_ROUND;
        x1 += unit + lineWidth * 2;
        x2 -= unit + lineWidth * 2;
        const diff = (x2 - x1) % (lineWidth * 3 + 1);
        x1 += Math.trunc(diff / 2);
      }
      dcExt.SetPen(lineWidth, penStyle, 0, 0, lineCapStyle);
      dcExt.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y), this.ToDeviceContextX(x2), this.ToDeviceContextY(y));
      dcExt.ResetPen();
    }
    dcExt.ResetPen();
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawHairpin(dc, hairpin, x1, x2, staff, spanningType, graphic).
  // Local ordinals: hairpinLog_FORM_cres=1, dim=2; STAFFREL_within=0, between handled via cast.
  public DrawHairpin(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawHairpin requires a device context.');
    if (!element) throw new Error('View::DrawHairpin requires a hairpin.');
    if (!staff) throw new Error('View::DrawHairpin requires a staff.');
    const hairpin = element as unknown as {
      GetID(): string; HasForm(): boolean; GetForm(): number;
      HasNiente(): boolean; GetNiente(): number; GetLform(): number;
      GetLeftLink(): unknown; GetRightLink(): unknown;
      GetCorrespFloatingPositioner(o: unknown): { GetContentRight(): number; GetContentLeft(): number } | null;
      GetBarlineOverlapAdjustment(a: number, b: number, c: number, t: number): [number, number];
      SetDrawingLength(l: number): void;
      CalcHeight(d: unknown, s: number, t: number, l: unknown, r: unknown): number;
      GetDrawingY(): number; GetPlace(): number;
    };
    if (!hairpin.HasForm()) return;
    const leftLink = hairpin.GetCorrespFloatingPositioner(hairpin.GetLeftLink());
    const rightLink = hairpin.GetCorrespFloatingPositioner(hairpin.GetRightLink());
    const doc = this.m_doc!;
    const docExt = doc as unknown as { GetDrawingUnit(s: number): number; GetDrawingStemWidth(s: number): number };
    const unit = docExt.GetDrawingUnit(staff.m_drawingStaffSize);
    const form = hairpin.GetForm();
    const niente = hairpin.HasNiente() ? (hairpin.GetNiente() === 1 /* BOOLEAN_true */) : false;
    let adjustedX1 = x1;
    if (leftLink) {
      adjustedX1 = leftLink.GetContentRight() + Math.trunc(unit / 2);
      adjustedX1 += (niente && (form === 1 /* cres */)) ? Math.trunc(unit / 3) : 0;
    }
    let adjustedX2 = x2;
    if (rightLink) {
      adjustedX2 = rightLink.GetContentLeft() - Math.trunc(unit / 2);
      adjustedX2 -= (niente && (form === 2 /* dim */)) ? Math.trunc(unit / 3) : 0;
    }
    if (spanningType === SpanningType.SPANNING_END) {
      if ((adjustedX2 - adjustedX1) < (unit * 2)) adjustedX1 = adjustedX2 - 2 * unit;
    }
    if ((adjustedX2 - adjustedX1) >= unit * 2) {
      x1 = adjustedX1;
      x2 = adjustedX2;
    }
    const overlap = hairpin.GetBarlineOverlapAdjustment(unit * 2, x1, x2, spanningType);
    x1 += overlap[0];
    x2 -= overlap[1];
    hairpin.SetDrawingLength(x2 - x1);
    let startY = 0;
    let endY = hairpin.CalcHeight(doc, staff.m_drawingStaffSize, spanningType, leftLink, rightLink);
    let correspSpanningType = spanningType;
    if (form === 2 /* dim */) {
      if (spanningType === SpanningType.SPANNING_START) correspSpanningType = SpanningType.SPANNING_END;
      if (spanningType === SpanningType.SPANNING_END) correspSpanningType = SpanningType.SPANNING_START;
    }
    if (correspSpanningType === SpanningType.SPANNING_START) endY = Math.trunc(endY * 2 / 3);
    else if (correspSpanningType === SpanningType.SPANNING_END) startY = Math.trunc(endY / 3);
    else if (correspSpanningType === SpanningType.SPANNING_MIDDLE) {
      startY = Math.trunc(endY / 3);
      endY = Math.trunc(endY * 2 / 3);
    }
    if (form === 2 /* dim */) { const tmp = startY; startY = endY; endY = tmp; }
    let y1 = hairpin.GetDrawingY();
    if (hairpin.GetPlace() !== STAFFREL_within) {
      let shiftY = -Math.trunc(docExt.GetDrawingStemWidth(staff.m_drawingStaffSize) / 2);
      if (hairpin.GetPlace() !== STAFFREL_between) shiftY += unit;
      y1 += shiftY;
    }
    const y1Ref = { value: y1 };
    this.CalcOffsetY(dc as never, y1Ref);
    y1 = y1Ref.value;
    let y2 = y1;
    const y2Ref = { value: y2 };
    (this as unknown as { CalcOffsetSpanningStartY(d: unknown, y: { value: number }, t: number): void }).CalcOffsetSpanningStartY(dc, y1Ref, spanningType);
    y1 = y1Ref.value;
    (this as unknown as { CalcOffsetSpanningEndY(d: unknown, y: { value: number }, t: number): void }).CalcOffsetSpanningEndY(dc, y2Ref, spanningType);
    y2 = y2Ref.value;
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      SetPen(w: number, s: number, d: number, g: number, c: number, j?: number): void;
      DrawPolyline(n: number, p: Point[]): void;
      SetBrush(o: number): void; DrawCircle(x: number, y: number, r: number): void; ResetBrush(): void;
      ResetPen(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    const opts = (this as unknown as { m_options: { m_hairpinThickness: { GetValue(): number } } }).m_options;
    const hairpinThickness = opts.m_hairpinThickness.GetValue() * unit;
    let style = PenStyle.PEN_SOLID;
    switch (hairpin.GetLform()) {
      case LINEFORM_dashed: style = PenStyle.PEN_LONG_DASH; break;
      case LINEFORM_dotted: style = PenStyle.PEN_DOT; break;
      default: style = PenStyle.PEN_SOLID; break;
    }
    const cap = (style === PenStyle.PEN_DOT) ? LineCapStyle.LINECAP_ROUND : LineCapStyle.LINECAP_SQUARE;
    dcExt.SetPen(hairpinThickness, style, 0, 0, cap, LineJoinStyle.LINEJOIN_MITER);
    if ((startY === 0) && !niente) {
      const xd = this.ToDeviceContextX(x2);
      const p = [
        new Point(xd, this.ToDeviceContextY(y2 - Math.trunc(endY / 2))),
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1)),
        new Point(xd, this.ToDeviceContextY(y2 + Math.trunc(endY / 2))),
      ];
      dcExt.DrawPolyline(3, p);
    }
    else if ((endY === 0) && !niente) {
      const xd = this.ToDeviceContextX(x1);
      const p = [
        new Point(xd, this.ToDeviceContextY(y1 - Math.trunc(startY / 2))),
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y2)),
        new Point(xd, this.ToDeviceContextY(y1 + Math.trunc(startY / 2))),
      ];
      dcExt.DrawPolyline(3, p);
    }
    else {
      if (niente) {
        dcExt.SetBrush(0.0);
        if (startY === 0) {
          dcExt.DrawCircle(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), Math.trunc(unit / 2));
          startY = Math.trunc(Math.trunc(unit * endY / (x2 - x1)) / 2);
          x1 += Math.trunc(unit / 2);
        }
        else if (endY === 0) {
          dcExt.DrawCircle(this.ToDeviceContextX(x2), this.ToDeviceContextY(y2), Math.trunc(unit / 2));
          endY = Math.trunc(Math.trunc(unit * startY / (x2 - x1)) / 2);
          x2 -= Math.trunc(unit / 2);
        }
        dcExt.ResetBrush();
      }
      let p = [
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1 - Math.trunc(startY / 2))),
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y2 - Math.trunc(endY / 2))),
      ];
      dcExt.DrawPolyline(2, p);
      p = [
        new Point(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1 + Math.trunc(startY / 2))),
        new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y2 + Math.trunc(endY / 2))),
      ];
      dcExt.DrawPolyline(2, p);
    }
    dcExt.ResetPen();
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawOctave(dc, octave, x1, x2, staff, spanningType, graphic).
  // Local ordinals: STAFFREL_basic_above=1; BOOLEAN_false=2; LINEFORM_solid=3, dotted=2; LINESTARTENDSYMBOL_none=20.
  public DrawOctave(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawOctave requires a device context.');
    if (!element) throw new Error('View::DrawOctave requires an octave.');
    if (!staff) throw new Error('View::DrawOctave requires a staff.');
    const octave = element as unknown as {
      GetID(): string; HasDis(): boolean; HasDisPlace(): boolean; GetDisPlace(): number;
      GetDrawingY(): number; GetOctaveGlyph(a: boolean): number;
      HasEndid(): boolean;
      GetEnd(): { HasContentBB(): boolean; GetContentX2(): number } | null;
      GetExtender(): unknown; GetLineWidth(d: unknown, u: number): number;
      HasLform(): boolean; GetLform(): number; GetLendsym(): unknown;
      SetDrawingExtenderX(a: number, b: number): void;
    };
    if (!octave.HasDis() || !octave.HasDisPlace()) return;
    const disPlace = octave.GetDisPlace();
    let y1 = octave.GetDrawingY();
    const y1Ref = { value: y1 };
    this.CalcOffsetY(dc as never, y1Ref);
    y1 = y1Ref.value;
    let y2 = y1;
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetGlyphWidth(c: number, s: number, b: boolean): number;
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
      GetOptions(): {
        m_octaveNoSpanningParentheses: { GetValue(): boolean };
        m_octaveAlternativeSymbols: { GetValue(): boolean };
      };
    };
    const unit = docExt.GetDrawingUnit(staff.m_drawingStaffSize);
    if ((spanningType === SpanningType.SPANNING_END) || (spanningType === SpanningType.SPANNING_MIDDLE)) {
      x1 += Math.trunc(docExt.GetGlyphWidth(SMUFL_E0A2_noteheadWhole, staff.m_drawingStaffSize, false) / 2);
      if (!docExt.GetOptions().m_octaveNoSpanningParentheses.GetValue()) {
        x1 += docExt.GetGlyphWidth(SMUFL_E51A_octaveParensLeft, staff.m_drawingStaffSize, false);
      }
    }
    if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_END)) {
      if (octave.HasEndid()) {
        const end = octave.GetEnd();
        if (end && end.HasContentBB()) x2 += end.GetContentX2();
      }
    }
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      SetFont(f: unknown): void; ResetFont(): void;
      GetSmuflTextExtent(s: number[], e: { m_width: number; m_height: number }): void;
      SetPen(w: number, s: number, d: number, g: number, c: number): void;
      DrawLine(a: number, b: number, c: number, d: number): void;
      DrawPolyline(n: number, p: Point[]): void;
      ResetPen(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    const altSymbols = docExt.GetOptions().m_octaveAlternativeSymbols.GetValue();
    const code = octave.GetOctaveGlyph(altSymbols);
    const str = [code];
    dcExt.SetFont(docExt.GetDrawingSmuflFont(staff.m_drawingStaffSize, false));
    const extend = { m_width: 0, m_height: 0 };
    dcExt.GetSmuflTextExtent(str, extend);
    const yCode = (disPlace === 1 /* above */) ? y1 - extend.m_height : y1;
    const octaveX = altSymbols ? x1 - Math.trunc(extend.m_width / 2) : x1 - extend.m_width;
    this.DrawSmuflCode(dc as never, octaveX, yCode, code, staff.m_drawingStaffSize, false);
    if (((spanningType === SpanningType.SPANNING_END) || (spanningType === SpanningType.SPANNING_MIDDLE))
      && !docExt.GetOptions().m_octaveNoSpanningParentheses.GetValue()) {
      const leftWidth = docExt.GetGlyphWidth(SMUFL_E51A_octaveParensLeft, staff.m_drawingStaffSize, false);
      const rightWidth = docExt.GetGlyphWidth(SMUFL_E51B_octaveParensRight, staff.m_drawingStaffSize, false);
      const octaveWidth = docExt.GetGlyphWidth(code, staff.m_drawingStaffSize, false);
      this.DrawSmuflCode(dc as never, octaveX - leftWidth, yCode, SMUFL_E51A_octaveParensLeft, staff.m_drawingStaffSize, false);
      this.DrawSmuflCode(dc as never, octaveX + octaveWidth, yCode, SMUFL_E51B_octaveParensRight, staff.m_drawingStaffSize, false);
      x1 += rightWidth;
    }
    dcExt.ResetFont();
    if ((octave.GetExtender() as unknown) !== 2 /* BOOLEAN_false */ && octave.GetExtender() !== false) {
      const lineWidth = octave.GetLineWidth(doc, unit);
      const gap = lineWidth * 4;
      x1 += lineWidth;
      if (altSymbols) x1 += Math.trunc(extend.m_width / 2);
      let penStyle = PenStyle.PEN_SHORT_DASH;
      let lineCapStyle = LineCapStyle.LINECAP_SQUARE;
      let actualGap = gap;
      let actualLineWidth = lineWidth;
      if (octave.HasLform()) {
        if (octave.GetLform() === 3 /* solid */) {
          penStyle = PenStyle.PEN_SOLID;
          actualGap = 0;
        }
        else if (octave.GetLform() === LINEFORM_dotted) {
          if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_END)) {
            const diff = (x2 - x1) % (gap + 1);
            x2 += (gap - diff < diff) ? gap - diff : -diff;
          }
          penStyle = PenStyle.PEN_SOLID;
          lineCapStyle = LineCapStyle.LINECAP_ROUND;
          actualLineWidth = Math.trunc(lineWidth * 3 / 2);
        }
      }
      dcExt.SetPen(actualLineWidth, penStyle, 0, actualGap, lineCapStyle);
      y1 += (disPlace === 1 /* above */) ? -Math.trunc(lineWidth / 2) : Math.trunc(lineWidth / 2);
      y2 = (disPlace === 1 /* above */) ? y1 - unit * 2 : y1 + unit * 2;
      if (x1 + unit > x2) {
        x2 = x1 + unit - Math.trunc(lineWidth / 2);
      }
      else {
        dcExt.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y1));
      }
      octave.SetDrawingExtenderX(x1, x2);
      const lendsym = octave.GetLendsym();
      // C++ GetLendsym() != LINESTARTENDSYMBOL_none(20); unset NONE(0) draws the hook.
      if ((lendsym as unknown) !== 20 && lendsym !== 'none') {
        if (spanningType === SpanningType.SPANNING_END || spanningType === SpanningType.SPANNING_START_END) {
          if (octave.GetLform() === LINEFORM_dotted) {
            dcExt.SetPen(Math.trunc(lineWidth * 3 / 2), PenStyle.PEN_DOT, 0, Math.min(gap, unit * 2 - lineWidth), LineCapStyle.LINECAP_ROUND);
            dcExt.DrawLine(this.ToDeviceContextX(x2), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y2));
            dcExt.ResetPen();
          }
          else {
            // C++ dc->SetPen(lineWidth, PEN_SOLID): linecap default (no stroke-linecap attr).
            dcExt.SetPen(lineWidth, PenStyle.PEN_SOLID, 0, 0, 0);
            const hookRight = [
              new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y2)),
              new Point(this.ToDeviceContextX(x2), this.ToDeviceContextY(y1)),
              new Point(this.ToDeviceContextX(x2 - unit), this.ToDeviceContextY(y1)),
            ];
            dcExt.DrawPolyline(3, hookRight);
            dcExt.ResetPen();
          }
        }
      }
      dcExt.ResetPen();
    }
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawGliss(dc, gliss, x1, x2, staff, spanningType, graphic).
  // Local ordinals: ACCIDENTAL_WRITTEN_NONE=0; LINEFORM_solid=3, wavy=4; LINEWIDTHTERM narrow/med/wide factors via cast.
  public DrawGliss(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, x1: number, x2: number, staff: ViewPageStaffLike, spanningType: number, graphic: unknown): void {
    if (!dc) throw new Error('View::DrawGliss requires a device context.');
    if (!element) throw new Error('View::DrawGliss requires a gliss.');
    if (!staff) throw new Error('View::DrawGliss requires a staff.');
    const gliss = element as unknown as {
      GetID(): string; GetStart(): unknown; GetEnd(): unknown;
      HasLwidth(): boolean;
      GetLwidth(): { GetType(): number; GetLineWithTerm(): number; GetMeasurementunsigned(): { GetType(): number; GetPx(): number; GetVu(): number } };
      GetLform(): number;
    };
    let y1 = staff.GetDrawingY();
    let y2 = staff.GetDrawingY();
    const y1Ref = { value: y1 };
    this.CalcOffsetY(dc as never, y1Ref);
    y1 = y1Ref.value;
    const y2Ref = { value: y2 };
    this.CalcOffsetY(dc as never, y2Ref);
    y2 = y2Ref.value;
    const note1 = gliss.GetStart() as {
      GetDrawingLoc(): number; GetDrawingRadius(d: unknown): number; GetDots(): number; GetDrawingY(): number;
    } | null;
    const note2 = gliss.GetEnd() as {
      GetDrawingLoc(): number; GetDrawingRadius(d: unknown): number; GetDrawingY(): number;
      GetDrawingAccid(): { GetAccid(): number; GetContentLeft(): number; GetContentTop(): number; GetContentBottom(): number } | null;
    } | null;
    if (!note1 || !note2) return;
    const looksNote = (n: unknown): boolean => {
      const o = n as { GetDrawingLoc?: unknown; GetDrawingRadius?: unknown };
      return typeof o.GetDrawingLoc === 'function' && typeof o.GetDrawingRadius === 'function';
    };
    if (!looksNote(note1) || !looksNote(note2)) return;
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingUnit(s: number): number;
      GetDrawingStemWidth(s: number): number;
      GetGlyphHeight(c: number, s: number, b: boolean): number;
    };
    const unit = docExt.GetDrawingUnit(staff.m_drawingStaffSize);
    const firstLoc = note1.GetDrawingLoc();
    const secondLoc = note2.GetDrawingLoc();
    const diff = (secondLoc - firstLoc) * unit;
    let angle = Math.atan2(diff, x2 - x1);
    if (spanningType !== SpanningType.SPANNING_START_END) angle = angle / 2;
    if (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_START) {
      let slope = 0.0;
      if (x1 !== x2) slope = diff / (x2 - x1);
      let offset = note1.GetDrawingRadius(doc) + unit;
      if ((note1.GetDots() > 0) && (Math.abs(slope) < 1.0)) offset = Math.trunc(offset + 1.5 * unit * note1.GetDots());
      x1 = Math.trunc(x1 + Math.cos(angle) * offset);
      y1 = Math.trunc(note1.GetDrawingY() + offset * Math.sin(angle));
    }
    else {
      y1 = Math.trunc(note2.GetDrawingY() - (x2 - x1) * Math.sin(angle));
    }
    if (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_END) {
      const accid = note2.GetDrawingAccid();
      if (accid && (accid.GetAccid() !== 0 /* NONE */)) {
        // C++ const int dist truncates the full expression before use.
        const dist = Math.trunc(x2 - accid.GetContentLeft() + 0.5 * unit);
        x2 = Math.trunc(x2 - dist);
        y2 = Math.trunc(note2.GetDrawingY() - dist * Math.tan(angle));
        while (((firstLoc > secondLoc) && (y2 + 0.5 * unit * Math.sin(angle) > accid.GetContentTop()))
          || ((secondLoc > firstLoc) && (y2 + 0.5 * unit * Math.sin(angle) < accid.GetContentBottom()))) {
          y2 = Math.trunc(y2 + unit * Math.sin(angle));
          x2 = Math.trunc(x2 + unit * Math.cos(angle));
        }
      }
      else {
        const offset = note2.GetDrawingRadius(doc) + unit;
        x2 = Math.trunc(x2 - Math.cos(angle) * offset);
        y2 = Math.trunc(note2.GetDrawingY() - offset * Math.sin(angle));
      }
    }
    else {
      x2 -= unit;
      y2 = Math.trunc(y1 + (x2 - x1) * Math.sin(angle));
    }
    x1 = Math.trunc(x1);
    x2 = Math.trunc(x2);
    y1 = Math.trunc(y1);
    y2 = Math.trunc(y2);
    let lineWidth = docExt.GetDrawingStemWidth(staff.m_drawingStaffSize) * 1.5;
    if (gliss.HasLwidth()) {
      const lw = gliss.GetLwidth();
      if (lw.GetType() === 1 /* lineWidthTerm */) {
        // Narrow/medium/wide factors from canonical atts: 1.0/2.0/4.0 via term ordinal.
        const term = lw.GetLineWithTerm();
        if (term === 1 /* narrow */) lineWidth *= 1.0;
        else if (term === 2 /* medium */) lineWidth *= 2.0;
        else if (term === 3 /* wide */) lineWidth *= 4.0;
      }
      else if (lw.GetType() === 2 /* measurementunsigned */) {
        if (lw.GetMeasurementunsigned().GetType() === 2 /* px */) lineWidth = lw.GetMeasurementunsigned().GetPx();
        else lineWidth = lw.GetMeasurementunsigned().GetVu() * docExt.GetDrawingUnit(staff.m_drawingStaffSize);
      }
    }
    const dcExt = dc as unknown as {
      ResumeGraphic?(g: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      RotateGraphic?(p: { x: number; y: number }, a: number): void;
      SetPen(w: number, s: number, d: number, g: number, c: number): void;
      DrawLine(a: number, b: number, c: number, d: number): void;
      ResetPen(): void;
      EndResumedGraphic?(g: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if (graphic) dcExt.ResumeGraphic?.(graphic, (graphic as unknown as { GetID(): string }).GetID());
    else dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    switch (gliss.GetLform()) {
      case LINEFORM_wavy: {
        const length = Math.trunc(Math.hypot(x2 - x1, y2 - y1));
        const wavyAngle = (Math.atan2(y1 - y2, x2 - x1) * 180) / Math.PI;
        dcExt.RotateGraphic?.({ x: this.ToDeviceContextX(x1), y: this.ToDeviceContextY(y1) }, wavyAngle);
        const glissGlyph = SMUFL_EAAF_wiggleGlissando;
        const height = docExt.GetGlyphHeight(glissGlyph, staff.m_drawingStaffSize, false);
        const orig = new Point(x1, y1 - Math.trunc(height / 2));
        this.DrawSmuflLine(dc as never, orig, length, staff.m_drawingStaffSize, false, glissGlyph, glissGlyph, glissGlyph);
        break;
      }
      case LINEFORM_dashed:
        dcExt.SetPen(lineWidth, PenStyle.PEN_SHORT_DASH, 0, 0, LineCapStyle.LINECAP_ROUND);
        dcExt.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y2));
        dcExt.ResetPen();
        break;
      case LINEFORM_dotted:
        dcExt.SetPen(Math.trunc(lineWidth * 3 / 2), PenStyle.PEN_DOT, 0, 0, LineCapStyle.LINECAP_ROUND);
        dcExt.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y2));
        dcExt.ResetPen();
        break;
      case 3 /* solid */:
      default: {
        dcExt.SetPen(lineWidth, PenStyle.PEN_SOLID, 0, 0, LineCapStyle.LINECAP_ROUND);
        dcExt.DrawLine(this.ToDeviceContextX(x1), this.ToDeviceContextY(y1), this.ToDeviceContextX(x2), this.ToDeviceContextY(y2));
        dcExt.ResetPen();
        break;
      }
    }
    if (graphic) dcExt.EndResumedGraphic?.(graphic, this);
    else dcExt.EndGraphic(element, this);
  }

  // C++ View::DrawPedal(dc, pedal, measure, system).
  // Local ordinals: PEDALSTYLE_line=1, pedline=2, altpedstar=4; pedalLog_DIR_up=2, bounce=4.
  public DrawPedal(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawPedal requires a device context.');
    if (!element) throw new Error('View::DrawPedal requires a pedal.');
    if (!measure) throw new Error('View::DrawPedal requires a measure.');
    if (!system) throw new Error('View::DrawPedal requires a system.');
    const pedal = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetStart(): {
        Is(id: number): boolean; GetDrawingX(): number; GetDrawingRadius(d: unknown): number;
        GetAlignment(): { GetTime(): number } | null;
      } | null;
      HasDir(): boolean; GetDir(): number;
      GetPedalForm(d: unknown, s: unknown): number;
      GetPedalGlyph(): number;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
    };
    if (!pedal.GetStart()) return;
    if (!pedal.HasDir()) return;
    dc.StartGraphic(element, '', element.GetID());
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetGlyphWidth(c: number, s: number, b: boolean): number;
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
    };
    const form = pedal.GetPedalForm(doc, system);
    let drawSymbol = (form !== 1 /* line */);
    if (pedal.GetDir() === 2 /* up */ && form === 2 /* pedline */) drawSymbol = false;
    if (drawSymbol) {
      let bounceStar = true;
      if (form === 4 /* altpedstar */) bounceStar = false;
      let drawingX = pedal.GetStart()!.GetDrawingX() + pedal.GetStart()!.GetDrawingRadius(doc);
      let alignment = HORIZONTALALIGNMENT_center;
      if (pedal.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) {
        const aligner = (measure as unknown as {
          m_measureAligner: { GetRightBarLineAlignment(): { GetTime(): number } };
        }).m_measureAligner;
        const startAlign = pedal.GetStart()!.GetAlignment();
        if (startAlign && aligner && startAlign.GetTime() === aligner.GetRightBarLineAlignment().GetTime()) {
          alignment = HORIZONTALALIGNMENT_right;
        }
        else {
          alignment = HORIZONTALALIGNMENT_left;
        }
      }
      const staffList = pedal.GetTstampStaves(measure, element);
      let code = SMUFL_E655_keyboardPedalUp;
      const str: number[] = [];
      if (bounceStar && (pedal.GetDir() === 4 /* bounce */)) {
        str.push(code);
        const staffSize = (staffList.length > 0) ? staffList[0].m_drawingStaffSize : 100;
        drawingX -= docExt.GetGlyphWidth(SMUFL_E655_keyboardPedalUp, staffSize, false);
      }
      if (pedal.GetDir() !== 2 /* up */) code = pedal.GetPedalGlyph();
      str.push(code);
      for (const staff of staffList) {
        const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
        const staffN = (staff as unknown as { GetN(): number }).GetN();
        const ok = setPos ? setPos.call(system, staffN, element as unknown, pedal.GetStart() as unknown, staff as unknown) : false;
        if (!ok) continue;
        const staffSize = staff.m_drawingStaffSize;
        const p = { x: drawingX, y: element.GetDrawingY() };
        this.SetOffsetStaffSize(element as never, staffSize);
        this.CalcOffset(dc as never, p);
        (dc as unknown as { SetFont(f: unknown): void }).SetFont(docExt.GetDrawingSmuflFont(staffSize, false));
        this.DrawSmuflString(dc as never, p.x, p.y, str, alignment, staffSize);
        (dc as unknown as { ResetFont(): void }).ResetFont();
      }
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawTrill(dc, trill, measure, system).
  // Local ordinals: LINESTARTENDSYMBOL_none=20.
  public DrawTrill(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawTrill requires a device context.');
    if (!element) throw new Error('View::DrawTrill requires a trill.');
    if (!measure) throw new Error('View::DrawTrill requires a measure.');
    if (!system) throw new Error('View::DrawTrill requires a system.');
    const trill = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetStart(): (ViewControlStartLike & { Is(id: number): boolean }) | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      HasAltsym(): boolean; HasAltSymbolDef(): boolean; GetAltSymbolDef(): ViewSymbolDefLike;
      GetTrillGlyph(): number; GetEnclosingGlyphs(): [number, number];
      GetLstartsym(): number;
      HasAccidlower(): boolean; GetAccidlower(): number;
      HasAccidupper(): boolean; GetAccidupper(): number;
    };
    if (!trill.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const symbolDef = (trill.HasAltsym() && trill.HasAltSymbolDef()) ? trill.GetAltSymbolDef() : null;
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
      GetGlyphWidth(c: number, s: number, g: boolean): number;
      GetGlyphHeight(c: number, s: number, g: boolean): number;
      GetGlyphTop(c: number, s: number, g: boolean): number;
      GetGlyphBottom(c: number, s: number, g: boolean): number;
      GetGlyphAdvX(c: number, s: number, g: boolean): number;
      GetDrawingUnit(s: number): number;
    };
    // C++ calls the static Accid::GetAccidGlyph directly (view_control.cpp:2879).
    const accidExt = (a: number): number => Accid.GetAccidGlyph(a as never);
    let drawingX = trill.GetStart()!.GetDrawingX();
    let alignment = HORIZONTALALIGNMENT_center;
    if (trill.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) {
      alignment = HORIZONTALALIGNMENT_left;
    }
    else {
      drawingX += trill.GetStart()!.GetDrawingRadius(doc);
    }
    const code = trill.GetTrillGlyph();
    const enc = trill.GetEnclosingGlyphs();
    const enclosingFront = enc[0]; const enclosingBack = enc[1];
    const str: number[] = [];
    if ((trill.GetLstartsym() as unknown) !== 20 /* none */) str.push(code);
    const staffList = trill.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, trill.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      const p = { x: drawingX, y: element.GetDrawingY() };
      this.SetOffsetStaffSize(element as never, ss);
      this.CalcOffset(dc as never, p);
      const x = p.x; const y = p.y;
      const trillHeight = symbolDef ? symbolDef.GetSymbolHeight(doc, ss, false) : docExt.GetGlyphHeight(code, ss, false);
      const trillWidth = symbolDef ? symbolDef.GetSymbolWidth(doc, ss, false) : docExt.GetGlyphWidth(code, ss, false);
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(docExt.GetDrawingSmuflFont(ss, false));
      if (enclosingFront) {
        const xCorrEncl = Math.trunc(trillWidth / 2) + docExt.GetGlyphWidth(enclosingFront, ss, false);
        this.DrawSmuflCode(dc as never, x - xCorrEncl, y + Math.trunc(trillHeight / 2), enclosingFront, ss, false);
      }
      if (trill.HasAccidlower()) {
        const accidXShift = (alignment === HORIZONTALALIGNMENT_center) ? 0 : Math.trunc(trillWidth / 2);
        const accid = accidExt ? accidExt(trill.GetAccidlower()) : 0;
        const accidY = y - docExt.GetGlyphTop(accid, Math.trunc(ss / 2), true)
          - docExt.GetDrawingUnit(Math.trunc(ss * 2 / 3));
        this.DrawSmuflString(dc as never, x + accidXShift, accidY, [accid], HORIZONTALALIGNMENT_center, Math.trunc(ss / 2), false);
      }
      else if (trill.HasAccidupper()) {
        const accidXShift = (alignment === HORIZONTALALIGNMENT_center) ? 0 : Math.trunc(trillWidth / 2);
        const accid = accidExt ? accidExt(trill.GetAccidupper()) : 0;
        const accidY = y + trillHeight - docExt.GetGlyphBottom(accid, Math.trunc(ss / 2), true)
          + docExt.GetDrawingUnit(Math.trunc(ss * 2 / 3));
        this.DrawSmuflString(dc as never, x + accidXShift, accidY, [accid], HORIZONTALALIGNMENT_center, Math.trunc(ss / 2), false);
      }
      if (symbolDef) {
        this.DrawSymbolDef(dc as never, element as never, symbolDef, x, y, ss, false, alignment);
      }
      else {
        this.DrawSmuflString(dc as never, x, y, str, alignment, ss);
      }
      if (enclosingBack) {
        const xCorrEncl = Math.trunc(trillWidth / 2) + docExt.GetGlyphWidth(enclosingBack, ss, false)
          - docExt.GetGlyphAdvX(enclosingBack, ss, false);
        this.DrawSmuflCode(dc as never, x + xCorrEncl, y + Math.trunc(trillHeight / 2), enclosingBack, ss, false);
      }
      (dc as unknown as { ResetFont(): void }).ResetFont();
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawTurn(dc, turn, measure, system).
  public DrawTurn(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawTurn requires a device context.');
    if (!element) throw new Error('View::DrawTurn requires a turn.');
    if (!measure) throw new Error('View::DrawTurn requires a measure.');
    if (!system) throw new Error('View::DrawTurn requires a system.');
    const turn = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      m_drawingEndElement: { GetDrawingX(): number; GetFirstAncestor(id: number): unknown } | null | undefined;
      GetStart(): (ViewControlStartLike & { Is(id: number): boolean; GetFirstAncestor(id: number): unknown }) | null;
      GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[];
      HasAltsym(): boolean; HasAltSymbolDef(): boolean; GetAltSymbolDef(): ViewSymbolDefLike;
      GetTurnGlyph(): number; GetEnclosingGlyphs(): [number, number];
      HasAccidlower(): boolean; GetAccidlower(): number;
      HasAccidupper(): boolean; GetAccidupper(): number;
    };
    if (!turn.GetStart()) return;
    dc.StartGraphic(element, '', element.GetID());
    const symbolDef = (turn.HasAltsym() && turn.HasAltSymbolDef()) ? turn.GetAltSymbolDef() : null;
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingSmuflFont(s: number, b: boolean): unknown;
      GetGlyphWidth(c: number, s: number, g: boolean): number;
      GetGlyphHeight(c: number, s: number, g: boolean): number;
      GetGlyphTop(c: number, s: number, g: boolean): number;
      GetGlyphBottom(c: number, s: number, g: boolean): number;
      GetGlyphAdvX(c: number, s: number, g: boolean): number;
      GetDrawingUnit(s: number): number;
    };
    // C++ calls the static Accid::GetAccidGlyph directly (view_control.cpp).
    const accidExt = (a: number): number => Accid.GetAccidGlyph(a as never);
    let drawingX = turn.GetStart()!.GetDrawingX() + turn.GetStart()!.GetDrawingRadius(doc);
    if (turn.m_drawingEndElement) {
      let end = turn.m_drawingEndElement;
      const parentSystem1 = turn.GetStart()!.GetFirstAncestor(ClassId.SYSTEM);
      const parentSystem2 = (end as { GetFirstAncestor(id: number): unknown }).GetFirstAncestor(ClassId.SYSTEM);
      if (parentSystem1 !== parentSystem2) {
        end = (measure as unknown as { GetRightBarLine(): { GetDrawingX(): number; GetFirstAncestor(id: number): unknown } }).GetRightBarLine();
      }
      drawingX += Math.trunc((end.GetDrawingX() - drawingX) / 2);
    }
    const code = turn.GetTurnGlyph();
    const enc = turn.GetEnclosingGlyphs();
    const enclosingFront = enc[0]; const enclosingBack = enc[1];
    let alignment = HORIZONTALALIGNMENT_center;
    if (turn.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) {
      alignment = HORIZONTALALIGNMENT_left;
    }
    const str: number[] = [code];
    const staffList = turn.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, turn.GetStart() as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      const p = { x: drawingX, y: element.GetDrawingY() };
      this.SetOffsetStaffSize(element as never, ss);
      this.CalcOffset(dc as never, p);
      const x = p.x; const y = p.y;
      const turnHeight = symbolDef ? symbolDef.GetSymbolHeight(doc, ss, false) : docExt.GetGlyphHeight(code, ss, false);
      const turnWidth = symbolDef ? symbolDef.GetSymbolWidth(doc, ss, false) : docExt.GetGlyphWidth(code, ss, false);
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(docExt.GetDrawingSmuflFont(ss, false));
      if (turn.HasAccidlower()) {
        const accidXShift = (alignment === HORIZONTALALIGNMENT_center) ? 0 : Math.trunc(turnWidth / 2);
        const accid = accidExt ? accidExt(turn.GetAccidlower()) : 0;
        const accidY = y - docExt.GetGlyphTop(accid, Math.trunc(ss / 2), true)
          - docExt.GetDrawingUnit(Math.trunc(ss * 2 / 3));
        this.DrawSmuflString(dc as never, x + accidXShift, accidY, [accid], HORIZONTALALIGNMENT_center, Math.trunc(ss / 2), false);
      }
      if (turn.HasAccidupper()) {
        const accidXShift = (alignment === HORIZONTALALIGNMENT_center) ? 0 : Math.trunc(turnWidth / 2);
        const accid = accidExt ? accidExt(turn.GetAccidupper()) : 0;
        const accidY = y + turnHeight - docExt.GetGlyphBottom(accid, Math.trunc(ss / 2), true)
          + docExt.GetDrawingUnit(Math.trunc(ss * 2 / 3));
        this.DrawSmuflString(dc as never, x + accidXShift, accidY, [accid], HORIZONTALALIGNMENT_center, Math.trunc(ss / 2), false);
      }
      if (enclosingFront) {
        let xCorrEncl = docExt.GetGlyphWidth(enclosingFront, ss, false);
        if (!turn.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) xCorrEncl += Math.trunc(turnWidth / 2);
        this.DrawSmuflCode(dc as never, x - xCorrEncl, y + Math.trunc(turnHeight / 2), enclosingFront, ss, false);
      }
      if (symbolDef) {
        this.DrawSymbolDef(dc as never, element as never, symbolDef, x, y, ss, false, alignment);
      }
      else {
        this.DrawSmuflString(dc as never, x, y, str, alignment, ss);
      }
      if (enclosingBack) {
        let xCorrEncl = turnWidth + docExt.GetGlyphWidth(enclosingBack, ss, false)
          - docExt.GetGlyphAdvX(enclosingBack, ss, false);
        if (!turn.GetStart()!.Is(ClassId.TIMESTAMP_ATTR)) xCorrEncl -= Math.trunc(turnWidth / 2);
        this.DrawSmuflCode(dc as never, x + xCorrEncl, y + Math.trunc(turnHeight / 2), enclosingBack, ss, false);
      }
      (dc as unknown as { ResetFont(): void }).ResetFont();
    }
    dc.EndGraphic(element, this);
  }

  // C++ View::DrawEnding(dc, ending, system). Last method of view_control.cpp.
  // Local ordinals: endings_ENDINGREND_top=1; LINEFORM_dashed=1, dotted=2; BARRENDITION_invis=10 (local).
  public DrawEnding(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawEnding requires a device context.');
    if (!element) throw new Error('View::DrawEnding requires an ending.');
    if (!system) throw new Error('View::DrawEnding requires a system.');
    const ending = element as unknown as {
      GetID(): string; GetDrawingY(): number;
      GetMeasure(): { GetDrawingX(): number } | null;
      GetEnd(): {
        GetMeasure(): { GetDrawingX(): number; GetRightBarLineXRel(): number } | null;
        GetFirstAncestor(id: number): unknown;
      } | null;
      GetFirstAncestor(id: number): unknown;
      HasN(): boolean; HasLabel(): boolean; GetN(): string; GetLabel(): string;
      GetLform(): number; GetLstartsym(): number; GetLendsym(): number;
    };
    if ((dc as unknown as { Is(id: number): boolean }).Is(ClassId.BBOX_DEVICE_CONTEXT)) {
      const bbox = dc as unknown as { UpdateVerticalValues(): boolean };
      if (!bbox.UpdateVerticalValues()) return;
    }
    const endingEndMilestone = ending.GetEnd();
    if (!endingEndMilestone) return;
    if (!ending.GetMeasure() || !endingEndMilestone.GetMeasure()) return;
    const parentSystem1 = ending.GetFirstAncestor(ClassId.SYSTEM);
    const parentSystem2 = endingEndMilestone.GetFirstAncestor(ClassId.SYSTEM);
    if (!parentSystem1 || !parentSystem2) return;
    let x1 = 0; let x2 = 0;
    let objectX: unknown = null;
    let measure: {
      GetDrawingX(): number; GetLeftBarLineXRel(): number; GetRightBarLineXRel(): number;
      GetRightBarLine(): unknown; GetLeftBarLine(): unknown;
      GetFirstStaffGrpStaves(s: unknown): ViewPageStaffLike[];
    } | null = null;
    let spanningType = SpanningType.SPANNING_START_END;
    let endingMeasure: {
      GetDrawingX(): number; GetRightBarLineXRel(): number;
      CalculateRightBarLineWidth(d: unknown, s: number): number;
      GetDrawingRightBarLine(): number;
    } | null = null;
    const sysApi = system as unknown as {
      GetFirst(id: number): unknown;
      FindDescendantByType(id: number, depth: number, dir: boolean): {
        GetDrawingX(): number; GetLeftBarLineXRel(): number; GetRightBarLineXRel(): number;
        GetRightBarLine(): unknown; GetLeftBarLine(): unknown;
        GetFirstStaffGrpStaves(s: unknown): ViewPageStaffLike[];
      } | null;
      FindAllDescendantsByType(id: number, b: boolean): ViewPageObjectLike[];
      GetDrawingScoreDef(): {
        GetEndingRend(): number;
        GetStaffDef(n: number): { GetDrawingVisibility(): number } | null;
      };
      SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean;
    };
    if ((system as unknown) === (parentSystem1 as unknown) && (system as unknown) === (parentSystem2 as unknown)) {
      measure = ending.GetMeasure() as unknown as typeof measure;
      x1 = measure!.GetDrawingX();
      endingMeasure = endingEndMilestone.GetMeasure() as unknown as typeof endingMeasure;
      objectX = measure;
      if (sysApi.GetFirst(ClassId.MEASURE) === (measure as unknown)) x1 += measure!.GetLeftBarLineXRel();
      x2 = endingMeasure!.GetDrawingX() + endingMeasure!.GetRightBarLineXRel();
    }
    else if ((system as unknown) === (parentSystem1 as unknown)) {
      measure = sysApi.FindDescendantByType(ClassId.MEASURE, 1, false /* BACKWARD */);
      if (!measure) return;
      x1 = (ending.GetMeasure() as unknown as { GetDrawingX(): number }).GetDrawingX();
      objectX = measure;
      endingMeasure = measure as unknown as typeof endingMeasure;
      if (sysApi.GetFirst(ClassId.MEASURE) === (ending.GetMeasure() as unknown)) {
        x1 += (ending.GetMeasure() as unknown as { GetLeftBarLineXRel(): number }).GetLeftBarLineXRel();
      }
      x2 = measure.GetDrawingX() + measure.GetRightBarLineXRel();
      spanningType = SpanningType.SPANNING_START;
    }
    else if ((system as unknown) === (parentSystem2 as unknown)) {
      measure = sysApi.FindDescendantByType(ClassId.MEASURE, 1, true /* FORWARD */);
      if (!measure) return;
      x1 = measure.GetDrawingX() + measure.GetLeftBarLineXRel();
      objectX = measure.GetLeftBarLine();
      endingMeasure = endingEndMilestone.GetMeasure() as unknown as typeof endingMeasure;
      x2 = endingMeasure!.GetDrawingX() + endingMeasure!.GetRightBarLineXRel();
      spanningType = SpanningType.SPANNING_END;
    }
    else {
      measure = sysApi.FindDescendantByType(ClassId.MEASURE, 1, true /* FORWARD */);
      if (!measure) return;
      x1 = measure.GetDrawingX() + measure.GetLeftBarLineXRel();
      objectX = measure.GetLeftBarLine();
      endingMeasure = measure as unknown as typeof endingMeasure;
      measure = sysApi.FindDescendantByType(ClassId.MEASURE, 1, false /* BACKWARD */);
      if (!measure) return;
      x2 = measure.GetDrawingX() + measure.GetRightBarLineXRel();
      spanningType = SpanningType.SPANNING_MIDDLE;
    }
    const dcExt = dc as unknown as {
      ResumeGraphic(o: unknown, id: string): void;
      StartGraphic(o: unknown, c: string, id: string, g?: number): void;
      StartCustomGraphic(c: string): void;
      SetFont(f: unknown): void;
      GetTextExtent(s: string, e: { m_width: number; m_height: number }, b: boolean): void;
      StartText(x: number, y: number, a: number): void;
      EndText(): void;
      ResetFont(): void;
      SetPen(w: number, s: number, d: number, g: number, c: number): void;
      DrawLine(a: number, b: number, c: number, d: number): void;
      ResetPen(): void;
      EndCustomGraphic(): void;
      EndResumedGraphic(o: unknown, v: unknown): void;
      EndGraphic(o: unknown, v: unknown): void;
    };
    if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_START)) {
      dcExt.ResumeGraphic(element, element.GetID());
    }
    else {
      dcExt.StartGraphic(element, '', element.GetID(), GraphicID.SPANNING);
    }
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetDrawingLyricFont(s: number): { GetPointSize(): number };
      GetDrawingUnit(s: number): number;
    };
    const opts = (this as unknown as { m_options: {
      m_repeatEndingLineThickness: { GetValue(): number };
      m_staffLineWidth: { GetValue(): number };
    } }).m_options;
    let staffList: ViewPageStaffLike[] = [];
    if (sysApi.GetDrawingScoreDef().GetEndingRend() === 1 /* top */) {
      const systemStaves = sysApi.FindAllDescendantsByType(ClassId.STAFF, false);
      let topStaff: ViewPageObjectLike | null = null;
      for (const staffObject of systemStaves) {
        const n = (staffObject as unknown as { GetN(): number }).GetN();
        const staffDef = sysApi.GetDrawingScoreDef().GetStaffDef(n);
        if (staffDef && (staffDef.GetDrawingVisibility() !== 0 /* OPTIMIZATION_HIDDEN-like */)) {
          // C++ breaks on first non-hidden staff; visibility constants keep semantic via inequality.
          topStaff = staffObject;
          break;
        }
      }
      if (!topStaff) return;
      staffList.push(topStaff as unknown as ViewPageStaffLike);
    }
    else {
      staffList = measure!.GetFirstStaffGrpStaves(sysApi.GetDrawingScoreDef());
    }
    for (const staff of staffList) {
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = sysApi.SetCurrentFloatingPositioner
        ? sysApi.SetCurrentFloatingPositioner(staffN, element as unknown, objectX as unknown, staff as unknown) : false;
      if (!ok) continue;
      const staffSize = staff.m_drawingStaffSize;
      const y1 = element.GetDrawingY();
      dcExt.StartCustomGraphic('voltaBracket');
      const currentFont = docExt.GetDrawingLyricFont(staffSize);
      dcExt.SetFont(currentFont);
      const extend = { m_width: 0, m_height: 0 };
      dcExt.GetTextExtent('M', extend, false);
      const unit = docExt.GetDrawingUnit(staffSize);
      if (ending.HasN() || ending.HasLabel()) {
        const endingText = ending.HasLabel() ? ending.GetLabel() : ending.GetN();
        let txt = endingText;
        if ((spanningType === SpanningType.SPANNING_END) || (spanningType === SpanningType.SPANNING_MIDDLE)) txt = '(' + txt;
        if ((spanningType === SpanningType.SPANNING_END) || (spanningType === SpanningType.SPANNING_MIDDLE)) txt = txt + ')';
        const textCodes = UTF8to32(txt);
        let textX = x1;
        if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_START)) {
          textX += Math.trunc(unit * 2 / 3);
        }
        const textEl = new Text();
        textEl.SetParent(element as never);
        textEl.SetText(textCodes);
        dcExt.StartText(this.ToDeviceContextX(textX), this.ToDeviceContextY(y1), HORIZONTALALIGNMENT_left);
        this.DrawTextElement(dc as never, textEl as never, {
          m_x: textX, m_y: y1, m_pointSize: currentFont.GetPointSize(),
        } as never);
        dcExt.EndText();
      }
      dcExt.ResetFont();
      const y2 = y1 + extend.m_height + Math.trunc(unit * 2 / 3);
      const lineWidth = Math.trunc(opts.m_repeatEndingLineThickness.GetValue() * unit);
      const staffLineWidth = Math.trunc(opts.m_staffLineWidth.GetValue() * unit);
      const startX = x1 - staffLineWidth;
      const rightBarLineWidth = endingMeasure!.CalculateRightBarLineWidth(doc, staffSize);
      let endX = x2;
      if ((spanningType === SpanningType.SPANNING_START) || (spanningType === SpanningType.SPANNING_MIDDLE)
        || (endingMeasure === (sysApi.FindDescendantByType(ClassId.MEASURE, 1, false /* BACKWARD */) as unknown))) {
        endX += rightBarLineWidth - Math.trunc(lineWidth / 2) - staffLineWidth;
      }
      else if (endingMeasure!.GetDrawingRightBarLine() !== 10 /* BARRENDITION_invis */) {
        endX -= Math.max(lineWidth + Math.trunc(unit / 2) - rightBarLineWidth, 0);
      }
      let penStyle = PenStyle.PEN_SOLID;
      let capStyle = LineCapStyle.LINECAP_SQUARE;
      switch (ending.GetLform()) {
        case 1 /* dashed */: penStyle = PenStyle.PEN_LONG_DASH; break;
        case 2 /* dotted */:
          penStyle = PenStyle.PEN_DOT;
          capStyle = LineCapStyle.LINECAP_ROUND;
          break;
        default: penStyle = PenStyle.PEN_SOLID;
      }
      dcExt.SetPen(lineWidth, penStyle, 0, 0, capStyle);
      dcExt.DrawLine(this.ToDeviceContextX(startX), this.ToDeviceContextY(y2), this.ToDeviceContextX(endX), this.ToDeviceContextY(y2));
      if ((spanningType !== SpanningType.SPANNING_END) && (spanningType !== SpanningType.SPANNING_MIDDLE)
        && ((ending.GetLstartsym() as unknown) !== 20 /* none */)) {
        dcExt.DrawLine(this.ToDeviceContextX(startX), this.ToDeviceContextY(y2), this.ToDeviceContextX(startX), this.ToDeviceContextY(y1));
      }
      if ((spanningType !== SpanningType.SPANNING_START) && (spanningType !== SpanningType.SPANNING_MIDDLE)
        && ((ending.GetLendsym() as unknown) !== 20 /* none */)) {
        dcExt.DrawLine(this.ToDeviceContextX(endX), this.ToDeviceContextY(y2), this.ToDeviceContextX(endX), this.ToDeviceContextY(y1));
      }
      dcExt.ResetPen();
      dcExt.EndCustomGraphic();
    }
    if ((spanningType === SpanningType.SPANNING_START_END) || (spanningType === SpanningType.SPANNING_START)) {
      dcExt.EndResumedGraphic(element, this);
    }
    else {
      dcExt.EndGraphic(element, this);
    }
  }

  // C++ View::DrawControlElementText(dc, element, measure, system); left-align default,
  // TstampStaves loop, xAdjust for right-aligned at right barline, between/within vertical shift.
  public DrawControlElementText(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawControlElementText requires a device context.');
    if (!element) throw new Error('View::DrawControlElementText requires an element.');
    if (!measure) throw new Error('View::DrawControlElementText requires a measure.');
    if (!system) throw new Error('View::DrawControlElementText requires a system.');
    const el = element as unknown as {
      Is(id: number): boolean;
      GetID(): string; GetDrawingY(): number; GetChildRendAlignment(): number;
      GetTimePointInterface(): { GetStart(): ViewControlStartLike | null; GetTstampStaves(m: unknown, e: unknown): ViewPageStaffLike[] } | null;
      GetTextDirInterface(): ViewControlTextDirLike | null;
    };
    const tpi = el.GetTimePointInterface();
    if (!tpi) throw new Error('View::DrawControlElementText requires a time-point interface.');
    const tdi = el.GetTextDirInterface();
    if (!tdi) throw new Error('View::DrawControlElementText requires a text-dir interface.');
    const start = tpi.GetStart();
    if (!start) return;
    dc.StartGraphic(element, '', element.GetID());
    const place = tdi.GetPlace();
    const doc = this.m_doc!;
    const docExt = doc as unknown as {
      GetResources(): { GetTextFont(): string };
      GetDrawingLyricFont(s: number): { GetPointSize(): number };
      GetTextLineHeight(f: unknown, b: boolean): number;
      GetTextXHeight(f: unknown, b: boolean): number;
      GetDrawingUnit(s: number): number;
    };
    const dirTxt = new FontInfo();
    if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
      dirTxt.SetFaceName(docExt.GetResources().GetTextFont());
      dirTxt.SetStyle(FONTSTYLE_italic as FontStyle);
    }
    const lineCount = tdi.GetNumberOfLines(element);
    let alignment = el.GetChildRendAlignment();
    if (alignment === HORIZONTALALIGNMENT_NONE) alignment = HORIZONTALALIGNMENT_left;
    const staffList = tpi.GetTstampStaves(measure, element);
    for (const staff of staffList) {
      const setPos = (system as unknown as { SetCurrentFloatingPositioner?(n: number, o: unknown, x: unknown, s: unknown): boolean }).SetCurrentFloatingPositioner;
      const staffN = (staff as unknown as { GetN(): number }).GetN();
      const ok = setPos ? setPos.call(system, staffN, element as unknown, start as unknown, staff as unknown) : false;
      if (!ok) continue;
      const ss = staff.m_drawingStaffSize;
      let x = (start as unknown as { GetDrawingX(): number }).GetDrawingX()
        + (start as unknown as { GetDrawingRadius(d: unknown): number }).GetDrawingRadius(doc);
      let y = element.GetDrawingY();
      this.SetOffsetStaffSize(element as never, ss);
      const p = { x, y };
      this.CalcOffset(dc as never, p);
      x = p.x; y = p.y;
      const params = new TextDrawingParams();
      params.m_x = x; params.m_y = y; params.m_staffSize = ss;
      params.m_pointSize = docExt.GetDrawingLyricFont(ss).GetPointSize();
      let xAdjust = 0;
      const mExt = measure as unknown as { GetLastStaff?(): unknown; GetFirstStaff?(): unknown; m_measureAligner: { GetRightBarLineAlignment(): { GetTime(): unknown } } };
      const isBetween = (place === STAFFREL_between)
        || ((place === STAFFREL_below) && (staff !== mExt.GetLastStaff?.()))
        || ((place === STAFFREL_above) && (staff !== mExt.GetFirstStaff?.()));
      if (isBetween
        && ((start as unknown as { GetAlignment(): { GetTime(): unknown } }).GetAlignment().GetTime()
          === mExt.m_measureAligner.GetRightBarLineAlignment().GetTime())
        && tdi.AreChildrenAlignedTo(element, HORIZONTALALIGNMENT_right)) {
        xAdjust = Math.trunc(docExt.GetDrawingUnit(ss) / 2);
      }
      dirTxt.SetPointSize(params.m_pointSize);
      if ((place === STAFFREL_between) || (place === STAFFREL_within)) {
        if (lineCount > 1) {
          params.m_y += Math.trunc(docExt.GetTextLineHeight(dirTxt, false) * (lineCount - 1) / 2);
        }
        params.m_y -= Math.trunc(docExt.GetTextXHeight(dirTxt, false) / 2);
      }
      (dc as unknown as { SetFont(f: unknown): void }).SetFont(dirTxt);
      (dc as unknown as { StartText(x: number, y: number, a: number): void })
        .StartText(this.ToDeviceContextX(params.m_x - xAdjust), this.ToDeviceContextY(params.m_y), alignment);
      this.DrawTextChildren(dc, element, params);
      (dc as unknown as { EndText(): void }).EndText();
      (dc as unknown as { ResetFont(): void }).ResetFont();
      this.DrawTextEnclosure(dc as never, params, ss);
    }
    dc.EndGraphic(element, this);
  }

  public DrawControlElement(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, measure: ViewPageMeasureLike, system: ViewPageSystemLike): void {
    if (!dc) throw new Error('View::DrawControlElement requires a device context.');
    if (!element) throw new Error('View::DrawControlElement requires an element.');
    if (!measure) throw new Error('View::DrawControlElement requires a measure.');
    if (!system) throw new Error('View::DrawControlElement requires a system.');
    this.StartOffset(dc, element as never, 100);
    const el = element as unknown as { Is(id: number): boolean; IsAnyOf(c: number[]): boolean };
    const cast = this as unknown as Record<string, ((...a: unknown[]) => void) | undefined>;
    // C++ branch order kept: spanning placeholder first, then per-class dispatch.
    if (el.IsAnyOf([ClassId.ANNOTSCORE, ClassId.BEAMSPAN, ClassId.BRACKETSPAN, ClassId.FIGURE, ClassId.GLISS, ClassId.HAIRPIN, ClassId.LV, ClassId.OCTAVE, ClassId.PHRASE, ClassId.PITCHINFLECTION, ClassId.SLUR, ClassId.TIE])) {
      dc.StartGraphic(element, '', element.GetID());
      dc.EndGraphic(element, this);
      (system as unknown as { AddToDrawingList(e: unknown): void }).AddToDrawingList(element);
    }
    else if (el.Is?.(ClassId.ARPEG)) cast.DrawArpeg?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.BREATH)) cast.DrawBreath?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.CAESURA)) cast.DrawCaesura?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.CPMARK)) cast.DrawControlElementText?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.DIR)) { cast.DrawControlElementText?.(dc as never, element as never, measure as never, system as never); (system as unknown as { AddToDrawingListIfNecessary?(o: unknown): void }).AddToDrawingListIfNecessary?.(element); }
    else if (el.Is?.(ClassId.DYNAM)) { cast.DrawDynam?.(dc as never, element as never, measure as never, system as never); (system as unknown as { AddToDrawingListIfNecessary?(o: unknown): void }).AddToDrawingListIfNecessary?.(element); }
    else if (el.Is?.(ClassId.FERMATA)) cast.DrawFermata?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.FING)) cast.DrawFing?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.HARM)) cast.DrawHarm?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.MORDENT)) cast.DrawMordent?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.ORNAM)) cast.DrawControlElementText?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.PEDAL)) { cast.DrawPedal?.(dc as never, element as never, measure as never, system as never); (system as unknown as { AddToDrawingListIfNecessary?(o: unknown): void }).AddToDrawingListIfNecessary?.(element); }
    else if (el.Is?.(ClassId.REH)) cast.DrawReh?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.REPEATMARK)) cast.DrawRepeatMark?.(dc as never, element as never, measure as never, system as never);
    else if (el.Is?.(ClassId.TEMPO)) { cast.DrawTempo?.(dc as never, element as never, measure as never, system as never); (system as unknown as { AddToDrawingListIfNecessary?(o: unknown): void }).AddToDrawingListIfNecessary?.(element); }
    else if (el.Is?.(ClassId.TRILL)) { cast.DrawTrill?.(dc as never, element as never, measure as never, system as never); (system as unknown as { AddToDrawingListIfNecessary?(o: unknown): void }).AddToDrawingListIfNecessary?.(element); }
    else if (el.Is?.(ClassId.TURN)) cast.DrawTurn?.(dc as never, element as never, measure as never, system as never);
    this.EndOffset(dc, element);
  }

  public DrawCursor(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawCursor requires a device context.');
    if (!element) throw new Error('View::DrawCursor requires an element.');
    if (!layer) throw new Error('View::DrawCursor requires a layer.');
    if (!staff) throw new Error('View::DrawCursor requires a staff.');
    if (!measure) throw new Error('View::DrawCursor requires a measure.');
    const doc = this.m_doc!;
    const cursor = element as unknown as {
      GetID(): string; GetDrawingX(): number; GetDrawingY(): number; GetDrawingRadius(doc: unknown): number;
      IsRestMode(): boolean; IsChordMode(): boolean; GetInputMode(): number; GetTieMode(): number; IsTieMode(): boolean;
      GetYRelPitchC(): number; GetDur(): number; HasDur(): boolean; GetDots(): number; HasDots(): boolean;
      GetAccid(): number; HasAccid(): boolean; IsAccidImplicit(): boolean; GetAccidElement(): unknown;
    };
    const staffSize = staff.m_drawingStaffSize;
    const unit = doc.GetDrawingUnit(staffSize);
    const isNote = !cursor.IsRestMode();
    const chordCss = cursor.IsChordMode() ? 'chord' : '';
    (dc as unknown as { StartCustomGraphic(name: string, css: string): void }).StartCustomGraphic('cursor', chordCss);
    const x = cursor.GetDrawingX();
    const yC1 = staff.GetDrawingY() + cursor.GetYRelPitchC();
    const yC2 = yC1 + 6 * unit;
    // Cursor::InputMode ordinals from cursor.h: PITCH_FIRST=0, DURATION_FIRST=1.
    if (cursor.GetInputMode() === 1) {
      const octX = x + unit;
      const octSize = Math.trunc(staffSize * 0.8);
      const width = doc.GetDrawingStemWidth(octSize);
      this.DrawVerticalLine(dc, yC1, yC2, octX, width, VRV_UNSET, VRV_UNSET);
      this.DrawDot(dc, octX, yC1, octSize);
      this.DrawDot(dc, octX, yC2, octSize);
      const y = Math.max(yC2, staff.GetDrawingY()) + 2 * unit;
      const cursorSize = Math.trunc(staffSize * 0.7);
      dc.SetFont(doc.GetDrawingSmuflFont(cursorSize, false));
      const str: number[] = [];
      let sym = SMUFL_ECA5_metNoteQuarterUp;
      switch (cursor.GetDur()) {
        case DURATION_breve: sym = SMUFL_ECA1_metNoteDoubleWholeSquare; break;
        case DURATION_1: sym = SMUFL_ECA2_metNoteWhole; break;
        case DURATION_2: sym = SMUFL_ECA3_metNoteHalfUp; break;
        case DURATION_4: sym = SMUFL_ECA5_metNoteQuarterUp; break;
        case DURATION_8: sym = SMUFL_ECA7_metNote8thUp; break;
        case DURATION_16: sym = SMUFL_ECA9_metNote16thUp; break;
        case DURATION_32: sym = SMUFL_ECAB_metNote32ndUp; break;
        case DURATION_64: sym = SMUFL_ECAD_metNote64thUp; break;
        default: break;
      }
      str.push(sym);
      if (cursor.HasDots()) {
        str.push(SMUFL_0020_space);
        str.push(SMUFL_ECB7_metAugmentationDot);
      }
      this.DrawSmuflString(dc, octX, y, str, HORIZONTALALIGNMENT_center, cursorSize);
      const extend = new TextExtend();
      (dc as unknown as { GetSmuflTextExtent(s: number[], e: TextExtend): void }).GetSmuflTextExtent(str, extend);
      if (cursor.HasAccid() && !cursor.IsAccidImplicit()) {
        const strAccid: number[] = [];
        // ACCIDENTAL_WRITTEN ordinals from ./libmei-att.ts: s=1, f=2, x=4, ff=5, n=10.
        let accSym = SMUFL_EA65_figbassNatural;
        switch (cursor.GetAccid()) {
          case 2: accSym = SMUFL_EA64_figbassFlat; break;
          case 10: accSym = SMUFL_EA65_figbassNatural; break;
          case 1: accSym = SMUFL_EA66_figbassSharp; break;
          case 5: accSym = SMUFL_EA63_figbassDoubleFlat; break;
          case 4: accSym = SMUFL_EA67_figbassDoubleSharp; break;
          default: break;
        }
        strAccid.push(accSym);
        this.DrawSmuflString(dc, octX, y + extend.m_height, strAccid, HORIZONTALALIGNMENT_center, cursorSize);
      }
      dc.ResetFont();
    }
    else {
      const y = isNote ? cursor.GetDrawingY() : staff.GetDrawingY() + 3 * unit;
      if (isNote) {
        if (cursor.IsTieMode()) {
          const tieY = staff.GetDrawingY() + unit;
          const cursorSize = Math.trunc(staffSize * 0.7);
          const labelTxt = new FontInfo();
          if (!(dc as unknown as { UseGlobalStyling(): boolean }).UseGlobalStyling()) {
            labelTxt.SetFaceName((doc.GetResources() as unknown as { GetTextFont(): string }).GetTextFont());
          }
          labelTxt.SetPointSize(doc.GetDrawingLyricFont(cursorSize).GetPointSize());
          labelTxt.SetWeight(1); // FONTWEIGHT_bold (attconverter.ts:486, non-exported)
          const params = new TextDrawingParams();
          params.m_x = x;
          params.m_y = tieY;
          params.m_pointSize = labelTxt.GetPointSize();
          dc.SetFont(labelTxt);
          dc.StartText(this.ToDeviceContextX(params.m_x), this.ToDeviceContextY(params.m_y), HORIZONTALALIGNMENT_center);
          // Cursor::TieMode ordinals from cursor.h: TIE_NONE=0, TIE=1, COPY=2. U+29C9 copy, U+23DC tie.
          const tieStr = (cursor.GetTieMode() === 2) ? [0x29C9] : [0x23DC];
          dc.DrawText(UTF32to8(tieStr), tieStr);
          dc.EndText();
          dc.ResetFont();
          if (cursor.HasDots()) {
            const dotsX = Math.trunc(x + 1.5 * cursor.GetDrawingRadius(doc));
            this.DrawDotsPart(dc, dotsX, y + unit, cursor.GetDots(), staff);
          }
        }
        else {
          const layerCursor = (layer as unknown as { GetCursor(): ViewPageObjectLike }).GetCursor();
          this.DrawNote(dc, layerCursor, layer, staff, measure);
          const octX = Math.trunc(x - 0.5 * unit);
          const octSize = Math.trunc(staffSize * 0.8);
          const width = doc.GetDrawingStemWidth(octSize);
          this.DrawVerticalLine(dc, yC1, yC2, octX, width, VRV_UNSET, VRV_UNSET);
          this.DrawDot(dc, octX, yC1, octSize);
          this.DrawDot(dc, octX, yC2, octSize);
          if (cursor.HasAccid()) {
            this.DrawAccid(dc, cursor.GetAccidElement() as unknown as ViewElementAccidLike, layer, staff, measure);
          }
          if (cursor.HasDots()) {
            const dotsX = Math.trunc(x + 2.8 * cursor.GetDrawingRadius(doc));
            this.DrawDotsPart(dc, dotsX, y, cursor.GetDots(), staff);
          }
        }
      }
      else {
        const dur = cursor.HasDur() ? cursor.GetDur() : DURATION_4;
        // Fresh-Rest CMN glyph switch from rest.ts GetRestGlyphWithDur (no glyph.num/name/altsym on a fresh Rest).
        let drawingGlyph = 0;
        switch (dur) {
          case DURATION_long: drawingGlyph = SMUFL_E4E1_restLonga; break;
          case DURATION_breve: drawingGlyph = SMUFL_E4E2_restDoubleWhole; break;
          case DURATION_1: drawingGlyph = SMUFL_E4E3_restWhole; break;
          case DURATION_2: drawingGlyph = SMUFL_E4E4_restHalf; break;
          case DURATION_4: drawingGlyph = SMUFL_E4E5_restQuarter; break;
          case DURATION_8: drawingGlyph = SMUFL_E4E6_rest8th; break;
          case DURATION_16: drawingGlyph = SMUFL_E4E7_rest16th; break;
          case DURATION_32: drawingGlyph = SMUFL_E4E8_rest32nd; break;
          case DURATION_64: drawingGlyph = SMUFL_E4E9_rest64th; break;
          default: break;
        }
        let width = doc.GetGlyphWidth(drawingGlyph, staffSize, true);
        this.DrawSmuflCode(dc, x, y, drawingGlyph, staffSize, true);
        if ((dur === DURATION_1) || (dur === DURATION_2)) {
          const opts = doc.GetOptions() as unknown as { m_ledgerLineThickness: { GetValue(): number }; m_graceFactor: { GetValue(): number } };
          const lineWidth = Math.trunc(opts.m_ledgerLineThickness.GetValue() * doc.GetDrawingUnit(staff.m_drawingStaffSize) * opts.m_graceFactor.GetValue());
          (dc as unknown as { SetPen(w: number, style: number): void }).SetPen(this.ToDeviceContextX(lineWidth), PenStyle.PEN_SOLID);
          (dc as unknown as { DrawLine(x1: number, y1: number, x2: number, y2: number): void }).DrawLine(this.ToDeviceContextX(x - unit * 0.5), this.ToDeviceContextY(y), this.ToDeviceContextX(x + width + unit * 0.5), this.ToDeviceContextY(y));
          (dc as unknown as { ResetPen(): void }).ResetPen();
          width += Math.trunc(0.5 * unit);
        }
        if (cursor.HasDots()) {
          const dotsX = Math.trunc(x + 0.5 * unit + width);
          this.DrawDotsPart(dc, dotsX, y, cursor.GetDots(), staff, true);
        }
      }
    }
    (dc as unknown as { EndCustomGraphic(): void }).EndCustomGraphic();
  }

  public DrawVolta(dc: ViewPageDeviceContextLike, element: ViewPageObjectLike, layer: ViewPageLayerLike, staff: ViewPageStaffLike, measure: ViewPageMeasureLike): void {
    if (!dc) throw new Error('View::DrawVolta requires a device context.');
    if (!element) throw new Error('View::DrawVolta requires an element.');
    dc.StartGraphic(element, '', element.GetID());
    (this as unknown as { DrawLayerChildren(dc: unknown, el: unknown, l: unknown, s: unknown, m: unknown): void }).DrawLayerChildren(dc, element, layer, staff, measure);
    dc.EndGraphic(element, this);
  }

  public GetFYRel(f: ViewPageObjectLike, staff: ViewPageStaffLike): number {
    if (!f) throw new Error('View::GetFYRel requires an F.');
    if (!staff) throw new Error('View::GetFYRel requires a staff.');
    const doc = this.m_doc!;
    let y = staff.GetDrawingY();
    const alignment = staff.GetAlignment!();
    // Something must be seriously wrong...
    if (!alignment) return y;
    y -= alignment.GetStaffHeight() + alignment.GetOverflowBelow();
    const positioner = alignment.FindFirstFloatingPositioner ? alignment.FindFirstFloatingPositioner(ClassId.HARM) : null;
    // If there is no other harm, we use the bottom line.
    if (positioner) {
      y = positioner.GetDrawingY();
    }
    const fb = f.GetFirstAncestor!(ClassId.FB);
    if (!fb) throw new Error('View::GetFYRel requires an FB ancestor.');
    const line = fb.GetDescendantIndex!(f, ClassId.FIGURE, UNLIMITED_DEPTH);
    if (line > 0) {
      const fFont = doc.GetDrawingLyricFont(staff.m_drawingStaffSize);
      const lineHeight = doc.GetTextLineHeight(fFont, false);
      y -= line * lineHeight;
    }
    return y;
  }

  public GetSylYRel(verseN: number, staff: ViewPageStaffLike, place: number, voltaN: number): number {
    if (!staff) throw new Error('View::GetSylYRel requires a staff.');
    const doc = this.m_doc!;
    const alignment = staff.GetAlignment!();
    if (!alignment) return 0;
    const verseCollapse = (this.m_options as unknown as { m_lyricVerseCollapse: { GetValue(): boolean } }).m_lyricVerseCollapse.GetValue();
    let y = 0;
    const lyricFont = doc.GetDrawingLyricFont(staff.m_drawingStaffSize);
    const descender = doc.GetTextGlyphDescender('q'.codePointAt(0)!, lyricFont, false);
    const height = doc.GetTextGlyphHeight('I'.codePointAt(0)!, lyricFont, false);
    let verseHeight = height - descender;
    verseHeight *= (this.m_options as unknown as { m_lyricHeightFactor: { GetValue(): number } }).m_lyricHeightFactor.GetValue();
    const margin = doc.GetBottomMargin(ClassId.SYL) * doc.GetDrawingUnit(staff.m_drawingStaffSize);
    // above the staff
    if (place === STAFFREL_above) {
      y = alignment.GetOverflowAbove()
        - alignment.GetVersePositionAbove(verseN, verseCollapse, voltaN) * (verseHeight + margin) - height;
    }
    else {
      y = -alignment.GetStaffHeight() - alignment.GetOverflowBelow()
        + alignment.GetVersePositionBelow(verseN, verseCollapse, voltaN) * (verseHeight + margin) + verseHeight - height;
    }
    return y;
  }

  public DrawMRptPart(dc: ViewPageDeviceContextLike, xCentered: number, y: number, rptGlyph: number, num: number, line: boolean, staff: ViewPageStaffLike): void {
    if (!dc) throw new Error('View::DrawMRptPart requires a device context.');
    const doc = this.m_doc!;
    const staffNotationSize = staff.GetDrawingStaffNotationSize();
    const staffSize = staff.m_drawingStaffSize;
    const xSymbol = xCentered - Math.trunc(doc.GetGlyphWidth(rptGlyph, staffNotationSize, false) / 2);
    const ySymbol = y - (staff.m_drawingLines - 1) * doc.GetDrawingUnit(staffSize);
    this.DrawSmuflCode(dc, xSymbol, ySymbol, rptGlyph, staffNotationSize, false);
    if (line) {
      const yBottom = y - (staff.m_drawingLines - 1) * doc.GetDrawingDoubleUnit(staffSize);
      const offset = (y === ySymbol) ? doc.GetDrawingDoubleUnit(staffSize) : 0;
      this.DrawVerticalLine(dc, y + offset, yBottom - offset, xCentered, doc.GetDrawingBarLineWidth(staffNotationSize), VRV_UNSET, VRV_UNSET);
    }
    if (num > 0) {
      dc.SetFont(doc.GetDrawingSmuflFont(staffNotationSize, false));
      const extend = new TextExtend();
      const figures = this.IntToTimeSigFigures(num);
      dc.GetSmuflTextExtent(figures, extend);
      const symHeight = doc.GetGlyphHeight(rptGlyph, staffNotationSize, false);
      const yNum = (y > ySymbol + Math.trunc(symHeight / 2))
        ? staff.GetDrawingY() + doc.GetDrawingUnit(staffNotationSize) + Math.trunc(extend.m_height / 2)
        : ySymbol + 3 * doc.GetDrawingUnit(staffNotationSize) + Math.trunc(extend.m_height / 2);
      dc.DrawMusicText(figures, this.ToDeviceContextX(xCentered - Math.trunc(extend.m_width / 2)), this.ToDeviceContextY(yNum));
      dc.ResetFont();
    }
  }

}


export const NOTATIONTYPE_NONE = 0;
export const NOTATIONTYPE_cmn = 1;
export const NOTATIONTYPE_mensural = 2;
export const NOTATIONTYPE_mensural_black = 3;
export const NOTATIONTYPE_mensural_white = 4;
export const MENSURATIONSIGN_NONE = 0;
export const MENSURATIONSIGN_C = 1;
export const MENSURATIONSIGN_O = 2;
export const ORIENTATION_reversed = 1;
export const LIGATURE_OBL_auto = 0;
export const LIGATURE_OBL_straight = 1;
export const LIGATURE_OBL_curved = 2;
export const BOOLEAN_true = 1;
export const STEMDIRECTION_basic_up = 1;
export const DURATION_breve = 1;
export const DURATION_long = 0;

export interface ViewMensuralNoteLike {
  GetID(): string;
  Is(classId: number): boolean;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetDrawingDur(): number;
  GetActualDur(): number;
  GetDrawingRadius(doc: unknown, isInLigature?: boolean): number;
  PitchDifferenceTo(other: unknown): number;
  GetMensuralNoteheadGlyph(): number;
  IsInLigature(): boolean;
  GetColored(): number | boolean;
  GetStemDir(): number;
  HasStemDir(): boolean;
  GetDrawingStemDir(): number;
  SetDrawingStemDir(d: number): void;
  GetFirstAncestor(classId: number): unknown;
  FindDescendantByType(classId: number): unknown;
  GetContentLeft(): number;
  GetContentRight(): number;
  GetContentTop(): number;
}

export interface ViewMensuralStaffLike {
  GetDrawingY(): number;
  m_drawingStaffSize: number;
  m_drawingLines: number;
  m_drawingNotationType: number;
}

export interface ViewMensurLike {
  GetID(): string;
  GetDrawingX(): number;
  HasSign(): boolean; GetSign(): number;
  HasNum(): boolean; GetNum(): number;
  HasNumbase(): boolean; GetNumbase(): number;
  HasSlash(): boolean;
  HasLoc(): boolean; GetLoc(): number;
  HasTempus(): boolean;
  GetOrient(): number;
  GetDot(): number;
}

export interface ViewMensuralLigatureLike {
  GetID(): string;
  m_drawingShapes: number[];
  GetList(): unknown[];
  GetListIndex(element: unknown): number;
  GetListPrevious(element: unknown): unknown;
  GetListNext(element: unknown): unknown;
  GetFirstNote(): ViewMensuralNoteLike;
  GetLastNote(): ViewMensuralNoteLike;
}

export interface ViewMensuralDotLike {
  m_drawingPreviousElement: ViewMensuralNoteLike | null;
}

export interface ViewMensuralPlicaLike {
  GetID(): string;
  GetDir(): number;
  GetFirstAncestor(classId: number): unknown;
}

export interface ViewMensuralProportLike {
  GetID(): string;
}

export interface ViewMensuralLayerLike {
  GetDrawingStemDir(element: unknown): number;
}

export interface ViewMensuralDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
  GetDrawingStemWidth(staffSize: number): number;
  GetGlyphWidth(code: number, staffSize: number, grace: boolean): number;
  GetDrawingSmuflFont(staffSize: number, grace: boolean): unknown;
  GetOptions(): { m_ligatureAsBracket: { GetValue(): boolean }; m_ligatureOblique: { GetValue(): number } };
}

// ==========================================================================

export interface ViewElementMeterSigLike extends ViewPageObjectLike {
  GetVisible(): number;
  GetDrawingX(): number;
}

// view_element.cpp — Pass 325 structural contracts
// ==========================================================================

export interface ViewElementBaseLike {
  Is(classId: number): boolean;
  IsLyricElement(): boolean;
  GetID(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface ViewElementLayerLike {
  AddToDrawingList?(element: unknown): void;
  GetClef?(element: unknown): ViewElementClefLike | null;
  GetDrawingStemDir?(note: unknown): number;
}



export interface ViewElementMeasureLike {
  GetFirstAncestor(classId: number): unknown;
}

export interface ViewElementTupletPartLike {
  GetBracketVisible(): number;
  GetNumVisible(): number;
}

export interface ViewElementAccidLike extends ViewPageObjectLike {
  HasAccid(): boolean;
  GetFloatingObject(): unknown | null;
  GetSymbolStr(notationType: number): number[];
  GetDrawingX(): number;
  GetDrawingY(): number;
  SetEmptyBB(): void;
  HasPlace(): boolean;
  HasOnstaff(): boolean;
  GetOnstaff(): number;
  GetPlace(): number;
  GetFunc(): number;
  GetDrawingCueSize(): boolean;
  GetEnclosingGlyphs(): [number, number];
}

export interface ViewElementNoteLike extends ViewPageObjectLike {
  GetDrawingDur(): number;
  GetDrawingY(): number;
  GetDrawingRadius(doc: unknown): number;
  IsMensuralDur(): boolean;
}

export interface ViewElementNoteBoundsLike {
  GetDrawingTop(doc: unknown, staffSize: number): number;
  GetDrawingBottom(doc: unknown, staffSize: number): number;
}

export interface ViewElementArticLike extends ViewPageObjectLike {
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetDrawingCueSize(): boolean;
  GetArticFirst(): number;
  GetDrawingPlace(): number;
  GetArticGlyph(value: number, place: number): number;
  GetEnclosingGlyphs(): [number, number];
  SetEmptyBB(): void;
  IsCentered(value: number): boolean;
  HasGlyphNum(): boolean;
  HasGlyphName(): boolean;
  VerticalCorr(code: number, place: number): boolean;
}

export interface ViewElementBarLineLike extends ViewPageObjectLike {
  GetForm(): number;
  SetEmptyBB(): void;
  HasMethod(): boolean;
  GetMethod(): number;
  GetMethodFromContext(staffDef: unknown): [boolean, number];
  HasRepetitionDots(): boolean;
}

export interface ViewElementBeatRptLike extends ViewPageObjectLike {
  GetSlash(): number;
  HasSlash(): boolean;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface ViewElementBTremLike extends ViewPageObjectLike {
  HasNum(): boolean;
  GetNum(): number;
  GetNumVisible(): number;
  GetNumPlace(): number;
  SetEmptyBB(): void;
  GetDrawingX(): number;
}

export interface ViewElementChordChildLike {
  Is(classId: number): boolean;
  GetDrawingRadius(doc: unknown): number;
  GetDrawingTop(doc: unknown, staffSize: number): number;
  GetDrawingBottom(doc: unknown, staffSize: number): number;
  HasStemSameasNote?(): boolean;
  GetStemSameasRole?(): number;
}

export interface ViewElementChordLike extends ViewPageObjectLike {
  HasCluster(): boolean;
  m_crossStaff: ViewPageStaffLike | null;
  ResetDrawingList(): void;
  GetTopNote(): ViewElementNoteLike;
  GetBottomNote(): ViewElementNoteLike;
  GetDrawingX(): number;
  GetActualDur(): number;
  GetCluster(): number;
  GetDrawingStemDir(): number;
  GetDots(): number;
  GetDrawingCueSize(): boolean;
}

export interface ViewElementClefLike extends ViewPageObjectLike {
  GetClefLocOffset(): number;
  m_crossStaff: ViewPageStaffLike | null;
  GetVisible(): number;
  GetClefGlyph(notationType: number): number;
  HasLine(): boolean;
  GetLine(): number;
  GetShape(): number;
  HasFontname(): boolean;
  GetFontname(): string;
  GetEnclose(): number;
  HasEnclose(): boolean;
  SetEmptyBB(): void;
}

export interface ViewElementRotatingStaffLike {
  HasDrawingRotation?(): boolean;
  GetDrawingRotationOffsetFor?(x: number): number;
}

export interface ViewElementCustosLike extends ViewPageObjectLike {
  GetCustosGlyph(notationType: number): number;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface ViewElementDotLike extends ViewPageObjectLike {
  m_drawingPreviousElement: ViewElementNoteLike | null;
  m_drawingNextElement: ViewElementNoteLike | null;
  GetForm(): number;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface ViewElementDotsLike extends ViewPageObjectLike {
  GetDrawingCueSize(): boolean;
  GetMapOfDotLocs(): Iterable<[ViewPageStaffLike | null, number[]]>;
  GetDrawingX(): number;
  GetDots(): number;
}

export interface ViewElementFlagLike extends ViewPageObjectLike {
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetDrawingCueSize(): boolean;
  GetFlagGlyph(stemDir: number): number;
}

export interface ViewElementHalfmRptLike extends ViewPageObjectLike {
  GetDrawingX(): number;
}

export interface ViewElementKeySigLike extends ViewPageObjectLike {
  GetDrawingClef(): unknown | null;
  SetEmptyBB(): void;
  GetVisible(): number;
  GetAccidCount(fromAttribute?: boolean): number;
  GetScoreDefRole(): number;
  m_skipCancellation: boolean;
  m_drawingCancelAccidType: number;
  m_drawingCancelAccidCount: number;
  HasCancelaccid(): boolean;
  GetCancelaccid(): number;
  GetAccidType(): number;
}

export interface ViewElementKeyAccidLike {
  GetSymbolStr(notationType: number): number[];
  CalcStaffLoc(clef: unknown, clefLocOffset: number): number;
  GetID(): string;
}

export interface ViewElementDocGlyphsLike {
  GetResourcesForModification?(): unknown;
  GetGlyphWidth(code: number, staffSize: number, grace: boolean): number;
  GetGlyphHeight(code: number, staffSize: number, grace: boolean): number;
  GetGlyphLeft(code: number, staffSize: number, grace: boolean): number;
  GetGlyphBottom(code: number, staffSize: number, grace: boolean): number;
  GetGlyphTop(code: number, staffSize: number, grace: boolean): number;
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
  GetDrawingStemWidth(staffSize: number): number;
}

export interface ViewElementStemLike {
  GetDrawingStemDir(): number;
}

export interface ViewElementObjectLike {
  Is(classId: number): boolean;
  GetID(): string;
  GetDrawingX(): number;
  GetDrawingY(): number;
}

export interface ViewControlStartLike {
  GetDrawingX(): number;
  GetDrawingRadius(d: unknown): number;
  GetAlignment(): { GetTime(): unknown };
  Is?(id: number): boolean;
}
export interface ViewControlTextDirLike {
  GetPlace(): number;
  GetNumberOfLines(e: unknown): number;
  AreChildrenAlignedTo(e: unknown, a: number): boolean;
}
