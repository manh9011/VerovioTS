/**
 * setscoredeffunctor.ts — canonical translation of src-cpp/src/setscoredeffunctor.cpp
 * + src-cpp/include/vrv/setscoredeffunctor.h.
 *
 * Nine functors:
 *  - ReplaceDrawingValuesInStaffDefFunctor (Functor, end false): VisitStaffDef.
 *  - ScoreDefSetCurrentPageFunctor (DocFunctor, end true): VisitPageEnd, VisitScore.
 *  - ScoreDefSetCurrentFunctor (DocFunctor, end true): HasOssia + 15 visitors.
 *  - ScoreDefOptimizeFunctor (DocFunctor, end true): 6 visitors.
 *  - SetCautionaryScoreDefFunctor (Functor, end false): SetRestartStaffNs + VisitLayer/Staff.
 *  - ScoreDefSetGrpSymFunctor (Functor, end false): VisitGrpSym/System.
 *  - ScoreDefSetOssiaFunctor (DocFunctor, end true): VisitClef/Layer/Measure/MeasureEnd/Ossia/Staff/StaffEnd/System.
 *  - ScoreDefUnsetCurrentFunctor (Functor, end false): 8 visitors.
 *  - SetStaffDefRedrawFlagsFunctor (Functor, end false): VisitStaffDef.
 *
 * C++ multiple inheritance / value semantics adapted:
 *  - `ScoreDef m_upcomingScoreDef` / `StaffDef m_upcomingStaffDef` value members
 *    become fresh `ScoreDef`/`StaffDef` instances copied through `AssignFrom`
 *    (C++ copy-assignment parity; GC owns the discarded reference).
 *  - `int &m_redrawFlags` becomes a mutable `{ value }` reference object.
 *  - `std::list` mdiv/ossia stacks become plain arrays (`push_front` = `unshift`).
 *  - `std::map<int, StaffDef>` value maps become `Map<number, StaffDef>` with
 *    cloned values on store (C++ `operator[] =` copy parity).
 *  - `MapOfOssiaStaffNs` reuses the canonical `Map<number, number[]>` shape.
 *  - Direct C++ field writes (`staff->m_drawingStaffDef`, `page->m_score`,
 *    `system->m_systemAligner`) go through `any` casts because the TS fields
 *    are private; mutation order is preserved exactly.
 */

import { DocFunctor, Functor } from './functor.js';
import { FunctorCode, ClassId, UNLIMITED_DEPTH, MapOfOssiaStaffNs } from './vrvdef.js';
import { AlignmentType } from './horizontalaligner.js';
import { Comparison, ClassIdComparison, AttVisibilityComparison as CanonicalAttVisibilityComparison, IsEmptyComparison, IDComparison, VisibleStaffDefOrGrpObject } from './comparison.js';
import { ScoreDef } from './scoredef.js';
import { StaffDef } from './staffdef.js';
import { ExtractIDFragment, LogDebug, LogWarning } from './vrv.js';

/** Structural type for visited nodes (C++ forward-declared collaborators). */
type AnyNode = any;

// Canonical numeric aliases (match attconverter.ts / vrvdef.ts / staff.ts).
const CANCELACCID_NONE = 1;
const BOOLEAN_FALSE = 2;
const BOOLEAN_TRUE = 1;
const DOC_TRANSCRIPTION = 2;
const TABLATURE_STAFF_RATIO = 1.75;
const GERMAN_TAB_STAFF_RATIO = 2.2;
const METERSIGGRP_FUNC_ALTERNATING = 1;

// C++ `Measure::BarlineDrawingFlags` bit values (measure.ts parity).
const SYSTEM_BREAK = 0x1;
const SCORE_DEF_INSERT = 0x2;
const INVISIBLE_MEASURE_CURRENT = 0x4;
const INVISIBLE_MEASURE_PREVIOUS = 0x8;

/** C++ `StaffDefRedrawFlags` enum (header parity). */
export enum StaffDefRedrawFlags {
  REDRAW_CLEF = 0x1,
  REDRAW_KEYSIG = 0x2,
  REDRAW_MENSUR = 0x4,
  REDRAW_METERSIG = 0x8,
  REDRAW_METERSIGGRP = 0x10,
  REDRAW_ALL = REDRAW_CLEF | REDRAW_KEYSIG | REDRAW_MENSUR | REDRAW_METERSIG | REDRAW_METERSIGGRP,
  FORCE_REDRAW = 0x100,
}

/** Mutable int reference adapting C++ `int &redrawFlags`. */
export interface IntRef { value: number; }

/** Option getter handling both `GetValue` and `getValue` spellings. */
function optBool(doc: any, name: string): boolean {
  const o = doc?.GetOptions?.()?.[name];
  if (!o) return false;
  if (typeof o.GetValue === 'function') return Boolean(o.GetValue());
  if (typeof o.getValue === 'function') return Boolean(o.getValue());
  return Boolean((o as any).value);
}

function optDbl(doc: any, name: string): number {
  const o = doc?.GetOptions?.()?.[name];
  if (!o) return 0;
  if (typeof o.GetValue === 'function') return Number(o.GetValue());
  if (typeof o.getValue === 'function') return Number(o.getValue());
  return Number((o as any).value ?? 0);
}

