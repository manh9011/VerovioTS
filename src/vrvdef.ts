/**
 * Numeric ClassId values copied from include/vrv/vrvdef.h.
 * Numeric order is intentionally preserved because Object uses range checks.
 */
export enum ClassId {
  BOUNDING_BOX = 0,
  OBJECT,
  DEVICE_CONTEXT,
  FLOATING_OBJECT,
  FLOATING_POSITIONER,
  FLOATING_CURVE_POSITIONER,
  ACCID_FLOATING,
  ALIGNMENT,
  ALIGNMENT_REFERENCE,
  CLEF_ATTR,
  COURSE,
  DOC,
  FACSIMILE,
  FB,
  GRPSYM,
  GRACE_ALIGNER,
  GRAPHIC,
  INSTRDEF,
  KEYSIG_ATTR,
  LABEL,
  LABELABBR,
  LAYER,
  MEASURE,
  MEASURE_ALIGNER,
  MENSUR_ATTR,
  METERSIG_ATTR,
  OSSIA,
  PAGE,
  PAGES,
  STAFF,
  STAFF_ALIGNMENT,
  STAFFGRP,
  SURFACE,
  SVG,
  SYMBOLDEF,
  SYMBOLTABLE,
  SYSTEM,
  SYSTEM_ALIGNER,
  SYSTEM_ALIGNMENT,
  TIMESTAMP_ALIGNER,
  TUNING,
  ZONE,
  EDITORIAL_ELEMENT,
  ABBR,
  ADD,
  ANNOT,
  APP,
  CHOICE,
  CORR,
  DAMAGE,
  DEL,
  EXPAN,
  LEM,
  ORIG,
  RDG,
  REF,
  REG,
  RESTORE,
  SIC,
  SUBST,
  SUPPLIED,
  UNCLEAR,
  EDITORIAL_ELEMENT_max,
  TEXT_LAYOUT_ELEMENT,
  DIV,
  RUNNING_ELEMENT,
  PGFOOT,
  PGHEAD,
  RUNNING_ELEMENT_max,
  TEXT_LAYOUT_ELEMENT_max,
  PAGE_ELEMENT,
  PAGE_MILESTONE_END,
  MDIV,
  SCORE,
  PAGE_ELEMENT_max,
  SYSTEM_ELEMENT,
  SYSTEM_MILESTONE_END,
  ENDING,
  EXPANSION,
  PB,
  SB,
  SECTION,
  SYSTEM_ELEMENT_max,
  CONTROL_ELEMENT,
  ANCHOREDTEXT,
  ANNOTSCORE,
  ARPEG,
  BEAMSPAN,
  BRACKETSPAN,
  BREATH,
  CAESURA,
  CPMARK,
  DIR,
  DYNAM,
  FERMATA,
  FING,
  GLISS,
  HAIRPIN,
  HARM,
  LV,
  MORDENT,
  MNUM,
  ORNAM,
  OCTAVE,
  PEDAL,
  PHRASE,
  PITCHINFLECTION,
  REH,
  REPEATMARK,
  SLUR,
  TEMPO,
  TIE,
  TRILL,
  TURN,
  CONTROL_ELEMENT_max,
  LAYER_ELEMENT,
  ACCID,
  ARTIC,
  BARLINE,
  BEAM,
  BEATRPT,
  BTREM,
  CHORD,
  CLEF,
  CUSTOS,
  DIVLINE,
  DOT,
  DOTS,
  EPISEMA,
  FLAG,
  FTREM,
  GENERIC_ELEMENT,
  GRACEGRP,
  HALFMRPT,
  KEYSIG,
  KEYACCID,
  LIGATURE,
  LIQUESCENT,
  MENSUR,
  METERSIG,
  METERSIGGRP,
  MREST,
  MRPT,
  MRPT2,
  MSPACE,
  MULTIREST,
  MULTIRPT,
  NC,
  NOTE,
  NEUME,
  ORISCUS,
  PLICA,
  PROPORT,
  QUILISMA,
  STROPHICUS,
  REST,
  SPACE,
  STEM,
  SYL,
  SYLLABLE,
  TABGRP,
  TABDURSYM,
  TIMESTAMP_ATTR,
  TUPLET,
  TUPLET_BRACKET,
  TUPLET_NUM,
  VOLTA,
  LYRIC_ELEMENT,
  VERSE,
  REFRAIN,
  LYRIC_ELEMENT_max,
  LAYER_ELEMENT_max,
  SCOREDEF_ELEMENT,
  LAYERDEF,
  SCOREDEF,
  STAFFDEF,
  SCOREDEF_ELEMENT_max,
  TEXT_ELEMENT,
  FIG,
  FIGURE,
  LB,
  NUM,
  REND,
  SYMBOL,
  TEXT,
  TEXT_ELEMENT_max,
  BBOX_DEVICE_CONTEXT,
  SVG_DEVICE_CONTEXT,
  CUSTOM_DEVICE_CONTEXT,
  FACTORY_STAGEDIR,
  FACTORY_OSTAFF,
  UNSPECIFIED,
}

