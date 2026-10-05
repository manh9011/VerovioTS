/**
 * Pure TypeScript translation of Verovio's `src/mrpt2.cpp` / `include/vrv/mrpt2.h`.
 *
 * `MRpt2` models the MEI `<mRpt2>` (2-measure repeat) element.
 *
 * C++ multiple inheritance (LayerElement + AttColor) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { InstColor } from './atts_shared.js';
import { ObjectFactory } from './object.js';

const ATT_COLOR = 109;

/** Pure-TypeScript translation of Verovio's `MRpt2` element. */
export class MRpt2 extends LayerElement {
  private color!: InstColor;

  public constructor() {
    super(ClassId.MRPT2);
    this.color = new InstColor();
    this.RegisterAttClass(ATT_COLOR);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.color ??= new InstColor();
    this.color.ResetColor();
  }

  public override GetClassName(): string {
    return 'mRpt2';
  }

  // AttColor forwarding.
  public SetColor(value: any): void { this.color.SetColor(value); }
  public GetColor(): any { return this.color.GetColor(); }
  public HasColor(): boolean { return this.color.HasColor(); }
  public ResetColor(): void { this.color.ResetColor(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRpt2');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRpt2');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRpt2End');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMRpt2End');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): MRpt2 {
    const clone = new MRpt2();
    clone.AssignFrom(this);
    if (this.HasColor()) clone.SetColor(this.GetColor());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('mRpt2', ClassId.MRPT2, () => new MRpt2());
