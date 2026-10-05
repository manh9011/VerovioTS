import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory } from './object.js';
import { ControlElement } from './controlelement.js';
import { TimePointInterface } from './timeinterface.js';
import { StaffRel } from './textdirinterface.js';

const ATT_PLACEMENTRELSTAFF = 186;

/**
 * AttPlacementRelStaff attribute state for Breath (from libmei atts_cmn).
 * C++ inherits AttPlacementRelStaff directly; TS uses composition with the
 * same public surface.
 */
export class BreathPlacementRelStaff {
  private m_place = StaffRel.NONE;
  ResetPlacementRelStaff(): void { this.m_place = StaffRel.NONE; }
  SetPlace(v: StaffRel): void { this.m_place = v; }
  GetPlace(): StaffRel { return this.m_place; }
  HasPlace(): boolean { return this.m_place !== StaffRel.NONE; }
}

/** Pure TypeScript translation of Verovio's src/breath.cpp / include/vrv/breath.h. */
export class Breath extends ControlElement {
  private timePointInterface: TimePointInterface | null = null;
  private placementRelStaff: BreathPlacementRelStaff | null = null;

  public constructor() {
    super(ClassId.BREATH);
    this.timePointInterface = new TimePointInterface();
    this.placementRelStaff = new BreathPlacementRelStaff();
    this.RegisterInterface(this.timePointInterface.GetAttClasses(), this.timePointInterface.IsInterface());
    this.RegisterAttClass(ATT_PLACEMENTRELSTAFF);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timePointInterface ??= new TimePointInterface();
    this.placementRelStaff ??= new BreathPlacementRelStaff();
    this.timePointInterface.Reset();
    this.placementRelStaff.ResetPlacementRelStaff();
  }

  public override GetClassName(): string { return 'breath'; }

  public GetTimePointInterface(): TimePointInterface {
    this.timePointInterface ??= new TimePointInterface();
    return this.timePointInterface;
  }
  public SetStaff(v: number[]): void { this.GetTimePointInterface().SetStaff(v); }
  public GetStaff(): number[] { return this.GetTimePointInterface().GetStaff(); }
  public HasStaff(): boolean { return this.GetTimePointInterface().HasStaff(); }
  public SetStartid(v: string): void { this.GetTimePointInterface().SetStartid(v); }
  public SetTstamp(v: number): void { this.GetTimePointInterface().SetTstamp(v); }
  // C++ Breath : TimePointInterface full forwarders (view_control.cpp:1673 uses GetStart/GetTstampStaves).
  public GetStartid(): string { return this.GetTimePointInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimePointInterface().HasStartid(); }
  public GetTstamp(): number { return this.GetTimePointInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimePointInterface().HasTstamp(); }
  public SetStart(v: unknown): void { this.GetTimePointInterface().SetStart(v as never); }
  public GetStart(): unknown { return this.GetTimePointInterface().GetStart(); }
  public HasStart(): boolean { return this.GetTimePointInterface().HasStart(); }
  public GetTstampStaves(measure: unknown, object: unknown): unknown[] { return this.GetTimePointInterface().GetTstampStaves(measure as never, object as never); }

  // AttPlacementRelStaff forwarding
  public SetPlace(v: StaffRel): void { this.placementRelStaff!.SetPlace(v); }
  public GetPlace(): StaffRel { return this.placementRelStaff!.GetPlace(); }
  public HasPlace(): boolean { return this.placementRelStaff!.HasPlace(); }
  public ResetPlacementRelStaff(): void { this.placementRelStaff!.ResetPlacementRelStaff(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBreath');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBreath');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBreathEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitBreathEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): Breath {
    const clone = new Breath();
    clone.AssignFrom(this);
    // C++ copy-constructor copies all interface/attribute members.
    const tp = this.GetTimePointInterface();
    const ctp = clone.GetTimePointInterface();
    if (tp.HasPart()) ctp.SetPart(tp.GetPart());
    if (tp.HasStaff()) ctp.SetStaff(tp.GetStaff());
    if (tp.HasStartid()) ctp.SetStartid(tp.GetStartid());
    if (tp.HasTstamp()) ctp.SetTstamp(tp.GetTstamp());
    clone.SetPlace(this.GetPlace());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('breath', ClassId.BREATH, () => new Breath());
