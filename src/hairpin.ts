import { ClassId, FunctorCode, SpanningType, UNLIMITED_DEPTH, BACKWARD } from './vrvdef.js';
import { ClassIdComparison } from './comparison.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { OffsetSpanningInterface } from './offsetinterface.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { InstLineRendBase, InstPlacementRelStaff, InstVerticalGroup } from './atts_shared.js';
import { InstHairpinLog } from './atts_cmn.js';
import { InstHairpinVis } from './atts_visual.js';
import { StaffRel } from './textdirinterface.js';
import { MEASUREMENTTYPE_px } from './graphic.js';

// Canonical libmei enum ordinals from libmei/dist/atttypes.h.
const hairpinLog_FORM_cres = 1;
const hairpinLog_FORM_dim = 2;

// Canonical libmei att-class ordinals used by the C++ RegisterAttClass calls.
const ATT_HAIRPINLOG = 23;
const ATT_HAIRPINVIS = 261;
const ATT_LINERENDBASE = 151;
const ATT_PLACEMENTRELSTAFF = 186;
const ATT_VERTICALGROUP = 227;

const M_PI = Math.PI;

/** Doc contract consumed by Hairpin::CalcHeight; matches canonical doc.ts members. */
export interface HairpinDocLike {
  GetDrawingHairpinSize(staffSize: number, withMargin: boolean): number;
  GetDrawingUnit(staffSize: number): number;
}

/** BarLine contract consumed by Hairpin::GetBarlineOverlapAdjustment. */
export interface HairpinBarLineLike {
  GetDrawingX(): number;
  GetForm(): number;
}

/** Measure contract consumed by Hairpin::GetBarlineOverlapAdjustment. */
export interface HairpinMeasureLike {
  GetLeftBarLine(): HairpinBarLineLike | null;
  GetRightBarLine(): HairpinBarLineLike | null;
}

/** FloatingPositioner contract consumed by Hairpin::CalcHeight. */
export interface HairpinPositionerLike {
  GetSpanningType(): SpanningType;
}

/** ControlElement link contract used by SetLeftLink/SetRightLink. */
export interface HairpinLinkLike {
  Is(id: number): boolean;
  GetDrawingGrpId(): number;
  SetDrawingGrpId(id: number): void;
  SetDrawingGrpObject(o: unknown): number;
  GetForm?(): number;
  GetDrawingLength?(): number;
}

/**
 * Pure TypeScript translation of Verovio's src/hairpin.cpp / include/vrv/hairpin.h.
 * The left/right links are non-owning references (C++ ControlElement*); ownership stays
 * with the document tree. GetBarlineOverlapAdjustment matches the structural
 * Measure/BarLine/System contracts of the not-yet-migrated layout tree.
 */
export class Hairpin extends ControlElement {
  private offsetSpanningInterface: OffsetSpanningInterface | null = null;
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private hairpinLog: InstHairpinLog | null = null;
  private hairpinVis: InstHairpinVis | null = null;
  private lineRendBase: InstLineRendBase | null = null;
  private placementRelStaff: InstPlacementRelStaff | null = null;
  private verticalGroup: InstVerticalGroup | null = null;

  /** A pointer to the possible left link of the Hairpin. Non-owning. */
  private m_leftLink: HairpinLinkLike | null = null;
  /** A pointer to the possible right link of the Hairpin. Non-owning. */
  private m_rightLink: HairpinLinkLike | null = null;
  /** The drawing length (uninterrupted) stored for matching height of linked hairpins */
  private m_drawingLength = 0;

