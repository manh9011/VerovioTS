/**
 * Pure TypeScript translation of Verovio's
 * src/adjustfloatingpositionerfunctor.cpp.
 *
 * Control flow and mutation ordering follow the canonical C++ implementation.
 * Unmigrated layout/tree collaborators are represented by structural contracts.
 */
import { DocFunctor } from './functor.js';
import {
  ClassId, FunctorCode, STAFFREL_above, STAFFREL_below, STAFFREL_between, STAFFREL_within,
  VRV_UNSET,
} from './vrvdef.js';

export interface FloatingAdjustOptionsLike {
  m_lyricVerseCollapse: { GetValue(): boolean };
  m_lyricHeightFactor: { GetValue(): number };
  m_lyricTopMinMargin: { GetValue(): number };
}
export interface FloatingAdjustFontLike { }
export interface FloatingAdjustObjectLike {
  Is(classId: ClassId): boolean;
  IsAnyOf(classIds: ClassId[]): boolean;
  GetClassId(): ClassId;
  GetDrawingGrpId(): number;
  GetTimeSpanningInterface?(): { GetCrossStaffOverflows(alignment: FloatingAdjustStaffAlignmentLike, dir: number, skipAbove: { value: boolean }, skipBelow: { value: boolean }): void } | null;
}
export interface FloatingAdjustPositionerLike {
  GetObject(): FloatingAdjustObjectLike | null;
  GetDrawingPlace(): number;
  HasContentBB(): boolean;
  HasEmptyBB(): boolean;
  Is(classId: ClassId): boolean;
  CalcDrawingYRel(doc: FloatingAdjustDocLike, alignment: FloatingAdjustStaffAlignmentLike, bbox: unknown): void;
  HasHorizontalOverlapWith(bbox: unknown, drawingUnit: number): boolean;
  AdjustExtenders(): void;
  GetDrawingYRel(): number;
  SetDrawingYRel(y: number): void;
  GetContentY2(): number;
  GetSpaceBelow(doc: FloatingAdjustDocLike, alignment: FloatingAdjustStaffAlignmentLike, bbox: unknown): number;
  HorizontalContentOverlap(bbox: unknown): boolean;
  CalcRequestedStaffSpace?(alignment: FloatingAdjustStaffAlignmentLike): [number, number];
  GetDir?(): number;
}
export interface FloatingAdjustStaffAlignmentLike {
  GetStaffSize(): number;
  GetStaff(): { m_drawingStaffSize: number };
  SortPositioners(): void;
  GetFloatingPositioners(): FloatingAdjustPositionerLike[];
  GetVerseCount(collapse: boolean): number;
  GetVerseCountAbove(collapse: boolean): number;
  GetVerseCountBelow(collapse: boolean): number;
  GetOverflowAbove(): number;
  GetOverflowBelow(): number;
  SetOverflowAbove(value: number): void;
  SetOverflowBelow(value: number): void;
  ClearBBoxesAbove(): void;
  ClearBBoxesBelow(): void;
  CalcOverflowAbove(positioner: unknown): number;
  CalcOverflowBelow(positioner: unknown): number;
  GetBBoxesAboveForModification(): unknown[];
  GetBBoxesBelowForModification(): unknown[];
  GetBBoxesAbove(): unknown[];
  SetRequestedSpaceAbove(value: number): void;
  SetRequestedSpaceBelow(value: number): void;
  GetYRel(): number;
  GetStaffHeight(): number;
}
export interface FloatingAdjustSystemLike {
  m_systemAligner: { Process(functor: unknown): void };
}
export interface FloatingAdjustDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetOptions(): FloatingAdjustOptionsLike;
  GetDrawingLyricFont(staffSize: number): FloatingAdjustFontLike;
  GetTextGlyphHeight(charCode: number, font: FloatingAdjustFontLike, b: boolean): number;
  GetTextGlyphDescender(charCode: number, font: FloatingAdjustFontLike, b: boolean): number;
  GetTopMargin(classId: ClassId): number;
  GetBottomMargin(classId: ClassId): number;
  GetDrawingStaffLineWidth(staffSize: number): number;
}

function minInt(a: number, b: number): number { return Math.min(a, b); }
function maxInt(a: number, b: number): number { return Math.max(a, b); }
function truncInt(value: number): number { return Math.trunc(value); }

export class AdjustFloatingPositionersFunctor extends DocFunctor {
  private m_classId: ClassId = ClassId.OBJECT;
  private m_inBetween = false;

