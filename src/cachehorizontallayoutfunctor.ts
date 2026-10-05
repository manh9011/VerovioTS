/**
 * Pure TypeScript translation of Verovio's
 * src/cachehorizontallayoutfunctor.cpp / include/vrv/cachehorizontallayoutfunctor.h.
 *
 * Caches or restores cached horizontal layout (XRel/YRel) for faster layout redoing.
 * Unmigrated tree/layout classes are represented by structural contracts.
 */
import { DocFunctor } from './functor.js';
import { FunctorCode } from './vrvdef.js';

export interface CacheHorizontalLayoutArpegLike {
  CacheXRel(restore: boolean): void;
}

export interface CacheHorizontalLayoutLayerElementLike {
  CacheXRel(restore: boolean): void;
  CacheYRel(restore: boolean): void;
}

// C++ BarLine extends LayerElement; the base FunctorInterface::VisitBarLine
// default forwards to VisitLayerElement, mirrored here at runtime.
export interface CacheHorizontalLayoutBarLineLike extends CacheHorizontalLayoutLayerElementLike {}

export interface CacheHorizontalLayoutMeasureLike {
  CacheXRel(restore: boolean): void;
  GetLeftBarLine(): CacheHorizontalLayoutBarLineLike | null;
  GetRightBarLine(): CacheHorizontalLayoutBarLineLike | null;
}

export class CacheHorizontalLayoutFunctor extends DocFunctor {
  private m_restore = false;

  public constructor(doc: unknown) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public SetRestore(restore: boolean): void {
    this.m_restore = restore;
  }

  public VisitArpeg(arpeg: CacheHorizontalLayoutArpegLike): FunctorCode {
    arpeg.CacheXRel(this.m_restore);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: CacheHorizontalLayoutLayerElementLike): FunctorCode {
    layerElement.CacheXRel(this.m_restore);
    layerElement.CacheYRel(this.m_restore);
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitBarLine(barLine: CacheHorizontalLayoutBarLineLike): FunctorCode {
    return this.VisitLayerElement(barLine);
  }

  public VisitMeasure(measure: CacheHorizontalLayoutMeasureLike): FunctorCode {
    measure.CacheXRel(this.m_restore);
    if (measure.GetLeftBarLine()) this.VisitBarLine(measure.GetLeftBarLine()!);
    if (measure.GetRightBarLine()) this.VisitBarLine(measure.GetRightBarLine()!);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
