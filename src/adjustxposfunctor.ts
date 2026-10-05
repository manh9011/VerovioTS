/**
 * Pure TypeScript translation of Verovio's src/adjustxposfunctor.cpp.
 *
 * Control flow, state mutation and spacing arithmetic intentionally mirror the
 * canonical C++ implementation. Domain/layout collaborators that are not yet
 * migrated are expressed as structural contracts only.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { SMUFL_E220_tremolo1 } from './smufl.js';
import { AttNIntegerAnyComparison, CrossAlignmentReferenceComparison, Filters } from './comparison.js';

// Canonical horizontal-aligner constants from include/vrv/horizontalaligner.h.
// They are local until that header has a dedicated TS translation.
export const ALIGNMENT_CLEF = 10;
export const ALIGNMENT_DEFAULT = 21;
export const ALIGNMENT_CURSOR = 8;
export const ALIGNMENT_MEASURE_START = 0;
export const ALIGNMENT_MEASURE_END = 27;
export const ALIGNMENT_MEASURE_RIGHT_BARLINE = 22;
export const ALIGNMENT_FULLMEASURE2 = 7;
export const STEMMODIFIER_MAX = 10;
export const STEMDIRECTION_up = 1;
export const BOOLEAN_false = 2;
export const DURATION_8 = 5;
export const MEASUREMENTTYPE_vu = 1;
export const VRV_UNSET = -0x7FFFFFFF;

export interface AdjustXPosAlignmentLike {
  GetType(): number;
  GetXRel(): number;
  SetXRel(value: number): void;
  PerformBoundingBoxAlignment(): boolean;
  GetReferenceWithElement(element: AdjustXPosLayerElementLike, staffN: number): AdjustXPosAlignmentReferenceLike;
  GetParent(): AdjustXPosAlignmentParentLike | null;
}

export interface AdjustXPosAlignmentParentLike {
  GetNextOf(alignment: AdjustXPosAlignmentLike, classId: ClassId): AdjustXPosAlignmentLike | null;
}

export interface AdjustXPosAlignmentReferenceLike {
  HasMultipleLayer(): boolean;
}

export interface AdjustXPosBoundingBoxLike {
  HorizontalSelfOverlap(other: AdjustXPosBoundingBoxLike): boolean;
  VerticalSelfOverlap(other: AdjustXPosBoundingBoxLike): boolean;
  HorizontalContentOverlap(other: AdjustXPosBoundingBoxLike, margin?: number): boolean;
  HorizontalRightOverlap(other: AdjustXPosLayerElementLike, doc: AdjustXPosDocLike, margin: number, verticalMargin?: number): number;
}

export interface AdjustXPosLayerElementLike extends AdjustXPosBoundingBoxLike {
  Is(classId: ClassId): boolean;
  IsAnyOf(classIds: readonly ClassId[]): boolean;
  IsScoreDefElement(): boolean;
  HasToBeAligned(): boolean;
  HasSameasLink(): boolean;
  GetAlignment(): AdjustXPosAlignmentLike;
  HasSelfBB(): boolean;
  HasEmptyBB(): boolean;
  GetSelfLeft(): number;
  GetSelfRight(): number;
  GetContentLeft(): number;
  GetContentRight(): number;
  HasContentBB?(): boolean;
  GetContentTop(): number;
  GetContentBottom(): number;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetAncestorStaff(): AdjustXPosStaffLike | null;
  GetFirstAncestor(classId: ClassId): AdjustXPosObjectLike | null;
  FindDescendantByType(classId: ClassId): AdjustXPosObjectLike | null;
  GetFirstAncestorStaff?(): AdjustXPosStaffLike | null;
  HasStemMod(): boolean;
  GetStemMod(): number;
  GetDrawingStemDir(): number;
  IsInBeam?(): boolean;
  GetDur?(): number;

}

export interface AdjustXPosStaffLike {
  GetDrawingY(): number;
}


export interface AdjustXPosObjectLike {
  Is(classId: ClassId): boolean;
  GetFirstAncestor(classId: ClassId): AdjustXPosObjectLike | null;
  FindDescendantByType(classId: ClassId): AdjustXPosObjectLike | null;
  GetLast?(): AdjustXPosObjectLike | null;
  GetNext?(object: AdjustXPosObjectLike): AdjustXPosObjectLike | null;
  GetContentLeft?(): number;
  GetContentRight?(): number;
}

export interface AdjustXPosOptionsLike {
  m_unit: { GetValue(): number };
  m_measureMinWidth: { GetValue(): number };
  m_tieMinLength: { GetValue(): number };
}

export interface AdjustXPosDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetDrawingStaffSize(staffSize: number): number;
  GetDrawingBarLineWidth(staffSize: number): number;
  GetLeftMargin(element: AdjustXPosLayerElementLike): number;
  GetRightMargin(element: AdjustXPosLayerElementLike): number;
  GetGlyphWidth(glyphId: number, staffSize: number, isPercussion: boolean): number;
  GetOptions(): AdjustXPosOptionsLike;
}

export interface AdjustXPosStaffAlignmentLike {
  GetStaffSize(): number;
  GetStaff(): { IsNeume(): boolean } | null;
}

export interface AdjustXPosSystemLike extends AdjustXPosObjectLike {
  GetDrawingScoreDef(): AdjustXPosScoreDefLike | null;
  m_systemAligner: { GetStaffAlignmentForStaffN(staffN: number): AdjustXPosStaffAlignmentLike | null };
}

export interface AdjustXPosScoreDefLike {
  HasSystemStartLine(): boolean;
  GetStaffNs(): number[];
}

export interface AdjustXPosBarLineLike extends AdjustXPosLayerElementLike {
  GetPosition(): number;
}

export interface AdjustXPosMultiRestLike extends AdjustXPosLayerElementLike {
  GetNum(): number;
  HasWidth(): boolean;
  GetWidthType(): number;
  GetWidthVu(): number;
}

export interface AdjustXPosMeasureAlignerLike {
  Process(functor: unknown): void;
  FindDescendantByComparison(comparison: unknown, depth: number): AdjustXPosAlignmentLike | null;
  AdjustProportionally(boundaries: Array<[AdjustXPosAlignmentLike, AdjustXPosAlignmentLike, number]>): void;
}

export interface AdjustXPosMeasureTieEndpointsLike {
  // C++ MeasureTieEndpoints is a vector<pair<LayerElement *, LayerElement *>>.
  endpoints: Array<[AdjustXPosLayerElementLike, AdjustXPosLayerElementLike]>;
  [Symbol.iterator](): Iterator<[AdjustXPosLayerElementLike, AdjustXPosLayerElementLike]>;
}

export interface AdjustXPosMeasureLike extends AdjustXPosObjectLike {
  m_measureAligner: AdjustXPosMeasureAlignerLike;
  GetInternalTieEndpoints(): AdjustXPosMeasureTieEndpointsLike;
  IsFirstInSystem(): boolean;
  IsMeasuredMusic(): boolean;
  GetMetcon(): number;
  GetLeftBarLine(): AdjustXPosBarLineLike;
  GetRightBarLine(): AdjustXPosBarLineLike;
  GetLeftBarLineRight(): number;
  GetRightBarLineLeft(): number;
}

export interface AdjustXPosFiltersLike {
  SetType(type: unknown): void;
  Set?(filters: unknown[]): void;
}

export interface AdjustXPosFunctorFactoryLike {
  CreateFilters?(): AdjustXPosFiltersLike;
}

interface ComparisonLike {}

function hasMethod<T extends object, K extends PropertyKey>(value: T, key: K): value is T & Record<K, unknown> {
  return key in value;
}

/** Mutable per-alignment state used exactly like AdjustXPosAlignmentOffset in C++. */
export class AdjustXPosAlignmentOffset {
  public m_alignment: AdjustXPosAlignmentLike | null = null;
  public m_offset = 0;
  public m_overlappingBB: AdjustXPosBoundingBoxLike | null = null;

