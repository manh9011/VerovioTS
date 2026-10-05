/**
 * Pure TypeScript translation of Verovio's `src/space.cpp` / `include/vrv/space.h`.
 *
 * `Space` models the MEI `<space>` element.
 *
 * C++ multiple inheritance (LayerElement + DurationInterface) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode, data_DURATION } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { DurationInterface } from './durationinterface.js';
import { ObjectFactory } from './object.js';

class FallbackRest extends LayerElement {
  private dur: data_DURATION = 0;
  private dots = 0;

  public constructor() {
    super(ClassId.REST);
  }

  public SetDur(d: data_DURATION): void { this.dur = d; }
  public GetDur(): data_DURATION { return this.dur; }
  public SetDots(d: number): void { this.dots = d; }
  public GetDots(): number { return this.dots; }

  public override Clone(): FallbackRest {
    const c = new FallbackRest();
    c.AssignFrom(this);
    c.SetDur(this.GetDur());
    c.SetDots(this.GetDots());
    return c;
  }
}

/** Pure-TypeScript translation of Verovio's `Space` element. */
export class Space extends LayerElement {
  private durationInterface!: DurationInterface;

  public constructor() {
    super(ClassId.SPACE);
    this.durationInterface = new DurationInterface();
    this.RegisterInterface(this.durationInterface.GetAttClasses(), this.durationInterface.IsInterface());
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.durationInterface ??= new DurationInterface();
    this.durationInterface.Reset();
  }

  public override GetClassName(): string {
    return 'space';
  }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.REST;
  }

  public override GetDurationInterface(): DurationInterface {
    return this.durationInterface;
  }

  /** Initialize display of space by generating an attribute rest child. */
  public InitShowSpace(): void {
    this.ClearChildren();
    let rest: any = null;
    const factory = ObjectFactory.GetInstance();
    if (factory.Has(ClassId.REST)) {
      rest = factory.Create(ClassId.REST);
    }
    if (!rest) {
      rest = new FallbackRest();
    }
    rest.IsAttribute(true);
    if (typeof rest.SetDur === 'function') rest.SetDur(this.GetDur());
    if (typeof rest.SetDots === 'function') rest.SetDots(this.GetDots());
    this.AddChild(rest);
  }

  // DurationInterface forwarding.
  public SetDur(dur: data_DURATION): void { this.durationInterface.SetDur(dur); }
  public GetDur(): data_DURATION { return this.durationInterface.GetDur(); }
  public HasDur(): boolean { return this.durationInterface.HasDur(); }
  public SetDots(dots: number): void { this.durationInterface.SetDots(dots); }
  public GetDots(): number { return this.durationInterface.GetDots(); }
  public HasDots(): boolean { return this.durationInterface.HasDots(); }
  public SetDurGes(durGes: data_DURATION): void { this.durationInterface.SetDurGes(durGes); }
  public SetDurPpq(durPpq: number): void { this.durationInterface.SetDurPpq(durPpq); }
  public SetStaff(v: number[]): void { this.durationInterface.SetStaff(v); }
  public GetStaff(): number[] { return this.durationInterface.GetStaff(); }
  public HasStaff(): boolean { return this.durationInterface.HasStaff(); }
  public GetDurGes(): data_DURATION { return this.durationInterface.GetDurGes(); }
  public HasDurGes(): boolean { return this.durationInterface.HasDurGes(); }
  public GetActualDur(): data_DURATION { return this.durationInterface.GetActualDur(); }
  public GetActualDurGes(): data_DURATION { return this.durationInterface.GetActualDurGes(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSpace');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSpace');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSpaceEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitSpaceEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): Space {
    const clone = new Space();
    clone.AssignFrom(this);
    if (this.HasDur()) clone.SetDur(this.GetDur());
    if (this.HasDots()) clone.SetDots(this.GetDots());
    if (this.HasDurGes()) clone.SetDurGes(this.GetDurGes());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('space', ClassId.SPACE, () => new Space());
