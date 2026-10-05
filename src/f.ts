/**
 * Pure TypeScript translation of Verovio's `src/f.cpp` / `include/vrv/f.h`.
 *
 * `F` models the MEI `<f>` (figure) element in figured bass.
 * C++ multiple inheritance (TextElement + TimeSpanningInterface + AttExtender)
 * is represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { ObjectFactory, VrvObject } from './object.js';
import { TextElement } from './textelement.js';
import { TimePointInterface, TimeSpanningInterface } from './timeinterface.js';
import { InstExtender } from './atts_shared.js';

// Canonical libmei att-class ordinals (libmei/dist/attclasses.h).
const ATT_EXTENDER = 132;

/** Pure TypeScript translation of Verovio's `F` (figure) element. */
export class F extends TextElement {
  private timeSpanningInterface: TimeSpanningInterface | null = null;
  private attExtender: InstExtender | null = null;

  public constructor() {
    super(ClassId.FIGURE);
    this.timeSpanningInterface = new TimeSpanningInterface();
    this.attExtender = new InstExtender();

    this.RegisterInterface(this.timeSpanningInterface.GetAttClasses(), this.timeSpanningInterface.IsInterface());
    this.RegisterAttClass(ATT_EXTENDER);

    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    this.attExtender ??= new InstExtender();

    this.timeSpanningInterface.Reset();
    this.attExtender.ResetExtender();
  }

  public override GetClassName(): string {
    return 'f';
  }

  // Getter to interfaces.
  public GetTimePointInterface(): TimePointInterface {
    return this.GetTimeSpanningInterface();
  }

  public GetTimeSpanningInterface(): TimeSpanningInterface {
    this.timeSpanningInterface ??= new TimeSpanningInterface();
    return this.timeSpanningInterface;
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    if (classId === ClassId.TEXT) {
      return true;
    } else if (VrvObject.IsEditorialElement(classId)) {
      return true;
    }
    return false;
  }

  // TimeSpanningInterface forwarding.
  public GetStart(): unknown { return this.GetTimeSpanningInterface().GetStart(); }
  public SetStart(start: any): void { this.GetTimeSpanningInterface().SetStart(start); }
  public GetEnd(): unknown { return this.GetTimeSpanningInterface().GetEnd(); }
  public SetEnd(end: any): void { this.GetTimeSpanningInterface().SetEnd(end); }
  public SetStartid(startid: string): void { this.GetTimeSpanningInterface().SetStartid(startid); }
  public GetStartid(): string { return this.GetTimeSpanningInterface().GetStartid(); }
  public HasStartid(): boolean { return this.GetTimeSpanningInterface().HasStartid(); }
  public SetEndid(endid: string): void { this.GetTimeSpanningInterface().SetEndid(endid); }
  public GetEndid(): string { return this.GetTimeSpanningInterface().GetEndid(); }
  public HasEndid(): boolean { return this.GetTimeSpanningInterface().HasEndid(); }
  public SetTstamp(tstamp: any): void { this.GetTimeSpanningInterface().SetTstamp(tstamp); }
  public GetTstamp(): any { return this.GetTimeSpanningInterface().GetTstamp(); }
  public HasTstamp(): boolean { return this.GetTimeSpanningInterface().HasTstamp(); }
  public SetTstamp2(tstamp2: any): void { this.GetTimeSpanningInterface().SetTstamp2(tstamp2); }
  public GetTstamp2(): any { return this.GetTimeSpanningInterface().GetTstamp2(); }
  public HasTstamp2(): boolean { return this.GetTimeSpanningInterface().HasTstamp2(); }

  // AttExtender forwarding.
  public SetExtender(extender: any): void { this.attExtender!.SetExtender(extender); }
  public GetExtender(): any { return this.attExtender!.GetExtender(); }
  public HasExtender(): boolean { return this.attExtender!.HasExtender(); }
  public ResetExtender(): void { this.attExtender!.ResetExtender(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitF');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitF');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitFEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    return functor.VisitObject(this);
  }

  public override Clone(): F {
    const clone = new F();
    clone.AssignFrom(this);
    const ts = this.GetTimeSpanningInterface();
    const cts = clone.GetTimeSpanningInterface();
    if (ts.HasStartid()) cts.SetStartid(ts.GetStartid());
    if (ts.HasEndid()) cts.SetEndid(ts.GetEndid());
    if (ts.HasTstamp()) cts.SetTstamp(ts.GetTstamp());
    if (ts.HasTstamp2()) cts.SetTstamp2(ts.GetTstamp2());
    if (this.HasExtender()) clone.SetExtender(this.GetExtender());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('f', ClassId.FIGURE, () => new F());