export enum InterfaceId {
  INTERFACE,
  INTERFACE_ALT_SYM,
  INTERFACE_AREA_POS,
  INTERFACE_BOUNDARY,
  INTERFACE_DURATION,
  INTERFACE_LINKING,
  INTERFACE_FACSIMILE,
  INTERFACE_OFFSET,
  INTERFACE_OFFSET_SPANNING,
  INTERFACE_PITCH,
  INTERFACE_PLIST,
  INTERFACE_POSITION,
  INTERFACE_SCOREDEF,
  INTERFACE_TEXT_DIR,
  INTERFACE_TIME_POINT,
  INTERFACE_TIME_SPANNING,
}

export type AttClassId = number;
export type ArrayOfStrAttr = Array<[string, string]>;
export const VRV_UNSET = -0x7FFFFFFF;
export const M_PI = Math.PI;
export const UNLIMITED_DEPTH = -10000;
export const FORWARD = true;
export const BACKWARD = false;

export enum FunctorCode {
  FUNCTOR_CONTINUE,
  FUNCTOR_SIBLINGS,
  FUNCTOR_STOP,
}

export type ClassIdLike = ClassId | number;
export type BinaryComparator = (a: ObjectLike, b: ObjectLike) => boolean;

export interface ObjectLike {
  GetClassId(): ClassIdLike;
}


// C++ scalar/forward-declared types that are defined in later migration units.
// These aliases preserve the structural role of the original typedefs without
// inventing implementation logic for not-yet-migrated classes.
export type data_ACCIDENTAL_WRITTEN = number;
export type data_DURATION = number;

// MEI data.DURATION enum values from libmei; numeric ordering is observable
// throughout Verovio (notably in Fraction and duration range checks).
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
export const DURATION_2048 = 13;
export const DURATION_longa = 100;
export const DURATION_brevis = 101;
export const DURATION_semibrevis = 102;
export const DURATION_minima = 103;
export const DURATION_semiminima = 104;
export const DURATION_fusa = 105;
export const DURATION_semifusa = 106;
export type data_MEASUREBEAT = [number, number];
export interface AlignmentLike { [key: string]: unknown }
export interface ArpegLike { [key: string]: unknown }
export interface BeamElementCoordLike { [key: string]: unknown }
export interface BoundingBoxLike { [key: string]: unknown }
export interface CurveSpannedElementLike { [key: string]: unknown }
export interface DivLineLike { [key: string]: unknown }
export interface FloatingPositionerLike { [key: string]: unknown }
export interface FloatingCurvePositionerLike { [key: string]: unknown }
export interface GraceAlignerLike { [key: string]: unknown }
export interface LayerElementLike { [key: string]: unknown }
export interface LedgerLineLike { [key: string]: unknown }
export interface LinkingInterfaceLike { [key: string]: unknown }
export interface LiquescentLike { [key: string]: unknown }
export interface NoteLike extends ObjectLike { [key: string]: unknown }
export interface OptionLike { [key: string]: unknown }
export interface PointLike { [key: string]: unknown }
export interface StaffLike { [key: string]: unknown }
export interface TextElementLike { [key: string]: unknown }
export interface TimePointInterfaceLike { [key: string]: unknown }
export interface TimeSpanningInterfaceLike { [key: string]: unknown }

