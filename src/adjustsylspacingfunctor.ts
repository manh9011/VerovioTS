/**
 * Pure TypeScript translation of Verovio's src/adjustsylspacingfunctor.cpp.
 *
 * Control flow, state transitions and spacing arithmetic mirror the canonical
 * C++ implementation. Domain classes which are not migrated yet are modeled
 * through explicit structural contracts; no native/WebAssembly runtime is used.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode } from './vrvdef.js';

export type AdjustmentTuple = [AdjustSylAlignmentLike, AdjustSylAlignmentLike, number];

export interface AdjustSylDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
}

export interface AdjustSylAlignmentLike {
  GetXRel(): number;
}

export interface AdjustSylMeasureAlignerLike {
  AdjustProportionally(adjustments: AdjustmentTuple[]): void;
}

export interface AdjustSylAlignmentRefLike {
  GetAlignment(): AdjustSylAlignmentLike;
}

export interface AdjustSylBarLineLike extends AdjustSylAlignmentRefLike {}

export interface AdjustSylMeasureLike {
  m_measureAligner: AdjustSylMeasureAlignerLike;
  GetWidth(): number;
  GetRightBarLine(): AdjustSylBarLineLike;
  GetFirstAncestor?(classId: ClassId): AdjustSylMeasureLike | null;
}

export interface AdjustSylObjectLike {
  GetFirstAncestor(classId: ClassId): AdjustSylMeasureLike | null;
}

export interface AdjustSylLayerElementLike extends AdjustSylObjectLike {
  IsLyricElement(): boolean;
  GetDrawingXRel(): number;
  SetDrawingXRel(value: number): void;
  GetAlignment(): AdjustSylAlignmentLike;
}

export interface AdjustSylLyricElementLike extends AdjustSylLayerElementLike {
  Is(classId: ClassId): boolean;
  AdjustPosition(overlap: { value: number }, freeSpace: number, doc: AdjustSylDocLike): number;
  GetVoltaCount(): number;
  HasVoltasym(): boolean;
  GetVoltasym(): number;
  FindAllDescendantsByType(classId: ClassId): AdjustSylObjectLike[];
}

export interface AdjustSylSylLike extends AdjustSylObjectLike {
  HasContentHorizontalBB(): boolean;
  SetDrawingXRel(value: number): void;
  GetContentX2(): number;
  GetContentRight(): number;
  GetContentLeft(): number;
  CalcConnectorSpacing(doc: AdjustSylDocLike, staffSize: number): number;
}

export interface AdjustSylVerseLike extends AdjustSylLyricElementLike {
  SetDrawingLabelAbbr(value: AdjustSylLabelAbbrLike | null): void;
  FindDescendantByType(classId: ClassId): AdjustSylObjectLike | null;
}

export interface AdjustSylLabelLike extends AdjustSylLayerElementLike {
  GetContentX1(): number;
  GetContentX2(): number;
}

export interface AdjustSylLabelAbbrLike extends AdjustSylObjectLike {}

export interface AdjustSylVoltaLike extends AdjustSylLyricElementLike {
  GetDrawingVoltaN(): number;
  FindAllDescendantsByType(classId: ClassId): AdjustSylObjectLike[];
}

export interface AdjustSylStaffLike {
  m_drawingStaffSize: number;
}

export interface AdjustSylSystemLike {}

function asSyl(value: AdjustSylObjectLike): AdjustSylSylLike {
  return value as AdjustSylSylLike;
}

function asVerse(value: AdjustSylLyricElementLike): AdjustSylVerseLike {
  return value as AdjustSylVerseLike;
}

function asVolta(value: AdjustSylObjectLike): AdjustSylVoltaLike {
  return value as AdjustSylVoltaLike;
}

function adjustLyricPosition(
  container: AdjustSylLayerElementLike,
  overlapRef: { value: number },
  freeSpace: number,
  doc: AdjustSylDocLike,
): number {
  if (container.IsLyricElement()) {
    return (container as AdjustSylLyricElementLike).AdjustPosition(overlapRef, freeSpace, doc);
  }

  let nextFreeSpace = 0;
  if (overlapRef.value > 0) {
    if (freeSpace > overlapRef.value) {
      container.SetDrawingXRel(container.GetDrawingXRel() - overlapRef.value);
      overlapRef.value = 0;
    } else if (freeSpace > 0) {
      container.SetDrawingXRel(container.GetDrawingXRel() - freeSpace);
      overlapRef.value -= freeSpace;
    }
  } else {
    nextFreeSpace = Math.min(-overlapRef.value, 3 * doc.GetDrawingUnit(100));
  }
  return nextFreeSpace;
}

function getVoltaGroupingSymbolWidth(lyricElement: AdjustSylLyricElementLike, unit: number): number {
  if ((lyricElement.GetVoltaCount() < 2) || !lyricElement.HasVoltasym()) return 0;

  switch (lyricElement.GetVoltasym()) {
    // AttVoltaGroupingSym enum values in the canonical source are kept as
    // stable numeric constants here to avoid coupling this pass to an
    // unmigrated attribute implementation.
    case 1: // voltaGroupingSym_VOLTASYM_brace
      return 3 * unit;
    case 2: // voltaGroupingSym_VOLTASYM_bracket
    case 3: // voltaGroupingSym_VOLTASYM_bracketsq
    case 4: // voltaGroupingSym_VOLTASYM_line
      return 2 * unit;
    default:
      return 0;
  }
}

export class AdjustSylSpacingFunctor extends DocFunctor {
  private m_overlappingSyl: AdjustmentTuple[] = [];
  private m_previousContainer: AdjustSylLayerElementLike | null = null;
  private m_lastSyl: AdjustSylSylLike | null = null;
  private m_previousMeasure: AdjustSylMeasureLike | null = null;
  private m_currentLabelAbbr: AdjustSylLabelAbbrLike | null = null;
  private m_freeSpace = 0;
  private m_staffSize = 100;
  private readonly m_voltaTrack: number;

  public constructor(doc: AdjustSylDocLike, voltaTrack = 0) {
    super(doc);
    this.m_previousContainer = null;
    this.m_lastSyl = null;
    this.m_previousMeasure = null;
    this.m_currentLabelAbbr = null;
    this.m_freeSpace = 0;
    this.m_staffSize = 100;
    this.m_voltaTrack = voltaTrack;
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitMeasureEnd(measure: AdjustSylMeasureLike): FunctorCode {
    this.m_previousMeasure = measure;
    measure.m_measureAligner.AdjustProportionally(this.m_overlappingSyl);
    this.m_overlappingSyl.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitStaff(staff: AdjustSylStaffLike): FunctorCode {
    this.m_staffSize = staff.m_drawingStaffSize;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(_system: AdjustSylSystemLike): FunctorCode {
    this.m_overlappingSyl.length = 0;
    this.m_previousContainer = null;
    this.m_previousMeasure = null;
    this.m_freeSpace = 0;
    this.m_staffSize = 100;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystemEnd(_system: AdjustSylSystemLike): FunctorCode {
    if (!this.m_previousMeasure) return FunctorCode.FUNCTOR_CONTINUE;

    if (this.m_previousContainer && this.m_lastSyl) {
      const overlapRef = {
        value: this.m_lastSyl.GetContentRight()
          - this.m_previousMeasure.GetRightBarLine().GetAlignment().GetXRel(),
      };
      adjustLyricPosition(this.m_previousContainer, overlapRef, this.m_freeSpace, this.m_doc as AdjustSylDocLike);

      // Preserve the C++ identity check: only an overlap that ends inside the
      // same measure as the previous container contributes to the proportional
      // adjustment list here.
      const firstAncestor = this.m_previousContainer.GetFirstAncestor(ClassId.MEASURE);
      if (firstAncestor === this.m_previousMeasure && overlapRef.value > 0) {
        this.m_overlappingSyl.push([
          this.m_previousContainer.GetAlignment(),
          this.m_previousMeasure.GetRightBarLine().GetAlignment(),
          overlapRef.value,
        ]);
      }
    }

    this.m_previousMeasure.m_measureAligner.AdjustProportionally(this.m_overlappingSyl);
    this.m_overlappingSyl.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitVerse(verse: AdjustSylVerseLike): FunctorCode {
    return this.VisitLyricElement(verse);
  }

  public VisitRefrain(refrain: AdjustSylLyricElementLike): FunctorCode {
    return this.VisitLyricElement(refrain);
  }

  public VisitLyricElement(lyricElement: AdjustSylLyricElementLike): FunctorCode {
    const verse = lyricElement as AdjustSylVerseLike;

    if (lyricElement.Is(ClassId.VERSE) && verse.FindDescendantByType(ClassId.LABEL)) {
      this.m_currentLabelAbbr = null;
    }

    let newLabelAbbr = false;
    if (lyricElement.Is(ClassId.VERSE)) verse.SetDrawingLabelAbbr(null);

    if (lyricElement.Is(ClassId.VERSE) && this.m_currentLabelAbbr === null) {
      const found = verse.FindDescendantByType(ClassId.LABELABBR);
      this.m_currentLabelAbbr = found as AdjustSylLabelAbbrLike | null;
      newLabelAbbr = true;
    }

    let container: AdjustSylLayerElementLike = lyricElement;
    let syls: AdjustSylObjectLike[];

    if (this.m_voltaTrack === 0) {
      syls = lyricElement.FindAllDescendantsByType(ClassId.SYL)
        .filter((syl) => syl.GetFirstAncestor(ClassId.VOLTA) === null);
    } else {
      syls = [];
      for (const object of lyricElement.FindAllDescendantsByType(ClassId.VOLTA)) {
        const volta = asVolta(object);
        if (volta.GetDrawingVoltaN() === this.m_voltaTrack) {
          container = volta;
          syls = volta.FindAllDescendantsByType(ClassId.SYL);
          break;
        }
      }
      if (container === lyricElement) return FunctorCode.FUNCTOR_CONTINUE;
    }

    let shift = (this.m_doc as AdjustSylDocLike).GetDrawingUnit(this.m_staffSize);
    // Canonical static Syl::AdjustToLyricSize() modifies the shift in-place.
    // Until Syl itself is migrated, expose the operation through an optional
    // document hook without changing the default numerical behavior.
    const adjustToLyricSize = (this.m_doc as AdjustSylDocLike & {
      AdjustToLyricSize?: (value: number) => number;
    }).AdjustToLyricSize;
    if (adjustToLyricSize) shift = adjustToLyricSize(shift);

    let previousSylShift = 0;
    const groupingSymbolWidth = this.m_voltaTrack > 0
      ? getVoltaGroupingSymbolWidth(lyricElement, shift)
      : 0;
    container.SetDrawingXRel(-shift);

    for (let i = syls.length - 1; i >= 0; i--) {
      const syl = asSyl(syls[i]);
      if (!syl.HasContentHorizontalBB()) syls.splice(i, 1);
    }
    for (const object of syls) {
      const syl = asSyl(object);
      syl.SetDrawingXRel(previousSylShift);
      previousSylShift += syl.GetContentX2() + syl.CalcConnectorSpacing(this.m_doc as AdjustSylDocLike, this.m_staffSize);
    }

    if (syls.length === 0) return FunctorCode.FUNCTOR_CONTINUE;

    const firstSyl = asSyl(syls[0]);
    const lastSyl = asSyl(syls[syls.length - 1]);

    if (this.m_previousContainer === null) {
      this.m_previousContainer = container;
      this.m_lastSyl = lastSyl;

      if (lyricElement.Is(ClassId.VERSE) && !newLabelAbbr && this.m_currentLabelAbbr) {
        verse.SetDrawingLabelAbbr(this.m_currentLabelAbbr);
      }

      this.m_freeSpace = 0;
      this.m_previousMeasure = null;
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let xShift = 0;
    if (this.m_previousMeasure) xShift = this.m_previousMeasure.GetWidth();

    const overlapRef = {
      value: this.m_lastSyl!.GetContentRight() - (firstSyl.GetContentLeft() + xShift),
    };
    overlapRef.value += this.m_lastSyl!.CalcConnectorSpacing(this.m_doc as AdjustSylDocLike, this.m_staffSize);
    overlapRef.value += groupingSymbolWidth;

    const label = lyricElement.Is(ClassId.VERSE)
      ? verse.FindDescendantByType(ClassId.LABEL) as AdjustSylLabelLike | null
      : null;
    if (label) {
      overlapRef.value += (label.GetContentX2() - label.GetContentX1())
        + (this.m_doc as AdjustSylDocLike).GetDrawingDoubleUnit(this.m_staffSize);
    }

    const nextFreeSpace = adjustLyricPosition(
      this.m_previousContainer,
      overlapRef,
      this.m_freeSpace,
      this.m_doc as AdjustSylDocLike,
    );

    if (overlapRef.value > 0) {
      if (this.m_previousMeasure) {
        this.m_overlappingSyl.push([
          this.m_previousContainer.GetAlignment(),
          this.m_previousMeasure.GetRightBarLine().GetAlignment(),
          overlapRef.value,
        ]);
        this.m_previousMeasure.m_measureAligner.AdjustProportionally(this.m_overlappingSyl);
        this.m_overlappingSyl.length = 0;
      } else {
        this.m_overlappingSyl.push([
          this.m_previousContainer.GetAlignment(),
          container.GetAlignment(),
          overlapRef.value,
        ]);
      }
    }

    this.m_previousContainer = container;
    this.m_lastSyl = lastSyl;
    this.m_freeSpace = nextFreeSpace;
    this.m_previousMeasure = null;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}
