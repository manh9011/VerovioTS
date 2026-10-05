/**
 * Pure TypeScript translation of Verovio's
 * src/adjustyrelfortranscriptionfunctor.cpp.
 *
 * The implementation intentionally preserves the canonical C++ control flow.
 * Unmigrated tree/layout classes are represented by a structural contract.
 */
import { Functor } from './functor.js';
import { FunctorCode } from './vrvdef.js';

export const VRV_UNSET = -1000000;

export interface AdjustYRelForTranscriptionLayerElementLike {
  m_drawingFacsY: number;
  IsScoreDefElement(): boolean;
  HasSelfBB(): boolean;
  GetSelfY1(): number;
  SetDrawingYRel(value: number): void;
}

export class AdjustYRelForTranscriptionFunctor extends Functor {
  public constructor() {
    super();
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitLayerElement(layerElement: AdjustYRelForTranscriptionLayerElementLike): FunctorCode {
    if (layerElement.m_drawingFacsY === VRV_UNSET) return FunctorCode.FUNCTOR_CONTINUE;

    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (!layerElement.HasSelfBB()) return FunctorCode.FUNCTOR_CONTINUE;

    layerElement.SetDrawingYRel(-layerElement.GetSelfY1());

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
