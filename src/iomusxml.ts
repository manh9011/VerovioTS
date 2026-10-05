/**
 * iomusxml.ts — MusicXML input converters (part 1: pure value converters).
 *
 * Pass 356r: first slice of src-cpp/src/iomusxml.cpp. Covers the dependency-free
 * static converter block (ConvertBeamFanToForm → MidiToPitch) plus the tiny
 * MordentExtSymbolFlags bitmask enum. Every map/branch preserves C++ semantics:
 * - std::map find misses return sentinel WITHOUT warning except where C++ logs
 *   (ConvertAccidentalToAccid, ConvertStyleToRend, ConvertTypeToDur,
 *   ConvertTypeToVerovioText, ConvertStepToPitchName, ConvertPedalTypeToDir).
 * - The C++ Alter2Accid map contains TWO entries for key 2 (ss, then ts);
 *   std::map keeps the FIRST inserted pair, so 2 → ss. Preserved.
 * - PitchAlterToString uses (pname - 1 + ('C'-'A')) % 7 + 'A' exactly.
 * - ConvertDynamicsToMidiVal: dynamics > 0 → clamp(int(d*90/100+0.5),1,127) else 0.
 * - MidiToPitch prefers B flat over A sharp (index 10 = B,-1).
 *
 * Enum ordinals are canonical atttypes.h values. attconverter.ts keeps them
 * module-local, and ./libmei-att.ts only exports a subset, so ordinals
 * needed here are declared locally (same pattern as iopae.ts BARRENDITION_*).
 * data_HEADSHAPE comes from the mock (SetHexnum/SetHeadShapeList parity).
 */

import { LogDebug, LogError, GetVersion, LogWarning, UTF8to32 } from './vrv.js';
import { Measure } from './measure.js';
import { Staff } from './staff.js';
import { Layer } from './layer.js';
import { LayerElement } from './layerelement.js';
import { MultiRest } from './multirest.js';
import { MSpace } from './mspace.js';
import { MNum } from './mnum.js';
import { Space } from './space.js';
import { Tie } from './tie.js';
import { BarLine } from './barline.js';
import { Note } from './note.js';
import { ScoreDef } from './scoredef.js';
import { AttNNumberLikeComparison } from './comparison.js';
import { data_HEADSHAPE, data_MEASUREMENTSIGNED, data_MIDIVALUE, type data_PITCHNAME, MeterCountSign } from './libmei-att.js';
import { Input, type DocLike } from './iobase.js';
import { Fraction } from './fraction.js';
import { DocType } from './doc.js';
import { xml_document, xml_node, xml_node_type } from './pugixml.js';
import { VrvObject } from './object.js';
import { Mdiv } from './mdiv.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Ending } from './ending.js';
import { Expansion } from './expansion.js';
import { Pb } from './pb.js';
import { PgHead } from './pghead.js';
import { PgFoot } from './pgfoot.js';
import { Rend } from './rend.js';
import { Text } from './text.js';
import { StaffGrp } from './staffgrp.js';
import { AttConverterBase } from './attconverter.js';
import { LayoutInformation } from './vrvdef.js';
import { PGFUNC_first } from './page.js';
import { VisibilityType } from './vrvdef.js';
import { Clef } from './clef.js';
import { KeySig } from './keysig.js';
import { KeyAccid } from './keyaccid.js';
import { Att as AttBase } from './att.js';
import { Tuning } from './tuning.js';
import { Course } from './course.js';
import { StaffDef } from './staffdef.js';
import { MeterSig } from './metersig.js';
import { MeterSigGrp } from './metersiggrp.js';
import { AttNIntegerComparison } from './comparison.js';
import { Label } from './label.js';
import { LabelAbbr } from './labelabbr.js';
import { Lb } from './lb.js';
import { InstrDef } from './instrdef.js';
import { GrpSym } from './grpsym.js';
import { StringFormat } from './vrv.js';
import { OCTAVE_DIS_8, OCTAVE_DIS_15, OCTAVE_DIS_22, STAFFREL_basic_above, STAFFREL_basic_below } from './libmei-att.js';
import { Accid } from './accid.js';
import { Artic } from './artic.js';
import { Beam } from './beam.js';
import { BeamSpan } from './beamspan.js';
import { BTrem } from './btrem.js';
import { Breath } from './breath.js';
import { Caesura } from './caesura.js';
import { Chord } from './chord.js';
import { Arpeg } from './arpeg.js';
import { BeatRpt } from './beatrpt.js';
import { Symbol } from './symbol.js';
import { BracketSpan } from './bracketspan.js';
import { Dir } from './dir.js';
import { Hairpin } from './hairpin.js';
import { Octave } from './octave.js';
import { Pedal } from './pedal.js';
import { Reh } from './reh.js';
import { Tempo } from './tempo.js';
import { Harm } from './harm.js';
import { F } from './f.js';
import { Fb } from './fb.js';
import { Sb } from './sb.js';
import { ControlElement } from './controlelement.js';
import { RepeatMark } from './repeatmark.js';
import { LogInfo } from './vrv.js';
import { Dynam } from './dynam.js';
import { Fing } from './fing.js';
import { Fermata } from './fermata.js';
import { FTrem } from './ftrem.js';
import { Gliss } from './gliss.js';
import { Lv } from './lv.js';
import { MRest } from './mrest.js';
import { MSpace as MSpaceEl } from './mspace.js';
import { MRpt } from './mrpt.js';
import { Mordent } from './mordent.js';
import { Rest } from './rest.js';
import { Slur } from './slur.js';
import { Space as SpaceEl } from './space.js';
import { Syl } from './syl.js';
import { TabDurSym } from './tabdursym.js';
import { TabGrp } from './tabgrp.js';
import { Trill } from './trill.js';
import { Tuplet } from './tuplet.js';
import { Turn } from './turn.js';
import { Verse } from './verse.js';
import { CustomTuning } from './customtuning.js';
import { PitchInterface } from './pitchinterface.js';
import { Att as AttLib } from './att.js';

// Local canonical ordinals (attconverter.ts values are module-local).
export const CLEFSHAPE_G = 1, CLEFSHAPE_GG = 2, CLEFSHAPE_F = 3, CLEFSHAPE_C = 4,
  CLEFSHAPE_perc = 5, CLEFSHAPE_TAB = 6;
export const CANCELACCID_before = 2;
export const NOTATIONTYPE_tab_guitar = 10, NOTATIONTYPE_tab_lute_french = 11, NOTATIONTYPE_tab_lute_italian = 12;
export const METERFORM_num = 1, METERFORM_norm = 3, METERSIGN_open = 3;
export const meterSigGrpLog_FUNC_interchanging = 2, meterSigGrpLog_FUNC_mixed = 3;
export const staffGroupingSym_SYMBOL_brace = 1, staffGroupingSym_SYMBOL_bracket = 2,
  staffGroupingSym_SYMBOL_bracketsq = 3, staffGroupingSym_SYMBOL_line = 4;
export const BARMETHOD_mensur = 1;
import { DURATION_NONE, DURATION_maxima, DURATION_long, DURATION_breve, DURATION_1, DURATION_2,
  DURATION_4, DURATION_8, DURATION_16, DURATION_32, DURATION_64, DURATION_128,
  DURATION_256, DURATION_512, DURATION_1024, type data_DURATION,
  ClassId, UNLIMITED_DEPTH, BACKWARD,
} from './vrvdef.js';
import { PITCHNAME_NONE, PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b } from './pitchinterface.js';

const ATT = new AttBase();
function strToIntList(v: string): number[] { return ATT.StrToXsdPositiveIntegerList(v); }
function hexnumToInt(v: string): number { return ATT.StrToHexnum(v); }
function accGesToWritten(v: number): number { return AttBase.AccidentalGesturalToWritten(v); }
function accWrittenToGes(v: number): number { return AttBase.AccidentalWrittenToGestural(v); }

// Shared AttConverterBase instance (static-method shape in C++).
const AC = new AttConverterBase();
function strToStaffrel(v: string): number { return AC.StrToStaffrel(v); }
function strToStaffrelBasic(v: string): number { return AC.StrToStaffrelBasic(v); }
function strToLineform(v: string): number { return AC.StrToLineform(v); }
function strToFontstyle(v: string): number { return AC.StrToFontstyle(v); }
function strToFontweight(v: string): number { return AC.StrToFontweight(v); }
function strToStemmodifier(v: string): number { return AC.StrToStemmodifier(v); }

// Mordent bitmask flags (iomusxml.cpp enum MordentExtSymbolFlags).
export const APPR_Above = 0x100, APPR_Below = 0x200;
export const FORM_Normal = 0x10, FORM_Inverted = 0x20;
export const DEP_Above = 0x1, DEP_Below = 0x2;

// Canonical libmei ordinals (atttypes.h) for converters below.
export const ACCIDENTAL_WRITTEN_NONE = 0, ACCIDENTAL_WRITTEN_s = 1, ACCIDENTAL_WRITTEN_f = 2,
  ACCIDENTAL_WRITTEN_ss = 3, ACCIDENTAL_WRITTEN_x = 4, ACCIDENTAL_WRITTEN_ff = 5,
  ACCIDENTAL_WRITTEN_ts = 8, ACCIDENTAL_WRITTEN_tf = 9, ACCIDENTAL_WRITTEN_n = 10,
  ACCIDENTAL_WRITTEN_nf = 11, ACCIDENTAL_WRITTEN_ns = 12, ACCIDENTAL_WRITTEN_su = 13,
  ACCIDENTAL_WRITTEN_sd = 14, ACCIDENTAL_WRITTEN_fu = 15, ACCIDENTAL_WRITTEN_fd = 16,
  ACCIDENTAL_WRITTEN_nd = 18, ACCIDENTAL_WRITTEN_nu = 17, ACCIDENTAL_WRITTEN_xu = 19,
  ACCIDENTAL_WRITTEN_xd = 20, ACCIDENTAL_WRITTEN_ffu = 21, ACCIDENTAL_WRITTEN_ffd = 22,
  ACCIDENTAL_WRITTEN_1qf = 23, ACCIDENTAL_WRITTEN_3qf = 24, ACCIDENTAL_WRITTEN_1qs = 25,
  ACCIDENTAL_WRITTEN_3qs = 26, ACCIDENTAL_WRITTEN_bms = 27, ACCIDENTAL_WRITTEN_ks = 30,
  ACCIDENTAL_WRITTEN_kf = 31, ACCIDENTAL_WRITTEN_bf = 32, ACCIDENTAL_WRITTEN_bmf = 34,
  ACCIDENTAL_WRITTEN_koron = 35, ACCIDENTAL_WRITTEN_sori = 36;
export type data_ACCIDENTAL_WRITTEN = number;
export const ACCIDENTAL_GESTURAL_NONE = 0, ACCIDENTAL_GESTURAL_s = 1, ACCIDENTAL_GESTURAL_f = 2,
  ACCIDENTAL_GESTURAL_ss = 3, ACCIDENTAL_GESTURAL_ff = 4, ACCIDENTAL_GESTURAL_ts = 5,
  ACCIDENTAL_GESTURAL_tf = 6, ACCIDENTAL_GESTURAL_n = 7, ACCIDENTAL_GESTURAL_su = 8,
  ACCIDENTAL_GESTURAL_sd = 9, ACCIDENTAL_GESTURAL_fu = 10, ACCIDENTAL_GESTURAL_fd = 11,
  ACCIDENTAL_GESTURAL_xu = 12, ACCIDENTAL_GESTURAL_ffd = 13;
export type data_ACCIDENTAL_GESTURAL = number;
export const ARTICULATION_NONE = 0, ARTICULATION_acc = 1, ARTICULATION_acc_soft = 4,
  ARTICULATION_stacc = 5, ARTICULATION_ten = 6, ARTICULATION_stacciss = 7, ARTICULATION_marc = 8,
  ARTICULATION_spicc = 9, ARTICULATION_doit = 12, ARTICULATION_scoop = 13, ARTICULATION_plop = 15,
  ARTICULATION_fall = 16, ARTICULATION_bend = 18, ARTICULATION_dnbow = 22, ARTICULATION_upbow = 23,
  ARTICULATION_harm = 24, ARTICULATION_snap = 25, ARTICULATION_fingernail = 26,
  ARTICULATION_open = 29, ARTICULATION_stop = 30, ARTICULATION_dbltongue = 31,
  ARTICULATION_trpltongue = 32, ARTICULATION_heel = 33, ARTICULATION_toe = 34;
export type data_ARTICULATION = number;
export const BARRENDITION_NONE = 0, BARRENDITION_dashed = 1, BARRENDITION_dotted = 2,
  BARRENDITION_dbl = 3, BARRENDITION_dblheavy = 6, BARRENDITION_end = 8, BARRENDITION_heavy = 9,
  BARRENDITION_invis = 10, BARRENDITION_rptstart = 11, BARRENDITION_rptend = 13,
  BARRENDITION_single = 15;
export type data_BARRENDITION = number;
export const BOOLEAN_NONE = 0, BOOLEAN_true = 1, BOOLEAN_false = 2;
export type data_BOOLEAN = number;
// Extra canonical ordinals used by ReadMusicXmlNote.
export const STEMARMODIFIER_s = 0, STEMMODIFIER_1slash = 2, STEMMODIFIER_z = 9;
export const STEMDIRECTION_NONE = 0, STEMDIRECTION_up = 1, STEMDIRECTION_down = 2;
export const GRACE_NONE = 0, GRACE_acc = 1, GRACE_unacc = 2;
export const CLUSTER_white = 1;
// Canonical data_FILL ordinals (atttypes.h:682-684: NONE=0, void=1, solid=2).
// A wrong local 0/1 pair made filled="no" equal FILL_NONE and drop head.fill.
export const FILL_void = 1, FILL_solid = 2;
// Canonical data_NOTEHEADMODIFIER ordinals (atttypes.h:1406-1417: paren=6).
export const NOTEHEADMODIFIER_paren = 6;
// Canonical libmei ordinals (atttypes.h); shared with serialization and lyric layout.
export const sylLog_WORDPOS_s = 3, sylLog_WORDPOS_i = 1, sylLog_WORDPOS_m = 2, sylLog_WORDPOS_t = 4;
export const sylLog_CON_s = 1, sylLog_CON_d = 2, sylLog_CON_u = 3, sylLog_CON_b = 8;
export const arpegLog_ORDER_NONE = 0, arpegLog_ORDER_up = 1, arpegLog_ORDER_down = 2, arpegLog_ORDER_nonarp = 3;
export const turnLog_FORM_lower = 1, turnLog_FORM_upper = 2;
export const mordentLog_FORM_lower = 1, mordentLog_FORM_upper = 2;
export const tremForm_FORM_meas = 1, tremForm_FORM_unmeas = 2;
export const accidLog_FUNC_caution = 1, accidLog_FUNC_edit = 2;
export const fermataVis_FORM_norm = 2, fermataVis_FORM_inv = 1;
export const NOTATIONTYPE_tab = 9, NOTATIONTYPE_tab_lute_german = 13;
export const STAFFREL_above = 1, STAFFREL_below = 2;
export const TEXTRENDITION_line_through = 15;
export const ENCLOSURE_paren = 1, ENCLOSURE_brack = 2;
export const TEXTRENDITION_NONE = 0, TEXTRENDITION_box = 9, TEXTRENDITION_circle = 10,
  TEXTRENDITION_dbox = 11, TEXTRENDITION_tbox = 12, TEXTRENDITION_none = 16;
export type data_TEXTRENDITION = number;
export const HEADSHAPE_list_NONE = 0, HEADSHAPE_list_circle = 5, HEADSHAPE_list_diamond = 7,
  HEADSHAPE_list_isotriangle = 8, HEADSHAPE_list_plus = 6, HEADSHAPE_list_rtriangle = 12,
  HEADSHAPE_list_slash = 14, HEADSHAPE_list_square = 15, HEADSHAPE_list_x = 16;
export const LINESTARTENDSYMBOL_NONE = 0, LINESTARTENDSYMBOL_angledown = 1,
  LINESTARTENDSYMBOL_angleup = 2, LINESTARTENDSYMBOL_arrow = 5, LINESTARTENDSYMBOL_H = 10,
  LINESTARTENDSYMBOL_N = 11, LINESTARTENDSYMBOL_none = 20;
export type data_LINESTARTENDSYMBOL = number;

// Local ordinals (libmei atttypes.h; not exported by attconverter.ts).
const LINEFORM_dashed = 1;
const hairpinLog_FORM_cres = 1;
const hairpinLog_FORM_dim = 2;
const bracketSpanLog_FUNC_analytical = 4;
const bracketSpanLog_FUNC_uspecified = 6;
const HORIZONTALALIGNMENT_right = 2;
export const beamRend_FORM_NONE = 0, beamRend_FORM_acc = 1, beamRend_FORM_rit = 3,
  beamRend_FORM_norm = 4;
export type beamRend_FORM = number;
export const curvature_CURVEDIR_NONE = 0, curvature_CURVEDIR_above = 1,
  curvature_CURVEDIR_below = 2, curvature_CURVEDIR_mixed = 3;
export type curvature_CURVEDIR = number;
export const fermataVis_SHAPE_NONE = 0, fermataVis_SHAPE_curved = 1,
  fermataVis_SHAPE_square = 2, fermataVis_SHAPE_angular = 3;
export type fermataVis_SHAPE = number;
export const pedalLog_DIR_NONE = 0, pedalLog_DIR_down = 1, pedalLog_DIR_up = 2,
  pedalLog_DIR_bounce = 4;
export type pedalLog_DIR = number;
export const repeatMarkLog_FUNC_NONE = 0, repeatMarkLog_FUNC_coda = 1,
  repeatMarkLog_FUNC_segno = 2;
export type repeatMarkLog_FUNC = number;
export const tupletVis_NUMFORMAT_NONE = 0, tupletVis_NUMFORMAT_count = 1,
  tupletVis_NUMFORMAT_ratio = 2;
export type tupletVis_NUMFORMAT = number;

export function ConvertBeamFanToForm(value: string): beamRend_FORM {
  if (value === 'accel') return beamRend_FORM_acc;
  if (value === 'none') return beamRend_FORM_norm;
  if (value === 'rit') return beamRend_FORM_rit;
  return beamRend_FORM_NONE;
}

export function CombineCurvedir(startDir: curvature_CURVEDIR, stopDir: curvature_CURVEDIR): curvature_CURVEDIR {
  if (startDir === curvature_CURVEDIR_NONE) return stopDir;
  if (startDir !== stopDir && stopDir !== curvature_CURVEDIR_NONE) return curvature_CURVEDIR_mixed;
  return startDir;
}

export function PitchAlterToString(pname: data_PITCHNAME, alter: number): string {
  // ponytail: C++ char arithmetic (pname-1+('C'-'A'))%7+'A'; TS keeps numeric steps.
  const noteName = String.fromCharCode(((pname - 1 + ('C'.charCodeAt(0) - 'A'.charCodeAt(0))) % 7) + 'A'.charCodeAt(0));
  return noteName + String(alter);
}

const Accidental2Accid: Record<string, data_ACCIDENTAL_WRITTEN> = {
  'sharp': ACCIDENTAL_WRITTEN_s, 'natural': ACCIDENTAL_WRITTEN_n, 'flat': ACCIDENTAL_WRITTEN_f,
  'double-sharp': ACCIDENTAL_WRITTEN_x, 'sharp-sharp': ACCIDENTAL_WRITTEN_ss,
  'flat-flat': ACCIDENTAL_WRITTEN_ff, 'natural-sharp': ACCIDENTAL_WRITTEN_ns,
  'natural-flat': ACCIDENTAL_WRITTEN_nf, 'quarter-flat': ACCIDENTAL_WRITTEN_1qf,
  'quarter-sharp': ACCIDENTAL_WRITTEN_1qs, 'three-quarters-flat': ACCIDENTAL_WRITTEN_3qf,
  'three-quarters-sharp': ACCIDENTAL_WRITTEN_3qs, 'sharp-down': ACCIDENTAL_WRITTEN_sd,
  'sharp-up': ACCIDENTAL_WRITTEN_su, 'natural-down': ACCIDENTAL_WRITTEN_nd,
  'natural-up': ACCIDENTAL_WRITTEN_nu, 'flat-down': ACCIDENTAL_WRITTEN_fd,
  'flat-up': ACCIDENTAL_WRITTEN_fu, 'double-sharp-down': ACCIDENTAL_WRITTEN_xd,
  'double-sharp-up': ACCIDENTAL_WRITTEN_xu, 'flat-flat-down': ACCIDENTAL_WRITTEN_ffd,
  'flat-flat-up': ACCIDENTAL_WRITTEN_ffu, 'triple-sharp': ACCIDENTAL_WRITTEN_ts,
  'triple-flat': ACCIDENTAL_WRITTEN_tf, 'slash-quarter-sharp': ACCIDENTAL_WRITTEN_bms,
  'slash-sharp': ACCIDENTAL_WRITTEN_ks, 'slash-flat': ACCIDENTAL_WRITTEN_bf,
  'double-slash-flat': ACCIDENTAL_WRITTEN_bmf, 'sori': ACCIDENTAL_WRITTEN_sori,
  'koron': ACCIDENTAL_WRITTEN_koron, 'other': ACCIDENTAL_WRITTEN_NONE,
};

export function ConvertAccidentalToAccid(value: string): data_ACCIDENTAL_WRITTEN {
  if (value in Accidental2Accid) return Accidental2Accid[value];
  LogWarning("MusicXML import: Unsupported accidental value '%s'", value);
  return ACCIDENTAL_WRITTEN_NONE;
}

// C++ std::map<float,...> with duplicate key 2 (ss then ts): first wins → ss.
const Alter2Accid: Array<[number, data_ACCIDENTAL_GESTURAL]> = [
  [-3, ACCIDENTAL_GESTURAL_tf], [-2.5, ACCIDENTAL_GESTURAL_ffd], [-2, ACCIDENTAL_GESTURAL_ff],
  [-1.5, ACCIDENTAL_GESTURAL_fd], [-1, ACCIDENTAL_GESTURAL_f], [-0.5, ACCIDENTAL_GESTURAL_fu],
  [0, ACCIDENTAL_GESTURAL_n], [0.5, ACCIDENTAL_GESTURAL_sd], [1, ACCIDENTAL_GESTURAL_s],
  [1.5, ACCIDENTAL_GESTURAL_su], [2, ACCIDENTAL_GESTURAL_ss], [2.5, ACCIDENTAL_GESTURAL_xu],
];

export function ConvertAlterToAccid(value: number): data_ACCIDENTAL_GESTURAL {
  for (const [k, v] of Alter2Accid) { if (k === value) return v; }
  return ACCIDENTAL_GESTURAL_NONE;
}

const Articulations2Id: Record<string, data_ARTICULATION> = {
  'accent': ARTICULATION_acc, 'detached-legato': ARTICULATION_stacc, 'doit': ARTICULATION_doit,
  'falloff': ARTICULATION_fall, 'plop': ARTICULATION_plop, 'scoop': ARTICULATION_scoop,
  'soft-accent': ARTICULATION_acc_soft, 'spiccato': ARTICULATION_spicc,
  'staccatissimo': ARTICULATION_stacciss, 'staccato': ARTICULATION_stacc,
  'strong-accent': ARTICULATION_marc, 'tenuto': ARTICULATION_ten, 'bend': ARTICULATION_bend,
  'double-tongue': ARTICULATION_dbltongue, 'down-bow': ARTICULATION_dnbow,
  'fingernails': ARTICULATION_fingernail, 'harmonic': ARTICULATION_harm, 'heel': ARTICULATION_heel,
  'open-string': ARTICULATION_open, 'snap-pizzicato': ARTICULATION_snap, 'stopped': ARTICULATION_stop,
  'toe': ARTICULATION_toe, 'triple-tongue': ARTICULATION_trpltongue, 'up-bow': ARTICULATION_upbow,
};

export function ConvertArticulations(value: string): data_ARTICULATION {
  if (value in Articulations2Id) return Articulations2Id[value];
  return ARTICULATION_NONE;
}

export function ConvertStyleToRend(value: string, repeat: boolean): data_BARRENDITION {
  if (value === 'dashed') return BARRENDITION_dashed;
  if (value === 'dotted') return BARRENDITION_dotted;
  if (value === 'light-light') return BARRENDITION_dbl;
  if (value === 'heavy-heavy') return BARRENDITION_dblheavy;
  if (value === 'light-heavy' && !repeat) return BARRENDITION_end;
  if (value === 'heavy') return BARRENDITION_heavy;
  if (value === 'none') return BARRENDITION_invis;
  if (value === 'heavy-light' && repeat) return BARRENDITION_rptstart;
  if (value === 'light-heavy' && repeat) return BARRENDITION_rptend;
  if (value === 'regular') return BARRENDITION_single;
  if (value === 'short') return BARRENDITION_single;
  if (value === 'tick') return BARRENDITION_single;
  LogWarning("MusicXML import: Unsupported bar-style '%s'", value);
  return BARRENDITION_NONE;
}

export function ConvertWordToBool(value: string): data_BOOLEAN {
  if (value === 'yes') return BOOLEAN_true;
  if (value === 'no') return BOOLEAN_false;
  return BOOLEAN_NONE;
}

const Type2Dur: Record<string, data_DURATION> = {
  'maxima': DURATION_maxima, 'long': DURATION_long, 'breve': DURATION_breve,
  'whole': DURATION_1, 'half': DURATION_2, 'quarter': DURATION_4, 'eighth': DURATION_8,
  '16th': DURATION_16, '32nd': DURATION_32, '64th': DURATION_64, '128th': DURATION_128,
  '256th': DURATION_256, '512th': DURATION_512, '1024th': DURATION_1024,
};

export function ConvertTypeToDur(value: string): data_DURATION {
  if (value in Type2Dur) return Type2Dur[value];
  LogWarning("MusicXML import: Unsupported note-type-value '%s'", value);
  return DURATION_NONE;
}

const Name2Jump: Record<string, repeatMarkLog_FUNC> = {
  'coda': repeatMarkLog_FUNC_coda, 'segno': repeatMarkLog_FUNC_segno,
};

export function ConvertJumpType(value: string): repeatMarkLog_FUNC {
  if (value in Name2Jump) return Name2Jump[value];
  return repeatMarkLog_FUNC_NONE;
}

/** C++ iomusxml.cpp 1311-1322 — parse "1,2,3" style lists. */
export function parseIntsList(value: string): number[] {
  const result: number[] = [];
  for (const token of value.split(',')) {
    const n = Number.parseInt(token.trim(), 10);
    if (!Number.isNaN(n)) result.push(n);
  }
  return result;
}

/** C++ ConvertDegreeToText 5038-5111 (iomusxml.cpp). */
export function ConvertDegreeToText(node: xml_node): string {
  const Kind2FirstAddable: Record<string, number> = {
    'major': 9, 'minor': 9, 'augmented': 9, 'diminished': 9,
    'dominant': 11, 'major-seventh': 11, 'minor-seventh': 11, 'diminished-seventh': 11,
    'augmented-seventh': 11, 'half-diminished': 11, 'major-minor': 11, 'major-sixth': 11,
    'minor-sixth': 11, 'suspended-second': 11, 'suspended-fourth': 9, 'power': 7,
  };
  let degreeText = '';
  for (let degree = node.child('degree'); !degree.empty(); degree = degree.next_sibling('degree')) {
    if (degreeText === '') degreeText = '(';
    const typeNode = degree.child('degree-type');
    const type = typeNode.text().as_string();
    const valueNode = degree.child('degree-value');
    if (valueNode.empty()) {
      degreeText += '?';
      continue;
    }
    const degreeValue = valueNode.text().as_string();
    if (!typeNode.attribute('text').empty()) {
      degreeText += typeNode.attribute('text').as_string();
    }
    else if (type === 'subtract') {
      degreeText += 'no';
    }
    else if (type === 'add') {
      const kind = node.child('kind').text().as_string();
      const firstAddable = Kind2FirstAddable[kind];
      if (firstAddable !== undefined && Number.parseInt(degreeValue, 10) >= firstAddable) {
        degreeText += 'add';
      }
    }
    const alterNode = degree.child('degree-alter');
    const alter = alterNode.text().as_string();
    if (alter !== '0') {
      const plusMinus = alterNode.attribute('plus-minus').as_string();
      degreeText += ConvertAlterToSymbol(alter, plusMinus === 'yes');
    }
    degreeText += degreeValue;
  }
  if (degreeText !== '') degreeText += ')';
  return degreeText;
}

const Enclosure2Id: Record<string, data_TEXTRENDITION> = {
  'rectangle': TEXTRENDITION_box, 'square': TEXTRENDITION_box, 'oval': TEXTRENDITION_circle,
  'circle': TEXTRENDITION_circle, 'triangle': TEXTRENDITION_tbox, 'diamond': TEXTRENDITION_dbox,
  'none': TEXTRENDITION_none,
};

export function ConvertEnclosure(value: string): data_TEXTRENDITION {
  if (value in Enclosure2Id) return Enclosure2Id[value];
  return TEXTRENDITION_NONE;
}

const Type2VerovioText: Record<string, number[]> = {
  'breve': UTF8to32('\uECA0'), 'whole': UTF8to32('\uECA2'), 'half': UTF8to32('\uECA3'),
  'quarter': UTF8to32('\uECA5'), 'eighth': UTF8to32('\uECA7'), '16th': UTF8to32('\uECA9'),
  '32nd': UTF8to32('\uECAB'), '64th': UTF8to32('\uECAD'), '128th': UTF8to32('\uECAF'),
  '256th': UTF8to32('\uECB1'), '512th': UTF8to32('\uECB3'), '1024th': UTF8to32('\uECB5'),
};

export function ConvertTypeToVerovioText(value: string): number[] {
  if (value in Type2VerovioText) return Type2VerovioText[value];
  LogWarning("MusicXML import: Unsupported type '%s'", value);
  return [];
}

// ponytail: 6.3.0 oracle exports triangle as rtriangle; switch to isotriangle
// (repo dev iomusxml.cpp:4772) when upgrading the parity oracle.
const Notehead2Id: Record<string, number> = {
  'slash': HEADSHAPE_list_slash, 'triangle': HEADSHAPE_list_rtriangle,
  'diamond': HEADSHAPE_list_diamond, 'square': HEADSHAPE_list_square, 'cross': HEADSHAPE_list_plus,
  'x': HEADSHAPE_list_x, 'inverted triangle': HEADSHAPE_list_slash, 'arrow down': HEADSHAPE_list_slash,
  'arrow up': HEADSHAPE_list_slash, 'circle dot': HEADSHAPE_list_circle,
};

export function ConvertNotehead(value: string): data_HEADSHAPE {
  const hs = new data_HEADSHAPE();
  // ponytail: repo dev C++ (iomusxml.cpp:4784) maps circle-x to hexnum U+E0B3, but
  // the 6.3.0 oracle maps it to the slash list (measured: WASM MEI exports
  // head.shape="slash" and renders E101). Parity target is the oracle; switch to
  // SetHexnum(E0B3) when the oracle catches up with the dev source.
  if (value === 'circle-x') {
    hs.SetHeadShapeList(HEADSHAPE_list_slash);
    return hs;
  }
  if (value in Notehead2Id) hs.SetHeadShapeList(Notehead2Id[value]);
  return hs;
}

