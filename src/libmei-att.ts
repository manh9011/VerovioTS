/**
 * Typed compatibility boundary for libmei's generated att* layer.
 *
 * The generated libmei converter implementation is intentionally not reimplemented
 * here. This mock exposes the exact data-shape contracts consumed by addons/att.cpp;
 * the converter methods are overridable by later migrated attconverter.cpp work.
 */

export type data_VU = number;
export type data_DEGREES = number;
export type data_FONTSIZENUMERIC = number;
export type data_HEXNUM = number;
export type data_MIDIBPM = number;
export type data_MIDICHANNEL = number;
export type data_MIDIMSPB = number;
export type data_MIDIVALUE = number;
export type data_NCNAME = string;
export type data_OCTAVE = number;
export type data_PERCENT = number;
export type data_PERCENT_LIMITED = number;
export type data_PERCENT_LIMITED_SIGNED = number;
export type xsdAnyURI_List = string[];
export type xsdPositiveInteger_List = number[];
export type data_ARTICULATION = number;
export type data_ARTICULATION_List = data_ARTICULATION[];
export type data_BULGE = Array<[number, number]>;
export type data_MEASUREBEAT = [number, number];
export type data_KEYSIGNATURE = [number, data_ACCIDENTAL_WRITTEN];

export enum MeterCountSign { None, Slash, Minus, Asterisk, Plus }
export type data_METERCOUNT_pair = [number[], MeterCountSign];

export enum data_BEATRPT_REND {
  BEATRPT_REND_NONE = 0, BEATRPT_REND_1, BEATRPT_REND_2, BEATRPT_REND_3,
  BEATRPT_REND_4, BEATRPT_REND_5, BEATRPT_REND_mixed,
}
export const { BEATRPT_REND_NONE, BEATRPT_REND_1, BEATRPT_REND_2, BEATRPT_REND_3,
  BEATRPT_REND_4, BEATRPT_REND_5, BEATRPT_REND_mixed } = data_BEATRPT_REND;

export const DURATION_NONE = -2;
export const DURATION_maxima = -1;
export const DURATION_long = 0;
export const DURATION_breve = 1;
export const DURATION_1 = 2;
export const DURATION_2 = 3;
export const DURATION_4 = 4;
export const DURATION_8 = 5;
export const DURATION_16 = 6;
export const DURATION_32 = 7;
export const DURATION_64 = 8;
export const DURATION_128 = 9;
export const DURATION_256 = 10;
export const DURATION_512 = 11;
export const DURATION_1024 = 12;
export const DURATION_longa = 100;
export const DURATION_brevis = 101;
export const DURATION_semibrevis = 102;
export const DURATION_minima = 103;
export const DURATION_semiminima = 104;
export const DURATION_fusa = 105;
export const DURATION_semifusa = 106;
export type data_DURATION = number;