/** C++ `AttVisibilityComparison(STAFF, BOOLEAN_false)` parity: hidden STAFF nodes. */
class AttVisibilityComparison extends CanonicalAttVisibilityComparison {
  public constructor() {
    super(ClassId.STAFF, BOOLEAN_FALSE);
  }
}

/** C++ `IsEmptyComparison(LAYER)` + `ReverseComparison()` parity: non-empty layers. */
class NonEmptyLayerComparison extends IsEmptyComparison {
  public constructor() {
    super(ClassId.LAYER);
    this.ReverseComparison();
  }
}

/** C++ `IDComparison(STAFFDEF, id)` parity with mutable `SetID`. */
class StaffDefIDComparison extends IDComparison {
  public constructor(id: string) {
    super(ClassId.STAFFDEF, id);
  }
}

/** Deep-copy a ScoreDef value (C++ copy-assignment parity). */
function copyScoreDef(source: any): ScoreDef {
  const fresh = new ScoreDef();
  (fresh as any).AssignFrom(source);
  return fresh;
}

/** Deep-copy a StaffDef value (C++ copy-assignment parity). */
function copyStaffDef(source: any): StaffDef {
  const fresh = new StaffDef();
  (fresh as any).AssignFrom(source);
  return fresh;
}

//----------------------------------------------------------------------------
// ReplaceDrawingValuesInStaffDefFunctor
//----------------------------------------------------------------------------

export class ReplaceDrawingValuesInStaffDefFunctor extends Functor {
  private m_clef: AnyNode;
  private m_keySig: AnyNode;
  private m_mensur: AnyNode;
  private m_meterSig: AnyNode;
  private m_meterSigGrp: AnyNode;
  private m_newScoreDef: AnyNode;
  private m_redrawFlags: IntRef;

