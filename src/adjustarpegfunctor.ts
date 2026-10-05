import { DocFunctor } from './functor.js';
import { ClassId, FunctorCode, BACKWARD, VRV_UNSET } from './vrvdef.js';

export interface AdjustArpegTupleArpeg {
  GetCurrentFloatingPositioner(): { GetSelfLeft(): number } | null;
  GetEnclose(): number;
  GetArrow(): number;
  SetDrawingXRel(value: number): void;
  GetDrawingXRel(): number;
  GetDrawingTopBottomNotes(top?: unknown, bottom?: unknown): { top: AdjustArpegNoteLike | null; bottom: AdjustArpegNoteLike | null } | void;
}

export interface AdjustArpegNoteLike {
  GetAlignment(): AdjustArpegAlignmentLike;
  GetDrawingX(): number;
  GetDrawingY(): number;
  GetAncestorStaff(): AdjustArpegStaffLike | null;
}

export interface AdjustArpegStaffLike { GetN(): number; m_drawingStaffSize: number; }

export interface AdjustArpegAlignmentLike {
  GetType(): number;
  GetLeftRight(staffN: number, min: number, max: number): [number, number] | void;
  HasGraceAligner(id: number): boolean;
  GetGraceAligner(id: number): { GetGraceGroupRight(staffN: number): number };
  GetXRel(): number;
  SetXRel(value: number): void;
  GetAlignmentTopBottom(): [number, number];
}

export interface AdjustArpegMeasureLike {
  m_measureAligner: AdjustArpegMeasureAlignerLike;
  GetParent(): AdjustArpegParentLike | null;
  GetWidth(): number;
}
export interface AdjustArpegMeasureAlignerLike { Process(functor: AdjustArpegFunctor): void; GetRightBarLineAlignment(): AdjustArpegAlignmentLike; AdjustProportionally(boundaries: unknown[]): void; }
export interface AdjustArpegParentLike { GetPrevious(measure: AdjustArpegMeasureLike, classId: ClassId): AdjustArpegMeasureLike | null; }

export interface AdjustArpegDocLike {
  GetOptions(): { m_graceRhythmAlign: { GetValue(): boolean } };
  GetDrawingUnit(value: number): number;
}

export const ALIGNMENT_MEASURE_LEFT_BARLINE = 5;
export const ALIGNMENT_CLEF = 10;
export const ALIGNMENT_GRACENOTE = 18;
export const ENCLOSURE_brack = 2;
export const ENCLOSURE_box = 3;
export const BOOLEAN_true = 1;

interface Tuple { alignment: AdjustArpegAlignmentLike; arpeg: AdjustArpegTupleArpeg; staffN: number; reached: boolean; }

export class AdjustArpegFunctor extends DocFunctor {
  private readonly m_alignmentArpegTuples: Tuple[] = [];
  private m_measureAligner: AdjustArpegMeasureAlignerLike | null = null;

  public constructor(doc: AdjustArpegDocLike) { super(doc); }

  public override ImplementsEndInterface(): boolean { return true; }

