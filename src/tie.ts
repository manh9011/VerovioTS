/**
 * Pure TypeScript translation of Verovio's `src/tie.cpp` / `include/vrv/tie.h`.
 *
 * `Tie` models the MEI `<tie>` element.
 *
 * C++ multiple inheritance (ControlElement + OffsetSpanningInterface + TimeSpanningInterface +
 * AttCurvature + AttLineRendBase) is represented through explicit composition with forwarding surfaces.
 */
import {
  ClassId,
  FunctorCode,
  SpanningType,
} from './vrvdef.js';
import {
  STEMDIRECTION_NONE,
  STEMDIRECTION_up,
  STEMDIRECTION_down,
} from './drawinginterface.js';
import { ControlElement } from './controlelement.js';
import { OffsetSpanningInterface } from './offsetinterface.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { InstCurvature, InstLineRendBase } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';
import { Point } from './devicecontextbase.js';
import { FloatingCurvePositioner } from './floatingobject.js';
import { LogDebug } from './vrv.js';

export const ATT_CURVATURE = 117;
export const ATT_LINERENDBASE = 151;

export const curvature_CURVEDIR_NONE = 0;
export const curvature_CURVEDIR_above = 1;
export const curvature_CURVEDIR_below = 2;
export const curvature_CURVEDIR_mixed = 3;

function getParentChord(note: any): any | null {
  if (!note) return null;
  if (typeof note.IsChordTone === 'function') {
    const res = note.IsChordTone();
    if (res && typeof res === 'object') return res;
    if (res === true) return note.GetFirstAncestor?.(ClassId.CHORD) ?? null;
    return null;
  }
  return note.GetFirstAncestor?.(ClassId.CHORD) ?? null;
}

/** Pure-TypeScript translation of Verovio's `Tie` control element. */
export class Tie extends ControlElement {
  protected offsetSpanningInterface!: OffsetSpanningInterface;
  protected timeSpanningInterface!: TimeSpanningInterface;
  protected curvature!: InstCurvature;
  protected lineRendBase!: InstLineRendBase;

  public constructor(classId: ClassId = ClassId.TIE) {
    super(classId);
    this.offsetSpanningInterface = new OffsetSpanningInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.curvature = new InstCurvature();
    this.lineRendBase = new InstLineRendBase();

    this.RegisterInterface(
      this.offsetSpanningInterface.GetAttClasses(),
      this.offsetSpanningInterface.IsInterface()
    );
    this.RegisterInterface(
      this.timeSpanningInterface.GetAttClasses(),
      this.timeSpanningInterface.IsInterface()
    );
    this.RegisterAttClass(ATT_CURVATURE);
    this.RegisterAttClass(ATT_LINERENDBASE);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetSpanningInterface ??= new OffsetSpanningInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.curvature ??= new InstCurvature();
    this.lineRendBase ??= new InstLineRendBase();

    this.offsetSpanningInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.curvature.ResetCurvature();
    this.lineRendBase.ResetLineRendBase();
  }

  public override GetClassName(): string {
    return 'tie';
  }

  public override GetOffsetSpanningInterface(): OffsetSpanningInterface {
    return this.offsetSpanningInterface;
  }

  public override GetTimePointInterface(): TimeSpanningInterface {
    return this.timeSpanningInterface;
  }

  public override GetTimeSpanningInterface(): TimeSpanningInterface {
    return this.timeSpanningInterface;
  }

  // Forwarding for AttCurvature.
  public SetCurvedir(value: number): void { this.curvature.SetCurvedir(value); }
  public GetCurvedir(): number { return this.curvature.GetCurvedir(); }
  public HasCurvedir(): boolean { return this.curvature.HasCurvedir(); }
  public SetBezier(value: any): void { this.curvature.SetBezier(value); }
  public GetBezier(): any { return this.curvature.GetBezier(); }
  public HasBezier(): boolean { return this.curvature.HasBezier(); }
  public SetBulge(value: any): void { this.curvature.SetBulge(value); }
  public GetBulge(): any { return this.curvature.GetBulge(); }
  public HasBulge(): boolean { return this.curvature.HasBulge(); }
  public ResetCurvature(): void { this.curvature.ResetCurvature(); }

