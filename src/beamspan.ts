/**
 * Pure TypeScript translation of Verovio's `src/beamspan.cpp` / `include/vrv/beamspan.h`.
 *
 * `BeamSpan` models the MEI `<beamSpan>` element.
 *
 * C++ multiple inheritance (ControlElement + BeamDrawingInterface + PlistInterface +
 * TimeSpanningInterface + AttBeamedWith + AttBeamRend) is represented through explicit
 * composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject, ArrayOfObjects } from './object.js';
import { ControlElement } from './controlelement.js';
import { BeamDrawingInterface, mixinBeamDrawingInterface } from './drawinginterface.js';
import { PlistInterface, PlistObjectLike } from './plistinterface.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { InstBeamedWith, InstBeamRend } from './atts_cmn.js';
import { BeamSpanSegment, BeamElementCoord, ArrayOfBeamElementCoords } from './beam.js';

export const ATT_BEAMEDWITH = 14;
export const ATT_BEAMREND = 12;

/** TS adaptation of C++ `SpanIndexVector`: ordered element entries with an optional payload. */
export interface SpanIndexEntry {
  first: any;
  second?: any;
}

/** Pure-TypeScript translation of Verovio's `BeamSpan` control element. */
export class BeamSpan extends ControlElement {
  // C++ BeamSpan inherits BeamDrawingInterface: interface state lives on the host object itself
  // (same composition adaptation as Beam/FTrem). Call sites pass the host as the interface.
  public m_changingDur = false; public m_beamHasChord = false; public m_hasMultipleStemDir = false; public m_cueSize: any = false; public m_crossStaffContent: any = null; public m_crossStaffRel = 0; public m_isSpanningElement = false; public m_shortestDur = 0; public m_notesStemDir = 0; public m_drawingPlace = 0; public m_beamStaff: any = null; public m_beamWidth = 0; public m_beamWidthBlack = 0; public m_beamWidthWhite = 0; public m_fractionSize = 100; public m_beamElementCoords: any[] = [];
  protected plistInterface!: PlistInterface;
  protected timeSpanningInterface!: TimeSpanningInterface;
  protected beamedWith!: InstBeamedWith;
  protected beamRend!: InstBeamRend;

  private m_beamSegments: BeamSpanSegment[] = [];
  private m_beamedElements: ArrayOfObjects = [];

  public constructor() {
    super(ClassId.BEAMSPAN);
    this.plistInterface = new PlistInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.beamedWith = new InstBeamedWith();
    this.beamRend = new InstBeamRend();

    this.RegisterInterface(
      this.plistInterface.GetAttClasses(),
      this.plistInterface.IsInterface()
    );
    this.RegisterInterface(
      this.timeSpanningInterface.GetAttClasses(),
      this.timeSpanningInterface.IsInterface()
    );
    this.RegisterAttClass(ATT_BEAMEDWITH);
    this.RegisterAttClass(ATT_BEAMREND);

    this.Reset();
    this.InitBeamSegments();
  }

  public override Reset(): void {
    super.Reset();
    this.plistInterface ??= new PlistInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.beamedWith ??= new InstBeamedWith();
    this.beamRend ??= new InstBeamRend();

    // BeamDrawingInterface::Reset equivalent operating on the host state.
    this.m_beamElementCoords = [];
    this.m_changingDur = false; this.m_beamHasChord = false; this.m_hasMultipleStemDir = false;
    this.m_cueSize = false; this.m_fractionSize = 100; this.m_crossStaffContent = null;
    this.m_crossStaffRel = 0; this.m_isSpanningElement = false; this.m_shortestDur = 0;
    this.m_notesStemDir = 0; this.m_drawingPlace = 0; this.m_beamStaff = null;
    this.m_beamWidth = this.m_beamWidthBlack = this.m_beamWidthWhite = 0;
    this.plistInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.beamedWith.ResetBeamedWith();
    this.beamRend.ResetBeamRend();

    this.ClearBeamSegments();
  }

  public override GetClassName(): string {
    return 'beamSpan';
  }

  public override CloneReset(): void {
    this.m_beamSegments = [];
    super.CloneReset();
  }

  // Interface getters.
  public GetPlistInterface(): PlistInterface {
    this.plistInterface ??= new PlistInterface();
    return this.plistInterface;
  }

  public override GetTimePointInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  public override GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  // C++ BeamSpan inherits BeamDrawingInterface: return the host so the mixed-in
  // implementation below operates on the same state that call sites read directly.
  public GetBeamDrawingInterface(): BeamDrawingInterface { return this as any; }

  // Beam segment lifecycle.
  public InitBeamSegments(): void {
    // BeamSpan should have at least one segment to begin with.
    this.m_beamSegments.push(new BeamSpanSegment());
    this.m_isSpanningElement = true;
  }

