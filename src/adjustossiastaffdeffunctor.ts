/**
 * Pure TypeScript translation of Verovio's src/adjustossiastaffdeffunctor.cpp.
 *
 * The implementation mirrors the canonical C++ control flow and ordering. Native
 * layout/tree collaborators are represented as structural contracts until their
 * canonical TypeScript implementations are migrated.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

/** Horizontal-aligner type constants from include/vrv/horizontalaligner.h. */
export const ALIGNMENT_SCOREDEF_OSSIA_CLEF = -2;
export const ALIGNMENT_SCOREDEF_OSSIA_KEYSIG = -1;
export const ALIGNMENT_MEASURE_START = 0;

export interface AdjustOssiaDocLike {
  GetDrawingUnit(staffSize: number): number;
}

export interface AdjustOssiaAlignmentLike {
  GetType(): number;
  SetXRel(value: number): void;
}

export interface AdjustOssiaOssiaLike {
  SetClefAlignment(alignment: AdjustOssiaAlignmentLike | null): void;
  SetKeySigAlignment(alignment: AdjustOssiaAlignmentLike | null): void;
}

export interface AdjustOssiaLayerElementLike {
  IsScoreDefElement(): boolean;
  Is(classId: ClassId): boolean;
  GetContentX1(): number;
  GetContentX2(): number;
  GetFirstAncestor(classId: ClassId): AdjustOssiaOssiaLike | null;
}

export interface AdjustOssiaMeasureAlignerLike {
  Process(functor: unknown): void;
}

export interface AdjustOssiaMeasureLike {
  m_measureAligner: AdjustOssiaMeasureAlignerLike;
}

export interface AdjustOssiaStaffLike {}

/**
 * Adjusts clef/key signature positions for ossia staff definitions.
 *
 * C++ std::list::unique() removes consecutive equal elements only; the helper
 * below intentionally preserves that exact semantics rather than deduplicating
 * the entire array via Set.
 */
export class AdjustOssiaStaffDefFunctor extends DocFunctor {
  private m_keySigWidth = 0;
  private m_clefWidth = 0;
  private m_staffSize = 100;
  private m_keySigAlignment: AdjustOssiaAlignmentLike | null = null;
  private m_clefAlignment: AdjustOssiaAlignmentLike | null = null;
  private m_ossias: AdjustOssiaOssiaLike[] = [];

  public constructor(doc: AdjustOssiaDocLike) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  public VisitAlignment(alignment: AdjustOssiaAlignmentLike): FunctorCode {
    if (alignment.GetType() >= ALIGNMENT_MEASURE_START) return FunctorCode.FUNCTOR_SIBLINGS;

    if (alignment.GetType() === ALIGNMENT_SCOREDEF_OSSIA_KEYSIG) {
      this.m_keySigAlignment = alignment;
    } else if (alignment.GetType() === ALIGNMENT_SCOREDEF_OSSIA_CLEF) {
      this.m_clefAlignment = alignment;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AdjustOssiaLayerElementLike): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    const unit = (this.m_doc as AdjustOssiaDocLike).GetDrawingUnit(this.m_staffSize);

    if (layerElement.Is(ClassId.KEYSIG)) {
      const width = layerElement.GetContentX1() + layerElement.GetContentX2() + unit;
      this.m_keySigWidth = Math.max(width, this.m_keySigWidth);
    } else if (layerElement.Is(ClassId.CLEF)) {
      const width = layerElement.GetContentX1() + layerElement.GetContentX2() + unit;
      this.m_clefWidth = Math.max(width, this.m_clefWidth);
    }

    const ossia = layerElement.GetFirstAncestor(ClassId.OSSIA);
    if (!ossia) throw new Error('AdjustOssiaStaffDefFunctor: Ossia ancestor invariant violated');
    this.m_ossias.push(ossia);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: AdjustOssiaMeasureLike): FunctorCode {
    this.m_keySigWidth = 0;
    this.m_clefWidth = 0;
    this.m_staffSize = 100;

    this.m_keySigAlignment = null;
    this.m_clefAlignment = null;

    this.m_ossias.length = 0;

    const previousDirection = this.SetDirection(false);
    try {
      measure.m_measureAligner.Process(this);
    } finally {
      this.SetDirection(true);
      // The C++ implementation explicitly restores FORWARD; keep that exact
      // observable postcondition rather than restoring an arbitrary caller state.
      void previousDirection;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(_measure: AdjustOssiaMeasureLike): FunctorCode {
    if (this.m_keySigAlignment) {
      this.m_keySigAlignment.SetXRel(-this.m_keySigWidth);
    }
    if (this.m_clefAlignment) {
      this.m_clefAlignment.SetXRel(-this.m_keySigWidth - this.m_clefWidth);
    }

    // std::list::unique(): remove consecutive equal references only.
    const uniqueOssias: AdjustOssiaOssiaLike[] = [];
    for (const ossia of this.m_ossias) {
      if (uniqueOssias.length === 0 || uniqueOssias[uniqueOssias.length - 1] !== ossia) {
        uniqueOssias.push(ossia);
      }
    }
    this.m_ossias = uniqueOssias;

    for (const ossia of this.m_ossias) {
      ossia.SetClefAlignment(this.m_clefAlignment);
      ossia.SetKeySigAlignment(this.m_keySigAlignment);
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitStaff(_staff: AdjustOssiaStaffLike): FunctorCode {
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
