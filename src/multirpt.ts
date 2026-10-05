/**
 * Pure TypeScript translation of Verovio's `src/multirpt.cpp` / `include/vrv/multirpt.h`.
 *
 * `MultiRpt` models the MEI `<multiRpt>` (multiple repeat) element.
 *
 * C++ multiple inheritance (LayerElement + AttNumbered) is represented
 * through explicit composition with forwarding surfaces.
 */
import { ClassId, FunctorCode } from './vrvdef.js';
import { LayerElement } from './layerelement.js';
import { InstNumbered } from './atts_cmn.js';
import { ObjectFactory } from './object.js';

const ATT_NUMBERED = 29;

/** Pure-TypeScript translation of Verovio's `MultiRpt` element. */
export class MultiRpt extends LayerElement {
  private numbered!: InstNumbered;

  public constructor() {
    super(ClassId.MULTIRPT);
    this.numbered = new InstNumbered();
    this.RegisterAttClass(ATT_NUMBERED);
    this.Reset();
  }

  public override Reset(): void {
    super.Reset();
    this.numbered ??= new InstNumbered();
    this.numbered.ResetNumbered();
  }

  public override GetClassName(): string {
    return 'multiRpt';
  }

  // AttNumbered forwarding.
  public SetNum(value: any): void { this.numbered.SetNum(value); }
  public GetNum(): any { return this.numbered.GetNum(); }
  public HasNum(): boolean { return this.numbered.HasNum(); }
  public ResetNumbered(): void { this.numbered.ResetNumbered(); }

  public override Accept(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMultiRpt');
  }

  public AcceptConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMultiRpt');
  }

  public override AcceptEnd(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMultiRptEnd');
  }

  public AcceptEndConst(functor: any): FunctorCode {
    return this.visit(functor, 'VisitMultiRptEnd');
  }

  private visit(functor: any, method: string): FunctorCode {
    if (typeof functor[method] === 'function') return functor[method](this);
    if (typeof functor.VisitLayerElement === 'function') return functor.VisitLayerElement(this);
    return functor.VisitObject(this);
  }

  public override Clone(): MultiRpt {
    const clone = new MultiRpt();
    clone.AssignFrom(this);
    if (this.HasNum()) clone.SetNum(this.GetNum());
    return clone;
  }
}

ObjectFactory.GetInstance().Register('multiRpt', ClassId.MULTIRPT, () => new MultiRpt());