  public Reset(): void {
    this.m_alignment = null;
    this.m_offset = 0;
    this.m_overlappingBB = null;
  }
}

export class AdjustXPosFunctor extends DocFunctor {
  private m_minPos = 0;
  private m_upcomingMinPos = VRV_UNSET;
  private m_cumulatedXShift = 0;
  private m_staffN = 0;
  private m_staffSize = 100;
  private m_isNeumeStaff = false;
  private m_staffNs: number[] = [];
  private m_boundingBoxes: AdjustXPosBoundingBoxLike[] = [];
  private m_upcomingBoundingBoxes: AdjustXPosBoundingBoxLike[] = [];
  private m_includes: ClassId[] = [];
  private m_excludes: ClassId[] = [];
  private m_rightBarLinesOnly = false;
  private m_measureTieEndpoints: AdjustXPosMeasureTieEndpointsLike | null = null;
  private m_currentAlignment = new AdjustXPosAlignmentOffset();
  private m_previousAlignment = new AdjustXPosAlignmentOffset();
  private m_measure: AdjustXPosMeasureLike | null = null;

  public constructor(doc: AdjustXPosDocLike) {
    super(doc);
    this.m_minPos = 0;
    this.m_upcomingMinPos = VRV_UNSET;
    this.m_cumulatedXShift = 0;
    this.m_staffN = 0;
    this.m_staffSize = 100;
    this.m_rightBarLinesOnly = false;
    this.m_measure = null;
  }

