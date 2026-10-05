/**
 * Pure TypeScript translation of Verovio src/adjusttupletsyfunctor.cpp.
 *
 * Control flow, arithmetic and mutation ordering mirror the canonical C++ implementation.
 * Unmigrated layout/tree collaborators are represented by explicit structural contracts.
 */
import { DocFunctor, ConstFunctor } from './functor.js';
import { Accessor, ClassId, FunctorCode, ArticType } from './vrvdef.js';
import { Point as BoundingPoint } from './boundingbox.js';
import { Point } from './devicecontextbase.js';
import { ClassIdsComparison } from './comparison.js';
import { STAFFREL_basic_NONE, STAFFREL_basic_above, STAFFREL_basic_below } from './drawinginterface.js';
import { MelodicDirection } from './tuplet.js';

export const BOOLEAN_false = 2;
export const RESOLVE_CROSS_STAFF = 1;

export interface AdjustTupletsYOptionsLike {
  m_showHidden: { GetValue(): boolean };
  m_tupletAngledOnBeams?: { GetValue(): boolean };
}
export interface AdjustTupletsYDocLike {
  GetOptions(): AdjustTupletsYOptionsLike;
  GetDrawingStaffSize(staffSize: number): number;
  GetDrawingUnit(staffSize: number): number;
  GetDrawingDoubleUnit(staffSize: number): number;
}

export interface AdjustTupletsYStaffLike {
  m_drawingStaffSize: number;
  GetDrawingY(): number;
  GetN?(): number;
}

export interface AdjustTupletsYObjectLike {
  HasSelfBB(): boolean;
  GetSelfTop(): number;
  GetSelfBottom(): number;
  GetSelfLeft?(): number;
  GetSelfRight?(): number;
  GetDrawingX(): number;
  GetDrawingY(): number;
  m_crossStaff?: AdjustTupletsYStaffLike | null;
  Is(classId: ClassId): boolean;
  IsAnyOf(classIds: readonly ClassId[]): boolean;
  GetFirstAncestor(classId: ClassId, maxDepth?: number): any;
}

export interface AdjustTupletsYBeamSegmentLike {
  m_beamSlope: number;
  m_nbNotesOrChords: number;
  GetStartingY(): number;
  GetStartingX(): number;
  GetElementCoordRefs(): Array<{ m_element: { m_crossStaff: AdjustTupletsYStaffLike | null } }>;
}

export interface AdjustTupletsYBeamLike extends AdjustTupletsYObjectLike {
  m_beamSegment: AdjustTupletsYBeamSegmentLike;
  m_crossStaffContent: AdjustTupletsYStaffLike | null;
  m_beamStaff: AdjustTupletsYStaffLike | null;
}

export interface AdjustTupletsYBracketLike extends AdjustTupletsYObjectLike {
  SetDrawingYRel(value: number): void;
  GetDrawingYRel(): number;
  SetDrawingYRelLeft(value: number): void;
  SetDrawingYRelRight(value: number): void;
  GetDrawingYRelLeft(): number;
  GetDrawingYRelRight(): number;
  GetDrawingXLeft(): number;
  GetDrawingXRight(): number;
  GetDrawingXRelLeft(): number;
  GetDrawingXRelRight(): number;
  GetDrawingYLeft(): number;
  GetDrawingYRight(): number;
  Intersects(curve: any, accessor: Accessor, margin?: number): number;
}

export interface AdjustTupletsYNumLike extends AdjustTupletsYObjectLike {
  HorizontalSelfOverlap(other: any, margin: number): boolean;
  VerticalSelfOverlap(other: any, margin: number): boolean;
  m_crossStaff: AdjustTupletsYStaffLike | null;
  SetDrawingYRel(value: number): void;
  GetDrawingY(): number;
  GetDrawingYRel?(): number;
  GetDrawingXMid(doc: AdjustTupletsYDocLike): number;
  GetAlignedBracket(): AdjustTupletsYBracketLike | null;
}

