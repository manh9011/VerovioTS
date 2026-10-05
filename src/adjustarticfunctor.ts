/**
 * Pure TypeScript translation of Verovio's src/adjustarticfunctor.cpp.
 *
 * The adjustment algorithms and mutation order mirror the canonical C++ source.
 * Unmigrated tree/layout classes are represented by explicit structural contracts;
 * no native or WebAssembly runtime is introduced.
 */
import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode, STAFFREL_above, STAFFREL_below } from './vrvdef.js';

export interface AdjustArticDocLike {
  GetDrawingDoubleUnit(staffSize: number): number;
  GetDrawingUnit(staffSize: number): number;
  GetTopMargin(classId: ClassId): number;
  GetBottomMargin(classId: ClassId): number;
}

export interface AdjustArticStaffLike {
  m_drawingStaffSize: number;
  m_drawingLines: number;
  GetDrawingY(): number;
  GetNearestInterStaffPosition(y: number, doc: AdjustArticDocLike, place: number): number;
  IsOnStaffLine(y: number, doc: AdjustArticDocLike): boolean;
}

export interface AdjustArticStemLike {
  GetDrawingStemDir(): number;
}

export interface AdjustArticFlagLike {
  GetStemUpSE(doc: AdjustArticDocLike, staffSize: number, graceSize: boolean): { y: number };
  GetStemDownNW(doc: AdjustArticDocLike, staffSize: number, graceSize: boolean): { y: number };
}

export interface AdjustArticBeamLike {
  m_crossStaffContent: unknown;
  m_drawingPlace: number;
  m_beamWidthBlack: number;
}

export interface AdjustArticParentLike {
  FindDescendantByType(classId: ClassId): unknown | null;
  GetDrawingTop(doc: AdjustArticDocLike, staffSize: number, withArtic: boolean): number;
  GetDrawingBottom(doc: AdjustArticDocLike, staffSize: number, withArtic: boolean): number;
}

export interface AdjustArticLike {
  GetAncestorStaff(resolveCrossStaff?: number): AdjustArticStaffLike | null;
  GetAncestorBeam(): AdjustArticBeamLike | null;
  GetDrawingPlace(): number;
  SetDrawingYRel(value: number): void;
  GetDrawingY(): number;
  GetDrawingYRel(): number;
  IsInsideArtic(): boolean;
  GetContentTop(): number;
  GetContentBottom(): number;
  Intersects(curve: unknown, accessor: unknown, margin: number): number;
  m_startSlurPositioners: unknown[];
  m_endSlurPositioners: unknown[];
}

export interface AdjustArticChordLike extends AdjustArticParentLike {}
export interface AdjustArticNoteLike extends AdjustArticParentLike {
  IsChordTone(): boolean;
}

const RESOLVE_CROSS_STAFF = 1;
const STEMDIRECTION_UP = 1;
const STEMDIRECTION_DOWN = 2;
const BEAMPLACE_MIXED = 3;
const ARTIC = ClassId.ARTIC;
const CONTENT = 'CONTENT';

function asStaff(value: unknown): AdjustArticStaffLike | null { return value as AdjustArticStaffLike | null; }
function asStem(value: unknown): AdjustArticStemLike | null { return value as AdjustArticStemLike | null; }
function asFlag(value: unknown): AdjustArticFlagLike | null { return value as AdjustArticFlagLike | null; }
function asBeam(value: unknown): AdjustArticBeamLike | null { return value as AdjustArticBeamLike | null; }

export class AdjustArticFunctor extends DocFunctor {
  private m_articAbove: AdjustArticLike[] = [];
  private m_articBelow: AdjustArticLike[] = [];
  private m_parent: AdjustArticParentLike | null = null;

