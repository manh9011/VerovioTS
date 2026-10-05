/**
 * convertfunctor.ts — canonical translation of src-cpp/src/convertfunctor.cpp +
 * src-cpp/include/vrv/convertfunctor.h (excluding ConvertToPageBasedFunctor,
 * which already lives in src/convert-pagebased.ts).
 *
 * Covers, in C++ source order:
 * - ConvertToCastOffMensuralFunctor (DocFunctor, end interface false)
 * - ConvertToUnCastOffMensuralFunctor (Functor, end interface false)
 * - ConvertToCmnFunctor (DocFunctor, end interface true)
 * - ConvertMarkupAnalyticalFunctor (Functor, end interface true)
 * - ConvertMarkupArticFunctor (Functor, end interface true)
 * - ConvertMarkupScoreDefFunctor (DocFunctor, end interface true)
 * - ConvertToMensuralViewFunctor (DocFunctor, end interface true)
 *
 * C++ multiple return/iterator idioms (`std::list::iterator` over segments,
 * `std::advance`) become explicit index cursors; member copies (`Mensur mensur =
 * *mensurRef`, `mensur = *mensurRef`) use the canonical TS `AssignFrom` clone
 * where available and fall back to prototype-preserving field copies for
 * structural fakes. Timestamps/measure state preserve branch order.
 * Unmigrated collaborators stay `any`-typed structural boundaries.
 */

import { DocFunctor, Functor } from './functor.js';
import { ClassId, FunctorCode, MeasureType, SCORE_TIME_UNIT } from './vrvdef.js';
import {
  DURATION_breve,
  DURATION_1,
  DURATION_2,
  DURATION_16,
  TIE_i,
  TIE_m,
  TIE_t,
} from './libmei-att.js';
import { Fraction } from './fraction.js';
import { Att } from './att.js';
import { ObjectFactory } from './object.js';
import { AlignmentType } from './horizontalaligner.js';
import { LogDebug, LogInfo, LogWarning, UTF8to32 } from './vrv.js';

// Canonical enum ordinals (source: attconverter.ts + clef.ts + iodarms.ts).
const bracketSpanLog_FUNC_coloration = 1;
const bracketSpanLog_FUNC_ligature = 3;
const LINEFORM_solid = 3;
const tupletVis_NUMFORMAT_ratio = 2;
const CLEFSHAPE_C = 4;
const CLEFSHAPE_F = 3;
const CLEFSHAPE_G = 1;
const OCTAVE_DIS_8 = 8;
const STAFFREL_above = 1;
const STAFFREL_basic_below = 2;
const BOOLEAN_false = 2;
const NOTATIONTYPE_NONE = 0;
const MENSURATIONSIGN_C = 1;
const ORIENTATION_reversed = 1;
const BARRENDITION_dbl = 3;
const BARRENDITION_end = 8;

/** Structural boundary for unmigrated tree/domain nodes. */
export type AnyNode = any;
export type IntRef = { value: number };
export type BoolRef = { value: boolean };

// ---------------------------------------------------------------------------
// ConvertToCastOffMensuralFunctor
// ---------------------------------------------------------------------------

export class ConvertToCastOffMensuralFunctor extends DocFunctor {
  private m_segments: AnyNode[] = [];
  private m_currentSegment = 0;
  private m_breakPoints: AnyNode[] = [];
  private m_currentBreakPoint = 0;
  private m_contentStaff: AnyNode = null;
  private m_contentLayer: AnyNode = null;
  private m_targetSystem: AnyNode = null;
  private m_targetStaff: AnyNode = null;
  private m_targetLayer: AnyNode = null;

  public constructor(doc: AnyNode, targetSystem: AnyNode) {
    super(doc);
    this.m_contentStaff = null;
    this.m_contentLayer = null;
    this.m_targetSystem = targetSystem;
    this.m_targetStaff = null;
    this.m_targetLayer = null;
  }

  public ImplementsEndInterface(): boolean { return false; }