  public VisitAlignment(alignment: AdjustArpegAlignmentLike): FunctorCode {
    const alignmentType = alignment.GetType();
    let iter = 0;
    while (iter < this.m_alignmentArpegTuples.length) {
      const tuple = this.m_alignmentArpegTuples[iter];
      if (tuple.alignment === alignment) { tuple.reached = true; ++iter; continue; }
      if (!tuple.reached) { ++iter; continue; }

      let minLeft = 0, maxRight = VRV_UNSET;
      [minLeft, maxRight] = this.getLeftRight(alignment, tuple.staffN, minLeft, maxRight);
      if (maxRight === VRV_UNSET) [minLeft, maxRight] = this.getLeftRight(alignment, -1, minLeft, maxRight);

      if (maxRight === VRV_UNSET && alignmentType === ALIGNMENT_MEASURE_LEFT_BARLINE) {
        const measure = (this.asObject(alignment).GetFirstAncestor?.(ClassId.MEASURE) ?? null) as AdjustArpegMeasureLike | null;
        const previous = measure?.GetParent()?.GetPrevious(measure, ClassId.MEASURE) ?? null;
        if (previous) {
          const barLineAlignment = previous.m_measureAligner.GetRightBarLineAlignment();
          [minLeft, maxRight] = this.getLeftRight(barLineAlignment, -1, minLeft, maxRight);
          if (maxRight !== VRV_UNSET) { const previousWidth = previous.GetWidth(); minLeft -= previousWidth; maxRight -= previousWidth; }
        }
      }

      if (alignmentType === ALIGNMENT_GRACENOTE) {
        const doc = this.m_doc as AdjustArpegDocLike;
        const graceAlignerId = doc.GetOptions().m_graceRhythmAlign.GetValue() ? 0 : tuple.staffN;
        if (alignment.HasGraceAligner(graceAlignerId)) {
          const graceAligner = alignment.GetGraceAligner(graceAlignerId);
          maxRight = graceAligner.GetGraceGroupRight(tuple.staffN);
          const positioner = tuple.arpeg.GetCurrentFloatingPositioner();
          if (positioner) {
            const overlap = maxRight - positioner.GetSelfLeft();
            if (overlap > 0) alignment.SetXRel(alignment.GetXRel() - Math.trunc(doc.GetDrawingUnit(100) / 6));
          }
        }
      }

      if (maxRight === VRV_UNSET) { ++iter; continue; }
      const positioner = tuple.arpeg.GetCurrentFloatingPositioner();
      if (!positioner) throw new Error('AdjustArpegFunctor requires current arpeg floating positioner');
      const overlap = maxRight - positioner.GetSelfLeft();
      const drawingUnit = (this.m_doc as AdjustArpegDocLike).GetDrawingUnit(100);
      const adjust = Math.trunc(overlap + Math.trunc(drawingUnit / 2) * 3);
      if (adjust > 0) {
        this.m_measureAligner?.AdjustProportionally([[alignment as any, tuple.alignment as any, adjust]]);
        if (alignmentType === ALIGNMENT_CLEF) {
          const [currentMin, currentMax] = alignment.GetAlignmentTopBottom();
          const notes = tuple.arpeg.GetDrawingTopBottomNotes();
          const topNote = notes && 'top' in notes ? notes.top : null;
          const bottomNote = notes && 'bottom' in notes ? notes.bottom : null;
          if (topNote && bottomNote) {
            const arpegMax = topNote.GetDrawingY() + Math.trunc(drawingUnit / 2);
            const arpegMin = bottomNote.GetDrawingY() - Math.trunc(drawingUnit / 2);
            if ((currentMin < arpegMin && currentMax > arpegMin) || (currentMax > arpegMax && currentMin < arpegMax)) {
              tuple.alignment.SetXRel(tuple.alignment.GetXRel() + overlap + Math.trunc(drawingUnit / 2));
            }
          }
        }
      }
      this.m_alignmentArpegTuples.splice(iter, 1);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitArpeg(arpeg: AdjustArpegTupleArpeg): FunctorCode {
    const notesResult = arpeg.GetDrawingTopBottomNotes();
    const topNote = notesResult && 'top' in notesResult ? notesResult.top : null;
    const bottomNote = notesResult && 'bottom' in notesResult ? notesResult.bottom : null;
    if (!topNote || !bottomNote) return FunctorCode.FUNCTOR_CONTINUE;
    if (!arpeg.GetCurrentFloatingPositioner()) throw new Error('AdjustArpegFunctor::VisitArpeg requires positioner');

    const topStaff = topNote.GetAncestorStaff();
    const bottomStaff = bottomNote.GetAncestorStaff();
    if (!topStaff || !bottomStaff) return FunctorCode.FUNCTOR_CONTINUE;
    const crossStaff = (arpeg as any).GetCrossStaff?.() as AdjustArpegStaffLike | null;
    const staffN = crossStaff ? crossStaff.GetN() : topStaff.GetN();
    let [minTopLeft] = this.getLeftRight(topNote.GetAlignment(), staffN, 0, VRV_UNSET);
    this.m_alignmentArpegTuples.push({ alignment: topNote.GetAlignment(), arpeg, staffN: topStaff.GetN(), reached: false });
    if (topStaff !== bottomStaff) {
      const [minBottomLeft] = this.getLeftRight(topNote.GetAlignment(), bottomStaff.GetN(), 0, VRV_UNSET);
      minTopLeft = Math.min(minTopLeft, minBottomLeft);
      this.m_alignmentArpegTuples.push({ alignment: topNote.GetAlignment(), arpeg, staffN: bottomStaff.GetN(), reached: false });
    }
    if (minTopLeft !== -VRV_UNSET) {
      let dist = topNote.GetDrawingX() - minTopLeft;
      let unitFactor = 1.0;
      const enclose = arpeg.GetEnclose();
      if (enclose === ENCLOSURE_brack || enclose === ENCLOSURE_box) unitFactor += 0.75;
      if (arpeg.GetArrow() === BOOLEAN_true) unitFactor += 0.33;
      dist += Math.trunc(unitFactor * (this.m_doc as AdjustArpegDocLike).GetDrawingUnit(topStaff.m_drawingStaffSize));
      arpeg.SetDrawingXRel(-dist);
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasureEnd(measure: AdjustArpegMeasureLike): FunctorCode {
    if (this.m_alignmentArpegTuples.length > 0) {
      this.m_measureAligner = measure.m_measureAligner;
      const previousDirection = this.SetDirection(BACKWARD);
      this.m_measureAligner.Process(this);
      this.SetDirection(previousDirection);
      this.m_alignmentArpegTuples.length = 0;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public GetAlignmentArpegTuples(): readonly Tuple[] { return this.m_alignmentArpegTuples; }

  private getLeftRight(alignment: AdjustArpegAlignmentLike, staffN: number, min: number, max: number): [number, number] {
    const minRef = { value: min };
    const maxRef = { value: max };
    const ret = (alignment as any).GetLeftRight?.(staffN, minRef, maxRef);
    if (Array.isArray(ret)) return [ret[0] ?? min, ret[1] ?? max];
    return [minRef.value, maxRef.value];
  }
  private asObject(value: unknown): any { return value as any; }
}