const LineEndSymbol2Id: Record<string, data_LINESTARTENDSYMBOL> = {
  'up': LINESTARTENDSYMBOL_angleup, 'down': LINESTARTENDSYMBOL_angledown,
  'arrow': LINESTARTENDSYMBOL_arrow, 'Hauptstimme': LINESTARTENDSYMBOL_H,
  'Nebenstimme': LINESTARTENDSYMBOL_N, 'none': LINESTARTENDSYMBOL_none,
  'plain': LINESTARTENDSYMBOL_NONE,
};

export function ConvertLineEndSymbol(value: string): data_LINESTARTENDSYMBOL {
  if (value in LineEndSymbol2Id) return LineEndSymbol2Id[value];
  return LINESTARTENDSYMBOL_NONE;
}

export function ConvertDynamicsToMidiVal(dynamics: number): data_MIDIVALUE {
  if (dynamics > 0.0) {
    const mididynam = Math.trunc(dynamics * 90.0 / 100.0 + 0.5);
    return Math.max(1, Math.min(127, mididynam));
  }
  return 0;
}

const Step2PitchName: Record<string, data_PITCHNAME> = {
  'C': PITCHNAME_c, 'D': PITCHNAME_d, 'E': PITCHNAME_e, 'F': PITCHNAME_f,
  'G': PITCHNAME_g, 'A': PITCHNAME_a, 'B': PITCHNAME_b,
};

export function ConvertStepToPitchName(value: string): data_PITCHNAME {
  if (value in Step2PitchName) return Step2PitchName[value];
  LogWarning("MusicXML import: Unsupported step value '%s'", value);
  return PITCHNAME_NONE;
}

const FermataShape2Id: Record<string, fermataVis_SHAPE> = {
  'normal': fermataVis_SHAPE_curved, 'angled': fermataVis_SHAPE_angular,
  'square': fermataVis_SHAPE_square, 'double-angled': fermataVis_SHAPE_angular,
  'double-square': fermataVis_SHAPE_square,
};

export function ConvertFermataShape(value: string): fermataVis_SHAPE {
  if (value in FermataShape2Id) return FermataShape2Id[value];
  return fermataVis_SHAPE_NONE;
}

const PedalType2Dir: Record<string, pedalLog_DIR> = {
  'start': pedalLog_DIR_down, 'stop': pedalLog_DIR_up,
  'sostenuto': pedalLog_DIR_down, 'change': pedalLog_DIR_bounce,
};

export function ConvertPedalTypeToDir(value: string): pedalLog_DIR {
  if (value in PedalType2Dir) return PedalType2Dir[value];
  LogWarning("MusicXML import: Unsupported type '%s' for pedal", value);
  return pedalLog_DIR_NONE;
}

export function ConvertTupletNumberValue(value: string): tupletVis_NUMFORMAT {
  if (value === 'actual') return tupletVis_NUMFORMAT_count;
  if (value === 'both') return tupletVis_NUMFORMAT_ratio;
  return tupletVis_NUMFORMAT_NONE;
}

const Alter2Symbol: Record<string, string> = {
  '-2': '𝄫', '-1': '♭', '0': '♮', '1': '♯', '2': '𝄪',
};
const Alter2PlusMinus: Record<string, string> = {
  '-2': '--', '-1': '-', '0': '', '1': '+', '2': '++',
};

export function ConvertAlterToSymbol(value: string, plusMinus = false): string {
  if (plusMinus) return value in Alter2PlusMinus ? Alter2PlusMinus[value] : '';
  return value in Alter2Symbol ? Alter2Symbol[value] : '';
}

const Kind2Symbol: Record<string, string> = {
  'major': '', 'minor': '-', 'augmented': '+', 'diminished': '°', 'dominant': '7',
  'major-seventh': '△7', 'minor-seventh': '-7', 'diminished-seventh': '°7',
  'augmented-seventh': '+7', 'half-diminished': 'ø', 'major-minor': '-△7',
  'major-sixth': '6', 'minor-sixth': '-6', 'dominant-ninth': '9', 'major-ninth': '△9',
  'minor-ninth': '-9', 'dominant-11th': '11', 'major-11th': '△11', 'minor-11th': '-11',
  'dominant-13th': '13', 'major-13th': '△13', 'minor-13th': '-13',
  'suspended-second': 'sus2', 'suspended-fourth': 'sus4', 'power': '5',
};

export function ConvertKindToSymbol(value: string): string {
  return value in Kind2Symbol ? Kind2Symbol[value] : '';
}

const Kind2Text: Record<string, string> = {
  'major': '', 'minor': 'm', 'augmented': 'aug', 'diminished': 'dim', 'dominant': '7',
  'major-seventh': 'Maj7', 'minor-seventh': 'm7', 'diminished-seventh': 'dim7',
  'augmented-seventh': 'aug7', 'half-diminished': 'm7♭5', 'major-minor': 'mMaj7',
  'major-sixth': '6', 'minor-sixth': 'm6', 'dominant-ninth': '9', 'major-ninth': 'Maj9',
  'minor-ninth': 'm9', 'dominant-11th': '11', 'major-11th': 'Maj11', 'minor-11th': 'm11',
  'dominant-13th': '13', 'major-13th': 'Maj13', 'minor-13th': 'm13',
  'suspended-second': 'sus2', 'suspended-fourth': 'sus4', 'power': '5',
};

export function ConvertKindToText(value: string): string {
  return value in Kind2Text ? Kind2Text[value] : '';
}

const FigureGlyphMap: Record<string, string> = {
  'sharp': '♯', 'flat': '♭', 'natural': '♮', 'double-sharp': '𝄪', 'flat-flat': '𝄫',
  'sharp-sharp': '♯♯', 'backslash': '⃥', 'slash': '̸', 'cross': '+',
};

export function ConvertFigureGlyph(value: string): string {
  return value in FigureGlyphMap ? FigureGlyphMap[value] : '';
}

const precomposedNames: Record<number, string> = {
  [APPR_Above | FORM_Inverted]: 'U+E5C6', [APPR_Below | FORM_Inverted]: 'U+E5B5',
  [APPR_Above | FORM_Normal]: 'U+E5C7', [APPR_Below | FORM_Normal]: 'U+E5B8',
  [FORM_Inverted | DEP_Above]: 'U+E5BB', [FORM_Inverted | DEP_Below]: 'U+E5C8',
};

export function GetOrnamentGlyphNumber(attributes: number): string {
  return attributes in precomposedNames ? precomposedNames[attributes] : '';
}

const octaveStart = [9, 11, 0, 2, 4, 5, 7]; // A B C D E F G semitones from C

export function PitchToMidi(step: string, alter: number, octave: number): number {
  if (!step || step[0] < 'A' || step[0] > 'G') return 0;
  const semitones = octave * 12 + octaveStart[step.charCodeAt(0) - 'A'.charCodeAt(0)] + alter;
  return semitones + 12;
}

export interface MidiPitch { step: string; alter: number; octave: number; }

const octaveNotes: Array<[string, number]> = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['B', -1], ['B', 0],
];

export function MidiToPitch(midi: number): MidiPitch {
  const semitones = midi - 12;
  // C++ semitones%12 on non-negative values; keep exact for C++ range (midi ≥ 12).
  const idx = ((semitones % 12) + 12) % 12;
  return { step: octaveNotes[idx][0], alter: octaveNotes[idx][1], octave: Math.trunc(semitones / 12) };
}

//============================================================================
// musicxml namespace holder structs (iomusxml.h 54-305). Plain state only:
// no pointers owned here (C++ structs hold raw non-owning Object*/Layer*/Clef*
// etc.), so fields type as unknown collaborators until their units land.
//============================================================================

export class MusicXmlOpenSlur {
  m_measureCount: number; m_number: number; m_curvedir: curvature_CURVEDIR;
  constructor(measureCount: number, number: number, curvedir: curvature_CURVEDIR) {
    this.m_measureCount = measureCount; this.m_number = number; this.m_curvedir = curvedir;
  }
}

export class MusicXmlCloseSlur {
  m_measureCount: number; m_number: number; m_curvedir: curvature_CURVEDIR;
  constructor(measureCount: number, number: number, curvedir: curvature_CURVEDIR) {
    this.m_measureCount = measureCount; this.m_number = number; this.m_curvedir = curvedir;
  }
}

export class MusicXmlOpenSpanner {
  m_dirN: number; m_lastMeasureCount: number;
  constructor(dirN: number, lastMeasureCount: number) {
    this.m_dirN = dirN; this.m_lastMeasureCount = lastMeasureCount;
  }
}

export class MusicXmlOpenArpeggio {
  m_arpegN: number; m_timeStamp: number;
  constructor(arpegN: number, timeStamp: number) {
    this.m_arpegN = arpegN; this.m_timeStamp = timeStamp;
  }
}

export class MusicXmlEndingInfo {
  m_number = ''; m_type = ''; m_text = '';
  constructor(number = '', type = '', text = '') {
    this.m_number = number; this.m_type = type; this.m_text = text;
  }
}

export class MusicXmlRepeatInfo {
  m_times: number; m_afterJump: boolean;
  constructor(times = 1, afterJump = false) {
    this.m_times = times; this.m_afterJump = afterJump;
  }
}

export const MusicXmlJumpType = { NONE: 0, DALSEGNO: 1, DACAPO: 2, TOCODA: 3 } as const;
export type MusicXmlJumpType = typeof MusicXmlJumpType[keyof typeof MusicXmlJumpType];

export class MusicXmlJumpInfo {
  m_label = ''; m_jump: MusicXmlJumpType = MusicXmlJumpType.NONE; m_times: number[] = [];
  constructor(jump: MusicXmlJumpType = MusicXmlJumpType.NONE, label = '', times: number[] = []) {
    this.m_jump = jump; this.m_label = label; this.m_times = times;
  }
}

export class MusicXmlFineInfo {
  m_fine: boolean;
  constructor(fine = false) { this.m_fine = fine; }
}

export class MusicXmlSectionInfo {
  m_classId: ClassId = ClassId.SECTION; m_target: unknown = null;
  m_label = ''; m_endingInfo = new MusicXmlEndingInfo();
  m_repeatInfo = new MusicXmlRepeatInfo(); m_repeatStart = false;
  m_jumpInfo = new MusicXmlJumpInfo(); m_fineInfo = new MusicXmlFineInfo();
  m_visited = 0;
  constructor();
  constructor(repeatStart: boolean);
  constructor(ending: MusicXmlEndingInfo);
  constructor(repeat: MusicXmlRepeatInfo);
  constructor(arg?: boolean | MusicXmlEndingInfo | MusicXmlRepeatInfo) {
    if (arg instanceof MusicXmlEndingInfo) { this.merge(arg); }
    else if (arg instanceof MusicXmlRepeatInfo) { this.m_repeatInfo = arg; }
    else if (typeof arg === 'boolean') { this.m_repeatStart = arg; }
  }
  merge(endingInfo: MusicXmlEndingInfo): void {
    this.m_classId = ClassId.ENDING; this.m_endingInfo = endingInfo;
  }
}

export class MusicXmlClefChange {
  m_measureCount: number; m_staff: Staff; m_layer: Layer | null; m_clef: Clef;
  m_scoreOnset: number; m_afterBarline: boolean;
  constructor(measureCount: number, staff: Staff, layer: Layer | null, clef: Clef, scoreOnset: number, afterBarline: boolean) {
    this.m_measureCount = measureCount; this.m_staff = staff; this.m_layer = layer;
    this.m_clef = clef; this.m_scoreOnset = scoreOnset; this.m_afterBarline = afterBarline;
  }
}

export class MusicXmlOpenDashes {
  m_dirN: number; m_staffNum: number; m_measureCount: number;
  constructor(dirN: number, staffNum: number, measureCount: number) {
    this.m_dirN = dirN; this.m_staffNum = staffNum; this.m_measureCount = measureCount;
  }
}

export class MusicXmlOpenTie {
  m_tie: Tie = null as never; m_note: Note = null as never; m_layerNum = 0;
  constructor(tie: Tie, note: Note, layerNum: number) {
    this.m_tie = tie; this.m_note = note; this.m_layerNum = layerNum;
  }
}

export class MusicXmlCloseTie {
  m_note: unknown = null; m_layerNum = 0;
  constructor(note: unknown, layerNum: number) {
    this.m_note = note; this.m_layerNum = layerNum;
  }
}

export class MusicXmlAccidental {
  m_accid: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE;
  m_glyphName = ''; m_glyphAuth = '';
  constructor(accid: data_ACCIDENTAL_WRITTEN = ACCIDENTAL_WRITTEN_NONE, glyphName = '', glyphAuth = '') {
    this.m_accid = accid; this.m_glyphName = glyphName; this.m_glyphAuth = glyphAuth;
  }
}

//============================================================================
// MusicXmlInput skeleton (iomusxml.h 307-720 + iomusxml.cpp 113-205).
// Full state surface + XML helpers + Import preamble wired to real seams
// (Input, Doc/DocType, pugixml xml_document). All ReadMusicXml* entry points
// are translated.
//============================================================================

// (imports hoisted to file top)

/** Narrow Doc contract actually consumed by the wired preamble. */
export interface MusicXmlDocLike extends DocLike {
  Reset(): void;
  SetType(t: DocType): void;
}

export class MusicXmlInput extends Input {
  protected m_docRef: MusicXmlDocLike;
  protected m_garbage: unknown[] = [];
  protected m_octDis: number[] = [];
  protected m_mRpt = false;
  protected m_slash = false;
  protected m_ppq = -1;
  protected m_durTotal = 0;
  protected m_durFb = 0;
  protected m_meterCount: number[] = [4];
  protected m_meterUnit = 4;
  protected m_meterSign: MeterCountSign = MeterCountSign.None;
  protected m_label: unknown = null;
  protected m_labelAbbr: unknown = null;
  protected m_instrdef: unknown = null;
  protected m_ID = '';
  protected m_elementStackMap: Map<unknown, VrvObject[]> = new Map();
  protected m_layerEndTimes: Map<unknown, number> = new Map();
  protected m_layerTimes: Map<unknown, Map<number, unknown[]>> = new Map();
  protected m_prevLayer: unknown = null;
  protected m_currentLayer: unknown = null;
  protected m_isLayerInitialized = false;
  protected m_slurStack: Array<[Slur, MusicXmlOpenSlur]> = [];
  protected m_slurStopStack: Array<[LayerElement, MusicXmlCloseSlur]> = [];
  protected m_tieStack: MusicXmlOpenTie[] = [];
  protected m_tieStopStack: MusicXmlCloseTie[] = [];
  protected m_hairpinStack: Array<[unknown, MusicXmlOpenSpanner]> = [];
  protected m_hairpinStopStack: Array<[number, number, MusicXmlOpenSpanner]> = [];
  protected m_beamspanStack: Array<[BeamSpan, [number, number]]> = [];
  protected m_bracketStack: Array<[unknown, MusicXmlOpenSpanner]> = [];
  protected m_trillStack: Array<[Trill, MusicXmlOpenSpanner]> = [];
  protected m_sectionStart: MusicXmlSectionInfo | null = null;
  protected m_sectionStop: MusicXmlSectionInfo | null = null;
  protected m_jumpInfo: MusicXmlJumpInfo | null = null;
  protected m_fineInfo: MusicXmlFineInfo | null = null;
  protected m_sections: Array<[MusicXmlSectionInfo, unknown[]]> = [];
  protected m_openDashesStack: Array<[unknown, MusicXmlOpenDashes]> = [];
  protected m_dirStack: unknown[] = [];
  protected m_dynamStack: unknown[] = [];
  protected m_glissStack: unknown[] = [];
  protected m_harmStack: unknown[] = [];
  protected m_octaveStack: unknown[] = [];
  protected m_pedalStack: unknown[] = [];
  protected m_tempoStack: unknown[] = [];
  protected m_controlElements: Array<[number, unknown]> = [];
  protected m_clefChangeQueue: MusicXmlClefChange[] = [];
  protected m_ArpeggioStack: Array<[Arpeg, MusicXmlOpenArpeggio]> = [];
  protected m_measureCounts: Map<unknown, number> = new Map();
  protected m_multiRests: Map<number, number> = new Map();
  protected m_alterAccids: Map<string, MusicXmlAccidental[]> = new Map();
  protected m_clefChanged = 0;

  constructor(doc: MusicXmlDocLike) {
    super(doc);
    this.m_docRef = doc;
  }

  // C++ dtor releases m_garbage; TS is GC-managed so nothing to free —
  // kept as an explicit lifecycle hook for parity, intentionally empty.
  public Dispose(): void {}

  public override Import(musicxml: string): boolean {
    try {
      this.m_docRef.Reset();
      this.m_docRef.SetType(DocType.Raw);
      const xmlDoc = new xml_document();
      xmlDoc.load_string(musicxml);
      const root = xmlDoc.first_child();
      return this.ReadMusicXml(root);
    }
    catch (e) {
      LogError('%s', e instanceof Error ? e.message : String(e));
      return false;
    }
  }

  public HasAttributeWithValue(node: xml_node, attribute: string, value: string): boolean {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    return node.attribute(attribute).value() === value;
  }

  public IsElement(node: xml_node, name: string): boolean {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    return node.name() === name;
  }

  public HasContentWithValue(node: xml_node, value: string): boolean {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    return this.GetContent(node) === value;
  }

  public GetContent(node: xml_node): string {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    const t = node.text();
    if (!t.empty()) return t.as_string();
    return '';
  }

  public GetContentOfChild(node: xml_node, child: string): string {
    // plain child-name lookup (all observed GetContentOfChild call sites use
    // plain names; predicate paths go through selectNode/selectNodes).
    const childNode = node.child(child);
    if (!childNode.empty()) return this.GetContent(childNode);
    return '';
  }

  public FindMeasureByCount(measureCount: number): unknown {
    for (const [m, count] of this.m_measureCounts) {
      if (count === measureCount) return m;
    }
    return null;
  }

  public GenerateID(node: xml_node): void {
    // C++: id = first letter of node name + Object::GenerateHashID().
    const name = node.name();
    node.append_attribute('xml:id').set_value(`${name.charAt(0)}${VrvObject.GenerateHashID()}`);
  }

