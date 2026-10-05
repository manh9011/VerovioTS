/**
 * Pure TypeScript translation of Verovio's `src/verticalaligner.cpp`
 * + `include/vrv/verticalaligner.h` (`SystemAligner`, `StaffAlignment`).
 *
 * Preserved from the canonical C++ implementation:
 * - SystemAligner bottom-alignment lifecycle (created in Reset, temporarily
 *   popped in GetStaffAlignment, re-appended after insertion);
 * - incremental StaffAlignment creation keyed on staff @n;
 * - ReorderBy uniqueness/size guards and in-place child replacement;
 * - spacing-type map (std::map ordered by staff @n -> Map ascending iteration);
 * - CalculateSpacingAbove staff-group walk with GrpSym brace/bracket resolution;
 * - verse bookkeeping above/below with collapse semantics and flat positions;
 * - overflow/overlap/requested-space max-keep setters;
 * - justification factors by spacing type with staff-size scaling;
 * - minimum spacing resolution (staffDef spacing, spacing.type switch, ossia
 *   ratio, bracket/brace option overrides, bottom half-spacing);
 * - bracket-group spacing adjustment using bracket glyph heights;
 * - floating positioner storage/sorting/lookup on StaffAlignment.
 *
 * TypeScript adaptations:
 * - `IsSet()` on options is modeled as `value !== default` because the
 *   migrated Option classes track no explicit set flag (C++ IsSet is
 *   `m_value != m_defaultValue`); the option contract here exposes the
 *   canonical C++ accessor surface `IsSet()`/`GetValue()`.
 * - `VisibleStaffDefOrGrpObject` is defined locally (comparison.cpp is not yet
 *   migrated) extending the established mock Comparison base. Reconcile when
 *   comparison.cpp migrates.
 * - Collaborators (Doc, Options, Staff, ScoreDef, StaffDef, StaffGrp, GrpSym,
 *   LyricElement, FloatingObject) are structural contracts — no layout logic
 *   beyond the canonical verticalaligner.cpp algorithm is invented.
 */
import { VrvObject } from './object.js';
import { ClassId, FunctorCode, VRV_UNSET } from './vrvdef.js';
import { Comparison } from './comparison.js';
import { FloatingObject, FloatingPositioner, FloatingCurvePositioner } from './floatingobject.js';
import { BoundingBox, SegmentedLine } from './boundingbox.js';
import { SMUFL_E003_bracketTop, SMUFL_E004_bracketBottom } from './smufl.js';
import { LogWarning } from './vrv.js';
import type { System } from './system.js';

/** C++ `SystemAligner::SpacingType` — ordering preserved. */
export enum SpacingType {
  System = 0,
  Staff = 1,
  Brace = 2,
  Bracket = 3,
  Ossia = 4,
  None = 5,
}

// staffGroupingSym_SYMBOL_* ordinals (libmei atttypes.h)
const staffGroupingSym_SYMBOL_brace = 1;
const staffGroupingSym_SYMBOL_bracket = 2;
const staffGroupingSym_SYMBOL_bracketsq = 3;
// MEASUREMENTTYPE_* ordinals (libmei atttypes.h)
const MEASUREMENTTYPE_vu = 1;
const MEASUREMENTTYPE_px = 2;
// STAFFREL_* ordinals (libmei atttypes.h)
const STAFFREL_above = 1;
// OPTIMIZATION_HIDDEN (staff VisibilityOptimization)
const OPTIMIZATION_HIDDEN = 1;

/** Structural contract for option values used by the aligners (C++ surface). */
export interface VerticalAlignerOptionLike {
  isSet(): boolean;
  GetValue(): number;
}

export interface VerticalAlignerOptionsLike {
  m_spacingStaff: VerticalAlignerOptionLike;
  m_spacingBraceGroup: VerticalAlignerOptionLike;
  m_spacingBracketGroup: VerticalAlignerOptionLike;
  m_spacingOssia: VerticalAlignerOptionLike;
  m_ossiaStaffSize: VerticalAlignerOptionLike;
  m_justificationSystem: VerticalAlignerOptionLike;
  m_justificationStaff: VerticalAlignerOptionLike;
  m_justificationBraceGroup: VerticalAlignerOptionLike;
  m_justificationBracketGroup: VerticalAlignerOptionLike;
  m_lyricVerseCollapse: VerticalAlignerOptionLike;
  m_bracketThickness: VerticalAlignerOptionLike;
}

/** Structural Doc contract used by both aligners. */
export interface VerticalAlignerDocLike {
  GetOptions(): VerticalAlignerOptionsLike;
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
  GetBottomMargin(classId: ClassId): number;
  GetGlyphHeight(glyph: number, staffSize: number, grace: boolean): number;
}

/** Structural Staff contract. */
export interface VerticalAlignerStaffLike {
  GetN(): number;
  GetID(): string;
  IsOssia(): boolean;
  m_drawingLines: number;
  m_drawingStaffSize: number;
  m_drawingStaffDef: StaffDefSpacingLike | null;
  GetFirstAncestor(classId: ClassId): VrvObject | null;
}

/** StaffDef surface used by spacing resolution (AttStaffDefVis spacing + ossia). */
export interface StaffDefSpacingLike {
  HasSpacing(): boolean;
  GetSpacing(): { GetType(): number; GetPx(): number; GetVu(): number };
  GetN(): number;
  GetDrawingVisibility(): number;
  GetOssiaAboveNs(out: number[]): void;
  GetOssiaBelowNs(out: number[]): void;
}