export type ArrayOfObjects = ObjectLike[];
export type ArrayOfConstObjects = ReadonlyArray<ObjectLike>;
export type ListOfObjects = ObjectLike[];
export type ListOfConstObjects = ReadonlyArray<ObjectLike>;
export type SetOfObjects = Set<ObjectLike>;
export type SetOfConstObjects = ReadonlySet<ObjectLike>;
export type ChordNoteGroup = NoteLike[];
export type ArrayOfAdjustmentTuples = Array<[AlignmentLike, AlignmentLike, number]>;
export type ArrayOfAlignmentArpegTuples = Array<[AlignmentLike, ArpegLike, number, boolean]>;
export type ArrayOfBeamElementCoords = BeamElementCoordLike[];
export type ArrayOfIntPairs = Array<[number, number]>;
export type MapOfLinkingInterfaceIDPairs = Map<string, LinkingInterfaceLike[]>;
export type MapOfNoteIDPairs = Map<string, NoteLike>;
export type ArrayOfPlistObjectIDPairs = Array<[ObjectLike, string]>;
export type ArrayOfCurveSpannedElements = CurveSpannedElementLike[];
export type ListOfObjectBeatPairs = Array<[ObjectLike, data_MEASUREBEAT]>;
export type ListOfObjectAttNamePairs = Array<[ObjectLike, string]>;
export type ListOfPointingInterClassIdPairs = Array<[TimePointInterfaceLike, ClassId]>;
export type ListOfSpanningInterClassIdPairs = Array<[TimeSpanningInterfaceLike, ClassId]>;
export type ListOfSpanningInterOwnerPairs = Array<[TimeSpanningInterfaceLike, ObjectLike]>;
export type ArrayOfFloatingPositioners = FloatingPositionerLike[];
export type ArrayOfFloatingCurvePositioners = FloatingCurvePositionerLike[];
export type ArrayOfBoundingBoxes = BoundingBoxLike[];
export type ArrayOfLedgerLines = LedgerLineLike[];
export type ArrayOfTextElements = TextElementLike[];
export type MapOfNoteLocs = Map<StaffLike, Set<number>>;
export type MapOfDotLocs = Map<StaffLike, Set<number>>;
export type MapOfStrOptions = Map<string, OptionLike>;
export type MapOfOctavedPitchAccid = Map<number, data_ACCIDENTAL_WRITTEN>;
export type MapOfIntGraceAligners = Map<number, GraceAlignerLike>;
export type ArrayOfStringDynamTypePairs = Array<[string, boolean]>;
export type MapOfClassIdConstructors = Map<ClassId, () => ObjectLike>;
export type MapOfStrClassIds = Map<string, ClassId>;
export type MeasureTieEndpoints = Array<[LayerElementLike, LayerElementLike]>;
export type NotePredicate = (note: NoteLike) => boolean;
export type ArrayOfElementDurPairs = Array<[LayerElementLike, data_DURATION]>;
export type MapOfOssiaStaffNs = Map<number, number[]>;

export interface IntTree { child: Map<number, IntTree> }
export type IntTree_t = Map<number, IntTree>;
export type VerseN_t = Map<number, boolean>;
export type LayerN_VerserN_t = Map<number, VerseN_t>;
export type StaffN_LayerN_VerseN_t = Map<number, LayerN_VerserN_t>;

export const DEFINITION_FACTOR = 10;
export const DEFAULT_UNIT = 9.0;
export function isIn(x: number, a: number, b: number): boolean {
  return x >= Math.min(a, b) && x <= Math.max(a, b);
}

export const MAX_ACCID_DEPTH = -1;
export const MAX_BEAM_DEPTH = -1;
export const MAX_CHORD_DEPTH = -1;
export const MAX_FTREM_DEPTH = -1;
export const MAX_LIGATURE_DEPTH = -1;
export const MAX_TABGRP_DEPTH = -1;
export const MAX_TUPLET_DEPTH = -1;
export const MAX_STAFFGRP_DEPTH = -1;
export const MAX_NOTE_DEPTH = -1;
export const OSSIA_N_OFFSET = 1000000;

export const UNICODE_FLAT = '\u266D';
export const UNICODE_NATURAL = '\u266E';
export const UNICODE_SHARP = '\u266F';
export const UNICODE_UNDERTIE = '\u203F';
export const UNICODE_DAL_SEGNO = '\u{1D109}';
export const UNICODE_DA_CAPO = '\u{1D10A}';
export const UNICODE_SEGNO = '\u{1D10B}';
export const UNICODE_CODA = '\u{1D10C}';
export const UNICODE_DOUBLE_FLAT = '\u{1D12B}';
export const UNICODE_DOUBLE_SHARP = '\u{1D12A}';
export const VRV_TEXT_HARM = '\u266D\u266E\u266F\uE260\uE261\uE262\uE263\uE264\uEA50\uEA51\uEA52\uEA53\uEA54\uEA55\uEA56\uEA57\uEA58\uEA59\uEA5A\uEA5B\uEA5C\uEA5D\uEA5E\uEA5F\uEA60\uEA61\uEA62\uEA63\uEA64\uEA65\uEA66\uEA67\uECC0';
export const LINEWIDTHTERM_factor_narrow = 1.0;
export const LINEWIDTHTERM_factor_medium = 2.0;
export const LINEWIDTHTERM_factor_wide = 4.0;