  public constructor(doc: AdjustArticDocLike) {
    super(doc);
    this.m_parent = null;
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitArtic(artic: AdjustArticLike): FunctorCode {
    if (!this.m_parent) return FunctorCode.FUNCTOR_CONTINUE;

    const doc = this.m_doc as AdjustArticDocLike;
    const staff = asStaff(artic.GetAncestorStaff(RESOLVE_CROSS_STAFF));
    if (!staff) return FunctorCode.FUNCTOR_CONTINUE;
    const beam = asBeam(artic.GetAncestorBeam());
    // C++ computes in 32-bit int (wraps when m_drawingLines == VRV_UNSET); replicate with imul.
    const staffHeight = Math.imul(doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize), (staff.m_drawingLines - 1) | 0);

    const stem = asStem(this.m_parent.FindDescendantByType(ClassId.STEM));
    const flag = asFlag(this.m_parent.FindDescendantByType(ClassId.FLAG));

    let yIn: number;
    let yOut: number;
    let yRel: number;

    if (artic.GetDrawingPlace() === STAFFREL_above) {
      let yAboveStem = this.m_parent.GetDrawingTop(doc, staff.m_drawingStaffSize, false) - staff.GetDrawingY();
      if (flag && stem && stem.GetDrawingStemDir() === STEMDIRECTION_UP) {
        yAboveStem += flag.GetStemUpSE(doc, staff.m_drawingStaffSize, false).y;
      }
      yIn = Math.max(yAboveStem, -staffHeight);
      yOut = Math.max(yIn, 0);
    } else {
      const isStemDown = !!stem && stem.GetDrawingStemDir() === STEMDIRECTION_DOWN;
      let yBelowStem = this.m_parent.GetDrawingBottom(doc, staff.m_drawingStaffSize, false) - staff.GetDrawingY();
      if (flag && isStemDown) yBelowStem += flag.GetStemDownNW(doc, staff.m_drawingStaffSize, false).y;
      yIn = Math.min(yBelowStem, 0);
      if (beam && beam.m_crossStaffContent && beam.m_drawingPlace === BEAMPLACE_MIXED && isStemDown) {
        yIn -= beam.m_beamWidthBlack;
      }
      yOut = Math.min(yIn, -staffHeight);
    }

    yRel = artic.IsInsideArtic() ? yIn : yOut;
    artic.SetDrawingYRel(yRel);

    let previous: AdjustArticLike | null = null;
    if (artic.GetDrawingPlace() === STAFFREL_above && this.m_articAbove.length > 0) {
      previous = this.m_articAbove[this.m_articAbove.length - 1];
      const inTop = previous.GetContentTop();
      const outBottom = artic.GetContentBottom();
      if (inTop > outBottom) artic.SetDrawingYRel(artic.GetDrawingYRel() + inTop - outBottom);
    }
    if (artic.GetDrawingPlace() === STAFFREL_below && this.m_articBelow.length > 0) {
      previous = this.m_articBelow[this.m_articBelow.length - 1];
      const inBottom = previous.GetContentBottom();
      const outTop = artic.GetContentTop();
      if (inBottom < outTop) artic.SetDrawingYRel(artic.GetDrawingYRel() - outTop + inBottom);
    }

    const unit = doc.GetDrawingUnit(staff.m_drawingStaffSize);
    const spacingTop = doc.GetTopMargin(ARTIC) * unit;
    const spacingBottom = doc.GetBottomMargin(ARTIC) * unit;
    const direction = artic.GetDrawingPlace() === STAFFREL_above ? 1 : -1;
    const y = artic.GetDrawingY();
    let yShift = 0;

    if (artic.IsInsideArtic()) {
      if (artic.GetDrawingPlace() === STAFFREL_above && y > staff.GetDrawingY()) {
        yShift += spacingBottom;
      } else if (artic.GetDrawingPlace() === STAFFREL_below && y < staff.GetDrawingY() - staffHeight) {
        if (y > staff.GetDrawingY() - staffHeight - unit) {
          yShift = (staff.GetDrawingY() - staffHeight - unit) - y;
          if (Math.abs(yShift) < spacingTop) yShift = -spacingTop;
        } else {
          yShift -= spacingTop;
        }
      } else {
        yShift = staff.GetNearestInterStaffPosition(y, doc, artic.GetDrawingPlace()) - y;
        if (staff.IsOnStaffLine(y + yShift, doc)) yShift += unit * direction;
      }
    } else {
      const spacing = direction > 0 ? spacingBottom : spacingTop;
      yShift += spacing * direction;
    }

    artic.SetDrawingYRel(artic.GetDrawingYRel() + yShift);

    if (artic.GetDrawingPlace() === STAFFREL_above) this.m_articAbove.push(artic);
    else this.m_articBelow.push(artic);

    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitChord(chord: AdjustArticChordLike): FunctorCode {
    this.m_parent = chord;
    this.m_articAbove.length = 0;
    this.m_articBelow.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitNote(note: AdjustArticNoteLike): FunctorCode {
    if (note.IsChordTone()) return FunctorCode.FUNCTOR_CONTINUE;
    this.m_parent = note;
    this.m_articAbove.length = 0;
    this.m_articBelow.length = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

export class AdjustArticWithSlursFunctor extends DocFunctor {
  public constructor(doc: AdjustArticDocLike) { super(doc); }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitArtic(artic: AdjustArticLike): FunctorCode {
    if (artic.m_startSlurPositioners.length === 0 && artic.m_endSlurPositioners.length === 0) return FunctorCode.FUNCTOR_CONTINUE;

    const doc = this.m_doc as AdjustArticDocLike;
    for (const curve of artic.m_endSlurPositioners) {
      const shift = artic.Intersects(curve, CONTENT, doc.GetDrawingUnit(100));
      if (shift !== 0) artic.SetDrawingYRel(artic.GetDrawingYRel() + shift);
    }
    for (const curve of artic.m_startSlurPositioners) {
      const shift = artic.Intersects(curve, CONTENT, doc.GetDrawingUnit(100));
      if (shift !== 0) artic.SetDrawingYRel(artic.GetDrawingYRel() + shift);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