  // C++ iomusxml.cpp 1442-1513. Absolute-path XPath folded to direct
  // child traversal (root is <score-partwise>); date/version via Date.
  protected ReadMusicXmlTitle(root: xml_node): void {
    if (root.empty()) throw new Error('MusicXmlInput: null node');
    const doc = this.m_docRef as unknown as { m_header: xml_document; GetOptions(): { m_removeIds: { getValue(): boolean } } };
    const workTitle = root.child('work').child('work-title');
    const movementTitle = root.child('movement-title');
    const workNumber = root.child('work').child('work-number');
    const movementNumber = root.child('movement-number');
    const meiHead = doc.m_header.append_child('meiHead');
    const fileDesc = meiHead.append_child('fileDesc');
    const titleStmt = fileDesc.append_child('titleStmt');
    const meiTitle = titleStmt.append_child('title');
    if (!movementTitle.empty()) meiTitle.text().set(movementTitle.text().as_string());
    else if (!workTitle.empty()) meiTitle.text().set(workTitle.text().as_string());
    if (!movementNumber.empty()) {
      const sub = titleStmt.append_child('title');
      sub.text().set(movementNumber.text().as_string());
      sub.append_attribute('type').set_value('subordinate');
    }
    else if (!workNumber.empty()) {
      const sub = titleStmt.append_child('title');
      sub.text().set(workNumber.text().as_string());
      sub.append_attribute('type').set_value('subordinate');
    }
    const pubStmt = fileDesc.append_child('pubStmt');
    const respStmt = titleStmt.append_child('respStmt');
    const identification = root.child('identification');
    for (const creator of this.childElements(identification, 'creator')) {
      const persName = respStmt.append_child('persName');
      persName.text().set(creator.text().as_string());
      persName.append_attribute('role').set_value(creator.attribute('type').as_string());
    }
    const encoding = identification.child('encoding');
    for (const encDate of this.childElements(encoding, 'encoding-date')) {
      const date = pubStmt.append_child('date');
      date.text().set(encDate.text().as_string());
      date.append_attribute('isodate').set_value(encDate.text().as_string());
      date.append_attribute('type').set_value(encDate.name());
    }
    const rights: xml_node[] = this.childElements(identification, 'rights');
    if (rights.length > 0) {
      const availability = pubStmt.append_child('availability');
      for (const r of rights) availability.append_child('distributor').text().set(r.text().as_string());
    }
    const encodingDesc = meiHead.append_child('encodingDesc');
    const appInfo = encodingDesc.append_child('appInfo');
    const app = appInfo.append_child('application');
    const appName = app.append_child('name');
    appName.text().set('Verovio');
    const appText = app.append_child('p');
    appText.text().set('Transcoded from MusicXML');
    if (!doc.GetOptions().m_removeIds.getValue()) {
      for (const n of [meiHead, fileDesc, titleStmt, pubStmt, encodingDesc, appInfo, app, appName, appText]) this.GenerateID(n);
    }
    const now = new Date();
    const pad = (v: number): string => String(v).padStart(2, '0');
    app.append_attribute('isodate').set_value(
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    app.append_attribute('version').set_value(GetVersion());
  }

  /** Direct-child element iterator (TS pugixml lacks select_nodes). */
  protected childElements(node: xml_node, name: string): xml_node[] {
    const out: xml_node[] = [];
    if (node.empty()) return out;
    for (let c = node.first_child(); !c.empty(); c = c.next_sibling()) {
      if (c.name() === name) out.push(c);
    }
    return out;
  }

  /** Traverse part/measure paths with attribute filters (XPath fold). */
  protected partMeasures(root: xml_node): xml_node[] {
    const out: xml_node[] = [];
    for (let p = root.child('part'); !p.empty(); p = p.next_sibling('part')) {
      for (let m = p.child('measure'); !m.empty(); m = m.next_sibling('measure')) out.push(m);
    }
    return out;
  }

  /** /score-partwise/part/measure[@non-controlling='yes'] exists? */
  protected hasNonControlling(root: xml_node): boolean {
    for (const m of this.partMeasures(root)) {
      if (m.attribute('non-controlling').value() === 'yes') return true;
    }
    return false;
  }

  /** /score-partwise/part/measure/print[@new-system or @new-page] — any hit? */
  protected hasPrintNew(root: xml_node): boolean {
    for (const m of this.partMeasures(root)) {
      for (let pr = m.child('print'); !pr.empty(); pr = pr.next_sibling('print')) {
        if (!pr.attribute('new-system').empty() || !pr.attribute('new-page').empty()) return true;
      }
    }
    return false;
  }

  /** /score-partwise/part[1]/measure[1]/print[@new-system or @new-page] — first only? */
  protected firstMeasureHasPrintNew(root: xml_node): boolean {
    const part = root.child('part');
    if (part.empty()) return false;
    const m = part.child('measure');
    for (let pr = m.child('print'); !pr.empty(); pr = pr.next_sibling('print')) {
      if (!pr.attribute('new-system').empty() || !pr.attribute('new-page').empty()) return true;
    }
    return false;
  }

  /** /score-partwise/defaults/page-layout → bottom-margin float. */
  protected pageLayoutBottom(root: xml_node): number {
    const margins = root.child('defaults').child('page-layout').child('page-margins');
    return margins.child('bottom-margin').text().as_float();
  }

  /** /score-partwise/credit[@page='1']/credit-words in document order. */
  protected creditWords(root: xml_node): xml_node[] {
    const out: xml_node[] = [];
    for (let c = root.child('credit'); !c.empty(); c = c.next_sibling('credit')) {
      if (c.attribute('page').value() !== '1') continue;
      for (let w = c.child('credit-words'); !w.empty(); w = w.next_sibling('credit-words')) out.push(w);
    }
    return out;
  }

  /** /score-partwise/part[1]/measure[1]/sound[@tempo][1] node. */
  protected firstSoundTempo(root: xml_node): xml_node | null {
    const part = root.child('part');
    if (part.empty()) return null;
    for (let m = part.child('measure'); !m.empty(); m = m.next_sibling('measure')) {
      for (let s = m.child('sound'); !s.empty(); s = s.next_sibling('sound')) {
        if (!s.attribute('tempo').empty()) return s;
      }
      break; // measure[1] only
    }
    return null;
  }

  /** C++ iomusxml.cpp 895-997 + 984-1440 preamble + part-list loop.
   * XPath queries folded to manual traversal (see helpers above). */
  protected ReadMusicXml(root: xml_node): boolean {
    if (root.empty()) throw new Error('MusicXmlInput: null node');
    if (this.hasNonControlling(root)) {
      throw new Error('MusicXML import: Multimetric music detected. Import cancelled.');
    }
    this.ReadMusicXmlTitle(root);

    const mdiv = new Mdiv();
    mdiv.SetVisibility(VisibilityType.Visible);
    (this.m_docRef as unknown as VrvObject).AddChild(mdiv);
    const score = new Score();
    mdiv.AddChild(score);
    const section = new Section();
    score.AddChild(section);
    this.m_sections.push([new MusicXmlSectionInfo(), []]);

    if (this.hasPrintNew(root)) {
      this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
      if (!this.firstMeasureHasPrintNew(root)) {
        section.AddChild(new Pb());
      }
    }

    const bottom = this.pageLayoutBottom(root);

    const credits = this.creditWords(root);
    if (credits.length > 0) {
      let head: PgHead | null = null;
      let foot: PgFoot | null = null;
      for (const words of credits) {
        const rend = new Rend();
        const text = new Text();
        text.SetText(UTF8to32(words.text().as_string()));
        rend.SetColor(words.attribute('color').as_string());
        rend.SetHalign(new AttConverterBase().StrToHorizontalalignment(words.attribute('justify').as_string()));
        rend.SetValign(new AttConverterBase().StrToVerticalalignment(words.attribute('valign').as_string()));
        rend.SetFontstyle(new AttConverterBase().StrToFontstyle(words.attribute('font-style').as_string()));
        rend.SetFontweight(new AttConverterBase().StrToFontweight(words.attribute('font-weight').as_string()));
        rend.AddChild(text);
        if (words.attribute('default-y').as_float() < 2 * bottom) {
          if (!foot) foot = new PgFoot();
          foot.AddChild(rend);
        }
        else {
          if (!head) head = new PgHead();
          head.SetFunc(PGFUNC_first);
          head.AddChild(rend);
        }
      }
      const scoreDef = score.GetScoreDef();
      if (!scoreDef) throw new Error('MusicXmlInput: score scoreDef missing');
      if (head) scoreDef.AddChild(head);
      if (foot) scoreDef.AddChild(foot);
    }

    const m_staffGrpStack: StaffGrp[] = [];
    const staffGrp = new StaffGrp();
    const scoreDef2 = score.GetScoreDef();
    if (!scoreDef2) throw new Error('MusicXmlInput: score scoreDef missing');
    scoreDef2.AddChild(staffGrp);
    m_staffGrpStack.push(staffGrp);

    let staffOffset = 0;
    this.m_octDis.push(0);

    const firstSound = this.firstSoundTempo(root);
    if (firstSound) {
      scoreDef2.SetMidiBpm(firstSound.attribute('tempo').as_double());
    }

    const partListChildren: xml_node[] = [];
    const partList = root.child('part-list');
    for (let c = partList.first_child(); !c.empty(); c = c.next_sibling()) partListChildren.push(c);

    // Part-list + part processing — completed in the next sub-pass once
    // ReadMusicXmlPartAttributesAsStaffDef is translated. ponytail: ceiling
    // = full part-list loop with labels/instrdef/staffGrp stack; upgrade in
    // iomusxml part 4b.
    for (const child of partListChildren) {
      if (this.IsElement(child, 'part-group')) {
        if (this.HasAttributeWithValue(child, 'type', 'start')) {
          const grp = new StaffGrp();
          const groupGymbol = child.child('group-symbol').text().as_string();
          if (groupGymbol !== '') {
            const grpSym = new GrpSym();
            if (groupGymbol === 'brace') grpSym.SetSymbol(staffGroupingSym_SYMBOL_brace);
            else if (groupGymbol === 'line') grpSym.SetSymbol(staffGroupingSym_SYMBOL_line);
            else if (groupGymbol === 'bracket') grpSym.SetSymbol(staffGroupingSym_SYMBOL_bracket);
            else if (groupGymbol === 'square') grpSym.SetSymbol(staffGroupingSym_SYMBOL_bracketsq);
            grp.AddChild(grpSym);
          }
          const groupBarline = child.child('group-barline').text().as_string();
          if (groupBarline !== '') grp.SetBarThru(groupBarline === 'no' ? BOOLEAN_false : BOOLEAN_true);
          if (groupBarline === 'Mensurstrich') grp.SetBarMethod(BARMETHOD_mensur);
          const groupName = this.GetContentOfChildNotPrinted(child, 'group-name');
          const groupAbbr = this.GetContentOfChildNotPrinted(child, 'group-abbreviation');
          if (groupName !== '' && !this.m_label) {
            this.m_label = new Label();
            if (!child.child('group-name-display').empty()
              && !this.HasAttributeWithValue(child.child('group-name-display'), 'print-object', 'no')) {
              const name = this.StyleLabel(child.child('group-name-display'));
              const text = new Text();
              text.SetText(UTF8to32(name));
              (this.m_label as VrvObject).AddChild(text);
            }
            else {
              const text = new Text();
              text.SetText(UTF8to32(groupName));
              (this.m_label as VrvObject).AddChild(text);
            }
            grp.AddChild(this.m_label as VrvObject);
            this.m_label = null;
          }
          if (groupAbbr !== '' && !this.m_labelAbbr) {
            this.m_labelAbbr = new LabelAbbr();
            if (!child.child('group-abbreviation-display').empty()
              && !this.HasAttributeWithValue(child.child('group-abbreviation-display'), 'print-object', 'no')) {
              const name = this.StyleLabel(child.child('group-abbreviation-display'));
              const text = new Text();
              text.SetText(UTF8to32(name));
              (this.m_labelAbbr as VrvObject).AddChild(text);
            }
            else {
              const text = new Text();
              text.SetText(UTF8to32(groupAbbr));
              (this.m_labelAbbr as VrvObject).AddChild(text);
            }
            grp.AddChild(this.m_labelAbbr as VrvObject);
            this.m_labelAbbr = null;
          }
          m_staffGrpStack[m_staffGrpStack.length - 1].AddChild(grp);
          m_staffGrpStack.push(grp);
        }
        else {
          m_staffGrpStack.pop();
        }
      }
      else if (this.IsElement(child, 'score-part')) {
        const partId = child.attribute('id').as_string();
        const partNode = this.findPartById(root, partId);
        if (!partNode || partNode.child('measure').child('attributes').empty()) {
          LogWarning("MusicXML import: Could not find the 'attributes' element in the first measure of part '%s'", partId);
          continue;
        }
        const partName = this.GetContentOfChildNotPrinted(child, 'part-name');
        const partAbbr = this.GetContentOfChildNotPrinted(child, 'part-abbreviation');
        const midiInstrument = child.child('midi-instrument');
        if (partName !== '' && !this.m_label) {
          this.m_label = new Label();
          if (!child.child('part-name-display').empty()
            && !this.HasAttributeWithValue(child.child('part-name-display'), 'print-object', 'no')) {
            const name = this.StyleLabel(child.child('part-name-display'));
            const text = new Text();
            text.SetText(UTF8to32(name));
            (this.m_label as VrvObject).AddChild(text);
          }
          else {
            let firstLine = true;
            for (const line of partName.split('\n')) {
              if (!firstLine) (this.m_label as VrvObject).AddChild(new Lb());
              const text = new Text();
              text.SetText(UTF8to32(line));
              (this.m_label as VrvObject).AddChild(text);
              firstLine = false;
            }
          }
        }
        if (partAbbr !== '' && !this.m_labelAbbr) {
          this.m_labelAbbr = new LabelAbbr();
          if (!child.child('part-abbreviation-display').empty()
            && !this.HasAttributeWithValue(child.child('part-abbreviation-display'), 'print-object', 'no')) {
            const name = this.StyleLabel(child.child('part-abbreviation-display'));
            const text = new Text();
            text.SetText(UTF8to32(name));
            (this.m_labelAbbr as VrvObject).AddChild(text);
          }
          else {
            let firstLine = true;
            for (const line of partAbbr.split('\n')) {
              if (!firstLine) (this.m_labelAbbr as VrvObject).AddChild(new Lb());
              const text = new Text();
              text.SetText(UTF8to32(line));
              (this.m_labelAbbr as VrvObject).AddChild(text);
              firstLine = false;
            }
          }
        }
        if (!midiInstrument.empty() && !this.m_instrdef) {
          const instrdef = new InstrDef();
          // C++ stores data_MIDINAMES enum (MIDINAMES_NONE for missing/unknown);
          // the TS InstrDef keeps the name string, so convert back via MidinamesToStr.
          // NONE converts to '' and HasMidiInstrname stays false, matching C++.
          const midiNameValue = new AttBase().StrToMidinames(
            midiInstrument.child('midi-name').text().as_string());
          instrdef.SetMidiInstrname(new AttBase().MidinamesToStr(midiNameValue));
          const midiChannel = midiInstrument.child('midi-channel');
          if (!midiChannel.empty()) instrdef.SetMidiChannel(midiChannel.text().as_int() - 1);
          const midiProgram = midiInstrument.child('midi-program');
          if (!midiProgram.empty()) instrdef.SetMidiInstrnum(midiProgram.text().as_int() - 1);
          const midiVolume = midiInstrument.child('volume');
          if (!midiVolume.empty()) instrdef.SetMidiVolume(midiVolume.text().as_int());
          this.m_instrdef = instrdef;
        }
        // create the staffDef(s)
        const partStaffGrp = new StaffGrp();
        partStaffGrp.SetID(partId);
        const nbStaves = this.ReadMusicXmlPartAttributesAsStaffDef(
          partNode.child('measure'), partStaffGrp, staffOffset);
        // if we have more than one staff in the part we create a new staffGrp
        if (nbStaves > 1) {
          partStaffGrp.SetBarThru(BOOLEAN_true);
          if (!m_staffGrpStack[m_staffGrpStack.length - 1].GetChild(0, ClassId.GRPSYM)) {
            const partGrpSym = new GrpSym();
            partGrpSym.SetSymbol(staffGroupingSym_SYMBOL_brace);
            partStaffGrp.AddChild(partGrpSym);
          }
          m_staffGrpStack[m_staffGrpStack.length - 1].AddChild(partStaffGrp);
        }
        else {
          m_staffGrpStack[m_staffGrpStack.length - 1].MoveChildrenFrom(partStaffGrp);
        }

        const partRef = this.findPartById(root, partId);
        if (!partRef) {
          LogWarning("MusicXML import: Could not find the part '%s'", partId);
          continue;
        }
        this.ReadMusicXmlPart(partRef, section, nbStaves, staffOffset);
        staffOffset += nbStaves;
      }
    }

    // here we could check that there is only one staffGrp left in m_staffGrpStack

    this.ProcessClefChangeQueue(section);

    // attach the control elements to their measures
    let measure: unknown = null;
    let measureCount = -1;
    for (const iter of this.m_controlElements) {
      if (!measure || (measureCount !== iter[0])) {
        measure = this.FindMeasureByCount(iter[0]);
        measureCount = iter[0];
      }
      if (!measure) {
        LogWarning("MusicXML import: Element '%s' could not be added to measure %d",
          (iter[1] as VrvObject).GetClassName(), iter[0] + 1);
        continue;
      }
      (measure as VrvObject).AddChild(iter[1] as VrvObject);
    }

    // manage sections: create new <section> / <ending> elements and move the corresponding measures into them
    for (let i = 0; i < this.m_sections.length;) {
      const [sectionInfo, measures] = this.m_sections[i];
      if (measures.length === 0) {
        this.m_sections.splice(i, 1);
        continue;
      }

      let target: VrvObject;
      if (sectionInfo.m_classId === ClassId.ENDING) {
        const ending = new Ending();
        // some musicXML exporters tend to ignore the <ending> text, so take @number instead.
        if (sectionInfo.m_endingInfo.m_text === '') {
          ending.SetN(sectionInfo.m_endingInfo.m_number);
        }
        else {
          ending.SetN(sectionInfo.m_endingInfo.m_text);
        }
        ending.SetLendsym(LINESTARTENDSYMBOL_angledown); // default, does not need to be written
        if (sectionInfo.m_endingInfo.m_type === 'discontinue') {
          ending.SetLendsym(LINESTARTENDSYMBOL_none); // no ending symbol
        }
        target = ending as unknown as VrvObject;
      }
      else {
        target = new Section() as unknown as VrvObject;
      }

      // remember the target for expansion
      sectionInfo.m_target = target;
      // insert <section> / <ending> element ahead of first <measure>
      (section as unknown as VrvObject).InsertBefore(measures[0] as VrvObject, target);
      // go through measures move them info <section> / <ending>
      for (const sectionMeasure of measures) {
        // also move preceding non-measure siblings
        // keep stacking them in reverse order then transfer them in score order
        let sibling: VrvObject | null = sectionMeasure as VrvObject;
        const siblings: VrvObject[] = [];
        while ((sibling = (section as unknown as VrvObject).GetPrevious(sibling))) {
          if (sibling.GetClassId() === ClassId.SECTION || sibling.GetClassId() === ClassId.ENDING) break;
          siblings.unshift(sibling);
        }
        for (const s of siblings) {
          const idx = (section as unknown as VrvObject).GetChildIndex(s);
          (section as unknown as VrvObject).DetachChild(idx);
          target.AddChild(s);
        }
        const idx = (section as unknown as VrvObject).GetChildIndex(sectionMeasure as VrvObject);
        (section as unknown as VrvObject).DetachChild(idx);
        target.AddChild(sectionMeasure as VrvObject); // add <measure> to sub-element
      }

      ++i;
    }
    this.CreateExpansion(section);
    this.m_sections = [];

    // The top staffGrp cannot remain empty - add at least one staffDef
    if (m_staffGrpStack[m_staffGrpStack.length - 1].GetChildCount(ClassId.UNSPECIFIED) === 0) {
      const staffDef = new StaffDef();
      staffDef.SetN(1);
      staffDef.SetLines(5);
      m_staffGrpStack[m_staffGrpStack.length - 1].AddChild(staffDef as unknown as VrvObject);
    }

    // finalize document
    (this.m_docRef as unknown as { ExpandExpansions(): void }).ExpandExpansions();
    (this.m_docRef as unknown as { ConvertToPageBasedDoc(): void }).ConvertToPageBasedDoc();
    (this.m_docRef as unknown as { ConvertMarkupDoc(permanent?: boolean): void }).ConvertMarkupDoc();

    // clean up stacks
    if (this.m_beamspanStack.length > 0) {
      LogWarning('MusicXML import: There are %d beamspans left without ending', this.m_beamspanStack.length);
      this.m_beamspanStack = [];
    }

    if (this.m_tieStack.length > 0) {
      LogWarning('MusicXML import: There are %d ties left open', this.m_tieStack.length);
      this.m_tieStack = [];
    }
    if (this.m_slurStack.length > 0) { // There are slurs left open
      for (const iter of this.m_slurStack) {
        LogWarning('MusicXML import: slur %d from measure %d could not be ended',
          iter[1].m_number, iter[1].m_measureCount + 1);
      }
      this.m_slurStack = [];
    }
    if (this.m_slurStopStack.length > 0) { // There are slur ends without opening
      for (const iter of this.m_slurStopStack) {
        LogWarning("MusicXML import: slur ending for element '%s' could not be matched to a start element",
          (iter[0] as VrvObject).GetID());
      }
      this.m_slurStopStack = [];
    }
    if (this.m_glissStack.length > 0) {
      for (const gliss of this.m_glissStack) {
        LogWarning("MusicXML import: gliss for '%s' could not be closed", (gliss as VrvObject).GetID());
      }
      this.m_glissStack = [];
    }
    if (this.m_trillStack.length > 0) { // open trills without ending
      for (const iter of this.m_trillStack) {
        LogWarning("MusicXML import: trill extender for '%s' could not be ended", (iter[0] as VrvObject).GetID());
      }
      this.m_trillStack = [];
    }

    return true;
  }

  /** C++ iomusxml.cpp 1323-1428. */
  protected CreateExpansion(section: Section): void {
    const expansion = new Expansion();
    (section as unknown as VrvObject).InsertChild(expansion as unknown as VrvObject, 0);

    // iterate on sections to create expansion
    // prepopulate the labels map because there are forward jumps (tocoda)
    let jumpBack = false;
    let iter = 0;
    let rptIter = iter;
    let secIter = iter;
    let endIter = iter;
    const labels = new Map<string, number>();
    for (let it = 0; it < this.m_sections.length; ++it) {
      if (this.m_sections[it][0].m_label !== '') {
        labels.set(this.m_sections[it][0].m_label, it);
      }
    }
    while (iter < this.m_sections.length) {
      // increment visited count
      this.m_sections[iter][0].m_visited++;

      // remember this repeat start
      if (this.m_sections[iter][0].m_repeatStart) rptIter = iter;

      // handle section
      if (this.m_sections[iter][0].m_classId === ClassId.SECTION) {
        // add the section
        const ref = `#${(this.m_sections[iter][0].m_target as VrvObject).GetID()}`;
        expansion.GetPlistInterface().AddRefAllowDuplicate(ref);

        // repeat the sections, beginning with the repeat start
        const times = (jumpBack && !this.m_sections[iter][0].m_repeatInfo.m_afterJump) ? 1
          : this.m_sections[iter][0].m_repeatInfo.m_times;
        for (let t = 2; t <= times; ++t) {
          for (let it = rptIter; it <= iter; ++it) {
            const rref = `#${(this.m_sections[it][0].m_target as VrvObject).GetID()}`;
            expansion.GetPlistInterface().AddRefAllowDuplicate(rref);
          }
        }

        // remember last section
        secIter = iter;
        endIter = iter;
        ++iter;
      }
      // ending
      else {
        // gather all endings, by creating a map from ending number to ending iterator
        const endings = new Map<number, number>();
        const begIter = iter;
        let rptNestedIter: number | null = null;
        while (iter < this.m_sections.length && this.m_sections[iter][0].m_classId === ClassId.ENDING) {
          for (const i of parseIntsList(this.m_sections[iter][0].m_endingInfo.m_number)) {
            endings.set(i, iter);
          }
          endIter = iter;
          ++iter;

          // remember a nested repeat start
          if (endIter !== begIter && this.m_sections[endIter][0].m_repeatStart) rptNestedIter = endIter;

          // increment visited count of subsequent sections
          if (endIter !== begIter) this.m_sections[endIter][0].m_visited++;
        }

        // when jumping back, keep only last ending
        if (jumpBack && endings.size > 0) {
          let lastKey: number | null = null;
          for (const k of endings.keys()) lastKey = k;
          if (lastKey !== null) {
            const lastValue = endings.get(lastKey)!;
            endings.clear();
            endings.set(lastKey, lastValue);
            endIter = [...endings.values()][0];
          }
        }

        // the map is automatically sorted by key (ending number), so just add them to expansion in the same order
        // skip section first time because it was already added in the SECTION block
        const sortedEndings = [...endings.entries()].sort((a, b) => a[0] - b[0]);
        for (let e = 0; e < sortedEndings.length; ++e) {
          if (e > 0) {
            for (let it = rptIter; it <= secIter; ++it) {
              const rref = `#${(this.m_sections[it][0].m_target as VrvObject).GetID()}`;
              expansion.GetPlistInterface().AddRefAllowDuplicate(rref);
            }
          }
          const endref = `#${(this.m_sections[sortedEndings[e][1]][0].m_target as VrvObject).GetID()}`;
          expansion.GetPlistInterface().AddRefAllowDuplicate(endref);
        }

        // set the repetition to the (latest) nested one
        if (rptNestedIter !== null) rptIter = rptNestedIter;
      }

      // fine
      if (jumpBack && this.m_sections[endIter][0].m_fineInfo.m_fine) {
        break;
      }

      // dacapo
      const endJump = this.m_sections[endIter][0].m_jumpInfo.m_jump;
      const endTimes = this.m_sections[endIter][0].m_jumpInfo.m_times;
      const endVisited = this.m_sections[endIter][0].m_visited;
      if (endJump === MusicXmlJumpType.DACAPO && endTimes.includes(endVisited)) {
        iter = 0;
        jumpBack = true;
      }

      // dalsegno / tocoda
      if ((endJump === MusicXmlJumpType.DALSEGNO || endJump === MusicXmlJumpType.TOCODA) && endTimes.includes(endVisited)) {
        if (!labels.has(this.m_sections[endIter][0].m_jumpInfo.m_label)) {
          LogWarning("MusicXML import: Segno/Coda label '%s' not found",
            this.m_sections[endIter][0].m_jumpInfo.m_label);
        }
        else {
          iter = labels.get(this.m_sections[endIter][0].m_jumpInfo.m_label)!;
          jumpBack = endJump === MusicXmlJumpType.DALSEGNO;
        }
      }
    }
  }

  /** C++ GetContentOfChild("name[not(@print-object='no')]") fold. */
  protected GetContentOfChildNotPrinted(node: xml_node, name: string): string {
    for (let c = node.child(name); !c.empty(); c = c.next_sibling(name)) {
      if (c.attribute('print-object').value() !== 'no') return this.GetContent(c);
    }
    return '';
  }

  /** C++ iomusxml.cpp 770-782. */
  protected StyleLabel(display: xml_node): string {
    let displayText = '';
    for (const child of display.children()) {
      if (child.name().substring(0, 7) === 'display') displayText += child.text().as_string();
      if (child.name().substring(0, 10) === 'accidental') displayText += ConvertFigureGlyph(child.text().as_string());
    }
    return displayText;
  }

  protected findPartById(root: xml_node, partId: string): xml_node | null {
    for (let p = root.child('part'); !p.empty(); p = p.next_sibling('part')) {
      if (p.attribute('id').value() === partId) return p;
    }
    return null;
  }

  /** C++ iomusxml.cpp 4389-4439. Returns null for sign 'none'/absent. */
  protected ConvertClef(clef: xml_node): Clef | null {
    const clefSign = clef.child('sign');
    if (!clefSign.empty() && this.GetContent(clefSign) !== 'none') {
      const meiClef = new Clef();
      meiClef.SetColor(clef.attribute('color').as_string());
      meiClef.SetVisible(ConvertWordToBool(clef.attribute('print-object').as_string()));
      if (!clef.attribute('id').empty()) {
        meiClef.SetID(clef.attribute('id').as_string());
      }
      const conv = new AttBase();
      meiClef.SetShape(conv.StrToClefshape(this.GetContent(clefSign).substring(0, 4)));

      const clefLine = clef.child('line');
      if (!clefLine.text().empty()) {
        if (meiClef.GetShape() !== CLEFSHAPE_perc) {
          meiClef.SetLine(clefLine.text().as_int());
        }
      }
      else {
        switch (meiClef.GetShape()) {
          case CLEFSHAPE_C: meiClef.SetLine(3); break;
          case CLEFSHAPE_F: meiClef.SetLine(4); break;
          case CLEFSHAPE_G: meiClef.SetLine(2); break;
          case CLEFSHAPE_TAB: meiClef.SetLine(5); break;
          default: break;
        }
      }

      const clefOctaveChange = clef.child('clef-octave-change');
      if (!clefOctaveChange.empty()) {
        const change = clefOctaveChange.text().as_int();
        switch (Math.abs(change)) {
          case 1: meiClef.SetDis(OCTAVE_DIS_8); break;
          case 2: meiClef.SetDis(OCTAVE_DIS_15); break;
          case 3: meiClef.SetDis(OCTAVE_DIS_22); break;
          default: break;
        }
        if (change < 0) meiClef.SetDisPlace(STAFFREL_basic_below);
        else if (change > 0) meiClef.SetDisPlace(STAFFREL_basic_above);
      }
      return meiClef;
    }
    return null;
  }

  /** C++ iomusxml.cpp 4441-4495. */
  protected ConvertKey(key: xml_node): KeySig {
    const keySig = new KeySig();
    keySig.SetVisible(ConvertWordToBool(key.attribute('print-object').as_string()));
    if (!key.attribute('id').empty()) {
      keySig.SetID(key.attribute('id').as_string());
    }
    const att = new AttBase();
    if (!key.child('fifths').empty()) {
      const fifths = key.child('fifths').text().as_int();
      let keySigStr: string;
      if (fifths < 0) keySigStr = StringFormat('%df', Math.abs(fifths));
      else if (fifths > 0) keySigStr = StringFormat('%ds', fifths);
      else keySigStr = '0';
      const [first, second] = att.StrToKeysignature(keySigStr);
      keySig.SetSig([first, second]);

      if (!key.child('cancel').empty()) {
        keySig.SetCancelaccid(CANCELACCID_before);
      }
      if (!key.child('mode').empty()) {
        const xmlMode = key.child('mode').text().as_string();
        if (xmlMode.substring(0, 4) !== 'none') {
          keySig.SetMode(att.StrToMode(xmlMode));
        }
      }
    }
    else if (!key.child('key-step').empty()) {
      for (let keyStep = key.child('key-step'); !keyStep.empty(); keyStep = keyStep.next_sibling('key-step')) {
        const keyAccid = new KeyAccid();
        keyAccid.SetPname(ConvertStepToPitchName(keyStep.text().as_string()));
        const next1 = keyStep.next_sibling();
        if (next1.name().substring(0, 9) === 'key-alter') {
          const accidValue = ConvertAlterToAccid(next1.text().as_float());
          keyAccid.SetAccid(AttBase.AccidentalGesturalToWritten(accidValue));
          const next2 = next1.next_sibling();
          if (next2.name().substring(0, 14) === 'key-accidental') {
            keyAccid.SetAccid(ConvertAccidentalToAccid(next2.text().as_string()));
            keyAccid.SetGlyphName(next2.attribute('smufl').as_string());
          }
          else if (!keyAccid.HasAccid()) {
            LogWarning('MusicXML import: Could not properly set keyAccid');
          }
        }
        keySig.AddChild(keyAccid);
      }
    }
    return keySig;
  }
  /** C++ iomusxml.cpp 1811-1879. */
  protected ReadMusicXmlPart(node: xml_node, section: Section, nbStaves: number, staffOffset: number): boolean {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    const measures = this.allChildren(node, 'measure');
    if (measures.length === 0) {
      LogWarning('MusicXML import: No measure to load');
      return false;
    }

    let i = 0;
    for (const xmlMeasure of measures) {
      if (!this.IsMultirestMeasure(i)) {
        const measure = new Measure();
        this.m_measureCounts.set(measure, i);
        this.ReadMusicXmlMeasure(xmlMeasure, section, measure, nbStaves, staffOffset, i);
        // Add the measure to the system - if already there from a previous part we'll just merge the content
        this.AddMeasure(section, measure, i);
      }
      else {
        // Handle barline parsing for the multirests (barline defined in last measure of the mRest)
        const lastElement = this.m_multiRestsEntries().find((e) => i === e[1]);
        if (lastElement) {
          const measureEntry = [...this.m_measureCounts.entries()].find((e) => lastElement[0] === e[1]);
          if (measureEntry) {
            for (let it = xmlMeasure.first_child(); !it.empty(); it = it.next_sibling()) {
              if (this.IsElement(it, 'barline')) {
                this.ReadMusicXmlBarLine(it, measureEntry[0] as Measure);
              }
            }
          }
        }
      }
      ++i;
    }

    // clean up part specific stacks
    if (this.m_openDashesStack.length > 0) {
      for (const iter of this.m_openDashesStack) {
        LogWarning("MusicXML import: dashes/extender lines for '%s' could not be closed",
          (iter[0] as VrvObject).GetID());
      }
      this.m_openDashesStack = [];
    }
    if (this.m_bracketStack.length > 0) {
      for (const iter of this.m_bracketStack) {
        LogWarning("MusicXML import: bracketSpan for '%s' could not be closed", (iter[0] as VrvObject).GetID());
      }
      this.m_bracketStack = [];
    }
    if (this.m_hairpinStack.length > 0) {
      LogWarning('MusicXML import: There are %d hairpins left open', this.m_hairpinStack.length);
      this.m_hairpinStack = [];
    }

    return false;
  }

  /** Ordered entries of m_multiRests (C++ std::map ordered iteration). */
  protected m_multiRestsEntries(): Array<[number, number]> {
    return [...this.m_multiRests.entries()].sort((a, b) => a[0] - b[0]);
  }

  /** C++ iomusxml.cpp 1880-2018. */
  protected ReadMusicXmlMeasure(node: xml_node, section: Section, measure: Measure, nbStaves: number,
    staffOffset: number, index: number): boolean {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    const measureNum = node.attribute('number').as_string();
    if (!node.attribute('id').empty()) measure.SetID(node.attribute('id').as_string());
    measure.SetN(measureNum as unknown as number);

    const implicit = node.attribute('implicit').as_bool();
    if (implicit) {
      const mNum = new MNum();
      // An empty mNum means that we like to render this measure number as blank.
      measure.AddChild(mNum as unknown as VrvObject);
    }

    for (let i = 0; i < nbStaves; ++i) {
      // the staff @n must take into account the staffOffset
      const staff = new Staff();
      staff.SetN(i + 1 + staffOffset);
      staff.SetVisible(ConvertWordToBool(
        node.child('attributes').child('staff-details').attribute('print-object').value()) as unknown as number);
      measure.AddChild(staff as unknown as VrvObject);
      // layers will be added in SelectLayer
    }

    // Normally the stack should be empty
    this.m_elementStackMap.clear();

    // reset measure time
    this.m_durTotal = 0;

    // reset clef changed flag
    this.m_clefChanged = 0;

    const mrestPosition = this.m_multiRests.get(index);
    const isMRestInOtherSystem = mrestPosition !== undefined;
    let multiRestStaffNumber = 1;

    // read the content of the measure
    for (let child = node.first_child(); !child.empty(); child = child.next_sibling()) {
      // first check if there is a multi measure rest
      const multiRestNode = this.findDescendantElement(child, 'multiple-rest');
      if (!multiRestNode.empty()) {
        const multiRestLength = multiRestNode.text().as_int();
        const symbols = multiRestNode.attribute('use-symbols').as_string();
        const multiRest = new MultiRest();
        if (symbols === 'no') {
          // default by MusicXML specification
          multiRest.SetBlock(BOOLEAN_true);
        }
        else if (symbols === 'yes') {
          multiRest.SetBlock(BOOLEAN_false);
        }
        multiRest.SetNum(multiRestLength);
        const layer = this.SelectLayerByNumber(1, measure);
        this.AddLayerElement(layer, multiRest as unknown as VrvObject, 0);
        this.m_multiRests.set(index, index + multiRestLength - 1);
        this.ReadMusicXmlAttributes(child, section, measure);
        break;
      }
      else if (isMRestInOtherSystem) {
        if (multiRestStaffNumber > 1 && !this.IsElement(child, 'backup')) continue;
        const multiRest = new MultiRest();
        multiRest.SetNum(mrestPosition! - index + 1);
        const layer = this.SelectLayerByNumber(multiRestStaffNumber, measure);
        this.AddLayerElement(layer, multiRest as unknown as VrvObject, 0);
        if (multiRestStaffNumber < nbStaves) multiRestStaffNumber++;
        continue;
      }
      if (this.IsElement(child, 'attributes')) {
        this.ReadMusicXmlAttributes(child, section, measure);
      }
      else if (this.IsElement(child, 'backup')) {
        this.ReadMusicXmlBackup(child, measure, measureNum);
      }
      else if (this.IsElement(child, 'barline')) {
        this.ReadMusicXmlBarLine(child, measure);
      }
      else if (this.IsElement(child, 'direction')) {
        this.ReadMusicXmlDirection(child, measure, measureNum, staffOffset, section);
      }
      else if (this.IsElement(child, 'sound')) {
        this.ReadMusicXmlSound(child, measure, section);
      }
      else if (this.IsElement(child, 'figured-bass')) {
        this.ReadMusicXmlFigures(child, measure);
      }
      else if (this.IsElement(child, 'forward')) {
        this.ReadMusicXmlForward(child, measure, measureNum);
      }
      else if (this.IsElement(child, 'harmony')) {
        this.ReadMusicXmlHarmony(child, measure);
      }
      else if (this.IsElement(child, 'note')) {
        this.ReadMusicXmlNote(child, measure, staffOffset, section);
      }
      // for now only check first part
      else if (this.IsElement(child, 'print') && this.isFirstPart(node)) {
        this.ReadMusicXmlPrint(child, section);
      }
    }

    // set metcon to false for pickup measures
    let measureTotal = this.m_ppq * 4;
    for (const num of this.m_meterCount) measureTotal *= num;
    measureTotal = Math.trunc(measureTotal / this.m_meterUnit);
    if (this.m_durTotal && this.m_durTotal !== measureTotal) {
      measure.SetMetcon(BOOLEAN_false);
    }

    this.MatchTies(true);
    if (this.m_tieStack.length > 0) this.MatchTies(false);
    for (const openTie of this.m_tieStack) {
      (openTie.m_note as Note).SetScoreTimeOnset(new Fraction(-1)); // make scoreTimeOnset small for next measure
    }

    // clear stop stacks after each measure
    this.m_hairpinStopStack = [];
    this.m_tieStopStack = [];

    for (const staff of measure.GetChildrenForModification()) {
      if (staff.GetClassId() !== ClassId.STAFF) {
        continue;
      }
      if (staff.GetChildCount(ClassId.UNSPECIFIED) === 0) { // add a default layer, if staff completely empty at the end of a measure.
        const emptyLayer = new Layer();
        emptyLayer.AddChild(new MSpace() as unknown as VrvObject);
        (staff as unknown as VrvObject).AddChild(emptyLayer as unknown as VrvObject);
      }
    }

    // clear arpeggio stack so no other notes may be added.
    if (this.m_ArpeggioStack.length > 0) this.m_ArpeggioStack = [];

    // clear prevLayer
    this.m_prevLayer = null;

    // clear current layer
    this.m_isLayerInitialized = false;
    this.m_currentLayer = null;

    return true;
  }

  /** `part[not(preceding-sibling::part)]` XPath fold — node is the measure's parent part. */
  protected isFirstPart(node: xml_node): boolean {
    for (let p = node; !p.empty(); p = p.parent()) {
      if (p.name() === 'part') {
        return p.previous_sibling('part').empty();
      }
    }
    return false;
  }

  /** `.//multiple-rest` descendant search fold. */
  protected findDescendantElement(node: xml_node, name: string): xml_node {
    if (node.empty()) return new xml_node();
    if (this.IsElement(node, name)) return node;
    for (let c = node.first_child(); !c.empty(); c = c.next_sibling()) {
      const found = this.findDescendantElement(c, name);
      if (!found.empty()) return found;
    }
    return new xml_node();
  }

  /** C++ iomusxml.cpp 2019-2047. */
  protected MatchTies(matchLayers: boolean): void {
    // match open ties with close ties
    let i = 0;
    while (i < this.m_tieStack.length) {
      let tieMatched = false;
      let matchedStop = -1;
      for (let j = 0; j < this.m_tieStopStack.length; j++) {
        // match tie stop with pitch/oct identity, with start note earlier than end note,
        // and with earliest end note.
        const open = this.m_tieStack[i];
        const close = this.m_tieStopStack[j];
        if ((open.m_note as Note).IsEnharmonicWith(close.m_note as Note)
          && (open.m_note as Note).GetScoreTimeOnset().compare((close.m_note as Note).GetScoreTimeOnset()) < 0
          && (!matchLayers || open.m_layerNum === close.m_layerNum)) {
          (open.m_tie as Tie).SetEndid(`#${(close.m_note as VrvObject).GetID()}`);
          tieMatched = true;
          matchedStop = j;
          break;
        }
      }
      if (tieMatched) {
        this.m_tieStack.splice(i, 1);
        this.m_tieStopStack.splice(matchedStop, 1);
      }
      else {
        ++i;
      }
    }
  }

  /** C++ iomusxml.cpp 2048-2102. */
  protected ReadMusicXmlAttributes(node: xml_node, section: Section, measure: Measure): void {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    let divisionChange = false;

    // check for changes in divisions
    const divisions = node.child('divisions');
    if (!divisions.empty()) {
      // we'll only convert this to MEI if it actually changes
      divisionChange = this.m_ppq !== divisions.text().as_int();
      this.m_ppq = divisions.text().as_int();
    }

    // read clef changes as MEI clef and add them to the stack
    for (let clef = node.child('clef'); !clef.empty(); clef = clef.next_sibling('clef')) {
      // check if we have a staff number
      let staffNum = clef.attribute('number').as_int();
      staffNum = staffNum < 1 ? 1 : staffNum;
      const staff = measure.GetChild(staffNum - 1, ClassId.STAFF) as Staff | null;
      if (!staff) throw new Error('MusicXmlInput: staff not found');
      const meiClef = this.ConvertClef(clef);
      if (meiClef) {
        const afterBarline = clef.attribute('after-barline').as_bool();
        this.m_clefChangeQueue.push(new MusicXmlClefChange(
          this.m_measureCounts.get(measure)!, staff, this.m_currentLayer as Layer | null, meiClef,
          this.m_durTotal, afterBarline));
        this.m_clefChanged++;
      }
    }

    // key and time change
    const key = node.child('key');
    const time = node.child('time');

    // for now only read first key change in first part and update scoreDef
    const isFirstPartAttrs = this.isFirstPart(node);
    // C++: preceding-sibling::attributes/key — check any previous attributes sibling holding a key
    let prevAttributesHasKey = false;
    for (let sib = node.previous_sibling(); !sib.empty(); sib = sib.previous_sibling()) {
      if (this.IsElement(sib, 'attributes') && !sib.child('key').empty()) prevAttributesHasKey = true;
    }
    if ((!key.empty() || !time.empty() || divisionChange) && isFirstPartAttrs && !prevAttributesHasKey) {
      const scoreDef = this.GetOrCreateLastScoreDef(section);
      if (!scoreDef) throw new Error('MusicXmlInput: scoreDef missing');
      if (!key.empty()) {
        const meiKey = this.ConvertKey(key);
        scoreDef.AddChild(meiKey as unknown as VrvObject);
      }

      if (!time.empty()) {
        this.ReadMusicXMLMeterSig(time, scoreDef);
      }

      if (!divisions.empty()) {
        scoreDef.SetPpq(divisions.text().as_int());
      }
    }
    else if (!time.empty() && !isFirstPartAttrs) {
      this.m_meterUnit = time.child('beat-type').text().as_int();
    }

    const measureRepeat = node.child('measure-style').child('measure-repeat');
    const measureSlash = node.child('measure-style').child('slash');
    if (!measureRepeat.empty()) {
      this.m_mRpt = this.HasAttributeWithValue(measureRepeat, 'type', 'start');
    }
    if (!measureSlash.empty()) {
      this.m_slash = this.HasAttributeWithValue(measureSlash, 'type', 'start');
    }
  }

  /** C++ iomusxml.cpp 2113-2119. */
  protected ReadMusicXmlBackup(node: xml_node, _measure: Measure, _measureNum: string): void {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    this.m_durTotal -= node.child('duration').text().as_int();
    this.m_isLayerInitialized = false;
  }

  /** C++ iomusxml.cpp 2836-2842: forward advances time only; no layer-init reset. */
  protected ReadMusicXmlForward(node: xml_node, _measure: Measure, _measureNum: string): void {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    this.m_durTotal += node.child('duration').text().as_int();
  }

  /** C++ iomusxml.cpp 2129. Barline reading; endings, repeats and fermatas. */
  protected ReadMusicXmlBarLine(node: xml_node, measure: Measure): void {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    const staff = measure.GetFirst(ClassId.STAFF) as Staff | null;
    if (!staff) throw new Error('MusicXmlInput: staff not found');

    const barStyle = node.child('bar-style').text().as_string();
    const repeat = !node.child('repeat').empty();
    let repeatTimes = 1;
    let repeatAfterJump = false;
    if (repeat) {
      repeatTimes = node.child('repeat').attribute('times').as_int(2);
      repeatAfterJump = node.child('repeat').attribute('after-jump').as_bool(false);
    }
    if (barStyle !== '') {
      const barRendition = ConvertStyleToRend(barStyle, repeat);
      if (this.HasAttributeWithValue(node, 'location', 'left')) {
        measure.SetLeft(barRendition);
      }
      else if (this.HasAttributeWithValue(node, 'location', 'middle')) {
        const barLine = new BarLine();
        barLine.SetColor(node.child('bar-style').attribute('color').as_string());
        barLine.SetForm(barRendition as unknown as number);
        const layer = this.SelectLayerForNode(node, measure);
        this.AddLayerElement(layer, barLine as unknown as VrvObject);
      }
      else {
        measure.SetRight(barRendition);
        if (barStyle === 'short' || barStyle === 'tick') {
          measure.SetBarLen(4);
          if (barStyle === 'short') {
            measure.SetBarPlace(2);
          }
          else {
            // bar.place counts in note order (high values are vertically higher).
            measure.SetBarPlace(6);
          }
        }
      }
    }
    if (barStyle === '' && repeat) { // add repeat information, also when bar-style is not provided
      if (this.HasAttributeWithValue(node, 'location', 'left')) {
        measure.SetLeft(BARRENDITION_rptstart);
      }
      else if (this.HasAttributeWithValue(node, 'location', 'middle')) {
        LogWarning("MusicXML import: Unsupported barline location 'middle' in %s", measure.GetN());
      }
      else {
        measure.SetRight(BARRENDITION_rptend);
      }
    }

    // start or end section
    if (measure.GetLeft() === BARRENDITION_rptstart) {
      if (!this.m_sectionStart || !this.m_sectionStart.m_repeatStart) {
        this.m_sectionStart = new MusicXmlSectionInfo(true);
      }
    }
    if (measure.GetRight() === BARRENDITION_rptend) {
      this.m_sectionStop = new MusicXmlSectionInfo(new MusicXmlRepeatInfo(repeatTimes, repeatAfterJump));
    }

    // parse endings (prima volta, seconda volta...)
    const ending = node.child('ending');
    if (!ending.empty()) {
      const endingNumber = ending.attribute('number').as_string();
      const endingType = ending.attribute('type').as_string();
      const endingText = ending.text().as_string();
      if (endingType === 'start') {
        // check for corresponding stop points
        const endingEnd = this.FindFollowingEnding(node, endingNumber);
        if (endingEnd) {
          if (!this.m_sectionStart) this.m_sectionStart = new MusicXmlSectionInfo();
          this.m_sectionStart.merge(new MusicXmlEndingInfo(endingNumber, endingType, endingText));
        }
      }
      else if (endingType === 'stop' || endingType === 'discontinue') {
        if (this.m_sections.length === 0) {
          LogWarning('MusicXML import: Dangling ending tag skipped');
        }
        else {
          if (!this.m_sectionStop) this.m_sectionStop = new MusicXmlSectionInfo();
          this.m_sectionStop.merge(new MusicXmlEndingInfo(endingNumber, endingType, endingText));
        }
      }
    }

    // fermatas
    let fermataCounter = 0;
    for (const xmlFermata of this.selectNodes(node, 'fermata')) {
      ++fermataCounter;
      const fermata = new Fermata();
      this.m_controlElements.push([this.m_measureCounts.get(measure)!, fermata]);
      if (this.HasAttributeWithValue(node, 'location', 'left')) {
        fermata.SetTstamp(0);
      }
      else if (this.HasAttributeWithValue(node, 'location', 'middle')) {
        LogWarning("MusicXML import: Unsupported barline location 'middle'");
      }
      else {
        fermata.SetTstamp((this.m_durTotal) * (this.m_meterUnit) / (4 * this.m_ppq) + 1.0);
      }
      if (!xmlFermata.attribute('id').empty()) fermata.SetID(xmlFermata.attribute('id').as_string());

      if (fermataCounter < 2) {
        fermata.SetStaff(strToIntList(String(staff.GetN())));
      }
      else {
        const lastStaff = measure.GetLast() as Staff;
        if (!lastStaff || lastStaff.GetClassId() !== ClassId.STAFF) {
          throw new Error('MusicXmlInput: last staff not found');
        }
        fermata.SetStaff(strToIntList(String(lastStaff.GetN())));
      }

      this.ShapeFermata(fermata, xmlFermata);
    }
  }

  /** XPath `following::ending[@number='X'][@type != 'start']` mini-XPath equivalent. */
  protected FindFollowingEnding(node: xml_node, endingNumber: string): xml_node | null {
    // Walk following siblings and their descendants within the same parent; then
    // continue in subsequent measures of the same part (the C++ following:: axis
    // scans all following document nodes).
    let current: xml_node | null = node;
    const visit = (candidate: xml_node): xml_node | null => {
      if (candidate.name() === 'ending'
        && candidate.attribute('number').as_string() === endingNumber
        && candidate.attribute('type').as_string() !== 'start') {
        return candidate;
      }
      for (const child of candidate.children()) {
        const found = visit(child);
        if (found) return found;
      }
      return null;
    };
    while (current) {
      let nextSibling = current.next_sibling();
      while (!nextSibling.empty()) {
        const found = visit(nextSibling);
        if (found) return found;
        nextSibling = nextSibling.next_sibling();
      }
      current = current.parent().empty() ? null : current.parent();
    }
    return null;
  }

  /** C++ iomusxml.cpp 201. */
  protected ProcessClefChangeQueue(section: Section): void {
    while (this.m_clefChangeQueue.length > 0) {
      const clefChange = this.m_clefChangeQueue.shift()!;
      const currentMeasure = this.FindMeasureByCount(clefChange.m_measureCount) as Measure | null;
      if (!currentMeasure) {
        LogWarning('MusicXML import: Clef change at measure %d, staff %d, time %d not inserted',
          clefChange.m_measureCount + 1, clefChange.m_staff.GetN(), clefChange.m_scoreOnset);
        continue;
      }
      if (!clefChange.m_scoreOnset && !clefChange.m_afterBarline) {
        // First try to check whether current measure already exists in the section.
        const previousMeasure = (section as unknown as VrvObject).GetPrevious(
          currentMeasure as unknown as VrvObject, ClassId.MEASURE) as Measure | null;
        if (!previousMeasure) {
          this.AddClefs(currentMeasure, clefChange);
          continue;
        }
        const comparisonStaff = new AttNIntegerComparison(ClassId.STAFF, clefChange.m_staff.GetN());
        const previousStaff = (previousMeasure as unknown as VrvObject).FindDescendantByComparison(
          comparisonStaff) as Staff | null;
        if (!previousStaff) {
          this.AddClefs(currentMeasure, clefChange);
          continue;
        }
        const previousLayer = (previousStaff as unknown as VrvObject).FindDescendantByType(
          ClassId.LAYER, UNLIMITED_DEPTH, BACKWARD) as Layer | null;
        if (!previousLayer) {
          this.AddClefs(currentMeasure, clefChange);
        }
        else {
          // For previous measure we need to make sure that clef is set at the end
          let steps = 1;
          for (const num of this.m_meterCount) steps += num;
          const endDuration = Math.trunc(4 * this.m_ppq * steps / this.m_meterUnit);
          const previousClefChange = new MusicXmlClefChange(
            -1, previousStaff, previousLayer, clefChange.m_clef, endDuration, false);
          this.AddClefs(previousMeasure, previousClefChange);
        }
      }
      else {
        this.AddClefs(currentMeasure, clefChange);
      }
    }
  }

  /** C++ iomusxml.cpp 279-312. */
  protected AddClefs(measure: Measure, clefChange: MusicXmlClefChange): void {
    // For both measure and staff make sure that corresponding staff/layer is actually a child of it
    let idx = (measure as unknown as VrvObject).GetChildIndex(clefChange.m_staff as VrvObject);
    if (idx !== -1) {
      idx = clefChange.m_layer
        ? (clefChange.m_staff as VrvObject).GetChildIndex(clefChange.m_layer as VrvObject) : -1;
      if (!clefChange.m_layer) {
        const firstLayer = (clefChange.m_staff as VrvObject).GetChild(0, ClassId.LAYER) as Layer | null;
        if (firstLayer) {
          this.InsertClefToLayer(clefChange.m_staff as Staff, firstLayer, clefChange.m_clef,
            clefChange.m_scoreOnset);
        }
      }
      else if (idx !== -1) {
        this.InsertClefToLayer(clefChange.m_staff as Staff, clefChange.m_layer as Layer, clefChange.m_clef,
          clefChange.m_scoreOnset);
      }
      else {
        // cross-staff clef case: replace an mSpace layer with the clef
        const mSpace = (clefChange.m_staff as VrvObject).FindDescendantByType(
          ClassId.MSPACE) as VrvObject | null;
        if (mSpace) {
          const parentLayer = mSpace.GetParent() as Layer | null;
          if (mSpace && parentLayer) {
            (parentLayer as unknown as VrvObject).DeleteChild(mSpace);
            this.m_elementStackMap.set(parentLayer, []);
            this.FillSpace(parentLayer, clefChange.m_scoreOnset, false, 0);
            (parentLayer as unknown as VrvObject).AddChild(clefChange.m_clef as VrvObject);
          }
        }
        else {
          const firstLayer = (clefChange.m_staff as VrvObject).GetChild(0, ClassId.LAYER) as Layer | null;
          if (firstLayer) {
            this.InsertClefToLayer(clefChange.m_staff as Staff, firstLayer, clefChange.m_clef,
              clefChange.m_scoreOnset);
          }
        }
      }
    }
  }

  /** C++ iomusxml.cpp 314-358. */
  protected InsertClefToLayer(staff: Staff, layer: Layer, clef: Clef, scoreOnset: number): void {
    // check any previous existing layers for the same staff for #sameas clefs
    const staffLayers = (staff as unknown as VrvObject).FindAllDescendantsByType(
      ClassId.LAYER, false) as VrvObject[];
    for (const listLayer of staffLayers) {
      const otherLayer = listLayer as Layer;
      const layerTimes = this.m_layerTimes.get(otherLayer);
      if (!layerTimes) continue;
      // Get first element for the same (or higher if same is not present) duration
      // std::map lower_bound fold over sorted keys
      const keys = [...layerTimes.keys()].sort((a, b) => a - b);
      const startIdx = keys.findIndex((k) => k >= scoreOnset);
      // Add either clef or #sameas, depending on the layer we're adding to
      let clefToAdd: Clef;
      if (listLayer === (layer as unknown as VrvObject)) {
        clefToAdd = clef;
      }
      else {
        clefToAdd = new Clef();
        clefToAdd.SetSameas(`#${clef.GetID()}`);
      }

      // In case scoreOnset is 0 - add clef before the first element
      if (!scoreOnset) {
        const firstElems = startIdx !== -1 ? layerTimes.get(keys[startIdx]) : layerTimes.get(keys[0]);
        if (firstElems && firstElems.length > 0) {
          this.InsertClefIntoObjectAt(firstElems[0] as VrvObject, clefToAdd as Clef, otherLayer, scoreOnset, false);
        }
      }
      else {
        // If corresponding time couldn't be found - add clef to the end of the layer
        if (startIdx === -1) {
          (otherLayer as unknown as VrvObject).AddChild(clefToAdd as unknown as VrvObject);
          const lastKey = keys[keys.length - 1];
          layerTimes.set(lastKey, [...(layerTimes.get(lastKey) ?? []), clefToAdd as unknown as VrvObject]);
        }
        else {
          // Always try to add clefs at the end of current duration
          const actualScoreOnset = keys[startIdx];
          let endIdx = keys.findIndex((k) => k > actualScoreOnset);
          if (endIdx === -1) endIdx = keys.length;
          const endKey = keys[endIdx - 1];
          const elems = layerTimes.get(endKey) ?? [];
          const layerElement = elems[elems.length - 1];
          if (layerElement) {
            this.InsertClefIntoObjectAt(layerElement as VrvObject, clefToAdd as Clef, otherLayer, scoreOnset, true);
          }
        }
      }
    }
  }

  /** C++ InsertClefIntoObject(LayerElement*, ...) 331-346. */
  protected InsertClefIntoObjectAt(layerElement: VrvObject, clef: Clef, layer: Layer, scoreOnset: number,
    insertAfter: boolean): void {
    const parent = layerElement.GetParent()!;
    if (parent.GetClassId() === ClassId.LAYER) {
      this.InsertClefIntoObject(parent, clef, layerElement, insertAfter);
      const times = this.m_layerTimes.get(layer)!;
      times.set(scoreOnset, [...(times.get(scoreOnset) ?? []), clef as VrvObject]);
    }
    else {
      if (parent.IsAnyOf([ClassId.CHORD, ClassId.FTREM, ClassId.TABGRP])) {
        this.InsertClefIntoObject(parent.GetParent()!, clef, parent, insertAfter);
      }
      else {
        this.InsertClefIntoObject(parent, clef, layerElement, insertAfter);
      }
    }
  }

  /** C++ InsertClefIntoObject(Object*, ...) 348-357. */
  protected InsertClefIntoObject(parent: VrvObject, clef: Clef, layerElement: VrvObject,
    insertAfter: boolean): void {
    if (parent.GetChildIndex(layerElement) === -1) return;
    if (insertAfter) {
      parent.InsertAfter(layerElement, clef as VrvObject);
    }
    else {
      parent.InsertBefore(layerElement, clef as VrvObject);
    }
  }

  /** C++ iomusxml.cpp 359-440. */
  protected AddMeasure(section: Section, measure: Measure, i: number): void {
    let contentMeasure: Measure | null = null;

    // we just need to add a measure
    if ((section as unknown as VrvObject).GetChildCount(ClassId.MEASURE)
      <= i - this.GetMrestMeasuresCountBeforeIndex(i)) {
      (section as unknown as VrvObject).AddChild(measure as unknown as VrvObject);
      contentMeasure = measure;
    }
    // otherwise copy the content to the corresponding existing measure
    else {
      let existingMeasure: Measure | null = null;
      // Search by measure number first
      const matchingMeasures: VrvObject[] = [];
      const comparisonMeasure = new AttNNumberLikeComparison(ClassId.MEASURE,
        measure.GetN() as unknown as string);
      (section as unknown as VrvObject).FindAllDescendantsByComparison(matchingMeasures, comparisonMeasure, 1);
      // For now take the first match
      if (matchingMeasures.length > 0) {
        existingMeasure = matchingMeasures[0] as Measure;
      }
      // Prefer any measure with matching index (measure numbers might be non-unique)
      for (const object of matchingMeasures) {
        if (this.m_measureCounts.get(object) === i) {
          existingMeasure = object as Measure;
          break;
        }
      }
      if (existingMeasure) {
        for (const current of (measure as unknown as VrvObject).GetChildrenForModification()) {
          if (current.GetClassId() !== ClassId.STAFF) {
            continue;
          }
          current.MoveItselfTo(existingMeasure as unknown as VrvObject);
        }
        (measure as unknown as VrvObject).ClearRelinquishedChildren();
      }
      else {
        // The measure was not transferred and not added to the tree.
        LogError('MusicXML import: Mismatching measure number %s', String(measure.GetN()));
      }
      contentMeasure = existingMeasure;

      this.m_measureCounts.delete(measure);
      this.m_garbage.push(measure);
    }

    // Insert the measure in the section/ending structure that will be expanded at the end.
    if (contentMeasure && !this.MeasureInExistingSection(contentMeasure)) {
      // starting a new section
      if (this.m_sectionStart) {
        this.m_sections.push([this.m_sectionStart, []]);
      }
      // add current measure to current section
      if (this.m_sections.length > 0) {
        this.m_sections[this.m_sections.length - 1][1].push(contentMeasure as unknown as VrvObject);
      }
      // jump and fine info
      if (this.m_jumpInfo && this.m_sections.length > 0) {
        this.m_sections[this.m_sections.length - 1][0].m_jumpInfo = this.m_jumpInfo;
      }
      if (this.m_fineInfo && this.m_sections.length > 0) {
        this.m_sections[this.m_sections.length - 1][0].m_fineInfo = this.m_fineInfo;
      }
      // closing a section: open a new one
      if (this.m_sectionStop && this.m_sections.length > 0) {
        if (this.m_sectionStop.m_classId === ClassId.ENDING) {
          this.m_sections[this.m_sections.length - 1][0].m_endingInfo = this.m_sectionStop.m_endingInfo;
        }
        else {
          this.m_sections[this.m_sections.length - 1][0].m_repeatInfo = this.m_sectionStop.m_repeatInfo;
        }
        this.m_sections.push([new MusicXmlSectionInfo(), []]);
      }
    }
    this.m_sectionStart = null;
    this.m_sectionStop = null;
    this.m_jumpInfo = null;
    this.m_fineInfo = null;
  }

  /** C++ iomusxml.cpp 5136-5147. */
  protected MeasureInExistingSection(measure: Measure): boolean {
    for (const [, measures] of this.m_sections) {
      for (const sectionMeasure of measures) {
        if ((sectionMeasure as VrvObject).GetID() === (measure as unknown as VrvObject).GetID()) return true;
      }
    }
    return false;
  }

  /** C++ iomusxml.cpp 443-468. */
  protected AddLayerElement(layer: Layer, element: VrvObject, duration = 0): void {
    let currTime = 0;
    if (this.m_layerEndTimes.has(layer)) currTime = this.m_layerEndTimes.get(layer)!;
    if (((layer as unknown as VrvObject).GetChildrenForModification().length === 0 && this.m_durTotal > 0)
      || currTime < this.m_durTotal) {
      this.FillSpace(layer, this.m_durTotal - currTime, true, 0);
    }

    const stack = this.m_elementStackMap.get(layer) ?? [];
    if (stack.length === 0) {
      (layer as unknown as VrvObject).AddChild(element);
    }
    else {
      (stack[stack.length - 1] as VrvObject).AddChild(element);
    }
    // Recheck if AddChild was successful
    if (!element.GetParent()) return;

    this.m_layerEndTimes.set(layer, this.m_durTotal + duration);
    if (!element.IsAnyOf([ClassId.BEAM, ClassId.TUPLET])) {
      const times = this.m_layerTimes.get(layer) ?? new Map<number, VrvObject[]>();
      const key = this.m_durTotal + duration;
      times.set(key, [...(times.get(key) ?? []), element]);
      this.m_layerTimes.set(layer, times);
    }
  }

  /** C++ iomusxml.cpp 469-503 — node-driven layer selection. */
  protected SelectLayerForNode(node: xml_node, measure: Measure): Layer {
    // If value is initialized - get current layer
    if (this.m_isLayerInitialized) return this.m_currentLayer as Layer;

    // Find voice number of node
    let layerNum = node.child('voice').empty() ? 1 : node.child('voice').text().as_int();
    if (layerNum < 1) {
      LogWarning('MusicXML import: Layer %d cannot be found', layerNum);
      layerNum = 1;
    }

    // If not initialized and layer is not set - get first layer in the first staff
    if (!this.m_currentLayer) {
      const staff = (measure as unknown as VrvObject).GetChild(0, ClassId.STAFF) as Staff | null;
      if (!staff) throw new Error('MusicXmlInput: staff not found');
      this.m_currentLayer = this.SelectLayerByNumberAndStaff(layerNum, staff);
      this.m_isLayerInitialized = true;
      return this.m_currentLayer as Layer;
    }

    // if not, take staff info of node element
    let staffNum = node.child('staff').empty() ? 1 : node.child('staff').text().as_int();
    if (staffNum < 1 || staffNum > measure.GetStaffCount()) {
      LogWarning('MusicXML import: Staff %d cannot be found', staffNum);
      staffNum = 1;
    }
    staffNum--;
    const staff = (measure as unknown as VrvObject).GetChild(staffNum, ClassId.STAFF) as Staff | null;
    if (!staff) throw new Error('MusicXmlInput: staff not found');
    this.m_currentLayer = this.SelectLayerByNumberAndStaff(layerNum, staff);

    this.m_isLayerInitialized = true;
    return this.m_currentLayer as Layer;
  }

  /** C++ SelectLayer(short, Measure*) 505-511. */
  protected SelectLayerByNumber(staffNum: number, measure: Measure): Layer {
    staffNum--;
    const staff = (measure as unknown as VrvObject).GetChild(staffNum, ClassId.STAFF) as Staff | null;
    if (!staff) throw new Error('MusicXmlInput: staff not found');
    // layer -1 means the first one
    return this.SelectLayerByNumberAndStaff(-1, staff);
  }

  /** C++ SelectLayer(short, Staff*) 514-531. */
  protected SelectLayerByNumberAndStaff(layerNum: number, staff: Staff): Layer {
    let layer: Layer | null = null;
    // no layer specified, return the first one (if any)
    if (layerNum === -1) {
      if ((staff as unknown as VrvObject).GetChildCount(ClassId.UNSPECIFIED) > 0) {
        layer = (staff as unknown as VrvObject).GetChild(0) as unknown as Layer;
      }
      // otherwise set @n to 1
      layerNum = 1;
    }
    else {
      const comparisonLayer = new AttNIntegerComparison(ClassId.LAYER, layerNum);
      layer = (staff as unknown as VrvObject).FindDescendantByComparison(comparisonLayer, 1) as Layer | null;
    }
    if (layer) return layer;
    // else add it
    layer = new Layer();
    layer.SetN(layerNum);
    (staff as unknown as VrvObject).AddChild(layer as unknown as VrvObject);
    this.m_elementStackMap.set(layer, []);
    return layer;
  }

  /** C++ iomusxml.cpp 533-544. */
  protected RemoveLastFromStack(classId: ClassId, layer: Layer): void {
    const stack = this.m_elementStackMap.get(layer) ?? [];
    for (let i = stack.length - 1; i >= 0; i--) {
      if ((stack[i] as VrvObject).GetClassId() === classId) {
        stack.splice(i, 1);
        return;
      }
    }
  }

  /** C++ iomusxml.cpp 546-554. */
  protected IsInStack(classId: ClassId, layer: Layer): boolean {
    const stack = this.m_elementStackMap.get(layer) ?? [];
    return stack.some((element) => (element as VrvObject).GetClassId() === classId);
  }

  /** C++ iomusxml.cpp 556-596. */
  protected FillSpace(layer: Layer, dur: number, withClefs = true, offset = 0): void {
    // Split spaces to take into account pending clef changes in that layer
    if (withClefs && this.m_clefChangeQueue.length > 0) {
      const durs: number[] = [];
      let processed = 0;
      for (const clefChange of this.m_clefChangeQueue) {
        if (clefChange.m_layer !== layer) continue;
        if (clefChange.m_scoreOnset < dur) {
          durs.push(clefChange.m_scoreOnset - processed);
          processed = clefChange.m_scoreOnset;
        }
      }
      if (processed > 0 && processed < dur) {
        durs.push(dur - processed);
      }
      if (durs.length > 0) {
        let processed2 = 0;
        for (const durList of durs) {
          // Call it recursively with split durations and the processed offset
          this.FillSpace(layer, durList, false, processed2);
          processed2 += durList;
        }
        return;
      }
    }

    while (dur > 0) {
      let quarters = dur / this.m_ppq;
      quarters = Math.pow(2, Math.floor(Math.log(quarters) / Math.log(2)));
      // limit space for now
      if (quarters > 2) quarters = 2;
      const durStr = String(Math.trunc(4 / quarters));

      const space = new Space();
      space.SetDur(new AttBase().StrToDuration(durStr));
      space.SetDurPpq(this.m_ppq * quarters);
      const stack = this.m_elementStackMap.get(layer) ?? [];
      if (stack.length === 0) {
        (layer as unknown as VrvObject).AddChild(space as unknown as VrvObject);
      }
      else {
        (stack[stack.length - 1] as VrvObject).AddChild(space as unknown as VrvObject);
      }
      // C++ FillSpace takes int dur/offset: compound assignment truncates each
      // iteration, which is what terminates the loop on fractional remainders.
      dur = Math.trunc(dur - this.m_ppq * quarters);
      offset = Math.trunc(offset + this.m_ppq * quarters);
      const times = this.m_layerTimes.get(layer) ?? new Map<number, VrvObject[]>();
      times.set(offset, [...(times.get(offset) ?? []), space as unknown as VrvObject]);
      this.m_layerTimes.set(layer, times);
    }
  }

  /** C++ iomusxml.cpp 5185-5192. */
  public IsMultirestMeasure(index: number): boolean {
    for (const [first, second] of this.m_multiRestsEntries()) {
      if (index <= first) return false;
      if (index <= second) return true;
    }
    return false;
  }

  /** C++ iomusxml.cpp 5234-5243. */
  public GetMrestMeasuresCountBeforeIndex(index: number): number {
    let count = 0;
    for (const [first, second] of this.m_multiRestsEntries()) {
      if (index <= first) break;
      count += second - first;
    }
    return count;
  }

  /** C++ iomusxml.cpp:4495 — reuse only a scoreDef after the last measure. */
  protected GetOrCreateLastScoreDef(section: Section): ScoreDef {
    let scoreDef = section.GetLast(ClassId.SCOREDEF) as ScoreDef | null;
    const measure = section.GetLast(ClassId.MEASURE);
    if (!measure || !scoreDef || scoreDef.GetIdx() < measure.GetIdx()) {
      scoreDef = new ScoreDef();
      section.AddChild(scoreDef);
    }
    return scoreDef;
  }

  /** C++ iomusxml.cpp 2247-2800. */
  protected ReadMusicXmlDirection(node: xml_node, measure: Measure, measureNum: string, staffOffset: number,
    section: Section): void {
    const placeStr = node.attribute('placement').as_string();
    const typeNode = node.child('direction-type');
    const voice = this.selectNode(node, 'voice');
    const offset = node.child('offset').text().as_int();
    const staffNode = node.child('staff');
    const soundNode = node.child('sound');

    const timeStamp = (this.m_durTotal + offset) * this.m_meterUnit / (4 * this.m_ppq) + 1.0;

    if (voice) this.m_prevLayer = this.SelectLayerForNode(node, measure);

    // Bracket
    const bracket = typeNode.child('bracket');
    if (!bracket.empty()) {
      let voiceNumber = bracket.attribute('number').as_int();
      voiceNumber = (voiceNumber < 1) ? 1 : voiceNumber;
      if (this.HasAttributeWithValue(bracket, 'type', 'stop')) {
        if (this.m_bracketStack.length === 0) {
          // if this is empty, most likely we're dealing with an extender
        }
        else {
          const front = this.m_bracketStack[0];
          const measureDifference = (this.m_measureCounts.get(measure) ?? 0) - front[1].m_lastMeasureCount;
          (front[0] as BracketSpan).SetLendsym(ConvertLineEndSymbol(bracket.attribute('line-end').as_string()) as unknown as string);
          if (measureDifference >= 0) {
            (front[0] as unknown as { SetTstamp2(v: [number, number]): void }).SetTstamp2([measureDifference, timeStamp]);
          }
          this.m_bracketStack.shift();
        }
      }
      else {
        const bracketSpan = new BracketSpan();
        const openBracket = new MusicXmlOpenSpanner(voiceNumber, this.m_measureCounts.get(measure) ?? 0);
        bracketSpan.SetColor(bracket.attribute('color').as_string());
        (bracketSpan as unknown as { SetLform(v: number): void }).SetLform(strToLineform(bracket.attribute('line-type').as_string()));
        bracketSpan.SetFunc(bracketSpanLog_FUNC_uspecified);
        bracketSpan.SetLstartsym(ConvertLineEndSymbol(bracket.attribute('line-end').as_string()) as unknown as string);
        (bracketSpan as unknown as { SetTstamp(v: number): void }).SetTstamp(timeStamp);
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, bracketSpan]);
        this.m_bracketStack.push([bracketSpan, openBracket]);
      }
    }