  // Forwarding for AttLineRendBase.
  public SetLform(value: any): void { this.lineRendBase.SetLform(value); }
  public GetLform(): any { return this.lineRendBase.GetLform(); }
  public HasLform(): boolean { return this.lineRendBase.HasLform(); }
  public SetLwidth(value: any): void { this.lineRendBase.SetLwidth(value); }
  public GetLwidth(): any { return this.lineRendBase.GetLwidth(); }
  public HasLwidth(): boolean { return this.lineRendBase.HasLwidth(); }
  public SetLsegs(value: any): void { this.lineRendBase.SetLsegs(value); }
  public GetLsegs(): any { return this.lineRendBase.GetLsegs(); }
  public HasLsegs(): boolean { return this.lineRendBase.HasLsegs(); }
  public ResetLineRendBase(): void { this.lineRendBase.ResetLineRendBase(); }

  // Forwarding for OffsetSpanningInterface.
  public SetEndho(value: any): void { this.offsetSpanningInterface.SetEndho(value); }
  public GetEndho(): any { return this.offsetSpanningInterface.GetEndho(); }
  public HasEndho(): boolean { return this.offsetSpanningInterface.HasEndho(); }
  public SetEndvo(value: any): void { this.offsetSpanningInterface.SetEndvo(value); }
  public GetEndvo(): any { return this.offsetSpanningInterface.GetEndvo(); }
  public HasEndvo(): boolean { return this.offsetSpanningInterface.HasEndvo(); }
  public SetStartho(value: any): void { this.offsetSpanningInterface.SetStartho(value); }
  public GetStartho(): any { return this.offsetSpanningInterface.GetStartho(); }
  public HasStartho(): boolean { return this.offsetSpanningInterface.HasStartho(); }
  public SetStartvo(value: any): void { this.offsetSpanningInterface.SetStartvo(value); }
  public GetStartvo(): any { return this.offsetSpanningInterface.GetStartvo(); }
  public HasStartvo(): boolean { return this.offsetSpanningInterface.HasStartvo(); }

  // Forwarding for TimeSpanningInterface.
  public SetStartid(value: string): void { this.timeSpanningInterface.SetStartid(value); }
  public GetStartid(): string { return this.timeSpanningInterface.GetStartid(); }
  public HasStartid(): boolean { return this.timeSpanningInterface.HasStartid(); }
  public SetEndid(value: string): void { this.timeSpanningInterface.SetEndid(value); }
  public GetEndid(): string { return this.timeSpanningInterface.GetEndid(); }
  public HasEndid(): boolean { return this.timeSpanningInterface.HasEndid(); }
  public SetTstamp(value: any): void { this.timeSpanningInterface.SetTstamp(value); }
  public GetTstamp(): any { return this.timeSpanningInterface.GetTstamp(); }
  public HasTstamp(): boolean { return this.timeSpanningInterface.HasTstamp(); }
  public SetTstamp2(value: any): void { this.timeSpanningInterface.SetTstamp2(value); }
  public GetTstamp2(): any { return this.timeSpanningInterface.GetTstamp2(); }
  public HasTstamp2(): boolean { return this.timeSpanningInterface.HasTstamp2(); }
  public SetStaff(value: any): void { this.timeSpanningInterface.SetStaff(value); }
  public GetStaff(): any { return this.timeSpanningInterface.GetStaff(); }
  public HasStaff(): boolean { return this.timeSpanningInterface.HasStaff(); }
  public SetPart(value: any): void { this.timeSpanningInterface.SetPart(value); }
  public GetPart(): any { return this.timeSpanningInterface.GetPart(); }
  public HasPart(): boolean { return this.timeSpanningInterface.HasPart(); }

  public GetStart(): any {
    return this.timeSpanningInterface.GetStart();
  }

  public GetEnd(): any {
    return this.timeSpanningInterface.GetEnd();
  }

  public SetStart(start: any): void {
    this.timeSpanningInterface.SetStart(start);
  }

