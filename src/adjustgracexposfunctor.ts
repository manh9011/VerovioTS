/**
 * Pure TypeScript translation of Verovio's src/adjustgracexposfunctor.cpp.
 *
 * Control flow, sentinel handling, traversal direction and mutation order follow
 * the canonical C++ implementation. Unmigrated layout/tree collaborators remain
 * explicit structural contracts; no native/WebAssembly runtime is used.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode, BACKWARD, FORWARD, VRV_UNSET } from './vrvdef.js';
import { Filters, AttNIntegerComparison } from './comparison.js';

export const ALIGNMENT_REFERENCE = ClassId.ALIGNMENT_REFERENCE;
export const ALIGNMENT_DEFAULT = 21;
export const ALIGNMENT_GRACENOTE = 18;
export const ACCID = ClassId.ACCID;
export const NOTE = ClassId.NOTE;
export const MEASURE_ALIGNER = ClassId.MEASURE_ALIGNER;
export const BARLINE_REFERENCES = -1;

export interface GraceXDocLike {
  GetOptions(): {
    m_graceRhythmAlign: { GetValue(): boolean };
    m_tieMinLength: { GetValue(): number };
  };
  GetDrawingUnit(value: number): number;
  GetLeftMargin(target: unknown): number;
  GetCueSize(value: number): number;
}

export interface GraceXAlignmentLike {
  GetType(): number;
  GetXRel(): number;
  SetXRel(value: number): void;
  GetGraceAligners(): unknown;
  HasGraceAligner(id: number): boolean;
  GetGraceAligner(id: number): GraceXGraceAlignerLike;
  GetFirstAncestor(classId: ClassId): unknown;
  GetLeftRight(staffN: number | number[], minLeftOut: { value: number }, maxRightOut: { value: number }, exclude?: ClassId[]): void;
  HasAccidVerticalOverlap(other: GraceXAlignmentLike, id: number): boolean;
}

export interface GraceXGraceAlignerLike {
  GetLast(classId: ClassId | number): unknown;
  Process(functor: unknown): void;
}

export interface GraceXAlignmentReferenceLike {
  GetChildren(): Array<{ Process(functor: unknown): void }>;
}

export interface GraceXMeasureAlignerLike {
  Process(functor: unknown): void;
  GetRightBarLineAlignment(): GraceXAlignmentLike | null;
}

export interface GraceXMeasureLike {
  m_measureAligner: GraceXMeasureAlignerLike;
  GetInternalTieEndpoints(): Array<[GraceXLayerElementLike, GraceXLayerElementLike]>;
}

export interface GraceXLayerElementLike {
  IsScoreDefElement(): boolean;
  ResetCachedDrawingX(): void;
  HasGraceAlignment(): boolean;
  HasSelfBB(): boolean;
  HasEmptyBB(): boolean;
  GetSelfRight(): number;
  GetSelfLeft(): number;
  GetGraceAlignment(): GraceXAlignmentLike;
}

export interface GraceXSystemLike {
  GetDrawingScoreDef(): { GetStaffNs(): number[] } | null;
}

export interface GraceXPairLike { first: GraceXLayerElementLike; second: GraceXLayerElementLike; }

function classIdOf(value: unknown): ClassId | number | undefined {
  const object = value as { GetClassId?: () => ClassId | number; classId?: ClassId | number } | null;
  if (!object) return undefined;
  return typeof object.GetClassId === 'function' ? object.GetClassId() : object.classId;
}

export class AdjustGraceXPosFunctor extends DocFunctor {
  private m_staffNs: number[] = [];
  private m_graceMaxPos = 0;
  private m_graceUpcomingMaxPos = -VRV_UNSET;
  private m_graceCumulatedXShift = 0;
  private m_isGraceAlignment = false;
  private m_measureTieEndpoints: Array<[GraceXLayerElementLike, GraceXLayerElementLike]> = [];
  private m_rightDefaultAlignment: GraceXAlignmentLike | null = null;

  public constructor(doc: GraceXDocLike) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitAlignment(alignment: GraceXAlignmentLike): FunctorCode {
    if (!this.m_isGraceAlignment) {
      const graceAligners = alignment.GetGraceAligners() as { empty?: () => boolean; size?: number; length?: number } | null | undefined;
      const empty = typeof graceAligners?.empty === 'function'
        ? graceAligners.empty()
        : ((graceAligners?.size ?? graceAligners?.length ?? 0) === 0);
      if (empty) {
        if (alignment.GetType() === ALIGNMENT_DEFAULT) this.m_rightDefaultAlignment = alignment;
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
      if (alignment.GetType() !== ALIGNMENT_GRACENOTE) throw new Error('AdjustGraceXPosFunctor: expected grace-note alignment');

      this.m_isGraceAlignment = true;
      const measureAligner = alignment.GetFirstAncestor(MEASURE_ALIGNER) as GraceXMeasureAlignerLike | null;
      if (!measureAligner) throw new Error('AdjustGraceXPosFunctor: measure aligner invariant violated');

      const previousDirection = this.SetDirection(BACKWARD);
      const filters = new Filters();
      const previousFilters = this.SetFilters(filters);

      for (const n of this.m_staffNs) {
        const graceAlignerId = this.m_doc.GetOptions().m_graceRhythmAlign.GetValue() ? 0 : n;
        const exclude: ClassId[] = [];
        if (alignment.HasGraceAligner(graceAlignerId) && this.m_rightDefaultAlignment) {
          const graceAligner = alignment.GetGraceAligner(graceAlignerId);
          const last = graceAligner.GetLast(ClassId.ALIGNMENT) as GraceXAlignmentLike | null;
          if (last && !last.HasAccidVerticalOverlap(this.m_rightDefaultAlignment, graceAlignerId)) exclude.push(ACCID);
        }

        let graceMaxPos = alignment.GetXRel() - this.m_doc.GetDrawingUnit(100);
        const minLeftBox = { value: 0 };
        const maxRightBox = { value: 0 };
        if (this.m_rightDefaultAlignment) {
          this.m_rightDefaultAlignment.GetLeftRight(n, minLeftBox, maxRightBox, exclude);
          if (minLeftBox.value !== -VRV_UNSET) graceMaxPos = minLeftBox.value - this.m_doc.GetLeftMargin(NOTE) * this.m_doc.GetDrawingUnit(75);
        } else {
          const bar = measureAligner.GetRightBarLineAlignment();
          if (!bar) throw new Error('AdjustGraceXPosFunctor: right barline alignment invariant violated');
          bar.GetLeftRight(BARLINE_REFERENCES, minLeftBox, maxRightBox, exclude);
          if (minLeftBox.value !== -VRV_UNSET) graceMaxPos = minLeftBox.value - this.m_doc.GetLeftMargin(NOTE) * this.m_doc.GetDrawingUnit(75);
        }

        this.m_graceMaxPos = graceMaxPos;
        this.m_graceUpcomingMaxPos = -VRV_UNSET;
        this.m_graceCumulatedXShift = VRV_UNSET;
        filters.Clear();
        filters.Add(new AttNIntegerComparison(ClassId.ALIGNMENT_REFERENCE, n));
        if (alignment.HasGraceAligner(graceAlignerId)) {
          alignment.GetGraceAligner(graceAlignerId).Process(this);
          if (this.m_graceCumulatedXShift === VRV_UNSET) continue;
          (measureAligner as GraceXMeasureAlignerLike & { AdjustGraceNoteSpacing?: (doc: unknown, a: GraceXAlignmentLike, n: number) => void }).AdjustGraceNoteSpacing?.(this.m_doc, alignment, n);
        }
      }

      this.SetDirection(previousDirection);
      this.SetFilters(previousFilters);
      this.m_isGraceAlignment = false;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (this.m_graceCumulatedXShift !== VRV_UNSET) alignment.SetXRel(alignment.GetXRel() + this.m_graceCumulatedXShift);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitAlignmentEnd(_alignment: GraceXAlignmentLike): FunctorCode {
    if (this.m_graceUpcomingMaxPos !== -VRV_UNSET) {
      this.m_graceMaxPos = this.m_graceUpcomingMaxPos;
      this.m_graceUpcomingMaxPos = -VRV_UNSET;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitAlignmentReference(alignmentReference: GraceXAlignmentReferenceLike): FunctorCode {
    const previousDirection = this.SetDirection(FORWARD);
    const previousFilters = this.SetFilters(null);
    for (const child of alignmentReference.GetChildren()) child.Process(this);
    this.SetDirection(previousDirection);
    this.SetFilters(previousFilters);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitLayerElement(layerElement: GraceXLayerElementLike): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;
    if (this.m_graceCumulatedXShift === VRV_UNSET) this.m_graceCumulatedXShift = 0;
    layerElement.ResetCachedDrawingX();
    if (!layerElement.HasGraceAlignment()) return FunctorCode.FUNCTOR_SIBLINGS;
    if (!layerElement.HasSelfBB() || layerElement.HasEmptyBB()) return FunctorCode.FUNCTOR_SIBLINGS;

    const selfRight = layerElement.GetSelfRight();
    const offset = selfRight - this.m_graceMaxPos;
    if (offset > 0) {
      const graceAlignment = layerElement.GetGraceAlignment();
      graceAlignment.SetXRel(graceAlignment.GetXRel() - offset);
      this.m_graceCumulatedXShift += -offset;
      this.m_graceUpcomingMaxPos += -offset;
    }

    const selfLeft = layerElement.GetSelfLeft() - this.m_doc.GetLeftMargin(layerElement) * this.m_doc.GetDrawingUnit(this.m_doc.GetCueSize(100));
    this.m_graceUpcomingMaxPos = Math.min(selfLeft, this.m_graceUpcomingMaxPos);

    const tie = this.m_measureTieEndpoints.find((pair) => pair[0] === layerElement);
    if (tie && this.m_rightDefaultAlignment) {
      const unit = this.m_doc.GetDrawingUnit(100);
      const minTieLength = this.m_doc.GetOptions().m_tieMinLength.GetValue() * unit;
      const diff = this.m_rightDefaultAlignment.GetXRel() - layerElement.GetSelfRight();
      if (diff < (minTieLength + unit)) this.m_graceMaxPos -= (unit + minTieLength - diff);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: GraceXMeasureLike): FunctorCode {
    const ma = measure.m_measureAligner as GraceXMeasureAlignerLike & { PushAlignmentsRight?: () => void };
    ma.PushAlignmentsRight?.();
    this.m_rightDefaultAlignment = null;
    const previousDirection = this.SetDirection(BACKWARD);
    measure.m_measureAligner.Process(this);

    const reversed = [...this.m_staffNs].reverse();
    ma.PushAlignmentsRight?.();
    this.m_rightDefaultAlignment = null;
    this.m_staffNs = reversed;
    this.m_measureTieEndpoints = measure.GetInternalTieEndpoints();
    measure.m_measureAligner.Process(this);
    this.SetDirection(previousDirection);
    // caller-owned staff list restored, matching C++.
    this.m_staffNs = [...reversed].reverse();
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: GraceXSystemLike): FunctorCode {
    const scoreDef = system.GetDrawingScoreDef();
    if (scoreDef) this.m_staffNs = scoreDef.GetStaffNs();
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
