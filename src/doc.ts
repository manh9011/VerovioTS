/**
 * Pure TypeScript structural foundation for Verovio's Doc.
 *
 * Pass 71 intentionally covers the object/lifecycle state from doc.h/doc.cpp.
 * Large rendering, cast-off, MIDI, and conversion algorithms remain IN_PROGRESS
 * until their dependent classes have been ported; those methods are declared but
 * fail explicitly instead of silently changing semantics.
 */
import { VrvObject } from './object.js';
import { MNum } from './mnum.js';
import { Text } from './text.js';
import { ClassId, FocusStatusType, MARKUP_DEFAULT, MIDI_TEMPO, FunctorCode, MensuralCastOffType, IntTree } from './vrvdef.js';
import { FileFormat } from './toolkitdef.js';
import { LogWarning } from './vrv.js';
import { Options, OptionDurationEq } from './options.js';
import { Transposer } from './transposition.js';
import { xml_document } from './pugixml.js';
import { FontInfo, Point } from './devicecontextbase.js';
// Per-call literal replaced by keyed static tables (see Doc.marginOption).
const MARGIN_LEFT_NAMES: Record<number, string> = { [ClassId.ACCID]:'m_leftMarginAccid',[ClassId.BARLINE]:'m_leftMarginBarLine',[ClassId.BEATRPT]:'m_leftMarginBeatRpt',[ClassId.CHORD]:'m_leftMarginChord',[ClassId.CLEF]:'m_leftMarginClef',[ClassId.KEYSIG]:'m_leftMarginKeySig',[ClassId.MENSUR]:'m_leftMarginMensur',[ClassId.METERSIG]:'m_leftMarginMeterSig',[ClassId.MREST]:'m_leftMarginMRest',[ClassId.MRPT2]:'m_leftMarginMRpt2',[ClassId.MULTIREST]:'m_leftMarginMultiRest',[ClassId.MULTIRPT]:'m_leftMarginMultiRpt',[ClassId.NOTE]:'m_leftMarginNote',[ClassId.STEM]:'m_leftMarginNote',[ClassId.REST]:'m_leftMarginRest',[ClassId.TABDURSYM]:'m_leftMarginTabDurSym' };
const MARGIN_RIGHT_NAMES: Record<number, string> = { [ClassId.ACCID]:'m_rightMarginAccid',[ClassId.BARLINE]:'m_rightMarginBarLine',[ClassId.BEATRPT]:'m_rightMarginBeatRpt',[ClassId.CHORD]:'m_rightMarginChord',[ClassId.CLEF]:'m_rightMarginClef',[ClassId.KEYSIG]:'m_rightMarginKeySig',[ClassId.MENSUR]:'m_rightMarginMensur',[ClassId.METERSIG]:'m_rightMarginMeterSig',[ClassId.MREST]:'m_rightMarginMRest',[ClassId.MRPT2]:'m_rightMarginMRpt2',[ClassId.MULTIREST]:'m_rightMarginMultiRest',[ClassId.MULTIRPT]:'m_rightMarginMultiRpt',[ClassId.NOTE]:'m_rightMarginNote',[ClassId.STEM]:'m_rightMarginNote',[ClassId.REST]:'m_rightMarginRest',[ClassId.TABDURSYM]:'m_rightMarginTabDurSym' };
const MARGIN_BOTTOM_NAMES: Record<number, string> = { [ClassId.ARTIC]:'m_bottomMarginArtic',[ClassId.HARM]:'m_bottomMarginHarm',[ClassId.OCTAVE]:'m_bottomMarginOctave' };
const MARGIN_TOP_NAMES: Record<number, string> = { [ClassId.ARTIC]:'m_topMarginArtic',[ClassId.HARM]:'m_topMarginHarm' };
import { SUPER_SCRIPT_FACTOR } from './vrvdef.js';
import { GetVersion, UTF8to32 } from './vrv.js';
import { ExpansionMap } from './expansionmap.js';
import { Page } from './page.js';
import { Score } from './score.js';
import { ScoreDef } from './scoredef.js';
import { Measure } from './measure.js';
import { System } from './system.js';

import type { DocSelection } from './docselection.js';
import { MeasurementSigned } from './scoredef.js';
import { Resources } from './resources.js';
import { PageRange, Pages } from './pages.js';
import { Functor, ConstFunctor } from './functor.js';
import { Filters, AttNIntegerComparison, LyricElementComparison } from './comparison.js';
import { ConvertMarkupArticFunctor, ConvertMarkupAnalyticalFunctor, ConvertMarkupScoreDefFunctor, ConvertToCmnFunctor, ConvertToMensuralViewFunctor, ConvertToCastOffMensuralFunctor } from './convertfunctor.js';
import { InitProcessingListsFunctor } from './miscfunctor.js';
import { InitMIDIFunctor, GenerateMIDIFunctor, InitMaxMeasureDurationFunctor, InitOnsetOffsetFunctor, InitTimemapTiesFunctor, InitTimemapAdjustNotesFunctor, GenerateTimemapFunctor, GenerateFeaturesFunctor } from './midifunctor.js';
import { CustomTuning } from './customtuning.js';
import { Timemap } from './timemap.js';
import { FeatureExtractor } from './featureextractor.js';
import { ScoreDefOptimizeFunctor } from './setscoredeffunctor.js';
import { ScoreDefSetGrpSymFunctor, ScoreDefSetCurrentPageFunctor, ScoreDefSetCurrentFunctor, ScoreDefSetOssiaFunctor, ScoreDefUnsetCurrentFunctor } from './setscoredeffunctor.js';
import { CastOffSystemsFunctor, CastOffPagesFunctor, CastOffEncodingFunctor, CastOffToSelectionFunctor, UnCastOffFunctor } from './castofffunctor.js';
import { AlignMeasuresFunctor } from './alignfunctor.js';
import { ConvertToPageBasedFunctor } from './convert-pagebased.js';
import { ScoringUpFunctor } from './scoringupfunctor.js';
import { TransposeFunctor, TransposeSelectedMdivFunctor, TransposeToSoundingPitchFunctor } from './transposefunctor.js';
import { PgFoot } from './pgfoot.js';
import { PgHead } from './pghead.js';
import { PGFUNC_first, PGFUNC_all } from './attconverter.js';
import { HorizontalAlignment, VerticalAlignment } from './areaposinterface.js';
import { SyncFromFacsimileFunctor, SyncToFacsimileFunctor } from './facsimilefunctor.js';
import { PrepareDataInitializationFunctor, PrepareCueSizeFunctor, PrepareCrossStaffFunctor, PrepareAltSymFunctor, PrepareFacsimileFunctor, PrepareLinkingFunctor, PreparePlistFunctor, PrepareDurationFunctor, PrepareTimePointingFunctor, PrepareTimeSpanningFunctor, PrepareTimestampsFunctor, PreparePedalsFunctor, PreparePointersByLayerFunctor, PrepareLyricsFunctor, PrepareLayerElementPartsFunctor, PrepareRptFunctor, PrepareDelayedTurnsFunctor, PrepareMilestonesFunctor, PrepareFloatingGrpsFunctor, PrepareStaffCurrentTimeSpanningFunctor, PrepareRehPositionFunctor, PrepareBeamSpanElementsFunctor } from './preparedatafunctor.js';
import { ResetDataFunctor } from './resetfunctor.js';

  // ponytail: markup/facsimile functor seams removed with tests; re-add if injection needed.


export enum DocType { Raw = 0, Rendering, Transcription, Facs }

const BOOLEAN_NONE = 0;
const BOOLEAN_true = 1;
const NOTATIONTYPE_NONE = 0;
const NOTATIONTYPE_mensural = 2;

function unsupported(name: string): never { throw new Error(`Doc::${name} is not migrated yet.`); }


class GeneratedStaffDefNode extends VrvObject {
  private n = 0;
  private lines = 0;
  private notationType = 0;
  public constructor() { super(ClassId.STAFFDEF); }
  public SetN(value: number): void { this.n = value; }
  public GetN(): number { return this.n; }
  public SetLines(value: number): void { this.lines = value; }
  public GetLines(): number { return this.lines; }
  public SetNotationtype(value: number): void { this.notationType = value; }
  public GetNotationtype(): number { return this.notationType; }
  public override IsSupportedChild(_classId: ClassId): boolean { return false; }
}

class GeneratedStaffGrpNode extends VrvObject {
  public constructor() { super(ClassId.STAFFGRP); }
  public override IsSupportedChild(classId: ClassId): boolean { return classId === ClassId.STAFFDEF; }
}
import { Facsimile } from './facsimile.js';
class GeneratedFacsimileNode extends Facsimile {
  public constructor() { super(); }
}

import type { Expansion } from './expansion.js';

export class Doc extends VrvObject {
  private m_options: Options;
  private m_visibleScores: Score[] = [];
  private m_isCastOff = false;
  private m_focusStatus: FocusStatusType = FocusStatusType.FOCUS_UNSET;
  private m_drawingPage: Page | null = null;
  private m_currentScoreDefDone = false;
  private m_dataPreparationDone = false;
  private m_timemapTempo = 0.0;
  private m_markup = MARKUP_DEFAULT;
  private m_isMensuralMusicOnly = BOOLEAN_NONE;
  private m_mensuralCastOff = false;
  private m_isNeumeLines = false;
  private m_type: DocType = DocType.Raw;
  private m_pageWidth = -1;
  private m_pageHeight = -1;
  private m_pageMarginBottom = 0;
  private m_pageMarginLeft = 0;
  private m_pageMarginRight = 0;
  private m_pageMarginTop = 0;
  private m_drawingSmuflFontSize = 0;
  private m_drawingLyricFontSize = 0;
  public m_drawingPageHeight = -1;
  public m_drawingPageWidth = -1;
  public m_drawingPageContentHeight = -1;
  public m_drawingPageContentWidth = -1;
  public m_drawingPageMarginBottom = 0;
  public m_drawingPageMarginRight = 0;
  public m_drawingPageMarginLeft = 0;
  public m_drawingPageMarginTop = 0;
  private m_focusRange: PageRange | null = null;
  private m_facsimile: Facsimile | null = null; // ponytail: Facsimile type kept; GeneratedFacsimileNode extends it.
  // ponytail: functor factories removed; Doc news canonical functors directly. Re-add seam if test injection needed.

  // ponytail: facsimile functor seams removed with tests; re-add if injection needed.

  public m_selectionPreceding: Page | null = null;
  public m_selectionFollowing: Page | null = null;
  public m_selectionStart = '';
  public m_selectionEnd = '';
  public m_header = new xml_document();
  public m_front = new xml_document();
  public m_back = new xml_document();
  public m_musicDecls = '';
  public m_drawingBeamMaxSlope = 0;
  public m_notationType = NOTATIONTYPE_NONE;
  public m_expansionMap: ExpansionMap = new ExpansionMap();
  public m_drawingBeamWidth = 0;
  public m_drawingBeamWhiteWidth = 0;
  public m_drawingBrevisWidth = 0;
  public m_fingeringFontSize = 0;
  public m_drawingSmuflFont = new FontInfo();
  public m_drawingLyricFont = new FontInfo();
  public m_fingeringFont = new FontInfo();
  private m_resources: Resources = new Resources();

  public constructor() {
    super(ClassId.DOC);
    this.m_options = new Options();
    this.Reset();
  }

  public override GetClassName(): string { return 'body'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.MDIV || classId === ClassId.PAGES;
  }

  public override Reset(): void {
    super.Reset();
    this.ResetID();
    this.m_options ??= new Options();
    this.m_header ??= new xml_document();
    this.m_front ??= new xml_document();
    this.m_back ??= new xml_document();
    this.ResetToSerialization();
    this.m_drawingPage = null;
    this.m_header.reset(); this.m_front.reset(); this.m_back.reset();
    this.m_isCastOff = false;
  }