  public SetEnd(end: any): void {
    this.timeSpanningInterface.SetEnd(end);
  }

  public IsSpanningMeasures(): boolean {
    return this.timeSpanningInterface.IsSpanningMeasures();
  }

  public GetStartMeasure(): any {
    return this.timeSpanningInterface.GetStartMeasure();
  }

  public GetEndMeasure(): any {
    return this.timeSpanningInterface.GetEndMeasure();
  }

  public CalculatePosition(
    doc: any,
    staff: any,
    x1: number,
    x2: number,
    spanningType: number,
    bezier: Point[]
  ): boolean {
    if (!doc || !staff) return false;

    const drawingUnit = doc.GetDrawingUnit(staff.m_drawingStaffSize ?? 100);

    if (
      spanningType !== SpanningType.SPANNING_START_END &&
      spanningType !== SpanningType.SPANNING_START &&
      spanningType !== SpanningType.SPANNING_END
    ) {
      LogDebug('Tie across an entire system is not supported');
      return false;
    }

    const startObj = this.GetStart();
    const endObj = this.GetEnd();
    const note1 = startObj?.Is?.(ClassId.NOTE) ? startObj : null;
    const note2 = endObj?.Is?.(ClassId.NOTE) ? endObj : null;

    if (!note1 && !note2) {
      return false;
    }

    let isOuterChordNote = false;
    let durElement: any = null;
    let startParentChord: any = null;
    let endParentChord: any = null;
    let layer1: any = null;

    if (note1) {
      durElement = note1;
      layer1 = (note1 as any).m_crossStaff ? (note1 as any).m_crossLayer : note1.GetFirstAncestor?.(ClassId.LAYER);
      startParentChord = getParentChord(note1);
    }
    if (startParentChord) {
      durElement = startParentChord;
      if (startParentChord.m_crossStaff) layer1 = startParentChord.m_crossLayer;
    }
    if (note2) {
      endParentChord = getParentChord(note2);
    }

    const staffY = typeof staff.GetDrawingY === 'function' ? staff.GetDrawingY() : 0;
    const startPoint = new Point(x1, staffY);
    const endPoint = new Point(x2, staffY);

    let noteStemDir = STEMDIRECTION_NONE;
    switch (spanningType) {
      case SpanningType.SPANNING_START_END:
      case SpanningType.SPANNING_START:
      case SpanningType.SPANNING_END: {
        if (note1) noteStemDir = (note1 as any).GetDrawingStemDir?.() ?? STEMDIRECTION_NONE;
        else if (note2) noteStemDir = (note2 as any).GetDrawingStemDir?.() ?? STEMDIRECTION_NONE;
        break;
      }
      default:
        break;
    }

    const isAboveStaffCenter = startPoint.y > staffY - 4 * drawingUnit;
    const drawingCurveDir = this.GetPreferredCurveDirection(
      layer1,
      note1,
      startParentChord,
      noteStemDir,
      isAboveStaffCenter
    );

    if (startParentChord) {
      if (
        (drawingCurveDir === curvature_CURVEDIR_above && note1 === startParentChord.GetTopNote?.()) ||
        (drawingCurveDir === curvature_CURVEDIR_below && note1 === startParentChord.GetBottomNote?.())
      ) {
        isOuterChordNote = true;
      }
    }

    const adjustVertically = this.CalculateXPosition(
      doc,
      staff,
      startParentChord,
      endParentChord,
      spanningType,
      isOuterChordNote,
      startPoint,
      endPoint,
      drawingCurveDir
    );

    const isGraceToNoteTie = Boolean(
      note1 && note2 && (note1 as any).IsGraceNote?.() && !(note2 as any).IsGraceNote?.()
    );
    const ySign = drawingCurveDir === curvature_CURVEDIR_above ? 1 : -1;

    startPoint.y += Math.trunc((ySign * drawingUnit) / 2);
    endPoint.y += Math.trunc((ySign * drawingUnit) / 2);
    if (adjustVertically && !isGraceToNoteTie) {
      startPoint.y += ySign * drawingUnit;
      endPoint.y += ySign * drawingUnit;
    }

    const staffLineWidth = doc.GetOptions?.().m_staffLineWidth?.GetValue?.() ?? 1.0;
    const height = Math.trunc((1.6 - staffLineWidth) * drawingUnit);
    const distance = endPoint.x - startPoint.x;

    const c1 = new Point(
      startPoint.x + Math.trunc(distance / 4),
      startPoint.y + ySign * height
    );
    const c2 = new Point(
      startPoint.x + Math.trunc(distance / 4) * 3,
      endPoint.y + ySign * height
    );

    bezier[0] = startPoint;
    bezier[1] = c1;
    bezier[2] = c2;
    bezier[3] = endPoint;

    const positioner = this.GetCurrentFloatingPositioner();
    if (positioner && positioner.Is(ClassId.FLOATING_CURVE_POSITIONER)) {
      const curve = positioner as FloatingCurvePositioner;
      const midpointThickness = doc.GetOptions?.().m_tieMidpointThickness?.GetValue?.() ?? 1.0;
      const thickness = Math.trunc(drawingUnit * midpointThickness);

      curve.UpdateCurveParams(bezier, thickness, drawingCurveDir);

      if ((!startParentChord || isOuterChordNote) && durElement && spanningType !== SpanningType.SPANNING_END) {
        this.UpdateTiePositioning(curve, bezier, durElement, note1, drawingUnit, drawingCurveDir);
        curve.UpdateCurveParams(bezier, thickness, drawingCurveDir);
      }
      if (!startParentChord && !endParentChord && note1 && note2 && spanningType === SpanningType.SPANNING_START_END) {
        if (this.AdjustEnharmonicTies(doc, curve, bezier, note1, note2, drawingCurveDir)) {
          curve.UpdateCurveParams(bezier, thickness, drawingCurveDir);
        }
      }
    }

    return true;
  }