/** ScoreDef surface used by SetSpacing / GetAttSpacing (ScoreDefInterface). */
export interface ScoreDefSpacingLike {
  GetList(): VrvObject[];
}

/** LyricElement surface used by AddLyricElement. */
export interface LyricElementLike {
  Is(classId: ClassId): boolean;
  GetLyricLineCount(): number;
  GetDrawingVerseN(): number;
  GetPlace(): number;
}

/** FloatingObject surface used by positioner creation. */
export interface AlignerFloatingObjectLike {
  GetClassId(): ClassId;
  SetCurrentFloatingPositioner(positioner: FloatingPositioner | null): void;
  IsCloserToStaffThan(other: AlignerFloatingObjectLike, drawingPlace: number): boolean;
}

// VisibleStaffDefOrGrpObject lives in comparison.ts (C++ comparison.cpp).
// Re-exported here so existing imports keep working.
import { VisibleStaffDefOrGrpObject } from './comparison.js';

//----------------------------------------------------------------------------
// SystemAligner
//----------------------------------------------------------------------------

export class SystemAligner extends VrvObject {
  /** Staff @n -> spacing type above (std::map ordered by key). */
  private m_spacingTypes = new Map<number, SpacingType>();
  /** Bottom alignment (owned child, always last). */
  private m_bottomAlignment: StaffAlignment | null = null;
  /** Cached parent system pointer. */
  private m_system: System | null = null;

  public constructor() {
    super(ClassId.SYSTEM_ALIGNER);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    // C++ fields exist before the ctor body; TS field initializers run after
    // super(), but VrvObject.Init() dispatches Reset() virtually during super().
    // Lazy-init so the early virtual call does not touch undefined fields.
    if (!this.m_spacingTypes) this.m_spacingTypes = new Map<number, SpacingType>();
    this.m_spacingTypes.clear();
    this.m_system = null;
    this.m_bottomAlignment = new StaffAlignment();
    this.m_bottomAlignment.SetStaff(null, null, this.GetAboveSpacingType(null));
    this.m_bottomAlignment.SetParentSystem(this.GetSystem());
    this.AddChild(this.m_bottomAlignment);
  }

  public override IsSupportedChild(_classId: ClassId): boolean {
    return true;
  }

  /** Do not copy children for aligners (C++ CopyChildren override). */
  public override CopyChildren(): boolean {
    return false;
  }

  public GetBottomAlignment(): StaffAlignment | null {
    return this.m_bottomAlignment;
  }

  public GetStaffAlignment(_idx: number, staff: VerticalAlignerStaffLike, doc: VerticalAlignerDocLike): StaffAlignment {
    const children = this.GetChildrenForModification();
    if (!this.m_bottomAlignment) throw new Error('SystemAligner: bottom alignment missing');
    children.pop();
    const alignment = this.GetStaffAlignmentForStaffN(staff.GetN());
    if (alignment) {
      children.push(this.m_bottomAlignment);
      return alignment;
    }
    const created = new StaffAlignment();
    created.SetStaff(staff, doc, this.GetAboveSpacingType(staff));
    created.SetParentSystem(this.GetSystem());
    this.AddChild(created);
    children.push(this.m_bottomAlignment);
    return created;
  }

  public ReorderBy(staffNs: number[]): void {
    const order = [...staffNs];
    order.sort((a, b) => a - b);
    const unique: number[] = [];
    for (const n of order) {
      if (unique.length === 0 || unique[unique.length - 1] !== n) unique.push(n);
    }
    if (unique.length !== staffNs.length) return;
    const children = this.GetChildrenForModification();
    if (children.length > staffNs.length + 1) return;
    const orderedAlignments: StaffAlignment[] = [];
    for (const staffN of staffNs) {
      const alignment = this.GetStaffAlignmentForStaffN(staffN);
      if (!alignment) continue;
      orderedAlignments.push(alignment);
    }
    let i = 0;
    for (const alignment of orderedAlignments) {
      children[i] = alignment as VrvObject;
      ++i;
    }
  }

  public GetStaffAlignmentForStaffN(staffN: number): StaffAlignment | null {
    const count = this.GetChildren().length;
    for (let i = 0; i < count; ++i) {
      const child = this.GetChild(i);
      const alignment = child as unknown as StaffAlignment;
      if (!alignment) throw new Error('SystemAligner: child is not a StaffAlignment');
      const staff = alignment.GetStaff() as VerticalAlignerStaffLike | null;
      if (staff && staff.GetN() === staffN) return alignment;
    }
    return null;
  }

  /** Get pointer to the parent system (cached first-ancestor lookup). */
  public GetSystem(): System | null {
    if (this.m_system === null) {
      this.m_system = this.GetFirstAncestor(ClassId.SYSTEM) as System | null;
    }
    return this.m_system;
  }

  /** Find all the positioners pointing to an object. */
  public FindAllPositionerPointingTo(positioners: FloatingPositioner[], object: FloatingObject): void {
    positioners.length = 0;

    for (const child of this.GetChildren()) {
      const alignment = child as unknown as StaffAlignment;
      if (!alignment) throw new Error('SystemAligner: child is not a StaffAlignment');
      const positioner = alignment.GetCorrespFloatingPositioner(object);
      if (positioner && positioner.GetObject() === object) {
        positioners.push(positioner);
      }
    }
  }

