/**
 * Pure TypeScript translation of Verovio's `src/pgfoot.cpp` / `include/vrv/pgfoot.h`.
 */
import { RunningElement } from './runningelement.js';
import { VrvObject, ObjectFactory } from './object.js';
import { ClassId, FunctorCode } from './vrvdef.js';

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

/** Structural `Doc` contract consumed by `GetTotalHeight`. */
export interface PgFootDocLike {
  GetDrawingUnit(staffSize: number): number;
  GetOptions(): { m_topMarginPgFooter: { getValue(): number } };
}

export class PgFoot extends RunningElement {
  public constructor() {
    super(ClassId.PGFOOT);
    this.Reset();
    ObjectFactory.GetInstance().Register('pgFoot', ClassId.PGFOOT, () => new PgFoot());
  }

  public override Reset(): void {
    super.Reset();
  }

  public override GetClassName(): string { return 'pgFoot'; }

  public override GetTotalHeight(doc: unknown): number {
    // C++: assert(doc);
    if (!doc) throw new Error('PgFoot::GetTotalHeight requires a document.');
    const d = doc as PgFootDocLike;
    let height = this.GetContentHeight();
    if (height > 0) {
      const unit = d.GetDrawingUnit(100);
      height += d.GetOptions().m_topMarginPgFooter.getValue() * unit;
    }
    return height;
  }

  public override Accept(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgFoot', this);
  }
  public AcceptConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgFoot', this);
  }
  public override AcceptEnd(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgFootEnd', this);
  }
  public AcceptEndConst(functor: unknown): FunctorCode {
    return visit(functor, 'VisitPgFootEnd', this);
  }
}