  public CalculateAdjacentChordXOffset(
    doc: any,
    staff: any,
    parentChord: any,
    note: any,
    drawingCurveDir: number,
    initialX: number,
    isStartPoint: boolean
  ): number {
    if (!parentChord) return initialX;
    const drawingUnit = doc.GetDrawingUnit(staff?.m_drawingStaffSize ?? 100);
    const radius = note?.GetDrawingRadius?.(doc) ?? drawingUnit;

    if (isStartPoint) {
      const defaultX = initialX + radius + Math.trunc(drawingUnit / 2);
      if (parentChord.GetDrawingStemDir?.() === STEMDIRECTION_down) {
        if (drawingCurveDir === curvature_CURVEDIR_below && note === parentChord.GetBottomNote?.()) {
          return defaultX;
        }
        const stem = parentChord.GetDrawingStem?.();
        if (stem && !stem.IsVirtual?.()) {
          return stem.GetContentRight() + 2 * radius + Math.trunc(drawingUnit / 2);
        } else {
          return parentChord.GetContentRight() + Math.trunc(drawingUnit / 2);
        }
      } else {
        if (!note) return defaultX;
        const adjacentNotes: any[] = parentChord.GetAdjacentNotesList?.(staff, note.GetDrawingLoc?.()) ?? [];
        for (const adjacentNote of adjacentNotes) {
          if (adjacentNote.GetDrawingX() > note.GetDrawingX()) {
            if (
              drawingCurveDir === curvature_CURVEDIR_above &&
              note.GetDrawingLoc?.() < adjacentNote.GetDrawingLoc?.()
            ) {
              return parentChord.GetContentRight() + Math.trunc(drawingUnit / 2);
            } else if (
              drawingCurveDir === curvature_CURVEDIR_below &&
              note.GetDrawingLoc?.() > adjacentNote.GetDrawingLoc?.()
            ) {
              return parentChord.GetContentRight() + Math.trunc(drawingUnit / 2);
            }
          }
        }
        return defaultX;
      }
    } else {
      const defaultX = initialX - (radius + Math.trunc(drawingUnit / 2));
      if (parentChord.GetDrawingStemDir?.() === STEMDIRECTION_up) {
        if (drawingCurveDir === curvature_CURVEDIR_above && note === parentChord.GetTopNote?.()) {
          return defaultX;
        }
        const stem = parentChord.GetDrawingStem?.();
        if (stem && !stem.IsVirtual?.()) {
          return stem.GetContentLeft() - 2 * radius - Math.trunc(drawingUnit / 2);
        } else {
          return parentChord.GetContentLeft() - Math.trunc(drawingUnit / 2);
        }
      } else {
        if (!note) return defaultX;
        const adjacentNotes: any[] = parentChord.GetAdjacentNotesList?.(staff, note.GetDrawingLoc?.()) ?? [];
        for (const adjacentNote of adjacentNotes) {
          if (adjacentNote.GetDrawingX() < note.GetDrawingX()) {
            if (
              drawingCurveDir === curvature_CURVEDIR_above &&
              note.GetDrawingLoc?.() < adjacentNote.GetDrawingLoc?.()
            ) {
              return parentChord.GetContentLeft() - Math.trunc(drawingUnit / 2);
            } else if (
              drawingCurveDir === curvature_CURVEDIR_below &&
              note.GetDrawingLoc?.() > adjacentNote.GetDrawingLoc?.()
            ) {
              return parentChord.GetContentLeft() - Math.trunc(drawingUnit / 2);
            }
          }
        }
        return defaultX;
      }
    }
  }

