/**
 * Pure TypeScript translation of Verovio's `src/halfmrpt.cpp` / `include/vrv/halfmrpt.h`.
 *
 * `HalfmRpt` models the MEI `<halfmRpt>` element.
 *
 * C++ multiple inheritance (LayerElement + OffsetInterface + AttColor) is
 * represented through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { OffsetInterface } from './offsetinterface.js';
import { InstColor } from './atts_shared.js';
import { ObjectFactory } from './object.js';

const ATT_COLOR = 109;

/** Pure-TypeScript translation of Verovio's `HalfmRpt` element. */
export class HalfmRpt extends LayerElement {
  private offsetInterface!: OffsetInterface;
  private color!: InstColor;

  public constructor() {
    super(ClassId.HALFMRPT);
    this.offsetInterface = new OffsetInterface();
    this.color = new InstColor();
    this.RegisterInterface(this.offsetInterface.GetAttClasses(), this.offsetInterface.IsInterface());
    this.RegisterAttClass(ATT_COLOR);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.offsetInterface ??= new OffsetInterface();
    this.color ??= new InstColor();
    this.offsetInterface.Reset();
    this.color.ResetColor();
  }

  public override GetClassName(): string {
    return 'halfmRpt';
  }

  public override GetOffsetInterface(): OffsetInterface {
    return this.offsetInterface;
  }

  public override HasToBeAligned(): boolean {
    return true;
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  // OffsetInterface forwarding.
  public SetHo(ho: number): void { this.offsetInterface.SetHo(ho); }
  public GetHo(): number { return this.offsetInterface.GetHo(); }
  public HasHo(): boolean { return this.offsetInterface.HasHo(); }
  public SetVo(vo: number): void { this.offsetInterface.SetVo(vo); }
  public GetVo(): number { return this.offsetInterface.GetVo(); }
  public HasVo(): boolean { return this.offsetInterface.HasVo(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHalfmRpt');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHalfmRpt');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHalfmRptEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitHalfmRptEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): HalfmRpt {
    const clone = new HalfmRpt();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    if (this.HasHo()) clone.SetHo(this.GetHo());
    if (this.HasVo()) clone.SetVo(this.GetVo());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('halfmRpt', ClassId.HALFMRPT, () => new HalfmRpt());
