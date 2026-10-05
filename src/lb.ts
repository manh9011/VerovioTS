/**
 * Pure TypeScript translation of Verovio's `src/lb.cpp` / `include/vrv/lb.h`.
 *
 * Lb models a line break within text content.
 */
import { TextElement } from './textelement.js';
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

export class Lb extends TextElement {
  public constructor() {
    super(ClassId.LB);
    this.Reset();
  }

  // C++ Lb::Reset() only delegates to TextElement::Reset() (already run above).
  public override Reset(): void {
    super.Reset();
  }

  public override Clone(): VrvObject {
    const clone = new Lb();
    clone.AssignFrom(this as unknown as VrvObject);
    return clone;
  }

  public override GetClassName(): string { return 'lb'; }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitLb', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitLb', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitLbEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitLbEnd', this);
  }
}

// C++ `static const ClassRegistrar<Lb> s_factory("lb", LB);`
ObjectFactory.GetInstance().Register('lb', ClassId.LB, () => new Lb());