  public constructor() {
    super(ClassId.HAIRPIN);
    this.offsetSpanningInterface = new OffsetSpanningInterface();
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.hairpinLog = new InstHairpinLog();
    this.hairpinVis = new InstHairpinVis();
    this.lineRendBase = new InstLineRendBase();
    this.placementRelStaff = new InstPlacementRelStaff();
    this.verticalGroup = new InstVerticalGroup();
    this.RegisterInterface(this.offsetSpanningInterface.GetAttClasses(), this.offsetSpanningInterface.IsInterface());
    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_HAIRPINLOG);
    this.RegisterAttClass(ATT_HAIRPINVIS);
    this.RegisterAttClass(ATT_LINERENDBASE);
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.RegisterAttClass(ATT_VERTICALGROUP);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetSpanningInterface ??= new OffsetSpanningInterface();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.hairpinLog ??= new InstHairpinLog();
    this.hairpinVis ??= new InstHairpinVis();
    this.lineRendBase ??= new InstLineRendBase();
    this.placementRelStaff ??= new InstPlacementRelStaff();
    this.verticalGroup ??= new InstVerticalGroup();
    this.offsetSpanningInterface.Reset();
    this.timeSpanningInterface.Reset();
    this.hairpinLog!.ResetHairpinLog();
    this.hairpinVis!.ResetHairpinVis();
    this.lineRendBase!.ResetLineRendBase();
    this.ResetPlacementRelStaff();
    this.verticalGroup!.ResetVerticalGroup();
    this.m_leftLink = null;
    this.m_rightLink = null;
    this.m_drawingLength = 0;
  }

  public override GetClassName(): string { return 'hairpin'; }

  public GetOffsetSpanningInterface(): OffsetSpanningInterface {
    this.offsetSpanningInterface ??= new OffsetSpanningInterface();
    return this.offsetSpanningInterface;
  }

  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  public SetTstamp(v: number): void { this.GetTimeSpanningInterface().SetTstamp(v); }
  public GetTstamp(): number { return this.GetTimeSpanningInterface().GetTstamp(); }
  public SetTstamp2(v: [number, number]): void { this.GetTimeSpanningInterface().SetTstamp2(v); }
  public SetStaff(v: number[]): void { this.GetTimeSpanningInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimeSpanningInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimeSpanningInterface().HasStaff(); }
  public SetStartid(v: string): void { this.GetTimeSpanningInterface().SetStartid(v); }
  public SetEndid(v: string): void { this.GetTimeSpanningInterface().SetEndid(v); }
  public HasEndid(): boolean { return this.GetTimeSpanningInterface().HasEndid(); }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  // Drawing length getter/setter/checker
  public GetDrawingLength(): number { return this.m_drawingLength; }
  public SetDrawingLength(length: number): void { this.m_drawingLength = length; }
  public HasDrawingLength(): boolean { return this.m_drawingLength > 0; }

  public CalcHeight(
    doc: HairpinDocLike | null,
    staffSize: number,
    spanningType: number,
    leftPositioner: HairpinPositionerLike | null,
    rightPositioner: HairpinPositionerLike | null,
  ): number {
    if (!doc) throw new Error('Hairpin::CalcHeight requires a document');

    let endY = doc.GetDrawingHairpinSize(staffSize, false);

    if (this.HasOpening()) {
      const opening = this.GetOpening();
      if (opening.GetType() === MEASUREMENTTYPE_px) {
        endY = opening.GetPx();
      }
      else {
        endY = opening.GetVu() * doc.GetDrawingUnit(staffSize);
      }
    }

    // Something is probably wrong before...
    if (!this.GetDrawingLength()) return endY;

    // Do not adjust height when not a full hairpin
    if (spanningType !== SpanningType.SPANNING_START_END) return endY;

    let length = this.GetDrawingLength();

    // Second of a <>
    if (this.GetForm() === hairpinLog_FORM_dim && this.m_leftLink && this.m_leftLink.Is(ClassId.HAIRPIN)) {
      // Don't adjust height when previous hairpin is not a full hairpin
      if (!leftPositioner || leftPositioner.GetSpanningType() !== SpanningType.SPANNING_START_END) return endY;
      // Take into account its length only if the left one is actually a <
      if (this.m_leftLink.GetForm?.() === hairpinLog_FORM_cres) {
        length = Math.max(length, this.m_leftLink.GetDrawingLength?.() ?? 0);
      }
    }

    // First of a <>
    if (this.GetForm() === hairpinLog_FORM_cres && this.m_rightLink && this.m_rightLink.Is(ClassId.HAIRPIN)) {
      // Don't adjust height when next hairpin is not a full hairpin
      if (!rightPositioner || rightPositioner.GetSpanningType() !== SpanningType.SPANNING_START_END) return endY;
      // Take into account its length only if the right one is actually a >
      if (this.m_rightLink.GetForm?.() === hairpinLog_FORM_dim) {
        length = Math.max(length, this.m_rightLink.GetDrawingLength?.() ?? 0);
      }
    }

    // Something wrong..
    if (length <= 0) return endY;

    /************** cap the angle of hairpins **************/

    // Given height and width, calculate hairpin angle
    let theta = 2.0 * Math.atan((endY / 2.0) / length);
    // Convert to Radians
    theta *= (360.0 / (2.0 * M_PI));
    // If the angle is too big, restrict endY
    if (theta > 16) {
      theta = 16;
      // C++ assigns to `int endY`, truncating the double result.
      endY = Math.trunc(2 * length * Math.tan((M_PI / 360) * theta));
    }

    return endY;
  }

  public SetLeftLink(leftLink: HairpinLinkLike | null): void {
    this.m_leftLink = leftLink;
    if (!leftLink) return;

    if (this.GetDrawingGrpId() !== 0) {
      // LogDebug("Grp id LF already set %d", this->GetDrawingGrpId());
      return;
    }

    let grpId = leftLink.GetDrawingGrpId();
    if (grpId === 0) {
      grpId = leftLink.SetDrawingGrpObject(leftLink);
    }
    this.SetDrawingGrpId(grpId);
  }

  public GetLeftLink(): HairpinLinkLike | null { return this.m_leftLink; }

  public SetRightLink(rightLink: HairpinLinkLike | null): void {
    this.m_rightLink = rightLink;
    if (!rightLink) return;

    let grpId = this.GetDrawingGrpId();
    if (grpId === 0) {
      grpId = this.SetDrawingGrpObject(this);
    }

    if (rightLink.GetDrawingGrpId() !== 0) {
      // LogDebug("Grp id RL already set %d", rightLink->GetDrawingGrpId());
      return;
    }
    rightLink.SetDrawingGrpId(grpId);
  }

  public GetRightLink(): HairpinLinkLike | null { return this.m_rightLink; }

  /**
   * Get left/right adjustments that need to be done to the hairpin with set coordinates
   * (leftX, rightX) for it not to overlap with parent measure's barlines.
   */
  public GetBarlineOverlapAdjustment(
    doubleUnit: number,
    leftX: number,
    rightX: number,
    spanningType: number,
    barRendition?: { rptstart: number; rptend: number; end: number },
  ): [number, number] {
    const start = this.GetTimeSpanningInterface().GetStart();
    const end = this.GetTimeSpanningInterface().GetEnd();
    const startMeasure = start?.GetFirstAncestor(ClassId.MEASURE) as HairpinMeasureLike | null | undefined;
    const endMeasure = end?.GetFirstAncestor(ClassId.MEASURE) as HairpinMeasureLike | null | undefined;
    // Canonical libmei ordinals (atttypes.h data_BARRENDITION): rptstart=11, rptend=13, end=8.
    // The old fallback {rptstart:4, rptend:5, end:3} missed light-heavy (end) barlines,
    // skipping the 1.5x margin and shifting hairpin tips by unit/2 (pass-510, 31b).
    const renditions = barRendition ?? { rptstart: 11, rptend: 13, end: 8 };

    if (!startMeasure || !endMeasure) return [0, 0];

    // Calculate adjustment that needs to be made for hairpin not to touch the left barline.
    // We take doubleUnit for the default margin to consider them overlapping, which is
    // adjusted in case we have wider barline on the left
    let leftAdjustment = 0;
    const leftBarline = startMeasure.GetLeftBarLine();
    if (leftBarline && (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_START)) {
      let margin = doubleUnit;
      const leftBarlineX = leftBarline.GetDrawingX();
      const diff = leftX - leftBarlineX;
      if (leftBarline.GetForm() === renditions.rptstart) margin *= 1.5;
      if (diff < margin) leftAdjustment = margin - diff;
    }

    // Similar calculation is done for the right barline, with it having two barline forms
    // that we need to consider as opposed to only one for the left barline. Additionally,
    // when we have spanning hairpins, correct barline should be selected - when processing
    // start of the spanning hairpin, we should check for the last measure of the current
    // system, instead of the endMeasure
    let rightAdjustment = 0;
    let rightBarline: HairpinBarLineLike | null = null;
    if (spanningType === SpanningType.SPANNING_START_END || spanningType === SpanningType.SPANNING_END) {
      rightBarline = endMeasure.GetRightBarLine();
    }
    else if (spanningType === SpanningType.SPANNING_START) {
      const startSystem = start!.GetFirstAncestor(ClassId.SYSTEM) as
        | { FindDescendantByComparison(comparison: unknown, depth: number, direction: boolean): unknown } | null | undefined;
      if (startSystem) {
        const measure = startSystem.FindDescendantByComparison(new ClassIdComparison(ClassId.MEASURE), UNLIMITED_DEPTH, BACKWARD) as HairpinMeasureLike | null;
        if (measure) rightBarline = measure.GetRightBarLine();
      }
    }
    if (rightBarline) {
      let margin = doubleUnit;
      const rightBarlineX = rightBarline.GetDrawingX();
      const diff = rightBarlineX - rightX;
      if (rightBarline.GetForm() === renditions.rptend || rightBarline.GetForm() === renditions.end) {
        margin *= 1.5;
      }
      if (diff < margin) rightAdjustment = margin - diff;
    }

    return [leftAdjustment, rightAdjustment];
  }

  // AttHairpinLog forwarding
  public SetForm(v: number): void { this.hairpinLog!.SetForm(v); }
  public GetForm(): number { return this.hairpinLog!.GetForm(); }
  public HasForm(): boolean { return this.hairpinLog!.HasForm(); }
  public SetNiente(v: number): void { this.hairpinLog!.SetNiente(v); }
  public GetNiente(): number { return this.hairpinLog!.GetNiente(); }
  public HasNiente(): boolean { return this.hairpinLog!.HasNiente(); }
  public ResetHairpinLog(): void { this.hairpinLog!.ResetHairpinLog(); }

  // AttHairpinVis forwarding
  public SetOpening(v: { GetType(): number; GetPx(): number; GetVu(): number }): void { this.hairpinVis!.SetOpening(v as never); }
  public GetOpening(): { GetType(): number; GetPx(): number; GetVu(): number } { return this.hairpinVis!.GetOpening() as never; }
  public HasOpening(): boolean { return this.hairpinVis!.HasOpening(); }
  public SetClosed(v: number): void { this.hairpinVis!.SetClosed(v); }
  public GetClosed(): number { return this.hairpinVis!.GetClosed(); }
  public HasClosed(): boolean { return this.hairpinVis!.HasClosed(); }
  public SetOpeningVertical(v: number): void { this.hairpinVis!.SetOpeningVertical(v); }
  public GetOpeningVertical(): number { return this.hairpinVis!.GetOpeningVertical(); }
  public HasOpeningVertical(): boolean { return this.hairpinVis!.HasOpeningVertical(); }
  public SetAngleOptimize(v: number): void { this.hairpinVis!.SetAngleOptimize(v); }
  public GetAngleOptimize(): number { return this.hairpinVis!.GetAngleOptimize(); }
  public HasAngleOptimize(): boolean { return this.hairpinVis!.HasAngleOptimize(); }
  public ResetHairpinVis(): void { this.hairpinVis!.ResetHairpinVis(); }

  // AttLineRendBase forwarding
  public SetLform(v: number): void { this.lineRendBase!.SetLform(v); }
  public GetLform(): number { return this.lineRendBase!.GetLform(); }
  public HasLform(): boolean { return this.lineRendBase!.HasLform(); }
  public SetLwidth(v: { GetType(): number; GetPx(): number; GetVu(): number }): void { this.lineRendBase!.SetLwidth(v as never); }
  public GetLwidth(): { GetType(): number; GetPx(): number; GetVu(): number } { return this.lineRendBase!.GetLwidth() as never; }
  public HasLwidth(): boolean { return this.lineRendBase!.HasLwidth(); }
  public SetLsegs(v: number): void { this.lineRendBase!.SetLsegs(v); }
  public GetLsegs(): number { return this.lineRendBase!.GetLsegs(); }
  public HasLsegs(): boolean { return this.lineRendBase!.HasLsegs(); }
  public ResetLineRendBase(): void { this.lineRendBase!.ResetLineRendBase(); }

  // AttPlacementRelStaff forwarding
  public SetPlace(v: StaffRel): void { this.placementRelStaff!.SetPlace(v); }
  public GetPlace(): StaffRel { return this.placementRelStaff!.GetPlace(); }
  public HasPlace(): boolean { return this.placementRelStaff!.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.placementRelStaff!.ResetPlacementRelStaff(); }

  // AttVerticalGroup forwarding
  public SetVgrp(v: any): void { this.verticalGroup!.SetVgrp(v); }
  public GetVgrp(): string { return this.verticalGroup!.GetVgrp(); }
  public HasVgrp(): boolean { return this.verticalGroup!.HasVgrp(); }
  public ResetVerticalGroup(): void { this.verticalGroup!.ResetVerticalGroup(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHairpin');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHairpin');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHairpinEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHairpinEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Hairpin {
    const clone = new Hairpin();
    clone.AssignFrom(this);
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasPart()) cts.SetPart(ts.GetPart());
    if (ts.HasStaff()) cts.SetStaff(ts.GetStaff());
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    const os = this.GetOffsetSpanningInterface();
    const cos = clone.GetOffsetSpanningInterface();
    if (os.HasStartho()) cos.SetStartho(os.GetStartho());
    if (os.HasEndho()) cos.SetEndho(os.GetEndho());
    if (os.HasStartvo()) cos.SetStartvo(os.GetStartvo());
    if (os.HasEndvo()) cos.SetEndvo(os.GetEndvo());
    if (this.HasForm()) clone.SetForm(this.GetForm());
    if (this.HasNiente()) clone.SetNiente(this.GetNiente());
    if (this.HasOpening()) clone.SetOpening(this.GetOpening());
    if (this.HasClosed()) clone.SetClosed(this.GetClosed());
    if (this.HasOpeningVertical()) clone.SetOpeningVertical(this.GetOpeningVertical());
    if (this.HasLform()) clone.SetLform(this.GetLform());
    if (this.HasLwidth()) clone.SetLwidth(this.GetLwidth());
    if (this.HasLsegs()) clone.SetLsegs(this.GetLsegs());
    if (this.HasPlace()) clone.SetPlace(this.GetPlace());
    if (this.HasVgrp()) clone.SetVgrp(this.GetVgrp());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('hairpin', ClassId.HAIRPIN, () => new Hairpin());
