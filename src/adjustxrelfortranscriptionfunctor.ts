/**
 * Pure TypeScript translation of Verovio's
 * src/adjustxrelfortranscriptionfunctor.cpp.
 *
 * The implementation intentionally preserves the canonical C++ control flow.
 * Unmigrated tree/layout classes are represented by structural contracts.
 */
import { Functor } from './functor.js';
import { FunctorCode } from './vrvdef.js';

export const VRV_UNSET = -1000000;

export interface AdjustXRelForTranscriptionLayerElementLike {
  m_drawingFacsX: number;
  IsScoreDefElement(): boolean;
  HasSelfBB(): boolean;
  GetSelfX1(): number;
  SetDrawingXRel(value: number): void;
}

export class AdjustXRelForTranscriptionFunctor extends Functor {
  public constructor() {
    super();
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitLayerElement(layerElement: AdjustXRelForTranscriptionLayerElementLike): FunctorCode {
    if (layerElement.m_drawingFacsX === VRV_UNSET) return FunctorCode.FUNCTOR_CONTINUE;

    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (!layerElement.HasSelfBB()) return FunctorCode.FUNCTOR_CONTINUE;

    layerElement.SetDrawingXRel(-layerElement.GetSelfX1());

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
