/**
 * Pure TypeScript translation of Verovio src/adjusttupletsxfunctor.cpp.
 *
 * Control flow and mutation ordering intentionally mirror the canonical C++
 * implementation. Unmigrated tree/layout collaborators are represented by
 * structural contracts only; they do not introduce replacement layout logic.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { BEAMPLACE_above, BEAMPLACE_below, STAFFREL_basic_NONE, STAFFREL_basic_above, STAFFREL_basic_below } from './drawinginterface.js';

export const BOOLEAN_false = 2;

export interface AdjustTupletsXOptionsLike {
  m_showHidden: { GetValue(): boolean };
}

export interface AdjustTupletsXDocLike {
  GetOptions(): AdjustTupletsXOptionsLike;
}

export interface AdjustTupletsXBeamLike {
  m_drawingPlace: number;
}

export interface AdjustTupletsXBracketLike {
  SetDrawingXRelLeft(value: number): void;
  SetDrawingXRelRight(value: number): void;
}

export interface AdjustTupletsXNumLike {
  SetAlignedBracket(bracket: AdjustTupletsXBracketLike | null): void;
}

export interface AdjustTupletsXTupletLike {
  HasNum(): boolean;
  GetBracketVisible(): number;
  GetNumVisible(): number;
  GetDrawingLeft(): unknown | null;
  GetDrawingRight(): unknown | null;
  GetDrawingBracketPos(): number;
  GetDrawingNumPos(): number;
  CalcDrawingBracketAndNumPos?(tupletNumHead: boolean): void;
  GetFirstAncestor(classId: ClassId, maxDepth: number): AdjustTupletsXBeamLike | null;
  FindDescendantByType(classId: ClassId): AdjustTupletsXBeamLike | null;
  GetChildCount(classId: ClassId): number;
  SetBracketAlignedBeam(beam: AdjustTupletsXBeamLike | null): void;
  GetBracketAlignedBeam(): AdjustTupletsXBeamLike | null;
  SetNumAlignedBeam(beam: AdjustTupletsXBeamLike | null): void;
  GetNumAlignedBeam(): AdjustTupletsXBeamLike | null;
  GetDrawingLeftRightXRel(left: { value: number }, right: { value: number }, doc: AdjustTupletsXDocLike): void;
  GetFirst(classId: ClassId): AdjustTupletsXBracketLike | AdjustTupletsXNumLike | null;
}

export const MAX_BEAM_DEPTH = -1;

export class AdjustTupletsXFunctor extends DocFunctor {
  public constructor(doc: AdjustTupletsXDocLike) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitTuplet(tuplet: AdjustTupletsXTupletLike): FunctorCode {
    if (!tuplet.HasNum()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const showHidden = this.m_doc.GetOptions().m_showHidden.GetValue();
    if (!showHidden
      && tuplet.GetBracketVisible() === BOOLEAN_false
      && tuplet.GetNumVisible() === BOOLEAN_false) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    if (!tuplet.GetDrawingLeft() || !tuplet.GetDrawingRight()) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    if (tuplet.GetDrawingBracketPos() === STAFFREL_basic_NONE) {
      tuplet.CalcDrawingBracketAndNumPos?.(this.m_doc.GetOptions().m_tupletNumHead?.GetValue?.() ?? false);
    }
    if (tuplet.GetDrawingBracketPos() === STAFFREL_basic_NONE) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    let beamParent = tuplet.GetFirstAncestor(ClassId.BEAM, MAX_BEAM_DEPTH);
    if (beamParent) {
      tuplet.SetBracketAlignedBeam(beamParent);
    }

    const beamChild = tuplet.FindDescendantByType(ClassId.BEAM);
    if (beamChild
      && tuplet.GetChildCount(ClassId.NOTE) === 0
      && tuplet.GetChildCount(ClassId.CHORD) === 0
      && tuplet.GetChildCount(ClassId.BEAM) === 1) {
      tuplet.SetBracketAlignedBeam(beamChild);
    }

    tuplet.SetNumAlignedBeam(tuplet.GetBracketAlignedBeam());

    const bracketBeam = tuplet.GetBracketAlignedBeam();
    if (bracketBeam && bracketBeam.m_drawingPlace === BEAMPLACE_above
      && tuplet.GetDrawingBracketPos() === STAFFREL_basic_below) {
      tuplet.SetBracketAlignedBeam(null);
    }
    else if (bracketBeam && bracketBeam.m_drawingPlace === BEAMPLACE_below
      && tuplet.GetDrawingBracketPos() === STAFFREL_basic_above) {
      tuplet.SetBracketAlignedBeam(null);
    }

    const numBeam = tuplet.GetNumAlignedBeam();
    if (numBeam && numBeam.m_drawingPlace === BEAMPLACE_above
      && tuplet.GetDrawingNumPos() === STAFFREL_basic_below) {
      tuplet.SetNumAlignedBeam(null);
    }
    else if (numBeam && numBeam.m_drawingPlace === BEAMPLACE_below
      && tuplet.GetDrawingNumPos() === STAFFREL_basic_above) {
      tuplet.SetNumAlignedBeam(null);
    }

    const xRelLeft = { value: 0 };
    const xRelRight = { value: 0 };
    tuplet.GetDrawingLeftRightXRel(xRelLeft, xRelRight, this.m_doc);

    const tupletBracket = tuplet.GetFirst(ClassId.TUPLET_BRACKET) as AdjustTupletsXBracketLike | null;
    if (tupletBracket && (showHidden || tuplet.GetBracketVisible() !== BOOLEAN_false)) {
      tupletBracket.SetDrawingXRelLeft(xRelLeft.value);
      tupletBracket.SetDrawingXRelRight(xRelRight.value);
    }

    const tupletNum = tuplet.GetFirst(ClassId.TUPLET_NUM) as AdjustTupletsXNumLike | null;
    if (tupletNum && (showHidden || tuplet.GetNumVisible() !== BOOLEAN_false)) {
      if (tupletBracket && tuplet.GetDrawingNumPos() === tuplet.GetDrawingBracketPos()) {
        tupletNum.SetAlignedBracket(tupletBracket);
      }
      else {
        tupletNum.SetAlignedBracket(null);
      }
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