  public override ImplementsEndInterface(): boolean {
    return true;
  }

  public SetIncluded(classIDs: readonly ClassId[]): void {
    this.m_includes = [...classIDs];
  }

  public ClearIncluded(): void {
    this.m_includes.length = 0;
  }

  public SetExcluded(classIDs: readonly ClassId[]): void {
    this.m_excludes = [...classIDs];
  }

  public ClearExcluded(): void {
    this.m_excludes.length = 0;
  }

  public SetRightBarLinesOnly(rightBarLinesOnly: boolean): void {
    this.m_rightBarLinesOnly = rightBarLinesOnly;
  }

  public VisitAlignment(alignment: AdjustXPosAlignmentLike): FunctorCode {
    // Ossia scoreDef should not be aligned because that is taken care of in the dedicated functor.
    if (alignment.GetType() < ALIGNMENT_MEASURE_START) return FunctorCode.FUNCTOR_SIBLINGS;

    alignment.SetXRel(alignment.GetXRel() + this.m_cumulatedXShift);

    if (alignment.GetType() === ALIGNMENT_MEASURE_END && alignment.GetXRel() < this.m_minPos) {
      alignment.SetXRel(this.m_minPos);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitAlignmentEnd(alignment: AdjustXPosAlignmentLike): FunctorCode {
    if (this.m_upcomingMinPos !== VRV_UNSET) {
      this.m_minPos = this.m_upcomingMinPos;
      this.m_upcomingMinPos = VRV_UNSET;
    }

    if (alignment.GetType() === ALIGNMENT_CURSOR) {
      this.m_minPos += this.m_doc.GetDrawingUnit(100) * 4;
    }

    if (this.m_upcomingBoundingBoxes.length === 0) return FunctorCode.FUNCTOR_CONTINUE;

    if (this.m_previousAlignment.m_overlappingBB
      && this.m_previousAlignment.m_alignment
      && this.m_previousAlignment.m_alignment.GetType() === ALIGNMENT_DEFAULT) {
      const previousBB = this.m_previousAlignment.m_overlappingBB;
      const found = this.m_upcomingBoundingBoxes.find((bb) => {
        if (previousBB === bb) return false;
        return bb.HorizontalSelfOverlap(previousBB) && bb.VerticalSelfOverlap(previousBB);
      });
      if (found) {
        if (!this.m_currentAlignment.m_alignment) {
          throw new Error('AdjustXPosFunctor invariant: current alignment missing when overlap is detected');
        }
        this.m_currentAlignment.m_alignment.SetXRel(
          this.m_currentAlignment.m_alignment.GetXRel() + this.m_previousAlignment.m_offset,
        );
        this.m_minPos += this.m_previousAlignment.m_offset;
        this.m_cumulatedXShift += this.m_previousAlignment.m_offset;
      }
    }

    this.m_previousAlignment.m_alignment = this.m_currentAlignment.m_alignment;
    this.m_previousAlignment.m_offset = this.m_currentAlignment.m_offset;
    this.m_previousAlignment.m_overlappingBB = this.m_currentAlignment.m_overlappingBB;
    this.m_currentAlignment.Reset();

    this.m_boundingBoxes = this.m_upcomingBoundingBoxes;
    this.m_upcomingBoundingBoxes = [];

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: AdjustXPosLayerElementLike): FunctorCode {
    if (layerElement.IsScoreDefElement()) return FunctorCode.FUNCTOR_SIBLINGS;
    const alignment = layerElement.GetAlignment();
    if (!alignment) throw new Error('AdjustXPosFunctor invariant: aligned layer element without alignment');

    if (!layerElement.HasToBeAligned()) return FunctorCode.FUNCTOR_SIBLINGS;
    if (this.m_excludes.length > 0 && layerElement.IsAnyOf(this.m_excludes)) return FunctorCode.FUNCTOR_CONTINUE;
    if (this.m_includes.length > 0 && !layerElement.IsAnyOf(this.m_includes)) return FunctorCode.FUNCTOR_CONTINUE;

    if (this.m_rightBarLinesOnly && layerElement.Is(ClassId.BARLINE)) {
      const barline = layerElement as AdjustXPosBarLineLike;
      if (barline.GetPosition() !== 1) return FunctorCode.FUNCTOR_CONTINUE; // BarLinePosition::Right
    }

    if (layerElement.HasSameasLink()) return FunctorCode.FUNCTOR_SIBLINGS;
    if (alignment.GetType() === ALIGNMENT_CLEF && !this.m_isNeumeStaff) return FunctorCode.FUNCTOR_CONTINUE;

    let [offset, selfLeft] = this.CalculateXPosOffset(layerElement);
    offset = Math.min(offset, selfLeft - this.m_minPos);
    if (offset < 0) {
      alignment.SetXRel(alignment.GetXRel() - offset);
      this.m_cumulatedXShift += -offset;
      this.m_upcomingMinPos += -offset;
    }

    const drawingUnit = this.m_doc.GetDrawingUnit(this.m_staffSize);
    let selfRight: number;
    if (!layerElement.HasSelfBB() || layerElement.HasEmptyBB()) {
      selfRight = alignment.GetXRel();
      if (layerElement.Is(ClassId.BARLINE) && this.m_measure?.IsMeasuredMusic()) {
        selfRight += this.m_doc.GetRightMargin(layerElement) * drawingUnit;
      }
    } else {
      selfRight = layerElement.GetSelfRight() + this.m_doc.GetRightMargin(layerElement) * drawingUnit;
    }

    const currentReference = alignment.GetReferenceWithElement(layerElement, this.m_staffN);
    const parent = alignment.GetParent();
    const nextAlignment = parent ? parent.GetNextOf(alignment, ClassId.ALIGNMENT) : null;
    const next = nextAlignment ? nextAlignment.GetType() : ALIGNMENT_DEFAULT;

    if (layerElement.IsAnyOf([ClassId.DOTS, ClassId.FLAG])
      && currentReference.HasMultipleLayer()
      && next !== ALIGNMENT_MEASURE_RIGHT_BARLINE) {
      const additionalOffset = selfRight - this.m_upcomingMinPos;
      if (additionalOffset > this.m_currentAlignment.m_offset) {
        this.m_currentAlignment.m_offset = additionalOffset;
        this.m_currentAlignment.m_overlappingBB = layerElement;
      }
    } else if (layerElement.Is(ClassId.NOTE) && next === ALIGNMENT_MEASURE_RIGHT_BARLINE) {
      if (layerElement.HasStemMod() && layerElement.GetStemMod() < STEMMODIFIER_MAX
        && layerElement.GetDrawingStemDir() === STEMDIRECTION_up) {
        this.m_cumulatedXShift += drawingUnit;
        this.m_upcomingMinPos += drawingUnit;
      } else {
        this.m_upcomingMinPos = Math.max(selfRight, this.m_upcomingMinPos);
      }
    } else {
      this.m_upcomingMinPos = Math.max(selfRight, this.m_upcomingMinPos);
    }

    if (this.m_measureTieEndpoints) {
      for (const [left, right] of this.m_measureTieEndpoints) {
        if (right !== layerElement) continue;
        const minTieLength = this.m_doc.GetOptions().m_tieMinLength.GetValue() * drawingUnit;
        const leftHasContentBB = hasMethod(left as any, 'HasContentBB') && Boolean((left as any).HasContentBB());
        const rightHasContentBB = hasMethod(right as any, 'HasContentBB') && Boolean((right as any).HasContentBB());
        const leftXPos = leftHasContentBB ? left.GetContentRight() : (left.GetDrawingX?.() ?? 0);
        const rightXPos = rightHasContentBB ? right.GetContentLeft() : (right.GetDrawingX?.() ?? 0);
        const currentTieLength = rightXPos - leftXPos - drawingUnit;
        if (currentTieLength < minTieLength
          && (left.GetFirstAncestor(ClassId.CHORD) !== null
            || layerElement.GetFirstAncestor(ClassId.CHORD) !== null
            || left.FindDescendantByType(ClassId.FLAG) !== null)) {
          const adjust = minTieLength - currentTieLength;
          alignment.SetXRel(alignment.GetXRel() + adjust);
          this.m_cumulatedXShift += adjust;
          this.m_upcomingMinPos += adjust;
        }
        break;
      }
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasure(measure: AdjustXPosMeasureLike): FunctorCode {
    this.m_minPos = 0;
    this.m_upcomingMinPos = VRV_UNSET;
    this.m_cumulatedXShift = 0;
    this.m_measure = measure;

    const system = measure.GetFirstAncestor(ClassId.SYSTEM) as AdjustXPosSystemLike | null;
    if (!system) throw new Error('AdjustXPosFunctor invariant: measure without system');

    const drawingScoreDef = system.GetDrawingScoreDef();
    const hasSystemStartLine = measure.IsFirstInSystem() && Boolean(drawingScoreDef?.HasSystemStartLine());

    const previousFilters = this.SetFilters(new Filters());
    try {
      for (const staffN of this.m_staffNs) {
        this.m_minPos = 0;
        this.m_upcomingMinPos = VRV_UNSET;
        this.m_cumulatedXShift = 0;
        this.m_staffN = staffN;
        this.m_boundingBoxes = [];
        this.m_previousAlignment.Reset();
        this.m_currentAlignment.Reset();

        const staffAlignment = system.m_systemAligner.GetStaffAlignmentForStaffN(staffN);
        this.m_staffSize = staffAlignment ? staffAlignment.GetStaffSize() : 100;
        this.m_isNeumeStaff = Boolean(staffAlignment?.GetStaff()?.IsNeume());

        const filters = new Filters();
        filters.SetType(Filters.Type.AnyOf);
        filters.Add(new AttNIntegerAnyComparison(ClassId.ALIGNMENT_REFERENCE, [-1, staffN]));
        filters.Add(new CrossAlignmentReferenceComparison());
        this.SetFilters(filters);

        if (hasSystemStartLine) {
          this.m_upcomingMinPos = this.m_doc.GetDrawingBarLineWidth(this.m_staffSize);
        }

        this.m_measureTieEndpoints = measure.GetInternalTieEndpoints();
        measure.m_measureAligner.Process(this);
      }
    } finally {
      this.SetFilters(previousFilters);
    }

    // There is no reason to adjust a minimum width with mensural music.
    if (!measure.IsMeasuredMusic()) return FunctorCode.FUNCTOR_SIBLINGS;

    let minMeasureWidth = this.m_doc.GetOptions().m_unit.GetValue()
      * this.m_doc.GetOptions().m_measureMinWidth.GetValue();

    const fullMeasure2 = measure.m_measureAligner.FindDescendantByComparison(
      { type: 'MeasureAlignerTypeComparison', alignmentType: ALIGNMENT_FULLMEASURE2 }, 1,
    );

    if (fullMeasure2 !== null) {
      minMeasureWidth *= 2;
    } else if (measure.FindDescendantByType(ClassId.NOTE) !== null || measure.GetMetcon() === BOOLEAN_false) {
      minMeasureWidth = 0;
    } else {
      const multiRestObject = measure.FindDescendantByType(ClassId.MULTIREST);
      if (multiRestObject) {
        const multiRest = multiRestObject as unknown as AdjustXPosMultiRestLike;
        const unit = this.m_doc.GetDrawingUnit(this.m_staffSize);
        const num = multiRest.GetNum();
        if (multiRest.HasWidth() && multiRest.GetWidthType() === MEASUREMENTTYPE_vu) {
          const fixedWidth = multiRest.GetWidthVu() * (unit + 4);
          if (minMeasureWidth < fixedWidth) minMeasureWidth = fixedWidth;
        } else if (num > 10) {
          minMeasureWidth *= Math.log1p(num) / 2;
        }

        const layer = multiRest.GetFirstAncestor(ClassId.LAYER);
        if (layer?.GetLast && layer.GetNext) {
          if (layer.GetLast() !== multiRest) {
            const nextObject = layer.GetNext(multiRest);
            if (nextObject?.Is(ClassId.CLEF)) {
              const clef = nextObject as unknown as { GetContentRight(): number; GetContentLeft(): number };
              const clefWidth = clef.GetContentRight() - clef.GetContentLeft();
              minMeasureWidth += clefWidth + unit;
            }
          }
        }
      }
    }

    const currentMeasureWidth = measure.GetRightBarLineLeft() - measure.GetLeftBarLineRight();
    if (currentMeasureWidth < minMeasureWidth) {
      measure.m_measureAligner.AdjustProportionally([[
        measure.GetLeftBarLine().GetAlignment(),
        measure.GetRightBarLine().GetAlignment(),
        minMeasureWidth - currentMeasureWidth,
      ]]);
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: AdjustXPosSystemLike): FunctorCode {
    const drawingScoreDef = system.GetDrawingScoreDef();
    if (drawingScoreDef) this.m_staffNs = [...drawingScoreDef.GetStaffNs()];
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private CalculateXPosOffset(layerElement: AdjustXPosLayerElementLike): [number, number] {
    let selfLeft = 0;
    const drawingUnit = this.m_doc.GetDrawingUnit(this.m_staffSize);
    const currentAlignment = layerElement.GetAlignment();
    const performBoundingBoxAlignment = Boolean(
      this.m_previousAlignment.m_alignment
      && this.m_previousAlignment.m_alignment.PerformBoundingBoxAlignment()
      && currentAlignment.PerformBoundingBoxAlignment(),
    );

    if (!layerElement.HasSelfBB() || layerElement.HasEmptyBB()) {
      selfLeft = currentAlignment.GetXRel();
      return [0, selfLeft];
    }

    this.m_upcomingBoundingBoxes.push(layerElement);
    this.m_currentAlignment.m_alignment = currentAlignment;

    if (!performBoundingBoxAlignment) {
      selfLeft = layerElement.GetSelfLeft();
      selfLeft -= this.m_doc.GetLeftMargin(layerElement) * drawingUnit;
      return [0, selfLeft];
    }

    selfLeft = currentAlignment.GetXRel();
    const selfLeftMargin = this.m_doc.GetLeftMargin(layerElement);
    let overlap = 0;

    for (const boundingBox of this.m_boundingBoxes) {
      const bboxElement = boundingBox as AdjustXPosLayerElementLike;
      let margin = (this.m_doc.GetRightMargin(bboxElement) + selfLeftMargin) * drawingUnit;

      if (bboxElement.Is(ClassId.NOTE) && bboxElement.HasStemMod() && bboxElement.GetStemMod() < STEMMODIFIER_MAX) {
        const tremWidth = this.m_doc.GetGlyphWidth(SMUFL_E220_tremolo1, this.m_staffSize, false);
        margin = Math.max(margin, drawingUnit / 3 + tremWidth / 2);
      }

      const hasOverlap = layerElement.HorizontalContentOverlap(boundingBox, margin);
      if (!hasOverlap) continue;

      if (layerElement.Is(ClassId.NOTE) && bboxElement.Is(ClassId.NOTE)) {
        overlap = Math.max(overlap, bboxElement.GetSelfRight() - layerElement.GetSelfLeft() + margin);
      } else if (layerElement.Is(ClassId.ACCID) && bboxElement.Is(ClassId.NOTE)) {
        const staff = layerElement.GetAncestorStaff();
        if (!staff) throw new Error('AdjustXPosFunctor invariant: accidental without staff');
        const staffTop = staff.GetDrawingY();
        const staffBottom = staffTop - this.m_doc.GetDrawingStaffSize(this.m_staffSize);
        let verticalMargin = 0;
        if ((layerElement.GetContentTop() > staffTop + 2 * drawingUnit)
          && (bboxElement.GetDrawingY() > staffTop)
          && (bboxElement.GetDrawingY() > layerElement.GetDrawingY())) {
          verticalMargin = bboxElement.GetDrawingY() - layerElement.GetDrawingY();
        } else if ((layerElement.GetContentBottom() < staffBottom - 2 * drawingUnit)
          && (bboxElement.GetDrawingY() < staffBottom)
          && (bboxElement.GetDrawingY() < layerElement.GetDrawingY())) {
          verticalMargin = layerElement.GetDrawingY() - bboxElement.GetDrawingY();
        }
        overlap = Math.max(overlap, boundingBox.HorizontalRightOverlap(layerElement, this.m_doc, margin, verticalMargin));
      } else if (layerElement.Is(ClassId.ACCID) && bboxElement.Is(ClassId.REST)) {
        const rest = bboxElement;
        const hasExplicitLoc = Boolean(
          ((rest as any).HasOloc?.() && (rest as any).HasPloc?.()) || (rest as any).HasLoc?.(),
        );
        const inBeam = Boolean((rest as any).IsInBeam?.());
        if (inBeam && !hasExplicitLoc) {
          overlap = Math.max(overlap, bboxElement.GetSelfRight() - layerElement.GetSelfLeft() + margin);
        } else {
          overlap = Math.max(overlap, boundingBox.HorizontalRightOverlap(layerElement, this.m_doc, margin));
        }
      } else {
        overlap = Math.max(overlap, boundingBox.HorizontalRightOverlap(layerElement, this.m_doc, margin));
      }

      if (!overlap && layerElement.IsAnyOf([ClassId.NOTE, ClassId.CHORD])
        && !layerElement.GetFirstAncestor(ClassId.TUPLET) && bboxElement.Is(ClassId.REST)
        && bboxElement.GetFirstAncestor(ClassId.TUPLET)) {
        const dur = bboxElement.GetDur?.();
        if (dur !== undefined && dur > DURATION_8) {
          overlap = 1.5 * (dur - DURATION_8) * drawingUnit;
        }
      }
    }

    return [-overlap, selfLeft];
  }
}
