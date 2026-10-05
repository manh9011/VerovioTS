/**
 * Pure TypeScript translation of Verovio's src/adjusttempofunctor.cpp.
 *
 * Control flow and the per-staff X-position adjustment semantics intentionally
 * mirror the canonical C++ implementation. Native/layout collaborators that
 * are not yet migrated are represented by structural contracts only.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';
import { Comparison, MeasureAlignerTypeComparison } from './comparison.js';

export interface TempoStartLike {
  GetDrawingX(): number;
  GetAlignment(): TempoAlignmentLike;
}

export interface TempoAlignmentLike {
  GetXRel(): number;
  GetLeftRight(staffN: number, left: { value: number }, right: { value: number }): void;
}

export interface TempoStaffLike {
  GetN(): number;
}

export interface TempoPositionerLike {
  GetAlignment(): { GetStaff(): TempoStaffLike };
}

export interface TempoSystemAlignerLike {
  FindAllPositionerPointingTo(out: TempoPositionerLike[], object: TempoLike): void;
}

export interface TempoMeasureAlignerLike {
  FindDescendantByComparison(comparison: TempoAlignmentComparisonLike, depth: number): TempoAlignmentLike | null;
}

export interface TempoMeasureLike {
  m_measureAligner: TempoMeasureAlignerLike;
  GetDrawingX(): number;
}

export interface TempoLike {
  GetStart(): TempoStartLike;
  HasStartid(): boolean;
  GetTstamp(): number;
  GetFirstAncestor(classId: ClassId): TempoMeasureLike | null;
  SetDrawingXRelative(staffN: number, drawingX: number): void;
}

export interface TempoSystemLike {
  m_systemAligner: TempoSystemAlignerLike;
}

export interface TempoAlignmentComparisonLike {
  GetType?(): number;
  matches?(object: unknown): boolean;
}

/** Canonical alignment type used by MeasureAlignerTypeComparison. */
export const ALIGNMENT_SCOREDEF_METERSIG = 4;

// MeasureAlignerTypeComparison is imported from comparison.js (canonical C++
// port, extends Comparison) so FindByComparisonFunctor accepts it. A local
// structural stub fails the `instanceof Comparison` check in findfunctor.ts
// evaluateComparison and silently matches nothing (pass-511, 31c tempo x).

export class AdjustTempoFunctor extends DocFunctor {
  private m_systemAligner: TempoSystemAlignerLike | null = null;

  public constructor(doc: unknown) {
    super(doc);
    this.m_systemAligner = null;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitSystem(system: TempoSystemLike): FunctorCode {
    this.m_systemAligner = system.m_systemAligner;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitTempo(tempo: TempoLike): FunctorCode {
    if (!this.m_systemAligner) {
      throw new Error('AdjustTempoFunctor: system aligner invariant violated');
    }

    // Get all the positioners for this object - all of them (all staves)
    // because we can have different staff sizes.
    const positioners: TempoPositionerLike[] = [];
    this.m_systemAligner.FindAllPositionerPointingTo(positioners, tempo);

    if (positioners.length === 0) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const measure = tempo.GetFirstAncestor(ClassId.MEASURE);
    if (!measure) {
      throw new Error('AdjustTempoFunctor: Tempo must have a Measure ancestor');
    }

    const alignmentComparison = new MeasureAlignerTypeComparison(ALIGNMENT_SCOREDEF_METERSIG);
    const pos = measure.m_measureAligner.FindDescendantByComparison(alignmentComparison, 1);

    for (const positioner of positioners) {
      let left: number;
      let right = 0;
      const start = tempo.GetStart().GetDrawingX();
      const staffN = positioner.GetAlignment().GetStaff().GetN();

      if (!tempo.HasStartid() && tempo.GetTstamp() <= 1 && pos) {
        left = measure.GetDrawingX() + pos.GetXRel();
      }
      else {
        const align = tempo.GetStart().GetAlignment();
        const holder = { value: 0 };
        const rightHolder = { value: 0 };
        align.GetLeftRight(staffN, holder, rightHolder);
        left = holder.value;
        right = rightHolder.value;
      }

      // C++ compares abs(left) with abs(VRV_UNSET), rather than checking for
      // equality. Preserve that exact sentinel condition.
      if (Math.abs(left) !== Math.abs(VRV_UNSET)) {
        tempo.SetDrawingXRelative(staffN, left - start);
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