  public ResetToSerialization(): void {
    this.ClearSelectionPages();
    this.ClearChildren();
    this.m_type = DocType.Raw;
    this.m_notationType = NOTATIONTYPE_NONE;
    this.m_pageHeight = -1; this.m_pageWidth = -1;
    this.m_pageMarginBottom = 0; this.m_pageMarginRight = 0; this.m_pageMarginLeft = 0; this.m_pageMarginTop = 0;
    this.m_drawingPageHeight = -1; this.m_drawingPageWidth = -1;
    this.m_drawingPageContentHeight = -1; this.m_drawingPageContentWidth = -1;
    this.m_drawingPageMarginBottom = 0; this.m_drawingPageMarginRight = 0; this.m_drawingPageMarginLeft = 0; this.m_drawingPageMarginTop = 0;
    this.m_drawingPage = null;
    this.m_currentScoreDefDone = false; this.m_dataPreparationDone = false; this.m_timemapTempo = 0.0;
    this.m_markup = MARKUP_DEFAULT; this.m_isMensuralMusicOnly = BOOLEAN_NONE; this.m_isNeumeLines = false;
    this.m_visibleScores = [];
    this.m_focusRange = null; this.m_focusStatus = FocusStatusType.FOCUS_UNSET; this.m_facsimile = null;
    this.m_drawingSmuflFontSize = 0; this.m_drawingLyricFontSize = 0;
    this.m_isCastOff = true; this.m_mensuralCastOff = false;
  }

  public ResetToLoading(): void {
    // C++ Doc::ResetToLoading runs ScoreDefUnsetCurrentFunctor when set.
    if (this.m_currentScoreDefDone) {
      this.Process(new ScoreDefUnsetCurrentFunctor());
      this.m_currentScoreDefDone = false;
    }
  }

  public ClearSelectionPages(): void {
    this.m_selectionPreceding = null; this.m_selectionFollowing = null;
    this.m_selectionStart = ''; this.m_selectionEnd = '';
  }

  public GetOptions(): Options { return this.m_options; }

  public SetResources(resources: Resources | any): void { this.m_resources = resources as Resources; }
  public GetDrawingUnit(staffSize: number): number { return Math.trunc(this.maybeOption('m_unit', 0) * staffSize / 100); }
  public GetDrawingDoubleUnit(staffSize: number): number { return Math.trunc(this.maybeOption('m_unit', 0) * 2 * staffSize / 100); }
  public GetDrawingStaffSize(staffSize: number): number { return Math.trunc(this.maybeOption('m_unit', 0) * 8 * staffSize / 100); }
  public GetDrawingOctaveSize(staffSize: number): number { return Math.trunc(this.maybeOption('m_unit', 0) * 7 * staffSize / 100); }
  public GetDrawingBrevisWidth(staffSize: number): number { return Math.trunc(this.m_drawingBrevisWidth * staffSize / 100); }
  public GetDrawingBarLineWidth(staffSize: number): number { return Math.trunc(this.maybeOption('m_barLineWidth', 0) * this.GetDrawingUnit(staffSize)); }
  public GetDrawingStaffLineWidth(staffSize: number): number { return Math.trunc(this.maybeOption('m_staffLineWidth', 0) * this.GetDrawingUnit(staffSize)); }
  public GetDrawingStemWidth(staffSize: number): number { return Math.trunc(this.maybeOption('m_stemWidth', 0) * this.GetDrawingUnit(staffSize)); }
  public GetDrawingDynamHeight(staffSize: number, withMargin: boolean): number {
    let h = this.GetGlyphHeight(0xE522, staffSize, false);
    if (withMargin) h += this.GetDrawingUnit(staffSize);
    return Math.trunc(h);
  }
  public GetDrawingHairpinSize(staffSize: number, withMargin: boolean): number {
    let v = Math.trunc(this.maybeOption('m_hairpinSize', 0) * this.GetDrawingUnit(staffSize));
    if (withMargin) v += this.GetDrawingUnit(staffSize);
    return Math.trunc(v);
  }
  public GetDrawingBeamWidth(staffSize: number, graceSize: boolean): number { let value = Math.trunc(this.m_drawingBeamWidth * staffSize / 100); if (graceSize) value = Math.trunc(value * this.GetCueScaling()); return value; }
  public GetDrawingBeamWhiteWidth(staffSize: number, graceSize: boolean): number { let value = Math.trunc(this.m_drawingBeamWhiteWidth * staffSize / 100); if (graceSize) value = Math.trunc(value * this.GetCueScaling()); return value; }
  public GetDrawingLedgerLineExtension(staffSize: number, graceSize: boolean): number {
    let v = Math.trunc(this.maybeOption('m_ledgerLineExtension', 0) * this.GetDrawingUnit(staffSize));
    return graceSize ? Math.trunc(this.GetCueSize(v)) : v;
  }
  public GetDrawingMinimalLedgerLineExtension(staffSize: number, graceSize: boolean): number {
    const option = this.getOption('m_ledgerLineExtension');
    let v = option?.getMin ? Math.trunc(option.getMin() * this.GetDrawingUnit(staffSize)) : 0;
    return graceSize ? Math.trunc(this.GetCueSize(v)) : v;
  }
  public GetCueSize(value: number): number { return Math.trunc(value * this.GetCueScaling()); }
  public GetCueScaling(): number { return this.maybeOption('m_graceFactor', 0); }

  public GetGlyphHeight(code:number, staffSize:number, graceSize:boolean):number { const g=this.m_resources.GetGlyph?.(code) ?? null; if(!g) return 0; const b=g.GetBoundingBox(); let h=Math.trunc(b.h*this.m_drawingSmuflFontSize/g.GetUnitsPerEm()); if(graceSize)h=Math.trunc(h*this.m_options.m_graceFactor.getValue()); h=Math.trunc(h*staffSize/100); return h; }
  public GetGlyphWidth(code:number, staffSize:number, graceSize:boolean):number { const g=this.m_resources.GetGlyph?.(code) ?? null; if(!g) return 0; const b=g.GetBoundingBox(); let v=Math.trunc(b.w*this.m_drawingSmuflFontSize/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.m_options.m_graceFactor.getValue()); v=Math.trunc(v*staffSize/100); return v; }
  public GetGlyphAdvX(code:number, staffSize:number, graceSize:boolean):number { const g=this.m_resources.GetGlyph?.(code) ?? null; if(!g) return 0; let v=Math.trunc(g.GetHorizAdvX()*this.m_drawingSmuflFontSize/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.m_options.m_graceFactor.getValue()); v=Math.trunc(v*staffSize/100); return v; }
  public GetGlyphLeft(code:number, staffSize:number, graceSize:boolean):number { const g=this.m_resources.GetGlyph?.(code) ?? null; if(!g) throw new Error('Doc::GetGlyphLeft: missing glyph'); let v=Math.trunc(g.GetBoundingBox().x*this.m_drawingSmuflFontSize/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.m_options.m_graceFactor.getValue()); v=Math.trunc(v*staffSize/100); return v; }
  public GetGlyphRight(code:number, staffSize:number, graceSize:boolean):number { return this.GetGlyphLeft(code,staffSize,graceSize)+this.GetGlyphWidth(code,staffSize,graceSize); }
  public GetGlyphBottom(code:number, staffSize:number, graceSize:boolean):number { const g=this.m_resources.GetGlyph?.(code) ?? null; if(!g) throw new Error('Doc::GetGlyphBottom: missing glyph'); let v=Math.trunc(g.GetBoundingBox().y*this.m_drawingSmuflFontSize/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.m_options.m_graceFactor.getValue()); v=Math.trunc(v*staffSize/100); return v; }
  public GetGlyphTop(code:number, staffSize:number, graceSize:boolean):number { return this.GetGlyphBottom(code,staffSize,graceSize)+this.GetGlyphHeight(code,staffSize,graceSize); }
  public ConvertFontPoint(glyph: { GetUnitsPerEm(): number }, fontPoint: Point, staffSize: number, graceSize: boolean): Point {
    // C++ Point stores int coordinates: truncate after each scaling stage.
    let x = Math.trunc(fontPoint.x * this.m_drawingSmuflFontSize / glyph.GetUnitsPerEm());
    let y = Math.trunc(fontPoint.y * this.m_drawingSmuflFontSize / glyph.GetUnitsPerEm());
    if (graceSize) {
      x = Math.trunc(x * this.GetCueScaling());
      y = Math.trunc(y * this.GetCueScaling());
    }
    if (staffSize !== 100) {
      x = Math.trunc(x * staffSize / 100);
      y = Math.trunc(y * staffSize / 100);
    }
    return new Point(x, y);
  }
  private textGlyph(code:number): import('./glyph.js').Glyph { const g=this.m_resources.GetTextGlyph?.(code); if(!g) throw new Error(`Doc::missing text glyph ${code}`); return g; }
  public GetTextGlyphHeight(code:number,font:FontInfo,graceSize:boolean):number { if(!font) throw new Error('Doc::GetTextGlyphHeight requires font'); const g=this.textGlyph(code); let v=Math.trunc(g.GetBoundingBox().h*font.GetPointSize()/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.GetCueScaling()); return v; }
  public GetTextGlyphWidth(code:number,font:FontInfo,graceSize:boolean):number { if(!font) throw new Error('Doc::GetTextGlyphWidth requires font'); const g=this.textGlyph(code); let v=Math.trunc(g.GetBoundingBox().w*font.GetPointSize()/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.GetCueScaling()); return v; }
  public GetTextGlyphAdvX(code:number,font:FontInfo,graceSize:boolean):number { if(!font) throw new Error('Doc::GetTextGlyphAdvX requires font'); const g=this.textGlyph(code); let v=Math.trunc(g.GetHorizAdvX()*font.GetPointSize()/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.GetCueScaling()); return v; }
  public GetTextGlyphDescender(code:number,font:FontInfo,graceSize:boolean):number { if(!font) throw new Error('Doc::GetTextGlyphDescender requires font'); const g=this.textGlyph(code); let v=Math.trunc(g.GetBoundingBox().y*font.GetPointSize()/g.GetUnitsPerEm()); if(graceSize)v=Math.trunc(v*this.GetCueScaling()); return v; }
  public GetTextLineHeight(font:FontInfo,graceSize:boolean):number { if(!font) throw new Error('Doc::GetTextLineHeight requires font'); let line=Math.trunc((-this.GetTextGlyphDescender(113,font,graceSize)+this.GetTextGlyphHeight(73,font,graceSize))*1.1); if(font.GetSupSubScript()) line=Math.trunc(line/SUPER_SCRIPT_FACTOR); return line; }
  public GetTextXHeight(font:FontInfo,graceSize:boolean):number { return this.GetTextGlyphHeight(120,font,graceSize); }
  public GetDrawingSmuflFont(staffSize:number,graceSize:boolean):FontInfo { this.m_drawingSmuflFont.SetFaceName?.(this.m_resources.GetCurrentFont?.() ?? ''); let v=this.m_drawingSmuflFontSize*staffSize/100; if(graceSize)v=Math.trunc(v*this.GetCueScaling()); this.m_drawingSmuflFont.SetPointSize?.(Math.trunc(v)); return this.m_drawingSmuflFont; }
  public GetDrawingLyricFont(staffSize:number):FontInfo { this.m_drawingLyricFont.SetPointSize?.(Math.trunc(this.m_drawingLyricFontSize*staffSize/100)); return this.m_drawingLyricFont; }
  public GetFingeringFont(staffSize:number):FontInfo { this.m_fingeringFont.SetPointSize?.(Math.trunc(this.m_fingeringFontSize*staffSize/100)); return this.m_fingeringFont; }
  public GetMusicToLyricFontSizeRatio():number { return this.m_drawingLyricFontSize===0 ? 1 : this.m_drawingSmuflFontSize/this.m_drawingLyricFontSize; }
  private getOption(name:string): any { return (this.m_options as any)[name]; }
  private maybeOption(name:string, fallback:number):number { return this.getOption(name)?.getValue?.() ?? fallback; }
  private scaleDrawingValue(value:number,staffSize:number,graceSize:boolean):number { let v=value*staffSize/100; if(graceSize)v*=this.GetCueScaling(); return v; }

  public SetOptions(options: Options): void { this.m_options.copyOptionValuesFrom(options); }

  public GetResources(): Resources { return this.m_resources; }
  public GetResourcesForModification(): Resources { return this.m_resources; }

