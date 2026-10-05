/**
 * Pure TypeScript translation of Verovio's `src/slur.cpp` / `include/vrv/slur.h`.
 *
 * `Slur` models the MEI `<slur>` element.
 *
 * C++ multiple inheritance (ControlElement + OffsetSpanningInterface + TimeSpanningInterface +
 * AttCurvature + AttLayerIdent + AttLineRendBase) is represented through explicit composition
 * with forwarding surfaces.
 */
import {
  ClassId,
  FunctorCode,
  SpanningType,
  STAFFREL_above,
  STAFFREL_below,
} from './vrvdef.js';
import {
  STEMDIRECTION_NONE,
  STEMDIRECTION_up,
  STEMDIRECTION_down,
} from './drawinginterface.js';
import { ControlElement } from './controlelement.js';
import { OffsetSpanningInterface } from './offsetinterface.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { InstCurvature, InstLayerIdent, InstLineRendBase } from './atts_shared.js';
import { ObjectFactory, VrvObject } from './object.js';
import { Point, BezierCurve } from './devicecontextbase.js';
import { BoundingBox } from './boundingbox.js';
import { FloatingCurvePositioner, FloatingPositioner, CurveSpannedElement } from './floatingobject.js';
import { ConstFunctor } from './functor.js';

export const ATT_CURVATURE = 117;
export const ATT_LAYERIDENT = 148;
export const ATT_LINERENDBASE = 151;

export const curvature_CURVEDIR_NONE = 0;
export const curvature_CURVEDIR_above = 1;
export const curvature_CURVEDIR_below = 2;
export const curvature_CURVEDIR_mixed = 3;

export const ARTICULATION_stacc = 5;
export const ARTICULATION_stacciss = 7;

export enum SlurCurveDirection {
  None = 0,
  Above = 1,
  Below = 2,
  AboveBelow = 3,
  BelowAbove = 4,
}

export enum PortatoSlurType {
  None = 0,
  StemSide = 1,
  Centered = 2,
}

export interface NearEndCollision {
  metricAtStart: number;
  metricAtEnd: number;
  endPointsAdjusted: boolean;
}

export interface SpannedElements {
  elements: any[];
  layersN: Set<number>;
}

/** Helper functor to find spanned layer elements. */
export class FindSpannedLayerElementsFunctor extends ConstFunctor {
  private m_interface: any;
  private m_minPos: number = 0;
  private m_maxPos: number = 0;
  private m_minLayerN: number = 0;
  private m_maxLayerN: number = 0;
  private m_staffNs: Set<number> = new Set();
  private m_classIds: number[] = [];
  private m_elements: any[] = [];

  public constructor(timeSpanningInterface: any) {
    super();
    this.m_interface = timeSpanningInterface;
  }

  public override ImplementsEndInterface(): boolean {
    return false;
  }

  public SetMinMaxPos(minPos: number, maxPos: number): void {
    this.m_minPos = minPos;
    this.m_maxPos = maxPos;
  }

  public SetMinMaxLayerN(minLayerN: number, maxLayerN: number): void {
    this.m_minLayerN = minLayerN;
    this.m_maxLayerN = maxLayerN;
  }

  public SetStaffNs(staffNs: Set<number>): void {
    this.m_staffNs = staffNs;
  }

  public SetClassIds(classIds: number[]): void {
    this.m_classIds = classIds;
  }

  public ClearElements(): void {
    this.m_elements = [];
  }

  public GetElements(): any[] {
    return this.m_elements;
  }

  public VisitLayerElement(layerElement: any): FunctorCode {
    if (layerElement.IsScoreDefElement?.()) return FunctorCode.FUNCTOR_SIBLINGS;

    if (!layerElement.IsAnyOf?.(this.m_classIds)) {
      return FunctorCode.FUNCTOR_CONTINUE;
    }

    if (
      layerElement.HasContentBB?.() &&
      !layerElement.HasEmptyBB?.() &&
      layerElement.GetContentRight() > this.m_minPos &&
      layerElement.GetContentLeft() < this.m_maxPos
    ) {
      const start = this.m_interface?.GetStart?.();
      const end = this.m_interface?.GetEnd?.();
      if (layerElement === start || layerElement === end) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }

      if (this.m_staffNs.size > 0) {
        let staff = layerElement.GetAncestorStaff?.();
        if (!staff || !this.m_staffNs.has(staff.GetN?.())) {
          staff = layerElement.GetCrossStaff?.({ value: null });
          if (!staff || !this.m_staffNs.has(staff.GetN?.())) {
            return FunctorCode.FUNCTOR_CONTINUE;
          }
        }
      }

      const layerN = layerElement.GetOriginalLayerN?.() ?? 0;
      if (this.m_minLayerN && this.m_minLayerN > layerN) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }
      if (this.m_maxLayerN && this.m_maxLayerN < layerN) {
        return FunctorCode.FUNCTOR_CONTINUE;
      }

      if (
        start &&
        !start.Is?.(ClassId.TIMESTAMP_ATTR) &&
        layerElement.GetAlignment?.() === start.GetAlignment?.()
      ) {
        const staff = layerElement.GetAncestorStaff?.(1); // RESOLVE_CROSS_STAFF
        const startStaff = start.GetAncestorStaff?.(1);
        if (staff && startStaff && staff.GetN?.() !== startStaff.GetN?.()) {
          return FunctorCode.FUNCTOR_CONTINUE;
        }
      }

      if (
        end &&
        !end.Is?.(ClassId.TIMESTAMP_ATTR) &&
        layerElement.GetAlignment?.() === end.GetAlignment?.()
      ) {
        const staff = layerElement.GetAncestorStaff?.(1); // RESOLVE_CROSS_STAFF
        const endStaff = end.GetAncestorStaff?.(1);
        if (staff && endStaff && staff.GetN?.() !== endStaff.GetN?.()) {
          return FunctorCode.FUNCTOR_CONTINUE;
        }
      }

      this.m_elements.push(layerElement);
    }

    return FunctorCode.FUNCTOR_CONTINUE;
  }

  public VisitMeasure(measure: any): FunctorCode {
    const startMeasure = this.m_interface?.GetStartMeasure?.();
    if (startMeasure && VrvObject.IsPreOrdered(measure, startMeasure)) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    const endMeasure = this.m_interface?.GetEndMeasure?.();
    if (endMeasure && VrvObject.IsPreOrdered(endMeasure, measure)) {
      return FunctorCode.FUNCTOR_SIBLINGS;
    }
    return FunctorCode.FUNCTOR_CONTINUE;
  }
}