  public ClearBeamSegments(): void {
    this.m_beamSegments = [];
  }

  // Segment access.
  public GetSegment(index: number): BeamSpanSegment {
    return this.m_beamSegments.at(index)!;
  }

  public GetSegmentForSystem(system: any): BeamSpanSegment | null {
    if (!system) throw new Error('BeamSpan::GetSegmentForSystem requires a system');
    for (const segment of this.m_beamSegments) {
      // Make sure to process only segments for the current system.
      const segmentMeasure = segment.GetMeasure();
      if (segmentMeasure && segmentMeasure.GetFirstAncestor?.(ClassId.SYSTEM) === system) {
        return segment;
      }
    }
    return null;
  }

  // Beamed elements.
  public GetBeamedElements(): ArrayOfObjects {
    return this.m_beamedElements;
  }

  public ResetBeamedElements(): void {
    this.m_beamedElements = [];
  }

  public SetBeamedElements(beamedElements: ArrayOfObjects): void {
    this.m_beamedElements = beamedElements;
  }

  public AddSpanningSegment(
    doc: any,
    elements: SpanIndexEntry[],
    index: number,
    newSegment = true
  ): boolean {
    // C++ SpanIndexVector holds iterators into beamedElements; TS models them as indices.
    // `*(elements.at(index + 1).first - 1)` is the beamed element right before the next
    // segment's first element (src-cpp/src/beamspan.cpp:117).
    const beamedElements = this.GetBeamedElements() as any[];
    const firstIdx = elements.at(index)?.first ?? -1;
    const nextIdx = elements.at(index + 1)?.first ?? -1;
    const firstElement = (typeof firstIdx === 'number' && firstIdx >= 0 && firstIdx < beamedElements.length)
      ? beamedElements[firstIdx] : (elements.at(index)?.first ?? null);
    const layer = firstElement?.GetFirstAncestor?.(ClassId.LAYER) ?? null;
    const staff = firstElement?.GetFirstAncestor?.(ClassId.STAFF) ?? null;
    if (!layer || !staff) return false;

    // Get first and last coordinates in the range for the segment.
    const coords = this.m_beamElementCoords as BeamElementCoord[];
    let lastElement: any = null;
    if (elements.at(index + 1) !== undefined) {
      const lastIdx = (typeof nextIdx === 'number' ? nextIdx : -1) - 1;
      lastElement = (lastIdx >= 0 && lastIdx < beamedElements.length) ? beamedElements[lastIdx] : null;
    }
    else {
      lastElement = coords.at(-1)?.m_element ?? null;
    }
    const coordsFirst = coords.find((coord) => coord.m_element === firstElement) ?? null;
    const coordsLast = lastElement ? coords.find((coord) => coord.m_element === lastElement) ?? null : null;
    if (!coordsFirst || !coordsLast) return false;

    let segment: BeamSpanSegment;
    if (newSegment) {
      segment = new BeamSpanSegment();
    } else {
      segment = this.m_beamSegments.at(0)!;
    }

    // Init segment with placement information (measure, staff, etc.) as well as begin/end coordinates.
    const firstPos = coords.indexOf(coordsFirst);
    const lastPos = coords.indexOf(coordsLast);
    const range: ArrayOfBeamElementCoords = coords.slice(firstPos, lastPos + 1);
    segment.SetStaff(staff);
    segment.SetLayer(layer);
    segment.SetBeginCoord(coordsFirst);
    segment.SetEndCoord(coordsLast);
    segment.InitCoordRefs(range);
    segment.CalcBeam(layer, staff, doc, this as any, this.m_drawingPlace);
    segment.SetSpanningType(index, elements.length - 1);
    const currentSystem = layer.GetFirstAncestor?.(ClassId.SYSTEM) ?? null;
    const spanningType = segment.GetSpanningType();
    if (spanningType === 1) {
      segment.SetMeasure(currentSystem?.GetLast?.(ClassId.MEASURE) ?? null);
    } else if (spanningType === 2) {
      segment.SetMeasure(currentSystem?.GetFirst?.(ClassId.MEASURE) ?? null);
    } else {
      segment.SetMeasure(firstElement?.GetFirstAncestor?.(ClassId.MEASURE) ?? null);
    }

    if (newSegment) {
      this.m_beamSegments.push(segment);
    }

    return true;
  }

  /** Resolve the coordinate preceding a boundary element (C++ `first - 1` iterator adaptation). */
  private elementBefore(boundary: any, coords: BeamElementCoord[]): BeamElementCoord | null {
    const idx = coords.findIndex((coord) => coord.m_element === boundary);
    if (idx === -1) return coords.at(-1) ?? null;
    return coords.at(idx - 1) ?? null;
  }