  /** Find all intersection points with a vertical line (top to bottom). */
  public FindAllIntersectionPoints(
    line: SegmentedLine,
    boundingBox: BoundingBox,
    classIds: ClassId[],
    margin: number,
  ): void {
    for (const child of this.GetChildren()) {
      const alignment = child as unknown as StaffAlignment;
      if (!alignment) throw new Error('SystemAligner: child is not a StaffAlignment');
      alignment.FindAllIntersectionPoints(line, boundingBox, classIds, margin);
    }
  }

  /** Get overflow above the top staff. */
  public GetOverflowAbove(_doc: VerticalAlignerDocLike, scoreDefClef = false): number {
    const count = this.GetChildren().length;
    if (count === 0 || this.GetChild(0) === this.m_bottomAlignment) return 0;

    const alignment = this.GetChild(0) as unknown as StaffAlignment;
    return scoreDefClef ? alignment.GetScoreDefClefOverflowAbove() : alignment.GetOverflowAbove();
  }

  /** Get overflow below the bottom staff. */
  public GetOverflowBelow(_doc: VerticalAlignerDocLike, scoreDefClef = false): number {
    const count = this.GetChildren().length;
    if (count === 0 || this.GetChild(0) === this.m_bottomAlignment) return 0;

    const alignment = this.GetChild(count - 2) as unknown as StaffAlignment;
    return scoreDefClef ? alignment.GetScoreDefClefOverflowBelow() : alignment.GetOverflowBelow();
  }

  /** Get justification sum across all staff alignments. */
  public GetJustificationSum(doc: VerticalAlignerDocLike): number {
    let justificationSum = 0.0;
    for (const child of this.GetChildren()) {
      const alignment = child as unknown as StaffAlignment;
      justificationSum += alignment ? alignment.GetJustificationFactor(doc) : 0.0;
    }
    return justificationSum;
  }

  /** Calculates and sets spacing for the given ScoreDef. */
  public SetSpacing(scoreDef: ScoreDefSpacingLike | null): void {
    this.m_spacingTypes.clear();
    if (!scoreDef) return;

    const childList = scoreDef.GetList();
    for (const object of childList) {
      // It should be staffDef only, but double check.
      if (object.GetClassId() !== ClassId.STAFFDEF) continue;
      const staffDef = object as unknown as StaffDefSpacingLike;
      const spacing = this.CalculateSpacingAbove(staffDef);

      // Get the ossias above
      const ns: number[] = [];
      staffDef.GetOssiaAboveNs(ns);
      // push main staff at the end so it will get an ossia spacing if needed
      ns.push(staffDef.GetN());
      for (const n of ns) this.m_spacingTypes.set(n, SpacingType.Ossia);
      // Top one (ossia or main staff if no ossias) gets the main staff spacing
      this.m_spacingTypes.set(ns[0], spacing);
      // Clear list and add ossia below with ossia spacing
      ns.length = 0;
      staffDef.GetOssiaBelowNs(ns);
      for (const n of ns) this.m_spacingTypes.set(n, SpacingType.Ossia);
    }
  }

  /** Return the above spacing type for the passed staff. */
  public GetAboveSpacingType(staff: VerticalAlignerStaffLike | null): SpacingType {
    if (!staff) return SpacingType.None;

    if (this.m_spacingTypes.size === 0) {
      const system = staff.GetFirstAncestor(ClassId.SYSTEM) as (System & { GetDrawingScoreDef(): ScoreDefSpacingLike | null }) | null;
      const scoreDef = system ? system.GetDrawingScoreDef() : null;
      this.SetSpacing(scoreDef);
    }

    const spacingType = this.m_spacingTypes.get(staff.GetN());
    if (spacingType === undefined) {
      LogWarning("No spacing type found matching @n=%d for '<%s>'", staff.GetN(), staff.GetID());
      return SpacingType.None;
    }
    return spacingType;
  }

  /** Calculates the above spacing type for a StaffDef. */
  public CalculateSpacingAbove(staffDef: StaffDefSpacingLike): SpacingType {
    let spacingType = SpacingType.None;
    if (staffDef.GetDrawingVisibility() !== OPTIMIZATION_HIDDEN) {
      const staffDefObj = staffDef as unknown as VrvObject;
      let staffChild: VrvObject = staffDefObj;
      let staffParent: VrvObject | null = staffChild.GetParent();
      let notFirstInGroup = false;
      const matchType = new VisibleStaffDefOrGrpObject();
      while (spacingType === SpacingType.None) {
        if (staffParent) matchType.Skip(staffParent);
        const firstVisible = staffParent ? staffParent.FindDescendantByComparison(matchType, 1) : null;

        // for first child in staff group parent's symbol should be taken, except
        // when we had a child which not on the first place in group, then take first symbol
        notFirstInGroup = notFirstInGroup || (firstVisible !== null && firstVisible !== staffChild);
        if (notFirstInGroup) {
          const staffGrp = staffParent as unknown as {
            GetFirst(classId: ClassId): VrvObject | null;
          } | null;
          const grpSymObj = staffGrp?.GetFirst(ClassId.GRPSYM);
          if (grpSymObj) {
            const grpSym = grpSymObj as unknown as { GetSymbol(): number };
            switch (grpSym.GetSymbol()) {
              case staffGroupingSym_SYMBOL_brace:
                spacingType = SpacingType.Brace;
                break;
              case staffGroupingSym_SYMBOL_bracket:
              case staffGroupingSym_SYMBOL_bracketsq:
                spacingType = SpacingType.Bracket;
                break;
              default:
                spacingType = SpacingType.None;
            }
          }
        }

        if (spacingType === SpacingType.None) {
          staffChild = staffParent as VrvObject;
          staffParent = staffChild.GetParent();
          if (!staffParent || !staffParent.Is(ClassId.STAFFGRP)) {
            spacingType = notFirstInGroup ? SpacingType.Staff : SpacingType.System;
          }
        }
      }
    }

    return spacingType;
  }