    // Dashes (to be connected with previous <dir> or <dynam> as @extender and @tstamp2 attribute
    const dashes = this.selectNode(typeNode, 'bracket|dashes');
    if (dashes) {
      let dashesNumber = dashes.attribute('number').as_int();
      dashesNumber = (dashesNumber < 1) ? 1 : dashesNumber;
      let staffNum = 1;
      if (!staffNode.empty()) staffNum = staffNode.text().as_int() + staffOffset;
      if (this.HasAttributeWithValue(dashes, 'type', 'stop')) {
        let i = 0;
        while (i < this.m_openDashesStack.length) {
          const iter = this.m_openDashesStack[i];
          if (iter[1].m_dirN === dashesNumber && iter[1].m_staffNum === staffNum) {
            const measureDifference = (this.m_measureCounts.get(measure) ?? 0) - iter[1].m_measureCount;
            if (measureDifference >= 0) {
              if ((iter[0] as VrvObject).Is(ClassId.DYNAM)) {
                (iter[0] as unknown as { SetTstamp2(v: [number, number]): void }).SetTstamp2([measureDifference, timeStamp]);
              }
              if ((iter[0] as VrvObject).Is(ClassId.DIR)) {
                (iter[0] as unknown as { SetTstamp2(v: [number, number]): void }).SetTstamp2([measureDifference, timeStamp]);
              }
            }
            this.m_openDashesStack.splice(i, 1);
          }
          else {
            ++i;
          }
        }
      }
      else if (dashes.name().startsWith('dashes')) {
        let controlElement: VrvObject | null = null;
        const measureCount = this.m_measureCounts.get(measure) ?? 0;
        for (let r = this.m_controlElements.length - 1; r >= 0; r--) {
          const riter = this.m_controlElements[r];
          if ((riter[1] as VrvObject).Is(ClassId.DYNAM)) {
            const dynam = riter[1] as Dynam;
            const staffAttr = dynam.GetTimeSpanningInterface().GetStaff();
            if (staffAttr.includes(staffNum + staffOffset)
              && dynam.GetPlace() === strToStaffrel(placeStr)
              && riter[0] === measureCount) {
              dynam.SetExtender(BOOLEAN_true);
              controlElement = dynam;
              break;
            }
          }
          else if ((riter[1] as VrvObject).Is(ClassId.DIR)) {
            const dir = riter[1] as Dir;
            const staffAttr = dir.GetTimeSpanningInterface().GetStaff();
            if (staffAttr.includes(staffNum + staffOffset)
              && dir.GetTextDirInterface().GetPlace() === strToStaffrel(placeStr)
              && riter[0] === measureCount) {
              dir.SetExtender(BOOLEAN_true);
              controlElement = dir;
              break;
            }
          }
        }
        if (controlElement) {
          const openDashes = new MusicXmlOpenDashes(dashesNumber, staffNum, this.m_measureCounts.get(measure) ?? 0);
          this.m_openDashesStack.push([controlElement, openDashes]);
        }
        else {
          LogInfo('MusicXmlImport: dashes could not be matched to <dir> or <dynam> in measure %s.', measureNum);
        }
      }
    }