  // Forwarding for PlistInterface.
  public SetRef(ref: PlistObjectLike): void { this.GetPlistInterface().SetRef(ref); }
  public GetRefs(): PlistObjectLike[] { return this.GetPlistInterface().GetRefs(); }
  public GetConstRefs(): readonly PlistObjectLike[] { return this.GetPlistInterface().GetConstRefs(); }
  public SetPlist(plist: readonly string[]): void { this.GetPlistInterface().SetPlist(plist); }
  public GetPlist(): string[] { return this.GetPlistInterface().GetPlist(); }
  public HasPlist(): boolean { return this.GetPlistInterface().HasPlist(); }

  // Forwarding for TimeSpanningInterface.
  public SetStartid(value: string): void { this.GetTimeSpanningInterface().SetStartid(value); }
  public GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  public SetEndid(value: string): void { this.GetTimeSpanningInterface().SetEndid(value); }
  public GetEndid(): string { return this.GetTimeSpanningInterface().GetEndid(); }
  public HasEndid(): boolean { return this.GetTimeSpanningInterface().HasEndid(); }
  public SetTstamp(value: any): void { this.GetTimeSpanningInterface().SetTstamp(value); }
  public GetTstamp(): any { return this.GetTimeSpanningInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  public SetTstamp2(value: any): void { this.GetTimeSpanningInterface().SetTstamp2(value); }
  public GetTstamp2(): any { return this.GetTimeSpanningInterface().GetTstamp2(); }
  public HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }
  public SetStaff(value: any): void { this.GetTimeSpanningInterface().SetStaff(value); }
  public GetStaff(): any { return this.GetTimeSpanningInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  public SetStart(start: any): void { this.GetTimeSpanningInterface().SetStart(start); }
  public GetStart(): any { return this.GetTimeSpanningInterface().GetStart(); }
  public SetEnd(end: any): void { this.GetTimeSpanningInterface().SetEnd(end); }
  public GetEnd(): any { return this.GetTimeSpanningInterface().GetEnd(); }

  // Forwarding for AttBeamedWith.
  public SetBeamWith(value: any): void { this.beamedWith.SetBeamWith(value); }
  public GetBeamWith(): any { return this.beamedWith.GetBeamWith(); }
  public HasBeamWith(): boolean { return this.beamedWith.HasBeamWith(); }
  public ResetBeamedWith(): void { this.beamedWith.ResetBeamedWith(); }

  // Forwarding for AttBeamRend.
  public SetForm(value: any): void { this.beamRend.SetForm(value); }
  public GetForm(): any { return this.beamRend.GetForm(); }
  public HasForm(): boolean { return this.beamRend.HasForm(); }
  public SetPlace(value: any): void { this.beamRend.SetPlace(value); }
  public GetPlace(): any { return this.beamRend.GetPlace(); }
  public HasPlace(): boolean { return this.beamRend.HasPlace(); }
  public SetSlash(value: any): void { this.beamRend.SetSlash(value); }
  public GetSlash(): any { return this.beamRend.GetSlash(); }
  public HasSlash(): boolean { return this.beamRend.HasSlash(); }
  public SetSlope(value: any): void { this.beamRend.SetSlope(value); }
  public GetSlope(): any { return this.beamRend.GetSlope(); }
  public HasSlope(): boolean { return this.beamRend.HasSlope(); }
  public ResetBeamRend(): void { this.beamRend.ResetBeamRend(); }

  public override Accept(functor: any): FunctorCode {
    return functor.VisitBeamSpan(this);
  }

  public AcceptConst(functor: any): FunctorCode {
    return functor.VisitBeamSpan(this);
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return functor.VisitBeamSpanEnd(this);
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return functor.VisitBeamSpanEnd(this);
  }

  public override Clone(): BeamSpan {
    const clone = new BeamSpan();
    clone.AssignFrom(this);

    if (this.HasBeamWith()) clone.SetBeamWith(this.GetBeamWith());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    if (this.HasSlash()) clone.SetSlash(this.GetSlash());
    if (this.HasSlope()) clone.SetSlope(this.GetSlope());

    if (this.HasStartid()) clone.SetStartid(this.GetStartid());
    if (this.HasEndid()) clone.SetEndid(this.GetEndid());
    if (this.HasTstamp()) clone.SetTstamp(this.GetTstamp());
    if (this.HasTstamp2()) clone.SetTstamp2(this.GetTstamp2());
    if (this.HasStaff()) clone.SetStaff(this.GetStaff());

    clone.SetBeamedElements([...this.GetBeamedElements()]);

    return clone;
  }
}

ObjectFactory.GetInstance().Register('beamSpan', ClassId.BEAMSPAN, () => new BeamSpan());

// C++ BeamSpan derives from BeamDrawingInterface (multiple inheritance).
mixinBeamDrawingInterface(BeamSpan.prototype as unknown as object);

export type { VrvObject };