  public GetType(): DocType { return this.m_type; }
  public SetType(type: DocType): void { this.m_type = type; }
  public IsFacs(): boolean { return this.m_type === DocType.Facs; }
  public IsRaw(): boolean { return this.m_type === DocType.Raw; }
  public IsRendering(): boolean { return this.m_type === DocType.Rendering; }
  public IsTranscription(): boolean { return this.m_type === DocType.Transcription; }

  public SetMarkup(markup: number): void { this.m_markup |= markup; }
  public SetMensuralMusicOnly(value: number): void {
    // C++: once explicitly marked non-mensural (BOOLEAN_false), the flag cannot be changed back.
    if (this.m_isMensuralMusicOnly !== 2) this.m_isMensuralMusicOnly = value;
  }
  public IsMensuralMusicOnly(): boolean { return this.m_isMensuralMusicOnly === BOOLEAN_true; }
  public SetNeumeLines(value: boolean): void { this.m_isNeumeLines = value; }
  public IsNeumeLines(): boolean { return this.m_isNeumeLines; }
  public SetFacsimile(value: Facsimile | null): void { this.m_facsimile = value; }
  public GetFacsimile(): Facsimile | null { return this.m_facsimile; }
  public HasFacsimile(): boolean { return this.m_facsimile !== null; }
  public IsCastOff(): boolean { return this.m_isCastOff; }
  public HasSelection(): boolean { return this.m_selectionStart.length > 0 && this.m_selectionEnd.length > 0; }
  public GetDrawingPage(): Page | null { return this.m_drawingPage; }
  public ResetDataPage(): void { this.m_drawingPage = null; }
  public HasTimemap(): boolean { return this.m_timemapTempo === this.maybeOption('m_midiTempoAdjustment', 1); }
  public CalculateTimemap(): void {
    // C++ returns without changing state when there is no page data.
    if (this.GetPageCount() === 0) return;

    this.m_timemapTempo = 0.0;

    // If cast-off has not established a drawing page, reproduce the C++ bootstrap.
    if (!this.m_drawingPage) {
      const page = this.SetDrawingPage(0);
      if (!page) throw new Error('Doc::CalculateTimemap failed to establish drawing page.');
      this.ScoreDefSetCurrentDoc();
      page.LayOut?.();
    }

    let tempo = MIDI_TEMPO;
    const score = this.GetFirstVisibleScore();
    if (!score) throw new Error('Doc::CalculateTimemap requires a visible score.');
    const scoreDef = score.GetScoreDef?.() ?? null;
    if (!scoreDef) throw new Error('Doc::CalculateTimemap requires a scoreDef.');
    const sd = scoreDef as ScoreDef & {
      HasMidiBpm?: () => boolean; GetMidiBpm?: () => number;
      HasMm?: () => boolean; GetMm?: () => unknown;
    };
    if (sd.HasMidiBpm?.()) {
      tempo = sd.GetMidiBpm?.() ?? tempo;
    } else if (sd.HasMm?.()) {
      const calcTempo = (sd as any).CalcTempo;
      if (typeof calcTempo !== 'function') throw new Error('Doc::CalculateTimemap requires Tempo::CalcTempo collaborator.');
      tempo = calcTempo(scoreDef);
    }

    const maxDuration = new InitMaxMeasureDurationFunctor();
    (maxDuration as any).SetCurrentTempo?.(tempo);
    (maxDuration as any).SetTempoAdjustment?.(this.m_options.m_midiTempoAdjustment.getValue());
    this.Process(maxDuration);

    const onsetOffset = new InitOnsetOffsetFunctor(this);
    this.Process(onsetOffset);

    const ties = new InitTimemapTiesFunctor();
    (ties as any).SetDirection?.(false);
    this.Process(ties);

    const adjustNotes = new InitTimemapAdjustNotesFunctor();
    (adjustNotes as any).SetNoCue?.(this.m_options.m_midiNoCue.getValue());
    this.Process(adjustNotes);

    this.m_timemapTempo = this.m_options.m_midiTempoAdjustment.getValue();
  }

  public PrepareMeasureIndices(): void {
    // C++: find every MEASURE without continuing the deepness search past matches,
    // then assign monotonically increasing 1-based indices in traversal order.
    const measures = this.FindAllDescendantsByType(ClassId.MEASURE, false, undefined);
    let index = 0;
    for (const object of measures) {
      const measure = object as unknown as { SetIndex?: (value: number) => void };
      if (typeof measure.SetIndex !== 'function') {
        throw new Error('Doc::PrepareMeasureIndices requires Measure::SetIndex().');
      }
      measure.SetIndex(++index);
    }
  }

  public GenerateMEIHeader(): void {
    this.m_header.remove_children();
    const meiHead = this.m_header.append_child('meiHead');
    const fileDesc = meiHead.append_child('fileDesc');
    const titleStmt = fileDesc.append_child('titleStmt');
    titleStmt.append_child('title');

    const pubStmt = fileDesc.append_child('pubStmt');
    const date = pubStmt.append_child('date');
    const now = new Date();
    const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    date.append_attribute('isodate').set_value(isoDate);

    const encodingDesc = meiHead.append_child('encodingDesc');
    const appInfo = encodingDesc.append_child('appInfo');
    const application = appInfo.append_child('application');
    application.append_attribute('xml:id').set_value('verovio');
    application.append_attribute('version').set_value(GetVersion());
    const name = application.append_child('name');
    name.text().set(`Verovio (${GetVersion()})`);
    const projectDesc = encodingDesc.append_child('projectDesc');
    const p1 = projectDesc.append_child('p');
    p1.text().set('MEI encoded with Verovio');
  }

  public ConvertHeaderToMEIBasic(): void {
    const meiHead = this.m_header.child('meiHead');
    if (meiHead.empty()) return;
    // Preserve only fileDesc under meiHead.
    for (let child = meiHead.first_child(); !child.empty();) {
      const next = child.next_sibling();
      if (child.name() !== 'fileDesc') meiHead.remove_child(child);
      child = next;
    }

    const fileDesc = meiHead.child('fileDesc');
    if (fileDesc.empty()) return;
    const titleStmt = fileDesc.child('titleStmt');
    if (titleStmt.empty()) return;
    for (let child = titleStmt.first_child(); !child.empty();) {
      const next = child.next_sibling();
      const name = child.name();
      if (name !== 'title' && name !== 'respStmt' && name !== 'composer' && name !== 'arranger' && name !== 'lyricist') {
        titleStmt.remove_child(child);
      }
      child = next;
    }
  }

  public RefreshLayout(): void {
    if (this.m_focusStatus !== FocusStatusType.FOCUS_UNSET) {
      if (!this.m_focusRange) {
        throw new Error('Doc::RefreshLayout requires focus range when focus is active.');
      }
      this.m_focusRange.LayOutAll?.();
      return;
    }

    const pages = this.GetPages();
    if (!pages) {
      throw new Error('Doc::RefreshLayout requires pages when focus is unset.');
    }
    pages.LayOutAll();
  }

  public SetFocus(): void {
    // C++ guard: once focus has been set, this method is a no-op.
    if (this.m_focusStatus !== FocusStatusType.FOCUS_UNSET) return;

    if (!this.m_focusRange) this.m_focusRange = new PageRange(this as any) as unknown as PageRange;
    if (!this.m_focusRange.Reset || !this.m_focusRange.SetAsFocus) {
      throw new Error('Doc::SetFocus requires a complete focus range contract.');
    }
    this.m_focusRange.Reset();
    this.m_focusRange.SetAsFocus(this.m_drawingPage);
    this.m_focusStatus = FocusStatusType.FOCUS_SET;

    // Preserve the C++ lifecycle ordering exactly.
    this.PrepareData();
    this.ScoreDefSetCurrentDoc(true);
    this.RefreshLayout();
  }

  public ResetFocus(): void {
    if (this.m_focusStatus === FocusStatusType.FOCUS_UNSET) return;
    if (!this.m_focusRange) throw new Error('Doc::ResetFocus requires a focus range when focus is active.');
    if (!this.m_focusRange.ClearChildren) {
      throw new Error('Doc::ResetFocus requires a complete focus range contract.');
    }
    this.m_focusRange.ClearChildren();
    this.m_focusStatus = FocusStatusType.FOCUS_UNSET;
    this.PrepareData();
    this.ScoreDefSetCurrentDoc(true);
  }

  public HasPage(pageIdx: number): boolean {
    const pages = this.GetPages();
    // C++ asserts that a pages container exists; do not silently turn an
    // invalid document state into `false`.
    if (!pages) throw new Error('Doc::HasPage requires pages.');
    return pageIdx >= 0 && pageIdx < this.GetChildCountOf(pages);
  }

  private GetChildCountOf(node: { GetChildren?: () => unknown[] }): number {
    return node.GetChildren?.().length ?? 0;
  }
  public GetPages(): Pages | null {
    // C++: vrv_cast<Pages *>(this->FindDescendantByType(PAGES));
    // The mutable/const overloads are one logical operation in TypeScript.
    return this.FindDescendantByType(ClassId.PAGES) as Pages | null;
  }