    const words = this.selectNodes(node, 'direction-type/words');
    const containsWords = words.length > 0;
    let containsDynamics = (this.selectNode(node, 'direction-type/dynamics') !== null)
      || !soundNode.attribute('dynamics').empty();
    const containsTempo = (this.selectNode(node, 'direction-type/metronome') !== null)
      || !soundNode.attribute('tempo').empty();

    // Directive
    let defaultY = 0; // y position attribute, only for directives and dynamics
    if (containsWords && !containsTempo && !containsDynamics) {
      const words2 = [
        ...this.selectNodes(node, 'direction-type/words'),
        ...this.selectNodes(node, 'direction-type/symbol'),
        ...this.selectNodes(node, 'direction-type/coda'),
        ...this.selectNodes(node, 'direction-type/segno'),
      ];
      defaultY = words2[0].attribute('default-y').as_int();
      defaultY = (defaultY * 10) + words2[0].attribute('relative-y').as_int();
      const wordStr = words2[0].text().as_string();
      if (wordStr.startsWith('cresc') || wordStr.startsWith('dim') || wordStr.startsWith('decresc')) {
        containsDynamics = true;
      }
      else {
        const dir = new Dir();
        if (words2.length === 1) {
          dir.SetLang(words2[0].attribute('xml:lang').as_string());
        }
        dir.GetTextDirInterface().SetPlace(strToStaffrel(placeStr));
        dir.GetTimeSpanningInterface().SetTstamp(timeStamp);
        dir.SetType(soundNode.first_attribute().name());
        if (!staffNode.empty()) {
          dir.GetTimeSpanningInterface().SetStaff(strToIntList(String(staffNode.text().as_int() + staffOffset)));
        }
        else if (this.m_prevLayer) {
          dir.GetTimeSpanningInterface().SetStaff(strToIntList(
            String(((this.m_prevLayer as VrvObject).GetParent() as unknown as { GetN(): number }).GetN())));
        }
        else {
          dir.GetTimeSpanningInterface().SetStaff(strToIntList(String(1 + staffOffset)));
        }

        this.TextRendition(words2, dir);
        if (defaultY) {
          defaultY = (defaultY < 0) ? Math.abs(defaultY) : defaultY + 2000;
          dir.SetVgrp(defaultY);
        }
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, dir]);
        this.m_dirStack.push(dir);