  public VisitLayer(layer: AnyNode): FunctorCode {
    this.m_contentLayer = layer;
    this.m_targetLayer = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    this.m_segments = [];
    this.m_breakPoints = [];

    const nbLayers: number = measure.GetDescendantCount(ClassId.LAYER);
    let isFirst = true;

    // Create at least one segment to copy stuff to.
    const MeasureCtor: AnyNode = ObjectFactory.GetInstance().Create(ClassId.MEASURE) ?? this.createMeasureFallback();
    this.setUnmeasured(MeasureCtor);
    this.m_targetSystem.AddChild(MeasureCtor);
    this.m_segments.push(MeasureCtor);

    const alignerChildren: AnyNode[] = measure.m_measureAligner?.GetChildren?.() ?? [];
    for (const child of alignerChildren) {
      const alignment: AnyNode = child;
      // We use the alignments with an element at all layer as a breakpoint.
      if (!this.IsValidBreakPoint(alignment, nbLayers)) continue;
      // Do not break at the first one.
      if (isFirst) {
        isFirst = false;
        continue;
      }
      const segment: AnyNode = this.createFreshMeasure();
      this.m_targetSystem.AddChild(segment);
      this.m_segments.push(segment);
      this.m_breakPoints.push(alignment);
    }

    // Now we are ready to process staves/layers and to move content to m_segments.
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public override VisitObject(object: AnyNode): FunctorCode {
    const parent: AnyNode = object.GetParent?.();
    if (!parent) throw new Error('ConvertToCastOffMensuralFunctor::VisitObject requires a parent.');
    // We want to move only the children of the layer of any type (notes, editorial elements, etc).
    if (parent.Is(ClassId.LAYER)) {
      this.InitSegment(object);
      if (!this.m_targetLayer) throw new Error('ConvertToCastOffMensuralFunctor::VisitObject requires a target layer.');
      object.MoveItselfTo(this.m_targetLayer);
      // Do not process children because we move the full sub-tree.
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: AnyNode): FunctorCode {
    if (!this.m_targetSystem) throw new Error('ConvertToCastOffMensuralFunctor::VisitScoreDef requires a target system.');
    scoreDef.MoveItselfTo(this.m_targetSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    this.m_currentSegment = 0;
    this.m_currentBreakPoint = 0;
    this.m_contentStaff = staff;
    this.m_targetStaff = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemElement(systemElement: AnyNode): FunctorCode {
    if (!this.m_targetSystem) throw new Error('ConvertToCastOffMensuralFunctor::VisitSystemElement requires a target system.');
    systemElement.MoveItselfTo(this.m_targetSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public IsValidBreakPoint(alignment: AnyNode, nbLayers: number): boolean {
    if (alignment.GetType() !== AlignmentType.ALIGNMENT_DEFAULT) return false;
    // Not all layers have an alignment and we cannot break here.
    if (alignment.GetChildCount() !== nbLayers) return false;

    const ligatureAsBracket: boolean = this.getLigatureAsBracket();

    for (const child of alignment.GetChildren()) {
      for (const refChild of child.GetChildren()) {
        // Do not break within editorial markup.
        if (refChild.GetFirstAncestorInRange(ClassId.EDITORIAL_ELEMENT, ClassId.EDITORIAL_ELEMENT_max)) return false;
        // Do not break within a ligature when rendered as bracket.
        if (ligatureAsBracket && refChild.GetFirstAncestor(ClassId.LIGATURE)) {
          const ligature: AnyNode = refChild.GetFirstAncestor(ClassId.LIGATURE);
          if (!ligature) throw new Error('ConvertToCastOffMensuralFunctor::IsValidBreakPoint requires a ligature.');
          if (ligature.GetAlignment() !== alignment) return false;
        }
      }
      // When we have more than one neume in a syllable, every neume has its own alignment.
      // Only the first one, which is shared with the syllable, is a valid break point.
      if (child.FindDescendantByType(ClassId.NC) && !child.FindDescendantByType(ClassId.SYLLABLE)) {
        return false;
      }
    }
    return true;
  }

  public InitSegment(object: AnyNode): void {
    if (!this.m_contentStaff) throw new Error('ConvertToCastOffMensuralFunctor::InitSegment requires a content staff.');
    if (!this.m_contentLayer) throw new Error('ConvertToCastOffMensuralFunctor::InitSegment requires a content layer.');

    let element: AnyNode = null;
    if (object.IsLayerElement?.()) element = object;

    // C++: element->GetAlignment() == *m_currentBreakPoint — advance to the next segment.
    if (element && element.GetAlignment?.() && this.m_breakPoints.length > 0
      && this.m_currentBreakPoint < this.m_breakPoints.length
      && element.GetAlignment() === this.m_breakPoints[this.m_currentBreakPoint]) {
      this.m_targetStaff = null;
      this.m_targetLayer = null;
      this.m_currentBreakPoint += 1;
      this.m_currentSegment += 1;
    }

    if (this.m_targetStaff && this.m_targetLayer) return;

    this.m_targetStaff = ObjectFactory.GetInstance().Create(ClassId.STAFF);
    this.m_contentStaff.CopyAttributesTo(this.m_targetStaff);
    // Keep the xml:id of the staff in the first staff segment.
    this.m_targetStaff.SwapID(this.m_contentStaff);
    if (!this.m_segments[this.m_currentSegment]) throw new Error('ConvertToCastOffMensuralFunctor::InitSegment requires a current segment.');
    this.m_segments[this.m_currentSegment].AddChild(this.m_targetStaff);

    this.m_targetLayer = ObjectFactory.GetInstance().Create(ClassId.LAYER);
    this.m_contentLayer.CopyAttributesTo(this.m_targetLayer);
    // Keep the xml:id of the layer in the first segment.
    this.m_targetLayer.SwapID(this.m_contentLayer);
    if (!this.m_targetStaff) throw new Error('ConvertToCastOffMensuralFunctor::InitSegment requires a target staff.');
    this.m_targetStaff.AddChild(this.m_targetLayer);
  }

  private getLigatureAsBracket(): boolean {
    try {
      const options: AnyNode = this.m_doc?.GetOptions?.();
      const opt: AnyNode = options?.m_ligatureAsBracket;
      if (opt && typeof opt.GetValue === 'function') return !!opt.GetValue();
    } catch { /* structural fallback below */ }
    return false;
  }
  // ponytail: UNMEASURED ctor parity via SetRight(invis); upgrade when Measure gains SetMeasureType.

  private createMeasureFallback(): AnyNode {
    throw new Error('ConvertToCastOffMensuralFunctor requires the Measure factory.');
  }

  private createFreshMeasure(): AnyNode {
    const segment: AnyNode = ObjectFactory.GetInstance().Create(ClassId.MEASURE);
    this.setUnmeasured(segment);
    return segment;
  }

  private setUnmeasured(measure: AnyNode): void {
    // C++ `new Measure(UNMEASURED)`; factory default is MEASURED.
    try {
      if (typeof measure.SetMeasureType === 'function') {
        measure.SetMeasureType(MeasureType.UNMEASURED);
        return;
      }
    }
    catch { /* fall through */ }
    try {
      if (typeof measure.SetRight === 'function' && typeof measure.IsMeasuredMusic === 'function'
        && measure.IsMeasuredMusic()) {
        measure.SetRight(10);
      }
    } catch { /* structural fakes ignore */ }
  }
}

// ---------------------------------------------------------------------------
// ConvertToUnCastOffMensuralFunctor
// ---------------------------------------------------------------------------

export class ConvertToUnCastOffMensuralFunctor extends Functor {
  private m_contentMeasure: AnyNode = null;
  private m_contentLayer: AnyNode = null;
  private m_trackSegmentsToDelete = true;
  private m_segmentsToDelete: AnyNode[] = [];

  public constructor() {
    super();
    this.ResetContent();
    // We process layer by layer, keep a list of segments to be deleted the first time we go through.
    this.m_trackSegmentsToDelete = true;
  }

  public ImplementsEndInterface(): boolean { return false; }

  public ResetContent(): void {
    this.m_contentMeasure = null;
    this.m_contentLayer = null;
  }

  public TrackSegmentsToDelete(trackSegments: boolean): void { this.m_trackSegmentsToDelete = trackSegments; }

  public GetSegmentsToDelete(): AnyNode[] { return this.m_segmentsToDelete; }

  public VisitLayer(layer: AnyNode): FunctorCode {
    if (!this.m_contentLayer) {
      this.m_contentLayer = layer;
    } else {
      this.m_contentLayer.MoveChildrenFrom(layer);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    // First measure of the section, move all content to it and keep it.
    if (!this.m_contentMeasure) {
      this.m_contentMeasure = measure;
    } else if (this.m_trackSegmentsToDelete) {
      // First pass, mark the measure to be deleted once finished.
      this.m_segmentsToDelete.push(measure);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSection(_section: AnyNode): FunctorCode {
    this.ResetContent();
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

// ---------------------------------------------------------------------------
// ConvertToCmnFunctor — internal info holders
// ---------------------------------------------------------------------------

export class MensurInfo {
  public m_mensur: AnyNode = null;
  public m_time: Fraction = new Fraction(0);
}

export class MeasureInfo {
  public m_measure: AnyNode = null;
  public m_time: Fraction;
  public m_duration: Fraction;
  public constructor(time: Fraction, duration: Fraction) {
    this.m_time = time;
    this.m_duration = duration;
    this.m_measure = null;
  }
}

export class CmnDuration {
  public m_duration: number;
  public m_dots: number;
  public m_num: number;
  public m_numbase: number;
  public constructor(duration: number, dots: number, num = 1, numbase = 1) {
    this.m_duration = duration;
    this.m_dots = dots;
    this.m_num = num;
    this.m_numbase = numbase;
  }
}

// ---------------------------------------------------------------------------
// ConvertToCmnFunctor
// ---------------------------------------------------------------------------

export class ConvertToCmnFunctor extends DocFunctor {
  private m_score: AnyNode = null;
  private m_measures: MeasureInfo[] = [];
  private m_currentMeasure = 0;
  private m_layers: AnyNode[] = [];
  private m_currentLayer = 0;
  private m_clefs: AnyNode[] = [];
  private m_layerClef: AnyNode = null;
  private m_targetSystem: AnyNode = null;
  private m_currentParams: AnyNode = { meterSig: null, mensur: null, proport: null };
  private m_durationElements: AnyNode[] = [];
  private m_ligature: AnyNode = null;
  private m_coloration: AnyNode = null;
  private m_proportTuplet: AnyNode = null;
  private m_currentStaff: AnyNode = null;
  private m_startid = '';
  private m_n = 0;

  public constructor(doc: AnyNode, targetSystem: AnyNode, score: AnyNode) {
    super(doc);
    this.m_targetSystem = targetSystem;
    this.m_score = score;
    this.m_currentStaff = null;
    this.m_n = 0;
  }

  public ImplementsEndInterface(): boolean { return true; }

  public VisitChord(chord: AnyNode): FunctorCode {
    // Mensural chords are aligned looking at the longest duration in the notes.
    let longestNote: AnyNode = null;
    const notes: AnyNode[] = chord.FindAllDescendantsByType(ClassId.NOTE);
    for (const object of notes) {
      const note: AnyNode = object;
      if (!longestNote || (note.GetScoreTimeDuration().compare(longestNote.GetScoreTimeDuration()) > 0)) {
        longestNote = note;
      }
    }

    // Use the longest note duration but create Chords.
    // That way the (longest) duration moves up from the note elements to the chord.
    // As it stands we ignore notes with shorter duration in the chords; we also ignore coloration.
    this.ConvertDurationInterface(longestNote, ClassId.CHORD);

    // This should not happen, just check it once for all.
    if (this.m_durationElements.length === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    // Copy the `@pname` and `@oct` from the mensural note.
    for (const noteObject of notes) {
      let tieStart: AnyNode = null;
      const accid: AnyNode = noteObject.FindDescendantByType(ClassId.ACCID);
      const isFirstNote: BoolRef = { value: true };
      for (const object of this.m_durationElements) {
        const note: AnyNode = noteObject;
        const cmnNote: AnyNode = ObjectFactory.GetInstance().Create(ClassId.NOTE);
        cmnNote.SetPname(note.GetPname());
        cmnNote.SetOct(note.GetOct());
        this.ConvertAccid(cmnNote, accid, isFirstNote);
        object.AddChild(cmnNote);

        // Also create the ties for notes in the chord.
        if (tieStart) {
          const measure: AnyNode = tieStart.GetFirstAncestor(ClassId.MEASURE);
          if (!measure) throw new Error('ConvertToCmnFunctor::VisitChord requires a measure ancestor.');
          const tie: AnyNode = ObjectFactory.GetInstance().Create(ClassId.TIE);
          tie.SetStartid('#' + tieStart.GetID());
          tie.SetEndid('#' + cmnNote.GetID());
          measure.AddChild(tie);
        }
        tieStart = cmnNote;
      }
    }

    // Move the verse.
    const verse: AnyNode = chord.FindDescendantByType(ClassId.VERSE);
    if (verse) {
      verse.MoveItselfTo(this.m_durationElements[0]);
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitLayer(layer: AnyNode): FunctorCode {
    this.m_currentParams.mensur = layer.GetCurrentMensur();
    this.m_currentParams.meterSig = layer.GetCurrentMeterSig();
    this.m_currentParams.proport = layer.GetCurrentProport();

    this.m_ligature = null;
    this.m_coloration = null;
    this.m_proportTuplet = null;

    this.m_startid = '';

    this.m_currentLayer = 0;
    this.m_currentMeasure = 0;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    if (layerElement.IsSystemElement?.()) return FunctorCode.FUNCTOR_CONTINUE;

    if (layerElement.Is(ClassId.CLEF)) {
      if (!this.m_layerClef) this.m_layerClef = layerElement;
    } else if (layerElement.Is(ClassId.MENSUR)) {
      // Replace the current mensur.
      this.m_currentParams.mensur = layerElement;
      if (!this.m_currentParams.mensur) throw new Error('ConvertToCmnFunctor::VisitLayerElement requires a mensur.');
      this.ConvertMensur(this.m_currentParams.mensur);
    } else if (layerElement.Is(ClassId.PROPORT)) {
      if (layerElement.GetType() === 'cmme_tempo_change') return FunctorCode.FUNCTOR_SIBLINGS;
      // Replace the current proport.
      const previous: AnyNode = this.m_currentParams.proport ? this.m_currentParams.proport : null;
      this.m_currentParams.proport = layerElement;
      if (!this.m_currentParams.proport) throw new Error('ConvertToCmnFunctor::VisitLayerElement requires a proport.');
      if (previous) {
        this.m_currentParams.proport.Cumulate(previous);
      }
      // Reset the tuplet since we expect the num / numbase to be different.
      this.m_proportTuplet = null;
    } else if (layerElement.IsAnyOf?.([ClassId.ACCID, ClassId.BARLINE, ClassId.DOT])) {
      // Can be ignored.
    } else {
      LogDebug(layerElement.GetClassName());
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitLigature(_ligature: AnyNode): FunctorCode {
    if (this.m_ligature) throw new Error('ConvertToCmnFunctor::VisitLigature requires no open ligature.');
    this.m_ligature = ObjectFactory.GetInstance().Create(ClassId.BRACKETSPAN);
    this.m_ligature.SetFunc(bracketSpanLog_FUNC_ligature);
    this.m_ligature.SetLform(LINEFORM_solid);
    this.m_measures[this.m_currentMeasure].m_measure.AddChild(this.m_ligature);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLigatureEnd(_ligature: AnyNode): FunctorCode {
    this.m_ligature = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    this.m_measures = [];

    const nbLayers: number = measure.GetDescendantCount(ClassId.LAYER);

    // First build an array of all mensuration signs that correspond to a time signature change.
    // Mensur sign should appear at all voices to be considered global.
    const mensurs: MensurInfo[] = [];
    const mensur = new MensurInfo(); // Copied when added to the array, so we can re-use it.

    const alignerChildren: AnyNode[] = measure.m_measureAligner?.GetChildren?.() ?? [];
    for (const child of alignerChildren) {
      const alignment: AnyNode = child;
      // We use the alignments with an element at all layer as a breakpoint.
      if (!this.IsGlobalMensur(alignment, nbLayers, mensur.m_mensur)) continue;
      mensur.m_time = alignment.GetTime();
      const copy = new MensurInfo();
      copy.m_mensur = mensur.m_mensur;
      copy.m_time = mensur.m_time;
      mensurs.push(copy);
    }
    // We need to have at least one and at least one at beginning (time 0).
    if (mensurs.length === 0) {
      mensur.m_time = new Fraction(0);
      mensurs.push(mensur);
      LogWarning('No mensur detected');
    } else if (!mensurs[0].m_time.equals(new Fraction(0))) {
      mensur.m_time = new Fraction(0);
      this.resetMensur(mensur.m_mensur);
      mensurs.unshift(mensur);
      LogWarning('No mensur detected at the beginning');
    }

    // Now we can create measure object based on the mensur and the time of each MensurInfo section.
    // The total time of the piece.
    const totalTime: Fraction = measure.m_measureAligner.GetMaxTime();
    let time = new Fraction(0);
    // We know that we have at least one MensurInfo.
    let mensurIdx = 0;
    let measureDuration: Fraction = this.CalcMeasureDuration(mensurs[0].m_mensur);
    let currentMensur: AnyNode = mensurs[0].m_mensur;
    mensurIdx = 1;
    // The next is either the next MensurInfo or the end of the piece.
    let next: Fraction = (mensurIdx === mensurs.length) ? totalTime : mensurs[mensurIdx].m_time;

    while (time.compare(next) < 0) {
      const measureInfo = new MeasureInfo(time, measureDuration);
      const cmnMeasure: AnyNode = ObjectFactory.GetInstance().Create(ClassId.MEASURE);
      this.m_n += 1;
      cmnMeasure.SetN(this.m_n);
      measureInfo.m_measure = cmnMeasure;
      if (time.add(measureInfo.m_duration).compare(next) > 0) {
        measureInfo.m_duration = next.subtract(time);
        cmnMeasure.SetMetcon(BOOLEAN_false);
      }
      this.m_targetSystem.AddChild(cmnMeasure);
      this.m_measures.push(measureInfo);

      time = time.add(measureDuration);
      if (time.compare(next) >= 0 && mensurIdx !== mensurs.length) {
        time = next;
        currentMensur = mensurs[mensurIdx].m_mensur;
        const duration: Fraction = this.CalcMeasureDuration(currentMensur);
        // The new measure does not have the same duration - add a scoreDef with a meterSig change.
        if (!duration.equals(measureDuration)) {
          const scoreDef: AnyNode = ObjectFactory.GetInstance().Create(ClassId.SCOREDEF);
          const meterSig: AnyNode = ObjectFactory.GetInstance().Create(ClassId.METERSIG);
          meterSig.SetAttribute(true);
          meterSig.SetUnit(2);
          const count: Fraction = duration.divide(Fraction.fromDuration(DURATION_2));
          meterSig.SetCount([[count.GetNumerator()], 0]);
          scoreDef.AddChild(meterSig);
          this.m_targetSystem.AddChild(scoreDef);
        }
        measureDuration = duration;
        mensurIdx += 1;
        next = (mensurIdx === mensurs.length) ? totalTime : mensurs[mensurIdx].m_time;
      }
    }
    // This will happen with empty CMME files.
    if (this.m_measures.length === 0) {
      LogWarning('The content of the measure seems empty, creating one for the process not to fail.');
      const measureInfo = new MeasureInfo(time, measureDuration);
      const cmnMeasure: AnyNode = ObjectFactory.GetInstance().Create(ClassId.MEASURE);
      measureInfo.m_measure = cmnMeasure;
      // Arbitrary duration.
      measureInfo.m_duration = new Fraction(2);
      cmnMeasure.SetMetcon(BOOLEAN_false);
      this.m_targetSystem.AddChild(cmnMeasure);
      this.m_measures.push(measureInfo);
    }

    this.m_measures[this.m_measures.length - 1].m_measure.SetRight(BARRENDITION_dbl);

    // Now we are ready to process layers and to move content to m_measures.
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AnyNode): FunctorCode {
    void measure;
    // This is the first measure in the system - we need to update the scoreDef.
    if (this.m_score && this.m_score.GetScoreDef?.()) {
      for (const child of this.m_score.GetScoreDef().GetList()) {
        const staffDef: AnyNode = child;
        if (!staffDef) throw new Error('ConvertToCmnFunctor::VisitMeasureEnd requires a staffDef.');
        // Remove the notation type (CMN is normally the default).
        staffDef.SetNotationtype(NOTATIONTYPE_NONE);
        // Remove the mensur.
        const mensur: AnyNode = staffDef.GetFirst(ClassId.MENSUR);
        if (mensur) staffDef.DeleteChild(mensur);
        // Add the meterSig.
        const meterSig: AnyNode = ObjectFactory.GetInstance().Create(ClassId.METERSIG);
        meterSig.SetUnit(2);
        const count: Fraction = this.m_measures[0].m_duration.divide(Fraction.fromDuration(DURATION_2));
        meterSig.SetCount([[count.GetNumerator()], 0]);
        staffDef.AddChild(meterSig);

        // Add or replace the clef.
        const clef: AnyNode = staffDef.GetFirst(ClassId.CLEF);
        // We must have m_clefs filled with clefs converted when processing layers.
        // However, if we have a clef in the staffDef, convert and use that one.
        if (clef) {
          this.ConvertClef(this.m_clefs[this.m_clefs.length - 1], clef);
          staffDef.DeleteChild(clef);
        }
        staffDef.AddChild(this.m_clefs[this.m_clefs.length - 1]);
        // Pop it from the list.
        this.m_clefs.pop();
      }
      // Adjust the scoreDef only for the first measure, set it to NULL.
      this.m_score = null;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: AnyNode): FunctorCode {
    this.ConvertDurationInterface(note, ClassId.NOTE);

    // This should not happen, just check it once for all.
    if (this.m_durationElements.length === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    const accid: AnyNode = note.FindDescendantByType(ClassId.ACCID);
    const isFirstNote: BoolRef = { value: true };

    // Copy the `@pname` and `@oct` from the mensural note.
    for (const object of this.m_durationElements) {
      const cmnNote: AnyNode = object;
      if (!cmnNote || typeof cmnNote.SetPname !== 'function') throw new Error('ConvertToCmnFunctor::VisitNote requires CMN note elements.');
      cmnNote.SetPname(note.GetPname());
      cmnNote.SetOct(note.GetOct());
      if (note.HasColor?.()) cmnNote.SetColor(note.GetColor());
      this.ConvertAccid(cmnNote, accid, isFirstNote);
    }

    // Check if we are in a ligature and set `@startid` and `@endid` as needed.
    if (this.m_ligature) {
      // The ligature has just been created, add the first note as `@startid`.
      if (!this.m_ligature.HasStartid?.()) this.m_ligature.SetStartid('#' + this.m_durationElements[0].GetID());
      // Set the last as `@endid` - will be updated until the ligature is closed.
      this.m_ligature.SetEndid('#' + this.m_durationElements[this.m_durationElements.length - 1].GetID());
    }

    // Check if the note has coloration - create or add it to the coloration bracket as appropriate.
    if (note.HasColored?.()) {
      if (!this.m_coloration) {
        this.m_coloration = ObjectFactory.GetInstance().Create(ClassId.BRACKETSPAN);
        this.m_coloration.SetFunc(bracketSpanLog_FUNC_coloration);
        const measure: AnyNode = this.m_durationElements[0].GetFirstAncestor(ClassId.MEASURE);
        if (!measure) throw new Error('ConvertToCmnFunctor::VisitNote requires a measure ancestor.');
        measure.AddChild(this.m_coloration);
        this.m_coloration.SetStartid('#' + this.m_durationElements[0].GetID());
      }
      // Set the last as `@endid` - will be updated if next note is also colored.
      this.m_coloration.SetEndid('#' + this.m_durationElements[this.m_durationElements.length - 1].GetID());
    } else if (this.m_coloration) {
      // End the coloration bracket if any.
      this.m_coloration = null;
    }

    // Move the verse.
    const verse: AnyNode = note.FindDescendantByType(ClassId.VERSE);
    if (verse) {
      verse.MoveItselfTo(this.m_durationElements[0]);
    }

    // Add the tie.
    let tieStart: AnyNode = this.m_durationElements[0];
    for (const tieEnd of this.m_durationElements) {
      if (tieStart === tieEnd) continue;
      const measure: AnyNode = tieStart.GetFirstAncestor(ClassId.MEASURE);
      if (!measure) throw new Error('ConvertToCmnFunctor::VisitNote requires a measure ancestor.');
      const tie: AnyNode = ObjectFactory.GetInstance().Create(ClassId.TIE);
      tie.SetStartid('#' + tieStart.GetID());
      tie.SetEndid('#' + tieEnd.GetID());
      measure.AddChild(tie);
      if (note.HasColor?.()) tie.SetColor(note.GetColor());
      tieStart = tieEnd;
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitRest(rest: AnyNode): FunctorCode {
    this.ConvertDurationInterface(rest, ClassId.REST);

    // Copy the `@color` from the mensural rest.
    for (const object of this.m_durationElements) {
      const cmnRest: AnyNode = object;
      if (!cmnRest || typeof cmnRest.SetColor !== 'function') throw new Error('ConvertToCmnFunctor::VisitRest requires CMN rest elements.');
      if (rest.HasColor?.()) cmnRest.SetColor(rest.GetColor());
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitScoreDef(scoreDef: AnyNode): FunctorCode {
    if (!this.m_targetSystem) throw new Error('ConvertToCmnFunctor::VisitScoreDef requires a target system.');
    scoreDef.MoveItselfTo(this.m_targetSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    this.m_currentStaff = staff;
    this.m_layerClef = null;
    this.m_currentMeasure = 0;

    this.m_layers = [];
    for (let i = 0; i < this.m_measures.length; ++i) {
      const layer: AnyNode = ObjectFactory.GetInstance().Create(ClassId.LAYER);
      this.m_layers.push(layer);
    }
    this.m_currentLayer = 0;

    for (let i = 0; i < this.m_measures.length; ++i) {
      const cmnStaff: AnyNode = ObjectFactory.GetInstance().Create(ClassId.STAFF);
      cmnStaff.SetN(staff.GetN());
      cmnStaff.AddChild(this.m_layers[i]);
      this.m_measures[i].m_measure.AddChildBack(cmnStaff);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffEnd(_staff: AnyNode): FunctorCode {
    // Add mRest to empty layers.
    for (const layer of this.m_layers) {
      if (layer.GetChildCount() === 0) {
        layer.AddChild(ObjectFactory.GetInstance().Create(ClassId.MREST));
      }
    }

    const clef: AnyNode = ObjectFactory.GetInstance().Create(ClassId.CLEF);
    this.ConvertClef(clef, this.m_layerClef);
    // Add to the list of clef (one per staff).
    this.m_clefs.unshift(clef);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemElement(systemElement: AnyNode): FunctorCode {
    if (!this.m_targetSystem) throw new Error('ConvertToCmnFunctor::VisitSystemElement requires a target system.');
    systemElement.MoveItselfTo(this.m_targetSystem);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemEnd(_system: AnyNode): FunctorCode {
    if (!this.m_targetSystem) throw new Error('ConvertToCmnFunctor::VisitSystemEnd requires a target system.');
    const last: AnyNode = this.m_targetSystem.GetLast(ClassId.MEASURE);
    if (!last) throw new Error('ConvertToCmnFunctor::VisitSystemEnd requires a last measure.');
    last.SetRight(BARRENDITION_end);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public IsGlobalMensur(alignment: AnyNode, nbLayers: number, mensurOut: MensurInfo): boolean {
    if (alignment.GetType() !== AlignmentType.ALIGNMENT_MENSUR) return false;
    // Not all layers have an alignment and we cannot break here.
    if (alignment.GetChildCount() !== nbLayers) return false;

    for (const child of alignment.GetChildren()) {
      // Just pick the one of the first layer - quite arbitrary and we should check if they are all the same
      // and decide what to do if they are not.
      const mensurRef: AnyNode = child.FindDescendantByType(ClassId.MENSUR);
      if (mensurRef) {
        mensurOut.m_mensur = this.cloneMensur(mensurRef);
        return true;
      }
    }
    return true;
  }

  public CalcMeasureDuration(mensur: AnyNode): Fraction {
    let duration: Fraction = Fraction.fromDuration(DURATION_2);
    duration = duration.multiply(new Fraction(Math.abs(mensur.GetProlatio())));
    if (Math.abs(mensur.GetProlatio()) === 2) duration = duration.multiply(new Fraction(Math.abs(mensur.GetTempus())));
    return duration;
  }

  public ConvertDurationInterface(iface: AnyNode, classId: number): void {
    if (!iface) throw new Error('ConvertToCmnFunctor::ConvertDurationInterface requires an interface.');
    this.m_durationElements = [];

    let noteDur: number = iface.GetActualDur();
    // Longa and maxima are converted into repeated breves since breve is the longest duration we can fit in a measure.
    if (noteDur < DURATION_breve) noteDur = DURATION_breve;

    this.SplitDurationInterface(classId, noteDur,
      iface.GetScoreTimeOnset().divide(new Fraction(SCORE_TIME_UNIT)),
      iface.GetScoreTimeDuration().divide(new Fraction(SCORE_TIME_UNIT)));
  }

  public SplitDurationInterface(classId: number, noteDur: number, time: Fraction, duration: Fraction): void {
    if (this.m_currentLayer >= this.m_layers.length) {
      LogDebug('Extraneous content not processed');
      return;
    }

    const measureEnd: Fraction = this.m_measures[this.m_currentMeasure].m_time.add(this.m_measures[this.m_currentMeasure].m_duration);
    const noteEnd: Fraction = time.add(duration);

    const cmnDurations: CmnDuration[] = [];

    let processed: Fraction = duration;
    // If we go beyond the end of the measure, first process only what fits.
    if (noteEnd.compare(measureEnd) > 0) {
      processed = measureEnd.subtract(time);
    }

    // The alignment duration features in the proportion - we can revert it back and make tuplets.
    let durationWithoutProport: Fraction = processed;
    // Invert apply num and numbase.
    if (this.m_currentParams.proport?.HasNum?.()) {
      durationWithoutProport = durationWithoutProport.multiply(new Fraction(this.m_currentParams.proport.GetCumulatedNum()));
    }
    if (this.m_currentParams.proport?.HasNumbase?.()) {
      durationWithoutProport = durationWithoutProport.divide(new Fraction(this.m_currentParams.proport.GetCumulatedNumbase()));
    }
    // We have a proportion applied, so the duration is different.
    const hasProportion: boolean = !durationWithoutProport.equals(processed);
    // A flag indicating if the tuplet is a temporary one not corresponding to the proportion when notes are split
    // across measures.
    let nonProportTuplet = false;

    // Check if the value can be represented by value up to 16th (arbitrary).
    // This is not always the case when notes are split across measures.
    // It is most likely to happen with proportions, but not only and it can also happen with coloration and notes
    // having `@num` and `@numbase`. One possible improvement would be to regroup sequences of notes with the same
    // `@num` and `@numbase` under the same tuplet.
    if (!durationWithoutProport.mod(Fraction.fromDuration(DURATION_16)).equals(new Fraction(0))) {
      // If not, do not use the proportion tuplet and revert the duration back - however, that happens only when we
      // have a proportion.
      this.m_proportTuplet = null;
      durationWithoutProport = processed;
      // If the remaining duration cannot be represented as well, last resort option with a specific tuplet.
      if (!durationWithoutProport.mod(Fraction.fromDuration(DURATION_16)).equals(new Fraction(0))) {
        this.m_proportTuplet = ObjectFactory.GetInstance().Create(ClassId.TUPLET);
        // Use a note with half of the noteDur expected when in a proportion since the note is being split across
        // measures - create a tuplet with according ratio.
        const tupletRatio: Fraction = hasProportion
          ? durationWithoutProport.divide(Fraction.fromDuration(noteDur)).multiply(new Fraction(2))
          : durationWithoutProport.divide(Fraction.fromDuration(noteDur));
        LogWarning('The tuplet corresponding to proportion is not appropriate and must be changed to %s', tupletRatio.ToString());
        this.m_proportTuplet.SetNum(tupletRatio.GetDenominator());
        this.m_proportTuplet.SetNumbase(tupletRatio.GetNumerator());
        this.m_proportTuplet.SetNumFormat(tupletVis_NUMFORMAT_ratio);
        this.m_proportTuplet.SetBracketVisible(BOOLEAN_false);
        // Same here: use a note with half of the noteDur expected when in a proportion since the note is being
        // split across measures.
        durationWithoutProport = hasProportion ? Fraction.fromDuration(noteDur).divide(new Fraction(2)) : Fraction.fromDuration(noteDur);
        this.m_layers[this.m_currentLayer].AddChild(this.m_proportTuplet);
        // Mark the tuplet as temporary.
        nonProportTuplet = true;
      }
    } else if (hasProportion && !this.m_proportTuplet) {
      // Create a new tuplet but only if we have not already created one for the previous note.
      this.m_proportTuplet = ObjectFactory.GetInstance().Create(ClassId.TUPLET);
      this.m_proportTuplet.SetNum(this.m_currentParams.proport.GetCumulatedNum());
      this.m_proportTuplet.SetNumbase(this.m_currentParams.proport.GetCumulatedNumbase());
      this.m_proportTuplet.SetNumFormat(tupletVis_NUMFORMAT_ratio);
      this.m_proportTuplet.SetBracketVisible(BOOLEAN_false);
      this.m_layers[this.m_currentLayer].AddChild(this.m_proportTuplet);
    }

    // Split what we can fit within a measure into cmn duration (e.g., B => B. Sb. in tempus perfectum and prolatio
    // major). Fill a list of CMN duration with dots (and num / numbase, unused for now).
    this.SplitDurationIntoCmn(noteDur, durationWithoutProport, this.m_currentParams.mensur, cmnDurations);

    // Add them to the layer using the ObjectFactory (create notes or rests).
    for (const cmnDuration of cmnDurations) {
      const layerElement: AnyNode = ObjectFactory.GetInstance().Create(classId);
      if (!layerElement) throw new Error('ConvertToCmnFunctor::SplitDurationInterface requires a layer element.');
      // Add it to the durationElement for post processing (e.g., setting note attributes or adding ties).
      this.m_durationElements.push(layerElement);
      const di: AnyNode = typeof layerElement.GetDurationInterface === 'function'
        ? layerElement.GetDurationInterface()
        : layerElement;
      if (!di) throw new Error('ConvertToCmnFunctor::SplitDurationInterface requires a duration interface.');
      if (this.m_proportTuplet) {
        // We already have note in the tuplet so we should show the bracket.
        if (this.m_proportTuplet.GetChildCount() > 0) this.m_proportTuplet.SetBracketVisible(1);
        this.m_proportTuplet.AddChild(layerElement);
      } else {
        this.m_layers[this.m_currentLayer].AddChild(layerElement);
      }
      di.SetDur(cmnDuration.m_duration);
      // Add a `@dots` only if not 0.
      if (cmnDuration.m_dots !== 0) di.SetDots(cmnDuration.m_dots);
    }

    // The tuplet is specific to the partial duration, reset it (e.g., at the beginning of a measure with a note
    // split from the previous measure).
    if (nonProportTuplet) this.m_proportTuplet = null;

    // Increase the tstamp by the value processed.
    this.m_startid = this.m_durationElements[0].GetID();

    // If we have reached the end of the measure, go to the next one.
    if (time.add(processed).equals(measureEnd)) {
      this.m_currentMeasure += 1;
      this.m_currentLayer += 1;
      // End of the measure, close the tuplet.
      this.m_proportTuplet = null;
      // Reset the tstamp.
      this.m_startid = '';
    }
    // Also check if we have more to process for that note or rest - if yes, call it recursively.
    if (!duration.subtract(processed).equals(new Fraction(0))) {
      this.SplitDurationInterface(classId, noteDur, this.m_measures[this.m_currentMeasure].m_time, duration.subtract(processed));
    }
  }

  public SplitDurationIntoCmn(elementDur: number, duration: Fraction, mensur: AnyNode, cmnDurations: CmnDuration[]): void {
    const prolatioMajor: boolean = Math.abs(mensur.GetProlatio()) === 3;
    const tempusPerfectum: boolean = Math.abs(mensur.GetTempus()) === 3;
    const semiBrevisDots: number = prolatioMajor ? 1 : 0;
    const brevisDots: number = tempusPerfectum ? 1 : 0;

    const semiBrevis: Fraction = new Fraction(1).multiply(new Fraction(Math.abs(mensur.GetProlatio()))).divide(new Fraction(2));
    const brevis: Fraction = new Fraction(1).multiply(new Fraction(Math.abs(mensur.GetTempus())));

    // First see if we are expecting a breve and if the duration is long enough.
    if (elementDur === DURATION_breve) {
      // First check if this is an imperfecta breve, which can be converted as a non dotted breve.
      if (tempusPerfectum && duration.equals(brevis.multiply(new Fraction(2)).divide(new Fraction(3)))) {
        cmnDurations.push(new CmnDuration(DURATION_breve, 0));
        duration = new Fraction(0);
      }
      while (duration.compare(brevis) >= 0) {
        cmnDurations.push(new CmnDuration(DURATION_breve, brevisDots));
        duration = duration.subtract(brevis);
        // Check if we can use a dotted breve.
        if (duration.equals(brevis.divide(new Fraction(2))) && brevisDots === 0) {
          cmnDurations[cmnDurations.length - 1].m_dots = 1;
          duration = new Fraction(0);
        }
        if (duration.equals(brevis.divide(new Fraction(2))) && brevisDots === 0) {
          cmnDurations[cmnDurations.length - 1].m_dots = 1;
          duration = new Fraction(0);
        }
      }
      // If we have not processed everything, go down to the level of semibrevis.
      if (!duration.equals(new Fraction(0))) elementDur = DURATION_1;
    }
    // See now if the duration is long enough for a semibrevis.
    if (elementDur === DURATION_1) {
      // First check if this is an imperfecta semibreve, which can be converted as a non dotted semibreve.
      if (prolatioMajor && duration.equals(semiBrevis.multiply(new Fraction(2)).divide(new Fraction(3)))) {
        cmnDurations.push(new CmnDuration(DURATION_1, 0));
        duration = new Fraction(0);
      }
      while (duration.compare(semiBrevis) >= 0) {
        cmnDurations.push(new CmnDuration(DURATION_1, semiBrevisDots));
        duration = duration.subtract(semiBrevis);
        // Check if we can use a dotted whole note.
        if (duration.equals(semiBrevis.divide(new Fraction(2))) && semiBrevisDots === 0) {
          cmnDurations[cmnDurations.length - 1].m_dots = 1;
          duration = new Fraction(0);
        }
      }
    }
    // Then process the rest until everything is processed.
    while (!duration.equals(new Fraction(0))) {
      const [durPart, remainder] = duration.ToDur();
      const durPartDuration: Fraction = duration.subtract(remainder);
      cmnDurations.push(new CmnDuration(durPart, 0));
      duration = remainder;
      // Check if we can use a dotted value.
      if (duration.equals(durPartDuration.divide(new Fraction(2)))) {
        cmnDurations[cmnDurations.length - 1].m_dots = 1;
        duration = new Fraction(0);
      }
    }
  }

  public ConvertAccid(cmnNote: AnyNode, accid: AnyNode, isFirstNote: BoolRef): void {
    if (!accid) return;
    const cmnAccid: AnyNode = ObjectFactory.GetInstance().Create(ClassId.ACCID);
    if (isFirstNote.value) {
      accid.CopyAttributesTo(cmnAccid);
      isFirstNote.value = false;
    } else {
      cmnAccid.SetAccidGes(Att.AccidentalWrittenToGestural(accid.GetAccid()));
    }
    cmnNote.AddChild(cmnAccid);
  }

  public ConvertClef(cmnClef: AnyNode, clef: AnyNode): void {
    if (!cmnClef) throw new Error('ConvertToCmnFunctor::ConvertClef requires a target clef.');
    if (!clef) {
      // Default to C3 clef since this is the most neutral one ambitus-wise.
      cmnClef.SetLine(3);
      cmnClef.SetShape(CLEFSHAPE_C);
    } else if (clef.GetShape() === CLEFSHAPE_F) {
      cmnClef.SetShape(CLEFSHAPE_F);
      cmnClef.SetLine(4);
    } else if (clef.GetShape() === CLEFSHAPE_G) {
      cmnClef.SetShape(CLEFSHAPE_G);
      cmnClef.SetLine(2);
    } else {
      // Assuming to be C.
      if (clef.GetLine() > 4) {
        cmnClef.SetShape(CLEFSHAPE_F);
        cmnClef.SetLine(4);
      } else if (clef.GetLine() > 2) {
        cmnClef.SetShape(CLEFSHAPE_G);
        cmnClef.SetLine(2);
        cmnClef.SetDis(OCTAVE_DIS_8);
        cmnClef.SetDisPlace(STAFFREL_basic_below);
      } else {
        cmnClef.SetShape(CLEFSHAPE_G);
        cmnClef.SetLine(2);
      }
    }
  }

  public ConvertMensur(mensur: AnyNode): void {
    // We need at least a sign or a num.
    if (!mensur.HasSign?.() && !mensur.HasNum?.()) return;

    const dir: AnyNode = ObjectFactory.GetInstance().Create(ClassId.DIR);
    dir.GetTimeSpanningInterface().SetStaff([this.m_currentStaff.GetN()]);
    if (this.m_startid === '') {
      dir.GetTimeSpanningInterface().SetTstamp(0.0);
    } else {
      dir.GetTimeSpanningInterface().SetStartid('#' + this.m_startid);
    }
    dir.SetType('mscore-staff-text');
    dir.GetTextDirInterface().SetPlace(STAFFREL_above);
    const text: AnyNode = ObjectFactory.GetInstance().Create(ClassId.TEXT);
    let str = '';
    if (mensur.HasSign?.()) {
      str += (mensur.GetSign() === MENSURATIONSIGN_C) ? 'C' : 'O';
      if (mensur.GetOrient?.() === ORIENTATION_reversed) str += 'r';
      if (mensur.HasSlash?.()) str += '|';
      if (mensur.HasDot?.()) str += '.';
    }
    if (mensur.HasNum?.()) {
      str += String(mensur.GetNum());
      if (mensur.HasNumbase?.()) str += '/' + String(mensur.GetNumbase());
    }
    text.SetText(UTF8to32(str));
    dir.AddChild(text);
    this.m_measures[this.m_currentMeasure].m_measure.AddChild(dir);
  }

  private cloneMensur(mensurRef: AnyNode): AnyNode {
    if (mensurRef && typeof mensurRef.Clone === 'function') return mensurRef.Clone();
    // Structural fallback: prototype-preserving shallow field copy of the measur state.
    const clone: AnyNode = Object.create(Object.getPrototypeOf(mensurRef));
    Object.assign(clone, mensurRef);
    return clone;
  }

  private resetMensur(mensur: AnyNode): void {
    if (mensur && typeof mensur.Reset === 'function') { mensur.Reset(); return; }
    this.m_currentParams.mensur = null;
  }
}

// ---------------------------------------------------------------------------
// ConvertMarkupAnalyticalFunctor
// ---------------------------------------------------------------------------

export class ConvertMarkupAnalyticalFunctor extends Functor {
  private m_currentNotes: AnyNode[] = [];
  private m_currentChord: AnyNode = null;
  private m_controlEvents: AnyNode[] = [];
  private m_permanent: boolean;

  public constructor(permanent: boolean) {
    super();
    this.m_currentChord = null;
    this.m_permanent = permanent;
  }

  public ImplementsEndInterface(): boolean { return true; }

  public GetCurrentNotes(): AnyNode[] { return this.m_currentNotes; }

  public VisitChord(chord: AnyNode): FunctorCode {
    if (this.m_currentChord) throw new Error('ConvertMarkupAnalyticalFunctor::VisitChord requires no open chord.');
    this.m_currentChord = chord;

    // fermata
    if (chord.HasFermata?.()) {
      const fermata: AnyNode = ObjectFactory.GetInstance().Create(ClassId.FERMATA);
      this.ConvertToFermata(fermata, chord, chord.GetID());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitChordEnd(chord: AnyNode): FunctorCode {
    void chord;
    if (this.m_permanent) {
      chord.ResetTiePresent?.();
    }
    if (!this.m_currentChord) throw new Error('ConvertMarkupAnalyticalFunctor::VisitChordEnd requires an open chord.');
    this.m_currentChord = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AnyNode): FunctorCode {
    for (const object of this.m_controlEvents) {
      measure.AddChild(object);
    }
    this.m_controlEvents = [];
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMRest(mRest: AnyNode): FunctorCode {
    if (mRest.HasFermata?.()) {
      const fermata: AnyNode = ObjectFactory.GetInstance().Create(ClassId.FERMATA);
      this.ConvertToFermata(fermata, mRest, mRest.GetID());
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: AnyNode): FunctorCode {
    // ties
    let check: AnyNode = note;
    // Use the parent chord if there is no @tie on the note.
    if (!note.HasTie?.() && this.m_currentChord) {
      check = this.m_currentChord;
    }
    if (!check) throw new Error('ConvertMarkupAnalyticalFunctor::VisitNote requires a tie check node.');

    const currentMeasure: AnyNode = note.GetFirstAncestor(ClassId.MEASURE);
    if (!currentMeasure) throw new Error('ConvertMarkupAnalyticalFunctor::VisitNote requires a measure ancestor.');

    let iter = 0;
    while (iter < this.m_currentNotes.length) {
      const open: AnyNode = this.m_currentNotes[iter];
      // Same octave and same pitch - this is the one!
      if (note.GetOct() === open.GetOct() && note.GetPname() === open.GetPname()) {
        // Right flag.
        if (check.GetTie() === TIE_m || check.GetTie() === TIE_t) {
          const tie: AnyNode = ObjectFactory.GetInstance().Create(ClassId.TIE);
          if (!this.m_permanent) {
            tie.SetAttribute(true);
          }
          tie.SetStartid('#' + open.GetID());
          tie.SetEndid('#' + note.GetID());
          // Add it to the starting measure when we are already in the next one.
          const startMeasure: AnyNode = open.GetFirstAncestor(ClassId.MEASURE);
          if (startMeasure && startMeasure !== currentMeasure) {
            startMeasure.AddChild(tie);
          } else {
            this.m_controlEvents.push(tie);
          }
        } else {
          LogWarning("Expected @tie median or terminal in note '%s', skipping it", note.GetID());
        }
        this.m_currentNotes.splice(iter, 1);
        // We are done for this note.
        break;
      }
      ++iter;
    }

    if (check.GetTie() === TIE_m || check.GetTie() === TIE_i) {
      this.m_currentNotes.push(note);
    }

    if (this.m_permanent) {
      note.ResetTiePresent?.();
    }

    // fermata
    if (note.HasFermata?.()) {
      const fermata: AnyNode = ObjectFactory.GetInstance().Create(ClassId.FERMATA);
      this.ConvertToFermata(fermata, note, note.GetID());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRest(rest: AnyNode): FunctorCode {
    if (rest.HasFermata?.()) {
      const fermata: AnyNode = ObjectFactory.GetInstance().Create(ClassId.FERMATA);
      this.ConvertToFermata(fermata, rest, rest.GetID());
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public ConvertToFermata(fermata: AnyNode, fermataPresent: AnyNode, id: string): void {
    fermata.SetPlace(Att.StaffrelBasicToStaffrel(fermataPresent.GetFermata()));
    if (this.m_permanent) {
      fermataPresent.ResetFermataPresent?.();
    } else {
      fermata.SetAttribute(true);
    }
    fermata.SetStartid('#' + id);
    this.m_controlEvents.push(fermata);
  }
}

// ---------------------------------------------------------------------------
// ConvertMarkupArticFunctor
// ---------------------------------------------------------------------------

export class ConvertMarkupArticFunctor extends Functor {
  private m_articsToConvert: AnyNode[] = [];

  public constructor() {
    super();
  }

  public ImplementsEndInterface(): boolean { return true; }

  public VisitArtic(artic: AnyNode): FunctorCode {
    if (artic.GetArtic().length > 1) this.m_articsToConvert.push(artic);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerEnd(_layer: AnyNode): FunctorCode {
    for (const artic of this.m_articsToConvert) {
      this.SplitMultival(artic);
    }
    this.m_articsToConvert = [];
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public SplitMultival(artic: AnyNode): void {
    const parent: AnyNode = artic.GetParent();
    if (!parent) throw new Error('ConvertMarkupArticFunctor::SplitMultival requires a parent.');

    const articList: number[] = artic.GetArtic();
    if (articList.length === 0) return;

    let idx: number = artic.GetIdx() + 1;
    for (let i = 1; i < articList.length; ++i) {
      const articChild: AnyNode = ObjectFactory.GetInstance().Create(ClassId.ARTIC);
      articChild.SetArtic([articList[i]]);
      if (typeof artic.GetColor === 'function') articChild.SetColor?.(artic.GetColor());
      if (typeof artic.GetEnclose === 'function') articChild.SetEnclose?.(artic.GetEnclose());
      if (typeof artic.GetGlyphAuth === 'function') articChild.SetGlyphAuth?.(artic.GetGlyphAuth());
      if (typeof artic.GetGlyphUri === 'function') articChild.SetGlyphUri?.(artic.GetGlyphUri());
      if (typeof artic.GetGlyphName === 'function') articChild.SetGlyphName?.(artic.GetGlyphName());
      if (typeof artic.GetGlyphNum === 'function') articChild.SetGlyphNum?.(artic.GetGlyphNum());
      if (typeof artic.GetPlace === 'function') articChild.SetPlace?.(artic.GetPlace());
      parent.InsertChild(articChild, idx);
      ++idx;
    }

    // Only keep the first value in the original element.
    artic.SetArtic([articList[0]]);

    // Multiple valued attributes cannot be preserved as such.
    if (artic.IsAttribute()) {
      artic.SetAttribute(false);
      LogInfo("Multiple valued attribute @artic on '%s' permanently converted to <artic> elements", parent.GetID());
    }
  }

  // copyAttState removed: canonical VrvObject.CopyAttributesTo covers the five
  // C++ att-group assignments (AttColor, AttEnclosingChars, AttExtSymAuth,
  // AttExtSymNames, AttPlacementRelEvent) via AttModule.CopyAll.
}

// ---------------------------------------------------------------------------
// ConvertMarkupScoreDefFunctor
// ---------------------------------------------------------------------------

export class ConvertMarkupScoreDefFunctor extends DocFunctor {
  private m_currentScoreDef: AnyNode = null;

  public constructor(doc: AnyNode) {
    super(doc);
    this.m_currentScoreDef = null;
  }

  public ImplementsEndInterface(): boolean { return true; }

  public VisitScore(score: AnyNode): FunctorCode {
    // Evaluate functor on scoreDef.
    score.GetScoreDef().Process(this as unknown as AnyNode);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDefElement(scoreDefElement: AnyNode): FunctorCode {
    if (scoreDefElement.Is(ClassId.SCOREDEF)) {
      this.m_currentScoreDef = scoreDefElement;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    // This should never be the case.
    if (!scoreDefElement.Is(ClassId.STAFFDEF) || !this.m_currentScoreDef) return FunctorCode.FUNCTOR_CONTINUE;

    // Copy score definition elements to the staffDef but only if they are not given at the staffDef.
    // This might require more refined merging because we can lose data if some staffDef values are defined
    // but do not contain all the ones given in the scoreDef (e.g. @key.mode in scoreDef but not in a staffDef
    // with @key.sig).
    if (this.m_currentScoreDef.HasClefInfo?.() && !scoreDefElement.HasClefInfo?.()) {
      scoreDefElement.AddChild(this.m_currentScoreDef.GetClefCopy());
    }
    if (this.m_currentScoreDef.HasKeySigInfo?.() && !scoreDefElement.HasKeySigInfo?.()) {
      scoreDefElement.AddChild(this.m_currentScoreDef.GetKeySigCopy());
    }
    if (this.m_currentScoreDef.HasMeterSigGrpInfo?.() && !scoreDefElement.HasMeterSigGrpInfo?.()) {
      scoreDefElement.AddChild(this.m_currentScoreDef.GetMeterSigGrpCopy());
    }
    if (this.m_currentScoreDef.HasMeterSigInfo?.() && !scoreDefElement.HasMeterSigInfo?.()) {
      scoreDefElement.AddChild(this.m_currentScoreDef.GetMeterSigCopy());
    }
    if (this.m_currentScoreDef.HasMensurInfo?.() && !scoreDefElement.HasMensurInfo?.()) {
      scoreDefElement.AddChild(this.m_currentScoreDef.GetMensurCopy());
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDefElementEnd(scoreDefElement: AnyNode): FunctorCode {
    if (!scoreDefElement.Is(ClassId.SCOREDEF)) return FunctorCode.FUNCTOR_CONTINUE;

    // At the end of the scoreDef, remove all score definition elements.
    if (scoreDefElement.HasClefInfo?.()) {
      const clef: AnyNode = scoreDefElement.FindDescendantByType(ClassId.CLEF, 1);
      if (clef) scoreDefElement.DeleteChild(clef);
    }
    if (scoreDefElement.HasKeySigInfo?.()) {
      const keySig: AnyNode = scoreDefElement.FindDescendantByType(ClassId.KEYSIG, 1);
      if (keySig) scoreDefElement.DeleteChild(keySig);
    }
    if (scoreDefElement.HasMeterSigGrpInfo?.()) {
      const meterSigGrp: AnyNode = scoreDefElement.FindDescendantByType(ClassId.METERSIGGRP, 1);
      if (meterSigGrp) scoreDefElement.DeleteChild(meterSigGrp);
    }
    if (scoreDefElement.HasMeterSigInfo?.()) {
      const meterSig: AnyNode = scoreDefElement.FindDescendantByType(ClassId.METERSIG, 1);
      if (meterSig) scoreDefElement.DeleteChild(meterSig);
    }
    if (scoreDefElement.HasMensurInfo?.()) {
      const mensur: AnyNode = scoreDefElement.FindDescendantByType(ClassId.MENSUR, 1);
      if (mensur) scoreDefElement.DeleteChild(mensur);
    }

    this.m_currentScoreDef = null;

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

// ---------------------------------------------------------------------------
// ConvertToMensuralViewFunctor
// ---------------------------------------------------------------------------

export class ConvertToMensuralViewFunctor extends DocFunctor {
  private m_viewLayer: AnyNode = null;
  private m_stack: AnyNode[] = [];

  public constructor(doc: AnyNode) {
    super(doc);
    this.m_viewLayer = null;
  }

  public ImplementsEndInterface(): boolean { return true; }

  public VisitEditorialElement(_editorialElement: AnyNode): FunctorCode {
    // We are not in a layer yet.
    if (!this.m_viewLayer) return FunctorCode.FUNCTOR_CONTINUE;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: AnyNode): FunctorCode {
    if (this.m_viewLayer) throw new Error('ConvertToMensuralViewFunctor::VisitLayer requires no open view layer.');
    if (this.m_stack.length !== 0) throw new Error('ConvertToMensuralViewFunctor::VisitLayer requires an empty stack.');
    this.m_viewLayer = ObjectFactory.GetInstance().Create(ClassId.LAYER);
    layer.CopyAttributesTo(this.m_viewLayer);
    this.m_stack.push(this.m_viewLayer);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerEnd(layer: AnyNode): FunctorCode {
    layer.GetParent().ReplaceChild(layer, this.m_viewLayer);
    // This will delete all editorial markup and ligatures in the old layer (GC in TS).

    // We should have only the m_layerView left.
    if (this.m_stack.length !== 1) throw new Error('ConvertToMensuralViewFunctor::VisitLayerEnd requires a single stack entry.');
    this.m_viewLayer = null;
    this.m_stack = [];
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AnyNode): FunctorCode {
    // The stack top is either the new layer or the parent element within editorial markup.
    if (this.m_stack[this.m_stack.length - 1] !== layerElement.GetParent()) {
      layerElement.MoveItselfTo(this.m_stack[this.m_stack.length - 1]);
    }
    this.m_stack.push(layerElement);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElementEnd(_layerElement: AnyNode): FunctorCode {
    this.m_stack.pop();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLigature(_ligature: AnyNode): FunctorCode {
    // For now simply skip them - eventually we might want to add brackets.
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLigatureEnd(_ligature: AnyNode): FunctorCode {
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