  public GetPageCount(): number {
    // C++: pages ? pages->GetChildCount() : 0.
    const pages = this.GetPages();
    return pages ? pages.GetChildrenForModification().length : 0;
  }
  public GetFirstScoreDef(): ScoreDef | null {
    // C++: const Score *score = vrv_cast<const Score *>(FindDescendantByType(SCORE, 3));
    //      return score ? score->GetScoreDef() : NULL;
    const score = this.FindDescendantByType(ClassId.SCORE, 3) as unknown as { GetScoreDef: () => ScoreDef | null } | null;
    return score ? score.GetScoreDef() : null;
  }
  public CollectVisibleScores(): void {
    // C++: m_visibleScores.clear();
    //      ListOfObjects objects = FindAllDescendantsByType(SCORE, false, 3);
    //      for (Object *object : objects) {
    //          Score *score = vrv_cast<Score *>(object);
    //          assert(score);
    //          if (score->GetMilestoneEnd()) m_visibleScores.push_back(score);
    //      }
    this.m_visibleScores = [];
    const objects = this.FindAllDescendantsByType(ClassId.SCORE, false, 3);
    for (const object of objects) {
      const score = object as unknown as Score;
      if (typeof score.GetMilestoneEnd !== 'function') {
        throw new Error('Doc::CollectVisibleScores invariant violated: SCORE node lacks GetMilestoneEnd().');
      }
      if (score.GetMilestoneEnd()) this.m_visibleScores.push(score);
    }
  }
  public GetVisibleScores(): Score[] {
    if (this.m_visibleScores.length === 0) this.CollectVisibleScores();
    return [...this.m_visibleScores];
  }
  public GetFirstVisibleScore(): Score {
    if (this.m_visibleScores.length === 0) this.CollectVisibleScores();
    const score = this.m_visibleScores[0];
    if (!score) throw new Error('Doc::GetFirstVisibleScore invariant violated: no visible scores.');
    return score;
  }
  public GetCorrespondingScore(object: VrvObject, scores?: Score[]): Score {
    // C++ overloads delegate to the const implementation. The no-list overload
    // intentionally uses the already prepared m_visibleScores; it does not lazily
    // call CollectVisibleScores(). Preserve the assert(!scores.empty()) invariant.
    const candidates = scores ?? this.m_visibleScores;
    if (candidates.length === 0) {
      throw new Error('Doc::GetCorrespondingScore requires a non-empty score list.');
    }

    let corresponding = candidates[0];
    for (const score of candidates) {
      if ((score as unknown) === object || (score instanceof VrvObject && VrvObject.IsPreOrdered(score, object))) {
        corresponding = score;
      }
    }
    return corresponding;
  }
  public GetMidiExportDone(): boolean { return false; }
  public ExportMIDI(midiFile: { absoluteTicks(): void; getTrackCount(): number; addTempo(track:number,tick:number,tempo:number):unknown; addTracks(count:number):unknown; addPatchChange(track:number,tick:number,channel:number,patch:number):unknown; addTrackName(track:number,tick:number,text:string):unknown; addKeySignature(track:number,tick:number,fifths:number,minor?:boolean):unknown; addTimeSignature(track:number,tick:number,top:number,bottom:number):unknown; sortTracksNoteOffsBeforeOns(): void }): void {
    midiFile.absoluteTicks();
    if (!this.HasTimemap()) this.CalculateTimemap();
    if (!this.HasTimemap()) LogWarning('Calculation of the timemap failed, MIDI cannot be exported.');

    let tempo = MIDI_TEMPO;
    const tempoEventTicks = new Set<number>();
    const score = this.GetFirstVisibleScore();
    if (!score) throw new Error('Doc::ExportMIDI requires a visible score.');
    const scoreDef = score.GetScoreDef?.() ?? null;
    if (!scoreDef) throw new Error('Doc::ExportMIDI requires a scoreDef.');
    const sd = scoreDef as ScoreDef & {
      HasMidiBpm?: () => boolean; GetMidiBpm?: () => number; HasMm?: () => boolean;
      GetMidiTuning?: () => string; GetCustomTuning?: () => CustomTuning;
      HasKeySigInfo?: () => boolean; GetKeySig?: () => any; HasMeterSigInfo?: () => boolean; GetMeterSig?: () => any;
      Process?: (functor: Functor) => void;
    };
    if (sd.HasMidiBpm?.()) {
      tempo = sd.GetMidiBpm?.() ?? tempo;
      tempoEventTicks.add(0); midiFile.addTempo(0,0,tempo);
    } else if (sd.HasMm?.()) {
      const calcTempo = (scoreDef as any).CalcTempo?.();
      if (typeof calcTempo === 'number') tempo = calcTempo;
      tempoEventTicks.add(0); midiFile.addTempo(0,0,tempo);
    }

    const tuningFile = this.m_options.m_midiTuningFile.getStrValue();
    if (tuningFile) {
      let tuningDef = tuningFile;
      if (tuningFile.toLowerCase().endsWith('.ascl')) throw new Error('Doc::ExportMIDI requires an ASCL file loader collaborator.');
      const tuning = new CustomTuning(tuningDef, this as any, false);
      if (tuning.IsValid()) (sd as any).SetCustomTuning?.(tuning);
      else LogWarning(`Error parsing tuning ${tuningDef}`);
    }

    const initMIDI = new InitMIDIFunctor();
    initMIDI.SetCurrentTempo(tempo);
    this.Process(initMIDI as unknown as Functor);

    const initProcessingLists = new InitProcessingListsFunctor();
    this.Process(initProcessingLists as unknown as Functor);
    const layerTree = initProcessingLists.GetLayerTree();

    let midiChannel = 0;
    let midiTrack = 1;
    for (const [staffN, staffTree] of layerTree.child) {
      let transSemi = 0;
      let instrDef: any = null;
      const staffDef = (scoreDef as any).GetStaffDef?.(staffN) ?? null;
      if (staffDef) {
        if (staffDef.HasTransSemi?.()) transSemi = staffDef.GetTransSemi();
        midiTrack = staffDef.GetN?.() ?? midiTrack;
        if (midiFile.getTrackCount() < midiTrack + 1) midiFile.addTracks(midiTrack + 1 - midiFile.getTrackCount());
        instrDef = staffDef.FindDescendantByType?.(ClassId.INSTRDEF) ?? null;
        if (!instrDef) instrDef = staffDef.GetFirstAncestor?.(ClassId.STAFFGRP)?.FindDescendantByType?.(ClassId.INSTRDEF, 1) ?? null;
        if (instrDef) {
          if (instrDef.HasMidiChannel?.()) midiChannel = instrDef.GetMidiChannel();
          if (instrDef.HasMidiTrack?.()) { midiTrack = instrDef.GetMidiTrack(); if (midiFile.getTrackCount() < midiTrack + 1) midiFile.addTracks(midiTrack + 1 - midiFile.getTrackCount()); if (midiTrack > 255) LogWarning(`A high MIDI track number was assigned to staff ${staffN}`); }
          if (instrDef.HasMidiInstrnum?.()) midiFile.addPatchChange(midiTrack,0,midiChannel,instrDef.GetMidiInstrnum());
        }
        let keySig = staffDef.FindDescendantByType?.(ClassId.KEYSIG) ?? null;
        if (!keySig && sd.HasKeySigInfo?.()) keySig = sd.GetKeySig?.();
        if (keySig?.HasSig?.()) midiFile.addKeySignature(midiTrack,0,keySig.GetFifthsInt(),keySig.GetMode?.() === 2);
        let label = staffDef.FindDescendantByType?.(ClassId.LABEL, 1) ?? null;
        if (!label) label = staffDef.GetFirstAncestor?.(ClassId.STAFFGRP)?.FindDescendantByType?.(ClassId.LABEL, 1) ?? null;
        if (label?.GetText) { const trackName = label.GetText(); if (trackName) midiFile.addTrackName(midiTrack,0,trackName); }
        let meterSig = staffDef.FindDescendantByType?.(ClassId.METERSIG) ?? null;
        if (!meterSig && sd.HasMeterSigInfo?.()) meterSig = sd.GetMeterSig?.();
        if (meterSig?.HasCount?.() && meterSig?.HasUnit?.()) midiFile.addTimeSignature(midiTrack,0,meterSig.GetTotalCount(),meterSig.GetUnit());
        else if (meterSig?.HasSym?.()) midiFile.addTimeSignature(midiTrack,0,meterSig.GetTotalCount(),meterSig.GetSymImplicitUnit());
      }

      const scoreDefGenerate = new GenerateMIDIFunctor(midiFile);
      scoreDefGenerate.SetChannel(midiChannel); scoreDefGenerate.SetTrack(midiTrack); scoreDefGenerate.SetInstrDef(instrDef);
      if (sd.Process) sd.Process(scoreDefGenerate as unknown as Functor);

      let controlEvents = true;
      for (const [layerN] of staffTree.child) {
        const filters = new Filters();
        filters.Add(new AttNIntegerComparison(ClassId.STAFF, staffN));
        filters.Add(new AttNIntegerComparison(ClassId.LAYER, layerN));
        const generate = new GenerateMIDIFunctor(midiFile);
        generate.SetFilters(filters as unknown as never);
        generate.SetChannel(midiChannel); generate.SetTrack(midiTrack); generate.SetStaffN(staffN); generate.SetLayerN(layerN);
        generate.SetTempoEventTicks(tempoEventTicks); generate.SetTransSemi(transSemi); generate.SetCurrentTempo(tempo);
        generate.SetOctaves(initMIDI.GetOctaves()); generate.SetNoCue(this.m_options.m_midiNoCue.getValue()); generate.SetControlEvents(controlEvents);
        generate.SetInstrDef(instrDef); generate.SetCustomTuning((sd as any).GetCustomTuning?.() ?? null);
        this.Process(generate as unknown as Functor);
        for (const tick of generate.GetTempoEventTicks()) tempoEventTicks.add(tick);
        controlEvents = false;
      }
    }
    midiFile.sortTracksNoteOffsBeforeOns();
  }
  public ExportTimemap(output: { value: string } | string, includeRests: boolean, includeMeasures: boolean, useFractions: boolean): boolean {
    if (!this.HasTimemap()) this.CalculateTimemap();
    if (!this.HasTimemap()) {
      this.setOutputString(output, '{}');
      return false;
    }
    const timemap: Timemap = this.createTimemap();
    const generate = new GenerateTimemapFunctor(timemap);
    (generate as any).SetNoCue?.(!!this.m_options.m_midiNoCue.getValue());
    this.Process(generate);
    timemap.ToJson(output, includeRests, includeMeasures, useFractions);
    return true;
  }
  private createTimemap(): Timemap {
    const factory = (this as unknown as { m_timemapFactory?: () => Timemap }).m_timemapFactory;
    if (factory) return factory();
    return new Timemap();
  }

  public ExportExpansionMap(output: { value: string } | string): boolean {
    const expansionMap = this.m_expansionMap as { HasExpansionMap?: () => boolean; ToJson?: (target: { value: string } | string) => void } | undefined;
    const hasMap = expansionMap?.HasExpansionMap?.() ?? false;
    if (!hasMap || !expansionMap?.ToJson) {
      if (typeof output === 'string') return false;
      output.value = '{}';
      return false;
    }
    expansionMap.ToJson(output);
    return true;
  }
  public ExportFeatures(output: { value: string } | string, options: string): boolean {
    if (!this.HasTimemap()) {
      this.CalculateTimemap();
    }
    if (!this.HasTimemap()) {
      this.setOutputString(output, '{}');
      return false;
    }
    const extractor = new FeatureExtractor(options);
    const generateFeatures: Functor = new GenerateFeaturesFunctor(extractor) as unknown as Functor;
    this.Process(generateFeatures);
    extractor.ToJson(this.asOutputRef(output));
    return true;
  }
  public GenerateDocumentScoreDef(): boolean {
    const measure = this.FindDescendantByType(ClassId.MEASURE) as VrvObject & {
      FindAllDescendantsByType: (classId: ClassId, continueDepthSearchForMatches?: boolean, deepness?: number) => VrvObject[];
      IsMeasuredMusic?: () => boolean;
    } | null;
    if (!measure) return false;

    const staves = measure.FindAllDescendantsByType(ClassId.STAFF, false);
    if (staves.length === 0) return false;

    const scoreDef = this.GetFirstScoreDef() as (ScoreDef & {
      Reset?: () => void;
      AddChild?: (child: VrvObject) => boolean;
    }) | null;
    if (!scoreDef?.Reset || !scoreDef.AddChild) throw new Error('Doc::GenerateDocumentScoreDef requires a mutable ScoreDef collaborator.');
    scoreDef.Reset();

    const staffGrp = new GeneratedStaffGrpNode();
    for (const object of staves) {
      const staff = object as VrvObject & { GetN?: () => number };
      const staffDef = new GeneratedStaffDefNode();
      staffDef.SetN(staff.GetN?.() ?? 0);
      staffDef.SetLines(5);
      if (measure.IsMeasuredMusic?.() === false) staffDef.SetNotationtype(NOTATIONTYPE_mensural);
      staffGrp.AddChild(staffDef);
    }
    scoreDef.AddChild(staffGrp);
    return true;
  }
  public GenerateFooter(): void {
    for (const score of this.GetVisibleScores()) {
      const scoreDef = score.GetScoreDef?.() as (ScoreDef & { FindDescendantByType?: (classId: ClassId) => VrvObject | null; AddChild?: (child: VrvObject) => boolean; }) | null;
      if (!scoreDef) throw new Error('Doc::GenerateFooter requires a score definition.');
      if (scoreDef.FindDescendantByType?.(ClassId.PGFOOT)) continue;

      const pgFoot = new PgFoot();
      pgFoot.SetFunc(PGFUNC_first);
      pgFoot.IsGeneratedSet(true);
      pgFoot.LoadFooter(this);
      pgFoot.SetType('autogenerated');
      if (!scoreDef.AddChild || !scoreDef.AddChild(pgFoot as unknown as VrvObject)) throw new Error('Doc::GenerateFooter failed to add first footer.');

      const pgFoot2 = new PgFoot();
      pgFoot2.SetFunc(PGFUNC_all);
      pgFoot2.IsGeneratedSet(true);
      pgFoot2.LoadFooter(this);
      pgFoot2.SetType('autogenerated');
      if (!scoreDef.AddChild(pgFoot2 as unknown as VrvObject)) throw new Error('Doc::GenerateFooter failed to add all footer.');
    }
  }
  public GenerateHeader(): void {
    for (const score of this.GetVisibleScores()) {
      const scoreDef = score.GetScoreDef?.() as (ScoreDef & { FindDescendantByType?: (classId: ClassId) => VrvObject | null; AddChild?: (child: VrvObject) => boolean; }) | null;
      if (!scoreDef) throw new Error('Doc::GenerateHeader requires a score definition.');
      if (scoreDef.FindDescendantByType?.(ClassId.PGHEAD)) continue;

      const pgHead = new PgHead();
      pgHead.SetFunc(PGFUNC_first);
      pgHead.IsGeneratedSet(true);
      pgHead.GenerateFromMEIHeader(this.m_header);
      pgHead.SetType('autogenerated');
      if (!scoreDef.AddChild || !scoreDef.AddChild(pgHead as unknown as VrvObject)) throw new Error('Doc::GenerateHeader failed to add first header.');

      const pgHead2 = new PgHead();
      pgHead2.SetFunc(PGFUNC_all);
      pgHead2.IsGeneratedSet(true);
      pgHead2.AddPageNum(HorizontalAlignment.center, VerticalAlignment.top);
      pgHead2.SetType('autogenerated');
      if (!scoreDef.AddChild(pgHead2 as unknown as VrvObject)) throw new Error('Doc::GenerateHeader failed to add all header.');
    }
  }
  public GenerateMeasureNumbers(): boolean {
    // C++ removes only previously generated mNum descendants, preserving authored mNum nodes.
    const measures = this.FindAllDescendantsByType(ClassId.MEASURE, false);
    for (const object of measures) {
      const measure = object as VrvObject & {
        HasN?: () => boolean;
        GetN?: () => string;
        DeleteChild?: (child: VrvObject) => boolean;
        AddChild?: (child: VrvObject) => boolean;
      };
      if (typeof measure.HasN !== 'function' || typeof measure.GetN !== 'function' ||
          typeof measure.DeleteChild !== 'function' || typeof measure.AddChild !== 'function') {
        throw new Error('Doc::GenerateMeasureNumbers requires a complete Measure collaborator.');
      }

      const mNums = measure.FindAllDescendantsByType(ClassId.MNUM);
      for (const child of mNums) {
        const generatedAccessor = (child as VrvObject & { IsGenerated?: (value?: boolean) => boolean }).IsGenerated;
        if (typeof generatedAccessor !== 'function') {
          throw new Error('Doc::GenerateMeasureNumbers requires MNum::IsGenerated().');
        }
        if (generatedAccessor.call(child)) {
          if (!measure.DeleteChild(child)) throw new Error('Doc::GenerateMeasureNumbers failed to delete generated MNum.');
        }
      }

      if (measure.HasN() && !measure.FindDescendantByType(ClassId.MNUM)) {
        const mNum = new MNum();
        const text = new Text();
        text.SetText(UTF8to32(measure.GetN()));
        mNum.SetType('autogenerated');
        mNum.AddChild(text);
        mNum.IsGenerated(true);
        if (!measure.AddChild(mNum)) throw new Error('Doc::GenerateMeasureNumbers failed to add generated MNum.');
      }
    }
    return true;
  }
  public ScoreDefSetCurrentDoc(force = false): void {
    if (this.m_currentScoreDefDone && !force) return;

    if (this.m_currentScoreDefDone) {
      const scoreDefUnsetCurrent = new ScoreDefUnsetCurrentFunctor();
      this.Process(scoreDefUnsetCurrent);
    }

    const scoreDefSetCurrentPage = new ScoreDefSetCurrentPageFunctor(this);
    this.Process(scoreDefSetCurrentPage, 3);

    const scoreDefSetCurrent = new ScoreDefSetCurrentFunctor(this);
    this.Process(scoreDefSetCurrent);

    if (scoreDefSetCurrent.HasOssia?.()) {
      const scoreDefSetOssia = new ScoreDefSetOssiaFunctor(this);
      this.Process(scoreDefSetOssia);
    }

    this.ScoreDefSetGrpSymDoc();
    this.m_currentScoreDefDone = true;
  }
  public ScoreDefOptimizeDoc(): void {
    const scoreDefOptimize = new ScoreDefOptimizeFunctor(this);
    this.Process(scoreDefOptimize);
    this.ScoreDefSetGrpSymDoc();
  }


