/**
 * justifyfunctor.ts — canonical translation of src-cpp/src/justifyfunctor.cpp
 * + src-cpp/include/vrv/justifyfunctor.h.
 *
 * Three functors:
 *  - JustifyXFunctor: justify horizontal (X) positions across each system.
 *  - JustifyYFunctor: justify vertical (Y) positions down each page.
 *  - JustifyYAdjustCrossStaffFunctor: adjust cross-staff chord stems/flags
 *    after vertical justification.
 *
 * All three implement `ImplementsEndInterface() == false` per the C++ header.
 * `ShiftMap` is `std::map<const StaffAlignment *, int>` — pointer-identity
 * keyed, so the TS port uses a `Map<StaffAlignment, number>`.
 */

import { DocFunctor } from './functor.js';
import { FunctorCode } from './vrvdef.js';
import { AlignmentType } from './horizontalaligner.js';
import { SpacingType } from './verticalaligner.js';
import { STEMDIRECTION_up } from './drawinginterface.js';
import { ClassId } from './vrvdef.js';
import { StaffSearch } from './layerelement.js';
import { LogWarning } from './vrv.js';

/** TS structural boundary for Doc options consumed by justification. */
export interface JustifyDocLike {
  GetOptions(): {
    m_minLastJustification: { GetValue(): number };
    m_justificationSystem: { GetValue(): number };
  };
}

/** TS structural boundary for alignments with mutable X position. */
export interface JustifyAlignmentLike {
  GetType(): AlignmentType;
  GetXRel(): number;
  SetXRel(value: number): void;
}

/** TS structural boundary for measure aligners. */
export interface JustifyMeasureAlignerLike {
  GetLeftBarLineAlignment(): JustifyAlignmentLike | null;
  GetRightBarLineAlignment(): JustifyAlignmentLike | null;
  Process(functor: unknown): FunctorCode;
}

/** TS structural boundary for measures. */
export interface JustifyMeasureLike {
  GetDrawingXRel(): number;
  SetDrawingXRel(value: number): void;
  GetSectionRestartShift(doc: unknown): number;
  m_measureAligner: JustifyMeasureAlignerLike;
}

/** TS structural boundary for score definitions. */
export interface JustifyScoreDefLike {
  GetDrawingLabelsWidth(): number;
}

/** TS structural boundary for sections. */
export interface JustifySectionLike {
  GetRestart(): number;
}

/** TS structural boundary for systems. */
export interface JustifySystemLike {
  m_systemLeftMar: number;
  m_systemRightMar: number;
  m_drawingTotalWidth: number;
  m_drawingJustifiableWidth: number;
  m_systemAligner: { Process(functor: unknown): FunctorCode };
  IsLastOfMdiv(): boolean;
  IsLastOfSelection(): boolean;
  IsFirstInPage(): boolean;
  GetDrawingY(): number;
  SetDrawingYRel(value: number): void;
}

/** TS structural boundary for staff alignments. */
export interface JustifyStaffAlignmentLike {
  GetStaff(): unknown;
  GetSpacingType(): SpacingType;
  GetJustificationFactor(doc: unknown): number;
  GetYRel(): number;
  SetYRel(value: number): void;
}

/** TS structural boundary for staves. */
export interface JustifyStaffLike {
  GetN(): number;
  GetAlignment(): JustifyStaffAlignmentLike | null;
}

/** TS structural boundary for chords. */
export interface JustifyChordLike {
  GetTopNote(): { GetAncestorStaff(strategy?: number): JustifyStaffLike | null };
  GetBottomNote(): { GetAncestorStaff(strategy?: number): JustifyStaffLike | null };
  GetAncestorStaff(strategy?: number): JustifyStaffLike | null;
  FindDescendantByType(classId: number, depth?: number): unknown;
}

/** TS structural boundary for stems. */
export interface JustifyStemLike {
  GetDrawingStemLen(): number;
  SetDrawingStemLen(value: number): void;
  GetDrawingStemDir(): number;
  GetDrawingYRel(): number;
  SetDrawingYRel(value: number): void;
  FindDescendantByType(classId: number, depth?: number): unknown;
}

/** TS structural boundary for flags. */
export interface JustifyFlagLike {
  GetDrawingYRel(): number;
  SetDrawingYRel(value: number): void;
}

// `BOOLEAN_true` from data_BOOLEAN (atts libmei): NONE=0, true=1, false=2.
const BOOLEAN_true = 1;

/** C++ `ShiftMap = std::map<const StaffAlignment *, int>`. */
export type ShiftMap = Map<JustifyStaffAlignmentLike, number>;

//----------------------------------------------------------------------------
// JustifyXFunctor
//----------------------------------------------------------------------------

export class JustifyXFunctor extends DocFunctor {
  private m_measureXRel = 0;
  private m_justifiableRatio = 1.0;
  private m_leftBarLineX = 0;
  private m_rightBarLineX = 0;
  private m_systemFullWidth = 0;
  private m_applySectionRestartShift = false;