        const extender = this.lastNextDirectionTypeChild(words2);
        if (extender.name() === 'bracket' || extender.name() === 'dashes') {
          let extNumber = extender.attribute('number').as_int();
          extNumber = (extNumber < 1) ? 1 : extNumber;
          let extStaffNum = staffNode.text().as_int() + staffOffset;
          extStaffNum = (extStaffNum < 1) ? 1 : extStaffNum;
          dir.SetExtender(BOOLEAN_true);
          if (extender.name().startsWith('bracket')) {
            dir.SetLform(strToLineform(extender.attribute('line-type').as_string()));
          }
          else {
            dir.SetLform(LINEFORM_dashed);
          }
          const openDashes = new MusicXmlOpenDashes(extNumber, extStaffNum, this.m_measureCounts.get(measure) ?? 0);
          this.m_openDashesStack.push([dir, openDashes]);
        }
      }
    }

    // Coda & Segno
    const xmlJump = this.selectNode(typeNode, 'coda|segno');
    if (xmlJump && !containsWords) {
      const mark = new RepeatMark();
      mark.GetTextDirInterface().SetPlace(strToStaffrel(placeStr));
      mark.GetTimePointInterface().SetTstamp(timeStamp);
      mark.SetFunc(ConvertJumpType(xmlJump.name()));
      mark.GetTimePointInterface().SetStaff(strToIntList('1'));
      if (!xmlJump.attribute('smufl').empty()) {
        mark.SetGlyphAuth('smufl');
        mark.SetGlyphName(xmlJump.attribute('smufl').as_string());
      }
      if (!xmlJump.attribute('id').empty()) mark.SetID(xmlJump.attribute('id').as_string());
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, mark]);
    }

    // Dynamics
    if (containsDynamics) {
      // C++: single union query + xpath_node_set::sort() keeps document order.
      // The engine returns union steps in document order, so no re-sort is needed.
      const dynamics = this.selectNodes(node,
        containsWords ? 'direction-type/dynamics|direction-type/words' : 'direction-type/dynamics');

      const dynam = new Dynam();
      dynam.SetPlace(strToStaffrel(placeStr));
      dynam.SetTstamp(timeStamp);
      if (!staffNode.empty()) {
        dynam.SetStaff(strToIntList(String(staffNode.text().as_int() + staffOffset)));
      }
      else if (this.m_prevLayer) {
        dynam.SetStaff(strToIntList(
          String(((this.m_prevLayer as VrvObject).GetParent() as unknown as { GetN(): number }).GetN())));
      }
      else {
        dynam.SetStaff(strToIntList(String(1 + staffOffset)));
      }

      if (!soundNode.empty()) {
        const dynamicsAttr = soundNode.attribute('dynamics').as_float(-1.0);
        if (dynamicsAttr >= 0.0) {
          dynam.SetVal(ConvertDynamicsToMidiVal(dynamicsAttr));
        }
      }

      this.TextRendition(dynamics, dynam);
      if (defaultY === 0 && dynamics.length > 0) {
        defaultY = dynamics[0].attribute('default-y').as_int();
        defaultY = (defaultY * 10) + dynamics[0].attribute('relative-y').as_int();
      }
      defaultY = (defaultY < 0) ? Math.abs(defaultY) : defaultY + 2000;
      dynam.SetVgrp(defaultY);
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, dynam]);
      this.m_dynamStack.push(dynam as unknown as VrvObject);

      if (dynamics.length > 0) {
        const extender = this.lastNextDirectionTypeChild(dynamics);
        if (extender.name() === 'bracket' || extender.name() === 'dashes') {
          let extNumber = extender.attribute('number').as_int();
          extNumber = (extNumber < 1) ? 1 : extNumber;
          let extStaffNum = staffNode.text().as_int() + staffOffset;
          extStaffNum = (extStaffNum < 1) ? 1 : extStaffNum;
          dynam.SetExtender(BOOLEAN_true);
          if (extender.name().startsWith('bracket')) {
            dynam.SetLform(strToLineform(extender.attribute('line-type').as_string()));
          }
          else {
            dynam.SetLform(LINEFORM_dashed);
          }
          const openDashes = new MusicXmlOpenDashes(extNumber, extStaffNum, this.m_measureCounts.get(measure) ?? 0);
          this.m_openDashesStack.push([dynam, openDashes]);
        }
      }
    }

    // Hairpins
    const wedges = this.selectNodes(node, 'direction-type/wedge');
    for (const wedge of wedges) {
      let hairpinNumber = wedge.attribute('number').as_int();
      hairpinNumber = (hairpinNumber < 1) ? 1 : hairpinNumber;
      let matchedWedge = false;
      if (this.HasAttributeWithValue(wedge, 'type', 'stop')) {
        for (let i = 0; i < this.m_hairpinStack.length; i++) {
          const iter = this.m_hairpinStack[i];
          if ((iter[1] as MusicXmlOpenSpanner).m_dirN === hairpinNumber) {
            const measureDifference = (this.m_measureCounts.get(measure) ?? 0) - (iter[1] as MusicXmlOpenSpanner).m_lastMeasureCount;
            if (measureDifference >= 0) {
              (iter[0] as unknown as { SetTstamp2(v: [number, number]): void }).SetTstamp2([measureDifference, timeStamp]);
            }
            if (!wedge.attribute('niente').empty()) {
              (iter[0] as unknown as { SetNiente(v: number): void }).SetNiente(ConvertWordToBool(wedge.attribute('niente').as_string()));
            }
            if ((iter[0] as unknown as { GetForm(): number }).GetForm() === hairpinLog_FORM_cres) {
              if (!wedge.attribute('spread').empty()) {
                // C++ iomusxml.cpp uses a real data_MEASUREMENTSIGNED (SetVu);
                // a literal lacks HasValue() and crashes Hairpin::CalcHeight.
                const opening = new data_MEASUREMENTSIGNED();
                opening.SetVu(wedge.attribute('spread').as_double() / 5);
                (iter[0] as Hairpin).SetOpening(opening as never);
              }
            }
            matchedWedge = true;
            this.m_hairpinStack.splice(i, 1);
            break;
          }
        }
        if (!matchedWedge) {
          this.m_hairpinStopStack.push([0, timeStamp,
            new MusicXmlOpenSpanner(hairpinNumber, this.m_measureCounts.get(measure) ?? 0)]);
        }
      }
      else {
        const hairpin = new Hairpin();
        const openHairpin = new MusicXmlOpenSpanner(hairpinNumber, this.m_measureCounts.get(measure) ?? 0);
        if (this.HasAttributeWithValue(wedge, 'type', 'crescendo')) {
          hairpin.SetForm(hairpinLog_FORM_cres);
        }
        else if (this.HasAttributeWithValue(wedge, 'type', 'diminuendo')) {
          hairpin.SetForm(hairpinLog_FORM_dim);
          if (!wedge.attribute('spread').empty()) {
            // C++ iomusxml.cpp uses a real data_MEASUREMENTSIGNED (SetVu).
            const openingStop = new data_MEASUREMENTSIGNED();
            openingStop.SetVu(wedge.attribute('spread').as_double() / 5);
            hairpin.SetOpening(openingStop as never);
          }
        }
        else {
          return;
        }
        hairpin.SetLform(strToLineform(wedge.attribute('line-type').as_string()));
        if (!wedge.attribute('niente').empty()) {
          hairpin.SetNiente(ConvertWordToBool(wedge.attribute('niente').as_string()));
        }
        hairpin.SetColor(wedge.attribute('color').as_string());
        hairpin.SetPlace(strToStaffrel(placeStr));
        (hairpin as unknown as { SetTstamp(v: number): void }).SetTstamp(timeStamp);
        if (!wedge.attribute('id').empty()) hairpin.SetID(wedge.attribute('id').as_string());
        if (!staffNode.empty()) {
          hairpin.GetTimeSpanningInterface().SetStaff(strToIntList(String(staffNode.text().as_int() + staffOffset)));
        }
        else if (this.m_prevLayer) {
          hairpin.GetTimeSpanningInterface().SetStaff(strToIntList(
            String(((this.m_prevLayer as VrvObject).GetParent() as unknown as { GetN(): number }).GetN())));
        }
        else {
          hairpin.GetTimeSpanningInterface().SetStaff(strToIntList(String(1 + staffOffset)));
        }
        let hairpinY = wedge.attribute('default-y').as_int();
        hairpinY = (hairpinY * 10) + wedge.attribute('relative-y').as_int();
        hairpinY = (hairpinY < 0) ? Math.abs(hairpinY) : hairpinY + 2000;
        hairpin.SetVgrp(String(hairpinY));
        for (let i = 0; i < this.m_hairpinStopStack.length; i++) {
          const iter = this.m_hairpinStopStack[i];
          const measureDifference = iter[2].m_lastMeasureCount - (this.m_measureCounts.get(measure) ?? 0);
          if (iter[2].m_dirN === hairpinNumber && measureDifference === 0) {
            if (measureDifference >= 0) {
              (hairpin as unknown as { SetTstamp2(v: [number, number]): void }).SetTstamp2([measureDifference, iter[1]]);
              this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, hairpin]);
            }
            matchedWedge = true;
            this.m_hairpinStopStack.splice(i, 1);
            break;
          }
        }
        if (!matchedWedge) {
          this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, hairpin]);
          this.m_hairpinStack.push([hairpin, openHairpin]);
        }
      }
    }

    // Ottava
    const xmlShift = typeNode.child('octave-shift');
    if (!xmlShift.empty()) {
      const staffNum = staffNode.empty() ? 1 : staffNode.text().as_int() + staffOffset;
      if (this.HasAttributeWithValue(xmlShift, 'type', 'stop')) {
        this.m_octDis[staffNum] = 0;
        for (const iter of this.m_controlElements) {
          if ((iter[1] as VrvObject).Is(ClassId.OCTAVE)) {
            const octave = iter[1] as Octave;
            if (octave.GetTimeSpanningInterface().HasEndid()) continue;
            const staffAttr = octave.GetTimeSpanningInterface().GetStaff();
            if (staffAttr.includes(staffNum)) {
              octave.GetTimeSpanningInterface().SetEndid(this.m_ID);
            }
            else if (xmlShift.attribute('number').as_string() === String(octave.GetN())) {
              octave.GetTimeSpanningInterface().SetEndid(this.m_ID);
            }
            else {
              LogWarning("MusicXML import: octave for '%s' could not be closed", octave.GetID());
            }
          }
        }
      }
      else {
        const octave = new Octave();
        octave.SetColor(xmlShift.attribute('color').as_string());
        octave.SetDisPlace(strToStaffrelBasic(placeStr));
        octave.SetN(xmlShift.attribute('number').as_string());
        const octDisNum = xmlShift.attribute('size').empty() ? 8 : xmlShift.attribute('size').as_int();
        octave.SetDis(ATT.StrToOctaveDis(String(octDisNum)));
        this.m_octDis[staffNum] = Math.trunc((octDisNum + 2) / 8);
        if (this.HasAttributeWithValue(xmlShift, 'type', 'up')) {
          octave.SetDisPlace(STAFFREL_basic_below);
          this.m_octDis[staffNum] *= -1;
        }
        else {
          octave.SetDisPlace(STAFFREL_basic_above);
        }
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, octave]);
        this.m_octaveStack.push(octave);
      }
    }

    // Pedal
    const xmlPedal = typeNode.child('pedal');
    if (!xmlPedal.empty()) {
      const pedalType = xmlPedal.attribute('type').as_string();
      const pedalLine = xmlPedal.attribute('line').as_bool();
      if (pedalType !== 'continue') {
        const pedal = new Pedal();
        pedal.SetColor(xmlPedal.attribute('color').as_string());
        if (placeStr) pedal.SetPlace(strToStaffrel(placeStr));
        pedal.SetDir(ConvertPedalTypeToDir(pedalType));
        if (pedalLine) pedal.SetForm(1 /* PEDALSTYLE_line */);
        if (!xmlPedal.attribute('abbreviated').empty()) {
          pedal.SetGlyphAuth('smufl');
          // C++: AttModule::SetExternalsymbols(pedal, "glyph.num", "U+E651");
          // TS dispatch: Pedal lacks the Att mixin, so apply the hexnum directly.
          pedal.SetGlyphNum(hexnumToInt('U+E651'));
        }
        if (pedalType === 'sostenuto') {
          (pedal as unknown as { SetFunc(v: string): void }).SetFunc('sostenuto');
          if (!xmlPedal.attribute('abbreviated').empty()) {
            pedal.SetGlyphAuth('smufl');
            pedal.SetGlyphNum(hexnumToInt('U+E65A'));
          }
        }
        if (!staffNode.empty()) {
          pedal.GetTimeSpanningInterface().SetStaff(strToIntList(String(staffNode.text().as_int() + staffOffset)));
        }
        else if (this.m_prevLayer) {
          pedal.GetTimeSpanningInterface().SetStaff(strToIntList(
            String(((this.m_prevLayer as VrvObject).GetParent() as unknown as { GetN(): number }).GetN())));
        }
        else {
          pedal.GetTimeSpanningInterface().SetStaff(strToIntList(String(1 + staffOffset)));
        }
        pedal.GetTimeSpanningInterface().SetTstamp(timeStamp);
        if (pedalType === 'stop') pedal.GetTimeSpanningInterface().SetTstamp(timeStamp - 0.1);
        let pedalY = xmlPedal.attribute('default-y').as_int();
        pedalY = (pedalY * 10) + xmlPedal.attribute('relative-y').as_int();
        pedalY = (pedalY < 0) ? Math.abs(pedalY) : pedalY + 2000;
        pedal.SetVgrp(pedalY);
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, pedal]);
        this.m_pedalStack.push(pedal);
      }
    }

    // Principal voice
    const lead = typeNode.child('principal-voice');
    if (!lead.empty()) {
      let voiceNumber = lead.attribute('number').as_int();
      voiceNumber = (voiceNumber < 1) ? 1 : voiceNumber;
      if (this.HasAttributeWithValue(lead, 'type', 'stop')) {
        // C++ guards `m_bracketStack.empty()` in the <bracket> branch (iomusxml.cpp:2272);
        // the <principal-voice> branch has no guard but WASM loads 31a, so mirror
        // the bracket guard here: a lone stop is an extender, not a crash.
        if (this.m_bracketStack.length === 0) {
          // if this is empty, most likely we're dealing with an extender
        }
        else {
          const front = this.m_bracketStack[0];
          const measureDifference = (this.m_measureCounts.get(measure) ?? 0) - front[1].m_lastMeasureCount;
          if (measureDifference >= 0) {
            (front[0] as unknown as { SetTstamp2(v: [number, number]): void }).SetTstamp2([measureDifference, timeStamp]);
          }
          this.m_bracketStack.shift();
        }
      }
      else {
        const bracketSpan = new BracketSpan();
        const openBracket = new MusicXmlOpenSpanner(voiceNumber, this.m_measureCounts.get(measure) ?? 0);
        bracketSpan.SetColor(lead.attribute('color').as_string());
        bracketSpan.SetFunc(bracketSpanLog_FUNC_analytical);
        bracketSpan.SetLstartsym(ConvertLineEndSymbol(lead.attribute('symbol').as_string()) as unknown as string);
        (bracketSpan as unknown as { SetTstamp(v: number): void }).SetTstamp(timeStamp);
        bracketSpan.SetType('principal-voice');
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, bracketSpan]);
        this.m_bracketStack.push([bracketSpan, openBracket]);
      }
    }

    // Rehearsal
    const rehearsal = typeNode.child('rehearsal');
    if (!rehearsal.empty()) {
      const reh = new Reh();
      reh.GetTextDirInterface().SetPlace(strToStaffrel(placeStr));
      const halign = rehearsal.attribute('halign').as_string();
      const lang = rehearsal.attribute('xml:lang').empty() ? 'it' : rehearsal.attribute('xml:lang').as_string();
      const textStr = this.GetContent(rehearsal);
      reh.SetColor(rehearsal.attribute('color').as_string());
      let staffNum = staffNode.text().as_int() + staffOffset;
      staffNum = (staffNum < 1) ? 1 : staffNum;
      reh.GetTimePointInterface().SetStaff(strToIntList(String(staffNum)));
      reh.SetLang(lang);
      const rend = new Rend();
      rend.SetFontweight(strToFontweight(rehearsal.attribute('font-weight').as_string()));
      rend.SetHalign(new AttConverterBase().StrToHorizontalalignment(halign));
      const enclosure = rehearsal.attribute('enclosure').as_string();
      rend.SetRend(enclosure === '' ? TEXTRENDITION_box : ConvertEnclosure(enclosure));
      const text = new Text();
      text.SetText(UTF8to32(textStr));
      rend.AddChild(text);
      reh.AddChild(rend);
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, reh]);
    }

    // Tempo
    if (containsTempo) {
      const tempo = new Tempo();
      if (words.length > 0) {
        const lang = words[0].attribute('xml:lang').empty() ? 'it' : words[0].attribute('xml:lang').as_string();
        tempo.SetLang(lang);
      }
      tempo.GetTextDirInterface().SetPlace(strToStaffrel(placeStr));
      if (words.length !== 0) this.TextRendition(words, tempo);
      const metronome = this.selectNode(node, 'direction-type/metronome');
      if (metronome && !this.HasAttributeWithValue(metronome, 'print-object', 'no')) {
        this.PrintMetronome(metronome, tempo);
      }
      if (!soundNode.attribute('tempo').empty()) {
        tempo.SetMidiBpm(soundNode.attribute('tempo').as_double());
      }
      tempo.GetTimeSpanningInterface().SetTstamp(timeStamp);
      if (!staffNode.empty()) {
        tempo.GetTimeSpanningInterface().SetStaff(strToIntList(String(staffNode.text().as_int() + staffOffset)));
      }
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, tempo]);
      this.m_tempoStack.push(tempo);
    }

    // other cases
    if (!containsDynamics && !containsTempo && !containsWords && !xmlJump && bracket.empty() && lead.empty()
      && xmlShift.empty() && xmlPedal.empty() && wedges.length === 0 && !dashes && rehearsal.empty()) {
      LogWarning("MusicXML import: Unsupported direction-type '%s'", typeNode.first_child().name());
    }

    // Sound
    const xmlSound = node.child('sound');
    if (!xmlSound.empty()) {
      this.ReadMusicXmlSound(xmlSound, measure, section);
    }
  }

  /** XPath `(words.end()-1)->parent().next_sibling("direction-type").first_child()` fold. */
  protected lastNextDirectionTypeChild(nodes: xml_node[]): xml_node {
    if (nodes.length === 0) return new xml_node();
    const last = nodes[nodes.length - 1];
    const parent = last.parent();
    if (parent.empty()) return new xml_node();
    const nextDt = parent.next_sibling('direction-type');
    if (nextDt.empty()) return new xml_node();
    return nextDt.first_child();
  }

  /** C++ iomusxml.cpp 704-752. */
  protected TextRendition(words: xml_node[], element: VrvObject): void {
    for (const textNode of words) {
      const soundNode = textNode.parent().next_sibling('sound');
      const textStr = this.GetWordsOrDynamicsText(textNode);
      const textColor = textNode.attribute('color').as_string();
      let textParent: VrvObject = element as unknown as VrvObject;
      if (textNode.name().startsWith('symbol')) {
        const symbol = new Symbol();
        symbol.SetGlyphAuth('smufl');
        symbol.SetColor(textColor);
        symbol.SetGlyphName(textNode.text().as_string());
        (element as unknown as VrvObject).AddChild(symbol);
        continue;
      }
      else if (textNode.name().startsWith('coda') || textNode.name().startsWith('segno')) {
        const symbol = new Symbol();
        symbol.SetGlyphAuth('smufl');
        symbol.SetColor(textColor);
        symbol.SetGlyphName(textNode.name());
        (element as unknown as VrvObject).AddChild(symbol);
        continue;
      }
      else if (!textNode.attribute('xml:lang').empty() || !textNode.attribute('xml:space').empty()
        || !textNode.attribute('color').empty() || !textNode.attribute('halign').empty()
        || !textNode.attribute('font-family').empty() || !textNode.attribute('font-style').empty()
        || !textNode.attribute('font-weight').empty() || !textNode.attribute('enclosure').empty()) {
        const rend = new Rend();
        rend.SetLang(textNode.attribute('xml:lang').as_string());
        rend.SetColor(textColor);
        rend.SetHalign(new AttConverterBase().StrToHorizontalalignment(textNode.attribute('halign').as_string()));
        rend.SetSpace(textNode.attribute('xml:space').as_string());
        rend.SetFontfam(textNode.attribute('font-family').as_string());
        rend.SetFontstyle(strToFontstyle(textNode.attribute('font-style').as_string()));
        rend.SetFontweight(strToFontweight(textNode.attribute('font-weight').as_string()));
        rend.SetRend(ConvertEnclosure(textNode.attribute('enclosure').as_string()));
        (element as unknown as VrvObject).AddChild(rend);
        textParent = rend;
      }
      else if (!soundNode.empty() && soundNode.attribute('dynamics').empty() && soundNode.attribute('tempo').empty()) {
        const rend = new Rend();
        rend.SetHalign(HORIZONTALALIGNMENT_right);
        (element as unknown as VrvObject).AddChild(rend);
        textParent = rend;
      }
      // Whitespace line breaks are significant in MusicXML => split into lines
      // C++ std::getline splits on real '\n'; the source-level '\\n' would never match.
      // C++ std::getline on an empty string yields zero lines (no children); JS split yields [''].
      // A trailing '\n' also yields no extra empty line in C++ (EOF after delimiter).
      let firstLine = true;
      const rawLines = textStr === '' ? [] : textStr.split('\n');
      if (rawLines.length > 1 && rawLines[rawLines.length - 1] === '') rawLines.pop();
      for (const line of rawLines) {
        if (!firstLine) {
          textParent.AddChild(new Lb());
        }
        const text = new Text();
        text.SetText(UTF8to32(line));
        textParent.AddChild(text);
        firstLine = false;
      }
    }
  }

  /** C++ iomusxml.cpp 682-701. */
  protected GetWordsOrDynamicsText(node: xml_node): string {
    if (this.IsElement(node, 'words')) {
      return this.GetContent(node);
    }
    if (this.IsElement(node, 'dynamics')) {
      let dynamStr = '';
      const children: xml_node[] = [];
      for (let c = node.first_child(); !c.empty(); c = c.next_sibling()) children.push(c);
      for (const xmlDynamPart of children) {
        if (xmlDynamPart.name() === 'other-dynamics') {
          if (children.length > 0 && xmlDynamPart !== children[0]) dynamStr += ' ';
          dynamStr += xmlDynamPart.text().as_string();
          if (children.length > 0 && xmlDynamPart !== children[children.length - 1]) dynamStr += ' ';
        }
        else {
          dynamStr += xmlDynamPart.name();
        }
      }
      return dynamStr;
    }
    return '';
  }

  /** C++ iomusxml.cpp 783-887. */
  protected PrintMetronome(metronome: xml_node, tempo: Tempo): void {
    const tempoText = (tempo as unknown as VrvObject).FindDescendantByType(ClassId.TEXT, 1) as Text | null;
    if (tempoText) {
      const tempoString = String.fromCodePoint(...tempoText.GetText());
      if (tempoString.length === 0 || !/\s/.test(tempoString.charAt(tempoString.length - 1))) {
        const text = new Text();
        text.SetText(UTF8to32(' '));
        (tempo as unknown as VrvObject).AddChild(text);
      }
    }

    let paren = false;
    if (metronome.attribute('parentheses').as_bool()) {
      const text = new Text();
      text.SetText(UTF8to32('('));
      (tempo as unknown as VrvObject).AddChild(text);
      paren = true;
    }

    // build a sequence based on the elements present in the metronome
    const metronomeElements: Array<['dot' | 'unit' | 'perminute' | 'separator', string]> = [];
    for (let child = metronome.first_child(); !child.empty(); child = child.next_sibling()) {
      if (child.name() === 'beat-unit-dot') {
        metronomeElements.push(['dot', '']);
      }
      else if (child.name() === 'beat-unit') {
        if (metronomeElements.length > 0) metronomeElements.push(['separator', ' = ']);
        metronomeElements.push(['unit', child.text().as_string()]);
      }
      else if (child.name() === 'per-minute') {
        if (metronomeElements.length > 0) metronomeElements.push(['separator', ' = ']);
        metronomeElements.push(['perminute', child.text().as_string()]);
      }
    }

    let start = true;
    for (let i = 0; i < metronomeElements.length; i++) {
      const [kind, value] = metronomeElements[i];
      if (kind === 'unit') {
        let verovioText = ConvertTypeToVerovioText(value);
        // find separator or use end() if there is no separator
        let separator = metronomeElements.length;
        for (let j = i; j < metronomeElements.length; j++) {
          if (metronomeElements[j][0] === 'separator') { separator = j; break; }
        }
        let dotCount = 0;
        for (let j = i; j < separator; j++) {
          if (metronomeElements[j][0] === 'dot') dotCount++;
        }
        for (let d = 0; d < dotCount; d++) {
          verovioText = verovioText.concat(UTF8to32(' '));
          verovioText.push(0xECB7); // SMUFL augmentation dot
        }
        // set @mmUnit and @mmDots attributes only based on the first beat-unit in the sequence
        if (start) {
          tempo.SetMmUnit(ConvertTypeToDur(value));
          if (dotCount) tempo.SetMmDots(dotCount);
          start = false;
        }
        if (verovioText.length > 0) {
          const rend = new Rend();
          rend.SetGlyphAuth('smufl');
          const text = new Text();
          text.SetText(verovioText);
          rend.AddChild(text);
          (tempo as unknown as VrvObject).AddChild(rend);
        }
      }
      else if (kind === 'dot') {
        // don't do anything here, dots are counted in the unit section
      }
      else if (kind === 'perminute') {
        const matches = '0123456789';
        const offset = value.split('').findIndex((c) => matches.includes(c));
        if (offset >= 0 && offset < value.length) {
          tempo.SetMm(Number.parseFloat(value.substring(offset)));
        }
        if (value) {
          const text = new Text();
          text.SetText(UTF8to32(value));
          (tempo as unknown as VrvObject).AddChild(text);
        }
      }
      else if (kind === 'separator') {
        const text = new Text();
        text.SetText(UTF8to32(value));
        (tempo as unknown as VrvObject).AddChild(text);
      }
    }

    if (paren) {
      const text = new Text();
      text.SetText(UTF8to32(')'));
      (tempo as unknown as VrvObject).AddChild(text);
    }
  }

  /** C++ iomusxml.cpp 4109-4238. */
  protected ReadMusicXmlSound(node: xml_node, measure: Measure, section: Section): void {
    // get MEI tuning
    const meiTuning = this.selectNode(node, "play/other-play[@type='tuning-mei']");
    if (meiTuning) {
      const value = meiTuning.text().as_string().trim();
      let temperament = 0;
      if (value === 'none' || value === '') temperament = 0;
      else if (value === 'equal') temperament = 1;
      else if (value === 'just') temperament = 2;
      else if (value === 'mean') temperament = 3;
      else if (value === 'pythagorean') temperament = 4;
      else LogWarning("MusicXML import: Invalid MEI temperament '%s'", value);
      const scoreDef = this.GetOrCreateLastScoreDef(section);
      (scoreDef as unknown as { SetTuneTemper(v: number): void }).SetTuneTemper(temperament);
    }

    // get custom (Ableton) tuning
    const abletonTuning = this.selectNode(node, "play/other-play[@type='tuning-ableton']");
    if (abletonTuning) {
      const tuningDef = abletonTuning.text().as_string().trim();
      const tuning = new CustomTuning(tuningDef, this.m_docRef as never, true);
      if (tuning.IsValid()) {
        const scoreDef = this.GetOrCreateLastScoreDef(section);
        (scoreDef as unknown as { SetCustomTuning(t: CustomTuning): void }).SetCustomTuning(tuning);
      }
      else {
        LogWarning('MusicXML import: Error parsing tuning definition');
      }
    }

    // segno
    if (!node.attribute('segno').empty()) {
      if (!this.m_sectionStart) this.m_sectionStart = new MusicXmlSectionInfo();
      this.m_sectionStart.m_label = node.attribute('segno').as_string();
      if (!this.m_sectionStart.m_label) this.m_sectionStart.m_label = 'segno';
    }

    // coda
    if (!node.attribute('coda').empty()) {
      if (!this.m_sectionStop) this.m_sectionStop = new MusicXmlSectionInfo();
      this.m_sectionStop.m_label = node.attribute('coda').as_string();
      if (!this.m_sectionStop.m_label) this.m_sectionStop.m_label = 'coda';
    }

    // forward-repeat
    if (this.HasAttributeWithValue(node, 'forward-repeat', 'yes')) {
      if (!this.m_sectionStart) this.m_sectionStart = new MusicXmlSectionInfo();
    }

    // dacapo
    if (this.HasAttributeWithValue(node, 'dacapo', 'yes')) {
      if (!this.m_sectionStop) this.m_sectionStop = new MusicXmlSectionInfo();
      this.m_jumpInfo = new MusicXmlJumpInfo(MusicXmlJumpType.DACAPO, '',
        parseIntsList(node.attribute('time-only').empty() ? '1' : node.attribute('time-only').as_string()));
    }

    // dalsegno
    if (!node.attribute('dalsegno').empty()) {
      if (!this.m_sectionStop) this.m_sectionStop = new MusicXmlSectionInfo();
      let label = node.attribute('dalsegno').as_string();
      if (!label) label = 'segno';
      this.m_jumpInfo = new MusicXmlJumpInfo(MusicXmlJumpType.DALSEGNO, label,
        parseIntsList(node.attribute('time-only').empty() ? '1' : node.attribute('time-only').as_string()));
    }

    // tocoda
    if (!node.attribute('tocoda').empty()) {
      if (!this.m_sectionStop) this.m_sectionStop = new MusicXmlSectionInfo();
      let label = node.attribute('tocoda').as_string();
      if (!label) label = 'coda';
      this.m_jumpInfo = new MusicXmlJumpInfo(MusicXmlJumpType.TOCODA, label,
        parseIntsList(node.attribute('time-only').empty() ? '2' : node.attribute('time-only').as_string()));
    }

    // fine
    if (!node.attribute('fine').empty()) {
      if (!this.m_sectionStop) this.m_sectionStop = new MusicXmlSectionInfo();
      this.m_fineInfo = new MusicXmlFineInfo(true);
    }

    // WASM oracle (6.3.0) creates no Tempo for a bare <sound tempo>; src-cpp has
    // a newer bare-tempo branch that the oracle lacks. Ground truth wins: skip it.
  }

  /** C++ iomusxml.cpp 2799-2840. */
  protected ReadMusicXmlFigures(node: xml_node, measure: Measure): void {
    if (this.HasAttributeWithValue(node, 'print-object', 'no')) return;

    const figures: F[] = [];
    const paren = node.attribute('parentheses').as_bool();

    for (let figure = node.child('figure'); !figure.empty(); figure = figure.next_sibling('figure')) {
      let textStr = '';
      if (paren) textStr += '(';
      textStr += ConvertFigureGlyph(figure.child('prefix').text().as_string());
      textStr += figure.child('figure-number').text().as_string();
      textStr += ConvertFigureGlyph(figure.child('suffix').text().as_string());
      if (paren) textStr += ')';
      if (!textStr) continue;
      const f = new F();
      const extend = figure.child('extend');
      if (!extend.empty() && !this.HasAttributeWithValue(extend, 'type', 'stop')) {
        f.SetExtender(BOOLEAN_true);
      }
      const text = new Text();
      text.SetText(UTF8to32(textStr));
      f.AddChild(text);
      figures.push(f);
    }
    if (figures.length === 0) return;

    const harm = new Harm();
    const fb = new Fb();
    for (const fig of figures) {
      fb.AddChild(fig);
    }
    harm.AddChild(fb);
    harm.GetTimeSpanningInterface().SetTstamp(
      (this.m_durTotal + this.m_durFb) * this.m_meterUnit / (4 * this.m_ppq) + 1.0);
    this.m_durFb += node.child('duration').text().as_int();
    this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, harm]);
    this.m_harmStack.push(harm);
  }

  /** C++ iomusxml.cpp 2842-2888. */
  protected ReadMusicXmlHarmony(node: xml_node, measure: Measure): void {
    let durOffset = 0;

    let harmText = '';
    const rootStep = this.selectNode(node, 'root/root-step');
    if (rootStep) harmText = this.GetContent(rootStep);
    let alter = this.selectNode(node, 'root/root-alter');
    if (!harmText) {
      const numeral = this.selectNode(node, 'numeral/numeral-root') ?? new xml_node();
      harmText = !numeral.attribute('text').empty()
        ? numeral.attribute('text').as_string()
        : numeral.text().as_string();
      alter = this.selectNode(node, 'numeral/numeral-alter');
    }
    if (alter) harmText += ConvertAlterToSymbol(this.GetContent(alter));
    const kind = node.child('kind');
    if (!kind.empty()) {
      if (this.HasAttributeWithValue(kind, 'use-symbols', 'yes')) {
        harmText = harmText + ConvertKindToSymbol(this.GetContent(kind));
      }
      else if (!kind.attribute('text').empty() && kind.text().as_string() !== 'none') {
        harmText = harmText + kind.attribute('text').as_string();
      }
      else {
        harmText = harmText + ConvertKindToText(this.GetContent(kind));
      }
    }
    harmText += ConvertDegreeToText(node);
    const bass = node.child('bass');
    if (!bass.empty()) {
      harmText += '/';
      harmText += bass.child('bass-step').text().as_string()
        + ConvertAlterToSymbol(bass.child('bass-alter').text().as_string());
    }
    const harm = new Harm();
    const text = new Text();
    text.SetText(UTF8to32(harmText));
    harm.GetTextDirInterface().SetPlace(strToStaffrel(node.attribute('placement').as_string()));
    harm.SetType(node.attribute('type').as_string());
    harm.AddChild(text);
    const offset = node.child('offset');
    if (!offset.empty()) durOffset = offset.text().as_int();
    harm.GetTimeSpanningInterface().SetTstamp(
      (this.m_durTotal + durOffset) * this.m_meterUnit / (4 * this.m_ppq) + 1.0);
    this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, harm]);
    this.m_harmStack.push(harm);
  }
  //--- Mini XPath for the note reader (TS pugixml has no select_node) ------------------
  /** Evaluate the small XPath subset used by ReadMusicXmlNote. */
  protected selectNode(context: xml_node | null | undefined, xpath: string): xml_node | null {
    if (!context || context.empty()) return null;
    return this.selectNodes(context, xpath)[0] ?? null;
  }

  protected selectNodes(context: xml_node | null | undefined, xpath: string): xml_node[] {
    if (!context || context.empty()) return [];
    // C++ pugi XPath union (a|b) at top level returns nodes in document order.
    // Split top-level '|' (outside [...] predicates), evaluate each branch,
    // then merge in document order.
    const branches = this.splitTopLevelUnion(xpath);
    if (branches.length > 1) {
      const merged: xml_node[] = [];
      const seen = new Set<string>();
      for (const branch of branches) {
        for (const n of this.selectNodes(context, branch)) {
          const key = this.nodeDocKey(n);
          if (!seen.has(key)) { seen.add(key); merged.push(n); }
        }
      }
      merged.sort((a, b) => this.compareDocumentOrder(a, b));
      return merged;
    }
    // Split on '/' but not '/' inside [...] predicates (e.g. note[notations/tuplet[@type='stop']]).
    // C++ pugi parses the full XPath grammar; the subset engine must keep predicates intact.
    const steps: string[] = [];
    let depth = 0, cur = '';
    for (const ch of xpath) {
      if (ch === '[') depth++;
      else if (ch === ']') depth = Math.max(0, depth - 1);
      if (ch === '/' && depth === 0) { if (cur.length > 0) steps.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur.length > 0) steps.push(cur);
    if (steps.length === 0) return [];
    let current: xml_node[] = [context];
    // 'ancestor::measure' and './/' handled per step
    for (const step of steps) {
      if (step === '.') continue;
      if (step.startsWith('ancestor::')) {
        const name = step.slice('ancestor::'.length);
        const out: xml_node[] = [];
        for (const c of current) {
          for (let a = c.parent(); !a.empty(); a = a.parent()) {
            if (a.name() === name) out.push(a);
          }
        }
        current = out;
        continue;
      }
      if (step.startsWith('.//')) {
        // descendant-or-self with optional predicate
        const m = /^(.+?)(?:\[@(.+?)(?:='(.+?)')?\])?$/.exec(step.slice(3))!;
        const target = m[1];
        const attr = m[2];
        const val = m[3];
        const out: xml_node[] = [];
        for (const c of current) {
          this.collectDescendants(c, target, attr, val, out);
        }
        current = out;
        continue;
      }
      // 'name' | 'name[@attr="v"]' | 'name[@attr]' | 'following-sibling::note[pred]'
      if (step.startsWith('following-sibling::')) {
        const rest = step.slice('following-sibling::'.length);
        const m = /^(.+?)(?:\[(.+?)\])?$/.exec(rest)!;
        const target = m[1];
        const pred = m[2];
        const out: xml_node[] = [];
        for (const c of current) {
          for (let sib = c.next_sibling(target); !sib.empty(); sib = sib.next_sibling(target)) {
            if (!pred || this.matchesPredicate(sib, pred)) out.push(sib);
          }
        }
        current = out;
        continue;
      }
      if (step === '*' || step.startsWith('*[')) {
        // wildcard children with optional contains(name(),...) predicate
        const out: xml_node[] = [];
        for (const c of current) {
          for (let ch = c.first_child(); !ch.empty(); ch = ch.next_sibling()) {
            if (ch.type() !== xml_node_type.node_element) continue;
            if (step !== '*') {
              const m = /^\*\[contains\(name\(\),\s*'([^']+)'\)\]$/.exec(step);
              const m2 = /^\*\[contains\(name\(\),\s*'([^']+)'\) or contains\(name\(\),\s*'([^']+)'\)\]$/.exec(step);
              const nm = ch.name();
              if (m && !nm.includes(m[1])) continue;
              if (m2 && !nm.includes(m2[1]) && !nm.includes(m2[2])) continue;
            }
            out.push(ch);
          }
        }
        current = out;
        continue;
      }
      // plain/predicated child step; also allow 'a|b' unions
      const names = step.split('|').flatMap((alt) => alt.split('|'));
      const parsed = names.map((alt) => {
        const m = /^(.+?)(?:\[not\(@(.+?)='(.+?)'\)\])?(?:\[@(.+?)(?:='(.+?)')?(?: and text\(\)='(.+?)')?\])?(?:\[text\(\)='(.+?)'\])?$/.exec(alt);
        if (!m) return null;
        return { name: m[1], notAttr: m[2], notVal: m[3], attr: m[4], val: m[5], text: m[6] ?? m[7] } as
          { name: string; notAttr?: string; notVal?: string; attr?: string; val?: string; text?: string };
      }).filter(Boolean) as Array<{ name: string; notAttr?: string; notVal?: string; attr?: string; val?: string; text?: string }>;
      const out: xml_node[] = [];
      for (const c of current) {
        // C++ pugi XPath union (a|b) returns nodes in document order, not grouped by name.
        // Single document-order walk matching any alternative preserves that semantic.
        for (let ch = c.first_child(); !ch.empty(); ch = ch.next_sibling()) {
          if (ch.type() !== xml_node_type.node_element) continue;
          for (const { name, notAttr, notVal, attr, val, text } of parsed) {
            if (ch.name() !== name) continue;
            if (notAttr && ch.attribute(notAttr).as_string() === notVal) continue;
            if (attr && !ch.attribute(attr)) continue;
            if (attr && val !== undefined && ch.attribute(attr).as_string() !== val) continue;
            if (text && ch.text().as_string() !== text) continue;
            out.push(ch);
            break;
          }
        }
      }
      current = out;
    }
    return current;
  }

  private splitTopLevelUnion(xpath: string): string[] {
    const parts: string[] = [];
    let depth = 0, cur = '';
    for (const ch of xpath) {
      if (ch === '[') depth++;
      else if (ch === ']') depth = Math.max(0, depth - 1);
      if (ch === '|' && depth === 0) { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    parts.push(cur);
    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  private nodeDocKey(n: xml_node): string {
    const path: number[] = [];
    for (let c: xml_node = n; !c.empty(); c = c.parent()) {
      let idx = 0;
      for (let s = c.previous_sibling(); !s.empty(); s = s.previous_sibling()) idx++;
      path.unshift(idx);
    }
    return path.join('.');
  }

  private compareDocumentOrder(a: xml_node, b: xml_node): number {
    const ka = this.nodeDocKey(a), kb = this.nodeDocKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  }

  private collectDescendants(root: xml_node, target: string, attr: string | undefined,
    val: string | undefined, out: xml_node[]): void {
    const m = /^(.+?)(?:\[@(.+?)(?:='(.+?)')?\])?$/.exec(target);
    if (!m) return;
    const name = m[1];
    for (let ch = root.first_child(); !ch.empty(); ch = ch.next_sibling()) {
      if (ch.type() === 1) {
        if (name === '*' || ch.name() === name) {
          if (!attr || (ch.attribute(attr) && (val === undefined || ch.attribute(attr).as_string() === val))) {
            out.push(ch);
          }
        }
        this.collectDescendants(ch, target, attr, val, out);
      }
    }
  }

  private matchesPredicate(node: xml_node, pred: string): boolean {
    // supports single "child[...]" or combined "beam[@number='1' and text()='begin']"
    // element-child predicate: beam[@number='1' and text()='end'] — a child element
    // with attribute and/or text; C++ xpath "note[beam[...]]" requires a descendant match.
    const elementPred = /^([^@\[]+)\[@(.+?)(?:='(.+?)')? and text\(\)='(.+?)'\]$/.exec(pred);
    if (elementPred) {
      const [, childName, attr, attrVal, textVal] = elementPred;
      for (let ch = node.child(childName); !ch.empty(); ch = ch.next_sibling(childName)) {
        if (ch.attribute(attr).empty()) continue;
        if (attrVal !== undefined && ch.attribute(attr).as_string() !== attrVal) continue;
        if (ch.text().as_string() === textVal) return true;
      }
      return false;
    }
    const attrAndText = /^@(.+?)(?:='(.+?)')? and text\(\)='(.+?)'$/.exec(pred);
    if (attrAndText) {
      const [, attr, attrVal, textVal] = attrAndText;
      if (attrVal !== undefined && node.attribute(attr).as_string() !== attrVal) return false;
      return node.text().as_string() === textVal;
    }
    const attrOnly = /^@(.+?)(?:='(.+?)')?$/.exec(pred);
    if (attrOnly) {
      const [, attr, attrVal] = attrOnly;
      if (attrVal !== undefined) return node.attribute(attr).as_string() === attrVal;
      return !!node.attribute(attr);
    }
    const textOnly = /^text\(\)='(.+?)'$/.exec(pred);
    if (textOnly) return node.text().as_string() === textOnly[1];
    // Nested child path with attribute predicate: notations/tuplet[@type='stop'].
    // C++ pugi evaluates the full XPath; the subset engine must resolve the
    // child element and test its attribute instead of stripping brackets.
    const nestedAttr = /^([^@\[\]]+)\[@([^=\]]+)(?:='([^']*)')?\]$/.exec(pred);
    if (nestedAttr) {
      const [, childPath, attr, attrVal] = nestedAttr;
      const kids = this.selectNodes(node, childPath);
      for (const k of kids) {
        if (k.attribute(attr).empty()) continue;
        if (attrVal !== undefined && k.attribute(attr).as_string() !== attrVal) continue;
        return true;
      }
      return false;
    }
    const nested = pred.replace(/\[/g, '').replace(/\]/g, '');
    return this.selectNodes(node, nested).length > 0;
  }

  //--- iomusxml.cpp 619-681: tie/slur/beamspan open-close helpers ----------------
  protected OpenTie(note: Note, tie: Tie, layerNum: number): void {
    tie.SetStartid('#' + note.GetID());
    this.m_tieStack.push(new MusicXmlOpenTie(tie, note, layerNum));
  }

  protected CloseTie(note: Note, layerNum: number): void {
    // add all notes with identical pitch/oct to m_tieStopStack
    for (const tie of this.m_tieStack) {
      if (note.IsEnharmonicWith(tie.m_note)) {
        this.m_tieStopStack.push(new MusicXmlCloseTie(note, layerNum));
      }
    }
  }

  protected OpenSlur(measure: Measure, number: number, slur: Slur, dir: curvature_CURVEDIR): void {
    // try to match open slur with slur stops within that measure
    for (let i = 0; i < this.m_slurStopStack.length; i++) {
      const iter = this.m_slurStopStack[i];
      if (iter[1].m_number === number && iter[1].m_measureCount === this.m_measureCounts.get(measure)) {
        slur.SetEndid('#' + (iter[0] as VrvObject).GetID());
        slur.SetCurvedir(CombineCurvedir(dir, iter[1].m_curvedir));
        this.m_slurStopStack.splice(i, 1);
        return;
      }
    }
    // create new slur otherwise
    this.m_slurStack.push([slur, new MusicXmlOpenSlur(this.m_measureCounts.get(measure) ?? 0, number, dir)]);
  }

  protected CloseSlur(measure: Measure, number: number, element: LayerElement, dir: curvature_CURVEDIR): void {
    // try to match slur stop to open slurs by slur number
    for (let i = this.m_slurStack.length - 1; i >= 0; i--) {
      const riter = this.m_slurStack[i];
      if (riter[1].m_number === number) {
        riter[0].SetEndid('#' + element.GetID());
        riter[0].SetCurvedir(CombineCurvedir(riter[1].m_curvedir, dir));
        this.m_slurStack.splice(i, 1);
        return;
      }
    }
    // add to m_slurStopStack, if not able to be closed
    this.m_slurStopStack.push([element, new MusicXmlCloseSlur(this.m_measureCounts.get(measure) ?? 0, number, dir)]);
  }

  protected CloseBeamSpan(staff: Staff, layer: Layer, element: LayerElement): void {
    for (let i = this.m_beamspanStack.length - 1; i >= 0; i--) {
      const riter = this.m_beamspanStack[i];
      if (riter[1][0] === staff.GetN() || riter[1][1] === layer.GetN()) {
        (riter[0] as BeamSpan).SetEndid('#' + element.GetID());
        this.m_beamspanStack.splice(i, 1);
        return;
      }
    }
  }

  //--- iomusxml.cpp 4216-4289: beams/tuplets pre-pass --------------------------------
  protected ReadMusicXmlBeamsAndTuplets(node: xml_node, layer: Layer, isChord: boolean): boolean {
    const beamStart = this.selectNode(node, "beam[@number='1' and text()='begin']");
    const tupletStart = this.selectNode(node, "notations/tuplet[@type='start']");
    const currentMeasure = this.selectNode(node, 'ancestor::measure');
    const beamEnd = this.selectNode(node, "./following-sibling::note[beam[@number='1' and text()='end']]");
    const tupletEnd = this.selectNode(node, "./following-sibling::note[notations/tuplet[@type='stop']]");

    const currentMeasureNodes: xml_node[] = [];
    if (currentMeasure) {
      for (const ch of currentMeasure.children()) currentMeasureNodes.push(ch as xml_node);
    }
    const idxOf = (n: xml_node | null): number => {
      if (!n) return -1;
      // pugi::xml_node equality compares underlying nodes, not JS handle wrappers.
      return currentMeasureNodes.findIndex((c) => c.internal_object() === n.internal_object());
    };
    // in case note is a start of both beam and tuplet - need to figure which one is longer
    if (beamStart && tupletStart) {
      const beamEndIdx = idxOf(beamEnd as xml_node);
      const tupletEndIdx = idxOf(tupletEnd as xml_node);
      // Mirror C++ iterator semantics: a missing end compares as end() (one past
      // the last child), not as a special case. std::distance(beamIt, tupIt) then
      // decides which container ends first (negative: beam, positive: tuplet).
      const beamEndPos = beamEndIdx < 0 ? currentMeasureNodes.length : beamEndIdx;
      const tupletEndPos = tupletEndIdx < 0 ? currentMeasureNodes.length : tupletEndIdx;
      const distance = tupletEndPos - beamEndPos;
      if (distance > 0) {
        if (!isChord) this.ReadMusicXmlTupletStart(node, tupletStart as xml_node, layer);
        this.ReadMusicXmlBeamStart(node, beamStart as xml_node, layer);
      }
      else {
        this.ReadMusicXmlBeamStart(node, beamStart as xml_node, layer);
        if (!isChord) this.ReadMusicXmlTupletStart(node, tupletStart as xml_node, layer);
      }
    }
    // If note is a start of the beam only
    else if (beamStart) {
      const nextTupletStart = this.selectNode(node, "./following-sibling::note[notations/tuplet[@type='start']]");
      const beamStartIdx = idxOf(node);
      const beamEndIdx = idxOf(beamEnd);
      const nodeStaff = this.selectNode(node, 'staff');
      const endBeamStaff = beamEnd ? this.selectNode(beamEnd as xml_node, 'staff') : null;
      if (beamEndIdx < 0
        || (nodeStaff && endBeamStaff
          && nodeStaff.text().as_int() !== endBeamStaff.text().as_int())) {
        const measureName = !currentMeasure!.attribute('id').empty()
          ? currentMeasure!.attribute('id').as_string()
          : currentMeasure!.attribute('number').as_string();
        LogDebug('MusicXML import: Beam without end in measure %s treated as <beamSpan>', measureName);
        return false;
      }
      const beamNodes = currentMeasureNodes.slice(Math.max(beamStartIdx, 0), beamEndIdx + 1);
      const isTupletStartInBeam = nextTupletStart ? beamNodes.some(c => c.internal_object() === nextTupletStart.internal_object()) : false;
      const isTupletEndInBeam = tupletEnd ? beamNodes.some(c => c.internal_object() === tupletEnd.internal_object()) : false;
      // both branches call the same start reader in the C++ source (TODO beamSpan support)
      this.ReadMusicXmlBeamStart(node, beamStart as xml_node, layer);
    }
    // no special logic needed if we have just tupletStart
    else if (tupletStart) {
      if (!isChord) this.ReadMusicXmlTupletStart(node, tupletStart as xml_node, layer);
    }

    return true;
  }

  protected ReadMusicXmlTupletStart(node: xml_node, tupletStart: xml_node, layer: Layer): void {
    if (!tupletStart) return;

    const tuplet = new Tuplet();
    this.AddLayerElement(layer, tuplet);
    this.m_elementStackMap.get(layer)!.push(tuplet);
    let num = this.selectNode(node, 'time-modification/actual-notes')?.text().as_int() ?? 0;
    let numbase = this.selectNode(node, 'time-modification/normal-notes')?.text().as_int() ?? 0;
    if (!tupletStart.first_child().empty()) {
      num = this.selectNode(tupletStart, 'tuplet-actual/tuplet-number')?.text().as_int() ?? 0;
      numbase = this.selectNode(tupletStart, 'tuplet-normal/tuplet-number')?.text().as_int() ?? 0;
    }
    if (num) tuplet.SetNum(num);
    if (numbase) tuplet.SetNumbase(numbase);
    tuplet.SetNumPlace(strToStaffrelBasic(tupletStart.attribute('placement').as_string()));
    tuplet.SetBracketPlace(strToStaffrelBasic(tupletStart.attribute('placement').as_string()));
    tuplet.SetNumFormat(ConvertTupletNumberValue(tupletStart.attribute('show-number').as_string()));
    if (this.HasAttributeWithValue(tupletStart, 'show-number', 'none')) tuplet.SetNumVisible(BOOLEAN_false);
    tuplet.SetBracketVisible(ConvertWordToBool(tupletStart.attribute('bracket').as_string()));
    if (this.HasAttributeWithValue(tupletStart.parent(), 'print-object', 'no')) {
      tuplet.SetNumVisible(BOOLEAN_false);
      tuplet.SetBracketVisible(BOOLEAN_false);
    }
  }

  protected ReadMusicXmlBeamStart(node: xml_node, beamStart: xml_node, layer: Layer): void {
    if (!beamStart || this.selectNode(node, "notations/ornaments/tremolo[@type='start']")) return;
    const stack = this.m_elementStackMap.get(layer)!;
    if (stack.length > 0 && stack[stack.length - 1].Is(ClassId.BEAM)) {
      if (node.child('grace').empty()) return;
    }

    const beam = new Beam();
    if (!beamStart.attribute('id').empty()) beam.SetID(beamStart.attribute('id').as_string());
    if (!beamStart.attribute('fan').empty()) beam.SetForm(ConvertBeamFanToForm(beamStart.attribute('fan').as_string()));
    this.AddLayerElement(layer, beam);
    stack.push(beam);
  }

  //--- iomusxml.cpp 4335-4388: ties ---------------------------------------------------
  protected ReadMusicXmlTies(node: xml_node, layer: Layer, note: Note, measure: Measure): void {
    const xmlTies = this.selectNodes(node, 'notations/tied');
    for (const xmlTie of xmlTies) {
      const tieType = xmlTie.attribute('type').as_string();

      if (!tieType) {
        continue;
      }
      else if (tieType === 'stop') {
        if (this.m_tieStack.length > 0 && note.IsEnharmonicWith(this.m_tieStack[this.m_tieStack.length - 1].m_note)
          && this.m_tieStack[this.m_tieStack.length - 1].m_layerNum === layer.GetN()) {
          const openTie = this.m_tieStack.pop()!;
          (openTie.m_tie as Tie).SetEndid('#' + note.GetID());
        }
        else {
          this.CloseTie(note, layer.GetN());
        }
      }
      else if (tieType === 'start') {
        const tie = new Tie();
        tie.SetColor(xmlTie.attribute('color').as_string());
        tie.SetCurvedir(this.InferCurvedir(xmlTie));
        tie.SetLform(strToLineform(xmlTie.attribute('line-type').as_string()));
        if (!xmlTie.attribute('id').empty()) tie.SetID(xmlTie.attribute('id').as_string());
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, tie]);
        this.OpenTie(note, tie, layer.GetN());
      }
      else if (tieType === 'let-ring') {
        const lv = new Lv();
        lv.SetColor(xmlTie.attribute('color').as_string());
        lv.SetCurvedir(this.InferCurvedir(xmlTie));
        lv.SetLform(strToLineform(xmlTie.attribute('line-type').as_string()));
        if (!xmlTie.attribute('id').empty()) lv.SetID(xmlTie.attribute('id').as_string());
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, lv]);
        lv.SetStartid('#' + note.GetID());
        let tstamp = Math.min(this.m_layerEndTimes.get(layer) ?? 0, this.m_durTotal + 2.0);
        tstamp = Math.max(tstamp, this.m_durTotal + 1.25);
        lv.SetTstamp2({ 0: 0, 1: tstamp * this.m_meterUnit / (4.0 * this.m_ppq) + 1 } as never);
      }
    }
  }

  //--- iomusxml.cpp 4847-4861 ----------------------------------------------------------
  protected InferCurvedir(slurOrTie: xml_node): curvature_CURVEDIR {
    const orientation = slurOrTie.attribute('orientation').as_string();
    if (orientation === 'over') return curvature_CURVEDIR_above;
    if (orientation === 'under') return curvature_CURVEDIR_below;
    const placement = slurOrTie.attribute('placement').as_string();
    if (placement === 'above') return curvature_CURVEDIR_above;
    if (placement === 'below') return curvature_CURVEDIR_below;
    return curvature_CURVEDIR_NONE;
  }

  //--- iomusxml.cpp 5146-5183: fermata shaping -----------------------------------------
  protected SetFermataExternalSymbols(fermata: Fermata, shape: string): void {
    const fermataExtSymbolsAbove: Record<string, string> = { 'double-angled': 'U+E4C2',
      'double-square': 'U+E4C8', 'double-dot': 'U+E4CA', 'half-curve': 'U+E4CC', 'curlew': 'U+E4D6' };
    const fermataExtSymbolsBelow: Record<string, string> = { 'double-angled': 'U+E4C3',
      'double-square': 'U+E4C9', 'double-dot': 'U+E4CB', 'half-curve': 'U+E4CD', 'curlew': 'U+E4D6' };

    const below = fermataExtSymbolsBelow[shape];
    if (fermata.GetForm() === fermataVis_FORM_inv && below) {
      (fermata as unknown as { SetGlyphNum(v: number): void }).SetGlyphNum(hexnumToInt(below));
      (fermata as unknown as { SetGlyphAuth(v: string): void }).SetGlyphAuth('smufl');
      return;
    }
    const above = fermataExtSymbolsAbove[shape];
    if (above) {
      (fermata as unknown as { SetGlyphNum(v: number): void }).SetGlyphNum(hexnumToInt(above));
      (fermata as unknown as { SetGlyphAuth(v: string): void }).SetGlyphAuth('smufl');
    }
  }

  protected ShapeFermata(fermata: Fermata, node: xml_node): void {
    (fermata as unknown as { SetColor(v: string): void }).SetColor(node.attribute('color').as_string());
    fermata.SetShape(ConvertFermataShape(node.text().as_string()));
    if (this.HasAttributeWithValue(node, 'type', 'inverted')) {
      fermata.SetForm(fermataVis_FORM_inv);
      fermata.SetPlace(STAFFREL_below);
    }
    else if (this.HasAttributeWithValue(node, 'type', 'upright')) {
      fermata.SetForm(fermataVis_FORM_norm);
      fermata.SetPlace(STAFFREL_above);
    }
    this.SetFermataExternalSymbols(fermata, node.text().as_string());
  }

  //--- iomusxml.cpp 5263-5301: SetChordStaff + midi helpers ---------------------------
  protected SetChordStaff(layer: Layer): void {
    // if all notes in the chord have @staff attribute set one for the chord as well
    const chord = this.m_elementStackMap.get(layer)!.at(-1) as unknown as Chord | undefined;
    if (!chord) return;

    const children = chord.GetChildrenForModification();
    const anyWithoutStaff = children.some(
      (o) => o.Is(ClassId.NOTE) && !(o as unknown as Note).HasStaff());
    if (anyWithoutStaff) return;

    const chordStaff = (chord.GetFirst(ClassId.NOTE) as unknown as Note).GetStaff();
    // C++ compares att staff vectors by value (ArrayOfIntegers::operator!=).
    const sameStaff = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
    const anyDifferent = children.some(
      (o) => o.Is(ClassId.NOTE) && !sameStaff((o as unknown as Note).GetStaff(), chordStaff));
    if (anyDifferent) return;

    chord.SetStaff(chordStaff);
    for (const object of children) {
      if (!object.Is(ClassId.NOTE)) continue;
      (object as unknown as Note).ResetStaffIdent();
    }
  }

  //--- iomusxml.cpp 2891-4072: ReadMusicXmlNote ----------------------------------------
  protected ReadMusicXmlNote(node: xml_node, measure: Measure, staffOffset: number, section: Section): void {
    const layer = this.SelectLayerForNode(node, measure);
    if (!layer) throw new Error('MusicXmlInput::ReadMusicXmlNote: layer is null');

    // If we just had a clef change, make sure it points to the correct layer
    if (this.m_clefChanged && this.m_clefChangeQueue.length > 0) {
      const limit = Math.min(this.m_clefChanged, this.m_clefChangeQueue.length);
      for (let i = 0; i < limit; i++) {
        this.m_clefChangeQueue[i].m_layer = layer;
      }
    }
    this.m_clefChanged = 0;

    this.m_prevLayer = layer;

    const staff = layer.GetFirstAncestor(ClassId.STAFF) as unknown as Staff;
    if (!staff) throw new Error('MusicXmlInput::ReadMusicXmlNote: staff is null');
    const cnc = new AttNIntegerComparison(ClassId.STAFFDEF, staff.GetN());
    const firstScoreDef = (this.m_docRef as unknown as { GetFirstScoreDef(): { FindDescendantByComparison(c: unknown): unknown } | null })
      .GetFirstScoreDef();
    const staffDef = (firstScoreDef ? firstScoreDef.FindDescendantByComparison(cnc) : null) as unknown as StaffDef | null;
    let isTablature = false;
    let tuning: Tuning | null = null;

    if (staffDef) {
      tuning = staffDef.FindDescendantByType(ClassId.TUNING) as unknown as Tuning | null;
      const notationType = staffDef.GetNotationtype();
      isTablature = (notationType as number === 9 /* NOTATIONTYPE_tab */
        || notationType as number === NOTATIONTYPE_tab_guitar
        || notationType as number === NOTATIONTYPE_tab_lute_italian
        || notationType as number === NOTATIONTYPE_tab_lute_french
        || notationType as number === NOTATIONTYPE_tab_lute_german);
    }

    const isChord = !node.child('chord').empty();

    // reset figured bass offset
    this.m_durFb = 0;

    let element: VrvObject | null = null;
    let note: Note | null = null;

    let nextIsChord = false;
    const onset = this.m_durTotal; // keep note onsets for later

    // for measure repeats add a single <mRpt> and return
    if (this.m_mRpt) {
      let mRpt = layer.GetFirst(ClassId.MRPT) as unknown as MRpt | null;
      if (!mRpt) {
        mRpt = new MRpt();
        this.AddLayerElement(layer, mRpt);
      }
      return;
    }

    const notations = this.selectNode(node, "notations[not(@print-object='no')]")?.children()
      ? this.selectNode(node, "notations[not(@print-object='no')]")!
      : null;
    const notationsNode = notations as xml_node | null ?? new xml_node();

    const cue = !node.child('cue').empty() || this.selectNode(node, "type[@size='cue']") !== null;
    let grace: xml_node | null = !node.child('grace').empty() ? node.child('grace') : null;

    // duration string and dots
    const typeStr = node.child('type').text().as_string();
    const dots = this.selectNodes(node, 'dot').length;

    let tremSlashNum = -1;

    const readBeamsAndTuplets = this.ReadMusicXmlBeamsAndTuplets(node, layer, isChord);

    // beam start
    let beamStart = !!this.selectNode(node, "beam[@number='1'][text()='begin']");
    // tremolos
    const tremolo = this.selectNode(notationsNode.empty() ? node : notationsNode, 'ornaments/tremolo') ?? new xml_node();

    if (!tremolo.empty()) {
      if (this.HasAttributeWithValue(tremolo, 'type', 'start')) {
        if (!isChord) {
          const fTrem = new FTrem();
          this.AddLayerElement(layer, fTrem);
          this.m_elementStackMap.get(layer)!.push(fTrem);
          const beamFloatNum = tremolo.text().as_int();
          let beamAttachedNum = 0;
          while (beamStart && beamAttachedNum < 8) {
            beamAttachedNum++;
            beamStart = !!this.selectNode(node, `beam[@number='${beamAttachedNum + 1}'][text()='begin']`);
          }
          fTrem.SetBeams(beamFloatNum + beamAttachedNum);
          fTrem.SetBeamsFloat(beamFloatNum);
        }
      }
      else if (!this.HasAttributeWithValue(tremolo, 'type', 'stop')) {
        // this is default tremolo type in MusicXML
        tremSlashNum = tremolo.text().as_int();
        if (!isChord) {
          const bTrem = new BTrem();
          this.AddLayerElement(layer, bTrem);
          this.m_elementStackMap.get(layer)!.push(bTrem);
          if (this.HasAttributeWithValue(tremolo, 'type', 'unmeasured')) {
            bTrem.SetForm(tremForm_FORM_unmeas);
            tremSlashNum = 0;
          }
          else {
            bTrem.SetForm(tremForm_FORM_meas);
          }
        }
      }
    }

    const noteID = node.attribute('id').as_string();
    let duration = node.child('duration').text().as_int();
    // In chords, make sure a note does not extend first note's duration.
    const stack = this.m_elementStackMap.get(layer)!;
    if (isChord && duration && stack.length > 0 && stack[stack.length - 1].Is(ClassId.CHORD)) {
      const chord = stack[stack.length - 1] as unknown as Chord;
      duration = Math.min(duration, chord.GetDurPpq());
    }
    const noteStaffNum = node.child('staff').text().as_int();
    // Staff the note is actually on (cross-staff aware), for control events anchored to this note
    const notationStaffN = (noteStaffNum > 0) ? noteStaffNum + staffOffset : staff.GetN();
    const rest = node.child('rest');
    if (this.m_ppq < 0 && duration && typeStr) {
      // if divisions are missing, try to calculate
      this.m_ppq = Math.trunc(duration * Math.pow(2, ConvertTypeToDur(typeStr) - 2) / 4);
    }

    if (!rest.empty()) {
      const stepStr = rest.child('display-step').text().as_string();
      const octaveStr = rest.child('display-octave').text().as_string();
      if (this.HasAttributeWithValue(node, 'print-object', 'no')) {
        const space = new SpaceEl();
        element = space;
        if (typeStr) {
          space.SetDur(ConvertTypeToDur(typeStr));
          space.SetDurPpq(duration);
          if (dots > 0) space.SetDots(dots);
          if (noteID) space.SetID(noteID);
          if (noteStaffNum > 0 && noteStaffNum + staffOffset !== staff.GetN()) {
            space.SetStaff(strToIntList(String(noteStaffNum + staffOffset)));
          }
          this.AddLayerElement(layer, space, duration);
        }
        else {
          const mSpace = new MSpaceEl();
          if (noteID) mSpace.SetID(noteID);
          this.AddLayerElement(layer, mSpace);
        }
      }
      // we assume /note without /type or with duration of an entire bar to be mRest
      else if (!typeStr || rest.attribute('measure').as_bool()) {
        if (this.m_slash) {
          const tmpMeterSig = new MeterSig();
          tmpMeterSig.SetCount({ count: this.m_meterCount, sign: this.m_meterSign } as never);
          const totalCount = tmpMeterSig.GetTotalCount();
          for (let i = totalCount; i > 0; --i) {
            const slash = new BeatRpt();
            this.AddLayerElement(layer, slash, duration);
          }
          return;
        }
        else {
          const mRest = new MRest();
          element = mRest;
          if (cue) mRest.SetCue(BOOLEAN_true);
          if (stepStr) mRest.SetPloc(ConvertStepToPitchName(stepStr));
          if (octaveStr) mRest.SetOloc(Number.parseInt(octaveStr, 10));
          if (noteID) mRest.SetID(noteID);
          this.AddLayerElement(layer, mRest, duration);
        }
      }
      else {
        if (isTablature) {
          const tabGrp = new TabGrp();
          element = tabGrp;
          tabGrp.SetDur(ConvertTypeToDur(typeStr));
          tabGrp.SetDurPpq(duration);
          if (dots > 0) tabGrp.SetDots(dots);
          tabGrp.AddChild(new TabDurSym());
          // modern guitar tablature has CMN rests
          if (staffDef!.GetNotationtype() as number === NOTATIONTYPE_tab_guitar) {
            tabGrp.AddChild(new Rest());
          }
          this.AddLayerElement(layer, tabGrp, duration);
        }
        else {
          const restEl = new Rest();
          element = restEl;
          restEl.SetColor(node.attribute('color').as_string());
          restEl.SetDur(ConvertTypeToDur(typeStr));
          restEl.SetDurPpq(duration);
          if (dots > 0) restEl.SetDots(dots);
          if (cue) restEl.SetCue(BOOLEAN_true);
          if (stepStr) restEl.SetPloc(ConvertStepToPitchName(stepStr));
          if (octaveStr) restEl.SetOloc(Number.parseInt(octaveStr, 10));
          if (noteID) restEl.SetID(noteID);
          if (noteStaffNum > 0 && noteStaffNum + staffOffset !== staff.GetN()) {
            restEl.SetStaff(strToIntList(String(noteStaffNum + staffOffset)));
          }
          this.AddLayerElement(layer, restEl, duration);
        }
      }
    }
    else {
      note = new Note();
      element = note;
      note.SetVisible(ConvertWordToBool(node.attribute('print-object').as_string()));
      note.SetColor(node.attribute('color').as_string());
      if (noteID) note.SetID(noteID);
      note.SetScoreTimeOnset(new Fraction(onset));
      if (noteStaffNum > 0 && noteStaffNum + staffOffset !== staff.GetN()) {
        note.SetStaff(strToIntList(String(noteStaffNum + staffOffset)));
      }

      // accidentals
      for (const accidental of this.childElements(node, 'accidental')) {
        this.AddAccidental(accidental as xml_node, note);
      }
      for (const accidental of this.selectNodes(node, 'notations/accidental-mark')) {
        this.AddAccidental(accidental, note);
      }

      // stem direction - taken into account below for the chord or the note
      let stemDir = STEMDIRECTION_NONE;
      const stem = node.child('stem');
      const stemText = stem.text().as_string();
      if (stemText === 'down') stemDir = STEMDIRECTION_down;
      else if (stemText === 'up') stemDir = STEMDIRECTION_up;

      // pitch and octave, optional, not needed for tablature
      const pitch = node.child('pitch');
      // C++ `if (pitch)` tests node existence; the JS wrapper is always truthy.
      if (!pitch.empty() && !isTablature) {
        const stepStr = pitch.child('step').text().as_string();
        const alterVal = pitch.child('alter').text().as_float();
        const octaveNum = pitch.child('octave').text().as_int();
        if (stepStr) note.SetPname(ConvertStepToPitchName(stepStr));
        if (this.m_octDis[staff.GetN()] !== 0) {
          note.SetOct(octaveNum - this.m_octDis[staff.GetN()]);
          note.SetOctGes(octaveNum);
        }
        else {
          note.SetOct(octaveNum);
        }

        // adjust accidental (including glyph) based on carried-over accidentals
        if (note.HasPname()) {
          const pitchAlter = PitchAlterToString(note.GetPname(), alterVal);
          const accids = note.FindAllDescendantsByType(ClassId.ACCID);
          if (accids.length === 0) {
            let currentAccids: MusicXmlAccidental[] = [];

            if (this.m_alterAccids.has(pitchAlter)) {
              currentAccids = this.m_alterAccids.get(pitchAlter)!;
            }
            else {
              currentAccids.push(new MusicXmlAccidental(
                accGesToWritten(ConvertAlterToAccid(alterVal)), '', ''));
            }

            for (const current of currentAccids) {
              // Avoid adding empty accidentals
              if ((current.m_accid === ACCIDENTAL_WRITTEN_NONE || current.m_accid === ACCIDENTAL_WRITTEN_n)
                && !current.m_glyphName) {
                continue;
              }

              const accid = new Accid();
              note.AddChild(accid);
              accid.SetAccidGes(accWrittenToGes(current.m_accid));
              accid.SetIsAttribute(true);

              if (current.m_glyphName) {
                accid.SetGlyphName(current.m_glyphName);
                accid.SetGlyphAuth(current.m_glyphAuth);
                accid.SetIsAttribute(false);
              }
              else if (accGesToWritten(accid.GetAccidGes()) !== current.m_accid) {
                const glyph = Accid.GetAccidGlyph(current.m_accid);
                // C++ iomusxml.cpp:3204 passes m_doc so the glyph tables can lazily init.
                accid.SetGlyphName(CustomTuning.GetGlyphName(glyph, this.m_doc as never));
                accid.SetGlyphAuth('smufl');
                accid.SetIsAttribute(false);
              }
            }
          }
          else {
            this.m_alterAccids.set(pitchAlter, []);
            for (const object of accids) {
              const accid = object as unknown as Accid;
              const ges = accWrittenToGes(accid.GetAccid());
              if (accGesToWritten(ges) !== accid.GetAccid()) {
                accid.SetAccidGes(ges);
              }
              this.m_alterAccids.get(pitchAlter)!.push(
                new MusicXmlAccidental(accid.GetAccid(), accid.GetGlyphName(), accid.GetGlyphAuth()));
            }
          }
        }
      }
      else if (!node.child('unpitched').empty()) {
        const unpitched = node.child('unpitched');
        const stepStr = unpitched.child('display-step').text().as_string();
        const octaveNum = unpitched.child('display-octave').text().as_int();
        const loc = PitchInterface.CalcLoc(ConvertStepToPitchName(stepStr), octaveNum, -2);
        note.SetLoc(loc);
      }

      // dynamics (MIDI velocity)
      const dynamics = node.attribute('dynamics').as_float(-1.0);
      if (dynamics >= 0.0) {
        note.SetVel(ConvertDynamicsToMidiVal(dynamics));
      }

      // notehead
      const notehead = node.child('notehead');
      if (!notehead.empty()) {
        note.SetHeadColor(notehead.attribute('color').as_string());
        note.SetHeadShape(ConvertNotehead(notehead.text().as_string()));
        if (notehead.attribute('parentheses').as_bool()) note.SetHeadMod(NOTEHEADMODIFIER_paren);
        note.SetGlyphName(notehead.attribute('smufl').as_string());
        const noteHeadFill = notehead.attribute('filled');
        // C++ `if (noteHeadFill)` tests node existence; the JS wrapper is always truthy.
        if (!noteHeadFill.empty()) note.SetHeadFill(noteHeadFill.as_bool() ? FILL_solid : FILL_void);
        if (notehead.text().as_string().slice(0, 4) === 'none') note.SetHeadVisible(BOOLEAN_false);
      }
      if (!node.child('notehead-text').empty()) LogWarning('MusicXML import: notehead-text is not supported');

      // look at the next note to see if we are starting or ending a chord
      const nextNote = this.selectNode(node, './following-sibling::note') ?? new xml_node();
      if (!nextNote.empty() && !nextNote.child('chord').empty()) nextIsChord = true;
      let chord: Chord | null = null;
      if (isTablature) {
        // create the tabGrp if we are starting a new tabGrp
        if (stack.length === 0 || !stack[stack.length - 1].Is(ClassId.TABGRP)) {
          const tabGrp = new TabGrp();
          tabGrp.SetDur(ConvertTypeToDur(typeStr));
          tabGrp.SetDurPpq(duration);
          if (dots > 0) tabGrp.SetDots(dots);
          tabGrp.AddChild(new TabDurSym());
          this.AddLayerElement(layer, tabGrp, duration);
          stack.push(tabGrp);
          element = tabGrp;
        }
      }
      else if (nextIsChord) {
        // create the chord if we are starting a new chord
        if (stack.length === 0 || !stack[stack.length - 1].Is(ClassId.CHORD)) {
          chord = new Chord();
          chord.SetDur(ConvertTypeToDur(typeStr));
          chord.SetDurPpq(duration);
          if (dots > 0) chord.SetDots(dots);
          chord.SetStemDir(stemDir);
          if (notehead.text().as_string() === 'cluster') chord.SetCluster(CLUSTER_white);
          if (stemText === 'none') chord.SetStemVisible(BOOLEAN_false);
          if (tremSlashNum > 0) {
            chord.SetStemMod(strToStemmodifier(tremSlashNum + 'slash'));
          }
          else if (tremSlashNum === 0) {
            chord.SetStemMod(STEMMODIFIER_z);
          }
          this.AddLayerElement(layer, chord, duration);
          stack.push(chord);
          element = chord;
          if (cue) chord.SetCue(BOOLEAN_true);
          if (grace && !grace.empty()) {
            if (grace.attribute('slash').as_bool()) {
              chord.SetGrace(GRACE_unacc);
              chord.SetStemMod(STEMMODIFIER_1slash);
            }
            else {
              chord.SetGrace(GRACE_acc);
            }
          }
        }
      }
      // If the current note is part of a chord.
      if (!isTablature && (nextIsChord || !node.child('chord').empty())) {
        if (chord === null && stack.length > 0 && stack[stack.length - 1].Is(ClassId.CHORD)) {
          chord = stack[stack.length - 1] as unknown as Chord;
        }
        if (!chord) {
          LogError('MusicXML import: Chord starting point has not been found');
          return;
        }
        // Mark a chord as cue=true if and only if all its child notes are cue.
        if (!cue) {
          chord.SetCue(BOOLEAN_NONE);
        }
        else if (cue && chord.GetCue() !== BOOLEAN_NONE) {
          chord.SetCue(BOOLEAN_true);
        }
        grace = null as never;
      }

      // single grace note
      if (grace && !grace.empty()) {
        if (grace.attribute('slash').as_bool()) {
          note.SetGrace(GRACE_unacc);
          note.SetStemMod(STEMMODIFIER_1slash);
        }
        else {
          note.SetGrace(GRACE_acc);
        }
      }
      if (cue) note.SetCue(BOOLEAN_true);

      // set attributes to the note if we are not in a chord
      if (!isTablature && (stack.length === 0 || !stack[stack.length - 1].Is(ClassId.CHORD))) {
        if (typeStr) note.SetDur(ConvertTypeToDur(typeStr));
        note.SetDurPpq(duration);
        if (dots > 0) note.SetDots(dots);
        note.SetStemDir(stemDir);
        // C++ `if (... && stem.attribute("default-y"))` tests node existence (iomusxml.cpp:3343);
        // the JS wrapper is always truthy, so the empty() test is the faithful port.
        if (!node.attribute('default-y').empty() && !stem.attribute('default-y').empty()) {
          const stemLen = Math.abs(node.attribute('default-y').as_float()
            - stem.attribute('default-y').as_float()) / 5;
          note.SetStemLen(stemLen);
        }
        if (stemText === 'none') note.SetStemVisible(BOOLEAN_false);
        if (tremSlashNum > 0) {
          note.SetStemMod(strToStemmodifier(tremSlashNum + 'slash'));
        }
        else if (tremSlashNum === 0) {
          note.SetStemMod(STEMMODIFIER_z);
        }
      }

      // beamspan
      if (!readBeamsAndTuplets) {
        const meiBeamSpan = new BeamSpan();
        meiBeamSpan.SetStartid('#' + element!.GetID());
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, meiBeamSpan]);
        this.m_beamspanStack.push([meiBeamSpan, [staff.GetN(), layer.GetN()]]);
      }

      // verse / syl
      for (const lyric of this.childElements(node, 'lyric')) {
        let extendStop: xml_node | null = null;
        let hasStartingExtend = false;
        for (const extend of this.childElements(lyric, 'extend')) {
          if (this.HasAttributeWithValue(extend, 'type', 'stop')) {
            extendStop = extend as xml_node;
          }
          else {
            hasStartingExtend = true;
          }
        }
        if (lyric.child('text').empty() && !extendStop) continue; // Dorico exports non-valid MusicXML
        let lyricNumber = lyric.attribute('number').as_int();
        lyricNumber = (lyricNumber < 1) ? 1 : lyricNumber;
        const verse = new Verse();
        (verse as unknown as { SetColor(v: string): void }).SetColor(lyric.attribute('color').as_string());
        (verse as unknown as { SetLabel(v: string): void }).SetLabel(lyric.attribute('name').as_string());
        (verse as unknown as { SetN(v: number): void }).SetN(lyricNumber);
        // MusicXML represents melisma endpoints as textless <lyric><extend type="stop"/></lyric>.
        if (extendStop && !extendStop.empty()) {
          verse.AddChild(new Syl());
        }
        let syllabic = 'single';
        for (const childNode of lyric.children()) {
          if (childNode.name() === 'syllabic') syllabic = this.GetContent(childNode as xml_node);
          if (childNode.name() === 'text' && !this.HasAttributeWithValue(lyric, 'print-object', 'no')) {
            const textStyle = childNode.attribute('font-style').as_string();
            const textWeight = childNode.attribute('font-weight').as_string();
            const lineThrough = childNode.attribute('line-through').as_int();
            const lang = childNode.attribute('xml:lang').as_string();
            let textStr = childNode.text().as_string();

            // convert verse numbers to labels
            const labelSearch = /^([^a-zA-Z]*\d[^a-zA-Z]*)$/;
            const labelPrefixSearch = /^([^a-zA-Z]*\d[^a-zA-Z]*)[\s\u00A0]+/;
            const labelSearchMatches = labelSearch.exec(textStr);
            const labelPrefixSearchMatches = labelPrefixSearch.exec(textStr);
            // C++ `if (... && childNode.next_sibling("elision"))` tests node existence
            // (iomusxml.cpp:3406); the JS wrapper is always truthy.
            if (textStr && labelSearchMatches && !childNode.next_sibling('elision').empty()) {
              // entire textStr is a label (MusicXML from Finale)
              const label = new Label();
              const text = new Text();
              text.SetText(UTF8to32(labelSearchMatches[0]));
              label.AddChild(text);
              verse.AddChild(label);
              continue;
            }
            else if (textStr && labelPrefixSearchMatches) {
              // first part of textStr is a label (MusicXML from Sibelius, MuseScore)
              const label = new Label();
              const labelPrefix = labelPrefixSearchMatches[0];
              const trimmed = labelPrefix.replace(/[ \f\n\r\t\v\u00A0]+$/, '');
              const text = new Text();
              text.SetText(UTF8to32(trimmed));
              label.AddChild(text);
              verse.AddChild(label);

              textStr = textStr.slice(labelPrefix.length);
            }

            const syl = new Syl();
            syl.SetLang(lang);
            if (syllabic === 'single') {
              syl.SetWordpos(sylLog_WORDPOS_s);
              syl.SetCon(sylLog_CON_s);
            }
            else if (syllabic === 'begin') {
              syl.SetWordpos(sylLog_WORDPOS_i);
              syl.SetCon(sylLog_CON_d);
            }
            else if (syllabic === 'middle') {
              syl.SetWordpos(sylLog_WORDPOS_m);
              syl.SetCon(sylLog_CON_d);
            }
            else if (syllabic === 'end') {
              syl.SetWordpos(sylLog_WORDPOS_t);
              syl.SetCon(sylLog_CON_s);
            }

            // override @con if we have elisions or extensions
            // C++ `if (childNode.next_sibling("elision"))` tests existence (iomusxml.cpp:3454).
            if (!childNode.next_sibling('elision').empty()) {
              syl.SetCon(sylLog_CON_b);
            }
            else if (hasStartingExtend) {
              syl.SetCon(sylLog_CON_u);
            }

            if (textStyle) syl.SetFontstyle(strToFontstyle(textStyle));
            if (textWeight) syl.SetFontweight(strToFontweight(textWeight));

            const text = new Text();
            text.SetText(UTF8to32(textStr));
            if (lineThrough) {
              const rend = new Rend();
              rend.AddChild(text);
              rend.SetRend(TEXTRENDITION_line_through);
              syl.AddChild(rend);
            }
            else {
              syl.AddChild(text);
            }
            verse.AddChild(syl);
          }
        }
        if (element!.Is(ClassId.CHORD) || element!.Is(ClassId.NOTE)) {
          element!.AddChild(verse);
        }
        // else: this should not happen; verse discarded
      }

      // slurs
      const slurs = this.selectNodes(node, 'notations/slur');
      for (const slurNode of slurs) {
        let slurNumber = slurNode.attribute('number').as_int();
        slurNumber = (slurNumber < 1) ? 1 : slurNumber;
        const dir = this.InferCurvedir(slurNode);
        if (this.HasAttributeWithValue(slurNode, 'type', 'stop')) {
          this.CloseSlur(measure, slurNumber, note!, dir);
        }
        else if (this.HasAttributeWithValue(slurNode, 'type', 'start')) {
          const meiSlur = new Slur();
          meiSlur.SetColor(slurNode.attribute('color').as_string());
          meiSlur.SetLform(strToLineform(slurNode.attribute('line-type').as_string()));
          if (!slurNode.attribute('id').empty()) meiSlur.SetID(slurNode.attribute('id').as_string());
          meiSlur.SetStartid('#' + note!.GetID());
          this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, meiSlur]);
          this.OpenSlur(measure, slurNumber, meiSlur, dir);
        }
      }

      // ties
      this.ReadMusicXmlTies(node, layer, note, measure);

      // articulation
      const artics: Artic[] = [];
      if (!notationsNode.empty()) {
        for (const articulations of this.childElements(notationsNode, 'articulations')) {
          for (const articulation of (articulations as xml_node).children()) {
            let artic = new Artic();
            let articVal = ConvertArticulations(articulation.name());
            if (articulation.name() === 'detached-legato') {
              // we need to split up this one
              artic.SetArtic([articVal]);
              artic.SetColor(articulation.attribute('color').as_string());
              artic.SetPlace(strToStaffrel(articulation.attribute('placement').as_string()));
              artics.push(artic);
              artic = new Artic();
              articVal = ARTICULATION_ten;
            }
            if (articVal === ARTICULATION_NONE) {
              continue;
            }
            artic.SetArtic([articVal]);
            artic.SetColor(articulation.attribute('color').as_string());
            artic.SetPlace(strToStaffrel(articulation.attribute('placement').as_string()));
            // Always put stacc at the front of the list
            (artic.GetArticFirst() === ARTICULATION_stacc) ? artics.unshift(artic) : artics.push(artic);
          }
        }
      }
      for (const artic of artics) element!.AddChild(artic);

      // technical
      if (!notationsNode.empty()) {
        for (const technical of this.childElements(notationsNode, 'technical')) {
          for (const technicalChild of (technical as xml_node).children()) {
            const technicalChildName = technicalChild.name();

            // fingering
            if (technicalChildName === 'fingering') {
              const fingText = technicalChild.text().as_string();
              const fing = new Fing();
              const text = new Text();
              text.SetText(UTF8to32(fingText));
              this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, fing]);
              const startID = note ? ('#' + note.GetID()) : this.m_ID;
              fing.SetStartid(startID);
              fing.SetStaff(strToIntList(String(notationStaffN)));
              fing.SetPlace(strToStaffrel(technicalChild.attribute('placement').as_string()));
              fing.AddChild(text);
            }
            else if (technicalChildName === 'thumb-position') {
              continue;
            }
            else if (technicalChildName === 'string') {
              continue; // handled with fret
            }
            else if (technicalChildName === 'fret') {
              // set @tab.string and @tab.fret
              const fret = technicalChild.text().as_int();
              // C++ iomusxml.cpp:3578 reads <string> from the parent <technical>,
              // not from <fret> (they are siblings).
              const course = (technical as xml_node).child('string').text().as_int();
              note!.SetTabFret(fret);
              note!.SetTabCourse(course);

              // Do we have the pitch for this note, if so do we have the tuning for this course?
              const pitchNode = node.child('pitch');
              if (tuning && !pitchNode.empty()) {
                const cncCourse = new AttNNumberLikeComparison(ClassId.COURSE, String(course));
                let courseTuning: Course | null = tuning.FindDescendantByComparison(cncCourse) as unknown as Course | null;

                if (!courseTuning) {
                  // we have the note's pitch, but not the course's tuning, set it
                  const midi = PitchToMidi(pitchNode.child('step').text().as_string(),
                    pitchNode.child('alter').text().as_int(),
                    pitchNode.child('octave').text().as_int());

                  // course's pitch
                  const p = MidiToPitch(midi - fret);
                  courseTuning = new Course();
                  tuning.AddChild(courseTuning);
                  courseTuning.SetN(String(course));
                  courseTuning.SetPname(ConvertStepToPitchName(p.step));
                  courseTuning.SetOct(p.octave);
                  if (p.alter !== 0) {
                    courseTuning.SetAccid({ value: ConvertAlterToAccid(p.alter) } as never);
                  }
                }
              }
            }
            else {
              const artic = new Artic();
              const articVal = ConvertArticulations(technicalChild.name());
              if (articVal !== ARTICULATION_NONE) artic.SetArtic([articVal]);
              artic.SetColor(technicalChild.attribute('color').as_string());
              artic.SetGlyphName(technicalChild.attribute('smufl').as_string());
              artic.SetPlace(strToStaffrel(technicalChild.attribute('placement').as_string()));
              artic.SetType('technical');
              element!.AddChild(artic);
            }
          }
        }
      }

      // add the note to the layer or to the current container
      this.AddLayerElement(layer, note!, duration);

      // if we are ending a chord or tabGrp remove it from the stack
      if (!nextIsChord) {
        const classId = isTablature ? ClassId.TABGRP : ClassId.CHORD;
        if (stack.length > 0 && stack[stack.length - 1].Is(classId)) {
          this.SetChordStaff(layer);
          this.RemoveLastFromStack(classId, layer);
        }
      }
    }

    this.m_ID = '#' + element!.GetID();

    // breath marks
    const xmlBreath = this.selectNode(notationsNode, 'articulations/breath-mark') ?? new xml_node();
    if (!xmlBreath.empty()) {
      const breath = new Breath();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, breath]);
      breath.SetStaff(strToIntList(String(notationStaffN)));
      breath.SetPlace(strToStaffrel(xmlBreath.attribute('placement').as_string()));
      breath.SetColor(xmlBreath.attribute('color').as_string());
      breath.SetTstamp((this.m_durTotal + duration) * this.m_meterUnit / (4 * this.m_ppq) + 0.9);
    }

    // caesura
    const xmlCaesura = this.selectNode(notationsNode, 'articulations/caesura') ?? new xml_node();
    if (!xmlCaesura.empty()) {
      const caesura = new Caesura();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, caesura]);
      caesura.SetStaff(strToIntList(String(notationStaffN)));
      caesura.SetPlace(strToStaffrel(xmlCaesura.attribute('placement').as_string()));
      caesura.SetColor(xmlCaesura.attribute('color').as_string());
      caesura.SetTstamp((this.m_durTotal + duration) * this.m_meterUnit / (4 * this.m_ppq) + 0.9);
    }

    // add duration to measure time
    if (!nextIsChord) this.m_durTotal += duration;

    // dynamics
    const xmlDynam = (!notationsNode.empty() && !notationsNode.child('dynamics').empty()) ? notationsNode.child('dynamics') : new xml_node();
    if (!xmlDynam.empty()) {
      const dynam = new Dynam();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, dynam]);
      dynam.SetStaff(strToIntList(String(notationStaffN)));
      dynam.SetStartid(this.m_ID);
      if (!xmlDynam.attribute('id').empty()) dynam.SetID(xmlDynam.attribute('id').as_string());
      dynam.SetPlace(strToStaffrel(xmlDynam.attribute('placement').as_string()));
      let defaultY = xmlDynam.attribute('default-y').as_int();
      defaultY = (defaultY * 10) + xmlDynam.attribute('relative-y').as_int();
      defaultY = (defaultY < 0) ? Math.abs(defaultY) : defaultY + 2000;
      dynam.SetVgrp(defaultY);
      let dynamStr = '';
      const parts: xml_node[] = [...xmlDynam.children()] as xml_node[];
      for (let i = 0; i < parts.length; i++) {
        const xmlDynamPart = parts[i];
        if (xmlDynamPart.name() === 'other-dynamics') {
          dynamStr += xmlDynamPart.text().as_string();
        }
        else {
          dynamStr += xmlDynamPart.name();
        }
        if (i !== parts.length - 1) dynamStr += ' ';
      }
      const text = new Text();
      text.SetText(UTF8to32(dynamStr));
      dynam.AddChild(text);
    }

    // fermatas
    const xmlFermata = (!notationsNode.empty() && !notationsNode.child('fermata').empty()) ? notationsNode.child('fermata') : new xml_node();
    if (!xmlFermata.empty()) {
      const fermata = new Fermata();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, fermata]);
      fermata.SetStartid(this.m_ID);
      fermata.SetStaff(strToIntList(String(notationStaffN)));
      if (!xmlFermata.attribute('id').empty()) fermata.SetID(xmlFermata.attribute('id').as_string());
      this.ShapeFermata(fermata, xmlFermata);
    }

    // glissando and slide
    const glissandi = this.selectNodes(notationsNode ?? node, 'glissando|slide');
    for (const xmlGlissando of glissandi) {
      let noteIDLocal = this.m_ID;
      // prevent from using chords or tabGrps
      if (element!.Is(ClassId.CHORD) || element!.Is(ClassId.TABGRP)) {
        noteIDLocal = '#' + (element!.GetChild(0) as unknown as VrvObject).GetID();
      }
      if (this.HasAttributeWithValue(xmlGlissando, 'type', 'start')) {
        const gliss = new Gliss();
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, gliss]);
        gliss.SetColor(xmlGlissando.attribute('color').as_string());
        gliss.SetLform(strToLineform(xmlGlissando.attribute('line-type').as_string()));
        gliss.SetN(xmlGlissando.attribute('number').as_string());
        gliss.SetStartid(noteIDLocal);
        gliss.SetStaff(strToIntList(String(notationStaffN)));
        (gliss as unknown as { SetType(v: string): void }).SetType(xmlGlissando.name());
        if (!xmlGlissando.attribute('id').empty()) gliss.SetID(xmlGlissando.attribute('id').as_string());
        this.m_glissStack.push(gliss);
      }
      else if (this.m_glissStack.length > 0) {
        const extNumber = xmlGlissando.attribute('number').as_int();
        for (let i = 0; i < this.m_glissStack.length;) {
          const iter = this.m_glissStack[i] as Gliss;
          if ((Number.parseInt(String(iter.GetN()), 10) || 0) === extNumber
            && (iter as unknown as { GetType(): string }).GetType() === xmlGlissando.name()) {
            iter.SetEndid(noteIDLocal);
            this.m_glissStack.splice(i, 1);
          }
          else {
            ++i;
          }
        }
      }
    }

    // mordents
    const xmlMordent = this.selectNode(notationsNode, "ornaments/*[contains(name(), 'mordent')]") ?? new xml_node();
    if (!xmlMordent.empty()) {
      const mordent = new Mordent();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, mordent]);
      mordent.SetStaff(strToIntList(String(notationStaffN)));
      mordent.SetStartid(this.m_ID);
      mordent.SetColor(xmlMordent.attribute('color').as_string());
      mordent.SetLong(ConvertWordToBool(xmlMordent.attribute('long').as_string()));
      mordent.SetPlace(strToStaffrel(xmlMordent.attribute('placement').as_string()));
      mordent.SetForm(mordentLog_FORM_lower);
      if (xmlMordent.name().slice(0, 7) === 'inverte') {
        mordent.SetForm(mordentLog_FORM_upper);
      }
      for (const xmlAccidMark of this.childElements(notationsNode!, 'accidental-mark')) {
        const accid = ConvertAccidentalToAccid(xmlAccidMark.text().as_string());
        if (this.HasAttributeWithValue(xmlAccidMark, 'placement', 'above')) {
          mordent.SetAccidupper(accid);
        }
        else if (this.HasAttributeWithValue(xmlAccidMark, 'placement', 'below')) {
          mordent.SetAccidlower(accid);
        }
        else {
          if (mordent.GetForm() === mordentLog_FORM_upper) mordent.SetAccidupper(accid);
          if (mordent.GetForm() === mordentLog_FORM_lower) mordent.SetAccidlower(accid);
        }
      }
      if (BOOLEAN_true === mordent.GetLong()) {
        let mordentFlags = (mordentLog_FORM_upper === mordent.GetForm()) ? FORM_Inverted : FORM_Normal;
        if (!xmlMordent.attribute('approach').empty()) {
          mordentFlags |= (xmlMordent.attribute('approach').as_string() === 'above') ? APPR_Above : APPR_Below;
        }
        if (!xmlMordent.attribute('departure').empty()) {
          mordentFlags |= (xmlMordent.attribute('departure').as_string() === 'above') ? DEP_Above : DEP_Below;
        }
        const smuflCode = GetOrnamentGlyphNumber(mordentFlags);
        if (smuflCode) {
          const mordentAny = mordent as unknown as {
            SetGlyphNum(v: number): void; SetGlyphAuth(v: string): void;
          };
          mordentAny.SetGlyphNum(hexnumToInt(smuflCode));
          mordentAny.SetGlyphAuth('smufl');
        }
      }
    }

    // schleifer/haydn (counts as mordent with different glyph)
    const xmlExtOrnament = this.selectNode(notationsNode,
      "ornaments/*[contains(name(), 'schleifer') or contains(name(), 'haydn')]") ?? new xml_node();
    if (!xmlExtOrnament.empty()) {
      const mordent = new Mordent();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, mordent]);
      mordent.SetStaff(strToIntList(String(notationStaffN)));
      mordent.SetStartid(this.m_ID);
      mordent.SetColor(xmlExtOrnament.attribute('color').as_string());
      mordent.SetPlace(strToStaffrel(xmlExtOrnament.attribute('placement').as_string()));
      const isHaydn = xmlExtOrnament.name() === 'haydn';
      const mordentAny = mordent as unknown as {
        SetGlyphNum(v: number): void; SetGlyphAuth(v: string): void;
      };
      mordentAny.SetGlyphNum(hexnumToInt(isHaydn ? 'U+E56F' : 'U+E587'));
      mordentAny.SetGlyphAuth('smufl');
    }

    // trill
    const xmlTrill = this.selectNode(notationsNode, 'ornaments/trill-mark') ?? new xml_node();
    const xmlTrillLine = this.selectNode(notationsNode, "ornaments/wavy-line[@type='start']") ?? new xml_node();
    if (!xmlTrill.empty() || !xmlTrillLine.empty()) {
      const trill = new Trill();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, trill]);
      trill.SetStaff(strToIntList(String(notationStaffN)));
      trill.SetStartid(this.m_ID);
      trill.SetColor(!xmlTrill.empty() ? xmlTrill.attribute('color').as_string() : '');
      trill.SetPlace(strToStaffrel(
        !xmlTrill.empty() ? xmlTrill.attribute('placement').as_string() : ''));
      if (!xmlTrillLine.empty()) {
        trill.SetExtender(BOOLEAN_true);
        trill.SetN(xmlTrillLine.attribute('number').as_string());
        if (xmlTrill.empty()) {
          trill.SetLstartsym(LINESTARTENDSYMBOL_none);
          trill.SetColor(xmlTrillLine.attribute('color').as_string());
          trill.SetPlace(strToStaffrel(xmlTrillLine.attribute('placement').as_string()));
        }
        this.m_trillStack.push([trill, new MusicXmlOpenSpanner(1, this.m_measureCounts.get(measure) ?? 0)]);
      }
      // accidental-mark siblings following the trill-mark
      if (!xmlTrill.empty()) {
        for (let accidMark = xmlTrill.next_sibling('accidental-mark'); !accidMark.empty();
          accidMark = accidMark.next_sibling('accidental-mark')) {
          if (this.HasAttributeWithValue(accidMark, 'placement', 'below')) {
            trill.SetAccidlower(ConvertAccidentalToAccid(accidMark.text().as_string()));
          }
          else {
            trill.SetAccidupper(ConvertAccidentalToAccid(accidMark.text().as_string()));
          }
        }
      }
    }
    if (this.m_trillStack.length > 0
      && this.selectNode(notationsNode, "ornaments/wavy-line[@type='stop']")) {
      const extNumber = this.selectNode(notationsNode, "ornaments/wavy-line[@type='stop']")!
        .attribute('number').as_int();
      for (let i = 0; i < this.m_trillStack.length;) {
        const iter = this.m_trillStack[i];
        const measureDifference = (this.m_measureCounts.get(measure) ?? 0) - iter[1].m_lastMeasureCount;
        if ((Number.parseInt(String((iter[0] as Trill).GetN()), 10) || 0) === extNumber) {
          (iter[0] as Trill).SetTstamp2(
            { 0: measureDifference, 1: this.m_durTotal * this.m_meterUnit / (4 * this.m_ppq) + 1 } as never);
          this.m_trillStack.splice(i, 1);
        }
        else {
          ++i;
        }
      }
    }

    // turns
    const xmlTurn = this.selectNode(notationsNode, "ornaments/*[contains(name(), 'turn')]") ?? new xml_node();
    if (!xmlTurn.empty()) {
      const turn = new Turn();
      this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, turn]);
      turn.SetStaff(strToIntList(String(notationStaffN)));
      turn.SetStartid(this.m_ID);
      turn.SetColor(xmlTurn.attribute('color').as_string());
      turn.SetPlace(strToStaffrel(xmlTurn.attribute('placement').as_string()));
      turn.SetForm(turnLog_FORM_upper);
      for (let accidMark = xmlTurn.next_sibling('accidental-mark'); !accidMark.empty();
        accidMark = accidMark.next_sibling('accidental-mark')) {
        if (this.HasAttributeWithValue(accidMark, 'placement', 'above')) {
          turn.SetAccidupper(ConvertAccidentalToAccid(accidMark.text().as_string()));
        }
        else if (this.HasAttributeWithValue(accidMark, 'placement', 'below')) {
          turn.SetAccidlower(ConvertAccidentalToAccid(accidMark.text().as_string()));
        }
        else {
          LogWarning('MusicXML import: Cannot add an accidental to a turn without placement');
        }
      }
      const turnAny = turn as unknown as {
        SetGlyphNum(v: number): void; SetGlyphAuth(v: string): void;
      };
      if (xmlTurn.attribute('slash').as_bool()) {
        turnAny.SetGlyphAuth('smufl');
        turnAny.SetGlyphNum(hexnumToInt('U+E569'));
      }
      if (xmlTurn.name().slice(0, 8) === 'inverted') {
        turn.SetForm(turnLog_FORM_lower);
        if (xmlTurn.name().includes('vertical')) {
          (turn as unknown as { SetType(v: string): void }).SetType('vertical');
          turnAny.SetGlyphAuth('smufl');
          turnAny.SetGlyphNum(hexnumToInt('U+E56B'));
        }
      }
      if (xmlTurn.name().slice(0, 7) === 'delayed') {
        turn.SetDelayed(BOOLEAN_true);
      }
      if (xmlTurn.name().slice(0, 8) === 'vertical') {
        (turn as unknown as { SetType(v: string): void }).SetType('vertical');
        turnAny.SetGlyphAuth('smufl');
        turnAny.SetGlyphNum(hexnumToInt('U+E56A'));
      }
    }

    // arpeggio
    const xmlArpeggiate = this.selectNode(notationsNode, "*[contains(name(), 'arpeggiate')]") ?? new xml_node();
    if (!xmlArpeggiate.empty()) {
      let arpegN = xmlArpeggiate.attribute('number').as_int();
      arpegN = (arpegN < 1) ? 1 : arpegN;
      const direction = xmlArpeggiate.attribute('direction').as_string();
      let added = false;
      if (this.m_ArpeggioStack.length > 0) { // check existing arpeggios
        for (const iter of this.m_ArpeggioStack) {
          if (iter[1].m_arpegN === arpegN && onset === iter[1].m_timeStamp) {
            // don't add other chord notes, because the chord is already referenced.
            if (!isChord) {
              (iter[0] as Arpeg).GetPlistInterface().AddRef('#' + element!.GetID());
            }
            added = true; // so that no new Arpeg gets created below
            break;
          }
        }
      }
      if (!added) {
        const arpeggio = new Arpeg();
        arpeggio.GetPlistInterface().AddRef('#' + element!.GetID());
        arpeggio.SetColor(xmlArpeggiate.attribute('color').as_string());
        // direction (up/down) and in MEI arrow
        if (direction) {
          const arpegAny = arpeggio as unknown as { SetArrow(v: number): void; SetOrder(v: number): void };
          arpegAny.SetArrow(BOOLEAN_true);
          if (direction === 'up') {
            arpegAny.SetOrder(arpegLog_ORDER_up);
          }
          else if (direction === 'down') {
            arpegAny.SetOrder(arpegLog_ORDER_down);
          }
          else {
            arpegAny.SetOrder(arpegLog_ORDER_NONE);
          }
        }
        if (xmlArpeggiate.name().slice(0, 3) === 'non') {
          (arpeggio as unknown as { SetOrder(v: number): void }).SetOrder(arpegLog_ORDER_nonarp);
        }
        this.m_ArpeggioStack.push([arpeggio, new MusicXmlOpenArpeggio(arpegN, onset)]);
        this.m_controlElements.push([this.m_measureCounts.get(measure) ?? 0, arpeggio]);
      }
    }

    // tremolo end
    if (!tremolo.empty()) {
      if (this.HasAttributeWithValue(tremolo, 'type', 'stop')) {
        this.RemoveLastFromStack(ClassId.FTREM, layer);
      }
      else if (!this.HasAttributeWithValue(tremolo, 'type', 'start') && !isChord) {
        this.RemoveLastFromStack(ClassId.BTREM, layer);
      }
    }

    // tuplet end
    if (this.selectNode(node, "notations/tuplet[@type='stop']")) {
      this.RemoveLastFromStack(ClassId.TUPLET, layer);
    }

    // beam end
    const beamEnd = !!this.selectNode(node, "beam[text()='end']");
    if (beamEnd) {
      const breakSec = this.selectNodes(node, "beam[text()='continue']").length;
      if (breakSec) {
        const breaksecTarget = element as unknown as { SetBreaksec(v: number): void };
        if (breaksecTarget && typeof breaksecTarget.SetBreaksec === 'function') {
          breaksecTarget.SetBreaksec(breakSec);
        }
      }
      else {
        if (this.IsInStack(ClassId.BEAM, layer)) {
          this.RemoveLastFromStack(ClassId.BEAM, layer);
        }
        else {
          this.CloseBeamSpan(staff, layer, element as unknown as LayerElement);
        }
      }
    }

    // add StartIDs to dir, dynam, and pedal
    if (this.m_dirStack.length > 0) {
      for (const dir of this.m_dirStack as unknown[]) {
        if (!(dir as { HasStaff(): boolean }).HasStaff()) {
          (dir as { SetStaff(v: number[]): void }).SetStaff(
            strToIntList(String(staff.GetN())));
        }
      }
      this.m_dirStack = [];
    }
    if (this.m_dynamStack.length > 0) {
      for (const dynam of this.m_dynamStack as unknown[]) {
        if (!(dynam as { HasStaff(): boolean }).HasStaff()) {
          (dynam as { SetStaff(v: number[]): void }).SetStaff(
            strToIntList(String(staff.GetN())));
        }
      }
      this.m_dynamStack = [];
    }
    if (this.m_harmStack.length > 0) {
      for (const harm of this.m_harmStack as unknown[]) {
        (harm as { SetStaff(v: number[]): void }).SetStaff(
          strToIntList(String(staff.GetN())));
      }
      this.m_harmStack = [];
    }
    if (this.m_octaveStack.length > 0) {
      for (const oct of this.m_octaveStack as unknown[]) {
        (oct as { SetStaff(v: number[]): void }).SetStaff(
          strToIntList(String(staff.GetN())));
        (oct as { SetStartid(v: string): void }).SetStartid(this.m_ID);
      }
      this.m_octaveStack = [];
    }
    if (this.m_pedalStack.length > 0) {
      for (const ped of this.m_pedalStack as unknown[]) {
        if (!(ped as { HasStaff(): boolean }).HasStaff()) {
          (ped as { SetStaff(v: number[]): void }).SetStaff(
            strToIntList(String(staff.GetN())));
        }
      }
      this.m_pedalStack = [];
    }
    if (this.m_bracketStack.length > 0) {
      for (const iter of this.m_bracketStack) {
        if (!(iter[0] as { HasStaff(): boolean }).HasStaff()) {
          (iter[0] as { SetStaff(v: number[]): void }).SetStaff(
            strToIntList(String(staff.GetN())));
        }
      }
      // C++ iomusxml.cpp:4047 keeps m_bracketStack open across measures (cleared
      // only in ReadMusicXmlPart, 1862); clearing here killed open brackets and
      // crashed the later <principal-voice type="stop"> on 31a.
    }
    if (this.m_tempoStack.length > 0) {
      for (const tempo of this.m_tempoStack as unknown[]) {
        if (!(tempo as { HasStaff(): boolean }).HasStaff()) {
          (tempo as { SetStaff(v: number[]): void }).SetStaff(
            strToIntList(String(staff.GetN())));
        }
      }
      this.m_tempoStack = [];
    }
  }

  //--- iomusxml.cpp 4073-4102: AddAccidental --------------------------------------------
  protected AddAccidental(accidental: xml_node, note: Note): void {
    const accid = new Accid();
    accid.SetAccid(ConvertAccidentalToAccid(accidental.text().as_string()));
    accid.SetColor(accidental.attribute('color').as_string());
    accid.SetGlyphName(accidental.attribute('smufl').as_string());
    if (accid.HasGlyphName()) {
      accid.SetGlyphAuth('smufl');
      if (!accid.HasAccid()) {
        accid.SetAccid(ACCIDENTAL_WRITTEN_n);
      }
    }
    accid.SetPlace(strToStaffrel(accidental.attribute('placement').as_string()));
    if (!accidental.attribute('id').empty()) accid.SetID(accidental.attribute('id').as_string());
    if (this.HasAttributeWithValue(accidental, 'cautionary', 'yes')) {
      (accid as unknown as { SetFunc(v: number): void }).SetFunc(accidLog_FUNC_caution);
    }
    if (this.HasAttributeWithValue(accidental, 'editorial', 'yes')) {
      (accid as unknown as { SetFunc(v: number): void }).SetFunc(accidLog_FUNC_edit);
    }
    if (this.HasAttributeWithValue(accidental, 'bracket', 'yes')) accid.SetEnclose(ENCLOSURE_brack);
    if (this.HasAttributeWithValue(accidental, 'parentheses', 'yes')) accid.SetEnclose(ENCLOSURE_paren);
    if (accidental.name() === 'accidental-mark') {
      (accid as unknown as { SetOnstaff(v: number): void }).SetOnstaff(BOOLEAN_false);
    }
    note.AddChild(accid);
  }
  protected ReadMusicXmlPrint(node: xml_node, section: Section): void {
    if (node.empty()) throw new Error('MusicXmlInput: null node');

    if (node.attribute('new-page').as_bool()) {
      const pageBreaks = node.attribute('blank-page').as_int() + 1;
      for (let i = 0; i < pageBreaks; ++i) {
        const pb = new Pb();
        (section as unknown as VrvObject).AddChild(pb);
      }
    }

    if (node.attribute('new-system').as_bool()) {
      const sb = new Sb();
      (section as unknown as VrvObject).AddChild(sb);
    }

    if (node.child('measure-numbering').text().as_string() === 'none') {
      ((this.m_docRef as unknown as { GetFirstScoreDef(): { SetMnumVisible(v: number): void } | null })
        .GetFirstScoreDef())?.SetMnumVisible(BOOLEAN_false);
    }
  }

  /** C++ iomusxml.cpp 1546-1747. Full per-staff body. */
  protected ReadMusicXmlPartAttributesAsStaffDef(node: xml_node, staffGrp: StaffGrp, staffOffset: number): number {
    if (node.empty()) throw new Error('MusicXmlInput: null node');
    let nbStaves = 1;
    const staves = node.child('attributes').child('staves');
    if (!staves.empty()) nbStaves = staves.text().as_int();
    if (nbStaves > 1) {
      // C++ iomusxml.cpp:1543-1549: group takes ownership, not individual staves.
      if (this.m_label) staffGrp.AddChild(this.m_label as VrvObject);
      if (this.m_labelAbbr) staffGrp.AddChild(this.m_labelAbbr as VrvObject);
      if (this.m_instrdef) staffGrp.AddChild(this.m_instrdef as VrvObject);
      this.m_label = null;
      this.m_labelAbbr = null;
      this.m_instrdef = null;
    }

    for (let child = node.first_child(); !child.empty(); child = child.next_sibling()) {
      if (!this.IsElement(child, 'attributes') && !this.IsElement(child, 'barline')
        && !this.IsElement(child, 'direction') && !this.IsElement(child, 'print')
        && !this.IsElement(child, 'sound')) {
        break;
      }
      if (this.IsElement(child, 'attributes')) {
        child.set_name('mei-read');
      }
      else {
        continue;
      }

      for (let i = 0; i < nbStaves; i++) {
        const comparisonStaffDef = new AttNIntegerComparison(ClassId.STAFFDEF, i + 1 + staffOffset);
        let staffDef = staffGrp.FindDescendantByComparison(comparisonStaffDef, 1) as StaffDef | null;
        if (!staffDef) {
          staffDef = new StaffDef();
          staffDef.SetN(i + 1 + staffOffset);
          if (nbStaves === 1) {
            staffDef.SetID(staffGrp.GetID());
            if (this.m_label) staffDef.AddChild(this.m_label as VrvObject);
            if (this.m_labelAbbr) staffDef.AddChild(this.m_labelAbbr as VrvObject);
            if (this.m_instrdef) staffDef.AddChild(this.m_instrdef as VrvObject);
            this.m_label = null;
            this.m_labelAbbr = null;
            this.m_instrdef = null;
          }
          staffGrp.AddChild(staffDef);
          this.m_octDis.push(0);
        }

        // clef: per-staff @number first, then common (id stripped when shared)
        let clef = this.childByNumber(child, 'clef', i + 1);
        if (clef.empty()) {
          clef = this.childWithoutNumber(child, 'clef');
          if (nbStaves > 1 && !clef.empty()) clef.remove_attribute('id');
        }
        const meiClef = this.ConvertClef(clef);
        if (meiClef) {
          staffDef.AddChild(meiClef);
          if (meiClef.GetShape() === CLEFSHAPE_TAB) staffDef.SetNotationtype(NOTATIONTYPE_tab_guitar);
        }

        // key sig
        let key = this.childByNumber(child, 'key', i + 1);
        if (key.empty()) {
          key = this.childWithoutNumber(child, 'key');
          if (nbStaves > 1 && !key.empty()) key.remove_attribute('id');
        }
        if (!key.empty()) {
          const meiKey = this.ConvertKey(key);
          staffDef.AddChild(meiKey);
          if (staffDef.GetNotationtype() === NOTATIONTYPE_tab_guitar) meiKey.SetAttribute(true);
        }

        // staff details
        let staffDetails = this.childByNumber(child, 'staff-details', i + 1);
        if (staffDetails.empty()) staffDetails = this.childWithoutNumber(child, 'staff-details');
        const staffLines = staffDetails.child('staff-lines').text().as_int();
        if (staffLines) staffDef.SetLines(staffLines);
        else if (!staffDef.HasLines()) staffDef.SetLines(5);
        const scaleStr = staffDetails.child('staff-size').text().as_string();
        if (scaleStr !== '') {
          staffDef.SetScale(new AttBase().StrToPercent(`${scaleStr}%`) as unknown as number);
        }
        // Tablature?
        if (!staffDetails.child('staff-tuning').empty() || staffDef.GetNotationtype() === NOTATIONTYPE_tab_guitar) {
          if (this.HasAttributeWithValue(staffDetails, 'show-frets', 'letters')) {
            staffDef.SetNotationtype(NOTATIONTYPE_tab_lute_french);
          }
          else {
            const topLine = staffDetails.find_child_by_attribute('staff-tuning', 'line', String(staffLines));
            const botLine = staffDetails.find_child_by_attribute('staff-tuning', 'line', '1');
            if (!topLine.empty() && !botLine.empty()
              && PitchToMidi(topLine.child('tuning-step').text().as_string(),
                topLine.child('tuning-alter').text().as_int(),
                topLine.child('tuning-octave').text().as_int())
              < PitchToMidi(botLine.child('tuning-step').text().as_string(),
                botLine.child('tuning-alter').text().as_int(),
                botLine.child('tuning-octave').text().as_int())) {
              staffDef.SetNotationtype(NOTATIONTYPE_tab_lute_italian);
            }
            else {
              staffDef.SetNotationtype(NOTATIONTYPE_tab_guitar);
            }
          }

          const tuning = new Tuning();
          staffDef.AddChild(tuning);
          for (let staffTuning = staffDetails.child('staff-tuning'); !staffTuning.empty();
            staffTuning = staffTuning.next_sibling('staff-tuning')) {
            const courseTuning = new Course();
            tuning.AddChild(courseTuning);
            const line = staffTuning.attribute('line').as_int();
            const stepStr = staffTuning.child('tuning-step').text().as_string();
            const alterNum = staffTuning.child('tuning-alter').text().as_int();
            const octaveNum = staffTuning.child('tuning-octave').text().as_int();
            if (staffDef.GetNotationtype() === NOTATIONTYPE_tab_lute_italian) {
              courseTuning.SetN(String(line));
            }
            else {
              courseTuning.SetN(String(staffLines - line + 1));
            }
            courseTuning.SetPname(ConvertStepToPitchName(stepStr));
            courseTuning.SetOct(octaveNum);
            if (alterNum !== 0) {
              courseTuning.SetAccid(ConvertAlterToAccid(alterNum) as unknown as number);
            }
          }
        }

        // time
        let time = this.childByNumber(child, 'time', i + 1);
        if (time.empty()) {
          time = this.childWithoutNumber(child, 'time');
          if (nbStaves > 1 && !time.empty()) time.remove_attribute('id');
        }
        if (!time.empty()) {
          this.ReadMusicXMLMeterSig(time, staffDef);
        }

        // transpose
        let transpose = this.childByNumber(child, 'transpose', i + 1);
        if (transpose.empty()) transpose = child.child('transpose');
        if (!transpose.empty()) {
          staffDef.SetTransDiat(transpose.child('diatonic').text().as_int());
          staffDef.SetTransSemi(transpose.child('chromatic').text().as_int());
          if (!transpose.child('octave-change').empty()) {
            staffDef.SetTransDiat(transpose.child('chromatic').text().as_int()
              + 7 * transpose.child('octave-change').text().as_int());
            staffDef.SetTransSemi(transpose.child('chromatic').text().as_int()
              + 12 * transpose.child('octave-change').text().as_int());
          }
        }
        // ppq
        const divisions = child.child('divisions');
        if (!divisions.empty()) {
          this.m_ppq = divisions.text().as_int();
          staffDef.SetPpq(this.m_ppq);
        }
        // measure style
        const measureSlash = child.child('measure-style').child('slash');
        if (!measureSlash.empty()) {
          this.m_slash = this.HasAttributeWithValue(measureSlash, 'type', 'start');
        }
      }
    }
    return nbStaves;
  }

  /** <name>[@number='n'] XPath fold. */
  protected childByNumber(node: xml_node, name: string, number: number): xml_node {
    for (let c = node.child(name); !c.empty(); c = c.next_sibling(name)) {
      if (c.attribute('number').value() === String(number)) return c;
    }
    return new xml_node();
  }

  protected childWithoutNumber(node: xml_node, name: string): xml_node {
    for (let c = node.child(name); !c.empty(); c = c.next_sibling(name)) {
      if (c.attribute('number').empty()) return c;
    }
    return new xml_node();
  }

  /** C++ iomusxml.cpp 1752-1810. */
  protected ReadMusicXMLMeterSig(time: xml_node, parent: VrvObject): void {
    const invisible = this.HasAttributeWithValue(time, 'print-object', 'no');
    const beatsList = this.allChildren(time, 'beats');
    const interchangeable = time.child('interchangeable');
    if (beatsList.length > 1 || !interchangeable.empty()) {
      const meterSigGrp = new MeterSigGrp();
      if (!time.attribute('id').empty()) meterSigGrp.SetID(time.attribute('id').as_string());
      meterSigGrp.SetFunc(!interchangeable.empty() ? meterSigGrpLog_FUNC_interchanging : meterSigGrpLog_FUNC_mixed);
      const [counts, unit] = this.GetMeterSigGrpValues(time, meterSigGrp);
      this.m_meterCount = counts;
      this.m_meterUnit = unit;
      if (!interchangeable.empty()) {
        this.GetMeterSigGrpValues(interchangeable, meterSigGrp);
      }
      if (invisible) meterSigGrp.SetVisible(BOOLEAN_false);
      parent.AddChild(meterSigGrp);
    }
    else {
      const meterSig = new MeterSig();
      if (!time.attribute('id').empty()) meterSig.SetID(time.attribute('id').as_string());
      const symbol = time.attribute('symbol').as_string();
      if (symbol !== '') {
        if (symbol === 'cut' || symbol === 'common') {
          meterSig.SetSym(new AttBase().StrToMetersign(symbol));
        }
        else if (symbol === 'single-number') {
          meterSig.SetForm(METERFORM_num);
        }
        else {
          meterSig.SetForm(METERFORM_norm);
        }
      }
      const beats = time.child('beats');
      const beatType = time.child('beat-type');
      if (!beats.empty()) {
        const pair = new AttBase().StrToMetercountPair(beats.text().as_string());
        this.m_meterCount = pair[0];
        this.m_meterSign = pair[1];
        meterSig.SetCount(pair);
        this.m_meterUnit = beatType.text().as_int();
        meterSig.SetUnit(this.m_meterUnit);
      }
      else if (!time.child('senza-misura').empty()) {
        if (!time.child('senza-misura').text().empty()) meterSig.SetSym(METERSIGN_open);
        else meterSig.SetVisible(BOOLEAN_false);
      }
      if (invisible) meterSig.SetVisible(BOOLEAN_false);
      parent.AddChild(meterSig);
    }
  }

  /** C++ iomusxml.cpp 5194-5243. */
  protected GetMeterSigGrpValues(node: xml_node, parent: MeterSigGrp): [number[], number] {
    const beats = this.allChildren(node, 'beats');
    const beatType = this.allChildren(node, 'beat-type');
    let maxUnit = 0;
    const meterCounts: number[] = [];
    for (let i = 0; i < beats.length && i < beatType.length; i++) {
      const meterSig = new MeterSig();
      const count = new AttBase().StrToMetercountPair(beats[i].text().as_string());
      meterSig.SetCount(count);
      const currentUnit = beatType[i].text().as_int();
      meterSig.SetUnit(currentUnit);
      parent.AddChild(meterSig);
      const currentCount = meterSig.GetCount()[0];
      if (maxUnit === 0) maxUnit = currentUnit;
      if (maxUnit === currentUnit) {
        meterCounts.push(...currentCount);
      }
      else if (maxUnit > currentUnit) {
        const ratio = Math.trunc(maxUnit / currentUnit);
        meterCounts.push(...currentCount.map((elem) => elem * ratio));
      }
      else {
        const ratio = Math.trunc(currentUnit / maxUnit);
        for (let j = 0; j < meterCounts.length; j++) meterCounts[j] *= ratio;
        meterCounts.push(...currentCount);
        maxUnit = currentUnit;
      }
    }
    return [meterCounts, maxUnit];
  }

  protected allChildren(node: xml_node, name: string): xml_node[] {
    const out: xml_node[] = [];
    if (node.empty()) return out;
    for (const child of node.children()) {
      if ((child as xml_node).name() === name) out.push(child as xml_node);
    }
    return out;
  }
}
