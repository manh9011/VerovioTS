/**
 * Pure TypeScript translation of Verovio's `src/pitchinflection.cpp` / `include/vrv/pitchinflection.h`.
 *
 * `PitchInflection` models the MEI `<pitchInflection>` element.
 *
 * C++ multiple inheritance (ControlElement + TimeSpanningInterface) is represented
 * through explicit composition with forwarding surface.
 */
import { ClassId, FunctorCode, data_MEASUREBEAT } from './vrvdef.js';
import { ControlElement } from './controlelement.js';
import { TimeSpanningInterface } from './timeinterface.js';
import { ObjectFactory } from './object.js';

/** Pure-TypeScript translation of Verovio's `PitchInflection` element. */
export class PitchInflection extends ControlElement {
  private timeSpanningInterface!: TimeSpanningInterface;

  public constructor() {
    super(ClassId.PITCHINFLECTION);
    this.timeSpanningInterface = new TimeSpanningInterface();

    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.timeSpanningInterface.Reset();
  }

  public override GetClassName(): string {
    return 'pitchInflection';
  }

  public override GetTimePointInterface(): any {
    return this.timeSpanningInterface;
  }

  public override GetTimeSpanningInterface(): TimeSpanningInterface {
    return this.timeSpanningInterface;
  }

  // TimeSpanningInterface forwarding.
  public SetStartid(value: string): void { this.timeSpanningInterface.SetStartid(value); }
  public GetStartid(): string { return this.timeSpanningInterface.GetStartid(); }
  public HasStartid(): boolean { return this.timeSpanningInterface.HasStartid(); }
  public SetEndid(value: string): void { this.timeSpanningInterface.SetEndid(value); }
  public GetEndid(): string { return this.timeSpanningInterface.GetEndid(); }
  public HasEndid(): boolean { return this.timeSpanningInterface.HasEndid(); }
  public SetStaff(value: number[]): void { this.timeSpanningInterface.SetStaff(value); }
  public GetStaff(): number[] { return this.timeSpanningInterface.GetStaff(); }
  public HasStaff(): boolean { return this.timeSpanningInterface.HasStaff(); }
  public SetTstamp(value: number): void { this.timeSpanningInterface.SetTstamp(value); }
  public GetTstamp(): number { return this.timeSpanningInterface.GetTstamp(); }
  public HasTstamp(): boolean { return this.timeSpanningInterface.HasTstamp(); }
  public SetTstamp2(value: data_MEASUREBEAT): void { this.timeSpanningInterface.SetTstamp2(value); }
  public GetTstamp2(): data_MEASUREBEAT { return this.timeSpanningInterface.GetTstamp2(); }
  public HasTstamp2(): boolean { return this.timeSpanningInterface.HasTstamp2(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPitchInflection');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPitchInflection');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPitchInflectionEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitPitchInflectionEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitControlElement === 'function') return functor.VisitControlElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): PitchInflection {
    const clone = new PitchInflection();
    clone.AssignFrom(this);
    if (this.timeSpanningInterface.HasStartid()) clone.SetStartid(this.GetStartid());
    if (this.timeSpanningInterface.HasEndid()) clone.SetEndid(this.GetEndid());
    if (this.timeSpanningInterface.HasTstamp()) clone.SetTstamp(this.GetTstamp());
    if (this.timeSpanningInterface.HasTstamp2()) clone.SetTstamp2(this.GetTstamp2());
    if (this.timeSpanningInterface.HasStaff()) clone.SetStaff(this.GetStaff());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('pitchInflection', ClassId.PITCHINFLECTION, () => new PitchInflection());