  public constructor(doc: FloatingAdjustDocLike) {
    super(doc);
    this.m_classId = ClassId.OBJECT;
    this.m_inBetween = false;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitStaffAlignment(staffAlignment: FloatingAdjustStaffAlignmentLike): FunctorCode {
    const staffSize = staffAlignment.GetStaffSize();
    const drawingUnit = this.m_doc.GetDrawingUnit(staffSize);
    staffAlignment.SortPositioners();

    if (this.m_classId === ClassId.SYL) {
      const verseCollapse = this.m_doc.GetOptions().m_lyricVerseCollapse.GetValue();
      if (staffAlignment.GetVerseCount(verseCollapse) > 0) {
        const lyricFont = this.m_doc.GetDrawingLyricFont(staffAlignment.GetStaff().m_drawingStaffSize);
        let verseHeight = this.m_doc.GetTextGlyphHeight('I'.codePointAt(0)!, lyricFont, false)
          - this.m_doc.GetTextGlyphDescender('q'.codePointAt(0)!, lyricFont, false);
        verseHeight *= this.m_doc.GetOptions().m_lyricHeightFactor.GetValue();

        if (staffAlignment.GetVerseCountAbove(verseCollapse)) {
          const margin = this.m_doc.GetTopMargin(ClassId.SYL) * drawingUnit;
          const minMargin = maxInt(
            truncInt(this.m_doc.GetOptions().m_lyricTopMinMargin.GetValue() * drawingUnit),
            staffAlignment.GetOverflowAbove(),
          );
          staffAlignment.SetOverflowAbove(
            minMargin + staffAlignment.GetVerseCountAbove(verseCollapse) * (verseHeight + margin),
          );
          staffAlignment.ClearBBoxesAbove();
        }
        if (staffAlignment.GetVerseCountBelow(verseCollapse)) {
          const margin = this.m_doc.GetBottomMargin(ClassId.SYL) * drawingUnit;
          const minMargin = maxInt(
            truncInt(this.m_doc.GetOptions().m_lyricTopMinMargin.GetValue() * drawingUnit),
            staffAlignment.GetOverflowBelow(),
          );
          staffAlignment.SetOverflowBelow(
            minMargin + staffAlignment.GetVerseCountBelow(verseCollapse) * (verseHeight + margin),
          );
          staffAlignment.ClearBBoxesBelow();
        }
      }
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    for (const positioner of staffAlignment.GetFloatingPositioners()) {
      const object = positioner.GetObject();
      if (!object) continue;
      if (!this.m_inBetween && !object.Is(this.m_classId)) continue;
      if (this.m_inBetween) {
        if (positioner.GetDrawingPlace() !== STAFFREL_between) continue;
      } else if (positioner.GetDrawingPlace() === STAFFREL_between) continue;
      if (!positioner.HasContentBB()) continue;

      if (this.m_classId === ClassId.LV || this.m_classId === ClassId.PHRASE
        || this.m_classId === ClassId.SLUR || this.m_classId === ClassId.TIE) {
        let skipAbove = { value: false };
        let skipBelow = { value: false };
        if (object.IsAnyOf([ClassId.LV, ClassId.PHRASE, ClassId.SLUR, ClassId.TIE])) {
          const iface = object.GetTimeSpanningInterface?.();
          if (iface) iface.GetCrossStaffOverflows(staffAlignment, positioner.GetDir?.() ?? 0, skipAbove, skipBelow);
        }
        const overflowAbove = skipAbove.value ? 0 : staffAlignment.CalcOverflowAbove(positioner);
        if (overflowAbove > truncInt(this.m_doc.GetDrawingStaffLineWidth(staffSize) / 2)) {
          staffAlignment.SetOverflowAbove(overflowAbove);
          staffAlignment.GetBBoxesAboveForModification().push(positioner);
        }
        const overflowBelow = skipBelow.value ? 0 : staffAlignment.CalcOverflowBelow(positioner);
        if (overflowBelow > truncInt(this.m_doc.GetDrawingStaffLineWidth(staffSize) / 2)) {
          staffAlignment.SetOverflowBelow(overflowBelow);
          staffAlignment.GetBBoxesBelowForModification().push(positioner);
        }
        const [spaceAbove, spaceBelow] = positioner.CalcRequestedStaffSpace?.(staffAlignment) ?? [0, 0];
        staffAlignment.SetRequestedSpaceAbove(spaceAbove);
        staffAlignment.SetRequestedSpaceBelow(spaceBelow);
        continue;
      }

      positioner.CalcDrawingYRel(this.m_doc, staffAlignment, null);
      const place = positioner.GetDrawingPlace();
      const overflowBoxes = place === STAFFREL_above
        ? staffAlignment.GetBBoxesAboveForModification()
        : staffAlignment.GetBBoxesBelowForModification();

      if (place === STAFFREL_within) {
        if (this.m_classId === ClassId.CPMARK || this.m_classId === ClassId.DIR || this.m_classId === ClassId.HAIRPIN) continue;
      }

      for (const bbox of overflowBoxes) {
        if (positioner.HasHorizontalOverlapWith(bbox, drawingUnit)) {
          positioner.CalcDrawingYRel(this.m_doc, staffAlignment, bbox);
        }
      }
      positioner.AdjustExtenders();

      if (place === STAFFREL_above) {
        const overflowAbove = staffAlignment.CalcOverflowAbove(positioner);
        overflowBoxes.push(positioner);
        staffAlignment.SetOverflowAbove(overflowAbove);
      } else {
        const overflowBelow = staffAlignment.CalcOverflowBelow(positioner);
        overflowBoxes.push(positioner);
        staffAlignment.SetOverflowBelow(overflowBelow);
      }
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: FloatingAdjustSystemLike): FunctorCode {
    this.m_inBetween = false;
    const adjustFloatingPositionerGrps = new AdjustFloatingPositionerGrpsFunctor(this.m_doc);
    const process = (classId: ClassId) => { this.m_classId = classId; system.m_systemAligner.Process(this); };
    const processGroups = (classIds: ClassId[], place: number) => {
      adjustFloatingPositionerGrps.SetClassIDs(classIds);
      adjustFloatingPositionerGrps.SetPlace(place);
      system.m_systemAligner.Process(adjustFloatingPositionerGrps);
    };

    [ClassId.LV, ClassId.TIE, ClassId.SLUR, ClassId.PHRASE, ClassId.ACCID_FLOATING, ClassId.MORDENT,
      ClassId.TURN, ClassId.TRILL, ClassId.ORNAM, ClassId.FING, ClassId.DYNAM, ClassId.HAIRPIN].forEach(process);
    processGroups([ClassId.DYNAM, ClassId.HAIRPIN], STAFFREL_above);
    processGroups([ClassId.DYNAM, ClassId.HAIRPIN], STAFFREL_below);
    [ClassId.BRACKETSPAN, ClassId.OCTAVE, ClassId.BREATH, ClassId.FERMATA, ClassId.DIR].forEach(process);
    processGroups([ClassId.DIR], STAFFREL_above); processGroups([ClassId.DIR], STAFFREL_below);
    [ClassId.CPMARK, ClassId.REPEATMARK, ClassId.TEMPO, ClassId.PEDAL].forEach(process);
    processGroups([ClassId.PEDAL], STAFFREL_above); processGroups([ClassId.PEDAL], STAFFREL_below);
    process(ClassId.HARM); processGroups([ClassId.HARM], STAFFREL_above); processGroups([ClassId.HARM], STAFFREL_below);
    process(ClassId.ENDING); processGroups([ClassId.ENDING], STAFFREL_above); processGroups([ClassId.ENDING], STAFFREL_below);
    [ClassId.REH, ClassId.CAESURA, ClassId.ANNOTSCORE, ClassId.SYL].forEach(process);

    this.m_inBetween = true;
    this.m_classId = ClassId.OBJECT;
    system.m_systemAligner.Process(this);
    processGroups([ClassId.DYNAM], STAFFREL_between);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}

export class AdjustFloatingPositionerGrpsFunctor extends DocFunctor {
  private m_classIds: ClassId[] = [];
  private m_place = STAFFREL_above;
  public override ImplementsEndInterface(): boolean { return false; }
  public SetClassIDs(classIds: ClassId[]): void { this.m_classIds = [...classIds]; }
  public SetPlace(place: number): void { this.m_place = place; }

  public VisitStaffAlignment(staffAlignment: FloatingAdjustStaffAlignmentLike): FunctorCode {
    const allPositioners = staffAlignment.GetFloatingPositioners();
    const positioners = allPositioners.filter(positioner => {
      const object = positioner.GetObject();
      return !!object && this.m_classIds.includes(object.GetClassId()) && object.GetDrawingGrpId() !== 0
        && positioner.GetDrawingPlace() === this.m_place && !positioner.HasEmptyBB();
    });
    if (positioners.length === 0) return FunctorCode.FUNCTOR_SIBLINGS;

    const grpIdYRel: Array<[number, number]> = [];
    for (const positioner of positioners) {
      const object = positioner.GetObject();
      if (!object) continue;
      const currentGrpId = object.GetDrawingGrpId();
      const existing = grpIdYRel.find(pair => pair[0] === currentGrpId);
      if (!existing) grpIdYRel.push([currentGrpId, positioner.GetDrawingYRel()]);
      else if (this.m_place === STAFFREL_above) existing[1] = minInt(existing[1], positioner.GetDrawingYRel());
      else existing[1] = maxInt(existing[1], positioner.GetDrawingYRel());
    }

    if (this.m_classIds.includes(ClassId.HARM)) this.AdjustGroupsMonotone(staffAlignment, positioners, grpIdYRel);
    else {
      for (const positioner of positioners) {
        const object = positioner.GetObject();
        if (!object) continue;
        const pair = grpIdYRel.find(entry => entry[0] === object.GetDrawingGrpId());
        if (pair) positioner.SetDrawingYRel(pair[1]);
      }
    }

    for (const positioner of positioners) {
      if (this.m_place === STAFFREL_above) staffAlignment.SetOverflowAbove(staffAlignment.CalcOverflowAbove(positioner));
      else staffAlignment.SetOverflowBelow(staffAlignment.CalcOverflowBelow(positioner));
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  private AdjustGroupsMonotone(
    staffAlignment: FloatingAdjustStaffAlignmentLike,
    positioners: FloatingAdjustPositionerLike[],
    grpIdYRel: Array<[number, number]>,
  ): void {
    if (grpIdYRel.length === 0) return;
    grpIdYRel.sort((a, b) => a[0] - b[0]);
    let nextYRel = grpIdYRel[0][1];
    for (const grp of grpIdYRel) {
      const yRel = this.m_place === STAFFREL_above ? minInt(nextYRel, grp[1]) : maxInt(nextYRel, grp[1]);
      for (const positioner of positioners) {
        const object = positioner.GetObject();
        if (!object || object.GetDrawingGrpId() !== grp[0]) continue;
        positioner.SetDrawingYRel(yRel);
        if (this.m_place === STAFFREL_above) {
          const positionerY = yRel - positioner.GetContentY2()
            - this.m_doc.GetTopMargin(object.GetClassId()) * this.m_doc.GetDrawingUnit(staffAlignment.GetStaffSize());
          if (nextYRel > positionerY) nextYRel = positionerY;
        } else {
          const positionerY = yRel + positioner.GetContentY2()
            + this.m_doc.GetBottomMargin(object.GetClassId()) * this.m_doc.GetDrawingUnit(staffAlignment.GetStaffSize());
          if (nextYRel < positionerY) nextYRel = positionerY;
        }
      }
    }
  }
}

export class AdjustFloatingPositionersBetweenFunctor extends DocFunctor {
  private m_previousStaffAlignment: FloatingAdjustStaffAlignmentLike | null = null;
  public override ImplementsEndInterface(): boolean { return false; }
  public constructor(doc: FloatingAdjustDocLike) { super(doc); this.m_previousStaffAlignment = null; }

  public VisitStaffAlignment(staffAlignment: FloatingAdjustStaffAlignmentLike): FunctorCode {
    if (!this.m_previousStaffAlignment) {
      this.m_previousStaffAlignment = staffAlignment;
      return FunctorCode.FUNCTOR_SIBLINGS;
    }

    let dist = this.m_previousStaffAlignment.GetYRel() - staffAlignment.GetYRel();
    dist -= this.m_previousStaffAlignment.GetStaffHeight();
    const centerYRel = truncInt(dist / 2) + this.m_previousStaffAlignment.GetStaffHeight();

    for (const positioner of this.m_previousStaffAlignment.GetFloatingPositioners()) {
      const object = positioner.GetObject();
      if (!object || !object.IsAnyOf([ClassId.CPMARK, ClassId.DIR, ClassId.DYNAM, ClassId.HAIRPIN, ClassId.TEMPO])) continue;
      if (positioner.GetDrawingPlace() !== STAFFREL_between || !positioner.HasContentBB()) continue;

      let diffY = centerYRel - positioner.GetDrawingYRel();
      const overflowBoxes = staffAlignment.GetBBoxesAbove();
      for (const bbox of overflowBoxes) {
        if (!positioner.HorizontalContentOverlap(bbox)) continue;
        const spaceY = positioner.GetSpaceBelow(this.m_doc, staffAlignment, bbox);
        if (spaceY !== VRV_UNSET) diffY = minInt(diffY, spaceY);
      }
      positioner.SetDrawingYRel(positioner.GetDrawingYRel() + diffY);
    }
    this.m_previousStaffAlignment = staffAlignment;
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitSystem(system: FloatingAdjustSystemLike): FunctorCode {
    this.m_previousStaffAlignment = null;
    system.m_systemAligner.Process(this);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
