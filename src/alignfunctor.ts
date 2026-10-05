/**
 * Pure TypeScript translation of src/alignfunctor.cpp.
 *
 * The native/domain collaborators are deliberately structural (`any`) because
 * their concrete implementations are migrated independently. The visitor
 * control flow, state transitions, alignment type selection, and spacing math
 * mirror the C++ source.
 */
import { DocFunctor } from './functor.js';
import { ElementScoreDefRole, FunctorCode, ClassId, DURATION_4, DURATION_brevis, DURATION_semibrevis, DURATION_minima, STAFFREL_below } from './vrvdef.js';

const BOOLEAN_NONE = 0;
const BOOLEAN_true = 1;
const BOOLEAN_false = 2;
const NOTATIONTYPE_cmn = 1; // atttypes.h: NONE=0, cmn=1; shared with LayerElement.
const HORIZONTALALIGNMENT_center = 3;
const HORIZONTALALIGNMENT_right = 2;
const LYRIC_ELEMENT = ClassId.LYRIC_ELEMENT;
const LYRIC_ELEMENT_max = ClassId.LYRIC_ELEMENT_max;
const SYL = ClassId.SYL;
const TEXT_LAYOUT_ELEMENT = ClassId.TEXT_LAYOUT_ELEMENT;
const TEXT_LAYOUT_ELEMENT_max = ClassId.TEXT_LAYOUT_ELEMENT_max;
import { Fraction } from './fraction.js';

// C++ AlignmentType is intentionally numeric: several algorithms compare ranges.
export const ALIGNMENT_SCOREDEF_OSSIA_CLEF = -2;
export const ALIGNMENT_SCOREDEF_OSSIA_KEYSIG = -1;
export const ALIGNMENT_MEASURE_START = 0;
export const ALIGNMENT_SCOREDEF_CLEF = 1;
export const ALIGNMENT_SCOREDEF_KEYSIG = 2;
export const ALIGNMENT_SCOREDEF_MENSUR = 3;
export const ALIGNMENT_SCOREDEF_METERSIG = 4;
export const ALIGNMENT_MEASURE_LEFT_BARLINE = 5;
export const ALIGNMENT_FULLMEASURE = 6;
export const ALIGNMENT_FULLMEASURE2 = 7;
export const ALIGNMENT_CURSOR = 8;
export const ALIGNMENT_CURSOR_CHORD = 9;
export const ALIGNMENT_CLEF = 10;
export const ALIGNMENT_KEYSIG = 11;
export const ALIGNMENT_MENSUR = 12;
export const ALIGNMENT_METERSIG = 13;
export const ALIGNMENT_PROPORT = 14;
export const ALIGNMENT_DOT = 15;
export const ALIGNMENT_CUSTOS = 16;
export const ALIGNMENT_ACCID = 17;
export const ALIGNMENT_GRACENOTE = 18;
export const ALIGNMENT_BARLINE = 19;
export const ALIGNMENT_DIVLINE = 20;
export const ALIGNMENT_DEFAULT = 21;
export const ALIGNMENT_MEASURE_RIGHT_BARLINE = 22;
export const ALIGNMENT_SCOREDEF_CAUTION_CLEF = 23;
export const ALIGNMENT_SCOREDEF_CAUTION_KEYSIG = 24;
export const ALIGNMENT_SCOREDEF_CAUTION_MENSUR = 25;
export const ALIGNMENT_SCOREDEF_CAUTION_METERSIG = 26;
export const ALIGNMENT_MEASURE_END = 27;

export interface AlignMeterParamsLike { meterSig: any; mensur: any; proport: any; equivalence: number; metcon: boolean; }

const toFraction = (v: any): Fraction => (v instanceof Fraction ? v : new Fraction(v ?? 0));
const addFraction = (a: any, b: any): Fraction => toFraction(a).add(toFraction(b));
const eqFraction = (a: any, b: any): boolean => a instanceof Fraction && b instanceof Fraction ? a.equals(b) : a === b;
const assertInvariant = (v: any, msg: string): void => { if (!v) throw new Error(msg); };