  private CalculateXPosition(
    doc: any,
    staff: any,
    startParentChord: any,
    endParentChord: any,
    spanningType: number,
    isOuterChordNote: boolean,
    startPoint: Point,
    endPoint: Point,
    drawingCurveDir: number
  ): boolean {
    const startObj = this.GetStart();
    const endObj = this.GetEnd();
    const startNote = startObj?.Is?.(ClassId.NOTE) ? startObj : null;
    const endNote = endObj?.Is?.(ClassId.NOTE) ? endObj : null;

    const r1 = (startNote as any)?.GetDrawingRadius?.(doc) ?? 0;
    const r2 = (endNote as any)?.GetDrawingRadius?.(doc) ?? 0;

    const drawingUnit = doc.GetDrawingUnit(staff?.m_drawingStaffSize ?? 100);
    const minTieLength = doc.GetOptions?.().m_tieMinLength?.GetValue?.() ?? 2.0;
    const isShortTie = endPoint.x - startPoint.x < (1 + minTieLength) * drawingUnit + r1 + r2;
    const adjustVertically = !startParentChord && !endParentChord && isShortTie;

    if (spanningType === SpanningType.SPANNING_START_END) {
      if (startNote) {
        startPoint.y = startNote.GetDrawingY();
        endPoint.y = startPoint.y;
      } else if (endNote) {
        endPoint.y = endNote.GetDrawingY();
        startPoint.y = endPoint.y;
      }

      if (!adjustVertically) {
        if (startParentChord && startParentChord.HasAdjacentNotesInStaff?.(staff)) {
          startPoint.x = this.CalculateAdjacentChordXOffset(
            doc,
            staff,
            startParentChord,
            startNote,
            drawingCurveDir,
            startPoint.x,
            true
          );
        } else {
          startPoint.x += r1 + Math.trunc(drawingUnit / 2);
        }

        let endStaff = staff;
        if (endParentChord) endStaff = endParentChord.GetAncestorStaff?.() ?? staff;
        if (endParentChord && endParentChord.HasAdjacentNotesInStaff?.(endStaff)) {
          endPoint.x = this.CalculateAdjacentChordXOffset(
            doc,
            endStaff,
            endParentChord,
            endNote,
            drawingCurveDir,
            endPoint.x,
            false
          );
        } else {
          endPoint.x -= r2 + Math.trunc(drawingUnit / 2);
        }
      } else {
        if (startNote?.FindDescendantByType?.(ClassId.ARTIC)) {
          startPoint.x += r1;
        }
        if (endNote?.FindDescendantByType?.(ClassId.ARTIC)) {
          endPoint.x -= r2;
        }
      }

      if (startParentChord && !isOuterChordNote && (startParentChord.GetDots?.() ?? 0) > 0) {
        if (isShortTie) {
          startPoint.x += drawingUnit;
        } else {
          const dots = startParentChord.FindDescendantByType?.(ClassId.DOTS);
          if (dots) {
            startPoint.x = dots.GetDrawingX() + (1 + startParentChord.GetDots()) * drawingUnit;
          }
        }
      }
    } else if (spanningType === SpanningType.SPANNING_START) {
      if (startNote) {
        startPoint.y = startNote.GetDrawingY();
        endPoint.y = startPoint.y;
      }

      if (!adjustVertically) {
        if (startParentChord && startParentChord.HasAdjacentNotesInStaff?.(staff)) {
          startPoint.x = this.CalculateAdjacentChordXOffset(
            doc,
            staff,
            startParentChord,
            startNote,
            drawingCurveDir,
            startPoint.x,
            true
          );
        } else {
          startPoint.x += r1 + Math.trunc(drawingUnit / 2);
        }

        if (startNote && ((startNote as any).GetDots?.() ?? 0) > 0) {
          startPoint.x += Math.trunc((drawingUnit * (startNote as any).GetDots() * 3) / 2);
        } else if (startParentChord && (startParentChord.GetDots?.() ?? 0) > 0) {
          startPoint.x += 2 * drawingUnit * startParentChord.GetDots();
        }
      } else {
        if (startNote?.FindDescendantByType?.(ClassId.ARTIC)) {
          startPoint.x += r1;
        }
      }

      if (startParentChord && !isOuterChordNote && (startParentChord.GetDots?.() ?? 0) > 0) {
        const dots = startParentChord.FindDescendantByType?.(ClassId.DOTS);
        if (dots) {
          startPoint.x = dots.GetDrawingX() + (1 + startParentChord.GetDots()) * drawingUnit;
        }
      }

      endPoint.x -= Math.trunc((drawingUnit + doc.GetDrawingBarLineWidth(staff?.m_drawingStaffSize ?? 100)) / 2);
    } else if (spanningType === SpanningType.SPANNING_END) {
      if (endNote) {
        endPoint.y = endNote.GetDrawingY();
        startPoint.y = endPoint.y;
      }

      if (!adjustVertically) {
        let endStaff = staff;
        if (endParentChord) endStaff = endParentChord.GetAncestorStaff?.() ?? staff;
        if (endParentChord && endParentChord.HasAdjacentNotesInStaff?.(endStaff)) {
          endPoint.x = this.CalculateAdjacentChordXOffset(
            doc,
            endStaff,
            endParentChord,
            endNote,
            drawingCurveDir,
            endPoint.x,
            false
          );
        } else {
          endPoint.x -= r2 + Math.trunc(drawingUnit / 2);
        }
      } else {
        if (endNote?.FindDescendantByType?.(ClassId.ARTIC)) {
          endPoint.x -= r2;
        }
      }
    }

    return adjustVertically;
  }

