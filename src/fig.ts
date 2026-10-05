/**
 * Pure TypeScript translation of Verovio's `src/fig.cpp` / `include/vrv/fig.h`.
 *
 * C++ multiple inheritance (TextElement + AreaPosInterface) is represented
 * through a composed AreaPosInterface component with a forwarding surface.
 */
import { TextElement } from './textelement.js';
import { AreaPosInterface } from './areaposinterface.js';
import { ClassId, FunctorCode } from './vrvdef.js';
import { VrvObject, ObjectFactory } from './object.js';

function visit(functor: unknown, method: string, self: unknown): FunctorCode {
  const fn = (functor as Record<string, unknown>)[method];
  if (typeof fn !== 'function') {
    // C++ FunctorInterface forwards unknown Visit* defaults to VisitObject;
    // structural test functors expose only VisitObject.
    const fallback = (functor as Record<string, unknown>)['VisitObject'];
    if (typeof fallback === 'function') return (fallback as (value: unknown) => FunctorCode).call(functor, self);
    return FunctorCode.FUNCTOR_CONTINUE;
  }
  return (fn as (value: unknown) => FunctorCode).call(functor, self);
}

export class Fig extends TextElement {
  private areaPosInterface?: AreaPosInterface;

  public constructor() {
    super(ClassId.FIG);
    this.areaPosInterface = new AreaPosInterface();
    this.RegisterInterface(this.areaPosInterface.GetAttClasses(), this.areaPosInterface.IsInterface());
    this.Reset();
    ObjectFactory.GetInstance().Register('fig', ClassId.FIG, () => new Fig());
  }

  public override Reset(): void {
    super.Reset();
    this.areaPosInterface?.Reset();
  }

  public override Clone(): VrvObject {
    const clone = new Fig();
    clone.AssignFrom(this as unknown as VrvObject);
    // Interface state is not carried by AssignFrom; copy explicitly.
    clone.SetHalign(this.GetHalign());
    clone.SetValign(this.GetValign());
    return clone;
  }

  public override GetClassName(): string { return 'fig'; }

  public override IsSupportedChild(classId: ClassId): boolean {
    return classId === ClassId.SVG;
  }

  public GetAreaPosInterface(): AreaPosInterface { return this.areaPosInterface!; }

  // AreaPosInterface forwarding surface (C++ multiple inheritance).
  public SetHalign(value: number): void { this.areaPosInterface!.SetHalign(value); }
  public GetHalign(): number { return this.areaPosInterface!.GetHalign(); }
  public HasHalign(): boolean { return this.areaPosInterface!.HasHalign(); }
  public SetValign(value: number): void { this.areaPosInterface!.SetValign(value); }
  public GetValign(): number { return this.areaPosInterface!.GetValign(); }
  public HasValign(): boolean { return this.areaPosInterface!.HasValign(); }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitFig', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitFig', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitFigEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitFigEnd', this);
  }
}