export const MODUSMAIOR_NONE = -3, MODUSMAIOR_2 = 2, MODUSMAIOR_3 = 3;
export const MODUSMINOR_NONE = -3, MODUSMINOR_2 = 2, MODUSMINOR_3 = 3;
export type data_MODUSMAIOR = number;
export type data_MODUSMINOR = number;
export const OCTAVE_DIS_NONE = 0, OCTAVE_DIS_8 = 8, OCTAVE_DIS_15 = 15, OCTAVE_DIS_22 = 22;
export type data_OCTAVE_DIS = number;
export const ORIENTATION_NONE = 0, ORIENTATION_reversed = 1, ORIENTATION_90CW = 2, ORIENTATION_90CCW = 3;
export type data_ORIENTATION = number;
export const PITCHNAME_NONE = 0, PITCHNAME_c = 1, PITCHNAME_d = 2, PITCHNAME_e = 3, PITCHNAME_f = 4, PITCHNAME_g = 5, PITCHNAME_a = 6, PITCHNAME_b = 7;
export type data_PITCHNAME = number;
export const PROLATIO_NONE = -3, PROLATIO_2 = 2, PROLATIO_3 = 3;
export type data_PROLATIO = number;
export const TIE_NONE = 0, TIE_i = 1, TIE_m = 2, TIE_t = 3;
export type data_TIE = number;
export const TEMPUS_NONE = -3, TEMPUS_2 = 2, TEMPUS_3 = 3;
export type data_TEMPUS = number;
export const STAFFREL_NONE = 0, STAFFREL_above = 1, STAFFREL_below = 2, STAFFREL_between = 3, STAFFREL_within = 4;
export type data_STAFFREL = number;
export const STAFFREL_basic_NONE = 0, STAFFREL_basic_above = 1, STAFFREL_basic_below = 2;
export type data_STAFFREL_basic = number;
export const ACCIDENTAL_GESTURAL_NONE = 0, ACCIDENTAL_GESTURAL_s = 1, ACCIDENTAL_GESTURAL_f = 2,
  ACCIDENTAL_GESTURAL_ss = 3, ACCIDENTAL_GESTURAL_ff = 4, ACCIDENTAL_GESTURAL_ts = 5,
  ACCIDENTAL_GESTURAL_tf = 6, ACCIDENTAL_GESTURAL_n = 7, ACCIDENTAL_GESTURAL_su = 8,
  ACCIDENTAL_GESTURAL_sd = 9, ACCIDENTAL_GESTURAL_fu = 10, ACCIDENTAL_GESTURAL_fd = 11;
export type data_ACCIDENTAL_GESTURAL = number;
export const ACCIDENTAL_WRITTEN_NONE = 0, ACCIDENTAL_WRITTEN_s = 1, ACCIDENTAL_WRITTEN_f = 2,
  ACCIDENTAL_WRITTEN_ss = 3, ACCIDENTAL_WRITTEN_x = 4, ACCIDENTAL_WRITTEN_ff = 5,
  ACCIDENTAL_WRITTEN_xs = 6, ACCIDENTAL_WRITTEN_sx = 7, ACCIDENTAL_WRITTEN_ts = 8,
  ACCIDENTAL_WRITTEN_tf = 9, ACCIDENTAL_WRITTEN_n = 10, ACCIDENTAL_WRITTEN_nf = 11,
  ACCIDENTAL_WRITTEN_ns = 12, ACCIDENTAL_WRITTEN_su = 13, ACCIDENTAL_WRITTEN_sd = 14,
  ACCIDENTAL_WRITTEN_fu = 15, ACCIDENTAL_WRITTEN_fd = 16, ACCIDENTAL_WRITTEN_nu = 17,
  ACCIDENTAL_WRITTEN_nd = 18, ACCIDENTAL_WRITTEN_xu = 19, ACCIDENTAL_WRITTEN_xd = 20,
  ACCIDENTAL_WRITTEN_ffu = 21, ACCIDENTAL_WRITTEN_ffd = 22, ACCIDENTAL_WRITTEN_1qf = 23,
  ACCIDENTAL_WRITTEN_3qf = 24, ACCIDENTAL_WRITTEN_1qs = 25, ACCIDENTAL_WRITTEN_3qs = 26;
export type data_ACCIDENTAL_WRITTEN = number;

export const HEADSHAPE_NONE = 0, HEADSHAPE_headShapeList = 1, HEADSHAPE_hexnum = 2;
export const FONTSIZE_NONE = 0, FONTSIZE_fontSizeNumeric = 1, FONTSIZE_term = 2, FONTSIZE_percent = 3;
export const FONTSIZENUMERIC_NONE = 0, FONTSIZENUMERIC_pt = 1, FONTSIZENUMERIC_vu = 2;
export const MEASUREMENTTYPE_NONE = 0, MEASUREMENTTYPE_vu = 1, MEASUREMENTTYPE_px = 2;
export const LINEWIDTHTYPE_NONE = 0, LINEWIDTHTYPE_lineWidthTerm = 1, LINEWIDTHTYPE_measurementunsigned = 2;
export const MIDIVALUENAMETYPE_NONE = 0, MIDIVALUENAMETYPE_midivalue = 1, MIDIVALUENAMETYPE_mcname = 2;
export const MIDIVALUEPANTYPE_NONE = 0, MIDIVALUEPANTYPE_midivalue = 1, MIDIVALUEPANTYPE_percentLimitedSigned = 2;
export const PLACEMENT_NONE = 0, PLACEMENT_staffRel = 1, PLACEMENT_nonStaffPlace = 2, PLACEMENT_nmtoken = 3;