  //----------//
  // Functors //
  //----------//

  public Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystemAligner', this); }

  public AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystemAlignerEnd', this); }

  public AcceptConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystemAligner', this); }

  public AcceptEndConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitSystemAlignerEnd', this); }
}

//----------------------------------------------------------------------------
// StaffAlignment
//----------------------------------------------------------------------------

export class StaffAlignment extends VrvObject {
  /** Defines spacing type between current staff and previous one. */
  private m_spacingType: SpacingType = SpacingType.None;

  /** The list of FloatingPositioner for the staff (owned). */
  private m_floatingPositioners: FloatingPositioner[] = [];
  /** Flag indicating whether the list of FloatingPositioner is sorted. */
  private m_floatingPositionersSorted = true;
  /** Staff from which the aligner was created. */
  private m_staff: VerticalAlignerStaffLike | null = null;
  /** Cached system pointer. */
  private m_system: System | null = null;
  /** Position relative to the system. */
  private m_yRel = 0;
  /** verse@n counts above and below (std::map ordered). */
  private m_verseAboveNs = new Map<number, number>();
  private m_verseBelowNs = new Map<number, number>();

  // overflow / overlap / spacing state
  private m_overflowAbove = 0;
  private m_overflowBelow = 0;
  private m_overlap = 0;
  private m_requestedSpaceAbove = 0;
  private m_requestedSpaceBelow = 0;
  private m_requestedSpacing = 0;
  private m_staffHeight = 0;
  private m_scoreDefClefOverflowAbove = 0;
  private m_scoreDefClefOverflowBelow = 0;

  /** Overflowing bounding boxes (non-owning references). */
  private m_overflowAboveBBoxes: BoundingBox[] = [];
  private m_overflowBelowBBoxes: BoundingBox[] = [];

  public constructor() {
    super(ClassId.STAFF_ALIGNMENT);
    // C++ constructor does not call Reset() — field defaults match it exactly.
  }

  public override IsSupportedChild(_classId: ClassId): boolean {
    return false;
  }

  //----------//
  // Positioners //
  //----------//

  /** Deletes all the FloatingPositioner objects. */
  public ClearPositioners(): void {
    this.m_floatingPositioners.length = 0;
    this.m_floatingPositionersSorted = true;
  }

  /** Sort the FloatingPositioner objects (C++ stable_sort comparator). */
  public SortPositioners(): void {
    if (!this.m_floatingPositionersSorted) {
      // Array.prototype.sort is stable in ECMAScript >= 2019
      this.m_floatingPositioners.sort((left, right) => {
        const leftObject = left.GetObject() as AlignerFloatingObjectLike;
        const rightObject = right.GetObject() as AlignerFloatingObjectLike;
        if (leftObject.GetClassId() === rightObject.GetClassId()) {
          if (left.GetDrawingPlace() === right.GetDrawingPlace()) {
            return leftObject.IsCloserToStaffThan(rightObject, right.GetDrawingPlace()) ? -1 : 1;
          } else {
            return left.GetDrawingPlace() < right.GetDrawingPlace() ? -1 : 1;
          }
        } else {
          return leftObject.GetClassId() < rightObject.GetClassId() ? -1 : 1;
        }
      });
      this.m_floatingPositionersSorted = true;
    }
  }

  //----------//
  // Staff / system //
  //----------//