  public constructor(
    clef: AnyNode, keySig: AnyNode, mensur: AnyNode, meterSig: AnyNode,
    meterSigGrp: AnyNode, newScoreDef: AnyNode, redrawFlags: IntRef,
  ) {
    super();
    if (!newScoreDef) throw new Error('ReplaceDrawingValuesInStaffDefFunctor: newScoreDef required.');
    this.m_clef = clef ?? null;
    this.m_keySig = keySig ?? null;
    this.m_mensur = mensur ?? null;
    this.m_meterSig = meterSig ?? null;
    this.m_meterSigGrp = meterSigGrp ?? null;
    this.m_newScoreDef = newScoreDef;
    this.m_redrawFlags = redrawFlags;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitStaffDef(staffDef: AnyNode): FunctorCode {
    const newStaffDef = this.m_newScoreDef.GetStaffDef(staffDef.GetN());

    if (this.m_clef) {
      staffDef.SetCurrentClef(this.m_clef);
    }
    if (newStaffDef && newStaffDef.HasKeySigInfo()) {
      const keySig = newStaffDef.GetKeySig();
      if (!keySig) throw new Error('ReplaceDrawingValuesInStaffDefFunctor: keySig required.');
      if (!keySig.HasCancelaccid() || keySig.GetCancelaccid() !== CANCELACCID_NONE) {
        staffDef.SetCurrentKeySig(newStaffDef.GetKeySig());
        this.m_redrawFlags.value |= StaffDefRedrawFlags.REDRAW_KEYSIG;
      }
    }
    else if (this.m_keySig) {
      staffDef.SetCurrentKeySig(this.m_keySig);
    }
    if (this.m_mensur) {
      staffDef.SetCurrentMensur(this.m_mensur);
    }
    if (this.m_meterSig) {
      staffDef.SetCurrentMeterSig(this.m_meterSig);
    }
    if (this.m_meterSigGrp) {
      staffDef.SetCurrentMeterSigGrp(this.m_meterSigGrp);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// ScoreDefSetCurrentPageFunctor
//----------------------------------------------------------------------------

export class ScoreDefSetCurrentPageFunctor extends DocFunctor {
  private m_scores: AnyNode[] = [];

  public constructor(doc: unknown) {
    super(doc as never);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitPageEnd(page: AnyNode): FunctorCode {
    const doc = this.GetDoc() as any;
    const firstSystem = page.GetFirst(ClassId.SYSTEM);
    const firstRef = firstSystem ?? page;
    page.m_score = doc.GetCorrespondingScore(firstRef, this.m_scores);

    const lastSystem = page.GetLast(ClassId.SYSTEM);
    const lastRef = lastSystem ?? page;
    page.m_scoreEnd = doc.GetCorrespondingScore(lastRef, this.m_scores);

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScore(score: AnyNode): FunctorCode {
    this.m_scores.push(score);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// ScoreDefSetCurrentFunctor
//----------------------------------------------------------------------------

export class ScoreDefSetCurrentFunctor extends DocFunctor {
  private m_currentScore: AnyNode = null;
  private m_currentScoreDef: AnyNode = null;
  private m_currentStaffDef: AnyNode = null;
  private m_upcomingScoreDef: ScoreDef = new ScoreDef();
  private m_previousMeasure: AnyNode = null;
  private m_currentSystem: AnyNode = null;
  private m_drawLabels = false;
  private m_restart = false;
  private m_hasMeasure = false;
  private m_ossiasAbove: MapOfOssiaStaffNs = new Map();
  private m_ossiasBelow: MapOfOssiaStaffNs = new Map();
  private m_hasOssia = false;

  public constructor(doc: unknown) {
    super(doc as never);
    this.m_upcomingScoreDef.Reset();
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public HasOssia(): boolean { return this.m_hasOssia; }

  public VisitClef(clef: AnyNode): FunctorCode {
    let target = clef;
    const linked = clef.ThisOrSameasLink?.();
    if (linked) {
      if (!linked.Is?.(ClassId.CLEF)) {
        const isClef = typeof linked.GetClassId === 'function' && linked.GetClassId() === ClassId.CLEF;
        if (!isClef) return FunctorCode.FUNCTOR_CONTINUE;
      }
      target = linked;
    }
    if (target.IsScoreDefElement?.()) return FunctorCode.FUNCTOR_CONTINUE;
    if (!this.m_currentStaffDef) throw new Error('ScoreDefSetCurrentFunctor::VisitClef: current staffDef required.');
    const crossN = target.m_crossStaff?.GetN?.();
    const n = crossN ?? this.m_currentStaffDef.GetN();
    const upcoming = (this.m_upcomingScoreDef as any).GetStaffDef(n);
    if (!upcoming) throw new Error('ScoreDefSetCurrentFunctor::VisitClef: upcoming staffDef required.');
    upcoming.SetCurrentClef(target);
    (this.m_upcomingScoreDef as any).m_setAsDrawing = true;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitKeySig(keySig: AnyNode): FunctorCode {
    if (keySig.IsScoreDefElement?.()) return FunctorCode.FUNCTOR_CONTINUE;
    if (!this.m_currentStaffDef) throw new Error('ScoreDefSetCurrentFunctor::VisitKeySig: current staffDef required.');
    const upcoming = (this.m_upcomingScoreDef as any).GetStaffDef(this.m_currentStaffDef.GetN());
    if (!upcoming) throw new Error('ScoreDefSetCurrentFunctor::VisitKeySig: upcoming staffDef required.');
    upcoming.SetCurrentKeySig(keySig);
    (this.m_upcomingScoreDef as any).m_setAsDrawing = true;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: AnyNode): FunctorCode {
    const doc = this.GetDoc() as any;
    if (doc.GetType() !== DOC_TRANSCRIPTION) layer.SetDrawingStaffDefValues(this.m_currentStaffDef);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    const doc = this.GetDoc() as any;
    const showHidden = optBool(doc, 'm_showHidden');

    if (this.m_restart) {
      (this.m_upcomingScoreDef as any).SetRedrawFlags(StaffDefRedrawFlags.REDRAW_ALL);
    }

    let drawingFlags = 0;
    if (this.m_currentSystem) {
      drawingFlags |= SYSTEM_BREAK;
      if ((this.m_upcomingScoreDef as any).m_setAsDrawing && this.m_previousMeasure && !this.m_restart) {
        const cautionaryScoreDef = copyScoreDef(this.m_upcomingScoreDef);
        const setCautionary = new SetCautionaryScoreDefFunctor(cautionaryScoreDef);
        this.m_previousMeasure.Process(setCautionary);
      }
      (this.m_upcomingScoreDef as any).SetRedrawFlags(
        StaffDefRedrawFlags.REDRAW_CLEF | StaffDefRedrawFlags.REDRAW_KEYSIG);
      this.m_currentSystem.SetDrawingScoreDef(this.m_upcomingScoreDef);
      this.m_currentSystem.GetDrawingScoreDef().SetDrawLabels(this.m_drawLabels);
      this.m_currentSystem = null;
      this.m_drawLabels = false;
    }
    if ((this.m_upcomingScoreDef as any).m_setAsDrawing) {
      measure.SetDrawingScoreDef(this.m_upcomingScoreDef);
      this.m_currentScoreDef = measure.GetDrawingScoreDef();
      (this.m_upcomingScoreDef as any).SetRedrawFlags(StaffDefRedrawFlags.FORCE_REDRAW);
      (this.m_upcomingScoreDef as any).m_setAsDrawing = false;
    }
    this.m_drawLabels = false;

    if ((this.m_upcomingScoreDef as any).m_insertScoreDef) {
      drawingFlags |= SCORE_DEF_INSERT;
      (this.m_upcomingScoreDef as any).m_insertScoreDef = false;
    }

    const currentObjects: AnyNode[] = [];
    const previousObjects: AnyNode[] = [];
    const comparison = new AttVisibilityComparison();
    if (!showHidden) {
      measure.FindAllDescendantsByComparison(currentObjects, comparison);
    }
    if (currentObjects.length === measure.GetStaffCount()) {
      drawingFlags |= INVISIBLE_MEASURE_CURRENT;
    }
    if (!showHidden && this.m_previousMeasure) {
      this.m_previousMeasure.FindAllDescendantsByComparison(previousObjects, comparison);
      if (previousObjects.length === this.m_previousMeasure.GetStaffCount()) {
        drawingFlags |= INVISIBLE_MEASURE_PREVIOUS;
      }
    }

    measure.SetInvisibleStaffBarlines(this.m_previousMeasure, currentObjects, previousObjects, drawingFlags);
    measure.SetDrawingBarLines(this.m_previousMeasure, drawingFlags);

    this.m_previousMeasure = measure;
    this.m_restart = false;
    this.m_hasMeasure = true;

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMensur(mensur: AnyNode): FunctorCode {
    if (mensur.IsScoreDefElement?.()) return FunctorCode.FUNCTOR_CONTINUE;
    if (!this.m_currentStaffDef) throw new Error('ScoreDefSetCurrentFunctor::VisitMensur: current staffDef required.');
    const upcoming = (this.m_upcomingScoreDef as any).GetStaffDef(this.m_currentStaffDef.GetN());
    if (!upcoming) throw new Error('ScoreDefSetCurrentFunctor::VisitMensur: upcoming staffDef required.');
    upcoming.SetCurrentMensur(mensur);
    (this.m_upcomingScoreDef as any).m_setAsDrawing = true;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitOssia(ossia: AnyNode): FunctorCode {
    ossia.GetStavesAbove(this.m_ossiasAbove);
    ossia.GetStavesBelow(this.m_ossiasBelow);
    this.m_hasOssia = true;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPage(page: AnyNode): FunctorCode {
    if (!page.m_score) throw new Error('ScoreDefSetCurrentFunctor::VisitPage: page score required.');
    if (!page.m_score.GetScoreDef?.()) throw new Error('ScoreDefSetCurrentFunctor::VisitPage: scoreDef required.');
    if (!this.m_currentScore || this.m_currentScore !== page.m_score) {
      this.m_upcomingScoreDef = copyScoreDef(page.m_score.GetScoreDef());
      (this.m_upcomingScoreDef as any).Process(this);
    }
    page.m_drawingScoreDef = copyScoreDef(this.m_upcomingScoreDef);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitProport(proport: AnyNode): FunctorCode {
    if (proport.GetType?.() === 'cmme_tempo_change') return FunctorCode.FUNCTOR_SIBLINGS;
    if (!this.m_currentStaffDef) throw new Error('ScoreDefSetCurrentFunctor::VisitProport: current staffDef required.');
    const upcoming = (this.m_upcomingScoreDef as any).GetStaffDef(this.m_currentStaffDef.GetN());
    if (!upcoming) throw new Error('ScoreDefSetCurrentFunctor::VisitProport: upcoming staffDef required.');
    upcoming.SetCurrentProport(proport);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScore(score: AnyNode): FunctorCode {
    this.m_currentScore = score;
    this.m_upcomingScoreDef = copyScoreDef(score.GetScoreDef());
    (this.m_upcomingScoreDef as any).Process(this);
    (this.m_upcomingScoreDef as any).SetRedrawFlags(StaffDefRedrawFlags.REDRAW_ALL);
    this.m_drawLabels = true;
    this.m_currentScoreDef = null;
    this.m_currentStaffDef = null;
    this.m_previousMeasure = null;
    this.m_currentSystem = null;
    this.m_restart = false;
    this.m_hasMeasure = false;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: AnyNode): FunctorCode {
    if (scoreDef.HasClefInfo?.(UNLIMITED_DEPTH) || scoreDef.HasKeySigInfo?.(UNLIMITED_DEPTH)
      || scoreDef.HasMensurInfo?.(UNLIMITED_DEPTH) || scoreDef.HasMeterSigGrpInfo?.(UNLIMITED_DEPTH)
      || scoreDef.HasMeterSigInfo?.(UNLIMITED_DEPTH)) {
      (this.m_upcomingScoreDef as any).ReplaceDrawingValues(scoreDef);
      (this.m_upcomingScoreDef as any).m_insertScoreDef = true;
    }
    if (scoreDef.IsSectionRestart?.()) {
      this.m_drawLabels = true;
      this.m_restart = true;
      scoreDef.SetDrawLabels(this.m_hasMeasure);
      if (this.m_previousMeasure) {
        const cautionaryScoreDef = copyScoreDef(this.m_upcomingScoreDef);
        const restartStaffNs: number[] = scoreDef.GetStaffNs();
        const setCautionary = new SetCautionaryScoreDefFunctor(cautionaryScoreDef, true);
        setCautionary.SetRestartStaffNs(restartStaffNs);
        this.m_previousMeasure.Process(setCautionary);
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    if (staff.IsOssia?.()) return FunctorCode.FUNCTOR_SIBLINGS;

    this.m_currentStaffDef = this.m_currentScoreDef.GetStaffDef(staff.GetN());
    if (!this.m_currentStaffDef) throw new Error('ScoreDefSetCurrentFunctor::VisitStaff: current staffDef required.');
    if (staff.m_drawingStaffDef !== null && staff.m_drawingStaffDef !== undefined) {
      throw new Error('ScoreDefSetCurrentFunctor::VisitStaff: drawing staffDef must be null.');
    }
    staff.m_drawingStaffDef = this.m_currentStaffDef;
    if (staff.m_drawingTuning !== null && staff.m_drawingTuning !== undefined) {
      throw new Error('ScoreDefSetCurrentFunctor::VisitStaff: drawing tuning must be null.');
    }
    staff.m_drawingTuning = this.m_currentStaffDef.FindDescendantByType(ClassId.TUNING);
    staff.m_drawingLines = this.m_currentStaffDef.GetLines();
    staff.m_drawingNotationType = this.m_currentStaffDef.GetNotationtype();
    staff.m_drawingStaffSize = 100;
    if (this.m_currentStaffDef.HasScale?.()) {
      staff.m_drawingStaffSize = this.m_currentStaffDef.GetScale();
    }
    if (staff.IsTabLuteGerman?.()) {
      staff.m_drawingStaffSize *= GERMAN_TAB_STAFF_RATIO;
    }
    else if (staff.IsTablature?.()) {
      staff.m_drawingStaffSize *= TABLATURE_STAFF_RATIO;
    }
    const currentGrp = this.m_currentStaffDef.GetCurrentMeterSigGrp?.();
    if (currentGrp && currentGrp.GetFunc?.() === METERSIGGRP_FUNC_ALTERNATING) {
      const parentMeasure = staff.GetFirstAncestor?.(ClassId.MEASURE);
      if (parentMeasure) currentGrp.AddAlternatingMeasureToVector(parentMeasure);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffDef(staffDef: AnyNode): FunctorCode {
    (this.m_upcomingScoreDef as any).ReplaceDrawingValues(staffDef);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffGrp(staffGrp: AnyNode): FunctorCode {
    if (this.m_restart) {
      (this.m_upcomingScoreDef as any).ReplaceDrawingLabels(staffGrp);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    this.m_currentSystem = system;
    this.m_hasMeasure = false;
    this.m_ossiasAbove.clear();
    this.m_ossiasBelow.clear();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemEnd(system: AnyNode): FunctorCode {
    const scoreDef = system.GetDrawingScoreDef?.();
    if (scoreDef) {
      for (const [key, value] of this.m_ossiasAbove) {
        scoreDef.AddOssias(key, value, true);
      }
      for (const [key, value] of this.m_ossiasBelow) {
        scoreDef.AddOssias(key, value, false);
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// ScoreDefOptimizeFunctor
//----------------------------------------------------------------------------

export class ScoreDefOptimizeFunctor extends DocFunctor {
  private m_currentScoreDef: AnyNode = null;
  private m_encoded = false;
  private m_firstScoreDef = true;
  private m_hasFermata = false;
  private m_hasTempo = false;

  public constructor(doc: unknown) {
    super(doc as never);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    const doc = this.GetDoc() as any;
    if (!optBool(doc, 'm_condenseTempoPages')) return FunctorCode.FUNCTOR_CONTINUE;
    this.m_hasFermata = Boolean(measure.FindDescendantByType?.(ClassId.FERMATA));
    this.m_hasTempo = Boolean(measure.FindDescendantByType?.(ClassId.TEMPO));
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScore(_score: AnyNode): FunctorCode {
    this.m_currentScoreDef = null;
    this.m_encoded = false;
    this.m_firstScoreDef = true;
    this.m_hasFermata = false;
    this.m_hasTempo = false;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    if (!this.m_currentScoreDef) throw new Error('ScoreDefOptimizeFunctor::VisitStaff: current scoreDef required.');
    const staffDef = this.m_currentScoreDef.GetStaffDef(staff.GetN?.() ?? 0);
    if (!staffDef) {
      LogDebug('Could not find staffDef for staff (%d) when optimizing scoreDef', staff.GetN?.());
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (staff.FindDescendantByType?.(ClassId.CLEF)) {
      staffDef.SetDrawingVisibility(2);
    }
    if (this.m_hasFermata || this.m_hasTempo) {
      staffDef.SetDrawingVisibility(2);
    }
    if (staffDef.GetDrawingVisibility?.() === 2) return FunctorCode.FUNCTOR_SIBLINGS;
    staffDef.SetDrawingVisibility(1);
    // Collect non-empty layers (result intentionally unused, C++ parity).
    const layers: AnyNode[] = [];
    staff.FindAllDescendantsByComparison?.(layers, new NonEmptyLayerComparison());
    const note = staff.FindDescendantByType?.(ClassId.NOTE);
    if (note) {
      staffDef.SetDrawingVisibility(2);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitStaffGrpEnd(staffGrp: AnyNode): FunctorCode {
    staffGrp.SetDrawingVisibility(1);
    const instrDef = staffGrp.FindDescendantByType?.(ClassId.INSTRDEF, 1);
    if (instrDef) {
      const visible = new VisibleStaffDefOrGrpObject();
      const firstVisible = staffGrp.FindDescendantByComparison?.(visible, 1);
      if (firstVisible) {
        staffGrp.SetEverythingVisible?.();
      }
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    for (const child of staffGrp.GetChildren?.() ?? []) {
      const childId = child.GetClassId?.();
      if (childId === ClassId.STAFFDEF) {
        if (!child) throw new Error('ScoreDefOptimizeFunctor: staffDef required.');
        if (child.GetDrawingVisibility?.() !== 1) {
          staffGrp.SetDrawingVisibility(2);
          break;
        }
      }
      else if (childId === ClassId.STAFFGRP) {
        if (!child) throw new Error('ScoreDefOptimizeFunctor: staffGrp required.');
        if (child.GetDrawingVisibility?.() !== 1) {
          staffGrp.SetDrawingVisibility(2);
          break;
        }
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    const doc = this.GetDoc() as any;
    if (typeof system.SetDrawingOptimized === 'function') system.SetDrawingOptimized(true);
    else system.IsDrawingOptimized?.(true);
    if (this.m_firstScoreDef) {
      this.m_firstScoreDef = false;
      if (!optBool(doc, 'm_condenseFirstPage')) return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (system.IsLastOfMdiv?.()) {
      if (optBool(doc, 'm_condenseNotLastSystem')) return FunctorCode.FUNCTOR_SIBLINGS;
    }
    this.m_currentScoreDef = system.GetDrawingScoreDef?.() ?? null;
    if (!this.m_currentScoreDef) return FunctorCode.FUNCTOR_SIBLINGS;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemEnd(system: AnyNode): FunctorCode {
    this.m_currentScoreDef.Process(this);
    system.m_systemAligner.SetSpacing(this.m_currentScoreDef);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// SetCautionaryScoreDefFunctor
//----------------------------------------------------------------------------

export class SetCautionaryScoreDefFunctor extends Functor {
  private m_currentScoreDef: AnyNode;
  private m_currentStaffDef: AnyNode = null;
  private m_restart: boolean;
  private m_staffNs: number[] = [];

  public constructor(currentScoreDef: AnyNode, restart = false) {
    super();
    this.m_currentScoreDef = currentScoreDef;
    this.m_restart = restart;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public SetRestartStaffNs(staffNs: number[]): void { this.m_staffNs = staffNs; }

  public VisitLayer(layer: AnyNode): FunctorCode {
    layer.SetDrawingCautionValues(this.m_currentStaffDef);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    if (staff.IsOssia?.()) return FunctorCode.FUNCTOR_SIBLINGS;
    if (!this.m_currentScoreDef) throw new Error('SetCautionaryScoreDefFunctor::VisitStaff: current scoreDef required.');
    this.m_currentStaffDef = this.m_currentScoreDef.GetStaffDef(staff.GetN());
    if (this.m_restart) {
      if (this.m_staffNs.indexOf(staff.GetN()) === -1) {
        this.m_currentStaffDef.SetDrawKeySig(false);
      }
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// ScoreDefSetGrpSymFunctor
//----------------------------------------------------------------------------

export class ScoreDefSetGrpSymFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitGrpSym(grpSym: AnyNode): FunctorCode {
    const parent = grpSym.GetParent?.();
    const parentId = parent?.GetClassId?.();
    if (parentId === ClassId.STAFFGRP) {
      const staffGrp = parent;
      if (!staffGrp) throw new Error('ScoreDefSetGrpSymFunctor: staffGrp required.');
      const [firstDef, lastDef] = staffGrp.GetFirstLastStaffDef();
      if (firstDef && lastDef) {
        grpSym.SetStartDef(firstDef);
        grpSym.SetEndDef(lastDef);
        staffGrp.SetGroupSymbol(grpSym);
      }
    }
    else if (parentId === ClassId.SCOREDEF) {
      const scoreDef = parent;
      if (!scoreDef) throw new Error('ScoreDefSetGrpSymFunctor: scoreDef required.');
      const startId = ExtractIDFragment(grpSym.GetStartid());
      const endId = ExtractIDFragment(grpSym.GetEndid());
      const level = grpSym.GetLevel();
      const compare = new StaffDefIDComparison(startId);
      const start = scoreDef.FindDescendantByComparison(compare, level);
      compare.SetID(endId);
      const end = scoreDef.FindDescendantByComparison(compare, level);
      if (!start || !end) {
        LogWarning("Could not find startid/endid on level %d for '%s'", level, grpSym.GetID());
        return FunctorCode.FUNCTOR_CONTINUE;
      }
      if (start.GetParent() !== end.GetParent()) {
        LogWarning("'%s' has mismatching parents for startid:%s and endid:%s", grpSym.GetID(), startId, endId);
        return FunctorCode.FUNCTOR_CONTINUE;
      }
      grpSym.SetStartDef(start);
      grpSym.SetEndDef(end);
      const staffGrp = start.GetParent();
      if (!staffGrp) throw new Error('ScoreDefSetGrpSymFunctor: staffGrp parent required.');
      staffGrp.SetGroupSymbol(grpSym);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    const drawingScoreDef = system.GetDrawingScoreDef?.();
    if (drawingScoreDef) drawingScoreDef.Process(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// ScoreDefSetOssiaFunctor
//----------------------------------------------------------------------------

export interface CurrentOssia {
  m_ossia: AnyNode;
  m_staffDefs: Map<number, AnyNode>;
}

export class ScoreDefSetOssiaFunctor extends DocFunctor {
  private m_currentOssias: CurrentOssia[] = [];
  private m_previousOssias: CurrentOssia[] = [];
  private m_upcomingStaffDef: StaffDef = new StaffDef();
  private m_currentScoreDef: AnyNode = null;
  private m_currentStaffDef: AnyNode = null;
  private m_layerOssiaStaffDef = false;
  private m_isFirstMeasure = true;

  public constructor(doc: unknown) {
    super(doc as never);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  private GetPreviousStaffDef(ossia: AnyNode, staffN: number): AnyNode | null {
    const current: number[] = ossia.GetOStaffNs();
    const it = this.m_previousOssias.find((previous) => {
      const prevNs: number[] = previous.m_ossia.GetOStaffNs();
      return prevNs.length === current.length && prevNs.every((v, i) => v === current[i]);
    });
    if (!it) return null;
    for (const [n, s] of it.m_staffDefs) {
      if (n === staffN) return s;
    }
    return null;
  }

  public VisitClef(clef: AnyNode): FunctorCode {
    let target = clef;
    const linked = clef.ThisOrSameasLink?.();
    if (linked) {
      if (!linked.Is?.(ClassId.CLEF)) {
        const isClef = typeof linked.GetClassId === 'function' && linked.GetClassId() === ClassId.CLEF;
        if (!isClef) return FunctorCode.FUNCTOR_CONTINUE;
      }
      target = linked;
    }
    if (target.IsScoreDefElement?.()) return FunctorCode.FUNCTOR_CONTINUE;
    (this.m_upcomingStaffDef as any).SetCurrentClef(target);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: AnyNode): FunctorCode {
    layer.SetDrawingStaffDefValues(this.m_currentStaffDef);
    if (this.m_layerOssiaStaffDef) {
      layer.SetDrawOssiaStaffDef(true);
    }
    this.m_layerOssiaStaffDef = false;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(_measure: AnyNode): FunctorCode {
    this.m_currentOssias.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(_measure: AnyNode): FunctorCode {
    this.m_previousOssias = this.m_currentOssias.map((o) => ({ m_ossia: o.m_ossia, m_staffDefs: new Map(o.m_staffDefs) }));
    this.m_isFirstMeasure = false;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitOssia(ossia: AnyNode): FunctorCode {
    const currentOssia: CurrentOssia = { m_ossia: ossia, m_staffDefs: new Map() };
    this.m_currentOssias.unshift(currentOssia);

    const current: number[] = ossia.GetOStaffNs();
    const it = this.m_previousOssias.find((previous) => {
      const prevNs: number[] = previous.m_ossia.GetOStaffNs();
      return prevNs.length === current.length && prevNs.every((v, i) => v === current[i]);
    });
    if (it && !this.m_isFirstMeasure) {
      it.m_ossia.SetLast(false);
      ossia.SetFirst(false);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    if (!staff.IsOssia?.() || staff.IsHidden?.()) return FunctorCode.FUNCTOR_SIBLINGS;
    if (this.m_currentOssias.length === 0) throw new Error('ScoreDefSetOssiaFunctor::VisitStaff: current ossia required.');
    const currentOssia = this.m_currentOssias[0];
    if (!currentOssia || !currentOssia.m_ossia) throw new Error('ScoreDefSetOssiaFunctor::VisitStaff: ossia required.');
    const originalStaff = currentOssia.m_ossia.GetOriginalStaffForOssia(staff);
    if (!originalStaff) throw new Error('ScoreDefSetOssiaFunctor::VisitStaff: original staff required.');

    if (currentOssia.m_ossia.HasMultipleOStaves?.()) {
      if (!this.m_currentScoreDef) throw new Error('ScoreDefSetOssiaFunctor::VisitStaff: current scoreDef required.');
      const originalStaffDef = this.m_currentScoreDef.GetStaffDef(originalStaff.GetN());
      const staffGrp = originalStaffDef ? originalStaffDef.GetParent?.() : null;
      if (staffGrp && staffGrp.GetBarThru?.() === BOOLEAN_TRUE) {
        currentOssia.m_ossia.GetDrawingStaffGrp().SetBarThru(BOOLEAN_TRUE);
      }
    }

    this.m_currentStaffDef = new StaffDef();

    const prevDef = this.GetPreviousStaffDef(currentOssia.m_ossia, staff.GetN());
    if (prevDef) {
      (this.m_currentStaffDef as any).AssignFrom(prevDef);
    }
    else {
      (this.m_currentStaffDef as any).AssignFrom(originalStaff.m_drawingStaffDef);
      this.m_currentStaffDef.SetN(staff.GetN());
    }
    (this.m_upcomingStaffDef as any).AssignFrom(this.m_currentStaffDef);

    currentOssia.m_ossia.AddDrawingStaffDef(this.m_currentStaffDef);

    const showScoreDef = currentOssia.m_ossia.DrawScoreDef?.() && currentOssia.m_ossia.IsFirst?.();
    if (showScoreDef) {
      let hasValues = false;
      const firstLayer = originalStaff.FindDescendantByType?.(ClassId.LAYER);
      if (firstLayer) {
        hasValues = firstLayer.GetDrawingStaffDefValues(this.m_currentStaffDef);
      }
      if (!hasValues) {
        this.m_layerOssiaStaffDef = true;
        this.m_currentStaffDef.SetDrawClef(true);
        this.m_currentStaffDef.SetDrawKeySig(true);
      }
    }

    if (!this.m_currentStaffDef) throw new Error('ScoreDefSetOssiaFunctor::VisitStaff: staffDef required.');
    if (staff.m_drawingStaffDef !== null && staff.m_drawingStaffDef !== undefined) {
      throw new Error('ScoreDefSetOssiaFunctor::VisitStaff: drawing staffDef must be null.');
    }
    staff.m_drawingStaffDef = this.m_currentStaffDef;
    if (staff.m_drawingTuning !== null && staff.m_drawingTuning !== undefined) {
      throw new Error('ScoreDefSetOssiaFunctor::VisitStaff: drawing tuning must be null.');
    }
    staff.m_drawingTuning = (this.m_currentStaffDef as any).FindDescendantByType(ClassId.TUNING);
    staff.m_drawingLines = (this.m_currentStaffDef as any).GetLines();
    staff.m_drawingNotationType = this.m_currentStaffDef.GetNotationtype();
    staff.m_drawingStaffSize = 100;
    if (this.m_currentStaffDef.HasScale?.()) {
      staff.m_drawingStaffSize = this.m_currentStaffDef.GetScale();
    }
    const doc = this.GetDoc() as any;
    staff.m_drawingStaffSize *= optDbl(doc, 'm_ossiaStaffSize');

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaffEnd(staff: AnyNode): FunctorCode {
    if (!staff.IsOssia?.()) return FunctorCode.FUNCTOR_SIBLINGS;
    if (this.m_currentOssias.length === 0) throw new Error('ScoreDefSetOssiaFunctor::VisitStaffEnd: current ossia required.');
    const currentOssia = this.m_currentOssias[0];
    if (!currentOssia || !currentOssia.m_ossia) throw new Error('ScoreDefSetOssiaFunctor::VisitStaffEnd: ossia required.');
    currentOssia.m_staffDefs.set(staff.GetN(), copyStaffDef(this.m_upcomingStaffDef));
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    this.m_currentScoreDef = system.GetDrawingScoreDef?.() ?? null;
    this.m_layerOssiaStaffDef = false;
    this.m_isFirstMeasure = true;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// ScoreDefUnsetCurrentFunctor
//----------------------------------------------------------------------------

export class ScoreDefUnsetCurrentFunctor extends Functor {
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitAlignmentReference(alignmentReference: AnyNode): FunctorCode {
    const alignment = alignmentReference.GetParent?.();
    if (!alignment) throw new Error('ScoreDefUnsetCurrentFunctor: alignment parent required.');
    switch (alignment.GetType?.()) {
      case AlignmentType.ALIGNMENT_SCOREDEF_OSSIA_CLEF:
      case AlignmentType.ALIGNMENT_SCOREDEF_OSSIA_KEYSIG:
      case AlignmentType.ALIGNMENT_SCOREDEF_CLEF:
      case AlignmentType.ALIGNMENT_SCOREDEF_KEYSIG:
      case AlignmentType.ALIGNMENT_SCOREDEF_MENSUR:
      case AlignmentType.ALIGNMENT_SCOREDEF_METERSIG:
      case AlignmentType.ALIGNMENT_SCOREDEF_CAUTION_CLEF:
      case AlignmentType.ALIGNMENT_SCOREDEF_CAUTION_KEYSIG:
      case AlignmentType.ALIGNMENT_SCOREDEF_CAUTION_MENSUR:
      case AlignmentType.ALIGNMENT_SCOREDEF_CAUTION_METERSIG:
        alignmentReference.ClearChildren();
        break;
      default:
        break;
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitKeySig(keySig: AnyNode): FunctorCode {
    keySig.ResetDrawingClef();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayer(layer: AnyNode): FunctorCode {
    layer.ResetStaffDefObjects();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AnyNode): FunctorCode {
    measure.ResetDrawingScoreDef();
    measure.m_measureAligner.Process(this);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitOssia(ossia: AnyNode): FunctorCode {
    ossia.ResetDrawingStaffGrp();
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitPage(page: AnyNode): FunctorCode {
    page.m_score = null;
    page.m_scoreEnd = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AnyNode): FunctorCode {
    staff.m_drawingStaffDef = null;
    staff.m_drawingTuning = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AnyNode): FunctorCode {
    system.ResetDrawingScoreDef();
    if (typeof system.SetDrawingOptimized === 'function') system.SetDrawingOptimized(false);
    else system.IsDrawingOptimized(false);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// SetStaffDefRedrawFlagsFunctor
//----------------------------------------------------------------------------

export class SetStaffDefRedrawFlagsFunctor extends Functor {
  private m_redrawFlags: number;

  public constructor(redrawFlags: number) {
    super();
    this.m_redrawFlags = redrawFlags;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitStaffDef(staffDef: AnyNode): FunctorCode {
    const forceRedraw = (this.m_redrawFlags & StaffDefRedrawFlags.FORCE_REDRAW) !== 0;
    const redrawClef = (this.m_redrawFlags & StaffDefRedrawFlags.REDRAW_CLEF) !== 0;
    if (redrawClef || forceRedraw) {
      staffDef.SetDrawClef(redrawClef);
    }
    const redrawKeySig = (this.m_redrawFlags & StaffDefRedrawFlags.REDRAW_KEYSIG) !== 0;
    if (redrawKeySig || forceRedraw) {
      staffDef.SetDrawKeySig(redrawKeySig);
    }
    const redrawMensur = (this.m_redrawFlags & StaffDefRedrawFlags.REDRAW_MENSUR) !== 0;
    if (redrawMensur || forceRedraw) {
      staffDef.SetDrawMensur(redrawMensur);
    }
    const redrawMeterSig = (this.m_redrawFlags & StaffDefRedrawFlags.REDRAW_METERSIG) !== 0;
    if (redrawMeterSig || forceRedraw) {
      staffDef.SetDrawMeterSig(redrawMeterSig);
    }
    const redrawMeterSigGrp = (this.m_redrawFlags & StaffDefRedrawFlags.REDRAW_METERSIGGRP) !== 0;
    if (redrawMeterSigGrp || forceRedraw) {
      staffDef.SetDrawMeterSigGrp(redrawMeterSigGrp);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

// Re-export canonical comparison used by doc.ts (avoids duplicating comparison.cpp).
export { ClassIdComparison };