export type data_HEADSHAPE_list = number;
export const HEADSHAPE_list_NONE = 0;
export type data_FONTSIZETERM = number;
export const FONTSIZETERM_NONE = 0;
// Canonical data_FONTSIZETERM ordinals (attconverter.ts / libmei atts_shared.h).
export const FONTSIZETERM_xx_small = 1, FONTSIZETERM_x_small = 2, FONTSIZETERM_small = 3, FONTSIZETERM_normal = 4,
  FONTSIZETERM_large = 5, FONTSIZETERM_x_large = 6, FONTSIZETERM_xx_large = 7, FONTSIZETERM_smaller = 8, FONTSIZETERM_larger = 9;
export type data_LINEWIDTHTERM = number;
export const LINEWIDTHTERM_NONE = 0;
export const data_BOOLEAN_NONE = 0;

export class data_HEADSHAPE {
  private type = HEADSHAPE_NONE; private list = HEADSHAPE_list_NONE; private hexnum = 0;
  Reset(type: number): void { this.type = type; this.list = HEADSHAPE_list_NONE; this.hexnum = 0; }
  GetType(): number { return this.type; } GetHeadShapeList(): number { return this.list; } GetHexnum(): number { return this.hexnum; }
  SetHeadShapeList(v: number): void { this.Reset(HEADSHAPE_headShapeList); this.list = v; }
  SetHexnum(v: number): void { this.Reset(HEADSHAPE_hexnum); this.hexnum = v; }
  HasValue(): boolean { return this.list !== HEADSHAPE_list_NONE || this.hexnum !== 0; }
}
export class data_FONTSIZE {
  private type = FONTSIZE_NONE; private numeric = -0x7fffffff; private numericType = FONTSIZENUMERIC_NONE; private term = FONTSIZETERM_NONE; private percent = 0;
  Reset(type: number): void { this.type = type; this.numeric = -0x7fffffff; this.numericType = FONTSIZENUMERIC_NONE; this.term = FONTSIZETERM_NONE; this.percent = 0; }
  GetType(): number { return this.type; } GetFontSizeNumeric(): number { return this.numeric; } GetFontSizeNumericType(): number { return this.numericType; }
  SetFontSizeNumeric(v: number, t = FONTSIZENUMERIC_pt): void { this.Reset(FONTSIZE_fontSizeNumeric); this.numeric=v; this.numericType=t; }
  GetTerm(): number { return this.term; } SetTerm(v:number):void {this.Reset(FONTSIZE_term);this.term=v;}
  /** C++ libmei/addons/attalternates.h data_FONTSIZE::GetPercentForTerm. */
  GetPercentForTerm(): number {
    switch (this.term) {
      case FONTSIZETERM_xx_large: return 200;
      case FONTSIZETERM_x_large: return 150;
      case FONTSIZETERM_large: return 110;
      case FONTSIZETERM_larger: return 110;
      case FONTSIZETERM_small: return 80;
      case FONTSIZETERM_smaller: return 80;
      case FONTSIZETERM_x_small: return 60;
      case FONTSIZETERM_xx_small: return 50;
      default: return 100;
    }
  }
  GetPercent(): number { return this.percent; } SetPercent(v:number):void {this.Reset(FONTSIZE_percent);this.percent=v;}
  HasValue(): boolean { return this.numeric !== -0x7fffffff || this.term !== FONTSIZETERM_NONE || this.percent !== 0; }
}
export class data_MEASUREMENTSIGNED {
  private type=MEASUREMENTTYPE_NONE; private px=-0x7fffffff; private vu=-0x7fffffff;
  Reset(type:number):void{this.type=type;this.px=-0x7fffffff;this.vu=-0x7fffffff;} GetType():number{return this.type;}
  GetPx():number{return this.px;} SetPx(v:number):void{this.Reset(MEASUREMENTTYPE_px);this.px=v;}
  GetVu():number{return this.vu;} SetVu(v:number):void{this.Reset(MEASUREMENTTYPE_vu);this.vu=v;}
  HasValue():boolean{return this.px!==-0x7fffffff||this.vu!==-0x7fffffff;}
}
export type data_MEASUREMENTUNSIGNED = data_MEASUREMENTSIGNED;
export class data_LINEWIDTH {
  private type=LINEWIDTHTYPE_NONE; private term=LINEWIDTHTERM_NONE; private measurement=new data_MEASUREMENTSIGNED();
  Reset(type:number):void{this.type=type;this.term=LINEWIDTHTERM_NONE;this.measurement=new data_MEASUREMENTSIGNED();} GetType():number{return this.type;}
  GetLineWithTerm():number{return this.term;} SetLineWidthTerm(v:number):void{this.Reset(LINEWIDTHTYPE_lineWidthTerm);this.term=v;}
  GetMeasurementunsigned():data_MEASUREMENTSIGNED{return this.measurement;} SetMeasurementunsigned(v:data_MEASUREMENTSIGNED):void{this.Reset(LINEWIDTHTYPE_measurementunsigned);this.measurement=v;}
  HasValue():boolean{return this.term!==LINEWIDTHTERM_NONE||this.measurement.HasValue();}
}
export class data_MIDIVALUE_NAME { private type=0; private midi=-1; private name=''; GetType():number{return this.type;} GetMidivalue():number{return this.midi;} GetNcname():string{return this.name;} SetMidivalue(v:number):void{this.type=1;this.midi=v;this.name='';} SetNcname(v:string):void{this.type=2;this.midi=-1;this.name=v;} HasValue():boolean{return this.midi!==-1||this.name!=='';} }
export class data_MIDIVALUE_PAN { private type=0; private midi=-1; private percent=-0x7fffffff; GetType():number{return this.type;} GetMidivalue():number{return this.midi;} GetPercentLimitedSigned():number{return this.percent;} SetMidivalue(v:number):void{this.type=1;this.midi=v;this.percent=-0x7fffffff;} SetPercentLimitedSigned(v:number):void{this.type=2;this.midi=-1;this.percent=v;} HasValue():boolean{return this.midi!==-1||this.percent!==-0x7fffffff;} }
export class data_PLACEMENT { private type=0; private staffRel=STAFFREL_NONE; private nonStaffPlace=0; private token=''; GetType():number{return this.type;} GetStaffRel():number{return this.staffRel;} GetNonStaffPlace():number{return this.nonStaffPlace;} GetNMToken():string{return this.token;} SetStaffRel(v:number):void{this.type=1;this.staffRel=v;this.nonStaffPlace=0;this.token='';} SetNonStaffPlace(v:number):void{this.type=2;this.staffRel=0;this.nonStaffPlace=v;this.token='';} SetNMToken(v:string):void{this.type=3;this.staffRel=0;this.nonStaffPlace=0;this.token=v;} HasValue():boolean{return this.staffRel!==STAFFREL_NONE||this.nonStaffPlace!==0||this.token!=='';} }

/** Backward-compatible re-export; the canonical converter now lives in ./attconverter. */
export { AttConverterBase } from './attconverter';

// Analytical generated-libmei enum contracts.
export const harmAnl_FORM_NONE = 0, harmAnl_FORM_explicit = 1, harmAnl_FORM_implied = 2;
export type harmAnl_FORM = number;
export const MELODICFUNCTION_NONE = 0;
export type data_MELODICFUNCTION = number;
export const MODE_NONE = 0;
export type data_MODE = number;
export const ACCIDENTAL_GESTURAL_basic_NONE = 0;
export type data_ACCIDENTAL_GESTURAL_basic = number;
