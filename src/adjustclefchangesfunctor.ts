/**
 * Pure TypeScript translation of Verovio's src/adjustclefchangesfunctor.cpp.
 *
 * The native/layout dependencies remain structural contracts until their canonical
 * translations are available. Control flow, ordering, sentinel handling and
 * proportional-adjustment semantics mirror the C++ implementation.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';

export const ALIGNMENT_CLEF = 10;
export const ALIGNMENT_GRACENOTE = 18;
export const ALIGNMENT_REFERENCE = ClassId.ALIGNMENT_REFERENCE;
export const BARLINE_REFERENCES = -1;

export interface AdjustClefDocLike {
  GetOptions(): { m_graceRhythmAlign: { GetValue(): boolean } };
  GetDrawingUnit(staffSize: number): number;
  GetRightMargin(target: unknown): number;
  GetLeftMargin(target: unknown): number;
}

export interface AdjustClefStaffLike {
  m_drawingStaffSize: number;
  GetN(): number;
}

export interface AdjustClefGraceAlignerLike {
  GetGraceGroupLeft(staffN: number): number;
}

export interface AdjustClefAlignmentLike {
  GetType(): number;
  GetXRel(): number;
  SetXRel(value: number): void;
  HasGraceAligner(id: number): boolean;
  GetGraceAligner(id: number): AdjustClefGraceAlignerLike;
  GetLeftRight(ns: number[], left: { value: number }, right: { value: number }): void;
  GetParent(): AdjustClefAlignmentLike | null;
}

export interface AdjustClefMeasureAlignerLike {
  GetNextOf(child: AdjustClefAlignmentLike): AdjustClefAlignmentLike | null;
  FindNextChild(comparison: (object: unknown) => boolean, start: AdjustClefAlignmentLike): AdjustClefObjectLike | null;
  FindPreviousChild(comparison: (object: unknown) => boolean, start: AdjustClefAlignmentLike): AdjustClefObjectLike | null;
  AdjustProportionally(boundaries: Array<[AdjustClefAlignmentLike, AdjustClefAlignmentLike, number]>): void;
}

export interface AdjustClefObjectLike {
  GetParent(): AdjustClefAlignmentLike | null;
  GetN?(): number;
  GetClassId?(): ClassId | number;
}

export interface AdjustClefLike {
  IsScoreDefElement(): boolean;
  GetAlignment(): AdjustClefAlignmentLike | null;
  HasContentBB(): boolean;
  GetAncestorStaff(): AdjustClefStaffLike | null;
  m_crossStaff: { GetN(): number } | null;
  GetContentRight(): number;
  GetContentLeft(): number;
  GetDrawingXRel(): number;
  SetDrawingXRel(value: number): void;
}

export interface AdjustClefMeasureLike {
  m_measureAligner: AdjustClefMeasureAlignerLike;
}

function makeStaffComparison(ns: number[]): (object: unknown) => boolean {
  return (object: unknown): boolean => {
    const candidate = object as AdjustClefObjectLike;
    if (candidate.GetClassId?.() !== ALIGNMENT_REFERENCE) return false;
    const n = candidate.GetN?.();
    return n !== undefined && ns.includes(n);
  };
}

export class AdjustClefChangesFunctor extends DocFunctor {
  private m_aligner: AdjustClefMeasureAlignerLike | null = null;

  public constructor(doc: AdjustClefDocLike) {
    super(doc);
    this.m_aligner = null;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitClef(clef: AdjustClefLike): FunctorCode {
    if (clef.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    const alignment = clef.GetAlignment();
    if (!alignment) throw new Error('AdjustClefChangesFunctor: clef alignment invariant violated');
    if (alignment.GetType() !== ALIGNMENT_CLEF) return FunctorCode.FUNCTOR_CONTINUE;
    if (!clef.HasContentBB()) return FunctorCode.FUNCTOR_CONTINUE;
    if (!this.m_aligner) throw new Error('AdjustClefChangesFunctor: measure aligner invariant violated');

    const staff = clef.GetAncestorStaff();
    if (!staff) throw new Error('AdjustClefChangesFunctor: ancestor staff invariant violated');

    const ns = [BARLINE_REFERENCES, clef.m_crossStaff ? clef.m_crossStaff.GetN() : staff.GetN()];
    const matchStaff = makeStaffComparison(ns);

    let graceAligner: AdjustClefGraceAlignerLike | null = null;
    // C++ m_aligner->GetNext(clef->GetAlignment()) is child-relative (object.h:392);
    // the TS iterator GetNext() takes no argument, so use GetNextOf.
    let nextAlignment = this.m_aligner.GetNextOf(alignment) as AdjustClefAlignmentLike | null;
    if (nextAlignment && nextAlignment.GetType() === ALIGNMENT_GRACENOTE) {
      const graceAlignerId = (this.m_doc as AdjustClefDocLike).GetOptions().m_graceRhythmAlign.GetValue() ? 0 : staff.GetN();
      if (nextAlignment.HasGraceAligner(graceAlignerId)) {
        graceAligner = nextAlignment.GetGraceAligner(graceAlignerId);
      }
    }

    if (!graceAligner) {
      nextAlignment = null;
      const next = this.m_aligner.FindNextChild(matchStaff, this.m_aligner.GetNextOf(alignment) as AdjustClefAlignmentLike);
      if (next) {
        nextAlignment = next.GetParent();
        if (!nextAlignment) throw new Error('AdjustClefChangesFunctor: next alignment parent invariant violated');
      }
    }

    let previousAlignment: AdjustClefAlignmentLike | null = null;
    const previous = this.m_aligner.FindPreviousChild(matchStaff, alignment);
    if (previous) {
      previousAlignment = previous.GetParent();
      if (!previousAlignment) throw new Error('AdjustClefChangesFunctor: previous alignment parent invariant violated');
    }

    if (!previousAlignment || !nextAlignment) return FunctorCode.FUNCTOR_CONTINUE;

    alignment.SetXRel(nextAlignment.GetXRel());

    const previousLeft = { value: 0 };
    const previousRight = { value: 0 };
    previousAlignment.GetLeftRight(ns, previousLeft, previousRight);
    let prevRight = previousRight.value;
    if (prevRight === VRV_UNSET) prevRight = previousAlignment.GetXRel();

    const nextLeftRef = { value: 0 };
    const nextRightRef = { value: 0 };
    let nextLeft: number;
    if (graceAligner) {
      nextLeft = graceAligner.GetGraceGroupLeft(staff.GetN());
    } else {
      nextAlignment.GetLeftRight(ns, nextLeftRef, nextRightRef);
      nextLeft = nextLeftRef.value;
    }
    if (nextLeft === -VRV_UNSET) nextLeft = nextAlignment.GetXRel();

    const doc = this.m_doc as AdjustClefDocLike;
    const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);
    const selfRight = clef.GetContentRight() + doc.GetRightMargin(clef) * unit;
    if (selfRight > nextLeft) {
      clef.SetDrawingXRel(clef.GetDrawingXRel() - selfRight + nextLeft);
    }

    const selfLeft = clef.GetContentLeft() - doc.GetLeftMargin(clef) * unit;
    if (selfLeft < prevRight) {
      this.m_aligner.AdjustProportionally([[previousAlignment, alignment, prevRight - selfLeft]]);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AdjustClefMeasureLike): FunctorCode {
    this.m_aligner = measure.m_measureAligner;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