  private GetPreferredCurveDirection(
    layer: any,
    note: any,
    startParentChord: any,
    noteStemDir: number,
    isAboveStaffCenter: boolean
  ): number {
    let drawingCurveDir = curvature_CURVEDIR_above;

    if (this.HasCurvedir()) {
      drawingCurveDir =
        this.GetCurvedir() === curvature_CURVEDIR_above
          ? curvature_CURVEDIR_above
          : curvature_CURVEDIR_below;
    } else if (layer && layer.GetDrawingStemDir?.(note) !== STEMDIRECTION_NONE) {
      const layerStemDir = layer.GetDrawingStemDir(note);
      drawingCurveDir =
        layerStemDir === STEMDIRECTION_up
          ? curvature_CURVEDIR_above
          : curvature_CURVEDIR_below;
    } else if (startParentChord) {
      const pos = startParentChord.PositionInChord?.(note) ?? 0;
      if (pos < 0) {
        drawingCurveDir = curvature_CURVEDIR_below;
      } else if (pos > 0) {
        drawingCurveDir = curvature_CURVEDIR_above;
      } else {
        drawingCurveDir =
          noteStemDir !== STEMDIRECTION_up
            ? curvature_CURVEDIR_above
            : curvature_CURVEDIR_below;
      }
    } else if (noteStemDir === STEMDIRECTION_up) {
      drawingCurveDir = curvature_CURVEDIR_below;
    } else if (noteStemDir === STEMDIRECTION_NONE) {
      drawingCurveDir = isAboveStaffCenter
        ? curvature_CURVEDIR_above
        : curvature_CURVEDIR_below;
    }

    return drawingCurveDir;
  }