export interface AdjustTupletsYFTremLike extends AdjustTupletsYObjectLike {
  GetElementCoords(): Array<{ m_yBeam: number }>;
}

export interface AdjustTupletsYTupletLike extends AdjustTupletsYObjectLike {
  m_crossStaff: AdjustTupletsYStaffLike | null;
  HasNum(): boolean;
  GetBracketVisible(): number;
  GetNumVisible(): number;
  GetDrawingLeft(): { GetDrawingX(): number } | null;
  GetDrawingRight(): { GetDrawingX(): number } | null;
  GetAncestorStaff(mode?: number): AdjustTupletsYStaffLike;
  GetDrawingBracketPos(): number;
  GetDrawingNumPos(): number;
  CalcDrawingBracketAndNumPos?(tupletNumHead: boolean): void;
  GetBracketAlignedBeam(): AdjustTupletsYBeamLike | null;
  SetBracketAlignedBeam(beam: AdjustTupletsYBeamLike | null): void;
  GetNumAlignedBeam(): AdjustTupletsYBeamLike | null;
  SetNumAlignedBeam(beam: AdjustTupletsYBeamLike | null): void;
  FindAllDescendantsByType(classId: ClassId): AdjustTupletsYObjectLike[];
  FindAllDescendantsByComparison?(out: AdjustTupletsYObjectLike[], comparison: any): void;
  FindDescendantByType(classId: ClassId): AdjustTupletsYObjectLike | null;
  HasValidTupletNumPosition(staff: AdjustTupletsYStaffLike | null, beamStaff: AdjustTupletsYStaffLike | null): boolean;
  CalculateTupletNumCrossStaff(num: AdjustTupletsYNumLike): void;
  Process(functor: any): void;
  GetDrawingY(): number;
  // C++ returns const std::set<Curve*>; the TS store is a Set (checked via .size).
  GetInnerSlurs(): Set<unknown>;
  GetMelodicDirection?(): number;
}

export class AdjustTupletsYFunctor extends DocFunctor {
  public constructor(doc: AdjustTupletsYDocLike) {
    super(doc as any);
  }

  public override ImplementsEndInterface(): boolean { return false; }