/** Pure-TypeScript translation of Verovio's `Slur` control element. */
export class Slur extends ControlElement {
  protected offsetSpanningInterface!: OffsetSpanningInterface;
  protected timeSpanningInterface!: TimeSpanningInterface;
  protected curvature!: InstCurvature;
  protected layerIdent!: InstLayerIdent;
  protected lineRendBase!: InstLineRendBase;

  private m_drawingCurveDir: SlurCurveDirection = SlurCurveDirection.None;

  public constructor(classId: ClassId = ClassId.SLUR) {
    super(classId);
    this.offsetSpanningInterface = new OffsetSpanningInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.curvature = new InstCurvature();
    this.layerIdent = new InstLayerIdent();
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
    this.RegisterAttClass(ATT_LAYERIDENT);
    this.RegisterAttClass(ATT_LINERENDBASE);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetSpanningInterface ??= new OffsetSpanningInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.curvature ??= new InstCurvature();
    this.layerIdent ??= new InstLayerIdent();
    this.lineRendBase ??= new InstLineRendBase();

    this.offsetSpanningInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.curvature.ResetCurvature();
    this.layerIdent.ResetLayerIdent();
    this.lineRendBase.ResetLineRendBase();

    this.m_drawingCurveDir = SlurCurveDirection.None;
  }