  public ScoreDefSetGrpSymDoc(): void {
    const scoreDefSetGrpSym = new ScoreDefSetGrpSymFunctor();
    this.Process(scoreDefSetGrpSym);
  }
  public PrepareData(): void {
    let root: VrvObject = this;
    if (this.m_focusStatus !== FocusStatusType.FOCUS_UNSET) {
      this.m_focusStatus = FocusStatusType.FOCUS_USED;
      if (!this.m_focusRange) throw new Error('Doc::PrepareData requires a focus range.');
      root = this.m_focusRange as unknown as VrvObject;
    }

    if (this.m_dataPreparationDone) {
      this.ResetToLoading();
      root.Process(new ResetDataFunctor());
    }

    root.Process(new PrepareDataInitializationFunctor(this));
    this.PrepareMeasureIndices();
    this.CollectVisibleScores();

    root.Process(new PrepareDurationFunctor());

    const prepareTimeSpanning = new PrepareTimeSpanningFunctor();
    root.Process(prepareTimeSpanning);
    prepareTimeSpanning.SetDataCollectionCompleted?.();
    const interfaceOwnerPairs = prepareTimeSpanning.GetInterfaceOwnerPairs?.() ?? [];
    if (interfaceOwnerPairs.length > 0) root.Process(prepareTimeSpanning);
    for (const pair of interfaceOwnerPairs) {
      if (pair.iface.HasStartid() && pair.iface.HasEndid()) {
        LogWarning("Time spanning element '%s' with @xml:id '%s', @startid '%s', and @endid '%s' could not be matched.",
          pair.owner.GetClassName(), pair.owner.GetID(), pair.iface.GetStartid(), pair.iface.GetEndid());
      }
    }

    root.Process(new PrepareRehPositionFunctor());
    const prepareTimePointing = new PrepareTimePointingFunctor();
    prepareTimePointing.SetDirection?.(false);
    root.Process(prepareTimePointing);

    const prepareTimestamps = new PrepareTimestampsFunctor();
    root.Process(prepareTimestamps);
    const timestampPairs = prepareTimestamps.GetInterfaceIDPairs?.() ?? [];
    if (timestampPairs.length > 0) LogWarning('%d time spanning element(s) with timestamps could not be matched.', timestampPairs.length);

    const prepareLinking = new PrepareLinkingFunctor();
    root.Process(prepareLinking);
    prepareLinking.SetDataCollectionCompleted?.();
    const sameasPairs = prepareLinking.GetSameasIDPairs?.() ?? [];
    const stemSameasPairs = prepareLinking.GetStemSameasIDPairs?.() ?? [];
    if (sameasPairs.length > 0 || stemSameasPairs.length > 0) {
      prepareLinking.SetDirection?.(false);
      root.Process(prepareLinking);
    }
    const nextPairs = prepareLinking.GetNextIDPairs?.() ?? [];
    if (nextPairs.length > 0) LogWarning('%d element(s) with a @next could not match the target', nextPairs.length);
    if (sameasPairs.length > 0) LogWarning('%d element(s) with a @sameas could not match the target', sameasPairs.length);
    if (stemSameasPairs.length > 0) LogWarning('%d element(s) with a @stem.sameas could not match the target', stemSameasPairs.length);

    const preparePlist = new PreparePlistFunctor();
    root.Process(preparePlist);
    preparePlist.SetDataCollectionCompleted?.();
    const plistPairs = (preparePlist.GetInterfaceIDPairs?.() ?? []) as Array<{ object: { GetClassName(): string; GetID(): string }; id: string }>;
    if (plistPairs.length > 0) root.Process(preparePlist);
    for (const pair of plistPairs) {
      LogWarning("Element '%s' with @xml:id '%s' and a @plist could not match the target '%s'.", pair.object.GetClassName(), pair.object.GetID(), pair.id);
    }

    root.Process(new PrepareCrossStaffFunctor());
    root.Process(new PrepareBeamSpanElementsFunctor());
    root.Process(new PreparePedalsFunctor(this));

    const initProcessingLists = new InitProcessingListsFunctor();
    root.Process(initProcessingLists);
    const layerTree = initProcessingLists.GetLayerTree?.();
    const verseTree = initProcessingLists.GetVerseTree?.();
    if (!layerTree || !verseTree) throw new Error('Doc::PrepareData requires InitProcessingListsFunctor trees.');

    const filters = new Filters();
    const entries = (tree: IntTree) => this.intTreeEntries(tree);

    for (const [staffN, staves] of entries(layerTree)) {
      for (const [layerN] of entries(staves)) {
        filters.Clear();
        filters.Add(new AttNIntegerComparison(ClassId.STAFF, staffN));
        filters.Add(new AttNIntegerComparison(ClassId.LAYER, layerN));
        const preparePointers = new PreparePointersByLayerFunctor();
        preparePointers.SetFilters?.(filters);
        root.Process(preparePointers);
      }
    }

    const prepareDelayedTurns = new PrepareDelayedTurnsFunctor();
    root.Process(prepareDelayedTurns);
    prepareDelayedTurns.SetDataCollectionCompleted?.();
    if ((prepareDelayedTurns.GetDelayedTurns?.().length ?? 0) > 0) {
      for (const [staffN, staves] of entries(layerTree)) {
        for (const [layerN] of entries(staves)) {
          filters.Clear();
          filters.Add(new AttNIntegerComparison(ClassId.STAFF, staffN));
          filters.Add(new AttNIntegerComparison(ClassId.LAYER, layerN));
          prepareDelayedTurns.SetFilters?.(filters);
          prepareDelayedTurns.ResetCurrent?.();
          root.Process(prepareDelayedTurns);
        }
      }
    }

    for (const [staffN, staves] of entries(verseTree)) {
      for (const [layerN, layers] of entries(staves)) {
        for (const [verseN, verses] of entries(layers)) {
          for (const [voltaTrack] of entries(verses)) {
            filters.Clear();
            filters.Add(new AttNIntegerComparison(ClassId.STAFF, staffN));
            filters.Add(new AttNIntegerComparison(ClassId.LAYER, layerN));
            filters.Add(new LyricElementComparison(ClassId.VERSE, verseN));
            filters.Add(new LyricElementComparison(ClassId.REFRAIN, verseN));
            const prepareLyrics = new PrepareLyricsFunctor(voltaTrack);
            prepareLyrics.SetFilters?.(filters);
            root.Process(prepareLyrics);
          }
        }
      }
    }

    const prepareStaffCurrentTimeSpanning = new PrepareStaffCurrentTimeSpanningFunctor();
    root.Process(prepareStaffCurrentTimeSpanning);
    for (const obj of prepareStaffCurrentTimeSpanning.GetTimeSpanningElements?.() ?? []) {
      LogWarning("Time spanning element '%s' with @xml:id '%s' could not be set as running.", obj.GetClassName(), obj.GetID());
    }

    for (const [staffN, staves] of entries(layerTree)) {
      for (const [layerN] of entries(staves)) {
        filters.Clear();
        filters.Add(new AttNIntegerComparison(ClassId.STAFF, staffN));
        filters.Add(new AttNIntegerComparison(ClassId.LAYER, layerN));
        const prepareRpt = new PrepareRptFunctor(this);
        prepareRpt.SetFilters?.(filters);
        root.Process(prepareRpt);
      }
    }

    root.Process(new PrepareMilestonesFunctor());
    root.Process(new PrepareFloatingGrpsFunctor());
    root.Process(new PrepareCueSizeFunctor());
    root.Process(new PrepareAltSymFunctor());
    root.Process(new PrepareLayerElementPartsFunctor(this));

    if (this.IsFacs()) {
      const prepareFacsimile = new PrepareFacsimileFunctor(this.GetFacsimile() as never);
      root.Process(prepareFacsimile);
      for (const object of prepareFacsimile.GetZonelessSyls?.() ?? []) object.CreateDefaultZone?.(this);
    }

    for (const score of this.GetVisibleScores()) {
      const scoreDef = score.GetScoreDef?.() ?? null;
      if (!scoreDef) throw new Error('Doc::PrepareData requires visible scores to have ScoreDef.');
      const scoreDefSetGrpSym = new ScoreDefSetGrpSymFunctor();
      (scoreDef as unknown as VrvObject).Process(scoreDefSetGrpSym);
    }

    this.m_dataPreparationDone = true;
  }