export enum EditorialLevel { EDITORIAL_UNDEFINED = 0, EDITORIAL_SCORE, EDITORIAL_TOPLEVEL, EDITORIAL_SCOREDEF, EDITORIAL_STAFFGRP, EDITORIAL_MEASURE, EDITORIAL_STAFF, EDITORIAL_LAYER, EDITORIAL_NOTE, EDITORIAL_TEXT, EDITORIAL_FB, EDITORIAL_RUNNING }
export enum VisibilityType { Hidden = 0, Visible }
export enum SMuFLGlyphAnchor { SMUFL_stemDownNW = 0, SMUFL_stemUpSE, SMUFL_cutOutNE, SMUFL_cutOutNW, SMUFL_cutOutSE, SMUFL_cutOutSW }
export enum SpanningType { SPANNING_START_END = 0, SPANNING_START, SPANNING_END, SPANNING_MIDDLE }
export enum ElementScoreDefRole { SCOREDEF_NONE = 0, SCOREDEF_SYSTEM, SCOREDEF_INTERMEDIATE, SCOREDEF_CAUTIONARY, SCOREDEF_OSSIA }
export enum ScoreDefDrawingLabels { DRAWING_LABEL_FULL = 0, DRAWING_LABEL_ABBR, DRAWING_LABEL_NONE }
export enum ArticType { ARTIC_INSIDE = 0, ARTIC_OUTSIDE }
export enum VisibilityOptimization { OPTIMIZATION_NONE = 0, OPTIMIZATION_HIDDEN, OPTIMIZATION_SHOW }
export const POSITION_LEFT = 0; export const POSITION_CENTER = 1; export const POSITION_RIGHT = 2;
export const POSITION_TOP = 0; export const POSITION_MIDDLE = 3; export const POSITION_BOTTOM = 6;
export const LIGATURE_DEFAULT = 0; export const LIGATURE_STEM_LEFT_UP = 1; export const LIGATURE_STEM_LEFT_DOWN = 2; export const LIGATURE_STEM_RIGHT_UP = 4; export const LIGATURE_STEM_RIGHT_DOWN = 8; export const LIGATURE_OBLIQUE = 16; export const LIGATURE_STACKED = 32;
export const MARKUP_DEFAULT = 0; export const MARKUP_ANALYTICAL_TIE = 1; export const MARKUP_ANALYTICAL_FERMATA = 2; export const MARKUP_GRACE_ATTRIBUTE = 4; export const MARKUP_ARTIC_MULTIVAL = 8; export const MARKUP_SCOREDEF_DEFINITIONS = 16;
export enum LayoutInformation { LAYOUT_NONE = 0, LAYOUT_ENCODED, LAYOUT_DONE }
export enum Accessor { SELF = 0, CONTENT }
export const KEY_LEFT = 37; export const KEY_UP = 38; export const KEY_RIGHT = 39; export const KEY_DOWN = 40; export const KEY_DOT = 46;
export enum StemSameasDrawingRole { SAMEAS_NONE = 0, SAMEAS_UNSET, SAMEAS_PRIMARY, SAMEAS_SECONDARY }
export enum SmuflTextFont { SMUFL_NONE = 0, SMUFL_FONT_SELECTED, SMUFL_FONT_FALLBACK }
export enum GraphicID { PRIMARY = 0, SPANNING, SYMBOLREF }
export enum MeasureType { MEASURED = 0, UNMEASURED, NEUMELINE }
export enum FocusStatusType { FOCUS_UNSET = 0, FOCUS_SET, FOCUS_USED }
export enum MensuralCastOffType { MENSURAL_CAST_OFF_INIT = 0, MENSURAL_CAST_OFF_UNSET, MENSURAL_CAST_OFF_RESET }
export const SCORE_TIME_UNIT = 4;
export const NEUME_LINE_TYPE = 'neon-neume-line';
export const CSS_SHOW_HIDDEN = 'show-hidden';
export const OCTAVE_OFFSET = 4;
export const STANDARD_STEMLENGTH = 7;
export const STANDARD_STEMLENGTH_TAB = 3;
export const TABLATURE_STAFF_RATIO = 1.75;
export const GERMAN_TAB_STAFF_RATIO = 2.2;
export const SUPER_SCRIPT_FACTOR = 0.58;
export const SUPER_SCRIPT_POSITION = -0.20;
export const SUB_SCRIPT_POSITION = -0.17;
export const NOTE_HEIGHT_TO_STAFF_SIZE_RATIO = 2;
export const NOTE_WIDTH_TO_STAFF_SIZE_RATIO = 1.4;

export const VERSION_MAJOR = 6;
export const VERSION_MINOR = 4;
export const VERSION_REVISION = 0;
export const VERSION_DEV = true;
export const VRV_RESOURCE_DIR = '/usr/local/share/verovio';
export const MIDI_VELOCITY = 90;
export const MIDI_TEMPO = 120;
export const UNACC_GRACENOTE_DUR = 27;
export const UNACC_GRACENOTE_FRACTION = [1, 2048] as const;
export const VRV_DYNAMIC_CAST = false;
export function vrvCast<T>(value: unknown): T {
  // C++ vrv_cast is a compile-time cast selection; TS has no equivalent runtime
  // operator, so this preserves the typed cast boundary without adding logic.
  return value as T;
}

export const STAFFREL_above: number = 1;
export const STAFFREL_below: number = 2;
export const STAFFREL_within: number = 4;
export const STAFFREL_between: number = 3;
export const CURVEDIR_above: number = 0;
export const CURVEDIR_none: number = -1;