  public VisitTuplet(tuplet: AdjustTupletsYTupletLike): FunctorCode {
    if (!tuplet.HasNum()) return FunctorCode.FUNCTOR_SIBLINGS;
    const showHidden = this.m_doc.GetOptions().m_showHidden.GetValue();
    if (!showHidden && tuplet.GetBracketVisible() === BOOLEAN_false && tuplet.GetNumVisible() === BOOLEAN_false) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (!tuplet.GetDrawingLeft() || !tuplet.GetDrawingRight()) return FunctorCode.FUNCTOR_SIBLINGS;

    const staff = tuplet.GetAncestorStaff();
    if (tuplet.GetDrawingBracketPos() === STAFFREL_basic_NONE) {
      tuplet.CalcDrawingBracketAndNumPos?.(this.m_doc.GetOptions().m_tupletNumHead?.GetValue?.() ?? false);
    }
    if (tuplet.GetDrawingBracketPos() === STAFFREL_basic_NONE) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    const relevantStaff = tuplet.m_crossStaff || staff;
    this.AdjustTupletBracketY(tuplet, relevantStaff);
    this.AdjustTupletNumY(tuplet, relevantStaff);
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  private AdjustTupletBracketY(tuplet: AdjustTupletsYTupletLike, staff: AdjustTupletsYStaffLike): void {
    const showHidden = this.m_doc.GetOptions().m_showHidden.GetValue();
    const tupletBracket = tuplet.FindAllDescendantsByType(ClassId.TUPLET_BRACKET)[0] as AdjustTupletsYBracketLike | undefined;
    if (!tupletBracket || (!showHidden && tuplet.GetBracketVisible() === BOOLEAN_false)) return;

    const beam = tuplet.GetBracketAlignedBeam();
    if (beam) {
      this.AdjustTupletBracketBeamY(tuplet, tupletBracket, beam, staff);
      return;
    }

    const staffSize = staff.m_drawingStaffSize;
    const bracketPos = tuplet.GetDrawingBracketPos();
    const staffBoundary = bracketPos === STAFFREL_basic_above ? 0 : -this.m_doc.GetDrawingStaffSize(staffSize);
    const bracketMidX = (tupletBracket.GetDrawingXLeft() + tupletBracket.GetDrawingXRight()) / 2;
    const referencePos = new Point(bracketMidX, staff.GetDrawingY() + staffBoundary);

    const ids = [ClassId.ARTIC, ClassId.ACCID, ClassId.DOT, ClassId.FLAG, ClassId.NOTE, ClassId.REST, ClassId.STEM] as const;
    const descendants: AdjustTupletsYObjectLike[] = [];
    if (tuplet.FindAllDescendantsByComparison) {
      tuplet.FindAllDescendantsByComparison(descendants, new ClassIdsComparison([...ids]));
    } else {
      for (const id of ids) descendants.push(...tuplet.FindAllDescendantsByType(id));
    }
    const obstacles: Point[] = [];
    for (const descendant of descendants) {
      if (!descendant.HasSelfBB()) continue;
      if (descendant.m_crossStaff) continue;
      const obstacleY = bracketPos === STAFFREL_basic_above ? descendant.GetSelfTop() : descendant.GetSelfBottom();
      obstacles.push(new Point(descendant.GetDrawingX(), obstacleY));
    }

    const unit = this.m_doc.GetDrawingUnit(staffSize);
    const sign = bracketPos === STAFFREL_basic_above ? 1 : -1;
    const horizontalBracketShift = this.CalcBracketShift(referencePos, 0, sign, obstacles);
    let optimalTilt = 0;
    let optimalShift = horizontalBracketShift;

    if (this.m_doc.GetOptions().m_tupletAngledOnBeams?.GetValue?.() !== true) {
      const bracketWidth = tupletBracket.GetDrawingXRight() - tupletBracket.GetDrawingXLeft();
      const direction = tuplet.GetMelodicDirection?.();
      for (const tilt of [-4, -2, 2, 4]) {
        if (bracketWidth === 0) continue;
        if (direction === MelodicDirection.Up && tilt < 0) continue;
        if (direction === MelodicDirection.Down && tilt > 0) continue;
        const slope = tilt * unit / bracketWidth;
        const shift = this.CalcBracketShift(referencePos, slope, sign, obstacles);
        if (shift < Math.abs(tilt) * unit / 2) continue;
        if (shift > horizontalBracketShift - Math.abs(tilt) * unit / 4) continue;
        if (shift < optimalShift) {
          optimalShift = shift;
          optimalTilt = tilt;
        }
      }
    }

    const verticalMargin = 2 * unit;
    tupletBracket.SetDrawingYRel(staffBoundary + sign * (optimalShift + verticalMargin));
    tupletBracket.SetDrawingYRelLeft(-optimalTilt * unit / 2);
    tupletBracket.SetDrawingYRelRight(optimalTilt * unit / 2);
  }

  private AdjustTupletNumY(tuplet: AdjustTupletsYTupletLike, staff: AdjustTupletsYStaffLike): void {
    const showHidden = this.m_doc.GetOptions().m_showHidden.GetValue();
    const tupletNum = tuplet.FindAllDescendantsByType(ClassId.TUPLET_NUM)[0] as AdjustTupletsYNumLike | undefined;
    if (!tupletNum || (!showHidden && tuplet.GetNumVisible() === BOOLEAN_false)) return;

    const alignedBracket = tupletNum.GetAlignedBracket();
    if (alignedBracket) {
      tupletNum.SetDrawingYRel(alignedBracket.GetDrawingYRel());
      return;
    }

    const beam = tuplet.GetNumAlignedBeam();
    tuplet.CalculateTupletNumCrossStaff(tupletNum);
    let isPartialBeamTuplet = false;
    if (beam && tuplet.m_crossStaff) {
      const coords = beam.m_beamSegment.GetElementCoordRefs();
      const descendants = [
        ...tuplet.FindAllDescendantsByType(ClassId.CHORD),
        ...tuplet.FindAllDescendantsByType(ClassId.NOTE),
        ...tuplet.FindAllDescendantsByType(ClassId.REST),
      ];
      if (beam.m_beamSegment.m_nbNotesOrChords > descendants.length
        && coords.some(coord => coord.m_element.m_crossStaff === null)) {
        if (!tuplet.HasValidTupletNumPosition(tupletNum.m_crossStaff, beam.m_beamStaff)) {
          tupletNum.m_crossStaff = beam.m_beamStaff;
        }
        isPartialBeamTuplet = true;
      }
    }

    const tupletNumStaff = tupletNum.m_crossStaff || staff;
    const staffSize = staff.m_drawingStaffSize;
    const yReference = tupletNumStaff.GetDrawingY();
    const doubleUnit = this.m_doc.GetDrawingDoubleUnit(staffSize);
    const numPos = tuplet.GetDrawingNumPos();
    const numVerticalMargin = numPos === STAFFREL_basic_above ? doubleUnit : -doubleUnit;
    const staffHeight = this.m_doc.GetDrawingStaffSize(staffSize);
    const adjustedPosition = numPos === STAFFREL_basic_above ? 0 : -staffHeight;
    if (!beam) tupletNum.SetDrawingYRel(adjustedPosition);

    const margin = 2 * this.m_doc.GetDrawingUnit(staffSize);
    const overlap = new AdjustTupletNumOverlapFunctor(tupletNum, tupletNumStaff, numPos, tupletNum.GetDrawingY());
    overlap.SetHorizontalMargin(margin);
    tuplet.Process(overlap);
    let yRel = overlap.GetDrawingY() - yReference;

    if (beam && (!tuplet.m_crossStaff || isPartialBeamTuplet) && !tuplet.FindDescendantByType(ClassId.ARTIC)) {
      const xMid = tupletNum.GetDrawingXMid(this.m_doc);
      const yMid = Math.trunc(beam.m_beamSegment.GetStartingY() + beam.m_beamSegment.m_beamSlope * (xMid - beam.m_beamSegment.GetStartingX()));
      const beamYRel = yMid - yReference + numVerticalMargin;
      if ((numPos === STAFFREL_basic_above && beamYRel > 0) || (numPos === STAFFREL_basic_below && beamYRel < -staffHeight)) {
        yRel = beamYRel;
      }
    } else {
      yRel += numVerticalMargin;
    }

    if ((numPos === STAFFREL_basic_below && yRel > adjustedPosition)
      || (numPos === STAFFREL_basic_above && yRel < adjustedPosition)) {
      yRel = adjustedPosition;
    }

    const fTremChild = tuplet.FindDescendantByType(ClassId.FTREM) as AdjustTupletsYFTremLike | null;
    if (fTremChild) {
      const coords = fTremChild.GetElementCoords();
      const y1 = coords[0].m_yBeam;
      const y2 = coords[1].m_yBeam;
      const currentPosition = tuplet.GetDrawingY() + yRel;
      if (numPos === STAFFREL_basic_above && currentPosition < (y1 + y2) / 2) {
        yRel += (y1 + y2) / 2 - currentPosition;
      } else if (numPos === STAFFREL_basic_below && currentPosition + margin > (y1 + y2) / 2) {
        yRel += (y1 + y2) / 2 - (currentPosition + margin);
      }
    }

    tupletNum.SetDrawingYRel(yRel);
  }

  private AdjustTupletBracketBeamY(
    tuplet: AdjustTupletsYTupletLike,
    bracket: AdjustTupletsYBracketLike,
    beam: AdjustTupletsYBeamLike,
    staff: AdjustTupletsYStaffLike,
  ): void {
    const staffSize = staff.m_drawingStaffSize;
    const doubleUnit = this.m_doc.GetDrawingDoubleUnit(staffSize);
    const bracketPos = tuplet.GetDrawingBracketPos();
    const sign = bracketPos === STAFFREL_basic_above ? 1 : -1;
    let bracketVerticalMargin = sign * doubleUnit;

    const artics = tuplet.FindAllDescendantsByType(ClassId.ARTIC);
    let articPadding = 0;
    for (const artic of artics) {
      if (!artic.HasSelfBB()) continue;
      if (bracketPos === STAFFREL_basic_above) {
        const relevantX = beam.m_beamSegment.m_beamSlope > 0 ? artic.GetSelfLeft?.() ?? artic.GetDrawingX() : artic.GetSelfRight?.() ?? artic.GetDrawingX();
        const currentYRel = Math.trunc(beam.m_beamSegment.GetStartingY() + beam.m_beamSegment.m_beamSlope * (relevantX - beam.m_beamSegment.GetStartingX()));
        const articYRel = artic.GetSelfTop();
        articPadding = Math.min(currentYRel - articYRel, articPadding);
      } else {
        const relevantX = beam.m_beamSegment.m_beamSlope > 0 ? artic.GetSelfRight?.() ?? artic.GetDrawingX() : artic.GetSelfLeft?.() ?? artic.GetDrawingX();
        const currentYRel = Math.trunc(beam.m_beamSegment.GetStartingY() + beam.m_beamSegment.m_beamSlope * (relevantX - beam.m_beamSegment.GetStartingX()));
        const articYRel = artic.GetSelfBottom();
        articPadding = Math.max(currentYRel - articYRel, articPadding);
      }
    }

    const descendants = tuplet.FindAllDescendantsByType(ClassId.REST);
    let restAdjust = 0;
    const bracketRel = bracket.GetDrawingYRel() - articPadding + bracketVerticalMargin;
    const bracketPosition = Math.trunc((bracket.GetSelfTop() + bracket.GetSelfBottom() + bracketRel) / 2);
    for (const descendant of descendants) {
      if (descendant.GetFirstAncestor(ClassId.BEAM) || !descendant.HasSelfBB()) continue;
      if (bracketPos === STAFFREL_basic_above) {
        if (bracketPosition < descendant.GetSelfTop()) {
          const verticalShift = descendant.GetSelfTop() - bracketPosition;
          if (restAdjust === 0 || restAdjust < verticalShift) restAdjust = verticalShift;
        }
      } else if (bracketPosition > descendant.GetSelfBottom()) {
        const verticalShift = descendant.GetSelfBottom() - bracketPosition;
        if (restAdjust === 0 || restAdjust > verticalShift) restAdjust = verticalShift;
      }
    }
    if (restAdjust) bracketVerticalMargin += restAdjust;

    const yReference = staff.GetDrawingY();
    bracket.SetDrawingYRel(bracket.GetDrawingYRel() - articPadding + bracketVerticalMargin);

    const staffMargin = bracketPos === STAFFREL_basic_above
      ? yReference + doubleUnit
      : yReference - this.m_doc.GetDrawingStaffSize(staffSize) - doubleUnit;
    const leftMargin = sign * (staffMargin - bracket.GetDrawingYLeft());
    const rightMargin = sign * (staffMargin - bracket.GetDrawingYRight());
    const maxMargin = Math.max(leftMargin, rightMargin);
    if (maxMargin > 0) {
      let bracketAdjust = 0;
      if (leftMargin > 0 && rightMargin > 0) bracketAdjust = Math.min(leftMargin, rightMargin);
      if (bracketAdjust > 0) bracket.SetDrawingYRel(bracket.GetDrawingYRel() + sign * bracketAdjust);
      if (leftMargin > 0) bracket.SetDrawingYRelLeft(sign * (leftMargin - bracketAdjust));
      if (rightMargin > 0) bracket.SetDrawingYRelRight(sign * (rightMargin - bracketAdjust));
    }

    if (beam.m_crossStaffContent && bracketPos === STAFFREL_basic_below && beam.m_crossStaffContent.GetN && staff.GetN && beam.m_crossStaffContent.GetN() > staff.GetN()) {
      bracket.SetDrawingYRelLeft(bracket.GetDrawingYRelLeft() - Math.trunc(doubleUnit / 4));
      bracket.SetDrawingYRelRight(bracket.GetDrawingYRelRight() - Math.trunc(doubleUnit / 4));
    }
  }

  private CalcBracketShift(referencePos: Point, slope: number, sign: number, obstacles: Point[]): number {
    let shift = 0;
    for (const obstacle of obstacles) {
      const lineShift = obstacle.y - slope * obstacle.x;
      const dist = Math.trunc(slope * referencePos.x + lineShift - referencePos.y);
      shift = Math.max(dist * sign, shift);
    }
    return shift;
  }
}

export interface AdjustTupletNumOverlapLayerElementLike {
  IsAnyOf(classIds: readonly ClassId[]): boolean;
  HasSelfBB(): boolean;
  Is(classId: ClassId): boolean;
  m_crossStaff: AdjustTupletsYStaffLike | null;
  GetFirstAncestor(classId: ClassId): any;
  HorizontalSelfOverlap(other: any, margin: number): boolean;
  VerticalSelfOverlap(other: any, margin: number): boolean;
  GetSelfTop(): number;
  GetSelfBottom(): number;
  GetDrawingStemAdjust(): number;
}

export class AdjustTupletNumOverlapFunctor extends ConstFunctor {
  private readonly m_tupletNum: AdjustTupletsYNumLike;
  private readonly m_drawingNumPos: number;
  private m_horizontalMargin = 0;
  private m_verticalMargin = 0;
  private readonly m_staff: AdjustTupletsYStaffLike;
  private m_drawingY: number;