  private intTreeEntries(tree: IntTree): [number, IntTree][] {
    const child = tree.child;
    // C++ IntTree.child is std::map<int, IntTree>: ascending numeric order, not insertion order.
    const list: [number, IntTree][] = child instanceof Map ? Array.from(child.entries())
      : Array.isArray(child) ? Array.from(child as Iterable<[number, IntTree]>)
      : Object.entries(child).map(([key, value]) => [Number(key), value as IntTree]);
    list.sort((a, b) => a[0] - b[0]);
    return list;
  }
  public CastOffDoc(): void { this.CastOffDocBase(false, false); }
  public CastOffSmartDoc(): void { this.CastOffDocBase(false, false, true); }
  public CastOffLineDoc(): void { this.CastOffDocBase(true, false); }
  public CastOffDocBase(useSb: boolean, usePb: boolean, smart = false): void {
    const pages = this.GetPages();
    if (!pages) throw new Error('Doc::CastOffDocBase requires pages.');
    if (this.IsCastOff()) return;

    const scores = this.GetVisibleScores() as Score[];
    if (scores.length === 0) throw new Error('Doc::CastOffDocBase requires visible scores.');

    if (this.m_focusStatus === FocusStatusType.FOCUS_USED) {
      this.m_focusStatus = FocusStatusType.FOCUS_UNSET;
      this.PrepareData();
    }
    this.ScoreDefSetCurrentDoc();

    const unCastOffPage = this.SetDrawingPage(0) as Page | null;
    if (!unCastOffPage) throw new Error('Doc::CastOffDocBase requires an initial page.');

    const firstMeasure = unCastOffPage.FindDescendantByType?.(ClassId.MEASURE) as Measure | null;
    if (!firstMeasure || !firstMeasure.HasCachedHorizontalLayout?.()) {
      unCastOffPage.LayOutHorizontally?.();
      unCastOffPage.LayOutHorizontallyWithCache?.();
    } else {
      unCastOffPage.LayOutHorizontallyWithCache?.(true);
    }

    const castOffSinglePage = new Page();
    let leftoverSystem: any = null;
    if (useSb && !usePb && !smart) {
      const castOffEncoding = new CastOffEncodingFunctor(this, castOffSinglePage, false, { createSystem: () => new System(), createPage: () => new Page() });
      unCastOffPage.Process?.(castOffEncoding);
    } else {
      const castOffSystems = new CastOffSystemsFunctor(castOffSinglePage, this, smart, () => new System());
      castOffSystems.SetSystemWidth(this.m_drawingPageContentWidth);
      unCastOffPage.Process?.(castOffSystems);
      leftoverSystem = castOffSystems.GetLeftoverSystem();
    }

    (pages as any).DetachChild(0);
    if (unCastOffPage.GetParent?.()) throw new Error('Doc::CastOffDocBase failed to detach the source page.');

    const alignMeasures = new AlignMeasuresFunctor(this);
    alignMeasures.StoreCastOffSystemWidths(true);
    castOffSinglePage.Process?.(alignMeasures);

    (pages as any).AddChild(castOffSinglePage);
    this.ResetDataPage();
    const rebuiltPage = this.SetDrawingPage(0);
    if (!rebuiltPage) throw new Error('Doc::CastOffDocBase failed to restore drawing page.');

    let optimize = false;
    const condense = this.m_options.m_condense.getValue();
    for (const score of scores) {
      if (score.ScoreDefNeedsOptimization?.(condense)) { optimize = true; break; }
    }

    this.ScoreDefSetCurrentDoc(true);
    if (optimize) this.ScoreDefOptimizeDoc();

    castOffSinglePage.ResetCachedDrawingX?.();
    castOffSinglePage.LayOutVertically?.();

    (pages as any).DetachChild(0);
    if (castOffSinglePage.GetParent?.()) throw new Error('Doc::CastOffDocBase failed to detach intermediate page.');
    this.ResetDataPage();

    for (const score of scores) score.CalcRunningElementHeight?.(this);

    const castOffFirstPage = new Page();
    const castOffPages = new CastOffPagesFunctor(castOffSinglePage, this, castOffFirstPage, () => new Page());
    castOffPages.SetPageHeight(this.m_drawingPageContentHeight);
    castOffPages.SetLeftoverSystem(leftoverSystem);

    (pages as any).AddChild(castOffFirstPage);
    castOffSinglePage.Process?.(castOffPages);

    this.ScoreDefSetCurrentDoc(true);
    if (optimize) this.ScoreDefOptimizeDoc();

    this.m_isCastOff = true;
  }
  public UnCastOffDoc(resetCache = true): void {
    if (!this.IsCastOff()) return;
    this.ResetFocus();
    const pages = this.GetPages();
    if (!pages) throw new Error('Doc::UnCastOffDoc requires pages.');

    const unCastOffPage = new Page();
    const unCastOff = new UnCastOffFunctor(unCastOffPage, () => new System());
    unCastOff.SetResetCache(resetCache);
    this.Process(unCastOff);

    (pages as any).ClearChildren?.();
    if (!(pages as any).ClearChildren) {
      while (((pages as any).GetChildren?.() ?? []).length > 0) (pages as any).DetachChild(0);
    }
    (pages as any).AddChild(unCastOffPage);

    // idx can remain 0 after replacement; the old content page is dead.
    this.ResetDataPage();
    this.ScoreDefSetCurrentDoc(true);
    this.m_isCastOff = false;
  }

  public CastOffEncodingDoc(): void {
    if (this.IsCastOff()) return;
    this.ScoreDefSetCurrentDoc();
    const pages = this.GetPages();
    if (!pages) throw new Error('Doc::CastOffEncodingDoc requires pages.');

    const unCastOffPage = this.SetDrawingPage(0) as Page | null;
    if (!unCastOffPage) throw new Error('Doc::CastOffEncodingDoc requires an initial page.');
    unCastOffPage.ResetAligners?.();

    const detached = (pages as any).DetachChild(0) as Page | null;
    if (!detached || (detached.GetParent?.() != null)) throw new Error('Doc::CastOffEncodingDoc failed to detach page.');

    const castOffFirstPage = new Page();
    (pages as any).AddChild(castOffFirstPage);

    const castOffEncoding = new CastOffEncodingFunctor(this, castOffFirstPage, true, { createSystem: () => new System(), createPage: () => new Page() });
    detached.Process?.(castOffEncoding);

    this.ResetDataPage();
    this.ScoreDefSetCurrentDoc(true);

    const condense = this.m_options.m_condense.getValue();
    for (const score of this.GetVisibleScores() as Score[]) {
      if (score.ScoreDefNeedsOptimization?.(condense)) {
        this.ScoreDefOptimizeDoc();
        break;
      }
    }
    this.m_isCastOff = true;
  }
  public ConvertToPageBasedDoc(): void {
    const pages = new Pages();
    const page = this.createPageForConversion();
    pages.AddChild(page as any);

    const convertToPageBased = new ConvertToPageBasedFunctor(page as any);
    convertToPageBased.SetSystemFactory(() => this.createSystemForConversion());
    this.Process(convertToPageBased);

    this.ClearRelinquishedChildren();
    if (this.GetChildren().length !== 0) throw new Error('Doc::ConvertToPageBasedDoc failed: document children were not relinquished.');

    this.AddChild(pages);
    this.ResetDataPage();
  }

  private createPageForConversion(): any {
    const factory = (this as any).m_conversionPageFactory;
    if (typeof factory === 'function') return factory();
    return new Page();
  }
  private createSystemForConversion(): any {
    const factory = (this as any).m_conversionSystemFactory;
    if (typeof factory === 'function') return factory();
    return new System();
  }
  public SetConversionFactories(pageFactory: () => any, systemFactory: () => any): void {
    (this as any).m_conversionPageFactory = pageFactory;
    (this as any).m_conversionSystemFactory = systemFactory;
  }

  public ConvertToCastOffMensuralDoc(castOff: MensuralCastOffType): void {
    if (!this.IsMensuralMusicOnly()) return;
    if (castOff !== MensuralCastOffType.MENSURAL_CAST_OFF_INIT && !this.m_mensuralCastOff) return;
    if (this.IsTranscription() || this.IsFacs()) return;

    this.m_mensuralCastOff = true;
    const convertToCastOff = castOff !== MensuralCastOffType.MENSURAL_CAST_OFF_UNSET;

    if (this.IsCastOff()) this.UnCastOffDoc();
    this.ScoreDefSetCurrentDoc();

    const contentPage = this.SetDrawingPage(0) as any;
    if (!contentPage) throw new Error('Doc::ConvertToCastOffMensuralDoc requires an initial page.');
    contentPage.LayOutHorizontally?.();

    const systems = (contentPage.FindAllDescendantsByType?.(ClassId.SYSTEM, false, 1) ?? []) as any[];
    for (const system of systems) {
      if (convertToCastOff) {
        const convertedSystem = new System();
        const functor = new ConvertToCastOffMensuralFunctor(this, convertedSystem);
        system.Process?.(functor);
        contentPage.ReplaceChild?.(system, convertedSystem);
      } else {
        system.ConvertToUnCastOffMensuralSystem?.();
      }
    }

    this.PrepareData();
    this.ResetDataPage();
    this.ScoreDefSetCurrentDoc(true);
  }

  public ConvertToCmnDoc(): void {
    if (!this.IsMensuralMusicOnly()) return;
    if (this.IsTranscription()) return;
    if (this.IsFacs()) return;

    // C++ stores BOOLEAN_false (2), not a JavaScript boolean. Preserve the canonical data value.
    this.m_isMensuralMusicOnly = 2;

    const previousEquivalence = this.m_options.m_durationEquivalence.getValue();
    this.m_options.m_durationEquivalence.setValue(OptionDurationEq.minima);

    try {
      if (this.IsCastOff()) this.UnCastOffDoc();
      this.ScoreDefSetCurrentDoc();
      this.CalculateTimemap();

      const contentPage = this.SetDrawingPage(0) as any;
      if (!contentPage) throw new Error('Doc::ConvertToCmnDoc requires an initial page.');
      contentPage.LayOutHorizontally?.();

      const systems = (contentPage.FindAllDescendantsByType?.(ClassId.SYSTEM, false, 1) ?? []) as any[];
      const scores = (contentPage.FindAllDescendantsByType?.(ClassId.SCORE, false, 1) ?? []) as any[];
      if (systems.length !== scores.length) throw new Error('Doc::ConvertToCmnDoc requires matching systems and scores.');

      for (let i = 0; i < systems.length; i++) {
        const system = systems[i];
        const score = scores[i];
        const convertedSystem = new System();
        const functor = new ConvertToCmnFunctor(this, convertedSystem, score);
        system.Process?.(functor);
        contentPage.ReplaceChild?.(system, convertedSystem);
      }

      this.GenerateMeasureNumbers();

      const condense = this.m_options.m_condense.getValue();
      for (const score of this.GetVisibleScores() as Score[]) {
        if (score.ScoreDefNeedsOptimization?.(condense)) {
          this.ScoreDefOptimizeDoc();
          break;
        }
      }

      this.PrepareData();
      this.ResetDataPage();
      this.ScoreDefSetCurrentDoc(true);
    } finally {
      this.m_options.m_durationEquivalence.setValue(previousEquivalence);
    }
  }