  private AdjustEnharmonicTies(
    doc: any,
    curve: FloatingCurvePositioner,
    bezier: Point[],
    startNote: any,
    endNote: any,
    drawingCurveDir: number
  ): boolean {
    const objects = endNote?.FindAllDescendantsByType?.(ClassId.ACCID) ?? [];
    if (!objects.length) return false;

    let overlap = 0;
    const discard = { value: false };
    for (const object of objects) {
      overlap = curve.CalcAdjustment(object, discard);
    }
    if (!overlap) return false;

    overlap *= drawingCurveDir === curvature_CURVEDIR_below ? -1 : 1;

    const drawingRadius = startNote.GetDrawingRadius?.(doc) ?? 0;
    const drawingUnit = doc.GetDrawingUnit(100);

    if (
      startNote.GetDrawingStemDir?.() === STEMDIRECTION_up &&
      drawingCurveDir === curvature_CURVEDIR_above
    ) {
      bezier[0].x = startNote.GetDrawingX() + 2 * drawingRadius + Math.trunc(drawingUnit / 2);
    } else {
      bezier[0].x = startNote.GetDrawingX() + drawingRadius;
    }

    if (
      startNote.GetDrawingStemDir?.() === STEMDIRECTION_down &&
      drawingCurveDir === curvature_CURVEDIR_below
    ) {
      bezier[3].x = endNote.GetDrawingX() - Math.trunc(drawingUnit / 2);
    } else {
      bezier[3].x = endNote.GetDrawingX() + drawingRadius;
    }

    const endpointShift = Math.trunc(overlap * 0.6);
    const startLoc = startNote.GetDrawingLoc?.() ?? 0;
    const endLoc = endNote.GetDrawingLoc?.() ?? 0;

    if (drawingCurveDir === curvature_CURVEDIR_below) {
      if (startLoc < endLoc) {
        bezier[0].y += endpointShift;
        bezier[3].y = bezier[0].y;
      } else if (startLoc > endLoc) {
        bezier[3].y += endpointShift;
        bezier[0].y = bezier[3].y;
      }
    } else if (drawingCurveDir === curvature_CURVEDIR_above) {
      if (startLoc > endLoc) {
        bezier[0].y += endpointShift;
        bezier[3].y = bezier[0].y;
      } else if (startLoc < endLoc) {
        bezier[3].y += endpointShift;
        bezier[0].y = bezier[3].y;
      }
    }

    const length = bezier[3].x - bezier[0].x;
    bezier[1].x = Math.trunc(bezier[0].x + 0.25 * length);
    bezier[1].y = Math.trunc(bezier[1].y + 1.2 * overlap);
    bezier[2].x = Math.trunc(bezier[0].x + 0.75 * length);
    bezier[2].y = Math.trunc(bezier[2].y + 1.2 * overlap);

    return true;
  }