  public override GetClassName(): string {
    return 'slur';
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

  // Forwarding for AttLayerIdent.
  public SetLayer(value: any): void { this.layerIdent.SetLayer(value); }
  public GetLayer(): any { return this.layerIdent.GetLayer(); }
  public HasLayer(): boolean { return this.layerIdent.HasLayer(); }
  public ResetLayerIdent(): void { this.layerIdent.ResetLayerIdent(); }

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

  public IsOrdered(start?: any, end?: any): boolean {
    return this.timeSpanningInterface.IsOrdered(start, end);
  }

  public IsSpanningMeasures(): boolean {
    return this.timeSpanningInterface.IsSpanningMeasures();
  }

  public GetStartMeasure(): any {
    return this.timeSpanningInterface.GetStartMeasure();
  }

  public GetTstampStaves(measure: unknown, object: unknown): unknown[] {
    return this.timeSpanningInterface.GetTstampStaves(measure as never, object as never);
  }

  public GetEndMeasure(): any {
    return this.timeSpanningInterface.GetEndMeasure();
  }

  // Drawing curve direction methods.
  public GetDrawingCurveDir(): SlurCurveDirection {
    return this.m_drawingCurveDir;
  }

  public SetDrawingCurveDir(curveDir: SlurCurveDirection): void {
    this.m_drawingCurveDir = curveDir;
  }

  public HasDrawingCurveDir(): boolean {
    return this.m_drawingCurveDir !== SlurCurveDirection.None;
  }

  public CalcDrawingCurveDir(spanningType: number): number {
    switch (this.m_drawingCurveDir) {
      case SlurCurveDirection.Above:
        return curvature_CURVEDIR_above;
      case SlurCurveDirection.Below:
        return curvature_CURVEDIR_below;
      case SlurCurveDirection.AboveBelow: {
        switch (spanningType) {
          case SpanningType.SPANNING_START_END:
            return curvature_CURVEDIR_mixed;
          case SpanningType.SPANNING_START:
            return curvature_CURVEDIR_above;
          default:
            return curvature_CURVEDIR_below;
        }
      }
      case SlurCurveDirection.BelowAbove: {
        switch (spanningType) {
          case SpanningType.SPANNING_START_END:
            return curvature_CURVEDIR_mixed;
          case SpanningType.SPANNING_START:
            return curvature_CURVEDIR_below;
          default:
            return curvature_CURVEDIR_above;
        }
      }
      default:
        return curvature_CURVEDIR_NONE;
    }
  }

  public HasMixedCurveDir(): boolean {
    return (
      this.m_drawingCurveDir === SlurCurveDirection.AboveBelow ||
      this.m_drawingCurveDir === SlurCurveDirection.BelowAbove
    );
  }

  public HasEndpointAboveStart(): boolean {
    return (
      this.m_drawingCurveDir === SlurCurveDirection.Above ||
      this.m_drawingCurveDir === SlurCurveDirection.AboveBelow
    );
  }

  public HasEndpointBelowStart(): boolean {
    return (
      this.m_drawingCurveDir === SlurCurveDirection.Below ||
      this.m_drawingCurveDir === SlurCurveDirection.BelowAbove
    );
  }

  public HasEndpointAboveEnd(): boolean {
    return (
      this.m_drawingCurveDir === SlurCurveDirection.Above ||
      this.m_drawingCurveDir === SlurCurveDirection.BelowAbove
    );
  }

  public HasEndpointBelowEnd(): boolean {
    return (
      this.m_drawingCurveDir === SlurCurveDirection.Below ||
      this.m_drawingCurveDir === SlurCurveDirection.AboveBelow
    );
  }

  public HasInnerSlur(innerSlur: Slur): boolean {
    if (this.GetDrawingCurveDir() !== innerSlur.GetDrawingCurveDir()) return false;
    if (this.HasMixedCurveDir()) return false;

    const start = this.GetStart() as any;
    const end = this.GetEnd() as any;
    if (!start || !end) return false;
    const innerStart = innerSlur.GetStart() as any;
    const innerEnd = innerSlur.GetEnd() as any;
    if (!innerStart || !innerEnd) return false;

    const admissibleLayers = new Set([
      Math.abs(start.GetAlignmentLayerN?.() ?? 0),
      Math.abs(end.GetAlignmentLayerN?.() ?? 0),
    ]);
    const innerLayers = [
      Math.abs(innerStart.GetAlignmentLayerN?.() ?? 0),
      Math.abs(innerEnd.GetAlignmentLayerN?.() ?? 0),
    ];
    for (const layer of innerLayers) {
      if (!admissibleLayers.has(layer)) return false;
    }

    if (this.IsOrdered(innerStart, start) || this.IsOrdered(end, innerEnd)) return false;
    return this.IsOrdered(start, innerStart) || this.IsOrdered(innerEnd, end);
  }

  public GetBoundaryLayer(): [any | null, any | null] {
    const start = this.GetStart() as any;
    const end = this.GetEnd() as any;
    if (!start || !end) return [null, null];

    let layer: any = null;
    let layerElement: any = null;

    if (!start.Is?.(ClassId.TIMESTAMP_ATTR)) {
      layer = start.GetFirstAncestor?.(ClassId.LAYER);
      layerElement = start;
    }
    if (!end.Is?.(ClassId.TIMESTAMP_ATTR)) {
      if (!layerElement || layerElement.IsGraceNote?.()) {
        layer = end.GetFirstAncestor?.(ClassId.LAYER);
        layerElement = end;
      }
    }
    if (layerElement && layerElement.m_crossStaff) {
      layer = layerElement.m_crossLayer;
    }

    return [layer, layerElement];
  }

  public GetBoundaryCrossStaff(): any | null {
    const start = this.GetStart() as any;
    const end = this.GetEnd() as any;
    if (!start || !end) return null;

    if (start.m_crossStaff !== end.m_crossStaff) {
      return end.m_crossStaff;
    } else {
      const startStaff = start.GetAncestorStaff?.(0, false);
      const endStaff = end.GetAncestorStaff?.(0, false);
      if (startStaff && endStaff && startStaff.GetN?.() !== endStaff.GetN?.()) {
        return endStaff;
      }
      return null;
    }
  }

  public InitBezierControlSides(bezier: BezierCurve, curveDir: number): void {
    switch (curveDir) {
      case curvature_CURVEDIR_above:
        bezier.SetControlSides(true, true);
        break;
      case curvature_CURVEDIR_below:
        bezier.SetControlSides(false, false);
        break;
      case curvature_CURVEDIR_mixed:
        bezier.SetControlSides(this.HasEndpointAboveStart(), this.HasEndpointAboveEnd());
        break;
      default:
        break;
    }
  }

  public CalcSpannedElements(curve: FloatingCurvePositioner): void {
    const staff = curve.GetObjectY?.() as any;
    if (!staff) return;

    const points = curve.GetPoints();
    if (points.length < 4) return;
    const x1 = points[0].x;
    const x2 = points[3].x;

    const spannedElements = this.CollectSpannedElements(staff, x1, x2);
    this.AddSpannedElements(curve, spannedElements, staff, x1, x2);
  }

  private CollectSpannedElements(staff: any, xMin: number, xMax: number): SpannedElements {
    const container = this.IsSpanningMeasures()
      ? staff.GetFirstAncestor?.(ClassId.SYSTEM)
      : this.GetStartMeasure();

    const findSpanned = new FindSpannedLayerElementsFunctor(this);
    findSpanned.SetMinMaxPos(xMin, xMax);
    findSpanned.SetClassIds([
      ClassId.ACCID,
      ClassId.ARTIC,
      ClassId.CHORD,
      ClassId.CLEF,
      ClassId.DOT,
      ClassId.DOTS,
      ClassId.FLAG,
      ClassId.GLISS,
      ClassId.NOTE,
      ClassId.STEM,
      ClassId.TUPLET_BRACKET,
      ClassId.TUPLET_NUM,
    ]);

    const staffNumbers = new Set<number>();
    staffNumbers.add(staff.GetN?.() ?? 0);
    const startStaff = (this.GetStart() as any)?.GetAncestorStaff?.(1, false);
    const endStaff = (this.GetEnd() as any)?.GetAncestorStaff?.(1, false);
    if (startStaff && startStaff !== staff) {
      staffNumbers.add(startStaff.GetN?.() ?? 0);
    } else if (endStaff && endStaff !== staff) {
      staffNumbers.add(endStaff.GetN?.() ?? 0);
    }
    findSpanned.SetStaffNs(staffNumbers);

    container?.Process?.(findSpanned);

    const layersN = new Set<number>();
    if (this.HasLayer()) {
      layersN.add(this.GetLayer());
    } else {
      for (const element of [this.GetStart() as any, this.GetEnd() as any]) {
        if (element) layersN.add(element.GetOriginalLayerN?.() ?? 0);
      }
    }

    const sortedLayers = Array.from(layersN).sort((a, b) => a - b);
    const minLayerN = sortedLayers[0] ?? 0;
    const maxLayerN = sortedLayers[sortedLayers.length - 1] ?? 0;

    let spannedElements = findSpanned.GetElements();
    const hasOutsideLayers = spannedElements.some((element: any) => {
      const layerN = element.GetOriginalLayerN?.() ?? 0;
      return layerN < minLayerN || layerN > maxLayerN;
    });

    if (hasOutsideLayers) {
      const notes: any[] = [];
      for (const element of spannedElements) {
        if (element.Is?.(ClassId.NOTE)) notes.push(element);
      }
      for (const boundary of [this.GetStart() as any, this.GetEnd() as any]) {
        if (!boundary) continue;
        if (boundary.Is?.(ClassId.NOTE)) {
          notes.push(boundary);
        } else {
          const boundaryNotes = boundary.FindAllDescendantsByType?.(ClassId.NOTE, 1) ?? [];
          for (const bn of boundaryNotes) notes.push(bn);
        }
      }

      let minPitch = 1000;
      let maxPitch = 0;
      for (const object of notes) {
        const layerN = object.GetOriginalLayerN?.() ?? 0;
        const pitch = object.GetDiatonicPitch?.() ?? 0;
        if (layerN === maxLayerN) {
          minPitch = Math.min(pitch, minPitch);
        }
        if (layerN === minLayerN) {
          maxPitch = Math.max(pitch, maxPitch);
        }
      }

      const layersAreSeparated = notes.every((object: any) => {
        const layerN = object.GetOriginalLayerN?.() ?? 0;
        const pitch = object.GetDiatonicPitch?.() ?? 0;
        if (layerN < minLayerN) return pitch > maxPitch;
        if (layerN > maxLayerN) return pitch < minPitch;
        return true;
      });

      if (layersAreSeparated || this.HasLayer()) {
        findSpanned.ClearElements();
        findSpanned.SetMinMaxLayerN(minLayerN, maxLayerN);
        container?.Process?.(findSpanned);
        spannedElements = findSpanned.GetElements();
      }
    }

    for (const element of spannedElements) {
      layersN.add(element.GetOriginalLayerN?.() ?? 0);
    }

    return { elements: spannedElements, layersN };
  }

  private AddSpannedElements(
    curve: FloatingCurvePositioner,
    spanned: SpannedElements,
    staff: any,
    xMin: number,
    xMax: number
  ): void {
    const startStaff = (this.GetStart() as any)?.GetAncestorStaff?.(1, false);
    const endStaff = (this.GetEnd() as any)?.GetAncestorStaff?.(1, false);
    if (startStaff && endStaff && startStaff.GetN?.() !== endStaff.GetN?.()) {
      curve.SetCrossStaff(endStaff);
    }

    curve.ClearSpannedElements();
    for (const element of spanned.elements) {
      const xLeft = element.GetSelfLeft?.() ?? 0;
      const xRight = element.GetSelfRight?.() ?? 0;
      const isOverlapping =
        (xLeft > xMin && xLeft < xMax) || (xRight > xMin && xRight < xMax);

      if (isOverlapping || element.Is?.(ClassId.TUPLET_BRACKET)) {
        const spannedElement = new CurveSpannedElement();
        spannedElement.m_boundingBox = element;
        spannedElement.m_isBelow = this.IsElementBelow(element, startStaff, endStaff);
        curve.AddSpannedElement(spannedElement);
      }

      if (!curve.IsCrossStaff() && element.m_crossStaff) {
        curve.SetCrossStaff(element.m_crossStaff);
      }
    }

    this.DiscardTupletElements(curve, xMin, xMax);

    const tiePositioners: any[] = [];
    for (const pos of staff.GetAlignment?.()?.FindAllFloatingPositioners?.(ClassId.TIE) ?? []) {
      tiePositioners.push(pos);
    }
    if (startStaff && startStaff !== staff && startStaff.GetAlignment?.()) {
      for (const pos of startStaff.GetAlignment().FindAllFloatingPositioners(ClassId.TIE)) {
        tiePositioners.push(pos);
      }
    } else if (endStaff && endStaff !== staff && endStaff.GetAlignment?.()) {
      for (const pos of endStaff.GetAlignment().FindAllFloatingPositioners(ClassId.TIE)) {
        tiePositioners.push(pos);
      }
    }

    const filteredTiePositioners = tiePositioners.filter((positioner: any) => {
      const timeInterface = positioner.GetObject?.()?.GetTimeSpanningInterface?.();
      if (!timeInterface?.GetStart?.() || !timeInterface?.GetEnd?.()) return false;
      const startsInCollisionLayer = spanned.layersN.has(
        timeInterface.GetStart().GetOriginalLayerN?.() ?? 0
      );
      const endsInCollisionLayer = spanned.layersN.has(
        timeInterface.GetEnd().GetOriginalLayerN?.() ?? 0
      );
      return startsInCollisionLayer || endsInCollisionLayer;
    });

    for (const positioner of filteredTiePositioners) {
      const posSys = (positioner.GetAlignment?.() as any)?.GetParentSystem?.();
      const curveSys = (curve.GetAlignment?.() as any)?.GetParentSystem?.();
      if (posSys === curveSys) {
        if (
          positioner.HasContentBB?.() &&
          positioner.GetContentRight() > xMin &&
          positioner.GetContentLeft() < xMax
        ) {
          const spannedElement = new CurveSpannedElement();
          spannedElement.m_boundingBox = positioner;
          spannedElement.m_isBelow = this.IsElementBelow(positioner, startStaff, endStaff);
          curve.AddSpannedElement(spannedElement);
        }
      }
    }
  }

  private DiscardTupletElements(curve: FloatingCurvePositioner, xMin: number, xMax: number): void {
    const spannedElements = curve.GetSpannedElements();
    for (const spannedElement of spannedElements) {
      if ((spannedElement.m_boundingBox as any)?.Is?.(ClassId.TUPLET_BRACKET)) {
        const tupletBracket = spannedElement.m_boundingBox as any;
        const tuplet = tupletBracket.GetParent?.();
        if (!tuplet?.Is?.(ClassId.TUPLET)) continue;

        const xLeft = tupletBracket.GetSelfLeft?.() ?? 0;
        const xRight = tupletBracket.GetSelfRight?.() ?? 0;
        const isContained = xLeft > xMin && xRight < xMax;
        const isOverlapping =
          (xLeft > xMin && xLeft < xMax) || (xRight > xMin && xRight < xMax);

        if (isContained) continue;

        if (isOverlapping) {
          if (tuplet.GetBracketAlignedBeam?.()) continue;
          if (xRight - xLeft < 2 * (xMax - xMin)) continue;
        }

        spannedElement.m_discarded = true;
        tuplet.AddInnerSlur?.(curve);

        const tupletNum = tupletBracket.GetAlignedNum?.();
        if (tupletNum) {
          const numElement = spannedElements.find(
            (el: CurveSpannedElement) => el.m_boundingBox === tupletNum
          );
          if (numElement) {
            numElement.m_discarded = true;
          }
        }
      }
    }
  }

  public AddPositionerToArticulations(curve: FloatingCurvePositioner): void {
    const start = this.GetStart() as any;
    const end = this.GetEnd() as any;
    if (!start || !end) return;

    const spanningType = Number(curve.GetSpanningType());
    const curveDir = this.CalcDrawingCurveDir(spanningType);

    if (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_START) {
      const artics = start.FindAllDescendantsByType?.(ClassId.ARTIC) ?? [];
      for (const artic of artics) {
        if (artic.IsOutsideArtic?.()) {
          const place = artic.GetPlace?.();
          if (place === STAFFREL_above && curveDir === curvature_CURVEDIR_above) {
            artic.AddSlurPositioner?.(curve, true);
          } else if (place === STAFFREL_below && curveDir === curvature_CURVEDIR_below) {
            artic.AddSlurPositioner?.(curve, true);
          }
        }
      }
    }

    if (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_END) {
      const artics = end.FindAllDescendantsByType?.(ClassId.ARTIC) ?? [];
      for (const artic of artics) {
        if (artic.IsOutsideArtic?.()) {
          const place = artic.GetPlace?.();
          if (place === STAFFREL_above && curveDir === curvature_CURVEDIR_above) {
            artic.AddSlurPositioner?.(curve, false);
          } else if (place === STAFFREL_below && curveDir === curvature_CURVEDIR_below) {
            artic.AddSlurPositioner?.(curve, false);
          }
        }
      }
    }
  }

  public CalculatePrincipalStaff(staff: any, xMin: number, xMax: number): any {
    if (!staff) return null;

    let principalStaff: any = null;
    const curveDir = this.GetDrawingCurveDir();
    const spanned = this.CollectSpannedElements(staff, xMin, xMax);
    if (spanned.elements.length === 0) {
      return staff;
    }

    const adaptStaff = (element: any) => {
      const elementStaff = element.GetAncestorStaff?.(1); // RESOLVE_CROSS_STAFF
      if (!elementStaff) return;
      const updatePrincipal =
        !principalStaff ||
        (curveDir === SlurCurveDirection.Below
          ? (elementStaff.GetN?.() ?? 0) > (principalStaff.GetN?.() ?? 0)
          : (elementStaff.GetN?.() ?? 0) < (principalStaff.GetN?.() ?? 0));
      if (updatePrincipal) {
        principalStaff = elementStaff;
      }
    };

    for (const element of spanned.elements) {
      adaptStaff(element);
    }
    for (const element of spanned.elements) {
      const beam = element.GetAncestorBeam?.();
      if (beam) adaptStaff(beam);
    }

    return principalStaff ?? staff;
  }

  public IsElementBelow(element: any, startStaff: any, endStaff: any): boolean {
    if (!element) return false;

    switch (this.GetDrawingCurveDir()) {
      case SlurCurveDirection.Above:
        return true;
      case SlurCurveDirection.Below:
        return false;
      case SlurCurveDirection.AboveBelow: {
        const staff = element.Is?.(ClassId.FLOATING_POSITIONER)
          ? element.GetAlignment?.()?.GetStaff?.()
          : element.GetAncestorStaff?.(1);
        return startStaff && staff && staff.GetN?.() === startStaff.GetN?.();
      }
      case SlurCurveDirection.BelowAbove: {
        const staff = element.Is?.(ClassId.FLOATING_POSITIONER)
          ? element.GetAlignment?.()?.GetStaff?.()
          : element.GetAncestorStaff?.(1);
        return endStaff && staff && staff.GetN?.() === endStaff.GetN?.();
      }
      default:
        return false;
    }
  }

  public GetAdjustedSlurAngle(doc: any, p1: Point, p2: Point, curveDir: number): number {
    let slurAngle = p1.x === p2.x && p1.y === p2.y ? 0 : Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const maxSlopeDeg = doc?.GetOptions?.().m_slurMaxSlope?.GetValue?.() ?? 60.0;
    const maxAngle = (maxSlopeDeg * Math.PI) / 180.0;

    if (Math.abs(slurAngle) > maxAngle) {
      // C++ `int side` truncates toward zero on assignment; Math.trunc reproduces it.
      const side = Math.trunc((p2.x - p1.x) * Math.tan(maxAngle));
      if (p2.y > p1.y) {
        if (curveDir === curvature_CURVEDIR_above) {
          // C++ Point::y is int: assignment truncates. Keep Math.trunc explicit.
          p1.y = Math.trunc(p2.y - side);
        } else {
          p2.y = Math.trunc(p1.y + side);
        }
        slurAngle = maxAngle;
      } else {
        if (curveDir === curvature_CURVEDIR_above) {
          p2.y = Math.trunc(p1.y - side);
        } else {
          p1.y = Math.trunc(p2.y + side);
        }
        slurAngle = -maxAngle;
      }
    }

    // C++ returns float; narrow to float32 (callers feed cos()/Rotate with the narrowed value).
    return Math.fround(slurAngle);
  }

  public CalcEndPoints(
    doc: any,
    staff: any,
    nearEndCollision: NearEndCollision | null,
    x1: number,
    x2: number,
    drawingCurveDir: number,
    spanningType: number
  ): [Point, Point] {
    const startStemDraw = (this.GetStart() as any)?.GetStemmedDrawingInterface?.();
    const endStemDraw = (this.GetEnd() as any)?.GetStemmedDrawingInterface?.();

    let startStemDir = STEMDIRECTION_NONE;
    let startStemLen = 0;
    if (startStemDraw) {
      startStemDir = startStemDraw.GetDrawingStemDir?.() ?? STEMDIRECTION_NONE;
      startStemLen = startStemDraw.GetDrawingStemLen?.() ?? 0;
    }

    let endStemDir = STEMDIRECTION_NONE;
    let endStemLen = 0;
    if (endStemDraw) {
      endStemDir = endStemDraw.GetDrawingStemDir?.() ?? STEMDIRECTION_NONE;
      endStemLen = endStemDraw.GetDrawingStemLen?.() ?? 0;
    }

    const start = this.GetStart() as any;
    const end = this.GetEnd() as any;

    let startNote: any = null;
    let startChord: any = null;
    let hasStartFlag = false;
    if (start?.Is?.(ClassId.NOTE)) {
      startNote = start;
      startChord = typeof startNote.IsChordTone === 'function' ? startNote.IsChordTone() : null;
      hasStartFlag = Boolean(startNote.FindDescendantByType?.(ClassId.FLAG));
    } else if (start?.Is?.(ClassId.CHORD)) {
      startChord = start;
      hasStartFlag = Boolean(startChord.FindDescendantByType?.(ClassId.FLAG));
    }

    let endNote: any = null;
    let endChord: any = null;
    if (end?.Is?.(ClassId.NOTE)) {
      endNote = end;
      endChord = typeof endNote.IsChordTone === 'function' ? endNote.IsChordTone() : null;
    } else if (end?.Is?.(ClassId.CHORD)) {
      endChord = end;
    }

    const isSshaped = this.HasMixedCurveDir();
    const isGraceToNoteSlur = Boolean(
      start &&
        end &&
        !start.Is?.(ClassId.TIMESTAMP_ATTR) &&
        !end.Is?.(ClassId.TIMESTAMP_ATTR) &&
        start.IsGraceNote?.() &&
        !end.IsGraceNote?.()
    );

    const portatoSlurType = this.IsPortatoSlur(doc, startNote, startChord);

    const staffY = staff?.GetDrawingY?.() ?? 0;
    let y1 = staffY;
    let y2 = staffY;

    const staffSize = staff?.m_drawingStaffSize ?? 100;
    const isShortSlur = x2 - x1 < doc.GetDrawingDoubleUnit(staffSize);

    const unit = doc.GetDrawingUnit(staffSize);
    let yChordMax = 0;
    let yChordMin = 0;

    if (
      (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_START) &&
      start &&
      !start.Is?.(ClassId.TIMESTAMP_ATTR)
    ) {
      const startRadius = start.GetDrawingRadius?.(doc) ?? unit;
      if (startChord) {
        // C++ Chord::GetYExtremes(int &yMax, int &yMin): two out-params.
        const yMaxRef = { value: 0 }; const yMinRef = { value: 0 };
        startChord.GetYExtremes?.(yMaxRef, yMinRef);
        yChordMax = yMaxRef.value;
        yChordMin = yMinRef.value;
        if (startNote?.GetFlippedNotehead?.()) {
          const refNote =
            startStemDir === STEMDIRECTION_down
              ? startChord.GetTopNote?.()
              : startChord.GetBottomNote?.();
          if (refNote) {
            x1 += refNote.GetDrawingX() - startNote.GetDrawingX();
          }
        }
      }

      if (this.HasEndpointAboveStart()) {
        if (startStemDir === STEMDIRECTION_down || startStemLen === 0) {
          y1 = start.GetDrawingTop?.(doc, staffSize) ?? y1;
        } else if (isShortSlur) {
          y1 = start.GetDrawingTop?.(doc, staffSize) ?? y1;
        } else if (isSshaped) {
          y1 = start.GetDrawingTop?.(doc, staffSize) ?? y1;
          x1 += startRadius - doc.GetDrawingStemWidth(staffSize);
        } else if (portatoSlurType !== PortatoSlurType.None) {
          y1 = start.GetDrawingTop?.(doc, staffSize) ?? y1;
          const refNote = startChord ? startChord.GetBottomNote?.() : startNote;
          x1 = (refNote?.GetDrawingX?.() ?? x1) + startRadius;
          if (portatoSlurType === PortatoSlurType.StemSide) {
            x1 += startRadius;
          }
        } else if (this.StartsOnBeam() || isGraceToNoteSlur || hasStartFlag) {
          y1 = start.GetDrawingTop?.(doc, staffSize) ?? y1;
          let weight = 1.0;
          if (nearEndCollision && nearEndCollision.metricAtStart > 1.0 && isGraceToNoteSlur) {
            weight = -0.5;
            nearEndCollision.endPointsAdjusted = true;
          }
          x1 += weight * (startRadius - doc.GetDrawingStemWidth(staffSize));
        } else {
          if (nearEndCollision && nearEndCollision.metricAtStart > 0.3) {
            y1 = start.GetDrawingTop?.(doc, staffSize) ?? y1;
            x1 += startRadius - doc.GetDrawingStemWidth(staffSize);
            nearEndCollision.endPointsAdjusted = true;
          } else {
            x1 += unit * 2;
            y1 = startChord ? yChordMax + unit * 3 : (start.GetDrawingY?.() ?? y1) + unit * 3;
          }
        }
      } else {
        if (isGraceToNoteSlur) {
          y1 = start.GetDrawingBottom?.(doc, staffSize) ?? y1;
          if (startStemDir !== STEMDIRECTION_up) {
            x1 -= startRadius + doc.GetDrawingStemWidth(staffSize);
          } else {
            y1 += Math.trunc(unit / 2);
          }
        } else if (startStemDir === STEMDIRECTION_up || startStemLen === 0) {
          y1 = start.GetDrawingBottom?.(doc, staffSize) ?? y1;
        } else if (isShortSlur) {
          y1 = start.GetDrawingBottom?.(doc, staffSize) ?? y1;
        } else if (isSshaped) {
          y1 = start.GetDrawingBottom?.(doc, staffSize) ?? y1;
          x1 -= startRadius - doc.GetDrawingStemWidth(staffSize);
        } else if (portatoSlurType !== PortatoSlurType.None) {
          y1 = start.GetDrawingBottom?.(doc, staffSize) ?? y1;
          const refNote = startChord ? startChord.GetTopNote?.() : startNote;
          x1 = refNote?.GetDrawingX?.() ?? x1;
          if (portatoSlurType === PortatoSlurType.Centered) {
            x1 += startRadius;
          }
        } else if (this.StartsOnBeam() || hasStartFlag) {
          y1 = start.GetDrawingBottom?.(doc, staffSize) ?? y1;
          x1 -= startRadius - doc.GetDrawingStemWidth(staffSize);
        } else {
          if (nearEndCollision && nearEndCollision.metricAtStart > 0.3) {
            y1 = start.GetDrawingBottom?.(doc, staffSize) ?? y1;
            x1 -= startRadius - doc.GetDrawingStemWidth(staffSize);
            nearEndCollision.endPointsAdjusted = true;
          } else {
            y1 = startChord ? yChordMin - unit * 3 : (start.GetDrawingY?.() ?? y1) - unit * 3;
          }
        }
      }
    }

    if (
      (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_END) &&
      end &&
      !end.Is?.(ClassId.TIMESTAMP_ATTR)
    ) {
      const endRadius = end.GetDrawingRadius?.(doc) ?? unit;
      if (endChord) {
        const yMaxRef = { value: 0 }; const yMinRef = { value: 0 };
        endChord.GetYExtremes?.(yMaxRef, yMinRef);
        yChordMax = yMaxRef.value;
        yChordMin = yMinRef.value;
        if (endNote?.GetFlippedNotehead?.()) {
          const refNote =
            endStemDir === STEMDIRECTION_down
              ? endChord.GetTopNote?.()
              : endChord.GetBottomNote?.();
          if (refNote) {
            x2 += refNote.GetDrawingX() - endNote.GetDrawingX();
          }
        }
      }

      if (this.HasEndpointAboveEnd()) {
        if (endStemDir === STEMDIRECTION_down || endStemLen === 0) {
          y2 = end.GetDrawingTop?.(doc, staffSize) ?? y2;
        } else if (isShortSlur) {
          y2 = end.GetDrawingTop?.(doc, staffSize) ?? y2;
        } else if (isSshaped) {
          y2 = end.GetDrawingTop?.(doc, staffSize) ?? y2;
          x2 += endRadius - doc.GetDrawingStemWidth(staffSize);
        } else if (isGraceToNoteSlur) {
          const yMin = y1 - unit * 4;
          const yTop = end.GetDrawingTop?.(doc, staffSize) ?? y2;
          y2 = Math.max((end.GetDrawingY?.() ?? y2) + unit * 2, yMin);
          if (y2 > yTop - unit * 2) {
            y2 = yTop;
            x2 += endRadius - doc.GetDrawingStemWidth(staffSize);
          }
        } else if (portatoSlurType !== PortatoSlurType.None) {
          y2 = end.GetDrawingTop?.(doc, staffSize) ?? y2;
          const refNote = endChord ? endChord.GetBottomNote?.() : endNote;
          x2 = (refNote?.GetDrawingX?.() ?? x2) + endRadius;
          if (portatoSlurType === PortatoSlurType.StemSide) {
            x2 += endRadius;
          }
        } else if (this.EndsOnBeam()) {
          y2 = end.GetDrawingTop?.(doc, staffSize) ?? y2;
          x2 += endRadius - doc.GetDrawingStemWidth(staffSize);
        } else {
          if (nearEndCollision && nearEndCollision.metricAtEnd > 0.3) {
            y2 = end.GetDrawingTop?.(doc, staffSize) ?? y2;
            x2 += endRadius - doc.GetDrawingStemWidth(staffSize);
            nearEndCollision.endPointsAdjusted = true;
          } else {
            y2 = endChord ? yChordMax + unit * 3 : (end.GetDrawingY?.() ?? y2) + unit * 3;
          }
        }
      } else {
        if (endStemDir === STEMDIRECTION_up || endStemLen === 0) {
          y2 = end.GetDrawingBottom?.(doc, staffSize) ?? y2;
        } else if (isGraceToNoteSlur) {
          const yMax = y1 + unit;
          const yBottom = end.GetDrawingBottom?.(doc, staffSize) ?? y2;
          y2 = Math.min(end.GetDrawingY?.() ?? y2, yMax);
          if (y2 < yBottom + unit) {
            y2 = yBottom + unit * 2;
          } else {
            x2 -= endRadius + 2 * doc.GetDrawingStemWidth(staffSize);
          }
        } else if (isShortSlur) {
          y2 = end.GetDrawingBottom?.(doc, staffSize) ?? y2;
        } else if (isSshaped) {
          y2 = end.GetDrawingBottom?.(doc, staffSize) ?? y2;
          x2 -= endRadius - doc.GetDrawingStemWidth(staffSize);
        } else if (portatoSlurType !== PortatoSlurType.None) {
          y2 = end.GetDrawingBottom?.(doc, staffSize) ?? y2;
          const refNote = endChord ? endChord.GetTopNote?.() : endNote;
          x2 = refNote?.GetDrawingX?.() ?? x2;
          if (portatoSlurType === PortatoSlurType.Centered) {
            x2 += endRadius;
          }
        } else if (this.EndsOnBeam()) {
          y2 = end.GetDrawingBottom?.(doc, staffSize) ?? y2;
          x2 -= endRadius - doc.GetDrawingStemWidth(staffSize);
        } else {
          if (nearEndCollision && nearEndCollision.metricAtEnd > 0.3) {
            y2 = end.GetDrawingBottom?.(doc, staffSize) ?? y2;
            x2 -= endRadius - doc.GetDrawingStemWidth(staffSize);
            nearEndCollision.endPointsAdjusted = true;
          } else {
            x2 -= unit * 2;
            y2 = endChord ? yChordMin - unit * 3 : (end.GetDrawingY?.() ?? y2) - unit * 3;
          }
        }
      }
    }

    const [startLoc, endLoc] = this.GetStartEndLocs(startNote, startChord, endNote, endChord);
    const drawingStaffSize = doc.GetDrawingStaffSize(staffSize);
    const staffTop = staffY;
    const staffBottom = staffTop - drawingStaffSize;
    const pitchDiff = this.CalcPitchDifference(staff, startLoc, endLoc);

    if (spanningType === SpanningType.SPANNING_START) {
      if (this.HasEndpointAboveStart()) {
        y2 = staffTop + unit;
        if (this.ConsiderMelodicDirection()) {
          y2 = Math.max(staffTop, y1);
          y2 += Math.trunc((pitchDiff * unit) / 2);
          y2 = Math.max(staffTop, y2);
        }
      } else {
        y2 = staffBottom - unit;
        if (this.ConsiderMelodicDirection()) {
          y2 = Math.min(staffBottom, y1);
          y2 += Math.trunc((pitchDiff * unit) / 2);
          y2 = Math.min(staffBottom, y2);
        }
      }

      if (Math.abs(y1 - y2) < 2 * unit && Math.abs(x1 - x2) < 2 * drawingStaffSize) {
        const sign = this.HasEndpointAboveStart() ? 1 : -1;
        y2 = y1 + 2 * sign * unit;
      }
      x2 -= Math.trunc((doc.GetDrawingBarLineWidth(staffSize) + unit) / 2);
    }

    if (end?.Is?.(ClassId.TIMESTAMP_ATTR)) {
      if (this.HasEndpointAboveStart()) {
        y2 = Math.max(staffTop, y1);
      } else {
        y2 = Math.min(staffBottom, y1);
      }
    }

    if (spanningType === SpanningType.SPANNING_END) {
      if (isSshaped !== this.HasEndpointAboveEnd()) {
        y1 = staffTop + unit;
        if (this.ConsiderMelodicDirection()) {
          y1 = Math.max(staffTop, y2);
          y1 -= Math.trunc((pitchDiff * unit) / 2);
          y1 = Math.max(staffTop, y1);
        }
      } else {
        y1 = staffBottom - unit;
        if (this.ConsiderMelodicDirection()) {
          y1 = Math.min(staffBottom, y2);
          y1 -= Math.trunc((pitchDiff * unit) / 2);
          y1 = Math.min(staffBottom, y1);
        }
      }

      if (Math.abs(y1 - y2) < 2 * unit && Math.abs(x1 - x2) < 2 * drawingStaffSize) {
        const sign = this.HasEndpointAboveEnd() ? 1 : -1;
        y1 = y2 + 2 * sign * unit;
      }
    }

    if (start?.Is?.(ClassId.TIMESTAMP_ATTR)) {
      if (this.HasEndpointAboveEnd()) {
        y1 = Math.max(staffTop, y2);
      } else {
        y1 = Math.min(staffBottom, y2);
      }
    } else if (spanningType === SpanningType.SPANNING_MIDDLE) {
      y1 = drawingCurveDir === curvature_CURVEDIR_above ? staffTop + unit : staffBottom - unit;
      y2 = y1;
    }

    let sign = drawingCurveDir === curvature_CURVEDIR_above ? 1 : -1;
    if (drawingCurveDir === curvature_CURVEDIR_mixed) {
      sign = this.HasEndpointAboveStart() ? 1 : -1;
    }
    y1 = Math.trunc(y1 + 1.25 * sign * unit);

    if (drawingCurveDir === curvature_CURVEDIR_mixed) {
      sign = this.HasEndpointAboveEnd() ? 1 : -1;
    }
    y2 = Math.trunc(y2 + 1.25 * sign * unit);

    return [new Point(x1, y1), new Point(x2, y2)];
  }

  public ConsiderMelodicDirection(): boolean {
    const startMeasure = (this.GetStart() as any)?.GetFirstAncestor?.(ClassId.MEASURE);
    const endMeasure = (this.GetEnd() as any)?.GetFirstAncestor?.(ClassId.MEASURE);

    if (startMeasure && endMeasure) {
      return (
        Boolean(startMeasure.IsLastInSystem?.()) &&
        (endMeasure.GetIndex?.() ?? -1) === (startMeasure.GetIndex?.() ?? -2) + 1
      );
    }
    return false;
  }

  public GetStartEndLocs(
    startNote: any,
    startChord: any,
    endNote: any,
    endChord: any
  ): [number, number] {
    let startLoc = startNote?.GetDrawingLoc?.() ?? 0;
    if (startChord) {
      if (this.HasEndpointAboveStart()) {
        startLoc = startChord.GetTopNote?.()?.GetDrawingLoc?.() ?? startLoc;
      } else {
        startLoc = startChord.GetBottomNote?.()?.GetDrawingLoc?.() ?? startLoc;
      }
    }

    let endLoc = endNote?.GetDrawingLoc?.() ?? 0;
    if (endChord) {
      if (this.HasEndpointAboveEnd()) {
        endLoc = endChord.GetTopNote?.()?.GetDrawingLoc?.() ?? endLoc;
      } else {
        endLoc = endChord.GetBottomNote?.()?.GetDrawingLoc?.() ?? endLoc;
      }
    }

    return [startLoc, endLoc];
  }

  public CalcPitchDifference(staff: any, startLoc: number, endLoc: number): number {
    const lines = staff?.m_drawingLines ?? 5;
    // C++ int arithmetic wraps (m_drawingLines can be VRV_UNSET here); mirror with imul.
    const staffTopLoc = Math.imul(2, ((lines - 1) | 0));
    const loc1 = this.HasEndpointAboveStart()
      ? Math.max(startLoc, staffTopLoc - 1)
      : Math.min(startLoc, 1);
    const loc2 = this.HasEndpointAboveEnd()
      ? Math.max(endLoc, staffTopLoc - 1)
      : Math.min(endLoc, 1);

    return loc2 - loc1;
  }

  public IsPortatoSlur(doc: any, startNote: any, startChord: any): PortatoSlurType {
    let artics: any[] = [];
    if (startChord) {
      artics = startChord.FindAllDescendantsByType?.(ClassId.ARTIC, true, 1) ?? [];
    } else if (startNote) {
      artics = startNote.FindAllDescendantsByType?.(ClassId.ARTIC, true, 1) ?? [];
    }

    let type = PortatoSlurType.None;
    if (artics.length > 0) {
      type = PortatoSlurType.Centered;
      const artic = artics[0];

      if (
        !artic.IsInsideArtic?.() ||
        (artic.GetDrawingPlace?.() === STAFFREL_above && this.HasEndpointBelowStart()) ||
        (artic.GetDrawingPlace?.() === STAFFREL_below && this.HasEndpointAboveStart())
      ) {
        return PortatoSlurType.None;
      }

      if (!doc?.GetOptions?.().m_staccatoCenter?.GetValue?.()) {
        const articType = artic.GetArticFirst?.();
        if (articType === ARTICULATION_stacc || articType === ARTICULATION_stacciss) {
          type = PortatoSlurType.StemSide;
        }
      }
    }
    return type;
  }

  public StartsOnBeam(): boolean {
    return this.HasBoundaryOnBeam(true);
  }

  public EndsOnBeam(): boolean {
    return this.HasBoundaryOnBeam(false);
  }

  public HasBoundaryOnBeam(isStart: boolean): boolean {
    const boundary = (isStart ? this.GetStart() : this.GetEnd()) as any;
    if (!boundary) return false;

    const parentBeam = boundary.GetAncestorBeam?.();
    if (parentBeam) {
      if (isStart && !parentBeam.IsLastIn?.(boundary)) return true;
      if (!isStart && !parentBeam.IsFirstIn?.(boundary)) return true;
    }

    const parentFTrem = boundary.GetAncestorFTrem?.();
    if (parentFTrem) {
      if (isStart && !parentFTrem.IsLastIn?.(boundary)) return true;
      if (!isStart && !parentFTrem.IsFirstIn?.(boundary)) return true;
    }

    if (boundary.GetIsInBeamSpan?.()) {
      return true;
    }

    if (boundary.Is?.(ClassId.NOTE)) {
      const chord = typeof boundary.IsChordTone === 'function' ? boundary.IsChordTone() : null;
      if (chord?.GetIsInBeamSpan?.()) {
        return true;
      }
    }

    return false;
  }

  public CalcInitialCurve(
    doc: any,
    curve: FloatingCurvePositioner,
    nearEndCollision: NearEndCollision | null = null
  ): void {
    const start = this.GetStart() as any;
    const end = this.GetEnd() as any;
    if (!start || !end) return;

    const staff = curve.GetObjectY?.() as any;
    if (!staff) return;

    const spanningType = Number(curve.GetSpanningType());
    const curveDir = this.CalcDrawingCurveDir(spanningType);

    const cachedX12 = curve.GetCachedX12?.() ?? [0, 0];
    const [p1, p2] = this.CalcEndPoints(
      doc,
      staff,
      nearEndCollision,
      cachedX12[0],
      cachedX12[1],
      curveDir,
      spanningType
    );

    const bezier = new BezierCurve(p1, p1, p2, p2);
    this.InitBezierControlSides(bezier, curveDir);

    const dontAdjustAngle = Boolean(curve.IsCrossStaff() || start.IsGraceNote?.());
    const nonAdjustedAngle =
      bezier.p2.x === bezier.p1.x && bezier.p2.y === bezier.p1.y
        ? 0
        : Math.atan2(bezier.p2.y - bezier.p1.y, bezier.p2.x - bezier.p1.x);
    const slurAngle = dontAdjustAngle
      ? nonAdjustedAngle
      : this.GetAdjustedSlurAngle(doc, bezier.p1, bezier.p2, curveDir);

    if (curveDir !== curvature_CURVEDIR_mixed) {
      const rot = BoundingBox.CalcPositionAfterRotation(bezier.p2, -slurAngle, bezier.p1);
      bezier.p2 = new Point(rot.x, rot.y);
    }

    if (this.HasBulge()) {
      bezier.CalcInitialControlPointParams();
    } else {
      bezier.CalcInitialControlPointParams(doc, slurAngle, staff.m_drawingStaffSize ?? 100);
    }
    bezier.UpdateControlPoints();
    if (curveDir !== curvature_CURVEDIR_mixed) {
      bezier.Rotate(slurAngle, bezier.p1);
    }

    const points = [bezier.p1, bezier.c1, bezier.c2, bezier.p2];
    const thickness = Math.trunc(
      doc.GetDrawingUnit(staff.m_drawingStaffSize ?? 100) *
        (doc.GetOptions?.().m_slurMidpointThickness?.GetValue?.() ?? 1.0)
    );

    curve.UpdateCurveParams(points, thickness, curveDir);
  }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSlur');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSlur');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSlurEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSlurEnd');
  }

  protected visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitControlElement === 'function') return functor.VisitControlElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Slur {
    const clone = new Slur(this.GetClassId());
    clone.AssignFrom(this);

    clone.SetDrawingCurveDir(this.GetDrawingCurveDir());

    if (this.HasCurvedir()) clone.SetCurvedir(this.GetCurvedir());
    if (this.HasBezier()) clone.SetBezier(this.GetBezier());
    if (this.HasBulge()) clone.SetBulge(this.GetBulge());

    if (this.HasLayer()) clone.SetLayer(this.GetLayer());

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

ObjectFactory.GetInstance().Register('slur', ClassId.SLUR, () => new Slur());
