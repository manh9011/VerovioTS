/**
 * Pure TypeScript translation of Verovio's src/adjustbeamsfunctor.cpp.
 *
 * The C++ implementation depends on the native object/layout hierarchy. Those
 * not-yet-migrated classes are represented structurally here; the algorithm,
 * branch ordering, sentinel values and mutation sequence follow the canonical
 * source.
 */
import { DocFunctor } from './functor.js';
import { Accessor, ClassId, DURATION_4, DURATION_8, FunctorCode } from './vrvdef.js';
import { AttVisibilityComparison } from './comparison.js';
import { BEAMPLACE_above, BEAMPLACE_mixed, STEMDIRECTION_up, STEMDIRECTION_down } from './drawinginterface.js';

/** libmei BOOLEAN_false ordinal (attconverter.ts). */
const BOOLEAN_false = 2;

export class AdjustBeamsFunctor extends DocFunctor {
  private m_outerBeam: any | null = null;
  private m_outerFTrem: any | null = null;
  private m_y1 = 0;
  private m_y2 = 0;
  private m_x1 = 0;
  private m_x2 = 0;
  private m_beamSlope = 0.0;
  private m_directionBias = 0;
  private m_overlapMargin = 0;
  private m_isOtherLayer = false;

  public constructor(doc: any) {
    super(doc);
  }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitBeam(beam: any): FunctorCode {
    const beamSegment = beam.m_beamSegment;
    if (beam.IsTabBeam() || beam.HasSameas() || !beam.GetChildCount()
      || beamSegment.m_beamElementCoordRefs.length === 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (this.m_outerFTrem) return FunctorCode.FUNCTOR_CONTINUE;

    if (!this.m_outerBeam) {
      if (beam.m_drawingPlace === BEAMPLACE_mixed) {
        beamSegment.RequestStaffSpace(this.m_doc, beam);
      } else {
        this.m_outerBeam = beam;
        // C++ AdjustBeamsFunctor::m_y1/m_y2/m_x1/m_x2 are int (adjustbeamsfunctor.h:72-76).
        this.m_y1 = Math.trunc(beamSegment.m_beamElementCoordRefs[0].m_yBeam);
        this.m_y2 = Math.trunc(beamSegment.m_beamElementCoordRefs[beamSegment.m_beamElementCoordRefs.length - 1].m_yBeam);
        this.m_x1 = Math.trunc(beamSegment.m_beamElementCoordRefs[0].m_x);
        this.m_x2 = Math.trunc(beamSegment.m_beamElementCoordRefs[beamSegment.m_beamElementCoordRefs.length - 1].m_x);
        this.m_beamSlope = beamSegment.m_beamSlope;
        this.m_directionBias = beam.m_drawingPlace === BEAMPLACE_above ? 1 : -1;
        this.m_overlapMargin = this.CalcLayerOverlap(beam);
      }
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const first = beamSegment.m_beamElementCoordRefs[0];
    const last = beamSegment.m_beamElementCoordRefs[beamSegment.m_beamElementCoordRefs.length - 1];
    const beamCount = this.m_outerBeam.GetBeamPartDuration(first.m_x) - DURATION_8;
    const currentBeamYLeft = Math.trunc(this.m_y1 + this.m_beamSlope * (first.m_x - this.m_x1));
    const currentBeamYRight = Math.trunc(this.m_y1 + this.m_beamSlope * (last.m_x - this.m_x1));
    const leftMargin = first.m_yBeam - currentBeamYLeft
      + this.m_directionBias * (beamCount * this.m_outerBeam.m_beamWidth + this.m_outerBeam.m_beamWidthBlack);
    const rightMargin = last.m_yBeam - currentBeamYRight
      + this.m_directionBias * (beamCount * this.m_outerBeam.m_beamWidth + this.m_outerBeam.m_beamWidthBlack);

    const overlapMargin = Math.max(leftMargin * this.m_directionBias, rightMargin * this.m_directionBias);
    if (overlapMargin >= this.m_overlapMargin) {
      const staff = beam.GetAncestorStaff();
      const staffOffset = this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize);
      this.m_overlapMargin = (overlapMargin + staffOffset) * this.m_directionBias;
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitBeamEnd(beam: any): FunctorCode {
    if (beam.IsTabBeam()) return FunctorCode.FUNCTOR_CONTINUE;
    if (this.m_outerBeam !== beam) return FunctorCode.FUNCTOR_CONTINUE;
    if (beam.m_drawingPlace === BEAMPLACE_mixed) return FunctorCode.FUNCTOR_CONTINUE;

    const parentLayer = beam.GetFirstAncestor(ClassId.LAYER) as any | null;
    if (parentLayer) {
      const otherLayersElements = parentLayer.GetLayerElementsForTimeSpanOf(beam, true);
      if (otherLayersElements && otherLayersElements.length) {
        this.m_isOtherLayer = true;
        for (const element of otherLayersElements) {
          if (!this.m_outerBeam.HorizontalContentOverlap(element)) continue;
          element.Process(this, 0);
        }
        this.m_isOtherLayer = false;
      }
    }

    if (this.m_overlapMargin) {
      for (const coord of beam.m_beamSegment.m_beamElementCoordRefs) coord.m_overlapMargin = this.m_overlapMargin;
    }
    this.m_outerBeam = null;
    this.m_overlapMargin = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitClef(clef: any): FunctorCode {
    if (!this.m_outerBeam) return FunctorCode.FUNCTOR_SIBLINGS;
    if (clef.GetDrawingX() < this.m_x1) return FunctorCode.FUNCTOR_CONTINUE;
    if (clef.GetDrawingX() > this.m_x2) return FunctorCode.FUNCTOR_CONTINUE;

    const staff = clef.GetAncestorStaff();
    const beams = this.m_outerBeam.GetBeamPartDuration(clef) - DURATION_4;
    const beamWidth = this.m_outerBeam.m_beamWidth;
    const currentBeamYLeft = Math.trunc(this.m_y1 + this.m_beamSlope * (clef.GetContentLeft() - this.m_x1));
    const currentBeamYRight = Math.trunc(this.m_y1 + this.m_beamSlope * (clef.GetContentRight() - this.m_x1));
    const clefCode = clef.GetClefGlyph(staff.m_drawingNotationType);
    if (!clefCode) return FunctorCode.FUNCTOR_SIBLINGS;

    const clefPosition = staff.GetDrawingY()
      - Math.imul(this.m_doc.GetDrawingDoubleUnit(staff.m_drawingStaffSize), (staff.m_drawingLines - clef.GetLine()) | 0);
    const clefBounds = clefPosition
      + (this.m_directionBias > 0
        ? this.m_doc.GetGlyphTop(clefCode, staff.m_drawingStaffSize, false)
        : this.m_doc.GetGlyphBottom(clefCode, staff.m_drawingStaffSize, false));
    const leftMargin = this.m_directionBias * (currentBeamYLeft - clefBounds) - beams * beamWidth;
    const rightMargin = this.m_directionBias * (currentBeamYRight - clefBounds) - beams * beamWidth;
    let overlapMargin = Math.min(leftMargin, rightMargin);
    if (overlapMargin >= 0) return FunctorCode.FUNCTOR_CONTINUE;

    overlapMargin *= -this.m_directionBias;
    const unit = this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize);
    const adjust = this.AdjustOverlapToHalfUnit(overlapMargin, unit);
    if (Math.abs(adjust) > Math.abs(this.m_overlapMargin)) this.m_overlapMargin = adjust;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitFTrem(fTrem: any): FunctorCode {
    const beamSegment = fTrem.m_beamSegment;
    if (fTrem.HasSameas() || !fTrem.GetChildCount() || beamSegment.m_beamElementCoordRefs.length === 0) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (!this.m_outerBeam && !this.m_outerFTrem) {
      if (fTrem.m_drawingPlace === BEAMPLACE_mixed) {
        beamSegment.RequestStaffSpace(this.m_doc, fTrem);
      } else {
        this.m_outerFTrem = fTrem;
        this.m_y1 = Math.trunc(beamSegment.m_beamElementCoordRefs[0].m_yBeam);
        this.m_y2 = Math.trunc(beamSegment.m_beamElementCoordRefs[beamSegment.m_beamElementCoordRefs.length - 1].m_yBeam);
        this.m_x1 = Math.trunc(beamSegment.m_beamElementCoordRefs[0].m_x);
        this.m_x2 = Math.trunc(beamSegment.m_beamElementCoordRefs[beamSegment.m_beamElementCoordRefs.length - 1].m_x);
        this.m_beamSlope = beamSegment.m_beamSlope;
        this.m_directionBias = fTrem.m_drawingPlace === BEAMPLACE_above ? 1 : -1;
        this.m_overlapMargin = this.CalcLayerOverlap(fTrem);
      }
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const first = beamSegment.m_beamElementCoordRefs[0];
    const last = beamSegment.m_beamElementCoordRefs[beamSegment.m_beamElementCoordRefs.length - 1];
    const leftMargin = first.m_yBeam - this.m_y1;
    const rightMargin = last.m_yBeam - this.m_y2;
    const overlapMargin = Math.max(leftMargin * this.m_directionBias, rightMargin * this.m_directionBias);
    if (overlapMargin >= this.m_overlapMargin) {
      const staff = fTrem.GetAncestorStaff();
      const staffOffset = this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize);
      this.m_overlapMargin = (overlapMargin + staffOffset) * this.m_directionBias;
    }
    return FunctorCode.FUNCTOR_SIBLINGS;
  }

  public VisitFTremEnd(fTrem: any): FunctorCode {
    if (this.m_outerFTrem !== fTrem) return FunctorCode.FUNCTOR_CONTINUE;
    if (fTrem.m_drawingPlace === BEAMPLACE_mixed) return FunctorCode.FUNCTOR_CONTINUE;

    const parentLayer = fTrem.GetFirstAncestor(ClassId.LAYER) as any | null;
    if (parentLayer) {
      const otherLayersElements = parentLayer.GetLayerElementsForTimeSpanOf(fTrem, true);
      if (otherLayersElements && otherLayersElements.length) {
        this.m_isOtherLayer = true;
        for (const element of otherLayersElements) {
          if (!this.m_outerFTrem.HorizontalContentOverlap(element)) continue;
          element.Process(this, 0);
        }
        this.m_isOtherLayer = false;
      }
    }

    if (this.m_overlapMargin) {
      for (const coord of fTrem.m_beamSegment.m_beamElementCoordRefs) coord.m_overlapMargin = this.m_overlapMargin;
    }
    this.m_outerFTrem = null;
    this.m_overlapMargin = 0;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitLayerElement(layerElement: any): FunctorCode {
    const outerBeamInterface = this.GetOuterBeamInterface();
    if (!outerBeamInterface) return FunctorCode.FUNCTOR_CONTINUE;
    if (!this.m_isOtherLayer && !layerElement.Is(ClassId.ACCID) && !layerElement.IsGraceNote()
      && ((layerElement.GetFirstAncestor(ClassId.BEAM) === this.m_outerBeam)
        || (layerElement.GetFirstAncestor(ClassId.FTREM) === this.m_outerFTrem))) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    if (this.m_isOtherLayer && layerElement.m_crossStaff) return FunctorCode.FUNCTOR_CONTINUE;
    if (layerElement.IsAnyOf([ClassId.BTREM, ClassId.GRACEGRP, ClassId.SPACE, ClassId.TUPLET, ClassId.TUPLET_BRACKET, ClassId.TUPLET_NUM])) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }
    if (layerElement.GetDrawingX() < this.m_x1) return FunctorCode.FUNCTOR_CONTINUE;
    // C++ adjustbeamsfunctor.cpp:249 AttVisibilityComparison(GetClassId(), BOOLEAN_false)
    const isInvisible = new AttVisibilityComparison(layerElement.GetClassId(), BOOLEAN_false);
    if (isInvisible.matches(layerElement)) return FunctorCode.FUNCTOR_SIBLINGS;

    if (layerElement.Is(ClassId.ACCID)) {
      if (layerElement.GetFunc() === 2) return FunctorCode.FUNCTOR_CONTINUE;
      if (layerElement.HasPlace()) return FunctorCode.FUNCTOR_CONTINUE;
    }

    const stemInterface = layerElement.GetStemmedDrawingInterface?.();
    if (stemInterface
      && ((this.m_directionBias === 1 && stemInterface.GetDrawingStemDir() === STEMDIRECTION_up)
        || (this.m_directionBias === -1 && stemInterface.GetDrawingStemDir() === STEMDIRECTION_down))) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    const staff = layerElement.GetAncestorStaff();
    const aboveBelow = outerBeamInterface.GetAdditionalBeamCount();
    let beamCount = Math.max(aboveBelow[0], aboveBelow[1]);
    if (this.m_outerFTrem) --beamCount;
    const currentBeamYLeft = Math.trunc(this.m_y1 + this.m_beamSlope * (layerElement.GetContentLeft() - this.m_x1));
    const currentBeamYRight = Math.trunc(this.m_y1 + this.m_beamSlope * (layerElement.GetContentRight() - this.m_x1));
    let leftMargin: number;
    let rightMargin: number;
    if (this.m_directionBias > 0) {
      leftMargin = layerElement.GetContentTop() - currentBeamYLeft + beamCount * outerBeamInterface.m_beamWidth + outerBeamInterface.m_beamWidthBlack;
      rightMargin = layerElement.GetContentTop() - currentBeamYRight + beamCount * outerBeamInterface.m_beamWidth + outerBeamInterface.m_beamWidthBlack;
    } else {
      leftMargin = layerElement.GetContentBottom() - currentBeamYLeft - beamCount * outerBeamInterface.m_beamWidth - outerBeamInterface.m_beamWidthBlack;
      rightMargin = layerElement.GetContentBottom() - currentBeamYRight - beamCount * outerBeamInterface.m_beamWidth - outerBeamInterface.m_beamWidthBlack;
    }

    const overlapMargin = Math.max(leftMargin * this.m_directionBias, rightMargin * this.m_directionBias);
    if (overlapMargin >= this.m_directionBias * this.m_overlapMargin) {
      const staffOffset = this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize);
      // C++ adjustbeamsfunctor.cpp: int division truncates before +0.5, final double truncates on assignment.
      this.m_overlapMargin = Math.trunc((Math.trunc((overlapMargin + staffOffset - 1) / staffOffset) + 0.5) * staffOffset) * this.m_directionBias;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitRest(rest: any): FunctorCode {
    if (!this.m_outerBeam) return FunctorCode.FUNCTOR_SIBLINGS;
    const beams = this.m_outerBeam.GetBeamPartDuration(rest, false) - DURATION_4;
    const beamWidth = this.m_outerBeam.m_beamWidth;
    let overlapMargin = rest.IntersectsBeam(this.m_outerBeam, Accessor.SELF, beams * beamWidth, true) * this.m_directionBias;
    if (overlapMargin >= 0) return FunctorCode.FUNCTOR_CONTINUE;

    const staff = rest.GetAncestorStaff();
    if ((!rest.HasOloc() || !rest.HasPloc()) && !rest.HasLoc()) {
      const unit = this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize);
      const locAdjust = Math.trunc(this.m_directionBias * (overlapMargin - 2 * unit + 1) / unit);
      const oldLoc = rest.GetDrawingLoc();
      const newLoc = oldLoc + locAdjust - (locAdjust % 2);
      if (staff.GetChildCount(ClassId.LAYER) === 1) {
        rest.SetDrawingLoc(newLoc);
        rest.SetDrawingYRel(staff.CalcPitchPosYRel(this.m_doc, newLoc));
        if (rest.GetDots() > 0) {
          const dots = rest.FindDescendantByType(ClassId.DOTS, 1);
          if (dots) {
            const dotLocs = dots.ModifyDotLocsForStaff(staff);
            const dotLoc = (oldLoc % 2) ? oldLoc : oldLoc + 1;
            if (dotLocs.has(dotLoc)) {
              dotLocs.delete(dotLoc);
              dotLocs.add(newLoc);
            }
          }
        }
        return FunctorCode.FUNCTOR_CONTINUE;
      }
    }

    overlapMargin *= -this.m_directionBias;
    const unit = this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize);
    const adjust = this.AdjustOverlapToHalfUnit(overlapMargin, unit);
    if (Math.abs(adjust) > Math.abs(this.m_overlapMargin)) this.m_overlapMargin = adjust;
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  private GetOuterBeamInterface(): any | null {
    if (this.m_outerBeam) return this.m_outerBeam;
    if (this.m_outerFTrem) return this.m_outerFTrem;
    return null;
  }

  private CalcLayerOverlap(beamElement: any): number {
    const parentLayer = beamElement.GetFirstAncestor(ClassId.LAYER) as any | null;
    if (!parentLayer) return 0;
    let collidingElementsList = [...(parentLayer.GetLayerElementsForTimeSpanOf(beamElement, true) ?? [])];
    if (beamElement.Is(ClassId.BEAM)) {
      const stemSameAsBeam = beamElement.GetStemSameasBeam();
      if (stemSameAsBeam) {
        collidingElementsList = collidingElementsList.filter((object: any) => object.GetAncestorBeam() !== stemSameAsBeam);
      }
    }
    if (collidingElementsList.length === 0) return 0;

    const staff = beamElement.GetAncestorStaff();
    const drawingY = beamElement.GetDrawingY();
    const yMin = Math.min(this.m_y1, this.m_y2);
    const yMax = Math.max(this.m_y1, this.m_y2);
    const unit = this.m_doc.GetDrawingUnit(staff.m_drawingStaffSize);
    const elementOverlaps: number[] = [];

    for (const object of collidingElementsList) {
      const layerElement = object as any;
      if (!beamElement.HorizontalContentOverlap(object)) continue;
      const elementBottom = layerElement.GetContentBottom();
      const elementTop = layerElement.GetContentTop();
      let elementOverlap = 0;
      if (this.m_directionBias > 0) {
        if (elementBottom > yMax) continue;
        if (drawingY >= elementTop) continue;
        if (elementBottom > yMax - 3 * unit) elementOverlap = Math.min(elementBottom - yMax, 0);
        else elementOverlap = Math.max(elementTop - yMin, 0);
      } else {
        if (elementTop < yMin) continue;
        if (drawingY <= elementBottom) continue;
        if (elementTop < yMin + 3 * unit) elementOverlap = Math.min(yMin - elementTop, 0);
        else elementOverlap = Math.max(yMax - elementBottom, 0);
      }
      elementOverlaps.push(elementOverlap);
    }
    if (elementOverlaps.length === 0) return 0;

    const minOverlap = Math.min(...elementOverlaps);
    const maxOverlap = Math.max(...elementOverlaps);
    let overlap = 0;
    if (maxOverlap > 0) overlap = maxOverlap * this.m_directionBias;
    else if (minOverlap < 0) overlap = (minOverlap - unit) * this.m_directionBias;
    return this.AdjustOverlapToHalfUnit(overlap, unit);
  }

  private AdjustOverlapToHalfUnit(overlap: number, unit: number): number {
    const overlapSign = overlap >= 0 ? 1 : -1;
    const halfUnit = Math.trunc(unit / 2);
    const halfUnitChangeNumber = Math.trunc((Math.abs(overlap) + Math.trunc(halfUnit / 2)) / halfUnit);
    return halfUnitChangeNumber * halfUnit * overlapSign;
  }
}
