/**
 * Pure TypeScript translation of Verovio's src/adjustxoverflowfunctor.cpp.
 *
 * The state machine, traversal return codes, widest-positioner selection and
 * proportional measure adjustment intentionally mirror the canonical C++.
 * Unmigrated tree/layout classes are represented through structural contracts.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

export const HORIZONTALALIGNMENT_NONE = 0;
export const HORIZONTALALIGNMENT_left = 1;
export const HORIZONTALALIGNMENT_right = 2;
export const HORIZONTALALIGNMENT_center = 3;

export interface AdjustXOverflowControlElementLike {
  IsAnyOf(ids: readonly ClassId[]): boolean;
  GetChildRendAlignment(): number;
  GetClassName(): string;
  GetID(): string;
}

export interface AdjustXOverflowPositionerLike {
  GetContentRight(): number;
  GetObjectX(): AdjustXOverflowLayerElementLike | null;
}

export interface AdjustXOverflowLayerElementLike {
  GetAlignment(): AdjustXOverflowAlignmentLike;
  GetFirstAncestor(classId: ClassId): AdjustXOverflowMeasureLike | null;
}

export interface AdjustXOverflowAlignmentLike {}

export interface AdjustXOverflowMeasureAlignerLike {
  AdjustProportionally(boundaries: Array<[AdjustXOverflowAlignmentLike, AdjustXOverflowAlignmentLike, number]>): void;
}

export interface AdjustXOverflowBarLineLike {
  GetAlignment(): AdjustXOverflowAlignmentLike;
}

export interface AdjustXOverflowMeasureLike {
  m_measureAligner: AdjustXOverflowMeasureAlignerLike;
  GetDrawingX(): number;
  GetRightBarLineLeft(): number;
  GetLeftBarLine(): AdjustXOverflowBarLineLike;
  GetRightBarLine(): AdjustXOverflowBarLineLike;
}

export interface AdjustXOverflowSystemAlignerLike {
  FindAllPositionerPointingTo(out: AdjustXOverflowPositionerLike[], object: AdjustXOverflowControlElementLike): void;
}

export interface AdjustXOverflowSystemLike {
  m_systemAligner: AdjustXOverflowSystemAlignerLike;
}

export interface AdjustXOverflowDocLike {}

export class AdjustXOverflowFunctor extends DocFunctor {
  private m_currentSystem: AdjustXOverflowSystemLike | null = null;
  private m_lastMeasure: AdjustXOverflowMeasureLike | null = null;
  private m_currentWidest: AdjustXOverflowPositionerLike | null = null;
  private readonly m_margin: number;

  public constructor(docOrMargin: AdjustXOverflowDocLike | number, margin?: number) {
    super((typeof docOrMargin === 'number' ? null : docOrMargin) as any);
    this.m_margin = typeof docOrMargin === 'number' ? docOrMargin : (margin ?? 0);
    this.m_currentSystem = null;
    this.m_lastMeasure = null;
    this.m_currentWidest = null;
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public SetCurrentSystem(system: AdjustXOverflowSystemLike | null): void {
    this.m_currentSystem = system;
  }

  public SetLastMeasure(measure: AdjustXOverflowMeasureLike | null): void {
    this.m_lastMeasure = measure;
  }

  public GetWidestPositioner(): AdjustXOverflowPositionerLike | null {
    return this.m_currentWidest;
  }

  public VisitControlElement(controlElement: AdjustXOverflowControlElementLike): FunctorCode {
    if (!controlElement.IsAnyOf([
      ClassId.CPMARK,
      ClassId.DIR,
      ClassId.DYNAM,
      ClassId.ORNAM,
      ClassId.REPEATMARK,
      ClassId.TEMPO,
    ])) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    // Right aligned content is anchored from the right and cannot overflow in
    // the direction handled by this functor.
    if (controlElement.GetChildRendAlignment() === HORIZONTALALIGNMENT_right) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    if (!this.m_currentSystem) {
      throw new Error('AdjustXOverflowFunctor: current system invariant violated');
    }

    const positioners: AdjustXOverflowPositionerLike[] = [];
    this.m_currentSystem.m_systemAligner.FindAllPositionerPointingTo(positioners, controlElement);

    // Match the C++ behaviour: missing @staff/positioners is not fatal.
    if (positioners.length === 0) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    for (const positioner of positioners) {
      if (!this.m_currentWidest || this.m_currentWidest.GetContentRight() < positioner.GetContentRight()) {
        this.m_currentWidest = positioner;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: AdjustXOverflowMeasureLike): FunctorCode {
    this.m_lastMeasure = measure;
    // Only the content of the last measure is relevant because this functor
    // executes before measures are aligned and pre-alignment X positions do not
    // reliably identify the longest control event.
    this.m_currentWidest = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: AdjustXOverflowSystemLike): FunctorCode {
    this.m_currentSystem = system;
    this.m_lastMeasure = null;
    this.m_currentWidest = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemEnd(_system: AdjustXOverflowSystemLike): FunctorCode {
    if (!this.m_lastMeasure || !this.m_currentWidest) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const measureRightX = this.m_lastMeasure.GetDrawingX()
      + this.m_lastMeasure.GetRightBarLineLeft()
      - this.m_margin;

    if (measureRightX > this.m_currentWidest.GetContentRight()) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const objectX = this.m_currentWidest.GetObjectX();
    if (!objectX) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let left = objectX.GetAlignment();
    const objectXMeasure = objectX.GetFirstAncestor(ClassId.MEASURE);
    if (objectXMeasure !== this.m_lastMeasure) {
      left = this.m_lastMeasure.GetLeftBarLine().GetAlignment();
    }

    const overflow = this.m_currentWidest.GetContentRight() - measureRightX;
    if (overflow > 0) {
      const boundaries: Array<[AdjustXOverflowAlignmentLike, AdjustXOverflowAlignmentLike, number]> = [[
        left,
        this.m_lastMeasure.GetRightBarLine().GetAlignment(),
        overflow,
      ]];
      this.m_lastMeasure.m_measureAligner.AdjustProportionally(boundaries);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