  public ConvertMarkupDoc(permanent = true): void {
    if (this.m_markup === MARKUP_DEFAULT) return;

    if (this.m_markup & 4) {
      // MARKUP_GRACE_ATTRIBUTE intentionally has no conversion block in C++ yet.
    }

    if (this.m_markup & 8) {
      const convertMarkupArtic = new ConvertMarkupArticFunctor();
      this.Process(convertMarkupArtic);
    }

    if ((this.m_markup & 2) || (this.m_markup & 1)) {
      const initProcessingLists = new InitProcessingListsFunctor();
      this.Process(initProcessingLists);
      const tree = initProcessingLists.GetLayerTree();
      // C++ IntTree.child is std::map<int, IntTree>: iterate staff/layer keys in
      // ascending numeric order, NOT document (insertion) order.
      const toEntries = (node: { child: unknown }): [number, IntTree][] => {
        const child = (node as { child: Map<number, IntTree> | IntTree[] | Record<string, IntTree> }).child;
        const list: [number, IntTree][] = child instanceof Map ? Array.from(child.entries())
          : Array.isArray(child) ? Array.from(child as Iterable<[number, IntTree]>)
          : Object.entries(child).map(([k, v]) => [Number(k), v as IntTree] as [number, IntTree]);
        list.sort((a, b) => a[0] - b[0]);
        return list;
      };
      const entries = toEntries(tree as unknown as { child: unknown });

      for (const [staffN, layersNode] of entries) {
        const layerEntries = toEntries(layersNode as unknown as { child: unknown });
        for (const [layerN] of layerEntries) {
          const filters = new Filters();
          filters.Clear();
          filters.Add(new AttNIntegerComparison(ClassId.STAFF, staffN) as unknown as never);
          filters.Add(new AttNIntegerComparison(ClassId.LAYER, layerN) as unknown as never);

          const analytical = new ConvertMarkupAnalyticalFunctor(permanent);
          analytical.SetFilters(filters);
          this.Process(analytical);
          for (const note of analytical.GetCurrentNotes()) {
            const id = note.GetID();
            if (id) LogWarning(`Unable to match @tie of note '${id}', skipping it`);
          }
        }
      }
    }

    if (this.m_markup & 16) {
      this.Process(new ConvertMarkupScoreDefFunctor(this));
    }
  }
  public ScoringUpDoc(): void {
    const scoringUp = new ScoringUpFunctor();
    this.Process(scoringUp);
  }
  public ConvertToMensuralViewDoc(): void {
    if (this.IsCastOff()) {
      return;
    }
    const functor = new ConvertToMensuralViewFunctor(this);
    this.Process(functor);
  }
  public ConvertMensuralToCmnDoc(): void {
    if (this.IsCastOff()) {
      return;
    }
    // Canonical C++ implementation currently has no operation beyond this guard.
  }
  public SyncFromFacsimileDoc(): void {
    const prepareFacsimile = new PrepareFacsimileFunctor(this.GetFacsimile() as never);
    this.Process(prepareFacsimile);

    const syncFromFacsimile = new SyncFromFacsimileFunctor(this as never);
    this.Process(syncFromFacsimile);
  }
  public SyncToFacsimileDoc(): void {
    let ppuFactor = 1.0;
    // Create a new facsimile object if we do not have one already.
    if (!this.HasFacsimile()) {
      const facsimile = new GeneratedFacsimileNode();
      this.SetFacsimile(facsimile);
      facsimile.SetType('transcription');
      // Match the C++ scale-to-PPU adjustment: scale is expressed as a percentage.
      ppuFactor = this.maybeOption('m_scale', 100) / 100.0;
    }

    this.ScoreDefSetCurrentDoc();

    const syncToFacsimile = new SyncToFacsimileFunctor(this as never, ppuFactor);
    this.Process(syncToFacsimile);
  }
  public TransposeDoc(): void {
    const transposer = new Transposer();
    transposer.SetBase600();

    const selectedOnly = this.maybeOptionBool('m_transposeSelectedOnly', false);

    if (this.m_options.m_transpose.isSet()) {
      if (this.m_options.m_transposeMdiv.isSet()) {
        console.warn(`\"${this.optionKey('m_transposeMdiv')}\" is ignored when \"${this.optionKey('m_transpose')}\" is set as well. Please use only one of the two options.`);
      }
      const transpose = new TransposeFunctor(this, transposer);
      transpose.SetVisibleOnly(selectedOnly);
      transpose.SetTransposition(this.m_options.m_transpose.getValue());
      this.Process(transpose as unknown as Functor);
    }
    else if (this.m_options.m_transposeMdiv.isSet()) {
      for (const id of this.m_options.m_transposeMdiv.getKeys()) {
        const transposeSelectedMdiv = new TransposeSelectedMdivFunctor(this, transposer);
        transposeSelectedMdiv.SetVisibleOnly(selectedOnly);
        transposeSelectedMdiv.SetSelectedMdivID(id);
        transposeSelectedMdiv.SetTransposition(this.m_options.m_transposeMdiv.getStrValueAt([id]));
        this.Process(transposeSelectedMdiv as unknown as Functor);
      }
    }

    if (this.m_options.m_transposeToSoundingPitch.getValue()) {
      const transposeToSoundingPitch = new TransposeToSoundingPitchFunctor(this, transposer);
      transposeToSoundingPitch.SetVisibleOnly(selectedOnly);
      this.Process(transposeToSoundingPitch as unknown as Functor);
    }
  }
  public ExpandExpansions(): void {
    // Passing this argument does not do anything.
    if (this.m_options.m_expandNever.getValue()) return;

    // Nothing to do in these cases - mark the map as processed.
    if (this.IsMensuralMusicOnly() || this.IsTranscription()) {
      this.m_expansionMap.SetProcessed(true);
      return;
    }

    // MIDI, timemap and expansionmap outputs always require expansion.
    const outputFormat = this.m_options.getOutputTo();
    const expandInputFormat = outputFormat === FileFormat.MIDI
      || outputFormat === FileFormat.TIMEMAP
      || outputFormat === FileFormat.EXPANSIONMAP;

    // Nothing to expand if the input format does not require it and expansion is not forced.
    if (!expandInputFormat && !this.m_options.m_expandAlways.getValue()) return;

    const expansionId = this.m_options.m_expand.getValue();
    const expandSelected = expansionId.length > 0;

    // Without an explicit --expand id, generate expansions for scores that do not already have one.
    if (!expandSelected) {
      const scores = this.FindAllDescendantsByType(ClassId.SCORE, true, undefined);
      for (const object of scores) {
        const score = object as unknown as Score;
        if (!score.FindDescendantByType?.(ClassId.EXPANSION)) {
          this.m_expansionMap.GenerateExpansionFor(score as unknown as Score);
        }
      }
    }

    let startExpansion: VrvObject | null = null;
    if (expandSelected) {
      startExpansion = this.FindDescendantByID(expansionId);
      if (startExpansion === null || startExpansion.GetClassId() !== ClassId.EXPANSION) {
        LogWarning(`Expansion ID '%s' not found. Nothing expanded.`, expansionId);
        return;
      }
    } else {
      startExpansion = this.FindDescendantByType(ClassId.EXPANSION);
      if (startExpansion === null) return;
    }

    const existingList: string[] = [];
    const deletionList: string[] = [];
    this.m_expansionMap.Expand(
      startExpansion as unknown as Expansion,
      existingList,
      startExpansion,
      deletionList,
      true,
    );
  }
  private maybeOptionBool(name: string, fallback: boolean): boolean {
    const option = (this.m_options as unknown as Record<string, { getValue?: () => unknown }>)[name];
    const value = option?.getValue?.();
    return typeof value === 'boolean' ? value : fallback;
  }
  private optionKey(name: string): string {
    const option = (this.m_options as unknown as Record<string, { getKey?: () => string }>)[name];
    return option?.getKey?.() ?? name;
  }
  private marginOption(kind: 'left'|'right'|'top'|'bottom', id: ClassId): number {
    // ponytail: keyed lookup replaced a per-call object literal + template key.
    // Upgrade path: precompute option refs if marginOption stays in flame.
    const LR = kind === 'left' ? MARGIN_LEFT_NAMES : kind === 'right' ? MARGIN_RIGHT_NAMES : null;
    if (LR !== null) return this.maybeOption((LR as Record<number, string>)[id as number] ?? (kind === 'left' ? 'm_defaultLeftMargin' : 'm_defaultRightMargin'), 0);
    if (kind === 'bottom') return this.maybeOption((MARGIN_BOTTOM_NAMES as Record<number, string>)[id as number] ?? 'm_defaultBottomMargin', 0);
    return this.maybeOption((MARGIN_TOP_NAMES as Record<number, string>)[id as number] ?? 'm_defaultTopMargin', 0);
  }
  public GetLeftMargin(idOrObject: ClassId | VrvObject): number {
    const obj: any = idOrObject;
    const id = typeof obj === 'number' ? obj : obj.GetClassId();
    // C++ has a BarLine-specific object overload that distinguishes left/right barlines.
    // Keep the specialization here rather than collapsing it to the ClassId overload.
    if (typeof obj !== 'number' && id === ClassId.BARLINE && typeof obj.GetPosition === 'function') {
      const position = obj.GetPosition();
      if (position === 1 || position === 'Left' || position === 'left') return this.maybeOption('m_leftMarginLeftBarLine', 0);
      if (position === 2 || position === 'Right' || position === 'right') return this.maybeOption('m_leftMarginRightBarLine', 0);
    }
    return this.marginOption('left', id);
  }
  public GetRightMargin(idOrObject: ClassId | VrvObject): number {
    const obj: any = idOrObject;
    const id = typeof obj === 'number' ? obj : obj.GetClassId();
    if (typeof obj !== 'number' && id === ClassId.BARLINE && typeof obj.GetPosition === 'function') {
      const position = obj.GetPosition();
      if (position === 1 || position === 'Left' || position === 'left') return this.maybeOption('m_rightMarginLeftBarLine', 0);
      if (position === 2 || position === 'Right' || position === 'right') return this.maybeOption('m_rightMarginRightBarLine', 0);
    }
    return this.marginOption('right', id);
  }
  public GetBottomMargin(id: ClassId): number { return this.marginOption('bottom',id); }
  public GetTopMargin(id: ClassId): number { return this.marginOption('top',id); }

  public GetStaffDistance(object: VrvObject, staffIndex: number, staffPosition: number): MeasurementSigned {
    const corresponding = this.GetCorrespondingScore(object);
    if (!corresponding) throw new Error('Doc::GetStaffDistance requires a corresponding score.');
    const scoreDef = corresponding.GetScoreDef?.();
    if (!scoreDef) throw new Error('Doc::GetStaffDistance requires a score definition.');

    const distance: MeasurementSigned = new MeasurementSigned();
    const copy = (source?: MeasurementSigned) => {
      if (!source) return;
      if (distance.CopyFrom) distance.CopyFrom(source);
      else distance.SetVu(source.GetVu());
    };
    const getStaffDef = () => (scoreDef as any).GetStaffDef?.(staffIndex) ?? null;

    if (staffPosition === 1 || staffPosition === 2) {
      const id = object.GetClassId();
      const objectIs = (classId: ClassId) => id === classId;
      if (objectIs(ClassId.DIR)) {
        if (scoreDef.HasDirDist?.()) copy(scoreDef.GetDirDist?.());
        const staffDef = getStaffDef();
        if (staffDef?.HasDirDist?.()) copy(staffDef.GetDirDist?.());
      } else if (objectIs(ClassId.DYNAM)) {
        const opt = this.getOption('m_dynamDist');
        distance.SetVu(opt?.getDefault ? opt.getDefault() : 1.0);
        if (scoreDef.HasDynamDist?.()) copy(scoreDef.GetDynamDist?.());
        const staffDef = getStaffDef();
        if (staffDef?.HasDynamDist?.()) copy(staffDef.GetDynamDist?.());
        if (opt?.isSet?.()) distance.SetVu(opt.getValue());
      } else if (objectIs(ClassId.HARM)) {
        const opt = this.getOption('m_harmDist');
        distance.SetVu(opt?.getDefault ? opt.getDefault() : 1.0);
        if (scoreDef.HasHarmDist?.()) copy(scoreDef.GetHarmDist?.());
        const staffDef = getStaffDef();
        if (staffDef?.HasHarmDist?.()) copy(staffDef.GetHarmDist?.());
        if (opt?.isSet?.()) distance.SetVu(opt.getValue());
      } else if (objectIs(ClassId.TEMPO)) {
        if (scoreDef.HasTempoDist?.()) copy(scoreDef.GetTempoDist?.());
        const staffDef = getStaffDef();
        if (staffDef?.HasTempoDist?.()) copy(staffDef.GetTempoDist?.());
      }
    }
    return distance;
  }

