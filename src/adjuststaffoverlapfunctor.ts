/**
 * Pure TypeScript translation of Verovio's
 * src/adjuststaffoverlapfunctor.cpp.
 *
 * Control flow, mutation order and overlap rules mirror the canonical C++
 * implementation. Native/layout collaborators that are not yet migrated are
 * represented by structural contracts only.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

export interface AdjustStaffOverlapDocLike {
  GetDrawingUnit(staffSize: number): number;
}

export interface AdjustStaffOverlapObjectLike {
  Is(classId: ClassId): boolean;
  IsAnyOf(classIds: readonly ClassId[]): boolean;
  IsExtenderElement(): boolean;
}

export interface AdjustStaffOverlapBoundingBoxLike {
  Is(classId: ClassId): boolean;
  IsAnyOf(classIds: readonly ClassId[]): boolean;
  HasContentBB(): boolean;
  GetContentLeft(): number;
  GetContentRight(): number;
  HorizontalContentOverlap(other: AdjustStaffOverlapBoundingBoxLike, margin?: number): boolean;
  VerticalContentOverlap(other: AdjustStaffOverlapBoundingBoxLike, margin?: number): boolean;
}

export interface AdjustStaffOverlapFloatingPositionerLike extends AdjustStaffOverlapBoundingBoxLike {
  GetObject(): AdjustStaffOverlapObjectLike;
}

export interface AdjustStaffOverlapStaffLike {}

export interface AdjustStaffOverlapStaffAlignmentLike {
  GetOverflowBelow(): number;
  GetOverflowAbove(): number;
  GetScoreDefClefOverflowBelow(): number;
  GetScoreDefClefOverflowAbove(): number;
  SetOverlap(overlap: number): void;
  AdjustBracketGroupSpacing(doc: AdjustStaffOverlapDocLike, previous: AdjustStaffOverlapStaffAlignmentLike, spacing: number): void;
  GetRequestedSpaceAbove(): number;
  GetRequestedSpaceBelow(): number;
  SetRequestedSpacing(spacing: number): void;
  GetYRel(): number;
  GetStaffHeight(): number;
  GetStaff(): AdjustStaffOverlapStaffLike | null;
  GetStaffSize(): number;
  GetBBoxesBelow(): AdjustStaffOverlapBoundingBoxLike[];
  GetBBoxesAbove(): AdjustStaffOverlapBoundingBoxLike[];
  CalcOverflowBelow(box: AdjustStaffOverlapBoundingBoxLike): number;
  CalcOverflowAbove(box: AdjustStaffOverlapBoundingBoxLike): number;
}

export interface AdjustStaffOverlapSystemLike {
  m_systemAligner: { Process(functor: unknown): void };
}

function isExtenderFloatingPositioner(box: AdjustStaffOverlapBoundingBoxLike): box is AdjustStaffOverlapFloatingPositionerLike {
  if (!box.Is(ClassId.FLOATING_POSITIONER)) return false;
  return 'GetObject' in box;
}

const EXTENDER_OBJECTS = [ClassId.DIR, ClassId.DYNAM, ClassId.TEMPO] as const;

export class AdjustStaffOverlapFunctor extends DocFunctor {
  private m_previous: AdjustStaffOverlapStaffAlignmentLike | null = null;

  public constructor(doc: AdjustStaffOverlapDocLike) {
    super(doc);
    this.m_previous = null;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public VisitStaffAlignment(staffAlignment: AdjustStaffOverlapStaffAlignmentLike): FunctorCode {
    if (this.m_previous === null) {
      this.m_previous = staffAlignment;
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    const previous = this.m_previous;
    const spacing = Math.max(previous.GetOverflowBelow(), staffAlignment.GetOverflowAbove());

    const overflowBelow = previous.GetScoreDefClefOverflowBelow();
    const overflowAbove = staffAlignment.GetScoreDefClefOverflowAbove();
    if (spacing < overflowBelow + overflowAbove) {
      staffAlignment.SetOverlap(overflowBelow + overflowAbove - spacing);
    }

    staffAlignment.AdjustBracketGroupSpacing(this.m_doc, previous, spacing);

    const currentStaffDistance = previous.GetYRel() - previous.GetStaffHeight() - staffAlignment.GetYRel();
    const requestedSpace = Math.max(staffAlignment.GetRequestedSpaceAbove(), previous.GetRequestedSpaceBelow());
    if (requestedSpace > 0) {
      staffAlignment.SetRequestedSpacing(currentStaffDistance + requestedSpace);
    }

    if (staffAlignment.GetStaff() === null) {
      return FunctorCode.FUNCTOR_STOP;
    }

    const staffSize = staffAlignment.GetStaffSize();
    const drawingUnit = this.m_doc.GetDrawingUnit(staffSize);
    // ponytail: extent caching replaces per-pair GetDrawingX ancestor walks.
    // Upgrade path: sweep-line if overlap loop stays in flame.
    const extMargin = drawingUnit * 4;
    const bboxesBelow = previous.GetBBoxesBelow();
    const bboxesAboveAll = staffAlignment.GetBBoxesAbove();
    const aboveLeft = new Array<number>(bboxesAboveAll.length);
    const aboveRight = new Array<number>(bboxesAboveAll.length);
    const aboveHas = new Array<boolean>(bboxesAboveAll.length);
    for (let a = 0; a < bboxesAboveAll.length; a++) {
      const box = bboxesAboveAll[a];
      const has = box.HasContentBB();
      aboveHas[a] = has;
      aboveLeft[a] = has ? box.GetContentLeft() : 0;
      aboveRight[a] = has ? box.GetContentRight() : 0;
    }

    for (const bboxBelow of bboxesBelow) {
      const bboxesAbove = bboxesAboveAll;
      const belowHas = bboxBelow.HasContentBB();
      const belowLeft = belowHas ? bboxBelow.GetContentLeft() : 0;
      const belowRight = belowHas ? bboxBelow.GetContentRight() : 0;
      const belowIsExtender = isExtenderFloatingPositioner(bboxBelow)
        && bboxBelow.GetObject().IsAnyOf(EXTENDER_OBJECTS)
        && bboxBelow.GetObject().IsExtenderElement();
      const belowIsArtic = !belowIsExtender && bboxBelow.Is(ClassId.ARTIC);
      const belowIsNote = !belowIsExtender && !belowIsArtic && bboxBelow.Is(ClassId.NOTE);
      let index = 0;
      while (index < bboxesAbove.length) {
        let bboxAbove: AdjustStaffOverlapBoundingBoxLike | undefined;
        for (; index < bboxesAbove.length; index++) {
          if (!belowHas || !aboveHas[index]) continue;
          const candidate = bboxesAbove[index];
          if (belowIsExtender) {
            // C++: HorizontalContentOverlap(margin) || VerticalContentOverlap.
            // The vertical test must still run when there is no horizontal
            // overlap (178 regressed when continue skipped it).
            if ((belowRight > aboveLeft[index] - extMargin && belowLeft < aboveRight[index] + extMargin)
              || bboxBelow.VerticalContentOverlap(candidate)) {
              bboxAbove = candidate;
              break;
            }
          } else if (belowRight > aboveLeft[index] && belowLeft < aboveRight[index]) {
            bboxAbove = candidate;
            break;
          }
        }

        if (!bboxAbove) break;

        const elementOverflowBelow = previous.CalcOverflowBelow(bboxBelow);
        const elementOverflowAbove = staffAlignment.CalcOverflowAbove(bboxAbove);
        let minSpaceBetween = 0;
        if (belowIsArtic) {
          if (bboxAbove.IsAnyOf([ClassId.ARTIC, ClassId.NOTE])) minSpaceBetween = drawingUnit;
        }
        else if (belowIsNote && bboxAbove.Is(ClassId.ARTIC)) {
          minSpaceBetween = drawingUnit;
        }
        else if (!belowIsExtender
          && ((bboxBelow.Is(ClassId.ARTIC) && bboxAbove.IsAnyOf([ClassId.ARTIC, ClassId.NOTE]))
            || (bboxBelow.Is(ClassId.NOTE) && bboxAbove.Is(ClassId.ARTIC)))) {
          // Fallback preserves C++ semantics if class flags above ever diverge.
          minSpaceBetween = drawingUnit;
        }
        if (spacing < elementOverflowBelow + elementOverflowAbove + minSpaceBetween) {
          staffAlignment.SetOverlap(elementOverflowBelow + elementOverflowAbove + minSpaceBetween - spacing);
        }
        index++;
      }
    }

    this.m_previous = staffAlignment;
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: AdjustStaffOverlapSystemLike): FunctorCode {
    this.m_previous = null;
    system.m_systemAligner.Process(this);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