  public constructor(tupletNum: AdjustTupletsYNumLike, staff: AdjustTupletsYStaffLike, drawingNumPos: number, drawingY: number) {
    super();
    this.m_tupletNum = tupletNum;
    this.m_drawingNumPos = drawingNumPos;
    this.m_staff = staff;
    this.m_drawingY = drawingY;
  }

  public override ImplementsEndInterface(): boolean { return false; }
  public SetHorizontalMargin(margin: number): void { this.m_horizontalMargin = margin; }
  public SetVerticalMargin(margin: number): void { this.m_verticalMargin = margin; }
  public GetDrawingY(): number { return this.m_drawingY; }

  public VisitLayerElement(layerElement: AdjustTupletNumOverlapLayerElementLike): FunctorCode {
    const supported = [ClassId.ACCID, ClassId.ARTIC, ClassId.CHORD, ClassId.DOT, ClassId.FLAG, ClassId.NOTE, ClassId.REST, ClassId.STEM] as const;
    if (!layerElement.IsAnyOf(supported) || !layerElement.HasSelfBB()) return FunctorCode.FUNCTOR_CONTINUE;
    if (layerElement.IsAnyOf([ClassId.CHORD, ClassId.NOTE, ClassId.REST])
      && ((layerElement.m_crossStaff || layerElement.GetFirstAncestor(ClassId.STAFF) !== this.m_staff)
        && layerElement.m_crossStaff !== this.m_staff)) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    if (!this.m_tupletNum.HorizontalSelfOverlap(layerElement, this.m_horizontalMargin)
      && !this.m_tupletNum.VerticalSelfOverlap(layerElement, this.m_verticalMargin)) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    let stemAdjust = 0;
    if (layerElement.Is(ClassId.STEM)) stemAdjust = layerElement.GetDrawingStemAdjust();
    if (this.m_drawingNumPos === STAFFREL_basic_above) {
      const dist = layerElement.GetSelfTop();
      if (this.m_drawingY < dist) this.m_drawingY = dist + stemAdjust;
    } else {
      const dist = layerElement.GetSelfBottom();
      if (this.m_drawingY > dist) this.m_drawingY = dist + stemAdjust;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

export interface AdjustTupletCurveLike {
  GetPoints(out?: Point[]): Point[] | void;
}

export class AdjustTupletWithSlursFunctor extends DocFunctor {
  public constructor(doc: AdjustTupletsYDocLike) { super(doc as any); }
  public override ImplementsEndInterface(): boolean { return false; }

  public VisitTuplet(tuplet: AdjustTupletsYTupletLike): FunctorCode {
    const tupletBracket = tuplet.FindAllDescendantsByType(ClassId.TUPLET_BRACKET)[0] as AdjustTupletsYBracketLike | undefined;
    // C++ checks std::set::empty(); the TS store is a Set (no .length property).
    if (!tupletBracket || tuplet.GetInnerSlurs().size === 0) return FunctorCode.FUNCTOR_SIBLINGS;
    const tupletNum = tuplet.FindAllDescendantsByType(ClassId.TUPLET_NUM)[0] as AdjustTupletsYNumLike | undefined;

    const staff = tuplet.GetAncestorStaff(RESOLVE_CROSS_STAFF);
    const margin = Math.trunc(this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize) / 2);
    const bracketPos = tuplet.GetDrawingBracketPos();
    const sign = bracketPos === STAFFREL_basic_above ? 1 : -1;

    const leftObj = tuplet.GetDrawingLeft()!;
    const rightObj = tuplet.GetDrawingRight()!;
    const xLeft = leftObj.GetDrawingX() + tupletBracket.GetDrawingXRelLeft();
    const xRight = rightObj.GetDrawingX() + tupletBracket.GetDrawingXRelRight();
    const yLeft = tupletBracket.GetDrawingYLeft();
    const yRight = tupletBracket.GetDrawingYRight();
    const tupletSlope = (yRight - yLeft) / (xRight - xLeft);
    let tupletShift = 0;

    for (const curve of tuplet.GetInnerSlurs() as Set<{ GetPoints?: () => unknown }>) {
      const shift = tupletBracket.Intersects(curve, Accessor.CONTENT, margin) * sign;
      if (shift > 0) {
        const pointsRaw = curve.GetPoints?.();
        const points = Array.isArray(pointsRaw) ? pointsRaw : [];
        if (points.length < 4) continue;
        const curveXLeft = Math.max(points[0].x, xLeft);
        const curveXRight = Math.min(points[3].x, xRight);
        const curveYLeft = Math.trunc(tupletSlope * (curveXLeft - xLeft) + yLeft);
        const curveYRight = Math.trunc(tupletSlope * (curveXRight - xLeft) + yLeft);
        let reduction = 0;
        if (bracketPos === STAFFREL_basic_above) {
          reduction = Math.min(curveYLeft, curveYRight) - Math.min(yLeft, yRight);
        } else {
          reduction = Math.max(yLeft, yRight) - Math.max(curveYLeft, curveYRight);
        }
        tupletShift = Math.max(shift - reduction, tupletShift);
      }
    }

    if (tupletShift) {
      tupletBracket.SetDrawingYRel(tupletBracket.GetDrawingYRel() + sign * tupletShift);
      if (tupletNum) tupletNum.SetDrawingYRel((tupletNum.GetDrawingYRel?.() ?? 0) + sign * tupletShift);
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }
}