  public SetDrawingPage(pageIdx: number, withPageRange = false): Page | null {
    // C++: out-of-range is a non-error, while a valid page is an invariant.
    if (!this.HasPage(pageIdx)) return null;
    if (this.m_drawingPage) {
      const idx = (this.m_drawingPage as any).GetIdx?.();
      if (idx === pageIdx) return this.m_drawingPage;
    }
    const pages = this.GetPages();
    if (!pages) throw new Error('Doc::SetDrawingPage requires pages.');
    const page = (pages as any).GetChild?.(pageIdx) as Page | null;
    if (!page) throw new Error('Doc::SetDrawingPage failed to resolve requested page.');
    this.m_drawingPage = page;

    // Preserve the C++ lifecycle: ResetFocus() before recalculating drawing sizes.
    this.ResetFocus();
    this.UpdatePageDrawingSizes();
    if (withPageRange) {
      const pageRange = new PageRange(this as any) as unknown as PageRange;
      pageRange.SetAsFocus?.(page);
      pageRange.LayOutAll?.();
    }
    return page;
  }
  public UpdatePageDrawingSizes(): void {
    const page: any = this.m_drawingPage;
    if (!page) throw new Error('Doc::UpdatePageDrawingSizes requires a drawing page.');
    if (page.m_pageHeight !== undefined && page.m_pageHeight !== -1) {
      this.m_drawingPageHeight = page.m_pageHeight; this.m_drawingPageWidth = page.m_pageWidth;
      this.m_drawingPageMarginBottom = page.m_pageMarginBottom; this.m_drawingPageMarginLeft = page.m_pageMarginLeft;
      this.m_drawingPageMarginRight = page.m_pageMarginRight; this.m_drawingPageMarginTop = page.m_pageMarginTop;
    } else if (this.m_pageHeight !== -1) {
      this.m_drawingPageHeight = this.m_pageHeight; this.m_drawingPageWidth = this.m_pageWidth;
      this.m_drawingPageMarginBottom = this.m_pageMarginBottom; this.m_drawingPageMarginLeft = this.m_pageMarginLeft;
      this.m_drawingPageMarginRight = this.m_pageMarginRight; this.m_drawingPageMarginTop = this.m_pageMarginTop;
    } else {
      this.m_drawingPageHeight = this.maybeOption('m_pageHeight', 0); this.m_drawingPageWidth = this.maybeOption('m_pageWidth', 0);
      this.m_drawingPageMarginBottom = this.maybeOption('m_pageMarginBottom', 0); this.m_drawingPageMarginLeft = this.maybeOption('m_pageMarginLeft', 0);
      this.m_drawingPageMarginRight = this.maybeOption('m_pageMarginRight', 0); this.m_drawingPageMarginTop = this.maybeOption('m_pageMarginTop', 0);
      if (this.maybeOption('m_scaleToPageSize', 0)) { const scale=this.maybeOption('m_scale',100); this.m_drawingPageHeight=Math.trunc(this.m_drawingPageHeight*100/scale); this.m_drawingPageWidth=Math.trunc(this.m_drawingPageWidth*100/scale); }
    }
    if (this.maybeOption('m_landscape', 0)) { [this.m_drawingPageWidth,this.m_drawingPageHeight]=[this.m_drawingPageHeight,this.m_drawingPageWidth]; [this.m_drawingPageMarginLeft,this.m_drawingPageMarginRight]=[this.m_drawingPageMarginRight,this.m_drawingPageMarginLeft]; }
    this.m_drawingPageContentHeight=this.m_drawingPageHeight-this.m_drawingPageMarginTop-this.m_drawingPageMarginBottom;
    this.m_drawingPageContentWidth=this.m_drawingPageWidth-this.m_drawingPageMarginLeft-this.m_drawingPageMarginRight;
    this.m_drawingBeamMaxSlope=this.maybeOption('m_beamMaxSlope',0)/100;
    this.m_drawingBeamWidth=this.maybeOption('m_unit',0); this.m_drawingBeamWhiteWidth=this.m_drawingBeamWidth/2;
    this.m_drawingSmuflFontSize=this.CalcMusicFontSize(); this.m_drawingLyricFontSize=this.maybeOption('m_unit',0)*this.maybeOption('m_lyricSize',0);
    this.m_fingeringFontSize=this.m_drawingLyricFontSize*this.maybeOption('m_fingeringScale',0);
    const glyphSize=this.GetGlyphWidth(0xE0A2,100,false); this.m_drawingBrevisWidth=Math.trunc((glyphSize*0.8)/2);
  }
  public CheckPageSize(page: Page): boolean {
    if (!page || !this.m_drawingPage) throw new Error('Doc::CheckPageSize requires page and drawing page.');
    if (page === this.m_drawingPage) return true;
    const p:any=page, d:any=this.m_drawingPage; return p.m_pageHeight === -1 && d.m_pageHeight === -1;
  }
  public CalcMusicFontSize(): number { return this.maybeOption('m_unit',0)*8; }
  public GetAdjustedDrawingPageWidth(): number {
    const p:any=this.m_drawingPage; if (!p) throw new Error('Doc::GetAdjustedDrawingPageWidth requires a drawing page.');
    if (this.IsTranscription() || this.IsFacs()) return Math.trunc(p.m_pageWidth*p.GetPPUFactor()/10);
    let content=p.GetContentWidth(); if (this.maybeOption('m_scaleToPageSize',0)) content=Math.trunc(content*this.maybeOption('m_scale',100)/100);
    return Math.trunc((content+this.m_drawingPageMarginLeft+this.m_drawingPageMarginRight)/10);
  }
  public GetAdjustedDrawingPageHeight(): number {
    const p:any=this.m_drawingPage; if (!p) throw new Error('Doc::GetAdjustedDrawingPageHeight requires a drawing page.');
    if (this.IsTranscription() || this.IsFacs()) return Math.trunc(p.m_pageHeight*p.GetPPUFactor()/10);
    let content=p.GetContentHeight(); if (this.maybeOption('m_scaleToPageSize',0)) content=Math.trunc(content*this.maybeOption('m_scale',100)/100);
    return Math.trunc((content+this.m_drawingPageMarginTop+this.m_drawingPageMarginBottom)/10);
  }
  public InitSelectionDoc(selection: DocSelection, resetCache: boolean): void {
    if (!selection || !(selection as any).m_isPending) return;
    if (this.HasSelection()) this.ResetSelectionDoc(resetCache);

    (selection as any).Set(this);
    if (!this.HasSelection()) return;

    if (this.m_selectionPreceding || this.m_selectionFollowing) {
      throw new Error('Doc::InitSelectionDoc selection pages must be clear.');
    }

    if (this.IsCastOff()) this.UnCastOffDoc();

    const pages: any = this.GetPages();
    if (!pages) throw new Error('Doc::InitSelectionDoc requires Pages.');

    this.ScoreDefSetCurrentDoc();

    const unCastOffPage: any = this.SetDrawingPage(0);
    if (!unCastOffPage) throw new Error('Doc::InitSelectionDoc requires an initial page.');
    unCastOffPage.ResetAligners?.();

    pages.DetachChild(0);
    const selectionFirstPage: any = new Page();
    pages.AddChild(selectionFirstPage);

    const castOffToSelection = new CastOffToSelectionFunctor(selectionFirstPage, this, this.m_selectionStart, this.m_selectionEnd, { createSystem: () => new System(), createPage: () => new Page() });
    unCastOffPage.Process?.(castOffToSelection);

    this.ResetDataPage();
    this.ScoreDefSetCurrentDoc(true);

    const childCount = pages.GetChildCount?.() ?? ((pages.GetChildren?.() ?? []).length);
    if (childCount < 2) {
      this.m_selectionStart = '';
      this.m_selectionEnd = '';
      return;
    }
    if (childCount === 2) pages.AddChild(new Page());

    this.ReactivateSelection(true);
  }
  public ResetSelectionDoc(resetCache: boolean): void {
    if (!this.m_selectionPreceding || !this.m_selectionFollowing) {
      throw new Error('Doc::ResetSelectionDoc requires active selection pages.');
    }
    this.m_selectionStart = '';
    this.m_selectionEnd = '';

    if (this.IsCastOff()) this.UnCastOffDoc();

    this.DeactiveateSelection();

    this.m_isCastOff = true;
    this.UnCastOffDoc(resetCache);
  }
  public DeactiveateSelection(): void {
    const pages: any = this.GetPages();
    if (!pages) throw new Error('Doc::DeactiveateSelection requires Pages.');
    const selectionPage: any = pages.GetChild?.(0);
    if (!selectionPage) throw new Error('Doc::DeactiveateSelection requires selection page.');
    const selectionScore: any = selectionPage.FindDescendantByType?.(ClassId.SCORE);
    if (!selectionScore) throw new Error('Doc::DeactiveateSelection requires selection score.');
    if (selectionScore.GetLabel?.() !== '[selectionScore]') throw new Error('Deleting wrong score element. Something is wrong');
    selectionPage.DeleteChild?.(selectionScore);

    pages.InsertChild(this.m_selectionPreceding!, 0);
    pages.AddChild(this.m_selectionFollowing!);
    this.m_selectionPreceding = null;
    this.m_selectionFollowing = null;
  }
  public ReactivateSelection(resetAligners: boolean): void {
    const pages: any = this.GetPages();
    if (!pages) throw new Error('Doc::ReactivateSelection requires Pages.');
    const lastPage = (pages.GetChildCount?.() ?? (pages.GetChildren?.() ?? []).length) - 1;
    if (lastPage <= 1) throw new Error('Doc::ReactivateSelection requires surrounding pages.');

    const selectionPage: any = pages.GetChild?.(1);
    const system: any = selectionPage?.FindDescendantByType?.(ClassId.SYSTEM);
    if (!system) throw new Error('Doc::ReactivateSelection requires a selection system.');
    const selectionScore: any = new Score();
    const drawingScoreDef = system.GetDrawingScoreDef?.();
    selectionScore.GetScoreDef?.()?.ReplaceWithCopyOf?.(drawingScoreDef);
    selectionScore.SetLabel?.('[selectionScore]');
    selectionScore.GetScoreDef?.()?.ResetFromDrawingValues?.();
    selectionPage.InsertChild?.(selectionScore, 0);

    this.m_selectionPreceding = pages.GetChild?.(0) ?? null;
    if (resetAligners && (this.m_selectionPreceding as any)?.FindDescendantByType?.(ClassId.MEASURE)) {
      this.SetDrawingPage(0);
      (this.m_selectionPreceding as any).ResetAligners?.();
    }
    this.m_selectionFollowing = pages.GetChild?.(lastPage) ?? null;
    if (resetAligners && (this.m_selectionFollowing as any)?.FindDescendantByType?.(ClassId.MEASURE)) {
      this.SetDrawingPage(2);
      (this.m_selectionFollowing as any).ResetAligners?.();
    }
    pages.DetachChild(lastPage);
    pages.DetachChild(0);
    this.m_drawingPage = null;
  }

  private asOutputRef(output: { value: string } | string): { value: string } {
    if (typeof output === 'string') return { value: output };
    return output;
  }

  private setOutputString(output: { value: string } | string, value: string): void {
    if (typeof output !== 'string') output.value = value;
  }

  public Accept(functor: Functor): FunctorCode {
    const visitor = functor as Functor & { VisitDoc?: (doc: Doc) => FunctorCode };
    return visitor.VisitDoc ? visitor.VisitDoc(this) : visitor.VisitObject(this);
  }
  public AcceptEnd(functor: Functor): FunctorCode {
    const visitor = functor as Functor & { VisitDocEnd?: (doc: Doc) => FunctorCode };
    return visitor.VisitDocEnd ? visitor.VisitDocEnd(this) : visitor.VisitObjectEnd(this);
  }
  public AcceptConst(functor: ConstFunctor): FunctorCode {
    const visitor = functor as ConstFunctor & { VisitDoc?: (doc: Doc) => FunctorCode };
    return visitor.VisitDoc ? visitor.VisitDoc(this) : visitor.VisitObject(this);
  }
  public AcceptEndConst(functor: ConstFunctor): FunctorCode {
    const visitor = functor as ConstFunctor & { VisitDocEnd?: (doc: Doc) => FunctorCode };
    return visitor.VisitDocEnd ? visitor.VisitDocEnd(this) : visitor.VisitObjectEnd(this);
  }
}
