/**
 * Pure TypeScript translation of Verovio's src/adjustneumexfunctor.cpp.
 *
 * The control flow and mutation order mirror the canonical C++ implementation.
 * Not-yet-migrated tree/layout classes are represented by structural contracts.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';

export interface AdjustNeumeXDocLike {
  GetDrawingUnit(staffSize: number): number;
}

export interface AdjustNeumeXAlignmentLike {
  GetXRel(): number;
  SetXRel(value: number): void;
}

export interface AdjustNeumeXMeasureAlignerLike {
  GetRightAlignment(): AdjustNeumeXAlignmentLike | null;
}

export interface AdjustNeumeXMeasureLike {
  m_measureAligner: AdjustNeumeXMeasureAlignerLike;
}

export interface AdjustNeumeXObjectLike {
  GetAlignment(): AdjustNeumeXAlignmentLike | null;
  GetContentLeft(): number;
  GetContentRight(): number;
  GetFirstAncestor(classId: ClassId): AdjustNeumeXMeasureLike | null;
}

export interface AdjustNeumeXLayerLike {}

export interface AdjustNeumeXStaffLike {
  IsNeume(): boolean;
}

export interface AdjustNeumeXNeumeLike extends AdjustNeumeXObjectLike {}
export interface AdjustNeumeXSylLike extends AdjustNeumeXObjectLike {}

/**
 * Adjust the horizontal placement of neumes and syllables so consecutive
 * content does not overlap within a neume staff/layer.
 */
export class AdjustNeumeXFunctor extends DocFunctor {
  private m_minPos = VRV_UNSET;
  private m_neumeMinPos = VRV_UNSET;

  public constructor(doc: AdjustNeumeXDocLike) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  public VisitLayer(_layer: AdjustNeumeXLayerLike): FunctorCode {
    this.m_minPos = VRV_UNSET;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerEnd(layer: AdjustNeumeXLayerLike & AdjustNeumeXObjectLike): FunctorCode {
    const measure = layer.GetFirstAncestor(ClassId.MEASURE);
    if (!measure) throw new Error('AdjustNeumeXFunctor: MEASURE ancestor invariant violated');

    const alignment = measure.m_measureAligner.GetRightAlignment();
    if (!alignment) throw new Error('AdjustNeumeXFunctor: right alignment invariant violated');

    const selfLeft = alignment.GetXRel();
    if (selfLeft < this.m_minPos) {
      const adjust = this.m_minPos - selfLeft;
      alignment.SetXRel(alignment.GetXRel() + adjust);
    }

    this.m_minPos = VRV_UNSET;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNeume(neume: AdjustNeumeXNeumeLike): FunctorCode {
    if (this.m_neumeMinPos !== VRV_UNSET) {
      const alignment = neume.GetAlignment();
      if (!alignment) throw new Error('AdjustNeumeXFunctor: neume alignment invariant violated');

      const selfLeft = neume.GetContentLeft();
      if (selfLeft < this.m_neumeMinPos) {
        const adjust = this.m_neumeMinPos - selfLeft;
        alignment.SetXRel(alignment.GetXRel() + adjust);
      }
    }

    this.m_neumeMinPos = neume.GetContentRight() + this.m_doc.GetDrawingUnit(100);

    if (this.m_neumeMinPos > this.m_minPos) this.m_minPos = this.m_neumeMinPos;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AdjustNeumeXStaffLike): FunctorCode {
    if (!staff.IsNeume()) return FunctorCode.FUNCTOR_SIBLINGS;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSyl(syl: AdjustNeumeXSylLike): FunctorCode {
    const alignment = syl.GetAlignment();
    if (!alignment) throw new Error('AdjustNeumeXFunctor: syllable alignment invariant violated');

    // Indicates that the neume will be the first of the syllable.
    this.m_neumeMinPos = VRV_UNSET;

    const selfLeft = syl.GetContentLeft();
    if (selfLeft < this.m_minPos) {
      const adjust = this.m_minPos - selfLeft;
      alignment.SetXRel(alignment.GetXRel() + adjust);
    }

    this.m_minPos = syl.GetContentRight() + this.m_doc.GetDrawingUnit(100);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