  public constructor(doc: unknown) {
    super(doc as never);
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public SetSystemFullWidth(width: number): void { this.m_systemFullWidth = width; }

  public VisitAlignment(alignment: JustifyAlignmentLike): FunctorCode {
    const alignmentType = alignment.GetType();
    if (alignmentType <= AlignmentType.ALIGNMENT_MEASURE_LEFT_BARLINE) {
      // Nothing to do for all left scoreDef elements and the left barline
    }
    else if (alignmentType < AlignmentType.ALIGNMENT_MEASURE_RIGHT_BARLINE) {
      // All elements up to the next barline, move them but also take into account the leftBarlineX
      alignment.SetXRel(Math.ceil((alignment.GetXRel() - this.m_leftBarLineX) * this.m_justifiableRatio + this.m_leftBarLineX));
    }
    else {
      // Now move the right barline and all right scoreDef elements
      const shift = alignment.GetXRel() - this.m_rightBarLineX;
      alignment.SetXRel(
        Math.ceil((this.m_rightBarLineX - this.m_leftBarLineX) * this.m_justifiableRatio + this.m_leftBarLineX + shift),
      );
    }

    // Finally, when reaching the end of the measure, update the measureXRel for the next measure
    if (alignmentType === AlignmentType.ALIGNMENT_MEASURE_END) {
      this.m_measureXRel += alignment.GetXRel();
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: JustifyMeasureLike): FunctorCode {
    if (this.m_applySectionRestartShift) {
      this.m_measureXRel += measure.GetSectionRestartShift((this as any).m_doc);
      this.m_applySectionRestartShift = false;
    }

    if (this.m_measureXRel > 0) {
      measure.SetDrawingXRel(this.m_measureXRel);
    }
    else {
      this.m_measureXRel = measure.GetDrawingXRel();
    }

    measure.m_measureAligner.Process(this);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitMeasureAligner(measureAligner: JustifyMeasureAlignerLike): FunctorCode {
    this.m_leftBarLineX = measureAligner.GetLeftBarLineAlignment()!.GetXRel();
    this.m_rightBarLineX = measureAligner.GetRightBarLineAlignment()!.GetXRel();

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitScoreDef(scoreDef: JustifyScoreDefLike): FunctorCode {
    if (scoreDef.GetDrawingLabelsWidth() > 0) {
      this.m_measureXRel += scoreDef.GetDrawingLabelsWidth();
      this.m_applySectionRestartShift = false;
    }

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSection(section: JustifySectionLike): FunctorCode {
    if (section.GetRestart() === BOOLEAN_true) {
      this.m_applySectionRestartShift = true;
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitSystem(system: JustifySystemLike): FunctorCode {
    this.m_measureXRel = 0;
    const margins = system.m_systemLeftMar + system.m_systemRightMar;
    const nonJustifiableWidth = margins
      + (system.m_drawingTotalWidth - system.m_drawingJustifiableWidth); // m_drawingTotalWidth includes the labels
    this.m_justifiableRatio
      = (this.m_systemFullWidth - nonJustifiableWidth) / system.m_drawingJustifiableWidth;

    if (this.m_justifiableRatio < 0.8) {
      // Arbitrary value for avoiding over-compressed justification
      LogWarning('Justification is highly compressed (ratio smaller than 0.8: %f)', this.m_justifiableRatio);
      LogWarning('\tSystem full width: %d', this.m_systemFullWidth);
      LogWarning('\tNon-justifiable width: %d', nonJustifiableWidth);
      LogWarning('\tDrawing justifiable width: %d', system.m_drawingJustifiableWidth);
    }

    // Check if we are on the last system of an mdiv.
    // Do not justify it if the non-justified width is less than a specified percent.
    if (system.IsLastOfMdiv() || system.IsLastOfSelection()) {
      const minLastJust = ((this as any).m_doc as JustifyDocLike).GetOptions().m_minLastJustification.GetValue();
      if (minLastJust > 0.0 && this.m_justifiableRatio > 1.0 / minLastJust) {
        return FunctorCode.FUNCTOR_SIBLINGS;
      }
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

//----------------------------------------------------------------------------
// JustifyYFunctor
//----------------------------------------------------------------------------

export class JustifyYFunctor extends DocFunctor {
  private m_cumulatedShift = 0;
  private m_relativeShift = 0;
  private m_spaceToDistribute = 0;
  private m_justificationSum = 0.0;
  private m_shiftForStaff: ShiftMap = new Map();

  public constructor(doc: unknown) {
    super(doc as never);
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public SetJustificationSum(justificationSum: number): void { this.m_justificationSum = justificationSum; }
  public SetSpaceToDistribute(space: number): void { this.m_spaceToDistribute = space; }
  public GetShiftForStaff(): ShiftMap { return this.m_shiftForStaff; }

  public VisitStaffAlignment(staffAlignment: JustifyStaffAlignmentLike): FunctorCode {
    if (this.m_justificationSum <= 0.0) return FunctorCode.FUNCTOR_STOP;
    if (this.m_spaceToDistribute <= 0) return FunctorCode.FUNCTOR_STOP;

    // Skip bottom aligner and first staff
    if (staffAlignment.GetStaff() && staffAlignment.GetSpacingType() !== SpacingType.System) {
      // C++ `const int shift` truncates each per-staff shift; cumulated shifts stay int.
      const shift = Math.trunc((staffAlignment.GetJustificationFactor((this as any).m_doc) / this.m_justificationSum) * this.m_spaceToDistribute);
      this.m_relativeShift += shift;
      this.m_cumulatedShift += shift;

      staffAlignment.SetYRel(staffAlignment.GetYRel() - this.m_relativeShift);
    }

    this.m_shiftForStaff.set(staffAlignment, this.m_cumulatedShift);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: JustifySystemLike): FunctorCode {
    if (this.m_justificationSum <= 0.0) return FunctorCode.FUNCTOR_STOP;
    if (this.m_spaceToDistribute <= 0) return FunctorCode.FUNCTOR_STOP;

    const systemJustificationFactor
      = ((this as any).m_doc as JustifyDocLike).GetOptions().m_justificationSystem.GetValue();
    // C++ `const double shift` narrows into `int m_cumulatedShift` on accumulation.
    const shift = Math.trunc((systemJustificationFactor / this.m_justificationSum) * this.m_spaceToDistribute);

    if (!system.IsFirstInPage()) {
      this.m_cumulatedShift += shift;
    }

    system.SetDrawingYRel(system.GetDrawingY() - this.m_cumulatedShift);

    this.m_relativeShift = 0;
    system.m_systemAligner.Process(this);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}

//----------------------------------------------------------------------------
// JustifyYAdjustCrossStaffFunctor
//----------------------------------------------------------------------------

export class JustifyYAdjustCrossStaffFunctor extends DocFunctor {
  private m_shiftForStaff: ShiftMap = new Map();

  public constructor(doc: unknown) {
    super(doc as never);
  }

  public override ImplementsEndInterface(): boolean { return false; }

  /** Transfer the shift map (C++ copies the map by value). */
  public SetShiftForStaff(shiftMap: ShiftMap): void { this.m_shiftForStaff = new Map(shiftMap); }

  public VisitChord(chord: JustifyChordLike): FunctorCode {
    // Check if chord spreads across several staves
    const extremalStaves = new Map<number, JustifyStaffLike>();
    for (const note of [chord.GetTopNote(), chord.GetBottomNote()]) {
      const staff = note.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
      if (!staff) continue;
      extremalStaves.set(staff.GetN(), staff);
    }
    // get chord parent staff
    const staff = chord.GetAncestorStaff(StaffSearch.RESOLVE_CROSS_STAFF);
    if (staff) extremalStaves.set(staff.GetN(), staff);

    if (extremalStaves.size < 2) return FunctorCode.FUNCTOR_CONTINUE;

    const keys = [...extremalStaves.keys()].sort((a, b) => a - b);
    const first = extremalStaves.get(keys[0])!;
    const last = extremalStaves.get(keys[keys.length - 1])!;

    const shift = this.GetShift(last) - this.GetShift(first);

    // Add the shift to the stem length of the chord
    const stem = chord.FindDescendantByType(ClassId.STEM) as JustifyStemLike | null;
    if (!stem) return FunctorCode.FUNCTOR_CONTINUE;

    const stemLen = stem.GetDrawingStemLen();
    if (stem.GetDrawingStemDir() === STEMDIRECTION_up) {
      stem.SetDrawingStemLen(stemLen - shift);
    }
    else {
      stem.SetDrawingStemLen(stemLen + shift);
    }

    // Reposition the stem
    const rootStaff = stem.GetDrawingStemDir() === STEMDIRECTION_up ? last : first;
    stem.SetDrawingYRel(stem.GetDrawingYRel() + this.GetShift(staff!) - this.GetShift(rootStaff));

    // Add the shift to the flag position
    const flag = stem.FindDescendantByType(ClassId.FLAG) as JustifyFlagLike | null;
    if (flag) {
      const sign = stem.GetDrawingStemDir() === STEMDIRECTION_up ? 1 : -1;
      flag.SetDrawingYRel(flag.GetDrawingYRel() + sign * shift);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  /** Calculate the shift due to vertical justification. */
  private GetShift(staff: JustifyStaffLike | null): number {
    if (!staff) return 0;
    const alignment = staff.GetAlignment();
    if (alignment && this.m_shiftForStaff.has(alignment)) {
      return this.m_shiftForStaff.get(alignment)!;
    }
    return 0;
  }
}