  public SetStaff(
    staff: VerticalAlignerStaffLike | null,
    doc: VerticalAlignerDocLike | null,
    spacingType: SpacingType,
  ): void {
    this.m_staff = staff;
    this.m_spacingType = spacingType;
    if (staff && doc) {
      // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
      this.m_staffHeight = Math.imul((staff.m_drawingLines - 1) | 0, doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize));
    }
  }

  public GetStaff(): VerticalAlignerStaffLike | null {
    return this.m_staff;
  }

  public SetParentSystem(system: System | null): void {
    this.m_system = system;
  }

  public GetParentSystem(): System | null {
    if (this.m_system === null) {
      this.m_system = this.GetFirstAncestor(ClassId.SYSTEM) as System | null;
    }
    return this.m_system;
  }

  public GetStaffSize(): number {
    return this.m_staff ? this.m_staff.m_drawingStaffSize : 100;
  }

  /**
   * Returns the spacing attribute object of the corresponding ScoreDef.
   * C++ returns system->GetDrawingScoreDef() (asserted non-null there).
   */
  public GetAttSpacing(): ScoreDefSpacingLike | null {
    const system = this.GetParentSystem() as (System & { GetDrawingScoreDef(): ScoreDefSpacingLike | null }) | null;
    if (!system) throw new Error('StaffAlignment::GetAttSpacing: parent system required');
    return system.GetDrawingScoreDef();
  }

  //----------//
  // Y position //
  //----------//

  public SetYRel(yRel: number): void {
    // C++ keeps the minimum
    if (yRel < this.m_yRel) {
      this.m_yRel = yRel;
    }
  }

  public GetYRel(): number {
    return this.m_yRel;
  }

  //----------//
  // Overflow / overlap (max-keep setters, C++ parity) //
  //----------//

  public SetOverflowAbove(overflowAbove: number): void {
    if (overflowAbove > this.m_overflowAbove) this.m_overflowAbove = overflowAbove;
  }

  public GetOverflowAbove(): number {
    return this.m_overflowAbove;
  }

  public SetOverflowBelow(overflowBottom: number): void {
    if (overflowBottom > this.m_overflowBelow) this.m_overflowBelow = overflowBottom;
  }

  public GetOverflowBelow(): number {
    return this.m_overflowBelow;
  }

  public SetOverlap(overlap: number): void {
    if (overlap > this.m_overlap) this.m_overlap = overlap;
  }

  public GetOverlap(): number {
    return this.m_overlap;
  }

  public SetRequestedSpaceAbove(space: number): void {
    if (space > this.m_requestedSpaceAbove) this.m_requestedSpaceAbove = space;
  }

  public GetRequestedSpaceAbove(): number {
    return this.m_requestedSpaceAbove;
  }

  public SetRequestedSpaceBelow(space: number): void {
    if (space > this.m_requestedSpaceBelow) this.m_requestedSpaceBelow = space;
  }

  public GetRequestedSpaceBelow(): number {
    return this.m_requestedSpaceBelow;
  }

  public SetRequestedSpacing(spacing: number): void {
    this.m_requestedSpacing = spacing;
  }

  public GetRequestedSpacing(): number {
    return this.m_requestedSpacing;
  }

  public GetStaffHeight(): number {
    return this.m_staffHeight;
  }

  public SetScoreDefClefOverflowAbove(overflowAbove: number): void {
    this.m_scoreDefClefOverflowAbove = overflowAbove;
  }

  public GetScoreDefClefOverflowAbove(): number {
    return this.m_scoreDefClefOverflowAbove;
  }

  public SetScoreDefClefOverflowBelow(overflowBelow: number): void {
    this.m_scoreDefClefOverflowBelow = overflowBelow;
  }

  public GetScoreDefClefOverflowBelow(): number {
    return this.m_scoreDefClefOverflowBelow;
  }

  //----------//
  // BBoxes //
  //----------//

  public AddBBoxAbove(box: BoundingBox): void {
    this.m_overflowAboveBBoxes.push(box);
  }

  public AddBBoxBelow(box: BoundingBox): void {
    this.m_overflowBelowBBoxes.push(box);
  }

  public ClearBBoxesAbove(): void {
    this.m_overflowAboveBBoxes.length = 0;
  }

  public ClearBBoxesBelow(): void {
    this.m_overflowBelowBBoxes.length = 0;
  }

  public GetBBoxesAboveForModification(): BoundingBox[] {
    return this.m_overflowAboveBBoxes;
  }

  public GetBBoxesBelowForModification(): BoundingBox[] {
    return this.m_overflowBelowBBoxes;
  }

  public GetBBoxesAbove(): readonly BoundingBox[] {
    return this.m_overflowAboveBBoxes;
  }

  public GetBBoxesBelow(): readonly BoundingBox[] {
    return this.m_overflowBelowBBoxes;
  }

  //----------//
  // Verse bookkeeping //
  //----------//

  public AddLyricElement(lyricElement: LyricElementLike): void {
    if (lyricElement.Is(ClassId.REFRAIN)) {
      for (let line = 0; line < lyricElement.GetLyricLineCount(); ++line) {
        this.AddVerseN(lyricElement.GetDrawingVerseN() + line, lyricElement.GetPlace());
      }
    } else {
      this.AddVerseN(lyricElement.GetDrawingVerseN(), lyricElement.GetPlace(), lyricElement.GetLyricLineCount());
    }
  }

  public AddVerseN(verseN: number, place: number, lineCount = 1): void {
    // if 0, then assume 1
    verseN = Math.max(verseN, 1);
    lineCount = Math.max(lineCount, 1);
    const verses = place === STAFFREL_above ? this.m_verseAboveNs : this.m_verseBelowNs;
    verses.set(verseN, Math.max(verses.get(verseN) ?? 0, lineCount));
  }

  public GetVerseCount(collapse: boolean): number {
    return this.GetVerseCountAbove(collapse) + this.GetVerseCountBelow(collapse);
  }

  public GetVerseCountAbove(collapse: boolean): number {
    if (this.m_verseAboveNs.size === 0) {
      return 0;
    } else if (collapse) {
      let count = 0;
      for (const lineCount of this.m_verseAboveNs.values()) count += lineCount;
      return count;
    } else {
      // rbegin()->first is the greatest key (std::map ordered); TS Map keeps insertion order
      let maxN = 0;
      for (const number of this.m_verseAboveNs.keys()) maxN = Math.max(maxN, number);
      let count = maxN;
      for (const lineCount of this.m_verseAboveNs.values()) count += lineCount - 1;
      return count;
    }
  }

  public GetVerseCountBelow(collapse: boolean): number {
    if (this.m_verseBelowNs.size === 0) {
      return 0;
    } else if (collapse) {
      let count = 0;
      for (const lineCount of this.m_verseBelowNs.values()) count += lineCount;
      return count;
    } else {
      let maxN = 0;
      for (const number of this.m_verseBelowNs.keys()) maxN = Math.max(maxN, number);
      let count = maxN;
      for (const lineCount of this.m_verseBelowNs.values()) count += lineCount - 1;
      return count;
    }
  }

  public GetVersePositionAbove(verseN: number, collapse: boolean, lineN = 1): number {
    if (this.m_verseAboveNs.size === 0) {
      // Syl in neumatic notation - since verse count will be 0, position is -1
      return -1;
    }
    return GetVerseFlatPosition(this.m_verseAboveNs, verseN, collapse, lineN);
  }

  public GetVersePositionBelow(verseN: number, collapse: boolean, lineN = 1): number {
    if (this.m_verseBelowNs.size === 0) {
      // Syl in neumatic notation - since verse count will be 0, position is -1
      return -1;
    }
    const flatPosition = GetVerseFlatPosition(this.m_verseBelowNs, verseN, collapse, lineN);
    return this.GetVerseCountBelow(collapse) - flatPosition - 1;
  }

  //----------//
  // Justification //
  //----------//

  public GetJustificationFactor(doc: VerticalAlignerDocLike): number {
    let justificationFactor = 0.0;
    if (this.m_staff) {
      const options = doc.GetOptions();
      switch (this.m_spacingType) {
        case SpacingType.System:
          justificationFactor = options.m_justificationSystem.GetValue();
          break;
        case SpacingType.Staff:
          justificationFactor = options.m_justificationStaff.GetValue();
          break;
        case SpacingType.Brace:
          justificationFactor = options.m_justificationBraceGroup.GetValue();
          break;
        case SpacingType.Bracket:
          justificationFactor = options.m_justificationBracketGroup.GetValue();
          break;
        case SpacingType.Ossia:
          justificationFactor = options.m_justificationStaff.GetValue() * options.m_spacingOssia.GetValue();
          break;
        case SpacingType.None:
          break;
      }
      if (this.m_spacingType !== SpacingType.System) {
        justificationFactor *= this.GetStaffSize() / 100.0;
      }
    }
    return justificationFactor;
  }

  //----------//
  // Overflow calculation //
  //----------//

  public CalcOverflowAbove(box: BoundingBox): number {
    if (!box.HasContentVerticalBB()) return 0;
    if (box instanceof FloatingPositioner) {
      return box.GetContentTop() - this.GetYRel();
    }
    return box.GetSelfTop() - this.GetYRel();
  }

  public CalcOverflowBelow(box: BoundingBox): number {
    if (!box.HasContentVerticalBB()) return 0;
    if (box instanceof FloatingPositioner) {
      return -(box.GetContentBottom() + this.m_staffHeight - this.GetYRel());
    }
    return -(box.GetSelfBottom() + this.m_staffHeight - this.GetYRel());
  }

  //----------//
  // Spacing //
  //----------//

  /** Returns the minimum preset spacing (option or att spacing.staff). */
  private GetMinimumStaffSpacing(doc: VerticalAlignerDocLike, attSpacing: ScoreDefSpacingLike | null): number {
    const option = doc.GetOptions().m_spacingStaff;

    let staffSize = this.GetStaffSize();
    // Revert ossia staff ratio for it not to impact vertical spacing
    if (this.m_staff && this.m_staff.IsOssia()) {
      staffSize = Math.trunc(staffSize / doc.GetOptions().m_ossiaStaffSize.GetValue());
    }

    let spacing = Math.trunc(option.GetValue() * doc.GetDrawingUnit(staffSize));

    const attHasSpacingStaff = attSpacing as unknown as { HasSpacingStaff?: () => boolean; GetSpacingStaff?: () => { GetType(): number; GetPx(): number; GetVu(): number } } | null;
    if (!option.isSet() && attSpacing && attHasSpacingStaff?.HasSpacingStaff?.()) {
      const attStaff = attHasSpacingStaff.GetSpacingStaff!();
      if (attStaff.GetType() === MEASUREMENTTYPE_px) {
        spacing = attStaff.GetPx();
      } else {
        spacing = Math.trunc(attStaff.GetVu() * doc.GetDrawingUnit(100));
      }
    }
    return spacing;
  }

  public GetMinimumSpacing(doc: VerticalAlignerDocLike): number {
    let spacing = 0;
    const scoreDefSpacing = this.GetAttSpacing();

    if (!scoreDefSpacing) return spacing;
    if (this.m_staff && this.m_staff.m_drawingStaffDef) {
      // Default or staffDef spacing
      if (this.m_staff.m_drawingStaffDef.HasSpacing()) {
        const staffDefSpacing = this.m_staff.m_drawingStaffDef.GetSpacing();
        if (staffDefSpacing.GetType() === MEASUREMENTTYPE_px) {
          spacing = staffDefSpacing.GetPx();
        } else {
          spacing = Math.trunc(staffDefSpacing.GetVu() * doc.GetDrawingUnit(100));
        }
      } else {
        switch (this.m_spacingType) {
          case SpacingType.System: {
            // Top staff spacing (above) is half of a staff spacing
            spacing = Math.trunc(this.GetMinimumStaffSpacing(doc, scoreDefSpacing) / 2);
            break;
          }
          case SpacingType.Staff: {
            spacing = this.GetMinimumStaffSpacing(doc, scoreDefSpacing);
            break;
          }
          case SpacingType.Brace: {
            const option = doc.GetOptions().m_spacingBraceGroup;
            spacing = option.isSet()
              ? Math.trunc(option.GetValue() * doc.GetDrawingUnit(this.GetStaffSize()))
              : this.GetMinimumStaffSpacing(doc, scoreDefSpacing);
            break;
          }
          case SpacingType.Bracket: {
            const option = doc.GetOptions().m_spacingBracketGroup;
            spacing = option.isSet()
              ? Math.trunc(option.GetValue() * doc.GetDrawingUnit(this.GetStaffSize()))
              : this.GetMinimumStaffSpacing(doc, scoreDefSpacing);
            break;
          }
          case SpacingType.Ossia: {
            // Ossia spacing is third of a staff spacing
            spacing = Math.trunc(
              this.GetMinimumStaffSpacing(doc, scoreDefSpacing) * doc.GetOptions().m_spacingOssia.GetValue(),
            );
            break;
          }
          case SpacingType.None:
            break;
        }
      }
    }
    // This is the bottom aligner - spacing is half of a staff spacing
    else {
      spacing = Math.trunc(this.GetMinimumStaffSpacing(doc, scoreDefSpacing) / 2);
    }

    return spacing;
  }

  public CalcMinimumRequiredSpacing(doc: VerticalAlignerDocLike): number {
    const parent = this.GetParent();
    if (!parent) throw new Error('StaffAlignment::CalcMinimumRequiredSpacing: parent required');

    const prevAlignment = parent.GetPrevious(this) as unknown as StaffAlignment | null;

    if (!prevAlignment || prevAlignment.GetClassId() !== ClassId.STAFF_ALIGNMENT) {
      const maxOverflow = Math.max(this.GetOverflowAbove(), this.GetScoreDefClefOverflowAbove());
      return maxOverflow + this.GetOverlap();
    }

    let overflowSum = 0;
    const verseCollapse = doc.GetOptions().m_lyricVerseCollapse.GetValue() !== 0;
    if (prevAlignment.GetVerseCount(verseCollapse) > 0) {
      overflowSum = prevAlignment.GetOverflowBelow() + this.GetOverflowAbove();
    } else {
      // The maximum between the overflow below of the previous staff and the overflow above of the current
      overflowSum = Math.max(prevAlignment.GetOverflowBelow(), this.GetOverflowAbove());
      // add overlap if there any
      overflowSum += this.GetOverlap();
    }

    const unit = doc.GetDrawingUnit(this.GetStaffSize());

    // Add a margin but not for the bottom aligner
    if (this.m_staff) overflowSum += doc.GetBottomMargin(ClassId.STAFF) * unit;

    return overflowSum;
  }

  /** Find overflow for the alignments taking bracket group elements into account. */
  public AdjustBracketGroupSpacing(
    doc: VerticalAlignerDocLike,
    previous: StaffAlignment | null,
    spacing: number,
  ): void {
    if (!previous) return;

    if (this.IsInBracketGroup(true) && previous.IsInBracketGroup(false)) {
      const unit = doc.GetDrawingUnit(this.GetStaffSize());
      const offset = Math.trunc(((doc.GetOptions().m_bracketThickness.GetValue() - 1) * unit) / 2);
      const overflowAbove = doc.GetGlyphHeight(SMUFL_E003_bracketTop, this.GetStaffSize(), false) + offset;
      const overflowBelow = doc.GetGlyphHeight(SMUFL_E004_bracketBottom, this.GetStaffSize(), false) + offset;
      if (spacing < overflowAbove + overflowBelow) {
        const bracketOverlap = overflowAbove + overflowBelow - Math.trunc(spacing / 2);
        if (this.GetOverlap() < bracketOverlap) {
          this.SetOverlap(bracketOverlap);
        }
      }
    }
  }

  /** Return whether this staff alignment is at the start/end of a bracket group. */
  private IsInBracketGroup(isFirst: boolean): boolean {
    if (!this.m_staff) return false;

    const system = this.m_system as unknown as {
      GetDrawingScoreDef(): { FindAllDescendantsByType(classId: ClassId): VrvObject[] } | null;
    } | null;
    const scoreDef = system?.GetDrawingScoreDef();
    if (!scoreDef) return false;

    const groups = scoreDef.FindAllDescendantsByType(ClassId.STAFFGRP);
    for (const staffGrp of groups) {
      // Make sure that there is GrpSym present
      const grpSymObj = (staffGrp as unknown as { GetFirst(classId: ClassId): VrvObject | null }).GetFirst(
        ClassId.GRPSYM,
      );
      if (!grpSymObj) continue;

      const symbol = (grpSymObj as unknown as { GetSymbol(): number }).GetSymbol();
      if (symbol === staffGroupingSym_SYMBOL_bracket) {
        const staffNs = new Set<number>();
        const staffDefs = (staffGrp as unknown as { FindAllDescendantsByType(classId: ClassId): VrvObject[] })
          .FindAllDescendantsByType(ClassId.STAFFDEF);
        for (const object of staffDefs) {
          staffNs.add((object as unknown as { GetN(): number }).GetN());
        }

        const currentN = this.m_staff.GetN();
        if (staffNs.has(currentN)) {
          // first = smallest key, last = greatest key (std::set ordered)
          let minN = Infinity;
          let maxN = -Infinity;
          for (const n of staffNs) {
            if (n < minN) minN = n;
            if (n > maxN) maxN = n;
          }
          if ((isFirst && minN === currentN) || (!isFirst && maxN === currentN)) return true;
        }
      }
    }

    return false;
  }

  //----------//
  // Floating positioners //
  //----------//

  public SetCurrentFloatingPositioner(
    object: FloatingObject,
    objectX: VrvObject,
    objectY: VrvObject,
    spanningType: number,
  ): void {
    let positioner = this.GetCorrespFloatingPositioner(object);
    if (positioner === null) {
      const classId = object.GetClassId();
      if (
        classId === ClassId.LV ||
        classId === ClassId.PHRASE ||
        classId === ClassId.SLUR ||
        classId === ClassId.TIE
      ) {
        positioner = new FloatingCurvePositioner(object, this, spanningType);
        this.m_floatingPositioners.push(positioner);
      } else {
        positioner = new FloatingPositioner(object, this, spanningType);
        this.m_floatingPositioners.push(positioner);
      }
      this.m_floatingPositionersSorted = false;
    }
    positioner.SetObjectXY(objectX, objectY);
    object.SetCurrentFloatingPositioner(positioner);
  }

  /** Look for the first FloatingPositioner of the ClassId. */
  public FindFirstFloatingPositioner(classId: ClassId): FloatingPositioner | null {
    for (const positioner of this.m_floatingPositioners) {
      if ((positioner.GetObject() as AlignerFloatingObjectLike).GetClassId() === classId) return positioner;
    }
    return null;
  }

  /** Find all FloatingPositioners of the ClassId. */
  public FindAllFloatingPositioners(classId: ClassId): FloatingPositioner[] {
    const positioners: FloatingPositioner[] = [];
    for (const positioner of this.m_floatingPositioners) {
      if ((positioner.GetObject() as AlignerFloatingObjectLike).GetClassId() === classId) positioners.push(positioner);
    }
    return positioners;
  }

  /** Look for the FloatingPositioner corresponding to the FloatingObject. */
  public GetCorrespFloatingPositioner(object: FloatingObject): FloatingPositioner | null {
    for (const positioner of this.m_floatingPositioners) {
      if (positioner.GetObject() === object) return positioner;
    }
    return null;
  }

  /** Owned mutable list (C++ non-const getter). */
  public GetFloatingPositioners(): FloatingPositioner[] {
    return this.m_floatingPositioners;
  }

  /** Find all intersection points with a vertical line (top to bottom). */
  public FindAllIntersectionPoints(
    line: SegmentedLine,
    boundingBox: BoundingBox,
    classIds: ClassId[],
    margin: number,
  ): void {
    for (const positioner of this.m_floatingPositioners) {
      const object = positioner.GetObject() as AlignerFloatingObjectLike;
      const classId = object.GetClassId();
      const matches = classIds.some((id) => id === classId);
      if (!matches) continue;
      if (positioner.HorizontalContentOverlap(boundingBox, Math.trunc(margin / 2))) {
        line.AddGap(positioner.GetContentTop() + margin, positioner.GetContentBottom() - margin);
      }
    }
  }

  //----------//
  // Spacing type //
  //----------//

  public GetSpacingType(): SpacingType {
    return this.m_spacingType;
  }

  //----------//
  // Functors //
  //----------//

  public Accept(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffAlignment', this); }

  public AcceptEnd(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffAlignmentEnd', this); }

  public AcceptConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffAlignment', this); }

  public AcceptEndConst(functor: unknown): FunctorCode { return visitor(functor, 'VisitStaffAlignmentEnd', this); }
}

//----------------------------------------------------------------------------
// GetVerseFlatPosition (file-local, C++ static)
//----------------------------------------------------------------------------

function visitor(functor: unknown, method: string, self: unknown): FunctorCode {
  const f = functor as Record<string, unknown>;
  const fn = f[method];
  if (typeof fn === 'function') return (fn as (value: unknown) => FunctorCode).call(functor, self);
  if (typeof f['VisitObject'] === 'function') {
    return (f['VisitObject'] as (value: unknown) => FunctorCode).call(functor, self);
  }
  return FunctorCode.FUNCTOR_CONTINUE;
}

function GetVerseFlatPosition(verses: Map<number, number>, verseN: number, collapse: boolean, lineN: number): number {
  verseN = Math.max(verseN, 1);
  lineN = Math.max(lineN, 1);
  let position = collapse ? 0 : verseN - 1;
  // std::map iterates keys in ascending order; TS Map keeps insertion order
  const ordered = [...verses].sort((a, b) => a[0] - b[0]);
  for (const [number, lineCount] of ordered) {
    if (number >= verseN) break;
    position += collapse ? lineCount : lineCount - 1;
  }
  return position + lineN - 1;
}