export class AlignHorizontallyFunctor extends DocFunctor {
  private m_measureAligner: any = null;
  private m_time: Fraction = new Fraction(0);
  private m_currentParams: AlignMeterParamsLike = { meterSig: null, mensur: null, proport: null, equivalence: DURATION_brevis, metcon: true };
  private m_notationType = NOTATIONTYPE_cmn;
  private m_scoreDefRole: ElementScoreDefRole = ElementScoreDefRole.SCOREDEF_NONE;
  private m_isFirstMeasure = false;
  private m_hasMultipleLayer = false;
  private m_sectionRestart = false;

  public constructor(doc: any) {
    super(doc);
    const durationEq: Record<number, number> = {
      0: DURATION_brevis,
      1: DURATION_semibrevis,
      2: DURATION_minima,
    };
    this.m_currentParams.equivalence = durationEq[this.m_doc.GetOptions().m_durationEquivalence.GetValue()];
  }

  public ImplementsEndInterface(): boolean { return true; }

  public VisitLayer(layer: any): FunctorCode {
    const showHidden = this.m_doc.GetOptions().m_showHidden.GetValue();
    this.m_currentParams.mensur = layer.GetCurrentMensur();
    this.m_currentParams.meterSig = layer.GetCurrentMeterSig();
    this.m_currentParams.proport = layer.GetCurrentProport();
    this.m_time = new Fraction(-1);
    this.m_scoreDefRole = (this.m_isFirstMeasure || this.m_sectionRestart) ? ElementScoreDefRole.SCOREDEF_SYSTEM : ElementScoreDefRole.SCOREDEF_INTERMEDIATE;
    if (layer.DrawOssiaStaffDef() && this.m_scoreDefRole !== ElementScoreDefRole.SCOREDEF_SYSTEM) this.m_scoreDefRole = ElementScoreDefRole.SCOREDEF_OSSIA;
    const clef = layer.GetStaffDefClef();
    if (clef && (showHidden || clef.GetVisible() !== BOOLEAN_false)) this.VisitClef(clef);
    const keySig = layer.GetStaffDefKeySig();
    if (keySig && (showHidden || keySig.GetVisible() !== BOOLEAN_false)) this.VisitKeySig(keySig);
    const mensur = layer.GetStaffDefMensur();
    if (mensur) this.VisitMensur(mensur);
    const meterGrp = layer.GetStaffDefMeterSigGrp();
    if (meterGrp) { meterGrp.Process(this); this.ResetCode(); }
    else {
      const meter = layer.GetStaffDefMeterSig();
      if (meter && (showHidden || meter.GetVisible() !== BOOLEAN_false)) this.VisitMeterSig(meter);
    }
    this.m_scoreDefRole = ElementScoreDefRole.SCOREDEF_NONE;
    this.m_time = new Fraction(0);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerEnd(layer: any): FunctorCode {
    if (layer.HasCursor()) {
      const cursor = layer.GetCursor();
      let position: Fraction = new Fraction(0);
      if (cursor.HasPosition()) {
        const positionElement = cursor.GetPosition();
        if (positionElement.GetAlignment()) position = positionElement.GetAlignment().GetTime();
        position = addFraction(position, positionElement.GetAlignmentDuration(this.m_currentParams, true, this.m_notationType));
      }
      const type = cursor.IsChordEditMode() ? ALIGNMENT_CURSOR_CHORD : ALIGNMENT_CURSOR;
      const alignment = this.m_measureAligner.GetAlignmentAtTime(position, type);
      cursor.SetCursorAlignment(alignment);
      alignment.AddLayerElementRef(cursor);
    }
    this.m_scoreDefRole = ElementScoreDefRole.SCOREDEF_CAUTIONARY;
    this.m_time = this.m_measureAligner.GetMaxTime();
    const cautionClef = layer.GetCautionStaffDefClef(); if (cautionClef) this.VisitClef(cautionClef);
    const cautionKeySig = layer.GetCautionStaffDefKeySig(); if (cautionKeySig) this.VisitKeySig(cautionKeySig);
    const cautionMensur = layer.GetCautionStaffDefMensur(); if (cautionMensur) this.VisitMensur(cautionMensur);
    const cautionMeter = layer.GetCautionStaffDefMeterSig(); if (cautionMeter) this.VisitMeterSig(cautionMeter);
    this.m_scoreDefRole = ElementScoreDefRole.SCOREDEF_NONE;
    const staff = layer.GetFirstAncestor(ClassId.STAFF);
    assertInvariant(staff, 'AlignHorizontallyFunctor::VisitLayerEnd requires an ancestor Staff');
    const graceAlignerId = this.m_doc.GetOptions().m_graceRhythmAlign.GetValue() ? 0 : staff.GetN();
    for (let i = 0; i < this.m_measureAligner.GetChildCount(); ++i) {
      const alignment = this.m_measureAligner.GetChild(i);
      assertInvariant(alignment, 'Expected Alignment child');
      if (alignment.HasGraceAligner(graceAlignerId)) alignment.GetGraceAligner(graceAlignerId).AlignStack();
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: any): FunctorCode {
    // C++ assert(!GetAlignment()) is release-disabled; expanded clones arrive pre-aligned. Match WASM: skip.
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;
    layerElement.SetScoreDefRole(this.m_scoreDefRole);
    let type = ALIGNMENT_DEFAULT;
    const chordParent = layerElement.GetFirstAncestor(ClassId.CHORD, 100);
    const ligatureParent = layerElement.GetFirstAncestor(ClassId.LIGATURE, 100);
    const noteParent = layerElement.GetFirstAncestor(ClassId.NOTE, 100);
    const restParent = layerElement.GetFirstAncestor(ClassId.REST, 100);
    const spaceParent = layerElement.GetFirstAncestor(ClassId.SPACE, 1);
    const tabGrpParent = layerElement.GetFirstAncestor(ClassId.TABGRP, 100);
    const ligatureAsBracket = this.m_doc.GetOptions().m_ligatureAsBracket.GetValue();
    const neumeAsNote = this.m_doc.GetOptions().m_neumeAsNote.GetValue();

    if (chordParent) layerElement.SetAlignment(chordParent.GetAlignment());
    else if (noteParent) layerElement.SetAlignment(noteParent.GetAlignment());
    else if (restParent) layerElement.SetAlignment(restParent.GetAlignment());
    else if (spaceParent) layerElement.SetAlignment(spaceParent.GetAlignment());
    else if (tabGrpParent) layerElement.SetAlignment(tabGrpParent.GetAlignment());
    else if (layerElement.IsAnyOf([ClassId.DOTS, ClassId.FLAG, ClassId.STEM])) throw new Error('Unexpected standalone DOTS/FLAG/STEM');
    else if (ligatureParent && layerElement.Is(ClassId.NOTE) && !ligatureAsBracket) {
      const firstNote = ligatureParent.GetListFront();
      if (firstNote && firstNote !== layerElement) {
        const alignment = firstNote.GetAlignment();
        layerElement.SetAlignment(alignment);
        alignment.AddLayerElementRef(layerElement);
        const duration = layerElement.GetAlignmentDuration(this.m_currentParams, true, this.m_notationType);
        this.m_time = addFraction(this.m_time, duration);
        return FunctorCode.FUNCTOR_CONTINUE;
      }
    }
    else if (layerElement.Is(ClassId.LIGATURE)) {
      // Keep default alignment for mensural cast-off.
    }
    else if (layerElement.IsAnyOf([ClassId.BEAM, ClassId.FTREM, ClassId.TUPLET])) {
      const duration = layerElement.GetSameAsContentAlignmentDuration(this.m_currentParams, true, this.m_notationType);
      this.m_time = addFraction(this.m_time, duration);
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    else if (layerElement.Is(ClassId.BARLINE)) type = ALIGNMENT_BARLINE;
    else if (layerElement.Is(ClassId.CLEF)) {
      if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_SYSTEM || this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_INTERMEDIATE) type = ALIGNMENT_SCOREDEF_CLEF;
      else if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_CAUTIONARY) type = ALIGNMENT_SCOREDEF_CAUTION_CLEF;
      else if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_OSSIA) type = ALIGNMENT_SCOREDEF_OSSIA_CLEF;
      else type = ALIGNMENT_CLEF;
    }
    else if (layerElement.Is(ClassId.KEYSIG)) {
      if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_SYSTEM || this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_INTERMEDIATE) type = ALIGNMENT_SCOREDEF_KEYSIG;
      else if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_CAUTIONARY) type = ALIGNMENT_SCOREDEF_CAUTION_KEYSIG;
      else if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_OSSIA) type = ALIGNMENT_SCOREDEF_OSSIA_KEYSIG;
      else type = ALIGNMENT_KEYSIG;
    }
    else if (layerElement.Is(ClassId.MENSUR)) {
      if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_SYSTEM || this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_INTERMEDIATE) type = ALIGNMENT_SCOREDEF_MENSUR;
      else if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_CAUTIONARY) type = ALIGNMENT_SCOREDEF_CAUTION_MENSUR;
      else { this.m_currentParams.mensur = layerElement; type = ALIGNMENT_MENSUR; }
    }
    else if (layerElement.Is(ClassId.METERSIG)) {
      if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_SYSTEM || this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_INTERMEDIATE) type = ALIGNMENT_SCOREDEF_METERSIG;
      else if (this.m_scoreDefRole === ElementScoreDefRole.SCOREDEF_CAUTIONARY) type = ALIGNMENT_SCOREDEF_CAUTION_METERSIG;
      else if (layerElement.GetParent() && layerElement.GetParent().Is(ClassId.METERSIGGRP)) type = ALIGNMENT_SCOREDEF_METERSIG;
      else { this.m_currentParams.meterSig = layerElement; type = ALIGNMENT_SCOREDEF_METERSIG; }
    }
    else if (layerElement.Is(ClassId.PROPORT)) {
      if (layerElement.GetType() === 'cmme_tempo_change') return FunctorCode.FUNCTOR_SIBLINGS;
      const previous = this.m_currentParams.proport ?? null;
      this.m_currentParams.proport = layerElement;
      if (previous) this.m_currentParams.proport.Cumulate(previous);
      type = ALIGNMENT_PROPORT;
    }
    else if (layerElement.IsAnyOf([ClassId.MULTIREST, ClassId.MREST, ClassId.MRPT])) type = ALIGNMENT_FULLMEASURE;
    else if (layerElement.IsAnyOf([ClassId.MRPT2, ClassId.MULTIRPT])) type = ALIGNMENT_FULLMEASURE2;
    else if (layerElement.Is(ClassId.DOT)) {
      const dot = layerElement;
      if (dot.m_drawingPreviousElement) layerElement.SetAlignment(dot.m_drawingPreviousElement.GetAlignment());
      else type = ALIGNMENT_DOT;
    }
    else if (layerElement.Is(ClassId.CUSTOS)) type = ALIGNMENT_CUSTOS;
    else if (layerElement.Is(ClassId.ACCID)) type = ALIGNMENT_ACCID;
    else if (layerElement.Is(ClassId.ARTIC)) {
      const note = layerElement.GetFirstAncestor(ClassId.NOTE);
      assertInvariant(note, 'Artic requires Note ancestor');
      layerElement.SetAlignment(note.GetAlignment());
    }
    else if (layerElement.Is(ClassId.SYL)) {
      const note = layerElement.GetFirstAncestor(ClassId.NOTE);
      if (note) layerElement.SetAlignment(note.GetAlignment());
      else { const syllable = layerElement.GetFirstAncestor(ClassId.SYLLABLE); if (syllable) layerElement.SetAlignment(syllable.GetAlignment()); }
    }
    else if (layerElement.IsAnyOf([ClassId.REFRAIN, ClassId.VOLTA, ClassId.VERSE])) {
      let parent = layerElement.GetFirstAncestor(ClassId.NOTE) ?? layerElement.GetFirstAncestor(ClassId.CHORD);
      assertInvariant(parent, 'Ref/Volta/Verse require Note or Chord ancestor');
      layerElement.SetAlignment(parent.GetAlignment());
    }
    else if (layerElement.Is(ClassId.NC)) {
      if (!neumeAsNote) { const neume = layerElement.GetFirstAncestor(ClassId.NEUME); assertInvariant(neume, 'Nc requires Neume ancestor'); layerElement.SetAlignment(neume.GetAlignment()); }
    }
    else if (layerElement.Is(ClassId.NEUME)) {
      if (neumeAsNote) { const syllable = layerElement.GetFirstAncestor(ClassId.SYLLABLE); assertInvariant(syllable, 'Neume-as-note requires Syllable ancestor'); layerElement.SetAlignment(syllable.GetAlignment()); return FunctorCode.FUNCTOR_CONTINUE; }
    }
    else if (layerElement.Is(ClassId.GRACEGRP)) return FunctorCode.FUNCTOR_CONTINUE;
    else if (layerElement.IsGraceNote()) type = ALIGNMENT_GRACENOTE;

    let duration: any = 0;
    if (!layerElement.GetAlignment()) {
      duration = layerElement.GetAlignmentDuration(this.m_currentParams, true, this.m_notationType);
      if (layerElement.Is(ClassId.TIMESTAMP_ATTR)) {
        this.m_time = duration;
        if (eqFraction(this.m_time, this.m_measureAligner.GetRightAlignment().GetTime())) type = ALIGNMENT_MEASURE_RIGHT_BARLINE;
      } else this.m_measureAligner.SetMaxTime(addFraction(this.m_time, duration));
      layerElement.SetAlignment(this.m_measureAligner.GetAlignmentAtTime(this.m_time, type));
      assertInvariant(layerElement.GetAlignment(), 'Expected Alignment after GetAlignmentAtTime');
    }
    const alignment = layerElement.GetAlignment();
    if (alignment.GetType() !== ALIGNMENT_GRACENOTE) {
      if (alignment.AddLayerElementRef(layerElement)) this.m_hasMultipleLayer = true;
    } else if (layerElement.Is(ClassId.CHORD) || (layerElement.Is(ClassId.NOTE) && !chordParent)) {
      const staff = layerElement.GetAncestorStaff();
      const graceAlignerId = this.m_doc.GetOptions().m_graceRhythmAlign.GetValue() ? 0 : staff.GetN();
      alignment.GetGraceAligner(graceAlignerId).StackGraceElement(layerElement);
    }
    if (!layerElement.Is(ClassId.TIMESTAMP_ATTR)) this.m_time = addFraction(this.m_time, duration);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    const measureAligner = measure.m_measureAligner;
    measureAligner.Reset();
    this.m_measureAligner = measureAligner;
    this.m_hasMultipleLayer = false;
    this.m_currentParams.metcon = measure.GetMetcon() !== BOOLEAN_false;
    if (measure.GetLeftBarLine().SetAlignment(measureAligner.GetLeftBarLineAlignment())) this.m_hasMultipleLayer = true;
    if (measure.GetRightBarLine().SetAlignment(measureAligner.GetRightBarLineAlignment())) this.m_hasMultipleLayer = true;
    assertInvariant(this.m_measureAligner, 'MeasureAligner not initialized');
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: any): FunctorCode {
    const meterUnit = this.m_currentParams.meterSig?.HasUnit() ? this.m_currentParams.meterSig.GetUnitAsDur() : DURATION_4;
    measure.m_measureAligner.SetInitialTstamp(meterUnit);
    measure.m_timestampAligner.Process(this);
    this.m_isFirstMeasure = false;
    this.m_sectionRestart = false;
    if (this.m_hasMultipleLayer) measure.SetHasAlignmentRefWithMultipleLayers(true);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
  public VisitMeterSigGrp(meterSigGrp: any): FunctorCode { return meterSigGrp.IsScoreDefElement() ? FunctorCode.FUNCTOR_STOP : FunctorCode.FUNCTOR_CONTINUE; }
  public VisitOssia(ossia: any): FunctorCode { const measure = ossia.GetParent(); if (measure) { ossia.GetDrawingLeftBarLine().SetParent(measure); ossia.GetDrawingLeftBarLine().SetAlignment(measure.GetLeftBarLine().GetAlignment()); } return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSection(section: any): FunctorCode { if (section.GetRestart() === BOOLEAN_true) this.m_sectionRestart = true; return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitStaff(staff: any): FunctorCode { if (staff.IsHidden()) return FunctorCode.FUNCTOR_CONTINUE; const drawingStaffDef = staff.m_drawingStaffDef; assertInvariant(drawingStaffDef, 'Staff requires drawing StaffDef'); this.m_notationType = drawingStaffDef.HasNotationtype() ? drawingStaffDef.GetNotationtype() : NOTATIONTYPE_cmn; const parentMeasure = staff.GetFirstAncestor(ClassId.MEASURE); if (parentMeasure) drawingStaffDef.AlternateCurrentMeterSig(parentMeasure); return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSystem(_system: any): FunctorCode { this.m_isFirstMeasure = true; return FunctorCode.FUNCTOR_CONTINUE; }
}

export class AlignMeasuresFunctor extends DocFunctor {
  private m_shift = 0;
  private m_justifiableWidth = 0;
  private m_applySectionRestartShift = false;
  private m_storeCastOffSystemWidths = false;
  public ImplementsEndInterface(): boolean { return true; }
  public StoreCastOffSystemWidths(storeWidths: boolean): void { this.m_storeCastOffSystemWidths = storeWidths; }
  public VisitDiv(div: any): FunctorCode { if (div.GetDrawingInline()) div.SetDrawingXRel(this.m_shift); this.m_shift += div.GetContentWidth(); return FunctorCode.FUNCTOR_SIBLINGS; }
  public VisitMeasure(measure: any): FunctorCode { if (this.m_applySectionRestartShift) { this.m_shift += measure.GetSectionRestartShift(this.m_doc); this.m_applySectionRestartShift = false; } measure.SetDrawingXRel(this.m_shift); this.m_shift += measure.GetWidth(); this.m_justifiableWidth += measure.GetRightBarLineXRel() - measure.GetLeftBarLineXRel(); return FunctorCode.FUNCTOR_SIBLINGS; }
  public VisitScoreDef(scoreDef: any): FunctorCode { this.m_shift += scoreDef.GetDrawingLabelsWidth(); if (this.m_applySectionRestartShift) { const hasLabel = scoreDef.FindDescendantByComparison({ Compare: (o: any) => o.Is(ClassId.LABEL) || o.Is(ClassId.LABELABBR) }); if (hasLabel) this.m_applySectionRestartShift = false; } return FunctorCode.FUNCTOR_SIBLINGS; }
  public VisitSection(section: any): FunctorCode { if (section.GetRestart() === BOOLEAN_true) this.m_applySectionRestartShift = true; return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSystem(system: any): FunctorCode { system.SetDrawingXRel(system.m_systemLeftMar + system.GetDrawingLabelsWidth()); this.m_shift = 0; this.m_justifiableWidth = 0; return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSystemEnd(system: any): FunctorCode { if (this.m_storeCastOffSystemWidths) { system.m_castOffTotalWidth = this.m_shift + system.GetDrawingLabelsWidth(); system.m_castOffJustifiableWidth = this.m_justifiableWidth; } else { system.m_drawingTotalWidth = this.m_shift + system.GetDrawingLabelsWidth(); system.m_drawingJustifiableWidth = this.m_justifiableWidth; } return FunctorCode.FUNCTOR_CONTINUE; }
}

export class AlignVerticallyFunctor extends DocFunctor {
  private m_systemAligner: any = null;
  private m_staffIdx = 0;
  private m_staffN = 0;
  private m_cumulatedShift = 0;
  private m_justificationSum = 0;
  private m_pageWidth = 0;
  public ImplementsEndInterface(): boolean { return true; }
  public VisitDiv(div: any): FunctorCode { this.m_systemAligner.GetBottomAlignment().SetYRel(-div.GetTotalHeight(this.m_doc)); this.m_pageWidth = div.GetTotalWidth(this.m_doc); return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitFig(fig: any): FunctorCode { const svg = fig.FindDescendantByType(ClassId.SVG); const width = svg ? svg.GetWidth() : 0; if (fig.GetHalign() === HORIZONTALALIGNMENT_right) fig.SetDrawingXRel(this.m_pageWidth - width); else if (fig.GetHalign() === HORIZONTALALIGNMENT_center) fig.SetDrawingXRel((this.m_pageWidth - width) / 2); return FunctorCode.FUNCTOR_SIBLINGS; }
  public VisitMeasure(_measure: any): FunctorCode { this.m_staffIdx = 0; return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitPageEnd(page: any): FunctorCode { this.m_cumulatedShift = 0; const header = page.GetHeader(); if (header) { header.SetDrawingPage(page); header.SetDrawingYRel(0); header.Process(this); } const footer = page.GetFooter(); if (footer) { footer.SetDrawingPage(page); footer.SetDrawingYRel(0); footer.Process(this); } return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitRend(rend: any): FunctorCode { if (!rend.GetFirstAncestorInRange(ClassId.TEXT_LAYOUT_ELEMENT, TEXT_LAYOUT_ELEMENT_max) && !rend.GetFirstAncestorInRange(TEXT_LAYOUT_ELEMENT, TEXT_LAYOUT_ELEMENT_max)) return FunctorCode.FUNCTOR_SIBLINGS; if (rend.GetHalign()) { switch (rend.GetHalign()) { case HORIZONTALALIGNMENT_right: rend.SetDrawingXRel(this.m_pageWidth); break; case HORIZONTALALIGNMENT_center: rend.SetDrawingXRel(this.m_pageWidth / 2); break; default: break; } } return FunctorCode.FUNCTOR_SIBLINGS; }
  public VisitRunningElement(runningElement: any): FunctorCode { this.VisitTextLayoutElement(runningElement); this.m_pageWidth = runningElement.GetTotalWidth(this.m_doc); return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitStaff(staff: any): FunctorCode { if (!staff.DrawingIsVisible()) return FunctorCode.FUNCTOR_SIBLINGS; this.m_staffN = staff.GetN(); const alignment = this.m_systemAligner.GetStaffAlignment(this.m_staffIdx, staff, this.m_doc); assertInvariant(alignment, 'StaffAlignment missing'); staff.SetAlignment(alignment); const timeSpanning = staff.m_timeSpanningElements ?? []; const lyric = timeSpanning.find((o: any) => o.IsLyricElement?.()); if (lyric) alignment.AddLyricElement(lyric); const syl = timeSpanning.find((o: any) => o.Is?.(SYL)); if (syl) { const lyricElement = syl.GetFirstAncestorInRange?.(LYRIC_ELEMENT, LYRIC_ELEMENT_max); if (lyricElement) alignment.AddLyricElement(lyricElement); } ++this.m_staffIdx; return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitStaffAlignmentEnd(staffAlignment: any): FunctorCode { this.m_cumulatedShift += staffAlignment.GetMinimumSpacing(this.m_doc); staffAlignment.SetYRel(-this.m_cumulatedShift); this.m_cumulatedShift += staffAlignment.GetStaffHeight(); ++this.m_staffIdx; return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSyllable(syllable: any): FunctorCode { if (!syllable.FindDescendantByType(SYL)) return FunctorCode.FUNCTOR_CONTINUE; const alignment = this.m_systemAligner.GetStaffAlignmentForStaffN(this.m_staffN); if (!alignment) return FunctorCode.FUNCTOR_CONTINUE; alignment.AddVerseN(1, STAFFREL_below); return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSystem(system: any): FunctorCode { this.m_systemAligner = system.m_systemAligner; return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSystemEnd(system: any): FunctorCode { this.m_cumulatedShift = 0; this.m_staffIdx = 0; if (system.GetDrawingScoreDef()) this.m_systemAligner.ReorderBy(system.GetDrawingScoreDef().GetStaffNs()); this.m_systemAligner.Process(this); return FunctorCode.FUNCTOR_SIBLINGS; }
  public VisitVerse(verse: any): FunctorCode { const alignment = this.m_systemAligner.GetStaffAlignmentForStaffN(this.m_staffN); if (alignment) alignment.AddLyricElement(verse); return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitRefrain(refrain: any): FunctorCode { const alignment = this.m_systemAligner.GetStaffAlignmentForStaffN(this.m_staffN); if (alignment) alignment.AddLyricElement(refrain); return FunctorCode.FUNCTOR_CONTINUE; }
}

export class AlignSystemsFunctor extends DocFunctor {
  private m_shift = 0;
  private m_systemSpacing = 0;
  private m_prevBottomOverflow = 0;
  private m_prevBottomClefOverflow = 0;
  private m_justificationSum = 0;
  public ImplementsEndInterface(): boolean { return true; }
  public SetShift(shift: number): void { this.m_shift = shift; }
  public SetSystemSpacing(spacing: number): void { this.m_systemSpacing = spacing; }
  public VisitPage(page: any): FunctorCode { this.m_justificationSum = 0; const header = page.GetHeader(); if (header) { header.SetDrawingYRel(this.m_shift); const headerHeight = header.GetTotalHeight(this.m_doc); if (headerHeight > 0) this.m_shift -= headerHeight; } return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitPageEnd(page: any): FunctorCode { page.m_drawingJustifiableHeight = this.m_shift; page.m_justificationSum = this.m_justificationSum; const footer = page.GetFooter(); if (footer) { page.m_drawingJustifiableHeight -= footer.GetTotalHeight(this.m_doc); if (this.m_doc.GetOptions().m_adjustPageHeight.GetValue()) { if (page.GetChildCount()) { const last = page.GetLast(ClassId.SYSTEM); assertInvariant(last, 'Expected last System'); const unit = this.m_doc.GetDrawingUnit(100); const topMargin = this.m_doc.GetOptions().m_topMarginPgFooter.GetValue() * unit; footer.SetDrawingYRel(last.GetDrawingYRel() - last.GetHeight() - topMargin); } } else footer.SetDrawingYRel(footer.GetContentHeight()); } return FunctorCode.FUNCTOR_CONTINUE; }
  public VisitSystem(system: any): FunctorCode { const systemAligner = system.m_systemAligner; assertInvariant(systemAligner.GetBottomAlignment(), 'SystemAligner bottom alignment missing'); if (!system.IsFirstInPage()) { const unit = this.m_doc.GetDrawingUnit(100); this.m_shift -= Math.max(this.m_systemSpacing, 2 * unit); } system.SetDrawingYRel(this.m_shift); this.m_shift += systemAligner.GetBottomAlignment().GetYRel(); this.m_justificationSum += systemAligner.GetJustificationSum(this.m_doc); if (system.IsFirstInPage()) this.m_justificationSum -= this.m_doc.GetOptions().m_justificationSystem.GetValue(); this.m_prevBottomOverflow = systemAligner.GetOverflowBelow(this.m_doc); this.m_prevBottomClefOverflow = systemAligner.GetOverflowBelow(this.m_doc, true); return FunctorCode.FUNCTOR_SIBLINGS; }
}

// Keep the C++ type aliases visible to downstream TS consumers.
export type AlignClassId = ClassId;
export const ALIGNMENT_REFERENCE = 0;
export const ALIGNMENT_MEASURE_END_SENTINEL = ALIGNMENT_MEASURE_END;