  private UpdateTiePositioning(
    curve: FloatingCurvePositioner,
    bezier: Point[],
    durElement: any,
    startNote: any,
    drawingUnit: number,
    drawingCurveDir: number
  ): void {
    if (!durElement) return;

    const objects: any[] = [];
    for (const obj of durElement.FindAllDescendantsByType?.(ClassId.DOT) ?? []) objects.push(obj);
    for (const obj of durElement.FindAllDescendantsByType?.(ClassId.DOTS) ?? []) objects.push(obj);
    for (const obj of durElement.FindAllDescendantsByType?.(ClassId.FLAG) ?? []) objects.push(obj);

    let adjust = 0;
    let dotsPosition = 0;

    for (const object of objects) {
      if (!object.HasSelfBB?.()) continue;

      if (object.Is?.(ClassId.DOTS)) {
        const discard = { value: false };
        let margin = 25;
        let oppositeOverlap = 0;
        const durDots = durElement.GetDots?.() ?? 0;
        dotsPosition = object.GetDrawingX() + (1 + durDots) * drawingUnit;

        if (durElement.Is?.(ClassId.CHORD)) {
          const parentChord = durElement;
          const dotsCount = parentChord.GetDots?.() || 1;
          const offset = Math.trunc((object.GetSelfRight() - object.GetSelfLeft()) / dotsCount);

          if (drawingCurveDir === curvature_CURVEDIR_above && startNote !== parentChord.GetTopNote?.()) {
            margin = object.GetSelfBottom() - object.GetSelfTop() + offset;
          } else if (drawingCurveDir === curvature_CURVEDIR_below && startNote !== parentChord.GetBottomNote?.()) {
            margin = object.GetSelfBottom() - object.GetSelfTop() - offset;
          }

          const overlap = curve.CalcAdjustment(object, discard);
          if (overlap > 0 && overlap < 1.5 * offset) {
            oppositeOverlap = overlap;
          }
        }

        const step = Math.trunc(drawingUnit / 2) || 1;
        let intersection = curve.CalcAdjustment(object, discard, margin, false);
        if (intersection) {
          intersection = Math.trunc((Math.trunc(intersection / step) + 1) * step + 0.5 * step);
          intersection *= drawingCurveDir === curvature_CURVEDIR_below ? -1 : 1;
        } else if (oppositeOverlap) {
          intersection = Math.trunc(Math.trunc(oppositeOverlap / step) * step * 0.5);
        } else {
          continue;
        }

        if (Math.abs(intersection) > Math.abs(adjust)) adjust = intersection;
      } else if (object.Is?.(ClassId.FLAG)) {
        const discard = { value: false };
        const intersection = curve.CalcAdjustment(object, discard);
        if (intersection !== 0) {
          if (!dotsPosition) {
            bezier[0].x += drawingUnit;
          } else {
            bezier[0].x = dotsPosition;
          }
          const controlPointDist = Math.trunc((bezier[3].x - bezier[0].x) / 4);
          bezier[1].x = bezier[0].x + controlPointDist;
          bezier[2].x = bezier[3].x - controlPointDist;
        }
      }
    }

    if (adjust) {
      for (let i = 0; i < 4; ++i) {
        bezier[i].y += adjust;
      }
    }
  }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTie');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTie');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTieEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitTieEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitControlElement === 'function') return functor.VisitControlElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Tie {
    const clone = new Tie(this.GetClassId());
    clone.AssignFrom(this);

    if (this.HasCurvedir()) clone.SetCurvedir(this.GetCurvedir());
    if (this.HasBezier()) clone.SetBezier(this.GetBezier());
    if (this.HasBulge()) clone.SetBulge(this.GetBulge());
    if (this.HasLform()) clone.SetLform(this.GetLform());
    if (this.HasLwidth()) clone.SetLwidth(this.GetLwidth());
    if (this.HasLsegs()) clone.SetLsegs(this.GetLsegs());

    if (this.HasEndho()) clone.SetEndho(this.GetEndho());
    if (this.HasEndvo()) clone.SetEndvo(this.GetEndvo());
    if (this.HasStartho()) clone.SetStartho(this.GetStartho());
    if (this.HasStartvo()) clone.SetStartvo(this.GetStartvo());

    if (this.HasStartid()) clone.SetStartid(this.GetStartid());
    if (this.HasEndid()) clone.SetEndid(this.GetEndid());
    if (this.HasTstamp()) clone.SetTstamp(this.GetTstamp());
    if (this.HasTstamp2()) clone.SetTstamp2(this.GetTstamp2());
    if (this.HasStaff()) clone.SetStaff(this.GetStaff());
    if (this.HasPart()) clone.SetPart(this.GetPart());

    return clone;
  }
}

ObjectFactory.GetInstance().Register('tie', ClassId.TIE, () => new Tie());
