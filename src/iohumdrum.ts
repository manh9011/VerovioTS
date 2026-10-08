/**
 * iohumdrum.ts — Humdrum input (part 1: contract + humaux structs + pure helpers).
 *
 * Translated from src-cpp/src/iohumdrum.cpp + include/vrv/iohumdrum.h.
 * The file is 33k lines and every conversion method depends on the external
 * humlib parser (`hum::HumdrumFile`, `hum::HTp`, `hum::HumNum`, ... from
 * `src-cpp/src/hum/humlib.cpp`, ~148k lines). The parser core lives in
 * `src/humlib-core.ts`, external CLI filter tools in `src/hum-tools.ts`.
 *
 * Part 1 covers what is portable without the parser core:
 * - `HumdrumTie` value struct (ctor/copy/clear/getters/setters/direction
 *   flags) + `insertTieIntoDom` (same-measure and cross-measure branches
 *   both AddChild to the start measure, preserved verbatim).
 * - `HumdrumBeamAndTuplet` POD with `clear()` defaults.
 * - `StaffStateVariables` state struct with `clear()` (acclev=1,
 *   meter 4/4, null ottava pointers, emptied tie lists).
 * - `HumdrumSignifiers` string-bag struct (all fields default empty).
 * - `HumdrumReferenceItem` / `DateWithErrors` / `DateConstruct` structs.
 * - Pure/static helpers with zero humlib-parser dependency:
 *   `characterCount` (string), `characterCountInSubtoken` (string),
 *   `removeCommas`, `escapeFreeAmpersand`, `replace` (string + u32string
 *   forms), `nextLowerPowerOfTwo` (unsigned bit-trick preserved with
 *   `>>> 0`), `getDotPowerOfTwo`, `removeFactorsOfTwo`,
 *   `nextHigherPowerOfTwo`, `getDateString`, `getLocationId` (all four
 *   overloads collapsed by arity), `setLocationId(NSuffix)` id formats.
 * - `HumdrumInput` class skeleton with the exact C++ ctor state
 *   (1000-entry placement/reverse/absolute/slash vectors) and an explicit
 *   `Import` failure until the parser-backed `convertHumdrum` pass lands.
 *
 * C++ ownership: `hum::HTp` tokens and `Measure*`/`Note*` pointers held by
 * these structs are non-owning views; TS models them as `| null`
 * references (GC owns memory). `std::vector<bool/char>` become plain
 * arrays. `operator=`/copy-ctor become explicit `assignFrom` + `clone`.
 */

import { Input, type DocLike } from './iobase.js';
import { HumNum, HumRegex, HumPitch } from './humlib.js';
import { Convert } from './convert.js';
import { HumdrumFileSet, HumdrumFile, HumdrumLine, recipToDuration, recipToDurationNoDots, kernToBase40, base40ToDiatonic, base40ToAccidental, kernToStaffLocation, kernToMidiNoteNumber, transToBase40, base40IntervalToLineOfFifths, kernToBase7, tempoNameToMm, durationToRecip, kernToRecip, type HTp, type HLp } from './humlib-core.js';
import { Tool_filter, Tool_kernify, Tool_scordatura } from './hum-tools.js';
import { Tie } from './tie.js';
import { MEIInput, MEIOutput } from './iomei.js';
import { Choice } from './choice.js';
import { Orig } from './orig.js';
import { Reg } from './reg.js';
import { Expansion } from './expansion.js';
import { VrvObject } from './object.js';
import { LogError, LogWarning, StringFormat, UTF32to8, UTF8to32, GetVersion } from './vrv.js';
import { Mdiv } from './mdiv.js';
import { Page, PGFUNC_first, PGFUNC_all } from './page.js';
import { System } from './system.js';
import { Score } from './score.js';
import { Section } from './section.js';
import { Measure } from './measure.js';
import { Staff } from './staff.js';
import { Layer } from './layer.js';
import { Pb } from './pb.js';
import { Sb } from './sb.js';
import { Beam } from './beam.js';
import { Tuplet } from './tuplet.js';
import { BeamSpan } from './beamspan.js';
import { Ending } from './ending.js';
import { StaffDef } from './staffdef.js';
import { Label } from './label.js';
import { LabelAbbr } from './labelabbr.js';
import { Rend } from './rend.js';
import { Lb } from './lb.js';
import { InstrDef } from './instrdef.js';
import { STATIC_ENTITY_NAMES } from './humentities.js';
import { StaffGrp } from './staffgrp.js';
import { ScoreDef, MeasurementSigned } from './scoredef.js';
import { GrpSym } from './grpsym.js';
import { ClassIdLike } from './vrvdef.js';
import { humInstrumentGM } from './huminstrument.js';
import { CODE_TO_LABEL } from './huminstrumentlabel.js';
import { xml_document, xml_node, xml_node_type } from './pugixml.js';
import { DocType } from './doc.js';
import { Accid } from './accid.js';
import { Chord } from './chord.js';
import { Note } from './note.js';
import { Clef } from './clef.js';
import { Verse } from './verse.js';
import { Syl } from './syl.js';
import { Text } from './text.js';
const sylLog_CON_b = 8;
const sylLog_CON_d = 2;
import { Octave } from './octave.js';
import { KeySig } from './keysig.js';
import { KeyAccid } from './keyaccid.js';
import { MeterSig } from './metersig.js';
import { MeterCountSign } from './libmei-att.js';
const CANCELACCID_before = 2;
// MEI clef ordinals already canonical in clef.ts; local aliases avoid a new
// export surface for iohumdrum use.
const CLEFSHAPE_G = 1;
const CLEFSHAPE_GG = 2;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_C = 4;
const CLEFSHAPE_perc = 5;
const OCTAVE_DIS_8 = 8;
const OCTAVE_DIS_15 = 15;
const STAFFREL_basic_above = 1;
const STAFFREL_basic_below = 2;
const METERFORM_num = 1;
import { Ligature } from './ligature.js';
import { Plica } from './plica.js';
import { Dot } from './dot.js';
import { Rest } from './rest.js';
import { BarLine } from './barline.js';
import { MRpt } from './mrpt.js';
import { HalfmRpt } from './halfmrpt.js';
import { BeatRpt } from './beatrpt.js';
import { MRest } from './mrest.js';
import { MultiRest } from './multirest.js';
import { Space } from './space.js';
import { Artic, data_ARTICULATION } from './artic.js';
import { Breath } from './breath.js';
import { Fermata } from './fermata.js';
import { Arpeg } from './arpeg.js';
import { Dir } from './dir.js';
import { Fing } from './fing.js';
import { Harm } from './harm.js';
import { Fb } from './fb.js';
import { F } from './f.js';
import { Reh } from './reh.js';
import { Tempo } from './tempo.js';
import { Symbol } from './symbol.js';
import { FTrem } from './ftrem.js';
import { Slur } from './slur.js';
import { Phrase } from './phrase.js';
import { BracketSpan } from './bracketspan.js';
import { Dynam } from './dynam.js';
import { Hairpin } from './hairpin.js';
import { Gliss } from './gliss.js';
import { Pedal } from './pedal.js';
import { Custos } from './custos.js';
import { Mensur } from './mensur.js';
import { Supplied } from './supplied.js';
import { Trill } from './trill.js';
import { Mordent } from './mordent.js';
import { Turn } from './turn.js';
import {
  ACCIDENTAL_WRITTEN_s, ACCIDENTAL_WRITTEN_f, ACCIDENTAL_WRITTEN_x,
  ACCIDENTAL_WRITTEN_ff, ACCIDENTAL_WRITTEN_xs, ACCIDENTAL_WRITTEN_tf,
  ACCIDENTAL_WRITTEN_n, ACCIDENTAL_WRITTEN_NONE, ACCIDENTAL_WRITTEN_ss,
  ACCIDENTAL_WRITTEN_ts, ACCIDENTAL_WRITTEN_sx, ACCIDENTAL_WRITTEN_nf,
  ACCIDENTAL_WRITTEN_ns, ACCIDENTAL_WRITTEN_su, ACCIDENTAL_WRITTEN_sd,
  ACCIDENTAL_WRITTEN_fu, ACCIDENTAL_WRITTEN_fd, ACCIDENTAL_WRITTEN_nu,
  ACCIDENTAL_WRITTEN_nd, ACCIDENTAL_WRITTEN_xu, ACCIDENTAL_WRITTEN_xd,
  ACCIDENTAL_WRITTEN_ffu, ACCIDENTAL_WRITTEN_ffd, ACCIDENTAL_WRITTEN_1qf,
  ACCIDENTAL_WRITTEN_3qf, ACCIDENTAL_WRITTEN_1qs, ACCIDENTAL_WRITTEN_3qs,
  ENCLOSURE_brack, ENCLOSURE_paren,
} from './accid.js';
import {
  ACCIDENTAL_GESTURAL_s, ACCIDENTAL_GESTURAL_f, ACCIDENTAL_GESTURAL_ss,
  ACCIDENTAL_GESTURAL_ff, ACCIDENTAL_GESTURAL_n, data_HEADSHAPE, data_FONTSIZE,
} from './libmei-att.js';
import { accidLog_FUNC_edit } from './cursor.js';
import { accidLog_FUNC_caution } from './cursor.js';
import { AttConverterBase } from './attconverter.js';
import { Att } from './att.js';
import { DURQUALITY_mensural_altera, DURQUALITY_mensural_imperfecta, DURQUALITY_mensural_perfecta } from './atts_mensural.js';

// MEI ordinals already canonical in vrvdef/attconverter/iomusxml; local
// aliases avoid inventing a new export surface for iohumdrum use.
const STEMDIRECTION_up = 1;
const STEMDIRECTION_down = 2;
const GRACE_acc = 1;
// C++ data_STEMPOSITION ordinal (libmei atttypes.h).
const STEMPOSITION_RIGHT_LOCAL = 2;
const GRACE_unacc = 2;
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;
// C++ data_NEIGHBORINGLAYER / data_tupletVis ordinals (libmei atttypes.h).
const NEIGHBORINGLAYER_above = 1;
const NEIGHBORINGLAYER_below = 2;
const tupletVis_NUMFORMAT_count = 1;

// ponytail: hoisted loaccid table (Q14). Was a 25-entry object literal
// allocated per note carrying an LO accid (C++ iohumdrum.cpp:26760ff).
const LOACCID_MAP = new Map<string, number>([
  ['n#', ACCIDENTAL_WRITTEN_ns], ['#', ACCIDENTAL_WRITTEN_s],
  ['n', ACCIDENTAL_WRITTEN_n], ['##', ACCIDENTAL_WRITTEN_ss],
  ['x', ACCIDENTAL_WRITTEN_x], ['-', ACCIDENTAL_WRITTEN_f],
  ['--', ACCIDENTAL_WRITTEN_ff], ['#x', ACCIDENTAL_WRITTEN_sx],
  ['###', ACCIDENTAL_WRITTEN_ts], ['n-', ACCIDENTAL_WRITTEN_nf],
  ['---', ACCIDENTAL_WRITTEN_tf], ['su', ACCIDENTAL_WRITTEN_su],
  ['sd', ACCIDENTAL_WRITTEN_sd], ['fu', ACCIDENTAL_WRITTEN_fu],
  ['fd', ACCIDENTAL_WRITTEN_fd], ['nu', ACCIDENTAL_WRITTEN_nu],
  ['nd', ACCIDENTAL_WRITTEN_nd], ['xu', ACCIDENTAL_WRITTEN_xu],
  ['xd', ACCIDENTAL_WRITTEN_xd], ['ffu', ACCIDENTAL_WRITTEN_ffu],
  ['ffd', ACCIDENTAL_WRITTEN_ffd], ['1qf', ACCIDENTAL_WRITTEN_1qf],
  ['3qf', ACCIDENTAL_WRITTEN_3qf], ['1qs', ACCIDENTAL_WRITTEN_1qs],
  ['3qs', ACCIDENTAL_WRITTEN_3qs],
]);
// C++ mensural/ligature/plica/dot/bracket ordinals (libmei atttypes.h).
const LIGATUREFORM_recta = 1;
const LIGATUREFORM_obliqua = 2;
const STEMDIRECTION_basic_up = 1;
const STEMDIRECTION_basic_down = 2;
const dotLog_FORM_aug = 1;
const bracketSpanLog_FUNC_coloration = 1;
const bracketSpanLog_FUNC_ligature = 3;
import { PITCHNAME_c, PITCHNAME_d, PITCHNAME_e, PITCHNAME_f, PITCHNAME_g, PITCHNAME_a, PITCHNAME_b } from './pitchinterface.js';
import {
  LayoutInformation, MeasureType, VisibilityType, ClassId,
  DURATION_1, DURATION_2, DURATION_4, DURATION_8, DURATION_16, DURATION_32,
  DURATION_64, DURATION_128, DURATION_256, DURATION_512, DURATION_1024,
  DURATION_2048, DURATION_breve, DURATION_long, DURATION_maxima, DURATION_NONE,
  DURATION_semibrevis, DURATION_brevis, DURATION_longa,
  DURATION_minima, DURATION_semiminima, DURATION_fusa, DURATION_semifusa,
  MARKUP_ANALYTICAL_FERMATA, STAFFREL_above, STAFFREL_below, STAFFREL_between,
} from './vrvdef.js';
import { Doc } from './doc.js';

export type { HTp };
/** Non-null humlib token; C++ `hum::HTp` is never null on the ported paths. */
export type HTok = NonNullable<HTp>;
// Re-exported for structural dependents (humaux structs hold HTp views).

export const curvature_CURVEDIR_above = 1;
export const curvature_CURVEDIR_below = 2;

const ARTICULATION_acc = data_ARTICULATION.acc;
const ARTICULATION_stacc = data_ARTICULATION.stacc;
const ARTICULATION_ten = data_ARTICULATION.ten;
const ARTICULATION_stacciss = data_ARTICULATION.stacciss;
const ARTICULATION_marc = data_ARTICULATION.marc;
const ARTICULATION_dnbow = data_ARTICULATION.dnbow;
const ARTICULATION_upbow = data_ARTICULATION.upbow;
const ARTICULATION_harm = data_ARTICULATION.harm;
const ARTICULATION_snap = data_ARTICULATION.snap;
const ARTICULATION_lhpizz = data_ARTICULATION.lhpizz;
const ARTICULATION_stroke = data_ARTICULATION.stroke;

const FONTSTYLE_italic = 1;
const FONTSTYLE_normal = 2;
const FONTWEIGHT_bold = 1;
const FONTWEIGHT_normal = 2;
// C++ data_TEXTRENDITION ordinals (libmei atttypes.h).
const TEXTRENDITION_box = 9;
const TEXTRENDITION_circle = 10;
const TEXTRENDITION_dbox = 11;
const TEXTRENDITION_tbox = 12;
const TEXTRENDITION_none = 16;
const TEXTRENDITION_sub = 20;
const TEXTRENDITION_sup = 21;

// C++ data.BARRENDITION ordinals (libmei atttypes.h).
const BARRENDITION_NONE = 0;
const BARRENDITION_dashed = 1;
const BARRENDITION_dotted = 2;
const BARRENDITION_dbl = 3;
const BARRENDITION_dbldashed = 4;
const BARRENDITION_dbldotted = 5;
const BARRENDITION_end = 8;
const BARRENDITION_invis = 10;
const BARRENDITION_rptstart = 11;
const BARRENDITION_rptboth = 12;
const BARRENDITION_rptend = 13;
const BARRENDITION_single = 15;

// C++ data.BEATRPT_REND ordinals (libmei atttypes.h).
const BEATRPT_REND_2 = 2;
const BEATRPT_REND_3 = 3;
const BEATRPT_REND_4 = 4;
const BEATRPT_REND_5 = 5;
const BEATRPT_REND_mixed = 6;

// C++ data.PEDALSTYLE / pedalLog.DIR ordinals (libmei atttypes.h).
const PEDALSTYLE_altpedstar = 4;
const pedalLog_DIR_bounce = 4;
const pedalLog_DIR_down = 1;
const pedalLog_DIR_up = 2;
const HORIZONTALALIGNMENT_right = 2;
const HORIZONTALALIGNMENT_center = 3;

const FONTSIZETERM_xx_small = 1;
const FONTSIZETERM_x_small = 2;
const FONTSIZETERM_small = 3;
const FONTSIZETERM_large = 5;
const FONTSIZETERM_x_large = 6;
const FONTSIZETERM_xx_large = 7;

// MEI head-shape ordinal for <head shape="diamond"> (libmei HEADSHAPE_list_diamond).
const HEADSHAPE_list_diamond = 7;
const LINEFORM_dashed = 1;
const LINEFORM_dotted = 2;
const LINEFORM_solid = 3;
const LINEFORM_wavy = 4;
const bracketSpanLog_FUNC_phrase = 5;

const VGRP_DYNAM_DEFAULT = 100;
const VGRP_PEDAL_DEFAULT = 200;
const hairpinLog_FORM_cres = 1;
const hairpinLog_FORM_dim = 2;

const mordentLog_FORM_lower = 1;
const mordentLog_FORM_upper = 2;
const turnLog_FORM_lower = 1;
const turnLog_FORM_upper = 2;

/** Structural boundary for objects that accept location-ID assignment. */
export interface LocationIdObject {
  SetID(id: string): void;
  GetID(): string;
  GetClassName(): string;
}

/** Structural boundary for measures that accept inserted ties. */
export interface TieMeasureLike {
  AddChild(child: VrvObject): void;
}

//----------------------------------------------------------------------------
// humaux::HumdrumTie
//----------------------------------------------------------------------------

export class HumdrumTie {
  private m_starttoken = '';
  private m_endtoken = '';
  private m_starttime = new HumNum(0);
  private m_endtime = new HumNum(0);
  private m_pitch = 0;
  private m_layer = -1;
  private m_inserted = false;
  private m_above = false;
  private m_below = false;
  private m_startid = '';
  private m_endid = '';
  private m_startmeasure: TieMeasureLike | null = null;
  private m_endmeasure: TieMeasureLike | null = null;
  private m_starttokenpointer: HTp = null;
  private m_subindex = -1;
  private m_meter_top = 4;
  private m_meter_bottom = new HumNum(4);

  constructor(other?: HumdrumTie) {
    if (other) this.assignFrom(other);
    else this.clear();
  }

  public assignFrom(other: HumdrumTie): this {
    this.m_starttoken = other.m_starttoken;
    this.m_endtoken = other.m_endtoken;
    this.m_starttime = new HumNum(other.m_starttime);
    this.m_endtime = new HumNum(other.m_endtime);
    this.m_inserted = other.m_inserted;
    this.m_above = other.m_above;
    this.m_below = other.m_below;
    this.m_startid = other.m_startid;
    this.m_endid = other.m_endid;
    this.m_startmeasure = other.m_startmeasure;
    this.m_endmeasure = other.m_endmeasure;
    this.m_pitch = other.m_pitch;
    this.m_layer = other.m_layer;
    this.m_starttokenpointer = other.m_starttokenpointer;
    this.m_subindex = other.m_subindex;
    this.m_meter_top = other.m_meter_top;
    this.m_meter_bottom = new HumNum(other.m_meter_bottom);
    return this;
  }

  public clone(): HumdrumTie { return new HumdrumTie(this); }

  public clear(): void {
    this.m_endmeasure = this.m_startmeasure = null;
    this.m_inserted = false;
    this.m_above = false;
    this.m_below = false;
    this.m_pitch = 0;
    this.m_layer = -1;
    this.m_startid = '';
    this.m_endid = '';
    this.m_starttokenpointer = null;
    this.m_starttoken = '';
    this.m_endtoken = '';
    this.m_starttime = new HumNum(0);
    this.m_endtime = new HumNum(0);
    this.m_subindex = -1;
    this.m_meter_top = 4;
    this.m_meter_bottom = new HumNum(4);
  }

  public setMeterTop(metertop: number): void { this.m_meter_top = metertop; }
  public setMeterBottom(meterbot: HumNum): void { this.m_meter_bottom = new HumNum(meterbot); }
  public getMeterTop(): number { return this.m_meter_top; }
  public getMeterBottom(): HumNum { return new HumNum(this.m_meter_bottom); }
  public setTieAbove(): void { this.m_above = true; }
  public setTieBelow(): void { this.m_below = true; }

  public setStart(
    id: string, starting: TieMeasureLike | null, layer: number, token: string,
    pitch: number, starttime: HumNum, endtime: HumNum, subindex: number,
    starttok: HTp, metertop: number, meterbot: HumNum,
  ): void {
    this.m_startid = id;
    this.m_startmeasure = starting;
    this.m_layer = layer;
    this.m_starttoken = token;
    this.m_pitch = pitch;
    this.m_starttime = new HumNum(starttime);
    this.m_endtime = new HumNum(endtime);
    this.m_subindex = subindex;
    this.m_starttokenpointer = starttok;
    this.m_meter_top = metertop;
    this.m_meter_bottom = new HumNum(meterbot);
  }

  public setEnd(
    id: string, ending: TieMeasureLike | null, layer: number, token: string,
    pitch: number, starttime: HumNum, endtime: HumNum, subindex: number,
    starttok: HTp, metertop: number, meterbot: HumNum,
  ): void {
    // C++ reuses the start-side fields for tie ends (see humdrum.cpp setEnd).
    this.m_endid = id;
    this.m_endmeasure = ending;
    this.m_layer = layer;
    this.m_endtoken = token;
    this.m_pitch = pitch;
    this.m_starttime = new HumNum(starttime);
    this.m_endtime = new HumNum(endtime);
    this.m_subindex = subindex;
    this.m_starttokenpointer = starttok;
    this.m_meter_top = metertop;
    this.m_meter_bottom = new HumNum(meterbot);
  }

  public insertTieIntoDom(): Tie | null {
    if (this.m_inserted) return null;
    if (this.m_startmeasure === null && this.m_endmeasure === null) return null;
    if (this.m_startmeasure === null) return null;
    if (this.m_endmeasure === null) return null;
    const tie = new Tie();
    tie.SetStartid('#' + this.m_startid);
    tie.SetEndid('#' + this.m_endid);
    if (this.m_above) tie.SetCurvedir(curvature_CURVEDIR_above);
    if (this.m_below) tie.SetCurvedir(curvature_CURVEDIR_below);
    // C++ keeps both branches (same vs cross measure) with identical
    // AddChild-to-start-measure behavior; preserved verbatim.
    this.m_startmeasure.AddChild(tie);
    this.m_inserted = true;
    return tie;
  }

  public setEndAndInsert(
    id: string, ending: TieMeasureLike | null, layer: number, token: string,
    pitch: number, starttime: HumNum, endtime: HumNum, subindex: number,
    starttok: HTp, metertop: number, meterbot: HumNum,
  ): Tie | null {
    this.setEnd(id, ending, layer, token, pitch, starttime, endtime, subindex, starttok, metertop, meterbot);
    return this.insertTieIntoDom();
  }

  public getEndToken(): HTp { return this.m_starttokenpointer; }
  public setEndId(id: string): void { this.m_endid = id; }
  public getEndId(): string { return this.m_endid; }
  public isInserted(): boolean { return this.m_inserted; }
  public getPitch(): number { return this.m_pitch; }
  public getLayer(): number { return this.m_layer; }
  public getStartTime(): HumNum { return new HumNum(this.m_starttime); }
  public getMeterUnit(): HumNum { return new HumNum(this.m_meter_bottom); }
  public getStartMeasure(): TieMeasureLike | null { return this.m_startmeasure; }
  public getEndMeasure(): TieMeasureLike | null { return this.m_endmeasure; }
  public setEndMeasure(measure: TieMeasureLike | null): void { this.m_endmeasure = measure; }
  public getEndTime(): HumNum { return new HumNum(this.m_endtime); }
  public getDuration(): HumNum { return this.m_endtime.sub(this.m_starttime); }
  public getStartToken(): string { return this.m_starttoken; }
  public getStartTokenPointer(): HTp { return this.m_starttokenpointer; }
  public getStartSubindex(): number { return this.m_subindex; }
  public getEndSubindex(): number { return this.m_subindex; }
}

//----------------------------------------------------------------------------
// humaux::HumdrumBeamAndTuplet
//----------------------------------------------------------------------------

export class HumdrumBeamAndTuplet {
  public group = 0;
  public bracket = 0;
  public num = 1;
  public numbase = 1;
  public numscale = 1;
  public tupletstart = 0;
  public tupletend = 0;
  public beamstart = 0;
  public beamend = 0;
  public gbeamstart = 0;
  public gbeamend = 0;
  public priority = ' ';
  public force = false;
  public token: HTp = null;
  public duration = new HumNum(0);
  public durationnodots = new HumNum(0);

  constructor() { this.clear(); }

  public clear(): void {
    this.group = 0; this.bracket = 0;
    this.numbase = 1; this.num = 1;
    this.numscale = 1;
    this.tupletstart = 0; this.tupletend = 0;
    this.beamstart = 0; this.beamend = 0;
    this.gbeamstart = 0; this.gbeamend = 0;
    this.force = false;
    this.priority = ' ';
    this.duration = new HumNum(0);
    this.durationnodots = new HumNum(0);
    this.token = null;
  }
}

//----------------------------------------------------------------------------
// humaux::StaffStateVariables
//----------------------------------------------------------------------------

export class StaffStateVariables {
  public verse = false;
  public verse_labels: HTp[] = [];
  public verse_abbr_labels: HTp[] = [];
  public suppress_tuplet_number = false;
  public suppress_tuplet_bracket = false;
  public tremolo = false;
  public suppress_articulations = false;
  public pedal = false;
  public cue_size: boolean[] = [];
  public stem_type: string[] = [];
  public stem_visible: boolean[] = [];
  public ligature_recta = false;
  public ligature_obliqua = false;
  public last_clef = '';
  public acclev = 1;
  public righthalfstem = false;
  public ottavanotestart: VrvObject | null = null;
  public ottavanotestartid = '';
  public ottavanoteend: VrvObject | null = null;
  public ottavaendtimestamp = new HumNum(0);
  public ottavameasure: VrvObject | null = null;
  public ottavadownnotestart: VrvObject | null = null;
  public ottavadownnotestartid = '';
  public ottavadownnoteend: VrvObject | null = null;
  public ottavadownendtimestamp = new HumNum(0);
  public ottavadownmeasure: VrvObject | null = null;
  public ottava2notestart: VrvObject | null = null;
  public ottava2notestartid = '';
  public ottava2noteend: VrvObject | null = null;
  public ottava2endtimestamp = new HumNum(0);
  public ottava2measure: VrvObject | null = null;
  public ottava2downnotestart: VrvObject | null = null;
  public ottava2downnotestartid = '';
  public ottava2downnoteend: VrvObject | null = null;
  public ottava2downendtimestamp = new HumNum(0);
  public ottava2downmeasure: VrvObject | null = null;
  public meter_bottom = new HumNum(4);
  public meter_top = 4;
  public maximodus = 0;
  public modus = 0;
  public tempus = 0;
  public prolatio = 0;
  public tiestarts: HumdrumTie[] = [];
  public tieends: HumdrumTie[] = [];
  public m_dynampos = 0;
  public m_dynamstaffadj = 0;
  public m_dynamposdefined = false;
  public m_notehead = '';
  public auto_custos = false;
  public suppress_manual_custos = false;
  public mensuration_type = 0;
  public join = false;
  public glissStarts: HTp[] = [];

  constructor() {
    this.cue_size = new Array(100).fill(false);
    // C++ defaults (StaffStateVariables::clear): stem_type 'X', stem_visible true.
    this.stem_type = new Array(100).fill('X');
    this.stem_visible = new Array(100).fill(true);
    this.clear();
  }

  public clear(): void {
    this.verse = false;
    this.suppress_tuplet_number = false;
    this.suppress_tuplet_bracket = false;
    this.suppress_articulations = false;
    this.tremolo = false;
    this.pedal = false;
    this.righthalfstem = false;
    this.ottavanotestart = this.ottavanoteend = null;
    this.ottavanotestartid = '';
    this.ottavaendtimestamp = new HumNum(0);
    this.ottavameasure = null;
    this.ottavadownnotestart = this.ottavadownnoteend = null;
    this.ottavadownnotestartid = '';
    this.ottavadownendtimestamp = new HumNum(0);
    this.ottavadownmeasure = null;
    this.ottava2notestart = this.ottava2noteend = null;
    this.ottava2notestartid = '';
    this.ottava2endtimestamp = new HumNum(0);
    this.ottava2measure = null;
    this.ottava2downnotestart = this.ottava2downnoteend = null;
    this.ottava2downnotestartid = '';
    this.ottava2downendtimestamp = new HumNum(0);
    this.ottava2downmeasure = null;
    this.acclev = 1;
    this.last_clef = '';
    this.tiestarts = [];
    this.tieends = [];
    this.meter_bottom = new HumNum(4);
    this.meter_top = 4;
    this.maximodus = 0; this.modus = 0; this.tempus = 0; this.prolatio = 0;
    this.verse_labels = [];
    this.verse_abbr_labels = [];
    this.m_dynampos = 0; this.m_dynamstaffadj = 0; this.m_dynamposdefined = false;
    this.m_notehead = '';
    this.auto_custos = false;
    this.suppress_manual_custos = false;
    this.mensuration_type = 0;
    this.join = false;
    this.glissStarts = [];
    this.ligature_recta = false;
    this.ligature_obliqua = false;
    // C++ clear() resets these three vectors, not just the scalars.
    for (let i = 0; i < this.cue_size.length; ++i) this.cue_size[i] = false;
    for (let i = 0; i < this.stem_type.length; ++i) this.stem_type[i] = 'X';
    for (let i = 0; i < this.stem_visible.length; ++i) this.stem_visible[i] = true;
  }
}

//----------------------------------------------------------------------------
// HumdrumSignifiers / HumdrumReferenceItem / Date structs
//----------------------------------------------------------------------------

export class HumdrumSignifiers {
  public empty = true;
  public nostem = '';
  public cuesize = '';
  public kernTerminalLong = '';
  public kernTerminalBreve = '';
  public mensTerminalLong = '';
  public mensTerminalBreve = '';
  public editaccKern: string[] = [];
  public editaccMens: string[] = [];
  public edittypeKern: string[] = [];
  public edittypeMens: string[] = [];
  public cresctext = '';
  public crescfontstyle = '';
  public decresctext = '';
  public decrescfontstyle = '';
  public below = '';
  public above = '';
  public phrase_color = '';
  public phrase_style = '';
  public phrase_slur = '';
  public space_color = '';
  public ispace_color = '';
  public irest_color = '';
  public rspace_color = '';
  public mark: string[] = [];
  public mcolor: string[] = [];
  public markdir: string[] = [];
  public mens_mark: string[] = [];
  public mens_mcolor: string[] = [];
  public mens_markdir: string[] = [];
  public textmark: string[] = [];
  public textcolor: string[] = [];
  public hairpinAccent = '';
  public verticalStroke = '';
  public lhpizz = '';
  public tremolo = '';
}

export interface HumdrumReferenceItem {
  lineText: string;
  key: string;
  value: string;
  isParseable: boolean;
  isHumdrumKey: boolean;
  isTranslated: boolean;
  language: string;
  index: number;
}

export function makeHumdrumReferenceItem(): HumdrumReferenceItem {
  return {
    lineText: '', key: '', value: '', isParseable: false,
    isHumdrumKey: false, isTranslated: false, language: '', index: -1,
  };
}

export interface DateWithErrors {
  valid: boolean;
  dateError: string;
  year: number; yearError: string;
  month: number; monthError: string;
  day: number; dayError: string;
  hour: number; hourError: string;
  minute: number; minuteError: string;
  second: number; secondError: string;
}

export function makeDateWithErrors(): DateWithErrors {
  return {
    valid: false, dateError: '',
    year: 0, yearError: '', month: 0, monthError: '', day: 0, dayError: '',
    hour: 0, hourError: '', minute: 0, minuteError: '', second: 0, secondError: '',
  };
}

export interface DateConstruct {
  constructType: string;
  dateConstructError: string;
  qualifier: string;
  dates: DateWithErrors[];
  dateConstructs: DateConstruct[];
}

export function makeDateConstruct(): DateConstruct {
  return { constructType: '', dateConstructError: '', qualifier: '', dates: [], dateConstructs: [] };
}

/** Shared dur→SetDur mapping used by convertRhythm (whole-note units). */
export function setDurFromWholeNote(
  element: { SetDur(v: number): void; SetDots?(v: number): void },
  dur: HumNum, staffstates: { righthalfstem: boolean }[], currentstaff: number,
): void {
  if (dur.isInteger()) {
    switch (dur.getNumerator()) {
      case 1: element.SetDur(DURATION_1); break;
      case 2: element.SetDur(DURATION_breve); break;
      case 4: element.SetDur(DURATION_long); break;
      case 8: element.SetDur(DURATION_maxima); break;
    }
  }
  else if (dur.getNumerator() === 1) {
    switch (dur.getDenominator()) {
      case 2:
        element.SetDur(DURATION_2);
        break;
      case 4: element.SetDur(DURATION_4); break;
      case 8: element.SetDur(DURATION_8); break;
      case 16: element.SetDur(DURATION_16); break;
      case 32: element.SetDur(DURATION_32); break;
      case 64: element.SetDur(DURATION_64); break;
      case 128: element.SetDur(DURATION_128); break;
      case 256: element.SetDur(DURATION_256); break;
      case 512: element.SetDur(DURATION_512); break;
      case 1024: element.SetDur(DURATION_1024); break;
      case 2048: element.SetDur(DURATION_2048); break;
    }
  }
  void staffstates; void currentstaff;
}

/** Shared durges→SetDurGes mapping used by convertRhythm. */
export function setDurGesFromWholeNote(
  element: { SetDurGes?(v: number): void },
  durges: HumNum,
): void {
  if (durges.isInteger()) {
    switch (durges.getNumerator()) {
      case 1: element.SetDurGes?.(DURATION_1); break;
      case 2: element.SetDurGes?.(DURATION_breve); break;
      case 4: element.SetDurGes?.(DURATION_long); break;
      case 8: element.SetDurGes?.(DURATION_maxima); break;
    }
  }
  else if (durges.getNumerator() === 1) {
    switch (durges.getDenominator()) {
      case 2: element.SetDurGes?.(DURATION_2); break;
      case 4: element.SetDurGes?.(DURATION_4); break;
      case 8: element.SetDurGes?.(DURATION_8); break;
      case 16: element.SetDurGes?.(DURATION_16); break;
      case 32: element.SetDurGes?.(DURATION_32); break;
      case 64: element.SetDurGes?.(DURATION_64); break;
      case 128: element.SetDurGes?.(DURATION_128); break;
      case 256: element.SetDurGes?.(DURATION_256); break;
      case 512: element.SetDurGes?.(DURATION_512); break;
      case 1024: element.SetDurGes?.(DURATION_1024); break;
      case 2048: element.SetDurGes?.(DURATION_2048); break;
    }
  }
}

/** MEI element prefix for ottava endpoint addressing (note/rest/chord/space). */
export function notePrefixForToken(target: HTp): string {
  if (target === null) return 'note';
  if (target.isRest()) return target.toString().indexOf('yy') !== -1 ? 'space' : 'rest';
  if (target.isChord()) return 'chord';
  return 'note';
}

//----------------------------------------------------------------------------
// HumdrumInput — part 1: ctor state + pure/static helpers.
// Conversion methods needing hum::HumdrumFile land in later passes and fail
// explicitly, mirroring the C++ NO_HUMDRUM_SUPPORT branches.
//----------------------------------------------------------------------------

export class HumdrumInput extends Input {
  protected m_filename = '';
  protected m_infiles = new HumdrumFileSet();
  // State mirrored from iohumdrum.h (only pre-analysis fields so far;
  // MEI-build fields land with the conversion clusters that need them).
  protected m_mens = false;
  protected m_harm = false;
  protected m_hasColorSpine = false;
  protected m_showCautionaryKeysig = false;
  protected m_layoutDefaultStyles: Map<string, Map<string, string>> = new Map();
  protected m_degree = false;
  protected m_fing = false;
  protected m_string = false;
  protected m_breaks = false;
  /** C++ m_clef_buffer: {bad, clef timestamp, Clef*} per staff-measure, used for
   *  sameas suppression (checkClefBufferForSameAs). */
  protected m_clef_buffer: Array<{ bad: boolean; pos: HumNum; clef: Clef }> = [];
  /** C++ m_leftbarstyle: bar style queued for the left side of the next measure
   *  (set by a repeat-end barline, consumed when the next measure is created). */
  protected m_leftbarstyle = BARRENDITION_NONE;
  protected m_multirest: number[] = [];
  protected m_staffstarts: HTp[] = [];
  protected m_score: Score | null = null;
  protected m_sections: Section[] = [];
  protected m_lastsection = '';
  protected m_measures: Measure[] = [];
  protected m_endingnum = 0;
  protected m_currentending: Ending | null = null;
  protected m_currentsection: Section | null = null;
  protected m_measure: Measure | null = null;
  protected m_layertokens: HTp[][][] = [];
  protected m_timesigdurs: HumNum[] = [];
  protected m_sectionlabels: HTp[] = [];
  protected m_numberlesslabels: HTp[] = [];
  protected m_nulls: boolean[] = [];
  protected m_ignore: boolean[] = [];
  protected m_spineColor: string[][] = [];
  protected m_currentstaff = -1;
  protected m_staff: Staff | null = null;
  protected m_currentlayer = 0;
  protected m_layer: Layer | null = null;
  protected m_rkern: number[] = [];
  protected m_join = false;
  protected m_comment = 0;
  protected m_debug = 0;
  protected m_fb = false;
  protected m_measureIndex = 0;
  protected m_scordaturaMarker: string[] = [];
  protected m_scordaturaTranspose: Array<{ diatonic: number; chromatic: number }> = [];
  protected m_globalTempoScaling = 1.0;
  protected m_midibpm = 120.0;
  /** C++ m_omd: time position of the last printed OMD tempo. */
  protected m_omd = new HumNum(-1);
  protected m_duradj: HumNum[] = [];
  protected m_localTempoScaling = new HumNum(1);
  protected m_tupletscaling = new HumNum(1);
  protected m_setrightstem = false;
  protected m_hasTremolo = false;
  protected m_transpose: number[] = [];
  protected m_placement: number[] = [];
  protected m_reverse: number[] = [];
  protected m_absolute: number[] = [];
  protected m_slash: number[] = [];
  protected m_signifiers = new HumdrumSignifiers();
  protected m_humtype = false;
  protected m_textNoteSize = '70%';
  protected m_textSmuflSpacer = '&#160;';
  protected m_textAugmentationDotSpacer = '&#x200A;';
  protected m_ftrem_slurs: Slur[] = [];
  /** Tokens flagged auto/beamSpanStart, converted after the measure (C++ m_beamSpanStartDatabase). */
  protected m_beamSpanStartDatabase: HTp[] = [];
  /** Figured-bass staff state/placement, indexed reversed (C++ m_fbstates/m_fbstaff). */
  protected m_fbstates: number[] = [];
  protected m_fbstaff: number[] = [];
  protected m_staffstates: StaffStateVariables[] = [];
  /** Reference records by key (C++ m_references). Values in source order. */
  protected m_references: Map<string, HumdrumReferenceItem[]> = new Map();
  /** Keyed reference lines (C++ m_humdrumLineReferences). */
  protected m_humdrumLineReferences: HLp[] = [];
  /** Literal <title> reused by fileDesc/workList/back sources. */
  private m_simpleTitleDoc = new xml_document();
  /** Literal <composer> list, reused by source descriptions. */
  private m_simpleComposersDoc = new xml_document();
  /** MADS <madsCollection> accumulator (C++ m_madsDoc/m_madsCollection). */
  private m_madsDoc = new xml_document();
  private m_madsCollection: xml_node = new xml_node();
  /** Staff group construction state (iohumdrum.h). */
  protected m_staffdef: StaffDef[] = [];
  protected m_group_name = new Map<number, string>();
  protected m_group_name_tok = new Map<number, HTp>();
  protected m_group_abbr = new Map<number, string>();
  protected m_group_abbr_tok = new Map<number, HTp>();
  protected m_oclef: [number, HTp][] = [];
  protected m_omet: [number, HTp][] = [];
  protected m_okey: [number, HTp][] = [];
  private static readonly METER_SIGN_COMMON = 1;
  private static readonly METER_SIGN_CUT = 2;
  private static readonly NOTATIONTYPE_MENSURAL_BLACK = 3;
  private static readonly NOTATIONTYPE_MENSURAL_WHITE = 4;

  constructor(doc: DocLike) {
    super(doc);
    this.m_placement = new Array(1000).fill(0);
    this.m_reverse = new Array(1000).fill(0);
    this.m_absolute = new Array(1000).fill(0);
    this.m_slash = new Array(1000).fill(1);
  }

  protected getDoc(): { Reset(): void } { return this.m_doc as unknown as { Reset(): void }; }
  protected getFullDoc(): Doc { return this.m_doc as unknown as Doc; }

  public override Import(content: string): boolean {
    try {
      this.getDoc().Reset();
      // Auto-detect CSV Humdrum file (iohumdrum.cpp Import).
      let exinterp = '';
      let found = false;
      let comma = 0;
      let tab = 0;
      for (let i = 0; i < content.length - 3; ++i) {
        if (((content[i] === '\n') || (content[i] === '\r')) && (content[i + 1] === '*') && (content[i + 2] === '*')) {
          found = true;
          i += 2;
          exinterp = '**';
          continue;
        }
        else if ((i === 0) && (content[i] === '*') && (content[i + 1] === '*')) {
          found = true;
          i += 2;
          exinterp = '**';
          continue;
        }
        if (!found) continue;
        if (content[i] === '\n') break;
        exinterp += content[i];
        if (content[i] === '\t') tab++;
        if (content[i] === ',') comma++;
      }
      void exinterp;
      if (content.length < 2000) {
        const hre = new HumRegex();
        if (!hre.search(content, '\\*\\*[A-Za-z0-9_-]')) {
          const dummy = '**kern\n*stria1\n*clefXyy\n1ryy\n*-\n';
          this.m_infiles.readString(dummy);
        }
        else this.m_infiles.readString(content);
      }
      else {
        let result: number;
        if (comma <= tab) result = this.m_infiles.readString(content);
        else result = this.m_infiles.readStringCsv(content);
        if (!result) return false;
      }
      return this.convertHumdrum();
    }
    catch {
      LogError('Humdrum import failed.');
      return false;
    }
  }

  public convertHumdrum(): boolean {
    this.importVerovioOptions(this.m_doc);

    if (this.GetOutputFormat() === 'humdrum') {
      // Allow for filtering within toolkit.
      return true;
    }
    if (this.m_infiles.getCount() === 0) return false;

    // Apply Humdrum tools if there are any filters in the file.
    // In pure TypeScript (no WASM / no native process runner), the external tool
    // pipelines (filter, kernify, scordatura) are mocked under rule 13.
    const filter = new Tool_filter();
    for (let i = 0; i < this.m_infiles.getCount(); ++i) {
      const file = this.m_infiles.at(i);
      if (file.hasGlobalFilters()) {
        filter.run(file);
        if (filter.hasHumdrumText()) {
          file.readString(filter.getHumdrumText());
        }
      }
    }

    // Apply Humdrum tools to the entire set if they are at the universal level.
    if (this.m_infiles.hasUniversalFilters()) {
      filter.runUniversal(this.m_infiles);
      if (filter.hasHumdrumText()) {
        this.m_infiles.readString(filter.getHumdrumText());
      }
    }

    // Kernify files if they have no stafflike spine.
    const kernify = new Tool_kernify();
    for (let i = 0; i < this.m_infiles.getCount(); ++i) {
      const file = this.m_infiles.at(i);
      if (this.hasNoStaves(file)) {
        kernify.run(file);
        if (kernify.hasHumdrumText()) {
          file.readString(kernify.getHumdrumText());
        }
      }
    }

    const infile = this.m_infiles.at(0);
    this.m_mens = this.checkForMens(infile);
    this.m_globalTempoScaling = this.getGlobalTempoScaling(infile);

    const hasScordatura = this.checkForScordatura(infile);
    if (hasScordatura) {
      const scordatura = new Tool_scordatura();
      const argv = ['scordatura', '-w']; // transpose to written pitch
      scordatura.process(argv);
      scordatura.run(infile);
    }

    // C++ humlib analyzes global and local layout parameters while reading the file
    // (HumdrumFileStructure::analyzeStructure); the TS reader is a base parse only, so
    // run both passes here, before the analyses that consume LO: parameters.
    infile.analyzeGlobalParameters();
    infile.analyzeLocalParameters();
    this.m_multirest = this.analyzeMultiRest(infile);
    this.m_breaks = this.analyzeBreaks(infile);
    this.analyzeVerseColor(infile);
    this.analyzeDefaultLayoutStyles(infile);
    infile.analyzeSlurs();
    infile.analyzeBeams();
    infile.analyzePhrasings();
    infile.analyzeKernTies();
    infile.analyzeRestPositions();
    infile.analyzeAccidentals();
    infile.analyzeTextRepetition();
    this.parseSignifiers(infile);
    if (this.m_signifiers.kernTerminalLong !== '') this.hideTerminalBarlines(infile);
    else if (this.m_signifiers.kernTerminalBreve !== '') this.hideTerminalBarlines(infile);
    else if (this.m_signifiers.mensTerminalLong !== '') this.hideTerminalBarlines(infile);
    else if (this.m_signifiers.mensTerminalBreve !== '') this.hideTerminalBarlines(infile);
    this.checkForColorSpine(infile);
    // C++ HumdrumFileStructure::read runs analyzeStructure (incl.
    // analyzeSignifiers); the TS reader is a base parse only, and no other
    // pass populates humlib signifiers, so run it before the consumer.
    infile.analyzeSignifiers();
    infile.analyzeCrossStaffStemDirections();
    infile.analyzeRScale();
    infile.analyzeBarlines();
    this.analyzeClefNulls(infile);
    if (infile.hasDifferentBarlines()) this.adjustMeasureTimings(infile);
    this.initializeSpineColor(infile);
    this.initializeIgnoreVector(infile);
    this.extractNullInformation(infile);
    const sigtop = { value: -1 };
    const sigbot = { value: -1 };
    this.prepareTimeSigDur(sigtop, sigbot);
    this.setupMeiDocument();
    if (!this.buildStaffStarts()) return false;

    if (this.m_fing) {
      this.analyzeFingeringsFile(infile);
    }

    const needReverse = this.checkIfReversedSpineOrder(this.m_staffstarts);
    if (needReverse) this.m_staffstarts.reverse();
    this.calculateReverseKernIndex();
    this.m_staffstates = [];
    for (let i = 0; i < this.m_staffstarts.length; i++) {
      this.m_staffstates.push(new StaffStateVariables());
    }
    this.m_transpose = new Array(this.m_staffstarts.length).fill(0);
    this.prepareFingeringsFile(infile);
    this.prepareVerses();
    this.prepareSections();
    this.prepareHeaderFooter(infile);
    this.prepareStaffGroups(sigtop.value, sigbot.value);
    this.m_measureIndex = 0;
    let status = true;
    let line = this.m_staffstarts.length > 0 ? (this.m_staffstarts[0]?.getLineIndex() ?? -1) : -1;
    while (line < infile.getLineCount() - 1 && line >= 0) {
      this.m_measureIndex++;
      const lineRef = { value: line };
      status = this.convertSystemMeasure(lineRef) && status;
      line = lineRef.value;
      if (!this.m_mens) this.checkForBreak(infile, line);
    }
    if (!this.m_mens) this.processHangingTieStarts();
    this.createHeader();
    this.promoteInstrumentAbbreviationsToGroup();
    this.promoteInstrumentNamesToGroup();
    this.addDefaultTempoDist(3);
    this.processHangingTieEnds();
    this.finalizeDocument(this.getFullDoc());
    this.processMeiOptions(infile);
    if (this.m_debug) {
      console.log(this.GetMeiString());
    }
    return true;
  }

  // C++ HumdrumInput::GetMeiString: export the converted document as score-based MEI.
  public GetMeiString(): string {
    const meioutput = new MEIOutput(this.getFullDoc());
    meioutput.SetScoreBasedMEI(true);
    return meioutput.Export();
  }

  // C++ HumdrumInput::printMeasureTokens: debug dump of the staff/layer token table.
  public printMeasureTokens(): void {
    const lt = this.m_layertokens;
    console.error('');
    for (let i = 0; i < lt.length; ++i) {
      let staffline = 'STAFF ' + String(i + 1) + '\t';
      for (let j = 0; j < (lt[i]?.length ?? 0); ++j) {
        let layerline = 'LAYER ' + String(j + 1) + ':\t';
        const layer = lt[i][j] ?? [];
        for (let k = 0; k < layer.length; ++k) {
          layerline += ' ' + (layer[k]?.toString() ?? '');
        }
        staffline += layerline;
        console.error('');
      }
      console.error(staffline);
    }
  }

  // C++ HumdrumInput::calculateLayout: body is commented out in C++.
  public calculateLayout(): void {
    // m_doc->CastOff();
  }

  // C++ HumdrumInput::emptyMeasures: hardcoded false ("For initial development,
  // maybe convert to an option").
  public emptyMeasures(): boolean {
    return false;
  }

  // C++ HumdrumInput::addDurRecip: store the numeric **recip duration in @dur.recip.
  // Grace notes become "0"; symbolic breves ("0") become "1%<power of two>".
  public addDurRecip(element: { SetDurRecip(v: string): void }, ttoken: string): void {
    if (ttoken.indexOf('q') !== -1) {
      element.SetDurRecip('0');
      return;
    }
    const hre = new HumRegex();
    if (!hre.search(ttoken, '([0-9]+(?:%[0-9]+)?\\.*)')) {
      // This is possible in an alternate compressed chord representation where the
      // secondary notes in the chord do not have explicit durations. Currently
      // ignore such cases.
      return;
    }
    let recip = hre.getMatch(1);
    if (hre.search(recip, '^(0+)')) {
      // Convert symbolic rhythms to numeric equivalents
      const zeros = hre.getMatch(1);
      const zcount = zeros.length;
      const value = Math.trunc(Math.pow(2.0, zcount));
      const replacement = '1%' + String(value);
      recip = hre.replaceCopy(recip, replacement, '^0+');
    }
    element.SetDurRecip(recip);
  }

  public hasNoStaves(infile: HumdrumFile): boolean {
    for (let i = 0; i < infile.getLineCount(); i++) {
      if (!infile.at(i).isExclusiveInterpretation()) continue;
      for (let j = 0; j < infile.at(i).getFieldCount(); j++) {
        const token = infile.token(i, j);
        if (token !== null && token.isKernLike()) return false;
      }
    }
    return true;
  }

  public checkForMens(infile: HumdrumFile): boolean {
    for (const spine of infile.getSpineStartList()) {
      if (spine !== null && spine.isMensLike()) return true;
    }
    return false;
  }

  public checkForScordatura(infile: HumdrumFile): boolean {
    const hre = new HumRegex();
    let status = false;
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isReference()) continue;
      const reference = infile.at(i).token(0);
      if (reference === null) continue;
      if (hre.search(reference.toString(),
        '^!!!RDF\\*\\*kern\\s*:\\s*([^\\s]+)\\s*=.*scordatura\\s*=\\s*["\']?ITrd(-?\\d)c(-?\\d)')) {
        const marker = hre.getMatch(1);
        const diatonic = hre.getMatchInt(2);
        const chromatic = hre.getMatchInt(3);
        if (diatonic === 0 && chromatic === 0) continue;
        if (!this.m_scordaturaMarker.includes(marker)) {
          this.m_scordaturaMarker.push(marker);
          // C++ stores a HumTransposer(-diatonic, -chromatic) for written pitch.
          this.m_scordaturaTranspose.push({ diatonic: -diatonic, chromatic: -chromatic });
          status = true;
        }
      }
    }
    return status;
  }

  public getGlobalTempoScaling(infile: HumdrumFile): number {
    let output = 1.0;
    const hre = new HumRegex();
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isGlobalReference()) continue;
      const token = infile.token(i, 0);
      if (token === null || token.compare(0, 17, '!!!tempo-scaling:') !== 0) continue;
      const value = infile.at(i).getReferenceValue();
      if (value.length === 0) continue;
      if (hre.search(value, '[+-]?(0?\\.?\\d+)')) {
        let number = hre.getMatchDouble(1);
        if (hre.search(value, '%')) number = number / 100.0;
        else if (number >= 10.0) number = number / 100.0;
        if (number > 0.0) output *= number;
      }
    }
    return output;
  }

  public analyzeClefNulls(infile: HumdrumFile): void {
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isInterpretation()) continue;
      for (let j = 0; j < infile.at(i).getFieldCount(); j++) {
        const token = infile.token(i, j);
        if (token === null || !token.isKernLike() || !token.isClef()) continue;
        this.markAdjacentNullsWithClef(token);
      }
    }
  }
  public markAdjacentNullsWithClef(clef: HTp): void {
    if (clef === null) return;
    const ctrack = clef.getTrack();
    let current = clef.getNextFieldToken();
    while (current !== null) {
      if (current.getTrack() !== ctrack) break;
      if (current.toString() === '*') current.setValue('auto', 'clef', clef.toString());
      current = current.getNextFieldToken();
    }
    current = clef.getPreviousFieldToken();
    while (current !== null) {
      if (current.getTrack() !== ctrack) break;
      if (current.toString() === '*') current.setValue('auto', 'clef', clef.toString());
      current = current.getPreviousFieldToken();
    }
  }
  public initializeIgnoreVector(infile: HumdrumFile): void {
    this.m_ignore = new Array(infile.getLineCount()).fill(false);
    let state = false;
    for (let i = 0; i < infile.getLineCount(); ++i) {
      this.m_ignore[i] = state;
      if (!infile.at(i).isGlobalComment()) continue;
      const s = infile.at(i).toString();
      if (s === '!!ignore') state = true;
      else if (s === '!!Xignore') state = false;
    }
  }
  public extractNullInformation(infile: HumdrumFile): void {
    const nulls = this.m_nulls;
    nulls.length = 0;
    for (let i = 0; i < infile.getLineCount(); i++) nulls.push(false);
    if (this.m_mens) return;
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isData()) { nulls[i] = false; continue; }
      nulls[i] = infile.at(i).isAllNull();
    }
    this.m_duradj = [];
    for (let i = 0; i < infile.getLineCount(); ++i) this.m_duradj.push(new HumNum(0));
    let sum = new HumNum(0);
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (infile.at(i).isBarline()) { sum = new HumNum(0); continue; }
      if (!infile.at(i).isData()) continue;
      if (infile.at(i).getDuration().isZero()) continue;
      if (this.m_nulls[i]) sum = sum.add(infile.at(i).getDuration());
      else if (sum.isNonZero()) { this.m_duradj[i] = sum; sum = new HumNum(0); }
    }
  }
  public initializeSpineColor(infile: HumdrumFile): void {
    const MAXCOLORSUBTRACK = 30;
    this.m_spineColor = [];
    for (let i = 0; i <= infile.getMaxTrack(); i++) {
      this.m_spineColor.push(new Array(MAXCOLORSUBTRACK).fill(''));
    }
    const hre = new HumRegex();
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (infile.at(i).isData()) break;
      if (!infile.at(i).isInterpretation()) continue;
      for (let j = 0; j < infile.at(i).getFieldCount(); j++) {
        const tok = infile.token(i, j);
        if (tok === null) continue;
        if (hre.search(tok.toString(), '^\\*color:(.*)')) {
          const ctrack = tok.getTrack();
          const strack = tok.getSubtrack();
          if (strack < MAXCOLORSUBTRACK && ctrack < this.m_spineColor.length) {
            this.m_spineColor[ctrack][strack] = hre.getMatch(1);
            if (strack === 1) this.m_spineColor[ctrack][0] = this.m_spineColor[ctrack][1];
            else if (strack === 0) {
              for (let z = 1; z < this.m_spineColor[ctrack].length; z++) {
                this.m_spineColor[ctrack][z] = this.m_spineColor[ctrack][0];
              }
            }
          }
        }
      }
    }
  }
  public adjustMeasureTimings(infile: HumdrumFile): void {
    let barstart = new HumNum(0);
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (infile.at(i).isBarline()) {
        if (infile.at(i).allSameBarlineStyle()) barstart = infile.at(i).getDurationFromStart();
        else if (!infile.at(i).hasDataStraddle()) barstart = infile.at(i).getDurationFromStart();
      }
      const duration = infile.at(i).getDurationFromStart();
      infile.at(i).setDurationFromBarline(duration.sub(barstart));
    }
  }
  public analyzeBreaks(infile: HumdrumFile): boolean {
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isGlobalComment()) continue;
      const token = infile.token(i, 0);
      if (token === null) continue;
      if (token.compare(0, 12, '!!pagebreak:') === 0) return true;
      if (token.compare(0, 12, '!!linebreak:') === 0) return true;
    }
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isComment()) continue;
      const token = infile.token(i, 0);
      if (token === null) continue;
      if (token.toString().indexOf('!LO:LB') !== -1) return true;
      if (token.toString().indexOf('!LO:PB') !== -1) return true;
    }
    return false;
  }

  public analyzeMultiRest(infile: HumdrumFile): number[] {
    if (this.m_mens) return new Array(infile.getLineCount()).fill(0);
    const barindex: number[] = [0];
    const datacount: number[] = [0];
    const dataline: number[] = [0];
    const bardur: HumNum[] = [new HumNum(0)];
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (infile.at(i).isData()) {
        if (!infile.at(i).isAllNull()) {
          datacount[datacount.length - 1]++;
          if (datacount[datacount.length - 1] === 1) dataline[dataline.length - 1] = i;
        }
      }
      if (!infile.at(i).isBarline()) continue;
      barindex.push(i);
      datacount.push(0);
      dataline.push(0);
      bardur.push(infile.at(i).getDurationToBarline());
    }
    const wholerest = new Array(barindex.length).fill(0);
    const textrest = new Array(barindex.length).fill(0);
    for (let i = 0; i < barindex.length; ++i) {
      if (datacount[i] !== 1) continue;
      let restQ = true;
      const line = dataline[i];
      for (let j = 0; j < infile.at(line).getFieldCount(); ++j) {
        const tok = infile.token(line, j);
        if (tok === null || !tok.isKernLike()) continue;
        if (!tok.isRest()) { restQ = false; break; }
      }
      if (restQ) wholerest[i] = 1;
    }
    for (let i = 0; i < wholerest.length; ++i) {
      if (wholerest[i] !== 1) continue;
      let hasitem = false;
      const line = dataline[i];
      for (let j = 0; j < infile.at(line).getFieldCount(); ++j) {
        const tok = infile.token(line, j);
        if (tok === null || tok.isNull()) continue;
        if (tok.isDataType('**mxhm') || tok.isDataType('**dynam') || tok.isDataTypeLike('**text')) { hasitem = true; break; }
      }
      if (hasitem) { wholerest[i] = 0; textrest[i] = 1; }
    }
    for (let i = 0; i < wholerest.length; ++i) {
      if (wholerest[i] !== 1) continue;
      let hastext = false;
      const line = dataline[i];
      for (let j = 0; j < infile.at(line).getFieldCount(); ++j) {
        const tok = infile.token(line, j);
        if (tok === null || tok.isNull() || !tok.isKernLike()) continue;
        if (tok.getLayoutParameter('TX', 't') !== '') { hastext = true; break; }
      }
      if (hastext) { wholerest[i] = 0; textrest[i] = 1; }
    }
    // Group consecutive whole-measure rests with equal bar durations and
    // plain numeric next barlines (C++ regex [^=0-9] on next barline token).
    const hre = new HumRegex();
    for (let i = wholerest.length - 2; i >= 0; i--) {
      if (!bardur[i].equals(bardur[i + 1])) continue;
      if (hre.search(infile.token(barindex[i + 1], 0)?.toString() ?? '', '[^=0-9]')) continue;
      if (wholerest[i] && wholerest[i + 1]) { wholerest[i] += wholerest[i + 1]; wholerest[i + 1] = -1; }
    }
    const output = new Array(infile.getLineCount()).fill(0);
    for (let i = 0; i < barindex.length; i++) {
      if (wholerest[i] > 1) output[barindex[i]] = wholerest[i];
      else if (wholerest[i] === -1) output[barindex[i]] = -1;
      else if (textrest[i] === 1) output[barindex[i]] = -2;
    }
    return output;
  }

  public GetHumdrumString(): string {
    let out = '';
    for (let i = 0; i < this.m_infiles.getCount(); ++i) out += this.m_infiles.at(i).toString();
    return out;
  }

  public clear(): void {
    this.m_infiles = new HumdrumFileSet();
    this.m_staffstates = [];
    this.m_signifiers = new HumdrumSignifiers();
    this.m_score = null;
    this.m_sections = [];
    this.m_measure = null;
    this.m_layertokens = [];
    this.m_timesigdurs = [];
    this.m_sectionlabels = [];
    this.m_numberlesslabels = [];
    this.m_nulls = [];
    this.m_ignore = [];
    this.m_multirest = [];
    this.m_staffstarts = [];
  }

  public getMeasureEndLine(startline: number): number {
    const infile = this.m_infiles.at(0);
    let endline = infile.getLineCount() - 1;
    let foundDataQ = false;
    let i = startline + 1;
    while (i < infile.getLineCount()) {
      if (infile.at(i).isData()) foundDataQ = true;
      else if (infile.at(i).isBarline()) {
        if (infile.at(i).allSameBarlineStyle()) { endline = i; break; }
        else if (!infile.at(i).getValueBool('auto', 'straddlingData')) { endline = i; break; }
      }
      endline = i;
      i++;
    }
    return foundDataQ ? endline : -endline;
  }

  public getMeasureNumber(startline: number, _endline: number): number {
    const infile = this.m_infiles.at(0);
    if (infile.at(startline).isBarline()) {
      const m = /^=(\d+)/.exec(infile.at(startline).getTokenString(0));
      return m !== null ? Number.parseInt(m[1], 10) : -1;
    }
    let found = false;
    let linenum = -1;
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (infile.at(i).isBarline()) { found = true; linenum = i; break; }
      else if (infile.at(i).isData()) { found = false; linenum = -1; break; }
    }
    if (found) {
      const m = /^=(\d+)/.exec(infile.at(linenum).getTokenString(0));
      return m !== null ? Number.parseInt(m[1], 10) : -1;
    }
    return -1;
  }

  public prepareTimeSigDur(top: { value: number }, bot: { value: number }): void {
    const sigdurs = this.m_timesigdurs;
    const infile = this.m_infiles.at(0);
    sigdurs.length = 0;
    for (let i = 0; i < infile.getLineCount(); i++) sigdurs.push(new HumNum(-1));
    let spinestarts = infile.getKernLikeSpineStartList();
    let kernspine: HTp;
    if (spinestarts.length === 0) {
      spinestarts = infile.getSpineStartListFiltered('**recip');
      if (spinestarts.length === 0) return;
      kernspine = spinestarts[0];
    }
    else kernspine = spinestarts[0];
    if (kernspine === null) return;
    let curdur = new HumNum(-1);
    kernspine = kernspine.getNextToken();
    while (kernspine !== null) {
      const line = kernspine.getLineIndex();
      if (!kernspine.isInterpretation()) { sigdurs[line] = new HumNum(curdur); kernspine = kernspine.getNextToken(); continue; }
      const s = kernspine.toString();
      let m = /^\*M(\d+)\/(\d+)%.\d+/.exec(s);
      if (m === null) m = /^\*M(\d+)\/(\d+)/.exec(s);
      if (m !== null) {
        top.value = Number.parseInt(m[1], 10); bot.value = Number.parseInt(m[2], 10);
        curdur = new HumNum(top.value);
        if (bot.value === 0) curdur = curdur.mul(2);
        else curdur = curdur.div(bot.value);
        curdur = curdur.mul(4);
      }
      sigdurs[line] = new HumNum(curdur);
      kernspine = kernspine.getNextToken();
    }
    sigdurs[sigdurs.length - 1] = new HumNum(curdur);
    for (let i = sigdurs.length - 2; i >= 0; i--) {
      if (infile.at(i).getDuration().isZero()) sigdurs[i] = sigdurs[i + 1];
    }
  }

  public getStaffLayerCounts(): number[] {
    return this.m_layertokens.map((staff) => staff.length);
  }

  public setupMeiDocument(): void {
    const infile = this.m_infiles.at(0);
    const doc = this.getFullDoc();
    doc.Reset();
    doc.SetType(DocType.Raw);
    const mdiv = new Mdiv();
    mdiv.SetVisibility(VisibilityType.Visible);
    doc.AddChild(mdiv);
    const score = new Score();
    mdiv.AddChild(score);
    this.m_score = score;
    const section = new Section();
    const starting = infile.getTrackStart(1);
    if (starting !== null) {
      section.SetID(HumdrumInput.getLocationIdForToken(section.GetClassName(), starting.getLineIndex(), starting.getFieldIndex(), -1));
      this.storeExpansionLists(section, starting);
    }
    this.m_sections.push(section);
    score.AddChild(this.m_sections[this.m_sections.length - 1]);
    this.m_leftbarstyle = BARRENDITION_NONE;
    if (this.m_breaks) {
      const pb = new Pb();
      this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
      section.AddChild(pb);
    }
  }

  public setupSystemMeasure(startline: number, endline: number): void {
    const infile = this.m_infiles.at(0);

    if (this.m_oclef.length || this.m_omet.length || this.m_okey.length) {
      this.storeOriginalClefMensurationKeyApp();
    }

    if (!this.m_mens && infile.at(startline).getDurationFromStart().isPositive()) {
      this.addSystemClefKeyTimeChange(startline, endline);
    }

    let currentsection = '';
    const label = this.m_sectionlabels[startline] ?? null;
    if (label !== null) {
      currentsection = label.toString();
      if (currentsection.substr(0, 2) === '*>') currentsection = currentsection.substr(2);
      currentsection = 'label-' + currentsection;
    }
    this.m_measure = this.hasMensuralStaff(infile.at(startline))
      ? new Measure(MeasureType.UNMEASURED)
      : new Measure();
    let endnum = 0;
    let ending = false;
    let fakenum = false;
    let newsection = false;
    const last = currentsection.slice(-1);
    if (currentsection.length > 0 && last >= '0' && last <= '9') {
      const withnum = this.m_sectionlabels[startline];
      const nonum = this.m_numberlesslabels[startline];
      const withnumstr = withnum === null ? '' : withnum.toString();
      const nonumstr = nonum === null ? '' : nonum.toString();
      if (nonumstr !== '' && withnumstr.substr(0, nonumstr.length) === nonumstr) {
        ending = true;
        const m = /(\d+)$/.exec(currentsection);
        endnum = m !== null ? Number.parseInt(m[1], 10) : 0;
      }
      else { fakenum = true; ending = false; endnum = 0; }
    }
    else if (currentsection !== this.m_lastsection) {
      newsection = true;
      if (this.m_sections.length > 1) this.m_sections.pop();
      this.m_lastsection = label !== null ? currentsection : '';
    }
    if (ending && this.m_endingnum !== endnum) {
      this.m_currentending = new Ending();
      let endingid = label !== null ? label.toString() : '';
      if (endingid.substr(0, 2) === '*>') endingid = endingid.substr(2);
      endingid = 'label-' + endingid;
      this.setN(this.m_currentending, endnum, label);
      this.m_currentending.SetID(endingid);
      if (this.m_sections.length > 1) this.m_sections.pop();
      this.m_sections[this.m_sections.length - 1].AddChild(this.m_currentending);
      this.m_currentending.AddChild(this.m_measure);
    }
    else if (!fakenum && currentsection.length > 0 && last >= '0' && last <= '9') {
      this.m_currentending?.AddChild(this.m_measure);
    }
    else if (newsection) {
      this.m_currentending = null;
      this.m_currentsection = new Section();
      this.m_currentsection.AddChild(this.m_measure);
      this.m_currentsection.SetID(this.m_lastsection);
      this.m_sections[this.m_sections.length - 1].AddChild(this.m_currentsection);
      this.m_sections.push(this.m_currentsection);
    }
    else {
      this.m_currentending = null;
      this.m_sections[this.m_sections.length - 1].AddChild(this.m_measure);
    }
    this.m_endingnum = endnum;
    this.m_measures.push(this.m_measure);

    if (this.m_leftbarstyle !== BARRENDITION_NONE) {
      if (this.m_measure !== null) this.m_measure.SetLeft(this.m_leftbarstyle);
      this.m_leftbarstyle = BARRENDITION_NONE;
    }

    this.setLocationIdByIndices(this.m_measure, startline, -1, -1);
    const measurenumber = this.getMeasureNumber(startline, endline);
    if (measurenumber >= 0) this.setN(this.m_measure, measurenumber);
    // ponytail: humType 'm-<n>' type tag still to port.
    if (this.m_measure !== null) this.setSystemMeasureStyle(startline, endline);
  }

  /** C++ HumdrumInput::setNextLeftBarStyle: queue a bar style for the next measure. */
  public setNextLeftBarStyle(style: number): void {
    this.m_leftbarstyle = style;
  }

  /** C++ HumdrumInput::setSystemMeasureStyle: set the right barline rendition of the
   *  current measure from the terminal barline token, and queue a repeat-start left
   *  barline when the same barline opens a repeat. */
  public setSystemMeasureStyle(startline: number, endline: number): void {
    if (this.m_measure === null) return;
    const infile = this.m_infiles.at(0);

    const token = infile.token(endline, 0);
    if (token === null || !token.isBarline()) {
      this.m_measure.SetRight(BARRENDITION_invis);
      return;
    }

    if (!infile.at(endline).allSameBarlineStyle()) {
      // non-invisible staff barlines will be added later.
      this.m_measure.SetRight(BARRENDITION_invis);
      return;
    }

    const endbar = infile.at(endline).getTokenString(0);
    const startbar = infile.at(startline).getTokenString(0);

    if (endbar.substring(0, 2) === '==') {
      this.m_measure.SetRight(BARRENDITION_end);
    }
    else if (endbar.indexOf(':|!|:') !== -1) {
      this.m_measure.SetRight(BARRENDITION_rptend);
      this.setNextLeftBarStyle(BARRENDITION_rptstart);
    }
    else if (endbar.indexOf(':!!:') !== -1) {
      this.m_measure.SetRight(BARRENDITION_rptend);
      this.setNextLeftBarStyle(BARRENDITION_rptstart);
    }
    else if (endbar.indexOf(':||:') !== -1) {
      this.m_measure.SetRight(BARRENDITION_rptend);
      this.setNextLeftBarStyle(BARRENDITION_rptstart);
    }
    else if (endbar.indexOf(':!:') !== -1) {
      this.m_measure.SetRight(BARRENDITION_rptend);
      this.setNextLeftBarStyle(BARRENDITION_rptstart);
    }
    else if (endbar.indexOf(':|:') !== -1) {
      this.m_measure.SetRight(BARRENDITION_rptend);
      this.setNextLeftBarStyle(BARRENDITION_rptstart);
    }
    else if (endbar.indexOf(':|') !== -1) {
      this.m_measure.SetRight(BARRENDITION_rptend);
    }
    else if (endbar.indexOf(':!') !== -1) {
      this.m_measure.SetRight(BARRENDITION_rptend);
    }
    else if (startbar.indexOf('!:') !== -1) {
      this.setNextLeftBarStyle(BARRENDITION_rptstart);
    }
    else if (endbar.indexOf('|:') !== -1) {
      this.setNextLeftBarStyle(BARRENDITION_rptstart);
    }
    else if (endbar.indexOf('||') !== -1) {
      this.m_measure.SetRight(BARRENDITION_dbl);
    }
    else if (endbar.indexOf('-') !== -1) {
      this.m_measure.SetRight(BARRENDITION_invis);
    }
    else if (endbar.indexOf('::') !== -1) {
      this.m_measure.SetRight(BARRENDITION_dbldashed);
    }
    else if (endbar.indexOf(':') !== -1) {
      this.m_measure.SetRight(BARRENDITION_dashed);
    }
    else if (endbar.indexOf('..') !== -1) {
      this.m_measure.SetRight(BARRENDITION_dbldotted);
    }
    else if (endbar.indexOf('.') !== -1) {
      this.m_measure.SetRight(BARRENDITION_dotted);
    }
  }
  public hasMensuralStaff(line: { getFieldCount(): number; token(i: number): HTp }): boolean {
    for (let i = 0; i < line.getFieldCount(); ++i) {
      if (line.token(i)?.isMensLike()) return true;
    }
    return false;
  }

  public getNextBarlineIndex(infile: HumdrumFile, startline: number): number {
    const token = infile.token(startline, 0);
    if (token === null) return startline;
    if (token.isBarline()) return startline;
    if (token.toString() === '*-') return startline;
    for (let i = 1; i < infile.getLineCount(); ++i) {
      const tok = infile.token(startline + i, 0);
      if (tok === null) return startline;
      if (tok.isBarline()) return startline + i;
      if (tok.isData()) return startline;
      if (tok.toString() === '*-') return startline + i;
    }
    return startline;
  }

  public setStaff(element: { SetStaff(v: number[]): void }, staffnum: number): void {
    element.SetStaff([staffnum]);
  }
  public setStaffBetween(element: { SetStaff(v: number[]): void }, staffnum: number): void {
    element.SetStaff([staffnum, staffnum + 1]);
  }
  public tieToPreviousItem(token: HTp, subindex: number, meterunit: HumNum, measure?: Measure | null): Tie | null {
    if (token === null) return null;
    const tie = new Tie();
    this.addTieLineStyle(tie, token, subindex);
    this.addChildMeasureOrSection(tie, measure ?? undefined);
    let starttoken = token.getOwner()?.getTrackStart(token.getTrack()) ?? null;
    let current = token.getPreviousToken();
    while (current !== null) {
      if (current.isBarline()) break;
      if (current.isInterpretation() && current.compare(0, 2, '**') === 0) break;
      if (current.isData() && !current.isNull()) break;
      current = current.getPreviousToken();
    }
    if (current !== null) starttoken = current;
    this.setTieLocationId(tie, starttoken, -1, token, subindex);
    let endid = HumdrumInput.getLocationIdForToken('note', token.getLineIndex(), token.getFieldIndex());
    if (token.isChord()) {
      const endnumber = subindex + 1;
      if (endnumber > 0) endid += 'S' + String(endnumber);
    }
    let tstamp = new HumNum(0);
    if (current !== null && (current.isBarline() || current.isInterpretation())) {
      // C++ shadows tstamp in this branch (inner HumNum discarded), so the
      // outer tstamp stays 0. Keep parity: do not assign here.
    }
    else if (current !== null && current.isData() && starttoken !== null) {
      tstamp = starttoken.getDurationFromBarline().mul(meterunit).div(4).add(1);
    }
    tie.SetTstamp(tstamp.getFloat());
    tie.SetEndid('#' + endid);
    return tie;
  }
  public atEndingBoundaryEnd(token: HTp): boolean {
    if (token === null) return false;
    let current = token.getNextToken();
    while (current !== null) {
      if (current.isData() && !current.isNull()) break;
      current = current.getNextToken();
    }
    if (current === null) return false;
    const label1 = this.m_sectionlabels[current.getLineIndex()] ?? null;
    const label2 = this.m_sectionlabels[token.getLineIndex()] ?? null;
    if (label1 === label2 || label1 === null || label2 === null) return false;
    const hre = new HumRegex();
    let number1 = 0;
    let number2 = 0;
    if (hre.search(label1.toString(), '(\\d+)$')) number1 = hre.getMatchInt(1);
    else return false;
    if (hre.search(label2.toString(), '(\\d+)$')) number2 = hre.getMatchInt(1);
    else return false;
    return number1 !== number2;
  }
  public getMeasureDifferenceTimed(token: HTp, meterunit: HumNum, tieduration: HumNum, tstamp: { value: HumNum }): number {
    if (token === null) return 0;
    const owner = token.getOwner()?.getOwner() ?? null;
    if (owner === null) return 0;
    const infile = owner as unknown as HumdrumFile;
    const endtime = token.getDurationFromStart().add(tieduration);
    const startline = token.getLineIndex();
    let counter = 0;
    let i = startline;
    let lastBarline = -1;
    while (i < infile.getLineCount() && infile.at(i).getDurationFromStart().less(endtime)) {
      if (infile.at(i).isBarline()) { counter++; lastBarline = i; }
      i++;
    }
    if (lastBarline === -1) {
      tstamp.value = token.getDurationFromBarline().add(tieduration).mul(meterunit).div(4).add(1);
      return 0;
    }
    const lastbartime = infile.at(lastBarline).getDurationFromStart();
    tstamp.value = endtime.sub(lastbartime).mul(meterunit).div(4).add(1);
    return counter;
  }

  public getMeasureDifference(starttok: HTp, endtok: HTp): number;
  public getMeasureDifference(token: HTp, meterunit: HumNum, tieduration: HumNum, tstamp: { value: HumNum }): number;
  public getMeasureDifference(a: HTp, b: HTp | HumNum, c?: HumNum, d?: { value: HumNum }): number {
    if (b instanceof HumNum) {
      return this.getMeasureDifferenceTimed(a, b, c!, d!);
    }
    const starttok = a;
    const endtok = b as HTp;
    if (starttok === null || endtok === null) return 0;
    const line = starttok.getOwner() as HumdrumLine | null;
    if (line === null) return 0;
    const file = line.getOwner() as HumdrumFile | null;
    if (file === null) return 0;
    const startline = starttok.getLineIndex();
    const endline = endtok.getLineIndex();
    let counter = 0;
    for (let i = startline; i <= endline; ++i) {
      if (file.at(i).isBarline()) {
        counter++;
      }
    }
    return counter;
  }
  public isTieAllowedToHang(token: HTp): boolean {
    if (token === null) return false;
    if (token.getLayoutParameter('T', 'lv') === 'true') return true;
    let current = token.getNextToken();
    while (current !== null) {
      if (current.isInterpretation()) {
        if (current.toString() === '*rep') return true;
        if (current.compare(0, 2, '*>') === 0) return true;
      }
      else if (current.isData() && !current.isNull()) return false;
      current = current.getNextToken();
    }
    return false;
  }
  public addDefaultTempoDist(distance: number): void {
    const scoreDef = this.m_score?.GetScoreDef() ?? null;
    if (scoreDef === null || scoreDef === undefined) return;
    const something = new MeasurementSigned();
    something.SetVu(distance);
    scoreDef.SetTempoDist(something);
  }
  // C++ HumdrumInput::importVerovioOptions: copy toolkit options into the input state.
  public importVerovioOptions(doc: DocLike): void {
    const opts = (doc as unknown as { GetOptions(): { m_humType: { GetValue(): boolean } } }).GetOptions();
    this.m_humtype = opts.m_humType.GetValue();
  }

  // C++ HumdrumInput::parseMultiVerovioOptions: split a `a=1 | b=2` verovio
  // reference value on unescaped `|` into parameter pairs.
  public parseMultiVerovioOptions(parameters: Map<string, string>, input: string): void {
    const pieces: string[] = [];
    let current = '';
    for (let i = 0; i < input.length; i++) {
      if (i < input.length - 1 && input[i] === '\\') {
        if (input[i + 1] === '|') {
          current += '|';
          i++;
        }
        else {
          current += '\\';
        }
        continue;
      }
      else if (input[i] === '|') {
        pieces.push(current);
        current = '';
        continue;
      }
      current += input[i];
    }
    pieces.push(current);

    const hre = new HumRegex();
    for (let i = 0; i < pieces.length; i++) {
      if (hre.search(pieces[i], '^\\s*$')) continue;
      if (hre.search(pieces[i], '^\\s*([^\\s]+)\\s*(.*)\\s*$')) {
        const key = hre.getMatch(1);
        const value = hre.getMatch(2);
        parameters.set(key, value);
      }
    }
  }

  // C++ HumdrumInput::parseEmbeddedOptions: read `!!!verovio...` reference records and
  // apply them to the toolkit option list. Note: in the C++ source this method has no
  // callers (dead code); kept for parity with the public API.
  public parseEmbeddedOptions(doc: DocLike): void {
    const opts = (doc as unknown as { GetOptions(): { getItems(): Map<string, { setValueDbl(v: number): boolean; setValueBool(v: boolean): boolean; setValue(v: string): boolean }> } | undefined }).GetOptions();
    if (!opts) return;
    if (this.m_infiles.getCount() === 0) return;
    const infile = this.m_infiles.at(0);
    const hre = new HumRegex();
    // find the last !!!verovio-parameter-groups: entry in the file
    // (only the last one will be read).
    const pgroups: string[] = [];
    for (let i = infile.getLineCount() - 1; i >= 0; i--) {
      if (!infile.at(i).isReference()) continue;
      const key = infile.at(i).getReferenceKey();
      if (key !== 'verovio-parameter-group') continue;
      const groups = infile.at(i).getReferenceValue();
      if (groups === '') break;
      hre.split(pgroups, groups, '[\\s,]+');
      break;
    }

    const inputparameters = new Map<string, string>();
    // Now read through the file searching for verovio parameters that are either
    // unassigned to a group, or is in one of the given groups.
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isReference()) continue;
      const key = infile.at(i).getReferenceKey();
      if (key === 'verovio-parameter-group') continue;
      if (key.substring(0, 7) !== 'verovio') continue;
      if (key === 'verovio') {
        // in the global group, so process always:
        const value = infile.at(i).getReferenceValue();
        if (hre.search(value, '(?<!\\\\)\\|')) {
          this.parseMultiVerovioOptions(inputparameters, value);
          continue;
        }
        let pkey: string;
        let pvalue: string;
        if (hre.search(value, '^\\s*([^\\s]+)\\s+(.*)\\s*$')) {
          pkey = hre.getMatch(1);
          pvalue = hre.getMatch(2);
        }
        else if (hre.search(value, '^\\s*([^\\s]+)\\s*$')) {
          // Empty value which will be interpreted as boolean true.
          pkey = hre.getMatch(1);
          pvalue = '';
        }
        else {
          continue;
        }
        if (value === '') {
          LogWarning('In HumdrumInput::parseEmbeddedOptions: value is empty for parameter ' + key);
          continue;
        }
        inputparameters.set(pkey, pvalue);
      }
      else {
        // check to see if parameter is in desired group
        for (let j = 0; j < pgroups.length; j++) {
          if (key.substring(8) !== pgroups[j]) continue;
          const value = infile.at(i).getReferenceValue();
          if (!hre.search(value, '\\s*([^\\s]+)\\s+(.*)\\s*$')) continue;
          const pkey = hre.getMatch(1);
          const pvalue = hre.getMatch(2);
          if (value === '') {
            LogWarning('In HumdrumInput::parseEmbeddedOptions: Value is empty for parameter ' + key);
            continue;
          }
          inputparameters.set(pkey, pvalue);
          break;
        }
      }
    }

    const optionlist = opts.getItems();
    for (const [ikey, ivalue] of inputparameters) {
      const entry = optionlist.get(ikey);
      if (entry === undefined) {
        LogWarning('In HumdrumInput::parseEmbeddedOptions: option ' + ikey + ' is not recognized');
        continue;
      }

      if (hre.search(ivalue, '^([+-]?\\d+\\.?\\d*)$')) {
        entry.setValueDbl(hre.getMatchDouble(1));
      }
      else if (hre.search(ivalue, '^([+-]?\\.\\d+)$')) {
        entry.setValueDbl(hre.getMatchDouble(1));
      }
      else if (hre.search(ivalue, '^\\s*$')) {
        entry.setValueBool(true);
      }
      else {
        entry.setValue(ivalue);
      }
    }
  }

  public processMeiOptions(infile: HumdrumFile): void {
    const meiOptions: string[] = [];
    for (let i = infile.getLineCount() - 1; i >= 0; i--) {
      if (!infile.at(i).isComment() || !infile.at(i).isReference()) continue;
      if (infile.at(i).getReferenceKey() === 'mei') meiOptions.push(infile.at(i).getReferenceValue());
    }
    const hre = new HumRegex();
    for (const opt of meiOptions) {
      if (hre.search(opt, '\\bscoreDef@tempo.dist="([\\d.+-]+)"')) {
        this.addDefaultTempoDist(hre.getMatchDouble(1));
      }
    }
  }
  public finalizeDocument(doc: Doc): void {
    doc.ExpandExpansions();
    doc.ConvertToPageBasedDoc();
    doc.ConvertMarkupDoc();
    if (this.m_mens) doc.PrepareData();
  }
  public processHangingTieEnds(): void {
    for (const ss of this.m_staffstates) {
      for (const it of ss.tieends) {
        const token = it.getEndToken();
        if (token === null) continue;
        const subindex = it.getEndSubindex();
        const meterunit = it.getMeterUnit();
        const endmeasure = it.getEndMeasure();
        const tie = this.tieToPreviousItem(token, subindex, meterunit, endmeasure as unknown as Measure);
        if (tie !== null) {
          this.appendTypeTag(tie, 'hanging');
          tie.SetColor('red');
          const track = token.getTrack();
          const staffindex = this.m_rkern[track] ?? -1;
          this.setStaff(tie, staffindex + 1);
        }
      }
    }
  }
  public processHangingTieStarts(): void {
    for (const ss of this.m_staffstates) {
      for (const it of ss.tiestarts) this.processHangingTieStart(it);
    }
  }
  public processHangingTieStart(tieinfo: HumdrumTie): void {
    const token = tieinfo.getStartTokenPointer();
    if (token === null) return;
    const subindex = tieinfo.getStartSubindex();
    const measure = tieinfo.getStartMeasure();
    if (measure === null || measure === undefined) {
      LogWarning('In HumdrumInput::processHangingTieStart: Start measure is NULL');
      return;
    }
    const meterunit = tieinfo.getMeterBottom();
    const duration = token.getDuration();
    const tobegin = token.getDurationFromStart();
    const endtime = tobegin.add(duration);
    const owner = token.getOwner()?.getOwner() ?? null;
    const scordur = owner !== null ? (owner as unknown as { getScoreDuration(): HumNum }).getScoreDuration() : new HumNum(-1);
    const pitch = tieinfo.getPitch();
    if (scordur.equals(tobegin.add(duration))) {
      const tie = this.addHangingTieToNextItem(token, subindex, meterunit, measure);
      if (tie !== null) this.appendTypeTag(tie, 'hanging-terminal');
    }
    else if (this.atEndingBoundaryEnd(token)) {
      const tie = this.addHangingTieToNextItem(token, subindex, meterunit, measure);
      if (tie !== null) this.appendTypeTag(tie, 'hanging-terminal-ending');
    }
    else {
      const track = token.getTrack();
      const staffindex = this.m_rkern[track] ?? -1;
      if (staffindex < 0 || staffindex >= this.m_staffstates.length) return;
      const tieends = this.m_staffstates[staffindex].tieends;
      const found = tieends.find((it) => it.getPitch() === pitch && it.getStartTime().equals(endtime));
      if (found !== undefined) {
        tieinfo.setEndId(found.getEndId());
        tieinfo.setEndMeasure(found.getEndMeasure());
        const tie = tieinfo.insertTieIntoDom();
        if (tie !== null) {
          this.setTieLocationId(tie, tieinfo.getStartTokenPointer(), tieinfo.getStartSubindex(), found.getEndToken(), found.getEndSubindex());
        }
        tieends.splice(tieends.indexOf(found), 1);
        return;
      }
      const sig = this.m_signifiers;
      const s = token.toString();
      if (sig.kernTerminalLong !== '' && s.indexOf(sig.kernTerminalLong) !== -1) return;
      if (sig.kernTerminalBreve !== '' && s.indexOf(sig.kernTerminalBreve) !== -1) return;
      if (sig.mensTerminalLong !== '' && s.indexOf(sig.mensTerminalLong) !== -1) return;
      if (sig.mensTerminalBreve !== '' && s.indexOf(sig.mensTerminalBreve) !== -1) return;
      const tie = this.addHangingTieToNextItem(token, subindex, meterunit, measure);
      if (tie === null) return;
      this.appendTypeTag(tie, 'hanging');
      const lvstring = token.getLayoutParameter('T', 'lv');
      const lv = lvstring !== '' && lvstring !== 'false';
      if (lv) tie.SetType('lv');
      else if (!this.isTieAllowedToHang(token)) tie.SetColor('red');
    }
  }
  public addHangingTieToNextItem(
    token: HTp, subindex: number, meterunit: HumNum, measure: TieMeasureLike | null,
  ): Tie | null {
    if (token === null || measure === null || measure === undefined) return null;
    const tie = new Tie();
    this.addTieLineStyle(tie, token, subindex);
    this.addChildMeasureOrSection(tie, measure as unknown as Measure);
    const lvstring = token.getLayoutParameter('T', 'lv');
    let tdur = new HumNum(0);
    const hre = new HumRegex();
    if (hre.search(lvstring, '\\d')) tdur = recipToDuration(lvstring);
    let trackend = token.getOwner()?.getTrackEnd(token.getTrack()) ?? null;
    let current = token.getNextToken();
    while (current !== null) {
      if (current.isBarline()) break;
      if (current.isData() && !current.isNull()) break;
      current = current.getNextToken();
    }
    if (current !== null) trackend = current;
    this.setTieLocationId(tie, token, subindex, trackend, -1);
    let startid = HumdrumInput.getLocationIdForToken('note', token.getLineIndex(), token.getFieldIndex());
    if (token.isChord()) {
      const startnumber = subindex + 1;
      if (startnumber > 0) startid += 'S' + String(startnumber);
    }
    let tstamp: HumNum;
    if (trackend !== null && trackend.isData()) {
      tstamp = trackend.getDurationFromBarline().mul(meterunit).div(4).add(1);
    }
    else {
      tstamp = token.getDurationToBarline().add(token.getDurationFromBarline()).mul(meterunit).div(4).add(1);
    }
    tie.SetStartid('#' + startid);
    if (tdur.isZero()) tie.SetTstamp2([0, tstamp.getFloat()]);
    else {
      const tstampRef = { value: tstamp };
      const measures = this.getMeasureDifference(token, meterunit, tdur, tstampRef);
      tie.SetTstamp2([measures, tstampRef.value.getFloat()]);
    }
    const track = token.getTrack();
    const staffindex = this.m_rkern[track] ?? -1;
    this.setStaff(tie, staffindex + 1);
    return tie;
  }
  public appendTypeTag(element: VrvObject, aType: string): void {
    const currentType = (element as unknown as { GetType(): string }).GetType() ?? '';
    if (currentType === '') (element as unknown as { SetType(s: string): void }).SetType(aType);
    else (element as unknown as { SetType(s: string): void }).SetType(currentType + ' ' + aType);
  }
  public checkForBreak(infile: HumdrumFile, line: number): void {
    if (line >= infile.getLineCount() - 1) return;
    const timestamp = infile.at(line).getDurationFromStart();
    let linebreaki = -1;
    let pagebreaki = -1;
    const scan = (i: number): boolean => {
      if (infile.at(i).isData()) return true;
      if (!infile.at(i).isGlobalComment()) return false;
      if (!infile.at(i).getDurationFromStart().equals(timestamp)) return true;
      const token = infile.token(i, 0);
      if (token === null) return false;
      if (token.compare(0, 12, '!!linebreak:') === 0) { linebreaki = i; return true; }
      if (token.compare(0, 12, '!!pagebreak:') === 0) { pagebreaki = i; return true; }
      return false;
    };
    for (let i = line; i < infile.getLineCount(); ++i) if (scan(i)) break;
    if (linebreaki === -1 && pagebreaki === -1) {
      for (let i = line - 1; i > 0; i--) if (scan(i)) break;
    }
    if (linebreaki === -1 && pagebreaki === -1) return;
    if (pagebreaki > 0) { linebreaki = pagebreaki; pagebreaki = -1; }
    if (linebreaki > 0) {
      const token = infile.token(linebreaki, 0);
      const sb = new Sb();
      this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
      if (token !== null) this.setLocationId(sb, token);
      this.m_sections[this.m_sections.length - 1].AddChild(sb);
      if (token !== null && token.toString().indexOf('original') !== -1) this.appendTypeTag(sb, 'original');
    }
    else if (pagebreaki > 0) {
      const token = infile.token(pagebreaki, 0);
      const pb = new Pb();
      this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
      if (token !== null) this.setLocationId(pb, token);
      this.m_sections[this.m_sections.length - 1].AddChild(pb);
      if (token !== null && token.toString().indexOf('original') !== -1) this.appendTypeTag(pb, 'original');
    }
  }
  public isTacet(spinestart: HTp): boolean {
    if (spinestart === null) return false;
    let current = spinestart.getNextToken();
    while (current !== null) {
      if (current.isData()) break;
      if (current.toString() === '*tacet') return true;
      current = current.getNextToken();
    }
    return false;
  }

  public getCurrentLayerCount(token: HTp): number {
    if (token === null) return 1;
    let output = 1;
    const ttrack = token.getTrack();
    let current = token.getNextFieldToken();
    while (current !== null) {
      if (current.getTrack() !== ttrack) break;
      output++;
      current = current.getNextFieldToken();
    }
    return output;
  }

  public storeStaffLayerTokensForMeasure(startline: number, endline: number): void {
    const infile = this.m_infiles.at(0);
    const staffstarts = this.m_staffstarts;
    const rkern = this.m_rkern;
    const lt = this.m_layertokens;
    lt.length = 0;
    for (let i = 0; i < staffstarts.length; i++) lt.push([]);
    let lasttrack = -1;
    let track = -1;
    let staffindex = -1;
    let layerindex = 0;
    for (let i = startline; i <= endline; ++i) {
      if (i > startline || i < endline) {
        if (infile.at(i).isData() && infile.at(i - 1).isData()) continue;
      }
      if (!infile.at(i).hasSpines()) continue;
      lasttrack = -1;
      for (let j = 0; j < infile.at(i).getFieldCount(); j++) {
        const token = infile.at(i).token(j);
        if (token === null || !token.isStaff()) continue;
        if (token.isDataType('**kernyy')) continue;
        track = token.getTrack();
        if (track !== lasttrack) layerindex = 0;
        else layerindex++;
        if (track !== lasttrack) { lasttrack = track; continue; }
        staffindex = rkern[track] ?? -1;
        if (staffindex < 0) LogWarning('In HumdrumInput::storeStaffLayerTokensForMeasure:Staff inex problem for track ' + track);
        if (lt[staffindex].length < layerindex + 1) lt[staffindex].push([]);
      }
    }
    for (let i = startline; i <= endline; ++i) {
      if (!infile.at(i).hasSpines()) continue;
      lasttrack = -1;
      for (let j = 0; j < infile.at(i).getFieldCount(); ++j) {
        const token = infile.at(i).token(j);
        if (token === null) continue;
        track = token.getTrack();
        if (track < 1) continue;
        staffindex = rkern[track] ?? -1;
        if (staffindex < 0) continue;
        if (track !== lasttrack) layerindex = 0;
        else if (!token.isPrimaryStrophe()) continue;
        else layerindex++;
        lasttrack = track;
        if (token.isData() && token.isNull() && token.getLinkedParameterSetCount() === 0) continue;
        if (token.isCommentLocal() && token.isNull()) continue;
        if (lt[staffindex].length < layerindex + 1) lt[staffindex].push([]);
        if (token.isBarline() && !token.allSameBarlineStyle()) {
          if (infile.at(i).getValueBool('auto', 'straddlingData') && token.toString().indexOf('-') !== -1) continue;
        }
        lt[staffindex][layerindex].push(token);
        if (layerindex === 0 && token.isClef()) {
          const layercount = this.getCurrentLayerCount(token);
          for (let k = layercount; k < lt[staffindex].length; k++) lt[staffindex][k].push(token);
        }
        if (layerindex === 0 && token.toString() === '*join') {
          for (let k = 1; k < lt[staffindex].length; k++) lt[staffindex][k].push(token);
        }
        if (layerindex === 0 && token.toString() === '*Xjoin') {
          for (let k = 1; k < lt[staffindex].length; k++) lt[staffindex][k].push(token);
        }
      }
    }

    if (this.m_debug) {
      this.printMeasureTokens();
    }
  }

  // C++ HumdrumInput::setN: an ending can take its @n from a LO:TX text label instead
  // of the ending number. Template over the element type in C++; here a structural type.
  public setN(
    element: { GetClassId(): number; SetN(v: number): void } | { GetClassId(): number; SetN(v: string): void },
    nvalue: number,
    tok: HTp = null,
  ): void {
    if (element.GetClassId() === ClassId.ENDING) {
      // Check if there is a LO:TX text to replace number.
      const textlabel = tok !== null ? tok.getLayoutParameter('TX', 't') : '';
      if (textlabel !== '') {
        (element as { SetN(v: string): void }).SetN(textlabel);
      }
      else {
        (element as { SetN(v: string): void }).SetN(String(nvalue));
      }
    }
    else {
      // C++ AttNNumberLike is string-typed for Measure too (SetN(to_string(nvalue)));
      // the TS Measure port stores a number, so pass the number through.
      (element as { SetN(v: number): void }).SetN(nvalue);
    }
  }

  public addChildMeasureOrSection(element: VrvObject, measure?: Measure | null): void {
    const target = measure !== undefined ? measure : this.m_measure;
    if (target !== null) target.AddChild(element);
    else this.m_sections[this.m_sections.length - 1].AddChild(element);
  }

  public convertMeasureStaves(startline: number, endline: number): boolean {
    const staffstarts = this.m_staffstarts;
    const layers = this.getStaffLayerCounts();
    if (this.m_fb) {
      this.addFiguredBassForMeasure(startline, endline);
    }

    const stafflist: Staff[] = [];
    for (let i = 0; i < staffstarts.length; ++i) {
      const staff = new Staff();
      const st = staffstarts[i];
      if (st !== null) this.setLocationId(staff, st);
      this.addChildMeasureOrSection(staff);
      stafflist.push(staff);
    }
    this.checkForOmd(startline, endline);
    let status = true;
    for (let i = 0; i < staffstarts.length; ++i) {
      this.m_currentstaff = i + 1;
      this.m_staff = stafflist[i];
      this.m_staff.SetN(this.m_currentstaff);
      const track = staffstarts[i]?.getTrack() ?? 0;
      status = status && this.convertMeasureStaff(track, startline, endline, i + 1, layers[i]);
      if (!status) break;
    }
    if (this.m_harm || this.m_degree) {
      this.addHarmFloatsForMeasure(startline, endline);
    }
    if (this.m_fing) {
      this.addFingeringsForMeasure(startline, endline);
    }
    if (this.m_string) {
      this.addStringNumbersForMeasure(startline, endline);
    }
    return status;
  }

  public convertMeasureStaff(track: number, startline: number, endline: number, _n: number, layercount: number): boolean {
    let status = true;
    const staffindex = this.m_currentstaff - 1;
    const ss = this.m_staffstates;
    this.m_clef_buffer.length = 0;
    for (let i = 0; i < layercount; ++i) {
      if (staffindex >= 0 && staffindex < ss.length) this.m_join = ss[staffindex].join;
      status = status && this.convertStaffLayer(track, startline, endline, i);
      if (!status) break;
    }
    if (staffindex >= 0 && staffindex < ss.length && (ss[staffindex].glissStarts?.length ?? 0) > 0) {
      this.insertGlissandos(ss[staffindex].glissStarts);
    }
    if (staffindex >= 0 && staffindex < ss.length) ss[staffindex].join = this.m_join;
    this.checkClefBufferForSameAs();
    return status;
  }

  /** C++ HumdrumInput::checkClefBufferForSameAs: suppress every buffered clef that
   *  was flagged as a "bad" (not adjacent to the previous note) clef. */
  public checkClefBufferForSameAs(): void {
    for (let i = 0; i < this.m_clef_buffer.length; ++i) {
      if (this.m_clef_buffer[i].bad) {
        this.suppressBufferedClef(i);
      }
    }
  }

  /** C++ HumdrumInput::suppressBufferedClef: mark the clef as @sameas the first
   *  non-bad clef at the same timestamp (only if such a clef exists). */
  public suppressBufferedClef(index: number): void {
    const target = this.m_clef_buffer[index].pos;
    let goodclef: Clef | null = null;
    for (let i = 0; i < this.m_clef_buffer.length; ++i) {
      if (this.m_clef_buffer[i].bad) {
        // don't look at bad clefs
        continue;
      }
      if (target.equals(this.m_clef_buffer[i].pos)) {
        goodclef = this.m_clef_buffer[i].clef;
        break;
      }
    }
    if (goodclef === null) return;

    const badclef = this.m_clef_buffer[index].clef;
    if (badclef === null) return;

    badclef.SetSameas('#' + goodclef.GetID());
  }

  /** C++ HumdrumInput::insertGlissandos: pair each queued glissando start with
   *  the next non-null data token on its spine, then clear the queue. */
  public insertGlissandos(tokens: HTp[]): void {
    for (let i = 0; i < tokens.length; i++) {
      const start = tokens[i];
      if (start === null) continue;
      let nexttok: HTp = null;
      let current = start.getNextToken();
      while (current) {
        if (!current.isData()) {
          current = current.getNextToken();
          continue;
        }
        if (current.isNull()) {
          current = current.getNextToken();
          continue;
        }
        nexttok = current;
        break;
      }
      if (!nexttok) continue;
      this.createGlissando(start, nexttok);
    }
    tokens.length = 0;
  }

  /** C++ HumdrumInput::createGlissando: emit <gliss> from the `H`/`HH` subtoken
   *  of the start chord to the matching `h` subtoken of the end token. */
  public createGlissando(glissStart: HTp, glissEnd: HTp): void {
    if (glissEnd === null || glissStart === null) return;
    if (glissEnd.find('h') === -1) {
      return;
    }
    const staffnumber = this.m_currentstaff;

    const gstarts: number[] = [];
    const gends: number[] = [];
    const stoks = glissStart.getSubtokens();
    const etoks = glissEnd.getSubtokens();

    if (!glissStart.isChord()) {
      gstarts.push(0);
    } else {
      for (let i = 0; i < stoks.length; i++) {
        if (stoks[i].indexOf('H') !== -1) gstarts.push(i);
      }
    }

    if (!glissEnd.isChord()) {
      gends.push(0);
    } else {
      for (let i = 0; i < etoks.length; i++) {
        if (etoks[i].indexOf('h') !== -1) gends.push(i);
      }
    }

    let minsize = gstarts.length;
    if (minsize > gends.length) minsize = gends.length;

    for (let i = 0; i < minsize; i++) {
      const stok = stoks[gstarts[i]];
      const etok = etoks[gends[i]];

      const gliss = new Gliss();
      this.setStaff(gliss as unknown as { SetStaff(v: number[]): void }, staffnumber);
      if (stok.indexOf('HH') !== -1) {
        gliss.SetLform(LINEFORM_wavy);
      }
      let startid = this.getLocationId('note', glissStart);
      if (glissStart.isChord()) {
        startid += 'S';
        startid += String(gstarts[i] + 1);
      }

      let endid = this.getLocationId('note', glissEnd);
      if (glissEnd.isChord()) {
        endid += 'S';
        endid += String(gends[i] + 1);
      }

      gliss.SetStartid('#' + startid);
      gliss.SetEndid('#' + endid);
      let glissId = 'gliss-L';
      glissId += String(glissStart.getLineNumber());
      glissId += 'F';
      glissId += String(glissStart.getFieldNumber());
      if (glissStart.isChord()) {
        glissId += 'S';
        glissId += String(i + 1);
      }
      gliss.SetID(glissId);
      this.m_measure?.AddChild(gliss);
    }
  }

  public convertStaffLayer(track: number, startline: number, _endline: number, layerindex: number): boolean {
    const layer = new Layer();
    this.m_layer = layer;
    this.m_currentlayer = layerindex + 1;
    layer.SetN(layerindex + 1);
    this.m_staff?.AddChild(layer);
    const staffindex = this.m_rkern[track] ?? -1;
    const layerdata = staffindex >= 0 ? (this.m_layertokens[staffindex]?.[layerindex] ?? []) : [];
    if (layerdata.length > 0 && layerdata[0] !== null && layerdata[0].toString().length > 0) {
      this.setLocationIdNSuffix(layer, layerdata[0], layerindex + 1);
      // Start the Layer at startline rather than line of first token.
      const hre = new HumRegex();
      const id = layer.GetID().replace(/L\d+/, 'L' + String(startline + 1));
      void hre;
      layer.SetID(id);
    }
    if (layerindex === 0 && layerdata.length > 0 && layerdata[0] !== null
      && layerdata[0].toString().length > 0 && layerdata[0].toString()[0] === '=') {
      if (this.m_staff !== null) this.setLocationIdNSuffix(this.m_staff, layerdata[0], layerindex + 1);
    }
    // ponytail: fillContentsOfLayer (note/rest/chord conversion) next cluster.
    return this.fillContentsOfLayer(track, startline, _endline, layerindex);
  }

  /** Pitch slice of convertNote: SetOct/SetPname/unpitched/badpitch (iohumdrum.cpp convertNote pitch block). */
  public convertNotePitch(
    note: { SetOct(v: number): void; SetOctGes(v: number): void; SetPname(v: number): void; SetLoc(v: number): void; SetColor(v: string): void },
    token: HTp, staffindex: number, subtoken = -1,
  ): void {
    if (token === null) return;
    const ss = this.m_staffstates;
    const subnote = subtoken >= 0 ? token.getSubtoken(subtoken) : token.toString();
    const tstring = subtoken < 0 ? token.toString() : token.getSubtoken(subtoken);
    const chordQ = token.isChord();
    const unpitchedInit = subnote.indexOf('R') !== -1;
    const lastClef = staffindex >= 0 && staffindex < ss.length ? ss[staffindex].last_clef : '';
    const isXClef = lastClef.substr(0, 6) === '*clefX';
    // C++ XOR condition verbatim: flags R-without-X or pitched-with-X as bad/unpitched.
    let unpitchedQ = unpitchedInit;
    let badpitchedQ = false;
    if ((unpitchedQ !== isXClef) || (!unpitchedQ !== !isXClef)) { badpitchedQ = true; unpitchedQ = true; }
    const ottava = token.getValueInt('auto', 'ottava');
    const octaveupQ = ottava === 1;
    const octavedownQ = ottava === -1;
    const octave2upQ = ottava === 2;
    const octave2downQ = ottava === -2;
    let base40 = kernToBase40(tstring);
    base40 += this.m_transpose[staffindex] ?? 0;
    let diatonic = base40ToDiatonic(base40);
    let octave = Math.trunc(diatonic / 7);
    let testaccid = 0;
    for (const ch of tstring) {
      if (ch === '-') testaccid--;
      else if (ch === '#') testaccid++;
    }
    if (testaccid > 2 || testaccid < -2) {
      // Notes unrepresentable in base-40: letter-count octave fallback verbatim.
      diatonic = -1;
      let dia = '';
      for (const ch of tstring) {
        if ('cCdDeEfFgGaAbB'.indexOf(ch) !== -1) {
          const pc = 'cCdDeEfFgGaAbB'.indexOf(ch) >> 1;
          void pc;
          const map: Record<string, number> = { c: 0, C: 0, d: 1, D: 1, e: 2, E: 2, f: 3, F: 3, g: 4, G: 4, a: 5, A: 5, b: 6, B: 6 };
          diatonic = map[ch];
          dia += ch;
        }
      }
      octave = dia.length;
      if (octave > 0) {
        if (dia[0] >= 'a' && dia[0] <= 'z') octave = octave + 3;
        else octave = 4 - octave;
      }
    }
    if (!unpitchedQ) {
      if (octaveupQ) { note.SetOctGes(octave); note.SetOct(octave - 1); }
      else if (octavedownQ) { note.SetOctGes(octave); note.SetOct(octave + 1); }
      else if (octave2upQ) { note.SetOctGes(octave); note.SetOct(octave - 2); }
      else if (octave2downQ) { note.SetOctGes(octave); note.SetOct(octave + 2); }
      else note.SetOct(octave);
    }
    if (!unpitchedQ) {
      switch (((diatonic % 7) + 7) % 7) {
        case 0: note.SetPname(PITCHNAME_c); break;
        case 1: note.SetPname(PITCHNAME_d); break;
        case 2: note.SetPname(PITCHNAME_e); break;
        case 3: note.SetPname(PITCHNAME_f); break;
        case 4: note.SetPname(PITCHNAME_g); break;
        case 5: note.SetPname(PITCHNAME_a); break;
        case 6: note.SetPname(PITCHNAME_b); break;
      }
    }
    if (unpitchedQ) note.SetLoc(kernToStaffLocation(subnote, '*clefX'));
    if (badpitchedQ) note.SetColor('#c41414');
    void chordQ;
  }

  /** Accidental slice of convertNote: kern non-mensural Accid build (iohumdrum.cpp accid block). */
  public convertNoteAccid(
    note: { AddChild(c: Accid): void },
    token: HTp, staffindex: number, subtoken = -1, unpitchedQ = false,
  ): Accid | null {
    if (token === null) return null;
    if (this.m_mens && token.isMensLike()) return null;
    if (unpitchedQ) return null;
    const tstring = subtoken < 0 ? token.toString() : token.getSubtoken(subtoken);
    const stindex = subtoken < 0 ? 0 : subtoken;
    let base40 = kernToBase40(tstring);
    base40 += this.m_transpose[staffindex] ?? 0;
    let testaccid = 0;
    for (const ch of tstring) {
      if (ch === '-') testaccid--;
      else if (ch === '#') testaccid++;
    }
    let accidCount = base40ToAccidental(base40);
    if (testaccid > 2 || testaccid < -2) accidCount = testaccid;
    // C++ convertNote accid block (iohumdrum.cpp:26413ff, 26734ff): the three
    // flags decide whether the <accid> stays an element or becomes a note attribute.
    let cautionaryQ = false;
    let subelementQ = false;
    let editorialQ = false;
    let edittype = '';
    if (token.isKern()) {
      const sig = this.m_signifiers;
      for (let x = 0; x < sig.editaccKern.length; ++x) {
        if (tstring.indexOf(sig.editaccKern[x]) !== -1) {
          editorialQ = true;
          edittype = sig.edittypeKern[x] ?? '';
          break;
        }
      }
    }
    const edittype2 = token.getLayoutParameter('A', 'edit', subtoken);
    if (edittype === '' && edittype2 !== '') {
      editorialQ = true;
      if (edittype2 === 'true') {
        edittype = '';
        if (token.isKern() && this.m_signifiers.editaccKern.length > 0) {
          edittype = this.m_signifiers.edittypeKern[0] ?? '';
        }
      }
      else edittype = edittype2;
    }
    let showInAccid = token.hasVisibleAccidental(stindex) ? true : false;
    let showInAccidGes = false;
    const brackQ = this.hasLayoutParam(token, 'ACC', 'brack');
    const parenQ = this.hasLayoutParam(token, 'ACC', 'paren');
    let loaccid = token.getLayoutParameter('N', 'acc', subtoken);
    if (loaccid !== '') { showInAccid = false; showInAccidGes = true; }
    const loaccid2 = token.getLayoutParameter('A', 'vis', subtoken);
    if (loaccid2 !== '') { showInAccid = false; showInAccidGes = true; }
    if (loaccid2 !== '') loaccid = loaccid2;
    const accid = new Accid();
    note.AddChild(accid);
    this.setLocationId(accid, token, subtoken);
    const color = token.getLayoutParameter('ACC', 'color', subtoken);
    if (color !== '') { accid.SetColor(color); subelementQ = true; }
    if (!editorialQ) {
      if (token.hasCautionaryAccidental(stindex)) {
        this.addCautionaryAccidental(accid, token, accidCount);
        cautionaryQ = true;
        showInAccidGes = false;
        showInAccid = false;
      }
    }
    if (!editorialQ) {
      if (brackQ) { accid.SetEnclose(ENCLOSURE_brack); cautionaryQ = true; }
      else if (parenQ) { accid.SetEnclose(ENCLOSURE_paren); cautionaryQ = true; }
      if (showInAccid) {
        switch (accidCount) {
          case 3: accid.SetAccid(ACCIDENTAL_WRITTEN_xs); break;
          case 2: accid.SetAccid(ACCIDENTAL_WRITTEN_x); break;
          case 1: accid.SetAccid(ACCIDENTAL_WRITTEN_s); break;
          case 0: accid.SetAccid(ACCIDENTAL_WRITTEN_n); break;
          case -1: accid.SetAccid(ACCIDENTAL_WRITTEN_f); break;
          case -2: accid.SetAccid(ACCIDENTAL_WRITTEN_ff); break;
          case -3: accid.SetAccid(ACCIDENTAL_WRITTEN_tf); break;
          default: LogWarning('In HumdrumInput::convertNote: Do not know how to convert accidental: ' + accidCount);
        }
      }
      else if (loaccid !== '') {
        const hit = LOACCID_MAP.get(loaccid);
        if (hit !== undefined) {
          accid.SetAccid(hit);
          showInAccidGes = true;
        }
        else LogWarning('In HumdrumInput::convertNote: Unknown accidental type: ' + loaccid);
        if (showInAccidGes) {
          switch (accidCount) {
            case 2: accid.SetAccidGes(ACCIDENTAL_GESTURAL_ss); break;
            case 1: accid.SetAccidGes(ACCIDENTAL_GESTURAL_s); break;
            case 0: accid.SetAccidGes(ACCIDENTAL_GESTURAL_n); break;
            case -1: accid.SetAccidGes(ACCIDENTAL_GESTURAL_f); break;
            case -2: accid.SetAccidGes(ACCIDENTAL_GESTURAL_ff); break;
          }
        }
      }
    }
    else {
      if (edittype === '') accid.SetFunc(accidLog_FUNC_edit);
      else if (edittype.indexOf('above') !== -1) accid.SetFunc(accidLog_FUNC_edit);
      else if (edittype === 'a') accid.SetFunc(accidLog_FUNC_edit);
      else if (edittype.indexOf('up') !== -1) accid.SetFunc(accidLog_FUNC_edit);
      if (edittype.indexOf('brack') !== -1) { accid.SetEnclose(ENCLOSURE_brack); accid.SetType('edit'); }
      else if (edittype.indexOf('brac') !== -1) { accid.SetEnclose(ENCLOSURE_brack); accid.SetType('edit'); }
      if (edittype.indexOf('paren') !== -1) { accid.SetEnclose(ENCLOSURE_paren); accid.SetType('edit'); }
      else if (edittype.indexOf('none') !== -1) accid.SetType('edit');
      if (loaccid === '') {
        switch (accidCount) {
          case 2: accid.SetAccid(ACCIDENTAL_WRITTEN_x); break;
          case 1: accid.SetAccid(ACCIDENTAL_WRITTEN_s); showInAccidGes = false; break;
          case 0: accid.SetAccid(ACCIDENTAL_WRITTEN_n); showInAccidGes = false; break;
          case -1: accid.SetAccid(ACCIDENTAL_WRITTEN_f); showInAccidGes = false; break;
          case -2: accid.SetAccid(ACCIDENTAL_WRITTEN_ff); break;
        }
      }
      else this.setAccid(accid, loaccid);
    }
    if (showInAccidGes) {
      if (loaccid === '') {
        switch (accidCount) {
          case 2: accid.SetAccidGes(ACCIDENTAL_GESTURAL_ss); break;
          case 1: accid.SetAccidGes(ACCIDENTAL_GESTURAL_s); break;
          case 0: accid.SetAccidGes(ACCIDENTAL_GESTURAL_n); break;
          case -1: accid.SetAccidGes(ACCIDENTAL_GESTURAL_f); break;
          case -2: accid.SetAccidGes(ACCIDENTAL_GESTURAL_ff); break;
        }
      }
    }
    if (!(editorialQ || cautionaryQ || subelementQ)) {
      // No need for sub-element so make them attributes of the note.
      accid.SetAttribute(true);
    }
    return accid;
  }

  /** Stem/grace/visibility/cue slice of convertNote (iohumdrum.cpp tail blocks). */
  public convertNoteStem(
    note: {
      SetStemDir(v: number): void; SetStemLen(v: number): void;
      SetStemVisible(v: number): void; SetGrace(v: number): void;
      SetDur(v: number): void; SetVisible(v: number): void; SetCue(v: number): void;
    },
    token: HTp, staffindex: number, subtoken = -1,
  ): void {    if (token === null) return;
    const chordQ = token.isChord();
    const tstring = subtoken < 0 ? token.toString() : token.getSubtoken(subtoken);
    if (!chordQ) {
      const stemlen = token.getValue('auto', 'stemlen');
      if (stemlen !== '') note.SetStemLen(Number.parseFloat(stemlen));
    }
    if (!chordQ) {
      // C++ convertNote sets grace+dur(8) once in its early block; the rhythm
      // step later corrects rhythmless grace to dur(4). convertNoteStem runs
      // after that correction, so it must not re-apply SetDur(8) here.
      if (tstring.indexOf('qq') !== -1) { note.SetGrace(GRACE_acc); }
      else if (tstring.indexOf('q') !== -1) { note.SetGrace(GRACE_unacc); }
    }
    if (!chordQ) {
      // C++ checks convertRhythm's return (printed duration after grace
      // stripping), not the humlib zero grace duration. The caller already
      // applies SetDur(4)+stem-invisible on convertRhythm zero, so no check here.
    }
    if (!chordQ) {
      // C++ convertNoteStem (iohumdrum.cpp ~27017): explicit stem direction
      // also tags the note placed (no m_humtype gate here).
      if (tstring.indexOf('/') !== -1) { note.SetStemDir(STEMDIRECTION_up); this.appendTypeTag(note as never, 'placed'); }
      else if (tstring.indexOf('\\') !== -1) { note.SetStemDir(STEMDIRECTION_down); this.appendTypeTag(note as never, 'placed'); }
      this.checkForAutoStem(note as never, token);
    }
    if (tstring.indexOf('yy') !== -1) note.SetVisible(BOOLEAN_false);
    const cuesize = this.m_signifiers.cuesize;
    if (cuesize !== '' && tstring.indexOf(cuesize) !== -1) note.SetCue(BOOLEAN_true);
    else {
      const ss = this.m_staffstates;
      if (staffindex >= 0 && staffindex < ss.length
        && this.m_currentlayer >= 0 && this.m_currentlayer < ss[staffindex].cue_size.length
        && ss[staffindex].cue_size[this.m_currentlayer]) note.SetCue(BOOLEAN_true);
    }
    void BOOLEAN_true;
  }

  /** Tie start slice of convertNote (iohumdrum.cpp processTieStart). */
  public processTieStart(
    note: { GetID(): string },
    token: HTp, tstring: string, subindex: number,
  ): void {
    if (token === null || token.isMensLike()) return;
    if (token.toString().indexOf('yy') !== -1) return;
    let endtag = 'tieEnd';
    if (subindex >= 0) endtag += String(subindex + 1);
    const tieend = token.getValueHTp('auto', endtag);
    if (tieend !== null) {
      // Linked tie: insert immediately (analysis already paired endpoints).
      let endnumtag = 'tieEndSubtokenNumber';
      const endn = subindex + 1;
      if (token.isChord() && endn > 0) endnumtag += String(endn);
      let endnumber = token.getValueInt('auto', endnumtag);
      if (endnumber <= 0) endnumber = 1;
      const tie = new Tie();
      this.addTieLineStyle(tie, token, subindex);
      this.addChildMeasureOrSection(tie);
      const endsubindex = Math.max(0, endnumber - 1);
      this.setTieLocationId(tie, token, subindex, tieend, endsubindex);
      let startid = HumdrumInput.getLocationIdForToken('note', token.getLineIndex(), token.getFieldIndex());
      let endid = HumdrumInput.getLocationIdForToken('note', tieend.getLineIndex(), tieend.getFieldIndex());
      if (token.isChord()) startid += 'S' + String(subindex + 1);
      if (tieend.isChord() && endnumber > 0) endid += 'S' + String(endnumber);
      tie.SetStartid('#' + startid);
      tie.SetEndid('#' + endid);
      return;
    }
    const ss = this.m_staffstates;
    const timestamp = token.getDurationFromStart();
    const endtime = timestamp.add(token.getDuration());
    const track = token.getTrack();
    const rtrack = this.m_rkern[track] ?? -1;
    if (rtrack < 0 || rtrack >= ss.length) return;
    const pitch = kernToMidiNoteNumber(tstring);
    ss[rtrack].tiestarts.push(new HumdrumTie());
    const tie = ss[rtrack].tiestarts[ss[rtrack].tiestarts.length - 1];
    tie.setStart(note.GetID(), this.m_measure, this.m_currentlayer, tstring, pitch,
      timestamp, endtime, subindex, token, ss[rtrack].meter_top, ss[rtrack].meter_bottom);
    if (this.m_signifiers.above !== '') {
      const marker = (tstring.indexOf('_') !== -1 ? '_' : '[') + this.m_signifiers.above;
      if (tstring.indexOf(marker) !== -1) tie.setTieAbove();
    }
    if (this.m_signifiers.below !== '') {
      const marker = (tstring.indexOf('_') !== -1 ? '_' : '[') + this.m_signifiers.below;
      if (tstring.indexOf(marker) !== -1) tie.setTieBelow();
    }
  }

  /** Tie end slice of convertNote (iohumdrum.cpp processTieEnd + processHangingTieEnd store). */
  public processTieEnd(
    note: { GetID(): string },
    token: HTp, tstring: string, subindex: number,
  ): void {
    if (token === null || token.isMensLike()) return;
    let starttag = 'tieStart';
    if (token.isChord()) starttag += String(subindex + 1);
    if (token.getValueHTp('auto', starttag) !== null) return;
    const ss = this.m_staffstates;
    const timestamp = token.getDurationFromStart();
    const track = token.getTrack();
    const staffindex = this.m_rkern[track] ?? -1;
    if (staffindex < 0 || staffindex >= ss.length) return;
    const disjunct = tstring.indexOf(']]') !== -1 || tstring.indexOf('__') !== -1;
    const pitch = kernToMidiNoteNumber(tstring);
    const layer = this.m_currentlayer;
    let found = -1;
    for (let i = 0; i < ss[staffindex].tiestarts.length; i++) {
      const t = ss[staffindex].tiestarts[i];
      if (t.getLayer() !== layer || t.getPitch() !== pitch) continue;
      const sp = t.getStartTokenPointer();
      if (disjunct && sp !== null && (sp.toString().indexOf('[[') !== -1 || sp.toString().indexOf('__') !== -1)) { found = i; break; }
      else if (t.getEndTime().equals(timestamp)) { found = i; break; }
    }
    if (found === -1) {
      for (let i = 0; i < ss[staffindex].tiestarts.length; i++) {
        const t = ss[staffindex].tiestarts[i];
        if (t.getPitch() !== pitch) continue;
        const sp = t.getStartTokenPointer();
        if (disjunct && sp !== null && sp.toString().indexOf('[[') !== -1) { found = i; break; }
        else if (t.getEndTime().equals(timestamp)) { found = i; break; }
      }
    }
    if (found === -1) {
      this.processHangingTieEnd(note, token, tstring, subindex);
      return;
    }
    const entry = ss[staffindex].tiestarts[found];
    const starttime = token.getDurationFromStart();
    const duration = recipToDuration(token.toString());
    const endtime = starttime.add(duration);
    const tie = entry.setEndAndInsert(note.GetID(), this.m_measure, layer, tstring, pitch,
      starttime, endtime, subindex, token, ss[staffindex].meter_top, ss[staffindex].meter_bottom);
    if (tie === null) return;
    const starttoken = entry.getStartTokenPointer();
    if (starttoken !== null) this.addTieLineStyle(tie, starttoken, entry.getStartSubindex());
    this.setTieLocationId(tie, starttoken, entry.getStartSubindex(), token, subindex);
    if (entry.isInserted()) ss[staffindex].tiestarts.splice(found, 1);
  }

  public processHangingTieEnd(
    note: { GetID(): string }, token: HTp, tstring: string, subindex: number,
  ): void {
    if (token === null || token.toString().indexOf('yy') !== -1) return;
    const meterunit = this.m_staffstates.length > 0
      ? this.m_staffstates[this.m_rkern[token.getTrack()] ?? 0]?.meter_bottom ?? new HumNum(4)
      : new HumNum(4);
    if (token.getDurationFromStart().isZero()) {
      const tie = this.tieToPreviousItem(token, subindex, meterunit);
      if (tie !== null) this.appendTypeTag(tie, 'hanging-initial');
    }
    else if (this.atEndingBoundaryStart(token)) {
      const tie = this.tieToPreviousItem(token, subindex, meterunit);
      if (tie !== null) this.appendTypeTag(tie, 'hanging-initial-ending');
    }
    else {
      const track = token.getTrack();
      const staffindex = this.m_rkern[track] ?? -1;
      if (staffindex < 0 || staffindex >= this.m_staffstates.length) return;
      const ss = this.m_staffstates[staffindex];
      const starttime = token.getDurationFromStart();
      const endtime = starttime.add(recipToDuration(token.toString()));
      ss.tieends.push(new HumdrumTie());
      ss.tieends[ss.tieends.length - 1].setEnd(note.GetID(), this.m_measure, this.m_currentlayer,
        tstring, kernToMidiNoteNumber(tstring), starttime, endtime, subindex, token,
        ss.meter_top, ss.meter_bottom);
    }
  }
  public atEndingBoundaryStart(token: HTp): boolean {
    if (token === null) return false;
    let current = token.getPreviousToken();
    while (current !== null) {
      if (current.isData() && !current.isNull()) break;
      current = current.getPreviousToken();
    }
    if (current === null) return false;
    const label1 = this.m_sectionlabels[current.getLineIndex()] ?? null;
    const label2 = this.m_sectionlabels[token.getLineIndex()] ?? null;
    if (label1 === label2 || label1 === null || label2 === null) return false;
    const hre = new HumRegex();
    let number1 = 0;
    let number2 = 0;
    if (hre.search(label1.toString(), '(\\d+)$')) number1 = hre.getMatchInt(1);
    else return false;
    if (hre.search(label2.toString(), '(\\d+)$')) number2 = hre.getMatchInt(1);
    else return false;
    return number1 !== number2;
  }
  public addTieLineStyle(tie: Tie, token: HTp, noteindex: number): void {
    if (token === null) return;
    if (token.getLayoutParameter('T', 'dot', noteindex) !== '') tie.SetLform(2);
    else if (token.getLayoutParameter('T', 'dash', noteindex) !== '') tie.SetLform(3);
    const color = token.getLayoutParameter('T', 'color', noteindex);
    if (color !== '') tie.SetColor(color);
    if (token.getLayoutParameter('T', 'a', noteindex) !== '') tie.SetCurvedir(curvature_CURVEDIR_above);
    else if (token.getLayoutParameter('T', 'b', noteindex) !== '') tie.SetCurvedir(curvature_CURVEDIR_below);
    // WASM parity: tie placement signifiers (!RDF**kern: < = below) apply to
    // beams and slurs only; addTieLineStyle does not read them in WASM.
  }

  public setTieLocationId(tie: Tie, starttok: HTp, startindex: number, endtok: HTp, endindex: number): void {
    let startline = 0;
    let startfield = 0;
    let endline = 0;
    let endfield = 0;
    if (starttok) { startline = starttok.getLineNumber(); startfield = starttok.getFieldNumber(); }
    if (endtok) { endline = endtok.getLineNumber(); endfield = endtok.getFieldNumber(); }
    let id = (tie as unknown as { GetClassName(): string }).GetClassName().toLowerCase();
    id += '-L' + String(startline) + 'F' + String(startfield);
    if (startindex >= 0) id += 'S' + String(startindex + 1);
    id += '-L' + String(endline) + 'F' + String(endfield);
    if (endindex >= 0) id += 'S' + String(endindex + 1);
    (tie as unknown as { SetID(id: string): void }).SetID(id);
  }

  public processTieWrappers(
    note: { GetID(): string },
    token: HTp, tstring: string, subindex: number,
  ): void {
    if (token === null || token.isMensLike()) return;
    if (tstring.indexOf('[') !== -1 || tstring.indexOf('_') !== -1) this.processTieStart(note, token, tstring, subindex);
    if (tstring.indexOf('_') !== -1 || tstring.indexOf(']') !== -1) this.processTieEnd(note, token, tstring, subindex);
  }

  /** Rest slice of layer conversion (iohumdrum.cpp convertRest/convertMRest location blocks). */
  public convertRest(
    rest: Rest,
    token: HTp, subtoken: number, staffindex: number,
  ): void {
    if (token === null) return;
    this.convertRhythm(rest as never, token, subtoken);
    const ss = this.m_staffstates;
    const percussionQ = staffindex >= 0 && staffindex < ss.length
      && ss[staffindex].last_clef.substr(0, 6) === '*clefX';
    const oloc = token.getValue('auto', 'oloc');
    const ploc = token.getValue('auto', 'ploc');
    const ottava = token.getValueInt('auto', 'ottava');
    if (oloc !== '' && ploc !== '') {
      const olocint = Number.parseInt(oloc, 10) - ottava;
      if (percussionQ) {
        // Treated as treble clef but converted to @loc verbatim.
        const plocmap: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
        rest.SetLoc((plocmap[ploc] ?? 0) + 7 * olocint - 30);
      }
      else {
        rest.SetOloc(olocint);
        const pmap: Record<string, number> = {
          C: PITCHNAME_c, D: PITCHNAME_d, E: PITCHNAME_e, F: PITCHNAME_f,
          G: PITCHNAME_g, A: PITCHNAME_a, B: PITCHNAME_b,
        };
        if (pmap[ploc] !== undefined) rest.SetPloc(pmap[ploc]);
      }
    }
    const tstring = subtoken < 0 ? token.toString() : token.getSubtoken(subtoken);
    if (tstring.indexOf(';') !== -1) {
      this.addFermata(rest, tstring);
    }
    this.setLocationId(rest, token, subtoken);
  }

  public convertMRest(rest: MRest, token: HTp, subtoken: number, _staffindex: number): void {
    if (token === null) return;
    const oloc = token.getValue('auto', 'oloc');
    const ploc = token.getValue('auto', 'ploc');
    const ottava = token.getValueInt('auto', 'ottava');
    if (oloc !== '' && ploc !== '') {
      rest.SetOloc(Number.parseInt(oloc, 10) - ottava);
      const pmap: Record<string, number> = {
        C: PITCHNAME_c, D: PITCHNAME_d, E: PITCHNAME_e, F: PITCHNAME_f,
        G: PITCHNAME_g, A: PITCHNAME_a, B: PITCHNAME_b,
      };
      if (pmap[ploc] !== undefined) rest.SetPloc(pmap[ploc]);
    }
    const tstring = subtoken < 0 ? token.toString() : token.getSubtoken(subtoken);
    if (tstring.indexOf(';') !== -1) {
      this.addFermata(rest, tstring);
    }
    this.setLocationId(rest, token, subtoken);
    if (token.toString().indexOf('yy') !== -1) rest.SetVisible(BOOLEAN_false);
  }

  /** Chord assembly slice of layer conversion (iohumdrum.cpp convertChord head + rhythm/tail). */
  public convertChord(chord: Chord, token: HTp, staffindex: number): void {
    if (token === null) return;
    const scount = token.getSubtokenCount();
    const staffadj = this.getStaffAdjustment(token);
    if (staffadj !== 0) {
      const staffnum = staffindex + 1 + staffadj;
      this.setStaff(chord as never, staffnum);
    }
    const tstrings = token.getSubtokens();
    const notes: Note[] = [];
    let allinvis = true;
    for (const s of tstrings) {
      if (s.indexOf('yy') === -1) { allinvis = false; break; }
    }
    for (let j = 0; j < scount; ++j) {
      const tstring = tstrings[j];
      if (tstring === '') continue;
      let isnote = false;
      let isrest = false;
      let isrecip = false;
      for (const ch of tstring) {
        if (ch === 'r') isrest = true;
        else if ((ch >= 'a' && ch <= 'g') || (ch >= 'A' && ch <= 'G')) isnote = true;
        else if (ch >= '0' && ch <= '9') isrecip = true;
      }
      if (!(isnote || isrest || isrecip)) continue;
      if (isrecip && !isnote) continue;
      if (!allinvis && tstring.indexOf('yy') !== -1) continue;
      const note = new Note();
      this.setLocationId(note, token, j);
      chord.AddChild(note);
      this.convertNote(note, token, staffadj, staffindex, j);
      notes.push(note);
    }
    if (allinvis) chord.SetVisible(BOOLEAN_false);
    if (token.toString().indexOf('qq') !== -1) { chord.SetGrace(GRACE_acc); chord.SetDur(DURATION_8); }
    else if (token.toString().indexOf('q') !== -1) { chord.SetGrace(GRACE_unacc); chord.SetDur(DURATION_8); }
    this.convertRhythm(chord as never, token);
    this.adjustChordNoteDurations(chord, notes, tstrings);
    // C++ convertChord (iohumdrum.cpp): explicit stem direction on the chord
    // overwrites cross-staff direction.
    const chordString = token.toString();
    if (chordString.indexOf('/') !== -1) { chord.SetStemDir(STEMDIRECTION_up); this.appendTypeTag(chord as never, 'placed'); }
    else if (chordString.indexOf('\\') !== -1) { chord.SetStemDir(STEMDIRECTION_down); this.appendTypeTag(chord as never, 'placed'); }
    this.checkForAutoStem(chord as never, token);
    token.setValue('MEI', 'xml:id', chord.GetID());
    const mindex = this.m_measures.length - 1;
    token.setValue('MEI', 'measureIndex', mindex >= 0 ? mindex : 0);
    const breaksec = token.getValueInt('auto', 'breaksec');
    if (breaksec > 0) {
      chord.SetBreaksec(breaksec);
    }
  }

  public checkForAutoStem(
    element: { SetStemDir(v: number): void },
    token: HTp,
  ): void {
    if (token === null) return;
    const stemdir = token.getValueInt('auto', 'stem.dir');
    if (stemdir === 1) element.SetStemDir(STEMDIRECTION_up);
    else if (stemdir === -1) element.SetStemDir(STEMDIRECTION_down);
  }

  /** Layer-dispatch slice of fillContentsOfLayer (timing + empty/full-rest + token loop skeleton). */
  public getTimingInformation(prespace: HumNum[], layerdata: HTp[], layerstarttime: HumNum, layerendtime: HumNum): void {
    prespace.length = 0;
    for (let i = 0; i < layerdata.length; i++) prespace.push(new HumNum(0));
    if (this.m_mens) return;
    const dataindex: number[] = [];
    for (let i = 0; i < layerdata.length; ++i) {
      if (layerdata[i] !== null && layerdata[i]!.isData()) dataindex.push(i);
    }
    const startdur: HumNum[] = dataindex.map(() => new HumNum(0));
    const duration: HumNum[] = dataindex.map(() => new HumNum(0));
    for (let i = 0; i < dataindex.length; ++i) {
      const tok = layerdata[dataindex[i]]!;
      startdur[i] = tok.getDurationFromStart();
      if (!tok.isData() || tok.isNull()) duration[i] = new HumNum(0);
      else duration[i] = tok.getDuration();
    }
    let correction = new HumNum(0);
    if (dataindex.length > 0) prespace[dataindex[0]] = startdur[0].sub(layerstarttime);
    for (let i = 1; i < dataindex.length; ++i) {
      const ii = dataindex[i];
      const adj = this.m_duradj[layerdata[ii]!.getLineIndex()] ?? new HumNum(0);
      prespace[ii] = startdur[i].sub(startdur[i - 1]).sub(duration[i - 1]).sub(adj);
      if (prespace[ii].isNegative()) { correction = correction.add(prespace[ii]); prespace[ii] = new HumNum(0); }
      else if (prespace[ii].isPositive()) {
        prespace[ii] = prespace[ii].add(correction);
        if (layerdata[ii]!.toString() !== '*') correction = new HumNum(0);
      }
    }
    let clearDur = false;
    for (const ii of dataindex) {
      if (layerdata[ii]!.isData() && layerdata[ii]!.isNull()) clearDur = true;
    }
    if (dataindex.length > 0) {
      prespace.push(layerendtime.sub(startdur[startdur.length - 1]).sub(duration[duration.length - 1]));
      if (clearDur) prespace[prespace.length - 1] = new HumNum(0);
    }
    for (let i = 0; i < dataindex.length - 1; ++i) {
      const ii = dataindex[i];
      const iii = dataindex[i + 1];
      if (prespace[ii].isZero()) continue;
      if (prespace[ii].add(prespace[iii]).isZero()) { prespace[ii] = new HumNum(0); prespace[iii] = new HumNum(0); }
    }
  }

  public layerOnlyContainsNullStuff(data: HTp[]): boolean {
    for (const tok of data) {
      if (tok === null) continue;
      if (tok.isBarline()) continue;
      if (!tok.isNull()) return false;
    }
    return true;
  }

  public hasFullMeasureRest(layerdata: HTp[], timesigdur: HumNum, measuredur: HumNum): boolean {
    if (!timesigdur.equals(measuredur)) return false;
    let datacount = 0;
    for (const token of layerdata) {
      if (token === null || !token.isData() || token.isNull()) continue;
      datacount++;
      if (datacount > 1 || !token.isRest()) return false;
      if (token.getDurationFromBarline().isPositive()) return false;
    }
    return true;
  }

  public checkForLayerJoin(_staffindex: number, _layerindex: number): boolean {
    // C++ returns false (layer@sameas not yet allowed; body commented out).
    return false;
  }

  public fillEmptyLayer(staffindex: number, layerindex: number): void {
    const layerdata = this.m_layertokens[staffindex]?.[layerindex] ?? [];
    if (layerdata.length >= 2 && layerdata[0] !== null && layerdata[0]!.isBarline()
      && layerdata[layerdata.length - 1] !== null && layerdata[layerdata.length - 1]!.isBarline()) {
      const duration = layerdata[layerdata.length - 1]!.getDurationFromStart().sub(layerdata[0]!.getDurationFromStart());
      this.addSpace(this.m_layer, duration, 'straddle');
    }
  }

  public addSpace(parent: { AddChild(c: VrvObject): void } | null, duration: HumNum, typestring: string): void {
    if (parent === null) return;
    let remaining = new HumNum(duration);
    while (remaining.isPositive()) {
      const space = new Space();
      parent.AddChild(space);
      remaining = remaining.sub(this.setDuration(space as never, remaining));
      if (typestring !== '') space.SetType(typestring);
    }
  }

  /** C++ addSpace(elements, pointers, ...): spaces join the innermost open beam. */
  public addSpaceToStack(elements: string[], pointers: VrvObject[], duration: HumNum, typestring: string): void {
    let remaining = new HumNum(duration);
    while (remaining.isPositive()) {
      const space = new Space();
      this.appendElement(elements, pointers, space);
      remaining = remaining.sub(this.setDuration(space as never, remaining));
      if (typestring !== '') space.SetType(typestring);
    }
  }

  public fillContentsOfLayer(track: number, startline: number, endline: number, layerindex: number): boolean {
    const infile = this.m_infiles.at(0);
    const rkern = this.m_rkern;
    const staffindex = rkern[track] ?? -1;
    if (this.m_join && this.checkForLayerJoin(staffindex, layerindex)) return true;
    if (staffindex < 0) return false;
    const layerdata = this.m_layertokens[staffindex]?.[layerindex] ?? [];
    const layer = this.m_layer;
    if (layer === null || layerdata.length === 0) return true;
    let starttime = new HumNum(0);
    let endtime = new HumNum(0);
    let duration = new HumNum(0);
    if (!this.m_mens) {
      starttime = infile.at(startline).getDurationFromStart();
      endtime = infile.at(endline).getDurationFromStart().add(infile.at(endline).getDuration());
      duration = endtime.sub(starttime);
    }
    const prespace: HumNum[] = [];
    this.getTimingInformation(prespace, layerdata, starttime, infile.at(endline).getDurationFromStart());

    // C++ HumdrumInput::fillContentsOfLayer (iohumdrum.cpp:13873): a measure that
    // carries no data at all becomes an mRest (or a plain Rest when its duration
    // does not match the meter).
    // ponytail: emptyMeasures() is hard-coded to false in C++ as well, so this
    // branch exists for structural parity only.
    if (this.emptyMeasures()) {
      if ((this.m_timesigdurs[startline] ?? new HumNum(-1)).equals(duration)) {
        const mrest = new MRest();
        layer.AddChild(mrest);
        // Assign a Humdrum ID here.
        let trest: HTp = null;
        for (const tok of layerdata) {
          if (tok !== null && tok.isRest()) { trest = tok; break; }
        }
        if (trest !== null) {
          this.setLocationId(mrest as never, trest);
          if (this.m_humtype) this.embedQstampInClass(mrest as never, trest);
        }
      }
      else {
        const rest = new Rest();
        layer.AddChild(rest);
        this.setDuration(rest as never, duration);
      }
      return true;
    }

    // C++ declares the open-element stack here, before the barline checks.
    const elements: string[] = ['layer'];
    const pointers: VrvObject[] = [layer];

    if (layerdata.length === 2 && layerdata[0] !== null && layerdata[0]!.isBarline()
      && layerdata[1] !== null && layerdata[1]!.isBarline()) {
      this.fillEmptyLayer(staffindex, layerindex);
      return true;
    }
    if (this.layerOnlyContainsNullStuff(layerdata)) {
      this.fillEmptyLayer(staffindex, layerindex);
      return true;
    }
    if (this.hasFullMeasureRest(layerdata, this.m_timesigdurs[startline] ?? new HumNum(-1), duration)) {
      // C++ computes the meter duration from the staff state's meter_top/meter_bottom.
      const meterDur = new HumNum(4).div(this.m_staffstates[staffindex].meter_bottom).mul(this.m_staffstates[staffindex].meter_top);
      if ((this.m_multirest[startline] ?? 0) > 1) {
        const tempendline = this.getMultiEndline(startline);
        const multirest = new MultiRest();
        multirest.SetNum(this.m_multirest[startline] ?? 0);
        this.appendElement(elements, pointers, multirest);
        for (const tok of layerdata) {
          if (tok === null || !tok.isData()) continue;
          this.processDirections(tok, staffindex);
        }
        this.setSystemMeasureStyle(startline, tempendline);
      }
      else {
        let trest: HTp = null;
        for (const tok of layerdata) {
          if (tok === null || !tok.isData()) continue;
          if (tok.isRest()) { trest = tok; break; }
        }
        if (trest !== null) {
          const restduration = trest.getDuration();
          const mstartdur = layerdata[0] === null ? new HumNum(0) : layerdata[0]!.getDurationFromStart();
          const menddur = layerdata.length === 0 ? new HumNum(0)
            : layerdata[layerdata.length - 1]!.getDurationFromStart();
          const mdur = menddur.sub(mstartdur);
          const extradur = restduration.sub(mdur);
          if (extradur.isZero()) {
            if (meterDur.equals(restduration)) {
              // duration of rest matches duration of meter so create mRest
              const mrest = new MRest();
              this.appendElement(elements, pointers, mrest);
              this.convertMRest(mrest, trest, -1, staffindex);
              // WASM parity: whole-measure rests still emit attached
              // slurs/phrases/dynamics/directions (C++ source omits these).
              this.processSlurs(trest);
              this.processPhrases(trest);
              this.processDynamics(trest, staffindex);
              // C++/WASM parity: directions are emitted by the token scan below.
            }
            else if (trest.toString().indexOf('yy') !== -1) {
              // Duration of rest does not match the duration of the meter so use a
              // space instead (a full-measure rest of 5/8 is not representable).
              const irest = new Space();
              if (this.m_humtype) this.embedQstampInClass(irest as never, trest);
              this.setLocationId(irest as never, trest);
              this.appendElement(elements, pointers, irest);
              this.convertRhythm(irest as never, trest);
            }
            else {
              const rest = new Rest();
              this.convertRest(rest, trest, -1, staffindex);
            }
          }
          else if (extradur.isPositive()) {
            // add a rest that is left justified in the measure (so not an mRest), and
            // update the visual duration of the rest because there will be invisible
            // rests added in later measure(s).
            if (trest.toString().indexOf('yy') !== -1) {
              const irest = new Space();
              if (this.m_humtype) this.embedQstampInClass(irest as never, trest);
              this.setLocationId(irest as never, trest);
              this.appendElement(elements, pointers, irest);
              this.convertRhythm(irest as never, trest);
            }
            else {
              const rest = new Rest();
              this.setLocationId(rest as never, trest);
              this.appendElement(elements, pointers, rest);
              this.convertRest(rest, trest, -1, staffindex);
            }
          }
          else {
            LogWarning('In HumdrumInput::fillContentsOfLayer: Strange error when adding rest ' + trest.toString());
            LogWarning('   Line: ' + trest.getLineNumber() + ', Field: ' + trest.getFieldNumber());
          }
        }

        for (let z = 0; z < layerdata.length; ++z) {
          const tok = layerdata[z];
          if (tok === null) continue;
          // Don't look at first item in full-measure rest if it is a barline. This is
          // to prevent text directions for previous measure being duplicated at the
          // end of the mesure. Disallowing initial measure token should be ok.
          if (z === 0 && tok.isBarline()) continue;

          this.processDirections(tok, staffindex);

          if (tok.isInterpretation()) {
            this.handlePedalMark(tok);
          }
        }
      }

      // Basic compensation for clef change (can be improved later):
      let lastnote: HTp = null;
      for (const tok of layerdata) {
        if (tok === null) continue;
        if (tok.isData() && !tok.isNull()) {
          lastnote = tok;
        }
        if (!tok.isClef()) continue;
        if (tok.getDurationFromBarline().isPositive()) {
          // only insert a clef change after the whole-note rest if the clef change
          // is not really an initial clef.
          this.insertClefElement(elements, pointers, tok, lastnote);
        }
      }

      // check for fermatas to be placed on next barline
      if (layerindex === 0 && layerdata.length > 0) {
        const back = layerdata[layerdata.length - 1];
        if (back !== null && back.at(0) === '=') {
          if (back.toString().indexOf(';') !== -1) this.addFermata(back, null);
          if (back.toString().indexOf(',') !== -1) this.addBreath(back, null);
        }
      }

      // probably better to mark the rest in Humdrum data as a full-measure rest
      // here, and then process the measure as normal below.
      return true;
    }
    // C++ layerdata is std::vector<hum::HTp> but storeStaffLayerTokensForMeasure
    // only stores real tokens; make that invariant explicit (rule 12).
    const beamLayer: HTok[] = [];
    for (const t of layerdata) {
      if (t === null) throw new Error('HumdrumInput::fillContentsOfLayer: null token in layer data');
      beamLayer.push(t);
    }
    const tgs: HumdrumBeamAndTuplet[] = [];
    this.prepareBeamAndTupletGroups(tgs, beamLayer);
    this.fixLargeTuplets(tgs);
    if (this.m_debug) this.printGroupInfo(tgs);
    this.m_tupletscaling = new HumNum(1);

    // C++ fillContentsOfLayer tracks the last real note/rest; insertClefElement
    // uses it to decide whether a clef is a genuine change or an @sameas candidate.
    let lastnote: HTp = null;
    // Used for splitting a rest across a clef.
    let restSplitToken: HTp = null;
    let remainingSplitDur = new HumNum(0);
    for (let i = 0; i < layerdata.length; ++i) {
      const token = layerdata[i];
      if (token === null) continue;
      if (prespace[i] !== undefined && prespace[i].isPositive()) {
        this.addSpaceToStack(elements, pointers, prespace[i], 'straddle');
      }
      if (token.isData() && !token.isNull()) lastnote = token;
      if (token.isData() && token.isNull()) {
        this.processDirections(token, staffindex);
        continue;
      }
      if (token.isInterpretation()) {
        this.processInterpretationStuff(token, staffindex, lastnote);
        if (staffindex === 0 && token.toString().startsWith('*tscale:')) {
          const hree = new HumRegex();
          if (hree.search(token.toString(), '^\\*tscale:(\\d+)/(\\d+)$')) {
            const valuetop = hree.getMatchInt(1);
            const valuebot = hree.getMatchInt(2);
            if (valuetop > 0 && valuebot > 0) {
              const value = new HumNum(valuetop);
              value.div(new HumNum(valuebot));
              this.m_localTempoScaling.mul(value);
              const tempo = new Tempo();
              tempo.SetMidiBpm(this.m_midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
              this.setLocationId(tempo, token);
              const tstamp = this.getMeasureTstamp(token, 0);
              tempo.SetTstamp(tstamp.getFloat());
              this.addChildMeasureOrSection(tempo);
            }
          }
          else if (hree.search(token.toString(), '^\\*tscale:(\\d+)$')) {
            const value = new HumNum(hree.getMatchInt(1));
            if (value.greater(new HumNum(0))) {
              this.m_localTempoScaling.mul(value);
              const tempo = new Tempo();
              tempo.SetMidiBpm(this.m_midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
              this.setLocationId(tempo, token);
              const tstamp = this.getMeasureTstamp(token, 0);
              tempo.SetTstamp(tstamp.getFloat());
              this.addChildMeasureOrSection(tempo);
            }
          }
        }
        if (!this.m_mens) {
          this.handleOttavaMark(token);
          this.handleLigature(token);
          this.handleColoration(token);
          this.handleTempoChange(token);
          this.handlePedalMark(token);
          this.handleStaffStateVariables(token);
          this.handleStaffDynamStateVariables(token);
        }
        if ((this.m_staffstates[staffindex]?.verse ?? false)) {
          this.checkForVerseLabels(token);
        }
        this.handleCustos(elements, pointers, layerdata, i);
        if (token.toString() === '*rep') {
          const oldi = i;
          i = this.insertRepetitionElement(elements, pointers, layerdata, i);

          // Now go back and insert dynamics for the removed notes:
          for (let j = oldi; j <= i; j++) {
            const ltok = layerdata[j];
            if (ltok === null || !ltok.isData()) continue;
            this.processDynamics(ltok, staffindex);
            this.processDirections(ltok, staffindex);
          }
        }
        const notAtStart = this.isNotAtStartOfMeasure(layerdata, i);
        let forceClefChange = false;
        if (token.isClef() || token.toString() === '*') {
          if (!(token.isMensLike() && notAtStart)) {
            if (token.getValueBool('auto', 'clefChange')) forceClefChange = true;
          }
        }
        if (forceClefChange || notAtStart) {
          if (token.isClef()) {
            let subtrack = token.getSubtrack();
            if (subtrack) subtrack--;
            const durFromStart = token.getDurationFromStart();
            const durFromBarline = token.getDurationFromBarline();
            let clef: Clef | null = null;
            if (durFromStart.greater(new HumNum(0)) && durFromBarline.isZero() && !notAtStart) {
              // This clef will be inserted into a staffDef for the current
              // staff, which is handled elsewhere.
            }
            else {
              // Store in the layer as a cautionary staff.
              clef = this.insertClefElement(elements, pointers, token, lastnote);
            }
            if (clef !== null) {
              if (token.toString().indexOf('yy') !== -1) clef.SetVisible(BOOLEAN_false);
              this.setLocationId(clef as never, token);
              const diff = layerindex - subtrack;
              if (diff > 0) {
                const id = clef.GetID() + String.fromCharCode('a'.charCodeAt(0) + diff);
                clef.SetID(id);
              }
              if (restSplitToken !== null) {
                // Add the second part of a split invisible rest.
                const irest = new Space();
                this.setLocationId(irest as never, restSplitToken);
                const irestId = irest.GetID() + 'b';
                irest.SetID(irestId);
                this.appendElement(elements, pointers, irest as never);
                this.setRhythmFromDuration(irest as never, remainingSplitDur);
                restSplitToken = null;
                remainingSplitDur = new HumNum(0);
              }
            }
          }
          else if (token.isNull()) {
            const prevTok: HTp = i > 0 ? layerdata[i - 1] : null;
            if (prevTok !== null && token.getLineIndex() === prevTok.getLineIndex()) {
              // do nothing: duplicate layer clefs are handled elsewhere
            }
            else {
              // duplicate clef changes in secondary layers
              const xtrack = token.getTrack();
              let tok: HTp = token.getPreviousFieldToken();
              while (tok !== null) {
                if (tok.getTrack() === xtrack && tok.isClef()) {
                  const clef = this.insertClefElement(elements, pointers, tok, lastnote);
                  if (clef !== null) this.setLocationId(clef as never, token);
                  break;
                }
                tok = tok.getPreviousFieldToken();
              }
            }
          }
        }
        continue;
      }
      if (!token.isData() || token.isNull()) continue;

      if (token.isBarline() && !token.allSameBarlineStyle()) {
        // display a barline local to the staff
        if (i !== 0) this.addBarLineElement(token, elements, pointers);
        // C++ falls through: a local barline is emitted in addition to any
        // surrounding group handling.
      }

      this.handleGroupStarts(tgs, elements, pointers, beamLayer, i);

      if (token.isRest()) {
        if (token.toString().indexOf('yy') !== -1 && this.m_signifiers.irest_color === ''
          && this.m_signifiers.space_color === '') {
          // Invisible rest (or note which should be invisible).
          const nextTok: HTp = i < layerdata.length - 1 ? layerdata[i + 1] : null;
          if (nextTok !== null && nextTok.isClef()) {
            const dur = token.getDuration();
            const ndur = nextTok.getDurationFromStart().sub(token.getDurationFromStart());
            const remainingDur = dur.sub(ndur);
            if (ndur.less(dur) && this.isExpressibleDuration(ndur)
              && this.isExpressibleDuration(remainingDur)) {
              // Split the space so an intervening clef can be positioned.
              const irest = new Space();
              this.setLocationId(irest as never, token);
              this.appendElement(elements, pointers, irest as never);
              this.setRhythmFromDuration(irest as never, ndur);
              this.processSlurs(token);
              this.processPhrases(token);
              this.processDynamics(token, staffindex);
              this.processDirections(token, staffindex);
              restSplitToken = token;
              remainingSplitDur = remainingDur;
            }
            else {
              const irest = new Space();
              this.setLocationId(irest as never, token);
              this.appendElement(elements, pointers, irest as never);
              this.convertRhythm(irest as never, token as never, -1);
              this.processSlurs(token);
              this.processPhrases(token);
              this.processDynamics(token, staffindex);
              this.processDirections(token, staffindex);
            }
          }
          else {
            const irest = new Space();
            this.setLocationId(irest as never, token);
            this.appendElement(elements, pointers, irest as never);
            this.convertRhythm(irest as never, token as never, -1);
            this.processSlurs(token);
            this.processPhrases(token);
            this.processDynamics(token, staffindex);
            this.processDirections(token, staffindex);
          }
        }
        else {
          // C++ fillContentsOfLayer: a visible rest followed by a clef is
          // split so the clef can be positioned (rest keeps visual duration
          // with pre-clef gestural duration, plus an invisible post-clef space).
          const nextTok2: HTp = i < layerdata.length - 1 ? layerdata[i + 1] : null;
          if (nextTok2 !== null && nextTok2.isClef()) {
            const dur = token.getDuration();
            const ndur = nextTok2.getDurationFromStart().sub(token.getDurationFromStart());
            const remainingDur = dur.sub(ndur);
            if (ndur.less(dur) && this.isExpressibleDuration(ndur)
              && this.isExpressibleDuration(remainingDur)) {
              const rest1 = new Rest();
              this.setLocationId(rest1 as never, token);
              this.appendElement(elements, pointers, rest1 as never);
              this.setVisualAndGesturalRhythmFromDuration(rest1 as never, dur, ndur);
              this.processSlurs(token);
              this.processPhrases(token);
              this.processDynamics(token, staffindex);
              this.processDirections(token, staffindex);
              restSplitToken = token;
              remainingSplitDur = remainingDur;
            }
            else {
              const restDur = Convert.recipToDuration(token.toString());
              if (restDur.equals(duration) && restDur.equals(this.m_timesigdurs[startline] ?? new HumNum(-1))) {
                const mrest = new MRest();
                this.setLocationId(mrest as never, token);
                this.appendElement(elements, pointers, mrest as never);
                this.verticalRest(mrest as never, token.toString());
              }
              else {
                const rest = new Rest();
                this.setLocationId(rest, token);
                this.appendElement(elements, pointers, rest);
                this.convertRest(rest as never, token, -1, staffindex);
                const line = token.getLineIndex();
                const field = token.getFieldIndex();
                this.colorRest(rest, token.toString(), line, field);
                this.verticalRest(rest, token.toString());
              }
              this.processSlurs(token);
              this.processPhrases(token);
              this.processDynamics(token, staffindex);
              this.processDirections(token, staffindex);
            }
          }
          else {
            const restDur = Convert.recipToDuration(token.toString());
            if (restDur.equals(duration) && restDur.equals(this.m_timesigdurs[startline] ?? new HumNum(-1))) {
              const mrest = new MRest();
              this.setLocationId(mrest as never, token);
              this.appendElement(elements, pointers, mrest as never);
              this.verticalRest(mrest as never, token.toString());
              // WASM parity: whole-measure rests still emit attached
              // slurs/phrases/dynamics/directions (C++ source omits these).
              this.processSlurs(token);
              this.processPhrases(token);
              this.processDynamics(token, staffindex);
              this.processDirections(token, staffindex);
            }
            else {
              const rest = new Rest();
              this.setLocationId(rest, token);
              this.appendElement(elements, pointers, rest);
              this.convertRest(rest as never, token, -1, staffindex);
              const line = token.getLineIndex();
              const field = token.getFieldIndex();
              this.colorRest(rest, token.toString(), line, field);
              this.verticalRest(rest, token.toString());
            }
            this.processSlurs(token);
            this.processPhrases(token);
            this.processDynamics(token, staffindex);
            this.processDirections(token, staffindex);
          }
        }
      }
      else if (token.isChord()) {
        const chord = new Chord();
        this.setLocationId(chord as never, token);
        this.appendElement(elements, pointers, chord);
        // C++ order: processChordSignifiers -> convertChord -> checkForFingeredHarmonic.
        this.processChordSignifiers(chord, token, staffindex);
        this.convertChord(chord as never, token, staffindex);
        this.checkForFingeredHarmonic(chord, token);
        // C++ order: processSlurs/Phrases/Dynamics before stem/articulations
        // so spanning elements precede fermatas in measure child order.
        this.processSlurs(token);
        this.processPhrases(token);
        this.processDynamics(token, staffindex);
        this.assignAutomaticStem(chord, token, staffindex);
        this.addArticulations(chord, token);
        this.addOrnaments(chord, token);
        this.addArpeggio(chord, token);
        this.processDirections(token, staffindex);
      }
      else if (token.isNote()) {
        const note = new Note();
        this.appendElement(elements, pointers, note);
        this.setLocationId(note, token);
        this.convertNote(note, token, 0, staffindex, -1);
        // C++ order: processSlurs/Phrases/Dynamics before stem/articulations.
        this.processSlurs(token);
        this.processPhrases(token);
        this.processDynamics(token, staffindex);
        this.assignAutomaticStem(note, token, staffindex);
        if (this.m_signifiers.nostem !== '' && token.toString().indexOf(this.m_signifiers.nostem) !== -1) {
          note.SetStemVisible(BOOLEAN_false);
        }
        if (this.m_signifiers.hairpinAccent !== '' && token.toString().indexOf(this.m_signifiers.hairpinAccent) !== -1) {
          this.addHairpinAccent(token);
        }
        if (this.m_signifiers.cuesize !== '' && token.toString().indexOf(this.m_signifiers.cuesize) !== -1) {
          note.SetCue(BOOLEAN_true);
        }
        else if (this.m_staffstates[staffindex]?.cue_size?.[this.m_currentlayer]) {
          note.SetCue(BOOLEAN_true);
        }
        this.addArticulations(note, token);
        this.addOrnaments(note, token);
        this.addArpeggio(note, token);
        this.processDirections(token, staffindex);
      }

      this.handleGroupEnds(tgs[i], elements, pointers);
    }
    // C++ fillContentsOfLayer: layer rhythmically too short -> filler space.
    if (prespace.length > layerdata.length) {
      if (prespace[prespace.length - 1].isPositive()) {
        this.addSpaceToStack(elements, pointers, prespace[prespace.length - 1], 'filler');
      }
    }
    const lasttok = layerdata[layerdata.length - 1];
    if (layerindex === 0 && lasttok !== null && lasttok.isBarline()) {
      if (lasttok.toString().indexOf(';') !== -1) this.addFermata(lasttok, null);
      if (lasttok.toString().indexOf(',') !== -1) this.addBreath(lasttok, null);
      // C++ fillContentsOfLayer (iohumdrum.cpp ~14774): the last measure's
      // rptend is missed by inline processing, so check the final token.
      const bstr = lasttok.toString();
      if (bstr.indexOf(':|') !== -1 || bstr.indexOf(':!') !== -1) {
        if (this.m_measure !== null) this.m_measure.SetRight(BARRENDITION_rptend);
      }
    }
    return true;
  }

  public getStaffNumForSpine(token: HTp): number {
    let current = token;
    const hre = new HumRegex();
    while (current !== null && !current.isData()) {
      if (current.isInterpretation()) {
        if (hre.search(current.toString(), '^\\*staff(\\d+)')) return hre.getMatchInt(1);
      }
      current = current.getNextToken();
    }
    return -1000;
  }
  public checkIfReversedSpineOrder(staffstarts: HTp[]): boolean {
    const staffnums: number[] = staffstarts.map((st) =>
      (st !== null && st.isStaffLike()) ? this.getStaffNumForSpine(st) : -1000);
    let lastnum = -1000;
    let counter = 0;
    for (const n of staffnums) {
      if (n < 0) continue;
      counter++;
      if (lastnum < 0) { lastnum = n; continue; }
      if (lastnum > n) return true;
      lastnum = n;
    }
    return counter === 0;
  }
  public prepareSections(): void {
    const sectionlabels = this.m_sectionlabels;
    const numberlesslabels = this.m_numberlesslabels;
    const infile = this.m_infiles.at(0);
    sectionlabels.length = 0;
    numberlesslabels.length = 0;
    for (let i = 0; i < infile.getLineCount(); ++i) { sectionlabels.push(null); numberlesslabels.push(null); }
    let secname: HTp = null;
    let nonumname: HTp = null;
    for (let i = 0; i < infile.getLineCount(); ++i) {
      sectionlabels[i] = secname;
      numberlesslabels[i] = nonumname;
      if (!infile.at(i).isInterpretation()) continue;
      if (infile.token(i, 0)?.compare(0, 2, '*>') !== 0) continue;
      if ((infile.token(i, 0)?.toString() ?? '').indexOf('[') !== -1) continue;
      secname = infile.token(i, 0);
      sectionlabels[i] = secname;
      for (let j = i - 1; j >= 0; j--) {
        if (infile.at(j).isData()) break;
        sectionlabels[j] = sectionlabels[i];
      }
      const back = secname === null ? '' : secname.toString().slice(-1);
      if (back < '0' || back > '9') {
        nonumname = secname;
        sectionlabels[i] = nonumname;
        for (let j = i - 1; j >= 0; j--) {
          if (infile.at(j).isData()) break;
          numberlesslabels[j] = numberlesslabels[i];
        }
      }
    }
    for (let i = numberlesslabels.length - 2; i >= 0; i--) {
      if (numberlesslabels[i] === null && numberlesslabels[i + 1] !== null) numberlesslabels[i] = numberlesslabels[i + 1];
    }
  }
  public parseSignifiers(infile: HumdrumFile): void {
    const hre = new HumRegex();
    const refs = infile.getReferenceRecords();
    const sig = this.m_signifiers;
    for (const ref of refs) {
      if (ref === null) continue;
      const key = ref.getReferenceKey();
      const value = ref.getReferenceValue();
      const eqpos = value.substr(0, 8).indexOf('=');
      const afterequals = eqpos !== -1 ? value.substr(eqpos + 1) : value;
      if (eqpos === -1 && key === 'RDF**kern') {
        if (value.indexOf('show space') !== -1) {
          sig.space_color = hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?') ? hre.getMatch(1) : 'hotpink';
        }
        if (value.indexOf('show invisible rest') !== -1) {
          sig.irest_color = hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?') ? hre.getMatch(1) : 'chartreuse';
        }
        if (value.indexOf('show implicit space') !== -1) {
          sig.ispace_color = hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?') ? hre.getMatch(1) : 'blueviolet';
        }
        if (value.indexOf('show recip space') !== -1) {
          sig.rspace_color = hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?') ? hre.getMatch(1) : 'royalblue';
        }
        continue;
      }
      let signifier = '';
      if (hre.search(value, '^\\s*([^\\s=]+)\\s*=')) signifier = hre.getMatch(1);
      else continue;
      if ((key === 'RDF**silbe' || key === 'RDF**text') && hre.search(value, 'marked text|matched text')) {
        sig.textmark.push(signifier);
        sig.textcolor.push(hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?') ? hre.getMatch(1) : 'red');
      }
      else if (key === 'RDF**dynam') {
        if (signifier === '>') {
          if (hre.search(afterequals, '^\\s*"\\s*([^"]+)\\s*"')) sig.decresctext = hre.getMatch(1);
          else if (hre.search(afterequals, '^\\s*([^\\s]+)')) sig.decresctext = hre.getMatch(1);
          if (hre.search(afterequals, 'fontstyle\\s*=\\s*"?\\s*([^"\\s]+)\\s*"?')) {
            sig.decrescfontstyle = hre.getMatch(1);
            if (sig.crescfontstyle === 'italic') sig.crescfontstyle = '';
          }
        }
        else if (signifier === '<') {
          if (hre.search(afterequals, '^\\s*"\\s*([^"]+)\\s*"')) sig.cresctext = hre.getMatch(1);
          else if (hre.search(afterequals, '^\\s*([^\\s]+)')) sig.cresctext = hre.getMatch(1);
          if (hre.search(afterequals, 'fontstyle\\s*=\\s*"?\\s*([^"\\s]+)\\s*"?')) {
            sig.crescfontstyle = hre.getMatch(1);
            if (sig.crescfontstyle === 'italic') sig.crescfontstyle = '';
          }
        }
      }
      if (key === 'RDF**mens') {
        if (hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?')) {
          sig.mens_mark.push(signifier);
          sig.mens_mcolor.push(hre.getMatch(1));
          sig.mens_markdir.push(hre.search(value, 'text\\s*=\\s*"?([^"]+)"?') ? hre.getMatch(1) : '');
        }
        else if (hre.search(value, 'marked note|matched note')) {
          sig.mens_mark.push(signifier);
          sig.mens_mcolor.push('red');
          sig.mens_markdir.push(hre.search(value, 'text\\s*=\\s*"?([^"]+)"?') ? hre.getMatch(1) : '');
        }
        if (value.indexOf('editorial accidental', eqpos) !== -1) {
          sig.editaccMens.push(signifier);
          sig.edittypeMens.push(this.editTypeOf(value));
        }
        if (value.indexOf('terminal long', eqpos) !== -1 || value.indexOf('long note', eqpos) !== -1) {
          sig.mensTerminalLong = signifier;
        }
        if (value.indexOf('terminal breve', eqpos) !== -1 || value.indexOf('breve note', eqpos) !== -1) {
          sig.mensTerminalBreve = signifier;
        }
      }
      if (key !== 'RDF**kern') continue;
      if (value.indexOf('no stem', eqpos) !== -1) sig.nostem = signifier;
      if (value.indexOf('cue size', eqpos) !== -1) sig.cuesize = signifier;
      if (value.indexOf('hairpin accent', eqpos) !== -1) sig.hairpinAccent = signifier;
      if (value.indexOf('vertical stroke', eqpos) !== -1) sig.verticalStroke = signifier;
      if (value.indexOf('l.h. pizz', eqpos) !== -1 || value.indexOf('left hand pizz', eqpos) !== -1
        || value.indexOf('left-hand pizz', eqpos) !== -1 || value.indexOf('lefthand pizz', eqpos) !== -1) {
        sig.lhpizz = signifier;
      }
      if (value.indexOf('tremolo', eqpos) !== -1) sig.tremolo = signifier;
      if (value.indexOf('terminal long', eqpos) !== -1 || value.indexOf('long note', eqpos) !== -1) {
        sig.kernTerminalLong = signifier;
      }
      if (value.indexOf('terminal breve', eqpos) !== -1 || value.indexOf('breve note', eqpos) !== -1) {
        sig.kernTerminalBreve = signifier;
      }
      if (value.indexOf('above', eqpos) !== -1) sig.above = signifier;
      if (value.indexOf('below', eqpos) !== -1) sig.below = signifier;
      if (value.indexOf('editorial accidental', eqpos) !== -1) {
        sig.editaccKern.push(signifier);
        sig.edittypeKern.push(this.editTypeOf(value));
      }
      else if (hre.search(value, 'phrase')) {
        if (value.indexOf('none') !== -1) sig.phrase_style = 'none';
        else if (value.indexOf('brack') !== -1) sig.phrase_style = 'brack';
        else if (value.indexOf('dot') !== -1) sig.phrase_style = 'dot';
        else if (value.indexOf('dash') !== -1) sig.phrase_style = 'dash';
        if (value.indexOf('slur') !== -1) sig.phrase_slur = 'slur';
        if (hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?')) sig.phrase_color = hre.getMatch(1);
      }
      else if (hre.search(value, 'color\\s*=\\s*"?([^"\\s]+)"?')) {
        sig.mark.push(signifier);
        sig.mcolor.push(hre.getMatch(1));
        sig.markdir.push(hre.search(value, 'text\\s*=\\s*"?([^"]+)"?') ? hre.getMatch(1) : '');
      }
      else if (hre.search(value, 'marked note|matched note')) {
        sig.mark.push(signifier);
        sig.mcolor.push('red');
        sig.markdir.push(hre.search(value, 'text\\s*=\\s*"?([^"]+)"?') ? hre.getMatch(1) : '');
      }
    }
  }
  private editTypeOf(value: string): string {
    if (value.indexOf('brack') !== -1) return value.indexOf('up') !== -1 ? 'brack-up' : 'brack';
    if (value.indexOf('paren') !== -1) return value.indexOf('up') !== -1 ? 'paren-up' : 'paren';
    if (value.indexOf('none') !== -1) return 'none';
    return '';
  }
  public analyzeVerseColor(infile: HumdrumFile): void {
    for (const start of infile.getSpineStartList()) {
      if (start === null || !start.isDataType('**text')) continue;
      this.analyzeVerseColorSpine(start);
    }
  }
  public analyzeVerseColorSpine(token: HTp): void {
    let current = token;
    let color = '';
    const hre = new HumRegex();
    const isBlack = (c: string): boolean => c === 'black' || c === '#000' || c === '#000000';
    while (current !== null) {
      if (current.isInterpretation()) {
        if (hre.search(current.toString(), '^\\*color:\\s*([^\\s]+)')) {
          color = hre.getMatch(1);
          if (isBlack(color)) color = '';
        }
        else if (hre.search(current.toString(), '^\\*color:')) color = '';
      }
      if (color === '') { current = current.getNextToken(); continue; }
      if (!current.isData() || current.isNull()) { current = current.getNextToken(); continue; }
      const localColor = current.getLayoutParameter('LY', 'color');
      if (localColor !== '') {
        if (!isBlack(localColor)) current.setValue('auto', 'color', localColor);
      }
      else current.setValue('auto', 'color', color);
      current = current.getNextToken();
    }
  }
  public analyzeDefaultLayoutStyles(infile: HumdrumFile): void {
    const hre = new HumRegex();
    const prefix = '!!!LO-style:';
    for (let i = 0; i < infile.getLineCount(); i++) {
      if (infile.at(i).hasSpines()) continue;
      if (infile.at(i).compare(0, prefix.length, prefix) !== 0) continue;
      const rest = infile.at(i).toString().substr(prefix.length);
      const pieces: string[] = [];
      hre.split(pieces, rest, ':');
      if (pieces.length === 0) continue;
      const category = pieces[0];
      this.m_layoutDefaultStyles.delete(category);
      this.m_layoutDefaultStyles.set(category, new Map());
      const table = this.m_layoutDefaultStyles.get(category)!;
      for (let j = 1; j < pieces.length; j++) {
        if (pieces[j] === '' || pieces[0] === '=') continue;
        if (hre.search(pieces[j], '^([^=]+)=(.*)$')) {
          const key = hre.getMatch(1);
          const value = hre.replaceDestructive(hre.getMatch(2), '&colon;', ':', 'g');
          table.set(key, value);
        }
        else table.set(pieces[j], '1');
      }
    }
  }
  public getDefaultLayoutParameter(category: string, parameter: string): string {
    const cat = this.m_layoutDefaultStyles.get(category);
    if (cat === undefined) return '';
    return cat.get(parameter) ?? '';
  }
  public hideTerminalBarlines(infile: HumdrumFile): void {
    // C++ walks strands; spine walks cover the same ties (strands deferred).
    for (const stok of infile.getSpineStartList()) {
      if (stok === null || !stok.isKernLike()) continue;
      let tok: HTp = stok;
      while (tok !== null) {
        if (tok.isData() && !tok.isNull() && tok.toString().indexOf('[') !== -1) {
          const s = tok.toString();
          const sig = this.m_signifiers;
          const want =
            (sig.kernTerminalLong !== '' && s.indexOf(sig.kernTerminalLong) !== -1)
            || (sig.kernTerminalBreve !== '' && s.indexOf(sig.kernTerminalBreve) !== -1)
            || (sig.mensTerminalLong !== '' && s.indexOf(sig.mensTerminalLong) !== -1)
            || (sig.mensTerminalBreve !== '' && s.indexOf(sig.mensTerminalBreve) !== -1);
          if (want) this.hideBarlinesInTiedGroup(tok);
        }
        tok = tok.getNextToken();
      }
    }
  }
  public hideBarlinesInTiedGroup(startnote: HTp): void {
    if (startnote === null || startnote.toString().indexOf('[') === -1) return;
    let current: HTp = startnote;
    while (current !== null) {
      if (current.isBarline()) current.setText(current.toString() + '-');
      else if (current.isData() && current.toString().indexOf(']') !== -1) {
        if (current.toString().indexOf(';') !== -1 && startnote.toString().indexOf(';') === -1) {
          startnote.setText(startnote.toString() + ';');
        }
        break;
      }
      current = current.getNextToken();
    }
  }
  private getNumericLabel(spinestart: HTp, prefix: string, len: number): number {
    let tok = spinestart;
    while (tok !== null) {
      if (tok.isData()) break;
      if (tok.isInterpretation() && tok.compare(0, len, prefix) === 0 && tok.toString().length > len) {
        const ch = tok.toString()[len];
        if (ch >= '0' && ch <= '9') return Number.parseInt(tok.toString().substr(len), 10);
      }
      tok = tok.getNextToken();
    }
    return 0;
  }
  /** C++ HumdrumInput::handleStaffStateVariables: boolean switches and small
   *  staff-level state carried by interpretation tokens (tuplet/artic/tremolo/
   *  cue/stem/acclev/notehead/half-stem/key-cancellation). */
  public handleStaffStateVariables(token: HTp): void {
    if (token === null) return;
    const staffindex = this.m_currentstaff - 1;
    const layernum = this.m_currentlayer;
    const ss = this.m_staffstates;
    if (staffindex < 0 || staffindex >= ss.length) return;
    const value = token.toString();
    const st = ss[staffindex];

    if (value === '*Xbeamtup') st.suppress_tuplet_number = true;
    else if (value === '*beamtup') st.suppress_tuplet_number = false;
    if (value === '*Xbrackettup') st.suppress_tuplet_bracket = true;
    else if (value === '*brackettup') st.suppress_tuplet_bracket = false;

    if (value === '*Xartic' || value.substring(0, 8) === '*Xartic:') st.suppress_articulations = true;
    else if (value === '*artic' || value.substring(0, 7) === '*artic:') st.suppress_articulations = false;

    if (value === '*Xtuplet') st.suppress_tuplet_number = true;
    else if (value.substring(0, 7) === '*tuplet') st.suppress_tuplet_number = false;

    if (value === '*Xtremolo') st.tremolo = false;
    else if (value === '*tremolo') { st.tremolo = true; this.m_hasTremolo = true; }

    if (value === '*Xcue') st.cue_size[layernum] = false;
    else if (value === '*cue') st.cue_size[layernum] = true;

    else if (value.substring(0, 5) === '*stem') this.storeStemInterpretation(value, staffindex, token.getSubtrack());
    else if (value.substring(0, 6) === '*Xstem') this.storeStemInterpretation(value, staffindex, token.getSubtrack());

    else if (value.indexOf('acclev') !== -1) this.storeAcclev(value, staffindex);

    else if (value === '*2\\left') st.righthalfstem = false;
    else if (value === '*2\\right') st.righthalfstem = true;

    // Key cancellation option is currently global to all staves.
    if (value === '*Xkcancel') this.m_showCautionaryKeysig = false;
    else if (value === '*kcancel') this.m_showCautionaryKeysig = true;

    if (value.substring(0, 6) === '*head:') {
      st.m_notehead = '';
      for (let i = 6; i < value.length; ++i) {
        if (value[i] === ':') {
          // A pitch parameter may follow the shape, ignored for now.
          break;
        }
        st.m_notehead += value[i];
      }
    } else if (value === '*Xhead') {
      st.m_notehead = 'regular';
    }
  }

  /** C++ HumdrumInput::handleStaffDynamStateVariables: *above/*below/*center
   *  switches read from the **dynam spine next to the current kern spine. */
  public handleStaffDynamStateVariables(token: HTp): void {
    if (token === null) return;
    const staffindex = this.m_currentstaff - 1;
    const ss = this.m_staffstates;
    if (staffindex < 0 || staffindex >= ss.length) return;
    const st = ss[staffindex];

    let tok = token.getNextFieldToken();
    while (tok !== null && !tok.isKernLike()) {
      if (!tok.isDataType('**dynam')) {
        tok = tok.getNextFieldToken();
        continue;
      }
      const v = tok.toString();
      if (v === '*above') {
        st.m_dynampos = 1;
        st.m_dynamstaffadj = 0;
      } else if (v === '*above:2') {
        st.m_dynampos = 1;
        st.m_dynamstaffadj = -1;
      } else if (v === '*below:2') {
        st.m_dynampos = -1;
        st.m_dynamstaffadj = -1;
      } else if (v === '*below') {
        st.m_dynampos = -1;
        st.m_dynamstaffadj = 0;
      } else if (v === '*center') {
        st.m_dynampos = 0;
        st.m_dynamposdefined = true;
        st.m_dynamstaffadj = 0;
      } else if (v === '*center:2') {
        // centering on organ staff between pedal and bottom of grand staff.
        st.m_dynampos = 0;
        st.m_dynamstaffadj = -1;
        st.m_dynamposdefined = true;
      }
      tok = tok.getNextFieldToken();
    }
  }

  // C++ HumdrumInput::storeAcclev: *acclev:<digit|YY|Y|yy|y> sets the accidental
  // display level; *acclev / *acclev: / *Xacclev reset it to 0.
  public storeAcclev(value: string, staffindex: number): void {
    if (value.indexOf('acclev') === -1) return;

    const ss = this.m_staffstates;
    if (ss[staffindex] === undefined) return;

    if (value.length > 8 && value.substring(0, 8) === '*acclev:') {
      const state = value.substring(8);
      if (state !== '') {
        const first = state[0];
        if (first >= '0' && first <= '9') {
          ss[staffindex].acclev = first.charCodeAt(0) - 48;
        }
        else if (state === 'YY') {
          ss[staffindex].acclev = 1;
        }
        else if (state === 'Y') {
          ss[staffindex].acclev = 2;
        }
        else if (state === 'yy') {
          ss[staffindex].acclev = 3;
        }
        else if (state === 'y') {
          ss[staffindex].acclev = 4;
        }
      }
    }
    else if (value === '*acclev:') {
      ss[staffindex].acclev = 0;
    }
    else if (value === '*acclev') {
      ss[staffindex].acclev = 0;
    }
    else if (value === '*Xacclev') {
      ss[staffindex].acclev = 0;
    }
  }
  // C++ HumdrumInput::storeStemInterpretation. The ending after `*stem:` is a
  // single character ('x' invisible, '/' forced up, '\' forced down, anything
  // else falls back to 'X'); `*stem` / `*Xstem` toggle whole-layer visibility
  // (all layers when the subtrack is 0).
  public storeStemInterpretation(line: string, staffindex: number, layernumber: number): void {
    if (line.indexOf('stem') === -1) return;

    const ss = this.m_staffstates[staffindex];
    // C++ vectors are pre-sized to 100; grow with the C++ defaults when a
    // caller hands over shorter arrays (synthetic state in tests).
    while (ss.stem_type.length <= layernumber) { ss.stem_type.push('X'); ss.stem_visible.push(true); }

    if (line.length >= 7 && line.substring(0, 6) === '*stem:') {
      const ending = line.substring(6);
      if (ending === 'x') ss.stem_type[layernumber] = 'x';
      else if (ending === '/') ss.stem_type[layernumber] = '/';
      else if (ending === '\\') ss.stem_type[layernumber] = '\\';
      else ss.stem_type[layernumber] = 'X';
    } else if (line === '*stem') {
      if (layernumber === 0) {
        for (let i = 0; i < ss.stem_visible.length; ++i) ss.stem_visible[i] = true;
      } else {
        ss.stem_visible[layernumber] = true;
      }
    } else if (line === '*Xstem') {
      if (layernumber === 0) {
        for (let i = 0; i < ss.stem_visible.length; ++i) ss.stem_visible[i] = false;
      } else {
        ss.stem_visible[layernumber] = false;
      }
    }
  }
  public scanStaffHeader(staffstart: HTp, staffnumber: number): {
    clef: string; keysig: string; timesig: string; metersig: string; transpose: string; itranspose: string;
  } {
    const out = { clef: '', keysig: '', timesig: '', metersig: '', transpose: '', itranspose: '' };
    const staffindex = staffnumber - 1;
    let part: HTp = staffstart;
    const hre = new HumRegex();
    while (part !== null && !(part.getLine()?.isData() ?? false)) {
      const s = part.toString();
      if (s.substr(0, 5) === '*clef') {
        if (out.clef !== '') {
          if (out.clef !== s && part.isKern()) {
            part.setValue('auto', 'clefChange', '1');
            this.markOtherClefsAsChange(part);
          }
        }
        else if (hre.search(s, '\\d') || s.indexOf('clefX') !== -1) out.clef = s;
      }
      else if (s.substr(0, 3) === '*k[') out.keysig = s;
      else if (s.substr(0, 4) === '*Trd') out.transpose = s;
      else if (s.substr(0, 5) === '*ITrd') out.itranspose = s;
      else if (s.substr(0, 5) === '*met(') {
        const close = s.lastIndexOf(')');
        if (close !== -1) out.metersig = s.substring(5, close);
      }
      else if (/^\*M\d+\/\d+/.test(s)) {
        const m = /^\*M(\d+)\/(\d+)/.exec(s);
        if (m !== null) {
          out.timesig = s;
          let top = Number.parseInt(m[1], 10);
          let bot = Number.parseInt(m[2], 10);
          if (bot === 0) { bot = 1; top *= 2; }
          this.m_staffstates[staffindex].meter_bottom = new HumNum(bot);
          this.m_staffstates[staffindex].meter_top = top;
        }
      }
      else if (s.indexOf('acclev') !== -1) this.storeAcclev(s, staffindex);
      else if (s.substr(0, 5) === '*stem' || s.substr(0, 6) === '*Xstem') {
        this.storeStemInterpretation(s, staffindex, part.getSubtrack());
      }
      part = part.getNextToken();
    }
    return out;
  }
  public markOtherClefsAsChange(clef: HTp): void {
    if (clef === null) return;
    const ctrack = clef.getTrack();
    let current = clef.getNextFieldToken();
    while (current !== null) {
      if (current.getTrack() !== ctrack) break;
      current.setValue('auto', 'clefChange', '1');
      current = current.getNextFieldToken();
    }
    current = clef.getPreviousFieldToken();
    while (current !== null) {
      if (current.getTrack() !== ctrack) break;
      current.setValue('auto', 'clefChange', '1');
      current = current.getPreviousFieldToken();
    }
  }
  public setTransposition(staffDef: StaffDef, transpose: string): void {
    const m = /^\*Trd(-?\d+)c(-?\d+)/.exec(transpose);
    if (m === null) return;
    staffDef.SetTransDiat(-Number.parseInt(m[1], 10));
    staffDef.SetTransSemi(-Number.parseInt(m[2], 10));
  }
  public setDynamicTransposition(staffindex: number, staff: StaffDef, itranspose: string): void {
    const m = /^\*ITrd(-?\d+)c(-?\d+)/.exec(itranspose);
    if (m === null) return;
    staff.SetTransDiat(-Number.parseInt(m[1], 10));
    staff.SetTransSemi(-Number.parseInt(m[2], 10));
    this.m_transpose[staffindex] = transToBase40(itranspose);
  }
  public getVisualKeySignature(keysigtok: HTp): HTp {
    if (keysigtok === null) return null;
    let current = keysigtok.getNextToken();
    while (current !== null && !current.isData()) {
      if (current.compare(0, 4, '*vk[') === 0) return current;
      current = current.getNextToken();
    }
    current = keysigtok.getPreviousToken();
    while (current !== null && !current.isData()) {
      if (current.compare(0, 4, '*vk[') === 0) return current;
      current = current.getPreviousToken();
    }
    return null;
  }
  public getKeySigElement(element: StaffDef): KeySig | null {
    const found = element.FindDescendantByType(ClassId.KEYSIG) as unknown as KeySig | null;
    if (found !== null && found !== undefined) return found;
    const keysig = new KeySig();
    element.AddChild(keysig);
    return keysig;
  }

  /** Alias matching C++ HumdrumInput::getKeySig (iohumdrum.cpp:21838). */
  public getKeySig(element: StaffDef): KeySig | null {
    return this.getKeySigElement(element);
  }

  public setKeySigStaffDef(
    staffindex: number, element: StaffDef, keysig: string, keysigtok: HTp, keytok: HTp, secondary: boolean,
  ): void {
    const vkeysigtok = this.getVisualKeySignature(keysigtok);
    const zkeysigtok = vkeysigtok !== null ? vkeysigtok : keysigtok;
    const ks = zkeysigtok !== null ? zkeysigtok.toString() : keysig;
    const visualType = vkeysigtok !== null;
    let keynum = this.getKeySignatureNumber(ks);
    if (staffindex >= 0 && staffindex < this.m_transpose.length) {
      keynum += base40IntervalToLineOfFifths(this.m_transpose[staffindex]);
    }
    const vrvkeysig = this.getKeySigElement(element);
    if (vrvkeysig === null) return;
    if (zkeysigtok !== null) this.setLocationId(vrvkeysig, zkeysigtok);
    if (visualType) vrvkeysig.SetType('visual-key-signature');
    if (keynum >= -7 && keynum <= 7) {
      if (keynum < 0) vrvkeysig.SetSig([-keynum, ACCIDENTAL_WRITTEN_f]);
      else if (keynum > 0) vrvkeysig.SetSig([keynum, ACCIDENTAL_WRITTEN_s]);
      else vrvkeysig.SetSig([0, ACCIDENTAL_WRITTEN_NONE]);
    }
    else {
      // Non-standard key signature: emit explicit <keyAccid> children (C++ 9467).
      this.prepareNonStandardKeySignature(vrvkeysig, ks, zkeysigtok);
      return;
    }
    if ((secondary && keynum === 0) || this.m_showCautionaryKeysig) {
      vrvkeysig.SetCancelaccid(CANCELACCID_before);
    }
    if (keytok === null) return;
    const hre = new HumRegex();
    if (!hre.search(keytok.toString(), '^\\*([a-gA-G])([#-]*):([a-z]{3})?$')) return;
    const letter = hre.getMatch(1);
    const accidental = hre.getMatch(2);
    const modeabbr = hre.getMatch(3);
    let mode = letter[0] >= 'A' && letter[0] <= 'Z' ? 'major' : 'minor';
    const modes: Record<string, string> = {
      dor: 'dorian', phr: 'phrygian', lyd: 'lydian', mix: 'mixolydian', aeo: 'aeolian', loc: 'locrian', ion: 'ionian',
    };
    if (modeabbr !== '' && modes[modeabbr] !== undefined) mode = modes[modeabbr];
    // C++ passes AttKeySigLog::StrToMode(mode); TS SetMode takes the numeric enum.
    vrvkeysig.SetMode(new AttConverterBase().StrToMode(mode));
    const pnames: Record<string, number> = {
      c: PITCHNAME_c, d: PITCHNAME_d, e: PITCHNAME_e, f: PITCHNAME_f,
      g: PITCHNAME_g, a: PITCHNAME_a, b: PITCHNAME_b,
    };
    vrvkeysig.SetPname(pnames[letter[0].toLowerCase()] ?? PITCHNAME_c);
    if (accidental === '-') vrvkeysig.SetAccid(ACCIDENTAL_GESTURAL_f);
    else if (accidental === '#') vrvkeysig.SetAccid(ACCIDENTAL_GESTURAL_s);
  }

  /** C++ HumdrumInput::prepareNonStandardKeySignature (iohumdrum.cpp:9562). Splits a
   *  non-standard key signature string into per-letter groups and emits one
   *  <keyAccid> per group with pname, optional octave, accidental, and bracket
   *  enclosure. Letters a-g start a new group; every other character is appended. */
  public prepareNonStandardKeySignature(vrvkeysig: KeySig | null, ks: string, _keysigtok: HTp): void {
    if (vrvkeysig === null) return;
    const pieces: string[] = [];
    for (let i = 0; i < ks.length; i++) {
      const c = ks[i];
      if (c >= 'a' && c <= 'g') pieces.push('');
      if (pieces.length === 0) continue;
      pieces[pieces.length - 1] += c;
    }
    for (const piece of pieces) {
      if (piece === '') continue;
      const kacc = new KeyAccid();
      vrvkeysig.AddChild(kacc);
      const pclass = piece.charCodeAt(0) - 0x61;
      switch (pclass) {
        case 0: kacc.SetPname(PITCHNAME_a); break;
        case 1: kacc.SetPname(PITCHNAME_b); break;
        case 2: kacc.SetPname(PITCHNAME_c); break;
        case 3: kacc.SetPname(PITCHNAME_d); break;
        case 4: kacc.SetPname(PITCHNAME_e); break;
        case 5: kacc.SetPname(PITCHNAME_f); break;
        case 6: kacc.SetPname(PITCHNAME_g); break;
      }
      for (let j = 0; j < piece.length; j++) {
        const c = piece[j];
        if (c >= '0' && c <= '9') {
          kacc.SetOct(Number.parseInt(c, 10));
          break;
        }
      }
      if (piece.includes('##')) kacc.SetAccid(ACCIDENTAL_WRITTEN_x);
      else if (piece.includes('--')) kacc.SetAccid(ACCIDENTAL_WRITTEN_ff);
      else if (piece.includes('#')) kacc.SetAccid(ACCIDENTAL_WRITTEN_s);
      else if (piece.includes('-')) kacc.SetAccid(ACCIDENTAL_WRITTEN_f);
      else if (piece.includes('n')) kacc.SetAccid(ACCIDENTAL_WRITTEN_n);
      else kacc.SetAccid(ACCIDENTAL_WRITTEN_n);
      if (piece.includes('X')) kacc.SetEnclose(ENCLOSURE_brack);
    }
  }

  public getMeterSigElement(element: StaffDef): MeterSig | null {
    const found = element.FindDescendantByType(ClassId.METERSIG) as unknown as MeterSig | null;
    if (found !== null && found !== undefined) return found;
    const msig = new MeterSig();
    element.AddChild(msig);
    return msig;
  }

  /** Alias matching C++ HumdrumInput::getMeterSig (iohumdrum.cpp:21821). */
  public getMeterSig(element: StaffDef): MeterSig | null {
    return this.getMeterSigElement(element);
  }

  /** C++ HumdrumInput::setKeySig (iohumdrum.cpp:9408, 9541). Exposes both the
   *  full 6-argument form (delegating to setKeySigStaffDef) and the 2-argument
   *  form taking (element, keysigtok) which strips any `*ok[` prefix to `*k[`. */
  public setKeySig(
    staffindexOrElement: number | StaffDef,
    elementOrTok: StaffDef | HTp,
    keysig?: string,
    keysigtok?: HTp,
    keytok?: HTp,
    secondary?: boolean,
  ): void {
    if (typeof staffindexOrElement !== 'number') {
      const element = staffindexOrElement;
      const tok = elementOrTok as HTp;
      const vrvkeysig = this.getKeySig(element);
      if (vrvkeysig === null) return;
      if (tok !== null) this.setLocationId(vrvkeysig, tok);
      let plainkey = tok !== null ? tok.toString() : '';
      plainkey = plainkey.replace(/^\*ok\[/, '*k[');
      this.setKeySigStaffDef(-1, element, plainkey, tok, null, false);
      return;
    }
    this.setKeySigStaffDef(
      staffindexOrElement,
      elementOrTok as StaffDef,
      keysig ?? '',
      keysigtok ?? null,
      keytok ?? null,
      secondary ?? false,
    );
  }
  public checkMeterSigParameters(msig: MeterSig, token: HTp): void {
    if (token === null) return;
    if (token.getLayoutParameter('TS', 'paren') !== '') msig.SetEnclose(ENCLOSURE_paren);
    else if (token.getLayoutParameter('TS', 'brack') !== '') msig.SetEnclose(ENCLOSURE_brack);
  }
  public setTimeSigStaffDef(
    part: StaffDef, timesig: string, metersig: string, partstart: HTp, timetok: HTp, metertok: HTp,
  ): void {
    if (partstart !== null && partstart.isMensLike()) return;
    const vrvmeter = this.getMeterSigElement(part);
    if (vrvmeter === null) return;
    this.checkMeterSigParameters(vrvmeter, timetok);
    if (timetok !== null) this.setLocationId(vrvmeter, timetok);
    if (metertok !== null && metertok.toString() === '*met()') vrvmeter.SetVisible(BOOLEAN_false);
    if (timetok !== null && timetok.toString().indexOf('yy') !== -1) vrvmeter.SetVisible(BOOLEAN_false);
    let mensuration = false;
    if (metersig.indexOf('C') !== -1 || metersig.indexOf('O') !== -1) mensuration = true;
    const hre = new HumRegex();
    let m = /^\*M(\d+)\/(\d+)%(\d+)/.exec(timesig);
    if (m !== null) {
      const bot = Number.parseInt(m[2], 10);
      const bot2 = Number.parseInt(m[3], 10);
      if (metersig === '3' && bot === 3 && bot2 === 2) {
        vrvmeter.SetCount([[3], MeterCountSign.None]);
        vrvmeter.SetUnit(1);
        vrvmeter.SetForm(METERFORM_num);
      }
      return;
    }
    m = /^\*M(\d+)\/(\d+)/.exec(timesig);
    if (m === null) return;
    const top = Number.parseInt(m[1], 10);
    const bot = Number.parseInt(m[2], 10);
    if (bot === 0) {
      if (mensuration) vrvmeter.SetVisible(BOOLEAN_false);
      vrvmeter.SetCount([[top * 2], MeterCountSign.None]);
      vrvmeter.SetUnit(1);
    }
    else if (mensuration) {
      vrvmeter.SetVisible(BOOLEAN_false);
      vrvmeter.SetCount([[top], MeterCountSign.None]);
      vrvmeter.SetUnit(bot);
    }
    else if (metersig === '3' || metersig === '2') {
      vrvmeter.SetCount([[Number.parseInt(metersig, 10)], MeterCountSign.None]);
      vrvmeter.SetUnit(bot);
      vrvmeter.SetForm(METERFORM_num);
    }
    else if (hre.search(metersig, '^(\\d+)$')) {
      const value = hre.getMatchInt(1);
      vrvmeter.SetCount([[value], MeterCountSign.None]);
      vrvmeter.SetUnit(bot > 0 ? bot : 4);
      vrvmeter.SetForm(METERFORM_num);
    }
    else {
      vrvmeter.SetCount([[top], MeterCountSign.None]);
      vrvmeter.SetUnit(bot);
    }
  }
  /** C++ HumdrumInput::storeOriginalClefMensurationKeyApp. The C++ body opens with
   *  `if ((1)) { return; }` ("currently deactivated (use modori filter to switch
   *  between modern and original clef/key/mensuration)"), so the port records the
   *  guard and leaves the dead body out. */
  public storeOriginalClefMensurationKeyApp(): void {
    // deactivated in C++; nothing to do.
    return;
  }

  /** C++ HumdrumInput::setTimeSig(ELEMENT, timesigtok, metersigtok, staffindex) —
   *  the token-based overload used for mid-movement changes. Also records the
   *  meter in the staff state (all staves when staffindex < 0). */
  public setTimeSigFromTokens(element: StaffDef, timesigtok: HTp, metersigtok: HTp, staffindex: number): void {
    if (timesigtok === null) {
      // Not allowing meter signatures without a time signature.
      return;
    }

    let metersig = '';
    if (metersigtok !== null) {
      const m0 = /met\((.*)\)/.exec(metersigtok.toString());
      if (m0 !== null) metersig = m0[1];
    }

    const t = timesigtok.toString();
    let count = -1;
    let unit = -1;
    let m = /^\*M(\d+)\/(\d+)%(\d+)/.exec(t);
    if (m !== null) {
      count = Number.parseInt(m[1], 10);
      const bot = Number.parseInt(m[2], 10);
      const bot2 = Number.parseInt(m[3], 10);
      if (metersig === '3' && bot === 3 && bot2 === 2) {
        const vrvmetersig = this.getMeterSigElement(element);
        if (vrvmetersig !== null) {
          vrvmetersig.SetCount([[3], MeterCountSign.None]);
          vrvmetersig.SetUnit(1);
          vrvmetersig.SetForm(METERFORM_num);
          this.checkMeterSigParameters(vrvmetersig, timesigtok);
        }
      }
    }
    else if ((m = /^\*M(\d+)\/(\d+)/.exec(t)) !== null) {
      count = Number.parseInt(m[1], 10);
      unit = Number.parseInt(m[2], 10);
      if (unit === 0) {
        // Breve time signature not possible in MEI, so change to whole note unit:
        count *= 2;
        unit = 1;
      }
      if (metersigtok === null) {
        const vrvmetersig = this.getMeterSigElement(element);
        if (vrvmetersig !== null) {
          vrvmetersig.SetCount([[count], MeterCountSign.None]);
          vrvmetersig.SetUnit(unit);
          this.checkMeterSigParameters(vrvmetersig, timesigtok);
        }
      }
      else if (metersigtok.toString() === '*met()') {
        unit = Number.parseInt(m[2], 10);
        const vrvmetersig = this.getMeterSigElement(element);
        if (vrvmetersig !== null) {
          vrvmetersig.SetCount([[Number.parseInt(m[1], 10)], MeterCountSign.None]);
          vrvmetersig.SetUnit(unit);
          vrvmetersig.SetVisible(BOOLEAN_false);
        }
      }
      else if (metersig === '3') {
        const vrvmetersig = this.getMeterSigElement(element);
        if (vrvmetersig !== null) {
          vrvmetersig.SetCount([[3], MeterCountSign.None]);
          vrvmetersig.SetUnit(unit);
          vrvmetersig.SetForm(METERFORM_num);
        }
      }
      else if (metersig === '2') {
        const vrvmetersig = this.getMeterSigElement(element);
        if (vrvmetersig !== null) {
          vrvmetersig.SetCount([[2], MeterCountSign.None]);
          vrvmetersig.SetUnit(unit);
          vrvmetersig.SetForm(METERFORM_num);
        }
      }
      else if (metersigtok.toString().indexOf('C') === -1
        && metersigtok.toString().indexOf('O') === -1) {
        // Only store the time signature if there is no mensuration, otherwise
        // verovio will display both.
        unit = Number.parseInt(m[2], 10);
        const vrvmetersig = this.getMeterSigElement(element);
        if (vrvmetersig !== null) {
          vrvmetersig.SetCount([[Number.parseInt(m[1], 10)], MeterCountSign.None]);
          vrvmetersig.SetUnit(unit);
        }
      }
      else {
        // Always provide @meter.unit since timestamps reference it; @meter.count
        // is kept but the signature stays invisible.
        unit = Number.parseInt(m[2], 10);
        if (unit === 0) {
          count *= 2;
          unit = 1;
        }
        const vrvmetersig = this.getMeterSigElement(element);
        if (vrvmetersig !== null) {
          vrvmetersig.SetVisible(BOOLEAN_false);
          vrvmetersig.SetCount([[count], MeterCountSign.None]);
          vrvmetersig.SetUnit(unit);
        }
      }
      // C++ guards this with `if (metersigtok)` (the token is non-null here, but
      // TS loses the narrowing after the chain).
      if (metersigtok !== null) {
        const ploc = metersigtok.toString().lastIndexOf(')');
        if (ploc !== -1) {
          const mstring = metersigtok.toString().substring(5, ploc);
          this.setMeterSymbol(element, mstring, staffindex, null, metersigtok);
        }
      }
    }

    const ss = this.m_staffstates;
    if (staffindex < 0) {
      // store time signature change for all staves
      for (let i = 0; i < ss.length; ++i) {
        ss[i].meter_top = count;
        ss[i].meter_bottom = new HumNum(unit);
      }
    } else if (staffindex < ss.length) {
      ss[staffindex].meter_top = count;
      ss[staffindex].meter_bottom = new HumNum(unit);
    }
  }

  /** C++ HumdrumInput::addSystemClefKeyTimeChange: at the start of a system inside a
   *  movement, collect per-staff clef/key/time/meter/transposition changes and emit
   *  either a scoreDef-level change or a staffGrp of individual staffDefs. */
  public addSystemClefKeyTimeChange(startline: number, endline: number): void {
    const ss = this.m_staffstates;
    const infile = this.m_infiles.at(0);
    const hre = new HumRegex();

    // Keep track of any key and time signature changes for each staff.
    const cleftok: HTp[] = new Array(ss.length).fill(null);
    const keytok: HTp[] = new Array(ss.length).fill(null);
    const keysigtok: HTp[] = new Array(ss.length).fill(null);
    const timesigtok: HTp[] = new Array(ss.length).fill(null);
    const metersigtok: HTp[] = new Array(ss.length).fill(null);
    const transposetok: HTp[] = new Array(ss.length).fill(null);

    let empty = true;
    let hasClef = false;
    let hasTimeSig = false;
    let hasMeterSig = false;
    let hasKeySig = false;
    let hasTranspose = false;

    for (let i = startline; i <= endline; ++i) {
      if (infile.at(i).isData()) break;
      if (!infile.at(i).isInterpretation()) continue;
      for (let j = 0; j < infile.at(i).getFieldCount(); ++j) {
        const token = infile.token(i, j);
        if (token === null) continue;
        const track = token.getTrack();
        const staffindex = this.m_rkern[track] ?? -1;
        if (staffindex < 0) {
          // not a notational spine for a staff
          continue;
        }

        if (hre.search(token.toString(), '^\\*M\\d+/\\d+')) {
          timesigtok[staffindex] = token;
          empty = false;
          hasTimeSig = true;
        } else if (hre.search(token.toString(), '^\\*k\\[.*\\]')) {
          keysigtok[staffindex] = token;
          empty = false;
          hasKeySig = true;
        } else if (token.isClef()) {
          cleftok[staffindex] = token;
          empty = false;
          hasClef = true;
        } else if (hre.search(token.toString(), '^\\*ITrd([-+\\d]+)c([-+\\d]+)')) {
          // update the transposition for notes following this change
          this.m_transpose[staffindex] = transToBase40(token.toString());
          transposetok[staffindex] = token;
          hasTranspose = true;
          empty = false;
        }

        // A meter signature is only used when it directly follows a time
        // signature, so it does not make the change non-empty by itself.
        if (timesigtok[staffindex] !== null && hre.search(token.toString(), '^\\*met\\(.*\\)')) {
          metersigtok[staffindex] = token;
          hasMeterSig = true;
        }
      }
    }

    if (empty) {
      // No transposition, key or time signature changes.
      return;
    }

    // A scoreDef needs to be added for the clef/key/time signature changes.
    const scoreDef = new ScoreDef();
    const lastsection = this.m_sections[this.m_sections.length - 1] as unknown as { AddChild(o: VrvObject): void };
    lastsection.AddChild(scoreDef);

    // Decide whether the change applies at the scoreDef level (all staves) or
    // needs a staffGrp holding individual staffDefs.
    let allSameTranspose = true;
    let allSameKeySig = true;
    let allSameClef = true;
    let allSameTimeSig = true;
    let allSameMeterSig = true;

    if (hasClef) {
      if (cleftok[0] === null) {
        allSameClef = false;
      } else {
        for (let i = 1; i < cleftok.length; ++i) {
          if (cleftok[i] === null) { allSameClef = false; break; }
          else if (cleftok[0]!.toString() !== cleftok[i]!.toString()) { allSameClef = false; break; }
        }
      }
    } else {
      allSameClef = false;
    }
    allSameClef = false; // Always false for now

    if (hasKeySig) {
      if (keysigtok[0] === null) {
        allSameKeySig = false;
      } else {
        for (let i = 1; i < keysigtok.length; ++i) {
          if (keysigtok[i] === null) { allSameKeySig = false; break; }
          else if (keysigtok[0]!.toString() !== keysigtok[i]!.toString()) { allSameKeySig = false; break; }
        }
      }
    } else {
      allSameKeySig = false;
    }

    if (hasTimeSig) {
      if (timesigtok[0] === null) {
        allSameTimeSig = false;
      } else {
        for (let i = 1; i < timesigtok.length; ++i) {
          if (timesigtok[i] === null) { allSameTimeSig = false; break; }
          else if (timesigtok[0]!.toString() !== timesigtok[i]!.toString()) { allSameTimeSig = false; break; }
        }
      }
    } else {
      allSameTimeSig = false;
    }

    if (hasMeterSig) {
      if (metersigtok[0] === null) {
        allSameMeterSig = false;
      } else {
        for (let i = 1; i < metersigtok.length; ++i) {
          if (metersigtok[i] === null) { allSameMeterSig = false; break; }
          else if (metersigtok[0]!.toString() !== metersigtok[i]!.toString()) { allSameMeterSig = false; break; }
        }
      }
    } else {
      allSameMeterSig = false;
    }

    if (hasTranspose) {
      if (transposetok[0] === null) {
        allSameTranspose = false;
      } else {
        for (let i = 1; i < transposetok.length; ++i) {
          if (transposetok[i] === null) { allSameTranspose = false; break; }
          else if (transposetok[0]!.toString() !== transposetok[i]!.toString()) { allSameTranspose = false; break; }
        }
      }
    } else {
      allSameTranspose = false;
    }

    // Different non-zero transpositions force individual key signatures.
    for (let i = 0; i < this.m_transpose.length; ++i) {
      if (this.m_transpose[i]) {
        allSameKeySig = false;
        break;
      }
    }

    // Same key signatures but different transpositions: key signatures have to be
    // written individually because transposition alters them.
    if (allSameKeySig && hasTranspose && !allSameTranspose) allSameKeySig = false;
    if (allSameTimeSig && hasMeterSig && !allSameMeterSig) allSameTimeSig = false;
    if (hasTranspose) {
      // Transposition cannot be attached to scoreDef, so force staffDefs.
      allSameTranspose = false;
      allSameKeySig = false;
    }

    const setAllClef = false;
    let setAllKeySig = false;
    const setAllTimeSig = false;

    // Insert the changes that affect all staves first.
    if (hasKeySig && allSameKeySig) {
      this.setKeySigStaffDef(
        -1, scoreDef as unknown as StaffDef, keysigtok[0]!.toString(), keysigtok[0], keytok[0], true,
      );
      setAllKeySig = true;
    }

    if (hasClef && allSameClef) {
      // not implemented yet
    }

    if (hasTimeSig && allSameTimeSig) {
      // System-level time signatures are disabled for now.
    }
    if (hasMeterSig && allSameMeterSig) {
      this.setTimeSigFromTokens(scoreDef as unknown as StaffDef, timesigtok[0], metersigtok[0], -1);
    }

    // Individual staffDefs for the changes that do not affect all staves.
    const needStaffDef: boolean[] = new Array(ss.length).fill(false);
    let need = false;

    if (!setAllKeySig) {
      for (let i = 0; i < keysigtok.length; ++i) {
        if (keysigtok[i] !== null) { need = true; needStaffDef[i] = true; }
      }
    }
    if (!setAllClef) {
      for (let i = 0; i < cleftok.length; ++i) {
        if (cleftok[i] !== null) { need = true; needStaffDef[i] = true; }
      }
    }
    if (!setAllTimeSig && !allSameMeterSig) {
      for (let i = 0; i < timesigtok.length; ++i) {
        if (timesigtok[i] !== null) { need = true; needStaffDef[i] = true; }
      }
    }
    for (let i = 0; i < transposetok.length; ++i) {
      if (transposetok[i] !== null) { need = true; needStaffDef[i] = true; }
    }
    if (!need) return;

    const staffGrp = new StaffGrp();
    (scoreDef as unknown as { AddChild(o: VrvObject): void }).AddChild(staffGrp);
    const staves: Array<StaffDef | null> = new Array(ss.length).fill(null);
    for (let i = 0; i < needStaffDef.length; ++i) {
      if (!needStaffDef[i]) continue;
      const staffDef = new StaffDef();
      staffDef.SetN(i + 1);
      (staffGrp as unknown as { AddChild(o: VrvObject): void }).AddChild(staffDef);
      staves[i] = staffDef;
    }

    if (!setAllClef) {
      for (let i = 0; i < cleftok.length; ++i) {
        if (cleftok[i] === null) continue;
        if (staves[i] === null) continue;
        this.setClefStaffDef(staves[i]!, cleftok[i]!.toString(), cleftok[i], null);
      }
    }

    if (!setAllKeySig) {
      for (let i = 0; i < keysigtok.length; ++i) {
        if (keysigtok[i] === null) continue;
        if (staves[i] === null) continue;
        this.setKeySigStaffDef(i, staves[i]!, keysigtok[i]!.toString(), keysigtok[i], keytok[i], true);
      }
    }

    if (!setAllTimeSig) {
      for (let i = 0; i < timesigtok.length; ++i) {
        if (timesigtok[i] === null) continue;
        if (staves[i] === null) continue;
        this.setTimeSigFromTokens(staves[i]!, timesigtok[i], metersigtok[i], i);
      }
    }

    // Process any transposition changes.
    for (let i = 0; i < transposetok.length; ++i) {
      if (transposetok[i] === null) continue;
      if (staves[i] === null) continue;
      this.setTransposition(staves[i]!, transposetok[i]!.toString());
    }
  }

  public hasIndent(tok: HTp): boolean {
    let current = tok;
    while (current !== null) {
      if (!current.isInterpretation()) { current = current.getNextToken(); continue; }
      if (current.toString() === '*indent' || current.toString() === '*I"') return true;
      current = current.getNextToken();
    }
    return false;
  }
  public insertTextWithNewlines(label: Label, text: string): void {
    const hre = new HumRegex();
    const pieces: string[] = [];
    hre.split(pieces, text, '\\\\n');
    for (let i = 0; i < pieces.length; i++) {
      const t = new Text();
      t.SetText(Array.from(pieces[i]).map((c) => c.codePointAt(0) ?? 0));
      label.AddChild(t);
      if (i < pieces.length - 1) label.AddChild(new Lb());
    }
  }
  public setLabelContent(label: Label, name: string): void {
    const hre = new HumRegex();
    let prestring = '';
    let poststring = '';
    let symbol = '';
    if (hre.search(name, '(.*)-flat\\b(.*)')) { prestring = hre.getMatch(1); poststring = hre.getMatch(2); symbol = '\uE260'; }
    else if (hre.search(name, '(.*)-sharp\\b(.*)')) { prestring = hre.getMatch(1); poststring = hre.getMatch(2); symbol = '\uE262'; }
    else if (hre.search(name, '(.*\\b[A-G])b\\b(.*)')) { prestring = hre.getMatch(1); poststring = hre.getMatch(2); symbol = '\uE260'; }
    else if (hre.search(name, '(.*[A-G])#(.*)')) { prestring = hre.getMatch(1); poststring = hre.getMatch(2); symbol = '\uE262'; }
    if (symbol === '') { this.insertTextWithNewlines(label, name); return; }
    if (prestring !== '') this.insertTextWithNewlines(label, prestring);
    const rend = new Rend();
    const text = new Text();
    text.SetText(Array.from(symbol).map((c) => c.codePointAt(0) ?? 0));
    rend.AddChild(text);
    label.AddChild(rend);
    rend.SetGlyphAuth('smufl');
    if (poststring !== '') this.insertTextWithNewlines(label, poststring);
  }
  public setInstrumentName(element: StaffDef, name: string, labeltok: HTp = null): void {
    if (name === '') return;
    const label = new Label();
    if (name === '   ') {
      const text = new Text();
      text.SetText([0x00a0, 0x00a0, 0x00a0]);
      label.AddChild(text);
    }
    else this.setLabelContent(label, name);
    if (labeltok !== null) this.setLocationId(label, labeltok);
    element.InsertChild(label, 0);
  }
  public setInstrumentAbbreviation(element: StaffDef, name: string, abbrtok: HTp = null): void {
    if (name === '') return;
    const label = new LabelAbbr();
    const text = new Text();
    if (abbrtok !== null) this.setLocationId(label, abbrtok);
    let name8 = name
      .replace(/\b([ABDEFG])b\b/g, '$1\u266d')
      .replace(/\b([A-Ga-g])-flat\b/g, '$1\u266d')
      .replace(/\b([A-G])#\b/g, '$1\u266f')
      .replace(/\b([A-Ga-g])-sharp\b/g, '$1\u266f');
    text.SetText(Array.from(name8).map((c) => c.codePointAt(0) ?? 0));
    label.AddChild(text);
    element.InsertChild(label, 0);
  }
  public addInstrumentDefinition(staffdef: StaffDef, partstart: HTp): void {
    let instcode: HTp = null;
    let cur = partstart;
    while (cur !== null) {
      if (cur.isData()) break;
      if (cur.isInterpretation() && cur.compare(0, 2, '*I') === 0) {
        const s = cur.toString();
        if (s.length >= 3 && s[2] >= 'a' && s[2] <= 'z') { instcode = cur; break; }
      }
      cur = cur.getNextToken();
    }
    if (instcode === null) return;
    const gmpc = humInstrumentGM(instcode.toString());
    if (gmpc < 0) return;
    const idef = new InstrDef();
    staffdef.AddChild(idef);
    idef.SetMidiInstrnum(gmpc);
    // C++ sets data_MIDINAMES(gmpc+1); TS InstrDef keeps the name string.
    try {
      idef.SetMidiInstrname(new AttConverterBase().MidinamesToStr(gmpc + 1));
    }
    catch { /* name optional; number suffices */ }
  }
  public getInstrumentNumber(icode: HTp): string {
    if (icode === null) return '';
    let current = icode.getNextToken();
    const hre = new HumRegex();
    while (current !== null && !current.isData()) {
      if (current.isInterpretation() && hre.search(current.toString(), '^\\*I#(\\d+)')) {
        return hre.getMatch(1);
      }
      current = current.getNextToken();
    }
    return '';
  }
  public getLabelFromInstrumentCode(icode: HTp, transpose: string): string {
    if (icode === null) return '';
    const code = icode.toString().substr(2);
    let output = CODE_TO_LABEL[code] ?? '';
    if (output === '') return output;
    if (transpose === '*ITrd1c2') output += ' in B-flat';
    else if (transpose === '*ITrd2c3') output += ' in A';
    else if (transpose === '*ITrd-2c-3') output += ' in E-flat';
    else if (transpose === '*ITrd-5c-9') output += ' in E-flat';
    const number = this.getInstrumentNumber(icode);
    if (number !== '') output += ' ' + number;
    return output;
  }
  public getClef(staff: StaffDef): Clef {
    // C++ searches KEYSIG here (typo) so it always creates a new Clef;
    // search CLEF directly for the same net effect without the bad cast.
    let output = staff.FindDescendantByType(ClassId.CLEF) as unknown as Clef | null;
    if (output === null || output === undefined) {
      output = new Clef();
      staff.AddChild(output);
    }
    return output;
  }
  public setClefStaffDef(staff: StaffDef, clef: string, cleftok: HTp, _striatok: HTp = null): void {
    const vrvclef = this.getClef(staff);
    if (cleftok !== null) this.setLocationId(vrvclef, cleftok);
    if (clef.indexOf('clefX') !== -1) {
      vrvclef.SetShape(CLEFSHAPE_perc);
      const hre = new HumRegex();
      if (hre.search(clef, 'clefX(\\d)')) {
        const line = hre.getMatchInt(1);
        if (line > 0) vrvclef.SetLine(line);
      }
    }
    if (clef.indexOf('yy') !== -1) vrvclef.SetVisible(BOOLEAN_false);
    let tok = clef;
    if (cleftok !== null) {
      tok = cleftok.toString();
      if (cleftok.isMens() && tok === '*clefGv2') tok = '*clefC4';
    }
    this.setClefBasicShape(vrvclef, tok);
    this.setClefStaffLine(vrvclef, tok);
    this.setClefOctaveDisplacement(vrvclef, tok);
    if (cleftok !== null) {
      // C++ setClef() applies LO:CL styling and the editorial/color wrapper too.
      this.checkForClefStyling(vrvclef, cleftok);
      this.setClefColorOrEditorial(cleftok, vrvclef);
      this.setLocationId(vrvclef, cleftok);
    }
  }
  public addDefaultTempo(scoreDef: { SetMidiBpm(v: number): void }): void {
    if (this.m_mens) { scoreDef.SetMidiBpm(280.0 * this.m_globalTempoScaling); return; }
    let sum = 0;
    let count = 0;
    const infile = this.m_infiles.at(0);
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (infile.at(i).getDuration().isZero()) continue;
      count++;
      sum += infile.at(i).getDuration().getFloat();
    }
    if (count === 0) return;
    const avgdur = sum / count;
    if (avgdur > 2.0) scoreDef.SetMidiBpm(400.0 * this.m_globalTempoScaling);
    else if (this.m_globalTempoScaling !== 1.0) scoreDef.SetMidiBpm(120.0 * this.m_globalTempoScaling);
  }
  public checkForColorSpine(infile: HumdrumFile): void {
    const colorspines = infile.getSpineStartListFiltered('**color');
    this.m_hasColorSpine = colorspines.length > 0;
  }
  public prepareVerses(): void {
    const ss = this.m_staffstates;
    const staffstarts = this.m_staffstarts;
    if (staffstarts.length === 0) return;
    const line = staffstarts[0]!.getLine();
    if (line === null) return;
    for (let i = 0; i < staffstarts.length; ++i) {
      const field = staffstarts[i]!.getFieldIndex();
      for (let j = field + 1; j < line.getFieldCount(); ++j) {
        const tok = line.token(j);
        if (tok === null) continue;
        if (tok.isKernLike() || tok.isMensLike()) break;
        if (tok.isDataTypeLike('**text') || tok.isDataTypeLike('**silbe')) ss[i].verse = true;
        else if (tok.getDataType().substr(0, 7) === '**vdata') ss[i].verse = true;
        else if (tok.getDataType().substr(0, 8) === '**vvdata') ss[i].verse = true;
      }
    }
  }
  public calculateReverseKernIndex(): void {
    const infile = this.m_infiles.at(0);
    this.m_rkern = new Array(infile.getSpineCount() + 1).fill(-1);
    for (let i = 0; i < this.m_staffstarts.length; ++i) {
      const st = this.m_staffstarts[i];
      if (st !== null) this.m_rkern[st.getTrack()] = i;
    }
  }

  public buildStaffStarts(): boolean {
    // convertHumdrum spine-classification block (kern/mens counting +
    // harm/fing/string/text/degree flags; per-spine analyzers ponytail).
    const infile = this.m_infiles.at(0);
    const tempstarts = infile.getStaffLikeSpineStartList().filter((t) => t !== null && t.toString() !== '**kernyy');
    const staffstarts: HTp[] = [];
    const tacets: HTp[] = [];
    for (const st of tempstarts) {
      if (this.isTacet(st)) { tacets.push(st); continue; }
      staffstarts.push(st);
    }
    this.m_staffstarts = staffstarts.length > 0 ? staffstarts : tacets;
    if (this.m_staffstarts.length === 0) return false;
    for (const it of infile.getSpineStartList()) {
      if (it === null) continue;
      const datatype = it.getDataType();
      if (datatype.indexOf('kern') !== -1) continue;
      else if (it.isDataType('**harm') || it.isDataType('**rhrm') || it.isDataType('**mxhm')) this.m_harm = true;
      else if (it.isDataType('**fb') || it.isDataType('**fba') || it.isDataType('**Bnum')) this.m_fb = true;
      else if (it.isDataType('**fing')) this.m_fing = true;
      else if (it.isDataType('**string')) this.m_string = true;
      else if (it.isMensLike()) this.m_mens = true;
      else if (it.isDataType('**deg') || it.isDataType('**degree')) this.m_degree = true;
    }
    this.calculateReverseKernIndex();
    this.m_staffstates = [];
    for (let i = 0; i < this.m_staffstarts.length; i++) this.m_staffstates.push(new StaffStateVariables());
    this.m_transpose = new Array(this.m_staffstarts.length).fill(0);
    return true;
  }

  /** Clef slice of interpretation handling (iohumdrum.cpp clef element funcs). */
  public setClefBasicShape(clef: Clef, tok: string): void {
    if (tok.indexOf('clefGG') !== -1) clef.SetShape(CLEFSHAPE_GG);
    else if (tok.indexOf('clefG') !== -1) clef.SetShape(CLEFSHAPE_G);
    else if (tok.indexOf('clefF') !== -1) clef.SetShape(CLEFSHAPE_F);
    else if (tok.indexOf('clefC') !== -1) clef.SetShape(CLEFSHAPE_C);
  }

  public setClefStaffLine(clef: Clef, tok: string): void {
    if (tok.indexOf('2') !== -1) clef.SetLine(2);
    else if (tok.indexOf('4') !== -1) clef.SetLine(4);
    else if (tok.indexOf('3') !== -1) clef.SetLine(3);
    else if (tok.indexOf('5') !== -1) clef.SetLine(5);
    else if (tok.indexOf('1') !== -1) clef.SetLine(1);
  }

  public setClefOctaveDisplacement(clef: Clef, tok: string): void {
    if (tok.indexOf('vv') !== -1) { clef.SetDis(OCTAVE_DIS_15); clef.SetDisPlace(STAFFREL_basic_below); }
    else if (tok.indexOf('v') !== -1) { clef.SetDis(OCTAVE_DIS_8); clef.SetDisPlace(STAFFREL_basic_below); }
    else if (tok.indexOf('^^') !== -1) { clef.SetDis(OCTAVE_DIS_15); clef.SetDisPlace(STAFFREL_basic_above); }
    else if (tok.indexOf('^') !== -1) { clef.SetDis(OCTAVE_DIS_8); clef.SetDisPlace(STAFFREL_basic_above); }
  }

  public insertClefElement(elements: string[], pointers: VrvObject[], token: HTp, lastnote: HTp): Clef | null {
    if (token === null) return null;
    const clef = new Clef();

    // A clef is "bad" (candidate for @sameas) when it does not land exactly at
    // the end of the previous note, i.e. it is not a needed clef change.
    let sameas = false;
    let clefpos = new HumNum(-1);
    if (lastnote !== null) {
      clefpos = token.getDurationFromBarline();
      const notepos = lastnote.getDurationFromBarline();
      const duration = recipToDuration(lastnote.toString());
      if (!notepos.add(duration).equals(clefpos)) {
        sameas = true;
      }
    }

    // Store all of the clefs for later sameas analysis.
    this.m_clef_buffer.push({ bad: sameas, pos: clefpos, clef });

    this.setClefColorOrEditorial(token, clef);
    this.setLocationId(clef, token);
    this.appendElement(elements, pointers, clef);

    const ss = this.m_staffstates;
    if (this.m_currentstaff - 1 >= 0 && this.m_currentstaff - 1 < ss.length) {
      ss[this.m_currentstaff - 1].last_clef = token.toString();
    }
    const tok = token.toString();
    this.setClefBasicShape(clef, tok);
    this.setClefStaffLine(clef, tok);
    this.setClefOctaveDisplacement(clef, tok);
    this.checkForClefStyling(clef, token);
    // ponytail: editorial <supplied> wrapping (C++ appends Supplied to the
    // element stack here) not ported; add when LO:CL ed cases appear.
    return clef;
  }

  public isNotAtStartOfMeasure(layerdata: HTp[], i: number): boolean {
    for (let k = 0; k < i; k++) {
      const t = layerdata[k];
      if (t !== null && t.isData() && !t.isNull()) return true;
    }
    return false;
  }

  public getKeySignatureNumber(humkeysig: string): number {
    let ks = humkeysig;
    const close = ks.indexOf(']');
    if (close !== -1) {
      ks = ks.substr(0, close);
      const open = ks.indexOf('[');
      if (open !== -1) ks = ks.substr(open + 1);
    }
    const table: Record<string, number> = {
      '': 0, 'b-': -1, 'f#': 1, 'b-e-': -2, 'f#c#': 2, 'b-e-a-': -3,
      'f#c#g#': 3, 'b-e-a-d-': -4, 'f#c#g#d#': 4, 'b-e-a-d-g-': -5,
      'f#c#g#d#a#': 5, 'b-e-a-d-g-c-': -6, 'f#c#g#d#a#e#': 6,
      'b-e-a-d-g-c-f-': -7, 'f#c#g#d#a#e#b#': 7,
    };
    return table[ks] ?? -1000;
  }

  public insertMidMeasureKeySignature(staffindex: number, token: HTp): KeySig | null {
    if (token === null) return null;
    const keysig = new KeySig();
    if (this.m_layer !== null) this.m_layer.AddChild(keysig);
    this.setLocationId(keysig, token);
    keysig.SetType('mid-measure');
    let keynum = this.getKeySignatureNumber(token.toString());
    if (staffindex >= 0 && staffindex < this.m_transpose.length) keynum += this.m_transpose[staffindex];
    if (keynum >= -7 && keynum <= 7) {
      if (keynum < 0) keysig.SetSig([-keynum, ACCIDENTAL_WRITTEN_f]);
      else if (keynum > 0) keysig.SetSig([keynum, ACCIDENTAL_WRITTEN_s]);
      else {
        keysig.SetSig([0, ACCIDENTAL_WRITTEN_NONE]);
        keysig.SetCancelaccid(CANCELACCID_before);
      }
    }
    return keysig;
  }

  public insertMeterSigElement(layerdata: HTp[], index: number): MeterSig | null {
    const tsig = layerdata[index] ?? null;
    if (tsig === null) return null;
    if (tsig.getDurationFromStart().isNegative() || tsig.getDurationFromStart().isZero()) return null;
    let count = -1;
    let unit = -1;
    let m = /^\*M(\d+)\/(\d+)/.exec(tsig.toString());
    if (m !== null) { count = Number.parseInt(m[1], 10); unit = Number.parseInt(m[2], 10); }
    else {
      m = /^\*M(\d+)/.exec(tsig.toString());
      if (m !== null) count = Number.parseInt(m[1], 10);
    }
    if (count < 0) return null;
    const msig = new MeterSig();
    this.setLocationId(msig, tsig);
    if (this.m_layer !== null) this.m_layer.AddChild(msig);
    msig.SetCount([[count], MeterCountSign.None]);
    if (unit > 0) msig.SetUnit(unit);
    return msig;
  }

  /** Ottava slice of interpretation handling (iohumdrum.cpp handleOttavaMark + id helpers). */
  public getStartIdForOttava(token: HTp): string {
    if (token === null) return '';
    let tok = token.getNextToken();
    while (tok !== null && !tok.isData()) tok = tok.getNextToken();
    if (tok === null) return '';
    // Earliest note across the track's subspines (field walk verbatim).
    const track = tok.getTrack();
    let ttrack = track;
    const notes: HTp[] = [];
    const timestamps: HumNum[] = [];
    let cur: HTp = tok;
    while (ttrack === track) {
      const xtok: HTp = cur;
      notes.push(xtok);
      timestamps.push(xtok.getDurationFromStart());
      cur = cur.getNextFieldToken();
      if (cur === null) break;
      ttrack = cur.getTrack();
    }
    if (!notes.length) return '';
    let bestindex = 0;
    for (let i = 1; i < notes.length; i++) {
      if (timestamps[i].less(timestamps[bestindex])) bestindex = i;
    }
    const best = notes[bestindex];
    if (best === null) return '';
    return HumdrumInput.getLocationIdForToken(notePrefixForToken(best), best.getLineIndex(), best.getFieldIndex());
  }

  public getEndIdForOttava(token: HTp): string {
    if (token === null) return '';
    let tok = token.getPreviousToken();
    while (tok !== null && !tok.isData()) tok = tok.getPreviousToken();
    if (tok === null) return '';
    const track = tok.getTrack();
    let ttrack = track;
    const notes: HTp[] = [];
    const timestamps: HumNum[] = [];
    let cur: HTp = tok;
    while (ttrack === track) {
      let xtok: HTp = cur;
      if (xtok.isNull()) xtok = xtok.resolveNull();
      if (xtok === null) {
        cur = cur.getNextFieldToken();
        if (cur === null) break;
        ttrack = cur.getTrack();
        continue;
      }
      notes.push(xtok);
      timestamps.push(xtok.getDurationFromStart());
      cur = cur.getNextFieldToken();
      if (cur === null) break;
      ttrack = cur.getTrack();
    }
    if (!notes.length) return '';
    let bestindex = 0;
    for (let i = 1; i < notes.length; i++) {
      if (timestamps[i].greater(timestamps[bestindex])) bestindex = i;
    }
    const best = notes[bestindex];
    if (best === null) return '';
    return HumdrumInput.getLocationIdForToken(notePrefixForToken(best), best.getLineIndex(), best.getFieldIndex());
  }

  public handleOttavaMark(token: HTp): void {
    if (token === null) return;
    const ss = this.m_staffstates;
    const staffindex = this.m_currentstaff - 1;
    if (staffindex < 0 || staffindex >= ss.length) return;
    const s = token.toString();
    if (s === '*8va' || s === '*8ba' || s === '*15ba' || s === '*15ma') {
      const key = s === '*8va' ? 'up8' : s === '*8ba' ? 'down8' : s === '*15ba' ? 'down15' : 'up15';
      const st = ss[staffindex] as unknown as Record<string, unknown>;
      const mkey = key === 'up8' ? 'ottavameasure' : key === 'down8' ? 'ottavadownmeasure'
        : key === 'down15' ? 'ottava2downmeasure' : 'ottava2measure';
      if (st[mkey] === null || st[mkey] === undefined) {
        const prefix = key === 'up8' ? 'ottava' : key === 'down8' ? 'ottavadown'
          : key === 'down15' ? 'ottava2down' : 'ottava2';
        st[mkey] = this.m_measure;
        st[prefix + 'notestart'] = null;
        st[prefix + 'notestartid'] = this.getStartIdForOttava(token);
        st[prefix + 'noteend'] = null;
        st[prefix + 'endtimestamp'] = token.getDurationFromStart();
      }
      return;
    }
    if (s === '*X8va' || s === '*X8ba' || s === '*X15ba' || s === '*X15ma') {
      const up = s === '*X8va' || s === '*X15ma';
      const two = s === '*X15ba' || s === '*X15ma';
      const prefix = !two && up ? 'ottava' : !two ? 'ottavadown' : two && !up ? 'ottava2down' : 'ottava2';
      const st = ss[staffindex] as unknown as Record<string, VrvObject | string | HumNum | null>;
      const measure = st[prefix + 'measure'] as VrvObject | null;
      const nstart = st[prefix + 'notestart'] as VrvObject | null;
      const nend = st[prefix + 'noteend'] as VrvObject | null;
      if (measure !== null && nstart !== null && nend !== null) {
        const octave = new Octave();
        (measure as unknown as { AddChild(c: VrvObject): void }).AddChild(octave);
        octave.SetStaff([staffindex + 1]);
        octave.SetDis(two ? OCTAVE_DIS_15 : OCTAVE_DIS_8);
        const startid = st[prefix + 'notestartid'] as string;
        octave.SetStartid('#' + (startid !== '' ? startid : (nstart as unknown as { GetID(): string }).GetID()));
        const endid = this.getEndIdForOttava(token);
        octave.SetEndid('#' + (endid !== '' ? endid : (nend as unknown as { GetID(): string }).GetID()));
        octave.SetDisPlace(up ? STAFFREL_basic_above : STAFFREL_basic_below);
      }
      st[prefix + 'notestart'] = null;
      st[prefix + 'notestartid'] = '';
      st[prefix + 'noteend'] = null;
      st[prefix + 'measure'] = null;
      st[prefix + 'endtimestamp'] = new HumNum(0);
    }
  }

  public prepareInitialOttavas(token: HTp): void {
    if (token === null) return;
    if (token.getDurationFromStart().isPositive()) return;
    if (token.getSubtrack() > 1) return;
    let tok = token.getPreviousToken();
    while (tok !== null) {
      if (!tok.isInterpretation()) { tok = tok.getPreviousToken(); continue; }
      const s = tok.toString();
      if (s === '*8va' || s === '*8ba' || s === '*15ma' || s === '*15ba') { this.handleOttavaMark(tok); break; }
      tok = tok.getPreviousToken();
    }
  }

  public processInterpretationStuff(token: HTp, _staffindex: number, lastnote: HTp = null): void {
    if (token === null || !token.isInterpretation()) return;
    if (token.toString() === '*join') { this.m_join = true; return; }
    if (token.toString() === '*Xjoin') { this.m_join = false; return; }
    if (token.isClef()) {
      // C++ processInterpretationStuff handles only *Xartic simile; clefs
      // are inserted by fillContentsOfLayer (forceClefChange/notAtStart).
      return;
    }
    const s = token.toString();
    if (s === '*8va' || s === '*8ba' || s === '*15ma' || s === '*15ba'
      || s === '*X8va' || s === '*X8ba' || s === '*X15ma' || s === '*X15ba') {
      this.handleOttavaMark(token);
      return;
    }
    // ponytail: *Xartic simile + remaining interpretation handlers.
  }

  /** Verse slice of note/chord conversion (iohumdrum.cpp convertVerses core). */
  public convertVerses(element: { AddChild(c: VrvObject): void }, token: HTp): void {
    if (token === null || token.toString().indexOf('yy') !== -1) return;
    const staff = this.m_rkern[token.getTrack()] ?? -1;
    const ss = this.m_staffstates;
    if (staff < 0 || staff >= ss.length || !ss[staff].verse) return;
    if (token.getSubtrack() > 1 && token.noteInLowerSubtrack()) return;
    const line = token.getLine();
    if (line === null) return;
    const track = token.getTrack();
    let versenum = 0;
    const startfield = token.getFieldIndex() + 1;
    for (let i = startfield; i < line.getFieldCount(); ++i) {
      const tok = line.token(i);
      if (tok === null) continue;
      if (tok.isKernLike() || tok.isMensLike()) {
        if (tok.getTrack() !== track) break;
      }
      const dt = tok.getDataType();
      const lyricQ = tok.isDataTypeLike('**text') || tok.isDataTypeLike('**silbe')
        || dt.substr(0, 7) === '**vdata' || dt.substr(0, 8) === '**vvdata';
      if (!lyricQ) continue;
      const vvdataQ = dt.substr(0, 8) === '**vvdata';
      if (tok.isNull()) { versenum++; continue; }
      if (tok.isDataTypeLike('**silbe') && tok.getText() === '|') { versenum++; continue; }
      let value = tok.getValue('auto', 'text');
      if (value === '') value = tok.toString();
      value = value.replace(/\\|/g, '').replace(/\s+$/, '').replace(/^\s+/, '');
      // C++ strips spaces around edge hyphens (iohumdrum.cpp convertVerses).
      value = value.replace(/\s+-$/, '-').replace(/^-\s+/, '-');
      if (value === '') { versenum++; continue; }
      versenum++;
      const verse = new Verse();
      let color = tok.getValue('auto', 'color');
      if (color === 'black' || color === '#000' || color === '#000000') color = '';
      if (color !== '') verse.SetColor(color);
      this.setLocationId(verse, tok, vvdataQ ? versenum : -1);
      element.AddChild(verse);
      verse.SetN(versenum);
      if ((ss[staff]?.verse_labels?.length ?? 0) > 0) {
        // C++ passes the loop-shadowed lyric token here, not the outer note token.
        const labels = this.getVerseLabels(tok, staff);
        if (labels.length > 0) {
          const verselabel = this.getVerseLabelText(labels[0]);
          if (verselabel !== '') {
            const lab = new Label();
            const labtext = new Text();
            labtext.SetText(Array.from(verselabel).map((c) => c.codePointAt(0) ?? 0));
            verse.AddChild(lab);
            lab.AddChild(labtext);
          }
        }
      }
      if ((ss[staff]?.verse_abbr_labels?.length ?? 0) > 0) {
        const abbrlabels = this.getVerseAbbrLabels(tok, staff);
        if (abbrlabels.length > 0) {
          const verseabbrlabel = this.getVerseLabelText(abbrlabels[0]);
          if (verseabbrlabel !== '') {
            const lababbr = new LabelAbbr();
            const abbrtext = new Text();
            abbrtext.SetText(Array.from(verseabbrlabel).map((c) => c.codePointAt(0) ?? 0));
            verse.AddChild(lababbr);
            lababbr.AddChild(abbrtext);
          }
        }
      }
      // C++ convertVerses syllable pipeline: vdata passthrough, elision split,
      // dashonbegin/end + extender stripping with wordpos/con marking.
      const vdataQ = dt.substr(0, 7) === '**vdata';
      const syl = new Syl();
      const syls: Syl[] = [syl];
      verse.AddChild(syl);
      const datatype = tok.getDataType();
      if (datatype.substr(0, 8) === '**vdata-') {
        const subdatatype = datatype.substr(8);
        if (subdatatype !== '') this.appendTypeTag(syls[0], subdatatype);
      } else if (datatype.substr(0, 9) === '**vdata-') {
        const subdatatype = datatype.substr(9);
        if (subdatatype !== '') this.appendTypeTag(syls[0], subdatatype);
      }
      this.setLocationId(syl, tok, vvdataQ ? versenum : -1);
      if (vdataQ || vvdataQ) {
        this.addTextElement(syls[0], value);
        continue;
      }
      let content = this.colorVerse(verse, value);
      let addSpacer = true;
      if (content.indexOf(' ') !== -1) addSpacer = false;
      // Split syllable by elisions (space not followed by apostrophe).
      const contents: string[] = [''];
      if (content.length > 0) {
        contents[0] += content[0];
        for (let z = 1; z < content.length - 1; ++z) {
          if (content[z] === ' ' && content[z + 1] !== "'") {
            contents.push('');
          } else {
            contents[contents.length - 1] += content[z];
          }
        }
        if (content.length > 1) contents[contents.length - 1] += content[content.length - 1];
      }
      for (let k = 1; k < contents.length; k++) {
        const subsyl = new Syl();
        syls.push(subsyl);
        verse.AddChild(subsyl);
      }
      for (let k = 0; k < contents.length - 1; k++) syls[k].SetCon(sylLog_CON_b);
      let dashonbegin = false;
      let dashonend = false;
      let extender = false;
      if (content.length > 0 && content[content.length - 1] === '-') {
        dashonend = true;
        content = content.slice(0, -1);
        contents[contents.length - 1] = contents[contents.length - 1].slice(0, -1);
      }
      if (content.length > 0 && content[0] === '-') {
        dashonbegin = true;
        content = content.slice(1);
        contents[0] = contents[0].slice(1);
      }
      if (content.length > 0 && content[content.length - 1] === '_') {
        extender = true;
        content = content.slice(0, -1);
        contents[contents.length - 1] = contents[contents.length - 1].slice(0, -1);
      }
      const WORDPOS_i = 1, WORDPOS_m = 2, WORDPOS_t = 4, CON_d = 2, CON_u = 3;
      if (dashonbegin && dashonend) {
        if (syls.length > 1) {
          syls[0].SetWordpos(WORDPOS_t);
          syls[syls.length - 1].SetWordpos(WORDPOS_i);
          syls[syls.length - 1].SetCon(CON_d);
          if (this.m_humtype) { this.appendTypeTag(syls[0], 't'); this.appendTypeTag(syls[syls.length - 1], 'i'); }
        } else {
          syls[syls.length - 1].SetWordpos(WORDPOS_m);
          syls[syls.length - 1].SetCon(CON_d);
          if (this.m_humtype) this.appendTypeTag(syls[syls.length - 1], 'm');
        }
      } else if (dashonbegin) {
        syls[0].SetWordpos(WORDPOS_t);
        if (this.m_humtype) this.appendTypeTag(syls[0], 't');
      } else if (dashonend) {
        syls[syls.length - 1].SetWordpos(WORDPOS_i);
        syls[syls.length - 1].SetCon(CON_d);
        if (this.m_humtype) this.appendTypeTag(syls[syls.length - 1], 'i');
      } else {
        if (this.m_humtype) this.appendTypeTag(syls[0], 't');
      }
      if (extender) {
        syls[syls.length - 1].SetWordpos(WORDPOS_t);
        syls[syls.length - 1].SetCon(CON_u);
        if (this.m_humtype) this.appendTypeTag(syls[syls.length - 1], 't');
      }
      // Remove the last dash in a line (double dash: original word separator).
      if (content.length > 0 && content[content.length - 1] === '-') content = content.slice(0, -1);
      if (contents[contents.length - 1].length > 0 && contents[contents.length - 1].endsWith('-')) {
        contents[contents.length - 1] = contents[contents.length - 1].slice(0, -1);
      }
      const ijval = tok.getValue('auto', 'ij');
      const ij = ijval !== '';
      for (let m = 0; m < contents.length; m++) {
        if (ij) {
          const rend = new Rend();
          rend.SetFontstyle(FONTSTYLE_italic);
          this.addTextElement(rend, contents[m], '', addSpacer);
          syls[m].AddChild(rend);
          const ijbegin = tok.getValue('auto', 'ij-begin');
          const ijend = tok.getValue('auto', 'ij-end');
          if (ijbegin !== '' && ijend !== '') syls[m].SetType('repetition repetition-begin repetition-end');
          else if (ijbegin !== '' && m === 0) syls[m].SetType('repetition repetition-begin');
          else if (ijend !== '' && m === contents.length - 1) syls[m].SetType('repetition repetition-end');
          else syls[m].SetType('repetition');
        } else {
          this.addTextElement(syls[m], contents[m], '', addSpacer);
        }
      }
    }
  }

  public getDirection(token: string, target: string): number {
    if (this.m_signifiers.above !== '' && token.indexOf(target + this.m_signifiers.above) !== -1) return 1;
    if (this.m_signifiers.below !== '' && token.indexOf(target + this.m_signifiers.below) !== -1) return -1;
    return 0;
  }

  public hasLayoutParam(token: HTp, category: string, param: string): boolean {
    if (token === null) return false;
    const v = token.getLayoutParameter(category, param);
    return v !== '' && v !== '0' && v !== 'false';
  }


  /** Rhythmic element boundary: SetDur/SetDots/SetDurGes/SetDotsGes/SetType. */
  public convertRhythm(
    element: {
      SetDur(v: number): void; SetDots(v: number): void;
      SetDurGes?(v: number): void; SetDotsGes?(v: number): void;
      SetType?(v: string): void; GetClassId?(): number;
    },
    token: HTp, subtoken = -1,
  ): HumNum {
    if (token === null) return new HumNum(0);
    if (token.isMensLike()) {
      // ponytail: convertMensuralRhythm needs mensuration analysis.
      return new HumNum(0);
    }
    let tstring: string;
    if (subtoken < 0) tstring = token.toString().replace(/^ +/, '');
    else tstring = token.getSubtoken(subtoken);
    let grace = false;
    if (tstring.indexOf('q') !== -1) { grace = true; tstring = tstring.split('q').join(''); }
    let overfillQ = false;
    if (!grace) overfillQ = this.processOverfillingNotes(token);
    let vstring: string;
    if (overfillQ) vstring = token.getValue('auto', 'N', 'vis');
    else if (subtoken < 0) vstring = token.getVisualDurationChord();
    else vstring = token.getVisualDuration(subtoken);
    if (vstring !== '') {
      const visualdotcount = HumdrumInput.characterCountInSubtoken(vstring, '.');
      const gesturaldotcount = HumdrumInput.characterCountInSubtoken(tstring, '.');
      if (visualdotcount !== 0) element.SetDots(visualdotcount);
      element.SetDotsGes?.(gesturaldotcount);
    }
    else {
      const dotcount = HumdrumInput.characterCountInSubtoken(tstring, '.');
      if (dotcount > 0) element.SetDots(dotcount);
    }
    let dur: HumNum;
    let durges: HumNum = new HumNum(0);
    if (overfillQ) {
      const logicaldur = token.getValue('auto', 'MEI', 'dur.logical');
      durges = recipToDurationNoDots(logicaldur).div(4);
      const visualdur = token.getValue('auto', 'N', 'vis');
      dur = recipToDurationNoDots(visualdur).div(4);
      const logicaldurdots = logicaldur.split('').filter((c) => c === '.').length;
      const visualdurdots = visualdur.split('').filter((c) => c === '.').length;
      if (visualdurdots !== 0) element.SetDots(visualdurdots);
      // WASM parity: keep gestural dot count already set above when logical
      // duration has no dots.
      if (logicaldurdots !== 0) element.SetDotsGes?.(logicaldurdots);
      element.SetType?.(token.getValue('auto', 'MEI', 'type') || 'overfill');
    }
    else if (vstring === '') {
      dur = recipToDurationNoDots(tstring).div(4);
      if (!grace) dur = dur.mul(this.m_tupletscaling);
    }
    else {
      dur = recipToDurationNoDots(vstring).div(4);
      if (!grace) dur = dur.mul(this.m_tupletscaling);
      durges = recipToDurationNoDots(tstring).div(4);
      if (!grace) durges = durges.mul(this.m_tupletscaling);
    }
    if (!grace && dur.isZero()) return new HumNum(0);
    setDurFromWholeNote(element, dur, this.m_staffstates, this.m_currentstaff);
    if (vstring !== '') {
      setDurGesFromWholeNote(element, durges);
      // See note eDcRfV: restore tuplet factors before setRhythmFromDuration
      // (deferred with that function); return visual duration scaled back.
      return recipToDurationNoDots(vstring).div(this.m_tupletscaling);
    }
    return dur;
  }

  public setDuration(
    element: { SetDur(v: number): void; SetDots(v: number): void },
    duration: HumNum,
  ): HumNum {
    if (duration.equals(3)) { element.SetDur(DURATION_2); element.SetDots(1); return duration; }
    else if (duration.getNumerator() === 1 && duration.getDenominator() === 2) { element.SetDur(DURATION_8); return duration; }
    else if (duration.getNumerator() === 3 && duration.getDenominator() === 2) { element.SetDur(DURATION_4); element.SetDots(1); return duration; }
    else if (duration.getNumerator() === 3 && duration.getDenominator() === 4) { element.SetDur(DURATION_8); element.SetDots(1); return duration; }
    else if (duration.getNumerator() === 1 && duration.getDenominator() === 4) { element.SetDur(DURATION_16); return duration; }
    else if (duration.getNumerator() === 1 && duration.getDenominator() === 8) { element.SetDur(DURATION_32); return duration; }
    else if (duration.getNumerator() === 1 && duration.getDenominator() === 16) { element.SetDur(DURATION_64); return duration; }
    else if (duration.getNumerator() === 1 && duration.getDenominator() === 32) { element.SetDur(DURATION_128); return duration; }
    else if (duration.getNumerator() === 1 && duration.getDenominator() === 64) { element.SetDur(DURATION_256); return duration; }
    else if (duration.getNumerator() === 1 && duration.getDenominator() === 128) { element.SetDur(DURATION_512); return duration; }
    if (duration.greaterOrEqual(16)) { element.SetDur(DURATION_long); return new HumNum(16); }
    if (duration.greaterOrEqual(8)) { element.SetDur(DURATION_breve); return new HumNum(8); }
    if (duration.greaterOrEqual(4)) { element.SetDur(DURATION_1); return new HumNum(4); }
    if (duration.greaterOrEqual(2)) { element.SetDur(DURATION_2); return new HumNum(2); }
    if (duration.greaterOrEqual(1)) { element.SetDur(DURATION_4); return new HumNum(1); }
    LogWarning('In HumdrumInput::setDuration: Unprintable duration' + duration.toString() + ' quarter notes');
    return duration;
  }

  public convertSystemMeasure(line: { value: number }): boolean {
    const infile = this.m_infiles.at(0);
    const startline0 = line.value;
    const endline = this.getMeasureEndLine(startline0);
    if (endline > infile.getLineCount()) return false;
    if (endline < 0) { line.value = -endline; return true; }
    else if (this.m_ignore[startline0]) { line.value = endline; return true; }
    else if ((this.m_multirest[line.value] ?? 0) === -1) { line.value = endline; return true; }
    else line.value = endline;
    let startline = startline0;
    let founddatabefore = false;
    for (let q = startline; q >= 0; q--) {
      if (infile.at(q).isData()) { founddatabefore = true; break; }
    }
    if (!founddatabefore) startline = 0;
    if (infile.at(startline).isEmpty()) {
      for (let i = startline + 1; i < infile.getLineCount(); ++i) {
        if (infile.at(i).hasSpines()) { startline = i; break; }
        startline++;
      }
    }
    this.setupSystemMeasure(startline, endline);
    this.storeStaffLayerTokensForMeasure(startline, endline);
    const status = this.convertMeasureStaves(startline, endline);
    this.addFTremSlurs();
    this.storeBeamSpansInStartingMeasure();
    // C++ convertSystemMeasure tail (iohumdrum.cpp ~9820): global rehearsal
    // marks plus encoded layout breaks gate the Sb/Pb children.
    let checkline = startline;
    if (!infile.at(startline).token(0)?.isBarline()) checkline = this.getNextBarlineIndex(infile, startline);
    this.checkForGlobalRehearsal(checkline);
    if (this.m_breaks) this.checkForLayoutBreak(endline);
    return status;
  }

  //--------------------------------------------------------------------------
  // Beam / tuplet grouping and the beam-tuplet element stack
  // (iohumdrum.cpp appendElement .. resolveTupletBeamEndTie).
  //--------------------------------------------------------------------------

  /**
   * C++ appendElement(name, pointers, child): attach `child` to the innermost
   * open stack element. The `void*` stack entry is reinterpreted by the name
   * tag, which is modelled here with the structural AddChild contract.
   */
  public appendElement(elements: string[], pointers: VrvObject[], child: VrvObject): void {
    if (pointers.length === 0) {
      LogWarning('In HumdrumInput::appendElement: empty element stack');
      return;
    }
    const top = elements[elements.length - 1];
    if (top === 'beam' || top === 'gbeam' || top === 'layer' || top === 'tuplet'
      || top === 'chord' || top === 'ligature') {
      (pointers[pointers.length - 1] as unknown as { AddChild(c: VrvObject): void }).AddChild(child);
      return;
    }
    LogWarning(`In HumdrumInput::appendElement: Cannot append to unknown element: ${top}`);
  }

  public popElementStack(elements: string[], pointers: VrvObject[]): void {
    elements.pop();
    pointers.pop();
  }

  public insertBeam(elements: string[], pointers: VrvObject[], tg: HumdrumBeamAndTuplet): Beam {
    const beam = new Beam();
    if (tg.token !== null && tg.token.toString().indexOf('yy') !== -1) {
      // Ignore beam when token is suppressed with yy signifier
      beam.SetType('invisible');
      beam.SetColor('transparent');
    }
    this.appendElement(elements, pointers, beam);
    elements.push('beam');
    pointers.push(beam);
    return beam;
  }

  public insertGBeam(elements: string[], pointers: VrvObject[], tg: HumdrumBeamAndTuplet): Beam {
    const gbeam = new Beam();
    if (tg.token !== null && tg.token.toString().indexOf('yy') !== -1) {
      // Ignore grace note beam when token is suppressed with yy signifier
      gbeam.SetType('invisible');
      gbeam.SetColor('transparent');
    }
    this.appendElement(elements, pointers, gbeam);
    elements.push('gbeam');
    pointers.push(gbeam);
    return gbeam;
  }

  public removeBeam(elements: string[], pointers: VrvObject[]): void {
    if (elements[elements.length - 1] !== 'beam') {
      LogWarning('In HumdrumInput::removeBeam: Error removing beam');
      LogWarning('   Element stack: ');
      for (let i = elements.length - 1; i >= 0; i--) LogWarning(`      ${i}:\t${elements[i]}`);
      return;
    }
    this.popElementStack(elements, pointers);
  }

  public removeGBeam(elements: string[], pointers: VrvObject[]): void {
    if (elements[elements.length - 1] !== 'gbeam') {
      LogWarning('In HumdrumInput::removeGBeam: Error removing gbeam');
      LogWarning('   Element stack: ');
      for (let i = elements.length - 1; i >= 0; i--) LogWarning(`      ${i}:\t${elements[i]}`);
      return;
    }
    this.popElementStack(elements, pointers);
  }

  public removeTuplet(elements: string[], pointers: VrvObject[]): void {
    if (elements[elements.length - 1] !== 'tuplet') {
      LogWarning('In HumdrumInput::removeTuplet: Error removing tuplet');
      LogWarning(`   Last element is: ${elements[elements.length - 1]}`);
      LogWarning('   Element stack: ');
      for (let i = elements.length - 1; i >= 0; i--) LogWarning(`      ${i}:\t${elements[i]}`);
      return;
    }
    this.popElementStack(elements, pointers);
    // Need to fix this when nested tuplets are allowed:
    this.m_tupletscaling = new HumNum(1);
  }

  public insertTuplet(elements: string[], pointers: VrvObject[], tgs: HumdrumBeamAndTuplet[],
    layerdata: HTok[], layerindex: number, suppressTupletNumber: boolean, suppressBracketTuplet: boolean): void {
    const ss = this.m_staffstates;
    const token = layerdata[layerindex];
    const tg = tgs[layerindex];

    const tuplet = new Tuplet();
    this.setTupletLocationId(tuplet, tgs, layerdata, layerindex);
    this.appendElement(elements, pointers, tuplet);
    elements.push('tuplet');
    pointers.push(tuplet);

    const staffindex = this.m_rkern[token.getTrack()] ?? -1;
    let placement = 0;

    const rstaffindex = this.m_fbstaff.length - staffindex - 1;
    if (rstaffindex >= 0 && rstaffindex < this.m_fbstaff.length && this.m_fbstaff[rstaffindex]) {
      placement = -(this.m_fbstates[rstaffindex] ?? 0);
    }

    if (this.hasAboveParameter(layerdata[layerindex], 'TUP')) placement = 1;
    else if (this.hasBelowParameter(layerdata[layerindex], 'TUP')) placement = -1;
    // add head and stem placement in the future.
    if (placement) {
      switch (placement) {
        case -1: tuplet.SetBracketPlace(STAFFREL_basic_below); break;
        case 1: tuplet.SetBracketPlace(STAFFREL_basic_above); break;
      }
    }
    if (staffindex >= 0 && staffindex < ss.length && ss[staffindex].verse) {
      // If the music contains lyrics, force the tuplet above the staff.
      tuplet.SetBracketPlace(STAFFREL_basic_above);
    }

    const scale = tg.numscale;
    tuplet.SetNum(tg.num * scale);
    tuplet.SetNumbase(tg.numbase * scale);
    if (suppressBracketTuplet || suppressTupletNumber) tuplet.SetBracketVisible(BOOLEAN_false);
    if (this.shouldHideBeamBracket(tgs, layerdata, layerindex)) tuplet.SetBracketVisible(BOOLEAN_false);

    // local control of brackets
    const xbr = this.hasLayoutParameter(token, 'TUP', 'xbr');
    const br = this.hasLayoutParameter(token, 'TUP', 'br');
    if (xbr) tuplet.SetBracketVisible(BOOLEAN_false);
    if (br) tuplet.SetBracketVisible(BOOLEAN_true);
    if (suppressTupletNumber) tuplet.SetNumVisible(BOOLEAN_false);

    // Hide bracket and number if all data tokens of tuplet are suppressed with yy signifier
    let allTokensAreHidden = true;
    for (let i = 0; i < tgs.length; ++i) {
      const t = tgs[i].token!;
      if (t !== null && t.isData() && t.toString().indexOf('yy') === -1) {
        allTokensAreHidden = false;
        break;
      }
    }
    if (allTokensAreHidden) {
      tuplet.SetBracketVisible(BOOLEAN_false);
      tuplet.SetNumVisible(BOOLEAN_false);
    }

    tuplet.SetNumFormat(tupletVis_NUMFORMAT_count);
    this.m_tupletscaling = new HumNum(tg.num).div(tg.numbase);
  }

  /**
   * C++ analyzeLayerBeams: beam states from L/J spine counts, converted into
   * beam enumerations. Returns the two output vectors (C++ out-parameters).
   */
  public analyzeLayerBeams(layerdata: HTok[]): { beamnum: number[]; gbeamnum: number[] } {
    const beamstate: number[] = new Array(layerdata.length).fill(0);
    const gbeamstate: number[] = new Array(layerdata.length).fill(0);
    let lastbeamstate = 0;
    let lastgbeamstate = 0;

    for (let i = 0; i < beamstate.length; ++i) {
      const tok = layerdata[i];
      if (!tok.isData()) {
        beamstate[i] = lastbeamstate;
        gbeamstate[i] = lastgbeamstate;
        continue;
      }
      if (tok.isNull()) {
        // shouldn't get to this state
        beamstate[i] = lastbeamstate;
        gbeamstate[i] = lastgbeamstate;
        continue;
      }
      if (tok.isGrace()) {
        gbeamstate[i] = HumdrumInput.characterCount(tok.toString(), 'L');
        gbeamstate[i] -= HumdrumInput.characterCount(tok.toString(), 'J');
        lastgbeamstate = gbeamstate[i];
      }
      else {
        const Lcount = HumdrumInput.characterCount(tok.toString(), 'L');
        const Jcount = HumdrumInput.characterCount(tok.toString(), 'J');
        const beamSpanStart = tok.getValueBool('auto', 'beamSpanStart');
        const inBeamSpan = tok.getValueBool('auto', 'inBeamSpan');
        if (!inBeamSpan) {
          beamstate[i] = Lcount;
          beamstate[i] -= Jcount;
          lastbeamstate = beamstate[i];
        }
        else if (beamSpanStart) {
          this.m_beamSpanStartDatabase.push(tok);
          beamstate[i] = lastbeamstate;
          gbeamstate[i] = lastgbeamstate;
          continue;
        }
        else {
          beamstate[i] = lastbeamstate;
          gbeamstate[i] = lastgbeamstate;
        }
      }
      if (i > 0) {
        beamstate[i] += beamstate[i - 1];
        gbeamstate[i] += gbeamstate[i - 1];
        lastbeamstate = beamstate[i];
        lastgbeamstate = gbeamstate[i];
      }
    }

    // Adjust the beam states if there are any negative values in it:
    let min = 0;
    for (let i = 0; i < beamstate.length; ++i) if (beamstate[i] < min) min = beamstate[i];
    if (min < 0) for (let i = 0; i < beamstate.length; ++i) beamstate[i] -= min;

    if (beamstate.length > 0) {
      if (beamstate[beamstate.length - 1] > 0) {
        // Extra beam start(s) at the end of the measure. Remove all positive
        // numbers at the back of the beamstate list until a zero is found.
        for (let i = beamstate.length - 1; i >= 0; i--) {
          if (beamstate[i] === 0) break;
          beamstate[i] = 0;
        }
      }
      else if (beamstate[beamstate.length - 1] < 0) {
        // Extra beam ends at the start of the measure.
        let nonzero = false;
        for (let i = 0; i < beamstate.length; ++i) {
          if (!nonzero) {
            if (beamstate[i] === 0) continue;
            nonzero = true;
            if (beamstate[i] !== beamstate[beamstate.length - 1]) break;
          }
          beamstate[i] -= beamstate[beamstate.length - 1];
        }
      }
    }

    let negativeQ = 0;
    for (let i = 0; i < beamstate.length; ++i) if (beamstate[i] < 0) { negativeQ = 1; break; }
    let gnegativeQ = 0;
    for (let i = 0; i < gbeamstate.length; ++i) if (gbeamstate[i] < 0) { gnegativeQ = 1; break; }

    // Convert to beam enumerations. Beamstates are nonzero for the notes in a
    // beam, but the last one is zero.
    const beamnum: number[] = new Array(beamstate.length).fill(0);
    const gbeamnum: number[] = new Array(beamstate.length).fill(0);
    if (beamstate.length > 0) {
      let bcounter = 1;
      beamnum[0] = beamstate[0] ? bcounter : 0;
      for (let i = 1; i < beamstate.length; ++i) {
        if (beamstate[i]) beamnum[i] = bcounter;
        if (!beamstate[i] && beamstate[i - 1]) beamnum[i] = bcounter++;
      }
      bcounter = 1;
      gbeamnum[0] = gbeamstate[0] ? bcounter : 0;
      for (let i = 1; i < gbeamstate.length; ++i) {
        if (gbeamstate[i]) gbeamnum[i] = bcounter;
        if (!gbeamstate[i] && gbeamstate[i - 1]) gbeamnum[i] = bcounter++;
      }
    }

    if (negativeQ || (beamstate.length > 0 && beamstate[beamstate.length - 1] !== 0)) {
      // something wrong with the beaming, either incorrect or the beaming
      // crosses a barline or layer. Don't try to beam anything.
      beamstate.fill(0);
      beamnum.fill(0);
    }
    if (gnegativeQ || (gbeamstate.length > 0 && gbeamstate[gbeamstate.length - 1] !== 0)) {
      gbeamstate.fill(0);
      gbeamnum.fill(0);
    }

    this.storeBreaksec(beamstate, beamnum, layerdata, false);
    this.storeBreaksec(gbeamstate, gbeamnum, layerdata, true);
    return { beamnum, gbeamnum };
  }

  public storeBreaksec(beamstate: number[], beamnum: number[], layerdata: HTok[], grace: boolean): void {
    const beamednotes: number[][] = [];
    let bnum = 0;
    for (let i = 0; i < layerdata.length; ++i) {
      if (!beamnum[i]) continue;
      if (!layerdata[i].isData()) continue;
      if (layerdata[i].isNull()) continue;
      if (!grace && layerdata[i].isGrace()) continue;
      if (grace && !layerdata[i].isGrace()) continue;
      if (bnum !== beamnum[i]) {
        beamednotes.push([]);
        bnum = beamnum[i];
      }
      beamednotes[beamednotes.length - 1].push(i);
    }

    for (let i = 0; i < beamednotes.length; ++i) {
      for (let j = 1; j < beamednotes[i].length - 1; j++) {
        const index1 = beamednotes[i][j - 1];
        const index2 = beamednotes[i][j];
        const index3 = beamednotes[i][j + 1];
        const bcount1 = beamstate[index1];
        const bcount2 = beamstate[index2];
        const bcount3 = beamstate[index3];
        if (bcount2 < bcount1 && bcount2 < bcount3) {
          // mark a breaksec for the given note/chord/rest.
          layerdata[index2].setValue('', 'auto', 'breaksec', String(bcount2));
        }
      }
    }
  }

  public getBeamNotes(token: HTok, beamstart: number): HTok[] {
    const output: HTok[] = [token];
    let current = token.getNextToken();
    while (current !== null) {
      if (current.isBarline()) break;
      if (!current.isData()) { current = current.getNextToken(); continue; }
      if (current.isNull()) { current = current.getNextToken(); continue; }
      const beamend = current.getValueInt('auto', 'beamend');
      output.push(current);
      if (beamend === beamstart) break;
      current = current.getNextToken();
    }
    return output;
  }

  public checkForBeamSameas(beam: Beam, layerdata: HTok[], layerindex: number): boolean {
    if (!this.m_join) return false;
    const token = layerdata[layerindex];
    if (token.getSubtrack() !== 2) return false;
    const ptoken = token.getPreviousFieldToken();
    if (ptoken === null) return false;
    if (ptoken.isNull()) return false;
    if (ptoken.getTrack() !== token.getTrack()) return false;
    const beamstart1 = token.getValueInt('auto', 'beamstart');
    const beamstart2 = ptoken.getValueInt('auto', 'beamstart');
    if (beamstart1 === 0) return false;
    if (beamstart2 === 0) return false;

    const data1 = this.getBeamNotes(token, beamstart1);
    const data2 = this.getBeamNotes(ptoken, beamstart2);

    if (data1.length !== data2.length) return false;
    if (data1.length === 0) return false;

    for (let i = 0; i < data1.length; ++i) {
      if (!data1[i].getDuration().equals(data2[i].getDuration())) return false;
      if (data1[i].isChord()) return false;
      if (data2[i].isChord()) return false;
      if (kernToBase40(data1[i].toString()) !== kernToBase40(data2[i].toString())) return false;
    }

    // The beam is a duplicate of the first layer beam, so make sameas.
    for (let i = 0; i < data1.length; ++i) data1[i].setValue('auto', 'suppress', 1);
    const id = data2[0].getValue('auto', 'beamid');
    if (id !== '' && id !== 'false') beam.GetLinkingInterface()?.SetSameas('#' + id);
    return true;
  }

  public checkForBeamStemSameas(layerdata: HTok[], layerindex: number): boolean {
    if (!this.m_join) return false;
    const token = layerdata[layerindex];
    if (token.getSubtrack() !== 2) return false;
    const ptoken = token.getPreviousFieldToken();
    if (ptoken === null) return false;
    if (ptoken.isNull()) return false;
    if (ptoken.getTrack() !== token.getTrack()) return false;
    const beamstart1 = token.getValueInt('auto', 'beamstart');
    const beamstart2 = ptoken.getValueInt('auto', 'beamstart');
    if (beamstart1 === 0) return false;
    if (beamstart2 === 0) return false;

    // Finished with possible error cases, so now do real checking.
    const data1 = this.getBeamNotes(token, beamstart1);
    const data2 = this.getBeamNotes(ptoken, beamstart2);

    let status = true;
    if (data1.length !== data2.length) status = false;
    if (data1.length === 0) status = false;

    if (status) {
      for (let i = 0; i < data1.length; ++i) {
        if (!data1[i].getDuration().equals(data2[i].getDuration())) { status = false; break; }
        if (data1[i].isChord()) { status = false; break; }
        if (data2[i].isChord()) { status = false; break; }
        if (data1[i].isRest() && !data2[i].isRest()) { status = false; break; }
        if (data2[i].isRest() && !data1[i].isRest()) { status = false; break; }
      }
    }
    if (status) return true;

    // Prevent notes from merging between the two parts.
    for (let i = 0; i < data1.length; ++i) data1[i].setValue('auto', 'Xjoin', 1);
    return false;
  }

  public checkForInvisibleBeam(beam: Beam, tgs: HumdrumBeamAndTuplet[], layerindex: number): boolean {
    const beamnum = tgs[layerindex].beamstart;
    for (let i = layerindex; i < tgs.length; ++i) {
      const tok = tgs[i].token!;
      if (tok === null) {
        LogWarning('In HumdrumInput::checkForInvisibleBeam: Encountered NULL token');
        return false;
      }
      const text = tok.toString();
      if (text.length > 0) {
        if (text[0] === '*' || text[0] === '!' || text[0] === '=') continue;
      }
      else {
        // strange problem
        return false;
      }
      const subtoks = tok.getSubtokens();
      for (let j = 0; j < subtoks.length; j++) {
        if (subtoks[j].indexOf('yy') === -1) return false;
      }
      if (tgs[i].beamend === beamnum) break;
    }
    // All notes in a beam are invisible, so mark the beam as type="invisible":
    beam.SetType('invisible');
    return true;
  }

  /** C++ setBeamLocationId / setTupletLocationId share the id scheme. */
  private setGroupLocationId(object: VrvObject, tgs: HumdrumBeamAndTuplet[], layerdata: HTok[],
    startindex: number, tuplet: boolean): void {
    const startnum = tuplet ? tgs[startindex].tupletstart : tgs[startindex].beamstart;
    const starttoken = layerdata[startindex];
    let id = object.GetClassName().toLowerCase();
    id += '-L' + String(starttoken.getLineNumber());
    id += 'F' + String(starttoken.getFieldNumber());

    let endindex = -1;
    for (let i = startindex + 1; i < tgs.length; ++i) {
      const v = tuplet ? tgs[i].tupletend : tgs[i].beamend;
      if (v === startnum) { endindex = i; break; }
    }
    if (endindex > 0) {
      const endtoken = layerdata[endindex];
      id += '-L' + String(endtoken.getLineNumber());
      id += 'F' + String(endtoken.getFieldNumber());
    }
    object.SetID(id);
  }

  public setBeamLocationId(object: VrvObject, tgs: HumdrumBeamAndTuplet[], layerdata: HTok[], startindex: number): void {
    this.setGroupLocationId(object, tgs, layerdata, startindex, false);
  }

  public setTupletLocationId(object: VrvObject, tgs: HumdrumBeamAndTuplet[], layerdata: HTok[], startindex: number): void {
    this.setGroupLocationId(object, tgs, layerdata, startindex, true);
  }

  public getDataTokenId(token: HTok): string {
    if (token.isChord()) return HumdrumInput.getLocationIdForToken('chord', token.getLineIndex(), token.getFieldIndex());
    if (token.isRest()) return HumdrumInput.getLocationIdForToken('rest', token.getLineIndex(), token.getFieldIndex());
    return HumdrumInput.getLocationIdForToken('note', token.getLineIndex(), token.getFieldIndex());
  }

  public checkForTupletForcedBreak(duritems: HTok[], index: number): boolean {
    if (index === 0) return false;
    if (index > duritems.length) return false;

    const starttok = duritems[index];
    const endtok = duritems[index - 1];
    const stopline = endtok.getLineIndex();
    let curline = starttok.getLineIndex();
    let cur = starttok.getPreviousToken();
    while (cur !== null && curline > stopline) {
      if (cur.isInterpretation() && cur.toString() === '*tupbreak') return true;
      cur = cur.getPreviousToken();
      if (cur === null) break;
      curline = cur.getLineIndex();
      if (cur === endtok) break;
    }
    return false;
  }

  public checkForTupletMergesAndSplits(tupletgroups: number[], duritems: HTok[],
    durations: HumNum[], durforce: boolean[]): void {
    let counter = -1;
    let lastgroup = 0;
    let sum = new HumNum(0);
    let targetsum = new HumNum(0);
    for (let i = 0; i < tupletgroups.length; ++i) {
      if (tupletgroups[i] === 0) continue;
      if (tupletgroups[i] === lastgroup) continue;
      const rparam = duritems[i].getLayoutParameter('TUP', 'r');
      if (rparam === '') { lastgroup = tupletgroups[i]; continue; }

      targetsum = recipToDuration(rparam);
      sum = new HumNum(0);
      for (let j = i; j < tupletgroups.length; j++) {
        if (tupletgroups[j] === 0) {
          // do not allow tuplets outside on non-tuplet notes
          break;
        }
        sum = sum.add(durations[j]);
        if (sum.lessOrEqual(targetsum)) { tupletgroups[j] = counter; durforce[j] = true; }
        if (sum.greaterOrEqual(targetsum)) break;
      }
      lastgroup = tupletgroups[i];
      counter--;
    }

    if (counter === -1) {
      // nothing was updated in tuplet groupings
      return;
    }

    counter = 0;
    lastgroup = 0;
    for (let i = 0; i < tupletgroups.length; ++i) {
      if (tupletgroups[i] === 0) continue;
      if (tupletgroups[i] !== lastgroup) {
        lastgroup = tupletgroups[i];
        counter++;
        for (let j = i; j < tupletgroups.length; j++) {
          i = j;
          if (tupletgroups[j] === lastgroup) tupletgroups[j] = counter;
          else { i = j - 1; break; }
        }
      }
    }
  }

  public assignTupletScalings(tg: HumdrumBeamAndTuplet[]): void {
    let maxgroup = 0;
    for (let i = 0; i < tg.length; ++i) if (maxgroup < tg[i].group) maxgroup = tg[i].group;
    if (maxgroup <= 0) {
      // no tuplets
      return;
    }

    // tggroups is a list of only durational items, removing things like clefs and barlines.
    const tggroups: HumdrumBeamAndTuplet[][] = [];
    for (let i = 0; i <= maxgroup; ++i) tggroups.push([]);
    for (let i = 0; i < tg.length; ++i) {
      const group = tg[i].group;
      if (group <= 0) continue;
      tggroups[group].push(tg[i]);
    }
    for (let i = 1; i < tggroups.length; ++i) this.assignScalingToTupletGroup(tggroups[i]);
  }

  public assignScalingToTupletGroup(tggroup: HumdrumBeamAndTuplet[]): void {
    if (tggroup.length === 0) return;

    // Set a specific number for the tuplet (which make sense).
    const num = tggroup[0].token !== null ? tggroup[0].token.getLayoutParameter('TUP', 'num') : '';
    if (num !== '') {
      const numvalue = parseInt(num, 10);
      if (numvalue > 0) {
        const scale = new HumNum(num).div(tggroup[0].num);
        if (scale.isInteger() && scale.greaterOrEqual(1)) {
          for (let i = 0; i < tggroup.length; ++i) tggroup[i].numscale = scale.getNumerator();
          return;
        }
      }
    }

    // initialize all scalings to 1
    for (let i = 0; i < tggroup.length; ++i) tggroup[i].numscale = 1;

    // C++ std::map<hum::HumNum,int> durcounts; ordered ascending by duration.
    const durcounts: Array<{ dur: HumNum; count: number }> = [];
    for (let i = 0; i < tggroup.length; ++i) {
      const found = durcounts.find((d) => d.dur.equals(tggroup[i].durationnodots));
      if (found) found.count++;
      else durcounts.push({ dur: tggroup[i].durationnodots, count: 1 });
    }
    durcounts.sort((a, b) => a.dur.getFloat() - b.dur.getFloat());

    // All durations are the same, so set the scale to the multiple of how
    // many of that duration are present.
    if (durcounts.length === 1) {
      const scale = new HumNum(durcounts[0].count).div(tggroup[0].num);
      if (scale.isInteger() && scale.greater(1)) {
        for (let i = 0; i < tggroup.length; ++i) tggroup[i].numscale = scale.getNumerator();
      }
      return;
    }

    if (durcounts.length === 2) {
      const count1 = durcounts[0].count;
      const count2 = durcounts[1].count;
      if (count1 === count2) {
        const scale = new HumNum(count1).div(tggroup[0].num);
        if (scale.isInteger() && scale.greater(1)) {
          for (let i = 0; i < tggroup.length; ++i) tggroup[i].numscale = scale.getNumerator();
        }
        return;
      }
    }

    // Select the longest duration if there is a tie.
    let maxcountdur = new HumNum(0);
    for (let i = 0; i < durcounts.length; ++i) {
      if (durcounts[i].dur.greater(maxcountdur)) maxcountdur = durcounts[i].dur;
    }

    let totaldur = new HumNum(0);
    for (let i = 0; i < tggroup.length; ++i) totaldur = totaldur.add(tggroup[i].duration);

    const units = totaldur.div(maxcountdur);
    if (units.isInteger() && units.greater(1)) {
      const scale = units.div(tggroup[0].num);
      if (scale.isInteger() && scale.greater(1)) {
        for (let i = 0; i < tggroup.length; ++i) tggroup[i].numscale = scale.getNumerator();
      }
    }
  }

  public mergeTupletsCuttingBeam(tg: HumdrumBeamAndTuplet[]): void {
    // newtg is a list of only durational items, removing things like clefs and barlines.
    const newtg: HumdrumBeamAndTuplet[] = [];
    for (let i = 0; i < tg.length; ++i) if (tg[i].group >= 0) newtg.push(tg[i]);

    const inbeam: number[] = new Array(newtg.length).fill(0);
    for (let i = 0; i < inbeam.length; ++i) {
      if (newtg[i].force) inbeam[i] = 0;
      else if (newtg[i].beamstart) inbeam[i] = newtg[i].beamstart;
      else if (newtg[i].beamend) inbeam[i] = 0;
      else if (i > 0) inbeam[i] = inbeam[i - 1];
      else inbeam[i] = 0;
    }

    const scaleadj: number[] = new Array(newtg.length).fill(1);

    for (let i = 0; i < newtg.length; ++i) {
      if (!(inbeam[i] && newtg[i].tupletend)) continue;
      if (i >= newtg.length - 1) continue;
      if (!newtg[i + 1].tupletstart) continue;
      if (newtg[i].num !== newtg[i + 1].num) continue;
      if (newtg[i].numbase !== newtg[i + 1].numbase) continue;
      // Need to merge adjacent tuplets (only can merge one pair at a time
      // properly with scaleadj at the moment).
      let target = newtg[i].tupletend;
      for (let j = i; j >= 0; j--) {
        if (!newtg[j].tupletstart) { scaleadj[j] = 2; continue; }
        if (target === newtg[j].tupletstart) { scaleadj[j] = 2; break; }
        LogWarning('In HumdrumInput::mergeTupletsCuttingBeam: Something strange happened');
      }
      target = newtg[i + 1].tupletstart;
      scaleadj[i] = 2;
      scaleadj[i + 1] = 2;
      for (let j = i + 1; j < newtg.length; j++) {
        if (newtg[j].group < 0) continue;
        if (!newtg[j].tupletend) { scaleadj[j] = 2; continue; }
        if (target === newtg[j].tupletend) { scaleadj[j] = 2; break; }
        LogWarning('In HumdrumInput::mergeTupletsCuttingBeam: Something strange happened (2)');
      }

      newtg[i].tupletend = 0;
      newtg[i + 1].tupletstart = 0;
      for (let j = i + 2; j < newtg.length; j++) {
        if (newtg[j].tupletstart) newtg[j].tupletstart--;
        if (newtg[j].tupletend) newtg[j].tupletend--;
      }
    }

    // recalculate tuplet groups
    let currgroup = 0;
    for (let i = 0; i < newtg.length; ++i) {
      if (newtg[i].tupletstart) currgroup = newtg[i].tupletstart;
      newtg[i].group = currgroup;
      if (newtg[i].tupletend) currgroup = 0;
    }

    for (let i = 0; i < newtg.length; ++i) {
      if (newtg[i].group < 0) continue;
      newtg[i].numscale *= scaleadj[i];
    }
  }

  public resolveTupletBeamTie(tg: HumdrumBeamAndTuplet[]): void {
    for (let i = 0; i < tg.length; ++i) {
      if (tg[i].beamstart && tg[i].tupletstart) this.resolveTupletBeamStartTie(tg, i);
      else if (tg[i].beamend && tg[i].tupletend) this.resolveTupletBeamEndTie(tg, i);
      else tg[i].priority = ' ';
    }
  }

  public resolveTupletBeamStartTie(tg: HumdrumBeamAndTuplet[], index: number): void {
    // presumably tupnum and beamnum are non-zero...
    const tupnum = tg[index].tupletstart;
    const beamnum = tg[index].beamstart;
    for (let i = index; i < tg.length; ++i) {
      if (tg[i].beamend === beamnum) {
        // beam ends before tuplet does, so tuplet should be give priority.
        tg[index].priority = 'T'; // open tuplet first
        return;
      }
      if (tg[i].tupletend === tupnum) {
        // tuplet ends before beam does, so beam should be opened first.
        tg[index].priority = 'B'; // open beam first
        return;
      }
    }
    // strange problem
    tg[index].priority = ' ';
  }

  public resolveTupletBeamEndTie(tg: HumdrumBeamAndTuplet[], index: number): void {
    // presumably tupnum and beamnum are non-zero...
    const tupnum = tg[index].tupletend;
    const beamnum = tg[index].beamend;
    for (let i = index; i >= 0; i--) {
      if (tg[i].beamstart === beamnum) {
        // beam starts after tuplet does, so beam should be closed first.
        tg[index].priority = 'B'; // close beam first
        return;
      }
      if (tg[i].tupletstart === tupnum) {
        // tuplet starts after beam does, so tuplet should be closed first.
        tg[index].priority = 'T'; // close tuplet first
        return;
      }
    }
    // strange problem
    tg[index].priority = ' ';
  }

  /** C++ std::vector::resize default-constructs fresh HumdrumBeamAndTuplet. */
  private resizeTgs(tgs: HumdrumBeamAndTuplet[], size: number): void {
    tgs.length = 0;
    for (let i = 0; i < size; ++i) tgs.push(new HumdrumBeamAndTuplet());
  }

  public prepareBeamAndTupletGroups(tgs: HumdrumBeamAndTuplet[], layerdata: HTok[]): void {
    const analyzed = this.analyzeLayerBeams(layerdata);
    const beamnum = analyzed.beamnum;
    const gbeamnum = analyzed.gbeamnum;
    tgs.length = 0;

    // duritems == a list of items in the layer which have duration.
    // Grace notes, barlines, interpretations, local comments, global comments,
    // etc. are filtered out for the analysis.
    const duritems: HTok[] = [];
    // indexmapping == mapping from a duritem index to a layerdata index.
    const indexmapping: number[] = [];
    // indexmapping2 == mapping from a layerdata index to a duritem index,
    // with -1 meaning no mapping.
    const indexmapping2: number[] = [];
    // durbeamnum == beam numbers for durational items only.
    const durbeamnum: number[] = [];

    for (let i = 0; i < layerdata.length; ++i) {
      if (!layerdata[i].isData()) { indexmapping2.push(-1); continue; }
      if (layerdata[i].isNull()) { indexmapping2.push(-1); continue; }
      if (layerdata[i].isGrace()) { indexmapping2.push(-1); continue; }
      // don't consider notes without durations
      const dur = recipToDuration(layerdata[i].toString());
      if (dur.isZero()) { indexmapping2.push(-1); continue; }
      indexmapping.push(i);
      indexmapping2.push(indexmapping.length - 1);
      duritems.push(layerdata[i]);
      durbeamnum.push(beamnum[i]);
    }

    // poweroftwo == keeps track whether durations are based on a power
    // (non-tuplet) or not (tuplet). Notes/rests with false poweroftwo will be
    // grouped into tuplets.
    const poweroftwo: boolean[] = new Array(duritems.length).fill(false);
    let hastupletQ = false;
    const dotlessdur: HumNum[] = new Array(duritems.length);
    for (let i = 0; i < duritems.length; ++i) {
      const duration = recipToDurationNoDots(duritems[i].toString());
      dotlessdur[i] = duration.div(4);
      poweroftwo[i] = duration.isPowerOfTwo();
      hastupletQ = hastupletQ || !poweroftwo[i];
    }

    // Count the number of beams. The durbeamnum vector contains a list of beam
    // numbers starting from 1 (or 0 if a note/rest has no beam).
    let beamcount = 0;
    for (let i = 0; i < durbeamnum.length; ++i) if (durbeamnum[i] > beamcount) beamcount = durbeamnum[i];

    // beamstarts and beamends are lists of the starting and ending index for
    // beams of duration items in the layer. The index is into the durlist
    // vector (list of items which posses duration).
    const beamstarts: number[] = new Array(beamcount).fill(-1);
    const beamends: number[] = new Array(beamcount).fill(0);
    for (let i = 0; i < durbeamnum.length; ++i) {
      if (durbeamnum[i]) {
        if (beamstarts[durbeamnum[i] - 1] < 0) beamstarts[durbeamnum[i] - 1] = i;
        beamends[durbeamnum[i] - 1] = i;
      }
    }

    // beamstartboolean == starting of a beam on a particular note
    // beamendboolean == ending of a beam on a particular note
    const beamstartboolean: number[] = new Array(durbeamnum.length).fill(0);
    const beamendboolean: number[] = new Array(durbeamnum.length).fill(0);
    for (let i = 0; i < beamstarts.length; ++i) {
      beamstartboolean[beamstarts[i]] = i + 1;
      beamendboolean[beamends[i]] = i + 1;
    }

    // Calculate grace note beam starts and ends. Presuming no clef changes,
    // etc. found between notes in a gracenote beam.
    const gbeamstart: number[] = new Array(layerdata.length).fill(0);
    const gbeamend: number[] = new Array(layerdata.length).fill(0);
    const gstate: number[] = new Array(layerdata.length).fill(0);
    for (let i = 0; i < gbeamnum.length; ++i) {
      if (!gbeamnum[i]) continue;
      else if (gstate[gbeamnum[i]]) continue;
      else { gstate[gbeamnum[i]] = 1; gbeamstart[i] = gbeamnum[i]; }
    }
    gstate.fill(0);
    for (let i = gbeamnum.length - 1; i >= 0; i--) {
      if (!gbeamnum[i]) continue;
      else if (gstate[gbeamnum[i]]) continue;
      else { gstate[gbeamnum[i]] = 1; gbeamend[i] = gbeamnum[i]; }
    }

    // tgs may not be completly filled in if there are no tuplets.
    if (!hastupletQ) {
      this.resizeTgs(tgs, layerdata.length);
      for (let i = 0; i < layerdata.length; ++i) {
        tgs[i].token = layerdata[i];
        tgs[i].gbeamstart = gbeamstart[i];
        tgs[i].gbeamend = gbeamend[i];
        if (indexmapping2[i] < 0) continue;
        tgs[i].beamstart = beamstartboolean[indexmapping2[i]];
        tgs[i].beamend = beamendboolean[indexmapping2[i]];
        if (tgs[i].beamstart) layerdata[i].setValue('auto', 'beamstart', tgs[i].beamstart);
        if (tgs[i].beamend) layerdata[i].setValue('auto', 'beamend', tgs[i].beamend);
      }
      return;
    }

    // durationwithdots == full duration of the note/rest including augmentation dots.
    const durationwithdots: HumNum[] = new Array(duritems.length);
    // dursum = a cumulative sum of the full durs, starting at 0 for the first index.
    const dursum: HumNum[] = new Array(duritems.length);
    let sum = new HumNum(0);
    for (let i = 0; i < dotlessdur.length; ++i) {
      durationwithdots[i] = recipToDuration(duritems[i].toString());
      dursum[i] = sum;
      sum = sum.add(durationwithdots[i]);
    }

    // beamdur = a list of the durations for each beam.
    const beamdur: HumNum[] = new Array(beamstarts.length);
    for (let i = 0; i < beamdur.length; ++i) {
      beamdur[i] = dursum[beamends[i]].sub(dursum[beamstarts[i]]).add(durationwithdots[beamends[i]]);
    }

    // beampowdot == the number of augmentation dots on a power of two for the
    // duration of the beam. -1 means could not be made power of two with dots.
    const beampowdot: number[] = new Array(beamstarts.length).fill(-1);
    for (let i = 0; i < beampowdot.length; ++i) beampowdot[i] = HumdrumInput.getDotPowerOfTwo(beamdur[i]);

    const binarybeams: boolean[] = new Array(beamstarts.length).fill(false);
    for (let i = 0; i < binarybeams.length; ++i) {
      if (poweroftwo[beamstarts[i]]) binarybeams[i] = true;
    }

    // Assume that tuplet beams that can fit into a power of two will form a
    // tuplet group.
    const tupletgroups: number[] = new Array(poweroftwo.length).fill(0);
    // durforce: boolean for if a tuplet has been forced to be broken on the
    // current note.
    const durforce: boolean[] = new Array(poweroftwo.length).fill(false);
    // tupletbracket == boolean for if the tuplet group requires a bracket.
    const tupletbracket: number[] = new Array(poweroftwo.length).fill(-1);
    let tupletnum = 1;
    // adjustcount == Adjusted tuplet number by tuplet group.
    const adjustcount: number[] = [];

    let tupletdur = new HumNum(0);
    let tupletcount = 0;
    let samedurtup = true;

    for (let i = 0; i < beampowdot.length; ++i) {
      if (binarybeams[i]) continue;
      let ingroup = false;
      if (beampowdot[i] >= 0) {
        for (let j = beamstarts[i]; j <= beamends[i]; ++j) {
          // may have to deal with dotted triplets (that appear to be powers of two)
          if (poweroftwo[j]) {
            if (ingroup) { ingroup = false; tupletnum++; }
            tupletbracket[j] = 0;
            continue;
          }
          ingroup = true;
          tupletgroups[j] = tupletnum;
          if (tupletcount === 0) {
            samedurtup = true;
            tupletdur = durationwithdots[j];
          }
          else if (!tupletdur.equals(durationwithdots[j])) {
            samedurtup = false;
          }
          tupletcount++;
          tupletbracket[j] = 0;
        }
        if (samedurtup) {
          if (tupletnum >= adjustcount.length) {
            const oldsize = adjustcount.length;
            for (let z = oldsize; z < tupletnum + 1; ++z) adjustcount.push(0);
          }
          adjustcount[tupletnum] = tupletcount;
        }
        tupletnum++;
        tupletcount = 0;
      }
    }

    let tcorrection = 0;
    for (let i = 0; i < tupletgroups.length; ++i) {
      if (this.checkForTupletForcedBreak(duritems, i)) tcorrection++;
      if (tupletgroups[i]) tupletgroups[i] += tcorrection;
    }
    if (tcorrection) {
      // invalidate adjustcount
      for (let i = 0; i < adjustcount.length; ++i) adjustcount[i] = 0;
    }

    const beamstarts2: boolean[] = new Array(poweroftwo.length).fill(false);
    for (let i = 0; i < beamstarts.length; ++i) beamstarts2[beamstarts[i]] = true;
    const beamends2: boolean[] = new Array(poweroftwo.length).fill(false);
    for (let i = 0; i < beamends.length; ++i) beamends2[beamends[i]] = true;

    // Go back and link all partial beamed tuplets and non-beamed tuplets.
    let groupdur = new HumNum(0);
    let hasRest = false;
    for (let i = 0; i < poweroftwo.length; ++i) {
      if (poweroftwo[i]) continue;
      if (tupletgroups[i]) continue;
      // At a tuplet which is not already in a tuplet group, search for how
      // long the group should occur.
      let j = i + 1;
      let ending = poweroftwo.length - 1;
      groupdur = new HumNum(0);
      while (j < poweroftwo.length) {
        if (!hasRest && duritems[j].isRest()) hasRest = true;
        if (poweroftwo[j]) { ending = j - 1; break; }
        if (tupletgroups[j]) { ending = j - 1; break; }
        groupdur = dursum[j].sub(dursum[i]).add(durationwithdots[j]);
        if (groupdur.isPowerOfTwo()) { ending = j; break; }
        j++;
      }
      if (ending >= 0) {
        // create a new tuplet group (which will require a bracket).
        for (j = i; j <= ending; ++j) {
          tupletgroups[j] = tupletnum;
          // Only turn on a tuplet bracket if the tuplet is not inside of a beam.
          if (!hasRest) tupletbracket[j] = 1;
        }
        tupletnum++;
        i = ending;
      }
    }

    this.checkForTupletMergesAndSplits(tupletgroups, duritems, durationwithdots, durforce);

    // tupletstartboolean == starting of a tuplet group
    // tupletendboolean == ending of a tuplet group
    const tupletstartboolean: number[] = new Array(tupletgroups.length).fill(0);
    const tupletendboolean: number[] = new Array(tupletgroups.length).fill(0);
    const tstart: boolean[] = new Array(tupletgroups.length).fill(false);
    const tend: boolean[] = new Array(tupletgroups.length).fill(false);
    for (let i = 0; i < tupletgroups.length; ++i) {
      if (!tupletgroups[i]) continue;
      if (!tstart[tupletgroups[i] - 1]) {
        tupletstartboolean[i] = tupletgroups[i];
        tstart[tupletgroups[i] - 1] = true;
      }
    }
    for (let i = tupletgroups.length - 1; i >= 0; i--) {
      if (!tupletgroups[i]) continue;
      if (!tend[tupletgroups[i] - 1]) {
        tupletendboolean[i] = tupletgroups[i];
        tend[tupletgroups[i] - 1] = true;
      }
    }

    const tuptop: number[] = new Array(tupletgroups.length).fill(-1);
    const tupbot: number[] = new Array(tupletgroups.length).fill(-1);
    for (let i = 0; i < tupletgroups.length; ++i) {
      if (!tupletgroups[i]) continue;
      let nextpowoftwo: HumNum;
      if (dotlessdur[i].less(1)) nextpowoftwo = HumdrumInput.nextHigherPowerOfTwo(dotlessdur[i]);
      else nextpowoftwo = new HumNum(HumdrumInput.nextLowerPowerOfTwo(Math.trunc(tuptop[i] / tupbot[i])));

      if (dotlessdur[i].getNumerator() === 3) {
        const testval = new HumNum(dotlessdur[i].getDenominator());
        if (testval.isPowerOfTwo()) {
          // correction for duplets
          nextpowoftwo = nextpowoftwo.div(2);
        }
      }
      const value = dotlessdur[i].div(nextpowoftwo);
      tuptop[i] = value.getDenominator();
      tupbot[i] = value.getNumerator();

      // Reference tuplet breve do breve rather than whole.
      if (dotlessdur[i].getNumerator() === 4 && dotlessdur[i].getDenominator() === 3) tupbot[i] = 2;
    }

    // adjust tupletgroups based on tuptop and tupbot changes
    let correction = 0;
    for (let i = 1; i < tuptop.length; ++i) {
      if (tuptop[i] === 1 && tupbot[i] === 1) continue;
      if (tuptop[i] === -1 && tupbot[i] === -1) continue;
      if (tuptop[i - 1] === 1 && tupbot[i - 1] === 1) continue;
      if (tuptop[i - 1] === -1 && tupbot[i - 1] === -1) continue;
      if (tuptop[i] !== tuptop[i - 1] || tupbot[i] !== tupbot[i - 1]) {
        if (tupletgroups[i] === tupletgroups[i - 1]) {
          correction++;
          tupletstartboolean[i] = 1;
          tupletendboolean[i - 1] = 1;
        }
      }
      tupletgroups[i] += correction;
    }
    for (let i = 0; i < tuptop.length; ++i) if (tuptop[i] < 0) tuptop[i] = -tuptop[i];

    // ponytail: C++ computes a `tupletscale` vector here that is never read
    // afterwards; skipped. Add back if a consumer appears.

    this.resizeTgs(tgs, layerdata.length);
    for (let i = 0; i < layerdata.length; ++i) {
      tgs[i].token = layerdata[i];
      if (indexmapping2[i] < 0) {
        // this is a non-durational layer item or a non-tuplet note.
        tgs[i].duration = new HumNum(0);
        tgs[i].durationnodots = new HumNum(0);
        tgs[i].group = -1;
        tgs[i].bracket = -1;
        tgs[i].num = -1;
        tgs[i].numbase = -1;
        tgs[i].numscale = 1;
        tgs[i].beamstart = 0;
        tgs[i].beamend = 0;
        tgs[i].gbeamstart = gbeamstart[i];
        tgs[i].gbeamend = gbeamend[i];
        tgs[i].tupletstart = 0;
        tgs[i].tupletend = 0;
        tgs[i].force = false;
        tgs[i].priority = ' ';
      }
      else {
        // this is a tuplet note (with duration)
        const k = indexmapping2[i];
        tgs[i].duration = layerdata[i].getDuration();
        tgs[i].durationnodots = layerdata[i].getDurationNoDots();
        tgs[i].group = tupletgroups[k];
        tgs[i].bracket = tupletbracket[k];
        tgs[i].num = tuptop[k];
        tgs[i].numbase = tupbot[k];
        tgs[i].beamstart = beamstartboolean[k];
        tgs[i].beamend = beamendboolean[k];
        tgs[i].gbeamstart = gbeamstart[i];
        tgs[i].gbeamend = gbeamend[i];
        tgs[i].tupletstart = tupletstartboolean[k];
        tgs[i].force = durforce[k];
        tgs[i].tupletend = tupletendboolean[k];
        tgs[i].numscale = 1;
      }
    }

    // Renumber tuplet groups in sequence (otherwise the mergeTupletsCuttingBeam()
    // function will delete the 1st group if it is not the first tuplet.
    let tcounter = 0;
    for (let i = 0; i < tgs.length; ++i) {
      if (tgs[i].tupletstart) tgs[i].tupletstart = ++tcounter;
      else if (tgs[i].tupletend) tgs[i].tupletend = tcounter;
    }

    this.mergeTupletsCuttingBeam(tgs);
    this.resolveTupletBeamTie(tgs);
    this.assignTupletScalings(tgs);

    this.storeTupletAndBeamInfoInTokens(tgs);
  }

  public storeTupletAndBeamInfoInTokens(tgs: HumdrumBeamAndTuplet[]): void {
    for (let i = 0; i < tgs.length; ++i) {
      const token = tgs[i].token!;
      if (token === null) continue;
      if (tgs[i].beamstart) token.setValue('auto', 'beamstart', tgs[i].beamstart);
      if (tgs[i].beamend) token.setValue('auto', 'beamend', tgs[i].beamend);
    }
  }

  public fixLargeTuplets(tg: HumdrumBeamAndTuplet[]): void {
    // triplet-whole + triplet-breve cases
    for (let i = 1; i < tg.length; ++i) {
      if (tg[i].tupletstart === 2 && tg[i].tupletend === 1
        && tg[i - 1].tupletstart === 1 && tg[i - 1].tupletend === 1) {
        tg[i].tupletstart = 0;
        tg[i - 1].tupletend = 0;
      }
    }
    // two triplet-halfs + triplet-breve case
    for (let i = 2; i < tg.length; ++i) {
      if (tg[i].tupletstart === 2 && tg[i].tupletend === 1 && tg[i - 1].tupletstart === 0
        && tg[i - 1].tupletend === 1 && tg[i - 2].tupletstart === 1 && tg[i - 2].tupletend === 0) {
        tg[i - 1].numscale = 1;
        tg[i - 2].numscale = 1;
        tg[i].tupletstart = 0;
        tg[i - 1].tupletend = 0;
        tg[i].numbase = 2;
      }
    }
    // two triplet-halfs + triplet-breve case + two triplet-halfs
    for (let i = 2; i < tg.length; ++i) {
      if (tg[i].tupletstart === 0 && tg[i].tupletend === 2 && tg[i - 1].tupletstart === 2
        && tg[i - 1].tupletend === 0 && tg[i - 2].tupletstart === 1 && tg[i - 2].tupletend === 1) {
        tg[i].tupletend = 1;
        tg[i - 1].tupletstart = 0;
        tg[i - 2].tupletend = 0;
        tg[i - 2].numbase = 2;
        tg[i].numscale = 1;
        tg[i - 1].numscale = 1;
      }
    }
  }

  public printGroupInfo(tg: HumdrumBeamAndTuplet[]): void {
    const lines: string[] = ['TOK\t\tGRP\tBRAK\tNUM\tNBASE\tNSCAL\tBSTART\tBEND\tGBST\tGBEND\tTSTART\tTEND\tFORCE\tPRIORITY'];
    for (let i = 0; i < tg.length; ++i) {
      let line = String(tg[i].token);
      if (tg[i].token && String(tg[i].token).length < 8) line += '\t';
      line += `\t${tg[i].group}\t${tg[i].bracket}\t${tg[i].num}\t${tg[i].numbase}\t${tg[i].numscale}`;
      line += `\t${tg[i].beamstart}\t${tg[i].beamend}\t${tg[i].gbeamstart}\t${tg[i].gbeamend}`;
      line += `\tTS:${tg[i].tupletstart}\tTE:${tg[i].tupletend}\t${tg[i].force}\t${tg[i].priority}`;
      lines.push(line);
    }
    lines.push('============================================');
    for (const l of lines) console.error(l);
  }

  /** C++ hasAboveParameter: LO/<category> linked parameter set with @a or @Z. */
  public hasAboveParameter(token: HTok, category: string, outputRef?: { value: number } | number): boolean {
    if (token === null || token.getLinkedParameterSetCount() === 0) return false;
    for (let p = 0; p < token.getLinkedParameterSetCount(); ++p) {
      const hps = token.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO') continue;
      if (hps.getNamespace2() !== category) continue;
      for (let q = 0; q < hps.getCount(); ++q) {
        const key = hps.getParameterName(q);
        const value = hps.getParameterValue(q);
        if (key === 'a') {
          if (value === 'true') {
            if (outputRef && typeof outputRef === 'object') outputRef.value = 0;
          } else if (value.length > 0 && value[0] >= '0' && value[0] <= '9') {
            let out = parseInt(value, 10);
            if (out !== 0) out = -(out - 1);
            if (outputRef && typeof outputRef === 'object') outputRef.value = out;
          }
          return true;
        }
        if (key === 'Y' || key === 'Z') return true;
      }
    }
    return false;
  }

  /** C++ hasBelowParameter: LO/<category> linked parameter set with @b or @Y. */
  public hasBelowParameter(token: HTok, category: string, outputRef?: { value: number } | number): boolean {
    if (token === null || token.getLinkedParameterSetCount() === 0) return false;
    for (let p = 0; p < token.getLinkedParameterSetCount(); ++p) {
      const hps = token.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO') continue;
      if (hps.getNamespace2() !== category) continue;
      for (let q = 0; q < hps.getCount(); ++q) {
        const key = hps.getParameterName(q);
        const value = hps.getParameterValue(q);
        if (key === 'b') {
          if (value === 'true') {
            if (outputRef && typeof outputRef === 'object') outputRef.value = 0;
          } else if (value.length > 0 && value[0] >= '0' && value[0] <= '9') {
            let out = parseInt(value, 10);
            if (out !== 0) out = out - 1;
            if (outputRef && typeof outputRef === 'object') outputRef.value = out;
          }
          return true;
        }
        if (key === 'Y' || key === 'Z') return true;
      }
    }
    return false;
  }

  /** C++ hasCenterParameter: LO/<category> linked parameter set with @c. */
  public hasCenterParameter(token: HTok, category: string, outputRef?: { value: number } | number): boolean {
    if (token === null || token.getLinkedParameterSetCount() === 0) return false;
    for (let p = 0; p < token.getLinkedParameterSetCount(); ++p) {
      const hps = token.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO') continue;
      if (hps.getNamespace2() !== category) continue;
      for (let q = 0; q < hps.getCount(); ++q) {
        const key = hps.getParameterName(q);
        const value = hps.getParameterValue(q);
        if (key === 'c') {
          if (value === 'true') {
            if (outputRef && typeof outputRef === 'object') outputRef.value = 0;
          } else if (value.length > 0 && value[0] >= '0' && value[0] <= '9') {
            let out = parseInt(value, 10);
            if (out !== 0) out = -(out - 1);
            if (outputRef && typeof outputRef === 'object') outputRef.value = out;
          }
          return true;
        }
        if (key === 'Y') return true;
      }
    }
    return false;
  }

  /**
   * C++ HumdrumInput::checkForTremolo (iohumdrum.cpp ~12998): convert a
   * beamed group into bTrem/fTrem when *tremolo is active. Sets auto
   * tremolo/tremolo2/tremoloAux/recip/slashes/unit/beams values and
   * suppresses non-primary notes.
   */
  public checkForTremolo(layerdata: HTok[], tgs: HumdrumBeamAndTuplet[], startindex: number): boolean {
    const beamnumber = tgs[startindex].beamstart;
    const notes: HTok[] = [];
    for (let i = startindex; i < layerdata.length; ++i) {
      if (layerdata[i].isNote()) notes.push(layerdata[i]);
      if (tgs[i].beamend === beamnumber) break;
    }
    if (notes.length === 0) return false;
    let duration = notes[0].getDuration();
    const pitches: number[][] = new Array(notes.length);
    let firstHasTie = false;
    let lastHasTie = false;
    for (let i = 0; i < notes.length; ++i) {
      const s = notes[i].toString();
      if (s.indexOf('_') !== -1 || s.indexOf('[') !== -1 || s.indexOf(']') !== -1) {
        if (i === 0) firstHasTie = true;
        else if (i === notes.length - 1) lastHasTie = true;
        else return false;
      }
      if (i > 0) {
        const testdur = notes[i].getDuration();
        if (!testdur.equals(duration)) return false;
      }
      pitches[i] = [];
      const scount = notes[i].getSubtokenCount();
      for (let j = 0; j < scount; j++) pitches[i].push(kernToBase40(notes[i].getSubtoken(j)));
    }
    const nextsame: boolean[] = new Array(notes.length).fill(true);
    let allpequal = true;
    if (firstHasTie || lastHasTie) allpequal = false;
    else {
      for (let i = 1; i < pitches.length; ++i) {
        if (pitches[i].length !== pitches[i - 1].length) { allpequal = false; nextsame[i - 1] = false; }
        for (let j = 0; j < pitches[i].length; j++) {
          if (pitches[i][j] !== pitches[i - 1][j]) { allpequal = false; nextsame[i - 1] = false; }
        }
      }
    }
    if (allpequal) {
      const tdur = duration.mul(notes.length);
      const recip = durationToRecip(tdur);
      let slashes = Math.log(duration.getFloat()) / Math.log(2.0);
      const noteslash = Math.log(tdur.getFloat()) / Math.log(2.0);
      if (noteslash < 0) slashes = slashes - noteslash;
      slashes = -slashes;
      if (slashes <= 0) return false;
      notes[0].setValue('auto', 'tremolo', '1');
      notes[0].setValue('auto', 'recip', recip);
      notes[0].setValue('auto', 'slashes', String(slashes));
      for (let i = 1; i < notes.length; ++i) notes[i].setValue('auto', 'suppress', '1');
      return true;
    }
    let hasInternalTrem = true;
    for (let i = 1; i < nextsame.length - 1; ++i) {
      if (nextsame[i]) continue;
      if (!nextsame[i - 1]) { hasInternalTrem = false; break; }
      else if (!nextsame[i + 1]) { hasInternalTrem = false; break; }
    }
    if (nextsame.length === 2) {
      if (!nextsame[0] && nextsame[1]) hasInternalTrem = false;
    }
    const groupings: HTok[][] = [];
    if (hasInternalTrem) {
      groupings.push([notes[0]]);
      for (let i = 0; i < notes.length - 1; ++i) {
        if (nextsame[i]) groupings[groupings.length - 1].push(notes[i + 1]);
        else groupings.push([notes[i + 1]]);
      }
    }
    let allpow2 = true;
    if (hasInternalTrem) {
      for (let i = 0; i < groupings.length; ++i) {
        if (!new HumNum(groupings[i].length).isPowerOfTwo()) { allpow2 = false; break; }
      }
    }
    if (hasInternalTrem && allpow2) {
      for (let i = 0; i < groupings.length; ++i) {
        for (let j = 1; j < groupings[i].length; j++) groupings[i][j].setValue('auto', 'suppress', '1');
      }
      for (let i = 0; i < groupings.length; ++i) {
        const tdur = duration.mul(groupings[i].length);
        const recip = durationToRecip(tdur);
        const slashcount = -Math.trunc(Math.log2(duration.getFloat() / tdur.getFloat()));
        groupings[i][0].setValue('auto', 'tremolo', '1');
        groupings[i][0].setValue('auto', 'slashes', String(slashcount));
        groupings[i][0].setValue('auto', 'recip', recip);
      }
      groupings[0][0].setValue('auto', 'tremoloBeam', '8');
      groupings[groupings.length - 1][groupings[groupings.length - 1].length - 1].setValue('auto', 'tremoloBeam', '8');
      return false;
    }
    if (pitches.length < 3) return false;
    for (let i = 2; i < pitches.length; ++i) {
      if (pitches[i].length !== pitches[i - 2].length) return false;
      for (let j = 0; j < pitches[i].length; j++) {
        if (pitches[i][j] !== pitches[i - 2][j]) return false;
      }
    }
    const tdur = duration.mul(notes.length);
    const recip = durationToRecip(tdur);
    const unitrecip = durationToRecip(duration);
    const beams = -Math.log(duration.getFloat()) / Math.log(2.0);
    if (beams <= 0) return false;
    notes[0].setValue('auto', 'tremolo2', '1');
    notes[0].setValue('auto', 'recip', recip);
    notes[0].setValue('auto', 'unit', unitrecip);
    notes[0].setValue('auto', 'beams', String(beams));
    const lasti = notes.length - 1;
    notes[lasti].setValue('auto', 'tremoloAux', '1');
    notes[lasti].setValue('auto', 'recip', recip);
    if (lasti > 1) {
      const visacc = notes[1].getValue('auto', '0', 'visualAccidental');
      if (visacc === 'true') notes[lasti].setValue('auto', '0', 'visualAccidental', 'true');
    }
    for (let i = 1; i < notes.length; ++i) notes[i].setValue('auto', 'suppress', '1');
    return true;
  }

  public setBeamDirection(direction: number, tgs: HumdrumBeamAndTuplet[], layerdata: HTok[],
    layerindex: number, grace: boolean): void {
    const tg = tgs[layerindex];
    const beamstart = grace ? tg.gbeamstart : tg.beamstart;

    for (let i = layerindex; i < layerdata.length; ++i) {
      const beamend = grace ? tgs[i].gbeamend : tgs[i].beamend;
      if (!layerdata[i].isData()) continue;
      if (layerdata[i].isNull()) continue;
      if (layerdata[i].isRest()) {
        // not adding stem direction to rests
        continue;
      }
      if (layerdata[i].getDuration().isZero() && !grace) {
        // ignore grace note beams
        continue;
      }
      else if (!layerdata[i].getDuration().isZero() && grace) {
        // ignore non-grace note beams
        continue;
      }
      layerdata[i].setValue('auto', 'stem.dir', String(direction));
      if (beamend === beamstart) {
        // last note of beam so exit
        break;
      }
    }
  }

  public checkBeamWith(beam: Beam, tgs: HumdrumBeamAndTuplet[], layerdata: HTok[], startindex: number): void {
    if (this.m_signifiers.above === '' && this.m_signifiers.below === '') return;
    const hre = new HumRegex();
    const targetEnd = tgs[startindex].beamstart;
    let isAbove = true;
    let isBelow = true;
    let foundAbove = false;
    let foundBelow = false;
    let aboveSearch = '[A-Ga-gn#-][XxYy]?';
    let belowSearch = '[A-Ga-gn#-][XxYy]?';
    aboveSearch += this.m_signifiers.above;
    belowSearch += this.m_signifiers.below;
    for (let i = startindex; i < layerdata.length; ++i) {
      if (!(layerdata[i].isNote() || layerdata[i].isRest())) continue;
      if (isAbove) foundAbove = hre.search(layerdata[i].toString(), aboveSearch) !== 0;
      if (isBelow) foundBelow = hre.search(layerdata[i].toString(), belowSearch) !== 0;
      isAbove = isAbove && foundAbove;
      isBelow = isBelow && foundBelow;
      if (!(isAbove || isBelow)) break;
      if (tgs[i].beamend === targetEnd) break;
    }
    if (!(isAbove || isBelow)) return;
    if (isAbove) beam.SetBeamWith(NEIGHBORINGLAYER_above);
    if (isBelow) beam.SetBeamWith(NEIGHBORINGLAYER_below);
  }

  public shouldHideBeamBracket(tgs: HumdrumBeamAndTuplet[], layerdata: HTok[], layerindex: number): boolean {
    const starttok = layerdata[layerindex];
    if (starttok.toString().indexOf('L') === -1) return false;
    let beamedge = false;
    const targettup = tgs[layerindex].tupletstart;
    let i = layerindex + 1;
    let endtok: HTp = null;
    while (i < layerdata.length) {
      if (tgs[i].tupletend === targettup) { endtok = layerdata[i]; break; }
      if (tgs[i].beamstart) beamedge = true;
      if (tgs[i].beamend) beamedge = true;
      i++;
    }
    if (endtok === null) return false;
    if (beamedge) return false;
    if (endtok.toString().indexOf('J') === -1) return false;
    return true;
  }

  public handleGroupStarts(tgs: HumdrumBeamAndTuplet[], elements: string[], pointers: VrvObject[],
    layerdata: HTok[], layerindex: number): void {
    let beam: Beam;
    const tg = tgs[layerindex];
    const token = layerdata[layerindex];
    const ss = this.m_staffstates;
    const staffindex = this.m_currentstaff - 1;

    if (staffindex >= 0 && staffindex < ss.length && ss[staffindex].tremolo) {
      if (token.toString().indexOf('L') !== -1) {
        const status = this.checkForTremolo(layerdata, tgs, layerindex);
        if (status) {
          // beamed group converted into tremolo
          return;
        }
      }
    }

    let direction = 0;
    if (tg.beamstart || tg.gbeamstart) {
      if (this.m_signifiers.above !== '') {
        const pattern = '[LJKk]+' + this.m_signifiers.above;
        if (new HumRegex(pattern).search(token.toString(), pattern) !== 0) direction = 1;
      }
      if (this.m_signifiers.below !== '') {
        const pattern = '[LJKk]+' + this.m_signifiers.below;
        if (new HumRegex(pattern).search(token.toString(), pattern) !== 0) direction = -1;
      }
      if (direction) {
        if (tg.beamstart) this.setBeamDirection(direction, tgs, layerdata, layerindex, false);
        else this.setBeamDirection(direction, tgs, layerdata, layerindex, true);
      }
    }

    if (tg.beamstart && tg.tupletstart) {
      if (tg.priority === 'T') {
        this.insertTuplet(elements, pointers, tgs, layerdata, layerindex,
          staffindex >= 0 ? ss[staffindex].suppress_tuplet_number : false,
          staffindex >= 0 ? ss[staffindex].suppress_tuplet_bracket : false);
        beam = this.insertBeam(elements, pointers, tg);

        this.checkForInvisibleBeam(beam, tgs, layerindex);
        if (direction) this.appendTypeTag(beam, 'placed');
        this.checkBeamWith(beam, tgs, layerdata, layerindex);
        this.setBeamLocationId(beam, tgs, layerdata, layerindex);
        layerdata[layerindex].setValue('auto', 'beamid', beam.GetID());
      }
      else {
        beam = this.insertBeam(elements, pointers, tg);
        this.setBeamLocationId(beam, tgs, layerdata, layerindex);
        layerdata[layerindex].setValue('auto', 'beamid', beam.GetID());
        const status = this.checkForBeamSameas(beam, layerdata, layerindex);
        if (status) {
          // remove beam from stack
          this.removeBeam(elements, pointers);
          return;
        }
        this.checkForBeamStemSameas(layerdata, layerindex);

        this.checkForInvisibleBeam(beam, tgs, layerindex);
        if (direction) this.appendTypeTag(beam, 'placed');

        this.checkBeamWith(beam, tgs, layerdata, layerindex);
        this.insertTuplet(elements, pointers, tgs, layerdata, layerindex,
          staffindex >= 0 ? ss[staffindex].suppress_tuplet_number : false,
          staffindex >= 0 ? ss[staffindex].suppress_tuplet_bracket : false);
      }
    }
    else if (tg.beamstart) {
      beam = this.insertBeam(elements, pointers, tg);
      this.setBeamLocationId(beam, tgs, layerdata, layerindex);
      layerdata[layerindex].setValue('auto', 'beamid', beam.GetID());
      const status = this.checkForBeamSameas(beam, layerdata, layerindex);
      if (status) {
        // remove beam from stack
        this.removeBeam(elements, pointers);
        return;
      }
      this.checkForBeamStemSameas(layerdata, layerindex);

      this.checkForInvisibleBeam(beam, tgs, layerindex);
      if (direction) this.appendTypeTag(beam, 'placed');
      this.checkBeamWith(beam, tgs, layerdata, layerindex);
    }
    else if (tg.tupletstart) {
      this.insertTuplet(elements, pointers, tgs, layerdata, layerindex,
        staffindex >= 0 ? ss[staffindex].suppress_tuplet_number : false,
        staffindex >= 0 ? ss[staffindex].suppress_tuplet_bracket : false);
    }

    if (tg.gbeamstart) {
      // Grace note beams should not interact with regular beams or tuplets.
      beam = this.insertGBeam(elements, pointers, tg);
      if (direction) this.appendTypeTag(beam, 'placed');
      this.checkBeamWith(beam, tgs, layerdata, layerindex);
      this.setBeamLocationId(beam, tgs, layerdata, layerindex);
      layerdata[layerindex].setValue('auto', 'beamid', beam.GetID());
    }
  }

  public handleGroupEnds(tg: HumdrumBeamAndTuplet, elements: string[], pointers: VrvObject[]): void {
    if (tg.beamend && tg.tupletend) {
      if (tg.priority === 'T') {
        this.removeTuplet(elements, pointers);
        this.removeBeam(elements, pointers);
      }
      else {
        this.removeBeam(elements, pointers);
        this.removeTuplet(elements, pointers);
      }
    }
    else if (tg.beamend) {
      this.removeBeam(elements, pointers);
    }
    else if (tg.tupletend) {
      this.removeTuplet(elements, pointers);
    }

    if (tg.gbeamend) {
      // Grace note beams should not interact with regular beams or tuplets.
      this.removeGBeam(elements, pointers);
    }
  }

  public insertBeamSpan(token: HTok): void {
    if (token === null) return;
    if (token.getValueBool('auto', 'hangingBeam')) {
      // Not dealing with hanging beams for now.
      return;
    }
    // Ignore grace note beamspans for now:
    if (token.toString().indexOf('q') !== -1) return;
    if (!token.getValueBool('auto', 'beamSpanStart')) return;
    const etok = token.getValueHTp('auto', 'beamEndId');
    if (etok === null) return;

    const beamspan = new BeamSpan();
    beamspan.SetStartid('#' + this.getDataTokenId(token));
    beamspan.SetEndid('#' + this.getDataTokenId(etok));
    this.setBeamSpanPlist(beamspan, token, etok);
    this.addChildMeasureOrSection(beamspan);
  }

  public setBeamSpanPlist(beamspan: BeamSpan, starttok: HTok, endtok: HTok): void {
    const tokens: HTok[] = [];
    let current: HTp | null = starttok;
    if (current !== null) tokens.push(current);
    const endline = endtok.getLineIndex();

    current = current!.getNextToken();
    while (current !== null) {
      if (current === endtok) { tokens.push(current); break; }
      if (current.getLineIndex() > endline) {
        // Something bad happened
        break;
      }
      if (!current.isData()) { current = current.getNextToken(); continue; }
      if (current.isNull()) { current = current.getNextToken(); continue; }
      tokens.push(current);
      current = current.getNextToken();
    }

    for (let i = 0; i < tokens.length; ++i) {
      beamspan.GetPlistInterface().AddRef('#' + this.getDataTokenId(tokens[i]));
    }
  }

  public storeBeamSpansInStartingMeasure(): void {
    for (let i = 0; i < this.m_beamSpanStartDatabase.length; ++i) {
      const token = this.m_beamSpanStartDatabase[i];
      if (token !== null) this.insertBeamSpan(token);
    }
    this.m_beamSpanStartDatabase.length = 0;
  }

  // -- pure helpers (no parser dependency) --

  public static characterCount(text: string, symbol: string): number {
    let n = 0;
    for (const ch of text) if (ch === symbol) ++n;
    return n;
  }

  public static characterCountInSubtoken(text: string, symbol: string): number {
    let sum = 0;
    for (const ch of text) {
      if (ch === symbol) ++sum;
      if (ch === ' ') break;
    }
    return sum;
  }

  public static removeCommas(input: string): string {
    return input.replace(/[,;:]/g, ' ');
  }

  public static escapeFreeAmpersand(value: string): string {
    let output = '';
    for (let i = 0; i < value.length; ++i) {
      if (value[i] !== '&') { output += value[i]; continue; }
      let solo = false;
      let lastj = i;
      for (let j = i + 1; j < value.length; j++) {
        if (value[j] === ' ' || value[j] === '&') { solo = true; break; }
        if (value[j] === ';') { solo = false; break; }
        lastj = j;
      }
      if (lastj === value.length - 1) solo = true;
      output += solo ? '&amp;' : '&';
    }
    return output;
  }

  public static replaceString(target: { value: string }, oldStr: string, newStr: string): boolean {
    let pos = 0;
    let output = false;
    while (true) {
      const found = target.value.indexOf(oldStr, pos);
      if (found === -1) break;
      output = true;
      target.value = target.value.slice(0, found) + newStr + target.value.slice(found + oldStr.length);
      pos = found + newStr.length;
    }
    return output;
  }

  public static replaceU32(target: { value: number[] }, oldSeq: number[], newSeq: number[]): boolean {
    const eqAt = (at: number): boolean => {
      if (oldSeq.length === 0) return true;
      for (let k = 0; k < oldSeq.length; ++k) if (target.value[at + k] !== oldSeq[k]) return false;
      return true;
    };
    let pos = 0;
    let output = false;
    while (pos <= target.value.length - oldSeq.length) {
      if (eqAt(pos)) {
        output = true;
        target.value.splice(pos, oldSeq.length, ...newSeq);
        pos += newSeq.length;
      }
      else ++pos;
    }
    return output;
  }

  public static nextLowerPowerOfTwo(x: number): number {
    x >>>= 0;
    if (x < 1) return 1;
    x = x | (x >> 1);
    x = x | (x >> 2);
    x = x | (x >> 4);
    x = x | (x >> 8);
    x = x | (x >> 16);
    return (x - (x >> 1)) >>> 0;
  }

  public static getDotPowerOfTwo(value: HumNum): number {
    if (value.isPowerOfTwo()) return 0;
    if (value.mul(2).div(3).isPowerOfTwo()) return 1;
    if (value.mul(4).div(7).isPowerOfTwo()) return 2;
    if (value.mul(8).div(15).isPowerOfTwo()) return 3;
    return -1;
  }

  public static removeFactorsOfTwo(value: HumNum): { output: HumNum; tcount: number; bcount: number } {
    let top = value.getNumerator();
    let bot = value.getDenominator();
    let tcount = 0;
    let bcount = 0;
    if (top > 0) { while (top % 2 === 0) { top >>= 1; ++tcount; } }
    if (bot > 0) { while (bot % 2 === 0) { bot >>= 1; ++bcount; } }
    return { output: new HumNum(top, bot), tcount, bcount };
  }

  public static nextHigherPowerOfTwo(x: HumNum): HumNum {
    const value = -Math.log(x.getFloat()) / Math.log(2.0);
    const denom = Math.trunc(value);
    return new HumNum(1).div(Math.trunc(Math.pow(2.0, denom)));
  }

  //--------------------------------------------------------------------------
  // Reference-record infrastructure + MEI header construction
  // (iohumdrum.cpp getAllReferenceItems .. createBackMatter).
  //--------------------------------------------------------------------------

  /** C++ isStandardHumdrumKey: 3-char translated title or the standard list. */
  private static readonly STANDARD_HUMDRUM_KEYS: Set<string> = new Set([
    'COM', 'COA', 'COS', 'COL', 'COC', 'CDT', 'CBL', 'CDL', 'CNT',
    'LYR', 'LIB', 'LAR', 'LOR', 'TXO', 'TXL', 'TRN',
    'RTL', 'RMM', 'RC#', 'RRD', 'RLC', 'RNP', 'RDT', 'RT#',
    'MGN', 'MPN', 'MPS', 'MRD', 'MLC', 'MCN', 'MPD', 'MDT',
    'OTL', 'OTP', 'OTA', 'OPR', 'OAC', 'OSC', 'OMV', 'OMD', 'OPS', 'ONM',
    'OVM', 'ODE', 'OCO', 'OCL', 'ONB', 'ODT', 'OCY', 'OPC', 'GTL', 'GAW', 'GCO',
    'PUB', 'PED', 'PPR', 'PDT', 'PTL', 'PPP', 'PC#',
    'SCT', 'SCA', 'SMS', 'SML', 'SMA',
    'YEP', 'YEC', 'YER', 'YEM', 'YEN', 'YOR', 'YOO', 'YOY', 'YOE',
    'EED', 'ENC', 'END', 'EMD', 'EEV', 'EFL', 'EST', 'VTS',
    'ACO', 'AFR', 'AGN', 'AST', 'AMD',
  ]);

  public isStandardHumdrumKey(key: string): boolean {
    if (key[0] === 'X' && key.length === 3) return true;
    return HumdrumInput.STANDARD_HUMDRUM_KEYS.has(key);
  }

  /**
   * C++ getAllReferenceItems. First data line separates movement names from
   * later OMD tempo markings. Returns a Map keyed by reference key; C++ uses
   * std::map so iteration only happens in getReferenceItems (per key).
   */
  public getAllReferenceItems(infile: HumdrumFile): Map<string, HumdrumReferenceItem[]> {
    const items = this.m_references;
    items.clear();
    let firstDataLineIdx = infile.getLineCount();
    for (let lineIdx = 0; lineIdx < infile.getLineCount(); lineIdx++) {
      if (infile.at(lineIdx).isData()) { firstDataLineIdx = lineIdx; break; }
    }
    const hre = new HumRegex();
    for (let i = 0; i < this.m_humdrumLineReferences.length; ++i) {
      const ref = this.m_humdrumLineReferences[i];
      if (ref === null) continue;
      const baseKey = ref.getReferenceKey();
      const baseValue = ref.getReferenceValue();
      let key = '';
      let value = '';
      let isParseable = false;
      let isHumdrumKey = false;
      let language = '';
      let isTranslated = false;
      let index = 0;
      if (baseKey.substr(0, 5) === 'RDF**' || baseKey === 'system-decoration') continue;
      if (hre.search(baseKey, '^([^0-9@ \\t]*)([0-9]*)?((@{1,2})([a-zA-Z]*))?$')) {
        isParseable = true;
        key = hre.getMatch(1);
        index = hre.getMatchInt(2);
        language = hre.getMatch(5).toLowerCase();
        isTranslated = language !== '' && hre.getMatch(4) !== '@@';
        isHumdrumKey = key.length >= 3 && this.isStandardHumdrumKey(key.substr(0, 3));
      }
      value = HumdrumInput.unescapeHtmlEntities(baseValue);
      if (key === 'OMD') {
        if (ref.getLineIndex() > firstDataLineIdx) continue;
        if (hre.search(baseValue, '(.*?)\\s*(M\\.M\\.|M\\. M\\.|M\\:M\\:|M M)?\\s*\\(\\[([^=\\]]*)\\]\\s*=\\s*(\\d+\\.?\\d*)')
          || hre.search(baseValue, '(.*?)\\s*(M\\.M\\.|M\\. M\\.|M\\:M\\:|M M)?\\s*\\[([^=\\]]*)\\]\\s*=\\s*(\\d+\\.?\\d*)')) {
          if (hre.getMatch(1) !== '') {
            value = hre.getMatch(1);
            value = value.replace(/^[ \t]+/, '').replace(/[ \t]+$/, '');
          }
          else continue;
        }
      }
      const item: HumdrumReferenceItem = {
        lineText: ref.getText(), key, value, isParseable, isHumdrumKey,
        isTranslated, language, index,
      };
      const list = items.get(key);
      if (list === undefined) items.set(key, [item]);
      else list.push(item);
    }
    return items;
  }

  public getReferenceItems(key: string): HumdrumReferenceItem[] {
    return this.m_references.get(key) ?? [];
  }

  public anyReferenceItemsExist(keys: string[]): boolean {
    for (const key of keys) if (this.m_references.has(key)) return true;
    return false;
  }

  /** C++ getBestItem: first untranslated (or matching-language) item. */
  public getBestItem(titles: HumdrumReferenceItem[], requiredLanguage: string): number {
    const noRequiredLanguage = requiredLanguage === '';
    for (let i = 0; i < titles.length; i++) {
      if (noRequiredLanguage) { if (!titles[i].isTranslated) return i; }
      else if (titles[i].language === requiredLanguage) return i;
    }
    return titles.length > 0 ? 0 : -1;
  }

  /** Common language across a text list, or "" if none/mixed. */
  public getTextListLanguage(textItems: HumdrumReferenceItem[]): string {
    let theLanguage = '';
    for (const textItem of textItems) {
      if (theLanguage === '' && textItem.language !== '') { theLanguage = textItem.language; continue; }
      if (theLanguage !== '' && textItem.language !== '') {
        if (theLanguage !== textItem.language) { theLanguage = ''; break; }
      }
    }
    return theLanguage;
  }

  /** C++ appendText: split on literal `\n`, interleave <lb/> nodes. */
  public appendText(element: xml_node, text: string): void {
    const strings = text.split(/\\n/);
    for (let i = 0; i < strings.length; i++) {
      if (i > 0) element.append_child('lb');
      element.append_child(3).set_value(strings[i]);
    }
  }

  /** C++ HumdrumInput::WriteUTF8 (iohumdrum.cpp:31045): encode a 16-bit code
   *  unit as UTF-8 bytes. In TS the natural representation is a string, so the
   *  helper returns the encoded text instead of writing to std::ostream. */
  public static WriteUTF8(Ch: number): string {
    if (Ch >= 0x800) {
      return String.fromCharCode(
        0xe0 | ((Ch >> 12) & 0x0f),
        0x80 | ((Ch >> 6) & 0x3f),
        0x80 | (Ch & 0x3f),
      );
    }
    if (Ch >= 0x80) {
      return String.fromCharCode(0xc0 | ((Ch >> 6) & 0x1f), 0x80 | (Ch & 0x3f));
    }
    return String.fromCharCode(Ch);
  }

  /** C++ UnquoteHTML: expand HTML 4.0 entities into literal characters. */
  public static unescapeHtmlEntities(input: string): string {
    let out = '';
    let i = 0;
    while (i < input.length) {
      const ch = input[i];
      if (ch !== '&') { out += ch; i++; continue; }
      // entity candidate
      let j = i + 1;
      if (input[j] === '#') {
        j++;
        let hex = false;
        if (input[j] === 'x' || input[j] === 'X') { hex = true; j++; }
        const start = j;
        if (hex) while (j < input.length && /[0-9a-fA-F]/.test(input[j])) j++;
        else while (j < input.length && input[j] >= '0' && input[j] <= '9') j++;
        if (j > start && input[j] === ';') {
          const code = Number.parseInt(input.slice(start, j), hex ? 16 : 10);
          out += String.fromCodePoint(code);
          i = j + 1;
          continue;
        }
      }
      else {
        const start = j;
        while (j < input.length && /[0-9a-zA-Z]/.test(input[j])) j++;
        if (j > start && input[j] === ';') {
          const name = input.slice(start, j);
          const code = STATIC_ENTITY_NAMES[name];
          if (code !== undefined) { out += String.fromCodePoint(code); i = j + 1; continue; }
        }
      }
      out += '&';
      i++;
    }
    return out;
  }

  /** C++ stripDateError: pull the ~/x/?/z marker out of a date component. */
  public stripDateError(value: { value: string }): string {
    const approxSyms = '~x';
    const uncertainSyms = '?z';
    const all = approxSyms + uncertainSyms;
    let idx = -1;
    for (let i = 0; i < value.value.length; i++) if (all.indexOf(value.value[i]) !== -1) { idx = i; break; }
    if (idx === -1) return '';
    const ch = value.value[idx];
    const errorStr = ch === '?' ? '\\?' : ch;
    value.value = value.value.split(errorStr === '\\?' ? '?' : errorStr).join('');
    if (errorStr[0] === '~' || errorStr[0] === 'x') return 'approximate';
    return 'uncertain';
  }

  public sanityCheckDate(
    year: number, month: number, day: number, hour: number, minute: number, second: number,
  ): boolean {
    const IM = -2147483648;
    if (year === IM) return false;
    if (month !== IM) { if (month < 1 || month > 12) return false; }
    if (day !== IM) {
      if (month === IM) return false;
      if (day < 1 || day > 31) return false;
      if (month === 4 || month === 6 || month === 9 || month === 11) { if (day === 31) return false; }
      if (month === 2) {
        if (day > 29) return false;
        if (day === 29) { if (year % 4 !== 0) return false; }
      }
    }
    if (hour !== IM) {
      if (day === IM) return false;
      if (minute === IM || second === IM) return false;
      if (hour < 0 || hour > 23) return false;
    }
    if (minute !== IM) {
      if (hour === IM) return false;
      if (minute < 0 || minute > 59) return false;
    }
    if (second !== IM) {
      if (minute === IM) return false;
      if (second < 0 || second > 59) return false;
    }
    return true;
  }

  public dateWithErrorsFromHumdrumDate(humdrumDate: string): DateWithErrors {
    const date = makeDateWithErrors();
    let dateString = humdrumDate;
    if (dateString !== '') {
      if (dateString[0] === '~') { dateString = dateString.slice(1); date.dateError = 'approximate'; }
      else if (dateString[0] === '?') { dateString = dateString.slice(1); date.dateError = 'uncertain'; }
    }
    const IM = -2147483648;
    const values: number[] = [IM, IM, IM, IM, IM, IM];
    const errors = ['', '', '', '', '', ''];
    const hre = new HumRegex();
    dateString = dateString.split(':').join('/').split(' ').join('');
    const dateSubStrs = dateString.split('/');
    for (let i = 0; i < dateSubStrs.length; i++) {
      const holder = { value: dateSubStrs[i] };
      const error = this.stripDateError(holder);
      let value = holder.value;
      if (i === 0 && value.length >= 2) { if (value[0] === '@') value = '-' + value.slice(1); }
      if (i === 5) {
        const idx = value.search(/[.]/);
        if (idx !== -1) value = value.slice(0, idx);
      }
      if (value.length > 0) {
        if (!hre.match(value, '^\\d+$')) { date.valid = false; return date; }
        values[i] = Number.parseInt(value, 10);
      }
      errors[i] = error;
    }
    const gotOne = this.sanityCheckDate(values[0], values[1], values[2], values[3], values[4], values[5]);
    if (gotOne) {
      date.valid = true;
      date.year = values[0]; date.yearError = errors[0];
      date.month = values[1]; date.monthError = errors[1];
      date.day = values[2]; date.dayError = errors[2];
      date.hour = values[3]; date.hourError = errors[3];
      date.minute = values[4]; date.minuteError = errors[4];
      date.second = values[5]; date.secondError = errors[5];
    }
    return date;
  }

  public isoDateFromDateWithErrors(date: DateWithErrors, edtf: boolean): string {
    if (!date.valid) return '';
    if (date.dateError !== '' && !edtf) return '';
    const IM = -2147483648;
    const dateParts: string[] = [];
    for (let i = 0; i < 6; i++) {
      let value = IM;
      let error = '';
      if (i === 0) { value = date.year; error = date.yearError; }
      else if (i === 1) { value = date.month; error = date.monthError; }
      else if (i === 2) { value = date.day; error = date.dayError; }
      else if (i === 3) { value = date.hour; error = date.hourError; }
      else if (i === 4) { value = date.minute; error = date.minuteError; }
      else if (i === 5) { value = date.second; error = date.secondError; }
      if (value === IM) break;
      let prefix = '';
      if (error !== '') {
        if (!edtf) return '';
        if (error === 'uncertain') prefix = '?';
        else if (error === 'approximate') prefix = '~';
      }
      if (i === 0) dateParts.push(`${prefix}${value}`);
      else dateParts.push(`${prefix}${String(value).padStart(2, '0')}`);
    }
    let isodate = '';
    for (let i = 0; i < 3; i++) {
      if (i >= dateParts.length) break;
      if (i > 0) isodate += '-';
      isodate += dateParts[i];
    }
    if (dateParts.length === 6) {
      for (let i = 3; i < 6; i++) {
        isodate += i === 3 ? 'T' : ':';
        isodate += dateParts[i];
      }
    }
    if (date.dateError === 'approximate') isodate += '~';
    else if (date.dateError === 'uncertain') isodate += '?';
    return isodate;
  }

  public dateConstructFromHumdrumDate(inHumdrumDate: string): DateConstruct {
    const result = makeDateConstruct();
    let typeNeeded = '';
    let relativeType = '';
    let humdrumDate = inHumdrumDate;
    const dateStrings: string[] = [];
    if (humdrumDate === '') return result;
    const hre = new HumRegex();
    if (/[-]/.test(humdrumDate)) {
      typeNeeded = 'DateBetween';
      hre.split(dateStrings, humdrumDate, '-');
      if (dateStrings.length !== 2) return result;
      if (/[\^]/.test(dateStrings[0]) || /[\^]/.test(dateStrings[1])
        || '~?<>'.indexOf(dateStrings[0][0]) !== -1 || '~?<>'.indexOf(dateStrings[1][0]) !== -1) {
        typeNeeded = 'DateConstructRange';
      }
    }
    else if (/[\^]/.test(humdrumDate)) { typeNeeded = 'DateBetween'; hre.split(dateStrings, humdrumDate, '\\^'); }
    else if (/[|]/.test(humdrumDate)) { typeNeeded = 'DateSelection'; hre.split(dateStrings, humdrumDate, '\\|'); }
    else if (humdrumDate[0] === '<') { typeNeeded = 'DateRelative'; relativeType = 'before'; dateStrings.push(humdrumDate.slice(1)); }
    else if (humdrumDate[0] === '>') { typeNeeded = 'DateRelative'; relativeType = 'after'; dateStrings.push(humdrumDate.slice(1)); }
    else { typeNeeded = 'DateSingle'; dateStrings.push(humdrumDate); }
    if (typeNeeded === 'DateConstructRange') {
      const dateConstructs: DateConstruct[] = [];
      for (const dateString of dateStrings) {
        const dc = this.dateConstructFromHumdrumDate(dateString);
        if (dc.constructType === '') return makeDateConstruct();
        dateConstructs.push(dc);
      }
      result.constructType = 'DateConstructRange';
      result.dateConstructs = dateConstructs;
    }
    else {
      const dates: DateWithErrors[] = [];
      for (const dateString of dateStrings) {
        const date = this.dateWithErrorsFromHumdrumDate(dateString);
        if (!date.valid) return result;
        dates.push(date);
      }
      result.constructType = typeNeeded;
      result.dates = dates;
      if (typeNeeded === 'DateRelative') result.qualifier = relativeType;
    }
    return result;
  }

  /**
   * C++ returns a std::map<string,string>. JS Map preserves insertion order,
   * which matches the C++ iteration for fillInIsoDate's startdate/enddate
   * special case; other callers only look up fixed keys.
   */
  public isoDateAttributesFromDateConstruct(
    dateConstruct: DateConstruct, edtf: boolean, isEdgeOfDateConstructRange = false,
  ): Map<string, string> {
    const attribs = new Map<string, string>();
    const isodates: string[] = [];
    if (dateConstruct.constructType === 'DateConstructRange') {
      if (!edtf) return attribs;
      const attribStart = this.isoDateAttributesFromDateConstruct(dateConstruct.dateConstructs[0], edtf, true);
      const attribEnd = this.isoDateAttributesFromDateConstruct(dateConstruct.dateConstructs[1], edtf, true);
      attribs.set('startedtf', attribStart.get('edtf') ?? '');
      attribs.set('endedtf', attribEnd.get('edtf') ?? '');
      return attribs;
    }
    for (const date of dateConstruct.dates) {
      const isodate = this.isoDateFromDateWithErrors(date, edtf);
      if (isodate === '') return new Map();
      isodates.push(isodate);
    }
    const t = dateConstruct.constructType;
    if (t === 'DateSingle') {
      if (edtf) attribs.set('edtf', isodates[0]); else attribs.set('isodate', isodates[0]);
    }
    else if (t === 'DateRelative') {
      if (dateConstruct.qualifier === 'before') {
        if (edtf) attribs.set('edtf', '../' + isodates[0]); else attribs.set('notafter', isodates[0]);
      }
      else if (dateConstruct.qualifier === 'after') {
        if (edtf) attribs.set('edtf', isodates[0] + '/..'); else attribs.set('notbefore', isodates[0]);
      }
    }
    else if (t === 'DateBetween') {
      if (edtf) {
        if (isEdgeOfDateConstructRange) attribs.set('edtf', '[' + isodates[0] + '..' + isodates[1] + ']');
        else attribs.set('edtf', isodates[0] + '/' + isodates[1]);
      }
      else {
        attribs.set('startdate', isodates[0]);
        attribs.set('enddate', isodates[1]);
      }
    }
    else if (t === 'DateSelection') {
      if (edtf) {
        let combinedDates = '';
        for (let i = 0; i < isodates.length; i++) {
          if (i === 0) combinedDates += dateConstruct.qualifier === 'and' ? '{' : '[';
          else combinedDates += ',';
          combinedDates += isodates[i];
          if (i === isodates.length - 1) combinedDates += dateConstruct.qualifier === 'and' ? '}' : ']';
        }
        attribs.set('edtf', combinedDates);
      }
    }
    return attribs;
  }

  public isoDateAttributesFromHumdrumDate(inHumdrumDate: string, edtf = false): Map<string, string> {
    const attribs = new Map<string, string>();
    if (inHumdrumDate === '') return attribs;
    const dateConstruct = this.dateConstructFromHumdrumDate(inHumdrumDate);
    if (dateConstruct.constructType === '') return attribs;
    return this.isoDateAttributesFromDateConstruct(dateConstruct, edtf);
  }

  public fillInIsoDate(element: xml_node, dateString: string): void {
    const attribs = this.isoDateAttributesFromHumdrumDate(dateString);
    if (attribs.size === 2 && attribs.has('startdate') && attribs.has('enddate')) {
      // startdate before enddate for readability (C++ std::map would sort them backward).
      element.append_attribute('startdate').set_value(attribs.get('startdate') as string);
      element.append_attribute('enddate').set_value(attribs.get('enddate') as string);
      return;
    }
    for (const [k, v] of attribs) element.append_attribute(k).set_value(v);
  }

  /** C++ processTemplateOperator: @{KEY:op} formatting. */
  public processTemplateOperator(value: string, op: string): string {
    let input = value;
    let output = '';
    const hre = new HumRegex();
    if (op.indexOf('U') !== -1) input = input.toUpperCase();
    if (op.indexOf('n') !== -1) {
      const pos = input.indexOf(',');
      output = pos === -1 ? input : input.slice(pos + 1) + ' ' + input.slice(0, pos);
    }
    else if (op.indexOf('l') !== -1) {
      const pos = input.indexOf(',');
      output = pos === -1 ? input : input.slice(0, pos);
    }
    else if (op.indexOf('f') !== -1) {
      const pos = input.indexOf(',');
      output = pos === -1 ? input : input.slice(pos + 1);
    }
    else if (op.indexOf('i') !== -1) {
      const pos = input.indexOf(',');
      if (pos === -1) output = input;
      else {
        const lastname = input.slice(0, pos);
        const pieces = input.slice(pos + 1).split(' ');
        let firstname = '';
        for (let i = 0; i < pieces.length; i++) {
          if (pieces[i] === '') continue;
          if (/^[A-Z]/.test(pieces[i])) {
            const initial = pieces[i][0] + '.';
            if (firstname.length > 1 && firstname[firstname.length - 2] === '.') {
              firstname = firstname.slice(0, -1) + initial + ' ';
            }
            else firstname += initial + ' ';
          }
          else firstname += pieces[i] + ' ';
        }
        output = firstname + lastname;
      }
    }
    else if (op.indexOf('y') !== -1) {
      const cdates = input;
      const pos = cdates.indexOf('-');
      if (pos !== -1) {
        const birth = cdates.slice(0, pos);
        const death = cdates.slice(pos + 1);
        let birthyear = 0;
        let deathyear = 0;
        if (hre.search(birth, '(\\d{4})')) birthyear = hre.getMatchInt(1);
        if (hre.search(death, '(\\d{4})')) deathyear = hre.getMatchInt(1);
        if (deathyear > 0 && birthyear > 0) {
          output = String(birthyear) + '&#8211;';
          if (Math.floor(deathyear / 100) === Math.floor(birthyear / 100)) {
            if (deathyear % 100 < 10) output += '0';
            output += String(deathyear % 100);
          }
          else output += String(deathyear);
        }
      }
      else if (hre.search(cdates, '(\\d{4})')) output = hre.getMatch(1);
      else output = cdates;
    }
    else if (op.indexOf('Y') !== -1) {
      const cdates = input;
      let outputdate = '';
      const pos = cdates.indexOf('-');
      if (pos !== -1) {
        const birth = cdates.slice(0, pos);
        const death = cdates.slice(pos + 1);
        let birthyear = 0;
        let deathyear = 0;
        if (hre.search(birth, '(\\d{4})')) birthyear = hre.getMatchInt(1);
        if (hre.search(death, '(\\d{4})')) deathyear = hre.getMatchInt(1);
        if (deathyear > 0 && birthyear > 0) outputdate = String(birthyear) + '&#8211;' + String(deathyear);
      }
      else if (hre.search(cdates, '(\\d{4})')) outputdate = hre.getMatch(1);
      output = outputdate;
    }
    else output = input;
    return output;
  }

  public processReferenceTemplate(input: string, _biblist: [string, string][], refmap: Map<string, string>): string {
    let text = input;
    const hre = new HumRegex();
    while (hre.search(text, '@\\{(.*?)\\}')) {
      let match = hre.getMatch(1);
      const prefix = hre.getPrefix();
      const suffix = hre.getSuffix();
      const pos = match.indexOf(':');
      if (pos !== -1) {
        const key = match.slice(0, pos);
        const op = match.slice(pos + 1);
        match = this.processTemplateOperator(refmap.get(key) ?? '', op);
      }
      else match = refmap.get(match) ?? '';
      text = prefix + match + suffix;
    }
    return HumdrumInput.unescapeHtmlEntities(text);
  }

  /** C++ automaticHeaderLeft (used when no `header-left` reference). */
  public automaticHeaderLeft(refmap: Map<string, string>, linecount: number): string {
    let output = '';
    const has = (k: string): boolean => refmap.has(k);
    let count = 0;
    if (has('PTL')) count++;
    if (has('PPR')) count++;
    if (has('PPP')) count++;
    if (has('PDT')) count++;
    let person = '';
    if (count === 4) person = refmap.get('PED') ?? '';
    else person = refmap.get('LYR') ?? '';
    const pos = person.indexOf(',');
    if (pos !== -1) person = person.slice(pos + 1) + ' ' + person.slice(0, pos);
    if (count !== 4 && person !== '') {
      const ldt = refmap.get('LDT');
      if (ldt !== undefined) person += ' (' + ldt + ')';
    }
    else if (count === 4 && person !== '') person += ', <rend fontstyle="italic">ed.</rend>';
    if (person !== '') {
      output += '<rend fontsize="small" halign="left" valign="bottom">';
      output += HumdrumInput.unescapeHtmlEntities(person);
      output += '</rend>\n';
      if (linecount > 1) output += '<rend fontsize="small" halign="left" valign="bottom">&#160;</rend>\n';
    }
    return output;
  }

  /** C++ automaticHeaderRight; returns [output, linecount]. */
  public automaticHeaderRight(_biblist: [string, string][], refmap: Map<string, string>): [string, number] {
    let linecount = 0;
    let output = '';
    let composer = '';
    const name = refmap.get('COM');
    if (name !== undefined) {
      const pos = name.indexOf(',');
      composer = pos === -1 ? name : name.slice(pos + 1) + ' ' + name.slice(0, pos);
    }
    if (composer !== '') {
      output += '<rend fontsize="small" halign="right" valign="bottom">';
      output += HumdrumInput.unescapeHtmlEntities(composer);
      output += '</rend>\n';
      linecount++;
    }
    const outputdate = this.processReferenceTemplate('@{CDT:y}', [], refmap);
    if (outputdate !== '') {
      output += '<rend fontsize="small" halign="right" valign="bottom">';
      output += outputdate;
      output += '</rend>\n';
      linecount++;
    }
    return [output, linecount];
  }

  /** C++ automaticHeaderCenter. */
  public automaticHeaderCenter(biblist: [string, string][], refmap: Map<string, string>): string {
    let output = '';
    let title = refmap.get('OTL') ?? '';
    let counter = 0;
    let PTL = ''; let PPR = ''; let PPP = ''; let PDT = '';
    let PUBformat = '';
    if (refmap.has('PTL')) { PTL = refmap.get('PTL') as string; counter++; }
    if (refmap.has('PPR')) { PPR = refmap.get('PPR') as string; counter++; }
    if (refmap.has('PPP')) { PPP = refmap.get('PPP') as string; counter++; }
    if (refmap.has('PDT')) { PDT = refmap.get('PDT') as string; counter++; }
    if (refmap.has('PUB-format')) PUBformat = refmap.get('PUB-format') as string;
    let subtitle = '';
    if (counter === 4) {
      if (PUBformat !== '') subtitle += 'in ';
      const outputdate = this.processReferenceTemplate('@{PDT:y}', biblist, refmap);
      subtitle += '<rend fontstyle="italic">' + PTL + '</rend>';
      subtitle += ' (' + PPP + ': ' + PPR;
      if (outputdate !== '') subtitle += ', ' + outputdate;
      subtitle += ')';
    }
    if (title === '') {
      for (let i = 0; i < biblist.length; ++i) {
        if (biblist[i][0].substr(0, 3) === 'OTL') { title = biblist[i][1]; break; }
      }
    }
    const rime = refmap.get('rime') ?? '';
    if (title !== '') {
      output += '<rend halign="center" valign="middle">\n';
      output += '   <rend fontsize="large">';
      output += HumdrumInput.unescapeHtmlEntities(title);
      if (rime !== '') output += ' (<rend fontstyle="italic">Rime</rend>&#160;' + rime + ')';
      output += '</rend>\n';
      if (subtitle !== '') output += '<lb/><rend fontsize="small">' + subtitle + '</rend>';
      output += '<lb/>&#160;\n<lb/>&#160;\n';
      output += '</rend>\n';
    }
    return output;
  }

  /**
   * C++ prepareHeader/prepareFooter build an MEI string, re-import it through
   * MEIInput, then move the resulting pgHead/pgFoot onto the converted score
   * def. Pure-TS has no string round-trip importer for that fragment, so the
   * header markup is attached directly (sans iohumdrum.cpp's <i>/%P textual
   * rewrites and <rend> parsing). Marked as a deliberate ceiling.
   */
  public prepareHeaderFooter(infile: HumdrumFile): void {
    const biblist: Array<[string, string]> = [];
    const refmap = new Map<string, string>();
    const records = infile.getReferenceRecords();
    for (const record of records) {
      if (record === null) continue;
      const key = record.getReferenceKey();
      const value = record.getReferenceValue();
      refmap.set(key, value);
      biblist.push([key, value]);
    }

    this.prepareHeader(biblist, refmap);
    this.prepareFooter(biblist, refmap);
  }

  // C++ HumdrumInput::prepareHeader (iohumdrum.cpp:6953): build a pgHead MEI string,
  // import it into a temporary Doc, then move the resulting pgHead of the score def.
  public prepareHeader(biblist: Array<[string, string]>, refmap: Map<string, string>): boolean {
    let headleft = '';
    let headcenter = '';
    let headright = '';
    const hre = new HumRegex();
    let pieces: string[] = [];

    const ithc = refmap.get('header-center');
    if (ithc !== undefined) {
      hre.split(pieces, ithc, '\\\\n');
      headcenter = '<rend halign="center" valign="middle">\n';
      for (let i = 0; i < pieces.length; ++i) {
        headcenter += i === 0 ? '<rend fontsize="large">' : '<rend fontsize="normal">';
        const tstring = this.processReferenceTemplate(pieces[i], biblist, refmap);
        headcenter += pieces[i] === '' ? '&#160;' : tstring;
        headcenter += '</rend>\n';
        if (i < pieces.length - 1) headcenter += '<lb/>\n';
      }
      headcenter += '</rend>\n';
    }
    else {
      headcenter = this.automaticHeaderCenter(biblist, refmap);
    }

    let linecount = 0;
    const ithr = refmap.get('header-right');
    if (ithr !== undefined) {
      hre.split(pieces, ithr, '\\\\n');
      headright = '<rend halign="right" valign="bottom">\n';
      for (let i = 0; i < pieces.length; ++i) {
        headright += '<rend fontsize="small">';
        const tstring = this.processReferenceTemplate(pieces[i], biblist, refmap);
        headright += pieces[i] === '' ? '&#160;' : tstring;
        headright += '</rend>\n';
        if (i < pieces.length - 1) headright += '<lb/>\n';
      }
      headright += '</rend>\n';
    }
    else {
      const pair = this.automaticHeaderRight(biblist, refmap);
      headright = pair[0];
      linecount = pair[1];
    }

    const ithl = refmap.get('header-left');
    if (ithl !== undefined) {
      hre.split(pieces, ithl, '\\\\n');
      headleft = '<rend halign="left" valign="bottom">\n';
      for (let i = 0; i < pieces.length; ++i) {
        headleft += '<rend fontsize="small">';
        const tstring = this.processReferenceTemplate(pieces[i], biblist, refmap);
        headleft += pieces[i] === '' ? '&#160;' : tstring;
        headleft += '</rend>\n';
        if (i < pieces.length - 1) headleft += '<lb/>\n';
      }
      headleft += '</rend>\n';
    }
    else {
      headleft = this.automaticHeaderLeft(refmap, linecount);
    }

    let head = headcenter + headleft + headright;

    if (head === '') return false;

    head = hre.replaceCopy(head, '</rend>', '</i>', 'g');
    head = hre.replaceCopy(head, '<rend fontstyle="italic">', '<i>', 'g');
    head = hre.replaceCopy(head, '<rend><num label="page">#</num></rend>', '%P', 'g');

    let meifile = '<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="4.0.0">\n';
    meifile += '<meiHead></meiHead>';
    meifile += '<music><body><mdiv><score><scoreDef><pgHead>\n';
    meifile += head;
    meifile += '</pgHead></scoreDef></score></mdiv></body></music></mei>\n';

    const tempdoc = new Doc();
    // TS Doc::ConvertToPageBasedDoc needs explicit factories (C++ allocates the
    // Page/System directly; see src/toolkit.ts:196).
    tempdoc.SetConversionFactories(() => new Page(), () => new System());
    const input = new MEIInput(tempdoc as never);
    if (!input.Import(meifile)) {
      LogError('Error importing data');
      return false;
    }

    const scoreDef = tempdoc.GetFirstScoreDef() as unknown as VrvObject | null;
    if (scoreDef === null) return false;
    const pghead = scoreDef.FindDescendantByType(ClassId.PGHEAD);
    if (pghead === null) return false;

    const index = pghead.GetIdx();
    if (index < 0) return false;
    const parent = pghead.GetParent();
    if (parent === null) return false;
    const detached = parent.DetachChild(index);
    if (detached !== pghead) {
      LogWarning('In HumdrumInput::prepareHeader: Detached element is not the pgHead');
      return false;
    }

    const target = (this.m_doc as unknown as Doc).GetFirstScoreDef() as unknown as VrvObject | null;
    if (target === null) return false;
    target.AddChild(pghead);

    return true;
  }

  // C++ HumdrumInput::prepareFooter (iohumdrum.cpp:6776): the score def receives a
  // pgFoot func="first" and a pgFoot func="all" from the imported fragment.
  public prepareFooter(biblist: Array<[string, string]>, refmap: Map<string, string>): boolean {
    let footleft = '';
    let footcenter = '';
    let footright = '';
    const hre = new HumRegex();
    let pieces: string[] = [];

    const itL = refmap.get('footer-left');
    if (itL !== undefined) {
      hre.split(pieces, itL, '\\\\n');
      footleft += '<rend halign="left" valign="bottom">\n';
      for (let i = 0; i < pieces.length; ++i) {
        footleft += '<rend fontsize="small">';
        const tstring = this.processReferenceTemplate(pieces[i], biblist, refmap);
        footleft += pieces[i] === '' ? '&#160;' : tstring;
        footleft += '</rend>\n';
        if (i < pieces.length - 1) footleft += '<lb/>\n';
      }
      footleft += '</rend>\n';
    }

    const itC = refmap.get('footer-center');
    if (itC !== undefined) {
      hre.split(pieces, itC, '\\\\n');
      footcenter += '<rend halign="center" valign="bottom">\n';
      for (let i = 0; i < pieces.length; ++i) {
        footcenter += '<rend fontsize="small">';
        const tstring = this.processReferenceTemplate(pieces[i], biblist, refmap);
        footcenter += pieces[i] === '' ? '&#160;' : tstring;
        footcenter += '</rend>\n';
        if (i < pieces.length - 1) footcenter += '<lb/>\n';
      }
      footcenter += '</rend>\n';
    }

    const itR = refmap.get('footer-right');
    if (itR !== undefined) {
      hre.split(pieces, itR, '\\\\n');
      footright += '<rend halign="right" valign="bottom">\n';
      for (let i = 0; i < pieces.length; ++i) {
        footright += '<rend fontsize="small">';
        const tstring = this.processReferenceTemplate(pieces[i], biblist, refmap);
        footright += pieces[i] === '' ? '&#160;' : tstring;
        footright += '</rend>\n';
        if (i < pieces.length - 1) footright += '<lb/>\n';
      }
      footright += '</rend>\n';
    }

    let footer = footleft + footcenter + footright;

    if (footer === '') return false;

    footer = hre.replaceCopy(footer, '</rend>', '</i>', 'g');
    footer = hre.replaceCopy(footer, '<rend fontstyle="italic">', '<i>', 'g');
    footer = hre.replaceCopy(footer, '<rend><num label="page">#</num></rend>', '%P', 'g');

    let meifile = '<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="4.0.0">\n';
    meifile += '<meiHead></meiHead>';
    meifile += '<music><body><mdiv><score><scoreDef>\n';
    meifile += '<pgFoot func="first">\n';
    meifile += footer;
    meifile += '</pgFoot>\n';
    // Always putting footer on all pages for now:
    meifile += '<pgFoot func="all">\n';
    meifile += footer;
    meifile += '</pgFoot>\n';
    meifile += '</scoreDef></score></mdiv></body></music></mei>\n';

    const tempdoc = new Doc();
    // TS Doc::ConvertToPageBasedDoc needs explicit factories (C++ allocates the
    // Page/System directly; see src/toolkit.ts:196).
    tempdoc.SetConversionFactories(() => new Page(), () => new System());
    const input = new MEIInput(tempdoc as never);
    if (!input.Import(meifile)) {
      LogError('Error importing data');
      return false;
    }

    const scoreDef = tempdoc.GetFirstScoreDef() as unknown as VrvObject | null;
    if (scoreDef === null) return false;
    const feet = scoreDef.FindAllDescendantsByType(ClassId.PGFOOT) as Array<VrvObject & { GetFunc(): number }>;

    const pgfoot = feet.find((foot) => foot.GetFunc() === PGFUNC_first) ?? null;
    if (pgfoot === null) return false;

    const index = pgfoot.GetIdx();
    if (index < 0) return false;
    const parent = pgfoot.GetParent();
    if (parent === null) return false;
    const detached = parent.DetachChild(index);
    if (detached !== pgfoot) {
      LogWarning('In HumdrumInput::prepareFooter: Detached element is not the pgHead.');
      return false;
    }
    const target = (this.m_doc as unknown as Doc).GetFirstScoreDef() as unknown as VrvObject | null;
    if (target === null) return false;
    target.AddChild(pgfoot);

    const pgfoot2 = feet.find((foot) => foot.GetFunc() === PGFUNC_all) ?? null;
    if (pgfoot2 === null) return true;

    const index2 = pgfoot2.GetIdx();
    if (index2 < 0) return true;
    const parent2 = pgfoot2.GetParent();
    if (parent2 === null) return true;
    const detached2 = parent2.DetachChild(index2);
    if (detached2 !== pgfoot2) {
      LogWarning('In HumdrumInput::prepareFooter: Detached element is not a pgFoot element');
      return true;
    }
    target.AddChild(pgfoot2);

    return true;
  }

  /** C++ createSimpleTitleElement: populates m_simpleTitleDoc. */
  public createSimpleTitleElement(): void {
    const titles = this.getReferenceItems('OTL');
    const movementNames = this.getReferenceItems('OMD');
    this.m_simpleTitleDoc = new xml_document();
    const titleEl = this.m_simpleTitleDoc.append_child('title');
    let firstLang = '';
    const bestTitleIdx = this.getBestItem(titles, '');
    if (bestTitleIdx >= 0 && titles[bestTitleIdx].language !== '') firstLang = titles[bestTitleIdx].language;
    const bestMovementNameIdx = this.getBestItem(movementNames, '');
    if (bestTitleIdx < 0 && bestMovementNameIdx >= 0 && movementNames[bestMovementNameIdx].language !== '') {
      firstLang = movementNames[bestMovementNameIdx].language;
    }
    if (bestTitleIdx < 0 && bestMovementNameIdx < 0) return;
    if (firstLang !== '') titleEl.append_attribute('xml:lang').set_value(firstLang);
    if (bestTitleIdx >= 0 && bestMovementNameIdx >= 0
      && titles[bestTitleIdx].value !== movementNames[bestMovementNameIdx].value) {
      this.appendText(titleEl, titles[bestTitleIdx].value + ', ' + movementNames[bestMovementNameIdx].value);
    }
    else if (bestTitleIdx >= 0) this.appendText(titleEl, titles[bestTitleIdx].value);
    else if (bestMovementNameIdx >= 0) this.appendText(titleEl, movementNames[bestMovementNameIdx].value);
  }

  /** C++ createSimpleComposerElements: populates m_simpleComposersDoc. */
  public createSimpleComposerElements(): void {
    let composers = this.getReferenceItems('COM');
    if (composers.length === 0) composers = this.getReferenceItems('COC');
    if (composers.length === 0) composers = this.getReferenceItems('COA');
    if (composers.length === 0) composers = this.getReferenceItems('COS');
    if (composers.length === 0) composers = this.getReferenceItems('COL');
    this.m_simpleComposersDoc = new xml_document();
    if (composers.length === 0) return;
    for (const composer of composers) {
      const composerEl = this.m_simpleComposersDoc.append_child('composer');
      let cert = '';
      if (composer.key === 'COA') cert = 'medium';
      else if (composer.key === 'COS') cert = 'low';
      if (cert !== '') composerEl.append_attribute('cert').set_value(cert);
      const nameEl = composer.key === 'COC' ? composerEl.append_child('corpName') : composerEl.append_child('persName');
      if (composer.key === 'COL') nameEl.append_attribute('type').set_value('alias');
      this.appendText(nameEl, composer.value);
    }
  }

  /** C++ createTitleElements. */
  public createTitleElements(work: xml_node): void {
    const mainTitles = this.getReferenceItems('OTL');
    const alternativeTitles = this.getReferenceItems('OTA');
    const popularTitles = this.getReferenceItems('OTP');
    const plainNumbers = this.getReferenceItems('ONM');
    const movementNumbers = this.getReferenceItems('OMV');
    const movementNames = this.getReferenceItems('OMD');
    const opusNumbers = this.getReferenceItems('OPS');
    const actNumbers = this.getReferenceItems('OAC');
    const sceneNumbers = this.getReferenceItems('OSC');
    const untranslatedTitleEl = work.append_child('title');
    const translatedTitleEl = work.append_child('title');
    let untranslatedTitleIsEmpty = true;
    let translatedTitleIsEmpty = true;
    for (const mainTitle of mainTitles) {
      let titlePart: xml_node;
      if (mainTitle.isTranslated) {
        translatedTitleIsEmpty = false;
        titlePart = translatedTitleEl.append_child('titlePart');
        titlePart.append_attribute('type').set_value('translated');
      }
      else {
        untranslatedTitleIsEmpty = false;
        titlePart = untranslatedTitleEl.append_child('titlePart');
        titlePart.append_attribute('type').set_value('main');
      }
      titlePart.append_attribute('analog').set_value('humdrum:OTL');
      if (mainTitle.language !== '') titlePart.append_attribute('xml:lang').set_value(mainTitle.language);
      this.appendText(titlePart, mainTitle.value);
    }
    for (const movementName of movementNames) {
      let titlePart: xml_node;
      if (movementName.isTranslated) { translatedTitleIsEmpty = false; titlePart = translatedTitleEl.append_child('titlePart'); }
      else { untranslatedTitleIsEmpty = false; titlePart = untranslatedTitleEl.append_child('titlePart'); }
      titlePart.append_attribute('type').set_value('movementName');
      titlePart.append_attribute('analog').set_value('humdrum:OMD');
      if (movementName.language !== '') titlePart.append_attribute('xml:lang').set_value(movementName.language);
      this.appendText(titlePart, movementName.value);
    }
    const appendTitlePart = (
      items: HumdrumReferenceItem[], type: string, analog: string, alwaysUntranslated = false,
    ): void => {
      for (const item of items) {
        let titlePart: xml_node;
        if (item.isTranslated && !alwaysUntranslated) { translatedTitleIsEmpty = false; titlePart = translatedTitleEl.append_child('titlePart'); }
        else { untranslatedTitleIsEmpty = false; titlePart = untranslatedTitleEl.append_child('titlePart'); }
        titlePart.append_attribute('type').set_value(type);
        titlePart.append_attribute('analog').set_value(analog);
        if (item.language !== '') titlePart.append_attribute('xml:lang').set_value(item.language);
        this.appendText(titlePart, item.value);
      }
    };
    appendTitlePart(alternativeTitles, 'alternative', 'humdrum:OTA');
    appendTitlePart(popularTitles, 'popular', 'humdrum:OTP');
    appendTitlePart(plainNumbers, 'number', 'humdrum:ONM', true);
    appendTitlePart(movementNumbers, 'movementNumber', 'humdrum:OMV');
    appendTitlePart(opusNumbers, 'opusNumber', 'humdrum:OPS');
    appendTitlePart(actNumbers, 'actNumber', 'humdrum:OAC');
    appendTitlePart(sceneNumbers, 'sceneNumber', 'humdrum:OSC');
    if (untranslatedTitleIsEmpty) work.remove_child(untranslatedTitleEl);
    else untranslatedTitleEl.append_attribute('type').set_value('uniform');
    if (translatedTitleIsEmpty) work.remove_child(translatedTitleEl);
    else translatedTitleEl.append_attribute('type').set_value('translated');
  }

  /** C++ createComposerElements (incl. MADS authority records). */
  public createComposerElements(work: xml_node): void {
    const composers = this.getReferenceItems('COM');
    const attributedComposers = this.getReferenceItems('COA');
    const suspectedComposers = this.getReferenceItems('COS');
    const corporateComposers = this.getReferenceItems('COC');
    const composerAliases = this.getReferenceItems('COL');
    const composerDates = this.getReferenceItems('CDT');
    const composerBirthPlaces = this.getReferenceItems('CBL');
    const composerDeathPlaces = this.getReferenceItems('CDL');
    const composerNationalities = this.getReferenceItems('CNT');
    const allComposers: HumdrumReferenceItem[] = [
      ...composers, ...attributedComposers, ...suspectedComposers, ...corporateComposers,
    ];
    let madsXmlIdIndex = 0;
    for (let i = 0; i < allComposers.length; i++) {
      const composer = allComposers[i];
      const composerAlias = i < composerAliases.length ? composerAliases[i] : null;
      const composerBirthAndDeathDate = i < composerDates.length ? composerDates[i] : null;
      const composerBirthPlace = i < composerBirthPlaces.length ? composerBirthPlaces[i] : null;
      const composerDeathPlace = i < composerDeathPlaces.length ? composerDeathPlaces[i] : null;
      const composerNationality = i < composerNationalities.length ? composerNationalities[i] : null;
      const composerEl = work.append_child('composer');
      let composerAnalog = 'humdrum:COM';
      let composerCert = '';
      let composerNameElementName = 'persName';
      if (composer.key === 'COA') { composerAnalog = 'humdrum:COA'; composerCert = 'medium'; }
      else if (composer.key === 'COS') { composerAnalog = 'humdrum:COS'; composerCert = 'low'; }
      else if (composer.key === 'COC') { composerAnalog = 'humdrum:COC'; composerNameElementName = 'corpName'; }
      if (composerCert !== '') composerEl.append_attribute('cert').set_value(composerCert);
      const nameEl = composerEl.append_child(composerNameElementName);
      nameEl.append_attribute('analog').set_value(composerAnalog);
      this.appendText(nameEl, composer.value);
      if (composerBirthAndDeathDate === null && composerBirthPlace === null
        && composerDeathPlace === null && composerNationality === null) continue;
      const madsXmlId = `mads${madsXmlIdIndex++}`;
      nameEl.append_attribute('auth.uri').set_value('#' + madsXmlId);
      if (!this.m_madsCollection || this.m_madsCollection.empty()) {
        this.m_madsCollection = this.m_madsDoc.append_child('madsCollection');
        this.m_madsCollection.append_attribute('xmlns:xsi').set_value('http://www.w3.org/2001/XMLSchema-instance');
        this.m_madsCollection.append_attribute('xsi:schemaLocation')
          .set_value('http://www.loc.gov/mads/v2 https://www.loc.gov/standards/mads/mads-2-1.xsd');
        this.m_madsCollection.append_attribute('xmlns').set_value('http://www.loc.gov/mads/v2');
      }
      const mads = this.m_madsCollection.append_child('mads');
      mads.append_attribute('ID').set_value(madsXmlId);
      const authority = mads.append_child('authority');
      const name = authority.append_child('name');
      if (composerNameElementName === 'corpName') name.append_attribute('type').set_value('corporate');
      const namePart = name.append_child('namePart');
      this.appendText(namePart, composer.value);
      if (composerAlias !== null) {
        const variant = mads.append_child('variant');
        variant.append_attribute('type').set_value('other');
        variant.append_attribute('otherType').set_value('humdrum:COL');
        const vName = variant.append_child('name');
        const vNamePart = vName.append_child('namePart');
        this.appendText(vNamePart, composerAlias.value);
      }
      const personInfo = mads.append_child('personInfo');
      if (composerBirthAndDeathDate !== null) {
        const attribs = this.isoDateAttributesFromHumdrumDate(composerBirthAndDeathDate.value, true);
        let isodate = '';
        let isodateBirth = '';
        let isodateDeath = '';
        if (attribs.has('edtf') || (attribs.has('startedtf') && attribs.has('endedtf'))) {
          if (attribs.has('edtf')) isodate = attribs.get('edtf') as string;
          else { isodateBirth = attribs.get('startedtf') as string; isodateDeath = attribs.get('endedtf') as string; }
        }
        if (isodate !== '') {
          const hre = new HumRegex();
          const isodates: string[] = [];
          hre.split(isodates, isodate, '/');
          const birthDate = personInfo.append_child('birthDate');
          birthDate.append_attribute('encoding').set_value('edtf');
          this.appendText(birthDate, isodates[0]);
          if (isodates.length > 1) {
            const deathDate = personInfo.append_child('deathDate');
            deathDate.append_attribute('encoding').set_value('edtf');
            this.appendText(deathDate, isodates[1]);
          }
        }
        else if (isodateBirth !== '' && isodateDeath !== '') {
          const birthDate = personInfo.append_child('birthDate');
          birthDate.append_attribute('encoding').set_value('edtf');
          this.appendText(birthDate, isodateBirth);
          const deathDate = personInfo.append_child('deathDate');
          deathDate.append_attribute('encoding').set_value('edtf');
          this.appendText(deathDate, isodateDeath);
        }
      }
      if (composerBirthPlace !== null) this.appendText(personInfo.append_child('birthPlace'), composerBirthPlace.value);
      if (composerDeathPlace !== null) this.appendText(personInfo.append_child('deathPlace'), composerDeathPlace.value);
      if (composerNationality !== null) this.appendText(personInfo.append_child('nationality'), composerNationality.value);
    }
  }

  /** C++ createDigitalSource. */
  public createDigitalSource(sourceDesc: xml_node): void {
    const keysThatGoHere = ['EED', 'ENC', 'EEV', 'EFL', 'YEP', 'YER', 'END', 'YEC', 'YEM', 'YEN', 'TXL', 'ONB'];
    if (!this.anyReferenceItemsExist(keysThatGoHere)) return;
    const editors = this.getReferenceItems('EED');
    const encoders = this.getReferenceItems('ENC');
    const versions = this.getReferenceItems('EEV');
    const fileNumbers = this.getReferenceItems('EFL');
    const publishers = this.getReferenceItems('YEP');
    const releaseDates = this.getReferenceItems('YER');
    const encodingDates = this.getReferenceItems('END');
    const copyrights = this.getReferenceItems('YEC');
    const copyrightStatements = this.getReferenceItems('YEM');
    const copyrightCountries = this.getReferenceItems('YEN');
    const textLanguages = this.getReferenceItems('TXL');
    const notes = this.getReferenceItems('ONB');
    const source = sourceDesc.append_child('source');
    source.append_attribute('type').set_value('digital');
    const bibl = source.append_child('bibl');
    bibl.append_copy(this.m_simpleTitleDoc.child('title'));
    for (let childIt = this.m_simpleComposersDoc.first_child(); !childIt.empty(); childIt = childIt.next_sibling()) {
      bibl.append_copy(childIt);
    }
    for (const editor of editors) {
      const editorEl = bibl.append_child('editor');
      editorEl.append_attribute('analog').set_value('humdrum:EED');
      this.appendText(editorEl, editor.value);
    }
    if (encoders.length > 0) {
      const respStmt = bibl.append_child('respStmt');
      for (const encoder of encoders) {
        const respEl = respStmt.append_child('resp');
        this.appendText(respEl, 'encoder');
        const persNameEl = respStmt.append_child('persName');
        persNameEl.append_attribute('analog').set_value('humdrum:ENC');
        this.appendText(persNameEl, encoder.value);
      }
    }
    for (const version of versions) {
      const versionEl = bibl.append_child('edition');
      versionEl.append_attribute('type').set_value('version');
      versionEl.append_attribute('analog').set_value('humdrum:EEV');
      this.appendText(versionEl, version.value);
    }
    for (const fileNumber of fileNumbers) {
      const fileNumberEl = bibl.append_child('extent');
      fileNumberEl.append_attribute('type').set_value('fileNumber');
      fileNumberEl.append_attribute('unit').set_value('file');
      fileNumberEl.append_attribute('analog').set_value('humdrum:EFL');
      this.appendText(fileNumberEl, fileNumber.value);
    }
    if (publishers.length > 0 || releaseDates.length > 0 || encodingDates.length > 0) {
      const imprint = bibl.append_child('imprint');
      for (const publisher of publishers) {
        const publisherEl = imprint.append_child('publisher');
        publisherEl.append_attribute('analog').set_value('humdrum:YEP');
        this.appendText(publisherEl, publisher.value);
      }
      for (const releaseDate of releaseDates) {
        const releaseDateEl = imprint.append_child('date');
        releaseDateEl.append_attribute('type').set_value('releaseDate');
        releaseDateEl.append_attribute('analog').set_value('humdrum:YER');
        this.fillInIsoDate(releaseDateEl, releaseDate.value);
        this.appendText(releaseDateEl, releaseDate.value);
      }
      for (const encodingDate of encodingDates) {
        const encodingDateEl = imprint.append_child('date');
        encodingDateEl.append_attribute('type').set_value('encodingDate');
        encodingDateEl.append_attribute('analog').set_value('humdrum:END');
        this.fillInIsoDate(encodingDateEl, encodingDate.value);
        this.appendText(encodingDateEl, encodingDate.value);
      }
    }
    if (copyrights.length > 0 || copyrightStatements.length > 0 || copyrightCountries.length > 0) {
      const availability = bibl.append_child('availability');
      for (const copyright of copyrights) {
        const el = availability.append_child('useRestrict');
        el.append_attribute('type').set_value('copyright');
        el.append_attribute('analog').set_value('humdrum:YEC');
        this.appendText(el, copyright.value);
      }
      for (const stmt of copyrightStatements) {
        const el = availability.append_child('useRestrict');
        el.append_attribute('type').set_value('copyrightStatement');
        el.append_attribute('analog').set_value('humdrum:YEM');
        this.appendText(el, stmt.value);
      }
      for (const country of copyrightCountries) {
        const el = availability.append_child('useRestrict');
        el.append_attribute('type').set_value('copyrightCountry');
        el.append_attribute('analog').set_value('humdrum:YEN');
        this.appendText(el, country.value);
      }
    }
    if (notes.length > 0) {
      const annot = bibl.append_child('annot');
      const languageForAll = this.getTextListLanguage(notes);
      const lineGroup = annot.append_child('lg');
      if (languageForAll !== '') lineGroup.append_attribute('xml:lang').set_value(languageForAll);
      for (const note of notes) {
        const line = lineGroup.append_child('l');
        line.append_attribute('type').set_value('humdrum:ONB');
        this.appendText(line, note.value);
        if (languageForAll === '' && note.language !== '') line.append_attribute('xml:lang').set_value(note.language);
      }
    }
    for (const textLanguage of textLanguages) {
      const el = bibl.append_child('textLang');
      el.append_attribute('analog').set_value('humdrum:TXL');
      this.appendText(el, textLanguage.value);
    }
  }

  /** C++ createPrintedSource. */
  public createPrintedSource(sourceDesc: xml_node): void {
    const keysThatGoHere = ['LAR', 'PED', 'LOR', 'TRN', 'OCL', 'OVM', 'PTL', 'PPR', 'PDT', 'PPP', 'PC#'];
    if (!this.anyReferenceItemsExist(keysThatGoHere)) return;
    const arrangers = this.getReferenceItems('LAR');
    const editors = this.getReferenceItems('PED');
    const orchestrators = this.getReferenceItems('LOR');
    const translators = this.getReferenceItems('TRN');
    const collectors = this.getReferenceItems('OCL');
    const volumeNumbers = this.getReferenceItems('OVM');
    const volumeNames = this.getReferenceItems('PTL');
    const publishers = this.getReferenceItems('PPR');
    const datesPublished = this.getReferenceItems('PDT');
    const locationsPublished = this.getReferenceItems('PPP');
    const publisherCatalogNumbers = this.getReferenceItems('PC#');
    const source = sourceDesc.append_child('source');
    source.append_attribute('type').set_value('printed');
    const bibl = source.append_child('bibl');
    for (const pcn of publisherCatalogNumbers) {
      const identifierEl = bibl.append_child('identifier');
      identifierEl.append_attribute('type').set_value('catalogNumber');
      identifierEl.append_attribute('analog').set_value('humdrum:PC#');
      this.appendText(identifierEl, pcn.value);
    }
    bibl.append_copy(this.m_simpleTitleDoc.child('title'));
    for (let childIt = this.m_simpleComposersDoc.first_child(); !childIt.empty(); childIt = childIt.next_sibling()) {
      bibl.append_copy(childIt);
    }
    for (const editor of editors) {
      const editorEl = bibl.append_child('editor');
      editorEl.append_attribute('analog').set_value('humdrum:PED');
      this.appendText(editorEl, editor.value);
    }
    if (arrangers.length > 0 || orchestrators.length > 0 || translators.length > 0 || collectors.length > 0) {
      const respStmt = bibl.append_child('respStmt');
      for (const arranger of arrangers) {
        this.appendText(respStmt.append_child('resp'), 'arranger');
        const persNameEl = respStmt.append_child('persName');
        persNameEl.append_attribute('analog').set_value('humdrum:LAR');
        this.appendText(persNameEl, arranger.value);
      }
      for (const orchestrator of orchestrators) {
        this.appendText(respStmt.append_child('resp'), 'orchestrator');
        const persNameEl = respStmt.append_child('persName');
        persNameEl.append_attribute('analog').set_value('humdrum:LOR');
        this.appendText(persNameEl, orchestrator.value);
      }
      for (const translator of translators) {
        this.appendText(respStmt.append_child('resp'), 'translator');
        const persNameEl = respStmt.append_child('persName');
        persNameEl.append_attribute('analog').set_value('humdrum:TRN');
        this.appendText(persNameEl, translator.value);
      }
      for (const collector of collectors) {
        this.appendText(respStmt.append_child('resp'), 'collector/transcriber');
        const nameEl = respStmt.append_child('name');
        nameEl.append_attribute('analog').set_value('humdrum:OCL');
        this.appendText(nameEl, collector.value);
      }
    }
    if (publishers.length > 0 || datesPublished.length > 0 || locationsPublished.length > 0) {
      const imprint = bibl.append_child('imprint');
      for (const publisher of publishers) {
        const publisherEl = imprint.append_child('publisher');
        publisherEl.append_attribute('analog').set_value('humdrum:PPR');
        this.appendText(publisherEl, publisher.value);
      }
      for (const datePublished of datesPublished) {
        const dateEl = imprint.append_child('date');
        dateEl.append_attribute('type').set_value('datePublished');
        dateEl.append_attribute('analog').set_value('humdrum:PDT');
        this.fillInIsoDate(dateEl, datePublished.value);
        this.appendText(dateEl, datePublished.value);
      }
      for (const locationPublished of locationsPublished) {
        const geogNameEl = imprint.append_child('geogName');
        geogNameEl.append_attribute('role').set_value('locationPublished');
        geogNameEl.append_attribute('analog').set_value('humdrum:PPP');
        this.appendText(geogNameEl, locationPublished.value);
      }
    }
    const paired = Math.min(volumeNames.length, volumeNumbers.length);
    for (let i = 0; i < paired; i++) {
      const relatedItem = bibl.append_child('relatedItem');
      relatedItem.append_attribute('rel').set_value('host');
      const relBibl = relatedItem.append_child('bibl');
      const titleElement = relBibl.append_child('title');
      titleElement.append_attribute('analog').set_value('humdrum:PTL');
      this.appendText(titleElement, volumeNames[i].value);
      const biblScope = relBibl.append_child('biblScope');
      biblScope.append_attribute('analog').set_value('humdrum:OVM');
      this.appendText(biblScope, volumeNumbers[i].value);
    }
    if (volumeNames.length > volumeNumbers.length) {
      for (let i = volumeNumbers.length; i < volumeNames.length; i++) {
        const relatedItem = bibl.append_child('relatedItem');
        relatedItem.append_attribute('rel').set_value('host');
        const relBibl = relatedItem.append_child('bibl');
        const titleElement = relBibl.append_child('title');
        titleElement.append_attribute('analog').set_value('humdrum:PTL');
        this.appendText(titleElement, volumeNames[i].value);
      }
    }
  }

  /** C++ createRecordedSource. */
  public createRecordedSource(sourceDesc: xml_node): void {
    const keysThatGoHere = ['RTL', 'RC#', 'MGN', 'MPN', 'MPS', 'RNP', 'MCN', 'RMM', 'RRD', 'RLC', 'RDT', 'RT#'];
    if (!this.anyReferenceItemsExist(keysThatGoHere)) return;
    const albumTitles = this.getReferenceItems('RTL');
    const albumCatalogNumbers = this.getReferenceItems('RC#');
    const ensembleNames = this.getReferenceItems('MGN');
    const performerNames = this.getReferenceItems('MPN');
    const suspectedPerformerNames = this.getReferenceItems('MPS');
    const producers = this.getReferenceItems('RNP');
    const conductors = this.getReferenceItems('MCN');
    const manufacturers = this.getReferenceItems('RMM');
    const releaseDates = this.getReferenceItems('RRD');
    const recordingLocations = this.getReferenceItems('RLC');
    const recordingDates = this.getReferenceItems('RDT');
    const trackNumbers = this.getReferenceItems('RT#');
    let longestLen = albumTitles.length;
    for (const arr of [albumCatalogNumbers, ensembleNames, performerNames, suspectedPerformerNames,
      producers, conductors, manufacturers, releaseDates, recordingLocations, recordingDates, trackNumbers]) {
      longestLen = Math.max(longestLen, arr.length);
    }
    const source = sourceDesc.append_child('source');
    source.append_attribute('type').set_value('recording');
    const biblStruct = source.append_child('biblStruct');
    for (let i = 0; i < longestLen; i++) {
      if (i < trackNumbers.length) {
        const analytic = biblStruct.append_child('analytic');
        analytic.append_copy(this.m_simpleTitleDoc.child('title'));
        const biblScope = analytic.append_child('biblScope');
        biblScope.append_attribute('type').set_value('trackNumber');
        biblScope.append_attribute('unit').set_value('track');
        biblScope.append_attribute('analog').set_value('humdrum:RT#');
        this.appendText(biblScope, trackNumbers[i].value);
      }
      if (i < albumTitles.length || i < albumCatalogNumbers.length || i < ensembleNames.length
        || i < performerNames.length || i < suspectedPerformerNames.length || i < producers.length
        || i < conductors.length || i < manufacturers.length || i < releaseDates.length
        || i < recordingLocations.length || i < recordingDates.length) {
        const monogr = biblStruct.append_child('monogr');
        if (i < albumTitles.length) {
          const titleEl = monogr.append_child('title');
          titleEl.append_attribute('analog').set_value('humdrum:RTL');
          this.appendText(titleEl, albumTitles[i].value);
        }
        if (i < albumCatalogNumbers.length) {
          const identifierEl = monogr.append_child('identifier');
          identifierEl.append_attribute('type').set_value('catalogNumber');
          identifierEl.append_attribute('analog').set_value('humdrum:RC#');
          this.appendText(identifierEl, albumCatalogNumbers[i].value);
        }
        if (i < ensembleNames.length || i < performerNames.length || i < suspectedPerformerNames.length) {
          const respStmt = monogr.append_child('respStmt');
          if (i < ensembleNames.length) {
            this.appendText(respStmt.append_child('resp'), 'ensemble');
            const nameEl = respStmt.append_child('corpName');
            nameEl.append_attribute('analog').set_value('humdrum:MGN');
            this.appendText(nameEl, ensembleNames[i].value);
          }
          if (i < performerNames.length) {
            this.appendText(respStmt.append_child('resp'), 'performer');
            const nameEl = respStmt.append_child('persName');
            nameEl.append_attribute('analog').set_value('humdrum:MPN');
            this.appendText(nameEl, performerNames[i].value);
          }
          if (i < suspectedPerformerNames.length) {
            const respEl = respStmt.append_child('resp');
            this.appendText(respEl, 'performer');
            respEl.append_attribute('cert').set_value('low');
            const nameEl = respStmt.append_child('persName');
            nameEl.append_attribute('analog').set_value('humdrum:MPS');
            this.appendText(nameEl, suspectedPerformerNames[i].value);
          }
        }
        if (i < producers.length || i < conductors.length || i < manufacturers.length) {
          const respStmt = monogr.append_child('respStmt');
          if (i < producers.length) {
            this.appendText(respStmt.append_child('resp'), 'producer');
            const nameEl = respStmt.append_child('persName');
            nameEl.append_attribute('analog').set_value('humdrum:RNP');
            this.appendText(nameEl, producers[i].value);
          }
          if (i < conductors.length) {
            this.appendText(respStmt.append_child('resp'), 'conductor');
            const nameEl = respStmt.append_child('persName');
            nameEl.append_attribute('analog').set_value('humdrum:MCN');
            this.appendText(nameEl, conductors[i].value);
          }
          if (i < manufacturers.length) {
            this.appendText(respStmt.append_child('resp'), 'manufacturer');
            const nameEl = respStmt.append_child('corpName');
            nameEl.append_attribute('analog').set_value('humdrum:RMM');
            this.appendText(nameEl, manufacturers[i].value);
          }
        }
        if (i < releaseDates.length || i < recordingLocations.length || i < recordingDates.length) {
          const imprint = monogr.append_child('imprint');
          if (i < releaseDates.length) {
            const dateEl = imprint.append_child('date');
            dateEl.append_attribute('type').set_value('releaseDate');
            dateEl.append_attribute('analog').set_value('humdrum:RRD');
            this.fillInIsoDate(dateEl, releaseDates[i].value);
            this.appendText(dateEl, releaseDates[i].value);
          }
          if (i < recordingLocations.length) {
            const geogNameEl = imprint.append_child('geogName');
            geogNameEl.append_attribute('role').set_value('recordingLocation');
            geogNameEl.append_attribute('analog').set_value('humdrum:RLC');
            this.appendText(geogNameEl, recordingLocations[i].value);
          }
          if (i < recordingDates.length) {
            const dateEl = imprint.append_child('date');
            dateEl.append_attribute('type').set_value('recordingDate');
            dateEl.append_attribute('analog').set_value('humdrum:RDT');
            this.fillInIsoDate(dateEl, recordingDates[i].value);
            this.appendText(dateEl, recordingDates[i].value);
          }
        }
      }
    }
  }

  /** C++ createUnpublishedSource. */
  public createUnpublishedSource(sourceDesc: xml_node): void {
    const keysThatGoHere = ['SMS', 'YOR', 'SML', 'YOO', 'YOE', 'YOY', 'SMA'];
    if (!this.anyReferenceItemsExist(keysThatGoHere)) return;
    const manuscriptNames = this.getReferenceItems('SMS');
    const moreManuscriptNames = this.getReferenceItems('YOR');
    const manuscriptLocations = this.getReferenceItems('SML');
    const manuscriptOwners = this.getReferenceItems('YOO');
    const editors = this.getReferenceItems('YOE');
    const copyrightDates = this.getReferenceItems('YOY');
    const acknowledgments = this.getReferenceItems('SMA');
    const source = sourceDesc.append_child('source');
    source.append_attribute('type').set_value('unpub');
    const bibl = source.append_child('bibl');
    for (const m of manuscriptNames) {
      const el = bibl.append_child('identifier');
      el.append_attribute('analog').set_value('humdrum:SMS');
      this.appendText(el, m.value);
    }
    for (const m of moreManuscriptNames) {
      const el = bibl.append_child('identifier');
      el.append_attribute('analog').set_value('humdrum:YOR');
      this.appendText(el, m.value);
    }
    for (const m of manuscriptNames) {
      const el = bibl.append_child('title');
      el.append_attribute('analog').set_value('humdrum:SMS');
      this.appendText(el, m.value);
    }
    for (const m of moreManuscriptNames) {
      const el = bibl.append_child('title');
      el.append_attribute('analog').set_value('humdrum:YOR');
      this.appendText(el, m.value);
    }
    for (const m of manuscriptLocations) {
      const el = bibl.append_child('repository');
      el.append_attribute('analog').set_value('humdrum:SML');
      this.appendText(el, m.value);
    }
    for (const m of manuscriptOwners) {
      const el = bibl.append_child('name');
      el.append_attribute('role').set_value('manuscriptOwner');
      el.append_attribute('analog').set_value('humdrum:YOO');
      this.appendText(el, m.value);
    }
    for (const editor of editors) {
      const el = bibl.append_child('editor');
      el.append_attribute('analog').set_value('humdrum:YOE');
      this.appendText(el, editor.value);
    }
    for (const copyrightDate of copyrightDates) {
      const el = bibl.append_child('date');
      el.append_attribute('type').set_value('copyrightDate');
      el.append_attribute('analog').set_value('humdrum:YOY');
      el.append_attribute('role').set_value('copyrightDate');
      this.appendText(el, copyrightDate.value);
    }
    for (const ack of acknowledgments) {
      const el = bibl.append_child('annot');
      el.append_attribute('analog').set_value('humdrum:SMA');
      this.appendText(el, ack.value);
    }
  }

  /** C++ createFileDesc. */
  public createFileDesc(meiHead: xml_node): void {
    const fileDesc = meiHead.append_child('fileDesc');
    const titleStmt = fileDesc.append_child('titleStmt');
    titleStmt.append_copy(this.m_simpleTitleDoc.child('title'));
    const pubStmt = fileDesc.append_child('pubStmt');
    const unpub = pubStmt.append_child('unpub');
    this.appendText(unpub,
      'This MEI file was created by Verovio\'s Humdrum converter. When published, this unpub element '
      + 'should be removed, and the enclosing pubStmt element should be properly filled out.');
    const sourceDesc = fileDesc.append_child('sourceDesc');
    this.createDigitalSource(sourceDesc);
    this.createPrintedSource(sourceDesc);
    const digitalSource = sourceDesc.find_child_by_attribute('source', 'type', 'digital');
    const printedSource = sourceDesc.find_child_by_attribute('source', 'type', 'printed');
    if (!digitalSource.empty() && !printedSource.empty()) {
      const digitalSourceBibl = digitalSource.child('bibl');
      digitalSourceBibl.append_attribute('xml:id').set_value('source0_digital');
      const printedSourceBibl = printedSource.child('bibl');
      printedSourceBibl.append_attribute('xml:id').set_value('source1_printed');
      const digitalRelatedItem = digitalSourceBibl.append_child('relatedItem');
      digitalRelatedItem.append_attribute('rel').set_value('otherFormat');
      digitalRelatedItem.append_attribute('target').set_value('#source1_printed');
      const printedRelatedItem = printedSourceBibl.append_child('relatedItem');
      printedRelatedItem.append_attribute('rel').set_value('otherFormat');
      printedRelatedItem.append_attribute('target').set_value('#source0_digital');
    }
    this.createRecordedSource(sourceDesc);
    this.createUnpublishedSource(sourceDesc);
    const firstSource = sourceDesc.child('source');
    if (firstSource.empty()) fileDesc.remove_child(sourceDesc);
  }

  /** C++ createEncodingDesc. */
  public createEncodingDesc(meiHead: xml_node): void {
    const encodingDesc = meiHead.append_child('encodingDesc');
    const appInfo = encodingDesc.append_child('appInfo');
    const application = appInfo.append_child('application');
    application.append_attribute('isodate').set_value(HumdrumInput.getDateString());
    application.append_attribute('version').set_value(GetVersion());
    this.appendText(application.append_child('name'), 'Verovio');
    this.appendText(application.append_child('p'), 'Transcoded from Humdrum');
    const encodingNotes = this.getReferenceItems('RNB');
    const encodingWarnings = this.getReferenceItems('RWB');
    if (encodingNotes.length > 0 || encodingWarnings.length > 0) {
      const editorialDecl = encodingDesc.append_child('editorialDecl');
      const p = editorialDecl.append_child('p');
      if (encodingNotes.length > 0) {
        const languageForAll = this.getTextListLanguage(encodingNotes);
        const lineGroup = p.append_child('lg');
        if (languageForAll !== '') lineGroup.append_attribute('xml:lang').set_value(languageForAll);
        for (const note of encodingNotes) {
          const line = lineGroup.append_child('l');
          line.append_attribute('type').set_value('humdrum:RNB');
          if (note.language !== '' && languageForAll === '') line.append_attribute('xml:lang').set_value(note.language);
          this.appendText(line, note.value);
        }
      }
      if (encodingWarnings.length > 0) {
        const languageForAll = this.getTextListLanguage(encodingWarnings);
        const lineGroup = p.append_child('lg');
        if (languageForAll !== '') lineGroup.append_attribute('xml:lang').set_value(languageForAll);
        for (const warning of encodingWarnings) {
          const line = lineGroup.append_child('l');
          line.append_attribute('type').set_value('humdrum:RWB');
          if (warning.language !== '' && languageForAll === '') line.append_attribute('xml:lang').set_value(warning.language);
          this.appendText(line, warning.value);
        }
      }
    }
  }

  /** C++ createWorkList (parent/group/associated/collection + encoded work). */
  public createWorkList(meiHead: xml_node): void {
    const catalogNumbers = this.getReferenceItems('SCA');
    const catalogAbbrevNumbers = this.getReferenceItems('SCT');
    const opusNumbers = this.getReferenceItems('OPS');
    const creationDates = this.getReferenceItems('ODT');
    const creationCountries = this.getReferenceItems('OCY');
    const creationSettlements = this.getReferenceItems('OPC');
    const creationRegions = this.getReferenceItems('ARE');
    const creationLatLongs = this.getReferenceItems('ARL');
    const lyricists = this.getReferenceItems('LYR');
    const librettists = this.getReferenceItems('LIB');
    const dedicatees = this.getReferenceItems('ODE');
    const funders = this.getReferenceItems('OCO');
    const languages = this.getReferenceItems('TXO');
    const histories = this.getReferenceItems('HAO');
    const instrumentLists = this.getReferenceItems('AIN');
    const forms = this.getReferenceItems('AFR');
    const genres = this.getReferenceItems('AGN');
    const modes = this.getReferenceItems('AMD');
    const meters = this.getReferenceItems('AMT');
    const styles = this.getReferenceItems('AST');
    const firstPerformanceDates = this.getReferenceItems('MPD');
    const performanceDates = [...this.getReferenceItems('MDT'), ...this.getReferenceItems('MRD')];
    const performanceLocations = this.getReferenceItems('MLC');
    const parentWorkTitles = this.getReferenceItems('OPR');
    const groupWorkTitles = this.getReferenceItems('GTL');
    const associatedWorkTitles = this.getReferenceItems('GAW');
    const collectionWorkTitles = [...this.getReferenceItems('GCO'), ...this.getReferenceItems('ACO')];
    let workList: xml_node | null = null;
    let parentWorkXmlId = '';
    let groupWorkXmlId = '';
    let associatedWorkXmlId = '';
    let collectionWorkXmlId = '';
    let workNumber = 0;
    const relatedWork = (
      titles: HumdrumReferenceItem[], type: string, analog: string, idSuffix: string,
    ): string => {
      if (titles.length === 0) return '';
      if (workList === null) workList = meiHead.append_child('workList');
      const xmlId = `work${workNumber++}_${idSuffix}`;
      const work = workList.append_child('work');
      work.append_attribute('xml:id').set_value(xmlId);
      work.append_attribute('type').set_value(type);
      for (const title of titles) {
        const titleEl = work.append_child('title');
        titleEl.append_attribute('analog').set_value(analog);
        this.appendText(titleEl, title.value);
      }
      return xmlId;
    };
    parentWorkXmlId = relatedWork(parentWorkTitles, 'parent', 'humdrum:OPR', 'parent');
    groupWorkXmlId = relatedWork(groupWorkTitles, 'group', 'humdrum:GTL', 'group');
    associatedWorkXmlId = relatedWork(associatedWorkTitles, 'associated', 'humdrum:GAW', 'associated');
    collectionWorkXmlId = relatedWork(collectionWorkTitles, 'collection', 'humdrum:GCO', 'collection');
    const titleInfoKeys = ['OTL', 'OTA', 'OTP', 'ONM', 'OMV', 'OMD', 'OPS', 'OAC', 'OSC'];
    const composerInfoKeys = ['COM', 'COA', 'COS', 'COC', 'COL', 'CDT', 'CBL', 'CDL', 'CNT'];
    if (catalogNumbers.length > 0 || opusNumbers.length > 0
      || this.anyReferenceItemsExist(titleInfoKeys) || creationDates.length > 0
      || creationCountries.length > 0 || creationSettlements.length > 0 || creationRegions.length > 0
      || creationLatLongs.length > 0 || this.anyReferenceItemsExist(composerInfoKeys)
      || lyricists.length > 0 || librettists.length > 0 || dedicatees.length > 0
      || funders.length > 0 || languages.length > 0 || histories.length > 0
      || instrumentLists.length > 0 || forms.length > 0 || genres.length > 0 || modes.length > 0
      || meters.length > 0 || styles.length > 0 || firstPerformanceDates.length > 0
      || performanceDates.length > 0 || performanceLocations.length > 0) {
      if (workList === null) workList = meiHead.append_child('workList');
      const theWork = workList.append_child('work');
      const xmlId = `work${workNumber++}_encoded`;
      theWork.append_attribute('xml:id').set_value(xmlId);
      (this.m_doc as unknown as { m_musicDecls: string }).m_musicDecls = '#' + xmlId;
      theWork.append_attribute('type').set_value('encoded');
      for (const catalogNumber of catalogNumbers) {
        const el = theWork.append_child('identifier');
        el.append_attribute('analog').set_value('humdrum:SCA');
        this.appendText(el, catalogNumber.value);
      }
      for (const catalogAbbrevNumber of catalogAbbrevNumbers) {
        const el = theWork.append_child('identifier');
        el.append_attribute('analog').set_value('humdrum:SCT');
        this.appendText(el, catalogAbbrevNumber.value);
      }
      for (const opusNumber of opusNumbers) {
        const el = theWork.append_child('identifier');
        el.append_attribute('analog').set_value('humdrum:OPS');
        this.appendText(el, opusNumber.value);
      }
      this.createTitleElements(theWork);
      this.createComposerElements(theWork);
      for (const lyricist of lyricists) {
        const lyricistEl = theWork.append_child('lyricist');
        const name = lyricistEl.append_child('persName');
        name.append_attribute('analog').set_value('humdrum:LYR');
        this.appendText(name, lyricist.value);
      }
      for (const librettist of librettists) {
        const librettistEl = theWork.append_child('librettist');
        const name = librettistEl.append_child('persName');
        name.append_attribute('analog').set_value('humdrum:LIB');
        this.appendText(name, librettist.value);
      }
      for (const funder of funders) {
        const funderEl = theWork.append_child('funder');
        const name = funderEl.append_child('name');
        name.append_attribute('analog').set_value('humdrum:OCO');
        this.appendText(name, funder.value);
      }
      if (creationDates.length > 0 || creationCountries.length > 0 || creationSettlements.length > 0
        || creationRegions.length > 0 || creationLatLongs.length > 0 || dedicatees.length > 0) {
        const creation = theWork.append_child('creation');
        for (const creationDate of creationDates) {
          const date = creation.append_child('date');
          date.append_attribute('analog').set_value('humdrum:ODT');
          this.fillInIsoDate(date, creationDate.value);
          this.appendText(date, creationDate.value);
        }
        for (const creationCountry of creationCountries) {
          const country = creation.append_child('country');
          country.append_attribute('analog').set_value('humdrum:OCY');
          this.appendText(country, creationCountry.value);
        }
        for (const creationSettlement of creationSettlements) {
          const settlement = creation.append_child('settlement');
          settlement.append_attribute('analog').set_value('humdrum:OPC');
          this.appendText(settlement, creationSettlement.value);
        }
        for (const creationRegion of creationRegions) {
          const geogName = creation.append_child('geogName');
          geogName.append_attribute('analog').set_value('humdrum:ARE');
          this.appendText(geogName, creationRegion.value);
        }
        for (const creationLatLong of creationLatLongs) {
          const geogName = creation.append_child('geogName');
          geogName.append_attribute('type').set_value('coordinates');
          geogName.append_attribute('analog').set_value('humdrum:ARL');
          this.appendText(geogName, creationLatLong.value);
        }
        for (const dedicatee of dedicatees) {
          const dedicateeEl = creation.append_child('dedicatee');
          dedicateeEl.append_attribute('analog').set_value('humdrum:ODE');
          this.appendText(dedicateeEl, dedicatee.value);
        }
      }
      if (histories.length > 0) {
        const languageForAll = this.getTextListLanguage(histories);
        const historyEl = theWork.append_child('history');
        const lineGroup = historyEl.append_child('lg');
        if (languageForAll !== '') lineGroup.append_attribute('xml:lang').set_value(languageForAll);
        for (const history of histories) {
          const line = lineGroup.append_child('l');
          line.append_attribute('type').set_value('humdrum:HAO');
          if (history.language !== '' && languageForAll === '') line.append_attribute('xml:lang').set_value(history.language);
          this.appendText(line, history.value);
        }
      }
      if (languages.length > 0) {
        const langUsage = theWork.append_child('langUsage');
        for (const language of languages) {
          const languageEl = langUsage.append_child('language');
          languageEl.append_attribute('analog').set_value('humdrum:TXO');
          this.appendText(languageEl, language.value);
        }
      }
      if (forms.length > 0 || genres.length > 0 || modes.length > 0 || meters.length > 0 || styles.length > 0) {
        const classification = theWork.append_child('classification');
        const termList = classification.append_child('termList');
        const addTerms = (items: HumdrumReferenceItem[], label: string, analog: string): void => {
          for (const item of items) {
            const termEl = termList.append_child('term');
            termEl.append_attribute('label').set_value(label);
            termEl.append_attribute('analog').set_value(analog);
            this.appendText(termEl, item.value);
          }
        };
        addTerms(forms, 'form', 'humdrum:AFR');
        addTerms(genres, 'genre', 'humdrum:AGN');
        addTerms(modes, 'mode', 'humdrum:AMD');
        addTerms(meters, 'meter', 'humdrum:AMT');
        addTerms(styles, 'style', 'humdrum:AST');
      }
      if (firstPerformanceDates.length > 0 || performanceDates.length > 0) {
        const expressionList = theWork.append_child('expressionList');
        if (firstPerformanceDates.length > 0) {
          const expression = expressionList.append_child('expression');
          this.appendText(expression.append_child('title'), 'First performance');
          const creation = expression.append_child('creation');
          for (const firstPerformanceDate of firstPerformanceDates) {
            const date = creation.append_child('date');
            date.append_attribute('type').set_value('firstPerformance');
            date.append_attribute('analog').set_value('humdrum:MPD');
            this.fillInIsoDate(date, firstPerformanceDate.value);
            this.appendText(date, firstPerformanceDate.value);
          }
        }
        if (performanceDates.length > 0) {
          for (let i = 0; i < performanceDates.length; i++) {
            const expression = expressionList.append_child('expression');
            this.appendText(expression.append_child('title'), 'Performance');
            const creation = expression.append_child('creation');
            const date = creation.append_child('date');
            date.append_attribute('type').set_value('performance');
            date.append_attribute('analog').set_value('humdrum:MDT');
            this.fillInIsoDate(date, performanceDates[i].value);
            this.appendText(date, performanceDates[i].value);
            if (i < performanceLocations.length) {
              const geogName = creation.append_child('geogName');
              geogName.append_attribute('role').set_value('performanceLocation');
              geogName.append_attribute('analog').set_value('humdrum:MLC');
              this.appendText(geogName, performanceLocations[i].value);
            }
          }
        }
      }
      if (parentWorkXmlId !== '' || groupWorkXmlId !== '' || associatedWorkXmlId !== '' || collectionWorkXmlId !== '') {
        const relationList = theWork.append_child('relationList');
        if (parentWorkXmlId !== '') {
          const relation = relationList.append_child('relation');
          relation.append_attribute('rel').set_value('isPartOf');
          relation.append_attribute('type').set_value('isChildOfParent');
          relation.append_attribute('target').set_value('#' + parentWorkXmlId);
        }
        if (groupWorkXmlId !== '') {
          const relation = relationList.append_child('relation');
          relation.append_attribute('rel').set_value('isPartOf');
          relation.append_attribute('type').set_value('isMemberOfGroup');
          relation.append_attribute('target').set_value('#' + groupWorkXmlId);
        }
        if (associatedWorkXmlId !== '') {
          const relation = relationList.append_child('relation');
          relation.append_attribute('rel').set_value('isVersionOf');
          relation.append_attribute('type').set_value('isAssociatedWith');
          relation.append_attribute('target').set_value('#' + associatedWorkXmlId);
        }
        if (collectionWorkXmlId !== '') {
          const relation = relationList.append_child('relation');
          relation.append_attribute('rel').set_value('isPartOf');
          relation.append_attribute('type').set_value('isMemberOfCollection');
          relation.append_attribute('target').set_value('#' + collectionWorkXmlId);
        }
      }
      if (this.m_madsCollection && !this.m_madsCollection.empty()) {
        const extMeta = theWork.append_child('extMeta');
        extMeta.append_copy(this.m_madsCollection);
      }
    }
  }

  /** C++ createBackMatter (humdrum:HTX -> music/back/textTranslation). */
  public createBackMatter(): void {
    const htxItems = this.getReferenceItems('HTX');
    if (htxItems.length === 0) return;
    const languageForAll = this.getTextListLanguage(htxItems);
    let back = this.m_docBack.child('back');
    if (back.empty()) back = this.m_docBack.append_child('back');
    const div = back.append_child('div');
    div.append_attribute('type').set_value('textTranslation');
    const lineGroup = div.append_child('lg');
    if (languageForAll !== '') lineGroup.append_attribute('xml:lang').set_value(languageForAll);
    for (const htxItem of htxItems) {
      const line = lineGroup.append_child('l');
      line.append_attribute('type').set_value('humdrum:HTX');
      if (languageForAll === '' && htxItem.language !== '') line.append_attribute('xml:lang').set_value(htxItem.language);
      this.appendText(line, htxItem.value);
    }
  }

  private get m_docBack(): xml_document {
    return (this.m_doc as unknown as { m_back: xml_document }).m_back;
  }

  /** C++ createHeader (builds meiHead, simple title/composers, back matter). */
  public createHeader(): void {
    const infile = this.m_infiles.at(0);
    this.m_humdrumLineReferences = infile.getReferenceRecords();
    this.getAllReferenceItems(infile);
    this.createSimpleTitleElement();
    this.createSimpleComposerElements();
    const meiHead = this.m_header.append_child('meiHead');
    this.createFileDesc(meiHead);
    this.createEncodingDesc(meiHead);
    this.createWorkList(meiHead);
    this.createHumdrumVerbatimExtMeta(meiHead);
    this.createBackMatter();
  }

  // C++ HumdrumInput::createHumdrumVerbatimExtMeta (iohumdrum.cpp:4941): dump every
  // reference record as a HumdrumXML <frame>/<metaFrame> and append the parsed
  // result to <meiHead>.
  public createHumdrumVerbatimExtMeta(meiHead: xml_node): void {
    // for now do not print for **mens data, since timestamps are used
    if (this.m_mens) return;

    let xmldata = '<extMeta>\n';
    xmldata += '\t<frames xmlns="http://www.humdrum.org/ns/humxml">\n';
    for (let i = 0; i < this.m_humdrumLineReferences.length; ++i) {
      const line = this.m_humdrumLineReferences[i];
      // Keep all reference records for round-trip conversions (the C++ filter is
      // commented out).
      if (line !== null) xmldata += line.printXml(4, '\t');
    }
    xmldata += '\t</frames>\n';
    xmldata += '</extMeta>\n';

    const tmpdoc = new xml_document();
    const result = tmpdoc.load_string(xmldata);
    if (!result.toBoolean()) {
      // some sort of error, so give up
      LogWarning('In HumdrumInput::createHumdrumVerbatimExtMeta: ExtMeta parse error: ' + result.description());
      LogWarning('   xmldata string is: ' + xmldata);
      return;
    }

    meiHead.append_copy(tmpdoc.document_element());
  }

  private get m_header(): xml_document {
    return (this.m_doc as unknown as { m_header: xml_document }).m_header;
  }

  /** C++ promoteInstrumentsForStaffGroup. */
  public promoteInstrumentsForStaffGroup(group: StaffGrp): void {
    const count = group.GetChildCount(ClassId.UNSPECIFIED);
    const names: string[] = [];
    const sds: StaffDef[] = [];
    for (let i = 0; i < count; ++i) {
      const obj = group.GetChild(i);
      if (obj === null) continue;
      if (obj.GetClassId() === ClassId.STAFFGRP) this.promoteInstrumentsForStaffGroup(obj as StaffGrp);
      if (obj.GetClassId() !== ClassId.STAFFDEF) continue;
      const sd = obj as StaffDef;
      sds.push(sd);
      names.push(this.getInstrumentName(sd));
    }
    if (names.length <= 1) return;
    if (sds.length !== 2) return;
    let nonempty = names[0];
    for (let i = 1; i < names.length; ++i) {
      if (names[i] === '') continue;
      if (nonempty === '') { nonempty = names[i]; continue; }
      if (names[i] !== nonempty) return;
    }
    this.setInstrumentName(group as never, nonempty, null);
    for (const sd of sds) this.removeInstrumentName(sd);
  }

  /** C++ promoteInstrumentAbbreviationsForStaffGroup. */
  public promoteInstrumentAbbreviationsForStaffGroup(group: StaffGrp): void {
    const count = group.GetChildCount(ClassId.UNSPECIFIED);
    const names: string[] = [];
    const sds: StaffDef[] = [];
    for (let i = 0; i < count; ++i) {
      const obj = group.GetChild(i);
      if (obj === null) continue;
      if (obj.GetClassId() === ClassId.STAFFGRP) this.promoteInstrumentAbbreviationsForStaffGroup(obj as StaffGrp);
      if (obj.GetClassId() !== ClassId.STAFFDEF) continue;
      const sd = obj as StaffDef;
      sds.push(sd);
      names.push(this.getInstrumentAbbreviation(sd));
    }
    if (names.length <= 1) return;
    if (sds.length !== 2) return;
    let nonempty = names[0];
    for (let i = 1; i < names.length; ++i) {
      if (names[i] === '') continue;
      if (nonempty === '') { nonempty = names[i]; continue; }
      if (names[i] !== nonempty) return;
    }
    this.setInstrumentAbbreviation(group as never, nonempty, null);
    for (let i = 0; i < sds.length; ++i) {
      if (names[i] === '') continue;
      this.removeInstrumentAbbreviation(sds[i]);
    }
  }

  public promoteInstrumentsForStaffGroupTopLevel(): void {
    const sdf = this.getFullDoc().GetFirstScoreDef() as unknown as { GetChildCount(c: ClassIdLike): number; GetChild(i: number): VrvObject | null } | null;
    if (sdf === null) return;
    const count = sdf.GetChildCount(ClassId.UNSPECIFIED);
    for (let i = 0; i < count; ++i) {
      const obj = sdf.GetChild(i);
      if (obj === null || obj.GetClassId() !== ClassId.STAFFGRP) continue;
      this.promoteInstrumentsForStaffGroup(obj as unknown as StaffGrp);
    }
  }

  public promoteInstrumentNamesToGroup(): void { this.promoteInstrumentsForStaffGroupTopLevel(); }

  public promoteInstrumentAbbreviationsToGroup(): void {
    const sdf = this.getFullDoc().GetFirstScoreDef() as unknown as { GetChildCount(c: ClassIdLike): number; GetChild(i: number): VrvObject | null } | null;
    if (sdf === null) return;
    const count = sdf.GetChildCount(ClassId.UNSPECIFIED);
    for (let i = 0; i < count; ++i) {
      const obj = sdf.GetChild(i);
      if (obj === null || obj.GetClassId() !== ClassId.STAFFGRP) continue;
      this.promoteInstrumentAbbreviationsForStaffGroup(obj as unknown as StaffGrp);
    }
  }

  public removeInstrumentName(sd: StaffDef): void {
    const obj = sd.FindDescendantByType(ClassId.LABEL);
    if (obj === null) return;
    sd.DeleteChild(obj);
  }

  public removeInstrumentAbbreviation(sd: StaffDef): void {
    const obj = sd.FindDescendantByType(ClassId.LABELABBR);
    if (obj === null) return;
    sd.DeleteChild(obj);
  }

  public getInstrumentName(sd: StaffDef): string {
    const label = sd.FindDescendantByType(ClassId.LABEL);
    if (label === null) return '';
    const obj = label.FindDescendantByType(ClassId.TEXT);
    if (obj === null) return '';
    let name = UTF32to8((obj as Text).GetText());
    if (name === '    ') name = '';
    return name;
  }

  public getInstrumentAbbreviation(sd: StaffDef): string {
    const label = sd.FindDescendantByType(ClassId.LABELABBR);
    if (label === null) return '';
    const obj = label.FindDescendantByType(ClassId.TEXT);
    if (obj === null) return '';
    return UTF32to8((obj as Text).GetText());
  }

  //--------------------------------------------------------------------------
  // Staff group construction (iohumdrum.cpp prepareStaffGroups /
  // processStaffDecoration / fillStaffInfo + parser helpers).
  //--------------------------------------------------------------------------

  public getAssociatedDynamSpine(stafftok: HTp): HTp {
    if (stafftok === null) return null;
    let current = stafftok.getNextFieldToken();
    while (current !== null) {
      if (current.isStaff()) break;
      if (current.isDataType('**dynam')) return current;
      current = current.getNextFieldToken();
    }
    return null;
  }

  public getPreviousStaffToken(parttok: HTp): HTp {
    if (parttok === null) return null;
    const track = parttok.getTrack();
    let ttrack = -1;
    let current = parttok.getPreviousFieldToken();
    while (current !== null) {
      if (!current.isStaff()) { current = current.getPreviousFieldToken(); continue; }
      ttrack = current.getTrack();
      if (ttrack === track) { current = current.getPreviousFieldToken(); continue; }
      break;
    }
    if (current === null) return null;
    let lastc: HTp = current;
    current = current.getPreviousFieldToken();
    while (current !== null) {
      const t2 = current.getTrack();
      if (t2 === ttrack) { lastc = current; current = current.getPreviousFieldToken(); }
      break;
    }
    return lastc;
  }

  public isBlackNotation(starting: HTp): boolean {
    let current = starting;
    while (current !== null && !current.isData()) {
      if (current.isInterpretation() && current.toString() === '*black') return true;
      current = current.getNextToken();
    }
    return false;
  }

  public getAutoClef(partstart: HTp, _partnumber: number): string {
    if (partstart === null) return '';
    let tok: HTp = partstart;
    const ptrack = partstart.getTrack();
    const dhist = new Array<number>(100).fill(0);
    const hre = new HumRegex();
    while (tok !== null) {
      if (tok.isInterpretation() && tok.compare(0, 5, '*clef') === 0) {
        if (hre.search(tok.toString(), 5, '\\d')) break;
      }
      if (!tok.isData()) { tok = tok.getNextToken(); continue; }
      if (!(tok.isNull() || tok.isRest())) {
        const diatonic = kernToBase7(tok.toString());
        if (diatonic > 0 && diatonic < 100) dhist[diatonic]++;
      }
      let ftok: HTp = tok.getNextFieldToken();
      while (ftok !== null && ptrack === ftok.getTrack()) {
        if (!(ftok.isNull() || ftok.isRest())) {
          const diatonic = kernToBase7(ftok.toString());
          if (diatonic > 0 && diatonic < 100) dhist[diatonic]++;
        }
        ftok = ftok.getNextFieldToken();
      }
      tok = tok.getNextToken();
    }
    let low = 100;
    let high = 0;
    for (let i = 0; i < 100; ++i) { if (dhist[i]) { low = i; break; } }
    for (let i = 99; i >= 0; i--) { if (dhist[i]) { high = i; break; } }
    if (high < low) return '';
    const E3 = kernToBase7('E');
    const G4 = kernToBase7('g');
    if (low > E3 && high > G4) return 'clefG2';
    if (low < E3 && high < G4) return 'clefF4';
    let wsum = 0;
    for (let i = low; i <= high; ++i) wsum += dhist[i];
    if (wsum === 0) return '';
    let topsum = 0;
    for (let i = low; i <= high; ++i) topsum += i * wsum;
    const C4 = kernToBase7('c');
    const wm = topsum / wsum;
    if (wm < C4) return 'clefF4';
    return 'clefG2';
  }

  public setGroupSymbol(sg: StaffGrp, symbol: number): void {
    // C++ deliberately does NOT SetSymbol on the StaffGrp; the symbol lives on
    // a GrpSym child that MEI output promotes into StaffGrp.
    const gs = new GrpSym();
    gs.SetAttribute(true);
    gs.SetSymbol(symbol);
    sg.AddChild(gs);
  }

  public getStaffNumbers(deco: string): number[] {
    const output: number[] = [];
    for (let i = 0; i < deco.length; ++i) {
      if (deco[i] >= '0' && deco[i] <= '9') {
        let value = 0;
        while (i < deco.length && deco[i] >= '0' && deco[i] <= '9') {
          value = value * 10 + (deco.charCodeAt(i) - 48);
          i++;
        }
        output.push(value);
      }
    }
    return output;
  }

  /** C++ getSystemDecoration: strips whitespace from a reference value. */
  public getSystemDecoration(tag: string): string {
    const infile = this.m_infiles.at(0);
    for (let i = 0; i < infile.getLineCount(); ++i) {
      if (!infile.at(i).isReference()) continue;
      if (infile.at(i).getReferenceKey() !== tag) continue;
      const value = infile.at(i).getReferenceValue();
      let output = '';
      for (const ch of value) if (!/\s/.test(ch)) output += ch;
      return output;
    }
    return '';
  }

  /** C++ getStaffNumberLabel/getGroupNumberLabel/getPartNumberLabel helper. */
  private getNumberLabel(spinestart: HTp, prefix: string): number {
    let tok = spinestart;
    while (tok !== null) {
      if (tok.isData()) break;
      if (!tok.isInterpretation()) { tok = tok.getNextToken(); continue; }
      const s = tok.toString();
      if (s.substr(0, prefix.length) !== prefix) { tok = tok.getNextToken(); continue; }
      if (s.length <= prefix.length) { tok = tok.getNextToken(); continue; }
      const number = s.substr(prefix.length);
      if (!(number[0] >= '0' && number[0] <= '9')) { tok = tok.getNextToken(); continue; }
      return Number.parseInt(number, 10);
    }
    return 0;
  }

  public getStaffNumberLabel(spinestart: HTp): number { return this.getNumberLabel(spinestart, '*staff'); }
  public getGroupNumberLabel(spinestart: HTp): number { return this.getNumberLabel(spinestart, '*group'); }
  public getPartNumberLabel(spinestart: HTp): number { return this.getNumberLabel(spinestart, '*part'); }

  public getInstrumentClass(start: HTp): string {
    let current = start;
    let output = '';
    while (current !== null) {
      if (current.isData()) break;
      if (!current.isInterpretation()) { current = current.getNextToken(); continue; }
      if (current.compare(0, 3, '*IC') === 0) { output = current.toString().substr(3); break; }
      current = current.getNextToken();
    }
    return output;
  }

  /** C++ addMidiTempo (MM marker, else OMD tempo name guess, else default). */
  public addMidiTempo(scoreDef: { SetMidiBpm(v: number): void }, kernpart: HTp, top0: number, bot0: number): void {
    let top = top0;
    let bot = bot0;
    if (top <= 0) top = 4;
    if (bot <= 0) bot = 4;
    if (this.m_mens) bot = 1;
    let foundtempo = false;
    let part: HTp = kernpart;
    while (part !== null) {
      if (part.isData()) break;
      if (!part.isInterpretation()) { part = part.getNextToken(); continue; }
      if (part.compare(0, 3, '*MM') === 0) {
        const s = part.toString();
        if (s.length > 3 && s[3] >= '0' && s[3] <= '9') {
          const tempo = Number.parseInt(s.substr(3), 10);
          scoreDef.SetMidiBpm(tempo * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
          foundtempo = true;
        }
        break;
      }
      part = part.getNextToken();
      if (part === null) break;
    }
    if (part !== null && !foundtempo) {
      const infile = this.m_infiles.at(0);
      const hre = new HumRegex();
      let omd: HTp = null;
      for (let i = 0; i < infile.getLineCount(); ++i) {
        if (infile.at(i).isData()) break;
        const token = infile.at(i).token(0);
        if (token !== null && hre.search(token.toString(), '!!!OMD')) omd = token;
      }
      if (omd !== null) {
        const guess = tempoNameToMm(omd.toString(), bot, top);
        if (guess > 0) scoreDef.SetMidiBpm(guess * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
        else this.addDefaultTempo(scoreDef as never);
      }
      else this.addDefaultTempo(scoreDef as never);
    }
  }

  /** C++ setMeterSymbol. */
  public setMeterSymbol(element: StaffDef, metersig: string, staffindex: number, partstart: HTp, metertok: HTp): void {
    if (partstart !== null && partstart.isMensLike()) {
      this.setMensurationSymbol(element, metersig, staffindex, metertok);
      return;
    }
    if (metersig.indexOf('C') !== -1 || metersig.indexOf('O') !== -1) {
      this.setMensurationSymbol(element, metersig, staffindex, metertok);
      return;
    }
    const msig = this.getMeterSigElement(element);
    if (msig === null) return;
    const common = [
      'C', 'c', '*omet(C)', '*omet(c)',
    ];
    const cut = ['c|', 'C|', '*omet(c|)', '*omet(C|)'];
    if (common.indexOf(metersig) !== -1) msig.SetSym(HumdrumInput.METER_SIGN_COMMON);
    else if (cut.indexOf(metersig) !== -1) msig.SetSym(HumdrumInput.METER_SIGN_CUT);
  }

  /** C++ setMensurationSymbol (mensuration letter map). */
  public setMensurationSymbol(element: StaffDef, metersig: string, staffindex: number, _metertok: HTp): void {
    const msig = this.getMeterSigElement(element);
    if (msig === null) return;
    void staffindex;
    if (metersig.indexOf('O') !== -1) msig.SetSym(HumdrumInput.METER_SIGN_COMMON);
    else if (metersig.indexOf('C') !== -1) msig.SetSym(HumdrumInput.METER_SIGN_CUT);
  }

  /** C++ fillStaffInfo (staffdef metadata from one **kern spine start). */
  public fillStaffInfo(staffstart: HTp, staffnumber: number, staffcount: number): void {
    const ss = this.m_staffstates;
    const primarymensurationHolder: { value: string } = { value: '' };
    const group = this.getGroupNumberLabel(staffstart);
    const staffindex = staffnumber - 1;
    let glabel = '';
    let glabeltok: HTp = null;
    let gabbreviation = '';
    let gabbrtok: HTp = null;
    let haslabel = false;
    let label = '';
    let labeltok: HTp = null;
    let abbreviation = '';
    let abbrtok: HTp = null;
    let stafftok: HTp = null;
    let parttok: HTp = null;
    let stria = '';
    let striatok: HTp = null;
    let clef = '';
    let cleftok: HTp = null;
    let keytok: HTp = null;
    let keysig = '';
    let keysigtok: HTp = null;
    let icode: HTp = null;
    let transpose = '';
    let itranspose = '';
    let staffscale: HTp = null;
    let timesig = '';
    let timetok: HTp = null;
    let metersig = '';
    let metertok: HTp = null;
    let top = 0;
    let bot = 0;
    let manip = false;
    const hre = new HumRegex();
    let part: HTp = staffstart;
    while (part !== null && !(part.getLine()?.isData() ?? false)) {
      const s = part.toString();
      if (s === '*^') manip = true;
      if (part.compare(0, 5, '*clef') === 0) {
        if (cleftok !== null) {
          if (clef !== s && part.isKern()) {
            part.setValue('auto', 'clefChange', 1);
            this.markOtherClefsAsChange(part);
          }
          part = part.getNextToken();
          continue;
        }
        if (hre.search(s, 5, '\\d') || s.indexOf('clefX') !== -1) { clef = s; cleftok = part; }
      }
      else if (part.compare(0, 6, '*oclef') === 0) {
        if (hre.search(s, 6, '\\d')) {
          this.m_oclef.push([staffnumber, part]);
          if (part.isMensLike()) { clef = s; cleftok = part; }
        }
      }
      else if (part.compare(0, 5, '*part') === 0) parttok = part;
      else if (part.compare(0, 6, '*staff') === 0) stafftok = part;
      else if (part.compare(0, 6, '*stria') === 0) { stria = s; striatok = part; }
      else if (part.compare(0, 5, '*omet') === 0) this.m_omet.push([staffnumber, part]);
      else if (part.compare(0, 3, '*k[') === 0) { keysigtok = part; keysig = s; }
      else if (part.compare(0, 4, '*ok[') === 0) this.m_okey.push([staffnumber, part]);
      else if (hre.search(s, '^\\*[a-gA-G][#-]*:([a-z]{3})?$')) keytok = part;
      else if (part.compare(0, 7, '*scale:') === 0) staffscale = part;
      else if (part.compare(0, 6, '*size:') === 0) staffscale = part;
      else if (part.compare(0, 4, '*Trd') === 0) transpose = s;
      else if (part.compare(0, 5, '*ITrd') === 0) itranspose = s;
      else if (part.compare(0, 4, "*I''") === 0 && !manip) {
        if (staffcount > 1) {
          gabbreviation = s.substr(4);
          gabbrtok = part;
          if (group > 0 && gabbreviation !== '') {
            this.m_group_abbr.set(group, gabbreviation);
            this.m_group_abbr_tok.set(group, gabbrtok);
          }
        }
      }
      else if (part.compare(0, 3, "*I'") === 0 && !manip) {
        if (staffcount > 1) { abbreviation = s.substr(3); abbrtok = part; }
      }
      else if (part.compare(0, 4, '*I""') === 0 && !manip) {
        glabel = s.substr(4);
        glabeltok = part;
        if (group > 0 && glabel !== '') {
          this.m_group_name.set(group, glabel);
          this.m_group_name_tok.set(group, glabeltok);
        }
      }
      else if (part.compare(0, 3, '*I"') === 0 && !manip) { label = s.substr(3); labeltok = part; haslabel = true; }
      else if (part.compare(0, 2, '*I') === 0 && !manip) {
        if (s.length > 2 && s[2] >= 'a' && s[2] <= 'z') { icode = part; haslabel = true; }
      }
      else if (part.compare(0, 5, '*met(') === 0) {
        const ploc = s.lastIndexOf(')');
        if (ploc !== -1) { metersig = s.slice(5, ploc); metertok = part; }
      }
      else {
        const m = /^\*M(\d+)\/(\d+)/.exec(s);
        if (m !== null) {
          top = Number.parseInt(m[1], 10);
          bot = Number.parseInt(m[2], 10);
          timesig = s;
          timetok = part;
          ss[staffindex].meter_bottom = new HumNum(bot);
          ss[staffindex].meter_top = top;
          if (bot === 0) { ss[staffindex].meter_bottom = new HumNum(1); ss[staffindex].meter_top *= 2; }
        }
        else if (s.indexOf('acclev') !== -1) this.storeAcclev(s, staffindex);
        else if (part.compare(0, 5, '*stem') === 0 || part.compare(0, 6, '*Xstem') === 0) {
          this.storeStemInterpretation(s, staffindex, part.getSubtrack());
        }
      }
      const infile = this.m_infiles.at(0);
      const line = part.getLineIndex();
      for (let ii = line + 1; ii < infile.getLineCount(); ++ii) {
        if (infile.at(ii).isGlobalComment()) {
          if (infile.at(ii).compare(0, 22, '!!primary-mensuration:') === 0) {
            const pmen = infile.at(ii).toString();
            const ploc1 = pmen.indexOf('met(');
            if (ploc1 !== -1) {
              const ploc2 = pmen.lastIndexOf(')');
              if (ploc2 !== -1) primarymensurationHolder.value = pmen.slice(ploc1 + 4, ploc2);
            }
          }
        }
        else break;
      }
      part = part.getNextToken();
    }
    const primarymensuration = primarymensurationHolder.value;
    if (labeltok === null && icode !== null) label = this.getLabelFromInstrumentCode(icode, itranspose);
    if (staffstart !== null && staffstart.isMensLike() && this.m_oclef.length > 0
      && staffnumber === this.m_oclef[this.m_oclef.length - 1][0]) {
      const oc = this.m_oclef[this.m_oclef.length - 1][1];
      if (oc !== null) {
        clef = oc.toString();
        cleftok = oc;
      }
    }
    if (staffstart !== null && staffstart.isMensLike() && this.m_omet.length > 0
      && staffnumber === this.m_omet[this.m_omet.length - 1][0]) {
      const om = this.m_omet[this.m_omet.length - 1][1];
      if (om !== null) {
        const ploc = om.toString().lastIndexOf(')');
        if (ploc !== -1) metersig = om.toString().slice(6, ploc);
        metertok = om;
      }
    }
    const staffdef = this.m_staffdef[this.m_staffdef.length - 1];
    staffdef.SetN(staffnumber);
    if (stafftok !== null) {
      const dynamSpine = this.getAssociatedDynamSpine(stafftok);
      if (dynamSpine !== null && dynamSpine.compare(0, 6, '*staff') === 0
        && dynamSpine.toString().indexOf('/') !== -1) {
        ss[staffindex].m_dynampos = 0;
        ss[staffindex].m_dynamstaffadj = 0;
        ss[staffindex].m_dynamposdefined = true;
      }
    }
    if (parttok !== null) {
      const dynamSpine = this.getAssociatedDynamSpine(parttok);
      let partnum = 0;
      let dpartnum = 0;
      let lpartnum = 0;
      if (dynamSpine !== null && hre.search(dynamSpine.toString(), '^\\*part(\\d+)')) dpartnum = hre.getMatchInt(1);
      if (dpartnum > 0 && hre.search(parttok.toString(), '^\\*part(\\d+)')) partnum = hre.getMatchInt(1);
      if (partnum > 0) {
        const lspine = this.getPreviousStaffToken(parttok);
        if (lspine !== null && hre.search(lspine.toString(), '^\\*part(\\d+)')) lpartnum = hre.getMatchInt(1);
      }
      if (lpartnum > 0 && lpartnum === partnum && dpartnum === partnum) {
        ss[staffindex].m_dynampos = 0;
        ss[staffindex].m_dynamstaffadj = 0;
        ss[staffindex].m_dynamposdefined = true;
      }
    }
    if (staffscale !== null) {
      const loc = staffscale.toString().indexOf(':');
      if (loc !== -1) {
        const value = staffscale.toString().slice(loc + 1);
        if (value !== '' && value[value.length - 1] === '%') {
          staffdef.SetScale(/^[0-9]+(\.[0-9]*)?%$/.test(value) ? Number.parseFloat(value) : 0);
        }
      }
    }
    if (stria !== '') {
      if (hre.search(stria, '^\\*stria(\\d+)')) {
        const number = hre.getMatchInt(1);
        staffdef.SetLines(number < 33 ? number : 5);
      }
      else staffdef.SetLines(5);
    }
    else staffdef.SetLines(5);
    if (clef.length > 0) {
      this.setClefStaffDef(staffdef, clef, cleftok, striatok);
      ss[staffindex].last_clef = clef;
    }
    else {
      const autoclef = this.getAutoClef(staffstart, staffnumber);
      this.setClefStaffDef(staffdef, autoclef, null);
      ss[staffindex].last_clef = clef;
    }
    if (transpose.length > 0) this.setTransposition(staffdef, transpose);
    if (itranspose.length > 0) this.setDynamicTransposition(staffindex, staffdef, itranspose);
    if (abbreviation.length > 0) this.setInstrumentAbbreviation(staffdef, abbreviation, abbrtok);
    if (haslabel) {
      if (labeltok === null && icode !== null && icode.toString() !== '') this.setInstrumentName(staffdef, label, icode);
      else if (this.hasIndent(labeltok)) this.setInstrumentName(staffdef, '   ');
      else this.setInstrumentName(staffdef, label, labeltok);
    }
    else if (staffnumber === 1) {
      if (this.hasIndent(staffstart)) this.setInstrumentName(staffdef, '   ');
    }
    else if (this.hasIndent(staffstart)) this.setInstrumentName(staffdef, '   ');
    if (keysig.length > 0) {
      this.setKeySigStaffDef(staffindex, staffdef, keysig, keysigtok, keytok, false);
    }
    if (primarymensuration === '') {
      if (timesig.length > 0) this.setTimeSigStaffDef(staffdef, timesig, metersig, staffstart, timetok, metertok);
      if (!this.m_mens && metersig.length > 0) {
        this.setMeterSymbol(staffdef, metersig, staffindex, staffstart, metertok);
      }
    }
    this.addInstrumentDefinition(staffdef, staffstart);
    if (staffstart !== null && staffstart.isMensLike()) {
      if (this.isBlackNotation(staffstart)) {
        staffdef.SetNotationtype(HumdrumInput.NOTATIONTYPE_MENSURAL_BLACK);
        ss[staffindex].mensuration_type = 1;
      }
      else {
        staffdef.SetNotationtype(HumdrumInput.NOTATIONTYPE_MENSURAL_WHITE);
        ss[staffindex].mensuration_type = 0;
      }
    }
  }

  /** C++ processStaffDecoration. Returns false when the decoration is unusable. */
  public processStaffDecoration(decoration: string): boolean {
    if (decoration === '') return false;
    const staffstarts = this.m_staffstarts;
    const tracklist: number[] = [];
    for (let i = 0; i < staffstarts.length; ++i) {
      const st0 = staffstarts[i];
      if (st0 !== null) tracklist.push(st0.getTrack());
    }
    let validQ = true;
    const classToStaffMapping = new Map<string, number[]>();
    const groupToStaffMapping = new Map<number, number[]>();
    const partToStaffMapping = new Map<number, number[]>();
    const trackToSpineMapping = new Map<number, number>();
    const staffToSpineMapping = new Map<number, number>();
    const staffToGroupMapping = new Map<number, number>();
    const staffToClassMapping = new Map<number, string>();
    const spineToGroupMapping = new Map<number, number>();
    const staffToPartMapping = new Map<number, number>();
    const spineToPartMapping = new Map<number, number>();
    for (let i = 0; i < staffstarts.length; ++i) {
      const staff = this.getStaffNumberLabel(staffstarts[i]);
      const group = this.getGroupNumberLabel(staffstarts[i]);
      const partnum = this.getPartNumberLabel(staffstarts[i]);
      const st = staffstarts[i];
      if (st === null) continue;
      const track = st.getTrack();
      const instrumentClass = this.getInstrumentClass(st);
      trackToSpineMapping.set(track, i);
      if (instrumentClass !== '') {
        if (!classToStaffMapping.has(instrumentClass)) classToStaffMapping.set(instrumentClass, []);
        (classToStaffMapping.get(instrumentClass) as number[]).push(staff);
        staffToClassMapping.set(i, instrumentClass);
      }
      if (group > 0) {
        if (!groupToStaffMapping.has(group)) groupToStaffMapping.set(group, []);
        (groupToStaffMapping.get(group) as number[]).push(staff);
        spineToGroupMapping.set(i, group);
      }
      if (partnum > 0) {
        if (!partToStaffMapping.has(partnum)) partToStaffMapping.set(partnum, []);
        (partToStaffMapping.get(partnum) as number[]).push(staff);
        spineToPartMapping.set(i, partnum);
      }
      if (staff > 0) staffToSpineMapping.set(staff, i);
      if (group > 0 && staff > 0) staffToGroupMapping.set(staff, group);
      if (partnum > 0 && staff > 0) staffToPartMapping.set(staff, partnum);
      if (instrumentClass !== '' && staff > 0) staffToClassMapping.set(staff, instrumentClass);
    }
    let d = decoration;
    const hre = new HumRegex();
    for (const [pattern, staves] of classToStaffMapping) {
      let replacement = '';
      for (const st of staves) replacement += 's' + String(st);
      d = hre.replaceDestructive(d, replacement, pattern, 'g');
    }
    for (const [group, staves] of groupToStaffMapping) {
      const gstring = 'g' + String(group);
      let sstring = '';
      for (let i = 0; i < staves.length; ++i) {
        sstring += 's' + String(staves[i]);
        if (i < staves.length - 1) sstring += ',';
      }
      d = hre.replaceDestructive(d, sstring, gstring);
    }
    for (const [partnum, staves] of partToStaffMapping) {
      const pstring = 'p' + String(partnum);
      let sstring = '';
      for (let i = 0; i < staves.length; ++i) {
        sstring += 's' + String(staves[i]);
        if (i < staves.length - 1) sstring += ',';
      }
      d = hre.replaceDestructive(d, sstring, pstring);
    }
    d = hre.replaceDestructive(d, '', 'p\\d+', 'g');
    d = hre.replaceDestructive(d, '', 'g\\d+', 'g');
    d = hre.replaceDestructive(d, '', '[^0-9s()<>{}*\\][]', 'g');
    let hasstar = false;
    if (hre.search(d, '\\*')) {
      let tstring = '';
      for (let i = 0; i < tracklist.length; ++i) tstring += 't' + String(tracklist[i]);
      d = hre.replaceDestructive(d, tstring, '\\*');
      hasstar = true;
    }
    d = hre.replaceDestructive(d, '', '[*]', 'g');
    if (d === '') return false;
    const deconums = this.getStaffNumbers(d);
    for (const num of deconums) {
      if (staffToSpineMapping.has(num)) continue;
      d = hre.replaceDestructive(d, '', 's' + String(num) + '(?!\\d)');
    }
    for (const pat of ['\\(\\)', '\\{\\}', '\\[\\]', '<>', '\\(\\)', '\\{\\}', '<>']) {
      d = hre.replaceDestructive(d, '', pat, 'g');
    }
    let scount = 0;
    for (const ch of d) if (ch === 's' || ch === 't') scount++;
    if (scount === 0) return false;
    if (scount === 1) d = hre.replaceDestructive(d, '', '[^ts\\d]', 'g');
    // Pair (), <>, {}, [].
    const stack: [number, string][] = [];
    const pairing = new Array<number>(d.length).fill(-1);
    const opens: Record<string, string> = { ')': '(', '}': '{', ']': '[', '>': '<' };
    for (let i = 0; i < d.length; ++i) {
      const ch = d[i];
      if (ch === '(' || ch === '{' || ch === '[' || ch === '<') stack.push([i, ch]);
      else if (opens[ch] !== undefined) {
        if (stack.length === 0 || stack[stack.length - 1][1] !== opens[ch]) { validQ = false; break; }
        const top0 = stack.pop() as [number, string];
        pairing[top0[0]] = i;
        pairing[i] = top0[0];
      }
    }
    if (stack.length > 0) validQ = false;
    if (!validQ) return false;
    if (pairing.length === 0) return false;
    let skipfirst = false;
    let skipsecond = false;
    let root: StaffGrp | null = null;
    const scoreDef = this.getFullDoc().GetFirstScoreDef() as unknown as { AddChild(o: VrvObject): void };
    if (pairing[pairing.length - 1] !== 0) {
      root = new StaffGrp();
      root.SetBarThru(BOOLEAN_false);
      scoreDef.AddChild(root);
    }
    else if (d[0] === '(') {
      root = new StaffGrp();
      root.SetBarThru(BOOLEAN_true);
      scoreDef.AddChild(root);
    }
    else if (pairing[pairing.length - 1] === 0) {
      skipfirst = true;
      root = new StaffGrp();
      if (pairing.length > 1 && d[1] === '(') { skipsecond = true; root.SetBarThru(BOOLEAN_true); }
      if (d[0] === '{') this.setGroupSymbol(root, 1);
      else if (d[0] === '[') this.setGroupSymbol(root, 2);
      scoreDef.AddChild(root);
    }
    const bargroups: number[][] = [[]];
    const groupstyle: string[] = [' '];
    let staffQ = false;
    let trackQ = false;
    let value = 0;
    let grouper = false;
    let glevel = 0;
    let start = 0;
    let ending = d.length;
    if (skipfirst) { start = 1; ending--; }
    if (skipsecond) { start = 2; ending--; }
    for (let i = start; i < ending; ++i) {
      const ch = d[i];
      if (ch === '[' || ch === '{' || ch === '<') {
        if (!grouper) {
          if (bargroups[bargroups.length - 1].length === 0) groupstyle[groupstyle.length - 1] = ch;
          else { groupstyle.push(ch); bargroups.push([]); }
        }
        groupstyle[groupstyle.length - 1] = ch;
        if (i < d.length - 1 && d[i + 1] === '(') { groupstyle[groupstyle.length - 1] += '('; i++; }
        grouper = true;
        glevel++;
      }
      else if (ch === '}' || ch === ']' || ch === '>') {
        groupstyle.push(' ');
        bargroups.push([]);
        glevel--;
        if (glevel === 0) grouper = false;
      }
      else if (ch === 's') { staffQ = true; trackQ = false; }
      else if (ch === 't') { staffQ = false; trackQ = true; }
      else if (ch === '(') { groupstyle[groupstyle.length - 1] = '('; grouper = true; }
      else if (ch === ')') {
        const gs = groupstyle[groupstyle.length - 1];
        if (!(gs.length > 1 && gs[1] === '(')) { bargroups.push([]); groupstyle.push(' '); }
        glevel--;
        if (glevel === 0) grouper = false;
      }
      else if (ch >= '0' && ch <= '9') {
        if (value < 0) value = 0;
        value = value * 10 + (ch.charCodeAt(0) - 48);
        if (i === d.length - 1 || !(d[i + 1] >= '0' && d[i + 1] <= '9')) {
          if (staffQ) {
            const mapped = staffToSpineMapping.get(value);
            value = mapped === undefined ? -1 : mapped;
          }
          else if (trackQ) value = trackToSpineMapping.get(value) ?? -1;
          staffQ = false;
          trackQ = false;
          if (value < 0) { value = 0; continue; }
          bargroups[bargroups.length - 1].push(value);
          value = 0;
        }
      }
    }
    if (bargroups.length > 0 && bargroups[bargroups.length - 1].length === 0) bargroups.pop();
    const newgroups: number[][] = [];
    const newstyles: string[] = [];
    for (let i = 0; i < bargroups.length; ++i) {
      if (bargroups[i].length === 0) continue;
      newgroups.push(bargroups[i]);
      newstyles.push(groupstyle[i]);
    }
    const found = new Array<number>(staffstarts.length).fill(0);
    if (hasstar) found.fill(1);
    else {
      for (const group of newgroups) for (const idx of group) found[idx]++;
      for (let i = 0; i < found.length; ++i) {
        if (found[i] !== 1) { validQ = false; break; }
      }
    }
    if (!validQ) {
      LogWarning(`In HumdrumInput::processStaffDecoration: Decoration is invalid: ${decoration}`);
      if (d !== decoration) LogWarning(`In HumdrumInput::processStaffDecoration: Staff version: ${d}`);
      const sg = new StaffGrp();
      this.setGroupSymbol(sg, 2);
      if (root !== null) root.AddChild(sg);
      else scoreDef.AddChild(sg);
      for (const sd of this.m_staffdef) sg.AddChild(sd);
      return true;
    }
    const applyGroupLabels = (sg: StaffGrp, members: number[]): void => {
      let mygroup = -1;
      if (members.length > 0) mygroup = spineToGroupMapping.get(members[0]) ?? -1;
      if (mygroup > 0) {
        const groupName = this.m_group_name.get(mygroup) ?? '';
        const groupNameTok = this.m_group_name_tok.get(mygroup) ?? null;
        const groupAbbr = this.m_group_abbr.get(mygroup) ?? '';
        const groupAbbrTok = this.m_group_abbr_tok.get(mygroup) ?? null;
        if (groupAbbr !== '' && groupAbbrTok !== null) this.setInstrumentAbbreviation(sg as never, groupAbbr, groupAbbrTok);
        if (groupName !== '' && groupNameTok !== null) this.setInstrumentName(sg as never, groupName, groupNameTok);
      }
    };
    if (newgroups.length === 1) {
      let sg: StaffGrp;
      if (root !== null) sg = root;
      else {
        sg = new StaffGrp();
        scoreDef.AddChild(sg);
      }
      applyGroupLabels(sg, newgroups[0]);
      const style = newstyles[0];
      if (style !== '' && style[0] === '[') {
        if (newgroups[0].length > 1) this.setGroupSymbol(sg, 2);
        sg.SetBarThru(style.indexOf('(') !== -1 ? BOOLEAN_true : BOOLEAN_false);
      }
      else if (style !== '' && style[0] === '{') {
        if (newgroups[0].length > 1) this.setGroupSymbol(sg, 1);
        sg.SetBarThru(style.indexOf('(') !== -1 ? BOOLEAN_true : BOOLEAN_false);
      }
      else if (style !== '' && style[0] === '<') {
        sg.SetBarThru(style.indexOf('(') !== -1 ? BOOLEAN_true : BOOLEAN_false);
      }
      else if (style !== '' && style[0] === '(') sg.SetBarThru(BOOLEAN_true);
      for (const idx of newgroups[0]) sg.AddChild(this.m_staffdef[idx]);
    }
    else {
      let rootSg: StaffGrp;
      if (root !== null) rootSg = root;
      else {
        rootSg = new StaffGrp();
        scoreDef.AddChild(rootSg);
        rootSg.SetBarThru(BOOLEAN_false);
      }
      for (let i = 0; i < newgroups.length; ++i) {
        const sg = new StaffGrp();
        rootSg.AddChild(sg);
        sg.SetBarThru(newstyles[i].indexOf('(') !== -1 ? BOOLEAN_true : BOOLEAN_false);
        applyGroupLabels(sg, newgroups[i]);
        if (newstyles[i][0] === '[') this.setGroupSymbol(sg, 2);
        else if (newstyles[i][0] === '{') this.setGroupSymbol(sg, 1);
        for (const idx of newgroups[i]) sg.AddChild(this.m_staffdef[idx]);
      }
    }
    return true;
  }

  /** C++ prepareStaffGroups. */
  public prepareStaffGroups(top: number, bot: number): void {
    const staffstarts = this.m_staffstarts;
    const scoreDef = this.getFullDoc().GetFirstScoreDef();
    if (staffstarts.length > 0) this.addMidiTempo(scoreDef as never, staffstarts[0], top, bot);
    const hre = new HumRegex();
    for (let i = 0; i < staffstarts.length; ++i) {
      const st = staffstarts[i];
      if (st === null) continue;
      const sd = new StaffDef();
      this.m_staffdef.push(sd);
      this.setLocationId(sd, st);
      if (hre.search(st.toString(), '^\\*\\*kern-(.*)')) sd.SetType(hre.getMatch(1));
      this.fillStaffInfo(st, i + 1, staffstarts.length);
    }
    const decoration = this.getSystemDecoration('system-decoration');
    const scoreDefRef = scoreDef as unknown as { AddChild(o: VrvObject): void };
    if (decoration === '') {
      if (staffstarts.length === 2) this.processStaffDecoration('{(*)}');
      else if (staffstarts.length > 2) this.processStaffDecoration('[*]');
      else if (staffstarts.length === 1) {
        const sg = new StaffGrp();
        scoreDefRef.AddChild(sg);
        sg.AddChild(this.m_staffdef[0]);
      }
    }
    else if (!this.processStaffDecoration(decoration)) {
      const sg = new StaffGrp();
      scoreDefRef.AddChild(sg);
      sg.SetBarThru(BOOLEAN_false);
      for (const sd of this.m_staffdef) sg.AddChild(sd);
    }
  }

  //--------------------------------------------------------------------------
  // Note conversion (iohumdrum.cpp convertNote + helpers).
  // convertNotePitch/convertNoteAccid/convertNoteStem hold the pitch, accid
  // and stem slices; convertNote orchestrates the remaining C++ steps in the
  // same order (setStemLength, terminal long/breve, color, ottava tracking,
  // grace, rhythm/join, mensural quality, ties, signifier staffs, verses,
  // MEI id stamping, cue, phrase tags, scordatura).
  //--------------------------------------------------------------------------

  public removeCharacter(token: HTp, removechar: string): void {
    if (token === null) return;
    let output = '';
    for (const ch of token.toString()) if (ch !== removechar) output += ch;
    token.setText(output);
  }

  /** C++ getSpineColor: per-spine color plus **color/**coloR overlay. */
  public getSpineColor(line: number, field: number): string {
    const infile = this.m_infiles.at(0);
    let output = '';
    const tok = infile.token(line, field);
    if (tok === null) return output;
    const track = tok.getTrack();
    const strack = tok.getSubtrack();
    const cell = this.m_spineColor[track]?.[strack] ?? '';
    if (cell !== '' && cell !== 'black' && cell !== '#000000' && cell !== '#000') output = cell;
    if (!this.m_hasColorSpine) return output;
    for (let i = field + 1; i < infile.at(line).getFieldCount(); ++i) {
      const ctok = infile.token(line, i);
      if (ctok === null) continue;
      if (!(ctok.isDataType('**color') || ctok.isDataType('**coloR'))) continue;
      const resolved = ctok.resolveNull();
      output = resolved === null ? '' : resolved.toString();
      if (output === '.' || output === 'black' || output === '#000000' || output === '#000') output = '';
      if (ctok.isDataType('**coloR')) output += 'NOREST';
      break;
    }
    return output;
  }

  /** C++ getStaffAdjustment (chord-wide above/below signifier shift). */
  public getStaffAdjustment(token: HTp): number {
    if (token === null) return 0;
    const hre = new HumRegex();
    const scount = token.getSubtokenCount();
    const subtokens: string[] = [];
    for (let i = 0; i < scount; ++i) subtokens.push(token.getSubtoken(i));
    let allabove = true;
    let allbelow = true;
    const upquery = '[A-Ga-gr][#n-]*[xXyY]*' + this.m_signifiers.above;
    const downquery = '[A-Ga-gr][#n-]*[xXyY]*' + this.m_signifiers.below;
    if (this.m_signifiers.above !== '') {
      for (let i = 0; i < scount; ++i) {
        if (!hre.search(subtokens[i], upquery)) { allabove = false; break; }
      }
    }
    else allabove = false;
    if (this.m_signifiers.below !== '' && !allabove) {
      for (let i = 0; i < scount; ++i) {
        if (!hre.search(subtokens[i], downquery)) { allbelow = false; break; }
      }
    }
    else allbelow = false;
    if (allabove) return -1;
    if (allbelow) return 1;
    return 0;
  }

  /** C++ isNextBarIgnored. */
  public isNextBarIgnored(token: HTp): boolean {
    if (token === null) return false;
    let current = token.getNextToken();
    while (current !== null && !current.isBarline()) {
      if (current.isNull()) { current = current.getNextToken(); continue; }
      if (current.isData()) break;
      current = current.getNextToken();
    }
    if (current === null || !current.isBarline()) return false;
    if (current.allSameBarlineStyle()) return false;
    if (current.toString().indexOf('-') === -1) return false;
    return true;
  }

  /** C++ processOverfillingNotes. */
  public processOverfillingNotes(token: HTp): boolean {
    if (token === null) return false;
    const duration = token.getDuration();
    const barend = token.getDurationToBarline();
    if (barend.isZero()) return false;
    if (!duration.sub(barend).isPositive()) return false;
    if (this.isNextBarIgnored(token)) return false;
    const logicalRhythm = durationToRecip(barend);
    const visValue = token.getValue('LO', 'N', 'vis');
    const visualRhythm = visValue === '' ? kernToRecip(token.toString()) : visValue;
    token.setValue('auto', 'N', 'vis', visualRhythm);
    token.setValue('auto', 'MEI', 'dur.logical', logicalRhythm);
    token.setValue('auto', 'MEI', 'type', 'straddle');
    return true;
  }

  /** C++ setStemLength. */
  public setStemLength(note: { SetStemLen(v: number): void }, token: HTp): void {
    if (token === null) return;
    const stemlen = token.getValue('auto', 'stemlen');
    if (stemlen === '') return;
    note.SetStemLen(Number.parseFloat(stemlen));
  }

  /** C++ processTerminalLong. */
  public processTerminalLong(token: HTp): void {
    if (token === null) return;
    const isKern = token.isKern();
    const isMens = token.isMens();
    if (isKern && this.m_signifiers.kernTerminalLong === '') return;
    if (isMens && this.m_signifiers.mensTerminalLong === '') return;
    if (isKern && token.toString().indexOf(this.m_signifiers.kernTerminalLong) === -1) return;
    if (isMens && token.toString().indexOf(this.m_signifiers.mensTerminalLong) === -1) return;
    const marker = isKern ? this.m_signifiers.kernTerminalLong : this.m_signifiers.mensTerminalLong;
    const doublelong = marker + marker;
    if (token.toString().indexOf(doublelong) !== -1) {
      if (isKern) token.setValue('LO', 'N', 'vis', '000');
      else if (isMens) token.setValue('LO', 'N', 'vis', 'X');
    }
    else {
      if (isKern) token.setValue('LO', 'N', 'vis', '00');
      else if (isMens) token.setValue('LO', 'N', 'vis', 'L');
    }
    if (token.toString().indexOf('[') !== -1 || token.toString().indexOf('_') !== -1) {
      this.removeCharacter(token, '[');
      this.removeCharacter(token, '_');
      const pitch = kernToBase40(token.toString());
      let testtok = token.getNextToken();
      while (testtok !== null) {
        if (testtok.isBarline()) testtok.setText(testtok.toString() + '-');
        else if (testtok.isData()) {
          if (testtok.isNull()) { testtok = testtok.getNextToken(); continue; }
          if (kernToBase40(testtok.toString()) !== pitch) break;
          if (testtok.toString().indexOf(']') === -1 && testtok.toString().indexOf('_') === -1) break;
          testtok.setText(testtok.toString() + 'yy');
          if (testtok.toString().indexOf('_') !== -1) {
            this.removeCharacter(testtok, '_');
            testtok = testtok.getNextToken();
            continue;
          }
          else if (testtok.toString().indexOf(']') !== -1) { this.removeCharacter(testtok, ']'); break; }
        }
        testtok = testtok.getNextToken();
      }
    }
  }

  /** C++ processTerminalBreve. */
  public processTerminalBreve(token: HTp): void {
    if (token === null) return;
    if (this.m_signifiers.kernTerminalBreve === '') return;
    if (token.toString().indexOf(this.m_signifiers.kernTerminalBreve) === -1) return;
    token.setValue('LO', 'N', 'vis', '0');
    if (token.toString().indexOf('[') !== -1 || token.toString().indexOf('_') !== -1) {
      this.removeCharacter(token, '[');
      this.removeCharacter(token, '_');
      const pitch = kernToBase40(token.toString());
      let testtok = token.getNextToken();
      while (testtok !== null) {
        if (testtok.isBarline()) testtok.setText(testtok.toString() + '-');
        else if (testtok.isData()) {
          if (testtok.isNull()) { testtok = testtok.getNextToken(); continue; }
          if (kernToBase40(testtok.toString()) !== pitch) break;
          if (testtok.toString().indexOf(']') === -1 && testtok.toString().indexOf('_') === -1) break;
          testtok.setText(testtok.toString() + 'yy');
          if (testtok.toString().indexOf('_') !== -1) {
            this.removeCharacter(testtok, '_');
            testtok = testtok.getNextToken();
            continue;
          }
          else if (testtok.toString().indexOf(']') !== -1) { this.removeCharacter(testtok, ']'); break; }
        }
        testtok = testtok.getNextToken();
      }
    }
  }

  /**
   * C++ colorNote. The mark-direction side effect (addDirection) belongs to
   * the unported directions cluster; the color is still applied, and the
   * humlib PixelColor mixing is approximated by the first mark color.
   */
  public colorNote(note: { SetColor(v: string): void }, token: HTp, subtoken: string): void {
    if (token === null) return;
    const line = token.getLineIndex();
    const field = token.getFieldIndex();
    const spinecolor = this.getSpineColor(line, field);
    if (spinecolor !== '') {
      const norest = spinecolor.indexOf('NOREST');
      let isRest = false;
      let color = spinecolor;
      if (norest !== -1) { isRest = true; color = spinecolor.slice(0, norest); }
      if (color !== '' && !isRest) note.SetColor(color);
    }
    if (this.m_mens) {
      for (let i = 0; i < this.m_signifiers.mens_mark.length; ++i) {
        if (subtoken.indexOf(this.m_signifiers.mens_mark[i]) !== -1) {
          note.SetColor(this.m_signifiers.mens_mcolor[i]);
          this.appendTypeTag(note as never, 'color-marked');
          // ponytail: mens markdir addDirection deferred with directions.
          break;
        }
      }
    }
    else {
      const markcolors: string[] = [];
      for (let i = 0; i < this.m_signifiers.mark.length; ++i) {
        if (subtoken.indexOf(this.m_signifiers.mark[i]) !== -1) {
          markcolors.push(this.m_signifiers.mcolor[i]);
          this.appendTypeTag(note as never, 'color-marked');
          // ponytail: markdir addDirection deferred with directions.
        }
        if (markcolors.length === 1) note.SetColor(markcolors[0]);
        else if (markcolors.length > 1) {
          // ponytail: humlib PixelColor::mix not ported; first color wins.
          note.SetColor(markcolors[0]);
        }
      }
    }
  }

  /** C++ embedQstampInClass. */
  public embedQstampInClass(note: { SetColor(v: string): void }, token: HTp): void {
    if (token === null) return;
    const starttime = token.getDurationFromStart();
    const endtime = starttime.add(token.getDuration());
    let son = `qon-${starttime.getNumerator()}`;
    if (starttime.getDenominator() !== 1) son += `_${starttime.getDenominator()}`;
    let soff = `qoff-${endtime.getNumerator()}`;
    if (endtime.getDenominator() !== 1) soff += `_${endtime.getDenominator()}`;
    this.appendTypeTag(note as never, son);
    this.appendTypeTag(note as never, soff);
  }

  /** C++ embedPitchInformationInClass. */
  public embedPitchInformationInClass(note: { SetColor(v: string): void }, token: string): void {
    if (token.indexOf('r') !== -1 || token === '.') return;
    const base40 = kernToBase40(token);
    const base40chroma = base40 % 40;
    const oct = Math.trunc(base40 / 40);
    const acc = base40ToAccidental(base40);
    const base12chroma = ((kernToMidiNoteNumber(token) % 12) + 12) % 12;
    const base7chroma = ((base40ToDiatonic(base40) % 7) + 7) % 7;
    const pnames = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
    const pname = pnames[base7chroma] ?? '';
    const accids: Record<number, string> = { 0: 'n', 1: 's', '-1': 'f', 2: 'ss', '-2': 'ff', 3: 'sss', '-3': 'fff' };
    const accid = accids[acc] ?? '';
    this.appendTypeTag(note as never,
      `pname-${pname} acc-${accid} oct-${oct} b40c-${base40chroma} b12c-${base12chroma} `);
  }

  /** C++ embedTieInformation. */
  public embedTieInformation(note: { SetColor(v: string): void }, token: string): void {
    if (token.indexOf('[') !== -1) this.appendTypeTag(note as never, 'tie-start');
    else if (token.indexOf(']') !== -1) this.appendTypeTag(note as never, 'tie-stop');
    else if (token.indexOf('_') !== -1) this.appendTypeTag(note as never, 'tie-cont');
  }

  /** C++ checkNoteForScordatura. */
  public checkNoteForScordatura(token: string): string {
    let index = -1;
    for (let i = 0; i < this.m_scordaturaMarker.length; ++i) {
      if (token.indexOf(this.m_scordaturaMarker[i]) !== -1) { index = i; break; }
    }
    if (index < 0) return '';
    // ponytail: HumTransposer::transpose not ported; marker match only.
    return '';
  }

  /** C++ addCautionaryAccidental. */
  public addCautionaryAccidental(accid: Accid, _token: HTp, acount: number): void {
    accid.SetFunc(accidLog_FUNC_caution);
    accid.SetType('caution');
    const map: Record<number, number> = {
      3: ACCIDENTAL_WRITTEN_ts, 2: ACCIDENTAL_WRITTEN_x, 1: ACCIDENTAL_WRITTEN_s,
      0: ACCIDENTAL_WRITTEN_n, '-1': ACCIDENTAL_WRITTEN_f, '-2': ACCIDENTAL_WRITTEN_ff,
      '-3': ACCIDENTAL_WRITTEN_tf,
    };
    const value = map[acount];
    if (value !== undefined) accid.SetAccid(value);
  }

  /** C++ setAccid (loaccid -> written accidental). */
  public setAccid(accid: Accid, loaccid: string): void {
    if (loaccid === '') return;
    const map: Record<string, number> = {
      '#': ACCIDENTAL_WRITTEN_s, '-': ACCIDENTAL_WRITTEN_f, '##': ACCIDENTAL_WRITTEN_ss,
      x: ACCIDENTAL_WRITTEN_x, '--': ACCIDENTAL_WRITTEN_ff, xs: ACCIDENTAL_WRITTEN_xs,
      sx: ACCIDENTAL_WRITTEN_sx, '###': ACCIDENTAL_WRITTEN_ts, '---': ACCIDENTAL_WRITTEN_ts,
      n: ACCIDENTAL_WRITTEN_n, 'n-': ACCIDENTAL_WRITTEN_nf, 'n#': ACCIDENTAL_WRITTEN_ns,
    };
    const value = map[loaccid];
    if (value !== undefined) accid.SetAccid(value);
  }

  /** C++ checkForJoin. */
  public checkForJoin(note: Note, token: HTp): boolean {
    if (!this.m_join || token === null) return false;
    if (token.isChord() || token.isRest()) return false;
    if (token.getSubtrack() !== 2) return false;
    if (token.getValueBool('auto', 'Xjoin')) return false;
    const track = token.getTrack();
    const ptok = token.getPreviousFieldToken();
    if (ptok === null) return false;
    if (ptok.isChord() || ptok.isRest() || ptok.isNull()) return false;
    if (ptok.getTrack() !== track) return false;
    const dur = token.getDuration();
    const pdur = ptok.getDuration();
    const b40 = kernToBase40(token.toString());
    const pb40 = kernToBase40(ptok.toString());
    if (dur.sub(pdur).isZero()) {
      const pid = HumdrumInput.getLocationIdForToken(note.constructor.name.toLowerCase(), ptok.getLineIndex(), ptok.getFieldIndex(), -1);
      if (b40 === pb40) {
        // C++ note->SetSameas() comes from the LayerElement linking interface.
        note.GetLinkingInterface()?.SetSameas('#' + pid);
        return true;
      }
      note.SetStemSameas('#' + pid);
      return true;
    }
    return false;
  }

  /** C++ addMensuralQuality. */
  public addMensuralQuality(note: { SetDurQuality(v: number): void }, token: HTp): void {
    if (token === null) return;
    const t = token.toString();
    if (t.indexOf('+') !== -1) { note.SetDurQuality(DURQUALITY_mensural_altera); return; }
    const perfect = t.indexOf('p') !== -1;
    const imperfect = t.indexOf('i') !== -1;
    const maxima = t.indexOf('X') !== -1;
    const longa = t.indexOf('L') !== -1;
    const breve = t.indexOf('S') !== -1;
    const semibreve = t.indexOf('s') !== -1;
    const minima = t.indexOf('M') !== -1;
    const semiminima = t.indexOf('m') !== -1;
    const fusa = t.indexOf('U') !== -1;
    const semifusa = t.indexOf('u') !== -1;
    const staffindex = this.m_currentstaff - 1;
    const ss = this.m_staffstates[staffindex];
    if (maxima && perfect && ss.maximodus === 3) return;
    else if (maxima && imperfect && ss.maximodus === 2) return;
    else if (longa && perfect && ss.modus === 3) return;
    else if (longa && imperfect && ss.modus === 2) return;
    else if (breve && perfect && ss.tempus === 3) return;
    else if (breve && imperfect && ss.tempus === 2) return;
    else if (semibreve && perfect && ss.prolatio === 3) return;
    else if (semibreve && imperfect && ss.prolatio === 2) return;
    else if (minima && imperfect) return;
    else if (semiminima && imperfect) return;
    else if (fusa && imperfect) return;
    else if (semifusa) return;
    if (t.indexOf('i') !== -1) note.SetDurQuality(DURQUALITY_mensural_imperfecta);
    if (t.indexOf('p') !== -1) note.SetDurQuality(DURQUALITY_mensural_perfecta);
  }

  /** C++ getBooleanParameter (LO/<category> @key presence). */
  public getBooleanParameter(token: HTp, category: string, key: string): boolean {
    if (token === null) return false;
    const lcount = token.getLinkedParameterSetCount();
    for (let i = 0; i < lcount; ++i) {
      const hps = token.getLinkedParameterSet(i);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO') continue;
      if (hps.getNamespace2() !== category) continue;
      for (let j = 0; j < hps.getCount(); ++j) {
        if (hps.getParameterName(j) === key) return true;
      }
    }
    return false;
  }

  /** C++ getStringParameter (LO/<category> @key value, "" when absent). */
  public getStringParameter(token: HTp, category: string, key: string): string {
    if (token === null) return '';
    const lcount = token.getLinkedParameterSetCount();
    for (let i = 0; i < lcount; ++i) {
      const hps = token.getLinkedParameterSet(i);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO') continue;
      if (hps.getNamespace2() !== category) continue;
      for (let j = 0; j < hps.getCount(); ++j) {
        if (hps.getParameterName(j) === key) return hps.getParameterValue(j);
      }
    }
    return '';
  }

  /** C++ HumdrumInput::setClefColorOrEditorial (LO:CL ed/color). */
  public setClefColorOrEditorial(token: HTp, clef: Clef): void {
    if (token === null || clef === null) return;

    const iseditorial = this.getBooleanParameter(token, 'CL', 'ed');
    const color = this.getStringParameter(token, 'CL', 'color');

    if (iseditorial) {
      this.appendTypeTag(clef, 'editorial');
      clef.SetEnclose(ENCLOSURE_brack);
    }
    if (color !== '') clef.SetColor(color);
  }

  /** C++ HumdrumInput::checkForClefStyling (LO:CL gg/smufl/mens/chant/cmn). */
  public checkForClefStyling(clef: Clef, token: HTp): void {
    if (clef === null || token === null) return;

    const gg = this.getBooleanParameter(token, 'CL', 'gg');
    if (gg) {
      clef.SetGlyphName('gClef8vbOld');
      clef.SetGlyphAuth('smufl');
      return;
    }

    const smufl = this.getStringParameter(token, 'CL', 'smufl');
    if (smufl !== '' && smufl !== 'true' && smufl !== 'false') {
      clef.SetGlyphName(smufl);
      clef.SetGlyphAuth('smufl');
      return;
    }

    const mens = this.getBooleanParameter(token, 'CL', 'mens');
    if (mens) {
      const t = token.toString();
      if (t.substr(0, 6) === '*clefG') { clef.SetGlyphName('mensuralGclefPetrucci'); clef.SetGlyphAuth('smufl'); }
      else if (t.substr(0, 6) === '*clefF') { clef.SetGlyphName('mensuralFclefPetrucci'); clef.SetGlyphAuth('smufl'); }
      else if (t === '*clefC1') { clef.SetGlyphName('mensuralCclefPetrucciPosLowest'); clef.SetGlyphAuth('smufl'); }
      else if (t === '*clefC2') { clef.SetGlyphName('mensuralCclefPetrucciPosLow'); clef.SetGlyphAuth('smufl'); }
      else if (t === '*clefC3') { clef.SetGlyphName('mensuralCclefPetrucciPosMiddle'); clef.SetGlyphAuth('smufl'); }
      else if (t === '*clefC4') { clef.SetGlyphName('mensuralCclefPetrucciPosHigh'); clef.SetGlyphAuth('smufl'); }
      else if (t === '*clefC5') { clef.SetGlyphName('mensuralCclefPetrucciPosHighest'); clef.SetGlyphAuth('smufl'); }
      return;
    }

    const chant = this.getBooleanParameter(token, 'CL', 'chant');
    if (chant) {
      const t = token.toString();
      if (t.substr(0, 6) === '*clefC') { clef.SetGlyphName('chantCclef'); clef.SetGlyphAuth('smufl'); }
      else if (t.substr(0, 6) === '*clefF') { clef.SetGlyphName('chantFclef'); clef.SetGlyphAuth('smufl'); }
      else if (t.substr(0, 6) === '*clefG') { clef.SetGlyphName('mensuralGclef'); clef.SetGlyphAuth('smufl'); }
      return;
    }

    const cmn = this.getBooleanParameter(token, 'CL', 'cmn');
    if (cmn) {
      const t = token.toString();
      if (t.substr(0, 6) === '*clefC') { clef.SetGlyphName('cClef'); clef.SetGlyphAuth('smufl'); }
      else if (t.substr(0, 6) === '*clefF') { clef.SetGlyphName('fClef'); clef.SetGlyphAuth('smufl'); }
      else if (t.substr(0, 6) === '*clefG') { clef.SetGlyphName('gClef'); clef.SetGlyphAuth('smufl'); }
      return;
    }
  }

  /** C++ HumdrumInput::inDifferentEndings: two tokens land in differently
   *  numbered section labels. C++ indexes m_sectionlabels by line directly
   *  (ragged C array), so read it raw rather than through the safe accessor. */
  public inDifferentEndings(token1: HTp, token2: HTp): boolean {
    if (token1 === null || token2 === null) return false;
    const labels = this.m_sectionlabels as unknown as Array<HTp | undefined>;
    const label1 = labels[token1.getLineIndex()] ?? null;
    const label2 = labels[token2.getLineIndex()] ?? null;
    if (label1 === label2) return false;
    if (label1 === null || label1 === undefined) return false;
    if (label2 === null || label2 === undefined) return false;

    const hre = new HumRegex();
    if (!hre.search(label1.toString(), '(\\d+)$')) return false;
    const number1 = hre.getMatchInt(1);
    if (!hre.search(label2.toString(), '(\\d+)$')) return false;
    const number2 = hre.getMatchInt(1);
    if (number1 === number2) return false;
    return true;
  }

  /** C++ HumdrumInput::getMultiEndline: last line index of a multi-rest run. */
  public getMultiEndline(startindex: number): number {
    let found = -1;
    for (let i = startindex; i < this.m_multirest.length; ++i) {
      if (this.m_multirest[i] === -1) { found = i; break; }
    }
    if (found < 0) return startindex;
    let found2 = -1;
    for (let i = found; i < this.m_multirest.length; ++i) {
      if (this.m_multirest[i] !== -1) { found2 = i; break; }
    }
    if (found2 < 0) return found;
    return found2;
  }

  /** C++ HumdrumInput::checkForFingeredHarmonic: recognise a 3-note fingered
   *  harmonic chord (`r` on the bottom two notes, natural pitch on top) and mark
   *  the middle note with a diamond head plus @oct.ges/@pname.ges on the highest
   *  sounding note (the top note is muted). */
  public checkForFingeredHarmonic(chord: Chord, token: HTp): void {
    if (token === null) return;
    if (token.find('r') === -1) {
      // No fingered harmonic notes
      return;
    }
    const scount = token.getSubtokenCount();
    if (scount !== 3) {
      // only dealing with 3-note cases for now
      return;
    }
    const tstrings = token.getSubtokens();
    let zcount = 0;
    const pitches: Array<{ first: number; second: number }> = [];
    for (let i = 0; i < scount; ++i) {
      let mstring = tstrings[i];
      if (mstring.indexOf('r') !== -1) {
        mstring = mstring.replace(/r/g, '');
        zcount++;
      }
      pitches.push({ first: i, second: kernToBase40(mstring) });
    }
    if (zcount !== 2) {
      // only dealing with fingered harmonic
      return;
    }
    // std::sort is not stable; Node's sort is, but with 3 distinct pitches the
    // resulting permutation matches the C++ ordering.
    pitches.sort((a, b) => a.second - b.second);

    // The bottom two notes in the 3-note chord need to be labeled with "r"
    // and the top one should not have an "r".
    if (tstrings[pitches[0].first].indexOf('r') === -1) return;
    if (tstrings[pitches[1].first].indexOf('r') === -1) return;
    if (tstrings[pitches[2].first].indexOf('r') !== -1) return;

    // Indexes to notes in the input token.
    const bottomi = pitches[0].first;
    const middlei = pitches[1].first;
    const topi = pitches[2].first;

    const outputindex = [-1, -1, -1];
    let counter = 0;
    if (tstrings[0].indexOf('yy') === -1) outputindex[0] = counter++;
    if (tstrings[1].indexOf('yy') === -1) outputindex[1] = counter++;
    if (tstrings[2].indexOf('yy') === -1) outputindex[2] = counter++;

    // Indexes to notes in the verovio chord (-1 means not present).
    const bottomo = outputindex[bottomi];
    const middleo = outputindex[middlei];
    const topo = outputindex[topi];

    // Find the highest note present in the output.
    let highesto = topo;
    if (highesto < 0) highesto = middleo;
    if (highesto < 0) highesto = bottomo;

    const notes = chord.GetChildrenForModification() as unknown as Note[];

    if (middleo >= 0) {
      const middle = notes[middleo];
      const hs = new data_HEADSHAPE();
      hs.SetHeadShapeList(HEADSHAPE_list_diamond);
      middle.SetHeadShape(hs);
    }

    // Mute all notes that are not the highest one in the chord.
    if (notes.length > 1) {
      if (bottomo >= 0 && bottomo !== highesto) notes[bottomo].SetVel(0);
      if (middleo >= 0 && middleo !== highesto) notes[middleo].SetVel(0);
      if (topo >= 0 && topo !== highesto) notes[topo].SetVel(0);
    }

    // If the highest note is not the top note, then add @oct.ges/@pname.ges
    // to the highest note.
    if (highesto >= 0 && highesto !== topo) {
      const hpitch = new HumPitch();
      hpitch.setKernPitch(tstrings[topi]);
      const oct = hpitch.getOctave();
      const target = notes[highesto];
      target.SetOctGes(oct);
      switch (hpitch.getDiatonicPC()) {
        case 0: target.SetPnameGes(PITCHNAME_c); break;
        case 1: target.SetPnameGes(PITCHNAME_d); break;
        case 2: target.SetPnameGes(PITCHNAME_e); break;
        case 3: target.SetPnameGes(PITCHNAME_f); break;
        case 4: target.SetPnameGes(PITCHNAME_g); break;
        case 5: target.SetPnameGes(PITCHNAME_a); break;
        case 6: target.SetPnameGes(PITCHNAME_b); break;
      }
    }
  }

  /** C++ HumdrumInput::addBarLineElement: append a local <barLine> for a
   *  non-uniform barline token, deriving @form from the token glyphs. */
  public addBarLineElement(bartok: HTp, elements: string[], pointers: VrvObject[]): void {
    if (bartok === null) return;
    if (bartok.toString().indexOf('-') !== -1) {
      // probably do not want to have an invisible barline
      return;
    }

    const barline = new BarLine();
    this.setLocationId(barline, bartok);
    const t = bartok.toString();

    if (t.substr(0, 2) === '==') barline.SetForm(BARRENDITION_end);
    else if (t.indexOf(':|!|:') !== -1) barline.SetForm(BARRENDITION_rptboth);
    else if (t.indexOf(':!!:') !== -1) barline.SetForm(BARRENDITION_rptboth);
    else if (t.indexOf(':||:') !== -1) barline.SetForm(BARRENDITION_rptboth);
    else if (t.indexOf(':!:') !== -1) barline.SetForm(BARRENDITION_rptboth);
    else if (t.indexOf(':|:') !== -1) barline.SetForm(BARRENDITION_rptboth);
    else if (t.indexOf(':|') !== -1) barline.SetForm(BARRENDITION_rptend);
    else if (t.indexOf(':!') !== -1) barline.SetForm(BARRENDITION_rptend);
    else if (t.indexOf('!:') !== -1) barline.SetForm(BARRENDITION_rptstart);
    else if (t.indexOf('|:') !== -1) barline.SetForm(BARRENDITION_rptstart);
    else if (t.indexOf('||') !== -1) barline.SetForm(BARRENDITION_dbl);
    else if (t.indexOf('-') !== -1) barline.SetForm(BARRENDITION_invis);
    else if (t.indexOf('..') !== -1) barline.SetForm(BARRENDITION_dbldotted);
    else if (t.indexOf('.') !== -1) barline.SetForm(BARRENDITION_dotted);
    else if (t.indexOf('::') !== -1) barline.SetForm(BARRENDITION_dbldashed);
    else if (t.indexOf(':') !== -1) barline.SetForm(BARRENDITION_dashed);
    else barline.SetForm(BARRENDITION_single);

    this.appendElement(elements, pointers, barline);
  }

  /** C++ HumdrumInput::insertRepetitionElement: convert a `*rep`/`*Xrep`
   *  layer span into `<mRpt>`, `<halfmRpt>`, or `<beatRpt>` and return the
   *  index of the `*Xrep` so the caller resumes past it. */
  public insertRepetitionElement(
    elements: string[], pointers: VrvObject[], tokens: HTp[], index: number,
  ): number {
    const token = tokens[index];
    if (token === null || token.toString() !== '*rep') {
      // nothing to do
      return index;
    }
    let repend: HTp = null;
    let outindex = index;
    for (let i = index + 1; i < tokens.length; ++i) {
      if (tokens[i] !== null && tokens[i]!.toString() === '*Xrep') {
        repend = tokens[i];
        outindex = i;
        break;
      }
    }
    if (repend === null) {
      // Cannot find end.  It may be a multi-measure repeat which is not yet handled.
      return index;
    }

    // Figure out if it is a whole measure rest by comparing the timestamps
    // to the width of the layer data.
    const r1time = token.getDurationFromBarline();
    const r2time = repend.getDurationFromBarline();
    const back = tokens[tokens.length - 1];
    let mdur = back === null ? new HumNum(0) : new HumNum(back.getDurationFromBarline());
    if (back !== null && back.isData()) mdur = mdur.add(back.getDuration());
    const repdur = r2time.sub(r1time);
    const diff = mdur.sub(repdur);

    if (diff.isZero()) {
      // Add an mRep to the layer's data and return the index of the *Xrep.
      const mrpt = new MRpt();
      this.setLocationId(mrpt, token);
      this.appendElement(elements, pointers, mrpt);
      mrpt.SetNumVisible(BOOLEAN_false);
      return outindex;
    }

    // Check to see if it is a 1/2 measure repeat
    const ratio = mdur.div(repdur);
    if (ratio.getFloat() === 2) {
      // The repeat is 1/2 measure long, so insert halfmRpt element.
      const halfmrpt = new HalfmRpt();
      this.setLocationId(halfmrpt, token);
      this.appendElement(elements, pointers, halfmrpt);
      return outindex;
    }

    // The repeat is a beat repeat (presumed, not checking carefully yet).
    const beatrpt = new BeatRpt();
    this.setLocationId(beatrpt, token);
    this.setRepeatSlashes(beatrpt, tokens, index);
    this.appendElement(elements, pointers, beatrpt);
    return outindex;
  }

  /** C++ HumdrumInput::setRepeatSlashes: set `@slash` on a beat repeat from the
   *  rhythm of the following note/rest (mixed when the group is uneven). */
  public setRepeatSlashes(repeat: BeatRpt, tokens: HTp[], index: number): void {
    const repvalues: number[] = [];
    const hre = new HumRegex();

    for (let i = index + 1; i < tokens.length; ++i) {
      const item = tokens[i];
      if (item === null) continue;
      if (item.toString() === '*Xrep') break;
      if (!item.isData()) continue;
      if (item.isNull()) continue;      // should not happen, but being careful
      if (item.isGrace()) continue;
      if (!hre.search(item.toString(), '(\\d+)')) return;
      const value = hre.getMatchInt(1);
      // remove any tupletness from the rhythm.
      const logvalue = Math.trunc(Math.log(value) / Math.log(2)) - 2;
      repvalues.push(logvalue);
    }

    if (repvalues.length === 0) {
      // no notes/rests in repetition group for some reason.
      return;
    }

    let allequal = true;
    for (let i = 1; i < repvalues.length; ++i) {
      if (repvalues[i] !== repvalues[0]) { allequal = false; break; }
    }
    if (!allequal) {
      // set to mixed rhythm case
      repeat.SetSlash(BEATRPT_REND_mixed);
      return;
    }

    switch (repvalues[0]) {
      // default is BEATRPT_REND_1 (one slash)
      case 2: repeat.SetSlash(BEATRPT_REND_2); break;
      case 3: repeat.SetSlash(BEATRPT_REND_3); break;
      case 4: repeat.SetSlash(BEATRPT_REND_4); break;
      case 5: repeat.SetSlash(BEATRPT_REND_5); break;
    }
  }

  /** C++ HumdrumInput::getNextNonNullDataOrMeasureToken: next usable token,
   *  scanning past interpretations and local comments, resolving null tokens
   *  against the staff above, and stopping at a barline or data token. */
  public getNextNonNullDataOrMeasureToken(tok: HTp): HTp {
    if (tok === null) return null;
    const track = tok.getTrack();

    let current = tok.getNextToken();
    while (current !== null) {
      if (current.isInterpretation()) { current = current.getNextToken(); continue; }
      if (current.isCommentLocal()) { current = current.getNextToken(); continue; }
      if (current.isNull()) {
        // Search for note in staff above.
        let rcurrent = current.getNextFieldToken();
        while (rcurrent !== null) {
          const rtrack = rcurrent.getTrack();
          if (Math.abs(rtrack - track) > 1) break;
          if (!rcurrent.isKern()) { rcurrent = rcurrent.getNextFieldToken(); continue; }
          if (rcurrent.isNull()) { rcurrent = rcurrent.getNextFieldToken(); continue; }
          if (rcurrent.isData()) return rcurrent;
          rcurrent = rcurrent.getNextFieldToken();
        }

        current = current.getNextToken();
        continue;
      }
      if (current.isBarline()) return current;
      if (current.isData()) return current;
      current = current.getNextToken();
    }
    // Some sort of error and current is NULL pointer.
    return tok;
  }

  /** C++ HumdrumInput::getPreviousDataToken: nearest previous data token. */
  public getPreviousDataToken(token: HTp): HTp {
    if (token === null) return null;
    let current = token.getPreviousToken();
    while (current !== null) {
      if (current.isData()) break;
      current = current.getPreviousToken();
    }
    return current;
  }

  /** C++ HumdrumInput::getMensur: reuse the element's <mensur>, or add one;
   *  always a fresh <mensur> for a data-token or mensural context. */
  public getMensur(
    element: { AddChild(o: VrvObject): void; FindDescendantByType(id: ClassIdLike): VrvObject | null },
    token: HTp,
  ): Mensur {
    if (token !== null && (this.m_mens || token.getDurationFromStart().isPositive())) {
      const layermensuration = new Mensur();
      element.AddChild(layermensuration as never);
      return layermensuration;
    }

    let output = element.FindDescendantByType(ClassId.MENSUR) as Mensur | null;
    if (output === null) {
      output = new Mensur();
      element.AddChild(output as never);
    }
    return output;
  }

  /** C++ HumdrumInput::handleCustos: `*custos` interpretations control the
   *  automatic custos and can carry an explicit **kern pitch. */
  public handleCustos(
    elements: string[], pointers: VrvObject[], tokens: HTp[], index: number,
  ): void {
    const token = tokens[index];
    if (token === null) return;
    const hre = new HumRegex();
    if (!hre.search(token.toString(), '^\\*(X*)custos(.*)')) return;

    const ss = this.m_staffstates;
    const staffindex = this.m_currentstaff - 1;

    const exes = hre.getMatch(1);
    if (exes === 'X') { ss[staffindex].auto_custos = false; return; }
    if (exes === 'XX') { ss[staffindex].suppress_manual_custos = true; return; }
    const ending = hre.getMatch(2);
    if (ending === '') { ss[staffindex].auto_custos = false; return; }

    if (ss[staffindex].suppress_manual_custos) {
      // Do not print any explicit custodes.
      return;
    }

    // add a manual custodes
    hre.search(ending, ':?([^:]*)(.*)');
    const kpitch = hre.getMatch(1);
    const parameters = hre.getMatch(2);

    if (kpitch === '') {
      // suppressing a custos here (deal with
      // this in the auto custos code elsewhere).
    }
    if (kpitch === 'x' || kpitch === 'X') {
      // aliases for suppressing an automatic custos
    }

    if (!hre.search(kpitch, '^[A-Ga-g]+[#n-]*$')) {
      // invalid manual custos (requires **kern pitch)
      return;
    }

    const base40 = kernToBase40(kpitch);
    const oct = Math.trunc(base40 / 40);
    const base7chroma = base40ToDiatonic(base40) % 7;
    const custos = new Custos();

    custos.SetOct(oct);
    switch (base7chroma) {
      case 0: custos.SetPname(PITCHNAME_c); break;
      case 1: custos.SetPname(PITCHNAME_d); break;
      case 2: custos.SetPname(PITCHNAME_e); break;
      case 3: custos.SetPname(PITCHNAME_f); break;
      case 4: custos.SetPname(PITCHNAME_g); break;
      case 5: custos.SetPname(PITCHNAME_a); break;
      case 6: custos.SetPname(PITCHNAME_b); break;
    }

    this.setLocationId(custos, token);
    this.appendElement(elements, pointers, custos);

    if (hre.search(parameters, "color=['\"]?([^'\":]+)['\":]?")) {
      const color = hre.getMatch(1);
      custos.SetColor(color);
    }
  }

  /** C++ HumdrumInput::handlePedalMark: `*ped` / `*Xped` interpretations turn
   *  into <pedal> marks, with bounce handling for adjacent on/off pairs. */
  public handlePedalMark(token: HTp): void {
    if (token === null) return;
    const ss = this.m_staffstates;
    const staffindex = this.m_currentstaff - 1;

    const durtobar = token.getDurationToBarline();
    const barbuffer = new HumNum(1, 4);

    if (token.toString() === '*ped') {
      const bounceQ = this.hasBounceBefore(token);

      // turn on pedal
      const pedal = new Pedal();
      this.setLocationId(pedal, token);
      this.addChildMeasureOrSection(pedal);
      const tstamp = this.getMeasureTstamp(token, staffindex);
      let tstamp2 = tstamp;
      if (durtobar.isZero()) {
        tstamp2 = tstamp.sub(barbuffer);
        this.appendTypeTag(pedal, 'endbar-25');
      }
      const attachment = this.getNextNonNullDataOrMeasureToken(token);
      if (attachment !== null) this.setAttachmentType(pedal, attachment);
      pedal.SetDir(pedalLog_DIR_down);
      this.assignVerticalGroup(pedal, token);
      this.setStaff(pedal, this.m_currentstaff);
      if (ss[staffindex].pedal) {
        // already on, so turn off first
        pedal.SetDir(pedalLog_DIR_bounce);
        pedal.SetForm(PEDALSTYLE_altpedstar);
      } else if (bounceQ) {
        pedal.SetDir(pedalLog_DIR_bounce);
      }
      ss[staffindex].pedal = true;
      void tstamp2;
    } else if (token.toString() === '*Xped') {
      const bounceQ = this.hasBounceAfter(token);
      if (!bounceQ) {
        const pedal = new Pedal();
        this.setLocationId(pedal, token);
        this.addChildMeasureOrSection(pedal);
        const tstamp = this.getMeasureTstamp(token, new HumNum(1, 1), staffindex);
        let tstamp2 = tstamp;
        if (durtobar.isZero()) {
          tstamp2 = tstamp.sub(barbuffer);
          this.appendTypeTag(pedal, 'endbar-25');
        }
        const attachment = this.getNextNonNullDataOrMeasureToken(token);
        if (attachment !== null) this.setAttachmentType(pedal, attachment);
        pedal.SetDir(pedalLog_DIR_up);
        this.assignVerticalGroup(pedal, token);
        this.setStaff(pedal, this.m_currentstaff);
        void tstamp2;
      }
      ss[staffindex].pedal = false;
    }
  }

  /** C++ HumdrumInput::addMusicSymbol: route a Humdrum `[music-code]` name to
   *  SMuFL <symbol> children, with spacer text between consecutive symbols. */
  public addMusicSymbol(element: VrvObject, musictext: string): void {
    const smufltext = this.convertMusicSymbolNameToSmuflName(musictext);
    if (smufltext.length === 0) {
      // nothing to do: treat as plain text and add in calling function.
      return;
    }

    let counter = 0;
    for (let i = 0; i < smufltext.length; i++) {
      if (smufltext[i] === '') continue;
      const name = smufltext[i];
      if (counter) {
        // Add a space element between music symbols.
        if (name === 'metAugmentationDot') {
          this.addTextElement(element, this.m_textAugmentationDotSpacer);
        } else {
          this.addTextElement(element, this.m_textSmuflSpacer);
        }
      }
      ++counter;

      const symbol = new Symbol();
      this.setSmuflContent(symbol, name);
      this.setFontsize(symbol, name, musictext);
      (element as unknown as { AddChild(c: VrvObject): void }).AddChild(symbol);
    }
  }

  /** C++ HumdrumInput::processChordSignifiers: nostem/cuesize signifiers plus
   *  terminal long/breve handling for a chord. */
  public processChordSignifiers(chord: Chord, token: HTp, staffindex: number): void {
    if (token === null) return;
    const sig = this.m_signifiers;
    if (sig.nostem !== '' && token.toString().indexOf(sig.nostem) !== -1) {
      chord.SetStemVisible(BOOLEAN_false);
    }

    if (sig.cuesize !== '') {
      let tcount = 1;
      let cuecount = 0;
      const s = token.toString();
      for (let i = 0; i < s.length; ++i) {
        if (s.substr(i, sig.cuesize.length) === sig.cuesize) cuecount++;
        if (s[i] === ' ') tcount++;
      }
      if (cuecount > 0 && tcount === cuecount) chord.SetCue(BOOLEAN_true);
    } else if (this.m_staffstates[staffindex]?.cue_size?.[this.m_currentlayer]) {
      chord.SetCue(BOOLEAN_true);
    }

    // Not tested and probably won't work yet on chords.
    this.processTerminalLong(token);
    this.processTerminalBreve(token);
  }

  /** C++ HumdrumInput::getVerseLabels: take the pending verse-label tokens for
   *  this spine out of the staff state, leaving the rest queued. */
  public getVerseLabels(token: HTp, staff: number): HTp[] {
    const output: HTp[] = [];
    const ss = this.m_staffstates;
    if (token === null) return output;
    const labels = ss[staff]?.verse_labels;
    if (labels === undefined || labels.length === 0) return output;

    const remainder: HTp[] = [];
    const spineinfo = token.getSpineInfo();
    for (let i = 0; i < labels.length; ++i) {
      const lab = labels[i];
      if (lab !== null && lab.getSpineInfo() === spineinfo) output.push(lab);
      else remainder.push(lab);
    }

    if (output.length === 0) return output;
    ss[staff].verse_labels = remainder;
    return output;
  }

  /** C++ HumdrumInput::getVerseAbbrLabels: same as getVerseLabels but for the
   *  abbreviation queue. */
  public getVerseAbbrLabels(token: HTp, staff: number): HTp[] {
    const output: HTp[] = [];
    const ss = this.m_staffstates;
    if (token === null) return output;
    const labels = ss[staff]?.verse_abbr_labels;
    if (labels === undefined || labels.length === 0) return output;

    const remainder: HTp[] = [];
    const spineinfo = token.getSpineInfo();
    for (let i = 0; i < labels.length; ++i) {
      const lab = labels[i];
      if (lab !== null && lab.getSpineInfo() === spineinfo) output.push(lab);
      else remainder.push(lab);
    }

    if (output.length === 0) return output;
    ss[staff].verse_abbr_labels = remainder;
    return output;
  }

  /** C++ HumdrumInput::getVerseLabelText: text after `*v:`/`*vv:`; numeric
   *  labels get a trailing dot. */
  public getVerseLabelText(token: HTp): string {
    if (token === null) return '';
    if (!token.isInterpretation()) return '';
    const hre = new HumRegex();
    if (hre.search(token.toString(), '^\\*vv?:(.*)', 'i')) {
      let output = hre.getMatch(1);
      if (hre.search(output, '^\\d+$')) output += '.';
      return output;
    }
    return '';
  }

  /** C++ HumdrumInput::splitSyllableBySpaces: expand one syllable into several
   *  pieces at the spacer character (only when there is exactly one input). */
  public splitSyllableBySpaces(vtext: string[], spacer = ' '): void {
    if (vtext.length === 0) return;
    if (vtext[0].indexOf(spacer) === -1) return;
    if (vtext.length !== 1) {
      // invalid size
      return;
    }
    const original = vtext[0];
    vtext[0] = '';
    for (let i = 0; i < original.length; ++i) {
      if (original[i] !== spacer) {
        vtext[vtext.length - 1] += original[i];
        continue;
      }
      // new string needs to be made
      vtext.push('');
    }
  }

  /** C++ HumdrumInput::checkForVerseLabels: scan the following lyric spines for
   *  `*v:`/`*vv:`/`*V:` labels and queue them on the staff state. */
  public checkForVerseLabels(token: HTp): void {
    if (token === null) return;
    if (!token.isInterpretation()) return;
    const rkern = this.m_rkern;
    const track = token.getTrack();
    const staffindex = rkern[track] ?? -1;
    if (staffindex < 0 || staffindex >= this.m_staffstates.length) return;
    const ss = this.m_staffstates;

    let current = token.getNextFieldToken();
    while (current !== null && track === current.getTrack()) {
      current = current.getNextFieldToken();
    }
    while (current !== null && !current.isStaff()) {
      if (!(current.isDataTypeLike('**text') || current.isDataTypeLike('**silbe')
        || current.isDataTypeLike('**vdata'))) {
        current = current.getNextFieldToken();
        continue;
      }
      const s = current.toString();
      if (s.substr(0, 3) === '*v:') {
        ss[staffindex].verse_labels.push(current);
      } else if (s.substr(0, 4) === '*vv:') {
        ss[staffindex].verse_labels.push(current);
        ss[staffindex].verse_abbr_labels.push(current);
      }
      if (s.substr(0, 4) === '*V:') {
        ss[staffindex].verse_abbr_labels.push(current);
      }
      current = current.getNextFieldToken();
    }
  }

  /** C++ HumdrumInput::colorVerse: recolor a verse when a text mark is
   *  present (removing the mark) or force black when marks are enabled.
   *  C++ mutates `token` through a non-const reference; TS strings are
   *  immutable, so the (possibly mark-stripped) text is returned instead
   *  and callers must use the return value. */
  public colorVerse(verse: Verse, token: string): string {
    const hre = new HumRegex();
    const sig = this.m_signifiers;
    for (let i = 0; i < sig.textmark.length; ++i) {
      if (token.indexOf(sig.textmark[i]) !== -1) {
        verse.SetColor(sig.textcolor[i]);
        // remove mark character from text (so that it does not display):
        token = hre.replaceCopy(token, '', sig.textmark[i], 'g');
        return token;
      }
    }
    if (sig.mark.length === 0) return token;

    // force the verse text black so that it is not highlighted when notes are
    // highlighted.
    verse.SetColor('black');
    return token;
  }

  /** C++ HumdrumInput::verticalRest is a no-op (`return;` at top) since humlib
   *  now computes rest vertical position. Ported as a no-op for parity. */
  public verticalRest(_element: unknown, _token: string): void {
    return; // calculating this in humlib now.
  }

  /** C++ HumdrumInput::colorRest: spine color plus **mens/**kern mark color. */
  public colorRest(rest: Rest, token: string, line: number, field: number): void {
    let spinecolor = '';
    if (line >= 0 && field >= 0) {
      spinecolor = this.getSpineColor(line, field);
      if (spinecolor.indexOf('NOREST') !== -1) spinecolor = '';
    }
    if (spinecolor !== '') rest.SetColor(spinecolor);

    const sig = this.m_signifiers;
    if (this.m_mens) {
      for (let i = 0; i < sig.mens_mark.length; ++i) {
        if (token.indexOf(sig.mens_mark[i]) !== -1) { rest.SetColor(sig.mens_mcolor[i]); break; }
      }
    } else {
      for (let i = 0; i < sig.mark.length; ++i) {
        if (token.indexOf(sig.mark[i]) !== -1) { rest.SetColor(sig.mcolor[i]); break; }
      }
    }
  }

  /** C++ hasLayoutParameter (LO/<category> @param, false for 0/false). */
  public hasLayoutParameter(token: HTp, category: string, param: string): boolean {
    if (token === null) return false;
    const lcount = token.getLinkedParameterSetCount();
    if (lcount === 0) return false;
    for (let p = 0; p < lcount; ++p) {
      const hps = token.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO') continue;
      if (hps.getNamespace2() !== category) continue;
      for (let q = 0; q < hps.getCount(); ++q) {
        if (hps.getParameterName(q) !== param) continue;
        const value = hps.getParameterValue(q);
        if (value === '0' || value === 'false') return false;
        return true;
      }
    }
    return false;
  }

  /** C++ convertNote: full note conversion in source order. */
  public convertNote(
    note: Note, token: HTp, staffadj: number, staffindex: number, subtoken = -1,
  ): void {
    if (token === null) return;
    const ss = this.m_staffstates;
    const subnote = subtoken >= 0 ? token.getSubtoken(subtoken) : token.toString();
    if (subtoken <= 0 && token.toString().indexOf('H') !== -1) ss[staffindex].glissStarts.push(token);
    const tstring = subtoken < 0 ? token.toString() : token.getSubtoken(subtoken);
    if (this.m_scordaturaMarker.length > 0) this.checkNoteForScordatura(tstring);
    const chordQ = token.isChord();
    let unpitchedQ = subnote.indexOf('R') !== -1;
    const lastClefIsX = ss[staffindex].last_clef.substr(0, 6) === '*clefX';
    let badpitchedQ = false;
    if ((unpitchedQ !== lastClefIsX)) { badpitchedQ = true; unpitchedQ = true; }
    if (!chordQ) this.setStemLength(note as never, token);
    if (!chordQ) {
      const breaksec = token.getValueInt('', 'auto', 'breaksec');
      if (breaksec) note.SetBreaksec(breaksec);
    }
    this.processTerminalLong(token);
    this.processTerminalBreve(token);
    if (!this.m_mens) this.processOverfillingNotes(token);
    this.colorNote(note as never, token, tstring);
    if ((this.m_doc as unknown as { GetOptions(): { m_humType: { GetValue(): boolean } } }).GetOptions().m_humType.GetValue()) {
      this.embedQstampInClass(note as never, token);
      this.embedPitchInformationInClass(note as never, tstring);
      this.embedTieInformation(note as never, tstring);
    }
    const ottava = token.getValueInt('auto', 'ottava');
    const octaveupQ = ottava === 1;
    const octavedownQ = ottava === -1;
    const octave2upQ = ottava === 2;
    const octave2downQ = ottava === -2;
    const s = ss[staffindex];
    if (s.ottavameasure !== null && s.ottavanotestart === null) s.ottavanotestart = note;
    if (s.ottavadownmeasure !== null && s.ottavadownnotestart === null) s.ottavadownnotestart = note;
    if (s.ottava2measure !== null && s.ottava2notestart === null) s.ottava2notestart = note;
    if (s.ottava2downmeasure !== null && s.ottava2downnotestart === null) s.ottava2downnotestart = note;
    const timestamp = this.m_mens ? new HumNum(0) : token.getDurationFromStart();
    if (s.ottavanoteend === null) s.ottavanoteend = note;
    else if (timestamp.sub(s.ottavaendtimestamp).isPositive()) s.ottavanoteend = note;
    if (s.ottavadownnoteend === null) s.ottavadownnoteend = note;
    else if (timestamp.sub(s.ottavadownendtimestamp).isPositive()) s.ottavadownnoteend = note;
    if (s.ottava2noteend === null) s.ottava2noteend = note;
    else if (timestamp.sub(s.ottavaendtimestamp).isPositive()) s.ottava2noteend = note;
    if (s.ottava2downnoteend === null) s.ottava2downnoteend = note;
    else if (timestamp.sub(s.ottavaendtimestamp).isPositive()) s.ottava2downnoteend = note;
    if (timestamp.sub(s.ottavadownendtimestamp).isPositive()) s.ottavadownnoteend = note;
    if (timestamp.sub(s.ottava2endtimestamp).isPositive()) s.ottava2noteend = note;
    if (timestamp.sub(s.ottava2downendtimestamp).isPositive()) s.ottava2downnoteend = note;
    if (!chordQ) {
      if (tstring.indexOf('qq') !== -1) { note.SetGrace(GRACE_acc); note.SetDur(DURATION_8); }
      else if (tstring.indexOf('q') !== -1) { note.SetGrace(GRACE_unacc); note.SetDur(DURATION_8); }
    }
    this.convertNotePitch(note as never, token, staffindex, subtoken);
    if (badpitchedQ) note.SetColor('#c41414');
    const accid = this.convertNoteAccid(note as never, token, staffindex, subtoken);
    if (!chordQ) {
      let dur: HumNum;
      if (this.m_hasTremolo && token.getValueBool('auto', 'tremolo')) {
        dur = this.convertRhythm(note as never, { toString: () => token.getValue('auto', 'recip') } as never, 0);
      }
      else if (this.m_hasTremolo && token.getValueBool('auto', 'tremolo2')) {
        dur = this.convertRhythm(note as never, { toString: () => token.getValue('auto', 'recip') } as never, 0);
      }
      else if (this.m_hasTremolo && token.getValueBool('auto', 'tremoloAux')) {
        dur = this.convertRhythm(note as never, { toString: () => token.getValue('auto', 'recip') } as never, 0);
      }
      else dur = this.convertRhythm(note as never, token, subtoken);
      if (this.m_setrightstem) { this.m_setrightstem = false; note.SetStemPos(STEMPOSITION_RIGHT_LOCAL); }
      if (dur.isZero()) { note.SetDur(DURATION_4); note.SetStemVisible(BOOLEAN_false); }
      this.checkForJoin(note, token);
    }
    else {
      const chordvis = token.getVisualDurationChord();
      if (chordvis === '') {
        const notevis = token.getVisualDuration(subtoken);
        if (notevis !== '') this.convertRhythm(note as never, token, subtoken);
      }
    }
    this.convertNoteStem(note as never, token, staffindex, subtoken);
    if (!this.m_mens && tstring.indexOf('yy') !== -1) note.SetVisible(BOOLEAN_false);
    if (this.m_mens && token.isMensLike()) this.addMensuralQuality(note as never, token);
    if (!this.m_mens && token.isMensLike() === false) {
      if (tstring.indexOf('P') !== -1) this.appendTypeTag(note as never, 'appoggiatura-start');
      if (tstring.indexOf('p') !== -1) this.appendTypeTag(note as never, 'appoggiatura-stop');
    }
    this.processTieWrappers(note as never, token, tstring, subtoken);
    if (this.m_signifiers.above !== '') {
      const pattern = new RegExp('[ra-gA-G]+[-#nxXyY]*' + this.m_signifiers.above);
      if (pattern.test(tstring)) {
        const newstaff = this.m_currentstaff - 1;
        if (staffadj === 0 && newstaff > 0 && newstaff <= this.m_staffstarts.length) this.setStaff(note as never, newstaff);
      }
    }
    if (this.m_signifiers.below !== '') {
      const pattern = new RegExp('[ra-gA-G]+[-#nxXyY]*' + this.m_signifiers.below);
      if (pattern.test(tstring)) {
        const newstaff = this.m_currentstaff + 1;
        if (staffadj === 0 && newstaff > 0 && newstaff <= this.m_staffstarts.length) this.setStaff(note as never, newstaff);
      }
    }
    if (subtoken < 0) this.convertVerses(note as never, token);
    if (!chordQ) {
      token.setValue('MEI', 'xml:id', note.GetID());
      token.setValue('MEI', 'measureIndex', this.m_measures.length - 1);
    }
    if (this.m_signifiers.cuesize !== '' && tstring.indexOf(this.m_signifiers.cuesize) !== -1) note.SetCue(BOOLEAN_true);
    else if (ss[staffindex].cue_size[this.m_currentlayer]) note.SetCue(BOOLEAN_true);
    if (token.toString().indexOf('{') !== -1) this.appendTypeTag(note as never, 'phraseStart');
    if (token.toString().indexOf('}') !== -1) this.appendTypeTag(note as never, 'phraseStop');
    // ponytail: scordatura note@pname.ges/@accid.ges deferred (HumTransposer
    // and Note::SetPnameGes not ported); the marker check still runs above.
    void accid;
  }

  public static getDateString(now = new Date()): string {
    const p2 = (n: number): string => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`
      + `T${p2(now.getHours())}:${p2(now.getMinutes())}:${p2(now.getSeconds())}`;
  }

  public static getLocationIdForToken(className: string, lineIndex: number, fieldIndex: number, subtoken = -1): string {
    const line = lineIndex + 1;
    const field = fieldIndex + 1;
    let id = className.toLowerCase();
    id += '-L' + String(line);
    id += 'F' + String(field);
    if (subtoken >= 0) id += 'S' + String(subtoken + 1);
    return id;
  }

  public static getLocationIdForIndices(
    className: string, lineindex: number, fieldindex: number, subtokenindex: number,
  ): string {
    const line = lineindex + 1;
    const field = fieldindex + 1;
    const subtoken = subtokenindex + 1;
    let id = className.toLowerCase();
    if (line > 0) id += '-L' + String(line);
    if (field > 0) id += 'F' + String(field);
    if (subtoken > 0) id += 'S' + String(subtoken);
    return id;
  }

  public static getLocationIdWithPrefix(
    prefix: string, lineindex: number, fieldindex: number, subtokenindex: number, alwaysSuffixed: boolean,
  ): string {
    if (alwaysSuffixed) {
      const line = lineindex + 1;
      const field = fieldindex + 1;
      let id = prefix;
      id += '-L' + String(line);
      id += 'F' + String(field);
      if (subtokenindex >= 0) id += 'S' + String(subtokenindex + 1);
      return id;
    }
    return HumdrumInput.getLocationIdForIndices(prefix, lineindex, fieldindex, subtokenindex);
  }

  public setLocationId(object: LocationIdObject, token: { getLineIndex(): number; getFieldIndex(): number }, subtoken = -1): void {
    object.SetID(HumdrumInput.getLocationIdForToken(object.GetClassName(), token.getLineIndex(), token.getFieldIndex(), subtoken));
  }

  public setLocationIdByIndices(object: LocationIdObject, lineindex: number, fieldindex: number, subtokenindex: number): void {
    object.SetID(HumdrumInput.getLocationIdForIndices(object.GetClassName(), lineindex, fieldindex, subtokenindex));
  }

  public setLocationIdNSuffix(
    object: LocationIdObject, token: { getLineIndex(): number; getFieldIndex(): number }, num: number,
  ): void {
    const line = token.getLineIndex() + 1;
    const field = token.getFieldIndex() + 1;
    object.SetID(`${object.GetClassName().toLowerCase()}-L${line}F${field}N${num}`);
  }

  public getLoColor(token: HTp, category: string, subtoken = -1): string {
    if (token === null) return '';
    const val = token.getLayoutParameter(category, 'color', subtoken);
    if (val !== '') return val;
    for (let p = 0; p < token.getLinkedParameterSetCount(); ++p) {
      const hps = token.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO' || hps.getNamespace2() !== category) continue;
      for (let q = 0; q < hps.getCount(); ++q) {
        if (hps.getParameterName(q) === 'color') return hps.getParameterValue(q);
      }
    }
    return '';
  }

  public setPlaceRelEvent(element: { SetPlace(v: number): void }, place: string, showplace: boolean | number): void {
    const rel = place === 'above' ? STAFFREL_above : place === 'below' ? STAFFREL_below : 0;
    element.SetPlace(rel);
    if (this.m_humtype && Boolean(showplace)) {
      this.appendTypeTag(element as unknown as VrvObject, 'placed');
    }
  }

  public setPlaceRelStaff(element: { SetPlace?(v: number): void; GetTextDirInterface?(): unknown }, place: string, showplace: boolean | number): void {
    const rel = place === 'above' ? STAFFREL_above : place === 'below' ? STAFFREL_below : place === 'between' ? STAFFREL_between : 0;
    if (typeof element.SetPlace === 'function') {
      element.SetPlace(rel);
    } else if (typeof element.GetTextDirInterface === 'function') {
      const tdi = element.GetTextDirInterface() as { SetPlace?(v: number): void } | null;
      tdi?.SetPlace?.(rel);
    }
    if (this.m_humtype && Boolean(showplace)) {
      this.appendTypeTag(element as unknown as VrvObject, 'placed');
    }
  }

  public getNoteStaff(token: HTok, homestaff: number): number {
    const hre = new HumRegex();
    const tokStr = token.toString();
    if (this.m_signifiers.above !== '') {
      const sstring = '[a-g]+[-#n]*' + this.m_signifiers.above;
      if (hre.search(tokStr, sstring)) {
        return homestaff - 1;
      }
    }
    if (this.m_signifiers.below !== '') {
      const sstring = '[a-g]+[-#n]*' + this.m_signifiers.below;
      if (hre.search(tokStr, sstring)) {
        return homestaff + 1;
      }
    }
    return homestaff;
  }

  public getMeasureEndTstamp(staffindex: number): HumNum {
    const ss = this.m_staffstates;
    if (staffindex < 0 || staffindex >= ss.length || !ss[staffindex]) return new HumNum(5);
    return new HumNum((ss[staffindex].meter_top ?? 4) + 1);
  }

  public getMeasureTstamp(token: HTok, staffindex: number, _fract?: HumNum): HumNum;
  public getMeasureTstamp(token: HTok, extraduration: HumNum, staffindex: number, _fract?: HumNum): HumNum;
  public getMeasureTstamp(token: HTok, a: number | HumNum, b?: number | HumNum, _fract = new HumNum(0)): HumNum {
    const ss = this.m_staffstates;
    if (typeof a === 'number') {
      const qbeat = token.getDurationFromBarline();
      const lastSS = ss.length > 0 ? ss[ss.length - 1] : null;
      const mfactor = (lastSS && lastSS.meter_bottom && typeof lastSS.meter_bottom.div === 'function')
        ? lastSS.meter_bottom.div(4)
        : new HumNum(1);
      return qbeat.mul(mfactor).add(1);
    } else {
      const extraduration = a;
      const staffindex = typeof b === 'number' ? b : 0;
      const qbeat = token.getDurationFromBarline().add(extraduration);
      const mfactor = (staffindex >= 0 && staffindex < ss.length && ss[staffindex]?.meter_bottom)
        ? ss[staffindex].meter_bottom.div(4)
        : new HumNum(1);
      return qbeat.mul(mfactor).add(1);
    }
  }

  public getMeasureTstampPlusDur(token: HTok, staffindex: number, _fract = new HumNum(0)): HumNum {
    const ss = this.m_staffstates;
    const qbeat = token.getDurationFromBarline().add(token.getDuration());
    const mfactor = (staffindex >= 0 && staffindex < ss.length && ss[staffindex]?.meter_bottom)
      ? ss[staffindex].meter_bottom.div(4)
      : new HumNum(1);
    return qbeat.mul(mfactor).add(1);
  }

  public getMeasureFactor(staffindex: number): HumNum {
    const ss = this.m_staffstates;
    if (staffindex < 0 || staffindex >= ss.length || !ss[staffindex] || !ss[staffindex].meter_bottom) return new HumNum(1);
    return ss[staffindex].meter_bottom.div(4);
  }

  public isLeftmostSystemArpeggio(token: HTok): boolean {
    let curr = token.getPreviousFieldToken();
    while (curr !== null) {
      if (!curr.isKernLike()) {
        curr = curr.getPreviousFieldToken();
        continue;
      }
      if (curr.toString().indexOf('::') !== -1) {
        return false;
      }
      curr = curr.getPreviousFieldToken();
    }
    return true;
  }

  public getSystemArpeggioTokens(token: HTok): HTok[] {
    const output: HTok[] = [];
    let curr: HTp = token.getNextFieldToken();
    while (curr !== null) {
      if (!curr.isKernLike()) {
        curr = curr.getNextFieldToken();
        continue;
      }
      if (curr.toString().indexOf('::') !== -1) {
        output.push(curr);
      }
      curr = curr.getNextFieldToken();
    }
    return output;
  }

  public isLeftmostStaffArpeggio(token: HTok): boolean {
    const track = token.getTrack();
    let curr = token.getPreviousFieldToken();
    let ntrack = curr !== null ? curr.getTrack() : 0;
    while (curr !== null) {
      if (track !== ntrack) break;
      if (!curr.isKernLike()) {
        curr = curr.getPreviousFieldToken();
        if (curr !== null) ntrack = curr.getTrack();
        continue;
      }
      if (curr.toString().indexOf(':') !== -1) {
        return false;
      }
      curr = curr.getPreviousFieldToken();
      if (curr !== null) ntrack = curr.getTrack();
    }
    return true;
  }

  public getStaffArpeggioTokens(token: HTok): HTok[] {
    const output: HTok[] = [];
    const track = token.getTrack();
    let curr: HTp = token.getNextFieldToken();
    let ntrack = curr !== null ? curr.getTrack() : 0;
    while (curr !== null) {
      if (ntrack !== track) break;
      if (!curr.isKernLike()) {
        curr = curr.getNextFieldToken();
        continue;
      }
      if (curr.toString().indexOf(':') !== -1 && curr.toString().indexOf('::') === -1) {
        output.push(curr);
      }
      curr = curr.getNextFieldToken();
      if (curr !== null) ntrack = curr.getTrack();
    }
    return output;
  }

  public addChildBackMeasureOrSection(element: VrvObject): void {
    if (this.m_measure !== null) {
      this.m_measure.AddChildBack(element);
    } else if (this.m_sections.length > 0) {
      this.m_sections[this.m_sections.length - 1].AddChild(element);
    }
  }

  public getLocationId(prefix: string, token: HTok, subtoken = -1): string {
    return HumdrumInput.getLocationIdForToken(prefix, token.getLineIndex(), token.getFieldIndex(), subtoken);
  }

  // C++ HumdrumInput::addTextElement (iohumdrum.cpp:20653): italic markup, syllable
  // centering spacer, [music-code] routing to addMusicSymbol, then free-ampersand /
  // HTML-entity handling and `\n` splitting into <lb/>-separated <rend><text> runs.
  public addTextElement(element: VrvObject, content: string, fontstyle = '', addSpacer = false, label = ''): void {
    let text = new Text();
    if (label !== '') {
      text.SetLabel(label);
    }
    let myfontstyle = fontstyle;
    let data = content;

    // ponytail: plain-text fast path (Q26). Typical lyrics contain no markup,
    // music codes, entities or line breaks; skip both HumRegex allocations
    // and all searches. Mirrors the tail of this function for single-piece
    // content without spacer/entity handling.
    if (myfontstyle === '' && label === '' && !addSpacer
      && data.indexOf('<i>') === -1 && data.indexOf('[') === -1
      && data.indexOf('&') === -1 && data.indexOf('\\') === -1) {
      text.SetText(UTF8to32(data));
      element.AddChild(text);
      return;
    }

    if (data.indexOf('<i>') !== -1) {
      // Convert <i>..</i> into italic. Currently only entire syllable can be
      // italic (no partially italics).
      myfontstyle = 'italic';
      const hre = new HumRegex();
      data = hre.replaceCopy(data, '', '<i>', 'g');
      data = hre.replaceCopy(data, '', '</i>', 'g');
    }

    let hre = new HumRegex();
    if (element.GetClassId() === ClassId.SYL) {
      // Approximate centering of single-letter text on noteheads. Currently the
      // text is left justified to before the left edge of the notehead.
      if (addSpacer) {
        // ponytail: C++ tests byte counts (size()==1, size()==2 with a high first
        // byte); counting code points covers both the ASCII and the 2-byte UTF-8
        // cases in one branch.
        if ([...data].length === 1) {
          data = '&#160;' + data;
        }
        else if (hre.search(data, '^&[^&;\\s]+;$')) {
          // Some single-letter HTML/numeric entity
          data = '&#160;' + data;
        }
      }
    }

    // Parse [ASCII] music codes to route to VerovioText font rends:
    if (hre.search(data, '^(.*?\\[*?)(\\[[^[][^.]*?\\])(.*)$')) {
      let pretext = hre.getMatch(1);
      const rawmusictext = hre.getMatch(2);
      const musictext = this.convertMusicSymbolNameToSmuflName(rawmusictext);
      const posttext = hre.getMatch(3);
      if (pretext === '\\n') {
        element.AddChild(new Lb());
        pretext = '';
      }
      else if (hre.search(pretext, '\\\\n(.*)')) {
        element.AddChild(new Lb());
        pretext = hre.getMatch(1);
      }
      if (musictext.length === 0) {
        let newtext = rawmusictext;
        newtext = hre.replaceCopy(newtext, '&#91;', '\\[', 'g');
        newtext = hre.replaceCopy(newtext, '&#93;', '\\]', 'g');
        pretext += newtext;
      }

      if (pretext !== '') {
        pretext = HumdrumInput.unescapeHtmlEntities(pretext);
        pretext = hre.replaceCopy(pretext, '[', '&#91;', 'g');
        pretext = hre.replaceCopy(pretext, ']', '&#93;', 'g');
        const rend = new Rend();
        element.AddChild(rend);

        rend.AddChild(text);
        text.SetText(UTF8to32(pretext));
        this.setFontStyle(rend, myfontstyle);
      }
      if (musictext.length !== 0) {
        this.addMusicSymbol(element, rawmusictext);
      }
      if (posttext !== '') {
        this.addTextElement(element, posttext, myfontstyle, addSpacer);
      }
      return;
    }

    data = HumdrumInput.escapeFreeAmpersand(data);
    data = HumdrumInput.unescapeHtmlEntities(data);

    const pieces: string[] = [];
    hre.split(pieces, data, '\\\\n');

    for (let i = 0; i < pieces.length; ++i) {
      data = pieces[i];
      text.SetText(UTF8to32(data));

      if (myfontstyle === '') {
        element.AddChild(text);
      }
      else {
        const rend = new Rend();
        element.AddChild(rend);
        rend.AddChild(text);
        this.setFontStyle(rend, myfontstyle);
      }

      if (i < pieces.length - 1) {
        // Need to add another text element, but add lb before it.
        element.AddChild(new Lb());
        text = new Text();
        if (label !== '') {
          text.SetLabel(label);
        }
      }
    }
  }

  public setFontStyle(element: Rend, fontstyle: string): void {
    if (fontstyle === 'italic') {
      element.SetFontstyle(FONTSTYLE_italic);
    } else if (fontstyle === 'normal') {
      element.SetFontstyle(FONTSTYLE_normal);
    }
  }

  public convertMusicSymbolNameToSmuflName(text: string): string[] {
    const output: string[] = [];
    if (text === '') return output;

    let newtext: string;
    if (text[0] === '[' && text[text.length - 1] === ']') {
      newtext = text.substring(1, text.length - 1);
    } else {
      newtext = text;
    }

    const hre = new HumRegex();
    let finaltext = hre.replaceCopy(newtext, '', '[|@].*');

    if (finaltext === 'segno') {
      output.push('segno');
      return output;
    }
    if (finaltext === 'coda') {
      output.push('coda');
      return output;
    }

    if (finaltext === 'Ped' || finaltext === 'ped') {
      output.push('keyboardPedalPed');
      return output;
    }
    if (finaltext === 'XPed' || finaltext === 'xped') {
      output.push('keyboardPedalPedUp');
      return output;
    }

    if (finaltext === 'sc') {
      output.push('mensuralSignumUp');
      return output;
    }
    if (finaltext === 'sc-below') {
      output.push('mensuralSignumDown');
      return output;
    }

    if (finaltext === 'circle-dot' || finaltext === 'o-dot' || finaltext === 'O-dot') {
      output.push('mensuralProlation1@type="circle-dot"');
      return output;
    }
    if (finaltext === 'circle' || finaltext === 'O' || finaltext === 'o') {
      output.push('mensuralProlation2@type="circle"');
      return output;
    }
    if (finaltext === 'cut-circle' || finaltext === 'cut-o' || finaltext === 'cut-O') {
      output.push('mensuralProlation3@type="cut-circle"');
      return output;
    }
    if (finaltext === 'cut-circle-dot' || finaltext === 'cut-o-dot' || finaltext === 'cut-O-dot' || finaltext === 'O.!') {
      output.push('mensuralProlation4@type="cut-circle-dot"');
      return output;
    }
    if (finaltext === 'c-dot' || finaltext === 'C-dot') {
      output.push('mensuralProlation5@type="c-dot"');
      return output;
    }
    if (finaltext === 'C') {
      output.push('mensuralProlation6@type="c"');
      return output;
    }
    if (finaltext === 'c') {
      output.push('timeSigCommon');
      return output;
    }
    if (finaltext === 'reverse-c' || finaltext === 'Cr' || finaltext === 'cr') {
      output.push('mensuralProlation7@type="reverse-c"');
      return output;
    }
    if (finaltext === 'cut-c-dot' || finaltext === 'cut-C-dot') {
      output.push('mensuralProlation8@type="cut-c-dot"');
      return output;
    }
    if (finaltext === 'cut-C') {
      output.push('mensuralProlation9@type="cut-c"');
      return output;
    }
    if (finaltext === 'cut-c') {
      output.push('timeSigCutCommon');
      return output;
    }
    if (finaltext === 'reverse-cut-c' || finaltext === 'reverse-cut-C' || finaltext === 'cut-cr' || finaltext === 'cut-Cr') {
      output.push('mensuralProlation10@type="reverse-cut-c"');
      return output;
    }
    if (finaltext === 'reverse-c-dot' || finaltext === 'reverse-C-dot' || finaltext === 'cr-dot' || finaltext === 'Cr-dot') {
      output.push('mensuralProlation11@type="reverse-c-dot"');
      return output;
    }
    if (finaltext === 'circle-slash' || finaltext === 'o-slash' || finaltext === 'O/' || finaltext === 'o/') {
      output.push('mensuralProportionTempusPerfectum');
      return output;
    }

    let dots = 0;
    if (hre.search(finaltext, '-dot$')) {
      dots = 1;
      if (hre.search(finaltext, '-dot-dot$')) {
        dots = 2;
        if (hre.search(finaltext, '-dot-dot-dot$')) {
          dots = 3;
        }
      }
      finaltext = hre.replaceCopy(finaltext, '', '(-dot)+');
    }
    if (hre.search(finaltext, '(\\.+)$')) {
      const dotstring = hre.getMatch(1);
      dots += dotstring.length;
      finaltext = hre.replaceCopy(finaltext, '', '\\.+$');
    }

    let noteQ = false;
    if (finaltext === 'quarter' || finaltext === '4') {
      output.push('metNoteQuarterUp');
      noteQ = true;
    } else if (finaltext === 'half' || finaltext === '2') {
      output.push('metNoteHalfUp');
      noteQ = true;
    } else if (finaltext === 'whole' || finaltext === '1') {
      output.push('metNoteWhole');
      noteQ = true;
    } else if (finaltext === 'breve' || finaltext === 'double-whole' || finaltext === '0') {
      output.push('metNoteSquareBreve');
      noteQ = true;
    } else if (finaltext === 'eighth' || finaltext === '8' || finaltext === '8th') {
      output.push('metNote8thUp');
      noteQ = true;
    } else if (finaltext === 'sixteenth' || finaltext === '16' || finaltext === '16th') {
      output.push('metNote16thUp');
      noteQ = true;
    } else if (finaltext === '32' || finaltext === '32nd') {
      output.push('metNote32ndUp');
      noteQ = true;
    } else if (finaltext === '64' || finaltext === '64th') {
      output.push('metNote64thUp');
      noteQ = true;
    } else if (finaltext === '128' || finaltext === '128th') {
      output.push('metNote128thUp');
      noteQ = true;
    } else if (finaltext === '256' || finaltext === '256th') {
      output.push('metNote256thUp');
      noteQ = true;
    } else if (finaltext === '512' || finaltext === '512th') {
      output.push('metNote512thUp');
      noteQ = true;
    } else if (finaltext === '1024' || finaltext === '1024th') {
      output.push('metNote1024thUp');
      noteQ = true;
    }

    if (dots > 0) {
      for (let i = 0; i < dots; i++) {
        output.push('metAugmentationDot');
      }
    }

    if (noteQ) {
      return output;
    }

    if (hre.search(finaltext, 'smufl=(.*)')) {
      output.push(hre.getMatch(1));
    }

    return output;
  }

  public setSmuflContent(symbol: Symbol, name: string): void {
    const hre = new HumRegex();
    let mytype = '';
    if (hre.search(name, '@type="(.*?)"')) {
      mytype = hre.getMatch(1);
      const newname = hre.replaceCopy(name, '', '@.*');
      symbol.SetGlyphName(newname);
    } else {
      symbol.SetGlyphName(name);
    }
    symbol.SetGlyphAuth('smufl');
    if (mytype !== '') {
      symbol.SetType(mytype);
    }
  }

  // C++ setFontsize is a template over any element with SetFontsize; Symbol
  // is only one instantiation (checkForGlobalRehearsal calls it with Rend).
  public setFontsize(element: { SetFontsize(v: unknown): void }, smuflname: string, original: string): void {
    const hre = new HumRegex();
    if (hre.search(original, '(\\d+\\.?\\d*%)')) {
      const perc = hre.getMatch(1);
      const fontpercent = new Att().StrToPercent(perc);
      const fontsize = new data_FONTSIZE();
      fontsize.SetPercent(fontpercent);
      element.SetFontsize(fontsize);
      return;
    }
    if (original.indexOf('smaller') !== -1) {
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_x_small);
      element.SetFontsize(fs);
      return;
    } else if (original.indexOf('smallest') !== -1) {
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_xx_small);
      element.SetFontsize(fs);
      return;
    } else if (original.indexOf('small') !== -1) {
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_small);
      element.SetFontsize(fs);
      return;
    } else if (original.indexOf('larger') !== -1) {
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_x_large);
      element.SetFontsize(fs);
      return;
    } else if (original.indexOf('largest') !== -1) {
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_xx_large);
      element.SetFontsize(fs);
      return;
    } else if (original.indexOf('large') !== -1) {
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_large);
      element.SetFontsize(fs);
      return;
    }
    if (smuflname.startsWith('met')) {
      // If smuflname is for a metric note, then shrink the size to 70% by default.
      const fontpercent = new Att().StrToPercent(this.m_textNoteSize);
      const fontsize = new data_FONTSIZE();
      fontsize.SetPercent(fontpercent);
      element.SetFontsize(fontsize);
      return;
    }
  }

  public isLastStaffTempo(token: HTok): boolean {
    const field = token.getFieldIndex() + 1;
    const track = token.getTrack();
    const line = token.getOwner() as HumdrumLine | null;
    if (line === null) return true;
    for (let i = field; i < line.getFieldCount(); ++i) {
      const newtok = line.token(i);
      if (newtok === null) continue;
      const newtrack = newtok.getTrack();
      if (track === newtrack) continue;
      if (!newtok.isStaff()) continue;
      if (newtok.compare(0, 3, '*MM') === 0) return false;
    }
    return true;
  }

  // C++ HumdrumInput::setTempoContent (tempo, text): split [music]=NNN into
  // text + SMuFL symbols + spaced '=NNN'; plain text passes through.
  // NOTE: the previous TS-side overload carried extra placement/bold/token
  // params and MmUnit/MmDots/Mm parsing that do not exist in C++; removed in
  // Pass 430 in favor of this direct port.
  public setTempoContent(tempo: Tempo, text: string): boolean {
    let rend: Rend | null = null;
    const hre = new HumRegex();
    if (hre.search(text, '\\\\n')) {
      rend = new Rend();
      tempo.AddChild(rend);
    }
    if (!hre.search(text, '(.*)\\[([^=\\]]*)\\]\\s*=\\s*(\\d+.*)')) {
      if (rend !== null) this.addTextElement(rend, text);
      else this.addTextElement(tempo, text);
      return true;
    }
    let first = hre.getMatch(1);
    const second = hre.getMatch(2);
    let third = hre.getMatch(3);
    const secondNames = this.convertMusicSymbolNameToSmuflName(second);
    if (first !== '') {
      if (first.endsWith('(')) first += '&#x200A;';
      if (rend !== null) this.addTextElement(rend, first);
      else this.addTextElement(tempo, first);
    }
    let name = '';
    let counter = 0;
    for (let i = 0; i < secondNames.length; i++) {
      if (secondNames[i] === '') continue;
      name = secondNames[i];
      if (counter !== 0) {
        if (name === 'metAugmentationDot') {
          if (rend !== null) this.addTextElement(rend, this.m_textAugmentationDotSpacer);
          else this.addTextElement(tempo, this.m_textAugmentationDotSpacer);
        } else {
          if (rend !== null) this.addTextElement(rend, this.m_textSmuflSpacer);
          else this.addTextElement(tempo, this.m_textSmuflSpacer);
        }
      }
      ++counter;
      const symbol = new Symbol();
      this.setSmuflContent(symbol, name);
      this.setFontsize(symbol, name, '');
      if (rend !== null) rend.AddChild(symbol);
      else tempo.AddChild(symbol);
    }
    third = this.m_textSmuflSpacer + '=' + this.m_textSmuflSpacer + third;
    if (rend !== null) this.addTextElement(rend, third);
    else this.addTextElement(tempo, third);
    return true;
  }

  public addTempoDirection(
    text: string,
    placement: string,
    bold: boolean,
    italic: boolean,
    token: HTok,
    staffindex: number,
    justification: number,
    color: string,
  ): boolean {
    const tempo = new Tempo();
    const midibpm = this.getMmTempo(token);
    if (midibpm > 0) {
      tempo.SetMidiBpm(midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
    }
    if (placement === 'center') {
      this.setStaffBetween(tempo, this.m_currentstaff);
    } else {
      this.setStaff(tempo, this.m_currentstaff);
    }
    this.setLocationId(tempo, token);
    const tstamp = this.getMeasureTstamp(token, staffindex);
    if (token.isMensLike()) {
      // Attach to note, not with measure timestamp.
      const startid = this.getLocationId('note', token);
      tempo.SetStartid('#' + startid);
    } else {
      tempo.SetTstamp(tstamp.getFloat());
    }
    if (placement === 'above') {
      this.setPlaceRelStaff(tempo, 'above', false);
    } else if (placement === 'below') {
      this.setPlaceRelStaff(tempo, 'below', false);
    } else if (placement === 'center') {
      this.setPlaceRelStaff(tempo, 'between', false);
    }
    // C++ fills content before attaching (setTempoContent always true here,
    // so the fallback addTextElement branch is dead but kept for parity).
    if (this.setTempoContent(tempo, text)) {
      this.addChildMeasureOrSection(tempo);
      return true;
    } else {
      this.addTextElement(tempo, text);
      this.addChildMeasureOrSection(tempo);
      return true;
    }
  }

  public addDirection(
    text: string,
    placement: string,
    bold: boolean,
    italic: boolean,
    token: HTok,
    staffindex: number,
    justification: number,
    color: string,
    vgroup: number,
    label = '',
  ): void {
    const hre = new HumRegex();
    if (hre.search(text, '\\[[^=]*\\]\\s*=\\s*\\d+')) {
      const status = this.addTempoDirection(text, placement, bold, italic, token, staffindex, justification, color);
      if (status) return;
    }
    if (token.isTimeSignature()) {
      this.addTempoDirection(text, placement, bold, italic, token, staffindex, justification, color);
      return;
    }

    const dir = new Dir();
    if (placement === 'center') {
      this.setStaffBetween(dir, this.m_currentstaff);
    } else {
      this.setStaff(dir, this.m_currentstaff);
    }
    if (label !== '') {
      dir.SetLabel(label);
    }
    this.setLocationId(dir, token);
    const tstamp = this.getMeasureTstamp(token, staffindex);
    if (token.isMensLike()) {
      const startid = HumdrumInput.getLocationIdForToken('note', token.getLineIndex(), token.getFieldIndex());
      dir.SetStartid('#' + startid);
    } else {
      dir.SetTstamp(tstamp.getFloat());
    }

    if (vgroup > 0) {
      dir.SetVgrp(vgroup);
    }

    let problemQ = false;
    const problem = token.getLayoutParameter('TX', 'problem');
    if (problem === 'true') {
      problemQ = true;
      this.appendTypeTag(dir, 'problem');
    }

    let sicQ = false;
    const sic = token.getLayoutParameter('SIC', 'sic');
    if (sic === 'true') {
      sicQ = true;
      this.appendTypeTag(dir, 'sic');
    }

    const typevalue = token.getLayoutParameter('TX', 'type');
    if (typevalue !== '') {
      this.appendTypeTag(dir, typevalue);
    }

    this.addChildMeasureOrSection(dir);
    if (placement === 'above') {
      this.setPlaceRelStaff(dir, 'above', false);
    } else if (placement === 'below') {
      this.setPlaceRelStaff(dir, 'below', false);
    } else if (placement === 'center') {
      this.setPlaceRelStaff(dir, 'between', false);
    }

    const plain = !(italic || bold);
    const needrend = plain || bold || justification !== 0 || color.length > 0;
    if (needrend) {
      const rend = new Rend();
      if (color !== '') {
        rend.SetColor(color);
      } else if (problemQ) {
        rend.SetColor('crimson');
      } else if (sicQ) {
        rend.SetColor('limegreen');
      }
      dir.AddChild(rend);
      this.addTextElement(rend, text);
      if (!italic) {
        rend.SetFontstyle(FONTSTYLE_normal);
      } else {
        rend.SetFontstyle(FONTSTYLE_italic);
      }
      if (bold) {
        rend.SetFontweight(FONTWEIGHT_bold);
      }
      if (justification === 1) {
        rend.SetHalign(HORIZONTALALIGNMENT_right);
      } else if (justification === 2) {
        rend.SetHalign(HORIZONTALALIGNMENT_center);
      }
    } else {
      this.addTextElement(dir, text);
    }
  }

  // C++ HumdrumInput::checkForLayoutBreak: LB/PB layout params on a barline
  // emit Sb/Pb children (ending if inside one, else current section).
  public checkForLayoutBreak(line: number): void {
    const infile = this.m_infiles.at(0);
    if (line >= infile.getLineCount()) return;
    if (!infile.at(line).isBarline()) return;
    const token = infile.token(line, 0);
    if (token === null) return;
    let group = token.getLayoutParameter('LB', 'g');
    if (group !== '') {
      const tstring = HumdrumInput.removeCommas(group);
      const sb = new Sb();
      this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
      if (this.m_currentending !== null) this.m_currentending.AddChild(sb);
      else this.m_sections[this.m_sections.length - 1].AddChild(sb);
      this.setLocationId(sb, token);
      this.appendTypeTag(sb, tstring);
      return;
    }
    group = token.getLayoutParameter('PB', 'g');
    if (group !== '') {
      const tstring = HumdrumInput.removeCommas(group);
      const pb = new Pb();
      this.m_layoutInformation = LayoutInformation.LAYOUT_ENCODED;
      if (this.m_currentending !== null) this.m_currentending.AddChild(pb);
      else this.m_sections[this.m_sections.length - 1].AddChild(pb);
      this.setLocationId(pb, token);
      this.appendTypeTag(pb, tstring);
      return;
    }
  }

  // C++ HumdrumInput::handleLigature: *lig .. *Xlig becomes a <bracketSpan func="ligature">
  // from the first to the last note inside the ligature.
  public handleLigature(token: HTp): void {
    if (token === null) return;
    if (token.toString() !== '*lig') return;

    // find end interpretation of ligature
    let ligend: HTp = token.getNextToken();
    let firstnote: HTp = null;
    let lastnote: HTp = null;
    while (ligend !== null) {
      if (ligend.toString() === '*Xlig') break;
      if (ligend.isNote()) {
        if (firstnote === null) firstnote = ligend;
        lastnote = ligend;
      }
      ligend = ligend.getNextToken();
    }
    if (ligend === null) {
      // could not find a matching ending for the ligature start. For now ignore it.
      // Perhaps later a partial ligature bracket could be rendered (but more likely
      // a data error).
      return;
    }
    if (firstnote === null) {
      // strange case: no notes in ligature
      return;
    }
    if (lastnote === null) {
      // strange case: no notes in ligature
      return;
    }

    const ligature = new BracketSpan();

    const startline = token.getLineNumber();
    const startfield = token.getFieldNumber();
    const stopline = ligend.getLineNumber();
    const stopfield = ligend.getFieldNumber();
    let id = 'ligature';
    id += '-L' + String(startline);
    id += 'F' + String(startfield);
    id += '-L' + String(stopline);
    id += 'F' + String(stopfield);
    ligature.SetID(id);

    // not considering if notes are in chords (which they should not)
    const startid = this.getLocationId('note', firstnote);
    ligature.SetStartid('#' + startid);
    const endid = this.getLocationId('note', lastnote);
    ligature.SetEndid('#' + endid);

    ligature.SetLform(LINEFORM_solid);
    ligature.SetFunc(bracketSpanLog_FUNC_ligature);

    this.addChildMeasureOrSection(ligature);
  }

  // C++ HumdrumInput::storeExpansionLists: collect `*>...[...]` expansion interpretations
  // before the first data line; one -> direct list, several -> <choice> with orig/reg.
  public storeExpansionLists(section: Section, starting: HTok): void {
    let current: HTp = starting;
    const expansions: HTp[] = [];

    while (current !== null) {
      if (current.isData()) {
        // only look for expansion lists before first data line
        break;
      }
      if (!current.isInterpretation()) {
        current = current.getNextToken();
        continue;
      }
      if (current.toString().substring(0, 2) !== '*>') {
        current = current.getNextToken();
        continue;
      }
      if (current.toString().indexOf('[') === -1) {
        current = current.getNextToken();
        continue;
      }
      expansions.push(current);
      current = current.getNextToken();
    }

    if (expansions.length === 0) return;
    if (expansions.length === 1) {
      this.storeExpansionList(section, expansions[0]);
    }
    else {
      this.storeExpansionListsInChoice(section, expansions);
    }
  }

  // C++ HumdrumInput::storeExpansionListsInChoice: wrap multiple variant expansions in a
  // <choice>; the unlabelled one becomes <orig>, the rest <reg type="label">.
  public storeExpansionListsInChoice(section: Section, expansions: HTp[]): void {
    const choice = new Choice();
    section.AddChild(choice);

    // Extract the variant labels:
    const labels: string[] = new Array(expansions.length).fill('');
    const hre = new HumRegex();
    for (let i = 0; i < expansions.length; ++i) {
      if (hre.search(expansions[i]!.toString(), '\\*>([^[]+)[[]')) {
        labels[i] = hre.getMatch(1);
      }
    }

    // Store the primary expansion:
    for (let i = 0; i < labels.length; ++i) {
      if (labels[i] === '') {
        const orig = new Orig();
        choice.AddChild(orig);
        this.storeExpansionList(orig, expansions[i]);
        // if there is more than one primary, the secondary ones will be ignored.
        break;
      }
    }

    // Store the secondary expansions:
    for (let i = 0; i < labels.length; ++i) {
      if (labels[i] === '') continue;
      const reg = new Reg();
      choice.AddChild(reg);
      reg.SetType(labels[i]);
      this.storeExpansionList(reg, expansions[i]);
    }
  }

  // C++ HumdrumInput::storeExpansionList: `<expansion>` with @type=variant and one
  // `#label-<label>` ref per comma-separated label.
  public storeExpansionList(parent: VrvObject, etok: HTp): void {
    if (etok === null) return;
    const expansion = etok.toString();
    let variant = '';
    let startindex = -1;
    for (let i = 2; i < expansion.length; ++i) {
      if (expansion[i] === '[') {
        startindex = i + 1;
        break;
      }
      variant += expansion[i];
    }
    if (startindex < 0) return;
    const labels: string[] = [''];
    for (let i = startindex; i < expansion.length; ++i) {
      const ch = expansion[i];
      if (/\s/.test(ch)) continue;
      else if (ch === '"') continue;
      else if (ch === "'") continue;
      else if (ch === ',') {
        if (labels[labels.length - 1] !== '') {
          // avoid syntax error from a null label.
          labels.push('');
        }
      }
      else if (ch === ']') break;
      else labels[labels.length - 1] += ch;
    }

    if (labels.length === 0) return;
    if (labels.length === 1 && labels[0] === '') return;

    const exp = new Expansion();
    exp.SetID(HumdrumInput.getLocationIdForToken(exp.GetClassName(), etok.getLineIndex(), etok.getFieldIndex(), -1));
    parent.AddChild(exp);
    if (variant !== '') exp.SetType(variant);

    for (let i = 0; i < labels.length; ++i) {
      const ref = '#label-' + labels[i];
      exp.AddRefAllowDuplicate(ref);
    }
  }

  // C++ HumdrumInput::checkForOmd: print a <tempo> from the !!!OMD reference record
  // (once, and only when not shadowed by a LO:TX omd text).
  public checkForOmd(startline: number, endline: number): void {
    if (this.m_mens) {
      // need to avoid rhythm parsing, so ignore not for mensural music
      return;
    }
    const infile = this.m_infiles.at(0);
    if (this.m_omd.greater(infile.at(startline).getDurationFromStart())) {
      return;
    }

    const staffstarts = this.m_staffstarts;
    if (staffstarts.length === 0) return;
    let key = '';
    let value = '';
    let index = -1;
    const hre = new HumRegex();
    for (let i = startline; i <= endline; ++i) {
      if (infile.at(i).isData()) break;
      if (infile.at(i).isBarline()) {
        const token = infile.at(i).token(0);
        let number = -1;
        if (token !== null && hre.search(token.toString(), '=(\\d+)')) {
          number = hre.getMatchInt(1);
        }
        if (value !== '' && number > 1) {
          // don't print initial OMD if a musical excerpt.
          return;
        }
      }
      if (!infile.at(i).isReference()) continue;
      key = infile.at(i).getReferenceKey();
      if (key === 'OMD') {
        index = i;
        value = infile.at(i).getReferenceValue();
        // Don't break: search for the last OMD in a non-data region.
      }
    }

    const omdTextQ = this.hasOmdText(startline, endline);

    if (omdTextQ) {
      // Do not print the !!!OMD: reference record since there is an alternate
      // !!LO:TX:omd: entry that will be printed (expected to be attached to a
      // time signature for now).
      return;
    }

    if (value !== '') {
      const tempo = new Tempo();
      const token = infile.token(index, 0);
      if (token === null) return;
      const timepos = token.getDurationFromStart();
      if (timepos.isPositive()) {
        let midibpm = this.getMmTempo(token);
        if (midibpm > 0) {
          tempo.SetMidiBpm(midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
          this.m_midibpm = midibpm;
        }
        else {
          // check for *MM marker before OMD
          midibpm = this.getMmTempoForward(token);
          if (midibpm > 0) {
            tempo.SetMidiBpm(midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
            this.m_midibpm = midibpm;
          }
        }
      }
      if (index >= 0) {
        this.setLocationId(tempo, token);
      }
      this.addChildBackMeasureOrSection(tempo);
      this.setTempoContent(tempo, value);
      tempo.SetTstamp(1.0);
      this.setStaff(tempo, 1);
      this.m_omd = infile.at(index).getDurationFromStart();
    }
  }

  // C++ HumdrumInput::hasOmdText: global LO:TX layout text overrides !!!OMD.
  public hasOmdText(startline: number, endline: number): boolean {
    const infile = this.m_infiles.at(0);
    const hre = new HumRegex();
    for (let i = startline; i <= endline; i++) {
      if (infile.at(i).hasSpines()) continue;
      const token = infile.token(i, 0);
      if (token === null) continue;
      if (hre.search(token.toString(), '^!!LO:TX.*:omd(:|$)')) return true;
    }
    return false;
  }

  // C++ HumdrumInput::setFontWeight: string -> FONTWEIGHT ordinal via converter.
  public setFontWeight(rend: Rend, fontweight: string): void {
    rend.SetFontweight(new AttConverterBase().StrToFontweight(fontweight));
  }

  // C++ HumdrumInput::appendTextToRend: append into last Text child, else new Text.
  public appendTextToRend(rend: Rend, content: string): void {
    if (content === '') return;
    const lastRendChild = rend.GetLast();
    if (lastRendChild !== null) {
      if (lastRendChild.GetClassId() === ClassId.TEXT) {
        const ztext = (lastRendChild as Text).GetText();
        const ytext = UTF8to32(content);
        (lastRendChild as Text).SetText([...ztext, ...ytext]);
      } else {
        const stext = new Text();
        rend.AddChild(stext);
        stext.SetText(UTF8to32(content));
      }
    } else {
      const text = new Text();
      rend.AddChild(text);
      text.SetText(UTF8to32(content));
    }
  }

  // C++ HumdrumInput::handleTempoChange: *MM# interpretation -> <tempo> unless
  // at time zero, near OMD, followed by tempo text, or shadowed by higher staff.
  public handleTempoChange(token: HTok): void {
    if (!token.isInterpretation()) return;
    const hre = new HumRegex();
    if (!hre.search(token.toString(), '^\\*MM(\\d+\\.?\\d*)')) return;
    const ttime = token.getDurationFromStart();
    if (ttime.isZero()) return;
    const midibpm = Math.trunc(hre.getMatchDouble(1) + 0.5);
    if (midibpm <= 0) return;
    this.m_midibpm = midibpm;
    if (this.isNearOmd(token)) return;
    if (this.hasTempoTextAfter(token)) return;
    if (!this.isLastStaffTempo(token)) return;
    const tempo = new Tempo();
    tempo.SetMidiBpm(midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
    this.setLocationId(tempo, token);
    const tstamp = this.getMeasureTstamp(token, 0);
    tempo.SetTstamp(tstamp.getFloat());
    this.addChildMeasureOrSection(tempo);
  }

  // C++ HumdrumInput::hasTempoTextAfter: local/global LO:TX tempo text between
  // the *MM token and the next data token suppresses the generated <tempo>.
  public hasTempoTextAfter(token: HTok): boolean {
    const owner = token.getOwner();
    const infile = owner === null ? null : owner.getOwner();
    if (infile === null) return false;
    const startline = token.getLineIndex();
    let current = token.getNextToken();
    if (current === null) return false;
    while (current !== null && !current.isData()) current = current.getNextToken();
    if (current === null) return false;
    const data = current;
    const dataline = data.getLineIndex();
    const texts: HTok[] = [];
    current = data.getPreviousToken();
    if (current === null) return false;
    let line = current.getLineIndex();
    while (current !== null && line > startline) {
      if (!current.isLocalComment()) break;
      if (current.compare(0, 7, '!LO:TX:') === 0) texts.push(current);
      current = current.getPreviousToken();
      if (current === null) break;
      line = current.getLineIndex();
    }
    for (const t of texts) {
      if (t !== null && this.isTempoishText(t)) return true;
    }
    texts.length = 0;
    for (let i = dataline - 1; i > startline; --i) {
      const gtok = infile.token(i, 0);
      if (gtok !== null && gtok.compare(0, 8, '!!LO:TX:') === 0) texts.push(gtok);
    }
    for (const t of texts) {
      if (t !== null && this.isTempoishText(t)) return true;
    }
    return false;
  }

  // C++ HumdrumInput::isTempoishText: LO:TX text looks like a tempo indication.
  public isTempoishText(token: HTok): boolean {
    const hre = new HumRegex();
    if (hre.search(token.toString(), ':tempo:')) return true;
    if (hre.search(token.toString(), ':tempo$')) return true;
    if (!hre.search(token.toString(), ':t=([^:]+)')) return false;
    const text = hre.getMatch(1);
    if (hre.search(text, '\\[.*?\\]\\s*=.*\\d\\d')) return true;
    return false;
  }

  // C++ HumdrumInput::isNearOmd: token line adjacent to !!!OMD (data bounds).
  // NOTE: C++ loop conditions/increments use tline (not i); ported verbatim
  // with an added range guard since C++ out-of-range access is UB while TS
  // HumdrumFileBase.token wraps negative indices.
  public isNearOmd(token: HTok): boolean {
    const tline = token.getLineIndex();
    const owner = token.getOwner();
    const infile = owner === null ? null : owner.getOwner();
    if (infile === null) return false;
    for (let i = tline - 1; tline >= 0; --i) {
      if (i < 0 || i >= infile.getLineCount()) break;
      const ltok = infile.token(i, 0);
      if (ltok !== null && ltok.isData()) break;
      if (!infile.at(i).isReference()) continue;
      if (ltok !== null && ltok.compare(0, 6, '!!!OMD') === 0) return true;
    }
    for (let i = tline + 1; tline < infile.getLineCount(); ++i) {
      if (i < 0 || i >= infile.getLineCount()) break;
      const ltok = infile.token(i, 0);
      if (ltok !== null && ltok.isData()) break;
      if (!infile.at(i).isReference()) continue;
      if (ltok !== null && ltok.compare(0, 6, '!!!OMD') === 0) return true;
    }
    return false;
  }

  // C++ HumdrumInput::getMmTempo: *MM# value at/before token, pre-data.
  public getMmTempo(token: HTok, checklast = false): number {
    void checklast;
    const hre = new HumRegex();
    let current: HTp = token;
    if (current !== null && current.isData()) current = current.getPreviousToken();
    while (current !== null && !current.isData()) {
      if (current.isInterpretation()) {
        if (hre.search(current.toString(), '^\\*MM(\\d+\\.?\\d*)')) {
          if (!this.isLastStaffTempo(current)) return 0.0;
          return hre.getMatchDouble(1);
        }
      }
      current = current.getPreviousToken();
    }
    return 0.0;
  }

  // C++ HumdrumInput::getMmTempoForward: *MM# value at/after token, pre-data.
  public getMmTempoForward(token: HTok): number {
    const hre = new HumRegex();
    let current: HTp = token;
    if (current !== null && current.isData()) current = current.getNextToken();
    let line = 0;
    while (current !== null && current.getSpineInfo() === '') {
      line = current.getLineIndex() + 1;
      const owner = current.getOwner();
      const hfile = owner === null ? null : owner.getOwner();
      if (hfile === null) return 0.0;
      current = hfile.token(line, 0);
    }
    while (current !== null && !current.isData()) {
      if (current.isInterpretation()) {
        if (hre.search(current.toString(), '^\\*MM(\\d+\\.?\\d*)')) return hre.getMatchDouble(1);
      }
      current = current.getNextToken();
    }
    return 0.0;
  }

  // C++ HumdrumInput::processGlobalDirections: system-level LO:TX -> Dir/Tempo.
  public processGlobalDirections(token: HTok, staffindex: number): void {
    const staffcount = this.m_staffstarts.length;
    if (staffindex > 0 && staffindex < staffcount - 1) return;
    const hline = token.getOwner();
    if (hline === null) return;
    const text = hline.getValue('LO', 'TX', 't');
    if (text.length === 0) return;
    const label = hline.getValue('LO', 'TX', 'pop');
    const zparam = hline.isDefined('LO', 'TX', 'Z');
    const yparam = hline.isDefined('LO', 'TX', 'Y');
    const aparam = hline.getValueBool('LO', 'TX', 'a');
    let bparam = false;
    let cparam = false;
    if (!aparam) bparam = hline.getValueBool('LO', 'TX', 'b');
    if (!aparam && !bparam) cparam = hline.getValueBool('LO', 'TX', 'c');
    let italic = false;
    let bold = false;
    let vgroup = -1;
    if (hline.isDefined('LO', 'TX', 'vgrp')) vgroup = hline.getValueInt('LO', 'TX', 'vgrp');
    else if (hline.isDefined('LO', 'TX', 'vg')) vgroup = hline.getValueInt('LO', 'TX', 'vg');
    if (hline.isDefined('LO', 'TX', 'i')) italic = true;
    if (hline.isDefined('LO', 'TX', 'B')) bold = true;
    if (hline.isDefined('LO', 'TX', 'bi')) { bold = true; italic = true; }
    if (hline.isDefined('LO', 'TX', 'ib')) { bold = true; italic = true; }
    if (hline.isDefined('LO', 'TX', 'Bi')) { bold = true; italic = true; }
    if (hline.isDefined('LO', 'TX', 'iB')) { bold = true; italic = true; }
    const tempoQ = hline.isDefined('LO', 'TX', 'tempo');
    let Z = 0.0;
    let placement: string;
    let showplace = false;
    if (aparam) { placement = 'above'; showplace = true; }
    else if (bparam) { placement = 'below'; showplace = true; }
    else if (cparam) { placement = 'between'; showplace = true; }
    else if (zparam) {
      Z = hline.getValueInt('LO', 'TX', 'Z');
      if (Z >= 0) { placement = 'above'; showplace = true; }
      else { placement = 'below'; showplace = true; }
    } else if (yparam) {
      const Y = hline.getValueInt('LO', 'TX', 'Y');
      if (Y >= 0) { placement = 'below'; showplace = true; }
      else { placement = 'above'; showplace = true; }
    } else placement = 'above';
    if (tempoQ) {
      const tempo = new Tempo();
      const midibpm = this.getMmTempo(token);
      if (midibpm > 0) tempo.SetMidiBpm(midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
      if (cparam) this.setStaffBetween(tempo, this.m_currentstaff);
      else this.setStaff(tempo, this.m_currentstaff);
      this.setLocationId(tempo, token);
      const tstamp = this.getMeasureTstamp(token, staffindex);
      tempo.SetTstamp(tstamp.getFloat());
      if (placement === 'above') { this.setPlaceRelStaff(tempo, 'above', showplace); this.addChildBackMeasureOrSection(tempo); }
      else if (placement === 'below') { this.setPlaceRelStaff(tempo, 'below', showplace); this.addChildMeasureOrSection(tempo); }
      else if (placement === 'between') { this.setPlaceRelStaff(tempo, 'between', showplace); this.addChildMeasureOrSection(tempo); }
      else this.addChildMeasureOrSection(tempo);
      if (!italic || bold) {
        const rend = new Rend();
        tempo.AddChild(rend);
        this.addTextElement(rend, text);
        if (!italic) rend.SetFontstyle(FONTSTYLE_normal);
        else rend.SetFontstyle(FONTSTYLE_italic);
        if (bold) rend.SetFontweight(FONTWEIGHT_bold);
      } else {
        this.addTextElement(tempo, text);
        if (label !== '') tempo.SetLabel(label);
      }
    } else {
      const dir = new Dir();
      if (cparam) this.setStaffBetween(dir, this.m_currentstaff);
      else this.setStaff(dir, this.m_currentstaff);
      this.setLocationId(dir, token);
      const tstamp = this.getMeasureTstamp(token, staffindex);
      dir.SetTstamp(tstamp.getFloat());
      if (vgroup > 0) dir.SetVgrp(vgroup);
      if (placement === 'above') { this.setPlaceRelStaff(dir, 'above', showplace); this.addChildBackMeasureOrSection(dir); }
      else if (placement === 'below') { this.setPlaceRelStaff(dir, 'below', showplace); this.addChildMeasureOrSection(dir); }
      else if (placement === 'between') { this.setPlaceRelStaff(dir, 'between', showplace); this.addChildMeasureOrSection(dir); }
      else this.addChildMeasureOrSection(dir);
      if (!italic || bold) {
        const rend = new Rend();
        dir.AddChild(rend);
        this.addTextElement(rend, text);
        if (!italic) rend.SetFontstyle(FONTSTYLE_normal);
        else rend.SetFontstyle(FONTSTYLE_italic);
        if (bold) rend.SetFontweight(FONTWEIGHT_bold);
      } else {
        this.addTextElement(dir, text);
        if (label !== '') dir.SetLabel(label);
      }
    }
  }

  // C++ HumdrumInput::processDirections: linked sets + internal LO:TX text.
  public processDirections(token: HTok, staffindex: number): void {
    const lcount = token.getLinkedParameterSetCount();
    for (let i = 0; i < lcount; ++i) this.processLinkedDirection(i, token, staffindex);
    const text = token.getValue('LO', 'TX', 't');
    if (text.length === 0) return;
    const label = token.getValue('LO', 'TX', 'pop');
    let justification = 0;
    if (token.isDefined('LO', 'TX', 'rj')) justification = 1;
    else if (token.isDefined('LO', 'TX', 'cj')) justification = 2;
    const zparam = token.isDefined('LO', 'TX', 'Z');
    const yparam = token.isDefined('LO', 'TX', 'Y');
    const aparam = token.getValueBool('LO', 'TX', 'a');
    let bparam = false;
    let cparam = false;
    if (!aparam) bparam = token.getValueBool('LO', 'TX', 'b');
    if (!aparam && !bparam) cparam = token.getValueBool('LO', 'TX', 'c');
    let italic = false;
    let bold = false;
    let vgroup = -1;
    if (token.isDefined('LO', 'TX', 'vgrp')) vgroup = token.getValueInt('LO', 'TX', 'vgrp');
    else if (token.isDefined('LO', 'TX', 'vg')) vgroup = token.getValueInt('LO', 'TX', 'vg');
    if (token.isDefined('LO', 'TX', 'i')) italic = true;
    if (token.isDefined('LO', 'TX', 'B')) bold = true;
    if (token.isDefined('LO', 'TX', 'bi')) { bold = true; italic = true; }
    if (token.isDefined('LO', 'TX', 'ib')) { bold = true; italic = true; }
    if (token.isDefined('LO', 'TX', 'Bi')) { bold = true; italic = true; }
    if (token.isDefined('LO', 'TX', 'iB')) { bold = true; italic = true; }
    const color = token.getValue('LO', 'TX', 'color');
    let placement: string;
    if (aparam) placement = 'above';
    else if (bparam) placement = 'below';
    else if (cparam) placement = 'between';
    else if (zparam) placement = token.getValueInt('LO', 'TX', 'Z') >= 0 ? 'above' : 'below';
    else if (yparam) placement = token.getValueInt('LO', 'TX', 'Y') >= 0 ? 'below' : 'above';
    else placement = 'above';
    this.addDirection(text, placement, bold, italic, token, staffindex, justification, color, vgroup, label);
  }

  // C++ HumdrumInput::isFirstTokenOnStaff: gate for global directions.
  public isFirstTokenOnStaff(token: HTok): boolean {
    const target = token.getTrack();
    let tok = token.getPreviousFieldToken();
    while (tok !== null) {
      if (tok.getTrack() !== target) return true;
      if (!tok.isNull()) return false;
      tok = tok.getPreviousFieldToken();
    }
    return true;
  }

  // C++ HumdrumInput::processLinkedDirection: one LO:TX/LO:SIC set -> Dir/Tempo.
  public processLinkedDirection(index: number, token: HTok, staffindex: number): void {
    const globalQ = token.linkedParameterIsGlobal(index);
    let firstQ = true;
    if (globalQ) firstQ = this.isFirstTokenOnStaff(token);
    if (!firstQ) return;
    const hps = token.getLinkedParameterSet(index) as unknown as {
      getNamespace1(): string; getNamespace2(): string; getCount(): number;
      getParameterName(i: number): string; getParameterValue(i: number): string;
      getToken?: () => HTp;
    } | null;
    if (hps === null) return;
    if (hps.getNamespace1() !== 'LO') return;
    const namespace2 = hps.getNamespace2();
    const textQ = namespace2 === 'TX';
    const sicQ = namespace2 === 'SIC';
    let vgroup = -1;
    if (!(textQ || sicQ)) return;
    let italic = false;
    let bold = false;
    let zparam = false;
    let yparam = false;
    let aparam = false;
    let bparam = false;
    let cparam = false;
    let justification = 0;
    if (token.isBarline()) {
      const startdur = token.getDurationFromStart();
      const hfile = token.getOwner() === null ? null : token.getOwner()!.getOwner();
      if (hfile !== null) {
        const totaldur = hfile.at(hfile.getLineCount() - 1).getDurationFromStart();
        if (startdur.equals(totaldur)) justification = 1;
      }
    }
    let problemLabel = '';
    let problemQ = false;
    let verboseQ = false;
    let tempoQ = false;
    let text = '';
    let label = '';
    let key = '';
    let value = '';
    let typevalue = '';
    let verboseType = '';
    let ovalue = '';
    let svalue = '';
    let color = '';
    let dir: Dir | null = null;
    let tempo: Tempo | null = null;
    for (let i = 0; i < hps.getCount(); ++i) {
      key = hps.getParameterName(i);
      value = hps.getParameterValue(i);
      if (key === 'pop') label = value;
      if (key === 'a') aparam = true;
      else if (key === 'b') bparam = true;
      else if (key === 'c') cparam = true;
      else if (key === 't') {
        text = value;
        if (text.length === 0) return;
      }
      else if (key === 'Y') yparam = true;
      else if (key === 'Z') zparam = true;
      else if (key === 'i') italic = true;
      else if (key === 'B') bold = true;
      else if (key === 'Bi') { italic = true; bold = true; }
      else if (key === 'bi') { italic = true; bold = true; }
      else if (key === 'iB') { italic = true; bold = true; }
      else if (key === 'ib') { italic = true; bold = true; }
      if (key === 'rj') justification = 1;
      if (key === 'cj') justification = 2;
      if (key === 'color') color = value;
      if (key === 'v') { verboseQ = true; verboseType = value; }
      if (key === 'o') ovalue = value;
      if (key === 's') svalue = value;
      if (key === 'problem') { problemQ = true; problemLabel = value; }
      if (key === 'type') typevalue = value;
      if (key === 'tempo') tempoQ = true;
      if (key === 'vgrp') {
        if (value !== '' && value[0] >= '0' && value[0] <= '9') vgroup = parseInt(value, 10);
      } else if (key === 'vg') {
        if (value !== '' && value[0] >= '0' && value[0] <= '9') vgroup = parseInt(value, 10);
      }
    }
    if (namespace2 === 'SIC' && !verboseQ) return;
    if (sicQ) color = 'limegreen';
    if (problemQ) color = 'crimson';
    let placement: string;
    let showplace = false;
    if (aparam) { placement = 'above'; showplace = true; }
    else if (bparam) { placement = 'below'; showplace = true; }
    else if (cparam) { placement = 'between'; showplace = true; }
    else if (zparam) {
      if (token.getValueInt('LO', 'TX', 'Z') >= 0) { placement = 'above'; showplace = true; }
      else { placement = 'below'; showplace = true; }
    } else if (yparam) {
      if (token.getValueInt('LO', 'TX', 'Y') >= 0) { placement = 'below'; showplace = true; }
      else { placement = 'above'; showplace = true; }
    } else placement = 'above';
    if (sicQ) {
      if (label === '') {
        if (ovalue !== '') label = 'orig: ' + ovalue;
        if (svalue !== '') label = 'corr: ' + svalue;
      }
      if (verboseType === 'text') {
        if (ovalue !== '') text = ovalue;
        else if (svalue !== '') text = svalue;
        else text = 'S';
      } else text = 'S';
    }
    if (problemQ && problemLabel !== '') label = problemLabel;
    const maxstaff = this.m_staffstarts.length - 1;
    if (token.linkedParameterIsGlobal(index)) {
      if (placement === 'below' && staffindex !== maxstaff) return;
      else if (placement === 'above' && staffindex !== 0) return;
    }
    const hre = new HumRegex();
    if (hre.search(text, '\\[[^=]*\\]\\s*=\\s*\\d+')) {
      if (this.addTempoDirection(text, placement, bold, italic, token, staffindex, justification, color)) return;
    }
    if (token.isTimeSignature()) {
      this.addTempoDirection(text, placement, bold, italic, token, staffindex, justification, color);
      return;
    }
    let midibpm = 0.0;
    if (tempoQ) {
      midibpm = this.getMmTempo(token, true);
      if (midibpm === 0) return;
    }
    if (tempoQ) {
      tempo = new Tempo();
      if (midibpm > 0) tempo.SetMidiBpm(midibpm * this.m_globalTempoScaling * this.m_localTempoScaling.getFloat());
      if (placement === 'between') this.setStaffBetween(tempo, this.m_currentstaff);
      else this.setStaff(tempo, this.m_currentstaff);
      const dirtok: HTp = typeof hps.getToken === 'function' ? hps.getToken() : null;
      if (dirtok !== null) this.setLocationId(tempo, dirtok);
      else LogWarning(`In HumdrumInput::processLinkedDirection: dirtok for ${token.toString()} is empty`);
      const tstamp = this.getMeasureTstamp(token, staffindex);
      if (token.isMensLike()) {
        const startid = this.getLocationId('note', token);
        tempo.SetStartid('#' + startid);
      } else tempo.SetTstamp(tstamp.getFloat());
      if (problemQ) this.appendTypeTag(tempo, 'problem');
      if (sicQ) this.appendTypeTag(tempo, 'sic');
      if (typevalue !== '') this.appendTypeTag(tempo, typevalue);
      this.addChildMeasureOrSection(tempo);
      if (placement === 'above') this.setPlaceRelStaff(tempo, 'above', showplace);
      else if (placement === 'below') this.setPlaceRelStaff(tempo, 'below', showplace);
      else if (placement === 'between') this.setPlaceRelStaff(tempo, 'between', showplace);
    } else {
      dir = new Dir();
      if (label !== '') dir.SetLabel(label);
      if (placement === 'between') this.setStaffBetween(dir, this.m_currentstaff);
      else this.setStaff(dir, this.m_currentstaff);
      const dirtok: HTp = typeof hps.getToken === 'function' ? hps.getToken() : null;
      if (dirtok !== null) this.setLocationId(dir, dirtok);
      else LogWarning(`In HumdrumInput::processLinkedDirection: (2) dirtok for ${token.toString()} is empty`);
      if (token.isMensLike()) this.attachToToken(dir, token);
      else this.setAttachmentType(dir, token);
      if (vgroup > 0) dir.SetVgrp(vgroup);
      if (problemQ) this.appendTypeTag(dir, 'problem');
      if (sicQ) this.appendTypeTag(dir, 'sic');
      if (typevalue !== '') this.appendTypeTag(dir, typevalue);
      this.addChildMeasureOrSection(dir);
      if (placement === 'above') this.setPlaceRelStaff(dir, 'above', showplace);
      else if (placement === 'below') this.setPlaceRelStaff(dir, 'below', showplace);
      else if (placement === 'between') this.setPlaceRelStaff(dir, 'between', showplace);
    }
    if (problemQ) { italic = false; bold = false; text = '&#9888;'; }
    if (sicQ) text = '&#9888;';
    const plain = !(italic || bold);
    let needrend = italic || plain || bold || justification !== 0 || color.length > 0;
    let onlysmufl = false;
    if (hre.search(text, '^(\\[.*?\\])+$')) {
      onlysmufl = true;
      needrend = justification !== 0 || color.length > 0;
    }
    if (needrend) {
      const rend = new Rend();
      if (color !== '') rend.SetColor(color);
      else if (problemQ) rend.SetColor('crimson');
      else if (sicQ) rend.SetColor('limegreen');
      if (tempoQ && tempo !== null) tempo.AddChild(rend);
      else if (dir !== null) dir.AddChild(rend);
      this.addTextElement(rend, text, '', false, label);
      if (!italic) rend.SetFontstyle(FONTSTYLE_normal);
      else rend.SetFontstyle(FONTSTYLE_italic);
      if (bold) rend.SetFontweight(FONTWEIGHT_bold);
      if (justification === 1) rend.SetHalign(HORIZONTALALIGNMENT_right);
      else if (justification === 2) rend.SetHalign(HORIZONTALALIGNMENT_center);
    } else {
      if (tempoQ && tempo !== null) {
        this.addTextElement(tempo, text, '', false, label);
        if (onlysmufl && needrend) {
          const count = tempo.GetChildCount(ClassId.UNSPECIFIED);
          for (let j = 0; j < count; j++) {
            const obj = tempo.GetChild(j);
            if (obj === null || obj.GetClassId() !== ClassId.REND) continue;
            const item = obj as Rend;
            if (color !== '') item.SetColor(color);
            else if (problemQ) item.SetColor('crimson');
            else if (sicQ) item.SetColor('limegreen');
            if (!italic) item.SetFontstyle(FONTSTYLE_normal);
            else item.SetFontstyle(FONTSTYLE_italic);
            if (bold) item.SetFontweight(FONTWEIGHT_bold);
            if (justification === 1) item.SetHalign(HORIZONTALALIGNMENT_right);
            else if (justification === 2) item.SetHalign(HORIZONTALALIGNMENT_center);
          }
        }
      } else if (dir !== null) {
        if (onlysmufl && needrend) {
          const rend = new Rend();
          dir.AddChild(rend);
          this.addTextElement(rend, text, '', false, label);
          if (color !== '') rend.SetColor(color);
          else if (problemQ) rend.SetColor('crimson');
          else if (sicQ) rend.SetColor('limegreen');
          if (!italic) rend.SetFontstyle(FONTSTYLE_normal);
          else rend.SetFontstyle(FONTSTYLE_italic);
          if (bold) rend.SetFontweight(FONTWEIGHT_bold);
          if (justification === 1) rend.SetHalign(HORIZONTALALIGNMENT_right);
          else if (justification === 2) rend.SetHalign(HORIZONTALALIGNMENT_center);
        } else this.addTextElement(dir, text, '', false, label);
      }
    }
  }

  // C++ HumdrumInput::hasBounceAfter: *Xped followed by *ped at same time.
  public hasBounceAfter(token: HTok): boolean {
    if (token.toString() !== '*Xped') return false;
    const timestamp = token.getDurationFromStart();
    let current = token.getNextToken();
    while (current !== null && current.getDurationFromStart().equals(timestamp)) {
      if (current.toString() === '*ped') return true;
      current = current.getNextToken();
    }
    return false;
  }

  // C++ HumdrumInput::hasBounceBefore: *ped preceded by *Xped at same time.
  public hasBounceBefore(token: HTok): boolean {
    if (token.toString() !== '*ped') return false;
    const timestamp = token.getDurationFromStart();
    let current = token.getPreviousToken();
    while (current !== null && current.getDurationFromStart().equals(timestamp)) {
      if (current.toString() === '*Xped') return true;
      current = current.getPreviousToken();
    }
    return false;
  }

  // C++ HumdrumInput::checkForGlobalRehearsal: LO:REH on barlines -> Reh marks.
  public checkForGlobalRehearsal(line: number): void {
    const infile = this.m_infiles.at(0);
    if (!infile.at(line).isBarline()) return;
    const token = infile.token(line, 0);
    if (token === null) return;
    const lcount = token.getLinkedParameterSetCount();
    for (let i = 0; i < lcount; ++i) {
      if (!token.linkedParameterIsGlobal(i)) continue;
      const hps = token.getLinkedParameterSet(i) as unknown as {
        getNamespace1(): string; getNamespace2(): string; getCount(): number;
        getParameterName(j: number): string; getParameterValue(j: number): string;
      } | null;
      if (hps === null) return;
      if (hps.getNamespace1() !== 'LO') return;
      if (hps.getNamespace2() !== 'REH') continue;
      let absysQ = false;
      if (this.getDefaultLayoutParameter('REH', 'absys') === '1') absysQ = true;
      let fontsize = this.getDefaultLayoutParameter('REH', 'fs');
      let tvalue = this.getDefaultLayoutParameter('REH', 't');
      let qoffset = this.getDefaultLayoutParameter('REH', 'qo');
      let enclosure = this.getDefaultLayoutParameter('REH', 'enc');
      let color = this.getDefaultLayoutParameter('REH', 'color');
      let enclosureColor = this.getDefaultLayoutParameter('REH', 'encc');
      for (let j = 0; j < hps.getCount(); ++j) {
        const pkey = hps.getParameterName(j);
        const pvalue = hps.getParameterValue(j);
        if (pkey === 't') tvalue = pvalue;
        if (pkey === 'absys') absysQ = !(pvalue === '0' || pvalue === 'false');
        if (pkey === 'qo') qoffset = pvalue;
        if (pkey === 'fs') fontsize = pvalue;
        if (pkey === 'enc') enclosure = pvalue;
        if (pkey === 'color') color = pvalue;
        if (pkey === 'encc') enclosureColor = pvalue;
      }
      if (tvalue === '') continue;
      const buildReh = (): Reh => {
        const reh = new Reh();
        const rend = new Rend();
        const text = new Text();
        text.SetText(UTF8to32(tvalue));
        reh.AddChild(rend);
        rend.AddChild(text);
        rend.SetRend(TEXTRENDITION_box);
        if (enclosure === '') rend.SetRend(TEXTRENDITION_box);
        else this.setEnclosure(rend, enclosure);
        if (color !== '' && enclosureColor === '') reh.SetColor(color);
        else if (color === '' && enclosureColor !== '') { reh.SetColor(enclosureColor); rend.SetColor('black'); }
        else if (color !== '' && enclosureColor !== '') { reh.SetColor(enclosureColor); rend.SetColor(color); }
        return reh;
      };
      const reh = buildReh();
      this.addChildMeasureOrSection(reh);
      reh.GetTimePointInterface().SetStaff([1]);
      if (qoffset !== '') this.setTstamp(reh.GetTimePointInterface(), qoffset);
      else reh.GetTimePointInterface().SetTstamp(0.0);
      if (fontsize === '') fontsize = 'large';
      this.setFontsize(rend_of(reh), '', fontsize);
      const staffCount = this.m_staffstarts.length;
      if (absysQ && staffCount > 1) {
        const reh2 = buildReh();
        this.addChildMeasureOrSection(reh2);
        reh2.GetTimePointInterface().SetStaff([staffCount]);
        if (qoffset !== '') this.setTstamp(reh2.GetTimePointInterface(), qoffset);
        else reh2.GetTimePointInterface().SetTstamp(0.0);
        if (fontsize === '') fontsize = 'large';
        this.setFontsize(rend_of(reh2), '', fontsize);
        this.setPlaceRelStaff(reh2, 'below', false);
      }
    }
    function rend_of(reh: Reh): Rend {
      const r = reh.GetChild(0);
      if (r === null) throw new Error('checkForGlobalRehearsal: Reh missing Rend child');
      return r as Rend;
    }
  }

  // C++ HumdrumInput::setEnclosure (template): box/dbox/tbox/circle/none.
  public setEnclosure(element: { SetRend(v: number): void }, value: string): void {
    if (value === 'box') element.SetRend(TEXTRENDITION_box);
    else if (value === 'dbox') element.SetRend(TEXTRENDITION_dbox);
    else if (value === 'tbox') element.SetRend(TEXTRENDITION_tbox);
    else if (value === 'circle') element.SetRend(TEXTRENDITION_circle);
    else if (value === 'none') element.SetRend(TEXTRENDITION_none);
    else LogError(`Unknown enclosure type: ${value}`);
  }

  // C++ HumdrumInput::setTstamp (template): quarter-note offset -> MEI tstamp.
  public setTstamp(element: { SetTstamp(v: number): void }, value: string): void {
    if (value === '') return;
    if (value === '.') return;
    const ss = this.m_staffstates;
    const staffindex = this.m_currentstaff - 1;
    const qfactor = staffindex >= 0 && staffindex < ss.length
      ? ss[staffindex].meter_bottom.getFloat() / 4.0
      : 1.0;
    const hre = new HumRegex();
    if (hre.search(value, '^\\s*([\\d.]+)')) {
      element.SetTstamp(qfactor * hre.getMatchDouble(1) + 1);
      return;
    } else if (hre.search(value, '^(\\d+/\\d+)')) {
      const num = new HumNum(hre.getMatch(1));
      element.SetTstamp(qfactor * num.getFloat() + 1);
      return;
    }
    LogError(`Unknown REH quarter-note offset: ${value}`);
  }

  public addAnalyticalFermata(rest: MRest | Rest, tstring: string): void {
    this.getFullDoc().SetMarkup(MARKUP_ANALYTICAL_FERMATA);
    if (tstring.indexOf('yy') !== -1 || tstring.indexOf(';y') !== -1) return;
    const layer = this.m_currentlayer;
    const direction = this.getDirection(tstring, ';');
    if (tstring.indexOf(';') === -1) return;
    if (direction < 0) {
      (rest as any).SetFermata?.(STAFFREL_basic_below);
    } else if (direction > 0) {
      (rest as any).SetFermata?.(STAFFREL_basic_above);
    } else if (layer === 1) {
      (rest as any).SetFermata?.(STAFFREL_basic_above);
    } else if (layer === 2) {
      (rest as any).SetFermata?.(STAFFREL_basic_below);
    } else {
      (rest as any).SetFermata?.(STAFFREL_basic_above);
    }
  }

  public addFloatingFermata(token: HTok, parent: VrvObject | null = null): void {
    const layer = this.m_currentlayer;
    const staff = this.m_currentstaff;

    const fermataProcessed = token.getValueInt('auto', 'fermataProcessed');
    if (fermataProcessed) return;
    // C++ sets a bool; TS getValueInt parses ints, so store 1 (not 'true').
    token.setValue('auto', 'fermataProcessed', 1);

    const str = token.toString();
    if (str.indexOf(';') === -1) return;

    const staffadj = this.getStaffAdjustment(token);

    if (str.indexOf('yy') === -1 && str.indexOf(';y') === -1) {
      const fermata = new Fermata();
      this.addChildMeasureOrSection(fermata);
      this.setStaff(fermata, staff + staffadj);

      let fermata2: Fermata | null = null;
      if (str.indexOf(';;') !== -1) {
        fermata2 = new Fermata();
        this.addChildMeasureOrSection(fermata2);
        this.setStaff(fermata2, staff + staffadj);
      }

      if (parent !== null && str.indexOf('q') !== -1) {
        const id = '#' + parent.GetID();
        fermata.SetStartid(id);
        if (fermata2 !== null) fermata2.SetStartid(id);
      } else if (str.length > 0 && str[0] === '=') {
        if (parent !== null) {
          const id = '#' + parent.GetID();
          fermata.SetStartid(id);
          if (fermata2 !== null) fermata2.SetStartid(id);
        } else {
          const tstamp = this.getMeasureEndTstamp(staff - 1);
          fermata.SetTstamp(tstamp.getFloat());
          if (fermata2 !== null) fermata2.SetTstamp(tstamp.getFloat());
        }
      } else {
        const tstamp = this.getMeasureTstamp(token, staff - 1);
        if (parent !== null) {
          const id = '#' + parent.GetID();
          fermata.SetStartid(id);
          if (fermata2 !== null) fermata2.SetStartid(id);
        } else {
          fermata.SetTstamp(tstamp.getFloat());
          if (fermata2 !== null) fermata2.SetTstamp(tstamp.getFloat());
        }
      }

      if (fermata2 !== null) {
        this.setLocationIdNSuffix(fermata, token, 1);
        this.setLocationIdNSuffix(fermata2, token, 2);
        this.setPlaceRelStaff(fermata, 'above', false);
        this.setPlaceRelStaff(fermata2, 'below', false);
        return;
      } else {
        this.setLocationId(fermata, token);
      }

      const direction = this.getDirection(str, ';');
      if (direction < 0) {
        this.setPlaceRelStaff(fermata, 'below', false);
      } else if (direction > 0) {
        this.setPlaceRelStaff(fermata, 'above', false);
      } else if (layer === 1) {
        this.setPlaceRelStaff(fermata, 'above', false);
      } else if (layer === 2) {
        this.setPlaceRelStaff(fermata, 'below', false);
      }
    }
  }

  public addFermata(token: HTok, parent?: VrvObject | null): void;
  public addFermata(rest: MRest | Rest, tstring: string): void;
  public addFermata(target: HTok | MRest | Rest, second?: VrvObject | string | null): void {
    if (typeof second === 'string') {
      this.addAnalyticalFermata(target as MRest | Rest, second);
    } else {
      this.addFloatingFermata(target as HTok, second ?? null);
    }
  }

  public addBreath(token: HTok, parent: VrvObject | null = null): void {
    const layer = this.m_currentlayer;
    const staff = this.getNoteStaff(token, this.m_currentstaff);

    const str = token.toString();
    if (str.indexOf(',') === -1) return;

    if (str.indexOf('yy') === -1 && str.indexOf(',y') === -1) {
      const breath = new Breath();
      this.addChildMeasureOrSection(breath);
      this.setStaff(breath, staff);

      if (parent !== null && str.indexOf('q') !== -1) {
        const id = '#' + parent.GetID();
        breath.SetStartid(id);
      } else if (str.length > 0 && str[0] === '=') {
        if (parent !== null) {
          const id = '#' + parent.GetID();
          breath.SetStartid(id);
        } else {
          const tstamp = this.getMeasureEndTstamp(staff - 1);
          breath.SetTstamp(tstamp.getFloat());
        }
      } else {
        const tstamp = this.getMeasureTstamp(token, staff - 1);
        if (parent !== null) {
          const id = '#' + parent.GetID();
          breath.SetStartid(id);
        } else {
          breath.SetTstamp(tstamp.getFloat());
        }
      }
      this.setLocationId(breath, token);

      const direction = this.getDirection(str, ',');
      if (direction < 0) {
        this.setPlaceRelStaff(breath, 'below', false);
      } else if (direction > 0) {
        this.setPlaceRelStaff(breath, 'above', false);
      } else if (layer === 1) {
        this.setPlaceRelStaff(breath, 'above', false);
      } else if (layer === 2) {
        this.setPlaceRelStaff(breath, 'below', false);
      } else {
        this.setPlaceRelStaff(breath, 'above', false);
      }
    }
  }

  public addArpeggio(object: VrvObject, token: HTok): void {
    const str = token.toString();
    let arpTokens: HTok[] = [];
    if (str.indexOf('::') !== -1) {
      if (!this.isLeftmostSystemArpeggio(token)) return;
      arpTokens = this.getSystemArpeggioTokens(token);
    }
    else if (str.indexOf(':') !== -1) {
      if (!this.isLeftmostStaffArpeggio(token)) return;
      arpTokens = this.getStaffArpeggioTokens(token);
    }
    else return;
    const arpeg = new Arpeg();
    this.addChildMeasureOrSection(arpeg);
    // C++: no staff attachment; first ref is the triggering note/chord object ID.
    this.setLocationId(arpeg, token);
    const firstid = (object as unknown as { GetID(): string }).GetID();
    arpeg.AddRef('#' + firstid);
    for (const earp of arpTokens) {
      const nextid = earp.toString().indexOf(' ') !== -1
        ? this.getLocationId('chord', earp)
        : this.getLocationId('note', earp);
      arpeg.AddRef('#' + nextid);
    }
  }

  public addHairpinAccent(token: HTok): void {
    const sigHairpin = this.m_signifiers.hairpinAccent;
    if (sigHairpin === '') return;
    const tokStr = token.toString();
    const pos = tokStr.indexOf(sigHairpin);
    if (pos === -1) return;

    let position = -1;
    let setpos = false;
    if (pos < tokStr.length - 1) {
      if (this.m_signifiers.above !== '' && tokStr.substring(pos + 1, pos + 1 + this.m_signifiers.above.length) === this.m_signifiers.above) {
        position = 1;
        setpos = true;
      }
    }

    const track = token.getTrack();
    const staffindex = this.m_rkern[track] ?? 0;

    const dir = new Dir();
    this.setStaff(dir, this.m_currentstaff);
    this.setLocationId(dir, token);
    const tstamp = this.getMeasureTstamp(token, staffindex);
    dir.SetTstamp(tstamp.getFloat());

    if (position > 0) {
      this.setPlaceRelStaff(dir, 'above', setpos);
      this.addChildBackMeasureOrSection(dir);
    } else if (position < 0) {
      this.setPlaceRelStaff(dir, 'below', setpos);
      this.addChildBackMeasureOrSection(dir);
    } else {
      this.addChildBackMeasureOrSection(dir);
    }

    const rend = new Rend();
    dir.AddChild(rend);
    this.addTextElement(rend, '<>');
  }

  public addExplicitStemDirection(ftrem: FTrem, start: HTok): void {
    let direction = 0;
    let showplace = false;
    const s = start.toString();
    if (s.indexOf('/') !== -1) {
      direction = 1;
    } else if (s.indexOf('\\') !== -1) {
      direction = -1;
    }

    if (direction === 0) {
      // C++ addExplicitStemDirection (iohumdrum.cpp ~15424): stem direction
      // on the first tremolo beam ([LJkK]+) with an above/below signifier.
      if (this.m_signifiers.above !== '') {
        const re = new RegExp('[LJkK]+' + this.m_signifiers.above.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (re.test(s)) { direction = 1; showplace = true; }
      } else if (this.m_signifiers.below !== '') {
        const re = new RegExp('[LJkK]+' + this.m_signifiers.below.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (re.test(s)) { direction = -1; showplace = true; }
      }
    }

    if (direction === 0) return;

    if (this.m_signifiers.above !== '' && s.indexOf(this.m_signifiers.above) !== -1) {
      showplace = true;
    }
    if (this.m_signifiers.below !== '' && s.indexOf(this.m_signifiers.below) !== -1) {
      showplace = true;
    }

    for (let i = 0; i < ftrem.GetChildCount(ClassId.UNSPECIFIED); i++) {
      const child = ftrem.GetChild(i);
      if (child instanceof Note) {
        if (direction > 0) child.SetStemDir(STEMDIRECTION_up);
        else child.SetStemDir(STEMDIRECTION_down);
        if (showplace && this.m_humtype) this.appendTypeTag(child, 'placed');
      } else if (child instanceof Chord) {
        if (direction > 0) child.SetStemDir(STEMDIRECTION_up);
        else child.SetStemDir(STEMDIRECTION_down);
        if (showplace && this.m_humtype) this.appendTypeTag(child, 'placed');
      }
    }
  }

  public assignAutomaticStem(element: Note | Chord, tok: HTok, staffindex: number): void {
    const ss = this.m_staffstates;
    if (staffindex < 0 || staffindex >= ss.length || !ss[staffindex]) return;
    const value = ss[staffindex].stem_type?.[this.m_currentlayer] ?? ' ';
    if (value !== 'X') {
      const hasstem = tok.hasStemDirection();
      if (hasstem === '') {
        switch (value) {
          case '/': element.SetStemDir(STEMDIRECTION_up); break;
          case '\\': element.SetStemDir(STEMDIRECTION_down); break;
          case 'x': element.SetStemVisible(BOOLEAN_false); break;
        }
      }
    }
    const visible = ss[staffindex].stem_visible?.[this.m_currentlayer] ?? true;
    if (!visible) {
      element.SetStemVisible(BOOLEAN_false);
    }
  }

  public addArticulations(element: Note | Chord, token: HTok): void {
    const ss = this.m_staffstates;
    const staffindex = this.m_rkern[token.getTrack()] ?? 0;

    const articcount = new Array(128).fill(0);
    const articloc = new Array(128).fill(0);
    const articpos = new Array(128).fill(0);
    const showpos = new Array(128).fill(false);
    const articges = new Array(128).fill(0);
    let textTenuto = false;
    let textTenutoBelow = false;

    let nohidden = token.toString();
    if (nohidden.indexOf('yy') !== -1) {
      const tstrings = token.getSubtokens();
      nohidden = '';
      let counter = 0;
      for (let i = 0; i < tstrings.length; ++i) {
        if (tstrings[i].indexOf('yy') !== -1) continue;
        if (counter > 0) nohidden += ' ';
        nohidden += tstrings[i];
        counter++;
      }
    }

    const tsize = nohidden.length;
    for (let i = 0; i < tsize; ++i) {
      let ch = nohidden[i];
      const nextch = i < tsize - 1 ? nohidden[i + 1] : '\0';
      if (ch === 'o' && nextch === 'y') continue;
      let intch = ch.charCodeAt(0);
      if (intch < 0 || intch > 127) continue;
      if (ch >= '0' && ch <= '9') continue;

      let posch = i < tsize - 1 ? nohidden[i + 1] : '';
      let poschstr = posch;

      if (ch === '^' && posch === '^') {
        ch = String.fromCharCode(6);
        intch = 6;
        articloc[intch] = i + 1;
        posch = i < tsize - 2 ? nohidden[i + 2] : 'g';
        poschstr = posch;
        i++;
      }
      if (ch === '"' && posch === '"') {
        ch = String.fromCharCode(9);
        intch = 9;
        articloc[intch] = i + 1;
        posch = i < tsize - 2 ? nohidden[i + 2] : 'g';
        poschstr = posch;
        if (poschstr === this.m_signifiers.below) articpos[intch] = -1;
        else if (poschstr === this.m_signifiers.above) articpos[intch] = 1;
        i++;
        continue;
      } else if (ch === '\'' && posch === '\'') {
        ch = '`';
        intch = ch.charCodeAt(0);
        posch = i < tsize - 2 ? nohidden[i + 2] : 'g';
        poschstr = posch;
        i++;
      } else if (ch === '~' && posch === '~') {
        textTenuto = true;
        i++;
        posch = i < tsize - 1 ? nohidden[i + 1] : '';
        poschstr = posch;
        if (this.m_signifiers.below !== '' && poschstr === this.m_signifiers.below) {
          textTenutoBelow = true;
        }
        continue;
      }

      if (this.m_signifiers.verticalStroke !== '' && this.m_signifiers.verticalStroke[0] === ch) {
        ch = String.fromCharCode(7);
        intch = 7;
      }
      if (this.m_signifiers.lhpizz !== '' && this.m_signifiers.lhpizz[0] === ch) {
        ch = String.fromCharCode(8);
        intch = 8;
      }
      articloc[intch] = i + 1;
      if (nextch === 'X') {
        articcount[intch]++;
      }

      if (posch !== '') {
        const pos2ch = i < tsize - 2 ? nohidden[i + 2] : '';
        const pos3ch = i < tsize - 3 ? nohidden[i + 3] : '';
        if (posch === 'y' && pos2ch !== 'y') {
          articges[intch] = 1;
        } else if (this.m_signifiers.above !== '' && poschstr === this.m_signifiers.above && pos2ch === 'y' && pos3ch !== 'y') {
          articges[intch] = 1;
        } else if (this.m_signifiers.below !== '' && poschstr === this.m_signifiers.below && pos2ch === 'y' && pos3ch !== 'y') {
          articges[intch] = 1;
        }
      }

      if (poschstr !== '' && poschstr === this.m_signifiers.above) {
        articpos[intch] = 1;
        showpos[intch] = true;
      } else if (poschstr !== '' && poschstr === this.m_signifiers.below) {
        articpos[intch] = -1;
        showpos[intch] = true;
      }
    }

    if (textTenuto) {
      const text = 'ten.';
      const placement = textTenutoBelow ? 'below' : 'above';
      this.addDirection(text, placement, false, true, token, staffindex, 0, '', 0);
    }

    const artics: number[] = [];
    const positions: number[] = [];
    const gestural: number[] = [];
    const counts: number[] = [];
    const showingpositions: boolean[] = [];

    const charCodes = [
      '\''.charCodeAt(0), '`'.charCodeAt(0), '~'.charCodeAt(0),
      6, 7, 8, 9,
      '^'.charCodeAt(0), 'o'.charCodeAt(0), 'v'.charCodeAt(0), 'u'.charCodeAt(0),
    ];
    const articTypes = [
      ARTICULATION_stacc, ARTICULATION_stacciss, ARTICULATION_ten,
      ARTICULATION_marc, ARTICULATION_stroke, ARTICULATION_lhpizz, ARTICULATION_snap,
      ARTICULATION_acc, ARTICULATION_harm, ARTICULATION_upbow, ARTICULATION_dnbow,
    ];

    for (let k = 0; k < charCodes.length; ++k) {
      const c = charCodes[k];
      if (articloc[c]) {
        artics.push(articTypes[k]);
        positions.push(articpos[c]);
        gestural.push(articges[c]);
        counts.push(articcount[c]);
        showingpositions.push(showpos[c]);
      }
    }

    if (artics.length === 0) return;

    const color = this.getLoColor(token, 'ART');
    for (let i = 0; i < artics.length; ++i) {
      const numReps = counts[i] > 0 ? counts[i] : 1;
      for (let j = 0; j < numReps; j++) {
        const artic = new Artic();
        element.AddChild(artic);

        if (artics.length > 1) {
          this.setLocationId(artic, token, i + 1);
        } else {
          this.setLocationId(artic, token);
        }
        if (counts[i] > 0) {
          artic.SetID(artic.GetID() + 'N' + String(j + 1));
        }
        if (color !== '') {
          artic.SetColor(color);
        }
        if (gestural[i]) {
          continue;
        }
        if (staffindex < ss.length && ss[staffindex].suppress_articulations) {
          continue;
        } else {
          artic.SetArtic([artics[i]]);
        }
        if (positions[i] > 0) {
          this.setPlaceRelEvent(artic, 'above', positions[i]);
        } else if (positions[i] < 0) {
          this.setPlaceRelEvent(artic, 'below', positions[i]);
        }
      }
    }
  }

  public setWrittenAccidentalUpper(element: { SetAccidupper(v: number): void }, value: string): void {
    if (value === 'none') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_NONE);
    } else if (value === '#') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_s);
    } else if (value === '-') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_f);
    } else if (value === 'n') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_n);
    } else if (value === 'n-') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_nf);
    } else if (value === 'n#') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_ns);
    } else if (value === '--') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_ff);
    } else if (value === '##') {
      element.SetAccidupper(ACCIDENTAL_WRITTEN_x);
    }
  }

  public setWrittenAccidentalLower(element: { SetAccidlower(v: number): void }, value: string): void {
    if (value === 'none') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_NONE);
    } else if (value === '#') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_s);
    } else if (value === '-') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_f);
    } else if (value === 'n') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_n);
    } else if (value === 'n-') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_nf);
    } else if (value === 'n#') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_ns);
    } else if (value === '--') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_ff);
    } else if (value === '##' || value === 'x') {
      element.SetAccidlower(ACCIDENTAL_WRITTEN_x);
    }
  }

  public addOrnamentMarkers(token: HTok): void {
    if (token.toString().indexOf('O') !== -1) {
      token.setValue('LO', 'TX', 't', '*');
      token.setValue('LO', 'TX', 'a', 'true');
    }
  }

  public addTrill(linked: VrvObject, token: HTok): void {
    let subtok = 0;
    let tpos = -1;
    const tokstr = token.toString();
    for (let i = 0; i < tokstr.length; ++i) {
      if (tokstr[i] === ' ') {
        subtok++;
        continue;
      }
      if (tokstr[i] === 't' || tokstr[i] === 'T') {
        tpos = i;
        if (i < tokstr.length - 1) {
          if (tokstr[i + 1] === 't' || tokstr[i + 1] === 'T') {
            tpos++;
          }
        }
        break;
      }
    }
    if (tpos === -1) return;

    if (tokstr.indexOf('TTT') !== -1) return;
    if (tokstr.indexOf('ttt') !== -1) return;

    if (subtok === 0 && tokstr.indexOf(' ') === -1) {
      subtok = -1;
    }

    const staff = this.getNoteStaff(token, this.m_currentstaff);

    const trill = new Trill();
    this.addChildMeasureOrSection(trill);
    this.setStaff(trill, staff);

    const staffindex = this.m_currentstaff - 1;
    const layer = this.m_currentlayer;
    if (layer === 2) {
      this.setPlaceRelStaff(trill, 'below', false);
    }

    trill.SetStartid('#' + linked.GetID());
    this.setLocationId(trill, token, subtok);

    if (this.m_signifiers.above !== '') {
      if (tpos < tokstr.length - 1) {
        if (tokstr.substring(tpos + 1, tpos + 1 + this.m_signifiers.above.length) === this.m_signifiers.above) {
          this.setPlaceRelStaff(trill, 'above', true);
        }
      }
    }
    if (this.m_signifiers.below !== '') {
      if (tpos < tokstr.length - 1) {
        if (tokstr.substring(tpos + 1, tpos + 1 + this.m_signifiers.below.length) === this.m_signifiers.below) {
          this.setPlaceRelStaff(trill, 'below', true);
        }
      }
    }

    let tokindex = subtok;
    if (tokindex < 0) tokindex = 0;
    const accid = token.getValue('auto', String(tokindex), 'trillAccidental');
    if (accid !== '') {
      const accidval = parseInt(accid, 10);
      switch (accidval) {
        case -1: trill.SetAccidupper(ACCIDENTAL_WRITTEN_f); break;
        case 0: trill.SetAccidupper(ACCIDENTAL_WRITTEN_n); break;
        case 1: trill.SetAccidupper(ACCIDENTAL_WRITTEN_s); break;
        case -2: trill.SetAccidupper(ACCIDENTAL_WRITTEN_ff); break;
        case 2: trill.SetAccidupper(ACCIDENTAL_WRITTEN_x); break;
      }
    }

    const lcount = token.getLinkedParameterSetCount();
    let foundQ = false;
    let value = '';
    for (let p = 0; p < lcount; ++p) {
      const hps = token.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO' || hps.getNamespace2() !== 'TR') continue;
      for (let q = 0; q < hps.getCount(); ++q) {
        const key = hps.getParameterName(q);
        if (key === 'acc') {
          value = hps.getParameterValue(q);
          foundQ = true;
          break;
        }
      }
      if (foundQ) break;
    }

    if (foundQ) {
      if (value === 'none') {
        trill.SetAccidupper(ACCIDENTAL_WRITTEN_NONE);
      } else if (value === '#') {
        trill.SetAccidupper(ACCIDENTAL_WRITTEN_s);
      } else if (value === '-') {
        trill.SetAccidupper(ACCIDENTAL_WRITTEN_f);
      } else if (value === 'n') {
        trill.SetAccidupper(ACCIDENTAL_WRITTEN_n);
      } else if (value === '--') {
        trill.SetAccidupper(ACCIDENTAL_WRITTEN_ff);
      } else if (value === '##') {
        trill.SetAccidupper(ACCIDENTAL_WRITTEN_x);
      }
    }

    if (tokstr.indexOf('TT') === -1 && tokstr.indexOf('tt') === -1) {
      return;
    }

    let endtok: HTp = token.getNextToken();
    let lasttok: HTp = token;
    let lastnote: HTp = token;
    let lastnoteorbar: HTp = token;
    let bartok: HTp = null;
    let barlinecount = 0;
    let foundbarline = false;
    let nextnoteafterbarline = false;

    while (endtok !== null) {
      if (endtok.isBarline()) {
        foundbarline = true;
        nextnoteafterbarline = true;
        bartok = endtok;
        barlinecount++;
        lastnoteorbar = endtok;
      }
      if (!endtok.isData()) {
        endtok = endtok.getNextToken();
        nextnoteafterbarline = false;
        continue;
      }
      if (endtok.isNull()) {
        endtok = endtok.getNextToken();
        continue;
      }
      if (endtok.isGrace()) {
        let ntok: HTp = endtok.getNextToken();
        while (ntok !== null) {
          if (ntok.isBarline()) {
            lastnoteorbar = ntok;
          }
          if (!ntok.isData()) {
            ntok = ntok.getNextToken();
            continue;
          }
          if (ntok.isGrace()) {
            ntok = ntok.getNextToken();
            continue;
          }
          lastnoteorbar = ntok;
          lastnote = ntok;
          const ntokstr = ntok.toString();
          if (ntokstr.indexOf('TTT') === -1 && ntokstr.indexOf('ttt') === -1) {
            break;
          }
          ntok = ntok.getNextToken();
        }
      }
      lastnoteorbar = endtok;
      lastnote = endtok;
      const endtokstr = endtok.toString();
      if (endtokstr.indexOf('TTT') === -1 && endtokstr.indexOf('ttt') === -1) {
        break;
      }
      lasttok = endtok;
      endtok = endtok.getNextToken();
    }

    if (endtok === null && lastnoteorbar !== null && lastnoteorbar.isBarline() && bartok !== null) {
      let tstamp2 = this.getMeasureTstampPlusDur(bartok, staffindex);
      const ss = this.m_staffstates;
      const mfactor = (ss[staffindex]?.meter_bottom) ? ss[staffindex].meter_bottom.div(4) : new HumNum(1);
      tstamp2 = tstamp2.add(mfactor);
      let measures = this.getMeasureDifference(token, bartok);
      measures--;
      trill.SetTstamp2([measures, tstamp2.getFloat()]);
      return;
    }

    if (endtok === null && lastnoteorbar !== null && lastnoteorbar.isData() && lastnote !== null && bartok !== null) {
      const tstamp2 = this.getMeasureTstampPlusDur(lastnote, staffindex);
      const measures = this.getMeasureDifference(token, bartok);
      trill.SetTstamp2([measures, tstamp2.getFloat()]);
      return;
    }

    if (endtok === null) return;

    const isgracenote = endtok.toString().indexOf('q') !== -1;
    const isrest = endtok.isRest();

    if (isgracenote) {
      trill.SetEndid('#' + this.getLocationId('note', endtok, -1));
    } else if (isrest && !foundbarline && lasttok !== null) {
      const tstamp2 = this.getMeasureTstampPlusDur(lasttok, staffindex);
      const measures = this.getMeasureDifference(token, lasttok);
      trill.SetTstamp2([measures, tstamp2.getFloat()]);
    } else if (foundbarline && barlinecount === 1 && nextnoteafterbarline && bartok !== null) {
      const prev = bartok.getPreviousToken();
      if (prev !== null) {
        const tstamp2 = this.getMeasureTstampPlusDur(prev, staffindex);
        trill.SetTstamp2([0, tstamp2.getFloat()]);
      }
    } else if (lasttok !== null) {
      const tstamp2 = this.getMeasureTstampPlusDur(lasttok, staffindex);
      const measures = this.getMeasureDifference(token, lasttok);
      trill.SetTstamp2([measures, tstamp2.getFloat()]);
    }
  }

  public addMordent(linked: VrvObject, token: HTok): void {
    const subtoks = token.getSubtokens();
    if (subtoks.length === 0) return;

    const subtrack = token.getSubtrack();
    const mindex: number[] = [];
    const mstring: string[] = [];
    const mpitch: number[] = [];

    const hre = new HumRegex();
    let query = '([wWmM]+[y';
    if (this.m_signifiers.above !== '') query += this.m_signifiers.above;
    if (this.m_signifiers.below !== '') query += this.m_signifiers.below;
    query += ']*)';

    for (let i = 0; i < subtoks.length; ++i) {
      if (subtoks[i].indexOf('r') !== -1) continue;
      if (!hre.search(subtoks[i], query)) continue;
      const match = hre.getMatch(1);
      if (match.indexOf('y') !== -1) continue;
      mindex.push(i);
      mstring.push(match);
      mpitch.push(kernToBase40(subtoks[i]));
    }

    if (mindex.length === 0) return;

    let highest = mpitch[0];
    let lowest = mpitch[0];
    for (let i = 1; i < mpitch.length; ++i) {
      if (highest < mpitch[i]) highest = mpitch[i];
      if (lowest > mpitch[i]) lowest = mpitch[i];
    }

    const mplace: number[] = new Array(mindex.length).fill(0);
    if (subtrack > 0) {
      if (subtrack % 2) {
        mplace.fill(1);
      } else {
        mplace.fill(-1);
      }
    } else {
      if (mindex.length === 1) {
        mplace[0] = 1;
      } else if (mindex.length === 2) {
        if (highest === mpitch[0]) {
          mplace[0] = 1;
          mplace[1] = -1;
        } else {
          mplace[0] = -1;
          mplace[1] = 1;
        }
      } else {
        mplace.fill(1);
      }
    }

    const staff = this.getNoteStaff(token, this.m_currentstaff);

    for (let i = 0; i < mindex.length; ++i) {
      if (mstring[i] === '') continue;
      let direction = mplace[i];
      if (this.m_signifiers.above !== '' && mstring[i].indexOf(this.m_signifiers.above) !== -1) {
        direction = 1;
      }
      if (this.m_signifiers.below !== '' && mstring[i].indexOf(this.m_signifiers.below) !== -1) {
        direction = -1;
      }

      const lowerQ = mstring[i][0] === 'w' || mstring[i][0] === 'W';

      const mordent = new Mordent();
      this.addChildMeasureOrSection(mordent);
      this.setStaff(mordent, staff);

      let subtok = mindex[i];
      if (mindex.length === 1) subtok = -1;
      mordent.SetStartid('#' + linked.GetID());
      this.setLocationId(mordent, token, subtok);

      if (lowerQ) {
        mordent.SetForm(mordentLog_FORM_lower);
      } else {
        mordent.SetForm(mordentLog_FORM_upper);
      }

      if (direction < 0) {
        this.setPlaceRelStaff(mordent, 'below', false);
      } else if (direction > 0) {
        this.setPlaceRelStaff(mordent, 'above', false);
      }

      let tokindex = subtok;
      if (tokindex < 0) tokindex = 0;

      if (mstring[i].indexOf('w') !== -1 || mstring[i].indexOf('W') !== -1) {
        const accid = token.getValue('auto', String(tokindex), 'mordentLowerAccidental');
        if (accid !== '') {
          const accidval = parseInt(accid, 10);
          switch (accidval) {
            case -1: mordent.SetAccidlower(ACCIDENTAL_WRITTEN_f); break;
            case 0: mordent.SetAccidlower(ACCIDENTAL_WRITTEN_n); break;
            case 1: mordent.SetAccidlower(ACCIDENTAL_WRITTEN_s); break;
            case -2: mordent.SetAccidlower(ACCIDENTAL_WRITTEN_ff); break;
            case 2: mordent.SetAccidlower(ACCIDENTAL_WRITTEN_x); break;
          }
        }
      } else {
        const accid = token.getValue('auto', String(tokindex), 'mordentUpperAccidental');
        if (accid !== '') {
          const accidval = parseInt(accid, 10);
          switch (accidval) {
            case -1: mordent.SetAccidupper(ACCIDENTAL_WRITTEN_f); break;
            case 0: mordent.SetAccidupper(ACCIDENTAL_WRITTEN_n); break;
            case 1: mordent.SetAccidupper(ACCIDENTAL_WRITTEN_s); break;
            case -2: mordent.SetAccidupper(ACCIDENTAL_WRITTEN_ff); break;
            case 2: mordent.SetAccidupper(ACCIDENTAL_WRITTEN_x); break;
          }
        }
      }

      if (hre.search(mstring[i], 'MM|WW', 'i')) {
        mordent.SetLong(BOOLEAN_true);
      }

      let acctext = token.getLayoutParameter('MOR', 'acc');
      if (acctext !== '' && acctext !== 'true') {
        if (acctext === 'false') acctext = 'none';
        if (lowerQ) {
          this.setWrittenAccidentalLower(mordent, acctext);
        } else {
          this.setWrittenAccidentalUpper(mordent, acctext);
        }
      }
    }
  }

  public addTurn(token: HTok, tok: string, noteIndex: number): void {
    let turnstart = -1;
    let turnend = -1;

    for (let i = 0; i < tok.length; ++i) {
      if (tok[i] === 's' || tok[i] === 'S' || tok[i] === '$') {
        turnstart = i;
        turnend = i;
        for (let j = i + 1; j < tok.length; j++) {
          if (!(tok[j] === 's' || tok[j] === 'S' || tok[j] === '$')) {
            turnend = j - 1;
            break;
          } else {
            turnend = j;
          }
        }
        break;
      }
    }

    if (turnstart === -1) return;

    let singleQ = false;
    if (turnstart === turnend) {
      LogWarning(`In HumdrumInput::addTurn: Single turn character on line ${token.getLineNumber()}, field ${token.getFieldNumber()}.`);
      singleQ = true;
    }

    const turnstr = tok.substring(turnstart, turnend + 1);
    if (turnstr === '') return;

    const delayedQ = turnstr[0] !== 's';
    if (!delayedQ && turnstr.length === 1) return;

    let invertedQ = false;
    if (turnstr.length > 1 && ((!delayedQ && turnstr[1] === '$') || turnstr[0] === '$')) {
      invertedQ = true;
    }

    const staff = this.getNoteStaff(token, this.m_currentstaff);

    const turn = new Turn();
    this.addChildMeasureOrSection(turn);
    this.setStaff(turn, staff);
    if (singleQ) {
      turn.SetColor('red');
    }

    if (delayedQ) {
      turn.SetDelayed(BOOLEAN_true);
    }

    const noteid = this.getLocationId('note', token, noteIndex);
    turn.SetStartid('#' + noteid);

    turn.SetForm(invertedQ ? turnLog_FORM_lower : turnLog_FORM_upper);

    const tokstr = token.toString();
    if (this.m_signifiers.above !== '') {
      if (turnend < tokstr.length - 1) {
        if (tokstr.substring(turnend + 1, turnend + 1 + this.m_signifiers.above.length) === this.m_signifiers.above) {
          this.setPlaceRelStaff(turn, 'above', true);
        }
      }
    }
    if (this.m_signifiers.below !== '') {
      if (turnend < tokstr.length - 1) {
        if (tokstr.substring(turnend + 1, turnend + 1 + this.m_signifiers.below.length) === this.m_signifiers.below) {
          this.setPlaceRelStaff(turn, 'below', true);
        }
      }
    }

    let tokindex = noteIndex;
    if (tokindex < 0) tokindex = 0;

    let loweraccid = token.getValue('auto', String(tokindex), 'turnLowerAccidental');
    let upperaccid = token.getValue('auto', String(tokindex), 'turnUpperAccidental');

    const mapAccid = (acc: string): string => {
      switch (acc) {
        case '1': return '#';
        case '-1': return '-';
        case '0': return 'n';
        case '3': return '#x';
        case '-3': return '---';
        case '2': return 'x';
        case '-2': return '--';
        default: return acc;
      }
    };

    if (loweraccid !== '') loweraccid = mapAccid(loweraccid);
    if (upperaccid !== '') upperaccid = mapAccid(upperaccid);

    const lacctext = token.getLayoutParameter('TURN', 'lacc');
    const uacctext = token.getLayoutParameter('TURN', 'uacc');

    if (lacctext !== '') {
      if (lacctext === 'none' || lacctext === 'true') loweraccid = 'none';
      else loweraccid = lacctext;
    }
    if (uacctext !== '') {
      if (uacctext === 'false' || uacctext === 'true') upperaccid = 'none';
      else upperaccid = uacctext;
    }

    const text = token.getLayoutParameter('TURN', 'facc');
    if (text === 'true') {
      const tval = loweraccid;
      loweraccid = upperaccid;
      upperaccid = tval;
    }

    if (loweraccid !== '') {
      this.setWrittenAccidentalLower(turn, loweraccid);
    }
    if (upperaccid !== '') {
      this.setWrittenAccidentalUpper(turn, upperaccid);
    }
  }

  public addOrnaments(object: VrvObject, token: HTok): void {
    const subtoks = token.getSubtokens();
    for (let t = 0; t < subtoks.length; t++) {
      const chartable = new Array(128).fill(false);
      const str = subtoks[t];
      for (let i = 0; i < str.length; ++i) {
        const intch = str.charCodeAt(i);
        if (intch < 0 || intch > 127) continue;
        chartable[intch] = true;
      }
      if (chartable['T'.charCodeAt(0)] || chartable['t'.charCodeAt(0)]) {
        this.addTrill(object, token);
      }
      if (chartable[';'.charCodeAt(0)]) {
        this.addFermata(token, object);
      }
      if (chartable[','.charCodeAt(0)]) {
        this.addBreath(token, object);
      }
      if (chartable['W'.charCodeAt(0)] || chartable['w'.charCodeAt(0)] || chartable['M'.charCodeAt(0)] || chartable['m'.charCodeAt(0)]) {
        this.addMordent(object, token);
      }
      if (chartable['s'.charCodeAt(0)] || chartable['S'.charCodeAt(0)] || chartable['$'.charCodeAt(0)]) {
        this.addTurn(token, subtoks[t], subtoks.length > 1 ? t : -1);
      }
    }
    this.addOrnamentMarkers(token);
  }

  public checkIfSlurIsInvisible(stoken: HTok, snumber: number, etoken: HTok, _enumber: number): boolean {
    const sstr = stoken.toString();
    const tsize = sstr.length;
    let counter = 0;
    let hasy = false;
    let hasX = false;

    for (let i = 0; i < tsize - 1; ++i) {
      if (sstr[i] === '(') {
        counter++;
      } else {
        continue;
      }
      if (counter === snumber) {
        if (sstr[i + 1] === 'y') {
          hasy = true;
        } else if (sstr[i + 1] === 'X') {
          hasX = true;
        }
      }
    }

    if (hasy) return true;
    if (hasX) return false;

    const estr = etoken.toString();
    if (sstr.indexOf('yy') !== -1 && estr.indexOf('yy') !== -1) {
      const schord = stoken.isChord();
      const echord = etoken.isChord();
      if (!(schord || echord)) {
        return true;
      }

      const scount = stoken.getSubtokenCount();
      const ecount = etoken.getSubtokenCount();

      let syycount = 0;
      let eyycount = 0;

      if (scount === 1) {
        if (sstr.indexOf('yy') !== -1) {
          syycount = 1;
        } else {
          for (let i = 1; i < sstr.length; ++i) {
            if (sstr[i] === 'y' && sstr[i - 1] === 'y') {
              syycount++;
              i++;
            }
          }
        }
      }

      if (ecount === 1) {
        if (estr.indexOf('yy') !== -1) {
          eyycount = 1;
        } else {
          for (let i = 1; i < estr.length; ++i) {
            if (estr[i] === 'y' && estr[i - 1] === 'y') {
              eyycount++;
              i++;
            }
          }
        }
      }

      if (scount === syycount && ecount === eyycount) {
        return true;
      }
    }

    return false;
  }

  public generateSlurId(token: HTok, count: number, num: number): string {
    let id: string;
    if (token.isChord()) {
      id = 'chord-L';
    } else {
      id = 'note-L';
    }
    id += String(token.getLineNumber());
    id += 'F';
    id += String(token.getFieldNumber());
    token.setValue('MEI', 'xml:id', id);
    if (count > 1) {
      id += 'N' + String(num);
    }
    return id;
  }

  public setSlurLocationId(
    object: VrvObject, slurstart: HTok, slurend: HTok, slurstartnumber: number, prefix = '',
  ): void {
    const startline = slurstart.getLineNumber();
    const startfield = slurstart.getFieldNumber();
    let id = prefix !== '' ? prefix.toLowerCase() : object.GetClassName().toLowerCase();
    id += '-L' + String(startline);
    id += 'F' + String(startfield);
    const startcount = slurstart.getValueInt('auto', 'slurStartCount');
    const endcount = slurend.getValueInt('auto', 'slurEndCount');

    let tag = 'slurEndNumber';
    if (slurstartnumber > 1) {
      tag += String(slurstartnumber);
    }
    const slurendnumber = slurstart.getValueInt('auto', tag);

    if (startcount > 1) {
      id += 'N' + String(slurstartnumber);
    }

    const endline = slurend.getLineNumber();
    const endfield = slurend.getFieldNumber();

    id += '-L' + String(endline);
    id += 'F' + String(endfield);

    if (endcount > 1) {
      id += 'N' + String(slurendnumber);
    }

    object.SetID(id);
  }

  public addSlurLineStyle(element: Slur, token: HTok, slurnumber: number): void {
    if (slurnumber < 2) {
      slurnumber = 1;
    }
    const slurindex = slurnumber - 1;
    const dashed = token.getLayoutParameter('S', 'dash', slurindex);
    const dotted = token.getLayoutParameter('S', 'dot', slurindex);
    if (dotted !== '') {
      element.SetLform(LINEFORM_dotted);
    } else if (dashed !== '') {
      element.SetLform(LINEFORM_dashed);
    }

    const color = token.getLayoutParameter('S', 'color', slurindex);
    if (color !== '') {
      element.SetColor(color);
    }
  }

  public setLayoutSlurDirection(slur: Slur, token: HTok): void {
    if (this.hasAboveParameter(token, 'S')) {
      slur.SetCurvedir(curvature_CURVEDIR_above);
      this.appendTypeTag(slur, 'placed');
    } else if (this.hasBelowParameter(token, 'S')) {
      slur.SetCurvedir(curvature_CURVEDIR_below);
      this.appendTypeTag(slur, 'placed');
    }
  }

  public processSlurs(slurend: HTok): void {
    const hre = new HumRegex();

    const slurendcount = slurend.getValueInt('auto', 'slurEndCount');
    if (slurendcount <= 0) {
      return;
    }

    const slurstartlist: Array<{ first: number; second: HTp }> = new Array(slurendcount + 1);
    for (let i = 1; i <= slurendcount; ++i) {
      slurstartlist[i] = {
        first: slurend.getSlurStartNumber(i),
        second: slurend.getSlurStartToken(i),
      };
    }

    for (let i = 1; i <= slurendcount; ++i) {
      const slurstart = slurstartlist[i].second;
      if (slurstart === null) {
        continue;
      }
      const slurstartnumber = slurstartlist[i].first;
      const slurendnumber = i;
      const slurstartcount = slurstart.getValueInt('auto', 'slurStartCount');

      let mindex: number;
      const mindexstring = slurstart.getValue('MEI', 'measureIndex');
      if (mindexstring === '') {
        mindex = slurend.getValueInt('MEI', 'measureIndex');
      } else {
        mindex = slurstart.getValueInt('MEI', 'measureIndex');
      }

      const isInvisible = this.checkIfSlurIsInvisible(slurstart, slurstartnumber, slurend, slurendnumber);
      if (isInvisible) {
        continue;
      }

      const startmeasure = this.m_measures[mindex] ?? this.m_measure;

      const slur = new Slur();
      this.addSlurLineStyle(slur, slurstart, slurstartnumber);

      let startid = slurstart.getValue('MEI', 'xml:id');
      let endid = slurend.getValue('MEI', 'xml:id');

      if (startid === '') {
        startid = this.generateSlurId(slurstart, slurstartcount, slurstartnumber);
      }
      if (endid === '') {
        endid = this.generateSlurId(slurend, slurendcount, slurendnumber);
      }

      slur.SetStartid('#' + startid);
      slur.SetEndid('#' + endid);
      this.setSlurLocationId(slur, slurstart, slurend, slurstartnumber);

      if (startmeasure !== null) {
        startmeasure.AddChild(slur);
      } else {
        this.addChildMeasureOrSection(slur);
      }

      if (slurstart.getTrack() === slurend.getTrack()) {
        let staff = this.m_currentstaff;
        if (this.m_signifiers.above !== '') {
          let sabove = '[a-g]+[-n#]*[xy]*';
          sabove += this.m_signifiers.above;
          if (hre.search(slurstart.toString(), sabove)) {
            staff--;
            if (staff < 1) {
              staff = 1;
            }
          }
        }
        if (this.m_signifiers.below !== '') {
          let sbelow = '[a-g]+[-n#]*[xy]*';
          sbelow += this.m_signifiers.below;
          if (hre.search(slurstart.toString(), sbelow)) {
            staff++;
          }
        }
        this.setStaff(slur, staff);
      }

      this.setLayoutSlurDirection(slur, slurstart);

      if (slurendnumber < 0) {
        continue;
      }

      if (slurendcount > 1) {
        let found = -1;
        for (let j = 1; j <= slurendcount; j++) {
          if (i === j) continue;
          if (slurstartlist[i].second === slurstartlist[j].second) {
            found = j;
            break;
          }
        }
        if (found > 0) {
          if (found < i) {
            slur.SetCurvedir(curvature_CURVEDIR_above);
          } else {
            slur.SetCurvedir(curvature_CURVEDIR_below);
          }
        }
      }

      const sstr = slurstart.toString();
      if (this.m_signifiers.above !== '') {
        let count = 0;
        for (let k = 0; k < sstr.length - 1; k++) {
          if (sstr[k] === '(') {
            count++;
          }
          if (count === slurstartnumber) {
            if (sstr.substring(k + 1, k + 1 + this.m_signifiers.above.length) === this.m_signifiers.above) {
              slur.SetCurvedir(curvature_CURVEDIR_above);
              this.appendTypeTag(slur, 'placed');
            }
            break;
          }
        }
      }
      if (this.m_signifiers.below !== '') {
        let count = 0;
        for (let k = 0; k < sstr.length - 1; k++) {
          if (sstr[k] === '(') {
            count++;
          }
          if (count === slurstartnumber) {
            if (sstr.substring(k + 1, k + 1 + this.m_signifiers.below.length) === this.m_signifiers.below) {
              slur.SetCurvedir(curvature_CURVEDIR_below);
              this.appendTypeTag(slur, 'placed');
            }
            break;
          }
        }
      }
    }
  }

  public addSlur(ftrem: FTrem, start: HTok, ending: HTok): void {
    const endstr = ending.toString();
    if (endstr.indexOf(')') === -1) return;
    if (endstr.indexOf('J') === -1) return;

    const startstr = start.toString();
    if (startstr.indexOf('(') === -1) {
      this.processSlurs(ending);
      return;
    }
    if (startstr.indexOf('L') === -1) return;

    const firstChild = ftrem.GetChild(0);
    const secondChild = ftrem.GetChild(1);
    if (firstChild === null || secondChild === null) return;
    const firstid = firstChild.GetID();
    const secondid = secondChild.GetID();

    const endline = ending.getLineNumber();
    const endfield = ending.getFieldNumber();
    const lastid = '-L' + String(endline) + 'F' + String(endfield);

    let slurid = firstid + lastid;
    const hre = new HumRegex();
    slurid = hre.replaceCopy(slurid, 'slur', '^note');
    slurid = hre.replaceCopy(slurid, 'slur', '^chord');

    const slur = new Slur();
    slur.SetID(slurid);
    slur.SetStartid('#' + secondid);
    slur.SetEndid('#' + firstid);
    slur.SetCurvedir(curvature_CURVEDIR_above);
    this.setStaff(slur, this.m_currentstaff);
    this.m_ftrem_slurs.push(slur);
  }

  public addFTremSlurs(): void {
    if (this.m_ftrem_slurs.length === 0) return;
    if (this.m_measure === null) return;
    for (let i = 0; i < this.m_ftrem_slurs.length; ++i) {
      this.addChildBackMeasureOrSection(this.m_ftrem_slurs[i]);
    }
    this.m_ftrem_slurs = [];
  }

  public extractPhraseNoteAttachmentInformation(
    data: Array<{ first: number; second: boolean }>, token: HTok, phrasetype: string,
  ): void {
    data.length = 0;
    let subtokindex = 0;
    let phrasenumber = 0;
    const tokstr = token.toString();
    const toksize = tokstr.length;
    for (let i = 0; i < toksize; ++i) {
      if (tokstr[i] === ' ') {
        subtokindex++;
      } else if (tokstr[i] === '}') {
        phrasenumber++;
        if (phrasetype === '}') {
          const notestate = this.getNoteStatePhrase(token, phrasenumber);
          data.push({ first: subtokindex, second: notestate });
        }
      } else if (tokstr[i] === '{') {
        phrasenumber++;
        if (phrasetype === '{') {
          const notestate = this.getNoteStatePhrase(token, phrasenumber);
          data.push({ first: subtokindex, second: notestate });
        }
      }
    }
  }

  public getNoteStatePhrase(token: HTok, phrasenumber: number): boolean {
    const data = token.getPhraseLayoutParameter('note', phrasenumber - 1);
    return data === 'true';
  }

  public calculateNoteIdForSlur(idstringRef: { value: string }, sortednotes: Array<{ first: number; second: number }>, _index: number): void {
    const notecount = sortednotes.length;
    if (notecount === 1) {
      const hre = new HumRegex();
      idstringRef.value = hre.replaceCopy(idstringRef.value, 'note-', 'chord-');
    }
  }

  /** C++ HumdrumInput::extractSlurNoteAttachmentInformation: vector of
   *  {subtoken index, attached-to-note} for each slur of the requested type. */
  public extractSlurNoteAttachmentInformation(
    data: Array<{ first: number; second: boolean }>, token: HTok, slurtype: string,
  ): void {
    data.length = 0;
    let subtokindex = 0;
    let slurnumber = 0;
    const tokstr = token.toString();
    const toksize = tokstr.length;
    for (let i = 0; i < toksize; ++i) {
      if (tokstr[i] === ' ') {
        subtokindex++;
      } else if (tokstr[i] === ')') {
        slurnumber++;
        if (slurtype === ')') {
          const notestate = this.getNoteStateSlur(token, slurnumber);
          data.push({ first: subtokindex, second: notestate });
        }
      } else if (tokstr[i] === '(') {
        slurnumber++;
        if (slurtype === '(') {
          const notestate = this.getNoteStateSlur(token, slurnumber);
          data.push({ first: subtokindex, second: notestate });
        }
      }
    }
  }

  /** C++ HumdrumInput::getNoteStateSlur: LO:S note attachment for one slur. */
  public getNoteStateSlur(token: HTok, slurnumber: number): boolean {
    const data = token.getSlurLayoutParameter('note', slurnumber - 1);
    return data === 'true';
  }

  /** C++ HumdrumInput::getSlurEndNumber: `auto` slurEndNumber[<n>] value. */
  public getSlurEndNumber(startslur: HTok, slurstartnumber: number): number {
    let n = slurstartnumber;
    if (n < 1) n = 1;
    const startcount = startslur.getValueInt('auto', 'slurStartCount');
    let parameter = 'slurEndNumber';
    if (startcount > 1) parameter += String(n);

    return startslur.getValueInt('auto', parameter);
  }

  public phraseIsInvisible(token: HTok, pindex: number): boolean {
    const none = token.getLayoutParameter('P', 'none', pindex);
    if (none !== '') return true;

    let style = token.getLayoutParameter('P', 'brack', pindex);
    if (style === '') style = token.getLayoutParameter('P', 'paren', pindex);
    if (style === '') style = token.getLayoutParameter('P', 'dot', pindex);
    if (style === '') style = token.getLayoutParameter('P', 'dash', pindex);
    if (style === '') style = token.getLayoutParameter('P', 'slur', pindex);

    if (style === '') {
      if (this.m_signifiers.phrase_style === 'none') {
        return true;
      }
    }
    if (pindex < 0) pindex = 0;

    const sstr = token.toString();
    let counter = -1;
    for (let i = 0; i < sstr.length - 1; ++i) {
      if (sstr[i] !== '{') continue;
      counter++;
      if (counter !== pindex) continue;
      if (sstr[i + 1] === 'y') return true;
      break;
    }

    return false;
  }

  public insertPhrase(
    phrase: Slur | BracketSpan,
    phrasestart: HTok,
    phraseend: HTok,
    startmeasure: Measure,
    startchordsorted: Array<{ first: number; second: number }>,
    endchordsorted: Array<{ first: number; second: number }>,
    phrasestartnoteinfo: Array<{ first: number; second: boolean }>,
    phraseendnoteinfo: Array<{ first: number; second: boolean }>,
    ndex: number,
    phraseindex: number[][],
    i: number,
    j: number,
    startpitches: number[],
    endpitches: number[],
    indexused: boolean[],
  ): void {
    this.appendTypeTag(phrase, 'phrase');

    let style = this.m_signifiers.phrase_style;

    let teststyle = phrasestart.getLayoutParameter('P', 'brack', ndex);
    if (teststyle !== '') {
      style = 'brack';
    } else {
      teststyle = phrasestart.getLayoutParameter('P', 'dot', ndex);
      if (teststyle !== '') {
        style = 'dot';
      } else {
        teststyle = phrasestart.getLayoutParameter('P', 'dash', ndex);
        if (teststyle !== '') {
          style = 'dash';
        } else {
          teststyle = phrasestart.getLayoutParameter('P', 'open', ndex);
          if (teststyle !== '') {
            style = 'open';
          } else {
            teststyle = phrasestart.getLayoutParameter('P', 'wavy', ndex);
            if (teststyle !== '') {
              style = 'wavy';
            }
          }
        }
      }
    }

    if (style === 'brack') {
      phrase.SetLform(LINEFORM_solid);
    } else if (style === 'dot') {
      phrase.SetLform(LINEFORM_dotted);
    } else if (style === 'dash') {
      phrase.SetLform(LINEFORM_dashed);
    } else if (style === 'wavy') {
      phrase.SetLform(LINEFORM_wavy);
    }

    let color = this.m_signifiers.phrase_color;
    const testcolor = phrasestart.getLayoutParameter('P', 'color', ndex);
    if (testcolor !== '') {
      color = testcolor;
    }
    if (color !== '') {
      phrase.SetColor(color);
    }

    let startid = phrasestart.getValue('MEI', 'xml:id');
    let endid = phraseend.getValue('MEI', 'xml:id');

    if (startid === '') {
      if (phrasestart.isChord()) {
        startid = 'chord-L';
      } else {
        startid = 'note-L';
      }
      startid += String(phrasestart.getLineNumber());
      startid += 'F';
      startid += String(phrasestart.getFieldNumber());
      phrasestart.setValue('MEI', 'xml:id', startid);
    }

    if (phraseindex[i].length > 1) {
      if (endpitches.length > 1) {
        const endidRef = { value: endid };
        this.calculateNoteIdForSlur(endidRef, endchordsorted, j);
        endid = endidRef.value;
      }
      if (startpitches.length > 1) {
        const startidRef = { value: startid };
        this.calculateNoteIdForSlur(startidRef, startchordsorted, j);
        startid = startidRef.value;
      }
    }

    if (phraseendnoteinfo[i]?.second) {
      if (endid.indexOf('chord') !== -1) {
        const hre = new HumRegex();
        endid = hre.replaceCopy(endid, 'note', 'chord');
        endid += 'S' + String(phraseendnoteinfo[i].first + 1);
      }
    }

    if (phrasestartnoteinfo[j]?.second) {
      if (startid.indexOf('chord') !== -1) {
        const hre = new HumRegex();
        startid = hre.replaceCopy(startid, 'note', 'chord');
        startid += 'S' + String(phrasestartnoteinfo[i].first + 1);
      }
    }

    phrase.SetEndid('#' + endid);
    phrase.SetStartid('#' + startid);

    const slurstartnumber = 1;
    this.setSlurLocationId(phrase, phrasestart, phraseend, slurstartnumber, 'phrase');

    if (startmeasure !== null) {
      startmeasure.AddChild(phrase);
    } else {
      this.addChildMeasureOrSection(phrase);
    }

    if (phrasestart.getTrack() === phraseend.getTrack()) {
      this.setStaff(phrase, this.m_currentstaff);
    }

    const phraseidx = 0;
    if (phraseidx < indexused.length) {
      indexused[phraseidx] = true;
    }
  }

  public processPhrases(phraseend: HTok): void {
    const startcount = phraseend.getValueInt('auto', 'phraseStartCount');
    if (startcount <= 0) return;

    const phrasestarts: HTok[] = [];
    for (let i = 0; i < startcount; ++i) {
      const tok = phraseend.getPhraseStartToken(i + 1);
      if (tok !== null) phrasestarts.push(tok);
    }

    const phraseindex: number[][] = new Array(phrasestarts.length);
    for (let i = 0; i < phrasestarts.length; ++i) {
      phraseindex[i] = [];
      for (let j = 0; j <= i; j++) {
        if (phrasestarts[i] === phrasestarts[j]) {
          phraseindex[j].push(i);
          break;
        }
      }
    }

    const indexused = new Array(32).fill(false);

    const phraseendnoteinfo: Array<{ first: number; second: boolean }> = [];
    this.extractPhraseNoteAttachmentInformation(phraseendnoteinfo, phraseend, '}');

    const endsubtokcount = phraseend.getSubtokenCount();
    const endpitches: number[] = [];
    for (let i = 0; i < endsubtokcount; ++i) {
      const subtok = phraseend.getSubtoken(i);
      if (subtok.indexOf('r') !== -1) {
        endpitches.push(0);
      } else {
        endpitches.push(kernToBase7(subtok));
      }
    }
    const endchordsorted: Array<{ first: number; second: number }> = [];
    for (let i = 0; i < endsubtokcount; ++i) {
      endchordsorted.push({ first: endpitches[i], second: i });
    }
    endchordsorted.sort((a, b) => a.first - b.first);

    for (let i = 0; i < phraseindex.length; ++i) {
      if (phrasestarts[i] === undefined) continue;
      const phrasestartnoteinfo: Array<{ first: number; second: boolean }> = [];
      this.extractPhraseNoteAttachmentInformation(phrasestartnoteinfo, phrasestarts[i], '{');

      const startsubtokcount = phrasestarts[i].getSubtokenCount();
      const startpitches: number[] = [];
      for (let j = 0; j < startsubtokcount; j++) {
        const subtok = phrasestarts[i].getSubtoken(j);
        if (subtok.indexOf('r') !== -1) {
          startpitches.push(0);
        } else {
          startpitches.push(kernToBase7(subtok));
        }
      }
      const startchordsorted: Array<{ first: number; second: number }> = [];
      for (let k = 0; k < startsubtokcount; ++k) {
        startchordsorted.push({ first: startpitches[k], second: k });
      }
      startchordsorted.sort((a, b) => a.first - b.first);

      for (let j = 0; j < phraseindex[i].length; j++) {
        const ndex = phraseindex.length > 1 ? j : -1;
        const phrasestart = phrasestarts[phraseindex[i][j]];
        if (phrasestart === undefined || phrasestart === null) return;

        let mindex: number;
        const mindexstring = phrasestart.getValue('MEI', 'measureIndex');
        if (mindexstring === '') {
          mindex = phraseend.getValueInt('MEI', 'measureIndex');
        } else {
          mindex = phrasestart.getValueInt('MEI', 'measureIndex');
        }

        const startmeasure = this.m_measures[mindex] ?? this.m_measure;

        if (this.phraseIsInvisible(phrasestart, ndex)) {
          continue;
        }

        let isslur = this.m_signifiers.phrase_slur;
        if (isslur === '') {
          isslur = phrasestart.getLayoutParameter('P', 'slur', ndex);
        }

        if (isslur !== '') {
          const slur = new Slur();
          this.insertPhrase(
            slur, phrasestart, phraseend, startmeasure!,
            startchordsorted, endchordsorted, phrasestartnoteinfo, phraseendnoteinfo,
            ndex, phraseindex, i, j, startpitches, endpitches, indexused,
          );
          slur.SetCurvedir(curvature_CURVEDIR_above);
        } else {
          const bracket = new BracketSpan();
          this.insertPhrase(
            bracket, phrasestart, phraseend, startmeasure!,
            startchordsorted, endchordsorted, phrasestartnoteinfo, phraseendnoteinfo,
            ndex, phraseindex, i, j, startpitches, endpitches, indexused,
          );
          bracket.SetFunc(bracketSpanLog_FUNC_phrase);
        }
      }
    }
  }

  public getLayoutParameter(token: HTp, category: string, catkey: string, trueString = '', falseString = ''): string {
    if (token === null) return falseString;
    const lcount = token.getLinkedParameterSetCount();
    if (lcount === 0) return falseString;
    for (let p = 0; p < lcount; ++p) {
      const hps = token.getLinkedParameterSet(p);
      if (hps === null) continue;
      if (hps.getNamespace1() !== 'LO' || hps.getNamespace2() !== category) continue;
      for (let q = 0; q < hps.getCount(); ++q) {
        const key = hps.getParameterName(q);
        const value = hps.getParameterValue(q);
        if (key === catkey) {
          if (value === '') return trueString;
          return value;
        }
      }
    }
    return falseString;
  }

  public attachToToken(element: { SetStartid(id: string): void }, token: HTok): void {
    if (token.isNull()) {
      LogWarning('In HumdrumInput::attachToToken: Cannot input null tokens into this function');
      return;
    }
    if (token.isChord()) {
      element.SetStartid('#' + this.getLocationId('chord', token));
    } else if (token.isRest()) {
      element.SetStartid('#' + this.getLocationId('rest', token));
    } else if (token.isData()) {
      element.SetStartid('#' + this.getLocationId('note', token));
    } else if (token.isClef()) {
      element.SetStartid('#' + this.getLocationId('clef', token));
    }
  }

  public setAttachmentType(element: { SetTstamp(v: number): void; SetStartid?(id: string): void }, token: HTok): void {
    const linedur = (token.getLine() as HumdrumLine | null)?.getDuration() ?? new HumNum(0);
    const staffindex = this.m_rkern[token.getTrack()] ?? 0;
    if (token.isNull()) {
      const barstamp = this.getMeasureTstamp(token, staffindex);
      element.SetTstamp(barstamp.getFloat());
    } else if (token.isBarline()) {
      const barstamp = this.getMeasureTstamp(token, staffindex);
      element.SetTstamp(barstamp.getFloat());
    } else if (linedur.isZero()) {
      if (typeof element.SetStartid === 'function') {
        this.attachToToken(element as { SetStartid(id: string): void }, token);
      }
    } else {
      const barstamp = this.getMeasureTstamp(token, staffindex);
      element.SetTstamp(barstamp.getFloat());
    }
  }

  public getLeftNoteDuration(token: HTok): HumNum {
    let output = new HumNum(0);
    let current: HTp = token;
    while (current !== null) {
      if (!current.isKernLike()) {
        current = current.getPreviousFieldToken();
        continue;
      }
      if (current.isNull()) {
        current = current.getPreviousFieldToken();
        continue;
      }
      output = recipToDuration(current.toString());
      break;
    }
    return output;
  }

  public getCrescendoEnd(token: HTok): HTp {
    return this.getHairpinEnd(token, '[');
  }

  public getDecrescendoEnd(token: HTok): HTp {
    return this.getHairpinEnd(token, ']');
  }

  public getHairpinEnd(token: HTp, endchar: string): HTp {
    if (token === null) return null;
    let subtrack = token.getSubtrack();
    if (subtrack === 0) subtrack = 1;
    let curr: HTp = token.getNextNonNullDataToken();
    while (curr !== null) {
      const cstr = curr.toString();
      if (cstr.indexOf(endchar) !== -1) {
        let esubtrack = curr.getSubtrack();
        if (esubtrack === 0) esubtrack = 1;
        if (subtrack === esubtrack) return curr;
        return null;
      }
      let badtoken = false;
      for (let i = 0; i < cstr.length; ++i) {
        const ch = cstr[i];
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) badtoken = true;
        else if (ch === '<' || ch === '>') badtoken = true;
        if (badtoken) return null;
      }
      curr = curr.getNextNonNullDataToken();
    }
    return null;
  }

  public addSforzandoToNote(token: HTok, staffindex: number): void {
    const tokstr = token.toString();
    const loc = tokstr.lastIndexOf('z');
    if (loc === -1) return;
    if (tokstr.indexOf('zy') !== -1) return;

    const ss = this.m_staffstates;
    const si = staffindex;
    let staffadj = ss[si]?.m_dynamstaffadj ?? 0;

    let forceQ = false;
    let forceAboveQ = false;
    let forceBelowQ = false;
    let forceCenterQ = false;
    let aboveQ = false;
    let belowQ = false;
    let centerQ = false;
    let showpos = false;

    if (ss[si]?.m_dynampos > 0) {
      forceQ = true;
      forceAboveQ = true;
    } else if (ss[si]?.m_dynampos < 0) {
      forceQ = true;
      forceBelowQ = true;
    } else if (ss[si]?.m_dynampos === 0 && ss[si]?.m_dynamposdefined) {
      forceCenterQ = true;
    } else if (ss[si]?.verse) {
      forceAboveQ = true;
    }

    let justification = 0;
    if (token.getLayoutParameter('DY', 'rj') === 'true') {
      justification = 1;
    }
    if (token.getLayoutParameter('DY', 'cj') === 'true') {
      justification = 2;
    }

    const dcolor = token.getLayoutParameter('DY', 'color');
    const needsrend = justification !== 0 || dcolor.length > 0;

    const subtrack = token.getSubtrack();
    switch (subtrack) {
      case 1:
        aboveQ = true;
        belowQ = false;
        centerQ = false;
        break;
      case 2:
        belowQ = true;
        aboveQ = false;
        centerQ = false;
        break;
    }

    const staffadjRef = { value: staffadj };
    if (this.hasAboveParameter(token, 'DY', staffadjRef)) {
      aboveQ = true;
      belowQ = false;
      centerQ = false;
      showpos = true;
      staffadj = staffadjRef.value;
    }
    if (!aboveQ) {
      if (this.hasBelowParameter(token, 'DY', staffadjRef)) {
        aboveQ = false;
        belowQ = true;
        centerQ = false;
        showpos = true;
        staffadj = staffadjRef.value;
        if (belowQ && staffadj !== 0) {
          staffadj--;
        } else if (forceQ && forceBelowQ) {
          staffadj = -(ss[si]?.m_dynamstaffadj ?? 0);
        }
      }
    }
    if (!aboveQ && !belowQ) {
      if (this.hasCenterParameter(token, 'DY', staffadjRef)) {
        aboveQ = false;
        belowQ = false;
        centerQ = true;
        showpos = true;
        staffadj = staffadjRef.value;
      }
    }

    if (this.m_signifiers.below !== '' && loc < tokstr.length - 1 && tokstr.substring(loc + 1, loc + 1 + this.m_signifiers.below.length) === this.m_signifiers.below) {
      aboveQ = false;
      belowQ = true;
      showpos = true;
    }
    if (this.m_signifiers.above !== '' && loc < tokstr.length - 1 && tokstr.substring(loc + 1, loc + 1 + this.m_signifiers.above.length) === this.m_signifiers.above) {
      aboveQ = true;
      belowQ = false;
      showpos = true;
    }

    const dynam = new Dynam();
    this.addChildMeasureOrSection(dynam);

    let newstaff = this.m_currentstaff + staffadj;
    if (newstaff < 1) newstaff = 1;
    if (newstaff > ss.length) newstaff = ss.length;
    this.setStaff(dynam, newstaff);

    if (needsrend) {
      const rend = new Rend();
      dynam.AddChild(rend);
      rend.SetFontweight(FONTWEIGHT_bold);
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_large);
      rend.SetFontsize(fs);
      if (tokstr.indexOf('zzzz') !== -1) {
        this.addTextElement(rend, 'rfz\u00a0');
      } else if (tokstr.indexOf('zzz') !== -1) {
        this.addTextElement(rend, 'rz\u00a0');
      } else if (tokstr.indexOf('zz') !== -1) {
        this.addTextElement(rend, 'sfz\u00a0');
      } else {
        this.addTextElement(rend, 'sf\u00a0');
      }
      if (dcolor !== '') {
        rend.SetColor(dcolor);
      }
      if (justification === 1) {
        rend.SetHalign(HORIZONTALALIGNMENT_right);
      } else if (justification === 2) {
        rend.SetHalign(HORIZONTALALIGNMENT_center);
      }
    } else {
      if (tokstr.indexOf('zzzz') !== -1) {
        this.addTextElement(dynam, 'rfz');
      } else if (tokstr.indexOf('zzz') !== -1) {
        this.addTextElement(dynam, 'rz');
      } else if (tokstr.indexOf('zz') !== -1) {
        this.addTextElement(dynam, 'sfz');
      } else {
        this.addTextElement(dynam, 'sf');
      }
    }

    this.setLocationId(dynam, token, -1);
    let startid = dynam.GetID();
    const hre = new HumRegex();
    if (token.isRest()) {
      startid = hre.replaceCopy(startid, 'rest', '^dynam');
    } else if (token.isChord()) {
      startid = hre.replaceCopy(startid, 'chord', '^dynam');
    } else {
      startid = hre.replaceCopy(startid, 'note', '^dynam');
    }
    dynam.SetStartid('#' + startid);

    if (aboveQ) {
      this.setPlaceRelStaff(dynam, 'above', showpos);
    } else if (belowQ) {
      this.setPlaceRelStaff(dynam, 'below', showpos);
    } else if (centerQ) {
      this.setPlaceRelStaff(dynam, 'between', showpos);
    } else if (forceAboveQ) {
      this.setPlaceRelStaff(dynam, 'above', showpos);
    } else if (forceBelowQ) {
      this.setPlaceRelStaff(dynam, 'below', showpos);
    } else if (forceCenterQ) {
      this.setPlaceRelStaff(dynam, 'between', showpos);
    }
  }

  public addDynamicsMark(
    dyntok: HTok, token: HTok, line: HLp, letters: string,
    staffindex: number, staffadj: number, trackdiff: number,
  ): void {
    const ss = this.m_staffstates;
    const si = staffindex;

    let defaultAboveQ = false;
    let defaultBelowQ = false;
    let defaultCenterQ = false;
    let centerQ = false;
    const hre = new HumRegex();
    let dynamic = '';
    const staffadj2 = 0;

    if (ss[si]?.m_dynamposdefined && ss[si]?.m_dynampos === 0) {
      defaultCenterQ = true;
    }

    const spineinfo = dyntok.getSpineInfo();
    if (spineinfo.indexOf('(') !== -1) {
      if (dyntok.getSubtrack() % 2) {
        defaultAboveQ = true;
      } else {
        defaultBelowQ = true;
      }
    }

    if (hre.search(letters, '^[sr]?f+z?$')) {
      dynamic = letters;
    } else if (hre.search(letters, '^p+$')) {
      dynamic = letters;
    } else if (hre.search(letters, '^m?(f|p)$')) {
      dynamic = letters;
    } else if (hre.search(letters, '^s?f+z?p+$')) {
      dynamic = letters;
    } else if (letters === 'rz') {
      dynamic = letters;
    }

    if (dynamic !== '') {
      let staffadjVal = ss[si]?.m_dynamstaffadj ?? staffadj;

      let dyntext = this.getLayoutParameter(dyntok, 'DY', 't', '', '');
      if (dyntext !== '') {
        dyntext = hre.replaceCopy(dyntext, dynamic + ' ', '%s', 'g');
        dynamic = dyntext;
      }

      let aboveQ = false;
      const staffadjRef = { value: staffadjVal };

      if (this.hasAboveParameter(dyntok, 'DY', staffadjRef)) {
        aboveQ = true;
        staffadjVal = staffadjRef.value;
      } else if (ss[si]?.verse) {
        aboveQ = true;
      }

      let belowQ = false;
      let showplace = aboveQ;
      if (!aboveQ) {
        belowQ = this.hasBelowParameter(dyntok, 'DY', staffadjRef);
        showplace = belowQ;
        staffadjVal = staffadjRef.value;
      }
      if (!aboveQ && !belowQ) {
        if (this.hasCenterParameter(dyntok, 'DY', staffadjRef)) {
          aboveQ = false;
          belowQ = false;
          centerQ = true;
          showplace = centerQ;
          staffadjVal = staffadjRef.value;
        }
      }
      if (staffadj2) {
        showplace = true;
      }

      let justification = 0;
      if (dyntok.getLayoutParameter('DY', 'rj') === 'true') {
        justification = 1;
      } else if (dyntok.getLayoutParameter('DY', 'cj') === 'true') {
        justification = 2;
      }

      let editQ = false;
      let brackQ = false;
      let parenQ = false;
      let curlyQ = false;
      let angleQ = false;

      const editstr = this.getLayoutParameter(dyntok, 'DY', 'ed', 'true');
      if (editstr === 'true') {
        editQ = true;
      }
      if (editstr.indexOf('brack') !== -1) {
        brackQ = true;
        editQ = true;
      } else if (editstr.indexOf('paren') !== -1) {
        parenQ = true;
        editQ = true;
      } else if (editstr.indexOf('curly') !== -1) {
        curlyQ = true;
        dynamic = '{ ' + dynamic + ' }';
      } else if (editstr.indexOf('angle') !== -1) {
        angleQ = true;
        dynamic = '< ' + dynamic + ' >';
      }
      if (!(parenQ || brackQ || curlyQ || angleQ)) {
        const parenP = this.getLayoutParameter(dyntok, 'DY', 'paren', 'true');
        const brackP = this.getLayoutParameter(dyntok, 'DY', 'brack', 'true');
        const curlyP = this.getLayoutParameter(dyntok, 'DY', 'curly', 'true');
        const angleP = this.getLayoutParameter(dyntok, 'DY', 'angle', 'true');
        if (parenP === 'true') {
          parenQ = true;
        } else if (brackP === 'true') {
          brackQ = true;
        } else if (curlyP === 'true') {
          curlyQ = true;
          dynamic = '{ ' + dynamic + ' }';
        } else if (angleP === 'true') {
          angleQ = true;
          dynamic = '< ' + dynamic + ' >';
        }
      }

      const dcolor = dyntok.getLayoutParameter('DY', 'color');
      const needsrend = justification !== 0 || dcolor.length > 0;

      const dynam = new Dynam();

      if (editQ) {
        const supplied = new Supplied();
        supplied.AddChild(dynam);
        this.addChildMeasureOrSection(supplied);
        this.appendTypeTag(dynam, 'editorial');
      } else {
        this.addChildMeasureOrSection(dynam);
      }

      if (parenQ) {
        dynam.SetEnclose(ENCLOSURE_paren);
      }
      if (brackQ) {
        dynam.SetEnclose(ENCLOSURE_brack);
      }

      let newstaff = this.m_currentstaff - staffadjVal + staffadj2;
      if (newstaff < 1) newstaff = 1;
      if (newstaff > ss.length) newstaff = ss.length;

      if (centerQ && !aboveQ && !belowQ) {
        this.setStaffBetween(dynam, this.m_currentstaff);
        showplace = true;
      } else if (defaultAboveQ) {
        this.setStaff(dynam, newstaff);
      } else if (defaultBelowQ) {
        this.setStaff(dynam, newstaff);
      } else if (defaultCenterQ && !aboveQ && !belowQ) {
        this.setStaffBetween(dynam, this.m_currentstaff);
        showplace = true;
      } else {
        this.setStaff(dynam, newstaff);
      }
      this.setLocationId(dynam, dyntok, -1);

      if (needsrend) {
        const rend = new Rend();
        dynam.AddChild(rend);
        rend.SetFontweight(FONTWEIGHT_bold);
        const fs = new data_FONTSIZE();
        fs.SetTerm(FONTSIZETERM_large);
        rend.SetFontsize(fs);
        this.addTextElement(rend, dynamic);
        if (dcolor !== '') {
          rend.SetColor(dcolor);
        }
        if (justification === 1) {
          rend.SetHalign(HORIZONTALALIGNMENT_right);
        } else if (justification === 2) {
          rend.SetHalign(HORIZONTALALIGNMENT_center);
        }
      } else {
        this.addTextElement(dynam, dynamic);
      }

      const linedur = line ? (line as HumdrumLine).getDuration() : new HumNum(0);
      if (linedur.isZero()) {
        if (token.isChord()) {
          dynam.SetStartid('#' + this.getLocationId('chord', token));
        } else {
          dynam.SetStartid('#' + this.getLocationId('note', token));
        }
      } else {
        const barstamp = this.getMeasureTstamp(token, si);
        dynam.SetTstamp(barstamp.getFloat());
      }

      const verticalgroup = dyntok.getLayoutParameter('DY', 'vg');
      if (!defaultCenterQ) {
        if (verticalgroup === '') {
          dynam.SetVgrp(VGRP_DYNAM_DEFAULT);
        } else if (verticalgroup[0] >= '0' && verticalgroup[0] <= '9') {
          dynam.SetVgrp(parseInt(verticalgroup, 10));
        }
      }

      if (trackdiff === 1) {
        this.setPlaceRelStaff(dynam, 'above', false);
      }
      if (aboveQ) {
        this.setPlaceRelStaff(dynam, 'above', showplace);
      } else if (belowQ) {
        this.setPlaceRelStaff(dynam, 'below', showplace);
      } else if (centerQ) {
        this.setPlaceRelStaff(dynam, 'between', showplace);
      } else if (defaultAboveQ) {
        this.setPlaceRelStaff(dynam, 'above', false);
      } else if (defaultBelowQ) {
        this.setPlaceRelStaff(dynam, 'below', false);
      } else if (defaultCenterQ) {
        this.setPlaceRelStaff(dynam, 'between', false);
      }
    }
  }

  public processDynamics(token: HTok, staffindex: number): void {
    this.addSforzandoToNote(token, staffindex);

    const hre = new HumRegex();
    const si = staffindex;
    const graceQ = token.isGrace();
    const ss = this.m_staffstates;
    const line = token.getLine() as HumdrumLine | null;
    if (line === null) return;

    const track = token.getTrack();
    let lasttrack = track;
    let ttrack: number;
    const startfield = token.getFieldIndex() + 1;

    let forceAboveQ = false;
    let forceBelowQ = false;
    let forceCenterQ = false;
    let trackdiff = 0;

    if (ss[si]?.m_dynampos > 0) {
      forceAboveQ = true;
    } else if (ss[si]?.m_dynampos < 0) {
      forceBelowQ = true;
    } else if (ss[si]?.m_dynampos === 0 && ss[si]?.m_dynamposdefined) {
      forceCenterQ = true;
    } else if (ss[si]?.verse) {
      forceAboveQ = true;
    }

    let active = true;
    for (let i = startfield; i < line.getFieldCount(); ++i) {
      let staffadj = ss[si]?.m_dynamstaffadj ?? 0;
      const dyntok = line.token(i);
      if (dyntok === null || dyntok.isNull()) continue;

      let staffadj2 = 0;
      const spineinfo = dyntok.getSpineInfo();
      if (spineinfo.indexOf('(') !== -1) {
        if (dyntok.getSubtrack() % 2) {
          forceAboveQ = true;
        } else {
          forceBelowQ = true;
        }
      }

      const exinterp = dyntok.getDataType();
      if (exinterp !== '**kern' && exinterp.indexOf('kern') !== -1) {
        active = false;
      }
      if (dyntok.isKernLike()) {
        active = true;
        ttrack = dyntok.getTrack();
        if (ttrack !== track) {
          if (ttrack !== lasttrack) {
            trackdiff++;
            lasttrack = ttrack;
          }
          if (graceQ) {
            continue;
          } else {
            break;
          }
        }
        if (!dyntok.isNull()) {
          break;
        }
      }
      if (!active) continue;
      if (!(dyntok.isDataType('**dynam') || dyntok.isDataType('**dyn'))) continue;

      const tok = dyntok.toString();
      if (dyntok.getValueBool('auto', 'DY', 'processed')) {
        return;
      }
      dyntok.setValue('auto', 'DY', 'processed', 'true');

      let hairpins = '';
      let letters = '';
      for (let c = 0; c < tok.length; ++c) {
        const ch = tok[c];
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
          letters += ch;
        } else {
          hairpins += ch;
        }
      }

      this.addDynamicsMark(dyntok, token, line, letters, si, staffadj, trackdiff);

      if (hairpins.indexOf('<') !== -1) {
        let endline = false;
        let endtok: HTp = null;
        let duration = new HumNum(0);
        if (hairpins.indexOf('<[') !== -1 || hairpins.indexOf('< [') !== -1) {
          duration = this.getLeftNoteDuration(token);
          endtok = token;
          endline = true;
        } else {
          endtok = this.getCrescendoEnd(dyntok);
        }
        staffadj = ss[si]?.m_dynamstaffadj ?? 0;
        const staffadjRef = { value: staffadj };
        let aboveQ = this.hasAboveParameter(dyntok, 'HP', staffadjRef);
        let belowQ = false;
        let centerQ = false;
        let showplace = aboveQ;
        staffadj = staffadjRef.value;
        if (!aboveQ) {
          belowQ = this.hasBelowParameter(dyntok, 'HP', staffadjRef);
          showplace = belowQ;
          staffadj = staffadjRef.value;
        }
        if (!aboveQ && !belowQ) {
          if (this.hasCenterParameter(dyntok, 'HP', staffadjRef)) {
            aboveQ = false;
            belowQ = false;
            centerQ = true;
            showplace = centerQ;
            staffadj = staffadjRef.value;
          }
        }

        if (endtok !== null) {
          const hairpin = new Hairpin();
          let newstaff = this.m_currentstaff - staffadj + staffadj2;
          if (newstaff < 1) newstaff = 1;
          if (newstaff > ss.length) newstaff = ss.length;

          if ((centerQ || forceCenterQ) && !aboveQ && !belowQ) {
            this.setStaffBetween(hairpin, newstaff);
            this.setPlaceRelStaff(hairpin, 'between', showplace);
          } else {
            this.setStaff(hairpin, newstaff);
            if (aboveQ) {
              this.setPlaceRelStaff(hairpin, 'above', showplace);
            } else if (belowQ) {
              this.setPlaceRelStaff(hairpin, 'below', showplace);
            } else if (forceAboveQ) {
              this.setPlaceRelStaff(hairpin, 'above', showplace);
            } else if (forceBelowQ) {
              this.setPlaceRelStaff(hairpin, 'below', showplace);
            }
          }
          this.setLocationId(hairpin, dyntok, -1);
          const color = this.getLoColor(dyntok, 'HP');
          if (color !== '') {
            hairpin.SetColor(color);
          }
          let tstamp2: HumNum;
          if (duration.isPositive()) {
            tstamp2 = this.getMeasureTstamp(dyntok, duration, si);
          } else {
            tstamp2 = this.getMeasureTstamp(endtok, si);
          }
          if (duration.isZero() && (endline || endtok.toString().indexOf('[[') !== -1)) {
            const mfactor = (ss[si]?.meter_bottom) ? ss[si].meter_bottom.div(4) : new HumNum(1);
            const lineDur = (endtok.getLine() as HumdrumLine | null)?.getDuration() ?? new HumNum(0);
            tstamp2 = tstamp2.add(lineDur.mul(mfactor));
          }
          const measures = this.getMeasureDifference(dyntok, endtok);

          this.setAttachmentType(hairpin, token);
          hairpin.SetTstamp2([measures, tstamp2.getFloat()]);
          hairpin.SetForm(hairpinLog_FORM_cres);
          this.addChildMeasureOrSection(hairpin);

          const verticalgroup = dyntok.getLayoutParameter('HP', 'vg');
          if (!forceCenterQ) {
            if (verticalgroup === '') {
              hairpin.SetVgrp(VGRP_DYNAM_DEFAULT);
            } else if (verticalgroup[0] >= '0' && verticalgroup[0] <= '9') {
              hairpin.SetVgrp(parseInt(verticalgroup, 10));
            }
          }
        } else {
          // no endpoint so print as "cresc."
          const dir = new Dir();
          this.addChildMeasureOrSection(dir);
          let newstaff = this.m_currentstaff - staffadj + staffadj2;
          if (newstaff < 1) newstaff = 1;
          else if (newstaff > ss.length) newstaff = ss.length;

          if ((centerQ || forceCenterQ) && !aboveQ && !belowQ) {
            this.setStaffBetween(dir, newstaff);
            this.setPlaceRelStaff(dir, 'between', showplace);
          } else {
            this.setStaff(dir, newstaff);
            if (aboveQ) {
              this.setPlaceRelStaff(dir, 'above', showplace);
            } else if (belowQ) {
              this.setPlaceRelStaff(dir, 'below', showplace);
            } else if (forceAboveQ) {
              this.setPlaceRelStaff(dir, 'above', false);
            } else if (forceBelowQ) {
              this.setPlaceRelStaff(dir, 'below', false);
            }
          }
          this.setLocationId(dir, dyntok);
          this.setAttachmentType(dir, token);

          let fontstyle = '';
          let content = 'cresc.';
          if (this.m_signifiers.cresctext !== '') {
            content = this.m_signifiers.cresctext;
            fontstyle = this.m_signifiers.crescfontstyle;
          }
          let pintext = this.getLayoutParameter(dyntok, 'HP', 't', '', '');
          if (pintext !== '') {
            pintext = hre.replaceCopy(pintext, content, '%s', 'g');
            content = pintext;
          }
          this.addTextElement(dir, content, fontstyle);
        }
      } else if (hairpins.indexOf('>') !== -1) {
        let endline = false;
        let endtok: HTp = null;
        let duration = new HumNum(0);
        if (hairpins.indexOf('>]') !== -1 || hairpins.indexOf('> ]') !== -1) {
          duration = this.getLeftNoteDuration(token);
          endtok = token;
          endline = true;
        } else {
          endtok = this.getDecrescendoEnd(dyntok);
        }

        staffadj = ss[si]?.m_dynamstaffadj ?? 0;
        const staffadjRef = { value: staffadj };
        let aboveQ = this.hasAboveParameter(dyntok, 'HP', staffadjRef);
        let belowQ = false;
        let centerQ = false;
        let showplace = aboveQ;
        staffadj = staffadjRef.value;
        if (!aboveQ) {
          belowQ = this.hasBelowParameter(dyntok, 'HP', staffadjRef);
          showplace = belowQ;
          staffadj = staffadjRef.value;
        }
        if (!aboveQ && !belowQ) {
          centerQ = this.hasCenterParameter(dyntok, 'HP', staffadjRef);
          showplace = centerQ;
          staffadj = staffadjRef.value;
        }

        if (endtok !== null) {
          const hairpin = new Hairpin();
          let newstaff = this.m_currentstaff - staffadj + staffadj2;
          if (newstaff < 1) newstaff = 1;
          else if (newstaff > ss.length) newstaff = ss.length;

          if ((centerQ || forceCenterQ) && !aboveQ && !belowQ) {
            this.setStaffBetween(hairpin, newstaff);
            this.setPlaceRelStaff(hairpin, 'between', showplace);
          } else {
            this.setStaff(hairpin, newstaff);
            if (aboveQ) {
              this.setPlaceRelStaff(hairpin, 'above', showplace);
            } else if (belowQ) {
              this.setPlaceRelStaff(hairpin, 'below', showplace);
            } else if (forceAboveQ) {
              this.setPlaceRelStaff(hairpin, 'above', showplace);
            } else if (forceBelowQ) {
              this.setPlaceRelStaff(hairpin, 'below', showplace);
            }
          }
          const color = this.getLoColor(dyntok, 'HP');
          if (color !== '') {
            hairpin.SetColor(color);
          }
          this.setLocationId(hairpin, dyntok, -1);
          let tstamp2: HumNum;
          if (duration.isPositive()) {
            tstamp2 = this.getMeasureTstamp(dyntok, duration, si);
          } else {
            tstamp2 = this.getMeasureTstamp(endtok, si);
          }
          if (duration.isZero() && (endline || endtok.toString().indexOf(']]') !== -1)) {
            const mfactor = (ss[si]?.meter_bottom) ? ss[si].meter_bottom.div(4) : new HumNum(1);
            const lineDur = (endtok.getLine() as HumdrumLine | null)?.getDuration() ?? new HumNum(0);
            tstamp2 = tstamp2.add(lineDur.mul(mfactor));
          }
          const measures = this.getMeasureDifference(dyntok, endtok);

          this.setAttachmentType(hairpin, token);
          hairpin.SetTstamp2([measures, tstamp2.getFloat()]);
          hairpin.SetForm(hairpinLog_FORM_dim);
          this.addChildMeasureOrSection(hairpin);

          const verticalgroup = dyntok.getLayoutParameter('HP', 'vg');
          if (verticalgroup === '') {
            hairpin.SetVgrp(VGRP_DYNAM_DEFAULT);
          } else if (verticalgroup[0] >= '0' && verticalgroup[0] <= '9') {
            hairpin.SetVgrp(parseInt(verticalgroup, 10));
          }
        } else {
          // no endpoint so print as "decresc."
          const dir = new Dir();
          this.addChildMeasureOrSection(dir);
          let staffadjVal = ss[si]?.m_dynamstaffadj ?? 0;
          const staffadjRef = { value: staffadjVal };
          let aboveQ = this.hasAboveParameter(dyntok, 'HP', staffadjRef);
          let belowQ = false;
          let centerQ = false;
          staffadjVal = staffadjRef.value;
          if (!aboveQ) {
            belowQ = this.hasBelowParameter(dyntok, 'HP', staffadjRef);
            staffadjVal = staffadjRef.value;
          }
          if (!aboveQ && !belowQ) {
            centerQ = this.hasCenterParameter(dyntok, 'HP', staffadjRef);
            staffadjVal = staffadjRef.value;
          }

          let newstaff = this.m_currentstaff - staffadjVal + staffadj2;
          if (newstaff < 1) newstaff = 1;
          else if (newstaff > ss.length) newstaff = ss.length;

          if ((centerQ || forceCenterQ) && !aboveQ && !belowQ) {
            this.setStaffBetween(dir, newstaff);
            this.setPlaceRelStaff(dir, 'between', showplace);
          } else {
            this.setStaff(dir, newstaff);
            if (aboveQ) {
              this.setPlaceRelStaff(dir, 'above', showplace);
            } else if (belowQ) {
              this.setPlaceRelStaff(dir, 'below', showplace);
            } else if (forceAboveQ) {
              this.setPlaceRelStaff(dir, 'above', showplace);
            } else if (forceBelowQ) {
              this.setPlaceRelStaff(dir, 'below', showplace);
            }
          }

          this.setLocationId(dir, dyntok);
          this.setAttachmentType(dir, token);

          let fontstyle = '';
          let content = 'decresc.';
          if (this.m_signifiers.decresctext !== '') {
            content = this.m_signifiers.decresctext;
            fontstyle = this.m_signifiers.decrescfontstyle;
          }

          let pintext = this.getLayoutParameter(dyntok, 'HP', 't', '', '');
          if (pintext !== '') {
            pintext = hre.replaceCopy(pintext, content, '%s', 'g');
            content = pintext;
          }

          this.addTextElement(dir, content, fontstyle);
        }
      }
    }

    let nextTok = token.getNextToken();
    if (nextTok === null) return;
    while (nextTok !== null && !nextTok.isData()) {
      nextTok = nextTok.getNextToken();
    }
    if (nextTok === null || !nextTok.isNull()) return;
    this.processDynamics(nextTok, si);
  }

  public assignVerticalGroup(pedal: Pedal, token: HTok): void {
    const vg = token.getLayoutParameter('PED', 'vg');
    if (vg === '' || vg === 'default' || vg === '0') {
      pedal.SetVgrp(VGRP_PEDAL_DEFAULT);
    } else if (vg[0] >= '0' && vg[0] <= '9') {
      const value = parseInt(vg, 10);
      if (value > 0) {
        pedal.SetVgrp(value);
      }
    }
  }

  // C++ Convert::mensToDurationNoDots inlined here: the imperfect duration of
  // a **mens token in quarter-note units (only the first chord subtoken).
  // NOTE: kept local to HumdrumInput instead of Convert because the only two
  // C++ call sites are the mensural-rhythm converters ported below.
  public mensToDurationNoDots(mensdata: string, scale = 4): HumNum {
    let output = new HumNum(0);
    for (let i = 0; i < mensdata.length; i++) {
      switch (mensdata[i]) {
        case 'X': output = new HumNum(8); break;
        case 'L': output = new HumNum(4); break;
        case 'S': output = new HumNum(2); break;
        case 's': output = new HumNum(1); break;
        case 'M': output = new HumNum(1, 2); break;
        case 'm': output = new HumNum(1, 4); break;
        case 'U': output = new HumNum(1, 8); break;
        case 'u': output = new HumNum(1, 16); break;
      }
      if (mensdata.startsWith(' ', i)) break;
    }
    return output.mul(new HumNum(scale));
  }

  // C++ HumdrumInput::isExpressibleDuration: can this quarter-note duration
  // be written as MEI @dur + up to three @dots (honoring tuplet scaling)?
  public isExpressibleDuration(duration: HumNum): boolean {
    let dur = duration.div(4).mul(this.m_tupletscaling);
    if (dur.getDenominator() === 1) {
      const n = dur.getNumerator();
      if (n === 2 || n === 3 || n === 4 || n === 6 || n === 8 || n === 12) return true;
    }
    if (dur.getNumerator() === 1 && Convert.isPowerOfTwo(dur.getDenominator())) return true;
    const test1dot = dur.mul(2).div(3);
    if (test1dot.getNumerator() === 1 && Convert.isPowerOfTwo(test1dot.getDenominator())) return true;
    const test2dot = dur.mul(4).div(7);
    if (test2dot.getNumerator() === 1 && Convert.isPowerOfTwo(test2dot.getDenominator())) return true;
    const test3dot = dur.mul(8).div(15);
    if (test3dot.getNumerator() === 1 && Convert.isPowerOfTwo(test3dot.getDenominator())) return true;
    return false;
  }

  public oneOverDenominatorToDur(denominator: number): number {
    switch (denominator) {
      case 1: return DURATION_1;
      case 2: return DURATION_2;
      case 4: return DURATION_4;
      case 8: return DURATION_8;
      case 16: return DURATION_16;
      case 32: return DURATION_32;
      case 64: return DURATION_64;
      case 128: return DURATION_128;
      case 256: return DURATION_256;
      case 512: return DURATION_512;
      case 1024: return DURATION_1024;
      case 2048: return DURATION_2048;
    }
    return DURATION_NONE;
  }

  // C++ HumdrumInput::getDurAndDots: MEI (@dur, @dots) for a tuplet-scaled
  // quarter-note duration. The tuplet factor is removed for the output pair.
  public getDurAndDots(duration: HumNum): [number, number] {
    const dur = duration.div(4).mul(this.m_tupletscaling);
    if (dur.getDenominator() === 1) {
      const n = dur.getNumerator();
      if (n === 2) return [DURATION_breve, 0];
      if (n === 3) return [DURATION_breve, 1];
      if (n === 4) return [DURATION_long, 0];
      if (n === 6) return [DURATION_long, 1];
      if (n === 8) return [DURATION_maxima, 0];
      if (n === 12) return [DURATION_maxima, 1];
    }
    if (dur.getNumerator() === 1 && Convert.isPowerOfTwo(dur.getDenominator())) {
      return [this.oneOverDenominatorToDur(dur.getDenominator()), 0];
    }
    const test1dot = dur.mul(2).div(3);
    if (test1dot.getNumerator() === 1 && Convert.isPowerOfTwo(test1dot.getDenominator())) {
      return [this.oneOverDenominatorToDur(test1dot.getDenominator()), 1];
    }
    const test2dot = dur.mul(4).div(7);
    if (test2dot.getNumerator() === 1 && Convert.isPowerOfTwo(test2dot.getDenominator())) {
      return [this.oneOverDenominatorToDur(test2dot.getDenominator()), 2];
    }
    const test3dot = dur.mul(8).div(15);
    if (test3dot.getNumerator() === 1 && Convert.isPowerOfTwo(test3dot.getDenominator())) {
      return [this.oneOverDenominatorToDur(test3dot.getDenominator()), 3];
    }
    return [DURATION_NONE, 0];
  }

  // C++ HumdrumInput::setNoteMeiDur: integer code (-1=maxima .. 12=1024th)
  // to MEI @dur.
  public setNoteMeiDur(note: Note, meidur: number): void {
    switch (meidur) {
      case -1: note.SetDur(DURATION_maxima); break;
      case 0: note.SetDur(DURATION_long); break;
      case 1: note.SetDur(DURATION_breve); break;
      case 2: note.SetDur(DURATION_1); break;
      case 3: note.SetDur(DURATION_2); break;
      case 4: note.SetDur(DURATION_4); break;
      case 5: note.SetDur(DURATION_8); break;
      case 6: note.SetDur(DURATION_16); break;
      case 7: note.SetDur(DURATION_32); break;
      case 8: note.SetDur(DURATION_64); break;
      case 9: note.SetDur(DURATION_128); break;
      case 10: note.SetDur(DURATION_256); break;
      case 11: note.SetDur(DURATION_512); break;
      case 12: note.SetDur(DURATION_1024); break;
      default:
        LogWarning(`In HumdrumInput::setNoteMeiDur: Unknown MEI @dur: ${meidur}`);
    }
  }

  // C++ HumdrumInput::getChordNoteCount: count chord subtokens that contain a
  // note letter (invalid null subtokens and pure-recip subtokens excluded).
  public getChordNoteCount(token: HTp): number {
    if (token === null) return 0;
    const scount = token.getSubtokenCount();
    let count = 0;
    for (let i = 0; i < scount; ++i) {
      const tstring = token.getSubtoken(i);
      if (tstring === '') continue;
      let isnote = false;
      for (let k = 0; k < tstring.length; ++k) {
        if ((tstring[k] >= 'a' && tstring[k] <= 'g') || (tstring[k] >= 'A' && tstring[k] <= 'G')) {
          isnote = true;
          break;
        }
      }
      if (isnote) count++;
    }
    return count;
  }

  // C++ HumdrumInput::adjustChordNoteDurations: chord @dur comes from the first
  // note; re-set the durations of any notes whose duration differs.
  public adjustChordNoteDurations(chord: Chord, notes: Note[], tstrings: string[]): void {
    if (notes.length !== tstrings.length) return;

    const durations: HumNum[] = new Array(tstrings.length).fill(null).map(() => new HumNum(0));
    for (let i = 0; i < tstrings.length; ++i) {
      let value = recipToDuration(tstrings[i]);
      if (value.isZero()) {
        if (i === 0) value = new HumNum(1);
        else value = durations[i - 1];
      }
      durations[i] = value;
    }
    let same = true;
    for (let i = 1; i < durations.length; ++i) {
      if (durations[0].getFloat() !== durations[i].getFloat()) { same = false; break; }
    }
    if (same) return;

    const dots = chord.GetDots();
    const meidur = chord.GetDur();
    // meidur is a power of two, where 2 = whole note, 1 = breve, 0 = long,
    // -1 = maxima, 3 = half note, 4 = quarter, 5 = eighth, etc.
    let hdur = new HumNum(1);
    const powtwo = meidur - 2;
    if (powtwo > 0) hdur = hdur.div(1 << powtwo);
    else if (powtwo < 0) hdur = new HumNum(1 << -powtwo);

    for (let i = 1; i < durations.length; ++i) {
      if (durations[0].getFloat() !== durations[i].getFloat()) {
        const factor = durations[i].div(durations[0]);
        this.adjustChordNoteDuration(notes[i], hdur, meidur, dots, durations[0], tstrings[i], factor);
      }
    }
  }

  // C++ HumdrumInput::adjustChordNoteDuration (dots == -1 means no @dots set).
  public adjustChordNoteDuration(
    note: Note, hdur: HumNum, meidur: number, dots: number, _chorddur: HumNum,
    tstring: string, factor: HumNum,
  ): void {
    if (factor.isPowerOfTwo()) {
      // Handle simple case where dots are the same:
      const adjustment = Math.trunc(Math.log2(factor.getFloat()));
      this.setNoteMeiDur(note, meidur - adjustment);
      return;
    }

    // There is a difference in dot counts that also needs to be taken into account.
    let ndots = 0;
    for (let i = 0; i < tstring.length; ++i) {
      if (tstring[i] === '.') ndots++;
    }

    let dotdiff: number;
    if (dots < 0) dotdiff = ndots;
    else dotdiff = ndots - dots;
    if (dotdiff === 0) {
      // something strange happened
      return;
    }

    // check if the @dur of the note needs to be set
    const nodots = recipToDurationNoDots(tstring);

    // converting hdur to whole-note units for comparison
    if (nodots.getFloat() !== hdur.mul(4).getFloat()) {
      // different @dur, so set for note
      this.setRhythmFromDuration(note, nodots);
    }

    note.SetDots(ndots);
  }

  // C++ HumdrumInput::handleColoration: *col .. *Xcol around notes becomes a
  // coloration BracketSpan between the first/last note/rest location IDs.
  public handleColoration(token: HTok): void {
    if (token.compare(0, 4, '*col') !== 0) return;
    let colend = token.getNextToken();
    let firstnote: HTok | null = null;
    let lastnote: HTok | null = null;
    while (colend !== null) {
      if (colend.compare(0, 5, '*Xcol') === 0) break;
      if (colend.isNote() || colend.isRest()) {
        if (firstnote === null) firstnote = colend;
        lastnote = colend;
      }
      colend = colend.getNextToken();
    }
    if (colend === null) return;
    if (firstnote === null) return;
    if (lastnote === null) return;
    const coloration = new BracketSpan();
    const startline = token.getLineNumber();
    const startfield = token.getFieldNumber();
    const stopline = colend.getLineNumber();
    const stopfield = colend.getFieldNumber();
    coloration.SetID(`coloration-L${startline}F${startfield}-L${stopline}F${stopfield}`);
    const firstid = firstnote.isNote()
      ? this.getLocationId('note', firstnote)
      : this.getLocationId('rest', firstnote);
    coloration.SetStartid('#' + firstid);
    const lastid = lastnote.isNote()
      ? this.getLocationId('note', lastnote)
      : this.getLocationId('rest', lastnote);
    coloration.SetEndid('#' + lastid);
    coloration.SetFunc(bracketSpanLog_FUNC_coloration);
    this.addChildMeasureOrSection(coloration);
  }

  public addPlicaDown(note: Note): void {
    const plica = new Plica();
    plica.SetDir(STEMDIRECTION_basic_down);
    note.AddChild(plica);
  }

  public addPlicaUp(note: Note): void {
    const plica = new Plica();
    plica.SetDir(STEMDIRECTION_basic_up);
    note.AddChild(plica);
  }

  // C++ HumdrumInput::convertMensuralToken: mensural note/rest to MEI with
  // recta/obliqua ligature stack handling, coloration flags, plica,
  // slur/phrase/direction processing, automatic stems, augmentation dots.
  // NOTE: token ligature predicates live on the token text here
  // (hasRectaLigatureBegin etc. are not yet humlib-core methods); behavior
  // matches Convert.has*Ligature* checks on the same text.
  public convertMensuralToken(
    elements: string[], pointers: VrvObject[], token: HTok, staffindex: number,
  ): void {
    if (token.isNull()) return;
    if (!token.isMensLike()) return;
    const ss = this.m_staffstates;
    const text = token.toString();
    const roff = Convert.hasRectaLigatureEnd(text);
    const ooff = Convert.hasObliquaLigatureEnd(text);
    const ron = Convert.hasRectaLigatureBegin(text);
    const oon = Convert.hasObliquaLigatureBegin(text);
    let turnoffrecta = false;
    let embeddedobliqua = false;
    if (roff) turnoffrecta = true;
    if (ooff) {
      if (elements[elements.length - 1] === 'ligature' && !ss[staffindex].ligature_obliqua) {
        embeddedobliqua = true;
      }
    }
    if (ooff && ss[staffindex].ligature_recta) embeddedobliqua = true;
    if (oon && elements[elements.length - 1] === 'ligature') embeddedobliqua = true;
    if (Convert.hasLigatureBegin(text)) {
      if (ron) ss[staffindex].ligature_recta = true;
      if (ron && oon) {
        ss[staffindex].ligature_recta = true;
        ss[staffindex].ligature_obliqua = true;
        const ligature = new Ligature();
        ligature.SetID(this.getLocationId('ligature', token));
        ligature.SetForm(LIGATUREFORM_recta);
        this.appendElement(elements, pointers, ligature);
        elements.push('ligature');
        pointers.push(ligature);
        embeddedobliqua = true;
      } else if (oon && elements[elements.length - 1] === 'ligature') {
        ss[staffindex].ligature_obliqua = true;
      } else if (oon) {
        ss[staffindex].ligature_obliqua = true;
        const ligature = new Ligature();
        ligature.SetID(this.getLocationId('ligature', token));
        ligature.SetForm(LIGATUREFORM_obliqua);
        this.appendElement(elements, pointers, ligature);
        elements.push('ligature');
        pointers.push(ligature);
      } else {
        const ligature = new Ligature();
        ligature.SetID(this.getLocationId('ligature', token));
        ligature.SetForm(LIGATUREFORM_recta);
        this.appendElement(elements, pointers, ligature);
        elements.push('ligature');
        pointers.push(ligature);
        ss[staffindex].ligature_recta = true;
      }
    }
    if (token.isRest()) {
      const rest = new Rest();
      this.setLocationId(rest, token);
      this.appendElement(elements, pointers, rest);
      this.convertRest(rest as never, token, -1, staffindex);
      if (text.indexOf('~') !== -1) {
        if (ss[staffindex].mensuration_type === 1) rest.SetColor('red');
      }
    } else if (token.isNote()) {
      const note = new Note();
      this.setLocationId(note, token);
      if (embeddedobliqua) note.SetLig(LIGATUREFORM_obliqua);
      this.appendElement(elements, pointers, note);
      this.convertNote(note, token, 0, staffindex);
      if (text.indexOf('~') !== -1) {
        note.SetColored(BOOLEAN_true);
        if (ss[staffindex].mensuration_type === 1) note.SetColor('red');
      }
      if (text.indexOf('k') !== -1) this.addPlicaUp(note);
      if (text.indexOf('K') !== -1) this.addPlicaDown(note);
      this.processSlurs(token);
      this.processPhrases(token);
      this.processDirections(token, staffindex);
      let hasstem = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === 'M' || c === 'm' || c === 'U' || c === 'u' || c === 'L' || c === 'X') {
          hasstem = true;
          break;
        }
      }
      if (hasstem) this.assignAutomaticStem(note, token, staffindex);
      if (text.indexOf(':') !== -1) {
        const dot = new Dot();
        dot.SetForm(dotLog_FORM_aug);
        this.appendElement(elements, pointers, dot);
      }
    }
    if (roff || ooff) {
      if (elements[elements.length - 1] === 'ligature') {
        if (roff) {
          this.popElementStack(elements, pointers);
        } else if (ooff && !turnoffrecta && !ss[staffindex].ligature_recta) {
          this.popElementStack(elements, pointers);
        }
      } else {
        LogWarning('In HumdrumInput::convertMensuralToken: Unmatched ligature ending');
      }
    }
    if (roff) ss[staffindex].ligature_recta = false;
    if (ooff) ss[staffindex].ligature_obliqua = false;
  }

  // C++ HumdrumInput::convertMensuralRhythm (template on ELEMENT): mensural
  // token rhythm to mensural @dur (+ @dur.ges when a visual duration is
  // present). The commented-out SetDurGes fallback block is kept out
  // deliberately, matching the compiled C++ behavior (dead code).
  public convertMensuralRhythm(
    element: Note | Rest | Chord, token: HTok, subtoken: number,
  ): HumNum {
    let tstring: string;
    if (subtoken < 0) {
      tstring = token.toString().replace(/^ +/, '');
    } else {
      tstring = token.getSubtoken(subtoken);
    }
    const vstring = token.getVisualDuration(subtoken);
    let dur: HumNum;
    let durges = new HumNum(0);
    if (vstring === '') {
      dur = this.mensToDurationNoDots(tstring).div(4).mul(this.m_tupletscaling);
    } else {
      dur = this.mensToDurationNoDots(vstring).div(4).mul(this.m_tupletscaling);
      durges = this.mensToDurationNoDots(tstring).div(4).mul(this.m_tupletscaling);
    }
    this.setMensuralDur(element, dur);
    if (vstring !== '') {
      this.setMensuralDurGes(element, durges);
      return durges;
    }
    return dur;
  }

  private setMensuralDur(element: Note | Rest | Chord, dur: HumNum): void {
    if (dur.isInteger()) {
      switch (dur.getNumerator()) {
        case 1: element.SetDur(DURATION_semibrevis); return;
        case 2: element.SetDur(DURATION_brevis); return;
        case 4: element.SetDur(DURATION_longa); return;
        case 8: element.SetDur(DURATION_maxima); return;
      }
      return;
    }
    if (dur.getNumerator() !== 1) return;
    switch (dur.getDenominator()) {
      case 2: element.SetDur(DURATION_minima); break;
      case 4: element.SetDur(DURATION_semiminima); break;
      case 8: element.SetDur(DURATION_fusa); break;
      case 16: element.SetDur(DURATION_semifusa); break;
      case 32: element.SetDur(DURATION_32); break;
      case 64: element.SetDur(DURATION_64); break;
      case 128: element.SetDur(DURATION_128); break;
      case 256: element.SetDur(DURATION_256); break;
      case 512: element.SetDur(DURATION_512); break;
      case 1024: element.SetDur(DURATION_1024); break;
      case 2048: element.SetDur(DURATION_2048); break;
    }
  }

  private setMensuralDurGes(element: Note | Rest | Chord, durges: HumNum): void {
    if (durges.isInteger()) {
      switch (durges.getNumerator()) {
        case 1: element.SetDurGes(DURATION_semibrevis); return;
        case 2: element.SetDurGes(DURATION_brevis); return;
        case 4: element.SetDurGes(DURATION_longa); return;
        case 8: element.SetDurGes(DURATION_maxima); return;
      }
      return;
    }
    if (durges.getNumerator() !== 1) return;
    switch (durges.getDenominator()) {
      case 2: element.SetDurGes(DURATION_minima); break;
      case 4: element.SetDurGes(DURATION_semiminima); break;
      case 8: element.SetDurGes(DURATION_fusa); break;
      case 16: element.SetDurGes(DURATION_semifusa); break;
      case 32: element.SetDurGes(DURATION_32); break;
      case 64: element.SetDurGes(DURATION_64); break;
      case 128: element.SetDurGes(DURATION_128); break;
      case 256: element.SetDurGes(DURATION_256); break;
      case 512: element.SetDurGes(DURATION_512); break;
      case 1024: element.SetDurGes(DURATION_1024); break;
      case 2048: element.SetDurGes(DURATION_2048); break;
    }
  }

  // C++ HumdrumInput::setRhythmFromDuration (template on ELEMENT): @dur + @dots
  // from a quarter-note duration via getDurAndDots.
  public setRhythmFromDuration(element: Note | Rest | Chord, duration: HumNum): void {
    const [dur, dots] = this.getDurAndDots(duration);
    element.SetDur(dur);
    if (dots !== 0) element.SetDots(dots);
  }

  // C++ HumdrumInput::setVisualAndGesturalRhythmFromDuration (template on
  // ELEMENT): visual @dur/@dots plus gestural @dur.ges/@dots.ges.
  public setVisualAndGesturalRhythmFromDuration(
    element: Note | Rest | Chord, visdur: HumNum, gesdur: HumNum,
  ): void {
    let durGesSet = false;
    const [visDur, visDots] = this.getDurAndDots(visdur);
    element.SetDur(visDur);
    if (visDots !== 0) element.SetDots(visDots);
    const [gesDur, gesDots] = this.getDurAndDots(gesdur);
    if (gesDur !== visDur) {
      element.SetDurGes(gesDur);
      durGesSet = true;
    }
    if (!durGesSet) {
      if (gesDots !== visDots) element.SetDotsGes(gesDots);
    } else {
      element.SetDotsGes(gesDots);
    }
  }

  // C++ HumdrumInput::analyzeFingerings (file + spine overloads): carry
  // *fs:/*color:/*bold/Xbold/*italic/Xitalic styling forward as auto values
  // on following data tokens.
  public analyzeFingeringsFile(infile: HumdrumFile): void {
    for (const sstart of infile.getSpineStartList()) {
      if (sstart !== null) this.analyzeFingeringsSpine(sstart);
    }
  }

  public analyzeFingeringsSpine(sstart: HTok): void {
    let current: HTok | null = sstart;
    const hre = new HumRegex();
    let fontsize = '';
    let color = '';
    let boldQ = true;
    let italicQ = false;
    while (current !== null) {
      current = current.getNextToken();
      if (current === null) break;
      if (current.toString() === '.') continue;
      if (current.toString() === '*') continue;
      if (current.isInterpretation()) {
        if (hre.search(current.toString(), '^\\*fs:\\s*(.*?)\\s*$')) {
          const testfont = hre.getMatch(1);
          if (testfont === 'small') fontsize = 'x-small';
          else if (testfont === 'large') fontsize = 'normal';
          else fontsize = '';
        }
        if (hre.search(current.toString(), '^\\*color:\\s*(.*?)\\s*$')) {
          const testcolor = hre.getMatch(1);
          if (testcolor === 'black' || testcolor === '#000000' || testcolor === '#000') color = '';
          else color = testcolor;
        }
        if (current.toString() === '*bold') boldQ = true;
        else if (current.toString() === '*Xbold') boldQ = false;
        if (current.toString() === '*italic') italicQ = true;
        else if (current.toString() === '*Xitalic') italicQ = false;
        continue;
      }
      if (!current.isData()) continue;
      if (fontsize !== '') current.setValue('auto', 'fontsize', fontsize);
      if (color !== '') current.setValue('auto', 'color', color);
      if (!boldQ) current.setValue('auto', 'unbold', 1);
      if (italicQ) current.setValue('auto', 'italic', 1);
    }
  }

  // C++ HumdrumInput::analyzeHarmInterpretations: **adata/**bdata place
  // above/below; **mxhm ignores labels; key designations/*v: labels attach
  // to the next non-null data token as auto keyLabel(+Style).
  public analyzeHarmInterpretations(starttok: HTok): void {
    let aboveQ = false;
    let belowQ = false;
    let ignoreLabels = false;
    const hre = new HumRegex();
    if (hre.search(starttok.getDataType(), '^\\*\\*adata')) aboveQ = true;
    else if (hre.search(starttok.getDataType(), '^\\*\\*bdata')) belowQ = true;
    else if (hre.search(starttok.getDataType(), '^\\*\\*mxhm')) ignoreLabels = true;
    let keydesig: HTok | null = null;
    let verselabel: HTok | null = null;
    let current: HTok | null = starttok;
    let initialLabel = '';
    if (!ignoreLabels && hre.search(current.getDataType(), '^\\*\\*[ab]data-(.*)')) {
      initialLabel = hre.getMatch(1);
    }
    while (current !== null) {
      current = current.getNextToken();
      if (current === null) break;
      if (current.isData() && !current.isNull()) {
        if (aboveQ) current.setValue('auto', 'above', 1);
        else if (belowQ) current.setValue('auto', 'below', 1);
        if (!ignoreLabels) {
          if (keydesig !== null && keydesig.toString() !== '') {
            const label = keydesig.toString().substring(1);
            if (label !== '') current.setValue('auto', 'keyLabel', label);
            keydesig = null;
            verselabel = null;
          } else if (verselabel !== null) {
            if (hre.search(verselabel.toString(), '^\\*v([ib]*):(.+)$')) {
              const style = hre.getMatch(1);
              const label = hre.getMatch(2);
              current.setValue('auto', 'keyLabel', label);
              if (style !== '') current.setValue('auto', 'keyLabelStyle', style);
            }
            keydesig = null;
            verselabel = null;
          } else if (initialLabel !== '') {
            current.setValue('auto', 'keyLabel', initialLabel + ':');
            initialLabel = '';
          }
        }
      }
      if (!current.isInterpretation()) continue;
      if (current.toString() === '*above') { belowQ = false; aboveQ = true; }
      else if (current.toString() === '*below') { aboveQ = false; belowQ = true; }
      if (ignoreLabels) continue;
      if (current.isKeyDesignation()) keydesig = current;
      else if (hre.search(current.toString(), '^\\*v[bi]*:')) verselabel = current;
    }
  }

  // C++ HumdrumInput::analyzeDegreeInterpretations: carry the full *above/
  // *below/*bold/*box/*circ/*acc/*arr/*dir/*fs:/*hat/*hide/*italic/key/*minnat/
  // *minhar/*octave/*solf state set forward as auto values on data tokens.
  public analyzeDegreeInterpretations(starttok: HTok): void {
    let aboveQ = false;
    let arrowQ = false;
    let revarrQ = false;
    let revaccQ = false;
    let boldQ = false;
    let boxQ = false;
    let circleQ = false;
    let degaccQ = true;
    let dirQ = true;
    let hatQ = false;
    let hideQ = false;
    let italicQ = false;
    let minorQ = false;
    let octaveQ = true;
    let solfQ = false;
    let circleline = 0;
    let boxline = 0;
    let fontsize = '';
    let minmode = 'minhar';
    let keydesig: HTok | null = null;
    let current: HTok | null = starttok;
    while (current !== null) {
      current = current.getNextToken();
      if (current === null) break;
      if (current.isData() && !current.isNull()) {
        if (hideQ) { current.setValue('auto', 'hidden', 1); continue; }
        if (aboveQ) current.setValue('auto', 'above', 1);
        if (revarrQ) {
          arrowQ = true; revaccQ = false; arrowQ = true;
          current.setValue('auto', 'arrR', 1);
        }
        if (revaccQ) {
          arrowQ = false; revarrQ = false; revaccQ = true;
          current.setValue('auto', 'accR', 1);
        }
        if (arrowQ || revarrQ) {
          const t = current.toString();
          if (t.indexOf('+') !== -1 || t.indexOf('-') !== -1 || t.indexOf('n') !== -1) {
            current.setValue('auto', 'arrow', 1);
          }
          if (minmode === 'minnat' && t.indexOf('7') !== -1) current.setValue('auto', 'arrow', 1);
        }
        if (boldQ) current.setValue('auto', 'bold', 1);
        if (boxQ && circleline < boxline) current.setValue('auto', 'box', 1);
        if (circleQ && boxline < circleline) current.setValue('auto', 'circle', 1);
        if (!degaccQ) current.setValue('auto', 'nodegacc', 1);
        if (!dirQ) current.setValue('auto', 'Xdir', 1);
        if (fontsize !== '') current.setValue('auto', 'fontsize', fontsize);
        if (hatQ) current.setValue('auto', 'hat', 1);
        if (hideQ) current.setValue('auto', 'hide', 1);
        if (italicQ) current.setValue('auto', 'italic', 1);
        if (keydesig !== null) {
          current.setValue('auto', 'keyLabel', keydesig.toString().substring(1));
          keydesig = null;
        }
        if (minorQ) current.setValue('auto', 'minor', 1);
        if (minorQ && current.toString().indexOf('7') !== -1 && minmode === 'minnat') {
          current.setValue('auto', 'minnat', 1);
        }
        if (!octaveQ) current.setValue('auto', 'Xoctave', 1);
        if (solfQ) current.setValue('auto', 'solf', 1);
      }
      if (!current.isInterpretation()) continue;
      const it = current.toString();
      if (it === '*above') aboveQ = true;
      else if (it === '*acc') degaccQ = true;
      else if (it === '*Xacc') degaccQ = false;
      else if (it === '*accR') { arrowQ = false; revaccQ = true; revarrQ = false; }
      else if (it === '*arr') arrowQ = true;
      else if (it === '*Xarr') arrowQ = false;
      else if (it === '*arrR') { arrowQ = true; revaccQ = false; revarrQ = true; }
      else if (it === '*below') aboveQ = false;
      else if (it === '*bold') boldQ = true;
      else if (it === '*Xbold') boldQ = false;
      else if (it === '*box') { boxQ = true; boxline = current.getLineIndex(); }
      else if (it === '*Xbox') { boxQ = false; boxline = 0; }
      else if (it === '*circ') { circleQ = true; circleline = current.getLineIndex(); }
      else if (it === '*Xcirc') { circleQ = false; circleline = 0; }
      else if (it === '*dir') dirQ = true;
      else if (it === '*Xdir') dirQ = false;
      else if (current.compare(0, 4, '*fs:') === 0) {
        fontsize = current.toString().substring(4);
        if (fontsize === 'normal') fontsize = '';
      }
      else if (it === '*hat') hatQ = true;
      else if (it === '*Xhat') hatQ = false;
      else if (it === '*hide') hideQ = true;
      else if (it === '*Xhide') hideQ = false;
      else if (it === '*italic') italicQ = true;
      else if (it === '*Xitalic') italicQ = false;
      else if (current.isKeyDesignation()) {
        keydesig = current;
        const letter = current.toString()[1];
        if (letter === 'X' || letter === 'x') minorQ = false;
        else if (letter >= 'a' && letter <= 'z') minorQ = true;
        else minorQ = false;
      }
      else if (it === '*minnat') minmode = 'minnat';
      else if (it === '*minhar') minmode = 'minhar';
      else if (it === '*octave') octaveQ = true;
      else if (it === '*Xoctave') octaveQ = false;
      else if (it === '*solf') solfQ = true;
      else if (it === '*Xsolf') solfQ = false;
    }
  }

  // C++ HumdrumInput::analyzeTextInterpretation: *elision/*Xelision controls
  // space-to-nbsp styling; *worex/*Xworex adds/suppresses '_' word extenders
  // across melisma note counts.
  public analyzeTextInterpretation(starttok: HTok): void {
    let current: HTok | null = starttok;
    let lastend: HTok | null = null;
    let melismaNoteCount = 0;
    let elisionQ = true;
    let foundWorex = false;
    let worexQ = false;
    const hre = new HumRegex();
    // C++ repeats this block twice (in-loop and after-loop); shared helper
    // preserves the exact branch order.
    const checkWorexEnd = (): void => {
      if (lastend === null) return;
      const lt = lastend.toString();
      if (lt.endsWith('_') || hre.search(lt, '[^-]$')) {
        if (melismaNoteCount !== 0) {
          if (worexQ && lt !== '') {
            if (!lt.endsWith('_')) lastend.setValue('auto', 'text', lt + '_');
          } else {
            if (lt !== '' && lt.endsWith('_')) lastend.setValue('auto', 'text', lt.substring(0, lt.length - 1));
          }
        }
        melismaNoteCount = 0;
        lastend = null;
      }
      lastend = null;
    };
    while (current !== null) {
      if (current.isInterpretation()) {
        const it = current.toString();
        if (it === '*elision') elisionQ = true;
        else if (it === '*Xelision') elisionQ = false;
        if (it === '*worex') { foundWorex = true; worexQ = true; }
        else if (it === '*Xworex') { foundWorex = true; worexQ = false; }
      }
      if (!current.isData()) { current = current.getNextToken(); continue; }
      if (current.isNull()) {
        melismaNoteCount += this.hasParallelNote(current);
        current = current.getNextToken();
        continue;
      }
      if (foundWorex) {
        checkWorexEnd();
        const ct = current.toString();
        if (ct.endsWith('_') || hre.search(ct, '[^-]$')) {
          melismaNoteCount = 0;
          lastend = current;
        } else {
          lastend = null;
        }
      }
      if (!elisionQ) {
        if (current.toString().indexOf(' ') === -1) { current = current.getNextToken(); continue; }
        current.setValue('auto', 'text', current.toString().split('&#160;').join(' '));
      }
      current = current.getNextToken();
    }
    if (foundWorex) checkWorexEnd();
  }

  // C++ HumdrumInput::hasParallelNote: scan left on the line for a note
  // attack (or tied note) on the first staff-like track found.
  public hasParallelNote(token: HTok): number {
    let current: HTok | null = token;
    let track = -1;
    while (current !== null) {
      current = current.getPreviousField();
      if (current === null) break;
      if (current.isStaff()) {
        const ctrack = current.getTrack();
        if (track < 0) track = ctrack;
        if (track !== ctrack) return 0;
        if (current.isNull()) continue;
        if (current.isNote()) return 1;
      }
    }
    return 0;
  }

  // C++ HumdrumInput::prepareFingerings (file + spine overloads): carry
  // *above/*below (*Xabove/*Xbelow to clear) per subtrack forward as auto
  // place values on **fing data tokens.
  public prepareFingeringsFile(infile: HumdrumFile): void {
    if (!this.m_fing) return;
    for (const fstart of infile.getSpineStartListFiltered('**fing')) {
      if (fstart !== null) this.prepareFingeringsSpine(fstart);
    }
  }

  public prepareFingeringsSpine(fstart: HTok): void {
    const states: number[] = new Array(100).fill(0);
    let current: HTok | null = fstart.getNextToken();
    while (current !== null) {
      if (current.isInterpretation()) {
        let fcurrent: HTok | null = current;
        const track = fcurrent.getTrack();
        while (fcurrent !== null) {
          if (fcurrent.getTrack() !== track) break;
          const it = fcurrent.toString();
          const subtrack = fcurrent.getSubtrack();
          if (it === '*above') states[subtrack] = 1;
          else if (it === '*Xabove') states[subtrack] = 0;
          else if (it === '*below') states[subtrack] = -1;
          else if (it === '*Xbelow') states[subtrack] = 0;
          fcurrent = fcurrent.getNextFieldToken();
        }
      }
      if (!current.isData()) { current = current.getNextToken(); continue; }
      if (current.isNull()) { current = current.getNextToken(); continue; }
      let fcurrent: HTok | null = current;
      const track = fcurrent.getTrack();
      while (fcurrent !== null) {
        if (fcurrent.getTrack() !== track) break;
        if (fcurrent.isNull()) { fcurrent = fcurrent.getNextFieldToken(); continue; }
        const subtrack = fcurrent.getSubtrack();
        if (states[subtrack] !== 0) {
          fcurrent.setValue('auto', 'place', states[subtrack] > 0 ? 'above' : 'below');
        }
        fcurrent = fcurrent.getNextFieldToken();
      }
      current = current.getNextToken();
    }
  }

  // C++ HumdrumInput::addFingeringsForMeasure: **fing tokens per line become
  // <fing> via insertFingerNumberInMeasure (space-split numbers); side-by-side
  // **fing spines on the same track default below, auto place wins.
  public addFingeringsForMeasure(startline: number, endline: number): void {
    if (this.m_measure === null) return;
    const staffstarts = this.m_staffstarts;
    const infile = this.m_infiles.at(0);
    const hre = new HumRegex();
    for (let i = startline; i < endline; ++i) {
      if (!infile.at(i).isData()) continue;
      let track = 0;
      for (let j = 0; j < infile.at(i).getFieldCount(); ++j) {
        const token = infile.token(i, j)!;
        if (token.isDataType('**kern')) track = token.getTrack();
        if (token.isNull()) continue;
        if (!token.isDataType('**fing')) continue;
        const content = token.getText();
        if (content === '') continue;
        const nums: string[] = [];
        hre.split(nums, content, ' ');
        const ztrack = token.getTrack();
        let aboveQ = true;
        if (j > 0 && infile.token(i, j - 1)!.isDataType('**fing')) {
          if (ztrack === infile.token(i, j - 1)!.getTrack()) aboveQ = false;
        }
        const staffindex = this.m_rkern[track];
        const maxstaff = staffstarts.length;
        if (token.getValue('auto', 'place') === 'above') aboveQ = true;
        else if (token.getValue('auto', 'place') === 'below') aboveQ = false;
        for (const num of nums) this.insertFingerNumberInMeasure(num, staffindex, token, maxstaff, aboveQ);
      }
    }
  }

  // C++ HumdrumInput::insertFingerNumberInMeasure: single <fing> with rend
  // text, fontsize/color/bold/italic styling, above/below placement, linked
  // to the parallel note (or tstamp fallback).
  public insertFingerNumberInMeasure(
    text: string, staffindex: number, token: HTok, maxstaff: number, aboveQ: boolean,
  ): void {
    const fing = new Fing();
    let xstaffindex = 0;
    if (staffindex >= 0) {
      xstaffindex = staffindex;
      this.setStaff(fing, staffindex + 1);
    } else {
      xstaffindex = maxstaff - 1;
      this.setStaff(fing, xstaffindex + 1);
    }
    const rend = new Rend();
    this.addTextElement(rend, text);
    fing.AddChild(rend);
    const fontsize = token.getValue('auto', 'fontsize');
    if (fontsize === '') {
      // default fingering size
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_small);
      rend.SetFontsize(fs);
    } else if (fontsize === 'x-small') {
      // small fingering size
      const fs = new data_FONTSIZE();
      fs.SetTerm(FONTSIZETERM_x_small);
      rend.SetFontsize(fs);
    } else if (fontsize === 'normal') {
      // large fingering size (verovio default style)
    }
    const color = token.getValue('auto', 'color');
    if (color !== '') rend.SetColor(color);
    if (token.getValueBool('auto', 'unbold')) rend.SetFontweight(FONTWEIGHT_normal);
    if (token.getValueBool('auto', 'italic')) rend.SetFontstyle(FONTSTYLE_italic);
    if (aboveQ) this.setPlaceRelStaff(fing, 'above', false);
    else this.setPlaceRelStaff(fing, 'below', false);
    this.addChildMeasureOrSection(fing);
    this.setLocationId(fing, token);
    this.linkFingeringToNote(fing, token, xstaffindex);
  }

  // C++ HumdrumInput::linkFingeringToNote: link to the last non-null token
  // on the nearest kern-like track to the left (chord vs note by space);
  // tstamp fallback when no note found (e.g. finger-change).
  public linkFingeringToNote(fing: Fing, token: HTok, xstaffindex: number): void {
    let linkednote: HTok | null = null;
    let linktrack = -1;
    const line = token.getLine();
    if (line !== null) {
      const startfield = token.getFieldIndex();
      for (let i = startfield - 1; i >= 0; i--) {
        const testtok = line.token(i);
        if (testtok === null || !testtok.isKernLike()) continue;
        linktrack = testtok.getTrack();
        for (let j = i; j >= 0; j--) {
          const t2 = line.token(j);
          if (t2 === null) continue;
          if (t2.getTrack() !== linktrack) break;
          if (!t2.isNull()) linkednote = t2;
        }
        break;
      }
    }
    if (linkednote === null) {
      fing.SetTstamp(this.getMeasureTstamp(token, xstaffindex).getFloat());
    } else {
      const startid = linkednote.toString().indexOf(' ') !== -1
        ? this.getLocationId('chord', linkednote)
        : this.getLocationId('note', linkednote);
      fing.SetStartid('#' + startid);
    }
  }

  // C++ HumdrumInput::addStringNumbersForMeasure: **string tokens become
  // <harm> with circled-number text, tstamp, type tag, location ID.
  public addStringNumbersForMeasure(startline: number, endline: number): void {
    if (this.m_measure === null) return;
    let xstaffindex = 0;
    const staffstarts = this.m_staffstarts;
    const infile = this.m_infiles.at(0);
    for (let i = startline; i < endline; ++i) {
      if (!infile.at(i).isData()) continue;
      let track = 0;
      for (let j = 0; j < infile.at(i).getFieldCount(); ++j) {
        const token = infile.token(i, j)!;
        if (token.isDataType('**kern')) track = token.getTrack();
        if (token.isNull()) continue;
        if (!token.isDataType('**string')) continue;
        const harm = new Harm();
        const text = new Text();
        const staffindex = this.m_rkern[track];
        if (staffindex >= 0) {
          xstaffindex = staffindex;
          this.setStaff(harm, staffindex + 1);
        } else {
          xstaffindex = staffstarts.length - 1;
          this.setStaff(harm, xstaffindex + 1);
        }
        text.SetText(this.cleanStringString(token.toString()));
        harm.AddChild(text);
        this.addChildMeasureOrSection(harm);
        harm.SetTstamp(this.getMeasureTstamp(token, xstaffindex).getFloat());
        this.appendTypeTag(harm, 'string');
        this.setLocationId(harm, token);
      }
    }
  }

  // C++ HumdrumInput::cleanStringString: digits become enclosed (circled)
  // alphanumerics U+2460..U+2468 / U+24EA; other chars pass through.
  public cleanStringString(content: string): number[] {
    const output: number[] = [];
    const circled = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
    for (const ch of content) {
      if (ch >= '0' && ch <= '9') {
        for (const c of circled[ch.charCodeAt(0) - 48]) output.push(c.codePointAt(0) ?? 0);
      } else {
        output.push(ch.codePointAt(0) ?? 0);
      }
    }
    return output;
  }

  // C++ HumdrumInput::splitFBString: split string on separator using HumRegex.
  public splitFBString(content: string, separator = ' '): string[] {
    const hre = new HumRegex();
    const pieces: string[] = [];
    hre.split(pieces, content, separator);
    return pieces;
  }

  // C++ HumdrumInput::cleanFBString: convert each FB figure slot, dropping
  // empty 'K' slots unless 'x'/'X' is present.
  public cleanFBString(pieces: string[], token: HTok): number[][] {
    const todelete: boolean[] = new Array(pieces.length).fill(false);
    const output: number[][] = new Array(pieces.length);
    for (let i = 0; i < pieces.length; ++i) {
      output[i] = this.convertFBNumber(pieces[i], token);
      if (pieces[i].indexOf('K') !== -1
        && pieces[i].indexOf('x') === -1 && pieces[i].indexOf('X') === -1) {
        todelete[i] = true;
      }
    }
    for (let i = todelete.length - 1; i >= 0; i--) {
      if (!todelete[i]) continue;
      output.splice(i, 1);
    }
    return output;
  }

  // C++ HumdrumInput::cleanFBString2: concatenate multiple figures with hyphens.
  public cleanFBString2(pieces: string[], token: HTok): number[] {
    const output: number[] = [];
    for (let i = 0; i < pieces.length; ++i) {
      output.push(...this.convertFBNumber(pieces[i], token));
      if (i < pieces.length - 1) {
        if (pieces[i + 1] === '') {
          output.push(0x20); // space
        }
        output.push(0x2D); // hyphen
      }
    }
    return output;
  }

  // C++ HumdrumInput::convertNumberToWstring: convert integer to SMuFL figured bass digits.
  public convertNumberToWstring(number: number): number[] {
    if (number < 0) return [];
    const value = String(number);
    const output: number[] = [];
    for (let i = 0; i < value.length; ++i) {
      switch (value[i]) {
        case '0': output.push(0xEA50); break;
        case '1': output.push(0xEA51); break;
        case '2': output.push(0xEA52); break;
        case '3': output.push(0xEA54); break;
        case '4': output.push(0xEA55); break;
        case '5': output.push(0xEA57); break;
        case '6': output.push(0xEA5B); break;
        case '7': output.push(0xEA5D); break;
        case '8': output.push(0xEA60); break;
        case '9': output.push(0xEA61); break;
      }
    }
    return output;
  }

  // C++ HumdrumInput::getVisualFBAccidental: SMuFL accidental glyph code points.
  public getVisualFBAccidental(accidental: number): number[] {
    switch (accidental) {
      case 1: return [0xE264]; // SMuFL double-flat
      case 2: return [0xE260]; // SMuFL flat
      case 3: return [0xE261]; // SMuFL natural
      case 4: return [0xE262]; // SMuFL sharp
      case 5: return [0xE263]; // SMuFL double-sharp
      case 6: return [0x2B];   // '+'
    }
    return [];
  }

  // C++ HumdrumInput::convertFBNumber: converts a figured bass token piece into
  // SMuFL glyph code points with accidentals, brackets, slashes, and extenders.
  public convertFBNumber(input: string, token: HTok): number[] {
    let output: number[] = [];
    const track = token.getTrack();
    const reverse = this.m_reverse[track] ?? 0;

    if (input.indexOf('K') !== -1) return output;

    let found = false;
    let digit = 0;
    for (let i = 0; i < input.length; ++i) {
      const c = input[i];
      if (c >= '0' && c <= '9') {
        found = true;
        const val = c.charCodeAt(0) - 48;
        if (i > 0 && input[i - 1] >= '0' && input[i - 1] <= '9') {
          digit = 10 * digit + val;
        } else {
          digit = val;
        }
      }
    }
    if (!found) digit = -1;

    let slash = 0;
    if (input.indexOf('/') !== -1) slash = 1;
    else if (input.indexOf('\\') !== -1) slash = 2;
    else if (input.indexOf('|') !== -1) slash = 3;

    if (!this.m_slash[track]) slash = 0;
    if (digit > 9) slash = 0;

    let accidental = 0;
    if (input.indexOf('+') !== -1) accidental = 6;
    else if (input.indexOf('--') !== -1) accidental = 1;
    else if (input.indexOf('##') !== -1) accidental = 5;
    else if (input.indexOf('-') !== -1) accidental = 2;
    else if (input.indexOf('#') !== -1) accidental = 4;
    else if (input.indexOf('n') !== -1) accidental = 3;

    if (this.m_absolute[track]) {
      if (input.indexOf('n') !== -1) accidental = 3;
    }

    if (input.indexOf('k') !== -1) accidental = 0;

    if (input.indexOf('~') !== -1) output.push(0x2D); // '-'

    // Accidental in front of number unless 'r' or reverse:
    if (!slash && input.indexOf('r') === -1 && !reverse) {
      let accid = this.getVisualFBAccidental(accidental);
      if (accidental && input.indexOf('i') !== -1) {
        accid = [0x5B, ...accid, 0x5D];
      } else if (accidental && input.indexOf('j') !== -1) {
        accid = [0x28, ...accid, 0x29];
      }
      output.push(...accid);
    }

    if (!slash) {
      output.push(...this.convertNumberToWstring(digit));
    } else {
      switch (digit) {
        case 0: output.push(0xEA50); break;
        case 1: output.push(0xEA51); break;
        case 2: output.push(0xEA53); break;
        case 3: output.push(0xEA54); break;
        case 4: output.push(0xEA56); break;
        case 5:
          switch (slash) {
            case 1: output.push(0xEA5A); break;
            case 2: output.push(0xEA59); break;
            case 3: output.push(0xEA58); break;
            default: output.push(0xEA57); break;
          }
          break;
        case 6:
          switch (slash) {
            case 1:
            case 2:
            case 3: output.push(0xEA5C); break;
            default: output.push(0xEA5B); break;
          }
          break;
        case 7:
          switch (slash) {
            case 1: output.push(0xECC0); break;
            case 2: output.push(0xEA5F); break;
            case 3: output.push(0xEA5E); break;
            default: output.push(0xEA5D); break;
          }
          break;
        case 8: output.push(0xEA60); break;
        case 9: output.push(0xEA62); break;
      }
    }

    // Accidental after number if 'r' or reverse:
    if (!slash && (input.indexOf('r') !== -1 || reverse)) {
      let accid = this.getVisualFBAccidental(accidental);
      if (accidental && input.indexOf('i') !== -1) {
        accid = [0x5B, ...accid, 0x5D];
      } else if (accidental && input.indexOf('j') !== -1) {
        accid = [0x28, ...accid, 0x29];
      }
      output.push(...accid);
    }

    if (input.indexOf('J') !== -1) {
      output = [0x28, ...output, 0x29];
    } else if (input.indexOf('I') !== -1) {
      output = [0x5B, ...output, 0x5D];
    } else if (slash) {
      if (input.indexOf('j') !== -1) {
        output = [0x28, ...output, 0x29];
      } else if (input.indexOf('i') !== -1) {
        output = [0x5B, ...output, 0x5D];
      }
    }

    if (input.indexOf('_') !== -1) output.push(0x20, 0x5F); // ' _'
    if (input.indexOf('=') !== -1) output.push(0x20, 0x2D); // ' -'

    return output;
  }

  // C++ HumdrumInput::checkForLineContinuations: if a null token's resolved
  // value has '_', emit placeholder underscores in F elements.
  public checkForLineContinuations(token: HTok): void {
    if (!token.isNull()) return;
    const resolved = token.resolveNull();
    if (resolved === null || resolved.toString().indexOf('_') === -1) return;

    const spinetrack = token.getTrack();
    const harm = new Harm();
    const fb = new Fb();

    if (token.isDataType('**fba')) {
      if (this.m_placement[spinetrack] === 0) {
        this.setPlaceRelStaff(harm, 'above', false);
      } else if (this.m_placement[spinetrack] === -1) {
        this.setPlaceRelStaff(harm, 'below', false);
      } else if (this.m_placement[spinetrack] === 1) {
        this.setPlaceRelStaff(harm, 'above', false);
      }
    } else {
      if (this.m_placement[spinetrack] === -1) {
        this.setPlaceRelStaff(harm, 'below', false);
      } else if (this.m_placement[spinetrack] === 1) {
        this.setPlaceRelStaff(harm, 'above', false);
      }
    }
    harm.AddChild(fb);

    const hre = new HumRegex();
    const pieces: string[] = [];
    hre.split(pieces, resolved.toString(), ' ');
    for (let i = 0; i < pieces.length; ++i) {
      const f = new F();
      if (pieces[i].indexOf('_') !== -1) {
        const text = new Text();
        text.SetText([0x5F]); // '_'
        f.AddChild(text);
      }
      fb.AddChild(f);
    }

    let kerntrack = -1;
    let current: HTp = token;
    while (current !== null) {
      if (current.isKernLike()) kerntrack = current.getTrack();
      current = current.getPreviousFieldToken();
    }

    this.addChildMeasureOrSection(harm);
    let staffindex = 0;
    if (kerntrack >= 0) staffindex = this.m_rkern[kerntrack] ?? 0;
    const tstamp = this.getMeasureTstamp(token, staffindex);
    harm.SetTstamp(tstamp.getFloat());
    this.setStaff(harm, staffindex + 1);
    this.setLocationId(harm, token);
    this.setLocationId(fb, token);
  }

  // C++ HumdrumInput::addFiguredBassForMeasure: iterate startline..endline,
  // process *above/*below/*auto/*reverse/*absolute/*slash interpretations,
  // and convert **fb/**fba/**Bnum data into <harm><fb><f><text> elements.
  public addFiguredBassForMeasure(startline: number, endline: number): void {
    if (this.m_measure === null) return;
    const infile = this.m_infiles.at(0);

    for (let i = startline; i < endline; ++i) {
      const line = infile.at(i);
      if (line.isInterpretation()) {
        let staffindex = 0;
        for (let j = 0; j < line.getFieldCount(); ++j) {
          if (j >= 999) break;
          const token = line.token(j)!;
          if (token.isKernLike() || token.isMensLike()) {
            staffindex++;
          }
          if (!(token.isDataType('**fb') || token.isDataType('**fba') || token.isDataType('**Bnum'))) {
            continue;
          }
          const track = token.getTrack();
          const it = token.toString();
          const index = Math.max(0, staffindex - 1);
          while (this.m_fbstates.length <= index) this.m_fbstates.push(0);
          if (it === '*above') {
            this.m_placement[track] = 1;
            this.m_fbstates[index] = 1;
          } else if (it === '*below') {
            this.m_placement[track] = -1;
            this.m_fbstates[index] = -1;
          } else if (it === '*auto') {
            this.m_placement[track] = 0;
            this.m_fbstates[index] = 0;
          } else if (it === '*reverse') {
            this.m_reverse[track] = 1;
          } else if (it === '*Xreverse') {
            this.m_reverse[track] = 0;
          } else if (it === '*absolute') {
            this.m_absolute[track] = 1;
          } else if (it === '*Xabsolute') {
            this.m_absolute[track] = 0;
          } else if (it === '*slash') {
            this.m_slash[track] = 1;
          } else if (it === '*Xslash') {
            this.m_slash[track] = 0;
          }
        }
        continue;
      }

      if (!line.isData()) continue;
      let kerntrack = 0;
      let spinetrack = 0;
      let active = true;

      for (let j = 0; j < line.getFieldCount(); ++j) {
        const token = line.token(j)!;
        const exinterp = token.getDataType();
        if (exinterp !== '**kern' && exinterp.indexOf('kern') !== -1) {
          active = false;
        }
        if (token.isDataType('**kern')) {
          kerntrack = token.getTrack();
          active = true;
        }
        if (!active) continue;
        if (!(token.isDataType('**fb') || token.isDataType('**fba') || token.isDataType('**Bnum'))) {
          continue;
        }
        if (token.isNull()) {
          this.checkForLineContinuations(token);
          continue;
        }
        if (token.toString() === '_') continue;

        spinetrack = token.getTrack();
        const harm = new Harm();
        const fb = new Fb();

        if (token.isDataType('**fba')) {
          if (this.m_placement[spinetrack] === 0) {
            this.setPlaceRelStaff(harm, 'above', false);
          } else if (this.m_placement[spinetrack] === -1) {
            this.setPlaceRelStaff(harm, 'below', false);
          } else if (this.m_placement[spinetrack] === 1) {
            this.setPlaceRelStaff(harm, 'above', false);
          }
        } else {
          if (this.m_placement[spinetrack] === -1) {
            this.setPlaceRelStaff(harm, 'below', false);
          } else if (this.m_placement[spinetrack] === 1) {
            this.setPlaceRelStaff(harm, 'above', false);
          }
        }
        harm.AddChild(fb);

        const pieces = this.splitFBString(token.toString(), ' ');
        const content = this.cleanFBString(pieces, token);
        if (content.length === 0) continue;

        for (let k = 0; k < content.length; ++k) {
          const f = new F();
          if (pieces[k] === 'x' || pieces[k] === 'X') {
            // suppress contents of <f>
          } else {
            const text = new Text();
            if (pieces[k].indexOf(':') !== -1) {
              const subpieces = this.splitFBString(pieces[k], ':');
              const newtext = this.cleanFBString2(subpieces, token);
              text.SetText(newtext);
            } else {
              text.SetText(content[k]);
            }
            f.AddChild(text);
          }
          fb.AddChild(f);
          if (content.length === 1) {
            this.setLocationId(f, token);
          } else {
            this.setLocationIdNSuffix(f, token, k + 1);
          }
        }

        this.addChildMeasureOrSection(harm);
        const staffindex = this.m_rkern[kerntrack] ?? 0;
        if (this.m_placement[spinetrack]) {
          while (this.m_fbstates.length <= staffindex) this.m_fbstates.push(0);
          this.m_fbstates[staffindex] = this.m_placement[spinetrack];
        }
        const tstamp = this.getMeasureTstamp(token, staffindex);
        harm.SetTstamp(tstamp.getFloat());
        this.setStaff(harm, staffindex + 1);
        this.setLocationId(harm, token);
        this.setLocationId(fb, token);
      }
    }
  }

  // C++ HumdrumInput::getTrackText: extract spine track number plus subtrack
  // letters ('a', 'b', etc.), suppressing bare single 'a'.
  public getTrackText(token: HTok): string {
    const trackinfo = token.getSpineInfo();
    const track = token.getTrack();
    let output = String(track);
    let extension = '';
    for (let i = 0; i < trackinfo.length; ++i) {
      if (trackinfo[i] === 'a') extension += 'a';
      else if (trackinfo[i] === 'b') extension += 'b';
    }
    if (extension !== 'a') output += extension;
    return output;
  }

  // C++ HumdrumInput::setFontStyleForHarm: add italic/bold to harm data,
  // creating a wrapping Rend if multiple or non-Rend children.
  public setFontStyleForHarm(harm: Harm, style: string): void {
    const childcount = harm.GetChildCount();
    let makeRendQ = false;
    if (childcount === 0) {
      return;
    } else if (childcount !== 1) {
      makeRendQ = true;
    } else {
      const child = harm.GetChild(0);
      if (child === null) return;
      if (child.GetClassId() === ClassId.REND) {
        if (style === 'bold') this.setFontWeight(child as Rend, style);
        else if (style === 'italic') this.setFontStyle(child as Rend, style);
        return;
      } else {
        makeRendQ = true;
      }
    }

    if (!makeRendQ) return;

    const newrend = new Rend();
    for (let i = 0; i < childcount; i++) {
      const obj = harm.Relinquish(i);
      if (obj !== null) newrend.AddChild(obj);
    }
    harm.ClearRelinquishedChildren();
    harm.AddChild(newrend);
    if (style === 'bold') this.setFontWeight(newrend, style);
    else if (style === 'italic') this.setFontStyle(newrend, style);
  }

  // C++ HumdrumInput::setFontsizeForHarm: add fontsize to harm data,
  // adopting children into a new Rend if multiple or already styled.
  public setFontsizeForHarm(harm: Harm, fontsize: string): void {
    const childcount = harm.GetChildCount();
    let makeRendQ = false;
    if (childcount === 0) {
      return;
    } else if (childcount !== 1) {
      makeRendQ = true;
    } else {
      const child = harm.GetChild(0);
      if (child === null) return;
      if (child.GetClassId() === ClassId.REND) {
        const rendChild = child as Rend;
        if (!rendChild.HasFontstyle()) {
          this.setFontsize(rendChild, '', fontsize);
          return;
        } else {
          makeRendQ = true;
        }
      } else {
        makeRendQ = true;
      }
    }

    if (!makeRendQ) return;

    const newrend = new Rend();
    for (let i = 0; i < childcount; i++) {
      const obj = harm.Relinquish(i);
      if (obj !== null) newrend.AddChild(obj);
    }
    harm.ClearRelinquishedChildren();
    harm.AddChild(newrend);
    this.setFontsize(newrend, '', fontsize);
  }

  // C++ HumdrumInput::addHarmLabel: create key-label Harm at timestamp with
  // Unicode sharps/flats, halign=right, optional italic/bold, and spacer.
  public addHarmLabel(
    timestamp: HumNum, label: string, labelStyle: string,
    n: string, place: string, staffNum: number,
  ): void {
    if (label === '') return;

    const harm = new Harm();
    this.addChildMeasureOrSection(harm);
    harm.SetTstamp(timestamp.getFloat());
    harm.SetN(n);
    this.setPlaceRelStaff(harm, place, false);
    this.setStaff(harm, staffNum);

    const rend = new Rend();
    const rend2 = new Rend();
    const text = new Text();
    harm.AddChild(rend);
    rend.AddChild(rend2);
    rend2.AddChild(text);
    harm.SetType('key-label');

    rend.SetHalign(HORIZONTALALIGNMENT_right);

    const output: number[] = [];
    for (let i = 0; i < label.length; i++) {
      switch (label[i]) {
        case '#': output.push(0x266F); break; // unicode sharp
        case '-': output.push(0x266D); break; // unicode flat
        default: output.push(...UTF8to32(label[i]));
      }
    }
    text.SetText(output);

    if (labelStyle.indexOf('i') !== -1) rend.SetFontstyle(FONTSTYLE_italic);
    if (labelStyle.indexOf('b') !== -1) rend.SetFontweight(FONTWEIGHT_bold);
    else if (labelStyle.indexOf('B') !== -1) rend.SetFontweight(FONTWEIGHT_bold);

    const stext = new Text();
    rend.AddChild(stext);
    stext.SetText([0x00A0]); // non-breaking space
  }

  // C++ HumdrumInput::removeRecipFromHarmContent: strip leading **recip rhythm
  // prefix from **rhrm tokens.
  public removeRecipFromHarmContent(input: string): string {
    if (input === '') return '';

    let harmpos = input.length;
    for (let i = 0; i < input.length; ++i) {
      const ch = input[i];
      if (ch === '-' || ch === '#') {
        harmpos = i;
        break;
      }
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '~') {
        harmpos = i;
        break;
      }
    }

    if (harmpos > 0 && harmpos <= input.length) {
      if (input[harmpos] === '[') harmpos--;
    }

    const output = input.substring(harmpos);
    const recip = input.substring(0, harmpos);

    if (recip.indexOf('_') !== -1 || recip.indexOf(']') !== -1) return '';

    return output;
  }

  // C++ HumdrumInput::setHarmContent: parse Roman numeral chord tokens,
  // handle inversions (b->6, c->6/4; 7b->6/5, 7c->4/3, 7d->4/2), dim/half-dim
  // signs, sharps/flats, sub/sup stacking, and secondary dominants.
  public setHarmContent(rend: Rend, token: HTok): void {
    const input = token.toString();
    if (input === '') return;

    let input2 = input;
    let parens = false;
    if (input2.startsWith('(') && input2.endsWith(')')) {
      input2 = input2.substring(1, input2.length - 1);
      parens = true;
    }
    let brackets = false;
    if (input2.startsWith('[') && input2.endsWith(']')) {
      input2 = input2.substring(1, input2.length - 1);
      brackets = true;
    }

    input2 = this.removeRecipFromHarmContent(input2);

    let secondaryText = '';
    const hre = new HumRegex();
    if (hre.search(input2, '^([^/]+)(/.*)$')) {
      secondaryText = hre.getMatch(2);
      input2 = hre.getMatch(1);
    }

    let firstNumber = -1;
    if (hre.search(input2, '(\\d+)')) {
      firstNumber = hre.getMatchInt(1);
    }

    const numbers: string[] = [];

    if (firstNumber < 0) {
      if (hre.search(input2, 'b')) {
        numbers.push('6');
        input2 = hre.replaceCopy(input2, '', 'b');
      } else if (hre.search(input2, 'c')) {
        numbers.push('6', '4');
        input2 = hre.replaceCopy(input2, '', 'c');
      }
    } else if (firstNumber === 7) {
      if (hre.search(input2, 'b')) {
        numbers.push('6', '5');
        input2 = hre.replaceCopy(input2, '', '7b');
      } else if (hre.search(input2, 'c')) {
        numbers.push('4', '3');
        input2 = hre.replaceCopy(input2, '', '7c');
      } else if (hre.search(input2, 'd')) {
        numbers.push('4', '2');
        input2 = hre.replaceCopy(input2, '', '7d');
      } else {
        numbers.push('7');
        input2 = hre.replaceCopy(input2, '', '7a?');
      }
    }

    input2 = hre.replaceCopy(input2, '', 'a');
    let hasDim = false;
    let hasHalfDim = false;
    let hasAug = false;

    const output: number[] = [];
    if (parens) output.push(0x28); // '('
    else if (brackets) output.push(0x5B); // '['

    if (hre.search(input2, 'oD')) {
      hasDim = true;
      input2 = hre.replaceCopy(input2, '', 'oD');
    } else if (hre.search(input2, '[vi]+o')) {
      if (firstNumber === 7) {
        hasHalfDim = true;
        input2 = hre.replaceCopy(input2, '', 'o.*');
      } else {
        hasDim = true;
        input2 = hre.replaceCopy(input2, '', 'o.*');
      }
    }
    input2 = hre.replaceCopy(input2, '', 'm');

    for (let i = 0; i < input2.length; ++i) {
      if (input2[i] === '-') output.push(0x266D); // unicode flat
      else if (input2[i] === '#') output.push(0x266F); // unicode sharp
      else if (input2[i] === '+') hasAug = true;
      else output.push(...UTF8to32(input2[i]));
    }

    if (hasDim) output.push(0x00B0); // degree sign

    const text = new Text();
    rend.AddChild(text);
    text.SetText(output);

    if (hasHalfDim) {
      const hrend = new Rend();
      const htext = new Text();
      rend.AddChild(hrend);
      hrend.AddChild(htext);
      hrend.SetRend(TEXTRENDITION_sup);
      htext.SetText([0x00F8]); // o-slash
    }
    if (hasAug) {
      const frend = new Rend();
      const ftext = new Text();
      rend.AddChild(frend);
      frend.AddChild(ftext);
      frend.SetRend(TEXTRENDITION_sup);
      ftext.SetText([0x2B]); // '+'
    }

    if (numbers.length === 1) {
      const subrend = new Rend();
      rend.AddChild(subrend);
      subrend.SetRend(TEXTRENDITION_sub);
      const subtext = new Text();
      subrend.AddChild(subtext);
      subtext.SetText(UTF8to32(numbers[0]));
    } else if (numbers.length === 2) {
      const subrendTop = new Rend();
      rend.AddChild(subrendTop);
      subrendTop.SetRend(TEXTRENDITION_sup);
      const subtextTop = new Text();
      subrendTop.AddChild(subtextTop);
      subtextTop.SetText(UTF8to32(numbers[0]));

      const subrendBot = new Rend();
      rend.AddChild(subrendBot);
      subrendBot.SetRend(TEXTRENDITION_sub);
      subrendBot.SetType('move-back');
      const subtextBot = new Text();
      subrendBot.AddChild(subtextBot);
      subtextBot.SetText(UTF8to32(numbers[1]));
    }

    if (secondaryText !== '') this.appendTextToRend(rend, secondaryText);
    if (parens) this.appendTextToRend(rend, ')');
    else if (brackets) this.appendTextToRend(rend, ']');
  }

  // C++ HumdrumInput::setMxHarmContent: convert MusicXML/chord harmony tokens
  // into root, chord kind abbreviations, and slash bass notation.
  public setMxHarmContent(rend: Rend, content: string): void {
    let root = '';
    let kind = '';
    let bass = '';

    let foundspace = false;
    let foundslash = false;
    for (let i = 0; i < content.length; ++i) {
      const ch = content[i];
      if (ch === '/') foundslash = true;
      if (foundspace && !foundslash) {
        kind += ch;
        continue;
      }
      if (ch === ' ') {
        foundspace = true;
        continue;
      }
      if (ch === '/') {
        foundslash = true;
        continue;
      }
      if (!foundspace) {
        if (ch === '-') root += '\u266D';
        else if (ch === '#') root += '\u266F';
        else root += ch;
      } else if (foundslash) {
        if (ch === '-') bass += '\u266D';
        else if (ch === '#') bass += '\u266F';
        else bass += ch;
      } else {
        LogWarning(`In HumdrumInput::setMxHarmContent: Should not get here if correct input: ${content}`);
      }
    }

    let replacing = false;
    if (kind === 'major-minor') {
      kind = 'Mm7';
      replacing = true;
    } else if (kind === 'minor-major') {
      kind = 'mM7';
      replacing = true;
    }

    const rep = (target: string, oldStr: string, newStr: string): [string, boolean] => {
      if (target.indexOf(oldStr) !== -1) {
        return [target.split(oldStr).join(newStr), true];
      }
      return [target, false];
    };

    let didRep = false;
    [kind, didRep] = rep(kind, 'major-', 'maj'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'minor-', 'm'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'dominant-', 'dom'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'augmented-', '+'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'suspended-', 'sus'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'diminished-', '\u00B0'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'seventh', '7'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'ninth', '9'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, '11th', '11'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, '13th', '13'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'second', '2'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'fourth', '4'); if (didRep) replacing = true;
    [kind, didRep] = rep(kind, 'sixth', '6'); if (didRep) replacing = true;

    if (kind === 'major' || kind === 'maj' || kind === 'ma') {
      kind = '';
      replacing = true;
    } else if (kind === 'minor' || kind === 'min') {
      kind = 'm';
      replacing = true;
    } else if (kind === 'augmented') {
      kind = '+';
      replacing = true;
    } else if (kind === 'maj6') {
      kind = '6';
      replacing = true;
    } else if (kind === 'minor-seventh') {
      kind = 'm7';
      replacing = true;
    } else if (kind === 'major-seventh') {
      kind = 'maj7';
      replacing = true;
    } else if (kind === 'dom11') {
      kind = '11';
      replacing = true;
    } else if (kind === 'dom13') {
      kind = '13';
      replacing = true;
    } else if (kind === 'dom9') {
      kind = '9';
      replacing = true;
    } else if (kind === 'half-diminished') {
      kind = '\u00F8';
      replacing = true;
    } else if (kind === 'diminished') {
      kind = '\u00B0';
      replacing = true;
    } else if (kind === 'dominant') {
      kind = '7';
      replacing = true;
    } else if (kind === 'power') {
      kind = '5';
      replacing = true;
    } else if (kind === 'm7b5') {
      kind = 'm7\u266D5';
      replacing = true;
    }

    if (kind !== '' && !replacing) root += ' ';
    if (bass !== '') kind += '/';

    const output = root + kind + bass;
    const text = new Text();
    rend.AddChild(text);
    text.SetText(UTF8to32(output));
  }

  // C++ HumdrumInput::getMoveableDoName: convert scale degree and semitone
  // alteration into moveable-do solfege syllables.
  public getMoveableDoName(token: HTok, degree: number, alteration: number): number[] {
    let alt = alteration;
    const minorQ = token.getValueInt('auto', 'minor');
    if (minorQ && (degree === 3 || degree === 6)) alt--;
    const minnat = token.getValueInt('auto', 'minnat');
    if (minnat) {
      const ts = token.toString();
      if (ts.indexOf('7N') !== -1) alt--;
      else if (ts.indexOf('7H') !== -1) { /* do nothing */ }
      else if (ts.indexOf('7') !== -1) alt--;
    }

    const deg = (degree + 700 - 1) % 7;
    let name = '?';
    switch (deg) {
      case 0:
        switch (alt) {
          case -2: name = 'te'; break;
          case -1: name = 'ti'; break;
          case 0: name = 'do'; break;
          case 1: name = 'di'; break;
          case 2: name = 're'; break;
        }
        break;
      case 1:
        switch (alt) {
          case -2: name = 'do'; break;
          case -1: name = 'ra'; break;
          case 0: name = 're'; break;
          case 1: name = 'ri'; break;
          case 2: name = 'mi'; break;
        }
        break;
      case 2:
        switch (alt) {
          case -2: name = 're'; break;
          case -1: name = 'me'; break;
          case 0: name = 'mi'; break;
          case 1: name = 'fa'; break;
          case 2: name = 'fe'; break;
        }
        break;
      case 3:
        switch (alt) {
          case -2: name = 'me'; break;
          case -1: name = 'mi'; break;
          case 0: name = 'fa'; break;
          case 1: name = 'fi'; break;
          case 2: name = 'so'; break;
        }
        break;
      case 4:
        switch (alt) {
          case -2: name = 'fa'; break;
          case -1: name = 'se'; break;
          case 0: name = 'so'; break;
          case 1: name = 'si'; break;
          case 2: name = 'la'; break;
        }
        break;
      case 5:
        switch (alt) {
          case -2: name = 'so'; break;
          case -1: name = 'le'; break;
          case 0: name = 'la'; break;
          case 1: name = 'li'; break;
          case 2: name = 'ti'; break;
        }
        break;
      case 6:
        switch (alt) {
          case -2: name = 'la'; break;
          case -1: name = 'te'; break;
          case 0: name = 'ti'; break;
          case 1: name = 'do'; break;
          case 2: name = 'di'; break;
        }
        break;
    }
    return UTF8to32(name);
  }

  // C++ HumdrumInput::addSemitoneAdjustmentsToDeg: arrows or accidentals.
  public addSemitoneAdjustmentsToDeg(
    _token: HTok, arrowQ: number | boolean, accidQ: number | boolean,
    solfegeQ: number | boolean, sharps: number, flats: number,
  ): number[] {
    const output: number[] = [];
    if (accidQ && !solfegeQ) {
      if (sharps > 0) {
        if (sharps === 1) {
          output.push(arrowQ ? 0x2191 : 0x266F); // up arrow vs sharp
        } else if (sharps === 2) {
          if (arrowQ) output.push(0x21D1); // double up arrow
          else output.push(0x266F, 0x266F); // two sharps
        } else {
          for (let i = 0; i < sharps; i++) output.push(arrowQ ? 0x2191 : 0x266F);
        }
      } else if (flats > 0) {
        if (flats === 1) {
          output.push(arrowQ ? 0x2193 : 0x266D); // down arrow vs flat
        } else if (flats === 2) {
          if (arrowQ) output.push(0x21D3); // double down arrow
          else output.push(0x266D, 0x266D); // two flats
        } else {
          for (let i = 0; i < flats; i++) output.push(arrowQ ? 0x2193 : 0x266D);
        }
      }
    }
    return output;
  }

  // C++ HumdrumInput::setDegreeContent: convert **deg/**degree tokens into
  // digits/solfege, hats, semitone adjustments, and melodic approach/departure arrows.
  public setDegreeContent(rend: Rend, token: HTok, _n = 0): void {
    let firstnote = token.toString();
    const spacepos = firstnote.indexOf(' ');
    if (spacepos !== -1) firstnote = firstnote.substring(0, spacepos);

    let sharps = 0;
    let flats = 0;
    for (let i = 0; i < firstnote.length; i++) {
      if (firstnote[i] === '+') sharps++;
      else if (firstnote[i] === '-') flats++;
    }

    const minor = token.getValueInt('auto', 'minor');
    if (minor && firstnote.indexOf('7') !== -1) {
      const minnat = token.getValueInt('auto', 'minnat');
      const HQ = firstnote.indexOf('H') !== -1 ? 1 : 0;
      const NQ = firstnote.indexOf('N') !== -1 ? 1 : 0;
      if (minnat) {
        if (HQ) {
          if (flats) flats--;
          else sharps++;
        }
      } else {
        if (NQ) {
          if (sharps) sharps--;
          else flats++;
        }
      }
    }

    const output: number[] = [];
    const solfegeQ = token.getValueInt('auto', 'solf');
    const accidQ = !token.getValueInt('auto', 'nodegacc');
    const arrowQ = token.getValueInt('auto', 'arrow');
    const revaccQ = token.getValueInt('auto', 'accR');
    const revarrQ = token.getValueInt('auto', 'arrR');

    if ((arrowQ && revarrQ && !revaccQ) || (!arrowQ && !revaccQ)) {
      output.push(...this.addSemitoneAdjustmentsToDeg(token, arrowQ, accidQ, solfegeQ, sharps, flats));
    }

    const hre = new HumRegex();
    if (hre.search(firstnote, '(\\d+)')) {
      const degree = hre.getMatchInt(1);
      let semitones = sharps;
      if (flats) semitones = -flats;
      if (solfegeQ) {
        output.push(...this.getMoveableDoName(token, degree, semitones));
      } else {
        if (degree >= 0 && degree <= 9) output.push(0x30 + degree);
        if (token.getValueInt('auto', 'hat')) output.push(0x0302);
      }
    }

    if ((arrowQ && !revaccQ && !revarrQ) || (!arrowQ && revaccQ)) {
      output.push(...this.addSemitoneAdjustmentsToDeg(token, arrowQ, accidQ, solfegeQ, sharps, flats));
    }

    const text = new Text();
    rend.AddChild(text);
    text.SetText(output);

    let precontent: number[] = [];
    let postcontent: number[] = [];
    let preleapQ = false;
    let preupdirQ = false;
    let predowndirQ = false;
    let postleapQ = false;
    let postupdirQ = false;
    let postdowndirQ = false;

    const dirQ = !token.getValueInt('auto', 'Xdir');
    if (dirQ) {
      let upcount = 0;
      let downcount = 0;
      const ts = token.toString();
      for (let m = 0; m < ts.length; m++) {
        if (ts[m] === ' ') break;
        if (ts[m] === '^') upcount++;
        else if (ts[m] === 'v') downcount++;
        if (m > 0 && ts[m] === 'y' && ts[m - 1] === '^') upcount = 0;
        if (m > 0 && ts[m] === 'y' && ts[m - 1] === 'v') downcount = 0;
      }
      if (upcount === 1) {
        precontent = [0x2197]; // single up diagonal arrow
        preupdirQ = true;
      } else if (upcount >= 2) {
        precontent = [0x2B08]; // thick up diagonal arrow
        preupdirQ = true;
        preleapQ = true;
      } else if (downcount === 1) {
        precontent = [0x2198]; // single down diagonal arrow
        predowndirQ = true;
      } else if (downcount >= 2) {
        precontent = [0x2B0A]; // thick down diagonal arrow
        predowndirQ = true;
        preleapQ = true;
      }
    }

    if ((preupdirQ || predowndirQ) && precontent.length > 0) {
      const prerend = new Rend();
      const pretext = new Text();
      prerend.AddChild(pretext);
      pretext.SetText(precontent);
      if (preupdirQ) {
        prerend.SetRend(TEXTRENDITION_sub);
        if (preleapQ) {
          this.setFontsize(prerend, '', '120%');
          prerend.SetType('approach-up-leap');
        } else {
          prerend.SetType('approach-up-step');
        }
      } else if (predowndirQ) {
        prerend.SetRend(TEXTRENDITION_sup);
        if (preleapQ) {
          this.setFontsize(prerend, '', '120%');
          prerend.SetType('approach-down-leap');
        } else {
          prerend.SetType('approach-down-step');
        }
      }
      rend.InsertChild(prerend, 0);
    }

    if ((postupdirQ || postdowndirQ) && postcontent.length > 0) {
      const postrend = new Rend();
      const posttext = new Text();
      postrend.AddChild(posttext);
      posttext.SetText(postcontent);
      if (postupdirQ) {
        postrend.SetRend(TEXTRENDITION_sup);
        if (postleapQ) {
          this.setFontsize(postrend, '', '120%');
          postrend.SetType('departure-up-leap');
        } else {
          postrend.SetType('departure-up-step');
        }
      } else if (postdowndirQ) {
        postrend.SetRend(TEXTRENDITION_sub);
        if (postleapQ) {
          this.setFontsize(postrend, '', '120%');
          postrend.SetType('departure-down-leap');
        } else {
          postrend.SetType('departure-down-step');
        }
      }
      rend.AddChild(postrend);
    }
  }

  // C++ HumdrumInput::addHarmFloatsForMeasure: insert <harm> type data into
  // measures (**harm, **rhrm, **mxhm, **deg, **degree, **cdata).
  public addHarmFloatsForMeasure(startline: number, endline: number): void {
    if (this.m_measure === null) return;

    let xstaffindex = 0;
    const hre = new HumRegex();
    const infile = this.m_infiles.at(0);
    const staffstarts = this.m_staffstarts;
    const MAXCOLORSUBTRACK = 30;

    for (let i = startline; i < endline; ++i) {
      const line = infile.at(i);
      if (line.isInterpretation()) {
        for (let j = 0; j < line.getFieldCount(); j++) {
          const itok = line.token(j);
          if (itok !== null && hre.search(itok.toString(), '^\\*color:(.*)')) {
            const ctrack = itok.getTrack();
            const strack = itok.getSubtrack();
            if (ctrack < this.m_spineColor.length && strack < MAXCOLORSUBTRACK) {
              this.m_spineColor[ctrack][strack] = hre.getMatch(1);
              if (strack === 1) {
                this.m_spineColor[ctrack][0] = this.m_spineColor[ctrack][1];
              } else if (strack === 0) {
                for (let z = 1; z < this.m_spineColor[ctrack].length; z++) {
                  this.m_spineColor[ctrack][z] = this.m_spineColor[ctrack][0];
                }
              }
            }
          }
        }
      }

      if (!line.isData()) continue;

      let active = true;
      let track = 0;

      for (let j = 0; j < line.getFieldCount(); ++j) {
        const token = line.token(j)!;
        if (token.isMensLike()) {
          active = false;
          continue;
        }
        if (token.isKernLike()) {
          active = true;
          track = token.getTrack();
          continue;
        }

        if (!active) continue;
        if (token.isNull()) continue;

        const isCData = hre.search(token.getDataType(), '^\\*\\*[abc]data');
        const isDegree = token.isDataType('**deg') || token.isDataType('**degree');
        const isHarm = token.isDataType('**mxhm') || token.isDataType('**harm') || token.isDataType('**rhrm');

        if (!(isCData || isDegree || isHarm)) continue;

        if (token.getValueInt('auto', 'hidden')) continue;
        if (token.toString().indexOf('yy') !== -1) continue;

        if (isDegree && token.toString().indexOf('r') !== -1) {
          if (token.toString().indexOf('0') === -1) continue;
        }

        const harm = new Harm();
        const harmRend = new Rend();
        harm.AddChild(harmRend);
        this.addChildMeasureOrSection(harm);
        this.setLocationId(harm, token);

        const lidx = token.getLineIndex();
        const fidx = token.getFieldIndex();
        let ccolor = this.getSpineColor(lidx, fidx);
        const norest = ccolor.indexOf('NOREST');
        if (norest !== -1) ccolor = ccolor.substring(0, norest);
        if (ccolor !== '') {
          harmRend.SetColor(ccolor);
          if (token.getValueInt('auto', 'circle')) {
            harmRend.SetRend(TEXTRENDITION_circle);
          } else if (token.getValueInt('auto', 'box')) {
            harmRend.SetRend(TEXTRENDITION_box);
          }
        } else {
          if (token.getValueInt('auto', 'circle')) {
            harmRend.SetRend(TEXTRENDITION_circle);
          } else if (token.getValueInt('auto', 'box')) {
            harmRend.SetRend(TEXTRENDITION_box);
          }
        }
        if (token.isDataType('**degree')) {
          let octave = '';
          const octaveQ = !token.getValueInt('auto', 'Xoctave');
          if (octaveQ) {
            const hre2 = new HumRegex();
            if (hre2.search(token.toString(), '/(\\d+)')) octave = hre2.getMatch(1);
          }
          if (octave !== '') {
            const subrend = new Rend();
            const subtext = new Text();
            subrend.AddChild(subtext);
            subrend.SetRend(TEXTRENDITION_sub);
            subrend.SetType('octave');
            subtext.SetText(UTF8to32(octave));
            harmRend.AddChild(subrend);
          }
        }

        const tracktext = this.getTrackText(token);
        harm.SetN(tracktext);

        const staffindex = this.m_rkern[track] ?? -1;
        if (staffindex >= 0) {
          xstaffindex = staffindex;
          this.setStaff(harm, staffindex + 1);
        } else {
          xstaffindex = staffstarts.length - 1;
          this.setStaff(harm, xstaffindex + 1);
        }

        const datatype = token.getDataType();
        if (datatype.startsWith('**cdata-')) {
          const subdatatype = datatype.substring(8);
          if (subdatatype !== '') this.appendTypeTag(harm, subdatatype);
        } else if (datatype.startsWith('**deg')) {
          const subdatatype = datatype.substring(2);
          if (subdatatype !== '') this.appendTypeTag(harm, subdatatype);
        }

        const tstamp = this.getMeasureTstamp(token, xstaffindex);
        harm.SetTstamp(tstamp.getFloat());

        const aboveQ = token.getValueInt('auto', 'above');
        const place = aboveQ ? 'above' : 'below';
        this.setPlaceRelStaff(harm, place, false);

        if (isCData || isHarm || isDegree) {
          const keyLabel = token.getValue('auto', 'keyLabel');
          const keyLabelStyle = token.getValue('auto', 'keyLabelStyle');
          if (keyLabel !== '') {
            this.addHarmLabel(tstamp, keyLabel, keyLabelStyle, tracktext, place, xstaffindex + 1);
          }
        }

        const fontsize = token.getValue('auto', 'fontsize');
        if (fontsize !== '' && fontsize !== 'true' && fontsize !== 'false') {
          this.setFontsizeForHarm(harm, fontsize);
        }
        if (token.getValueInt('auto', 'bold')) this.setFontStyleForHarm(harm, 'bold');
        if (token.getValueInt('auto', 'italic')) this.setFontStyleForHarm(harm, 'italic');

        if (datatype === '**harm' || datatype === '**rhrm') {
          this.setHarmContent(harmRend, token);
        } else if (datatype === '**mxhm') {
          this.setMxHarmContent(harmRend, token.toString());
        } else if (isDegree) {
          this.setDegreeContent(harmRend, token);
        } else if (isCData) {
          const text = new Text();
          harmRend.AddChild(text);
          text.SetText(UTF8to32(token.toString()));
        } else {
          LogWarning(`In HumdrumInput::addHarmFloatsForMeasure: Unknown type of harm data ${datatype}`);
          continue;
        }
      }
    }
  }

  public static formatLocation(format: string, ...args: unknown[]): string {
    return StringFormat(format, ...args);
  }
}
